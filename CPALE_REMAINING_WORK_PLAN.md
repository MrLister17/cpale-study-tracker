# CPALE Study Tracker — remaining work to complete the free beta

Updated: October 5, 2026 (Philippine time). This plan starts from the [public guest preview](https://cpale-study-tracker.vercel.app/) and complements the [full SDLC specification](./CPALE_STUDY_TRACKER_SDLC_PLAN.md). It does not treat the public preview as a finished student-account beta.

## Where the project stands

- The website is publicly reachable and has a responsive dashboard, six-subject syllabus browser, provisional countdown, study planner, personal question bank and CSV import, quiz flow, materials interface, and owner review tools in the codebase. Guest changes are saved only in that browser.
- The GitHub repository, Vercel deployment, Supabase project, migrations, and CI exist. On October 4, `npm test` passed 9 tests, `npm run lint` passed, and `npm run build` passed. These checks do not establish account, cross-user, storage, or content readiness.
- Account sign-in is intentionally unavailable in the public preview. Google OAuth was deferred so the owner can test immediately; email signup also remains disabled pending real delivery tests.
- The TOS extraction has 462 assessable outcome entries across six subjects. Their labels need comparison with the source PDF. The shared guide and question bank require editorial approval before students rely on them. The completion target is one approved guide and at least three approved original questions per entry: **462 guides and 1,386 questions** if every extracted entry is confirmed assessable.
- [GitHub issues #2–#8](https://github.com/MrLister17/cpale-study-tracker/issues) already track the major open work. This document orders those items and supplies release decisions.
- **Implemented after this plan was drafted:** guest backup/restore, a cross-subject quiz picker, six-subject first-pass scheduling, an interactive calendar with per-day tasks and monthly subject counts, a searchable owner review queue, and a 462-row TOS review checklist. These changes do not satisfy the content, account, security, or release gates below.

## Release stages

| Stage | What users can do | Gate to move forward |
|---|---|---|
| **Now: public guest preview** | Try planning, add personal questions, and take quizzes in one browser. Content under review is clearly labeled. | Owner reports usability defects; no promise of account sync or permanent storage. |
| **Private account test** | Owner and one invited student exercise sign-in, private data, uploads, and admin functions. | Authentication, privacy, quotas, and recovery tests pass with separate real accounts. |
| **Ten-student free beta** | Up to ten students use persistent accounts and reviewed shared guides/questions. | Complete content and security gates pass; owner approves invitations. |
| **Complete ongoing service** | New exam cycles and rules stay current; backups, monitoring, support, and corrections continue. | Owner assigns recurring operational responsibility and keeps an evidence log. |

## Work in priority order

### 1. Test and refine the guest experience — [issue #3](https://github.com/MrLister17/cpale-study-tracker/issues/3), [issue #4](https://github.com/MrLister17/cpale-study-tracker/issues/4)

**Development:** Walk through the public site on a phone and desktop. Test initial setup, weekly availability, blackout dates, weak-topic ratings, insufficient study hours, missed work, provisional date changes, all six subject pages, question creation/edit/delete/CSV import, topic selection, quiz scoring, retry, and saved notes. Fix misleading controls and broken or inaccessible states. Add browser tests for the highest-risk flows and a clear guest-data export/import or migration path before accounts open.

**Owner:** Try a realistic study schedule and record confusing steps or incorrect priorities in GitHub issues. Decide whether the current visual direction and task workload feel right.

**Done when:** The owner can complete a realistic week of planning and a multi-topic quiz on mobile and desktop; changes survive refresh in the same browser; the site explains that guest data can be lost if browser storage is cleared. Add screenshots and test results to the linked issues.

### 2. Validate the syllabus and produce reviewed content — [issue #2](https://github.com/MrLister17/cpale-study-tracker/issues/2)

**Development:** Compare the extracted 462 entries against the supplied PRC PDF, repair duplicate or malformed labels, and create a coverage report by subject and topic. Prepare concise original guide drafts, lecture-review tasks, practice goals, and at least three four-option question drafts per confirmed entry. Each item needs an answer, explanation, source, review date, and explicit publication state. Queue content in manageable batches, starting with one complete subject so the review method can be corrected before scaling.

**Owner or qualified CPA reviewer:** Check scope against the TOS, current laws/standards and authoritative sources, every key and explanation, and reuse rights. Approve each shared item in the owner review interface. No draft should silently become public.

**Done when:** Every confirmed assessable entry has an approved label and guide, at least three approved original questions, and traceable source/review metadata. The owner signs off all six subject coverage reports. Any change to the 462-entry count is documented with a PDF reference.

### 3. Enable persistent accounts after preview testing — [issue #6](https://github.com/MrLister17/cpale-study-tracker/issues/6)

**Owner:** When ready to invite account testers, create the Google OAuth credentials using the setup steps in the SDLC plan and enter the secret directly in Supabase. Do not send a secret in chat or commit it. Choose one student tester and verify the owner account email. Decide whether email/password is needed for beta; if so, arrange a free SMTP option and test signup, confirmation, password reset, and delivery before enabling it.

**Development:** Configure redirects, turn on only the tested sign-in method, confirm the protected owner role and ten-student cap, and ensure guest data is either imported with the student's consent or clearly left on the original browser. Test logout, expired sessions, duplicate signup, waitlist admission, and the owner exemption.

**Done when:** The owner and a separate student can sign in and return to their own saved work; an eleventh student cannot bypass the cap; the owner role cannot be self-assigned. Keep public signup closed until these checks pass. Google remains deferred while the guest preview is being evaluated.

### 4. Prove privacy, storage, and quiz behavior with real accounts — [issue #4](https://github.com/MrLister17/cpale-study-tracker/issues/4), [issue #5](https://github.com/MrLister17/cpale-study-tracker/issues/5)

**Development:** Test two students against each other's plans, questions, quiz attempts, links, notes, and private files using both the interface and direct data requests. Test 10 MB per file, 50 MB per student, the 850 MB project stop, simultaneous uploads/signups, file deletion and quota recovery, and time-limited file access. Test quiz results using both personal and approved shared questions, including no repeats, timing, explanations after submission, history, and weak-topic review scheduling. Re-run Supabase security checks after any policy change.

**Owner:** Review sample account data and the owner capacity dashboard; confirm the intended privacy and deletion behavior.

**Done when:** No cross-account read/write or quota bypass is found, and every quiz outcome matches its stored attempt. Save test evidence without exposing student data.

### 5. Finish release operations — [issue #7](https://github.com/MrLister17/cpale-study-tracker/issues/7), [issue #8](https://github.com/MrLister17/cpale-study-tracker/issues/8)

**Development:** Rehearse database and private-file export and restore in a separate environment; document restore time, Vercel rollback, account export/deletion handling, and incident steps. Check accessibility (keyboard, labels, focus, contrast), mobile layout, failed network states, dependency advisories, and CI on a pull request. Provide owner-facing counts for students, waitlist, published content, database size, and reserved file storage. Audit the current production configuration and monitor the free service limits before invitations.

**Owner:** Confirm privacy and account-deletion text, test the owner request workflow, check the proposed invitation list, and approve the release checklist and production opening. Assign a weekly check for PRC schedule/TOS changes, content corrections, service capacity, and backups. A confirmed exam date is entered only with a PRC source.

**Done when:** A restore rehearsal succeeds, rollback instructions are usable, no release-blocking security/accessibility defects remain, content coverage is complete, and the owner explicitly accepts the ten-student beta.

## Decision rights and delivery method

| Decision or task | Owner | Development |
|---|---|---|
| Scope, design, and beta opening | Approves | Prepares reviewable options and evidence |
| CPALE content and answer keys | Reviews and authorizes publication, ideally with a qualified CPA reviewer | Drafts, sources, imports, reports gaps, fixes tooling |
| OAuth and external service secrets | Controls accounts and enters secrets in provider dashboards | Supplies exact setup and validates integration |
| Code, migrations, tests, and deployment preview | Reviews pull request and authorizes merge/release | Implements on a branch, tests, documents, and prepares preview |
| Capacity, exam dates, account requests, corrections | Owns ongoing decisions | Provides dashboards, safeguards, and documented procedures |

For every work item: update its GitHub issue, implement on a branch, run CI, inspect the Vercel preview, attach relevant test/content evidence, then seek owner review for merge or publication. Do not use the current public guest URL as evidence that the ten-student account beta is ready.

## Immediate next actions

1. Owner tests the [public guest preview](https://cpale-study-tracker.vercel.app/) with a sample weekly schedule and reports the first usability or study-priority issues.
2. Development starts the syllabus coverage audit and prepares one subject's complete review batch, while adding browser tests for planning and quiz flows.
3. After the guest flow is accepted, enable private account testing; then run the two-account privacy and quota checks.
4. Finish all content, restore, accessibility, and owner-approval gates before inviting ten students.
