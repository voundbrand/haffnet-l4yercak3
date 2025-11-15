import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * HaffNet Frontend - Barebones Schema
 *
 * Simple schema for:
 * - OAuth authentication
 * - CRM contacts
 * - CRM organizations
 */

export default defineSchema({
  // CRM Contacts
  crm_contacts: defineTable({
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Organization link
    organizationId: v.optional(v.id("crm_organizations")),

    // OAuth
    oauthProvider: v.optional(v.string()),
    oauthId: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_oauth", ["oauthProvider", "oauthId"])
    .index("by_organization", ["organizationId"]),

  // CRM Organizations
  crm_organizations: defineTable({
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"]),

  // OAuth Sessions
  sessions: defineTable({
    contactId: v.id("crm_contacts"),
    token: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_contact", ["contactId"])
    .index("by_expiry", ["expiresAt"]),
});
