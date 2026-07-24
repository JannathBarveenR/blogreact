# PetOlife MVP V2 — Required Image & Asset Specifications (`required-images.md`)

This document outlines all required image assets, aspect ratios, target resolutions, display behavior, and design guidelines for both **Desktop** and **Mobile** viewports across the PetOlife landing page and authentication module.

---

## 🎨 Global Image Asset Guidelines

- **Primary Image Format**: `WebP` (Next-gen compressed image format for fast FCP/LCP performance).
- **Secondary Image Format**: `PNG` (for transparent brand logos and icon overlays).
- **Target File Size**: **< 100 KB** per WebP image file for mobile web optimization.
- **Color Palette Alignment**:
  - Primary Forest Green: `#004b49` / `#004b23`
  - Accent Leaf Green: `#84b662`
  - Background Canvas: `#f2f9f1` (ultra-light mint green)

---

## 🖥️ Desktop Image & Asset Specification Matrix

| Component Section | Asset Key / File Path | Desktop Container Size | Aspect Ratio | Recommended Resolution | Object Fit | Notes & Overlays |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Navbar & Footer** | `logo-with-tagline.webp` | `height: 42px - 48px` | **4 : 1** (Landscape) | `800 × 200 px` | `contain` | Vector/WebP transparent background logo with tagline. |
| **Section 1: Hero** | `hero-pets-desk.webp` | `580px × 480px` | **16 : 10** or **4 : 3** | `1440 × 900 px` | `cover` | Hero pet illustration; accommodates top-right & bottom-left glassmorphic floating cards. |
| **Section 2: Empathy** | `problem-solution.webp` | `520px × 440px` | **4 : 3** | `1200 × 900 px` | `cover` | Right column illustration with bottom glass caption bar overlay. |
| **Section 3: Feature 1** | `health-timeline.webp` | `240px × 180px` | **16 : 9** | `800 × 450 px` | `cover` | AI Health Timeline UI preview card. |
| **Section 3: Feature 2** | `pet-health-banner.webp` | `240px × 180px` | **16 : 9** | `800 × 450 px` | `cover` | Smart Reminders UI preview banner. |
| **Section 3: Feature 3** | `health-records.webp` | `240px × 180px` | **16 : 9** | `800 × 450 px` | `cover` | 256-bit Encrypted Medical Vault UI preview card. |
| **Section 3: Feature 4** | `banner-bg.webp` | `240px × 180px` | **16 : 9** | `800 × 450 px` | `cover` | Instant Clinic QR Pass UI preview card. |
| **Auth / Login Modal** | `hero-pets-desk.webp` | `360px × 200px` | **16 : 10** | `800 × 500 px` | `contain` | Left mint green branding panel image inside 2-column landscape rectangle modal (`max-width: 960px`). |

---

## 📱 Mobile Image & Asset Specification Matrix (`@media (max-width: 768px)`)

| Component Section | Asset Key / File Path | Mobile Container Size | Aspect Ratio | Recommended Resolution | Display Mode & Behavior |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Navbar Header** | `logo-with-tagline.webp` | `height: 38px` | **4 : 1** | `800 × 200 px` | Top left navigation logo. |
| **Section 1: Hero Inline** | `hero-pets-desk.webp` (`.hero-mobile-image-src`) | `100% width × 120px height` | **Full-width Banner** | `1200 × 400 px` | Rendered inline immediately after headline *"Do you know when I was last vaccinated?"* with `object-fit: cover`. |
| **Section 2: Empathy Media** | `problem-solution.webp` | *Hidden* | N/A | N/A | Set to `display: none` on mobile to prevent vertical clutter. |
| **Section 3: Feature 2x2 Grid** | Feature card preview WebPs | `100% width × 120px height` | **16 : 9** | `800 × 450 px` | Stacked 1-column mobile feature cards with preview images. |
| **Auth / Login Modal** | `hero-pets-desk.webp` | *Hidden* | N/A | N/A | Left panel hidden on mobile to prioritize full-width form entry. |

---

## 📐 Detailed Breakdown by Component

### 1. Header & Navigation (`Navbar.jsx`)
- **Logo File**: `src/assets/logo-with-tagline.webp`
- **Desktop Dimensions**: Height `42px`
- **Mobile Dimensions**: Height `38px`
- **Aspect Ratio**: **4 : 1**

### 2. Section 1 — Hero (`HeroSection.jsx`)
- **Desktop Visual**: `hero-pets-desk.webp`
  - Container size: `580px × 480px`
  - Aspect Ratio: **16 : 10**
  - High DPI Resolution: `1440 × 900 px`
- **Mobile Visual**: `hero-pets-desk.webp` (`.hero-mobile-image-src`)
  - Render position: Placed inline directly below headline *"Do you know when I was last vaccinated?"*
  - Container size: `width: 100%; height: 120px;`
  - CSS rule: `object-fit: cover; object-position: center; border-radius: 14px;`

### 3. Section 2 — Empathy & Pet's Thoughts (`EmpathySection.jsx`)
- **Desktop Visual**: `problem-solution.webp`
  - Container size: `520px × 440px`
  - Aspect Ratio: **4 : 3**
- **Mobile Behavior**: Hidden on mobile (`display: none`) to optimize section height and focus on the 5 speech bubbles and primary CTA button.

### 4. Section 3 — Product 2x2 Grid (`ProductSection.jsx`)
- **Feature Card 1 (AI Health Timeline)**: `health-timeline.webp` (`800 × 450 px`, **16:9**)
- **Feature Card 2 (Smart Vaccine Reminders)**: `pet-health-banner.webp` (`800 × 450 px`, **16:9**)
- **Feature Card 3 (Secure Medical Vault)**: `health-records.webp` (`800 × 450 px`, **16:9**)
- **Feature Card 4 (Instant Clinic QR Pass)**: `banner-bg.webp` (`800 × 450 px`, **16:9**)

### 5. Authentication & Registration Modal (`Login.jsx`)
- **Branding Hero Visual**: `hero-pets-desk.webp`
  - Location: Left sidebar (`.login-left-banner`) inside the 2-column rectangular modal (`max-width: 960px`)
  - Container size: `360px × 200px`
  - Aspect Ratio: **16 : 10**

---

## ⚡ Performance Check list
- [x] All images exported in **WebP** format.
- [x] Images optimized under **100 KB** for mobile network efficiency.
- [x] Crisp rendering on 2x Retina & High-DPI screens.
- [x] Responsive CSS `object-fit: cover` and `object-fit: contain` applied appropriately across viewports.
