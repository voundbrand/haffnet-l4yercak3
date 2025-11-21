/**
 * Convex Client for Frontend
 *
 * Handles fetching published page content from Convex backend
 * including events, checkout instances, and forms
 */

import { ConvexHttpClient } from "convex/browser";

// Initialize Convex client
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL is not configured');
}

export const convexClient = new ConvexHttpClient(CONVEX_URL);

/**
 * Published page content structure from CMS
 */
export interface PublishedPageContent {
  page: {
    _id: string;
    name: string;
    description?: string;
    customProperties: {
      slug: string;
      metaTitle?: string;
      metaDescription?: string;
      templateContent?: object;
      contentRules?: {
        events?: {
          filter?: 'all' | 'future' | 'past' | 'featured';
          visibility?: 'all' | 'public' | 'private';
          subtypes?: string[];
          limit?: number;
          sortBy?: string;
          sortOrder?: 'asc' | 'desc';
        };
        checkoutId?: string;
        formIds?: string[];
      };
    };
  };
  events: Array<{
    _id: string;
    name: string;
    description?: string;
    subtype?: string;
    status: string;
    customProperties?: {
      startDate?: number;
      endDate?: number;
      location?: string;
      isPrivate?: boolean;
      featured?: boolean;
      [key: string]: unknown;
    };
  }>;
  checkout: {
    _id: string;
    name: string;
    description?: string;
    organizationId?: string;
    customProperties?: {
      products?: string[];
      [key: string]: unknown;
    };
  } | null;
  forms: Array<{
    _id: string;
    name: string;
    description?: string;
    customProperties?: {
      schema?: object;
      [key: string]: unknown;
    };
  }>;
}

/**
 * Fetch published page content from CMS
 *
 * This is the main function to get events, checkout, and forms
 * configured for a specific page in the CMS.
 *
 * @param orgSlug - Organization slug (e.g., "voundbrand")
 * @param pageSlug - Page slug (e.g., "/events" or "/haffsymposium")
 * @returns Published page content or null if not found
 */
export async function getPageContent(
  orgSlug: string,
  pageSlug: string
): Promise<PublishedPageContent | null> {
  try {
    console.log('[Convex Client] Fetching page content:', { orgSlug, pageSlug });

    // Use direct HTTP API since we don't have generated types yet
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: 'publishingOntology:getPublishedContentForFrontend',
        args: { orgSlug, pageSlug },
      }),
    });

    if (!response.ok) {
      console.error('[Convex Client] API request failed:', response.status);
      return null;
    }

    const data = await response.json();

    if (!data) {
      console.warn('[Convex Client] No content found for page:', pageSlug);
      return null;
    }

    return data as PublishedPageContent;
  } catch (error) {
    console.error('[Convex Client] Failed to fetch page content:', error);
    return null;
  }
}

/**
 * Helper to extract checkout instance ID from page content
 *
 * @param content - Published page content from CMS
 * @returns Checkout instance ID or null
 */
export function getCheckoutInstanceId(content: PublishedPageContent | null): string | null {
  if (!content) return null;
  return content.page.customProperties.contentRules?.checkoutId || null;
}

/**
 * Helper to check if page content is valid for registration
 *
 * @param content - Published page content from CMS
 * @returns True if content has checkout configured
 */
export function hasCheckoutConfigured(content: PublishedPageContent | null): boolean {
  if (!content) return false;
  return !!content.page.customProperties.contentRules?.checkoutId;
}
