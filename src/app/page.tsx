'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import {
  TrendingUp,
  Package,
  Factory,
  AlertTriangle,
  Wallet,
  CreditCard,
  Truck,
  Box,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

interface DashboardData {
  todayRevenue: number;
  totalStock: number;
  activeBatches: number;
  pendingDues: number;
  todayExpenses: number;
  inHandAmount: number;
  lowStockAlerts: { name: string; stock: number; unit: string }[];
  pendingDeliveries: number;
  recentActivity: { type: string; description: string; amount?: number; time: string }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardData>({
    todayRevenue: 0, totalStock: 0, activeBatches: 0, pendingDues: 0,
    todayExpenses: 0, inHandAmount: 0, lowStockAlerts: [], pendingDeliveries: 0, recentActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all data in parallel
      const [
        { data: todayReceipts },
        { data: todayPayments },
        { data: blocks },
        { data: batches },
        { data: customers },
        { data: materials },
        { data: pendingInvoices },
        { data: recentCashbook },
      ] = await Promise.all([
        supabase.from('cashbook_entries').select('amount').eq('type', 'receipt').eq('entry_date', today),
        supabase.from('cashbook_entries').select('amount').eq('type', 'payment').eq('entry_date', today),
        supabase.from('blocks').select('available_qty'),
        supabase.from('production_batches').select('id').eq('status', 'in_progress'),
        supabase.from('customers').select('pending_dues'),
        supabase.from('raw_materials').select('name, current_stock, min_stock_level, unit'),
        supabase.from('invoices').select('id').eq('delivery_status', 'pending'),
        supabase.from('cashbook_entries').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const todayRev = (todayReceipts || []).reduce((sum, r) => sum + Number(r.amount), 0);
      const todayExp = (todayPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
      const totalStock = (blocks || []).reduce((sum, b) => sum + Number(b.available_qty), 0);
      const totalDues = (customers || []).reduce((sum, c) => sum + Number(c.pending_dues), 0);

      const lowStock = (materials || [])
        .filter(m => Number(m.current_stock) <= Number(m.min_stock_level))
        .map(m => ({ name: m.name, stock: Number(m.current_stock), unit: m.unit }));

      const activity = (recentCashbook || []).map(entry => ({
        type: entry.type === 'receipt' ? 'sale' : 'payment',
        description: entry.description,
        amount: Number(entry.amount),
        time: new Date(entry.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      }));

      setStats({
        todayRevenue: todayRev,
        totalStock,
        activeBatches: (batches || []).length,
        pendingDues: totalDues,
        todayExpenses: todayExp,
        inHandAmount: todayRev - todayExp,
        lowStockAlerts: lowStock,
        pendingDeliveries: (pendingInvoices || []).length,
        recentActivity: activity,
      });
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex-center" style={{ minHeight: '60vh' }}>
          <div className="spinner" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      {/* Greeting */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Smridhi BuildMart</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
          Business overview for today
        </p>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {/* Today's Revenue */}
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(76, 175, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="var(--color-success)" />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{formatCurrency(stats.todayRevenue)}</div>
          <div className="kpi-label">Today&apos;s Revenue</div>
        </div>

        {/* Total Stock */}
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(33, 150, 243, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={18} color="var(--color-info)" />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{stats.totalStock.toLocaleString('en-IN')}</div>
          <div className="kpi-label">Total Block Stock</div>
        </div>

        {/* Active Batches */}
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 167, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Factory size={18} color="var(--color-warning)" />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{stats.activeBatches}</div>
          <div className="kpi-label">Active Batches</div>
        </div>

        {/* Pending Dues */}
        <div className="kpi-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 83, 80, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={18} color="var(--color-error)" />
            </div>
          </div>
          <div className="kpi-value" style={{ fontSize: '22px' }}>{formatCurrency(stats.pendingDues)}</div>
          <div className="kpi-label">Pending Dues</div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wallet size={20} /> Today&apos;s Cash Flow
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowUpRight size={16} color="var(--color-success)" />
              <span style={{ fontSize: '14px' }}>Receipts</span>
            </div>
            <span style={{ fontWeight: '600', color: 'var(--color-success)' }}>+{formatCurrency(stats.todayRevenue)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowDownRight size={16} color="var(--color-error)" />
              <span style={{ fontSize: '14px' }}>Expenses</span>
            </div>
            <span style={{ fontWeight: '600', color: 'var(--color-error)' }}>-{formatCurrency(stats.todayExpenses)}</span>
          </div>
          <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: '600' }}>In-Hand</span>
            <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--color-primary)' }}>{formatCurrency(stats.inHandAmount)}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Truck size={16} color="var(--color-warning)" />
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Pending Deliveries</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.pendingDeliveries}</div>
        </div>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={16} color="var(--color-error)" />
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Low Stock Items</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700' }}>{stats.lowStockAlerts.length}</div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {stats.lowStockAlerts.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)' }}>
            <AlertTriangle size={18} /> Low Stock Alerts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.lowStockAlerts.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'rgba(239, 83, 80, 0.05)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</span>
                <span style={{ fontSize: '14px', color: 'var(--color-error)', fontWeight: '600' }}>
                  {item.stock} {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card" style={{ marginBottom: '100px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} /> Recent Activity
        </h3>
        {stats.recentActivity.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', padding: '20px 0', textAlign: 'center' }}>
            No recent activity
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stats.recentActivity.map((activity, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Box size={16} color={activity.type === 'sale' ? 'var(--color-success)' : 'var(--color-error)'} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{activity.description}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{activity.time}</div>
                  </div>
                </div>
                {activity.amount && (
                  <span style={{ fontWeight: '600', color: activity.type === 'sale' ? 'var(--color-success)' : 'var(--color-error)' }}>
                    {activity.type === 'sale' ? '+' : '-'}{formatCurrency(activity.amount)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
