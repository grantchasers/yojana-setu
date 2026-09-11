---
name: Institutional Dignity
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#42474e'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#72777e'
  outline-variant: '#c2c7ce'
  surface-tint: '#396285'
  primary: '#00263f'
  on-primary: '#ffffff'
  primary-container: '#0b3c5d'
  on-primary-container: '#7fa7cd'
  inverse-primary: '#a3cbf2'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#002b0f'
  on-tertiary: '#ffffff'
  tertiary-container: '#00431b'
  on-tertiary-container: '#55b66c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cee5ff'
  primary-fixed-dim: '#a3cbf2'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#1f4a6c'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#95f8a7'
  tertiary-fixed-dim: '#79db8d'
  on-tertiary-fixed: '#00210a'
  on-tertiary-fixed-variant: '#005323'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Noto Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Noto Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Noto Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 38px
  headline-lg-mobile:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Noto Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 26px
  title-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  title-sm:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Noto Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Noto Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system embodies the authority, clarity, and empathy required of a high-impact public service platform. Designed for marginalized entrepreneurs, community facilitators, and field officers navigating government-backed microfinance and welfare schemes, the visual architecture avoids decorative distractions. Instead, it projects reliability, digital sovereignty, and accessibility under varied real-world conditions—including low-end mobile hardware, outdoor glare, and multilingual reading contexts.

The design movement combines **Material Design 3 (Institutional Variant)** with **High-Legibility Civic Utility**:
- **Dignified & Bureaucratic without Friction:** UI elements feel official, audited, and trustworthy. There are no gimmicks, floating 3D elements, or frivolous animations.
- **Cognitive Ease:** Layouts prioritize explicit labels over abstract iconography, avoiding technical jargon and ambiguous metaphors.
- **Multilingual Accommodation:** Every surface and vertical rhythm accommodates the structural heights, ascenders, and descenders of both Latin and Indic scripts (notably Devanagari) without clipping or cramped line boxes.
- **Zero Glassmorphism or Conversational Bubbles:** AI matches and recommendations are displayed as structured criteria cards, eligibility scores, and clear decision breakdowns—never as disposable chat bubbles.

## Colors

