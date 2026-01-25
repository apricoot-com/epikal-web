# User, Company & Billing Architecture

This document outlines the architectural decisions for managing users, companies, roles, and billing in a multi-tenant SaaS application.

---

## Core Relationships

### User → Company (Many-to-Many)

A user can belong to **multiple companies**, and a company can have **multiple users**.

```
User ←→ UserCompany (with role) ←→ Company
```

**Rationale:**
- Users may work for multiple clients/organizations
- Consultants, freelancers, or agency employees commonly need access to multiple accounts
- Easier to build multi-company support upfront than retrofit later
- Single-company behavior can be enforced at business logic level if needed

---

## Signup & Onboarding Flows

### Path 1: New User Creating a Company

1. **Signup** → User record created (email, password, name)
2. **Onboarding** → Collect company information (name, etc.)
3. **Company Created** → User linked as `owner`
4. **Trial Started** → Company enters trial period

### Path 2: Invited User

1. **Invitation Created** → Admin creates invite (email, role, companyId, token, expiry)
2. **Email Sent** → Magic link with token
3. **User Clicks Link** →
   - New user: Signup form, then auto-join company
   - Existing user: Login, then auto-join company
4. **UserCompany Created** → With the invited role

---

## Role Management

Roles are defined **at the UserCompany level**, not the User level.

| Role | Permissions |
|------|-------------|
| `owner` | Full access, manage billing, delete company, transfer ownership |
| `admin` | Manage users, settings, full feature access |
| `member` | Standard feature access |
| `viewer` | Read-only access |

**Key Insight:** The same user can be `owner` in Company A but `member` in Company B.

---

## Billing Model

### Billing is Per Company

Each company has its own:
- Subscription plan
- Payment method (Stripe customer)
- Billing cycle
- Invoice history

### Company Subscription States

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   TRIAL     │───▶│   ACTIVE    │───▶│  CANCELLED  │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │
       │                  ▼
       │           ┌─────────────┐
       └──────────▶│  PAST_DUE   │ (payment failed)
                   └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  SUSPENDED  │ (access restricted)
                   └─────────────┘
```

| State | Description |
|-------|-------------|
| `trial` | Free trial period, no payment required |
| `active` | Paid and in good standing |
| `past_due` | Payment failed, grace period |
| `suspended` | Access restricted until payment resolved |
| `cancelled` | Subscription ended, data retained temporarily |

---

## Abuse Prevention

### Problem: Users Creating New Companies to Dodge Payment

A user with unpaid invoices could potentially create a new company to continue using the service without paying.

### Solution: Restrict Company Creation Based on Payment Status

| User Status | Can Create New Company? |
|-------------|-------------------------|
| New user (no companies) | ✅ Yes (first company gets trial) |
| User with active paid company | ✅ Yes |
| User with `past_due` company (as owner) | ❌ No |
| User with `suspended` company (as owner) | ❌ No |
| User with cancelled company + unpaid debt | ❌ No |
| User with cleanly cancelled company | ⚠️ Yes (with restrictions) |

### Additional Safeguards

1. **First Company Only Gets Free Trial**
   - Subsequent companies require payment method upfront

2. **User-Level Flag**
   - `canCreateCompanies: boolean` — can be revoked for abuse

3. **Suspended Company Access**
   - Users can still log in to fix payment issues
   - Read-only or heavily restricted access

---

## Data Model Summary

### User

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `email` | string | Unique email |
| `name` | string | Display name |
| `canCreateCompanies` | boolean | Abuse prevention flag (default: true) |
| `createdAt` | datetime | Account creation date |

### Company

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `name` | string | Company name |
| `slug` | string | URL-friendly identifier |
| `subscriptionStatus` | enum | `trial`, `active`, `past_due`, `suspended`, `cancelled` |
| `stripeCustomerId` | string | Stripe customer for billing |
| `trialEndsAt` | datetime | When trial expires |
| `createdAt` | datetime | Company creation date |

### UserCompany (Junction Table)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | FK to User |
| `companyId` | string | FK to Company |
| `role` | enum | `owner`, `admin`, `member`, `viewer` |
| `joinedAt` | datetime | When user joined company |

### Invitation

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Primary key |
| `email` | string | Invitee email |
| `companyId` | string | FK to Company |
| `role` | enum | Role to assign on acceptance |
| `token` | string | Unique invitation token |
| `expiresAt` | datetime | Invitation expiry |
| `acceptedAt` | datetime | When accepted (nullable) |

---

## UI Considerations

### Company Switcher

Since users can belong to multiple companies, the UI needs:
- Company selector in header/sidebar
- Clear indication of current company context
- Ability to switch between companies seamlessly

### Onboarding States

Track and handle:
- User created but no company → Show company creation flow
- User invited but hasn't accepted → Pending invitation state
- Company in trial → Show trial countdown, upgrade prompts
- Company suspended → Show payment resolution UI

---

## Summary

| Decision | Choice |
|----------|--------|
| User-Company relationship | Many-to-many |
| Roles scoped to | UserCompany (per company) |
| Billing unit | Per company |
| Trial eligibility | First company only |
| Abuse prevention | Block company creation if user has unpaid companies |
| Company deletion | Soft delete with data retention period |

---

## Related Documents

- [Calendar & Scheduling Architecture](./calendar-scheduling.md) - Appointments, professionals, working hours
- [i18n & Terminology Architecture](./i18n-terminology.md) - Multi-language and custom business terms
