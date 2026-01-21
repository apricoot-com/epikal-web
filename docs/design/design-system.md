# Design System & Brand Identity

This document defines the visual standards for the **Epikal** application application, centered around a modern, trustworthy, and professional aesthetic.

---

## 🎨 Color Palette

The brand color is **Epikal Indigo** (`#471ca8`), a deep, rich purple that signifies innovation and stability. We pair this with cool-toned **Slate** neutrals.

### Primary Colors (Indigo)

Used for primary actions, active states, and brand highlights.

| Token | Hex | Usage |
| :--- | :--- | :--- |
| `primary-50` | `#f4f1fa` | Backgrounds, very subtle tints |
| `primary-100` | `#e8e4f5` | Hover backgrounds |
| `primary-200` | `#d2c8eb` | Borders, subtle accents |
| `primary-300` | `#b5a0df` | |
| `primary-400` | `#9674d2` | Focus rings, light accents |
| `primary-500` | `#7a4cc3` | |
| `primary-600` | `#6230b0` | Hover states for primary buttons |
| **`primary-700`** | **`#471ca8`** | **Base Brand Color** |
| `primary-800` | `#3c198a` | Active states |
| `primary-900` | `#321570` | Dark mode backgrounds |
| `primary-950` | `#1e0a4a` | Deep dark mode details |

### Neutrals (Slate)

Used for text, borders, and general UI structure. Matches the cool tone of the primary color.

| Token | Hex | Tailwind Equivalent | Usage |
| :--- | :--- | :--- | :--- |
| `neutral-50` | `#f8fafc` | `slate-50` | App Bkg (Light) |
| `neutral-100` | `#f1f5f9` | `slate-100` | Panels / Cards |
| `neutral-200` | `#e2e8f0` | `slate-200` | Borders |
| `neutral-500` | `#64748b` | `slate-500` | Secondary Text |
| `neutral-900` | `#0f172a` | `slate-900` | Primary Text |
| `neutral-950` | `#020617` | `slate-950` | App Bkg (Dark) |

### Semantic Colors

Functional colors for status and feedback.

| Type | Color Family | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Success** | Emerald | `#10b981` | Completed, Valid, On-track |
| **Warning** | Amber | `#f59e0b` | Pending, Attention required |
| **Error** | Rose | `#f43f5e` | Failed, Destructive actions |
| **Info** | Sky | `#0ea5e9` | Information, Help |

---

## typography

- **Font Family:** `Inter` (Sans-serif) for UI text.
- **Headings:** `Inter` (Bold/Semibold).

---

## UI Components (shadcn/ui)

We utilize **shadcn/ui** components customized with our CSS variables.

- **Radius:** `0.5rem` (Rounded-md) default.
- **Shadows:** Soft, diffused shadows for depth.

---

## 📐 Layout Patterns

To ensure visual consistency across the dashboard, use the following patterns.

### 1. Data Display: Cards vs Lists

**Standard: Use Cards for Lists**
Instead of simple lists or traditional tables for high-level items, use **Cards**.
- **Container:** Grid layout (responsive).
- **Content:** Title, description, key metadata, and status badge.
- **Actions:** Primary action (e.g. "Manage") as a button or clickable card area.

### 2. Form & Action Placement

**Standard: No Floating Buttons**
Action buttons should be anchored within their context.

- **Forms:** Save/Cancel buttons belong **inside** the card footer or aligned at the bottom of the form container.
- **Page Header:** Global page actions (e.g., "Create New") belong in the **Page Header**, aligned right.
- **Card Actions:** Actions specific to an item belong inside that item's card.

**Avoid:** Sticky/floating action buttons that obscure content.

### 3. Page Structure

```
+------------------------------------------------------+
|  [Page Header]                                       |
|  Title                      [Primary Action Button]  |
+------------------------------------------------------+
|                                                      |
|  [Content Area]                                      |
|  +------------------+  +------------------+          |
|  | Card             |  | Card             |          |
|  | [Action Btn]     |  | [Action Btn]     |          |
|  +------------------+  +------------------+          |
|                                                      |
+------------------------------------------------------+
```

