import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseRandom } from '../src/lib/quiz';

test('quiz selection respects count and never repeats an item', () => {
  const chosen = chooseRandom([1, 2, 3, 4, 5], 4, () => 0.5);
  assert.equal(chosen.length, 4);
  assert.equal(new Set(chosen).size, 4);
  assert.deepEqual(chooseRandom([1, 2], 10, () => 0.5).sort(), [1, 2]);
});
