import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { securityHeaders } from '../config/security-headers.js';

test('production policy restricts executable resources and framing without allowing inline code', () => {
  const policy = securityHeaders['Content-Security-Policy'];
  for (const directive of ["default-src 'none'", "script-src 'self'", "style-src 'self'", "font-src 'self'", "connect-src 'none'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'none'", "form-action 'none'"]) assert.ok(policy.split(';').map(s => s.trim()).includes(directive), directive);
  assert.ok(!policy.includes('unsafe-inline') && !policy.includes('unsafe-eval'));
  assert.equal(securityHeaders['X-Content-Type-Options'], 'nosniff');
  assert.equal(securityHeaders['X-Frame-Options'], 'DENY');
  assert.match(securityHeaders['Strict-Transport-Security'], /max-age=31536000/);
  assert.match(securityHeaders['Permissions-Policy'], /clipboard-write=\(self\)/);
  assert.match(securityHeaders['Permissions-Policy'], /camera=\(\)/);
});

test('Vercel and portable static-host configurations deliver the tested header policy', async () => {
  const vercel = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.equal(vercel.outputDirectory, 'dist');
  assert.equal(vercel.installCommand, 'npm ci');
  assert.equal(vercel.headers[0].source, '/(.*)');
  assert.deepEqual(Object.fromEntries(vercel.headers[0].headers.map(h => [h.key, h.value])), securityHeaders);
  const portable = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  assert.ok(portable.startsWith('/*\n'));
  for (const [key, value] of Object.entries(securityHeaders)) assert.ok(portable.includes(`  ${key}: ${value}\n`), key);
});

test('development and preview commands bind only to loopback', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  for (const name of ['dev', 'preview']) {
    assert.match(pkg.scripts[name], /--host 127\.0\.0\.1(?:\s|$)/);
    assert.ok(!pkg.scripts[name].includes('0.0.0.0'));
  }
});
