---
name: Nexus Terminal
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c2c6d6'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8c909f'
  outline-variant: '#424754'
  surface-tint: '#adc6ff'
  primary: '#adc6ff'
  on-primary: '#002e6a'
  primary-container: '#4d8eff'
  on-primary-container: '#00285d'
  inverse-primary: '#005ac2'
  secondary: '#4edea3'
  on-secondary: '#003824'
  secondary-container: '#00a572'
  on-secondary-container: '#00311f'
  tertiary: '#ffb3ad'
  on-tertiary: '#68000a'
  tertiary-container: '#ff5451'
  on-tertiary-container: '#5c0008'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ad'
  on-tertiary-fixed: '#410004'
  on-tertiary-fixed-variant: '#930013'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  telemetry-num:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
  panel-gap: 12px
---

## Brand & Style
The design system is engineered for high-stakes industrial logistics and maritime operations. The brand personality is authoritative, precise, and high-tech, evoking the feeling of a modern "mission control" center. It targets port authorities, logistics directors, and heavy-machinery operators who require split-second decision-making capabilities.

The design style is **Corporate Modern with a High-Tech / Data-Visual** edge. It utilizes a deep-space dark theme to reduce eye strain during long shifts, emphasizing critical data through luminous accents. The aesthetic relies on technical precision, subtle glassmorphism for data overlays, and a systematic hierarchy that prioritizes real-time telemetry over decorative elements.

## Colors
This design system utilizes a high-contrast dark palette designed for legibility in low-light environments.

- **Primary (Electric Blue):** Used for primary actions, active navigation states, and data focal points.
- **Secondary (Neon Green):** Reserved exclusively for pathfinding, active logistical routes, and "optimal" status indicators.
- **Tertiary (Semi-transparent Red):** Applied to occupied container slots, bottlenecks, and high-priority warnings. This color should maintain a 40-60% opacity when used as a fill to allow underlying grid lines to remain visible.
- **Neutral/Background:** The palette uses a deep navy-to-black gradient (`#020617` to `#0f172a`) to create a sense of infinite depth behind data visualizations.

## Typography
The typography system uses **Inter** for all UI controls and headings to ensure maximum readability and a professional tone. **JetBrains Mono** is introduced for telemetry, coordinates, and container IDs to reinforce the "industrial-tech" aesthetic and ensure numerical alignment in data tables.

Large display sizes are used sparingly for total throughput metrics. Labels and small data points use uppercase styling with increased letter spacing to ensure clarity when rendered against dark backgrounds.

## Layout & Spacing
The design system employs a **Fixed Dashboard Grid** model. The screen is divided into functional zones: a global navigation rail (64px), a primary visualization viewport (dynamic), and a secondary telemetry sidebar (320px).

- **Grid:** A 12-column system is used within the content panels.
- **Spacing Rhythm:** Based on a 4px baseline. Most components use 12px or 16px internal padding.
- **Responsiveness:** On desktop, the layout is a multi-pane split view. On tablet, the sidebar becomes a collapsible drawer. On mobile, the visualization is prioritized, with data summaries accessible via bottom-sheet interactions.

## Elevation & Depth
Hierarchy is established through **Tonal Layers** and **Glassmorphism**. 

- **Level 0 (Background):** Deepest navy (`#020617`).
- **Level 1 (Panels):** Surface color (`#1e293b`) with a 1px border of `rgba(255, 255, 255, 0.1)`.
- **Level 2 (Overlays):** 20px Backdrop blur with `rgba(15, 23, 42, 0.8)` fill. 
- **Shadows:** Avoid heavy dropshadows. Use a subtle blue-tinted glow (`0 4px 20px rgba(59, 130, 246, 0.15)`) for active elements to simulate illuminated hardware interfaces.

## Shapes
The shape language is **Soft** and systematic. A standard 4px radius (`0.25rem`) is used for most UI components (buttons, inputs, cards) to maintain a crisp, engineered look that is more approachable than sharp 0px corners but more professional than fully rounded elements.

Containers and major dashboard panels use the 8px (`0.5rem`) radius to distinguish structural boundaries from interactive components.

## Components
- **Buttons:** Primary buttons are solid Electric Blue with white text. Secondary buttons use a "ghost" style with an Electric Blue border.
- **Container Slots:** Rectangular units. Empty slots use a dashed 1px border. Occupied slots use a semi-transparent Red fill (`#ef4444` at 40%). High-priority slots use a pulsing glow animation.
- **Input Fields:** Dark background (`#0f172a`) with a 1px border. On focus, the border transitions to Electric Blue with a subtle outer glow.
- **Status Chips:** Small, condensed capsules using JetBrains Mono. Success/Active uses Neon Green text on a 10% opacity green background.
- **Data Tables:** Zebra striping is avoided; instead, use 1px horizontal dividers in `rgba(255,255,255,0.05)`. Hover states on rows should highlight in Primary Blue at 10% opacity.
- **Telemetry Gauges:** Circular or linear progress indicators using Neon Green for positive values and Electric Blue for neutral data.