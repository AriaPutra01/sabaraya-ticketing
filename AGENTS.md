<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent Guidelines for Sabaraya Ticketing

This document outlines architectural decisions, design patterns, coding conventions, and operational workflows for AI agents working in this repository.

---

## 1. Stack & Architecture

- **Framework**: Next.js 16.4 App Router with Turbopack and React 19.
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`).
- **Database**: PostgreSQL (Neon Serverless compatible) accessed via Prisma ORM v6.
- **Auth**: Stateless JWT (`access_token` in 15-min HTTP-only cookie) backed by stateful PostgreSQL `sessions` table (`refresh_token` with 7-day rotation). **No Redis**.
- **Object Storage**: Cloudflare R2 via AWS S3 SDK v3 presigned URLs (`lib/s3.ts`). Direct client-to-R2 `PUT` uploads with local base64 fallback.

---

## 2. Core Workflows & Business Rules

### 2.1 Ticket Lifecycle
1. **Creation (`POST /api/tickets`)**: Publicly accessible. Ticket starts in `PENDING` status. Stored with a 6-digit collision-resistant code (`SBY-YYMM-XXXXXX`). Cookie `sbr_tickets` tracks submitted ticket codes for the browser.
2. **Assignment (`POST /api/tickets/[id]/assign`)**: Manual assignment by `ADMIN` or `SUPERADMIN`. Moves status to `ASSIGNED`.
3. **Fail-Safe Auto-Assign (`/api/cron/auto-assign` or `POST /api/admin/tickets/auto-assign`)**: Runs automatically for tickets `PENDING` > 30 minutes. Round-robin algorithm in `lib/round-robin.ts` selects eligible staff with active schedule in region and lowest active workload (`ASSIGNED` + `IN_PROGRESS`).
4. **Employee Confirmation**:
   - **Accept (`POST /api/tickets/[id]/progress`)**: Moves status to `IN_PROGRESS`, records `respondedAt`.
   - **Reject (`POST /api/tickets/[id]/reject`)**: Mandatory reason (>= 5 chars). Reverts ticket to `PENDING` with `assigneeId: null` and logs the rejection activity.
5. **Resolution (`POST /api/tickets/[id]/resolve`)**: Employee or Admin records resolution notes. Status moves to `RESOLVED` with `resolvedAt`.
6. **Closing (`POST /api/tickets/[id]/close`)**: Admin/Superadmin officially closes ticket. Status moves to `CLOSED`.

### 2.2 Roles & Permissions
- `SUPERADMIN`: Full access (can manage/delete users, edit regions, schedules, tickets).
- `ADMIN`: Operational management (cannot delete users; can assign tickets, manage regions, schedules).
- `EMPLOYEE`: Field technician / IT staff. Only views tickets assigned to them; can accept, reject, and resolve assigned tickets.

---

## 3. Strict Coding Conventions for Agents

1. **Database Atomicity (`prisma.$transaction`)**:
   Every state change on `Ticket` that writes an entry to `TicketActivity` MUST be executed within a single `prisma.$transaction`. Never perform disjoint queries that can leave orphan statuses or missing audit trails.
2. **Next.js 16 Cache & Dynamic Rendering**:
   Do NOT use `export const dynamic = "force-dynamic"` in Server Components or dynamic Route Handlers (conflicts with `cacheComponents`). Instead, import and await `connection()`:
   ```ts
   import { connection } from "next/server";
   await connection();
   ```
3. **Zod v4 Schema Validation**:
   Zod v4 returns error issues under `error.issues`, NOT `error.errors`. Always extract messages via `error.issues[0]?.message`.
4. **Prisma Client Singleton**:
   Always import `prisma` from `@/lib/prisma`. Do not instantiate `new PrismaClient()` directly in routes.
5. **Session & Cookie Security**:
   Tokens are stored in HTTP-only, `sameSite: "lax"`, secure (in production) cookies. Never expose token secrets or sensitive user password hashes in API responses.
6. **Presigned R2 Uploads**:
   Max 3 images per ticket, max 5MB per file, allowed types: `image/jpeg`, `image/png`, `image/webp`. Uploads from browser to R2 run in parallel via `Promise.all`.

---

## 4. Verification Commands

Before finalizing any changes, always run:
```bash
npm run lint
npm run build
```
Both commands must pass with exit code 0.
