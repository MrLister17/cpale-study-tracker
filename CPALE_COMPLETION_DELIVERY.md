# CPALE Study Tracker: personal study delivery

Updated: October 7, 2026 (Philippine time)

## Current scope

This release serves one candidate on one device. The plan, notes, mistakes, attempts, private questions, and imported study pack save in that browser. A downloadable JSON backup carries them to another browser if needed. Account sign-in, public beta admission, and guest file uploads are outside the current personal release. The May 2027 date remains provisional until PRC publishes and verifies the schedule.

The six attached study-guide workbooks inform sequence and focus. The [PRC Table of Specifications](https://www.prc.gov.ph/sites/default/files/2022-30%20BOA%20TOS%20Final.pdf) defines the 465 assessable outcomes. Draft factual content is never represented as qualified-reviewer-approved.

## Six candidate goals

| Goal | Current state | Evidence and remaining work |
|---|---|---|
| 1. Actual lessons for scheduled topics | **In progress** | 65 original, sourced worked-lesson drafts cover 120/465 outcomes, including 21/21 Management Services outcomes. The other 345 outcomes need worked lessons; every draft needs qualified review before public publication. The candidate can import the private pack and read these drafts locally. |
| 2. Usable question bank | **In progress** | 96 original, sourced draft MCQs cover 58 outcomes, 16 per subject. No item is published or qualified-reviewer-approved. Another 1,304 items are needed to reach three per outcome even if all current drafts pass review. Personal questions and CSV import work. |
| 3. Mistake notebook | **Software complete** | Wrong and unanswered quiz items create notes; the candidate records why the answer was missed, writes a correction, chooses a review date, and retries. Spaced reminders and backups include the notes. |
| 4. Representative mocks | **In progress** | Mock assembly follows PRC TOS group weights, targets the 30/40/30 difficulty mix when tags permit, avoids repeated items, and discloses shortages. The present bank cannot make a complete representative subject mock. |
| 5. Daily study loop and honest progress | **Software complete; content limited** | Calendar days show subject tasks; the planner rotates all six subjects, prioritizes available worked lessons, reassigns missed blocks, logs time, and schedules recall. Readiness separates reviewed evidence from self-ratings and unreviewed drafts. Full content and candidate acceptance testing remain. |
| 6. One-device recovery | **Complete for browser study data** | Browser storage, a weekly backup reminder, validated JSON export, and restore cover the personal study pack, plan, questions, attempts, notes, and mistake reviews. Guest PDF/image uploads are not included; keep handouts as links or notes. |

## Personal study pack

The ignored local file `.private/CPALE_PERSONAL_STUDY_PACK.json` contains the 65 lesson drafts and 96 question drafts. It is excluded from the public Git repository. On the site, open **Subjects → Import study pack** and choose that file. It is stored in the current browser and included in **My plan → Download backup**. The app labels every imported lesson as a draft and warns when quizzes use unreviewed answers. Importing another pack replaces pack content without erasing progress or personal questions.

## Roles and responsibilities

| Role | Responsibility | Exit evidence |
|---|---|---|
| Candidate and product owner (Yvan) | Decide which subjects and lesson gaps matter first; study with the private pack; review the experience; save weekly backups; approve future publication. | Real one-week study trial and feedback; backup file retained outside browser. |
| Delivery lead (Codex) | Integrate site, planner, content tooling, quiz, backups, tests, and reviewable GitHub/Vercel changes. | Green checks, browser journey, documented limitations, preview link. |
| Learning-content author | Draft original worked lessons, map each to TOS outcomes, cite current sources, and flag applicability. | Coverage register and structural validation. |
| Practice author | Draft original MCQs with four choices, answer explanations, source and provisional difficulty/cognitive tags. | Unique, mapped, structurally checked review queue. |
| Qualified CPA subject reviewer | Verify standards, tax law, answer keys, worked examples, effective dates, and source rights before publishing. | Recorded reviewer and review date per published item. |
| QA/security lead (delivery lead until delegated) | Test scheduling, quiz, local recovery, mobile and keyboard use; keep private drafts out of anonymous Supabase reads and Git. | Automated checks, browser rehearsal, security advisor result, backup parse test. |

## Verification at this handoff

- 38 automated tests, lint, TypeScript production build passed locally.
- Browser rehearsal: imported the pack, opened a worked draft, took a draft quiz, created a mistake note, downloaded a backup, and parsed the saved backup. The backup contained 65 lessons, 96 questions, and the mistake note.
- Supabase has 65 lesson drafts and 96 question drafts, zero published. Anonymous reads of draft content return zero rows. Its security advisor reported no findings after the question metadata migration.
- GitHub checks and the Vercel preview passed after the branch was pushed. The product owner approved merging these software changes on October 7, 2026. The private drafts remain outside the public deployment and still require review before publication.

## Next content milestones

1. Complete worked lessons for the remaining 345 outcomes, starting with high-weight TOS groups and topics scheduled earliest.
2. Review the 65 lessons and 96 questions with a qualified subject reviewer, correcting current-law and effective-date details.
3. Expand the item bank topic by topic until each outcome has at least three reviewed questions; add multiple difficulty levels and test representative mocks again.
4. Have the candidate use the site for one real week, then fix any friction in the daily task, quiz, mistake, and backup flow.
