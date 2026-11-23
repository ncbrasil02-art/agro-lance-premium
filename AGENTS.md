# Project Architecture

- Store application roles only in `public.user_roles`; expose the effective role to UI profile state after server-validated `is_admin()` checks, never as an authoritative `profiles` column. This prevents profile updates from escalating privileges.
- Keep uploaded media private by default and grant access by owner folder or administrator policy. This follows the workspace security policy that blocks public buckets.
- Use the public custom domain as the single canonical origin for metadata, robots directives, structured data, and sitemap URLs. This prevents search signals from splitting across deployment hosts.
- Route error components accept unknown errors and narrow them before reading properties, matching the router's error contract without unsafe casts.
- Shared auction cards own their state in non-null child components so missing rows never change hook ordering.
- Catalog demonstration records use DEMO internal codes and explicit illustrative descriptions; direct-sale demonstrations cannot submit purchase requests.
- Use system sans-serif typography for the shared catalog and slides to avoid font changes while loading.
- Catalog cards reserve a fixed 16:9 media frame with a full-size block link; auction screens use scoped shared surface styles to preserve consistent sizing without changing bidding logic.
- Resolve private catalog images through exact references authorized by anonymous record RLS; sign unpublished previews with the user's storage permissions, never publish buckets or persist expiring URLs.
- Catalog synchronization keeps channel callbacks in refs and reconciles visible lists independently of socket status, so re-renders and missing table notifications cannot leave bid prices stale.
