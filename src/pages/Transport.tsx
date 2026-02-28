

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Modal, useToast, ConfirmDialog } from '@/components/ui';
import { Plus, Truck, MapPin, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { Vehicle } from '@/types';
import { dataService } from '@/services/dataService';

export default function TransportPage() {
    const { showToast } = useToast();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

    const [vehicleForm, setVehicleForm] = useState({ name: '', registration: '' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        setError(false);
        try {
            const vehiclesData = await dataService.getVehicles();
            setVehicles(vehiclesData);
        } catch (err) {
            console.error('Load transport error:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const statusStyles = {
        available: { bg: 'rgba(76, 175, 80, 0.1)', color: 'var(--color-success)', label: '🟢 Available' },
        on_delivery: { bg: 'rgba(255, 167, 38, 0.1)', color: 'var(--color-warning)', label: '🟡 On Delivery' },
        maintenance: { bg: 'rgba(239, 83, 80, 0.1)', color: 'var(--color-error)', label: '🔴 Maintenance' },
    };

    const handleAddVehicle = async () => {
        if (!vehicleForm.name || !vehicleForm.registration) {
            showToast('Please fill all required fields', 'error');
            return;
        }
        const result = await dataService.saveVehicle({
            name: vehicleForm.name,
            registration: vehicleForm.registration,
            status: 'available',
        });
        if (result) {
            setIsVehicleModalOpen(false);
            setVehicleForm({ name: '', registration: '' });
            showToast('Vehicle added successfully', 'success');
            loadData();
        } else {
            showToast('Failed to add vehicle', 'error');
        }
    };

    const handleToggleStatus = async (vehicleId: string, newStatus: Vehicle['status']) => {
        const result = await dataService.saveVehicle({
            id: vehicleId,
            status: newStatus,
            current_invoice_id: undefined,
        });
        if (result) {
            showToast(`Vehicle marked as ${newStatus.replace('_', ' ')}`, 'success');
            loadData();
        }
    };

    const handleDeleteVehicle = async (id: string) => {
        const success = await dataService.deleteVehicle(id);
        if (success) {
            showToast('Vehicle deleted', 'success');
            loadData();
        } else {
            showToast('Failed to delete vehicle', 'error');
        }
        setDeleteConfirmation(null);
    };

    if (loading) {
        return (<AppLayout title="Transport"><div className="flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div></AppLayout>);
    }

    if (error) {
        return (<AppLayout title="Transport"><div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: '16px' }}><div style={{ fontSize: '48px' }}>⚠️</div><p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>Unable to load transport data</p><p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Please check your internet connection</p><button className="btn btn-primary" onClick={() => { setError(false); setLoading(true); loadData(); }}>Retry</button></div></AppLayout>);
    }

    return (
        <AppLayout title="Transport">
            {/* Vehicles Section */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Truck size={20} /> Vehicles
                    </h3>
                    <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => setIsVehicleModalOpen(true)}>
                        <Plus size={16} /> Add Vehicle
                    </button>
                </div>

                {vehicles.length === 0 ? (
                    <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <Truck size={48} />
                        <p>No vehicles added yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                        {vehicles.map(vehicle => {
                            const status = statusStyles[vehicle.status];
                            return (
                                <div key={vehicle.id} style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', border: '1px solid #E0E0E0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: '600' }}>🚚 {vehicle.name}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>{vehicle.registration}</div>
                                        </div>
                                        <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: 'var(--radius-sm)', background: status.bg, color: status.color }}>{status.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                        {vehicle.status === 'available' && (
                                            <button className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '12px' }} onClick={() => handleToggleStatus(vehicle.id, 'maintenance')}>
                                                <Settings size={14} /> Maintenance
                                            </button>
                                        )}
                                        {vehicle.status === 'maintenance' && (
                                            <button className="btn btn-accent" style={{ flex: 1, padding: '6px', fontSize: '12px' }} onClick={() => handleToggleStatus(vehicle.id, 'available')}>
                                                <CheckCircle size={14} /> Mark Available
                                            </button>
                                        )}
                                        {vehicle.status === 'on_delivery' && (
                                            <button className="btn btn-accent" style={{ flex: 1, padding: '6px', fontSize: '12px' }} onClick={() => handleToggleStatus(vehicle.id, 'available')}>
                                                <CheckCircle size={14} /> Complete Trip
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '100px' }}>
                <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-success)' }}>{vehicles.filter(v => v.status === 'available').length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Available</div>
                </div>
                <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-warning)' }}>{vehicles.filter(v => v.status === 'on_delivery').length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>On Delivery</div>
                </div>
                <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-error)' }}>{vehicles.filter(v => v.status === 'maintenance').length}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Maintenance</div>
                </div>
            </div>

            {/* Add Vehicle Modal */}
            <Modal isOpen={isVehicleModalOpen} onClose={() => setIsVehicleModalOpen(false)} title="Add Vehicle"
                footer={<><button className="btn btn-secondary" onClick={() => setIsVehicleModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleAddVehicle}>Add Vehicle</button></>}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Vehicle Name *</label>
                        <input type="text" className="input" placeholder="e.g., Tata 407" value={vehicleForm.name} onChange={(e) => setVehicleForm({ ...vehicleForm, name: e.target.value })} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>Registration Number *</label>
                        <input type="text" className="input" placeholder="e.g., MH12AB1234" value={vehicleForm.registration} onChange={(e) => setVehicleForm({ ...vehicleForm, registration: e.target.value })} />
                    </div>
                </div>
            </Modal>

            <ConfirmDialog isOpen={!!deleteConfirmation} onClose={() => setDeleteConfirmation(null)} onConfirm={() => deleteConfirmation && handleDeleteVehicle(deleteConfirmation)} title="Delete Vehicle" message="Are you sure you want to delete this vehicle?" type="danger" confirmText="Delete Vehicle" />
        </AppLayout>
    );
}
