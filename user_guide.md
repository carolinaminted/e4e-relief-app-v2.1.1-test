# E4E Relief — User Guide

This guide will walk you through all the features of the E4E Relief application, from creating an account and applying for a grant to using the advanced AI tools and administrative features.

## Getting Started

### Registration & Sign In
-   Open the app and choose **Register** to create a new account or **Sign In** if you already have one.
-   When registering, you will need a **Fund Code** provided by your employer or program.


<img width="450" height="775" alt="E4E App v2 - Sign In Page" src="https://github.com/user-attachments/assets/05ddedce-5405-4f85-be1d-b922418ebc02" />
<img width="450" height="775" alt="E4E App v2 - Sign Up Page" src="https://github.com/user-attachments/assets/c8a954b0-e377-40e5-9402-02b11b155394" />


### Secret Shortcuts (For Demo & Testing)
-   **On the Register page:** Click the E4E Relief logo to automatically fill in the form with randomly generated user data.
-   **On the Login page:** Click the E4E Relief logo to automatically fill in the credentials for the **admin user** (`admin@example.com`).

---

## Class Verification
After your first sign-in, you must complete a one-time verification to confirm your eligibility for your designated fund. The method depends on your employer's program configuration.

-   **Domain Verification**: Your account is automatically verified if your email address (e.g., `you@company.com`) uses a company-approved domain.
-   **Roster Verification**: You will be asked to enter specific details like your Employee ID and date of birth, which are then matched against secure company records.
-   **SSO Verification**: You will be prompted to log in with your company's Single Sign-On (SSO) to securely link your E4E Relief account.

Once verified, you will have full access to the application. If your eligibility status is `Inactive`, you may need to complete this step to apply for relief.

<img width="450" height="775" alt="E4E App v2 - Class Verification - SSO" src="https://github.com/user-attachments/assets/e945d58f-c951-4340-8a9b-048405a11797" />
<img width="450" height="775" alt="E4E App v2 - Class Verification - Roster" src="https://github.com/user-attachments/assets/71cb83be-124f-4eaa-b147-b1e2e55d2164" />
<img width="450" height="775" alt="E4E App v2 - Class Verification - Success" src="https://github.com/user-attachments/assets/af3a2dee-3fc1-440e-b238-d448d28798a2" />
<img width="450" height="775" alt="E4E App v2 - Class Verification - Failure" src="https://github.com/user-attachments/assets/ca467629-9b98-41f9-acfa-8d539d3d4f11" />


---

## Main Dashboard (Home)
The home screen provides quick access to all major sections of the app.

-   **Apply**: Start a new application for financial assistance. (This is only enabled if your status is 'Active').
-   **Profile**: View past applications and update your personal details.
-   **Support**: Find contact information and answers to frequently asked questions.
-   **Donate**: Make a contribution to the relief fund.
-   **Dashboards** (Admin only): Access the Fund Portal for administrative features.


<img width="450" height="775" alt="E4E App v2 - Home - Applicant" src="https://github.com/user-attachments/assets/23d435f3-477a-45fa-a076-f156d0ee3bca" />
<img width="450" height="775" alt="image" src="https://github.com/user-attachments/assets/3e9d7cb6-7d86-4bae-b37f-631f7fd9c2e0" />

---

## Applying for Relief
The application is a guided, multi-step form. Your progress is saved as you move through the steps.

### Step 1: Contact, Address & Profile
-   **AI Application Starter**: You can start by describing your situation in your own words. The AI will parse the text and pre-fill as many fields as possible throughout the application, including your contact info, address, event details, and requested amount.
-   **Manual Entry**: You can fill out the form manually. The application is organized into collapsible sections for contact details, primary address, mailing address, and other personal information. The AI-powered **Address Helper** can parse a pasted address to fill in the fields for you.

<img width="450" height="775" alt="Apply for Relief - Page 1" src="https://github.com/user-attachments/assets/5928b358-f371-407f-91e1-7f16f8120141" />
<img width="450" height="775" alt="Apply for Relief - Page 1 - Lets Get Started" src="https://github.com/user-attachments/assets/a05390c6-f332-42b4-8f1b-e99de7135491" />
<img width="450" height="775" alt="Apply for Relief - Page 1 - Contact Information" src="https://github.com/user-attachments/assets/f6260da0-dfab-4b89-bf84-c1ae1a9a9677" />
<img width="450" height="775" alt="Apply for Relief - Page 1 - Primary Address" src="https://github.com/user-attachments/assets/80460c73-0580-4fcb-afed-85cfd5852950" />
<img width="450" height="775" alt="Apply for Relief - Page 1 - Mailing Address" src="https://github.com/user-attachments/assets/5892c21e-4394-49bd-916b-131357ceeba7" />
<img width="450" height="775" alt="Apply for Relief - Page 1 - Additional Details" src="https://github.com/user-attachments/assets/67d8d8f7-05ee-4941-b180-9a469f69ce39" />
<img width="450" height="775" alt="Apply for Relief - Page 1 - Consent   Acknowledgement" src="https://github.com/user-attachments/assets/2a80e086-507e-4b6b-9ec5-a67e109f2f78" />


