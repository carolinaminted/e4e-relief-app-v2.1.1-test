import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    where,
    getDocs,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    increment,
    documentId
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile, FundIdentity, Application, TokenEvent, TokenUsageFilters } from '../types';
import type { IUsersRepo, IIdentitiesRepo, IApplicationsRepo, IFundsRepo, ITokenEventsRepo } from './dataRepo';
import type { Fund } from '../data/fundData';


class UsersRepo implements IUsersRepo {
    private usersCol = collection(db, 'users');

    async get(uid: string): Promise<UserProfile | null> {
        const docRef = doc(this.usersCol, uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    }

    listen(uid: string, callback: (profile: UserProfile | null) => void): () => void {
        const docRef = doc(this.usersCol, uid);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            const profile = docSnap.exists() ? (docSnap.data() as UserProfile) : null;
            callback(profile);
        },
        (error) => {
            console.error(`[FirestoreRepo] Error listening to user profile ${uid}:`, error);
        });
        return unsubscribe;
    }
    
    async getByEmail(email: string): Promise<UserProfile | null> {
        const q = query(this.usersCol, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data() as UserProfile;
        }
        return null;
    }

    async getAll(): Promise<UserProfile[]> {
        const snapshot = await getDocs(this.usersCol);
        return snapshot.docs.map(doc => doc.data() as UserProfile);
    }

    async getForFund(fundCode: string): Promise<UserProfile[]> {
        const identitiesCol = collection(db, 'identities');
        const identitiesQuery = query(identitiesCol, where('fundCode', '==', fundCode));
        const identitiesSnapshot = await getDocs(identitiesQuery);
        
        const uids = new Set<string>();
        identitiesSnapshot.docs.forEach(doc => {
            const uid = doc.data().uid;
            if (typeof uid === 'string' && uid) {
                uids.add(uid);
            }
        });
        const userIds = Array.from(uids);

        if (userIds.length === 0) {
            return [];
        }

        // Firestore 'in' query is limited to 30 items.
        // For a larger number of users, this would require batching the queries.
        const userBatches: string[][] = [];
        for (let i = 0; i < userIds.length; i += 30) {
            userBatches.push(userIds.slice(i, i + 30));
        }

        const userPromises = userBatches.map(batch => {
            const usersQuery = query(this.usersCol, where(documentId(), 'in', batch));
            return getDocs(usersQuery);
        });

        const userSnapshots = await Promise.all(userPromises);
        const users: UserProfile[] = [];
        userSnapshots.forEach(snapshot => {
            snapshot.docs.forEach(doc => users.push(doc.data() as UserProfile));
        });

        return users;
    }

    async add(user: Omit<UserProfile, 'role'>, uid: string): Promise<void> {
        const userWithRole = { ...user, role: 'User' as const };
        await setDoc(doc(this.usersCol, uid), userWithRole);
    }

    async update(uid: string, data: Partial<UserProfile>): Promise<void> {
        const docRef = doc(this.usersCol, uid);
        await updateDoc(docRef, data);
    }

    async incrementTokenUsage(uid: string, tokens: number, cost: number): Promise<void> {
        const docRef = doc(this.usersCol, uid);
        await updateDoc(docRef, {
            tokensUsedTotal: increment(tokens),
            estimatedCostTotal: increment(cost),
        });
    }
}

class IdentitiesRepo implements IIdentitiesRepo {
    private identitiesCol = collection(db, 'identities');

    async getForUser(uid: string): Promise<FundIdentity[]> {
        const q = query(this.identitiesCol, where('uid', '==', uid));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as FundIdentity);
    }

    async add(identity: FundIdentity): Promise<void> {
        await setDoc(doc(this.identitiesCol, identity.id), identity);
    }

    async update(id: string, data: Partial<FundIdentity>): Promise<void> {
        const docRef = doc(this.identitiesCol, id);
        await updateDoc(docRef, data);
    }

    async remove(id: string): Promise<void> {
        await deleteDoc(doc(this.identitiesCol, id));
    }
}

class ApplicationsRepo implements IApplicationsRepo {
    private appsCol = collection(db, 'applications');

    async getForUser(uid: string): Promise<Application[]> {
        const q = query(this.appsCol, where('uid', '==', uid), where('isProxy', '==', false));
        const snapshot = await getDocs(q);
        const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        // Sort on the client to avoid needing a composite index in Firestore
        return applications.sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime());
    }

    listenForUser(uid: string, callback: (apps: Application[]) => void): () => void {
        const q = query(this.appsCol, where('uid', '==', uid), where('isProxy', '==', false));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
            callback(applications.sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime()));
        },
        (error) => {
            console.error("[FirestoreRepo] Error in listenForUser snapshot listener:", error);
        });
        return unsubscribe;
    }
    
    async getProxySubmissions(adminUid: string): Promise<Application[]> {
        const q = query(this.appsCol, where('submittedBy', '==', adminUid), where('isProxy', '==', true));
        const snapshot = await getDocs(q);
        const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
        return applications.sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime());
    }

    listenForProxySubmissions(adminUid: string, callback: (apps: Application[]) => void): () => void {
        const q = query(this.appsCol, where('submittedBy', '==', adminUid), where('isProxy', '==', true));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const applications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
            callback(applications.sort((a, b) => new Date(a.submittedDate).getTime() - new Date(b.submittedDate).getTime()));
        },
        (error) => {
            console.error("[FirestoreRepo] Error in listenForProxySubmissions snapshot listener:", error);
        });
        return unsubscribe;
    }

    async getAll(): Promise<Application[]> {
        const snapshot = await getDocs(this.appsCol);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
    }

    async getForFund(fundCode: string): Promise<Application[]> {
        const q = query(this.appsCol, where('profileSnapshot.fundCode', '==', fundCode));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
    }

    async add(application: Omit<Application, 'id'>): Promise<Application> {
        const docRef = await addDoc(this.appsCol, application);
        return { id: docRef.id, ...application };
    }
}


class FundsRepo implements IFundsRepo {
    private fundsCol = collection(db, 'funds');

    async getFund(code: string): Promise<Fund | null> {
        const docRef = doc(this.fundsCol, code.toUpperCase());
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? ({ code: docSnap.id, ...docSnap.data() } as Fund) : null;
    }

    async getAllFunds(): Promise<Fund[]> {
        const snapshot = await getDocs(this.fundsCol);
        return snapshot.docs.map(doc => ({ code: doc.id, ...doc.data() } as Fund));
    }
}

class TokenEventsRepo implements ITokenEventsRepo {
    private eventsCol = collection(db, 'tokenEvents');

    async add(event: Omit<TokenEvent, 'id'>): Promise<TokenEvent> {
        const docRef = await addDoc(this.eventsCol, event);
        return { id: docRef.id, ...event };
    }

    async getAllEvents(): Promise<TokenEvent[]> {
        const snapshot = await getDocs(this.eventsCol);
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TokenEvent));
        // Sort client-side
        return events.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
}


export const usersRepo = new UsersRepo();
export const identitiesRepo = new IdentitiesRepo();
export const applicationsRepo = new ApplicationsRepo();
export const fundsRepo = new FundsRepo();
export const tokenEventsRepo = new TokenEventsRepo();