'use client';

import { Menu, Bell } from 'lucide-react';

interface HeaderProps {
    title?: string;
    onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });

    return (
        <header
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
                padding: '0 0 16px 0',
                borderBottom: '1px solid #E0E0E0',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button
                    onClick={onMenuClick}
                    className="lg:hidden"
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Menu size={24} />
                </button>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--color-text)' }}>
                        {title || 'Welcome, Owner'}
                    </h1>
                    <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                        {today}
                    </p>
                </div>
            </div>

            <button
                style={{
                    position: 'relative',
                    background: 'none',
                    border: 'none',
                    padding: '8px',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-md)',
                }}
            >
                <Bell size={22} color="var(--color-text-secondary)" />
                <span
                    style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '8px',
                        height: '8px',
                        background: 'var(--color-primary)',
                        borderRadius: '50%',
                    }}
                />
            </button>
        </header>
    );
}
