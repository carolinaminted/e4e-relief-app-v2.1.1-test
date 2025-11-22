# Regression Suite: Class Verification

**Priority:** High
**Prerequisites:** User is logged in but *not* verified (Status: Inactive/Unknown).

## TC-004: Domain Verification (Happy Path)
**Context:** User registered with `fundCode: DOM` (Configured for Domain verification).

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Ensure user email domain matches config (e.g., `@example.com`). | |
| 2 | Navigate to Class Verification Page (automatically directed after registration). | Page title: "Verifying with Company Email Domain". |
| 3 | Wait for auto-check (2-3 seconds). | Success message: "Domain verified!". |
| 4 | **Check:** Redirection | Application redirects to **Home Page**. |
| 5 | **Check:** Status | Eligibility indicator in sidebar/header now shows "Eligible" (Green). |

## TC-005: Roster Verification (Happy Path)
**Context:** User registered with `fundCode: ROST` (Configured for Roster verification).

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to Class Verification Page. | Page title: "Verify Your Status". Form requests Employee ID and DOB. |
| 2 | Enter Employee ID: `1` | |
| 3 | Enter Birth Month: `1` | |
| 4 | Enter Birth Day: `1` | |
| 5 | Click "Verify". | Success message: "Verification Complete!". "Next" button appears. |
| 6 | Click "Next". | Redirects to Home Page. Status is "Eligible". |

## TC-006: Verification Failure & Relief Queue
**Context:** User registered with any code, but provides wrong info 3 times.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to Class Verification Page. | |
| 2 | Enter incorrect information (or fail domain check). | Error message appears. Attempt counter increases. |
| 3 | Repeat failure 3 times. | System redirects to **Relief Queue Page**. |
| 4 | **Check:** Relief Queue UI | "Relief Queue" title visible. Support phone/email visible. Form to update First/Last name is visible. |
| 5 | Update First Name to "CorrectedName" and click "Save Changes". | "Saved!" toast appears. |
| 6 | Click "Re-attempt Verification". | User is taken back to verification start screen. |