### Step 2: Event Details
-   Select the type of disaster or hardship event.
-   Provide the date of the event, details about power loss or evacuation, and the amount you are requesting.

<img width="450" height="775" alt="Apply for Relief - Page 2 - Event Details" src="https://github.com/user-attachments/assets/98821cdd-8450-4592-a090-15e224a36275" />
<img width="450" height="775" alt="Apply for Relief - Page 2 - Event Details 2" src="https://github.com/user-attachments/assets/1b592599-fc1a-4082-9047-3b8c229f6b04" />


### Step 3: Expenses
-   Itemize your expenses based on predefined categories (e.g., Food Spoilage, Meals).
-   You can add, edit, or delete expenses. Receipts are optional but can be uploaded.

<img width="450" height="775" alt="Apply for Relief - Page 3 - Expenses" src="https://github.com/user-attachments/assets/a0ee2b88-dd11-445a-acd7-d0267820e18a" />
<img width="450" height="775" alt="Apply for Relief - Page 3 - Expenses 2" src="https://github.com/user-attachments/assets/8280498f-c6a1-4750-972d-083cfc0482c7" />
<img width="450" height="775" alt="Apply for Relief - Page 3 - Expenses Full" src="https://github.com/user-attachments/assets/99eec198-724c-4b39-acdd-9acd63def4eb" />


### Step 4: Agreements & Submission
-   Review and agree to the Terms of Acceptance.
-   Indicate your preferences for sharing your story and receiving additional information.
-   Once you submit, your application is sent for an instant decision.

<img width="450" height="775" alt="Apply for Relief - Page 4 - Terms   Conditions" src="https://github.com/user-attachments/assets/9c36a148-a2aa-4992-945f-dfd09753aecb" />
<img width="450" height="775" alt="Apply for Relief - Page 4 - Terms   Conditions 2" src="https://github.com/user-attachments/assets/c3b011e8-660f-492d-8844-8bb9e52a75e4" />
<img width="450" height="775" alt="Apply for Relief - Page 4 - Terms   Conditions 3" src="https://github.com/user-attachments/assets/a257ef8f-8786-4814-a7f7-3632c4a84b66" />


### Submission Success
-   After submission, you will see a confirmation page with your unique Application ID.
-   Your application will now appear in the "My Applications" section of your Profile page.

  
<img width="450" height="775" alt="Application Submitted Successfully" src="https://github.com/user-attachments/assets/52c0fceb-bc23-4c49-bb9a-d94043dd7216" />

---

## Managing Your Account

### Profile Page
-   **My Applications**: View a list of all your past submissions with their status (Submitted, Awarded, Declined). Click any application to see a detailed summary in a modal window.
-   **Grant Limits**: See your remaining 12-month and lifetime grant balances.
-   **Update Information**: All your personal details are organized in collapsible sections. You can update your contact info, addresses, employment details, and consent preferences here.
-   **See Eligiblity Status**: Active = Eligible to apply & Inactive = Additional verification required.
-   **See Fund Code**: Unique code provided by the employer


<img width="450" height="775" alt="Profile Page" src="https://github.com/user-attachments/assets/5dcbc6b5-455c-4860-8750-e84797a314b4" />
<img width="450" height="775" alt="Profile Page - Inactive" src="https://github.com/user-attachments/assets/2820dc0e-f7ef-4359-9477-59f565a6a737" />
<img width="450" height="2250" alt="image" src="https://github.com/user-attachments/assets/2e361f5f-600b-46a9-ac0e-436fd7cea88e" />

---


## Support Page
- FAQ's
- PAyment Options
- Contact Support

<img width="450" height="775" alt="Support Center" src="https://github.com/user-attachments/assets/6c1e54e0-6749-44b7-8895-0a2aba890198" />


---

## AI-Powered Features

### Relief Assistant (AI Chatbot)
The Relief Assistant is a powerful AI chatbot available via the floating widget. It can:
-   **Answer Questions**: Ask about the application process, eligibility criteria, or where to find information in the app.
-   **Understand Your History**: The assistant is aware of your past applications and can provide status updates or explain decision reasons.
-   **Update Your Profile**: Ask the assistant to update your information. For example: *"My new phone number is 555-867-5309."*
-   **Start an Application**: Describe your situation to the assistant. For example: *"I was affected by the recent flood and need $1500 for repairs."* The assistant will use this information to create a draft, which will pre-fill the form when you navigate to the **Apply** page.


