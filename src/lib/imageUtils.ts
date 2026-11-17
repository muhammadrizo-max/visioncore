export async function readImageFileFromGallery(
  file: File,
  maxWidth = 1280,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Rasmni o\'qishda xatolik yuz berdi'));
    reader.onload = () => {
      const result = reader.result as string;
      // Only resize raster images when larger than threshold; fallback cleanly for SVG/small files
      if (!file.type.startsWith('image/') || file.type === 'image/svg+xml' || file.type === 'image/gif') {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onload = () => {
        if (img.width <= maxWidth && file.size < 350 * 1024) {
          resolve(result);
          return;
        }
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const targetW = Math.max(1, Math.round(img.width * scale));
        const targetH = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outMime, quality));
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}
