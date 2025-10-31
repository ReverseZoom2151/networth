// Camera functionality for receipt scanning
// Take photos, scan receipts, and process expense data

import { isMobile } from './platform';
import { haptics } from './mobile';

export interface ReceiptPhoto {
  path: string;
  webPath: string;
  format: string;
  base64?: string;
}

/**
 * Take a photo of a receipt using native camera
 * Returns photo data including path and base64
 */
export const takeReceiptPhoto = async (): Promise<ReceiptPhoto | null> => {
  if (!isMobile()) {
    // Web fallback - use file input
    return await takePhotoWeb();
  }

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

    // Trigger haptic feedback
    await haptics.light();

    // Take photo
    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      promptLabelHeader: 'Receipt Scanner',
      promptLabelCancel: 'Cancel',
      promptLabelPhoto: 'From Gallery',
      promptLabelPicture: 'Take Photo',
    });

    return {
      path: photo.path || '',
      webPath: photo.webPath || '',
      format: photo.format,
    };
  } catch (error) {
    console.error('Failed to take photo:', error);
    return null;
  }
};

/**
 * Select a receipt photo from gallery
 */
export const selectReceiptFromGallery = async (): Promise<ReceiptPhoto | null> => {
  if (!isMobile()) {
    return await takePhotoWeb();
  }

  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');

    await haptics.light();

    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });

    return {
      path: photo.path || '',
      webPath: photo.webPath || '',
      format: photo.format,
    };
  } catch (error) {
    console.error('Failed to select photo:', error);
    return null;
  }
};

/**
 * Web fallback - use file input
 */
const takePhotoWeb = async (): Promise<ReceiptPhoto | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use back camera on mobile web

    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (!file) {
        resolve(null);
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        resolve({
          path: '',
          webPath: URL.createObjectURL(file),
          format: file.type.split('/')[1],
          base64,
        });
      };
      reader.readAsDataURL(file);
    };

    input.click();
  });
};

/**
 * Save receipt photo to device storage
 */
export const saveReceiptPhoto = async (
  photo: ReceiptPhoto,
  fileName: string
): Promise<string | null> => {
  if (!isMobile()) {
    console.log('Save to storage only available on mobile');
    return photo.webPath;
  }

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    // Read the photo
    const base64Data = photo.base64 || (await readPhotoAsBase64(photo.webPath));

    // Save to Documents directory
    const result = await Filesystem.writeFile({
      path: `receipts/${fileName}.${photo.format}`,
      data: base64Data,
      directory: Directory.Documents,
    });

    console.log('Receipt saved:', result.uri);
    return result.uri;
  } catch (error) {
    console.error('Failed to save receipt:', error);
    return null;
  }
};

/**
 * Read photo as base64
 */
const readPhotoAsBase64 = async (webPath: string): Promise<string> => {
  const response = await fetch(webPath);
  const blob = await response.blob();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Delete a receipt photo
 */
export const deleteReceiptPhoto = async (path: string): Promise<boolean> => {
  if (!isMobile()) return false;

  try {
    const { Filesystem } = await import('@capacitor/filesystem');
    await Filesystem.deleteFile({ path });
    return true;
  } catch (error) {
    console.error('Failed to delete receipt:', error);
    return false;
  }
};

/**
 * Get list of saved receipts
 */
export const getSavedReceipts = async (): Promise<string[]> => {
  if (!isMobile()) return [];

  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');

    const result = await Filesystem.readdir({
      path: 'receipts',
      directory: Directory.Documents,
    });

    return result.files.map((file) => file.name);
  } catch (error) {
    console.error('Failed to get receipts:', error);
    return [];
  }
};

/**
 * Process receipt with AI (OCR and data extraction)
 * This would typically call your backend API to process the image
 */
export const processReceiptWithAI = async (
  photo: ReceiptPhoto
): Promise<{
  merchant: string;
  date: string;
  total: number;
  items: Array<{ name: string; price: number }>;
} | null> => {
  try {
    // In production, send photo to your backend API for processing
    // Backend would use OCR (like Google Vision API, AWS Textract, or Azure Computer Vision)

    const base64Data = photo.base64 || (await readPhotoAsBase64(photo.webPath));

    const response = await fetch('/api/receipts/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Data }),
    });

    if (!response.ok) {
      throw new Error('Failed to process receipt');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to process receipt with AI:', error);
    return null;
  }
};
