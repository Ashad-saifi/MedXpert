# MedXpert Admin Portal — Complete Figma UI/UX Design System & Specification

This document details the complete enterprise healthcare design system and UI/UX specifications for the **MedXpert Healthcare Administration Portal**, designed to professional hospital management and electronic health records (EHR) standards.

---

## 1. Design System Foundations & Tokens

### Color Palette (Healthcare Enterprise)
| Token Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Slate 950 (Primary Dark)** | `#020617` | Standalone Admin Login background, deep contrasts |
| **Slate 900 (Sidebar / Dark)** | `#0f172a` | Collapsible sidebar, dark navigation surfaces |
| **Slate 800 (Borders Dark)** | `#1e293b` | Dark element dividers, sub-menu cards |
| **Slate 50 (App Canvas)** | `#f8fafc` | Clean dashboard background, table alternations |
| **Medical Navy (Brand)** | `#1e3a8a` | Header titles, primary medical iconography |
| **Medical Blue (Interactive)** | `#2563eb` | Active tabs, primary buttons, focus rings |
| **Cyan 500 (Healthcare Accent)** | `#06b6d4` | Logo accent, patient metric highlights, glow effects |
| **Emerald 500 (Success / Active)** | `#10b981` | Approved doctors, verified EHR records, completed visits |
| **Amber 500 (Warning / Pending)** | `#f59e0b` | Verification queues, pending appointments |
| **Rose 500 (Danger / Destructive)**| `#f43f5e` | Suspended accounts, cancelled appointments, delete actions |

### Typography Scale
- **Display / Header Font**: `Outfit`, `DM Sans` (700 / 800 Weight)
- **Body / Table Font**: `Inter` (400 / 500 / 600 Weight)
- **Monospace / IDs**: `JetBrains Mono`, `Fira Code` (for Patient ID `P-10001`, Doctor ID `D-101`, Rx IDs)

| Style | Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `H1 Page Title` | 24px (1.5rem) | 32px | 700 (Bold) | Top header, section names |
| `H2 Card Title` | 18px (1.125rem) | 28px | 700 (Bold) | Dashboard sections, modal titles |
| `KPI Numbers` | 28px (1.75rem) | 36px | 800 (ExtraBold) | Stat cards numeric values |
| `Body Standard` | 13px (0.8125rem) | 20px | 400 (Regular) | Table rows, descriptive texts |
| `Badge / Micro` | 11px (0.6875rem) | 16px | 700 (Bold) | Status badges, category pills |

### Elevation & Card Geometry
- **Border Radius**: Cards: `16px` (`rounded-2xl`), Modals: `24px` (`rounded-3xl`), Inputs/Buttons: `12px` (`rounded-xl`).
- **Shadows**: `0 1px 3px 0 rgba(0,0,0,0.05)`, `0 4px 20px -2px rgba(0,0,0,0.05)` (Subtle, professional enterprise look).

---

## 2. Comprehensive 20 Screens & States Specification

### Screen 1: Admin Login (`/admin/login`)
- **Visuals**: Centered glassmorphic card on dark `#020617` canvas with subtle cyan/blue ambient light.
- **Components**:
  - MedXpert brand badge with cyan `X` icon.
  - "Healthcare Admin Portal" heading with restricted privilege indicator.
  - Email input with envelope icon.
  - Password input with toggle show/hide.
  - Remember me checkbox and Forgot password modal trigger.
  - Gradient sign-in button ("Authenticate & Sign In").

### Screen 2: Admin Dashboard (`/admin/dashboard`)
- **Layout**: Top Header + 4 Stat KPI Cards + 2/3 Area Chart + 1/3 Status Donut + Recent Appointments Table + Live Audit Feed.
- **Features**: Real-time stats, time filters (7D, 30D, 6M, 1Y), status distributions, quick view action modals.

### Screen 3: Patient Directory (`/admin/patients`)
- **Layout**: Patient search input, status dropdown, full data table.
- **Columns**: Patient ID, Full Name, Contact Email & Phone, Admission Date, Consultations Count, Status Badge, Actions (Inspect / Delete).

