'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Modal, useToast, ConfirmDialog } from '@/components/ui';
import {
    Plus,
    Package,
    Edit2,
    Trash2,
    ArrowUp,
    ArrowDown,
    Search
} from 'lucide-react';
import { Block } from '@/types';
import { dataService } from '@/services/dataService';

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function BlocksPage() {
    const { showToast } = useToast();
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBlock, setEditingBlock] = useState<Block | null>(null);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
    const [stockModal, setStockModal] = useState<{ block: Block; type: 'in' | 'out' } | null>(null);
    const [stockQty, setStockQty] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        category: 'pavers' as Block['category'],
        size: '',
        color: '',
        available_qty: 0,
        reserved_qty: 0,
        price_per_unit: 0,
    });

    useEffect(() => {
        loadBlocks();
    }, []);

    const loadBlocks = async () => {
        setLoading(true);
        const data = await dataService.getBlocks();
        setBlocks(data);
        setLoading(false);
    };

    const filteredBlocks = blocks.filter(b => {
        const matchSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchCategory = selectedCategory === 'all' || b.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    const handleOpenAdd = () => {
        setEditingBlock(null);
        setFormData({ name: '', category: 'pavers', size: '', color: '', available_qty: 0, reserved_qty: 0, price_per_unit: 0 });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (block: Block) => {
        setEditingBlock(block);
        setFormData({
            name: block.name,
            category: block.category,
            size: block.size || '',
            color: block.color || '',
            available_qty: block.available_qty,
            reserved_qty: block.reserved_qty,
            price_per_unit: block.price_per_unit,
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name) {
            showToast('Please enter block name', 'error');
            return;
        }

        const blockData = {
            ...(editingBlock ? { id: editingBlock.id } : {}),
            name: formData.name,
            category: formData.category,
            size: formData.size,
            color: formData.color,
            available_qty: formData.available_qty,
            reserved_qty: formData.reserved_qty,
            price_per_unit: formData.price_per_unit,
        };

        const result = await dataService.saveBlock(blockData);
        if (result) {
            showToast(editingBlock ? 'Block updated!' : 'Block added!', 'success');
            setIsModalOpen(false);
            loadBlocks();
        } else {
            showToast('Failed to save block', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        const success = await dataService.deleteBlock(id);
        if (success) {
            showToast('Block deleted', 'success');
            loadBlocks();
        } else {
            showToast('Failed to delete block', 'error');
        }
        setDeleteConfirmation(null);
    };

    const handleStockUpdate = async () => {
        if (!stockModal || stockQty <= 0) return;

        const newQty = stockModal.type === 'in'
            ? stockModal.block.available_qty + stockQty
            : stockModal.block.available_qty - stockQty;

        if (newQty < 0) {
            showToast('Not enough stock', 'error');
            return;
        }

        const result = await dataService.saveBlock({ id: stockModal.block.id, available_qty: newQty });
        if (result) {
            showToast(`Stock ${stockModal.type === 'in' ? 'added' : 'removed'} successfully`, 'success');
            setStockModal(null);
            setStockQty(0);
            loadBlocks();
        }
    };

    const totalStock = blocks.reduce((sum, b) => sum + b.available_qty, 0);
    const totalValue = blocks.reduce((sum, b) => sum + (b.available_qty * b.price_per_unit), 0);

    if (loading) {
        return (
            <AppLayout title="Block Inventory">
                <div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Block Inventory">
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Total Stock</div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{totalStock.toLocaleString('en-IN')}</div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Total Value</div>
                    <div style={{ fontSize: '24px', fontWeight: '700' }}>{formatCurrency(totalValue)}</div>
                </div>
            </div>

            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input type="text" className="input" placeholder="Search blocks..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px' }} />
                </div>
                <select className="select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} style={{ width: 'auto' }}>
                    <option value="all">All</option>
                    <option value="pavers">Pavers</option>
                    <option value="bricks">Bricks</option>
                    <option value="designer">Designer</option>
                </select>
            </div>

            {/* Add Button */}
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '16px' }} onClick={handleOpenAdd}>
                <Plus size={18} /> Add New Block
            </button>

            {/* Block Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '100px' }}>
                {filteredBlocks.length === 0 ? (
                    <div className="empty-state">
                        <Package size={48} />
                        <p>No blocks found</p>
                    </div>
                ) : (
                    filteredBlocks.map(block => (
                        <div key={block.id} className="card" style={{ padding: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600' }}>{block.name}</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                        {block.size} • {block.color} • {block.category}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => handleOpenEdit(block)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                        <Edit2 size={16} color="var(--color-info)" />
                                    </button>
                                    <button onClick={() => setDeleteConfirmation(block.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                        <Trash2 size={16} color="var(--color-error)" />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                                <div style={{ background: 'var(--color-bg)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{block.available_qty}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Available</div>
                                </div>
                                <div style={{ background: 'var(--color-bg)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{block.reserved_qty}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Reserved</div>
                                </div>
                                <div style={{ background: 'var(--color-bg)', padding: '8px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{formatCurrency(block.price_per_unit)}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Price/Unit</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-accent" style={{ flex: 1, padding: '8px', fontSize: '13px' }} onClick={() => { setStockModal({ block, type: 'in' }); setStockQty(0); }}>
                                    <ArrowDown size={14} /> Stock In
                                </button>
                                <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '13px' }} onClick={() => { setStockModal({ block, type: 'out' }); setStockQty(0); }}>
                                    <ArrowUp size={14} /> Stock Out
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingBlock ? 'Edit Block' : 'Add New Block'}
                footer={<><button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Block Name *</label>
                        <input type="text" className="input" placeholder="e.g., Grey Paver 6x8" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Category *</label>
                        <select className="select" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value as Block['category'] })}>
                            <option value="pavers">Pavers</option>
                            <option value="bricks">Bricks</option>
                            <option value="designer">Designer</option>
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Size</label>
                            <input type="text" className="input" placeholder="e.g., 6x8 inches" value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Color</label>
                            <input type="text" className="input" placeholder="e.g., Grey" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Initial Qty</label>
                            <input type="number" className="input" value={formData.available_qty || ''} onChange={e => setFormData({ ...formData, available_qty: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Price/Unit (₹)</label>
                            <input type="number" className="input" value={formData.price_per_unit || ''} onChange={e => setFormData({ ...formData, price_per_unit: Number(e.target.value) })} />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Stock Update Modal */}
            <Modal isOpen={!!stockModal} onClose={() => setStockModal(null)} title={stockModal ? `Stock ${stockModal.type === 'in' ? 'In' : 'Out'} - ${stockModal.block.name}` : ''}
                footer={<><button className="btn btn-secondary" onClick={() => setStockModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleStockUpdate}>Update Stock</button></>}>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Quantity</label>
                    <input type="number" className="input" placeholder="Enter quantity" value={stockQty || ''} onChange={e => setStockQty(Number(e.target.value))} />
                    {stockModal && (
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                            Current: {stockModal.block.available_qty} → New: {stockModal.type === 'in' ? stockModal.block.available_qty + stockQty : stockModal.block.available_qty - stockQty}
                        </p>
                    )}
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmDialog isOpen={!!deleteConfirmation} onClose={() => setDeleteConfirmation(null)} onConfirm={() => deleteConfirmation && handleDelete(deleteConfirmation)} title="Delete Block" message="Are you sure you want to delete this block? This cannot be undone." type="danger" confirmText="Delete" />
        </AppLayout>
    );
}
