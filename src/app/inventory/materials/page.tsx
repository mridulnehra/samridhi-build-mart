'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Modal, useToast, ConfirmDialog } from '@/components/ui';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    AlertTriangle,
    ShoppingCart,
    Package
} from 'lucide-react';
import { RawMaterial } from '@/types';
import { dataService } from '@/services/dataService';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function MaterialsPage() {
    const { showToast } = useToast();
    const [materials, setMaterials] = useState<RawMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
    const [purchaseModal, setPurchaseModal] = useState<RawMaterial | null>(null);
    const [purchaseData, setPurchaseData] = useState({ quantity: 0, totalCost: 0, supplier: '' });

    const [formData, setFormData] = useState({
        name: '',
        category: 'cement' as RawMaterial['category'],
        unit: 'bags' as RawMaterial['unit'],
        current_stock: 0,
        min_stock_level: 0,
        notes: '',
    });

    useEffect(() => {
        loadMaterials();
    }, []);

    const loadMaterials = async () => {
        setLoading(true);
        const data = await dataService.getRawMaterials();
        setMaterials(data);
        setLoading(false);
    };

    const filteredMaterials = materials.filter(m => {
        const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCategory = selectedCategory === 'all' || m.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    const lowStockItems = materials.filter(m => m.current_stock <= m.min_stock_level);

    const handleOpenAdd = () => {
        setEditingMaterial(null);
        setFormData({ name: '', category: 'cement', unit: 'bags', current_stock: 0, min_stock_level: 0, notes: '' });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (material: RawMaterial) => {
        setEditingMaterial(material);
        setFormData({
            name: material.name,
            category: material.category,
            unit: material.unit,
            current_stock: material.current_stock,
            min_stock_level: material.min_stock_level,
            notes: material.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            showToast('Please enter material name', 'error');
            return;
        }

        const materialData = {
            ...(editingMaterial ? { id: editingMaterial.id } : {}),
            name: formData.name,
            category: formData.category,
            unit: formData.unit,
            current_stock: formData.current_stock,
            min_stock_level: formData.min_stock_level,
            notes: formData.notes,
        };

        const result = await dataService.saveRawMaterial(materialData);
        if (result) {
            showToast(editingMaterial ? 'Material updated!' : 'Material added!', 'success');
            setIsModalOpen(false);
            loadMaterials();
        } else {
            showToast('Failed to save material', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const success = await dataService.deleteRawMaterial(id);
        if (success) {
            showToast('Material deleted', 'success');
            loadMaterials();
        } else {
            showToast('Failed to delete material', 'error');
        }
        setDeleteConfirmation(null);
    };

    const handlePurchase = async () => {
        if (!purchaseModal || purchaseData.quantity <= 0 || purchaseData.totalCost <= 0) {
            showToast('Please fill all purchase fields correctly', 'error');
            return;
        }

        // Update material stock
        const result = await dataService.saveRawMaterial({
            id: purchaseModal.id,
            current_stock: purchaseModal.current_stock + purchaseData.quantity,
        });

        if (result) {
            // Create cashbook expense entry
            await dataService.saveCashbookEntry({
                entry_date: new Date().toISOString().split('T')[0],
                type: 'payment',
                category: 'Material',
                description: `${purchaseModal.name} purchase - ${purchaseData.quantity} ${purchaseModal.unit}${purchaseData.supplier ? ` from ${purchaseData.supplier}` : ''}`,
                amount: purchaseData.totalCost,
                payment_mode: 'cash',
            });

            showToast('Purchase recorded & stock updated!', 'success');
            setPurchaseModal(null);
            setPurchaseData({ quantity: 0, totalCost: 0, supplier: '' });
            loadMaterials();
        } else {
            showToast('Failed to update stock', 'error');
        }
    };

    if (loading) {
        return (
            <AppLayout title="Raw Materials">
                <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Raw Materials">
            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
                <div style={{ background: 'rgba(239, 83, 80, 0.1)', border: '1px solid rgba(239, 83, 80, 0.3)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} color="var(--color-error)" />
                    <span style={{ fontSize: '14px', color: 'var(--color-error)', fontWeight: '500' }}>
                        {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} below minimum stock level
                    </span>
                </div>
            )}

            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" className="input" placeholder="Search materials..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px' }} />
                </div>
                <select className="select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: 'auto' }}>
                    <option value="all">All</option>
                    <option value="cement">Cement</option>
                    <option value="sand">Sand</option>
                    <option value="aggregate">Aggregate</option>
                    <option value="color">Color</option>
                    <option value="other">Other</option>
                </select>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '16px' }} onClick={handleOpenAdd}>
                <Plus size={18} /> Add Raw Material
            </button>

            {/* Material Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '100px' }}>
                {filteredMaterials.length === 0 ? (
                    <div className="empty-state"><Package size={48} /><p>No materials found</p></div>
                ) : (
                    filteredMaterials.map(material => {
                        const isLowStock = material.current_stock <= material.min_stock_level;
                        return (
                            <div key={material.id} className="card" style={{ padding: '16px', borderLeft: isLowStock ? '4px solid var(--color-error)' : 'none' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{material.name}</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                            {material.category} • {material.unit}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleOpenEdit(material)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                            <Edit2 size={16} color="var(--color-info)" />
                                        </button>
                                        <button onClick={() => setDeleteConfirmation(material.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                            <Trash2 size={16} color="var(--color-error)" />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                                    <div style={{ background: isLowStock ? 'rgba(239, 83, 80, 0.05)' : 'var(--color-bg)', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '20px', fontWeight: '700', color: isLowStock ? 'var(--color-error)' : 'var(--color-text)' }}>
                                            {material.current_stock}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Current Stock ({material.unit})</div>
                                    </div>
                                    <div style={{ background: 'var(--color-bg)', padding: '10px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                        <div style={{ fontSize: '20px', fontWeight: '700' }}>{material.min_stock_level}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Min Level ({material.unit})</div>
                                    </div>
                                </div>

                                <button className="btn btn-accent" style={{ width: '100%', padding: '10px', fontSize: '13px' }} onClick={() => { setPurchaseModal(material); setPurchaseData({ quantity: 0, totalCost: 0, supplier: '' }); }}>
                                    <ShoppingCart size={16} /> Purchase / Restock
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMaterial ? 'Edit Material' : 'Add Raw Material'}
                footer={<><button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Material Name *</label>
                        <input type="text" className="input" placeholder="e.g., Cement" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Category</label>
                            <select className="select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as RawMaterial['category'] })}>
                                <option value="cement">Cement</option>
                                <option value="sand">Sand</option>
                                <option value="aggregate">Aggregate</option>
                                <option value="color">Color</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Unit</label>
                            <select className="select" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value as RawMaterial['unit'] })}>
                                <option value="bags">Bags</option>
                                <option value="kg">KG</option>
                                <option value="tons">Tons</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Current Stock</label>
                            <input type="number" className="input" value={formData.current_stock || ''} onChange={e => setFormData({ ...formData, current_stock: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Min Stock Level</label>
                            <input type="number" className="input" value={formData.min_stock_level || ''} onChange={e => setFormData({ ...formData, min_stock_level: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Notes</label>
                        <input type="text" className="input" placeholder="Optional notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                </div>
            </Modal>

            {/* Purchase Modal */}
            <Modal isOpen={!!purchaseModal} onClose={() => setPurchaseModal(null)} title={`Purchase ${purchaseModal?.name || ''}`}
                footer={<><button className="btn btn-secondary" onClick={() => setPurchaseModal(null)}>Cancel</button><button className="btn btn-accent" onClick={handlePurchase}>Record Purchase</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Quantity ({purchaseModal?.unit})</label>
                        <input type="number" className="input" placeholder="0" value={purchaseData.quantity || ''} onChange={e => setPurchaseData({ ...purchaseData, quantity: Number(e.target.value) })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Total Cost (₹)</label>
                        <input type="number" className="input" placeholder="0" value={purchaseData.totalCost || ''} onChange={e => setPurchaseData({ ...purchaseData, totalCost: Number(e.target.value) })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Supplier (Optional)</label>
                        <input type="text" className="input" placeholder="Supplier name" value={purchaseData.supplier} onChange={e => setPurchaseData({ ...purchaseData, supplier: e.target.value })} />
                    </div>
                </div>
            </Modal>

            <ConfirmDialog isOpen={!!deleteConfirmation} onClose={() => setDeleteConfirmation(null)} onConfirm={() => deleteConfirmation && handleDelete(deleteConfirmation)} title="Delete Material" message="Are you sure? This cannot be undone." type="danger" confirmText="Delete" />
        </AppLayout>
    );
}
