# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CMS for GKI Pregbun (a church website). Built on the **Laravel React Starter Kit**: Laravel 12 (PHP 8.2+) backend serving a React 19 + TypeScript frontend through **Inertia.js v2** — there is no separate REST/JSON API for the app's own pages; controllers return `Inertia::render('page-name')` and pages live in [resources/js/pages/](resources/js/pages/).

## Commands

```bash
composer dev          # Run everything: php serve + queue listener + vite (concurrently). Primary dev command.
npm run dev           # Vite dev server only
npm run build         # Production build
npm run build:ssr     # Build with SSR bundle
npm run lint          # ESLint with --fix over the repo
npm run format        # Prettier write over resources/
npm run format:check  # Prettier check only
vendor/bin/pint       # PHP code style (Laravel Pint)
```

Tests use **Pest**:

```bash
php artisan test                        # Full suite
php artisan test --filter=test_name     # Single test by name
vendor/bin/pest tests/Feature/DashboardTest.php   # Single file
```

Note: the shell here is PowerShell on Windows. `vendor/bin/pest` / `vendor/bin/pint` resolve via PHP; there is no `.sh` wrapper needed.

## Data layer — read this before touching the database

- **Persistence is Eloquent-only.** Models + migrations in [database/migrations/](database/migrations/) are the single source of truth (e.g. [app/Models/Dummy.php](app/Models/Dummy.php) maps to table `dummy`). Prisma was removed — there is no second ORM to keep in sync.
- **The DB is Supabase Postgres.** `config/database.php`'s `default` is still `sqlite` (starter-kit leftover), but `.env` sets `DB_CONNECTION=pgsql`, and the `pgsql` connection reads its DSN from **`DATABASE_URL`** (not the usual `DB_*` vars) — see [config/database.php:87](config/database.php#L87). `DATABASE_URL` points at the Supabase connection pooler.
- **PHP requirement:** the `pdo_pgsql` / `pgsql` extensions must be enabled in `php.ini`, or every query fails with `could not find driver`.

**File storage** goes to Supabase Storage via an S3-compatible disk named `supabase` ([config/filesystems.php:60](config/filesystems.php#L60)). Upload pattern: `$request->file(...)->store('folder', 'supabase')` then `Storage::disk('supabase')->url($path)` — see [DummyController.php](app/Http/Controllers/DummyController.php) as the reference example.

## Frontend architecture

- **Routing**: PHP routes in [routes/web.php](routes/web.php) define named routes; auth/settings routes are split into [routes/auth.php](routes/auth.php) and [routes/settings.php](routes/settings.php). The React side calls Laravel routes by name via **Ziggy** — the global `route()` helper is available in TSX (typed in [resources/js/app.tsx](resources/js/app.tsx)). App pages are gated behind the `auth` middleware group.
- **Page resolution**: Inertia maps a render string to `./pages/<name>.tsx`. A new page = add a `Route::get(...)->name(...)` returning `Inertia::render('foo')` **and** create `resources/js/pages/foo.tsx`. To show it in the nav, add an entry to `mainNavItems` in [resources/js/components/app-sidebar.tsx](resources/js/components/app-sidebar.tsx).
- **UI components**: shadcn/ui-style primitives in [resources/js/components/ui/](resources/js/components/ui/) (Radix + `class-variance-authority` + `tailwind-merge`, composed via the `cn()` helper in [resources/js/lib/utils.ts](resources/js/lib/utils.ts)). Tailwind CSS **v4** (config-less, via `@tailwindcss/vite`). Use the `@/` import alias for `resources/js`.
- **Layouts**: `app-layout` (sidebar/header shells under `layouts/app/`) and `auth-layout` (`layouts/auth/`); settings pages use `layouts/settings/`.
- **Theme**: light/dark handled by `use-appearance` hook, initialized in `app.tsx`.

The current church-CMS pages (`kepemimpinan`, `event`, `pelayanan`, `komisi`, `dummy`) are largely placeholders being built out.
