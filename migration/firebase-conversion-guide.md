# E4E Relief App: Firebase Backend Migration Plan

## 1. Executive Summary

This document outlines a comprehensive plan to migrate the E4E Relief application's backend from the current in-memory mock implementation to a robust, scalable, and real-time backend powered by Google Firebase. This migration will enable persistent data, secure user management, and a foundation for future growth.

**Key Objectives:**
-   **Secure Authentication:** Replace the mock login with Firebase Authentication for secure user sign-up, sign-in, and session management.
-   **Persistent Data Storage:** Move all application data (user profiles, applications, identities, and fund configurations) to Firestore.
-   **Maintainable Architecture:** Implement a provider-agnostic client architecture using repository interfaces to decouple the UI from Firebase.
-   **Scalability & Reliability:** Utilize Google Cloud's infrastructure to ensure the application can scale with user growth.
-   **Enhanced Security:** Implement granular access control using Firestore Security Rules and Firebase Custom Claims for role-based access.

---

## 2. Firestore Data Model Design

The proposed data model is designed to be efficient, scalable, and easy to secure. It revolves around four primary root collections.

### Collections

#### `/users/{uid}`
-   **Purpose:** Stores public and private profile information for each user. The document ID `{uid}` will be the user's unique UID from Firebase Authentication.
-   **Schema:**
    ```json
    {
      "email": "user@example.com",
      "firstName": "Pikachu",
      "lastName": "Raichu",
      "role": "User", // 'User' | 'Admin' - managed via Custom Claims
      "activeIdentityId": "some_uid_DOM", // Reference to the active doc in /identities
      "tokensUsedTotal": 10500, // Aggregate count
      "estimatedCostTotal": 0.045, // Aggregate cost
      "createdAt": "2023-10-27T10:00:00Z",
      // ... other fields from UserProfile
    }
    ```

#### `/funds/{fundCode}`
-   **Purpose:** A new first-class collection to store the configuration for each relief fund. This decouples fund parameters from the client-side code.
-   **Schema:**
    ```json
    {
      "name": "Blastoise Relief Fund",
      "limits": { "twelveMonthMax": 10000, ... },
      "eligibleCountries": ["US", "CA"],
      // ... other fields from the Fund type
    }
    ```

#### `/identities/{uid}_{fundCode}`
-   **Purpose:** Stores each user's relationship with a specific fund using a deterministic ID for easy lookups and security rules.
-   **Schema:**
    ```json
    {
      "uid": "firebase-auth-uid", // UID of the user this identity belongs to
      "fundCode": "DOM",
      "fundName": "Blastoise Relief Fund", // Denormalized for display
      "classVerificationStatus": "passed",
      "eligibilityStatus": "Eligible",
      "lastVerifiedAt": "2023-10-27T10:00:00Z",
      "isActive": true
    }
    ```

#### `/applications/{applicationId}`
-   **Purpose:** A root collection to store every application. This structure facilitates admin-level queries across all users.
-   **Schema:**
    ```json
    {
      "uid": "firebase-auth-uid", // UID of the applicant
      "submittedBy": "firebase-auth-uid-of-admin", // UID of proxy if applicable
      "fundCode": "DOM",
      "status": "Awarded",
      "submittedAt": "2023-08-12T10:00:00Z",
      "profileSnapshot": { ... }, // A complete copy of the UserProfile at submission
      // ... other fields from Application
    }
    ```

#### `/tokenEvents/{eventId}`
- **Purpose:** Stores a detailed record of every individual AI API call for analytics and auditing.
- **Schema:**
    ```json
    {
        "uid": "firebase-auth-uid",
        "userId": "user@example.com",
        "fundCode": "DOM",
        "feature": "AI Assistant",
        "model": "gemini-2.5-flash",
        "inputTokens": 500,
        "outputTokens": 250,
        "timestamp": "2023-10-28T12:00:00Z"
        // ... other fields from TokenEvent
    }
    ```

#### `/users/{uid}/chatSessions/{sessionId}/messages/{messageId}`
- **Purpose:** Stores the chat history for the AI Relief Assistant for each user. This nested structure ensures chat data is private and secure.

---

## 3. Client Architecture

To ensure the application is maintainable and not tightly coupled to Firebase, we will implement a repository/adapter pattern. UI components will interact with provider-agnostic interfaces, and concrete Firebase implementations will handle the data logic.

-   **`core/` directory:** Will contain the business logic and interfaces.
    -   `core/auth/AuthClient.ts`: Interface for authentication methods (`register`, `signIn`, `signOut`, `onAuthStateChanged`).
    -   `core/data/UsersRepo.ts`, `IdentitiesRepo.ts`, `ApplicationsRepo.ts`, `FundsRepo.ts`: Interfaces defining data access methods (e.g., `getUser(uid)`, `getApplicationsForUser(uid)`).

