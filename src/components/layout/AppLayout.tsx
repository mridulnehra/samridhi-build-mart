import { useState } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import Header from './Header';

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    showHeader?: boolean;
}

export default function AppLayout({ children, title, showHeader = true }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="main-content">
                {showHeader && (
                    <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
                )}
                {children}
            </main>

            <BottomNav />
        </div>
    );
}
