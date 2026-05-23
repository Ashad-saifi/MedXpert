# MedXpert – Motion & Animation Styling Guide

Animations and micro-interactions in MedXpert provide visual feedback and a modern, high-end user experience. This guide details keyframe designs, transition settings, and how they are triggered.

---

## 🌀 Active Keyframe Definitions

All custom keyframes are registered inside [src/index.css](file:///c:/Users/Ashad/OneDrive/Desktop/medXpert%20demo/src/index.css):

### 1. `shimmer` (Stat Loading Skeleton)
Used for content placeholders when API data is loading. It moves a linear gradient background from left to right:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### 2. `pulse-ring` (Telemedicine Indicator)
Provides a glowing pulse ring around the active video consultant screen, signaling the camera is recording:
```css
@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.5; box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.5); }
  70% { transform: scale(1); opacity: 0.9; box-shadow: 0 0 0 10px rgba(20, 184, 166, 0); }
  100% { transform: scale(0.95); opacity: 0.5; box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
}
```

### 3. `slideUp` (Login Box & Modal Intros)
Introduces form structures, shifting them upwards from below while fading them in:
```css
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

### 4. `toastIn` (Floating Alerts)
Slides notifications in from the bottom right and displays them above all content layers:
```css
@keyframes toastIn {
  from { transform: translateY(40px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

---

## ⚡ Interactive Hover Effects

To keep the application feeling responsive and alive, custom hover states are applied to cards, links, and buttons:

### Role Cards (`.role-card:hover`)
Elevates cards slightly when a user hovers over a role card on the landing page:
```css
.role-card:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
```

### Nav Items (`.nav-item:hover`)
Adds a subtle transition when hovering over sidebar menu links:
```css
.nav-item {
  transition: all 0.2s ease-in-out;
}
.nav-item:hover {
  background: var(--bg);
  color: var(--primary);
  transform: translateX(4px);
}
```

---

## 🛡️ Modals & Overlays

Modals use two layered transitions to animate open:
1. **Overlay Backdrop (`.modal-overlay`)**: Fades the transparent dark screen in using `opacity`.
2. **Modal Card (`.modal`)**: Slides down/up into perspective (`transform: translateY(16px) -> 0`).
```css
.modal-overlay {
  transition: opacity 0.2s ease-out;
}
.modal {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
```
*Note: The `cubic-bezier` timing function gives the modal a slight spring effect when opening, creating a premium feel.*
