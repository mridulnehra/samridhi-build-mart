-- Smridhi BuildMart Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Raw Materials Table
CREATE TABLE raw_materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cement', 'sand', 'aggregate', 'color', 'other')),
  unit TEXT NOT NULL CHECK (unit IN ('bags', 'kg', 'tons')),
  current_stock DECIMAL NOT NULL DEFAULT 0,
  min_stock_level DECIMAL NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocks/Interlocks Table
CREATE TABLE blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('pavers', 'bricks', 'designer')),
  size TEXT,
  color TEXT,
  available_qty INTEGER NOT NULL DEFAULT 0,
  reserved_qty INTEGER NOT NULL DEFAULT 0,
  price_per_unit DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  gst_number TEXT,
  total_business DECIMAL NOT NULL DEFAULT 0,
  pending_dues DECIMAL NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members (Factory Workers) Table
CREATE TABLE members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'helper' CHECK (role IN ('operator', 'helper', 'driver', 'supervisor', 'other')),
  salary DECIMAL NOT NULL DEFAULT 0,
  joining_date DATE,
  address TEXT,
  aadhar_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vehicles Table
CREATE TABLE vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  registration TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'on_delivery', 'maintenance')),
  current_invoice_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices Table
CREATE TABLE invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  subtotal DECIMAL NOT NULL DEFAULT 0,
  transport_cost DECIMAL NOT NULL DEFAULT 0,
  total_amount DECIMAL NOT NULL DEFAULT 0,
  amount_paid DECIMAL NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'partial', 'pending')),
  payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'bank')),
  due_date DATE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  delivery_address TEXT,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'in_transit', 'delivered')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice Items Table
CREATE TABLE invoice_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
  block_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  rate DECIMAL NOT NULL,
  amount DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production Batches Table
CREATE TABLE production_batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  batch_number TEXT NOT NULL UNIQUE,
  block_id UUID REFERENCES blocks(id) ON DELETE SET NULL,
  block_name TEXT NOT NULL,
  target_qty INTEGER NOT NULL,
  produced_qty INTEGER DEFAULT 0,
  defects INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'complete', 'paused')),
  cement_used DECIMAL DEFAULT 0,
  sand_used DECIMAL DEFAULT 0,
  aggregate_used DECIMAL DEFAULT 0,
  color_used DECIMAL DEFAULT 0,
  notes TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Cashbook Entries Table
CREATE TABLE cashbook_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL CHECK (type IN ('receipt', 'payment')),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  payment_mode TEXT CHECK (payment_mode IN ('cash', 'upi', 'bank')),
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table (for factory info, etc.)
CREATE TABLE settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES 
  ('factory_info', '{"name": "Smridhi BuildMart", "tagline": "Your Trusted Interlock Partner", "phone": "", "address": "", "gst": ""}'),
  ('invoice_counter', '{"year": 2026, "counter": 0}'),
  ('batch_counter', '{"counter": 0}');

-- Create indexes for better performance
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_date ON invoices(created_at);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_cashbook_date ON cashbook_entries(entry_date);
CREATE INDEX idx_batches_status ON production_batches(status);
CREATE INDEX idx_members_status ON members(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_raw_materials_updated_at BEFORE UPDATE ON raw_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
