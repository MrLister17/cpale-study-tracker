# CPALE Study Tracker

A free, mobile friendly CPALE study planner and practice space. The public site is a **guest preview**, not the completed account beta. The current PRC syllabus index contains 465 outcomes across six subjects. Original study paths, a daily calendar, TOS weighted scheduling, private question banks, diagnostic and subject mock builders, and learning evidence are implemented. Factual lessons and starter answer keys remain owner-only drafts until reviewed and published. See [CPALE_COMPLETION_DELIVERY.md](./CPALE_COMPLETION_DELIVERY.md) for roles, gates, and the remaining work.

## Local setup

Use Node.js 22 and npm. Copy `.env.example` to `.env.local` and set the Supabase project URL and **publishable** key. Keep `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false` until Google OAuth is configured and tested. Keep email auth disabled until SMTP signup and reset mail work. Never put a secret or service-role key in this repository.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Without sign-in, edits live only in that browser's local storage. The planner provides guest backup download and restore. The dashboard calendar shows subjects and tasks for each selected day and opens the linked outcome. The quiz builder can combine topics across all six subjects; diagnostic and mock sessions disclose shortages in the approved bank. The existing Supabase project is in the owner account. Apply migrations in `supabase/migrations` in filename order to a different Supabase project for development or restore testing; do not rerun them blindly against production.

## Checks

```sh
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

The PDF extraction script `scripts/extract-tos.py` reads the supplied TOS and writes `src/data/syllabus.json`. Its output is a review queue. Six subject outlines are in [CPALE_SUBJECT_GUIDES_DRAFT.md](./CPALE_SUBJECT_GUIDES_DRAFT.md). The Subjects page also contains original study paths adapted from the six supplied sample workbooks. Detailed notes and shared questions appear only after owner approval.

`python3 scripts/build-content-review-queue.py` refreshes the [TOS audit](./content/CPALE_TOS_AUDIT.md) and 465-row CSV checklist from the extracted index. [The lesson coverage report](./content/LESSON_COVERAGE.md) and [question audit](./content/PRACTICE_DRAFT_AUDIT.md) record the private draft pool and open content gap. [The sample guide content map](./content/SAMPLE_GUIDE_CONTENT_MAP.md) records which sheets informed the new study paths and which older topics were excluded. The original third-party workbooks and unreviewed factual drafts are excluded from this public repository.

## Release

Use a branch and pull request, review the Vercel preview, check the GitHub workflow, then request owner approval to merge or open the public beta. The Google Cloud setup and full acceptance checklist are in the SDLC plan. Private uploads use the `/api/materials/upload` route and Supabase Storage. Privacy and account deletion pages are included.
