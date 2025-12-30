
import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { UserProfile } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Admin: React.FC = () => {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [newEmail, setNewEmail] = useState('')
    const [newName, setNewName] = useState('')
    const [daysOfAccess, setDaysOfAccess] = useState(30)
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
    const { profile } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (profile?.role !== 'admin') {
            navigate('/dashboard')
        } else {
            fetchUsers()
        }
    }, [profile, navigate])

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newEmail) return

        try {
            const expirationDate = new Date()
            expirationDate.setDate(expirationDate.getDate() + Number(daysOfAccess))

            const { data, error } = await supabase
                .from('user_profiles')
                .insert([
                    {
                        email: newEmail,
                        name: newName,
                        expiration_date: expirationDate.toISOString()
                    }
                ])
                .select()

            if (error) throw error

            setUsers([data[0], ...users])
            setNewEmail('')
            setNewName('')
            alert('Usuário pré-cadastrado com sucesso!')
        } catch (error: any) {
            alert('Erro ao cadastrar usuário: ' + error.message)
        }
    }

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingUser) return

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({
                    name: editingUser.name,
                    email: editingUser.email,
                    role: editingUser.role,
                    expiration_date: editingUser.expiration_date
                })
                .eq('id', editingUser.id)

            if (error) throw error

            setUsers(users.map(u => u.id === editingUser.id ? editingUser : u))
            setEditingUser(null)
            alert('Usuário atualizado com sucesso!')
        } catch (error: any) {
            alert('Erro ao atualizar usuário: ' + error.message)
        }
    }

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este usuário?')) return;

        try {
            const { error } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', id)

            if (error) throw error
            setUsers(users.filter(u => u.id !== id))
        } catch (error: any) {
            alert('Erro ao remover usuário: ' + error.message)
        }
    }

    const updateExpiration = async (id: string, days: number) => {
        try {
            const profile = users.find(u => u.id === id);
            if (!profile) return;

            const baseDate = profile.expiration_date ? new Date(profile.expiration_date) : new Date();
            if (baseDate < new Date()) baseDate.setTime(new Date().getTime());

            baseDate.setDate(baseDate.getDate() + days)

            const { error } = await supabase
                .from('user_profiles')
                .update({ expiration_date: baseDate.toISOString() })
                .eq('id', id)

            if (error) throw error

            // Optimistic update
            setUsers(users.map(u => u.id === id ? { ...u, expiration_date: baseDate.toISOString() } : u))
        } catch (error: any) {
            alert('Erro ao atualizar validade: ' + error.message)
        }
    }

    const getDaysRemaining = (dateString: string | null) => {
        if (!dateString) return 'Indefinido'
        const expiration = new Date(dateString)
        const now = new Date()
        const diffTime = expiration.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        if (diffDays <= 0) return 'Expirado'
        return `${diffDays} dias`
    }

    if (loading) return <div className="p-8">Carregando painel...</div>

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Painel Administrativo</h1>
                <button onClick={() => navigate('/dashboard')} className="text-emerald-600 hover:underline">Voltar ao App</button>
            </div>

            {/* Add User Form */}
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-700">Adicionar Novo Acesso</h2>
                <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email do Usuário</label>
                        <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="usuario@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome (Opcional)</label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Nome do Cliente"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Dias de Acesso</label>
                        <input
                            type="number"
                            value={daysOfAccess}
                            onChange={(e) => setDaysOfAccess(Number(e.target.value))}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                            min="1"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Autorizar Acesso
                    </button>
                </form>
            </div>

            {/* User List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validade</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{user.name || 'Sem nome'}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {getDaysRemaining(user.expiration_date) === 'Expirado' ? (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                            Expirado
                                        </span>
                                    ) : (
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Ativo
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {getDaysRemaining(user.expiration_date)}
                                    <div className="text-xs text-gray-400">
                                        {user.expiration_date ? new Date(user.expiration_date).toLocaleDateString() : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => setEditingUser(user)} className="text-blue-600 hover:text-blue-900 mr-4">Editar</button>
                                    <button onClick={() => updateExpiration(user.id, 30)} className="text-indigo-600 hover:text-indigo-900 mr-4">Renovar (+30)</button>
                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">Remover</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Editar Usuário</h2>
                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo (Role)</label>
                                <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'admin' | 'user' })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Validade (Data)</label>
                                <input
                                    type="date"
                                    value={editingUser.expiration_date ? new Date(editingUser.expiration_date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setEditingUser({ ...editingUser, expiration_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Admin
