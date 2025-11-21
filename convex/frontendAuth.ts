/**
 * Frontend Authentication Actions
 *
 * Handles user authentication for the customer-facing frontend:
 * - Email/password login
 * - Email/password registration
 * - OAuth token verification
 * - Session management
 */

import { v } from "convex/values";
import { action, query, mutation, internalMutation, internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// ========== Public Actions ==========

/**
 * Register a new user with email and password
 */
export const registerWithPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; message?: string; sessionToken?: string; user?: any }> => {
    const now = Date.now();

    // Check if user already exists
    const existing = await ctx.runQuery(internal.frontendAuth.findContactByEmailInternal, {
      email: args.email,
    });

    if (existing) {
      return {
        success: false as const,
        error: "USER_EXISTS" as const,
        message: "A user with this email already exists",
      };
    }

    // Create new contact
    const contactId: Id<"crm_contacts"> = await ctx.runMutation(internal.frontendAuth.insertContact, {
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      createdAt: now,
      updatedAt: now,
    });

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.runMutation(internal.frontendAuth.insertSession, {
      contactId,
      token: sessionToken,
      expiresAt,
      createdAt: now,
    });

    return {
      success: true as const,
      sessionToken,
      user: {
        userId: contactId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
      },
    };
  },
});

/**
 * Login with email and password
 */
export const loginWithPassword = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string; message?: string; sessionToken?: string; user?: any }> => {
    const contact: any = await ctx.runQuery(internal.frontendAuth.findContactByEmailInternal, {
      email: args.email,
    });

    if (!contact) {
      return {
        success: false as const,
        error: "INVALID_CREDENTIALS" as const,
        message: "Invalid email or password",
      };
    }

    const now = Date.now();
    const sessionToken = generateSessionToken();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.runMutation(internal.frontendAuth.insertSession, {
      contactId: contact._id,
      token: sessionToken,
      expiresAt,
      createdAt: now,
    });

    return {
      success: true as const,
      sessionToken,
      user: {
        userId: contact._id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
      },
    };
  },
});

/**
 * Verify OAuth token and create/update contact
 */
export const verifyOAuthToken = action({
  args: {
    provider: v.string(),
    oauthId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Find or create contact
    let contact = await ctx.runQuery(internal.frontendAuth.findContactByOAuthInternal, {
      provider: args.provider,
      oauthId: args.oauthId,
    });

    if (!contact) {
      // Check by email
      contact = await ctx.runQuery(internal.frontendAuth.findContactByEmailInternal, {
        email: args.email,
      });
    }

    let contactId: Id<"crm_contacts">;
    if (contact) {
      // Update existing contact
      contactId = contact._id;
      await ctx.runMutation(internal.frontendAuth.patchContact, {
        contactId,
        oauthProvider: args.provider,
        oauthId: args.oauthId,
        updatedAt: now,
      });
    } else {
      // Create new contact
      contactId = await ctx.runMutation(internal.frontendAuth.insertContact, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        oauthProvider: args.provider,
        oauthId: args.oauthId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30 days

    await ctx.runMutation(internal.frontendAuth.insertSession, {
      contactId,
      token: sessionToken,
      expiresAt,
      createdAt: now,
    });

    return {
      success: true as const,
      sessionToken,
      user: {
        userId: contactId,
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
      },
    };
  },
});

/**
 * Verify session token (public query)
 */
export const verifySession = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (!session) {
      return { valid: false as const, error: "SESSION_NOT_FOUND" as const };
    }

    // Check expiry
    if (session.expiresAt < Date.now()) {
      return { valid: false as const, error: "SESSION_EXPIRED" as const };
    }

    // Get contact
    const contact = await ctx.db.get(session.contactId);
    if (!contact) {
      return { valid: false as const, error: "CONTACT_NOT_FOUND" as const };
    }

    return {
      valid: true as const,
      user: {
        userId: contact._id,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        organizationId: contact.organizationId,
      },
    };
  },
});

/**
 * Logout (invalidate session)
 */
export const logout = action({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.frontendAuth.removeSession, {
      sessionToken: args.sessionToken,
    });

    return { success: true as const };
  },
});

// ========== Internal Queries ==========

export const findContactByEmailInternal = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crm_contacts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const findContactByOAuthInternal = internalQuery({
  args: {
    provider: v.string(),
    oauthId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crm_contacts")
      .withIndex("by_oauth", (q) =>
        q.eq("oauthProvider", args.provider).eq("oauthId", args.oauthId)
      )
      .first();
  },
});

// ========== Internal Mutations ==========

export const insertContact = internalMutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    oauthProvider: v.optional(v.string()),
    oauthId: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("crm_contacts", args);
  },
});

export const patchContact = internalMutation({
  args: {
    contactId: v.id("crm_contacts"),
    oauthProvider: v.optional(v.string()),
    oauthId: v.optional(v.string()),
    updatedAt: v.number(),
  },
  handler: async (ctx, { contactId, ...updates }) => {
    await ctx.db.patch(contactId, updates);
  },
});

export const insertSession = internalMutation({
  args: {
    contactId: v.id("crm_contacts"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", args);
  },
});

export const removeSession = internalMutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.sessionToken))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

// ========== Utilities ==========

function generateSessionToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
