'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    Factory,
    Receipt,
    Users,
    HardHat,
    Wallet,
    Truck,
    BarChart3,
    Settings,
    LogOut,
    Boxes,
    X
} from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Package, label: 'Raw Materials', href: '/inventory/materials' },
    { icon: Boxes, label: 'Block Inventory', href: '/inventory/blocks' },
    { icon: Factory, label: 'Production', href: '/production' },
    { icon: Receipt, label: 'Sales & Billing', href: '/sales' },
    { icon: Users, label: 'Customers', href: '/customers' },
    { icon: HardHat, label: 'Members', href: '/members' },
    { icon: Wallet, label: 'Cashbook', href: '/cashbook' },
    { icon: Truck, label: 'Transport', href: '/transport' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
    { icon: Settings, label: 'Settings', href: '/settings' },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-primary)' }}>
                                Smridhi BuildMart
                            </h1>
                            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                Your Trusted Interlock Partner
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href ||
                            (item.href !== '/' && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-item ${isActive ? 'active' : ''}`}
                                onClick={onClose}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '16px 20px', borderTop: '1px solid #E0E0E0' }}>
                    <button
                        className="sidebar-item"
                        style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