-   **`infra/firebase/` directory:** Will contain the concrete implementations.
    -   `infra/firebase/FirebaseAuthClient.ts`: Implements `AuthClient` using the Firebase Auth SDK.
    -   `infra/firebase/FirestoreUsersRepo.ts`, etc.: Implement the repository interfaces using the Firestore SDK.

-   **State Management:**
    -   A simple `useAuth()` hook will manage the current user, loading state, and custom claims.
    -   **TanStack Query (`@tanstack/react-query`)** is recommended for managing server state, including fetching, caching, and mutations. It pairs well with repository methods and can integrate with Firestore's `onSnapshot` for real-time updates.

---

## 4. Authentication & Authorization

We will use **Firebase Authentication** with the Email/Password provider. Admin roles will be managed using **Custom Claims** for maximum security.

### User Flows
1.  **Registration/Login:** UI components will call methods on the `AuthClient` interface (e.g., `authClient.register(...)`).
2.  **Global State:** An `onAuthStateChanged` listener in `App.tsx` will detect the authenticated user, fetch their custom claims, and retrieve their profile from the `UsersRepo`.

### Admin Role Management
-   **Custom Claims:** An admin user will have a `{ admin: true }` claim set on their authentication token. This is the source of truth for authorization.
-   **Implementation:** A callable Cloud Function, `setAdmin(data: {uid: string, makeAdmin: boolean})`, will be created. This function will be protected; only an already authenticated admin can call it to grant or revoke admin privileges for another user.
-   **Security:** This approach is highly secure, as claims are verified on the backend by Firestore Security Rules, preventing unauthorized access.

---

## 5. Firestore Security Rules & Indexes

