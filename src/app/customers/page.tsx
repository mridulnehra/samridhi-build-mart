'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Modal, useToast, ConfirmDialog } from '@/components/ui';
import { Plus, Search, Edit2, Trash2, Users, Phone, MapPin, IndianRupee } from 'lucide-react';
import { Customer } from '@/types';
import { dataService } from '@/services/dataService';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

export default function CustomersPage() {
    const { showToast } = useToast();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDues, setFilterDues] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
    const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);
    const [paymentData, setPaymentData] = useState({ amount: 0, payment_mode: 'cash' as 'cash' | 'upi' | 'bank', notes: '' });
    const [paymentSaving, setPaymentSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '', phone: '', address: '', gst_number: '',
    });

    useEffect(() => { loadCustomers(); }, []);

    const loadCustomers = async () => {
        setLoading(true);
        setError(false);
        try {
            const data = await dataService.getCustomers();
            setCustomers(data);
        } catch (err) {
            console.error('Load customers error:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const filtered = customers.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.phone || '').includes(searchQuery);
        const matchDues = !filterDues || c.pending_dues > 0;
        return matchSearch && matchDues;
    });

    const totalBusiness = customers.reduce((sum, c) => sum + c.total_business, 0);
    const totalDues = customers.reduce((sum, c) => sum + c.pending_dues, 0);

    const handleOpenAdd = () => {
        setEditingCustomer(null);
        setFormData({ name: '', phone: '', address: '', gst_number: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormData({ name: customer.name, phone: customer.phone || '', address: customer.address || '', gst_number: customer.gst_number || '' });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) { showToast('Please enter customer name', 'error'); return; }

        const result = await dataService.saveCustomer({
            ...(editingCustomer ? { id: editingCustomer.id } : {}),
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            gst_number: formData.gst_number,
            ...(editingCustomer ? {} : { total_business: 0, pending_dues: 0 }),
        });

        if (result) {
            showToast(editingCustomer ? 'Customer updated!' : 'Customer added!', 'success');
            setIsModalOpen(false);
            loadCustomers();
        } else {
            showToast('Failed to save customer', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const success = await dataService.deleteCustomer(id);
        if (success) { showToast('Customer deleted', 'success'); loadCustomers(); }
        else { showToast('Failed to delete customer', 'error'); }
        setDeleteConfirmation(null);
    };

    const handleOpenPayment = (customer: Customer) => {
        setPaymentCustomer(customer);
        setPaymentData({ amount: 0, payment_mode: 'cash', notes: '' });
    };

    const handleReceivePayment = async () => {
        if (!paymentCustomer) return;
        if (paymentData.amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }
        if (paymentData.amount > paymentCustomer.pending_dues) { showToast('Amount exceeds pending dues', 'error'); return; }

        setPaymentSaving(true);
        try {
            // 1. Update customer pending_dues
            const newDues = paymentCustomer.pending_dues - paymentData.amount;
            const result = await dataService.saveCustomer({ id: paymentCustomer.id, pending_dues: newDues });

            if (result) {
                // 2. Create cashbook receipt entry
                await dataService.saveCashbookEntry({
                    entry_date: new Date().toISOString().split('T')[0],
                    type: 'receipt',
                    category: 'Payment Received',
                    description: `Due payment from ${paymentCustomer.name}${paymentData.notes ? ' - ' + paymentData.notes : ''}`,
                    amount: paymentData.amount,
                    payment_mode: paymentData.payment_mode,
                });

                showToast(`${formatCurrency(paymentData.amount)} received from ${paymentCustomer.name}!`, 'success');
                setPaymentCustomer(null);
                loadCustomers();
            } else {
                showToast('Failed to update customer dues', 'error');
            }
        } catch (err) {
            console.error('Payment error:', err);
            showToast('Something went wrong', 'error');
        } finally {
            setPaymentSaving(false);
        }
    };

    if (loading) {
        return (<AppLayout title="Customers"><div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div></AppLayout>);
    }

    if (error) {
        return (<AppLayout title="Customers"><div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}><div style={{ fontSize: '48px' }}>⚠️</div><p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>Unable to load customers</p><p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Please check your internet connection</p><button className="btn btn-primary" onClick={() => { setError(false); setLoading(true); loadCustomers(); }}>Retry</button></div></AppLayout>);
    }

    return (
        <AppLayout title="Customers">
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '700' }}>{customers.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Total</div>
                </div>
                <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-success)' }}>{formatCurrency(totalBusiness)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Business</div>
                </div>
                <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-error)' }}>{formatCurrency(totalDues)}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Pending</div>
                </div>
            </div>

            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" className="input" placeholder="Search customers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px' }} />
                </div>
                <button className={`btn ${filterDues ? 'btn-primary' : 'btn-secondary'}`} style={{ padding: '8px 12px', fontSize: '13px' }} onClick={() => setFilterDues(!filterDues)}>
                    Dues
                </button>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '16px' }} onClick={handleOpenAdd}>
                <Plus size={18} /> Add Customer
            </button>

            {/* Customer List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '100px' }}>
                {filtered.length === 0 ? (
                    <div className="empty-state"><Users size={48} /><p>No customers found</p></div>
                ) : (
                    filtered.map(customer => (
                        <div key={customer.id} className="card" style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{customer.name}</h3>
                                    {customer.phone && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                            <Phone size={12} /> {customer.phone}
                                        </div>
                                    )}
                                    {customer.address && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                            <MapPin size={12} /> {customer.address}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleOpenEdit(customer)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                        <Edit2 size={16} color="var(--color-info)" />
                                    </button>
                                    <button onClick={() => setDeleteConfirmation(customer.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                        <Trash2 size={16} color="var(--color-error)" />
                                    </button>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: customer.pending_dues > 0 ? '12px' : '0' }}>
                                <div style={{ background: 'var(--color-bg)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-success)' }}>{formatCurrency(customer.total_business)}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Total Business</div>
                                </div>
                                <div style={{ background: customer.pending_dues > 0 ? 'rgba(239, 83, 80, 0.05)' : 'var(--color-bg)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: customer.pending_dues > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>{formatCurrency(customer.pending_dues)}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Pending Dues</div>
                                </div>
                            </div>
                            {customer.pending_dues > 0 && (
                                <button className="btn btn-accent" style={{ width: '100%', padding: '10px', fontSize: '14px' }} onClick={() => handleOpenPayment(customer)}>
                                    <IndianRupee size={16} /> Receive Payment
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
                footer={<><button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Name *</label>
                        <input type="text" className="input" placeholder="Customer name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Phone</label>
                        <input type="text" className="input" placeholder="Phone number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Address</label>
                        <input type="text" className="input" placeholder="Address" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>GST Number</label>
                        <input type="text" className="input" placeholder="GST number (optional)" value={formData.gst_number} onChange={e => setFormData({ ...formData, gst_number: e.target.value })} />
                    </div>
                </div>
            </Modal>

            <ConfirmDialog isOpen={!!deleteConfirmation} onClose={() => setDeleteConfirmation(null)} onConfirm={() => deleteConfirmation && handleDelete(deleteConfirmation)} title="Delete Customer" message="Are you sure? This cannot be undone." type="danger" confirmText="Delete" />

            {/* Receive Payment Modal */}
            <Modal isOpen={!!paymentCustomer} onClose={() => setPaymentCustomer(null)} title={`Receive Payment — ${paymentCustomer?.name || ''}`}
                footer={<><button className="btn btn-secondary" onClick={() => setPaymentCustomer(null)}>Cancel</button><button className="btn btn-accent" onClick={handleReceivePayment} disabled={paymentSaving}>{paymentSaving ? 'Saving...' : 'Confirm Payment'}</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {paymentCustomer && (
                        <div style={{ background: 'rgba(239, 83, 80, 0.08)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Outstanding Dues</div>
                            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-error)' }}>{formatCurrency(paymentCustomer.pending_dues)}</div>
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Amount Received (₹) *</label>
                        <input type="number" className="input" placeholder="Enter amount" value={paymentData.amount || ''} onChange={e => setPaymentData({ ...paymentData, amount: Number(e.target.value) })} />
                        {paymentCustomer && paymentData.amount > 0 && (
                            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                                Remaining after payment: <strong style={{ color: paymentData.amount >= paymentCustomer.pending_dues ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                    {formatCurrency(Math.max(0, paymentCustomer.pending_dues - paymentData.amount))}
                                </strong>
                                {paymentData.amount >= paymentCustomer.pending_dues && <span style={{ color: 'var(--color-success)', marginLeft: '8px' }}>✅ Fully Cleared!</span>}
                            </div>
                        )}
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Payment Mode *</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {(['cash', 'upi', 'bank'] as const).map(mode => (
                                <button key={mode} type="button" onClick={() => setPaymentData({ ...paymentData, payment_mode: mode })}
                                    style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: paymentData.payment_mode === mode ? '2px solid var(--color-primary)' : '1px solid #E0E0E0', background: paymentData.payment_mode === mode ? 'rgba(205, 92, 92, 0.1)' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase' }}>
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Notes (Optional)</label>
                        <input type="text" className="input" placeholder="e.g., Partial payment for INV-0156" value={paymentData.notes} onChange={e => setPaymentData({ ...paymentData, notes: e.target.value })} />
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
