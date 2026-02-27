import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Transaction {
    date: string;
    billing_date?: string;
    description: string;
    category: string;
    type: 'income' | 'expense';
    amount: number;
    payment_method?: string;
}

export const exportReportPDF = (
    transactions: Transaction[],
    monthName: string,
    year: number,
    totalIncome: number,
    totalExpense: number,
    balance: number,
    userName?: string
) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    // ── Header ──
    doc.setFillColor(22, 163, 74); // emerald-600
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MarcAI Finanças', 14, 14);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Relatório Financeiro — ${monthName} ${year}`, 14, 24);
    if (userName) {
        doc.setFontSize(9);
        doc.text(`Usuário: ${userName}`, 14, 32);
    }
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, pageW - 14, 32, { align: 'right' });

    // ── Summary Cards ──
    const cardY = 46;
    const cardH = 22;
    const cardPad = 6;
    const cardW = (pageW - 28 - 8) / 3;

    const cards = [
        { label: 'Receitas', value: totalIncome, color: [209, 250, 229] as [number, number, number], textColor: [22, 101, 52] as [number, number, number] },
        { label: 'Despesas', value: totalExpense, color: [254, 226, 226] as [number, number, number], textColor: [153, 27, 27] as [number, number, number] },
        { label: 'Saldo', value: balance, color: [219, 234, 254] as [number, number, number], textColor: [30, 64, 175] as [number, number, number] },
    ];

    cards.forEach((card, i) => {
        const x = 14 + i * (cardW + 4);
        doc.setFillColor(...card.color);
        doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F');
        doc.setTextColor(...card.textColor);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(card.label, x + cardPad, cardY + 8);
        doc.setFontSize(12);
        doc.text(
            card.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            x + cardPad, cardY + 17
        );
    });

    // ── Category summary ──
    const catMap: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        catMap[t.category || 'Outros'] = (catMap[t.category || 'Outros'] || 0) + Number(t.amount);
    });
    const catRows = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) => [cat, amt.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), `${((amt / totalExpense) * 100).toFixed(1)}%`]);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Gastos por Categoria', 14, cardY + cardH + 10);

    autoTable(doc, {
        startY: cardY + cardH + 14,
        head: [['Categoria', 'Total', '% das Despesas']],
        body: catRows,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 255, 244] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'center' } },
        margin: { left: 14, right: 14 },
    });

    // ── Transactions table ──
    const afterCatY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Extrato de Transações', 14, afterCatY);

    const txRows = transactions.map(t => {
        const ref = t.billing_date || t.date;
        const d = new Date(ref + 'T00:00:00');
        return [
            d.toLocaleDateString('pt-BR'),
            t.description,
            t.category || '-',
            t.type === 'income' ? 'Receita' : 'Despesa',
            (t.type === 'income' ? '+' : '-') + Number(t.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
        ];
    });

    autoTable(doc, {
        startY: afterCatY + 4,
        head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
        body: txRows,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: { 4: { halign: 'right' } },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
            if (data.column.index === 4 && data.section === 'body') {
                const v = data.cell.raw as string;
                data.cell.styles.textColor = v.startsWith('+') ? [22, 101, 52] : [153, 27, 27];
            }
        },
    });

    // ── Footer ──
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(8);
        doc.text(`MarcAI Finanças • Página ${i} de ${pageCount}`, pageW / 2, 290, { align: 'center' });
    }

    doc.save(`MarcAI_Relatorio_${monthName}_${year}.pdf`);
};
