import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { getFirebaseStorage, isFirebaseConfigured } from '../db/firebase';
import { compressImageBase64 } from '../utils/imageCompressor';

// In-memory cache to prevent re-uploading identical images
const imageUploadCache = new Map<string, string>();

/**
 * Uploads an image (File, Blob, or Base64 data URL) to Firebase Cloud Storage.
 * Returns the lightweight HTTPS download URL.
 * If Cloud Storage is unavailable, slow, or offline, safely returns the compressed Base64.
 * Never hangs or blocks the user interface.
 */
export async function uploadDocumentPhoto(
  source: string | File | Blob,
  folder: string = 'permits'
): Promise<string> {
  if (!source) return '';

  let base64Data: string = '';
  let rawFile: File | Blob | null = null;

  if (typeof source === 'string') {
    // If it's already a cloud URL (http/https), return as is without re-uploading
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return source;
    }
    // Check in-memory cache for this exact base64 data
    if (imageUploadCache.has(source)) {
      return imageUploadCache.get(source)!;
    }
    base64Data = source;
  } else {
    rawFile = source;
  }

  // If source is a file/blob, convert to base64 with a 1500ms timeout
  if (rawFile && !base64Data) {
    base64Data = await new Promise<string>((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve('');
        }
      }, 1500);

      try {
        const reader = new FileReader();
        reader.onload = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve((reader.result as string) || '');
          }
        };
        reader.onerror = () => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            resolve('');
          }
        };
        reader.readAsDataURL(rawFile!);
      } catch {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve('');
        }
      }
    });
  }

  if (!base64Data) {
    return '';
  }

  if (imageUploadCache.has(base64Data)) {
    return imageUploadCache.get(base64Data)!;
  }

  // Compress the image before uploading (max 600x600, quality 0.70)
  let compressedBase64 = base64Data;
  try {
    compressedBase64 = await compressImageBase64(base64Data, 600, 600, 0.70);
  } catch (compErr) {
    console.warn('Image compression warning, using raw data:', compErr);
  }

  // If Firebase is not configured or in offline environment, immediately return compressed base64
  if (!isFirebaseConfigured() || typeof window === 'undefined' || !navigator.onLine) {
    imageUploadCache.set(base64Data, compressedBase64);
    return compressedBase64;
  }

  // Attempt Firebase Cloud Storage upload with strict 2000ms max timeout
  try {
    const uploadTask = (async () => {
      const storage = getFirebaseStorage();
      const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const storagePath = `${folder}/${uniqueId}.jpg`;
      const storageRef = ref(storage, storagePath);

      await uploadString(storageRef, compressedBase64, 'data_url', {
        contentType: 'image/jpeg',
        cacheControl: 'public,max-age=31536000',
      });

      const downloadUrl = await getDownloadURL(storageRef);
      if (downloadUrl) {
        imageUploadCache.set(base64Data, downloadUrl);
        imageUploadCache.set(compressedBase64, downloadUrl);
      }
      return downloadUrl;
    })();

    // Race uploadTask against 2000ms timeout
    const result = await Promise.race([
      uploadTask,
      new Promise<string>((resolve) => setTimeout(() => resolve(compressedBase64), 2000)),
    ]);

    const finalUrl = result || compressedBase64;
    imageUploadCache.set(base64Data, finalUrl);
    return finalUrl;
  } catch (storageErr) {
    console.warn('Cloud Storage upload notice, falling back to local compressed image:', storageErr);
    imageUploadCache.set(base64Data, compressedBase64);
    return compressedBase64;
  }
}

/**
 * Checks if a string is a remote URL rather than a heavy Base64 data string
 */
export function isRemoteStorageUrl(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('gs://');
}

