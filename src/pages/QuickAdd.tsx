

import { AppLayout } from '@/components/layout';
import { Link } from 'react-router-dom';
import {
    Receipt,
    Factory,
    Package,
    Wallet,
    Users,
    Truck,
    ArrowRight
} from 'lucide-react';

const quickActions = [
    {
        icon: Receipt,
        title: 'New Sale / Invoice',
        description: 'Create a new customer sale',
        href: '/sales/new',
        color: 'var(--color-primary)',
        gradient: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
    },
    {
        icon: Factory,
        title: 'Start Production Batch',
        description: 'Begin a new production run',
        href: '/production',
        color: 'var(--color-accent)',
        gradient: 'linear-gradient(135deg, var(--color-accent) 0%, #2E7D32 100%)',
    },
    {
        icon: Wallet,
        title: 'Add Cashbook Entry',
        description: 'Record receipt or payment',
        href: '/cashbook',
        color: 'var(--color-warning)',
        gradient: 'linear-gradient(135deg, var(--color-warning) 0%, #E65100 100%)',
    },
    {
        icon: Package,
        title: 'Update Stock',
        description: 'Add or remove inventory',
        href: '/inventory/blocks',
        color: 'var(--color-info)',
        gradient: 'linear-gradient(135deg, var(--color-info) 0%, #0D47A1 100%)',
    },
    {
        icon: Users,
        title: 'Add Customer',
        description: 'Register a new customer',
        href: '/customers',
        color: '#9C27B0',
        gradient: 'linear-gradient(135deg, #9C27B0 0%, #6A1B9A 100%)',
    },
    {
        icon: Truck,
        title: 'Schedule Delivery',
        description: 'Assign vehicle for dispatch',
        href: '/transport',
        color: 'var(--color-secondary)',
        gradient: 'linear-gradient(135deg, var(--color-secondary) 0%, #4A3728 100%)',
    },
];

export default function QuickAddPage() {
    return (
        <AppLayout title="Quick Actions" showHeader={false}>
            <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>
                Quick Actions
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px' }}>
                What would you like to do?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <Link key={action.href} to={action.href} style={{ textDecoration: 'none' }}>
                            <div
                                className="card card-hover"
                                style={{
                                    padding: '16px',
                                    background: action.gradient,
                                    color: 'white',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            background: 'rgba(255,255,255,0.2)',
                                            borderRadius: 'var(--radius-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Icon size={24} color="white" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>
                                            {action.title}
                                        </h3>
                                        <p style={{ fontSize: '13px', opacity: 0.9 }}>
                                            {action.description}
                                        </p>
                                    </div>
                                    <ArrowRight size={20} style={{ opacity: 0.8 }} />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </AppLayout>
    );
}
