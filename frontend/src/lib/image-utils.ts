// lib/image-utils.ts
/**
 * Get full image URL from backend
 * Static files are served from backend root, not /api
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  // console.log("🔍 getImageUrl called with:", imageUrl);
  if (!imageUrl) {
    // console.log("🔍 No imageUrl, returning placeholder");
    return "/placeholder.svg";
  }

  // Already full URL
  if (imageUrl.startsWith("http")) {
    // console.log("🔍 Already full URL:", imageUrl);
    return imageUrl;
  }

  // For static files, use API_URL without /api prefix
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4060/api";
  const backendUrl = baseUrl.replace("/api", "");
  // console.log("🔍 Backend base URL:", backendUrl);
  // Clean up the image URL
  let cleanImageUrl = imageUrl;

  // Remove /api prefix if present
  if (cleanImageUrl.startsWith("/api/")) {
    cleanImageUrl = cleanImageUrl.replace("/api/", "/");
    // console.log("🔍 Removed /api prefix, clean URL:", cleanImageUrl);
  }

  // Ensure it starts with a slash
  if (!cleanImageUrl.startsWith("/")) {
    cleanImageUrl = `/${cleanImageUrl}`;
    // console.log("🔍 Added leading slash, clean URL:", cleanImageUrl);
  }

  const result = `${backendUrl}${cleanImageUrl}`;

  return result;
}