### Security Rules
The following rules provide a secure, function-based foundation that correctly handles user and admin roles. In `rules_version = '2'`, any collection not explicitly matched is denied access by default.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // --- Helper Functions ---
    // These functions make rules more readable and reusable.

    // Returns true if the user making the request is signed in.
    function isAuthed() {
      return request.auth != null;
    }

    // Returns true if the signed-in user has an `admin: true` custom claim.
    // This is the source of truth for admin privileges.
    function isAdmin() {
      return isAuthed() && request.auth.token.admin == true;
    }

    // Returns true if the signed-in user's UID matches the UID passed as an argument.
    // This is used to check if a user is accessing their own documents.
    function isSelf(uid) {
      return isAuthed() && request.auth.uid == uid;
    }

    // --- Global Rule ---
    // This is a default-deny rule. If no other rule matches, access is denied.
    // This is a security best practice to prevent accidental exposure of data.
    match /{document=**} {
      allow read, write: if false;
    }

    // --- Collection: funds ---
    // Stores public configuration for each relief fund.
    match /funds/{fundCode} {
      // Any authenticated user can read fund configurations (e.g., to see fund names, eligibility rules).
      allow read: if isAuthed();
      // Only admins can create, update, or delete fund configurations.
      allow write: if isAdmin();
    }

    // --- Collection: users ---
    // Stores the main profile for each user.
    match /users/{uid} {
      // A user can read or update their own profile. An admin can also read/update any user's profile.
      allow read, update: if isSelf(uid) || isAdmin();
      // A user can only create their own profile document, which happens once during registration.
      allow create: if isSelf(uid);
      // No one is allowed to delete a user profile to maintain data integrity.
      allow delete: if false;
    }

    // --- Collection: identities ---
    // Links a user to a specific fund and tracks their verification/eligibility status for that fund.
    match /identities/{identityId} {
      // An admin can read any identity. A user can only read identities where the `uid` field matches their own auth UID.
      allow read: if isAdmin() || (isAuthed() && resource.data.uid == request.auth.uid);
      // A user can create their own identity (during registration or adding a new fund). An admin can also create one.
      allow create: if isSelf(request.resource.data.uid) || isAdmin();
      // An admin can update any field. A user can update their own identity document (e.g., to change status from 'failed' to 'passed')
      // as long as they do not attempt to change the core immutable fields: `uid` and `fundCode`. This prevents a user from reassigning an identity.
      allow update: if isAdmin() || (isSelf(resource.data.uid) && request.resource.data.uid == resource.data.uid && request.resource.data.fundCode == resource.data.fundCode);
      // Only admins can delete identities.
      allow delete: if isAdmin();
    }

    // --- Collection: applications ---
    // Stores all submitted relief applications.
    match /applications/{appId} {
      // An admin can read any application. A user can only read applications they submitted.
      allow read: if isAdmin() || (isAuthed() && resource.data.uid == request.auth.uid);
      // A user can create their own application. An admin can also create one (for proxy applications).
      allow create: if isAdmin() || (isSelf(request.resource.data.uid));
      // Only admins can modify or delete submitted applications to ensure audit trail integrity.
      allow update, delete: if isAdmin();
    }
    
    // --- Collection: tokenEvents ---
    // Stores detailed logs of every AI API call for analytics.
    match /tokenEvents/{eventId} {
      // A user can only create a token event log for themselves, preventing them from logging events on behalf of others.
      allow create: if isSelf(request.resource.data.uid);
      // Allow any authenticated user to read the analytics data for the PoC phase.
      allow read: if isAuthed();
      // No one can modify or delete event logs once created, ensuring data integrity for auditing.
      allow update, delete: if false;
    }

    // --- Collection: _admin_requests (for Cloud Function trigger) ---
    // This collection is used to securely trigger the makeAdmin Cloud Function.
    match /_admin_requests/{docId} {
      // Only an existing admin can create a document here, which triggers the function.
      allow create: if isAdmin();
    }

    // --- Subcollection: chat messages ---
    // Stores messages for the AI Relief Assistant.
    match /users/{uid}/chatSessions/{sid}/messages/{mid} {
      // A user can read and create messages in their own chat sessions. An admin can also access them for support/review.
      allow read, create: if isSelf(uid) || isAdmin();
      // Chat messages are immutable and cannot be changed or deleted.
      allow update, delete: if false;
    }
  }
}
```

### Required Indexes
The following composite indexes must be created in Firestore to support admin queries and prevent runtime errors.

```json
{
  "indexes": [
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "isProxy", "order": "ASCENDING" },
        { "fieldPath": "submittedDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "submittedBy", "order": "ASCENDING" },
        { "fieldPath": "isProxy", "order": "ASCENDING" },
        { "fieldPath": "submittedDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "applications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fundCode", "order": "ASCENDING" },
        { "fieldPath": "submittedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "identities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "fundCode", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tokenEvents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fundCode", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    },
     {
      "collectionGroup": "tokenEvents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "fundCode", "order": "ASCENDING" },
        { "fieldPath": "uid", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "ASCENDING" }
      ]
    }
  ]
}

```

---

## 6. Step-by-Step Implementation Guide

### Phase 0: Project Setup
1.  **Firebase Project:** Create a project in the Firebase Console.
2.  **Enable Services:** Enable **Authentication** (Email/Password provider) and **Firestore**.
3.  **Install SDKs:** `npm install firebase @tanstack/react-query`.
4.  **Configure:** Create `services/firebase.ts` with your project configuration keys (use environment variables).
5.  **Seed Data:** Create a script to seed the `/funds` collection with your initial fund configurations.

### Phase 1: Architecture & Authentication
1.  **Create Interfaces:** Define the `AuthClient` and repository interfaces in the `core/` directory.
2.  **Implement Firebase Adapters:** Create the concrete Firebase implementations in the `infra/firebase/` directory.
3.  **Refactor Auth:** Replace mock logic in `LoginPage` and `RegisterPage` to use the `AuthClient`.
4.  **Global State:** Implement the `onAuthStateChanged` listener in `App.tsx` to set the global auth state. Upon successful registration, use the `UsersRepo` to create the user's document in Firestore.

### Phase 2: Data Layer Migration
1.  **Remove Mock DB:** Delete the entire `// --- MOCK DATABASE ---` block from `App.tsx`.
2.  **Integrate TanStack Query:** Wrap the root of the app with `QueryClientProvider`.
3.  **Replace State with Queries:** Systematically replace all `useState` calls that held mock data with `useQuery` hooks that call repository methods (e.g., `useQuery(['applications', user.uid], () => applicationsRepo.getForUser(user.uid))`).
4.  **Refactor Write Operations:** Replace all data-mutating handlers (`handleApplicationSubmit`, `handleProfileUpdate`) with `useMutation` hooks that call the appropriate repository methods.

### Phase 3: Security & Testing
1.  **Deploy Rules & Indexes:** Deploy the `firestore.rules` and `firestore.indexes.json` files to your project.
2.  **Emulator Suite:** Use the Firebase Local Emulator Suite for all development. This provides a safe, local environment for testing.
3.  **Rules Testing:** Write unit tests for your security rules using `@firebase/rules-unit-testing` to verify that user/admin permissions are correctly enforced.
4.  **End-to-End Testing:** Manually test the full user flows: registration -> verification -> application -> profile view -> admin view.

### Phase 4: Admin & Cloud Functions
1.  **Deploy Admin Function:** Deploy the `setAdmin` callable Cloud Function to manage roles.
2.  **Guard Admin UI:** Refactor admin-only components to check `claims.admin` from the `useAuth` hook before rendering.
3.  **(Optional) Implement Fan-Out Function:** Create a Cloud Function triggered on `/applications` writes to create the mirrored document in `/users/{uid}/applications`.
