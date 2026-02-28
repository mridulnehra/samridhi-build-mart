'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/components/ui';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Block, Customer } from '@/types';
import { dataService } from '@/services/dataService';
import { useRouter } from 'next/navigation';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
}

interface SaleItem {
    block_id: string;
    block_name: string;
    quantity: number;
    rate: number;
    amount: number;
}

export default function NewSalePage() {
    const { showToast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);

    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [isNewCustomer, setIsNewCustomer] = useState(false);

    const [items, setItems] = useState<SaleItem[]>([]);
    const [transportCost, setTransportCost] = useState(0);
    const [amountPaid, setAmountPaid] = useState(0);
    const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'bank'>('cash');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [blocksData, customersData] = await Promise.all([
                dataService.getBlocks(),
                dataService.getCustomers(),
            ]);
            setBlocks(blocksData);
            setCustomers(customersData);
        } catch (err) {
            console.error('Load sale data error:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        setItems([...items, { block_id: '', block_name: '', quantity: 0, rate: 0, amount: 0 }]);
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...items];
        const item = { ...newItems[index] };

        if (field === 'block_id') {
            const block = blocks.find(b => b.id === value);
            if (block) {
                item.block_id = block.id;
                item.block_name = block.name;
                item.rate = block.price_per_unit;
                item.amount = item.quantity * block.price_per_unit;
            }
        } else if (field === 'quantity') {
            item.quantity = Number(value);
            item.amount = item.quantity * item.rate;
        } else if (field === 'rate') {
            item.rate = Number(value);
            item.amount = item.quantity * item.rate;
        }

        newItems[index] = item;
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const totalAmount = subtotal + transportCost;
    const balance = totalAmount - amountPaid;

    const handleSubmit = async () => {
        if (items.length === 0 || items.some(i => !i.block_id || i.quantity <= 0)) {
            showToast('Please add at least one valid item', 'error');
            return;
        }

        if (!selectedCustomerId && !newCustomerName) {
            showToast('Please select or add a customer', 'error');
            return;
        }

        setSaving(true);

        try {
            let customerId = selectedCustomerId;

            // Create new customer if needed
            if (isNewCustomer && newCustomerName) {
                const newCust = await dataService.saveCustomer({
                    name: newCustomerName,
                    phone: newCustomerPhone,
                    total_business: 0,
                    pending_dues: 0,
                });
                if (newCust) {
                    customerId = newCust.id;
                }
            }

            // Generate invoice number
            const invoiceNumber = await dataService.getNextInvoiceNumber();

            // Determine payment status
            let paymentStatus: 'paid' | 'partial' | 'pending' = 'pending';
            if (amountPaid >= totalAmount) paymentStatus = 'paid';
            else if (amountPaid > 0) paymentStatus = 'partial';

            // Save invoice
            const invoice = await dataService.saveInvoice({
                invoice_number: invoiceNumber,
                customer_id: customerId || undefined,
                subtotal,
                transport_cost: transportCost,
                total_amount: totalAmount,
                amount_paid: amountPaid,
                payment_status: paymentStatus,
                payment_mode: amountPaid > 0 ? paymentMode : undefined,
                delivery_address: deliveryAddress,
                delivery_status: 'pending',
                notes,
                items: items.map(item => ({
                    block_id: item.block_id,
                    block_name: item.block_name,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                })),
            });

            if (invoice) {
                // Create cashbook receipt if payment was made
                if (amountPaid > 0) {
                    const customerName = isNewCustomer ? newCustomerName : customers.find(c => c.id === customerId)?.name || 'Customer';
                    await dataService.saveCashbookEntry({
                        entry_date: new Date().toISOString().split('T')[0],
                        type: 'receipt',
                        category: 'Sales',
                        description: `${invoiceNumber} - ${customerName}`,
                        amount: amountPaid,
                        payment_mode: paymentMode,
                    });
                }

                // Update block stock (reduce available_qty)
                for (const item of items) {
                    const block = blocks.find(b => b.id === item.block_id);
                    if (block) {
                        await dataService.saveBlock({
                            id: block.id,
                            available_qty: Math.max(0, block.available_qty - item.quantity),
                        });
                    }
                }

                showToast(`Invoice ${invoiceNumber} created!`, 'success');
                router.push('/sales');
            } else {
                showToast('Failed to create invoice', 'error');
            }
        } catch (err) {
            console.error('Save invoice error:', err);
            showToast('Something went wrong', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AppLayout title="New Sale">
                <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout title="New Sale">
                <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '48px' }}>⚠️</div>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>Unable to load data</p>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Please check your internet connection</p>
                    <button className="btn btn-primary" onClick={() => { setError(false); setLoading(true); loadData(); }}>Retry</button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="New Sale" showHeader={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '20px', fontWeight: '700' }}>New Sale / Invoice</h1>
            </div>

            {/* Customer Selection */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Customer Details</h3>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button className={`btn ${!isNewCustomer ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => setIsNewCustomer(false)}>
                        Existing
                    </button>
                    <button className={`btn ${isNewCustomer ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, padding: '8px' }} onClick={() => setIsNewCustomer(true)}>
                        New Customer
                    </button>
                </div>

                {isNewCustomer ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input type="text" className="input" placeholder="Customer Name *" value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} />
                        <input type="text" className="input" placeholder="Phone Number" value={newCustomerPhone} onChange={e => setNewCustomerPhone(e.target.value)} />
                    </div>
                ) : (
                    <select className="select" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                        <option value="">Select Customer</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Items */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Items</h3>
                    <button className="btn btn-accent" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={addItem}>
                        <Plus size={16} /> Add
                    </button>
                </div>

                {items.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
                        No items added yet
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {items.map((item, index) => (
                            <div key={index} style={{ padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <select className="select" value={item.block_id} onChange={e => updateItem(index, 'block_id', e.target.value)} style={{ flex: 1, marginRight: '8px' }}>
                                        <option value="">Select Block</option>
                                        {blocks.map(b => (
                                            <option key={b.id} value={b.id}>{b.name} (₹{b.price_per_unit}/unit, Avail: {b.available_qty})</option>
                                        ))}
                                    </select>
                                    <button onClick={() => removeItem(index)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                        <Trash2 size={16} color="var(--color-error)" />
                                    </button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Qty</label>
                                        <input type="number" className="input" value={item.quantity || ''} onChange={e => updateItem(index, 'quantity', e.target.value)} style={{ padding: '8px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Rate (₹)</label>
                                        <input type="number" className="input" value={item.rate || ''} onChange={e => updateItem(index, 'rate', e.target.value)} style={{ padding: '8px' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Amount</label>
                                        <div style={{ padding: '8px', fontWeight: '600', fontSize: '14px' }}>{formatCurrency(item.amount)}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Transport & Payment */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>Payment Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Transport Cost (₹)</label>
                        <input type="number" className="input" value={transportCost || ''} onChange={e => setTransportCost(Number(e.target.value))} />
                    </div>

                    {/* Totals */}
                    <div style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span>Transport</span><span>{formatCurrency(transportCost)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '18px', borderTop: '1px solid #E0E0E0', paddingTop: '8px', marginTop: '8px' }}>
                            <span>Total</span><span>{formatCurrency(totalAmount)}</span>
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Amount Paid (₹)</label>
                        <input type="number" className="input" value={amountPaid || ''} onChange={e => setAmountPaid(Number(e.target.value))} />
                    </div>

                    {amountPaid > 0 && (
                        <div>
                            <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Payment Mode</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {(['cash', 'upi', 'bank'] as const).map(mode => (
                                    <button key={mode} type="button" onClick={() => setPaymentMode(mode)}
                                        style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-md)', border: paymentMode === mode ? '2px solid var(--color-primary)' : '1px solid #E0E0E0', background: paymentMode === mode ? 'rgba(205, 92, 92, 0.1)' : 'white', cursor: 'pointer', fontSize: '13px', fontWeight: '500', textTransform: 'uppercase' }}>
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {balance > 0 && (
                        <div style={{ background: 'rgba(239, 83, 80, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <span style={{ color: 'var(--color-error)', fontWeight: '600' }}>Balance Due: {formatCurrency(balance)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Details */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Delivery Address</label>
                        <input type="text" className="input" placeholder="Address for delivery" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
                    </div>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px', display: 'block' }}>Notes</label>
                        <input type="text" className="input" placeholder="Optional notes" value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Submit */}
            <button className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px', marginBottom: '100px' }} onClick={handleSubmit} disabled={saving}>
                {saving ? 'Creating...' : `Create Invoice — ${formatCurrency(totalAmount)}`}
            </button>
        </AppLayout>
    );
}
