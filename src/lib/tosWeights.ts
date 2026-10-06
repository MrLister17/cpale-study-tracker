import { allTopics, subjects } from './syllabus';
import type { SubjectId } from './types';

/** Item allocations in the supplied PRC BOA TOS (effective October 2022).
 * A section's items are divided equally among the extracted outcomes in that
 * section because the PDF does not assign an item count to every outcome.
 * `first`/`last` refer to the stable syllabus IDs, not array positions.
 */
type GroupSpec = { subjectId: SubjectId; label: string; items: number; first?: number; last?: number; sourcePage: number };

const specs: GroupSpec[] = [
  { subjectId: 'far', label: 'Reporting framework and profession', items: 4, first: 1, last: 2, sourcePage: 1 },
  { subjectId: 'far', label: 'Conceptual framework and statements', items: 9, first: 3, last: 10, sourcePage: 1 },
  { subjectId: 'far', label: 'Cash and financial assets', items: 10, first: 11, last: 17, sourcePage: 2 },
  { subjectId: 'far', label: 'Non-financial assets', items: 14, first: 18, last: 27, sourcePage: 2 },
  { subjectId: 'far', label: 'Financial liabilities', items: 4, first: 28, last: 31, sourcePage: 3 },
  { subjectId: 'far', label: 'Non-financial liabilities and provisions', items: 4, first: 32, last: 35, sourcePage: 4 },
  { subjectId: 'far', label: 'Shareholders’ equity', items: 10, first: 36, last: 43, sourcePage: 4 },
  { subjectId: 'far', label: 'Other topics', items: 10, first: 44, last: 53, sourcePage: 4 },
  { subjectId: 'far', label: 'Other reporting frameworks', items: 5, first: 54, last: 54, sourcePage: 5 },

  { subjectId: 'afar', label: 'Partnership accounting', items: 10, first: 1, last: 5, sourcePage: 6 },
  { subjectId: 'afar', label: 'Corporate liquidation', items: 4, first: 6, last: 6, sourcePage: 7 },
  { subjectId: 'afar', label: 'Joint arrangements', items: 4, first: 7, last: 12, sourcePage: 7 },
  { subjectId: 'afar', label: 'Revenue recognition', items: 10, first: 13, last: 20, sourcePage: 8 },
  { subjectId: 'afar', label: 'Home office, branch and agency', items: 4, first: 21, last: 24, sourcePage: 9 },
  { subjectId: 'afar', label: 'Business combinations', items: 6, first: 25, last: 26, sourcePage: 9 },
  { subjectId: 'afar', label: 'Separate financial statements', items: 4, first: 27, last: 28, sourcePage: 10 },
  { subjectId: 'afar', label: 'Consolidated financial statements', items: 5, first: 29, last: 30, sourcePage: 10 },
  { subjectId: 'afar', label: 'Derivatives and hedging', items: 4, first: 31, last: 34, sourcePage: 10 },
  { subjectId: 'afar', label: 'Foreign currency translation', items: 3, first: 60, last: 62, sourcePage: 11 },
  { subjectId: 'afar', label: 'Not-for-profit organizations', items: 2, first: 35, last: 35, sourcePage: 11 },
  { subjectId: 'afar', label: 'Government accounting', items: 2, first: 36, last: 39, sourcePage: 11 },
  { subjectId: 'afar', label: 'Cost accounting', items: 10, first: 40, last: 54, sourcePage: 12 },
  { subjectId: 'afar', label: 'Other special topics', items: 2, first: 55, last: 59, sourcePage: 13 },

  { subjectId: 'mas', label: 'Management accounting', items: 40, first: 1, last: 12, sourcePage: 14 },
  { subjectId: 'mas', label: 'Financial management', items: 25, first: 13, last: 19, sourcePage: 15 },
  { subjectId: 'mas', label: 'Economic concepts', items: 5, first: 20, last: 21, sourcePage: 15 },
  { subjectId: 'aud', label: 'Auditing theory', items: 35, first: 1, last: 56, sourcePage: 17 },
  { subjectId: 'aud', label: 'Auditing practice', items: 35, first: 57, last: 86, sourcePage: 21 },

  { subjectId: 'rfbt', label: 'Law on business transactions', items: 18, first: 1, last: 28, sourcePage: 23 },
  { subjectId: 'rfbt', label: 'Bouncing checks', items: 2, first: 29, last: 30, sourcePage: 25 },
  { subjectId: 'rfbt', label: 'Consumer protection', items: 2, first: 31, last: 35, sourcePage: 25 },
  { subjectId: 'rfbt', label: 'Rehabilitation and insolvency', items: 5, first: 36, last: 38, sourcePage: 25 },
  { subjectId: 'rfbt', label: 'Competition law', items: 2, first: 39, last: 41, sourcePage: 26 },
  { subjectId: 'rfbt', label: 'Government procurement', items: 2, first: 42, last: 46, sourcePage: 26 },
  { subjectId: 'rfbt', label: 'Business organizations', items: 44, first: 47, last: 102, sourcePage: 26 },
  { subjectId: 'rfbt', label: 'Other business transactions', items: 25, first: 103, last: 156, sourcePage: 32 },

  { subjectId: 'tax', label: 'Principles of taxation', items: 8, first: 1, last: 10, sourcePage: 35 },
  { subjectId: 'tax', label: 'Tax remedies', items: 8, first: 11, last: 12, sourcePage: 35 },
  { subjectId: 'tax', label: 'Income taxation', items: 14, first: 13, last: 26, sourcePage: 35 },
  { subjectId: 'tax', label: 'Transfer taxes', items: 12, first: 27, last: 44, sourcePage: 36 },
  { subjectId: 'tax', label: 'Business taxes', items: 12, first: 45, last: 63, sourcePage: 36 },
  { subjectId: 'tax', label: 'Excise tax', items: 2, first: 64, last: 69, sourcePage: 37 },
  { subjectId: 'tax', label: 'Documentary stamp tax', items: 2, first: 70, last: 75, sourcePage: 37 },
  { subjectId: 'tax', label: 'Local government taxes', items: 4, first: 76, last: 81, sourcePage: 37 },
  { subjectId: 'tax', label: 'Preferential taxation', items: 8, first: 82, last: 86, sourcePage: 38 },
];

