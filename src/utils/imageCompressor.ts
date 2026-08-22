/**
 * Compresses an image Base64 data URL using HTML5 Canvas.
 * Reduces the width/height to fit within the max boundaries and compresses the quality,
 * yielding a compact, web-ready JPEG.
 */
export async function compressImageBase64(
  base64Str: string,
  maxWidth = 480,
  maxHeight = 480,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve) => {
    // If it's empty, resolve immediately
    if (!base64Str || !base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while keeping aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Draw to canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Handle transparency with white background for JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Generate compressed JPEG Base64
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } else {
        resolve(base64Str);
      }
    };

    img.onerror = () => {
      // Fallback to original image if anything goes wrong
      resolve(base64Str);
    };
  });
}
