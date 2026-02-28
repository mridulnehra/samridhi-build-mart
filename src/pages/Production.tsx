

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Modal, useToast } from '@/components/ui';
import { Plus, Factory, ChevronRight, CheckCircle, Clock, PlayCircle } from 'lucide-react';
import { ProductionBatch, Block } from '@/types';
import { dataService } from '@/services/dataService';

export default function ProductionPage() {
    const { showToast } = useToast();
    const [batches, setBatches] = useState<ProductionBatch[]>([]);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updateModal, setUpdateModal] = useState<ProductionBatch | null>(null);
    const [updateQty, setUpdateQty] = useState(0);

    const [formData, setFormData] = useState({
        block_id: '',
        block_name: '',
        target_qty: 0,
        notes: '',
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [batchesData, blocksData] = await Promise.all([
                dataService.getProductionBatches(),
                dataService.getBlocks(),
            ]);
            setBatches(batchesData);
            setBlocks(blocksData);
        } catch (err) {
            console.error('Load production error:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const activeBatches = batches.filter(b => b.status === 'in_progress');
    const completedBatches = batches.filter(b => b.status === 'complete');
    const todayProduced = batches
        .filter(b => b.started_at && new Date(b.started_at).toDateString() === new Date().toDateString())
        .reduce((sum, b) => sum + b.produced_qty, 0);

    const handleStartBatch = async () => {
        if (!formData.block_id || formData.target_qty <= 0) {
            showToast('Please select a block and target quantity', 'error');
            return;
        }

        const batchNumber = await dataService.getNextBatchNumber();
        const result = await dataService.saveProductionBatch({
            batch_number: batchNumber,
            block_id: formData.block_id,
            block_name: formData.block_name,
            target_qty: formData.target_qty,
            produced_qty: 0,
            defects: 0,
            status: 'in_progress',
            cement_used: 0,
            sand_used: 0,
            aggregate_used: 0,
            color_used: 0,
            notes: formData.notes,
        });

        if (result) {
            showToast(`Batch ${batchNumber} started!`, 'success');
            setIsModalOpen(false);
            setFormData({ block_id: '', block_name: '', target_qty: 0, notes: '' });
            loadData();
        } else {
            showToast('Failed to create batch', 'error');
        }
    };

    const handleUpdateProduction = async () => {
        if (!updateModal || updateQty <= 0) return;

        const newProduced = updateModal.produced_qty + updateQty;
        const result = await dataService.saveProductionBatch({
            id: updateModal.id,
            produced_qty: newProduced,
        });

        if (result) {
            showToast('Production updated!', 'success');
            setUpdateModal(null);
            setUpdateQty(0);
            loadData();
        }
    };

    const handleCompleteBatch = async (batch: ProductionBatch) => {
        const result = await dataService.saveProductionBatch({
            id: batch.id,
            status: 'complete',
            completed_at: new Date().toISOString(),
        });

        if (result) {
            // Add produced blocks to inventory
            if (batch.block_id) {
                const block = blocks.find(b => b.id === batch.block_id);
                if (block) {
                    await dataService.saveBlock({
                        id: block.id,
                        available_qty: block.available_qty + batch.produced_qty,
                    });
                }
            }
            showToast('Batch completed! Stock updated.', 'success');
            loadData();
        }
    };

    const getProgress = (batch: ProductionBatch) => {
        if (batch.target_qty === 0) return 0;
        return Math.min(100, Math.round((batch.produced_qty / batch.target_qty) * 100));
    };

    if (loading) {
        return (<AppLayout title="Production"><div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div></AppLayout>);
    }

    if (error) {
        return (<AppLayout title="Production"><div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}><div style={{ fontSize: '48px' }}>⚠️</div><p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>Unable to load production data</p><p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Please check your internet connection</p><button className="btn btn-primary" onClick={() => { setError(false); setLoading(true); loadData(); }}>Retry</button></div></AppLayout>);
    }

    return (
        <AppLayout title="Production">
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-warning)' }}>{activeBatches.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Active</div>
                </div>
                <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-success)' }}>{completedBatches.length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Complete</div>
                </div>
                <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-info)' }}>{todayProduced}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Today</div>
                </div>
            </div>

            {/* Start New Batch */}
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '20px' }} onClick={() => setIsModalOpen(true)}>
                <Plus size={18} /> Start New Batch
            </button>

            {/* Active Batches */}
            {activeBatches.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PlayCircle size={16} /> In Progress
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {activeBatches.map(batch => {
                            const progress = getProgress(batch);
                            return (
                                <div key={batch.id} className="card" style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{batch.batch_number}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{batch.block_name}</div>
                                        </div>
                                        <span className="badge badge-warning">{batch.status.replace('_', ' ')}</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ marginBottom: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                            <span>{batch.produced_qty} / {batch.target_qty}</span>
                                            <span style={{ fontWeight: '600' }}>{progress}%</span>
                                        </div>
                                        <div style={{ height: '8px', background: '#E0E0E0', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${progress}%`, background: progress >= 100 ? 'var(--color-success)' : 'var(--color-warning)', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '13px' }} onClick={() => { setUpdateModal(batch); setUpdateQty(0); }}>
                                            Update Qty
                                        </button>
                                        <button className="btn btn-accent" style={{ flex: 1, padding: '8px', fontSize: '13px' }} onClick={() => handleCompleteBatch(batch)}>
                                            <CheckCircle size={14} /> Complete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Completed Batches */}
            {completedBatches.length > 0 && (
                <div style={{ marginBottom: '100px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle size={16} /> Completed
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {completedBatches.slice(0, 10).map(batch => (
                            <div key={batch.id} className="card" style={{ padding: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: '500', fontSize: '14px' }}>{batch.batch_number}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                            {batch.block_name} • {batch.produced_qty}/{batch.target_qty} units
                                        </div>
                                    </div>
                                    <span className="badge badge-success">Complete</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {batches.length === 0 && (
                <div className="empty-state" style={{ marginBottom: '100px' }}>
                    <Factory size={48} />
                    <p>No production batches yet</p>
                    <p style={{ fontSize: '13px' }}>Start a new batch to begin tracking production</p>
                </div>
            )}

            {/* Start Batch Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Start New Production Batch"
                footer={<><button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleStartBatch}>Start Batch</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Block Type *</label>
                        <select className="select" value={formData.block_id} onChange={(e) => {
                            const block = blocks.find(b => b.id === e.target.value);
                            setFormData({ ...formData, block_id: e.target.value, block_name: block?.name || '' });
                        }}>
                            <option value="">Select Block</option>
                            {blocks.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Target Quantity *</label>
                        <input type="number" className="input" placeholder="e.g., 500" value={formData.target_qty || ''} onChange={(e) => setFormData({ ...formData, target_qty: Number(e.target.value) })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Notes</label>
                        <input type="text" className="input" placeholder="Optional notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                </div>
            </Modal>

            {/* Update Production Modal */}
            <Modal isOpen={!!updateModal} onClose={() => setUpdateModal(null)} title={`Update ${updateModal?.batch_number || ''}`}
                footer={<><button className="btn btn-secondary" onClick={() => setUpdateModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleUpdateProduction}>Update</button></>}>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Add Produced Quantity</label>
                    <input type="number" className="input" placeholder="0" value={updateQty || ''} onChange={(e) => setUpdateQty(Number(e.target.value))} />
                    {updateModal && (
                        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                            Current: {updateModal.produced_qty} → New: {updateModal.produced_qty + updateQty} / {updateModal.target_qty}
                        </p>
                    )}
                </div>
            </Modal>
        </AppLayout>
    );
}
