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

function isPercentPoint(point) {
  return (
    typeof point === 'object' &&
    point !== null &&
    typeof point.x === 'number' &&
    typeof point.y === 'number' &&
    point.x >= 0 && point.x <= 100 &&
    point.y >= 0 && point.y <= 100
  );
}

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

test('point-type acupoints have a non-empty coordinates array and a null path', () => {
  for (const point of acupoints.filter((p) => p.type === 'point')) {
    assert.ok(Array.isArray(point.coordinates), `${point.id}.coordinates should be an array`);
    assert.ok(point.coordinates.length > 0, `${point.id}.coordinates should not be empty`);
    assert.equal(point.path, null, `${point.id}.path should be null for a point-type acupoint`);
  }
});

test('line-type techniques have a non-empty path of polylines and a null coordinates', () => {
  for (const point of acupoints.filter((p) => p.type === 'line')) {
    assert.ok(Array.isArray(point.path), `${point.id}.path should be an array`);
    assert.ok(point.path.length > 0, `${point.id}.path should contain at least one polyline`);
    for (const polyline of point.path) {
      assert.ok(Array.isArray(polyline) && polyline.length >= 2, `${point.id} has a polyline with fewer than 2 points`);
    }
    assert.equal(point.coordinates, null, `${point.id}.coordinates should be null for a line-type technique`);
  }
});

test('every coordinate and path point is a valid {x,y} percentage within 0-100', () => {
  for (const point of acupoints) {
    if (point.coordinates) {
      for (const coordinate of point.coordinates) {
        assert.ok(isPercentPoint(coordinate), `${point.id} has an invalid coordinate ${JSON.stringify(coordinate)}`);
      }
    }
    if (point.path) {
      for (const polyline of point.path) {
        for (const waypoint of polyline) {
          assert.ok(isPercentPoint(waypoint), `${point.id} has an invalid path point ${JSON.stringify(waypoint)}`);
        }
      }
    }
  }
});

test('videoUrl is null in Phase 1/2 (no video content yet), never an empty string', () => {
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

test('fengchi (风池) record matches the prescription: 头部 category, back view, 2 bilateral coordinates', () => {
  const fengchi = acupoints.find((p) => p.id === 'fengchi');
  assert.ok(fengchi, 'expected a "fengchi" record to exist');
  assert.equal(fengchi.name, '风池');
  assert.equal(fengchi.category, '头部');
  assert.equal(fengchi.view, 'back');
  assert.equal(fengchi.type, 'point');
  assert.equal(fengchi.coordinates.length, 2);
});

test('sishencong (四神聪) has exactly 4 coordinates clustered around baihui', () => {
  const sishencong = acupoints.find((p) => p.id === 'sishencong');
  assert.ok(sishencong);
  assert.equal(sishencong.coordinates.length, 4);
});

test('shixuan (十宣穴) has exactly 5 fingertip coordinates on the hand view', () => {
  const shixuan = acupoints.find((p) => p.id === 'shixuan');
  assert.ok(shixuan);
  assert.equal(shixuan.view, 'hand');
  assert.equal(shixuan.coordinates.length, 5);
});

test('hand-meridians has 2 polylines, one per arm', () => {
  const handMeridians = acupoints.find((p) => p.id === 'hand-meridians');
  assert.ok(handMeridians);
  assert.equal(handMeridians.path.length, 2);
});

test('nieji (捏脊) is a single midline path on the back view, running from tailbone up to the neck', () => {
  const nieji = acupoints.find((p) => p.id === 'nieji');
  assert.ok(nieji);
  assert.equal(nieji.view, 'back');
  assert.equal(nieji.path.length, 1);
  const [spinePath] = nieji.path;
  const start = spinePath[0];
  const end = spinePath[spinePath.length - 1];
  assert.ok(start.y > end.y, 'nieji path should start lower (tailbone) and end higher (neck)');
});

test('yongquan (涌泉穴) is placed on the foot-sole close-up view, not the front/back body view', () => {
  const yongquan = acupoints.find((p) => p.id === 'yongquan');
  assert.ok(yongquan, 'expected a "yongquan" record to exist');
  assert.equal(yongquan.view, 'foot');
  assert.equal(yongquan.coordinates.length, 1);
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
