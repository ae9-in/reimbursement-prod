

# Employee Travel Reimbursement Web App

## Overview
A full-stack travel reimbursement system with role-based access (Employee, Manager, Admin/Finance), GPS trip tracking, multi-stage claim approval, and policy management — built on React + Supabase.

---

## Database & Auth Setup

### Supabase Tables
- **profiles** — user info with role enum (employee/manager/admin), department, manager_id (self-referencing FK)
- **claims** — travel claims with status workflow (draft → submitted → manager_approved → rejected → paid), odometer readings, GPS data (JSONB), receipt_url
- **claim_comments** — threaded comments on claims with author tracking
- **policies** — configurable rate_per_km, max_distance_per_claim, max_monthly_limit
- **user_roles** — separate roles table for secure RLS (as per security best practices)

### Row-Level Security
- Employees: CRUD own claims (edit only in draft), read own profile
- Managers: read claims where employee's manager_id matches, update status
- Admins: full read access, can update claim status to paid, manage policies
- Storage bucket for receipts with per-user upload policies

### Auth
- Supabase email/password auth
- Auto-create profile on signup via database trigger
- Role stored in user_roles table, checked via security definer function

---

## Pages & Features

### Login Page (`/login`)
- Email/password sign-in form
- Role-based redirect after login to appropriate dashboard

### Sidebar Layout
- Persistent sidebar with nav links based on user role
- Top navbar: user name, role badge, logout button
- Responsive — collapses on mobile with hamburger trigger

### Employee Dashboard (`/dashboard`)
- **Summary cards**: Total claims, pending, approved, total reimbursed
- **Claim History table**: date, purpose, distance, amount, color-coded status badges, action buttons
- Empty state when no claims exist

### New Claim Form (`/claims/new`)
- Fields: Date of Travel, Purpose, Odometer Start/End (auto-calculates distance), Distance (km), Receipt upload
- Auto-calculates amount = distance × rate_per_km from policies table
- Odometer mismatch warning (non-blocking)
- Validation: required fields, numeric checks, date not in future
- Save as Draft or Submit directly
- **GPS Trip Tracker**: button to start live tracking via browser Geolocation API, draws route on Leaflet.js map, auto-fills distance when stopped

### Claim Detail (`/claims/:id`)
- Full trip details with receipt preview (image or PDF inline viewer)
- GPS route map (Leaflet) if route data exists
- Status timeline showing progression through workflow
- Comments section — threaded comments from all participants
- Action buttons based on role/status (edit draft, approve/reject, mark paid)

### Manager Dashboard (`/claims` for managers)
- Queue of submitted claims sorted by date
- Filters: status, employee name, date range
- Claim detail view with employee info, trip details, odometer, receipt preview, GPS map
- Approve button, Reject button (mandatory comment on rejection)

### Admin/Finance Dashboard (`/claims` for admins)
- View manager-approved claims for final approval
- Mark claims as Paid
- **Summary metrics cards**: Total Claims, Total Disbursed, Pending, Avg Claim Value

### Policy Configuration (`/admin/policies`)
- Admin-only page
- Edit: Rate per km (₹), Max distance per claim, Max monthly limit per employee
- Audit trail (updated_by, updated_at)

### Reports (`/admin/reports`)
- Filter by date range, employee, department, status
- Summary statistics
- Export filtered claims as CSV download

---

## UX Details
- Loading skeletons on all data-fetching views
- Toast notifications (sonner) for all actions
- Mobile-responsive tables (horizontal scroll) and forms
- Color-coded status badges: Draft (gray), Submitted (blue), Approved (green), Rejected (red), Paid (teal)
- Form validation with inline error messages using zod

