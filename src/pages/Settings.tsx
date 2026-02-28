

import { useState } from 'react';
import { AppLayout } from '@/components/layout';
import { useToast } from '@/components/ui';
import {
    Building2,
    FileText,
    Landmark,
    Receipt,
    Boxes,
    AlertTriangle,
    Palette,
    Moon,
    Bell,
    Fingerprint,
    Globe,
    RefreshCw,
    Download,
    Upload,
    Trash2,
    LogOut,
    ChevronRight,
    Check
} from 'lucide-react';

interface SettingItem {
    icon: React.ElementType;
    label: string;
    description?: string;
    type: 'link' | 'toggle' | 'info';
    value?: boolean | string;
}

export default function SettingsPage() {
    const { showToast } = useToast();
    const [darkMode, setDarkMode] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [biometric, setBiometric] = useState(false);
    const [syncStatus] = useState('synced');

    const settingSections = [
        {
            title: 'Business Profile',
            items: [
                { icon: Building2, label: 'Factory Details', type: 'link' as const },
                { icon: FileText, label: 'GST Information', type: 'link' as const },
                { icon: Landmark, label: 'Bank Details', type: 'link' as const },
                { icon: Receipt, label: 'Invoice Header', type: 'link' as const },
            ],
        },
        {
            title: 'Inventory Settings',
            items: [
                { icon: Boxes, label: 'Block Types & Pricing', type: 'link' as const },
                { icon: AlertTriangle, label: 'Low Stock Thresholds', type: 'link' as const },
                { icon: Palette, label: 'Material Categories', type: 'link' as const },
            ],
        },
        {
            title: 'App Preferences',
            items: [
                { icon: Moon, label: 'Dark Mode', type: 'toggle' as const, value: darkMode, onChange: setDarkMode },
                { icon: Bell, label: 'Notifications', type: 'toggle' as const, value: notifications, onChange: setNotifications },
                { icon: Fingerprint, label: 'Biometric Login', type: 'toggle' as const, value: biometric, onChange: setBiometric },
                { icon: Globe, label: 'Language', type: 'info' as const, value: 'English' },
            ],
        },
        {
            title: 'Data & Sync',
            items: [
                { icon: RefreshCw, label: 'Sync Status', type: 'info' as const, value: syncStatus === 'synced' ? '✅ Up to date' : '🔄 Syncing...' },
                { icon: Download, label: 'Export All Data', type: 'link' as const },
                { icon: Upload, label: 'Import Data', type: 'link' as const },
                { icon: Trash2, label: 'Clear Local Cache', type: 'link' as const },
            ],
        },
    ];

    return (
        <AppLayout title="Settings">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {settingSections.map((section) => (
                    <div key={section.title}>
                        <h3 style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: 'var(--color-text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '12px',
                        }}>
                            {section.title}
                        </h3>

                        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                            {section.items.map((item, index) => {
                                const Icon = item.icon;
                                const isLast = index === section.items.length - 1;

                                return (
                                    <div
                                        key={item.label}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '16px',
                                            borderBottom: isLast ? 'none' : '1px solid #E0E0E0',
                                            cursor: item.type === 'link' ? 'pointer' : 'default',
                                        }}
                                        onClick={() => {
                                            if (item.type === 'link') {
                                                // Handle navigation
                                                showToast(`Navigate to ${item.label} settings`, 'info');
                                            }
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                background: 'var(--color-bg)',
                                                borderRadius: 'var(--radius-md)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '12px',
                                            }}
                                        >
                                            <Icon size={18} color="var(--color-primary)" />
                                        </div>

                                        <span style={{ flex: 1, fontSize: '15px' }}>{item.label}</span>

                                        {item.type === 'link' && (
                                            <ChevronRight size={18} color="var(--color-text-muted)" />
                                        )}

                                        {item.type === 'toggle' && 'onChange' in item && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    item.onChange?.(!item.value);
                                                }}
                                                style={{
                                                    width: '48px',
                                                    height: '28px',
                                                    borderRadius: '14px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    background: item.value ? 'var(--color-primary)' : '#E0E0E0',
                                                    position: 'relative',
                                                    transition: 'background 0.2s ease',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: '22px',
                                                        height: '22px',
                                                        borderRadius: '50%',
                                                        background: 'white',
                                                        position: 'absolute',
                                                        top: '3px',
                                                        left: item.value ? '23px' : '3px',
                                                        transition: 'left 0.2s ease',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                                    }}
                                                />
                                            </button>
                                        )}

                                        {item.type === 'info' && (
                                            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                                {item.value}
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Logout Button */}
                <button
                    className="btn btn-outline"
                    style={{
                        width: '100%',
                        padding: '14px',
                        marginBottom: '100px',
                    }}
                    onClick={() => showToast('Logout functionality will be added with auth', 'info')}
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </AppLayout>
    );
}
