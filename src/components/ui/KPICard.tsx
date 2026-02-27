import { LucideIcon } from 'lucide-react';

interface KPICardProps {
    icon?: LucideIcon;
    label: string;
    value: string | number;
    change?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'primary' | 'success' | 'warning' | 'error' | 'accent';
    onClick?: () => void;
}

export default function KPICard({
    icon: Icon,
    label,
    value,
    change,
    color = 'primary',
    onClick
}: KPICardProps) {
    const colorMap = {
        primary: 'var(--color-primary)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        accent: 'var(--color-accent)',
    };

    return (
        <div
            className="kpi-card card-hover"
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {Icon && (
                    <div style={{
                        padding: '8px',
                        background: `${colorMap[color]}15`,
                        borderRadius: 'var(--radius-md)',
                    }}>
                        <Icon size={20} color={colorMap[color]} />
                    </div>
                )}
                <span className="kpi-label">{label}</span>
            </div>

            <div className="kpi-value">{value}</div>

            {change && (
                <div className={`kpi-change ${change.isPositive ? 'positive' : 'negative'}`}>
                    <span>{change.isPositive ? '↑' : '↓'}</span>
                    <span>{Math.abs(change.value)}% from yesterday</span>
                </div>
            )}
        </div>
    );
}
