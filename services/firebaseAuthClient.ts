import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    type User,
    type IdTokenResult
} from 'firebase/auth';
import { auth } from './firebase';
import type { IAuthClient } from './authClient';
import { usersRepo } from './firestoreRepo';

class FirebaseAuthClient implements IAuthClient {

    onAuthStateChanged(callback: (user: User | null, token: IdTokenResult | null) => void) {
        return onAuthStateChanged(auth, async (user) => {
            if (user) {
                const token = await user.getIdTokenResult();
                callback(user, token);
            } else {
                callback(null, null);
            }
        });
    }

    async register(email: string, password: string, firstName: string, lastName: string, fundCode: string) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            if (!user) {
                throw new Error("User could not be created.");
            }
            
            // DEFERRED: The fund name is no longer fetched here to avoid a permissions race condition.
            // It will be hydrated in App.tsx after the user's auth state is stable (e.g., after verification).

            // Create user profile document in Firestore
            await usersRepo.add({
                uid: user.uid,
                identityId: email,
                activeIdentityId: null,
                firstName,
                lastName,
                email,
                mobileNumber: '',
                primaryAddress: { country: '', street1: '', city: '', state: '', zip: '' },
                employmentStartDate: '',
                eligibilityType: '',
                householdIncome: '',
                householdSize: '',
                homeowner: '',
                isMailingAddressSame: null,
                ackPolicies: false,
                commConsent: false,
                infoCorrect: false,
                fundCode: fundCode.toUpperCase(), // Store the code, but not the name yet.
                fundName: '', // This will be populated later.
                classVerificationStatus: 'pending',
                eligibilityStatus: 'Not Eligible',
            }, user.uid);

            return { success: true };
        } catch (error: any) {
            console.error("Registration error:", error);
            return { success: false, error: error.message };
        }
    }

    async createProxyUser(email: string, password: string): Promise<{ success: boolean; error?: string; user: User}> {
        try {
            // This is a simplified example. In a real app, this would be handled by a secure backend function
            // to avoid creating users on the client side without proper authorization.
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (!userCredential.user) {
                throw new Error("Proxy user could not be created.");
            }
            return { success: true, user: userCredential.user };
        } catch (error: any) {
            console.error("Proxy user creation error:", error);
            // If user already exists, we can try to fetch them. This is not secure client-side.
            // For this project, we'll assume creation is the main path and errors are fatal.
            throw new Error(error.message);
        }
    }

    async signIn(email: string, password: string): Promise<boolean> {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error) {
            console.error("Sign in error:", error);
            return false;
        }
    }

    async signOut(): Promise<void> {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Sign out error:", error);
        }
    }

    async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error: any) {
            console.error("Password reset error:", error);
            // Don't expose specific errors to the client to prevent user enumeration.
            // Firebase itself already handles the non-enumeration part by not throwing for non-existent emails.
            // This generic message is for other potential network or configuration errors.
            return { success: false, error: "An unexpected error occurred. Please try again." };
        }
    }
}

export const authClient = new FirebaseAuthClient();
