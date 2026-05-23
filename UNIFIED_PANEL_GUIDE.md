# MedXpert – Unified Panel Design & Component Guide

This guide details the visual consistency models, page architectures, and design tokens that ensure all MedXpert dashboards feel unified and premium.

---

## 🎨 Global Design Tokens

The visual foundation is anchored in a set of CSS custom properties defined in [src/index.css](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/src/index.css):

```css
:root {
  --primary: #0f766e;       /* Deep Teal - branding focal point */
  --primary-light: #14b8a6; /* Bright Teal - active overlays, progress highlights */
  --primary-dark: #0d9488;  /* Hover state teal shades */
  --accent: #f97316;        /* Orange - notification badges, primary buttons */
  
  --bg: #f0fdf9;            /* Soft Mint Background tint */
  --surface: #ffffff;       /* Pure white - cards, sidebars, modals */
  --surface2: #f8fafc;      /* Slate Tint - table headers, vital blocks */
  
  --radius: 12px;           /* Curved panels container corners */
  --radius-sm: 8px;         /* Standard input fields & buttons border radius */
  
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
}
```

---

## 🩻 Workspace Layout Structure

All three dashboards share a unified **App Shell Layout**:

```text
┌────────────────────────────────────────────────────────┐
│  SIDEBAR                 │  TOPBAR                     │
│  - Logo & Role Title     │  - Active Page Heading      │
│  - Navigation Sections   │  - Global Action Buttons    │
│  - User Card Info        ├─────────────────────────────┤
│  - Home Redirect Link    │  SCROLLABLE WORK AREA       │
│                          │  - Grid Statistics Cards    │
│                          │  - Tab Pages                │
│                          │  - Action Form Modals       │
└──────────────────────────┴─────────────────────────────┘
```

### 1. Sidebar Nav
Located on the left (`width: 260px`). It remains pinned on desktop layouts:
- Contains navigation icons (e.g. `🏠 Dashboard`, `📅 Appointments`).
- Highlighting is handled via `.active` which adds a background tint and shifts font weight to `600`.
- The bottom contains a User Chip displaying initials, full name, ID, and a quick-return link to the landing screen.

### 2. Topbar Actions
Located at the top right of the main content column.
- Displays a page-specific `h2` header.
- Displays utility actions (notification bell and custom action buttons like `Start Consult`).

### 3. Data Tables
Styled with clean borders, hover highlights, and contrasting headers:
- Header `th` fields use `--surface2` background tint, letter-spacing tracking, and uppercase sizing.
- Row `tr` tags transition background opacity during pointer hover events.

### 4. Interactive Modals
Modals utilize an overlay container (`.modal-overlay`) to darken background page items:
- Centered on screen, implementing a slide-in transition (`translateY`).
- Controlled programmatically via adding/removing the `.open` class.