const itemTotals: Record<SubjectId, number> = { far: 70, afar: 70, mas: 70, aud: 70, rfbt: 100, tax: 70 };
export const TOS_SOURCE_URL = 'https://www.prc.gov.ph/sites/default/files/2022-30%20BOA%20TOS%20Final.pdf';

function idFor(subjectId: SubjectId, ordinal: number) {
  return `${subjectId}-${String(ordinal).padStart(3, '0')}`;
}

export const tosGroups = specs.map((spec) => {
  const topicIds = spec.first === undefined || spec.last === undefined ? [] :
    Array.from({ length: spec.last - spec.first + 1 }, (_, i) => idFor(spec.subjectId, spec.first! + i));
  return { ...spec, topicIds, subjectShare: spec.items / itemTotals[spec.subjectId] };
});

const topicShare = new Map<string, number>();
const topicGroupShare = new Map<string, number>();
for (const group of tosGroups) {
  for (const topicId of group.topicIds) {
    topicShare.set(topicId, group.subjectShare / group.topicIds.length);
    topicGroupShare.set(topicId, group.subjectShare);
  }
}

export function topicExamShare(topicId: string): number {
  return topicShare.get(topicId) ?? 0;
}

export function topicGroupExamShare(topicId: string): number {
  return topicGroupShare.get(topicId) ?? 0;
}

export function subjectExamItems(subjectId: SubjectId): number {
  return itemTotals[subjectId];
}

export const unmappedTosGroups = tosGroups.filter((group) => group.topicIds.length === 0);

// Fail visibly in development/tests if the editable syllabus diverges from the
// reviewed TOS mapping. Never silently assign a weight to the wrong outcome.
if (process.env.NODE_ENV !== 'production') {
  const known = new Set(allTopics.map((topic) => topic.id));
  const assigned = tosGroups.flatMap((group) => group.topicIds);
  if (assigned.length !== new Set(assigned).size || assigned.some((id) => !known.has(id)) ||
      allTopics.some((topic) => !topicShare.has(topic.id)) ||
      subjects.some((subject) => tosGroups.filter((group) => group.subjectId === subject.id)
        .reduce((sum, group) => sum + group.items, 0) !== itemTotals[subject.id])) {
    throw new Error('PRC TOS weights need to be reconciled with the syllabus before use.');
  }
}
