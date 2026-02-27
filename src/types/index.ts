// TypeScript types for the application

export interface RawMaterial {
    id: string;
    name: string;
    category: 'cement' | 'sand' | 'aggregate' | 'color' | 'other';
    unit: 'bags' | 'kg' | 'tons';
    current_stock: number;
    min_stock_level: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface Block {
    id: string;
    name: string;
    category: 'pavers' | 'bricks' | 'designer';
    size?: string;
    color?: string;
    available_qty: number;
    reserved_qty: number;
    price_per_unit: number;
    created_at: string;
    updated_at: string;
}

export interface Customer {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    gst_number?: string;
    total_business: number;
    pending_dues: number;
    created_at: string;
    updated_at: string;
}

export interface Member {
    id: string;
    name: string;
    phone?: string;
    role: 'operator' | 'helper' | 'driver' | 'supervisor' | 'other';
    salary: number;
    joining_date: string;
    address?: string;
    aadhar_number?: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
}

export interface Vehicle {
    id: string;
    name: string;
    registration: string;
    status: 'available' | 'on_delivery' | 'maintenance';
    current_invoice_id?: string;
    created_at: string;
}

export interface Invoice {
    id: string;
    invoice_number: string;
    customer_id?: string;
    customer?: Customer;
    subtotal: number;
    transport_cost: number;
    total_amount: number;
    amount_paid: number;
    payment_status: 'paid' | 'partial' | 'pending';
    payment_mode?: 'cash' | 'upi' | 'bank';
    due_date?: string;
    vehicle_id?: string;
    vehicle?: Vehicle;
    delivery_address?: string;
    delivery_status: 'pending' | 'in_transit' | 'delivered';
    notes?: string;
    created_at: string;
    items?: InvoiceItem[];
}

export interface InvoiceItem {
    id: string;
    invoice_id: string;
    block_id?: string;
    block_name: string;
    quantity: number;
    rate: number;
    amount: number;
    created_at: string;
}

export interface ProductionBatch {
    id: string;
    batch_number: string;
    block_id?: string;
    block_name: string;
    target_qty: number;
    produced_qty: number;
    defects: number;
    status: 'in_progress' | 'complete' | 'paused';
    cement_used: number;
    sand_used: number;
    aggregate_used: number;
    color_used: number;
    notes?: string;
    started_at: string;
    completed_at?: string;
}

export interface CashbookEntry {
    id: string;
    entry_date: string;
    type: 'receipt' | 'payment';
    category: string;
    description: string;
    amount: number;
    payment_mode?: 'cash' | 'upi' | 'bank';
    reference_id?: string;
    reference_type?: string;
    created_at: string;
}

export interface Settings {
    id: string;
    key: string;
    value: Record<string, unknown>;
    updated_at: string;
}

export interface FactoryInfo {
    name: string;
    tagline: string;
    phone: string;
    address: string;
    gst: string;
}

export interface DashboardStats {
    todayRevenue: number;
    revenueChange: number;
    totalStock: number;
    batchesToday: number;
    pendingDues: number;
    todayExpenses: number;
    inHandAmount: number;
    topSelling?: string;
    lowStockAlerts: { name: string; stock: number; unit: string }[];
    pendingDeliveries: number;
    recentActivity: {
        type: 'sale' | 'batch' | 'payment';
        description: string;
        amount?: number;
        time: string;
    }[];
}
