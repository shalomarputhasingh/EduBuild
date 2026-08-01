import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeMaterials,
  normalizeSteps,
  normalizeStringList,
  normalizeProject,
  calculateMaterialsCost,
} from '../utils/normalizeProject.js';

// The central guarantee: rows written before the structured model still render.
test('normalizeMaterials converts the legacy string[] shape', () => {
  const result = normalizeMaterials(['Cardboard', 'Tape', 'Scissors']);

  assert.equal(result.length, 3);
  assert.deepEqual(result[0], {
    name: 'Cardboard',
    quantity: null,
    estimatedCost: null,
    alternative: null,
    note: null,
  });
});

test('normalizeMaterials passes structured objects through', () => {
  const result = normalizeMaterials([
    { name: 'Bottle', quantity: '2', estimatedCost: 20, alternative: 'Any jar', note: 'Wash first' },
  ]);

  assert.deepEqual(result[0], {
    name: 'Bottle',
    quantity: '2',
    estimatedCost: 20,
    alternative: 'Any jar',
    note: 'Wash first',
  });
});

test('normalizeMaterials handles mixed, blank and malformed entries', () => {
  const result = normalizeMaterials([
    'Tape',
    { name: 'Bottle', estimatedCost: '35' },
    '',
    '   ',
    { name: '' },
    null,
    undefined,
    42,
  ]);

  assert.equal(result.length, 2);
  assert.equal(result[0].name, 'Tape');
  assert.equal(result[1].name, 'Bottle');
  // Numeric strings from a form input become numbers.
  assert.equal(result[1].estimatedCost, 35);
});

test('normalizeMaterials returns [] for every empty input', () => {
  for (const input of [null, undefined, [], '']) {
    assert.deepEqual(normalizeMaterials(input), []);
  }
});

test('normalizeSteps converts the legacy string[] shape', () => {
  const result = normalizeSteps(['Cut the bottle', 'Attach the wheels']);

  assert.equal(result.length, 2);
  assert.deepEqual(result[0], {
    title: null,
    description: 'Cut the bottle',
    imageUrl: null,
    safetyNote: null,
    videoTimestamp: null,
  });
});

test('normalizeSteps passes structured objects through and drops empties', () => {
  const result = normalizeSteps([
    { title: 'Prepare', description: 'Cut it', safetyNote: 'Adult supervision' },
    { title: 'Nothing', description: '' },
    { description: '   ' },
  ]);

  assert.equal(result.length, 1);
  assert.equal(result[0].title, 'Prepare');
  assert.equal(result[0].safetyNote, 'Adult supervision');
});

test('normalizeStringList trims and drops blanks', () => {
  assert.deepEqual(normalizeStringList(['  Physics  ', '', 'Energy', null]), ['Physics', 'Energy']);
  assert.deepEqual(normalizeStringList(null), []);
});

test('calculateMaterialsCost sums only priced lines', () => {
  assert.equal(
    calculateMaterialsCost([
      { name: 'A', estimatedCost: 10 },
      { name: 'B', estimatedCost: 15 },
      { name: 'C' },
    ]),
    25
  );

  // Nothing priced is null, not 0 — "free" and "not costed" are different claims.
  assert.equal(calculateMaterialsCost([{ name: 'A' }, 'B']), null);
  assert.equal(calculateMaterialsCost([]), null);
});

test('normalizeProject converts a whole legacy row without losing other fields', () => {
  const legacyRow = {
    id: 'abc',
    title: 'Solar System Model',
    budget: 500,
    materials: ['Styrofoam balls', 'Paint'],
    steps: ['Paint the balls', 'Arrange them'],
    learningOutcomes: ['Planetary order'],
    safetyPrecautions: null,
    tags: null,
  };

  const result = normalizeProject(legacyRow);

  assert.equal(result.title, 'Solar System Model');
  assert.equal(result.budget, 500);
  assert.equal(result.materials[0].name, 'Styrofoam balls');
  assert.equal(result.steps[0].description, 'Paint the balls');
  assert.deepEqual(result.learningOutcomes, ['Planetary order']);
  // Null jsonb columns become empty arrays so the UI never maps over null.
  assert.deepEqual(result.safetyPrecautions, []);
  assert.deepEqual(result.tags, []);
  assert.equal(result.materialsCost, null);
});

test('normalizeProject accepts a Sequelize-like instance', () => {
  const instance = {
    toJSON: () => ({ id: 'x', title: 'T', materials: ['Tape'], steps: [] }),
  };

  const result = normalizeProject(instance);
  assert.equal(result.title, 'T');
  assert.equal(result.materials[0].name, 'Tape');
});
