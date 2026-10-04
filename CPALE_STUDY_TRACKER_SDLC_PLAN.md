# CPALE Study Tracker — software development and release plan

Updated: October 4, 2026 (Philippine time). Owner: MrLister17. Scope: a free, ten-student beta plus one owner account.

## 1. Outcome and release boundary

Build a mobile friendly CPALE study space for candidates targeting May 2027 and later cycles. A student enters a **provisional** exam date until the Professional Regulation Commission (PRC) publishes a confirmed schedule. The site draws visual direction from the supplied pink, green, and floral screenshot, with original artwork and current dates rather than its old October 2026 values.

The supplied 38-page PRC Board of Accountancy Table of Specifications (TOS), effective October 2022, is the scope source: [PRC TOS](https://www.prc.gov.ph/sites/default/files/2022-30%20BOA%20TOS%20Final.pdf). The extraction currently contains 462 outcome entries across Financial Accounting and Reporting (FAR), Advanced Financial Accounting and Reporting (AFAR), Management Services (MAS), Auditing (AUD), Regulatory Framework for Business Transactions (RFBT), and Taxation (TAX). **These extracted labels still require editorial comparison with the PDF.** A published guide or starter question requires owner review; no placeholder material is represented as a reviewed lesson.

The free beta has no payments, live AI, or premium entitlements. A future paid version requires a separate commercial hosting and pricing decision. Six subject-level study outlines are prepared in [CPALE_SUBJECT_GUIDES_DRAFT.md](./CPALE_SUBJECT_GUIDES_DRAFT.md) for the owner to review and turn into approved topic guides.

## 2. Roles and decision rights

| Work | Project owner | Codex development team | Student beta tester |
|---|---|---|---|
| Scope and design | Approves behavior, accessibility, visual direction, release criteria, and major changes | Writes specification, flows, backlog, screen implementation, and change proposals | Gives usability feedback |
| Syllabus | Checks all extracted titles and outcomes against the PRC TOS; checks updated laws and standards | Extracts, organizes, links source pages, and provides review tooling | Reports missing or confusing entries |
| Guides and starter bank | Reviews every note, question, key, explanation, source right, and review date; alone authorizes publication | Drafts original content, flags uncertainty, builds content queue and coverage reports | Reports errors; cannot publish shared content |
| Engineering | Owns connected service accounts, secrets, repository access, and merge approval | Implements site, database migrations, auth, planner, quizzes, storage, tests, CI, and deployment configuration | Tests assigned flows |
| Release | Gives final production approval and opens beta invitations | Presents release evidence, preview, rollback, exports, and capacity status | Performs acceptance checks before opening |
| Operations | Reviews PRC notices and content, handles account requests, monitors quotas and project activity | Fixes approved issues, prepares PRs, documents backup and restore, and updates checks | Reports defects |

Only the owner receives direct GitHub write and merge access. Contributors can suggest changes by pull request. The owner email is configured in protected database configuration so that one account has owner rights and does not consume a student seat; never derive owner rights from editable profile data.

## 3. Product flows

1. **Landing and onboarding:** show Philippine date, countdown only when a target date exists, tentative/confirmed label, calendar, six subjects, next tasks, and clear sign-in/guest state. Collect weekly study slots, unavailable days, and self-rated topic strength.
2. **Planner:** schedule study, lecture review, practice, spaced reviews, catch-up, and final mocks. Preserve completed history while moving incomplete work into future availability. Show coverage and shortfall before the chosen date. A student can change availability and regenerate future work.
3. **Syllabus and guides:** each assessable outcome links to its PRC source page and, after owner approval, a concise note, lecture review prompt, and practice goal. Subjects and outcomes remain visible while guides are under review.
4. **Private bank:** create, edit, delete, and CSV-import four-option questions by topic. Validate answer, options, explanation, and topic. Personal items remain private.
5. **Shared bank:** owner reviews a minimum of three original questions per assessable outcome, including explanation, source, and review date, before publication. No question is copied from a third-party resource without explicit reuse rights.
6. **Quiz:** choose topics and count; randomize without repeats within an attempt; optionally show a timer; show score, explanations and topic feedback after submission; retain history; retry missed items; schedule weak-topic review.
7. **Materials:** add lecture links, notes, and private PDF/image files. Each upload is at most 10 MB; students have a 50 MB aggregate cap; owner has no individual cap; all uploads stop at 850 MB of project reservations. Files remain in a private bucket and open through short-lived signed links.
8. **Capacity:** admit ten student accounts plus the owner. Further accounts receive a waitlist state. Public sign-up must remain closed until the Google OAuth client works; email/password requires a tested free SMTP provider and real sign-up/reset delivery.

## 4. Technical design

- Next.js 16 App Router, React 19, TypeScript, responsive CSS, original SVG flowers; Vercel Hobby while this release is personal/noncommercial.
- Supabase Auth, Postgres, row-level policies, and private Storage. Browser uses the publishable key. Secrets stay in the service dashboards or untracked local environment files.
- Source-controlled SQL migrations. `internal.app_config` sets owner email, student limit, and shared upload guard. A serialized registration trigger protects the seat limit under concurrent sign-ups. Upload reservation uses a database lock and per-user/project byte checks.
- Shared syllabus and published content can be read publicly; private workspaces, personal banks, attempts, and files are scoped to their owners. Owner content access is based on a protected database profile. File deletion removes the object before releasing its quota reservation.
- Source code belongs in `MrLister17/cpale-study-tracker`. GitHub checks should run lint, type/build, planner and CSV tests, and dependency audit on pull requests. Vercel preview is reviewed before owner-approved merge. Production release follows explicit owner acceptance.

## 5. Milestones and exit criteria

| Milestone | Deliverables | Owner exit decision |
|---|---|---|
| Foundation | Repository, site shell, responsive identity, Supabase project, migrations, preview deployment | Layout and account boundaries accepted |
| Syllabus and content | All six subjects and outcomes checked, owner review queue, concise guides, ≥3 questions per outcome | All published content, answer keys, dates, and source rights approved |
| Personal planner | Availability, blackout dates, ratings, schedule, replanning, shortfall, progress | Realistic sample schedules pass acceptance |
| Bank and quiz | Private CRUD/CSV, shared bank, quiz builder, random attempts, results and retry | Quiz and privacy scenarios pass |
| Materials and capacity | Private file uploads, quotas, ten seats, waitlist, owner capacity view | Concurrent quota and cross-user tests pass |
| Release | Auth delivery, privacy/deletion pages, backup/restore rehearsal, CI, preview QA, monitoring | Owner approves production opening |

These milestones and their acceptance items are tracked in [GitHub Issues](https://github.com/MrLister17/cpale-study-tracker/issues). The protected foundation issue is closed; syllabus, planner, quiz, private uploads, and beta-release issues remain open.

## 6. Verification matrix

- **Planner:** missing target date; May 2027 provisional date; confirmed date update; no weekly hours; short slots; overlapping slots; blackout dates; insufficient hours; missed work; completed history; weak quiz review; final mock allocation.
- **Question bank:** invalid topics, empty options, answer A–D, quoted CSV commas/newlines, multiple-subject imports, edits/deletions, 3-per-topic publication gate.
- **Quiz:** topic selection, count exceeding pool, random ordering, no in-attempt repeats, scoring, unanswered questions, explanations only after submit, history, retry missed, and per-topic outcomes.
- **Security:** anonymous/different-student attempts to read or alter another bank, workspace, attempt, or file; owner role escalation; direct table writes around upload quotas; simultaneous sign-ups/uploads.
- **Experience:** mobile widths, keyboard navigation, visible focus, color contrast, screen-reader labels, loading/error states, live Philippine date, and broken links.
- **Operations:** real Google sign-in, email signup/reset if enabled, storage near 850 MB, database growth, free-project activity, data export and restore, rollback from prior Vercel deployment.

## 7. Current implementation status and open gates

**Built locally and in Supabase:** responsive dashboard; six-subject TOS extraction; planner and progress; personal bank and CSV import; quiz attempt flow; private materials with upload reservation; owner content review interface; official exam-cycle management; database policies; private export/deletion request flow. Automated build, lint, and focused planner/CSV/quiz tests pass; Supabase security advisor reports no findings after the current migrations. This does **not** establish complete content or beta readiness.

**Content gate:** 462 extracted outcomes need editorial verification; approved concise guides and at least three reviewed starter questions per outcome are still outstanding. The owner review interface intentionally starts with no published guide or shared bank. Regulatory, tax, and accounting content must be checked against current authoritative sources before publication.

**Account gate:** the new Supabase project exists, but Google OAuth credentials must be created in Google Cloud and installed in Supabase Auth. A free SMTP provider must pass actual signup and reset messages before email/password is offered publicly. Until then, the beta is not open for account signup.

**Release gate:** The [public GitHub repository](https://github.com/MrLister17/cpale-study-tracker) is linked to a [Vercel deployment](https://cpale-study-tracker.vercel.app) that currently requires Vercel authentication; GitHub checks pass. Vercel assigned its first deployment to the production environment automatically, but deployment protection keeps the site closed to public visitors. Cross-user security tests, a restore rehearsal, Google sign-in, content review, and owner acceptance remain before opening the ten-student beta. Mark an issue complete only with a link to the relevant test, content approval, or preview evidence.

## 8. Google sign-in setup handoff

1. In a Google Cloud project controlled by the owner, configure an OAuth consent screen for the intended testers. Add the owner and testers if the Google app remains in testing mode.
2. Create a **Web application** OAuth client. Add authorized JavaScript origins `https://cpale-study-tracker.vercel.app` and `http://localhost:3000`. Add Supabase's callback URI: `https://xrrlznyxrhitfdjwbttu.supabase.co/auth/v1/callback`.
3. Enter the Google client ID and secret directly into **Supabase → Authentication → Providers → Google**. Never put the secret in chat, GitHub, or `NEXT_PUBLIC_` variables.
4. In **Supabase → Authentication → URL Configuration**, set the production site URL and allow the Vercel preview and local callback URLs as needed. Test sign-in and sign-out with the owner account and one student account.
5. Keep public invitations closed until the flow, account cap, and owner exemption are verified. The owner uses the exact email already configured privately in `internal.app_config`.

## 9. Operations and rollback

Track weekly free-tier database and storage use, active accounts, upload reservation totals, guide coverage, and approved questions per topic. Export the database and private files before schema or production releases; rehearse restore to a separate environment. Release by reviewed pull request and Vercel preview. If a release fails, roll Vercel back to the last known good deployment and use a forward SQL migration to repair data or schema. Keep the previous migration and backup available. Check PRC schedules and TOS revisions before each new exam cycle; record source URLs and review dates.
