---
trigger: always_on
description: "Universal clean modular architecture guidelines for React and Next.js fullstack projects: 3-tier orchestrator pattern and backend gateway standards."
---

# Universal Modular Architecture & Lean Abstraction Guidelines

Follow these architectural invariants when writing, refactoring, or reviewing fullstack React / Next.js codebases:

## 1. Frontend: The 3-Tier Orchestrator Pattern

Every feature page must strictly separate Layout, State/Mutation, and Presentation:

1. **Tier 1: Page Orchestrator (`app/**/page.tsx`)**:
   - Size limit: **< 250 lines**.
   - Role: Pure declarative layout and wiring. Calls the feature hook and passes props down.
   - Prohibited: Inline `fetch()` calls, raw complex math/data transformations in render, or declaring > 3 unrelated `useState` hooks directly in the page.

2. **Tier 2: Native State Encapsulation (`hooks/use<Feature>.ts`)**:
   - Encapsulate all feature state, API mutations, side effects (`useEffect`), and toast notifications.
   - Use native React hooks (`useState`, `useCallback`, `useReducer`). Do NOT introduce third-party global stores (Zustand, Redux) for page-scoped or route-scoped state.
   - Return clean, grouped state and typed action handlers.

3. **Tier 3: Presentational Components (`components/<feature>/*.tsx`)**:
   - Pure UI components accepting data and event callbacks via props.
   - Keep modal dialogs, complex tab lists, and form sub-sections in dedicated component files.

## 2. Backend: Unified Gateways & Shared Domain Engines

1. **Centralized Auth Guards**:
   - Route handlers must NOT duplicate manual multi-line session/role checks.
   - Use a centralized guard helper (e.g., `requireAuth(allowedRoles)` returning `{ session, errorResponse }`).
   - If `errorResponse` exists, return it immediately in a single line.

2. **Standardized Responses & Error Parsing**:
   - Standardize responses via helpers (e.g., `apiSuccess()` and `handleRouteError()`).
   - Schema validation errors (such as Zod `error.issues[0]?.message`) must be parsed centrally, returning HTTP 400 without manual repetitive try-catch blocks.

3. **Shared Business Logic Engines**:
   - Business operations shared between manual user actions and automated cron jobs must be extracted to pure domain functions in `lib/`.
   - Route handlers must serve solely as HTTP transport adapters over these domain functions.
