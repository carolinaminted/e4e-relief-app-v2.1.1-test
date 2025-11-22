import type { User, IdTokenResult } from 'firebase/auth';

export interface IAuthClient {
    onAuthStateChanged: (callback: (user: User | null, token: IdTokenResult | null) => void) => () => void;
    
    register: (
        email: string, 
        password: string, 
        firstName: string, 
        lastName: string, 
        fundCode: string
    ) => Promise<{ success: boolean; error?: string; }>;

    createProxyUser: (
        email: string, 
        password: string
    ) => Promise<{ success: boolean; error?: string; user: User}>;

    signIn: (email: string, password: string) => Promise<boolean>;
    
    signOut: () => Promise<void>;

    sendPasswordResetEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
}
