# E4E Relief: Firebase Environment Management Guide

## 1. Introduction

This document is the central guide for managing the E4E Relief application's backend environment on Google Firebase. It provides an overview of the services used, explains the data structure, and details key administrative tasks, such as granting admin access.

The application leverages the following Firebase services:
- **Firebase Authentication:** For secure user sign-up, sign-in, and session management.
- **Firestore:** A real-time NoSQL database for all application data, including user profiles, applications, and fund configurations.
- **Cloud Storage:** For storing user-uploaded files, such as expense receipts.
- **Cloud Functions:** For secure, server-side administrative tasks.

---

## 2. Core Services Overview

### Firestore Data Model

Our data is organized into several main collections in Firestore. Understanding this structure is key to managing the application's data.

-   `/users/{uid}`: Stores the profile information for each user. The document ID `{uid}` is the user's unique ID from Firebase Authentication.
-   `/funds/{fundCode}`: Contains the configuration for each relief fund (e.g., grant limits, eligible events). This is the master record for fund rules.
-   `/identities/{uid}_{fundCode}`: Represents a user's relationship with a specific fund, including their verification and eligibility status.
-   `/applications/{applicationId}`: A complete record of every submitted application. Includes a snapshot of the user's profile at the time of submission for auditing.
-   `/tokenEvents/{eventId}`: A detailed log of every AI (Gemini) API call for analytics and cost monitoring.
-   `/users/{uid}/chatSessions/...`: Stores the AI Relief Assistant chat history for each user.

### Cloud Storage Structure

User-uploaded files are stored in a structured path to ensure organization and security:
-   **Path:** `receipts/{userId}/{expenseId}/{fileName}`
-   This structure allows security rules to restrict access, ensuring users can only manage their own files.

---

## 3. Key Management Task: Granting Admin Access

Administrative access to the **Fund Portal** is controlled by a secure Firebase Custom Claim (`admin: true`). **This CANNOT be granted by simply changing a user's `role` field in the database.** You must use one of the approved methods below.

### Prerequisites

-   **Admin Access:** You must have Owner or Editor permissions on the Google Firebase project.
-   **User's UID:** You must know the unique User ID (UID) for the user you wish to make an admin.

#### How to Find a User's UID
1.  Navigate to the [Firebase Console](https://console.firebase.google.com/).
2.  Select the `e4e-relief-app` project.
3.  Go to **Authentication** in the "Build" menu.
4.  Find the user by their email in the **Users** tab.
5.  Copy the **User UID** value.

### Method 1: Firestore-Triggered Cloud Function (Recommended)

This is the most secure and recommended method. It involves creating a special document in Firestore, which triggers a backend function to grant the admin role.

1.  Navigate to the **Firestore Database** in the Firebase Console.
2.  Click **"+ Start collection"**.
3.  For "Collection ID", enter exactly: **`_admin_requests`**.
4.  For "Document ID", click **"Auto-ID"**.
5.  Create one field:
    -   **Field name:** `uid`
    -   **Type:** `string`
    -   **Value:** Paste the User's UID you want to make an admin.
6.  Click **"Save"**.

The Cloud Function will automatically trigger, grant the user admin rights, and then delete the request document (it will disappear from the collection almost immediately).

### Method 2: Local Admin Script (For Initial Setup)

This method requires downloading a sensitive service account key and should only be used if the Cloud Function method is unavailable.

1.  **Download Service Account Key:** In the Firebase Console, go to **Project settings > Service accounts** and click **"Generate new private key"**. Secure this file and do not share it.
2.  **Prepare Script:** Create a temporary local folder. Move the downloaded key file into it. Create a file named `set-admin.js` with the following content, replacing the placeholders:

    ```javascript
    // set-admin.js
    const admin = require('firebase-admin');

    // --- 1. REPLACE THIS with your key file name ---
    const serviceAccount = require('./your-service-account-key-file.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    // --- 2. REPLACE THIS with the user's UID ---
    const uid = 'PASTE_YOUR_USER_ID_HERE';

    admin.auth().setCustomUserClaims(uid, { admin: true })
      .then(() => {
        console.log(`✅ Success! User ${uid} has been made an admin.`);
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
      });
    ```
3.  **Run Script:** Open a terminal in the folder and run `npm install firebase-admin`, then run `node set-admin.js`.

### Final Step: User Verification
After using either method, instruct the user to **log out** of the E4E Relief app and **log back in**. Their new token will contain the admin claim, granting them access to the Fund Portal.

---

## 4. Data, Security, and Maintenance

### Security Rules Summary
Firestore Security Rules are in place to enforce strict data access policies:
-   **User Data is Private:** Users can only read and write their own data (profiles, applications, identities).
-   **Admin Access:** Users with the `admin: true` claim have broader read/write access for management purposes.
-   **Data Integrity:** Submitted applications and logs (like token events) are immutable to maintain a secure audit trail.

### Database Indexes
Firestore requires specific composite indexes to perform certain queries efficiently (e.g., fetching all applications for a fund). These are defined in `firestore.indexes.json` and are critical for the application's performance. **Do not delete existing indexes unless you are certain they are no longer needed.**

### Recommended Maintenance
-   **Monitoring:** Regularly check the **Usage and billing** dashboard in the Firebase Console to monitor Firestore reads/writes, function executions, and storage usage.
-   **Backups:** It is a best practice to configure scheduled backups for the Firestore database to prevent data loss. This can be done via the Google Cloud Console for your project.
