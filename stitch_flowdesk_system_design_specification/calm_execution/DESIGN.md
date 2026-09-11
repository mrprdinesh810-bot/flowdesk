---
name: Calm Execution
colors:
  surface: '#f8f9ff'
  surface-dim: '#d8dae1'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3fa'
  surface-container: '#ecedf5'
  surface-container-high: '#e6e8ef'
  surface-container-highest: '#e1e2e9'
  on-surface: '#191c21'
  on-surface-variant: '#464555'
  inverse-surface: '#2e3036'
  inverse-on-surface: '#eff0f8'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#575f6b'
  on-secondary: '#ffffff'
  secondary-container: '#d8e0ee'
  on-secondary-container: '#5b636f'
  tertiary: '#005522'
  on-tertiary: '#ffffff'
  tertiary-container: '#00702f'
  on-tertiary-container: '#78f591'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dbe3f1'
  secondary-fixed-dim: '#bfc7d5'
  on-secondary-fixed: '#141c26'
  on-secondary-fixed-variant: '#3f4753'
  tertiary-fixed: '#7ffc97'
  tertiary-fixed-dim: '#62df7d'
  on-tertiary-fixed: '#002109'
  on-tertiary-fixed-variant: '#005320'
  background: '#f8f9ff'
  on-background: '#191c21'
  surface-variant: '#e1e2e9'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: -0.01em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.02em
  display-timer:
    fontFamily: JetBrains Mono
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 60px
    letterSpacing: -0.04em
  display-timer-mobile:
    fontFamily: JetBrains Mono
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.03em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 3rem
  gutter-mobile: 1rem
  gutter-tablet: 1.5rem
  gutter-desktop: 1.5rem
  margin-mobile: 1rem
  margin-tablet: 2rem
  margin-desktop: 2.5rem
---

## Brand & Style

This design system embodies the rigor, quiet authority, and precision of high-performance operating software. Crafted for knowledge workers, founders, and operators who require unyielding structure without visual noise, the aesthetic blends modern Swiss typography with crisp, utilitarian data density. 

The emotional tone is calm, composed, and decisive. Interaction models emphasize an intentional separation between **Deliberation** (AI Proposed state) and **Execution** (Approved Fixed state). Visual distractions, decorative gradients, and frivolous micro-animations are stripped away in favor of high-contrast typographic hierarchy, strict priority telemetry, and purposeful border structures.

## Colors

The color system is divided into structural foundations, actionable states, and deterministic priority tokens.

### Foundation & Neutrals
- **Canvas / Background**: `#F7F8FA`
- **Card Surface**: `#FFFFFF`
- **Subtle Surface / Elevated Well**: `#F1F3F6`
- **Border Default**: `#E2E5E9`
- **Border Subtle**: `#EDF0F3`
- **Border Strong / Focused**: `#CBD1D8`
- **Text Primary**: `#171A1F`
- **Text Secondary**: `#5E6672`
- **Text Muted / Placeholder**: `#8D96A5`

### Functional Brand & Action
- **Primary Indigo**: `#4F46E5`
- **Primary Hover**: `#4338CA`
- **Primary Active**: `#3730A3`
- **Primary Soft / Surface Tint**: `#EEF2FF`

### Priority Matrix Tokens
Priority tokens must never be used decoratively; they signify operational urgency.
- **P1 Critical**: `#DC2626` | Soft Background: `#FEF2F2` | Border: `#FCA5A5`
- **P2 High Value**: `#EA580C` | Soft Background: `#FFF7ED` | Border: `#FDBA74`
- **P3 Useful**: `#CA8A04` | Soft Background: `#FEFCE8` | Border: `#FDE047`
- **P4 Low Value**: `#16A34A` | Soft Background: `#F0FDF4` | Border: `#86EFAC`

### Execution & Operational States
- **Running (Live Focus)**: `#4F46E5`
- **Success / Complete**: `#16A34A`
- **Warning / Blocked**: `#D97706`
- **Error / Deviated**: `#DC2626`

### State Architecture: AI Proposed vs. Approved Fixed
- **AI Proposed (Review Mode)**: Denoted by an amber/slate dashed or ghosted contour (`#CBD1D8` dashed border), soft warm tinting `#FBFBFD`, and distinct contextual actions centered around `FIX PLAN`.
- **Approved Fixed (Execution Mode)**: Crisp `#E2E5E9` solid border with `#4F46E5` primary interaction cues, locked parameters, and prominent `START` triggers.

## Typography

Typography prioritizes hyper-legible metrics and distraction-free clarity. 

- **Geist** handles structural UI prose, headlines, and general layout content with balanced neutral grotesque geometry.
- **JetBrains Mono** is reserved exclusively for tabular numbers, real-time focus timers, status tags, keyboard shortcut badges, and priority indicators to ensure instant, unambiguous scannability.

All numerical outputs (timers, counts, completion percentages) must feature tabular lining figures (`tnum`) to eliminate layout reflow during real-time tick operations.

## Layout & Spacing

The layout is built on an exact 4px/8px rhythm optimized for high-information-density workspaces.

### Grid & Frame System
- **Desktop (1200px+)**: 12-column dynamic grid, fixed maximum width of `1440px`, 24px gutters, 40px margins. Layout utilizes a 3-zone cockpit view: Nav Rail (64px/240px collapsable), Command & Session Timeline (span 7-8), and Live Telemetry/Queue Inspector (span 4-5).
- **Tablet (768px - 1199px)**: 8-column layout, 24px gutters, 32px margins. Queue inspector reflows to a sliding bottom sheet or secondary tabbed tier.
- **Mobile (&lt;768px)**: 4-column layout, 16px gutters, 16px margins. Focused vertical stack where current running session stays pinned to the header, followed by immediate execution steps.

