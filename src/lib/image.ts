/**
 * Image processing utilities for optimization and resizing
 */

export interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

/**
 * Resizes an image file on the client-side using a Hidden Canvas element.
 * This ensures that high-resolution photos are optimized before being sent to Firestore/Storage,
 * reducing latency and bandwidth usage.
 * 
 * @param {File} file - The raw Image file from an input[type="file"].
 * @param {ResizeOptions} options - Configuration for maxWidth, maxHeight, quality, and format.
 * @returns {Promise<Blob>} A promise that resolves to the optimized image Blob.
 */
export async function resizeImage(
  file: File,
  options: ResizeOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.7,
    format = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    const cleanup = () => {
      URL.revokeObjectURL(url);
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Image processing timed out (10s)'));
    }, 10000);

    img.onload = () => {
      clearTimeout(timeout);
      
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          cleanup();
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Apply smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          },
          format,
          quality
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      cleanup();
      reject(new Error('Failed to load image for processing'));
    };

    img.src = url;
  });
}
