---
name: Clinical Grayscale Blueprint
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#45464c'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#555f6d'
  on-secondary: '#ffffff'
  secondary-container: '#d6e0f1'
  on-secondary-container: '#596372'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#261906'
  on-tertiary-container: '#968065'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#d9e3f4'
  secondary-fixed-dim: '#bdc7d8'
  on-secondary-fixed: '#121c28'
  on-secondary-fixed-variant: '#3e4755'
  tertiary-fixed: '#f9debf'
  tertiary-fixed-dim: '#dcc2a4'
  on-tertiary-fixed: '#261906'
  on-tertiary-fixed-variant: '#55442d'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style
The design system establishes a focused, high-clarity operational environment for clinical management. Geared toward medical administrators, triage personnel, and private clinic staff, it prioritizes cognitive ergonomics, speed of intake, and zero visual friction. 

The aesthetic is strictly Functional Minimalist Wireframe: deliberate, restrained, and purposeful. By withholding chromatic distractions, the interface exposes structural hierarchy, workflow status, and information density with institutional authority. Data legibility and operational clarity supersede visual embellishment.

## Colors
The palette operates exclusively within a calibrated grayscale spectrum to maintain mid-fidelity architectural neutrality while preserving high WCAG AAA contrast ratios.

- **Canvas & Surface Base:** Deep neutral canvas (`#f8f9fa`) with pure card containers (`#ffffff`) and utility grouping fills (`#f1f3f5`).
- **Dividers & Structure:** Architectural hairline borders (`#e5e7eb`) stepping up to active containment strokes (`#d1d5db`).
- **Typography & Icons:** Primary data and critical headers anchor at `#111827`. Sub-labels, table metadata, and descriptions calibrate to `#374151` and `#4b5563`. Subtle captions and placeholders rest at `#6b7280`.
- **System States & Error Feedback:** Error states refrain from chromatic red; instead, they command attention using high-contrast solid dark stroke emphasis (`#111827` at 2px), subtle tinted fills (`#f1f3f5`), and structured iconography with bold contextual copy. Warning and active states utilize filled neutral badges and inverted contrast treatments.

## Typography
The system standardizes on `Inter` across all text hierarchies to ensure clinical precision, tabular numerical alignment, and rapid optical scanning.

- **Headlines:** Display and section heads prioritize negative tracking (`-0.01em` to `-0.02em`) to ground content dashboards without decorative weight.
- **Data & Tables:** Body sizes (`body-md` at 14px) drive the bulk of clinical tables, patient registers, and timeline elements, pairing with tabular lining figures (`font-variant-numeric: tabular-nums`) for medical dosages, timestamps, and triage metrics.
- **Labels:** Micro-copy, metadata headers, and status pill badges utilize tight uppercase or semi-bold metrics to guarantee unambiguous readability across dense grid arrangements.

## Layout & Spacing
The layout architecture is anchored to a structured 12-column desktop grid optimized for 1440px workstations, standardizing clinical workstation displays.

- **Grid Architecture:** 12 columns with 24px (`1.5rem`) gutters and a fixed 32px (`2rem`) page margin. Max-width constraints lock at 1440px to prevent visual drift on ultra-wide screens.
- **Horizontal Split Logic:** Navigation rails anchor to a fixed 260px left sidebar, leaving the remaining canvas to fluid modular content panels.
- **Rhythm & Flow:** Density leans compact-to-comfortable. Clinical data blocks utilize internal 16px (`1rem`) padding, with 24px (`1.5rem`) gaps separating card modules. Dense data tables reduce row vertical padding to 8px (`0.5rem`).

## Elevation & Depth
Depth is created through strict structural containment and subtle surface layering rather than dramatic drop shadows.

- **Primary Structure (Level 0):** Application backdrop `#f8f9fa`.
- **Card Surfaces (Level 1):** Solid `#ffffff` backed by a 1px uniform outline of `#e5e7eb`. Ambient elevation is minimal and ultra-diffused: `0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)`.
- **Active / Focused Flyouts (Level 2):** Dropdowns, modals, and patient flyout drawers use `#ffffff` encased in a `#d1d5db` stroke with structured ambient shadowing: `0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04)`.
- **Inverted Focus:** Modals and scrim layers leverage a neutral gray translucent veil (`rgba(17, 24, 39, 0.35)`) with backdrop blur (`blur(2px)`) to direct focus exclusively onto data capture dialogs.

## Shapes
Geometry is disciplined, utilitarian, and architecturally square with soft corners (`roundedness: 1`). 

- **Containers & Cards:** 6px to 8px radius (`0.375rem` - `0.5rem`) on parent cards, preventing harsh brutalist edges while maintaining an analytical, medical tone.
- **Controls & Form Elements:** 4px radius (`0.25rem`) on input fields, buttons, and table rows to maximize functional target efficiency.
- **Badges & Indicators:** Pill shapes are avoided for structural widgets; instead, compact 4px rounded rectangles hold patient tags, bed identifiers, and status codes.

## Components

### Buttons
- **Primary:** Solid `#111827` fill, `#ffffff` text, 4px border radius. Hover transitions to `#374151`.
- **Secondary / Outlined:** 1px stroke `#d1d5db`, `#ffffff` surface, `#111827` text. Hover fills to `#f1f3f5`.
- **Ghost:** No border, transparent background, `#4b5563` text. Hover applies `#f1f3f5`.
- **Height Scale:** Primary actions at 36px height; compact table inline actions at 28px height.

### Input Fields & Controls
- **Standard Input:** `#ffffff` surface, 1px border `#d1d5db`, 4px radius, 14px text in `#111827`. Placeholder in `#6b7280`. Focused state switches border to `#111827` with 1px outline.
- **Error State:** Border shifts to bold 2px `#111827` with accompanying `#374151` warning glyph and an italicized `#4b5563` descriptor below the field.
- **Checkboxes & Radios:** 16px square or circular check targets with 1px `#d1d5db` stroke. Checked state renders a solid `#111827` fill with white `#ffffff` indicator glyph.

### Cards & Clinical Containers
- **Structure:** `#ffffff` background with 1px hairline `#e5e7eb` stroke and subtle 6px corner radius.
- **Header:** Card headers include a bottom 1px divider `#f1f3f5`, 16px padding, pairing a bold `headline-sm` with optional status chips.

### Chips & Status Badges
- **Neutral Idle:** Background `#f1f3f5`, text `#374151`, border `#e5e7eb`.
- **Active / Occupied:** Background `#111827`, text `#ffffff`.
- **Attention / Pending:** Background `#ffffff`, text `#111827`, border 1px solid `#111827`.

### Tables & Data Grids
- **Header Row:** Background `#f8f9fa`, bottom border 1px `#d1d5db`, uppercase 11px `label-sm` text in `#4b5563`.
- **Rows:** Alternating subtle hover states (`#f8f9fa`), cell padding 10px vertical by 16px horizontal, bottom divider 1px `#e5e7eb`. Numbers aligned right with tabular figures.

### Specialized Clinical Widgets
- **Room / Bed Status Card:** Distinct segmented block detailing bed ID, patient admission initials, timestamp, and attending physician, utilizing high-contrast monospace coordinates.
- **Triage Indicator:** Grayscale scale using numeric dots (1 to 5) or fill-intensity bars (e.g., 20%, 40%, 60%, 80%, 100% solid charcoal) to indicate severity without relying on color.