Padding inside control items follows fixed vertical/horizontal distributions:
- **Buttons / Inputs (Default)**: 10px vertical, 14px horizontal.
- **Micro Tags / Chips**: 4px vertical, 8px horizontal.
- **Cards / Containers**: 16px to 20px uniform internal padding.

## Elevation & Depth

This system avoids expressive drop shadows in favor of low-contrast functional outlines and clinical surface stepping. Spatial separation is achieved through precise border definitions and restrained ambient occlusion.

- **Base Floor**: `#F7F8FA` background canvas with zero elevation.
- **Level 1 (Card & Modular Panels)**: `#FFFFFF` surface resting on a strict `1px solid #E2E5E9` stroke. Ambient shadow: `0 1px 2px 0 rgba(23, 26, 31, 0.04)`.
- **Level 2 (Dropdowns, Floating Palettes, Active Dragging)**: `#FFFFFF` surface with `1px solid #CBD1D8` stroke. Ambient shadow: `0 4px 12px 0 rgba(23, 26, 31, 0.08)`.
- **Level 3 (Modal Dialogues & Focus Overlays)**: `#FFFFFF` surface with `1px solid #CBD1D8` stroke. Ambient shadow: `0 12px 32px 0 rgba(23, 26, 31, 0.12)`.
- **Inset Wells (Session Trackers / Chrono Strips)**: `#F1F3F6` surface with `1px solid #E2E5E9` inner border, removing all drop shadows to present a recessed physical container.

## Shapes

The geometric hierarchy maintains absolute consistency between actionable controls and containment surfaces:

- **Interactive Controls (Buttons, Inputs, Badges, Tabs)**: Defined with an 8px to 10px corner radius (`rounded-md`), providing tactile definition without feeling playful.
- **Containers & Blocks (Cards, Dashboard Modules, Command Panels)**: Defined with a 12px to 16px corner radius (`rounded-lg` / `rounded-xl`).
- **Focus Rings**: An offset of 2px with an inner gap of 2px using Indigo `#4F46E5` for focus visibility.

## Components

### 1. Buttons & Triggers
- **Primary Execution CTA (`START`)**: High-contrast Indigo solid background (`#4F46E5`), text `#FFFFFF`, 10px 18px padding, 8px border-radius, font-weight 500 Geist. Hover: `#4338CA`. Active: `#3730A3`.
- **Proposed Modification CTA (`FIX PLAN`)**: Secondary state styling with active intent: `#EEF2FF` background, `#4F46E5` text, and `1px solid #C7D2FE`. Hover: `#E0E7FF`.
- **Secondary / Utility**: Surface `#FFFFFF`, text `#171A1F`, `1px solid #E2E5E9`. Hover: `#F7F8FA`, border `#CBD1D8`.
- **Destructive**: Surface `#FEF2F2`, text `#DC2626`, `1px solid #FCA5A5`. Hover: `#DC2626`, text `#FFFFFF`.

### 2. Cards & Status Containers
- **Approved Card (Execution Mode)**: Flat `#FFFFFF` surface, `1px solid #E2E5E9` border, 14px radius. Status line on top edge or left border indicates running state.
- **AI Proposed Card (Draft Mode)**: Flat `#FFFFFF` surface with an amber-tinted or slate-dashed boundary (`1.5px dashed #CBD1D8`). Includes an inline metadata header indicating "AI Proposal — Unconfirmed" and contextual buttons: `FIX PLAN` and `APPROVE`.

### 3. Priority Chips (P1 – P4)
Rendered exclusively in monospaced uppercase format (`label-sm`):
- **P1 Critical**: Background `#FEF2F2`, border `1px solid #FCA5A5`, text `#DC2626`, label `P1 CRITICAL`.
- **P2 High Value**: Background `#FFF7ED`, border `1px solid #FDBA74`, text `#EA580C`, label `P2 HIGH`.
- **P3 Useful**: Background `#FEFCE8`, border `1px solid #FDE047`, text `#CA8A04`, label `P3 USEFUL`.
- **P4 Low Value**: Background `#F0FDF4`, border `1px solid #86EFAC`, text `#16A34A`, label `P4 LOW`.

### 4. Input Fields
- Height: 40px standard.
- Surface: `#FFFFFF`, border: `1px solid #E2E5E9`, radius: 8px.
- Typography: `body-md` (`#171A1F`), placeholder: `#8D96A5`.
- Focus state: Border transitions to `#4F46E5` with `0 0 0 3px #EEF2FF` outer glow.

### 5. Checkboxes & Radio Selection
- Checkbox: 18x18px, 4px radius, `1.5px solid #CBD1D8`. Checked state: `#4F46E5` background, `#FFFFFF` checkmark icon.
- Radio: 18x18px circular, `1.5px solid #CBD1D8`. Selected state: `#4F46E5` outer rim with centered 6px solid dot.

### 6. Timer & Telemetry Modules
- Recessed timer module with `#F1F3F6` background, `1px solid #E2E5E9` border, 12px radius.
- Real-time display powered by `display-timer` (`JetBrains Mono`, 56px, tabular figures).
- Integrated operational status pill: Small circular 6px pulsing dot (Running `#4F46E5`, Paused `#D97706`).