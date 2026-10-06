# Learning content coverage and review handoff

Updated October 6, 2026. The six supplied study-guide workbooks informed sequencing and focus. The PRC Board of Accountancy Table of Specifications defines the assessable outcomes. Draft text is original and is stored in the owner-protected Supabase `study_lessons` table; the local recovery copy is ignored by Git. No draft lesson is published. This batch added 28 worked drafts in priority areas, including full draft coverage of Management Services.

| Subject | Draft lessons | Outcomes linked | Outcomes total | Outcomes without a worked lesson |
|---|---:|---:|---:|---:|
| FAR | 10 | 15 | 54 | 39 |
| AFAR | 11 | 22 | 62 | 40 |
| MAS | 16 | 21 | 21 | 0 |
| AUD | 9 | 18 | 86 | 68 |
| RFBT | 9 | 19 | 156 | 137 |
| TAX | 10 | 25 | 86 | 61 |
| **Total** | **65** | **120** | **465** | **345** |

Each draft has learning goals, key points, a worked example, a common mistake, a practice prompt, source links with check dates, and an applicability note. The owner review screen can edit and publish one lesson at a time after every linked syllabus label is approved. Database rules enforce owner access, reviewed metadata, approved linked labels, and source fields. A published lesson is then available from the student topic page.

The owner or a qualified CPA subject reviewer must verify worked answers and current Philippine standards or law before publication. TAX and RFBT require a fresh check near the exam. Broad lessons linked to multiple outcomes do not replace a dedicated worked lesson for every outcome. At present, all 65 rows remain `draft`; an anonymous database read returned zero lessons. The remaining 345 outcomes require worked drafts before lesson coverage is complete.

## Source-index corrections

The PDF places local taxation under section H on page 37. Outcomes `tax-076` through `tax-081` now carry that section; `tax-075` no longer includes the wrapped heading. The PDF also contains a three-outcome AFAR foreign-currency translation section omitted by the previous extractor. Stable IDs `afar-060` through `afar-062` restore it, bringing the total to 465 outcomes. The remaining 188 flagged extracted labels still need editorial comparison with the PDF; extraction is not approval.
