/**
 * Superadmin utilities
 * 
 * Superadmins are platform-level administrators defined via SUPERADMIN_EMAILS env variable.
 * They have access to all companies and elevated permissions.
 */

/**
 * Get list of superadmin emails from environment
 */
export function getSuperadminEmails(): string[] {
    const emails = process.env.SUPERADMIN_EMAILS || "";
    return emails
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);
}

/**
 * Check if an email belongs to a superadmin
 */
export function isSuperadmin(email: string | null | undefined): boolean {
    if (!email) return false;
    const superadmins = getSuperadminEmails();
    return superadmins.includes(email.toLowerCase());
}
