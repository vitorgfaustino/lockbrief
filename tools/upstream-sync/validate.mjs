import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { git, tree, blob, STATE, verifyPlan } from './engine.mjs';

export function fingerprint(root, plan) {
  return createHash('sha256').update(JSON.stringify(plan)).update(git(root, ['diff', '--binary', 'HEAD'], null)).digest('hex');
}
export function verifyCandidate(root, source, plan) {
  const temp = mkdtempSync(join(tmpdir(), 'lockbrief-base-'));
  try {
    execFileSync('git', ['clone', '--quiet', '--no-hardlinks', '--no-checkout', root, temp], { stdio: 'pipe' });
    git(temp, ['checkout', '--quiet', '--detach', plan.baseDemo]);
    verifyPlan(temp, source, plan);
    verifyPlan(root, source, plan, true);
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
// A configuração operacional nunca é copiada para o sandbox de validação.
export function validate(root, source, plan, { run = execFileSync } = {}) {
  verifyCandidate(root, source, plan);
  const temp = mkdtempSync(join(tmpdir(), 'lockbrief-validation-'));
  try {
    const entries = tree(root, plan.baseDemo);
    for (const c of plan.changes) c.after ? entries.set(c.path, c.after) : entries.delete(c.path);
    for (const [path, entry] of entries) {
      if (path === 'wrangler.toml' || path.startsWith('.github/') || path.startsWith('.lockbrief/')
        || path.startsWith('tools/upstream-sync/') || /(^|\/)(\.env[^/]*|\.dev\.vars[^/]*|wrangler\.[^/]*\.toml|\.wrangler|dist|node_modules)(\/|$)/.test(path)) continue;
      const output = join(temp, path);
      mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, readFileSync(join(root, path)));
      chmodSync(output, entry.mode === '100755' ? 0o755 : 0o644);
    }
    writeFileSync(join(temp, 'wrangler.toml'), blob(source, tree(source, plan.target.sha).get('wrangler.toml').blob));
    const home = join(temp, '.validation-home'); mkdirSync(home);
    const env = { PATH: process.env.PATH, HOME: home, TMPDIR: tmpdir(), CI: 'true',
      WRANGLER_SEND_METRICS: 'false', npm_config_ignore_scripts: 'true', npm_config_engine_strict: 'true' };
    const commands = [
      ['npm', ['ci', '--ignore-scripts', '--include=optional']],
      ['npm', ['audit', '--audit-level=high']],
      ['npm', ['run', 'typecheck']], ['npm', ['run', 'build']], ['npm', ['test']],
      ['npm', ['run', 'test:tooling']], ['npm', ['run', 'test:sync']],
      ['npm', ['run', 'dev-init']], ['npm', ['run', 'dev-init']],
      ['npx', ['--no-install', 'wrangler', 'deploy', '--dry-run', '--config', 'wrangler.toml', '--outdir', join(temp, '.dry-run')]],
    ];
    // Os testes do controlador também fazem parte do candidato validado.
    for (const [path, entry] of entries) if (path.startsWith('tools/upstream-sync/')) {
      const output = join(temp, path); mkdirSync(dirname(output), { recursive: true });
      writeFileSync(output, readFileSync(join(root, path))); chmodSync(output, entry.mode === '100755' ? 0o755 : 0o644);
    }
    for (const [command, args] of commands) run(command, args, { cwd: temp, env, stdio: 'inherit', timeout: 600_000 });
    verifyCandidate(root, source, plan);
    return { format: 1, target: plan.target, fingerprint: fingerprint(root, plan), node: process.version,
      npm: execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim(), gates: commands.length, result: 'passed' };
  } finally { rmSync(temp, { recursive: true, force: true }); }
}
