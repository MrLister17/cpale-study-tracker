# CPALE Study Tracker: completion delivery and responsibilities

Updated: October 6, 2026 (Philippine time)

## Outcome

A free candidate should be able to open a scheduled topic, learn from a current and sourced lesson, answer reviewed questions, understand mistakes, and receive a realistic next review. Six-subject coverage, cross-device persistence, privacy, and recovery are required before calling the ten-student beta complete.

## Roles and decision rights

| Role | Accountable for | Work in this build | Acceptance evidence |
|---|---|---|---|
| Product owner (Yvan) | Intended candidate experience, content publication, beta opening, provider accounts and secrets | Review a realistic week, approve question/lesson accuracy and source rights, configure sign-in provider when ready | Signed-off content batch and release checklist |
| Delivery lead (Codex root agent) | Architecture, integration, schedule, release evidence | Integrate lessons, diagnostic, mock, calendar-to-lesson flow, account readiness, test the deployed preview | Passing checks and end-to-end student journey |
| Learning-content agent | Original lessons and syllabus mapping | Draft goals, concise explanations, worked examples, common errors, sources and review metadata across six subjects | Coverage report and content validation tests |
| Practice agent | Question quality and assessment logic | Draft four-option items with rationales and sources; implement diagnostic, mock assembly and per-topic scoring | Item validation, no repeated questions, scarcity reporting, unit tests |
| Planner agent | Scheduling and readiness model | Use verifiable TOS weights, quiz outcomes and available study hours for priorities and future reviews | Deterministic tests for weak topics, hours, missed tasks and all-six coverage |
| Qualified CPA subject reviewer (owner or delegate) | Accuracy of accounting, audit, law and tax content | Check every lesson, answer, explanation, effective date and source before the shared bank is published | Recorded review decision and date per item |
| Security and QA lead (delivery lead until delegated) | Privacy, accessibility, backup and release checks | Test two accounts, storage limits, keyboard/mobile flows, export/restore and rollback | Test report with no release-blocking findings |

## Work sequence

1. **Scope and content:** keep the PRC TOS as the coverage checklist; map the six provided study-guide schedules to original lessons and practice items. Draft content carries explicit review status.
2. **Candidate loop:** connect daily calendar tasks to topic lessons, then practice, explanations, weak-topic review and readiness feedback. A mock never claims full exam representation when the reviewed bank is too small.
3. **Persistence and privacy:** enable a tested sign-in method, move guest work only with consent, and verify row-level isolation and storage limits with two accounts.
4. **Quality and release:** run unit tests, lint, build, browser journeys, security advisors, accessibility checks and a restore rehearsal. Merge through GitHub checks and inspect the Vercel deployment.

## Release gates

| Gate | Required evidence | Decision owner |
|---|---|---|
| Content | Confirmed topic map; reviewed lesson and question coverage; current authoritative sources for variable rules | Product owner and qualified reviewer |
| Candidate usability | One complete daily study loop and realistic diagnostic/mock flow on desktop and phone | Product owner |
| Accounts and privacy | Owner plus two student accounts; private data isolation; signup cap; upload limits; account deletion | Delivery lead and product owner |
| Operations | Restore rehearsal, rollback instructions, free-tier usage check, PRC schedule monitoring | Delivery lead and product owner |

The public guest preview can show planning and clearly marked study directions while these gates are open. Draft answer keys and factual lessons must not be described as approved content. A checked box or a high scheduled-coverage percentage is not a readiness score.

## Delivery evidence on October 6, 2026

| Area | Verified state | Remaining release work |
|---|---|---|
| Syllabus | 465 extracted outcomes across six subjects; AFAR translation and TAX local-taxation omissions corrected; TOS item allocations mapped | Human comparison of 188 flagged labels with the PRC PDF |
| Lessons | 37 original owner-only drafts link 73 outcomes; zero published; protected editor and published reader built | Reviewer approval and worked lessons for 392 outcomes still without one |
| Shared questions | 60 owner-only drafts across six subjects; zero published; public visitor sees none | Review all drafts and reach three approved items per outcome (1,395 target) |
| Candidate loop | Calendar opens its assigned outcome; time entry, weighted plan, weak-area review, readiness, diagnostics and TOS-group mock assembly implemented | Validate with real candidates and an approved question pool |
| Database | Lesson and reviewer-provenance migrations applied; anonymous API sees zero draft lessons or questions; security advisor has no findings | Two-account isolation, owner publication and account recovery tests after sign-in setup |
| Code quality | 31 automated tests, lint, TypeScript build, production build and dependency audit pass locally; GitHub CI and the Vercel pull-request preview passed | Mobile and keyboard acceptance with candidates |

The beta remains closed until a working sign-in provider, owner account access, content review, account isolation, export/restore rehearsal, and product-owner release approval are verified. The owner should supply provider configuration through service settings, never by posting a secret in chat.
