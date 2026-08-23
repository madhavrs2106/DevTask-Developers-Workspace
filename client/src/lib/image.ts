/** Client-side image helpers for profile picture upload. */

export const AVATAR_SIZE = 256;

/**
 * Reads an image File, center-crops it to a square, downscales it to
 * AVATAR_SIZE×AVATAR_SIZE and returns a WebP data URI (~20-60 KB typically).
 */
export async function fileToAvatarDataUri(file: File, size = AVATAR_SIZE): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file (PNG, JPEG or WebP)");
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error("Image is too large — pick one under 15 MB");
  }

  const bitmap = await createImageBitmap(file);
  try {
    // Center-crop to square
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = (bitmap.width - side) / 2;
    const sy = (bitmap.height - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported in this browser");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);

    // Prefer WebP; fall back to JPEG where unsupported
    let dataUri = canvas.toDataURL("image/webp", 0.85);
    if (!dataUri.startsWith("data:image/webp")) {
      dataUri = canvas.toDataURL("image/jpeg", 0.85);
    }
    return dataUri;
  } finally {
    bitmap.close();
  }
}
