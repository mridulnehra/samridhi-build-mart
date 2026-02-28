

import { useState, useEffect, useCallback } from 'react';
import { AppLayout } from '@/components/layout';
import { Modal, useToast, ConfirmDialog } from '@/components/ui';
import { supabase, withTimeout } from '@/lib/supabase';
import {
    Plus,
    Search,
    HardHat,
    Edit,
    Trash2,
    Phone,
    MapPin,
    IndianRupee,
    Calendar,
    Users,
    UserCheck,
    UserX,
    Loader2,
} from 'lucide-react';
import { Member } from '@/types';

const roleLabels: Record<Member['role'], string> = {
    operator: 'Operator',
    helper: 'Helper',
    driver: 'Driver',
    supervisor: 'Supervisor',
    other: 'Other',
};

const roleColors: Record<Member['role'], string> = {
    operator: '#2196F3',
    helper: '#4CAF50',
    driver: '#FF9800',
    supervisor: '#9C27B0',
    other: '#607D8B',
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

export default function MembersPage() {
    const { showToast } = useToast();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        role: 'helper' as Member['role'],
        salary: '',
        joining_date: '',
        address: '',
        aadhar_number: '',
        status: 'active' as Member['status'],
    });

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const { data, error: fetchError } = await withTimeout(
                supabase
                    .from('members')
                    .select('*')
                    .order('created_at', { ascending: false }),
                10000
            );

            if (fetchError) {
                console.error('Error fetching members:', fetchError);
                setError(true);
            } else {
                setMembers(data || []);
            }
        } catch (err) {
            console.error('Members load error:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const filteredMembers = members.filter((m) => {
        const matchesSearch =
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.phone?.includes(searchQuery) ||
            m.role.includes(searchQuery.toLowerCase());
        if (filter === 'active') return matchesSearch && m.status === 'active';
        if (filter === 'inactive') return matchesSearch && m.status === 'inactive';
        return matchesSearch;
    });

    const activeCount = members.filter((m) => m.status === 'active').length;
    const inactiveCount = members.filter((m) => m.status === 'inactive').length;
    const totalMonthlySalary = members
        .filter((m) => m.status === 'active')
        .reduce((sum, m) => sum + m.salary, 0);

    const handleOpenModal = (member?: Member) => {
        if (member) {
            setEditingMember(member);
            setFormData({
                name: member.name,
                phone: member.phone || '',
                role: member.role,
                salary: member.salary.toString(),
                joining_date: member.joining_date || '',
                address: member.address || '',
                aadhar_number: member.aadhar_number || '',
                status: member.status,
            });
        } else {
            setEditingMember(null);
            setFormData({
                name: '',
                phone: '',
                role: 'helper',
                salary: '',
                joining_date: '',
                address: '',
                aadhar_number: '',
                status: 'active',
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.salary) {
            showToast('Please fill in all required fields', 'error');
            return;
        }
        setSaving(true);

        const memberData = {
            name: formData.name,
            phone: formData.phone || null,
            role: formData.role,
            salary: Number(formData.salary),
            joining_date: formData.joining_date || null,
            address: formData.address || null,
            aadhar_number: formData.aadhar_number || null,
            status: formData.status,
        };

        if (editingMember) {
            const { error } = await supabase
                .from('members')
                .update(memberData)
                .eq('id', editingMember.id);

            if (error) {
                console.error('Error updating member:', error);
                showToast('Failed to update member. Please try again.', 'error');
            } else {
                showToast('Member updated successfully', 'success');
                setIsModalOpen(false);
                fetchMembers();
            }
        } else {
            const { error } = await supabase
                .from('members')
                .insert([memberData]);

            if (error) {
                console.error('Error adding member:', error);
                showToast('Failed to add member. Please try again.', 'error');
            } else {
                showToast('Member added successfully', 'success');
                setIsModalOpen(false);
                fetchMembers();
            }
        }

        setSaving(false);
    };

    const handleDelete = (id: string) => {
        setDeleteConfirmation(id);
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;
        setDeleting(true);

        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', deleteConfirmation);

        if (error) {
            console.error('Error deleting member:', error);
            showToast('Failed to delete member. Please try again.', 'error');
        } else {
            showToast('Member deleted successfully', 'success');
            fetchMembers();
        }

        setDeleting(false);
        setDeleteConfirmation(null);
    };

    return (
        <AppLayout title="Members">
            {/* Summary Cards */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '12px',
                    marginBottom: '20px',
                }}
            >
                <div
                    className="card"
                    style={{
                        background: 'linear-gradient(135deg, #1565C0 0%, #0D47A1 100%)',
                        color: 'white',
                        padding: '16px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Users size={16} />
                        <span style={{ fontSize: '12px', opacity: 0.9 }}>Total Members</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700' }}>{members.length}</div>
                </div>

                <div
                    className="card"
                    style={{
                        background: 'linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%)',
                        color: 'white',
                        padding: '16px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <UserCheck size={16} />
                        <span style={{ fontSize: '12px', opacity: 0.9 }}>Active</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700' }}>{activeCount}</div>
                </div>

                <div
                    className="card"
                    style={{
                        background: 'linear-gradient(135deg, #E65100 0%, #BF360C 100%)',
                        color: 'white',
                        padding: '16px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <UserX size={16} />
                        <span style={{ fontSize: '12px', opacity: 0.9 }}>Inactive</span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700' }}>{inactiveCount}</div>
                </div>
            </div>

            {/* Monthly Salary Banner */}
            <div
                className="card"
                style={{
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                    color: 'white',
                    marginBottom: '20px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <IndianRupee size={18} />
                    <span style={{ fontSize: '14px', opacity: 0.9 }}>Total Monthly Salary (Active)</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: '700' }}>{formatCurrency(totalMonthlySalary)}</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                    For {activeCount} active member{activeCount !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Search and Filter */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <Search
                            size={18}
                            style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-text-muted)',
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Search members..."
                            className="input"
                            style={{ paddingLeft: '40px' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={18} />
                        Add Member
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['all', 'active', 'inactive'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding: '6px 14px',
                                fontSize: '13px',
                                borderRadius: 'var(--radius-sm)',
                                border: 'none',
                                cursor: 'pointer',
                                background: filter === f ? 'var(--color-primary)' : 'var(--color-surface)',
                                color: filter === f ? 'white' : 'var(--color-text-secondary)',
                                boxShadow: 'var(--shadow-sm)',
                            }}
                        >
                            {f === 'all' ? `All (${members.length})` : f === 'active' ? `Active (${activeCount})` : `Inactive (${inactiveCount})`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Member List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {loading ? (
                    <div className="empty-state">
                        <Loader2 size={48} style={{ animation: 'spin 1s linear infinite' }} />
                        <p>Loading members...</p>
                    </div>
                ) : error ? (
                    <div className="flex-center" style={{ minHeight: '40vh', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '48px' }}>⚠️</div>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '16px' }}>Unable to load members</p>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Please check your internet connection</p>
                        <button className="btn btn-primary" onClick={() => { setError(false); setLoading(true); fetchMembers(); }}>Retry</button>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="empty-state">
                        <HardHat size={48} />
                        <p>{members.length === 0 ? 'No members added yet. Click "Add Member" to get started!' : 'No members found'}</p>
                    </div>
                ) : (
                    filteredMembers.map((member) => (
                        <div
                            key={member.id}
                            className="card card-hover"
                            style={{
                                padding: '16px',
                                opacity: member.status === 'inactive' ? 0.7 : 1,
                                borderLeft: `4px solid ${roleColors[member.role]}`,
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '12px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            background: roleColors[member.role],
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontWeight: '600',
                                            fontSize: '18px',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>
                                            {member.name}
                                            <span
                                                style={{
                                                    marginLeft: '8px',
                                                    fontSize: '11px',
                                                    background: roleColors[member.role],
                                                    color: 'white',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontWeight: '500',
                                                }}
                                            >
                                                {roleLabels[member.role]}
                                            </span>
                                            {member.status === 'inactive' && (
                                                <span
                                                    style={{
                                                        marginLeft: '6px',
                                                        fontSize: '11px',
                                                        background: 'var(--color-error)',
                                                        color: 'white',
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        fontWeight: '500',
                                                    }}
                                                >
                                                    Inactive
                                                </span>
                                            )}
                                        </h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                                            {member.phone && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '13px',
                                                        color: 'var(--color-text-secondary)',
                                                    }}
                                                >
                                                    <Phone size={12} />
                                                    {member.phone}
                                                </div>
                                            )}
                                            {member.address && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '13px',
                                                        color: 'var(--color-text-secondary)',
                                                    }}
                                                >
                                                    <MapPin size={12} />
                                                    {member.address}
                                                </div>
                                            )}
                                            {member.joining_date && (
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '13px',
                                                        color: 'var(--color-text-secondary)',
                                                    }}
                                                >
                                                    <Calendar size={12} />
                                                    Joined {formatDate(member.joining_date)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                                            Monthly Salary
                                        </div>
                                        <div
                                            style={{
                                                fontWeight: '700',
                                                fontSize: '18px',
                                                color: 'var(--color-accent)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '2px',
                                                justifyContent: 'flex-end',
                                            }}
                                        >
                                            <IndianRupee size={16} />
                                            {member.salary.toLocaleString('en-IN')}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <button
                                            onClick={() => handleOpenModal(member)}
                                            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            <Edit size={18} color="var(--color-text-secondary)" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(member.id)}
                                            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            <Trash2 size={18} color="var(--color-error)" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingMember ? 'Edit Member' : 'Add Member'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : editingMember ? 'Save Changes' : 'Add Member'}
                        </button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                            Name *
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g., Ramesh Kumar"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            className="input"
                            placeholder="e.g., 9876543210"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                                Role *
                            </label>
                            <select
                                className="input"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as Member['role'] })}
                            >
                                <option value="helper">Helper</option>
                                <option value="operator">Operator</option>
                                <option value="driver">Driver</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                                Monthly Salary (₹) *
                            </label>
                            <input
                                type="number"
                                className="input"
                                placeholder="e.g., 18000"
                                value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                                Joining Date
                            </label>
                            <input
                                type="date"
                                className="input"
                                value={formData.joining_date}
                                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                                Status
                            </label>
                            <select
                                className="input"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as Member['status'] })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                            Address
                        </label>
                        <textarea
                            className="input"
                            placeholder="Full address"
                            rows={2}
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
                            Aadhar Number (Optional)
                        </label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g., 1234 5678 9012"
                            value={formData.aadhar_number}
                            onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
                        />
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={!!deleteConfirmation}
                onClose={() => setDeleteConfirmation(null)}
                onConfirm={confirmDelete}
                title="Delete Member"
                message="Are you sure you want to delete this member? This action cannot be undone."
                type="danger"
                confirmText="Delete Member"
                isLoading={deleting}
            />
        </AppLayout>
    );
}
