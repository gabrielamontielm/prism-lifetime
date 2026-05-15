import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './firebase';

/**
 * Uploads a file to Firebase Storage with progress tracking
 * @param file The file to upload
 * @param path The base path in storage (e.g., 'events', 'profiles')
 * @param onProgress Callback for upload progress (0-100)
 * @returns Promise with the download URL
 */
export async function uploadFile(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storageRef = ref(storage, `${path}/${file.name}`);
  
  const uploadTask = uploadBytesResumable(storageRef, file);

  console.log(`[Storage] Starting upload to ${path}/${file.name}. User:`, auth.currentUser?.uid);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(progress);
      },
      (error) => {
        console.error('Storage Upload Error:', error);
        if (error.code === 'storage/unauthorized') {
          const customError = new Error('Storage Access Denied: Please ensure your Firebase Storage Security Rules are configured. See docs/STORAGE_CORS.md');
          (customError as any).code = error.code;
          reject(customError);
        } else {
          reject(error);
        }
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
}
