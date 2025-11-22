# E4E Relief App v2.1 — User Guide

This guide will walk you through all the features of the E4E Relief application, from creating an account and applying for a grant to using the advanced AI tools and administrative features.

## Getting Started

### Registration, Sign In & Password Reset
-   **Sign In:** Open the app to the Sign In page. If you have an account, enter your credentials to begin.
-   **Register:** To create a new account, you will need your name, email, and a **Fund Code** provided by your employer or program.
-   **Forgot Password:** If you've forgotten your password, use the "Forgot password?" link on the Sign In page to receive a reset link via email.

<!--
**Screenshot:** Sign In Page
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Register Page
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Forgot Password Page
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->

### Secret Shortcuts (For Demo & Testing)
-   **On the Register page:** Click the E4E Relief logo to automatically fill in the form with randomly generated user data.
-   **On the Login page:** Click the E4E Relief logo to automatically fill in the credentials for the **admin user** (`admin@example.com`).

---

## Class Verification & The Relief Queue
After your first sign-in, you must complete a one-time verification to confirm your eligibility for your designated fund. The method depends on your employer's program configuration.

-   **Domain Verification**: Your account is automatically verified if your email address uses a company-approved domain.
-   **Roster Verification**: You will be asked to enter specific details like your Employee ID and date of birth, which are then matched against secure company records. You have a limited number of attempts.
-   **SSO Verification**: You will be prompted to log in with your company's Single Sign-On (SSO) to securely link your account.

### Relief Queue
If you are unable to successfully verify after the maximum number of attempts, you will be placed in the **Relief Queue**. This page provides support contact information and allows you to update your name (if it was entered incorrectly) before re-attempting verification with the same or a different fund code.

<!--
**Screenshot:** Class Verification - SSO View
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Class Verification - Roster View
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Class Verification - Success View
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Relief Queue Page (Verification Failed)
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->

---

## Main Dashboard (Home)
The home screen provides quick access to all major sections of the app. Your active fund is displayed at the top.

-   **Apply**: Start a traditional, form-based application. (This is only enabled if you are verified and eligible).
-   **AI Apply**: Start a new, conversational application guided by an AI assistant.
-   **Profile**: Manage your fund identities, view past applications, and update your personal details.
-   **Support**: Find contact information and answers to frequently asked questions.
-   **Donate**: Make a contribution to the relief fund.
-   **Fund Portal** (Admin only): Access the portal for administrative features.

<!--
**Screenshot:** Home Dashboard - Applicant View
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Home Dashboard - Admin View
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->

---

## Two Ways to Apply for Relief

You have two powerful options for submitting a new application.

### 1. The Standard Application Form ("Apply")
This is a guided, multi-step form where you manually enter your information. Your progress is saved as you complete each step. This is ideal for users who prefer a traditional form-filling experience.

### 2. The AI-Powered Application ("AI Apply")
This is a conversational experience where an AI assistant asks you questions one by one to complete your application. It's perfect for users who prefer a more guided, interactive process.

---

## The Standard Application Form

### Step 1: Profile, Contact & Address Details
This page is organized into collapsible sections.
-   **AI Application Starter**: You can start by describing your situation in your own words. The AI will parse the text and pre-fill as many fields as possible throughout the application.
-   **Manual Entry**: Fill out the form sections for your contact details, primary address, mailing address, and other personal information. The **Address Helper** can parse a pasted address to fill in the fields for you.

<!--
**Screenshot:** Apply Step 1 - AI Starter
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Apply Step 1 - Collapsed Sections with Notifications
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Apply Step 1 - Address Section with Flip Card
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->

### Step 2: Event Details
-   Select the type of disaster or hardship event from a list tailored to your fund.
-   Provide the date of the event and answer questions about power loss or evacuation.

<!--
**Screenshot:** Apply Step 2 - Event Details
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->

### Step 3: Expenses
-   Itemize your expenses based on predefined categories (e.g., Food Spoilage, Meals). All categories shown must have a value greater than zero.
-   The "Total Expenses" at the top automatically calculates your requested amount.
-   You can optionally upload receipts for each expense item.

<!--
**Screenshot:** Apply Step 3 - Expenses
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->

### Step 4: Agreements & Submission
-   Review and agree to the Terms of Acceptance.
-   Indicate your preferences for sharing your story.
-   Once you submit, your application is sent for an instant decision.

<!--
**Screenshot:** Apply Step 4 - Agreements & Submission
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->

