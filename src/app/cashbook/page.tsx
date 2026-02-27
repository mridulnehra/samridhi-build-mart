'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Modal, useToast } from '@/components/ui';
import { Plus, Wallet, ArrowUpCircle, ArrowDownCircle, Calendar, Download } from 'lucide-react';
import { CashbookEntry } from '@/types';
import { dataService } from '@/services/dataService';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

export default function CashbookPage() {
    const { showToast } = useToast();
    const [entries, setEntries] = useState<CashbookEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entryType, setEntryType] = useState<'receipt' | 'payment'>('receipt');

    const [formData, setFormData] = useState({
        category: '', description: '', amount: 0, payment_mode: 'cash' as 'cash' | 'upi' | 'bank',
    });

    useEffect(() => { loadEntries(); }, []);

    const loadEntries = async () => {
        setLoading(true);
        const data = await dataService.getCashbookEntries();
        setEntries(data);
        setLoading(false);
    };

    const dayEntries = selectedDate === 'all'
        ? entries
        : entries.filter(e => e.entry_date === selectedDate);

    const totalReceipts = dayEntries.filter(e => e.type === 'receipt').reduce((sum, e) => sum + Number(e.amount), 0);
    const totalPayments = dayEntries.filter(e => e.type === 'payment').reduce((sum, e) => sum + Number(e.amount), 0);
    const netBalance = totalReceipts - totalPayments;

    const receiptCategories = ['Sales', 'Payment Received', 'Other Income'];
    const paymentCategories = ['Material', 'Labor', 'Transport', 'Utilities', 'Maintenance', 'Other'];

    const handleOpenModal = (type: 'receipt' | 'payment') => {
        setEntryType(type);
        setFormData({ category: '', description: '', amount: 0, payment_mode: 'cash' });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.category || !formData.description || formData.amount <= 0) {
            showToast('Please fill all required fields correctly', 'error');
            return;
        }

        const result = await dataService.saveCashbookEntry({
            entry_date: selectedDate === 'all' ? new Date().toISOString().split('T')[0] : selectedDate,
            type: entryType,
            category: formData.category,
            description: formData.description,
            amount: formData.amount,
            payment_mode: formData.payment_mode,
        });

        if (result) {
            showToast('Entry saved successfully', 'success');
            setIsModalOpen(false);
            loadEntries();
        } else {
            showToast('Failed to save entry', 'error');
        }
    };

    if (loading) {
        return (<AppLayout title="Daily Cashbook"><div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div></AppLayout>);
    }

    return (
        <AppLayout title="Daily Cashbook">
            {/* Date Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} color="var(--color-text-secondary)" />
                    <select
                        value={selectedDate === 'all' ? 'all' : 'date'}
                        onChange={(e) => {
                            if (e.target.value === 'all') setSelectedDate('all');
                            else setSelectedDate(new Date().toISOString().split('T')[0]);
                        }}
                        className="select" style={{ padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 'var(--radius-md)', fontSize: '14px', width: 'auto' }}>
                        <option value="date">Specific Date</option>
                        <option value="all">All Time History</option>
                    </select>
                    {selectedDate !== 'all' && (
                        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                            style={{ padding: '8px 12px', border: '1px solid #E0E0E0', borderRadius: 'var(--radius-md)', fontSize: '14px' }} />
                    )}
                </div>
            </div>

            {/* Receipts Section */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowDownCircle size={18} /> RECEIPTS (Revenue)
                    </h3>
                    <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => handleOpenModal('receipt')}>
                        <Plus size={16} /> Add
                    </button>
                </div>
                {dayEntries.filter(e => e.type === 'receipt').length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', padding: '12px 0' }}>No receipts recorded</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {dayEntries.filter(e => e.type === 'receipt').map(entry => (
                            <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(76, 175, 80, 0.05)', borderRadius: 'var(--radius-sm)' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{entry.description}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{entry.category} • {entry.payment_mode?.toUpperCase()}</div>
                                </div>
                                <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>+{formatCurrency(Number(entry.amount))}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E0E0E0', fontWeight: '600' }}>
                    <span>Total Receipts</span>
                    <span style={{ color: 'var(--color-success)' }}>+{formatCurrency(totalReceipts)}</span>
                </div>
            </div>

            {/* Payments Section */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowUpCircle size={18} /> PAYMENTS (Expenses)
                    </h3>
                    <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => handleOpenModal('payment')}>
                        <Plus size={16} /> Add
                    </button>
                </div>
                {dayEntries.filter(e => e.type === 'payment').length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', padding: '12px 0' }}>No payments recorded</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {dayEntries.filter(e => e.type === 'payment').map(entry => (
                            <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(239, 83, 80, 0.05)', borderRadius: 'var(--radius-sm)' }}>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{entry.description}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{entry.category} • {entry.payment_mode?.toUpperCase()}</div>
                                </div>
                                <span style={{ color: 'var(--color-error)', fontWeight: '600' }}>-{formatCurrency(Number(entry.amount))}</span>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E0E0E0', fontWeight: '600' }}>
                    <span>Total Payments</span>
                    <span style={{ color: 'var(--color-error)' }}>-{formatCurrency(totalPayments)}</span>
                </div>
            </div>

            {/* Net Balance */}
            <div className="card" style={{ padding: '20px', background: 'var(--color-accent)', color: 'white', marginBottom: '100px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Wallet size={20} />
                    <span style={{ opacity: 0.9 }}>Net Balance (Receipts - Payments)</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{formatCurrency(netBalance)}</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                    Receipts ({formatCurrency(totalReceipts)}) - Payments ({formatCurrency(totalPayments)})
                </div>
            </div>

            {/* Add Entry Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={entryType === 'receipt' ? 'Add Receipt' : 'Add Payment'}
                footer={<><button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button><button className={`btn ${entryType === 'receipt' ? 'btn-accent' : 'btn-primary'}`} onClick={handleSave}>Save Entry</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Category *</label>
                        <select className="select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                            <option value="">Select Category</option>
                            {(entryType === 'receipt' ? receiptCategories : paymentCategories).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Description *</label>
                        <input type="text" className="input" placeholder="e.g., Cement purchase" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Amount (₹) *</label>
                        <input type="number" className="input" placeholder="0" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Payment Mode</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {(['cash', 'upi', 'bank'] as const).map(mode => (
                                <button key={mode} type="button" onClick={() => setFormData({ ...formData, payment_mode: mode })}
                                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: formData.payment_mode === mode ? '2px solid var(--color-primary)' : '1px solid #E0E0E0', background: formData.payment_mode === mode ? 'rgba(205, 92, 92, 0.1)' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase' }}>
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
