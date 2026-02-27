'use client';

import { AppLayout } from '@/components/layout';
import { useToast } from '@/components/ui';
import {
    TrendingUp, BarChart3, Factory, Package, Trophy, CreditCard, Download, ArrowRight
} from 'lucide-react';

const reportItems = [
    { icon: TrendingUp, title: 'Profit & Loss', description: 'Overview of revenue & costs', color: 'var(--color-success)' },
    { icon: BarChart3, title: 'Sales Report', description: 'Daily, weekly, monthly sales', color: 'var(--color-primary)' },
    { icon: Factory, title: 'Production Report', description: 'Batch-wise production data', color: 'var(--color-accent)' },
    { icon: Package, title: 'Material Usage', description: 'Consumption patterns & trends', color: 'var(--color-warning)' },
    { icon: Trophy, title: 'Best Selling Blocks', description: 'Top products by volume', color: '#9C27B0' },
    { icon: CreditCard, title: 'Pending Dues', description: 'Outstanding payments report', color: 'var(--color-error)' },
    { icon: Download, title: 'Export Data', description: 'Download PDF / Excel reports', color: 'var(--color-info)' },
];

export default function ReportsPage() {
    const { showToast } = useToast();

    return (
        <AppLayout title="Reports & Analytics">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '100px' }}>
                {reportItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.title}
                            className="card card-hover"
                            style={{ padding: '16px', cursor: 'pointer' }}
                            onClick={() => showToast(`${item.title} — Coming Soon!`, 'info')}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{ width: '48px', height: '48px', background: `${item.color}15`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={24} color={item.color} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>{item.title}</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{item.description}</p>
                                </div>
                                <ArrowRight size={20} color="var(--color-text-muted)" />
                            </div>
                        </div>
                    );
                })}
            </div>
        </AppLayout>
    );
}
