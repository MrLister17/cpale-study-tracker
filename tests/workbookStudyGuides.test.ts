import assert from 'node:assert/strict';
import test from 'node:test';
import { workbookStudyGuides } from '../src/data/workbookStudyGuides';
import { subjects } from '../src/lib/syllabus';

test('each CPALE subject has a substantial sample-based study path', () => {
  assert.deepEqual(new Set(Object.keys(workbookStudyGuides)), new Set(subjects.map((subject) => subject.id)));
  for (const subject of subjects) {
    const guide = workbookStudyGuides[subject.id];
    assert.ok(guide.introduction.length > 60, subject.id);
    assert.equal(guide.method.length, 3, subject.id);
    assert.ok(guide.themes.length >= 17, subject.id);
    assert.equal(new Set(guide.themes.map((theme) => theme.title)).size, guide.themes.length, subject.id);
    assert.ok(guide.themes.every((theme) => theme.title.length > 3 && theme.focus.length > 35), subject.id);
  }
});

test('old review-sheet material explicitly outside the TOS is not presented as required', () => {
  assert.ok(!workbookStudyGuides.mas.themes.some((theme) => theme.title === 'Strategic Costing'));
  assert.ok(!workbookStudyGuides.afar.themes.some((theme) => /old US GAAP|construction contracts/i.test(theme.title)));
});
