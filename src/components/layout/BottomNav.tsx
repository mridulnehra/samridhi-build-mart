'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Plus, Receipt, BarChart3 } from 'lucide-react';

const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Package, label: 'Inventory', href: '/inventory' },
    { icon: Plus, label: 'Add', href: '/quick-add', isCenter: true },
    { icon: Receipt, label: 'Sales', href: '/sales' },
    { icon: BarChart3, label: 'Reports', href: '/reports' },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href ||
                    (item.href !== '/' && pathname.startsWith(item.href));

                if (item.isCenter) {
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            style={{
                                width: '48px',
                                height: '48px',
                                background: 'var(--color-primary)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                marginTop: '-20px',
                                boxShadow: 'var(--shadow-md)',
                            }}
                        >
                            <Icon size={24} />
                        </Link>
                    );
                }

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon size={22} />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
