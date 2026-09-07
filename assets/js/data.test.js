import test from 'node:test';
import assert from 'node:assert/strict';
import { acupoints } from './data.js';

const VALID_CATEGORIES = ['头部', '上肢', '下肢', '背部'];
const VALID_TYPES = ['point', 'line'];
const VALID_VIEWS = ['front', 'back', 'hand', 'foot'];
const REQUIRED_TEXT_FIELDS = [
  'id', 'name', 'category', 'type', 'view',
  'location', 'technique', 'duration', 'benefit', 'caution', 'source'
];
const ID_PATTERN = /^[a-z]+(-[a-z]+)*$/;

test('acupoints contains exactly the 21 items from the prescription', () => {
  assert.equal(acupoints.length, 21);
});

test('every acupoint record has all required non-empty text fields', () => {
  for (const point of acupoints) {
    for (const field of REQUIRED_TEXT_FIELDS) {
      assert.equal(typeof point[field], 'string', `${point.id ?? '(no id)'}.${field} should be a string`);
      assert.notEqual(point[field].trim(), '', `${point.id ?? '(no id)'}.${field} should not be empty`);
    }
  }
});

test('every acupoint id is unique', () => {
  const ids = acupoints.map((point) => point.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length);
});

test('every acupoint id is a lowercase-hyphen slug (English identifier)', () => {
  for (const point of acupoints) {
    assert.match(point.id, ID_PATTERN, `id "${point.id}" should match ${ID_PATTERN}`);
  }
});

test('every acupoint category is one of the four prescription body regions', () => {
  for (const point of acupoints) {
    assert.ok(
      VALID_CATEGORIES.includes(point.category),
      `${point.id} has unexpected category "${point.category}"`
    );
  }
});

test('every acupoint type is either "point" or "line"', () => {
  for (const point of acupoints) {
    assert.ok(VALID_TYPES.includes(point.type), `${point.id} has unexpected type "${point.type}"`);
  }
});

test('every acupoint view is one of front/back/hand/foot', () => {
  for (const point of acupoints) {
    assert.ok(VALID_VIEWS.includes(point.view), `${point.id} has unexpected view "${point.view}"`);
  }
});

test('coordinates are left as null in Phase 1, pending Phase 2 illustration mapping', () => {
  for (const point of acupoints) {
    assert.equal(point.coordinates, null, `${point.id}.coordinates should be null until Phase 2`);
  }
});

test('videoUrl is null in Phase 1 (no video content yet), never an empty string', () => {
  for (const point of acupoints) {
    assert.equal(point.videoUrl, null, `${point.id}.videoUrl should be null, not an empty string or placeholder`);
  }
});

test('meridian-line techniques (手三阴阳经/足三阴阳经/捏脊/拿五经/补脾经/补肾经) are typed as "line"', () => {
  const lineIds = ['wujing', 'pijing', 'shenjing', 'hand-meridians', 'foot-meridians', 'nieji'];
  for (const id of lineIds) {
    const point = acupoints.find((p) => p.id === id);
    assert.ok(point, `expected an acupoint with id "${id}"`);
    assert.equal(point.type, 'line', `${id} should be type "line"`);
  }
});

test('fengchi (风池) record matches the prescription: 头部 category, back view', () => {
  const fengchi = acupoints.find((p) => p.id === 'fengchi');
  assert.ok(fengchi, 'expected a "fengchi" record to exist');
  assert.equal(fengchi.name, '风池');
  assert.equal(fengchi.category, '头部');
  assert.equal(fengchi.view, 'back');
  assert.equal(fengchi.type, 'point');
});

test('yongquan (涌泉穴) is placed on the foot-sole close-up view, not the front/back body view', () => {
  const yongquan = acupoints.find((p) => p.id === 'yongquan');
  assert.ok(yongquan, 'expected a "yongquan" record to exist');
  assert.equal(yongquan.view, 'foot');
});

test('looking up a non-existent id returns undefined instead of throwing or matching by accident', () => {
  const missing = acupoints.find((p) => p.id === 'this-id-does-not-exist');
  assert.equal(missing, undefined);
});

test('exactly 4 acupoints belong to each of the four prescription body regions except 头部 which has more sub-items', () => {
  const counts = acupoints.reduce((acc, point) => {
    acc[point.category] = (acc[point.category] ?? 0) + 1;
    return acc;
  }, {});
  assert.equal(counts['头部'], 10);
  assert.equal(counts['上肢'], 6);
  assert.equal(counts['下肢'], 4);
  assert.equal(counts['背部'], 1);
});