The color system delivers AAA-level visual contrast across government digital touchpoints. The primary brand color (#0B3C5D) anchors headers, primary app bars, and high-trust structural chrome. Saffron/Golden Amber (#D97706) is used with restraint for high-priority calls to action, pending status indicators, and verified eligibility badges. 

### Surface Tiers & Tokens

#### Light Mode (Default)
- **Background Canvas:** `#F8FAFC` (Slate 50)
- **Surface Level 1 (Cards, Modules):** `#FFFFFF` (Pure White)
- **Surface Level 2 (Sub-sections, Tables, Secondary cards):** `#F1F5F9` (Slate 100)
- **Surface Level 3 (Input wells, Inactive states):** `#E2E8F0` (Slate 200)
- **Text Primary:** `#0F172A` (Slate 900) — Contrast ratio > 12:1 against light surfaces
- **Text Secondary:** `#334155` (Slate 700) — Contrast ratio > 7:1 against light surfaces
- **Text Muted / Field Guides:** `#475569` (Slate 600)
- **Outline / Dividers:** `#CBD5E1` (Slate 300)

#### Dark Mode
- **Background Canvas:** `#09101D` (Deep Civic Obsidian)
- **Surface Level 1 (Cards, Modules):** `#0F172A` (Slate 900)
- **Surface Level 2 (Sub-sections, Tables):** `#1E293B` (Slate 800)
- **Surface Level 3 (Input wells):** `#334155` (Slate 700)
- **Text Primary:** `#F8FAFC` (Slate 50)
- **Text Secondary:** `#E2E8F0` (Slate 200)
- **Text Muted / Field Guides:** `#94A3B8` (Slate 400)
- **Outline / Dividers:** `#334155` (Slate 700)

#### Functional Accents
- **Success / Sanctioned / Disbursed:** `#15803D` (Forest Emerald) | Light wash: `#DCFCE7`
- **Warning / Limited Quota / Action Required:** `#B45309` (Amber) | Light wash: `#FEF3C7`
- **Critical / Ineligible / Document Rejected:** `#B91C1C` (Crimson) | Light wash: `#FEE2E2`
- **Informational / In Review:** `#1D4ED8` (Cobalt) | Light wash: `#DBEAFE`

## Typography

Typography is powered by **Noto Sans** across all roles, ensuring native script harmony between Latin and Devanagari. Indic typography requires approximately 10–15% more vertical clearance than pure Latin text to account for complex matras (vowel signs), conjuncts, and upper/lower diacritics.

### Script & Rendering Principles
- **Generous Vertical Breathing Room:** Line-height multipliers are held at a minimum of `1.5x` for body copy and `1.3x` to `1.4x` for headlines, preventing conjunct-collision when rendering Hindi, Marathi, or bilingual text blocks.
- **Numbers and Financial Figures:** All currency numerals use tabular lining properties (`font-feature-settings: "tnum" 1`) to preserve alignment across tabular loan allocations, interest rates, and subsidy percentages.
- **Font Fallbacks:** `Noto Sans Devanagari, Noto Sans, system-ui, -apple-system, sans-serif`.
- **Text Scaling Protection:** UI containers must never have hardcoded heights that prevent two-line reflow when users increase accessibility font scale on Android or Web browsers.

## Layout & Spacing

The layout model implements a strict 8pt base grid with a 4pt sub-grid for tight inline alignments. Screen layouts rely on a hybrid responsive grid calibrated for field tablets and handheld smartphones.

### Screen Adapters & Breakpoints
- **Compact (Mobile, < 600px):** 4-column layout. Margin: `1rem` (16px), Gutter: `1rem` (16px). Bottom sheets replace complex modals; sticky bottom action bars anchor key decision points.
- **Medium (Tablet & Kiosk, 600px - 1023px):** 8-column layout. Margin: `2rem` (32px), Gutter: `1.5rem` (24px). Split-screen side-by-side verification (e.g., Application details next to AI scheme match criteria).
- **Expanded (Desktop / Backoffice, >= 1024px):** 12-column layout. Maximum content container width of `1280px` centered. Margin: `3rem` (48px), Gutter: `2rem` (32px).

### Layout Rules
- **Touch Safe Boundaries:** Every interactive target maintains a minimum footprint of 48px by 48px, surrounded by at least `0.5rem` (space-sm) separation to prevent accidental taps by users with motor impairments or those using ruggedized, thick-case devices.
- **Stack Consistency:** Form controls, verification lists, and status trackers always flow vertically with `1.5rem` (space-lg) standard rhythm between semantic groups.

## Elevation & Depth

Visual hierarchy uses Material 3 tonal elevation accompanied by crisp, low-contrast structural outlines. Harsh dropshadows, blurred glass surfaces, and floating skeuomorphic bevels are strictly omitted to maintain clarity under low-brightness panels and high-ambient outdoor sunlight.

### Elevation Hierarchy
- **Level 0 (Base / Canvas):** 0px offset. Background canvas `#F8FAFC` (Dark: `#09101D`). Border: none.
- **Level 1 (Default Card / Scheme Containers):** Flat surface `#FFFFFF` (Dark: `#0F172A`) framed by a 1px structural outline of `#CBD5E1` (Dark: `#334155`). Shadow: `0px 1px 3px rgba(15, 23, 42, 0.06), 0px 1px 2px rgba(15, 23, 42, 0.04)`.
- **Level 2 (Hover / Active Scheme Card / Top Navigation):** Surface `#FFFFFF` (Dark: `#1E293B`). Shadow: `0px 4px 6px -1px rgba(15, 23, 42, 0.08), 0px 2px 4px -2px rgba(15, 23, 42, 0.04)`. Border: `#94A3B8` (Dark: `#475569`).
- **Level 3 (Sticky Action Bars / Floating Filter Bottom Sheets):** Surface `#FFFFFF` (Dark: `#1E293B`). Shadow: `0px 10px 15px -3px rgba(15, 23, 42, 0.1), 0px 4px 6px -4px rgba(15, 23, 42, 0.05)`.
- **Level 4 (Modal Dialogs / Confirmation Prompts):** Surface `#FFFFFF` (Dark: `#1E293B`). Shadow: `0px 20px 25px -5px rgba(15, 23, 42, 0.12)`. Scrim overlay: `#0F172A` at 60% opacity.

## Shapes

The design system employs **Soft (Level 1)** geometry, calibrated at `0.25rem` (4px) to `0.5rem` (8px). This creates an orderly, official aesthetic reminiscent of structured institutional forms, avoiding toy-like hyper-rounded or pill-shaped designs.

### Corner Radius Mapping
- **Buttons, Inputs, Select Menus:** `0.25rem` (4px). Instills structural precision.
- **Cards, Panels, Alert Callouts:** `0.5rem` (8px). Delivers a soft, modern civic container.
- **Modals, Bottom Sheets:** `0.75rem` (12px) top corners.
- **Status Badges & Category Chips:** `0.25rem` (4px). Never fully rounded pills; tags resemble crisp government seal stamps.

## Components

### Buttons
- **Primary Action (Scheme Application, Final Submit):** Solid background of Saffron Amber `#D97706` with white text `#FFFFFF` (or Institutional Navy `#0B3C5D` with white text for secondary global workflows). Height: 48px min. Corner radius: 4px. Bold text with clear leading icons.
- **Secondary / Outlined:** Transparent background, 1.5px solid `#0B3C5D` border, `#0B3C5D` text.
- **Destructive:** Solid `#B91C1C` with `#FFFFFF` text. Used exclusively for revoking or rejecting applications.

### Input Fields & Financial Controls
- **Currency Fields (Rupee Prefix):** Always rendered with an integrated, non-editable `₹` badge fixed inside the leading container (`#F1F5F9`), separated by a 1px border from the editable numeric field. Text is right-aligned or bold tabular numbers.
- **Field Anatomy:** 48px height, 1px solid border (`#94A3B8`). Active focus state: 2px ring in Navy Blue `#0B3C5D` with no blur.
- **Helper Text & Validation:** Multilingual helper text sits permanently below the input (never as disappearing placeholders). Error states include a high-contrast red icon and unambiguous corrective copy.

### Scheme Matching Cards
- **Structure:** Level 1 elevation container with 8px radius. 
- **Header:** Scheme title (bold, 18px), flanked by the issuing authority tag (e.g., `NBCFDC`, `NSFDC`, `MoSJE`).
- **Match Metric:** A dedicated high-contrast badge (e.g., "98% Match" in `#15803D` text on `#DCFCE7` background).
- **Core Parameters Grid:** 3-column micro-table inside the card indicating:
  1. Max Loan / Subsidy Amount (formatted as ₹X,XX,XXX)
  2. Interest Concession (%)
  3. Repayment Moratorium (Months)
- **Footer:** Explicit "Check Eligibility Details" link alongside a primary "Apply" button.

### Progress & Stepper Navigation
- **Linear Step Process:** Horizontal rail on desktop, numbered vertical milestone track on mobile.
- **Step States:**
  - *Completed:* Forest Green `#15803D` circle containing a solid white checkmark.
  - *Current:* Navy Blue `#0B3C5D` ring containing the step number in bold.
  - *Upcoming:* Slate `#E2E8F0` circle with `#64748B` numeral.
- **Labels:** Title and optional status (e.g., "Income Verification — Verified via Aadhaar") clearly displayed beneath or beside each node.

### Checkboxes, Radios, and Toggles
- **Hitbox:** Min 48px x 48px touch target surrounding a 20px x 20px visual glyph.
- **Selected States:** Solid `#0B3C5D` with white iconography.
- **Toggle Switches:** Used only for immediate binary system states (e.g., "Show only zero-collateral schemes"). Track is 44px x 24px with 20px thumb.

### Status Badges & Chips
- **Style:** Flat fill with subtle 1px border. Font size: 12px (label-md), 600 weight.
- **Verified:** Background `#DCFCE7`, border `#86EFAC`, text `#14532D`.
- **Under Scrutiny:** Background `#FEF3C7`, border `#FDE68A`, text `#78350F`.
- **Quota Full:** Background `#FEE2E2`, border `#FECACA`, text `#7F1D1D`.