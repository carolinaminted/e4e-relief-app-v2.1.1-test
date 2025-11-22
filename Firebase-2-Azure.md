# 🚀 Operation: Backend Agnosticism (Firebase to Azure Migration Plan)

## 1. The Skeptical Architect's Review

**Current Status:** Tightly Coupled (High Risk)
Your current application is hard-wired to Firebase. Components import `firestoreRepo.ts` and `firebaseAuthClient.ts` directly. The data shapes in your TypeScript interfaces (`UserProfile`, `Application`) mirror the Firestore document structure exactly.

**The Problem:**
If you try to plug in Dataverse today, you will have to rewrite 30+ files. Dataverse returns OData responses (e.g., `contactid`, `cr56_firstname`, `@odata.etag`), not clean JSON that matches your current `UserProfile` interface. Azure AD B2C returns JWT tokens via redirect flows, not the WebSocket-based session management of Firebase.

**The Innovation Solution:**
We will implement a **Hexagonal Architecture (Ports & Adapters)**.
1.  **The Port:** Your UI components (The Core). They only speak "Domain Language" (`UserProfile`, `Application`).
2.  **The Adapter:** A translation layer. One adapter speaks "Firebase", the other speaks "Azure".
3.  **The Dependency Injection:** A switch that decides which adapter to plug in at runtime.

---

## 2. The "Plug and Play" Architecture

### A. Directory Restructuring
We need to separate *intent* from *implementation*.

```text
src/
  services/
    ├── core/                  <-- PURE TYPESCRIPT (No Firebase/Azure imports)
    │   ├── interfaces.ts      (IAuthService, IDataService)
    │   ├── types.ts           (Domain Models)
    │   └── errors.ts          (Standardized App Errors)
    ├── adapters/
    │   ├── firebase/          <-- CURRENT BACKEND
    │   │   ├── FirebaseAuthAdapter.ts
    │   │   └── FirestoreDataAdapter.ts
    │   └── azure/             <-- FUTURE BACKEND
    │       ├── MsalAuthAdapter.ts    (MSAL = Microsoft Auth Library)
    │       └── DataverseDataAdapter.ts
    └── ServiceContext.tsx     <-- THE SWITCHBOARD
```

### B. The Abstraction Contracts (`core/interfaces.ts`)

These are the rules any backend MUST follow to play with your app.

```typescript
// The UI doesn't care if it's Firebase or Azure. It just wants these methods.
export interface IAuthService {
    login(): Promise<void>;
    logout(): Promise<void>;
    getUser(): Promise<AuthenticatedUser | null>;
    getToken(): Promise<string>; // For API calls
}

export interface IDataService {
    // Users
    getUserProfile(id: string): Promise<UserProfile>;
    updateUserProfile(id: string, data: Partial<UserProfile>): Promise<void>;
    
    // Applications
    submitApplication(app: Application): Promise<string>; // Returns ID
    getApplications(userId: string): Promise<Application[]>;
    
    // Metadata
    getFundConfig(code: string): Promise<Fund>;
}
```

---

## 3. The Dataverse "Translation Layer"

Dataverse is ugly. It uses GUIDs, integer choice values (optionsets), and OData query syntax. Your UI cannot see this mess.

**Innovation:** We will use **Bi-Directional Mappers**.

### The Mapper Pattern
In `services/adapters/azure/mappers.ts`:

```typescript
// Dataverse -> App
export const mapContactToProfile = (dvContact: any): UserProfile => ({
    uid: dvContact.contactid, // GUID
    firstName: dvContact.firstname,
    lastName: dvContact.lastname,
    email: dvContact.emailaddress1,
    householdIncome: dvContact.cr56_annualincome_value, // Currency field
    // Mapping Optionsets (e.g. 1 = "Yes", 0 = "No")
    homeowner: dvContact.cr56_homeowner === 1 ? 'Yes' : 'No', 
});

// App -> Dataverse
export const mapProfileToContact = (profile: UserProfile): any => ({
    firstname: profile.firstName,
    lastname: profile.lastName,
    emailaddress1: profile.email,
    cr56_annualincome: profile.householdIncome,
    cr56_homeowner: profile.homeowner === 'Yes' ? 1 : 0,
});
```

---

## 4. Execution Plan: "The Swap"

### Phase 1: Modularization (Immediate Action)
**Goal:** Refactor existing code to use a `useServices()` hook instead of direct imports.

1.  **Create `ServiceContext.tsx`:**
    This React Context holds the `authService` and `dataService` instances.
2.  **Refactor `App.tsx`:**
    Wrap the app in `<ServiceProvider backend="firebase">`.
3.  **Update Components:**
    Replace `import { usersRepo } from ...` with `const { dataService } = useServices();`.

### Phase 2: Azure AD B2C Integration
**Goal:** Authenticate against your Azure Tenant.

1.  **Install MSAL:** `npm install @azure/msal-react @azure/msal-browser`
2.  **Configure B2C:**
    *   Create "Sign Up/Sign In" User Flow.
    *   Register SPA application in Azure AD.
    *   Get Client ID and Authority URL.
3.  **Implement `MsalAuthAdapter.ts`:**
    *   Map MSAL's `acquireTokenSilent` to `getToken()`.
    *   Map `loginRedirect` to `login()`.

### Phase 3: Dataverse Connection
**Goal:** Read/Write business data.

1.  **Setup Power Pages / Web API:** Ensure the Dataverse Web API permissions are set for the registered App Registration.
2.  **Implement `DataverseDataAdapter.ts`:**
    *   Use `fetch` with the token from `MsalAuthAdapter`.
    *   Example Fetch:
        ```typescript
        const result = await fetch(`${DATAVERSE_URL}/api/data/v9.2/contacts`, {
            headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        ```
3.  **Handling "Real-time":** 
    *   *Challenge:* Dataverse doesn't have listeners like Firestore.
    *   *Solution:* The Adapter must implement a **Polling Interval** inside the `listenForUser` method to simulate real-time updates, or the UI must be refactored to "Pull on Interaction" logic.

---

## 5. Azure Configuration Reference (Cheat Sheet)

When you are ready to plug in, you will need these exact environment variables.

```env
# Backend Selector
VITE_BACKEND_PROVIDER=azure

# Azure AD B2C Config
VITE_AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_AZURE_AUTHORITY=https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{user-flow}
VITE_AZURE_KNOWN_AUTHORITIES={tenant}.b2clogin.com

# Dataverse Config
VITE_DATAVERSE_URL=https://{org-name}.crm.dynamics.com
VITE_DATAVERSE_API_VERSION=v9.2
```

## 6. Strategic Benefits of This Plan

1.  **Vendor Lock-in Elimination:** You are no longer "A Firebase App". You are a React App that *can* use Firebase.
2.  **Parallel Development:** You can build the `DataverseDataAdapter` while the app is still live on Firebase. You can even A/B test backends with a flag.
3.  **Testing:** It becomes trivial to create a `MockDataService` for unit tests that doesn't require a network connection at all.

## 7. Immediate Next Steps

1.  Create the `src/services/core` and `src/services/adapters` folders.
2.  Move `firebaseAuthClient.ts` into `adapters/firebase/`.
3.  Move `firestoreRepo.ts` into `adapters/firebase/`.
4.  Create the `ServiceContext` and start replacing imports in `App.tsx`.