### Screen 4: Patient Details Modal (`/admin/patients/:id`)
- **Layout**: Floating modal with demographics, blood group, emergency contact, chronic conditions, appointment history, diagnostic lab records, and account suspension toggle.

### Screen 5: Doctor Management (`/admin/doctors`)
- **Layout**: Specialty filter dropdown, search bar, comprehensive doctor table.
- **Columns**: Doctor ID, Doctor Name, Specialization badge, Experience, Fee, Hospital affiliation, Verification status, Inspect button.

### Screen 6: Doctor Details Modal (`/admin/doctors/:id`)
- **Layout**: Doctor qualifications, Medical Council registry audit status, hospital affiliation, consultation fee, rating, and approve/reject triggers.

### Screen 7: Pending Doctor Verification (`/admin/doctors/pending`)
- **Layout**: Dedicated review queue with status cards for newly registered physicians.
- **Action Triggers**: One-click "Approve Credentials" or "Reject Application" with confirmation dialogs.

### Screen 8: Appointments Management (`/admin/appointments`)
- **Layout**: Live consultation schedule with search, status filters (Confirmed, Pending, Completed, Cancelled).
- **Actions**: Inspect details and administrative cancellation with reason tracking.

### Screen 9: Appointment Details Modal (`/admin/appointments/:id`)
- **Layout**: Telemedicine room metadata, patient ID, doctor ID, timing, format (Encrypted Video vs In-Clinic), and clinical reason.

### Screen 10: Medical Records (`/admin/medical-records`)
- **Layout**: Encrypted Electronic Health Records (EHR) archive with filtering between Lab Reports and Prescriptions.
- **Metadata**: Cryptographic AES-256 validation badge, patient, clinician, date, and document inspector.

### Screen 11: Prescriptions Management (`/admin/prescriptions`)
- **Layout**: Prescription audit table with medication counts, dosage schedules, and digital signature verification.

### Screen 12: Reports & Analytics (`/admin/reports`)
- **Layout**: Executive summaries, monthly admissions, clinical staff growth, and consultation revenues.
- **Export Actions**: Real-time CSV generation and printable/PDF export engine.

### Screen 13: Notification Center (`/admin/notifications`)
- **Layout**: Live alerts, doctor registration applications, security activity notices, and Mark all as read button.

### Screen 14: Settings (`/admin/settings`)
- **Layout**: Platform parameters (Brand name, support email, slot duration, max patients), 2FA toggle, session inactivity timeout, immutable audit logging switch, and administrator password change form.

### Screen 15: Security Audit Trail (`/admin/security/activity`)
- **Layout**: Immutable chronological audit log with date filters (Today, 7 Days, 30 Days, All Time) tracking administrative actors, actions, timestamps, and origin IPs.

### Screen 16: 403 Unauthorized Access Page
- **Visuals**: Deep dark canvas with security shield icon, clear role explanation, and redirect buttons to the user's authorized portal or login switch.

### Screen 17: 404 Not Found Page
- **Visuals**: Clean medical 404 card with stethoscope icon and direct button back to `/admin/dashboard`.

### Screen 18: Loading State
- **Visuals**: Circular rotating blue medical spinner with descriptive loading text.

### Screen 19: Empty State
- **Visuals**: Clipboard icon with clean title, helpful guidance, and action button (e.g. "Clear Filters").

### Screen 20: Confirmation Modal
- **Visuals**: High-priority modal with warning icon, message summary, optional administrative justification/reason input, and distinct Confirm/Cancel buttons.

---

## 3. Reusable UI Components Library

1. **`AdminSidebar`**: Collapsible menu with badges and icons.
2. **`AdminHeader`**: Global search, notification bell with count, and admin profile card.
3. **`StatCard`**: Metric cards with icon badges, percentage growth indicators, and subtext.
4. **`StatusBadge`**: Pill badges for Active, Pending, Suspended, Confirmed, Completed, Cancelled, and Video/In-Clinic.
5. **`ConfirmModal`**: Destructive operation safety confirmation.
6. **`LoadingSpinner` & `EmptyState`**: Professional UX fallback states.
7. **`AdminProtectedRoute`**: Client-side authentication and role guard.
