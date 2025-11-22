# Regression Suite: Authentication

**Priority:** High
**Prerequisites:** Application is running (`npm run dev`).

## TC-001: New User Registration (Happy Path)
**Objective:** Verify a new user can create an account with a valid Fund Code.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to the root URL (Login Page). | Login page loads. "Sign In" button is visible. |
| 2 | Click "Sign Up" link. | Navigates to Register Page. |
| 3 | Enter First Name: `Test` | Field accepts input. |
| 4 | Enter Last Name: `User` | Field accepts input. |
| 5 | Enter Email: `test.user.[timestamp]@example.com` | Field accepts input. |
| 6 | Enter Password: `password123` | Field accepts masked input. |
| 7 | Enter Fund Code: `DOM` | Field accepts input. |
| 8 | Click "Sign Up". | Loading spinner appears briefly. User is redirected to the **Class Verification** page (since a new user is not verified yet). |
| 9 | **Check:** Sidebar/Header | User name "Welcome, Test" is displayed. Eligibility status shows "Verification Needed". |

## TC-002: User Login (Existing User)
**Objective:** Verify an existing user can log in.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to Login Page. | |
| 2 | Click the "E4E Relief Logo" (Secret Shortcut). | Fields auto-fill with admin credentials (or manually enter known user creds). |
| 3 | Click "Sign In". | Loading overlay appears ("Authenticating..."). User is redirected to **Home Page** (or Fund Portal if Admin). |

## TC-003: Forgot Password
**Objective:** Verify the forgot password flow triggers successfully.

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Navigate to Login Page. | |
| 2 | Click "Forgot password?". | Navigates to Forgot Password Page. |
| 3 | Enter Email: `valid.email@example.com` | |
| 4 | Click "Send Reset Link". | Success message appears: "If an account with that email exists...". Link to "Back to Sign In" is visible. |

## TC-004: Session Inactivity Timeout
**Objective:** Verify the user is warned and then logged out after inactivity.

*Note: For testing purposes, it may be easier to temporarily lower the `TIMEOUT_DURATION` in `components/SessionTimeoutHandler.tsx`.*

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Log in to the application. | User is on Home/Dashboard. |
| 2 | **Wait:** Remain inactive (no mouse movement or clicks) for 10 minutes. | **Warning Modal** appears: "Session Expiring". Shows countdown timer starting from 5:00. |
| 3 | **Test Extension:** Click "Extend Session". | Modal closes. User remains logged in. Timer resets. |
| 4 | **Wait:** Remain inactive for another 10 minutes (trigger warning again). | Warning Modal appears again. |
| 5 | **Wait:** Let the countdown timer reach 0:00 (Total 15 mins inactivity). | **Logout occurs.** User is redirected to the Login Page. |
| 6 | **Test Activity Reset:** Log back in. Move mouse/click periodically (e.g., every 5 mins). | Warning modal does *not* appear as long as activity is detected before the 10-minute threshold. |