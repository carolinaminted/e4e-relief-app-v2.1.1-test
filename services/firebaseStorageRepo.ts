import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import type { IStorageRepo } from './dataRepo';

/**
 * Implements the IStorageRepo interface using Firebase Cloud Storage.
 * This class handles all file upload and download operations.
 */
class FirebaseStorageRepo implements IStorageRepo {
    /**
     * Uploads an expense receipt file to Firebase Storage.
     * 
     * This method includes a timeout mechanism to handle potential network issues or
     * CORS configuration problems on the storage bucket, which can cause uploads to hang indefinitely
     * without throwing an error from the SDK.
     * 
     * @param file The file object to upload.
     * @param userId The UID of the user uploading the file, used to structure the storage path.
     * @param expenseId The unique ID of the expense item this file is associated with.
     * @returns A promise that resolves with the public download URL and the original file name.
     */
    uploadExpenseReceipt(file: File, userId: string, expenseId: string): Promise<{ downloadURL: string, fileName: string }> {
        const UPLOAD_TIMEOUT_MS = 30000; // 30 seconds

        const uploadPromise = new Promise<{ downloadURL: string; fileName: string }>((resolve, reject) => {
            console.log(`[storageRepo] Starting upload for userId: ${userId}, file: ${file.name}`);

            if (!userId || !expenseId) {
                const errorMsg = "User or expense ID is missing.";
                console.error(`[storageRepo] Critical Error: ${errorMsg}`);
                return reject(new Error(errorMsg));
            }

            // Create a structured storage reference. This path helps organize files and can be used
            // in storage security rules to enforce access control (e.g., a user can only write to their own folder).
            // Path: `receipts/{userId}/{expenseId}/{fileName}`
            const storageRef = ref(storage, `receipts/${userId}/${expenseId}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            // Listen for state changes, errors, and completion of the upload.
            uploadTask.on('state_changed',
                (snapshot) => {
                    // Progress monitoring can be implemented here if needed (e.g., for an upload progress bar).
                    // const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    // console.log('Upload is ' + progress + '% done');
                },
                (error) => {
                    // Handles SDK-level errors (e.g., permission denied from security rules).
                    console.error("[storageRepo] Upload failed in SDK error callback.", error);
                    reject(error);
                },
                () => {
                    // On successful upload, get the public URL for the file.
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        console.log("[storageRepo] Upload complete, URL obtained.");
                        resolve({ downloadURL, fileName: file.name });
                    }).catch((error) => {
                        console.error("[storageRepo] Failed to get download URL after upload.", error);
                        reject(error);
                    });
                }
            );
        });

        // Creates a promise that will reject after a specified timeout.
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error("Upload timed out after 30 seconds. This is likely a CORS configuration issue on the storage bucket."));
            }, UPLOAD_TIMEOUT_MS);
        });

        // `Promise.race` resolves or rejects as soon as one of the input promises resolves or rejects.
        // This allows the timeout to cancel the operation if the upload takes too long.
        return Promise.race([uploadPromise, timeoutPromise]);
    }
}

// Export a singleton instance of the repository.
export const storageRepo = new FirebaseStorageRepo();
