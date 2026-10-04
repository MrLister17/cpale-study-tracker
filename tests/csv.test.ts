import assert from 'node:assert/strict';
import test from 'node:test';
import { parseCsv } from '../src/lib/csv';

test('CSV parser accepts commas, escaped quotes, and line breaks in quoted fields', () => {
  assert.deepEqual(parseCsv('topic_id,question,explanation\nfar-001,"What is ""revenue, net""?","Use\nthe rule"\n'), [
    ['topic_id', 'question', 'explanation'],
    ['far-001', 'What is "revenue, net"?', 'Use\nthe rule'],
  ]);
});

test('CSV parser rejects unclosed quotes', () => {
  assert.throws(() => parseCsv('a,"unfinished'), /Unclosed/);
});
