import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice } from '@/types';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function generateInvoicePDF(invoice: Invoice, factoryInfo?: { name: string; phone: string; address: string; gst: string }) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const primary = [205, 92, 92];  // brand red
    const dark = [33, 33, 33];
    const muted = [120, 120, 120];
    const light = [245, 245, 245];

    const companyName = factoryInfo?.name || 'Smridhi BuildMart';
    const companyPhone = factoryInfo?.phone || '';
    const companyAddress = factoryInfo?.address || '';
    const companyGST = factoryInfo?.gst || '';

    // ── Header Band ──
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.rect(0, 0, pageWidth, 42, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, margin, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subtitle = [companyPhone, companyAddress].filter(Boolean).join(' | ');
    if (subtitle) doc.text(subtitle, margin, 30);
    if (companyGST) doc.text(`GST: ${companyGST}`, margin, 36);

    // "INVOICE" label right side
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin, 24, { align: 'right' });

    y = 52;

    // ── Invoice Info Row ──
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice No:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoice_number, margin + 30, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', pageWidth - margin - 60, y);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(invoice.created_at), pageWidth - margin - 44, y);

    y += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Status:', margin, y);
    const statusLabel = invoice.payment_status === 'paid' ? 'PAID' : invoice.payment_status === 'partial' ? 'PARTIAL' : 'UNPAID';
    const statusColor = invoice.payment_status === 'paid' ? [76, 175, 80] : invoice.payment_status === 'partial' ? [255, 167, 38] : [239, 83, 80];
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(statusLabel, margin + 30, y);
    doc.setTextColor(dark[0], dark[1], dark[2]);

    if (invoice.payment_mode) {
        doc.setFont('helvetica', 'bold');
        doc.text('Payment:', pageWidth - margin - 60, y);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.payment_mode.toUpperCase(), pageWidth - margin - 38, y);
    }

    y += 14;

    // ── Bill To Section ──
    doc.setFillColor(light[0], light[1], light[2]);
    doc.roundedRect(margin, y, contentWidth, 30, 3, 3, 'F');

    doc.setFontSize(9);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.text('BILL TO', margin + 8, y + 8);

    doc.setFontSize(12);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.customer?.name || 'Walk-in Customer', margin + 8, y + 17);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(muted[0], muted[1], muted[2]);
    const custDetails = [invoice.customer?.phone, invoice.customer?.address].filter(Boolean).join(' | ');
    if (custDetails) doc.text(custDetails, margin + 8, y + 24);
    if (invoice.customer?.gst_number) doc.text(`GST: ${invoice.customer.gst_number}`, pageWidth - margin - 8, y + 24, { align: 'right' });

    y += 40;

    // ── Items Table ──
    const items = invoice.items || [];
    const tableBody = items.map((item, i) => [
        (i + 1).toString(),
        item.block_name,
        item.quantity.toLocaleString('en-IN'),
        formatCurrency(item.rate),
        formatCurrency(item.amount),
    ]);

    autoTable(doc, {
        startY: y,
        head: [['#', 'Description', 'Qty', 'Rate', 'Amount']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
            fillColor: [primary[0], primary[1], primary[2]],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 10,
            halign: 'center',
        },
        bodyStyles: {
            fontSize: 10,
            textColor: [dark[0], dark[1], dark[2]],
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'right', cellWidth: 35 },
            4: { halign: 'right', cellWidth: 40 },
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: { fillColor: [250, 250, 250] },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 10;

    // ── Totals Box ──
    const totalsX = pageWidth - margin - 90;
    const lw = 90;

    doc.setFontSize(10);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal', totalsX, y);
    doc.text(formatCurrency(invoice.subtotal), totalsX + lw, y, { align: 'right' });
    y += 7;

    if (invoice.transport_cost > 0) {
        doc.text('Transport', totalsX, y);
        doc.text(formatCurrency(invoice.transport_cost), totalsX + lw, y, { align: 'right' });
        y += 7;
    }

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(totalsX, y, totalsX + lw, y);
    y += 7;

    doc.setFontSize(13);
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Total', totalsX, y);
    doc.text(formatCurrency(invoice.total_amount), totalsX + lw, y, { align: 'right' });
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(76, 175, 80);
    doc.text('Paid', totalsX, y);
    doc.text(formatCurrency(invoice.amount_paid), totalsX + lw, y, { align: 'right' });

    const balance = invoice.total_amount - invoice.amount_paid;
    if (balance > 0) {
        y += 7;
        doc.setTextColor(239, 83, 80);
        doc.setFont('helvetica', 'bold');
        doc.text('Balance Due', totalsX, y);
        doc.text(formatCurrency(balance), totalsX + lw, y, { align: 'right' });
    }

    y += 20;

    // ── Notes ──
    if (invoice.notes) {
        doc.setTextColor(muted[0], muted[1], muted[2]);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.notes, margin + 18, y);
        y += 10;
    }

    // ── Footer ──
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setDrawColor(primary[0], primary[1], primary[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    doc.setTextColor(muted[0], muted[1], muted[2]);
    doc.setFontSize(8);
    doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, footerY + 5, { align: 'center' });

    // Save
    doc.save(`${invoice.invoice_number}.pdf`);
}
