// telegram-bot/src/utils/urlUtils.ts
import { BOT_CONFIG } from "../config";

export class UrlUtils {
  /**
   * Get safe Web App URL for Telegram buttons
   */
  static getWebAppUrl(
    path: string = "",
    params: Record<string, string> = {}
  ): string {
    const baseUrl = BOT_CONFIG.webAppUrl || "http://localhost:3000";

    // Build URL with path and params
    let url = baseUrl;
    if (path && !path.startsWith("/")) {
      url += "/" + path;
    } else if (path) {
      url += path;
    }

    // Add query parameters if any
    if (Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams(params);
      const queryString = queryParams.toString();
      url += (url.includes("?") ? "&" : "?") + queryString;
    }

    return url;
  }

  /**
   * Check if URL can be used for Web App buttons
   */
  static canUseWebAppButtons(): boolean {
    // Explicitly check if webAppUrl exists before using startsWith
    return (
      !!BOT_CONFIG.webAppUrl && BOT_CONFIG.webAppUrl.startsWith("https://")
    );
  }
}
