import { supabase } from '@/lib/supabase';
import { Block, Customer, Invoice, InvoiceItem, RawMaterial, CashbookEntry, ProductionBatch, Vehicle, Settings } from '@/types';

class DataService {
    // ─── Blocks ───
    async getBlocks(): Promise<Block[]> {
        const { data, error } = await supabase.from('blocks').select('*').order('created_at', { ascending: false });
        if (error) { console.error('getBlocks error:', error); return []; }
        return data as Block[];
    }

    async saveBlock(block: Partial<Block> & { id?: string }): Promise<Block | null> {
        if (block.id) {
            const { data, error } = await supabase.from('blocks').update(block).eq('id', block.id).select().single();
            if (error) { console.error('updateBlock error:', error); return null; }
            return data as Block;
        } else {
            const { id, ...rest } = block;
            const { data, error } = await supabase.from('blocks').insert(rest).select().single();
            if (error) { console.error('insertBlock error:', error); return null; }
            return data as Block;
        }
    }

    async deleteBlock(id: string): Promise<boolean> {
        const { error } = await supabase.from('blocks').delete().eq('id', id);
        if (error) { console.error('deleteBlock error:', error); return false; }
        return true;
    }

    // ─── Customers ───
    async getCustomers(): Promise<Customer[]> {
        const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
        if (error) { console.error('getCustomers error:', error); return []; }
        return data as Customer[];
    }

    async saveCustomer(customer: Partial<Customer> & { id?: string }): Promise<Customer | null> {
        if (customer.id) {
            const { data, error } = await supabase.from('customers').update(customer).eq('id', customer.id).select().single();
            if (error) { console.error('updateCustomer error:', error); return null; }
            return data as Customer;
        } else {
            const { id, ...rest } = customer;
            const { data, error } = await supabase.from('customers').insert(rest).select().single();
            if (error) { console.error('insertCustomer error:', error); return null; }
            return data as Customer;
        }
    }

    async deleteCustomer(id: string): Promise<boolean> {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (error) { console.error('deleteCustomer error:', error); return false; }
        return true;
    }

    // ─── Invoices ───
    async getInvoices(): Promise<Invoice[]> {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, customers(*), invoice_items(*)')
            .order('created_at', { ascending: false });
        if (error) { console.error('getInvoices error:', error); return []; }
        return (data || []).map((inv: Record<string, unknown>) => ({
            ...inv,
            customer: inv.customers || undefined,
            items: inv.invoice_items || [],
        })) as Invoice[];
    }

    async saveInvoice(invoice: Omit<Partial<Invoice>, 'items' | 'customer'> & { items?: { block_id?: string; block_name: string; quantity: number; rate: number; amount: number }[] }): Promise<Invoice | null> {
        const { items, ...invoiceData } = invoice;

        if (invoice.id) {
            const { data, error } = await supabase.from('invoices').update(invoiceData).eq('id', invoice.id).select().single();
            if (error) { console.error('updateInvoice error:', error); return null; }
            return data as Invoice;
        } else {
            const { id, ...rest } = invoiceData;
            const { data, error } = await supabase.from('invoices').insert(rest).select().single();
            if (error) { console.error('insertInvoice error:', error); return null; }

            // Insert invoice items
            if (items && items.length > 0 && data) {
                const itemsToInsert = items.map(item => ({
                    invoice_id: data.id,
                    block_id: item.block_id || null,
                    block_name: item.block_name,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: item.amount,
                }));
                const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
                if (itemsError) console.error('insertInvoiceItems error:', itemsError);
            }

            // Update customer totals
            if (data && data.customer_id) {
                const { data: cust } = await supabase.from('customers').select('*').eq('id', data.customer_id).single();
                if (cust) {
                    await supabase.from('customers').update({
                        total_business: (cust.total_business || 0) + (data.total_amount || 0),
                        pending_dues: (cust.pending_dues || 0) + ((data.total_amount || 0) - (data.amount_paid || 0)),
                    }).eq('id', data.customer_id);
                }
            }

            return data as Invoice;
        }
    }

    // ─── Raw Materials ───
    async getRawMaterials(): Promise<RawMaterial[]> {
        const { data, error } = await supabase.from('raw_materials').select('*').order('created_at', { ascending: false });
        if (error) { console.error('getRawMaterials error:', error); return []; }
        return data as RawMaterial[];
    }

    async saveRawMaterial(material: Partial<RawMaterial> & { id?: string }): Promise<RawMaterial | null> {
        if (material.id) {
            const { data, error } = await supabase.from('raw_materials').update(material).eq('id', material.id).select().single();
            if (error) { console.error('updateRawMaterial error:', error); return null; }
            return data as RawMaterial;
        } else {
            const { id, ...rest } = material;
            const { data, error } = await supabase.from('raw_materials').insert(rest).select().single();
            if (error) { console.error('insertRawMaterial error:', error); return null; }
            return data as RawMaterial;
        }
    }

