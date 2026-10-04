# CPALE Study Tracker

A free, mobile friendly CPALE study planner and practice space. This is an **unreleased preview** until the syllabus, guides, starter questions, sign-in, security, and release gates in [CPALE_STUDY_TRACKER_SDLC_PLAN.md](./CPALE_STUDY_TRACKER_SDLC_PLAN.md) pass owner review.

## Local setup

Use Node.js 22 and npm. Copy `.env.example` to `.env.local` and set the Supabase project URL and **publishable** key. Keep `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false` until Google OAuth is configured and tested. Keep email auth disabled until SMTP signup and reset mail work. Never put a secret or service-role key in this repository.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Without sign-in, edits live only in that browser's local storage. The existing Supabase project is in the owner account. Apply migrations in `supabase/migrations` in filename order to a different Supabase project for development or restore testing; do not rerun them blindly against production.

## Checks

```sh
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

The PDF extraction script `scripts/extract-tos.py` reads the supplied TOS and writes `src/data/syllabus.json`. Its output is a review queue, not reviewed teaching content. Six subject outlines are in [CPALE_SUBJECT_GUIDES_DRAFT.md](./CPALE_SUBJECT_GUIDES_DRAFT.md). The app only displays approved guides and shared questions.

## Release

Use a branch and pull request, review the Vercel preview, check the GitHub workflow, then request owner approval to merge or open the public beta. The Google Cloud setup and full acceptance checklist are in the SDLC plan. Private uploads use the `/api/materials/upload` route and Supabase Storage. Privacy and account deletion pages are included.
