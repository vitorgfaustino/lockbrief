import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { git, loadState, planUpdate, applyPlan, tree, blob, STATE } from './engine.mjs';
import { discover, fetchSource } from './source.mjs';
import { validate } from './validate.mjs';
import { publish } from './publish.mjs';
const [command, rootArg = '.', outputArg = '/tmp/lockbrief-sync.json'] = process.argv.slice(2);
const root = resolve(rootArg), output = resolve(outputArg);
if (output === root || output.startsWith(root + '/')) throw new Error('Plano deve ficar fora do checkout');
const temp = mkdtempSync(join(tmpdir(), 'lockbrief-source-'));
try {
  let previous = loadState(root);
  if (command === 'ci') {
    if (process.env.EXPECTED_SHA !== git(root, ['rev-parse', 'HEAD']).trim()) throw new Error('SHA de CI divergente');
    const head = git(root, ['rev-parse', 'HEAD']).trim();
    const parent = git(root, ['rev-parse', 'HEAD^']).trim();
    previous = JSON.parse(blob(root, tree(root, parent).get(STATE).blob));
    const selected = loadState(root), target = fetchSource(temp, selected, previous);
    const { execFileSync } = await import('node:child_process');
    const base = mkdtempSync(join(tmpdir(), 'lockbrief-ci-base-'));
    try {
      execFileSync('git', ['clone', '--quiet', '--no-hardlinks', '--no-checkout', root, base], { stdio: 'pipe' });
      git(base, ['checkout', '--quiet', '--detach', parent]);
      const plan = planUpdate({ root: base, source: temp, target });
      if (plan.status !== 'available') throw new Error('Candidato de CI não corresponde a uma atualização');
      const expected = tree(root, parent); for (const c of plan.changes) c.after ? expected.set(c.path, c.after) : expected.delete(c.path);
      const actual = tree(root, head); expected.set(STATE, actual.get(STATE));
      if (JSON.stringify([...expected].sort()) !== JSON.stringify([...actual].sort())) throw new Error('Commit contém alterações fora do overlay');
      // Valida a mesma árvore em um checkout descartável, antes de commit.
      applyPlan(base, temp, plan);
      validate(base, temp, plan);
      git(root, ['diff', '--check', parent, head]);
      console.log('CI do candidato e configuração protegida aprovadas; nenhuma publicação.');
    } finally { rmSync(base, { recursive: true, force: true }); }
  } else if (command === 'detect' || command === 'prepare') {
    const selected = await discover(), target = fetchSource(temp, selected, previous);
    const plan = planUpdate({ root, source: temp, target });
    if (command === 'detect') {
      console.log(JSON.stringify({ status: plan.status, previous: previous.tag, target: target.tag, sha: target.sha, conflicts: plan.conflicts }, null, 2));
      if (plan.status === 'blocked') process.exitCode = 1;
    } else if (plan.status === 'up_to_date') { console.log('Versão já incorporada.'); }
    else {
      if (plan.status !== 'available') throw new Error('Conflitos detectados; executar detect e revisar manualmente');
      applyPlan(root, temp, plan);
      const report = validate(root, temp, plan);
      writeFileSync(output, JSON.stringify({ plan, report }, null, 2) + '\n', { mode: 0o600 });
      console.log('Candidato local validado. Plano salvo fora do checkout. Sem commit/push/PR.');
    }
  } else if (command === 'publish') {
    if (process.env.SYNC_PR_WRITES_APPROVED !== 'true') throw new Error('Publicação privada sem habilitação operacional');
    const { plan, report } = JSON.parse(readFileSync(output, 'utf8'));
    const selected = await discover();
    if (selected.tag !== plan.target.tag) throw new Error('Release mais recente mudou; revisar candidato');
    const target = fetchSource(temp, selected, plan.previous);
    if (target.sha !== plan.target.sha) throw new Error('Tag candidata alterada');
    const token = process.env.GH_TOKEN;
    if (!token) throw new Error('Token privado ausente');
    const api = async (method, path, body) => {
      const r = await fetch(`https://api.github.com${path}`, { method, headers: {
        Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json', 'X-GitHub-Api-Version': '2022-11-28' },
        body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30_000), redirect: 'error' });
      if (!r.ok) throw new Error(`API privada falhou (HTTP ${r.status}); revisar branch/PR antes de repetir`);
      return r.status === 204 ? null : r.json();
    };
    const result = await publish({ root, source: temp, plan, report, repository: process.env.GITHUB_REPOSITORY, api });
    console.log(JSON.stringify(result));
  } else throw new Error('Uso: cli.mjs detect|prepare|publish|ci checkout [plano-fora-do-checkout]');
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { rmSync(temp, { recursive: true, force: true }); }
