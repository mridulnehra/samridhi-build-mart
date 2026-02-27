'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/components/ui';
import { Receipt, Search, Plus, Filter, Download } from 'lucide-react';
import { Invoice } from '@/types';
import { dataService } from '@/services/dataService';
import Link from 'next/link';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

const handleDownloadPDF = async (invoice: Invoice) => {
    const { generateInvoicePDF } = await import('@/utils/invoicePdf');
    // Fetch factory info from settings for the PDF header
    const factoryInfo = await dataService.getSetting('factory_info');
    generateInvoicePDF(invoice, factoryInfo as { name: string; phone: string; address: string; gst: string } | undefined);
};

export default function SalesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        setLoading(true);
        const data = await dataService.getInvoices();
        setInvoices(data);
        setLoading(false);
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchSearch = inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (inv.customer?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter === 'all' || inv.payment_status === statusFilter;
        return matchSearch && matchStatus;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const todayCollection = invoices
        .filter(inv => inv.created_at?.startsWith(todayStr))
        .reduce((sum, inv) => sum + inv.amount_paid, 0);
    const totalPending = invoices.reduce((sum, inv) => sum + (inv.total_amount - inv.amount_paid), 0);

    const statusStyle = (status: string) => {
        switch (status) {
            case 'paid': return { bg: 'rgba(76, 175, 80, 0.1)', color: '#2E7D32' };
            case 'partial': return { bg: 'rgba(255, 167, 38, 0.1)', color: '#EF6C00' };
            default: return { bg: 'rgba(239, 83, 80, 0.1)', color: '#C62828' };
        }
    };

    if (loading) {
        return (
            <AppLayout title="Sales & Invoices">
                <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Sales & Invoices">
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Today&apos;s Collection</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-success)' }}>{formatCurrency(todayCollection)}</div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Total Pending</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--color-error)' }}>{formatCurrency(totalPending)}</div>
                </div>
            </div>

            {/* New Sale Button */}
            <Link href="/sales/new" style={{ textDecoration: 'none' }}>
                <button className="btn btn-primary" style={{ width: '100%', marginBottom: '16px' }}>
                    <Plus size={18} /> New Sale / Invoice
                </button>
            </Link>

            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" className="input" placeholder="Search invoices..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px' }} />
                </div>
                <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
                    <option value="all">All</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* Invoice List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '100px' }}>
                {filteredInvoices.length === 0 ? (
                    <div className="empty-state"><Receipt size={48} /><p>No invoices found</p></div>
                ) : (
                    filteredInvoices.map(inv => {
                        const style = statusStyle(inv.payment_status);
                        return (
                            <div key={inv.id} className="card" style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                    <div>
                                        <div style={{ fontWeight: '600', fontSize: '15px' }}>{inv.invoice_number}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                            {inv.customer?.name || 'Walk-in Customer'}
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: style.bg, color: style.color, fontWeight: '500' }}>
                                        {inv.payment_status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                        {new Date(inv.created_at).toLocaleDateString('en-IN')}
                                    </span>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: '700', fontSize: '16px' }}>{formatCurrency(inv.total_amount)}</div>
                                        {inv.payment_status !== 'paid' && (
                                            <div style={{ fontSize: '12px', color: 'var(--color-error)' }}>
                                                Due: {formatCurrency(inv.total_amount - inv.amount_paid)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '10px', padding: '8px', fontSize: '13px' }} onClick={() => handleDownloadPDF(inv)}>
                                    <Download size={14} /> Download Bill (PDF)
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </AppLayout>
    );
}
