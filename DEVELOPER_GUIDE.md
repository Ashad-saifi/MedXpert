# MedXpert – Developer Architecture & Extension Guide

Welcome to the MedXpert Developer Guide. This manual outlines how the full-stack system components function together, trace the flow of data, and details how to expand the platform's features.

---

## 🛠️ Architecture Overview

MedXpert is structured as a decoupled full-stack architecture:

1. **Frontend Server (Vite)**: Runs a fast development server compilation. Builds high-performance, minified assets for production.
2. **Backend Server (Express)**: Manages an in-memory data store, processes business logic, and exposes simulated REST endpoints.
3. **Vite Proxy Router**: Bypasses CORS policy issues during development by redirecting incoming requests on `/api/*` to the Express backend (defaulting to `http://localhost:5000`).

---

## 🔄 State & Data Flows

### 1. User Logging In
- The user selects a portal (Patient, Doctor, or Admin).
- The frontend `doLogin()` function captures the credentials, sending a `POST` request to `/api/auth/login`.
- The Express backend registers the activity and returns a user profile and role verification.
- The frontend updates `currentUser` and `currentRole`, toggles container displays, and initializes the specific dashboard screen.

### 2. Live Video Call Consultations
- Inside the Patient or Doctor panel, a user clicks "Start Consult" or "Join Call".
- `openVideoCall()` is invoked, showing the overlay container `videoCallOverlay` with styling variables, launching a tick counter interval.
- When closed via `closeVideoCall()`, the active intervals are cleared, and a toast message triggers notifying the total time elapsed.
- If logged in as a Doctor, closing the call automatically opens the "Issue Prescription" modal.

---

## ➕ Adding a New API Endpoint

To add a new API route, edit [backend/server.js](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/backend/server.js):

1. Define a backend database array or model under "Mock In-Memory Database State".
2. Create the Express route:
   ```javascript
   app.get('/api/records/search', (req, res) => {
     const query = req.query.q.toLowerCase();
     // filter elements and send response
     res.json(matchedElements);
   });
   ```
3. Update [src/main.js](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/src/main.js) to query this path and handle the UI state:
   ```javascript
   async function searchRecords(q) {
     const res = await fetch(`/api/records/search?q=${q}`);
     const data = await res.json();
     // update DOM elements
   }
   ```

---

## 🖥️ Styling Guidance

- Avoid adding custom raw styles to components. Instead, use Tailwind CSS utility classes.
- Theme tokens (colors, animations) are centralized as CSS variables in [src/index.css](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/src/index.css).
- For consistent layouts, refer to [UNIFIED_PANEL_GUIDE.md](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/UNIFIED_PANEL_GUIDE.md).