### Submission Success
-   After submission, you will see a confirmation page with your unique Application ID. Your application will now appear on your Profile page.
  
<!--
**Screenshot:** Submission Success Page
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
---

## The AI-Powered Application ("AI Apply")

The AI Apply page offers a unique, conversational way to complete your application. An AI assistant will ask you for information step-by-step.

-   **Mobile View:** The interface is a familiar chat window. A "Show Progress" button at the bottom allows you to open a modal and see which questions are still needed.
-   **Desktop View:** The interface is a split screen, with the chat assistant on the left and a live-updating "Application Progress" pane on the right.

The process is divided into sections. The AI will guide you through each one in order:
1.  **Additional Details:** Asks for profile information like employment start date, household income, etc.
2.  **Event Details:** Asks about the disaster or hardship event.
3.  **Expenses:** Allows you to add expenses and upload receipts directly within the progress pane.
4.  **Agreements & Submission:** The final step to review terms and submit the application.

<!--
**Screenshot:** AI Apply Page
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** AI Apply - Mobile Progress Modal
- **Mobile:** [Placeholder for mobile screenshot URL]
-->
<!--
**Screenshot:** AI Apply - Desktop with Expenses section open
- **Desktop:** [Placeholder for desktop screenshot URL]
-->

---

## Managing Your Account

### Profile Page
The Profile page is your central hub for managing all aspects of your account, organized into collapsible sections.

-   **My Applications**: View a summary of your most recent submissions. Click "See All Applications" to navigate to a dedicated page with your full history.
-   **Fund Identities**: This crucial section allows you to manage your eligibility across different relief programs.
    -   **Switch Active Identity:** If you are eligible for multiple funds, you can switch which one is active here. The app content (grant limits, eligible events) will update accordingly.
    -   **Add New Identity:** If you have a new fund code, you can add and verify it here.
    -   **Re-verify:** If an identity failed verification, you can re-attempt it from this section.
-   **Update Information**: Update your contact info, addresses, and other personal details.

<!--
**Screenshot:** Profile Page - All Sections Collapsed
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Profile Page - Fund Identities Section Expanded
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Profile Page - Application Detail Modal
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->

### My Applications Page
This dedicated page shows your complete application history for the currently active fund. You can search your history by event, status, or date to quickly find what you're looking for.

<!--
**Screenshot:** My Applications Page
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->

---

## Support Center
The Support Center provides multiple ways to get help.
-   **Contact Info:** Find the support email and phone number.
-   **FAQs:** Get answers to frequently asked questions about the application process and donations.
-   **Payment Options:** Find detailed guides on how grant payments are disbursed in the U.S. and internationally.

<!--
**Screenshot:** Support Center Page
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->

---

## AI-Powered Features

### Relief Assistant (AI Chatbot)
The Relief Assistant is a general-purpose AI chatbot available via the floating widget on most pages. It can:
-   **Answer Questions**: Ask about the application process, eligibility criteria, or where to find information in the app.
-   **Update Your Profile**: Ask the assistant to update your information conversationally. For example: *"My new phone number is 555-867-5309."* The assistant will confirm the change and update your profile draft.

### AI Decisioning & Instant Grants
When you submit an application, it goes through a two-stage automated decisioning process for an instant result.
1.  **Rules Engine Evaluation**: The application is first checked against deterministic rules (e.g., Is the event date within 90 days? Does the amount exceed fund limits?).
2.  **AI Final Review**: The application and preliminary decision are sent to a Gemini model, which acts as a senior grant approver to make the final binding decision and provide an empathetic reason for the outcome.

---

## Fund Portal (For Admins)
Admins have access to the Fund Portal, a central hub for managing the relief program.

-   **Live Dashboard**: A real-time dashboard of key metrics pulling from the live database, including total grants awarded, application statuses, and top event types.
-   **Ticketing**: A simple system for viewing and managing support tickets.
-   **Program Details**: A summary of the configuration for the selected fund.
-   **Proxy Applications**: Submit an application on behalf of another employee. This page also shows a history of all proxy applications you have submitted.
-   **Token Usage**: An advanced analytics dashboard to monitor the usage and cost of the Gemini AI models across all features, complete with charts and a filterable table.

<!--
**Screenshot:** Fund Portal Main Page
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Live Dashboard Page
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Proxy Application Page
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
<!--
**Screenshot:** Token Usage Page
- **Mobile:** [Placeholder for mobile screenshot URL]
- **Desktop:** [Placeholder for desktop screenshot URL]
-->
