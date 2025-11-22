# Regression Suite: Standard Application

**Priority:** High
**Prerequisites:** User is logged in, verified, and eligible (Status: Active).

## TC-009: Submit Standard Application (Happy Path)
**Objective:** Complete the 4-step manual application wizard.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to **Home**. Click "Apply" tile. | Navigates to Step 1: Contact Info. |
| 2 | **Step 1 (Contact):** Review pre-filled info. Click "Next". | Navigates to Step 2: Event Details. |
| 3 | **Step 2 (Event):** Select Event: "Flood". | |
| 4 | Select Event Date: Today's date. | |
| 5 | Set Power Loss: "Yes", Days: "3". | |
| 6 | Set Evacuated: "No". | |
| 7 | Click "Next". | Navigates to Step 3: Expenses. |
| 8 | **Step 3 (Expenses):** Enter "Food Spoilage": `500`. | |
| 9 | Enter "Meals": `100`. | |
| 10 | **Check:** Total | "Total Expenses" at top updates to `$600.00`. |
| 11 | Click "Next". | Navigates to Step 4: Agreements. |
| 12 | **Step 4 (Agreements):** Select "Yes" for Share Story. | |
| 13 | Select "Yes" for Additional Info. | |
| 14 | Click "Terms of Acceptance" link. | Modal opens with text. Close modal. |
| 15 | Check the "I acknowledge..." box. | |
| 16 | Click "Submit Application". | Loading state (Submitting...). Redirects to **Submission Success Page**. |
| 17 | **Check:** Success Page | Displays Application ID. "Go to My Profile" button is active after 3 seconds. |

## TC-010: Guard Rails - Ineligible User
**Objective:** Verify an ineligible user cannot access the application.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Log in as a user with "Verification Needed" status. | |
| 2 | Navigate to **Home**. | "Apply" and "AI Apply" tiles are grayed out/disabled. |
| 3 | Hover over "Apply". | Tooltip appears: "Class Verification required...". |
| 4 | **Attempt:** Manually type URL `/apply` in browser. | App redirects user back to Home Page (or blocks access). |
