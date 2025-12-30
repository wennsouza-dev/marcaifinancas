import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900">
            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                                <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
                            </div>
                            <span className="text-xl font-bold text-gray-900">MarcAI Finanças</span>
                        </div>

                        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
                            {/* Links removed as requested */}
                        </div>

                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/auth')} className="text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors">
                                Entrar
                            </button>
                            <button onClick={() => navigate('/auth')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30">
                                Começar Grátis
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6">
                    Domine suas <span className="text-emerald-600">finanças</span> <br className="hidden md:block" />
                    com <span className="text-emerald-600">inteligência.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
                    A solução completa para controle financeiro pessoal e empresarial. Organize, planeje e cresça com a MarcAI.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-16">
                    <button onClick={() => navigate('/auth')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full text-lg font-bold transition-all shadow-xl shadow-emerald-600/30 hover:scale-105">
                        Começar Grátis
                    </button>
                    <button className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 px-8 py-4 rounded-full text-lg font-semibold transition-all hover:border-emerald-200 hover:text-emerald-700">
                        Saiba Mais
                    </button>
                </div>

                {/* Laptop Mockup Placeholder */}
                {/* Laptop Mockup / Feature Image */}
                <div className="relative w-full max-w-4xl mx-auto">
                    <div className="relative rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-900/5">
                        <img
                            src="/dashboard-preview.png"
                            alt="Dashboard Preview com Teste Grátis de 7 Dias"
                            className="w-full h-auto object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent pointer-events-none"></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Recursos Premium</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-4 mb-4">Por que escolher a MarcAI?</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">Ferramentas poderosas desenhadas para simplificar sua vida financeira do zero ao milhão.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon="playlist_add_check"
                            title="Simplicidade e Foco"
                            desc="Esqueça planilhas complexas. Nossa abordagem é focada na facilidade de uso para você começar a organizar seu dinheiro hoje mesmo."
                        />
                        <FeatureCard
                            icon="flash_on"
                            title="Registro Manual Rápido"
                            desc="Adicione seus gastos em segundos. Você tem controle total sobre cada entrada, sem surpresas de sincronizações automáticas."
                        />
                        <FeatureCard
                            icon="visibility"
                            title="Visão Clara"
                            desc="Entenda seus hábitos com gráficos simples e intuitivos. Saiba exatamente quanto você pode gastar no final do mês."
                        />
                        <FeatureCard
                            icon="thumb_up"
                            title="Fácil de Começar"
                            desc="Interface amigável e direta ao ponto. Sem configurações difíceis, apenas o essencial para suas finanças pessoais."
                        />
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">O que nossos usuários dizem</h2>
                    <p className="text-gray-600 mb-12">Junte-se a mais de 10.000 pessoas que organizaram suas vidas.</p>

                    <div className="grid md:grid-cols-3 gap-8">
                        <TestimonialCard
                            name="Ana Silva"
                            role="Empresária"
                            text="MarcAI mudou a forma como organizo meu imposto de renda. Simples e rápido! A interface é muito limpa e intuitiva."
                            stars={5}
                        />
                        <TestimonialCard
                            name="Carlos Souza"
                            role="Freelancer"
                            text="A melhor ferramenta para controle de gastos pessoais que já usei. O suporte também é excelente e super ágil."
                            stars={5}
                        />
                        <TestimonialCard
                            name="Mariana Costa"
                            role="MEI"
                            text="Interface limpa e relatórios precisos. Recomendo para todo microempreendedor que quer levar suas finanças a sério."
                            stars={5}
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#1a2e1d] text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-12">
                    <div className="col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <span className="material-symbols-outlined text-2xl text-emerald-400">account_balance_wallet</span>
                            <span className="text-2xl font-bold">MarcAI Finanças</span>
                        </div>
                        <p className="text-gray-400 max-w-xs mb-6">
                            Sua plataforma completa para gestão financeira. Controle seus gastos, invista com sabedoria e alcance seus objetivos.
                        </p>
                        <div className="text-xs text-gray-500">
                            © 2024 MarcAI Finanças. Todos os direitos reservados.
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-emerald-400">Produto</h4>
                        <ul className="space-y-4 text-sm text-gray-300">
                            <li><a href="#" className="hover:text-white transition-colors">Funcionalidades</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Preços</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Segurança</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 text-emerald-400">Empresa</h4>
                        <ul className="space-y-4 text-sm text-gray-300">
                            <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                        </ul>
                    </div>
                </div>
            </footer>
        </div>
    );
};

const FeatureCard: React.FC<{ icon: string, title: string, desc: string }> = ({ icon, title, desc }) => (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
        <div className="bg-emerald-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:bg-emerald-100 transition-colors">
            <span className="material-symbols-outlined text-3xl text-emerald-600">{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{desc}</p>
    </div>
);

const TestimonialCard: React.FC<{ name: string, role: string, text: string, stars: number }> = ({ name, role, text, stars }) => (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {/* Fallback avatar */}
                <span className="material-symbols-outlined text-gray-400">person</span>
            </div>
            <div>
                <h4 className="font-bold text-gray-900">{name}</h4>
                <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">{role}</p>
            </div>
        </div>
        <div className="flex gap-1 text-yellow-400 mb-4">
            {[...Array(stars)].map((_, i) => (
                <span key={i} className="material-symbols-outlined text-sm fill-current">star</span>
            ))}
        </div>
        <p className="text-gray-600 italic">"{text}"</p>
        <div className="flex items-center gap-2 mt-6 text-gray-400 text-sm">
            <span className="material-symbols-outlined text-base">thumb_up</span>
            <span>12</span>
        </div>
    </div>
);

export default Landing;
