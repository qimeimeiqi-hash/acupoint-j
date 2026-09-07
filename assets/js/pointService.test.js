import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPointsForView,
  getCategoryColor,
  findPointById,
  getAspectRatio,
  CATEGORY_COLORS
} from './pointService.js';

const sample = [
  { id: 'a', view: 'front', category: '头部' },
  { id: 'b', view: 'back', category: '上肢' },
  { id: 'c', view: 'front', category: '下肢' },
  { id: 'd', view: 'hand', category: '背部' }
];

test('getPointsForView returns only points matching the requested view', () => {
  const result = getPointsForView(sample, 'front');
  assert.deepEqual(result.map((p) => p.id), ['a', 'c']);
});

test('getPointsForView returns an empty array when no point matches the view', () => {
  const result = getPointsForView(sample, 'foot');
  assert.deepEqual(result, []);
});

test('getCategoryColor returns the configured color for each of the 4 prescription regions', () => {
  for (const [category, color] of Object.entries(CATEGORY_COLORS)) {
    assert.equal(getCategoryColor(category), color);
  }
});

test('getCategoryColor falls back to a default color for an unknown category instead of throwing', () => {
  assert.equal(getCategoryColor('未知部位'), '#CCCCCC');
});

test('findPointById returns the matching point', () => {
  const result = findPointById(sample, 'b');
  assert.equal(result.id, 'b');
});

test('findPointById returns null (not undefined) when the id does not exist', () => {
  const result = findPointById(sample, 'missing-id');
  assert.equal(result, null);
});

test('getAspectRatio returns the correct width/height ratio for each of the 4 views', () => {
  assert.equal(getAspectRatio('front'), 300 / 600);
  assert.equal(getAspectRatio('back'), 300 / 600);
  assert.equal(getAspectRatio('hand'), 1);
  assert.equal(getAspectRatio('foot'), 300 / 400);
});

test('getAspectRatio falls back to 1 for an unknown view instead of throwing', () => {
  assert.equal(getAspectRatio('unknown-view'), 1);
});