<img width="450" height="400" alt="Apply for Relief - Page 1 - Lets Get Started - Zoomed" src="https://github.com/user-attachments/assets/266529d9-9a10-4dc6-9cb0-0477d8f54fff" />
<img width="450" height="300" alt="Profile Page - Primary Address - AI Box" src="https://github.com/user-attachments/assets/5d6bf92d-669b-492f-9d23-4d15aa69b249" />
<img width="450" height="775" alt="image" src="https://github.com/user-attachments/assets/f964c765-4f92-447a-9c8a-a4621faf6cc9" />


### AI Decisioning & Instant Grants
When you submit an application, it goes through a two-stage automated decisioning process for an instant result.
1.  **Rules Engine Evaluation**: The application is first checked against a set of deterministic, hard-coded rules (e.g., Is the event date within 90 days? Does the requested amount exceed fund limits?). This generates a preliminary decision (`Approved`, `Denied`, or `Review`).
2.  **AI Final Review**: The application data and the preliminary decision are sent to a Gemini model. The AI acts as a senior grant approver, holistically reviews the case, and makes the final binding decision. It also generates a concise, empathetic reason for the outcome, which is shown to you.

This process ensures decisions are fast, consistent, and transparent.

---

## Fund Portal (For Admins)
If you are logged in as an admin, you have access to the Fund Portal, a central hub for managing the relief program.

-   **Dashboard**: A real-time dashboard of key metrics pulling from the live database, including total grants awarded, application statuses, and top event types.
-   **Ticketing**: A simple system for viewing and managing support tickets submitted by users.
-   **Program Details**: A summary of the configuration for the selected fund, including grant limits and eligible event types.
-   **Proxy Applications**: Submit an application on behalf of another employee. This is useful for users who may not have easy access to the app.
-   **Token Usage**: An analytics dashboard to monitor the usage and cost of the Gemini AI models across different features (AI Assistant, Decisioning, etc.).


<img width="450" height="775" alt="Fund Portal" src="https://github.com/user-attachments/assets/3eec42d7-4114-411d-9851-96e32fbd3054" />
<img width="450" height="775" alt="Ticketing" src="https://github.com/user-attachments/assets/d4abf595-9273-4bfb-9ad6-518efdca57ce" />
<img width="450" height="775" alt="Program Details" src="https://github.com/user-attachments/assets/e8eb2b2b-44bd-4a18-ace5-492e4c409552" />

<img width="450" height="775" alt="Proxy Application" src="https://github.com/user-attachments/assets/a54c5f6e-f04e-4ae4-b044-a969526f78ee" />
<img width="450" height="775" alt="Proxy Application 2" src="https://github.com/user-attachments/assets/e758eb5b-3e17-42ef-8abe-302c3b09fcef" />
<img width="450" height="775" alt="Token Usage" src="https://github.com/user-attachments/assets/c029714b-9207-4dc5-b47b-7da5cbf61e92" />
<img width="450" height="775" alt="Token Usage 2" src="https://github.com/user-attachments/assets/d8d6c707-63f4-4c15-85ef-bff96dd8bd60" />
<img width="450" height="775" alt="Token Usage 3" src="https://github.com/user-attachments/assets/c4dcc90a-8c66-4498-9e62-c3d6c6d17a05" />

<img width="1606" height="840" alt="Token Usage - Tablet" src="https://github.com/user-attachments/assets/725b958f-4f3e-4faf-8892-4248c4996f87" />

---

## Page Hierarchy for Screenshots

Here is a complete map of every page and view in the application.

-   **Logged Out Experience**
    -   Login Page
    -   Register Page

-   **Initial User Flow**
    -   Class Verification Page
        -   Domain Verification View
        -   Roster Verification View
        -   SSO Verification View
        -   Verification Success View

-   **Main Application (Standard User)**
    -   Home Page
    -   Apply for Relief (Wrapper Page)
        -   Step 1: Contact Page (`ApplyContactPage`)
            -   AI Application Starter
            -   Address Helper
        -   Step 2: Event Page (`ApplyEventPage`)
        -   Step 3: Expenses Page (`ApplyExpensesPage`)
        -   Step 4: Terms Page (`ApplyTermsPage`)
            -   Terms of Acceptance Modal
    -   Submission Success Page
    -   Profile Page
        -   Application Detail Modal
    -   Support Page
    -   FAQ Page
    -   Payment Options Page
    -   Donate Page
    -   Eligibility Page
    -   Policy Modal (from Home page footer)

-   **Main Application (Admin User)**
    -   Home Page (with "Dashboards" tile)
    -   Fund Portal Page
        -   Dashboard Page
        -   Ticketing Page
        -   Program Details Page
        -   Proxy Application Page (Wrapper)
            -   Step 1: Proxy Contact Page (`ApplyProxyContactPage`)
            -   (Steps 2-4 use the same components as the standard Apply flow)
        -   Token Usage Page
            -   Token Usage Filter Modal

-   **Shared Components**
    -   AI Relief Assistant (Chatbot Widget)
    -   Loading Overlays