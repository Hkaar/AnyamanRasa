
# AnyamanRasa — Agent Instructions

## Project Overview

AnyamanRasa is a recipe discovery platform built around relationships between recipes, ingredients, and recipe variations.

Core features:
- Recipe discovery and search
- Recipe details
- Pantry Search
- Interactive Recipe Graph
- Ingredient exploration
- Recipe creation and variations
- User authentication and profiles

## Technology Stack

- Framework: Remix 3 (`remix` package)
- UI: Remix components (`remix/component` JSX, not React) + TypeScript
- Styling: Tailwind CSS
- Database: PostgreSQL
- Graph visualization: Cytoscape.js
- Runtime: Node.js
- Deployment: Docker (self-hosted) or Vercel + Supabase (see README)

Do not introduce React, Next.js, Laravel, Vue, or Inertia. (The SKPL's Laravel/Vue baseline is superseded by this stack.)

## Sources of Truth

1. Functional requirements: SKPL (SKPL-IFPAGI01) and docs/features.md
2. Database structure: existing migrations and docs/database.md
3. UI design: pen.dev via Pencil MCP
4. Architecture: docs/architecture.md

Do not invent requirements or database relationships.

## Architecture Rules

- Follow Remix 3 conventions: routes in `app/routes.ts`, one controller per route map in `app/actions/` (`npx remix doctor` must pass).
- Load data in GET actions and mutate in POST actions; keep business rules in `app/domain/`.
- Keep server-only code separate from browser code; only `app/**/public/**`, `app/ui/**`, `app/domain/**` and `app/routes.ts` are browser-reachable.
- Use Remix components (setup + render functions) and TypeScript; do not use React APIs or hooks.
- Prefer progressive enhancement with Remix forms.
- Follow the existing database access layer (`app/data/`, `remix/data-table` + parameterized SQL); do not introduce an ORM without approval.
- Validate and authorize mutations on the server.
- Keep business logic out of UI components.

## Design Rules

- Treat pen.dev designs as the visual source of truth.
- Use the connected Pencil MCP server to inspect designs before implementation.
- Follow the minimalist, Krepling-inspired design direction.
- Reuse components and design tokens: build on the shadcn/ui-style components in `app/ui/` (Remix ports themed with the pen.dev tokens) instead of ad-hoc class strings.
- Ensure responsive layouts and accessible controls.
- Use Bahasa Indonesia for user-facing text.
- Do not add features beyond the documented scope.

## Recipe Graph Rules

- Use Cytoscape.js for graph visualization.
- Show focused neighborhoods instead of the entire graph.
- Preserve explicit recipe lineage and relationship types.
- Provide an accessible list alternative to graph navigation.
- Do not invent relationships from visual proximity or similarity scores.

## Engineering Rules

- Follow repository conventions.
- Use strict TypeScript where supported.
- Avoid unnecessary dependencies and abstractions.
- Do not modify the database schema without justification.
- Do not expose secrets or server-only code to the client.
- Add or update relevant tests.
- Never modify unrelated files without reason.

## Agent Workflow

Before implementing a feature:

1. Inspect the repository and relevant documentation.
2. Inspect applicable pen.dev designs through MCP.
3. Identify existing components and architecture.
4. Propose a concise implementation plan.
5. Implement the smallest necessary changes.
6. Run relevant tests, type checks, and builds.
7. Report changes, verification results, and remaining issues.

Do not modify the original .pen design unless explicitly requested.