    async deleteRawMaterial(id: string): Promise<boolean> {
        const { error } = await supabase.from('raw_materials').delete().eq('id', id);
        if (error) { console.error('deleteRawMaterial error:', error); return false; }
        return true;
    }

    // ─── Cashbook ───
    async getCashbookEntries(): Promise<CashbookEntry[]> {
        const { data, error } = await supabase.from('cashbook_entries').select('*').order('created_at', { ascending: false });
        if (error) { console.error('getCashbookEntries error:', error); return []; }
        return data as CashbookEntry[];
    }

    async saveCashbookEntry(entry: Partial<CashbookEntry> & { id?: string }): Promise<CashbookEntry | null> {
        if (entry.id) {
            const { data, error } = await supabase.from('cashbook_entries').update(entry).eq('id', entry.id).select().single();
            if (error) { console.error('updateCashbookEntry error:', error); return null; }
            return data as CashbookEntry;
        } else {
            const { id, ...rest } = entry;
            const { data, error } = await supabase.from('cashbook_entries').insert(rest).select().single();
            if (error) { console.error('insertCashbookEntry error:', error); return null; }
            return data as CashbookEntry;
        }
    }

    async deleteCashbookEntry(id: string): Promise<boolean> {
        const { error } = await supabase.from('cashbook_entries').delete().eq('id', id);
        if (error) { console.error('deleteCashbookEntry error:', error); return false; }
        return true;
    }

    // ─── Production Batches ───
    async getProductionBatches(): Promise<ProductionBatch[]> {
        const { data, error } = await supabase.from('production_batches').select('*').order('started_at', { ascending: false });
        if (error) { console.error('getProductionBatches error:', error); return []; }
        return data as ProductionBatch[];
    }

    async saveProductionBatch(batch: Partial<ProductionBatch> & { id?: string }): Promise<ProductionBatch | null> {
        if (batch.id) {
            const { data, error } = await supabase.from('production_batches').update(batch).eq('id', batch.id).select().single();
            if (error) { console.error('updateProductionBatch error:', error); return null; }
            return data as ProductionBatch;
        } else {
            const { id, ...rest } = batch;
            const { data, error } = await supabase.from('production_batches').insert(rest).select().single();
            if (error) { console.error('insertProductionBatch error:', error); return null; }
            return data as ProductionBatch;
        }
    }

    // ─── Vehicles ───
    async getVehicles(): Promise<Vehicle[]> {
        const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
        if (error) { console.error('getVehicles error:', error); return []; }
        return data as Vehicle[];
    }

    async saveVehicle(vehicle: Partial<Vehicle> & { id?: string }): Promise<Vehicle | null> {
        if (vehicle.id) {
            const { data, error } = await supabase.from('vehicles').update(vehicle).eq('id', vehicle.id).select().single();
            if (error) { console.error('updateVehicle error:', error); return null; }
            return data as Vehicle;
        } else {
            const { id, ...rest } = vehicle;
            const { data, error } = await supabase.from('vehicles').insert(rest).select().single();
            if (error) { console.error('insertVehicle error:', error); return null; }
            return data as Vehicle;
        }
    }

    async deleteVehicle(id: string): Promise<boolean> {
        const { error } = await supabase.from('vehicles').delete().eq('id', id);
        if (error) { console.error('deleteVehicle error:', error); return false; }
        return true;
    }

    // ─── Settings ───
    async getSetting(key: string): Promise<Record<string, unknown> | null> {
        const { data, error } = await supabase.from('settings').select('*').eq('key', key).single();
        if (error) { console.error('getSetting error:', error); return null; }
        return (data as Settings)?.value || null;
    }

    async updateSetting(key: string, value: Record<string, unknown>): Promise<boolean> {
        const { error } = await supabase.from('settings').update({ value }).eq('key', key);
        if (error) { console.error('updateSetting error:', error); return false; }
        return true;
    }

    // ─── Invoice Number Generation ───
    async getNextInvoiceNumber(): Promise<string> {
        const currentYear = new Date().getFullYear();
        const setting = await this.getSetting('invoice_counter');
        let counter = 1;
        if (setting) {
            const settingYear = (setting as { year?: number }).year || currentYear;
            const settingCounter = (setting as { counter?: number }).counter || 0;
            if (settingYear === currentYear) {
                counter = settingCounter + 1;
            }
        }
        await this.updateSetting('invoice_counter', { year: currentYear, counter });
        return `INV-${currentYear}-${String(counter).padStart(4, '0')}`;
    }

    // ─── Batch Number Generation ───
    async getNextBatchNumber(): Promise<string> {
        const setting = await this.getSetting('batch_counter');
        let counter = 1;
        if (setting) {
            counter = ((setting as { counter?: number }).counter || 0) + 1;
        }
        await this.updateSetting('batch_counter', { counter });
        return `BATCH-${String(counter).padStart(4, '0')}`;
    }
}

export const dataService = new DataService();
