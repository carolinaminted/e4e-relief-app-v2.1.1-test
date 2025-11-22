# Regression Suite: Profile Management

**Priority:** Medium
**Prerequisites:** User is logged in.

## TC-007: Complete Profile & Address Flip Card
**Objective:** Verify user can fill out profile details and interact with the address UI.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to **Profile Page**. | Sections (Contact, Addresses, etc.) are collapsed or partially expanded. |
| 2 | Expand "Contact Information". | Fields (First Name, Last Name, Mobile) are visible. |
| 3 | Enter Mobile Number: `5551234567`. | Format auto-corrects to `(555) 123-4567`. |
| 4 | Expand "Addresses". | "Primary Address" card is visible. |
| 5 | **Interaction:** Address Helper | Expand "Let AI fill in fields". Paste: `1600 Amphitheatre Pkwy, Mountain View, CA 94043`. Click Submit. |
| 6 | **Check:** Auto-fill | Country, Street, City, State, Zip fields populate correctly. |
| 7 | Toggle "Mailing Address Same as Primary?" to **No**. | Address card flips to back side ("Mailing Address"). |
| 8 | Fill out Mailing Address fields manually. | Fields accept input. |
| 9 | Expand "Additional Details". | Fill out Employment Date, Income, Household Size. |
| 10 | Expand "Consent". | Check all 3 boxes. |
| 11 | Click "Save Changes". | Success alert/toast: "Profile saved!". Red error indicators (if any) disappear. |

## TC-008: Fund Identity Management
**Objective:** Verify user can add a second fund identity and switch between them.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to **Profile Page**. | |
| 2 | Expand "Fund Identities". | Current identity is listed as (Active). |
| 3 | Click "+ Add New Identity". | Input field appears. |
| 4 | Enter Fund Code: `ROST` and click "Verify". | Redirects to Class Verification page for ROST fund. |
| 5 | Complete Verification (See TC-005). | Redirects to Home. |
| 6 | Return to Profile > Fund Identities. | Both identities (DOM and ROST) are listed. ROST is now Active. |
| 7 | Click "Set Active" on the previous identity. | Page reloads/updates. Active badge moves to the selected identity. Home page title updates to reflect the active fund. |
