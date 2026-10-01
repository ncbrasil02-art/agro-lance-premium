# Project Architecture

- Store application roles only in `public.user_roles`; expose the effective role to UI profile state after server-validated `is_admin()` checks, never as an authoritative `profiles` column. This prevents profile updates from escalating privileges.
- Keep uploaded media private by default and grant access by owner folder or administrator policy. This follows the workspace security policy that blocks public buckets.
