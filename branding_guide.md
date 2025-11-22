
# E4E Relief Branding Guide

This document outlines the color palettes and branding schemes used in the E4E Relief application. The application supports dynamic white-labeling where the color theme and logo adapt based on the user's active fund identity.

## 1. Default Theme (E4E Relief)

This is the standard branding used for the application shell, login pages, and users who do not have a specific fund identity selected.

| Element | Value | Preview |
| :--- | :--- | :--- |
| **Primary Background** | `#003a70` (PMS 654 Navy) | <div style="background-color: #003a70; width: 20px; height: 20px;"></div> |
| **Secondary Background** | `#004b8d` | <div style="background-color: #004b8d; width: 20px; height: 20px;"></div> |
| **Border** | `#005ca0` | <div style="background-color: #005ca0; width: 20px; height: 20px;"></div> |
| **Accent / Primary Button** | `#ff8400` (PMS 151 Orange) | <div style="background-color: #ff8400; width: 20px; height: 20px;"></div> |
| **Accent Hover** | `#e67700` | <div style="background-color: #e67700; width: 20px; height: 20px;"></div> |
| **Text Gradient Start** | `#ff8400` | <div style="background-color: #ff8400; width: 20px; height: 20px;"></div> |
| **Text Gradient End** | `#edda26` (PMS 604 Yellow) | <div style="background-color: #edda26; width: 20px; height: 20px;"></div> |

**Logo URL:** `https://gateway.pinata.cloud/ipfs/bafkreigagdtmj6mbd7wgrimtl2zh3ygorbcvv3cagofbyespbtfmpn2nqy`

---

## 2. Charizard Relief Fund (Fire Theme)

**Fund Code:** `ROST`
A bold, energetic palette inspired by fire and ember tones.

| Element | Value | Preview |
| :--- | :--- | :--- |
| **Primary Background** | `#0B1C33` (Charcoal Blue-Black) | <div style="background-color: #0B1C33; width: 20px; height: 20px;"></div> |
| **Secondary Background** | `#132030` (Off-Black) | <div style="background-color: #132030; width: 20px; height: 20px;"></div> |
| **Border** | `#C2341D` (Lava Red) | <div style="background-color: #C2341D; width: 20px; height: 20px;"></div> |
| **Accent / Primary Button** | `#F7691A` (Blaze Orange) | <div style="background-color: #F7691A; width: 20px; height: 20px;"></div> |
| **Accent Hover** | `#D6550F` | <div style="background-color: #D6550F; width: 20px; height: 20px;"></div> |
| **Text Gradient Start** | `#F7691A` | <div style="background-color: #F7691A; width: 20px; height: 20px;"></div> |
| **Text Gradient End** | `#FFB449` (Soft Ember Yellow) | <div style="background-color: #FFB449; width: 20px; height: 20px;"></div> |

**Logo URL:** `https://gateway.pinata.cloud/ipfs/bafkreidkigzbvxi3i5cjpkfmzrn2dtn4yw6sr2y6d65m3ztsbrg747y2ki`

---

## 3. Blastoise Relief Fund (Water Theme)

**Fund Code:** `DOM`
A calm, trustworthy palette using deep blues and aqua tones.

| Element | Value | Preview |
| :--- | :--- | :--- |
| **Primary Background** | `#003B73` (Deep Navy) | <div style="background-color: #003B73; width: 20px; height: 20px;"></div> |
| **Secondary Background** | `#1F2F47` (Muted Slate) | <div style="background-color: #1F2F47; width: 20px; height: 20px;"></div> |
| **Border** | `#79D0FF` (Shell Light Blue) | <div style="background-color: #79D0FF; width: 20px; height: 20px;"></div> |
| **Accent / Primary Button** | `#0BAFD9` (Aqua Surge) | <div style="background-color: #0BAFD9; width: 20px; height: 20px;"></div> |
| **Accent Hover** | `#0990B3` | <div style="background-color: #0990B3; width: 20px; height: 20px;"></div> |
| **Text Gradient Start** | `#0BAFD9` | <div style="background-color: #0BAFD9; width: 20px; height: 20px;"></div> |
| **Text Gradient End** | `#79D0FF` | <div style="background-color: #79D0FF; width: 20px; height: 20px;"></div> |

**Logo URL:** `https://gateway.pinata.cloud/ipfs/bafkreicjlkl435dnpvrn7fsgjjomfjrrgua2wg5o4y4saa476zo2zz7znq`

---

## 4. Venusaur Relief Fund (Grass Theme)

**Fund Code:** `SSO`
A grounded, accessible palette using forest and emerald greens.

| Element | Value | Preview |
| :--- | :--- | :--- |
| **Primary Background** | `#1C5F2C` (Forest Green) | <div style="background-color: #1C5F2C; width: 20px; height: 20px;"></div> |
| **Secondary Background** | `#153D22` (Deep Canopy) | <div style="background-color: #153D22; width: 20px; height: 20px;"></div> |
| **Border** | `#33A466` (Leaf Emerald) | <div style="background-color: #33A466; width: 20px; height: 20px;"></div> |
| **Accent / Primary Button** | `#33A466` (Leaf Emerald) | <div style="background-color: #33A466; width: 20px; height: 20px;"></div> |
| **Accent Hover** | `#298652` | <div style="background-color: #298652; width: 20px; height: 20px;"></div> |
| **Text Gradient Start** | `#33A466` | <div style="background-color: #33A466; width: 20px; height: 20px;"></div> |
| **Text Gradient End** | `#FF8FA3` (Blossom Pink) | <div style="background-color: #FF8FA3; width: 20px; height: 20px;"></div> |

**Logo URL:** `https://gateway.pinata.cloud/ipfs/bafkreigagdtmj6mbd7wgrimtl2zh3ygorbcvv3cagofbyespbtfmpn2nqy`

---

## Implementation Details

### Dynamic Theming Engine

The application uses CSS Custom Properties (Variables) to apply themes dynamically. The logic resides in `App.tsx`. When a user navigates to a themed page (Home, Profile, Support, Donate, etc.), the app checks their `activeFund` and injects the corresponding values into the `:root` scope.

**Key CSS Variables:**
*   `--theme-bg-primary`
*   `--theme-bg-secondary`
*   `--theme-border`
*   `--theme-accent`
*   `--theme-accent-hover`
*   `--theme-gradient-start`
*   `--theme-gradient-end`

**Logo Handling:**
The logo displayed in the Side Navigation and Mobile Header is also dynamic. It is passed as a prop (`logoUrl`) to these components, derived from the active `FundTheme` object.
