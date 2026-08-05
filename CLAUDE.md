# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

CMS for GKI Pregbun (a church website). Built on the **Laravel React Starter Kit**: Laravel 12 (PHP 8.2+) backend serving a React 19 + TypeScript frontend through **Inertia.js v2** — there is no separate REST/JSON API for the app's own pages; controllers return `Inertia::render('page-name')` and pages live in [resources/js/pages/](resources/js/pages/).

This is the **admin CMS only** — church staff log in and edit content. The public-facing site is a separate consumer of the same database. All UI copy, flash messages, and validation text are in **Indonesian**; match that when adding features.

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

CI ([.github/workflows/](.github/workflows/)) runs on push/PR to `main` and `develop`: `lint.yml` runs Pint + `npm run format` + `npm run lint`; `tests.yml` builds assets and runs Pest. Both must pass.

## Data layer — read this before touching the database

- **Persistence is Eloquent-only.** Models + migrations in [database/migrations/](database/migrations/) are the single source of truth. Prisma was removed — there is no second ORM to keep in sync.
- **The DB is Supabase Postgres.** `config/database.php`'s `default` is still `sqlite` (starter-kit leftover), but `.env` sets `DB_CONNECTION=pgsql`, and the `pgsql` connection reads its DSN from **`DATABASE_URL`** (not the usual `DB_*` vars) — see [config/database.php:92](config/database.php#L92). `DATABASE_URL` points at the Supabase connection pooler.
- **PHP requirement:** the `pdo_pgsql` / `pgsql` extensions must be enabled in `php.ini`, or every query fails with `could not find driver`.
- **The Supabase database is shared across developers and branches.** A migration you write runs against the same tables everyone else is using. Check whether a table already exists before adding a `create` migration.
- **Never use a real `boolean` column.** Laravel binds PHP booleans as integers and the native pgsql driver rejects them (`type boolean but expression is of type integer`). Use `unsignedTinyInteger` with a `'boolean'` model cast — see [2026_06_29_140001_change_must_change_password_to_integer.php](database/migrations/2026_06_29_140001_change_must_change_password_to_integer.php) for the pattern and rationale.
- **Tests run against in-memory SQLite** ([phpunit.xml:25](phpunit.xml#L25)), not Postgres. Postgres-specific behavior (the boolean issue above, JSON column semantics) will not surface in the test suite.
- Seeders in [database/seeders/](database/seeders/) populate **fixed content rows** (kebaktian services, pelayanan ministries, persembahan accounts) rather than fake data — those pages let admins edit rows but not add or delete them. `DatabaseSeeder` only creates a test user; content seeders run individually via `php artisan db:seed --class=KebaktianSeeder`.

## File uploads — Cloudinary

**All media goes to Cloudinary**, not Supabase Storage. Production sets `FILESYSTEM_DISK=cloudinary` ([fly.toml](fly.toml)).

Use the helpers in [app/Support/](app/Support/) rather than calling `cloudinary()` directly:

```php
$uploaded = CloudinaryImage::upload($request->file('image')->getRealPath(), 'kebaktian/'.$slug);
// => ['public_id' => ..., 'url' => ...]  URL is rewritten to c_limit,w_1920,q_auto,f_auto
CloudinaryImage::delete($model->image_public_id);   // no-op on null
```

`CloudinaryVideo` is the same shape but passes `resource_type => 'video'` on both upload and destroy — video deletes fail silently without it.

Conventions that hold across every media-owning model:
- Store **both** `*_public_id` and `*_url` columns. The `public_id` is what deletes; the `url` is what the public site reads.
- **Always delete the old asset before replacing it**, and on model deletion — Cloudinary does not garbage-collect orphans.
- Validation accepts large originals (`max:20480` for images, `max:25600` for videos) because Cloudinary compresses on delivery; don't tighten these to force users to shrink files.

Two exceptions to be aware of: [EventController](app/Http/Controllers/EventController.php) still has a private `uploadOptimized()` duplicating `CloudinaryImage` (worth consolidating when touched), and [DummyController](app/Http/Controllers/DummyController.php) is a dead starter-kit example still using the `supabase` S3 disk — it is not the pattern to copy.

## Auth, roles, and forced password change

- Users have a `role` column; `admin` is the only privileged value (`User::isAdmin()`). The `admin` middleware alias ([EnsureUserIsAdmin](app/Http/Middleware/EnsureUserIsAdmin.php)) gates [routes/user.php](routes/user.php), and the sidebar independently hides the User nav item for non-admins.
- Admins create accounts with a **generated password** stored in an `encrypted`-cast `generated_password` column so it can be read back and handed to the user. It is in `$hidden` (so it never leaks via the shared `auth.user` prop) and opted back in with `makeVisible()` on the admin list only. **This is intentional — do not flag it as a security defect.**
- New users get `must_change_password = 1`. [EnsurePasswordChanged](app/Http/Middleware/EnsurePasswordChanged.php) is appended to the global `web` stack and traps them on `password.edit` until they set their own; add any newly-reachable route to its `ALLOWED` list if a forced user must be able to reach it.
- `/` renders the login screen, not a landing page. [welcome.tsx](resources/js/pages/welcome.tsx) is unused starter-kit leftover.

## Frontend architecture

- **Routing**: routes are split across [routes/web.php](routes/web.php) (dashboard/warta, home videos, kebaktian, event, persembahan) plus [auth.php](routes/auth.php), [settings.php](routes/settings.php), [user.php](routes/user.php), [tentang-kami.php](routes/tentang-kami.php), [pembangunan.php](routes/pembangunan.php), and [pelayanan.php](routes/pelayanan.php), all required at the bottom of `web.php`. Each feature file wraps its own routes in an `auth` middleware group.
- **Ziggy**: the React side calls Laravel routes **by name** via the global `route()` helper (typed in [app.tsx](resources/js/app.tsx)). Don't hardcode URL strings; a route rename should only touch the PHP side.
- **Page resolution**: Inertia maps a render string to `./pages/<name>.tsx`. A new page = a `Route::get(...)->name(...)` returning `Inertia::render('foo')` **and** `resources/js/pages/foo.tsx`. To show it in the nav, add an entry to `mainNavItems` in [app-sidebar.tsx](resources/js/components/app-sidebar.tsx).
- **Controllers redirect, they don't return JSON.** Every mutation ends with `redirect()->route('page')->with('success', '<Indonesian message>')` and the page re-renders with fresh props. Use `->withErrors([...])` for business-rule failures (e.g. hitting an image cap).
- **File uploads from the client** use `router.post(route(...), { image: file }, { forceFormData: true, preserveScroll: true })` — never `useForm().put()` with a file, since PHP does not parse multipart bodies on PUT. That is why image endpoints are `POST` even when they semantically update. Text-only edits do use `useForm().put()`.
- **UI components**: shadcn/ui-style primitives in [resources/js/components/ui/](resources/js/components/ui/) (Radix + `class-variance-authority` + `tailwind-merge`, composed via the `cn()` helper in [lib/utils.ts](resources/js/lib/utils.ts)). Tailwind CSS **v4** (config-less, via `@tailwindcss/vite`). Use the `@/` import alias for `resources/js`. Drag-reorder UIs use `@dnd-kit`; image cropping uses `react-easy-crop` before upload.
- **Layouts**: `app-layout` (sidebar/header shells under `layouts/app/`) and `auth-layout` (`layouts/auth/`); settings pages use `layouts/settings/`.
- **Theme**: light/dark handled by `use-appearance` hook, initialized in `app.tsx`.

## Recurring patterns worth reusing

- **Singleton settings rows**: `HomeSetting::current()` / `GivePageSetting` use `firstOrCreate([])` so the row materializes on first use — no seeder needed.
- **Ordered child collections** (kebaktian images, pelayanan images, persembahan, hamba tuhan, pembangunan images): an `order` integer column, a dedicated `reorder` route taking `ids[]`, and a loop assigning `$index + 1`. Caps such as `MAX_IMAGES = 5` live as a controller constant and are passed to the page as a prop so the UI can disable the add button.
- **Form Requests** ([app/Http/Requests/](app/Http/Requests/)) exist for Event/Persembahan/RecurringEvent; other controllers validate inline. Either is acceptable — follow whatever the controller you're editing already does.

## Deployment

Fly.io ([fly.toml](fly.toml)) building the [Dockerfile](Dockerfile) (php:8.3-fpm-alpine + nginx + supervisor, configs in [docker/](docker/)). Production runs `SESSION_DRIVER=cookie`, `CACHE_STORE=array`, `QUEUE_CONNECTION=sync` — there is no Redis or persistent queue worker, so don't introduce work that depends on one.

## Notes & Gotchas
- Do not make any changes until you have 95% confidence in what you need to build. Ask me follow-up questions until you reach that confidence.
- After all edits, always tell me what files have been changed.
