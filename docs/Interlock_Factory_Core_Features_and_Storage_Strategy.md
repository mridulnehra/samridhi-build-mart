# Interlock Factory Management System (PWA)
## Core Features & Storage Architecture

---

## 1. Core Functional Features

### A. Raw Material Management
- Material inventory (cement, sand, aggregates, colors)
<!-- - Supplier-wise material entries -->
<!-- - Opening stock, daily usage, remaining stock -->
<!-- - Low-stock alerts -->
<!-- - Material wastage tracking -->

---

### B. Production Management
- Daily and weekly production planning
- Batch-wise production records
- Per-batch material consumption
- Defective / damaged block tracking

---

### C. Block & Inventory Management
- Block types (size, color, category)
- Stock in / stock out
- Stock aging and availability
- Ready stock vs reserved stock

---

### D. Sales & Billing
- Sales entry per transaction
- Invoice / bill generation (GST & non-GST)
- Auto invoice numbering
- PDF invoice generation


---

### E. Customer Management (CRM-lite)
- Customer information
- Purchase history
- Pending payments & credit tracking
- GST / non-GST customer classification

---

### F. Payments & Accounting Basics
- Multiple payment modes (Cash, UPI, Bank)
- Partial payments
- Due dates & reminders
- Daily cashbook
- Export reports (PDF / Excel)

---

### G. Transport & Delivery
- Vehicle management

- Transport cost per order

---

### H. Role-Based Access Control
- Owner (full access)


---

### I. Reports & Analytics Dashboard
- Profit & loss overview
- Material usage trends
- Best-selling block types
- Monthly & yearly reports

---

### J. Document Generation
- Invoices


---
### K. other important features
- daily revenue and expense tracking
- other expenses entry
- daily in hand amount calculation(total revenue - total expenses)

## 2. Progressive Web App (PWA) Capabilities
- Offline-first support
- Local data storage with sync
- Installable on mobile & desktop
- Background data sync when online

---

## 3. Image & Document Storage Strategy (2-Layer Architecture)

### Problem:
Storing images and PDFs directly in the main backend storage can quickly exhaust free-tier limits and increase costs.

---

### Solution: Two-Layer Storage Strategy

#### Layer 1: Core Backend (Supabase )
Store only **metadata**, not actual files:
- Image / document URL
- File type (invoice, receipt, delivery proof)
- Related entity ID (sale, batch, purchase)
- Upload timestamp

This layer handles:
- Business logic
- Inventory data
- Transactions
- Analytics

---

#### Layer 2: Object Storage (External Storage)
Store actual files (images, PDFs) in:
- Cloudflare R2 


Advantages:
- Extremely low cost
- Scalable
- No database bloat
- Faster performance

---

### Upload Flow
1. User selects image or document
2. Frontend compresses file
3. File uploaded to object storage
4. Storage returns file URL
5. URL saved in backend database

---

### Benefits
- Keeps database light & fast
- Prevents storage overuse
- Predictable costs
- Production-ready architecture

---

## 4. Summary
This system is designed as a:
- Factory-focused ERP
- Offline-capable PWA
- Cost-efficient SaaS-ready platform

With proper feature design and a smart storage strategy, the application scales smoothly from a single factory to multiple paying customers.

---
