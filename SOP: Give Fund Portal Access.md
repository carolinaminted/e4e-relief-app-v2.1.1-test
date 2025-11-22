# SOP: Granting Fund Portal (Admin) Access

## 1. Objective
This document provides the standard operating procedure for granting a user administrative access to the E4E Relief application's Fund Portal. Administrative access is controlled by a secure Firebase Custom Claim (`admin: true`) and cannot be granted by modifying the user's profile in the database.

---

## 2. Prerequisites
- **Admin Access:** You must have Owner or Editor permissions on the Google Firebase project.
- **User's UID:** You must know the unique User ID (UID) for the user you wish to make an admin.

### How to Find a User's UID
1.  Navigate to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your `e4e-relief-app` project.
3.  Go to **Authentication** in the left-hand "Build" menu.
4.  In the **Users** tab, find the user by their email.
5.  Copy the **User UID** value. It's a long alphanumeric string.

    

---

## 3. Methods Overview
There are two approved methods for granting admin access.

| Method                               | Description                                                                                              | When to Use                                                                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Method 1: Local Admin Script**     | A one-time script run on your local machine that requires a downloadable service account key.            | For initial setup or if you have explicit permission to download service keys. |
| **Method 2: Cloud Function Trigger** | A secure, key-less method where creating a document in Firestore triggers a backend function. **(Recommended)** | For ongoing use, especially in environments where key downloads are restricted. |

---

## 4. Method 1: Local Admin Script

Follow these steps to run a local script to set the admin claim.

### Step 1: Download Your Service Account Key
1.  In the Firebase Console, go to **Project settings** (gear icon ⚙️) > **Service accounts**.
2.  Click the **"Generate new private key"** button.
3.  A JSON file will download. **This file is highly sensitive.** Keep it secure and do not commit it to version control.

### Step 2: Prepare the Script Environment
1.  On your computer, create a new, temporary folder (e.g., `firebase-admin-script`).
2.  Move the JSON key file you just downloaded into this folder.
3.  Open a terminal or command prompt inside this folder and run the following command to install the required library:
    ```bash
    npm install firebase-admin
    ```

### Step 3: Create and Configure the Script
1.  In the same folder, create a new file named exactly `set-admin.js`.
2.  Copy and paste the code below into this file.
3.  **Crucially, you must edit the two placeholder values:**
    -   Replace `'your-service-account-key-file.json'` with the exact filename of the key you downloaded.
    -   Replace `'PASTE_YOUR_USER_ID_HERE'` with the UID you copied from the Firebase console.

    ```javascript
    // set-admin.js
    const admin = require('firebase-admin');

    // --- 1. REPLACE THIS with the actual name of your key file ---
    const serviceAccount = require('./your-service-account-key-file.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    // --- 2. REPLACE THIS with the UID of the user to make an admin ---
    const uid = 'PASTE_YOUR_USER_ID_HERE';

    // This sets the { admin: true } claim on the user's token
    admin.auth().setCustomUserClaims(uid, { admin: true })
      .then(() => {
        console.log(`✅ Success! User ${uid} has been made an admin.`);
        console.log('Tell the user to log out and log back in to see the changes.');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error setting custom user claims:', error);
        process.exit(1);
      });
    ```

### Step 4: Run the Script
1.  In your terminal (still inside the `firebase-admin-script` folder), run the script:
    ```bash
    node set-admin.js
    ```
2.  You should see a success message.

### Step 5: Verify Access
1.  Instruct the user to **log out** of the E4E Relief application and then **log back in**.
2.  Upon logging back in, their new authentication token will have the admin claim, and the "Dashboards" tile will appear on their home screen.

---

## 5. Method 2: Firestore-Triggered Cloud Function (Recommended)

This method involves a one-time setup of a Cloud Function. Afterward, granting admin access is as simple as creating a document in the database.

### Part A: One-Time Setup (Deploy the Function)

1.  **Initialize Firebase Functions:** If not already done for the project, open a terminal in the main project repository and run `firebase init functions`. Follow the prompts.
2.  **Add Function Code:** Open the `functions/index.js` file and replace its contents with the code below:
    ```javascript
    const functions = require("firebase-functions");
    const admin = require("firebase-admin");

    admin.initializeApp();

    exports.makeAdminOnRequest = functions.firestore
      .document("_admin_requests/{docId}")
      .onCreate(async (snap, context) => {
        const { uid } = snap.data();
        if (!uid) {
          console.log("Request document missing 'uid' field. Aborting.");
          return null;
        }
        try {
          await admin.auth().setCustomUserClaims(uid, { admin: true });
          console.log(`Successfully set admin claim for user: ${uid}`);
          return snap.ref.delete(); // Clean up the request document
        } catch (error) {
          console.error("Error setting custom claim:", error);
          return null;
        }
      });
    ```
3.  **Deploy the Function:** From your terminal in the main project repository, run:
    ```bash
    firebase deploy --only functions
    ```

### Part B: Granting Admin Access (Ongoing Use)

1.  Navigate to your **Firestore Database** in the Firebase Console.
2.  Click **"+ Start collection"**.
3.  For "Collection ID", enter exactly: **`_admin_requests`**.
4.  For "Document ID", click **"Auto-ID"**.
5.  Create one field:
    -   **Field name:** `uid`
    -   **Type:** `string`
    -   **Value:** Paste the User's UID you want to make an admin.
6.  Click **"Save"**.

The Cloud Function will automatically trigger, grant the user admin rights, and then delete the request document (it will disappear from the collection).

### Step 5: Verify Access
1.  Instruct the user to **log out** and **log back in**. They will now have admin access.
