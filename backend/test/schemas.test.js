import test from 'node:test';
import assert from 'node:assert/strict';
import { projectQuerySchema, SORT_OPTIONS } from '../schemas/projectQuerySchema.js';
import { signupSchema } from '../schemas/authSchemas.js';
import { updateProjectSchema, updateStatusSchema } from '../schemas/projectSchemas.js';
import { submitFeedbackSchema } from '../schemas/feedbackSchemas.js';

test('projectQuerySchema applies defaults', () => {
  const result = projectQuerySchema.parse({});
  assert.equal(result.page, 1);
  assert.equal(result.limit, 12);
  assert.equal(result.sort, 'newest');
});

test('projectQuerySchema caps limit so a client cannot request the whole table', () => {
  assert.equal(projectQuerySchema.parse({ limit: '5000' }).limit, 12);
  assert.equal(projectQuerySchema.parse({ limit: '50' }).limit, 50);
  assert.equal(projectQuerySchema.parse({ limit: '0' }).limit, 12);
});

test('projectQuerySchema only permits whitelisted sort keys', () => {
  // An unknown sort falls back rather than reaching the ORDER BY clause.
  assert.equal(projectQuerySchema.parse({ sort: 'title; DROP TABLE users' }).sort, 'newest');
  assert.equal(projectQuerySchema.parse({ sort: 'budget_asc' }).sort, 'budget_asc');

  for (const key of Object.keys(SORT_OPTIONS)) {
    assert.equal(projectQuerySchema.parse({ sort: key }).sort, key);
  }
});

test('projectQuerySchema swaps a reversed budget range instead of erroring', () => {
  const result = projectQuerySchema.parse({ budgetMin: '500', budgetMax: '100' });
  assert.equal(result.budgetMin, 100);
  assert.equal(result.budgetMax, 500);
});

test('projectQuerySchema drops invalid enum filters rather than rejecting the request', () => {
  const result = projectQuerySchema.parse({ subject: 'Astrology', classLevel: '99' });
  assert.equal(result.subject, undefined);
  assert.equal(result.classLevel, undefined);
});

test('signupSchema strips a client-supplied role', () => {
  const result = signupSchema.parse({
    name: 'A Teacher',
    email: 'Teacher@Example.COM',
    password: 'longenoughpassword',
    role: 'admin',
    adminSecret: 'anything',
  });

  assert.equal(result.role, undefined, 'role must never survive validation');
  assert.equal(result.adminSecret, undefined);
  assert.equal(result.email, 'teacher@example.com', 'email should be normalized');
});

test('signupSchema enforces a minimum password length', () => {
  const result = signupSchema.safeParse({
    name: 'A Teacher',
    email: 'a@example.com',
    password: 'short',
  });
  assert.equal(result.success, false);
});

test('updateProjectSchema strips fields a client must never write', () => {
  const result = updateProjectSchema.parse({
    title: 'A new title',
    createdBy: 'some-other-user-id',
    rating: 5,
    status: 'approved',
    id: 'forged-id',
  });

  assert.equal(result.title, 'A new title');
  assert.equal(result.createdBy, undefined, 'ownership must not be reassignable');
  assert.equal(result.rating, undefined, 'rating is derived, never client-set');
  assert.equal(result.status, undefined, 'status changes go through the admin route');
  assert.equal(result.id, undefined);
});

test('updateStatusSchema requires a reason when rejecting', () => {
  assert.equal(updateStatusSchema.safeParse({ status: 'rejected' }).success, false);
  assert.equal(
    updateStatusSchema.safeParse({ status: 'rejected', rejectionReason: '   ' }).success,
    false
  );
  assert.equal(
    updateStatusSchema.safeParse({ status: 'rejected', rejectionReason: 'Add a safety note to step 4.' })
      .success,
    true
  );
  assert.equal(updateStatusSchema.safeParse({ status: 'approved' }).success, true);
});

test('updateStatusSchema refuses statuses outside approved/rejected', () => {
  for (const status of ['pending', 'deleted', 'APPROVED', '']) {
    assert.equal(updateStatusSchema.safeParse({ status }).success, false, `should reject: ${status}`);
  }
});

test('submitFeedbackSchema ignores a client-supplied identity', () => {
  const result = submitFeedbackSchema.parse({
    projectId: '550e8400-e29b-41d4-a716-446655440001',
    rating: 4,
    userName: 'Somebody Else',
    schoolName: 'Fake School',
    userId: 'another-user',
  });

  assert.equal(result.userName, undefined, 'identity comes from the token, not the body');
  assert.equal(result.schoolName, undefined);
  assert.equal(result.userId, undefined);
  assert.equal(result.rating, 4);
});

test('submitFeedbackSchema bounds the rating to 1-5', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440001';
  for (const rating of [0, 6, -1, 2.5]) {
    assert.equal(
      submitFeedbackSchema.safeParse({ projectId, rating }).success,
      false,
      `should reject rating: ${rating}`
    );
  }
  assert.equal(submitFeedbackSchema.safeParse({ projectId, rating: 5 }).success, true);
});
