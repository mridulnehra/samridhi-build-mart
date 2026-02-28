

import { AppLayout } from '@/components/layout';
import { Link } from 'react-router-dom';
import { Package, Boxes, ArrowRight } from 'lucide-react';

export default function InventoryPage() {
    return (
        <AppLayout title="Inventory">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Link to="/inventory/materials" style={{ textDecoration: 'none' }}>
                    <div className="card card-hover">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    background: 'var(--color-primary)',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Package size={28} color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                                    Raw Materials
                                </h3>
                                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                    Manage cement, sand, aggregate, colors
                                </p>
                            </div>
                            <ArrowRight size={20} color="var(--color-text-muted)" />
                        </div>
                    </div>
                </Link>

                <Link to="/inventory/blocks" style={{ textDecoration: 'none' }}>
                    <div className="card card-hover">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div
                                style={{
                                    width: '56px',
                                    height: '56px',
                                    background: 'var(--color-accent)',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Boxes size={28} color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
                                    Block Inventory
                                </h3>
                                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                    Manage pavers, bricks, designer tiles
                                </p>
                            </div>
                            <ArrowRight size={20} color="var(--color-text-muted)" />
                        </div>
                    </div>
                </Link>
            </div>
        </AppLayout>
    );
}
