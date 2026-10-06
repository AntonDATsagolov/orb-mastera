import test from 'node:test';
import assert from 'node:assert/strict';
import { auditRelease } from '../scripts/check-release.mjs';

test('release source has valid assets, module imports, manifests, and JavaScript syntax', () => {
  const report = auditRelease();
  assert.deepEqual(report.errors, [], report.errors.join('\n'));
  assert.ok(report.jsFilesChecked >= 40, 'expected the complete application module tree to be checked');
});

test('release audit recognizes the bundled procedural soundtrack', () => {
  const report = auditRelease();
  assert.equal(report.warnings.some((warning) => warning.includes('Background music is unavailable')), false);
});
