import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, mkdirSync, writeFileSync, unlinkSync, chmodSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

export const OFFICIAL = 'vitorgfaustino/lockbrief';
export const STATE = '.lockbrief/upstream.json';
export const CONTROL = ['.github/', '.lockbrief/', 'tools/upstream-sync/', 'wrangler.toml'];
const SHA = /^[a-f0-9]{40}$/;
export const git = (root, args, encoding = 'utf8') => execFileSync('git', ['-C', root, ...args], { encoding, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 32 * 1024 * 1024 });
const hash = data => createHash('sha256').update(data).digest('hex');
export function safePath(path) {
  if (typeof path !== 'string' || !path || /[\\\x00-\x1f\x7f]/.test(path) || path.startsWith('/')
    || path.split('/').some(part => !part || part === '.' || part === '..' || part.toLowerCase() === '.git')
    || path.toLowerCase().startsWith('.git/')) throw new Error('Caminho inseguro');
  return path;
}
export function protectedPath(path, custom = []) {
  return [...CONTROL, ...custom].some(p => path === p || (p.endsWith('/') && path.startsWith(p)))
    || /(^|\/)(\.env[^/]*|\.dev\.vars[^/]*|wrangler\.[^/]*\.toml|node_modules|dist|\.wrangler)(\/|$)/.test(path);
}
export function version(tag) {
  const m = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(tag);
  if (!m) throw new Error('Release não estável ou versão inválida');
  return m.slice(1).map(BigInt);
}
export function compare(a, b) {
  const x = version(a), y = version(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i] ? 1 : -1;
  return 0;
}
export function selectRelease(releases) {
  if (!Array.isArray(releases)) throw new Error('Resposta de releases inválida');
  const stable = releases.filter(r => r && !r.draft && !r.prerelease && r.published_at && /^v\d+\.\d+\.\d+$/.test(r.tag_name));
  stable.forEach(r => version(r.tag_name));
  stable.sort((a, b) => compare(b.tag_name, a.tag_name));
  if (!stable.length) throw new Error('Nenhuma release estável disponível');
  return { repository: OFFICIAL, tag: stable[0].tag_name };
}
export function tree(root, sha) {
  if (!SHA.test(sha)) throw new Error('SHA inválido');
  const result = new Map();
  for (const row of git(root, ['ls-tree', '-rz', sha]).split('\0').filter(Boolean)) {
    const [meta, path] = row.split('\t');
    safePath(path);
    const [mode, type, blob] = meta.split(' ');
    if (type !== 'blob' || !['100644', '100755'].includes(mode)) throw new Error('Symlink ou submódulo no snapshot');
    result.set(path, { mode, blob });
  }
  return result;
}
export const blob = (root, id) => git(root, ['cat-file', 'blob', id], null);
const same = (a, b) => a?.mode === b?.mode && a?.blob === b?.blob;
function localPath(root, path) {
  safePath(path);
  if (lstatSync(resolve(root)).isSymbolicLink()) throw new Error('Raiz com symlink');
  const absolute = resolve(root, path);
  let current = root;
  for (const part of path.split('/')) {
    current = join(current, part);
    if (existsSync(current) || (() => { try { lstatSync(current); return true; } catch { return false; } })()) {
      if (lstatSync(current).isSymbolicLink()) throw new Error('Symlink no destino');
    }
  }
  return absolute;
}
export function loadState(root) {
  const state = JSON.parse(readFileSync(localPath(root, STATE), 'utf8'));
  if (state.repository !== OFFICIAL || !SHA.test(state.sha)) throw new Error('Estado upstream inválido');
  version(state.tag);
  return state;
}
export function policy(root) {
  const p = JSON.parse(readFileSync(localPath(root, '.lockbrief/sync-policy.json'), 'utf8'));
  if (!Array.isArray(p.protectedPaths)) throw new Error('Política inválida');
  for (const path of p.protectedPaths) safePath(path.endsWith('/') ? path.slice(0, -1) : path);
  return p.protectedPaths;
}
export function planUpdate({ root, source, target, custom = policy(root) }) {
  root = resolve(root); source = resolve(source);
  const state = loadState(root);
  if (target.repository !== OFFICIAL || !SHA.test(target.sha)) throw new Error('Origem ou SHA não autorizado');
  const direction = compare(target.tag, state.tag);
  if (direction < 0) throw new Error('Downgrade bloqueado');
  if (!direction && target.sha !== state.sha) throw new Error('Tag alterada: versão igual com SHA diferente');
  if (git(root, ['status', '--porcelain', '--untracked-files=all']).trim()) throw new Error('Checkout não está limpo');
  const baseDemo = git(root, ['rev-parse', 'HEAD']).trim();
  const previous = tree(source, state.sha), next = tree(source, target.sha), current = tree(root, baseDemo);
  try { git(source, ['merge-base', '--is-ancestor', state.sha, target.sha]); }
  catch { throw new Error('Histórico upstream divergente'); }
  // Confirma versão do manifesto e lockfile na referência imutável.
  const pkg = JSON.parse(blob(source, next.get('package.json').blob));
  const lock = JSON.parse(blob(source, next.get('package-lock.json').blob));
  if (`v${pkg.version}` !== target.tag || lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version
    || JSON.stringify(pkg.devDependencies) !== JSON.stringify(lock.packages?.['']?.devDependencies)
    || JSON.stringify(pkg.engines) !== JSON.stringify(lock.packages?.['']?.engines)) throw new Error('Manifesto/lockfile da release divergentes');
  const conflicts = [], changes = [], preserved = [];
  for (const path of [...new Set([...previous.keys(), ...next.keys(), ...current.keys()])].sort()) {
    const before = previous.get(path), after = next.get(path), actual = current.get(path);
    if (path.startsWith('migrations/') && !same(before, after)) {
      conflicts.push({ path, reason: 'schema_exige_autorização_operacional' }); continue;
    }
    if (['package.json', 'package-lock.json', '.npmrc'].includes(path) && custom.some(p => path === p || (p.endsWith('/') && path.startsWith(p)))) {
      conflicts.push({ path, reason: 'manifesto_ou_política_protegidos_exigem_revisão' }); continue;
    }
    if (protectedPath(path, custom)) {
      if (actual) preserved.push(path);
      if (path === 'wrangler.toml' && !same(before, after)) conflicts.push({ path, reason: 'template_operacional_alterado' });
      continue;
    }
    if (!same(before, actual)) { conflicts.push({ path, reason: 'personalização_não_reconhecida' }); continue; }
    if (!same(before, after)) {
      if (path.startsWith('migrations/')) conflicts.push({ path, reason: 'schema_exige_autorização_operacional' });
      else changes.push({ path, before: before ?? null, after: after ?? null });
    }
  }
  // Bloqueia também artefatos upstream privados, mesmo quando seriam excluídos.
  for (const path of next.keys()) {
    if (/^(\.env[^/]*|\.dev\.vars[^/]*|wrangler\.[^/]*\.toml)(\/|$)/.test(path) && path !== '.env.example') {
      conflicts.push({ path, reason: 'arquivo_privado_na_release' });
    }
  }
  for (const change of changes) {
    if (changes.some(other => other.path !== change.path && (other.path.startsWith(change.path + '/') || change.path.startsWith(other.path + '/')))) {
      conflicts.push({ path: change.path, reason: 'reestruturação_exige_revisão_manual' });
    }
  }
  const protectedBlobs = Object.fromEntries([...current].filter(([path]) => protectedPath(path, custom)));
  return { format: 1, repository: OFFICIAL, previous: state, target, baseDemo, changes, preserved,
    protectedBlobs, conflicts, status: conflicts.length ? 'blocked' : direction ? 'available' : 'up_to_date' };
}
export function verifyPlan(root, source, plan, applied = false) {
  if (plan.status !== 'available' || plan.conflicts.length || git(root, ['rev-parse', 'HEAD']).trim() !== plan.baseDemo) throw new Error('Plano inválido ou base alterada');
  // Recalcula o plano completo a partir dos snapshots e política confiável.
  if (!applied && JSON.stringify(planUpdate({ root, source, target: plan.target })) !== JSON.stringify(plan)) throw new Error('Plano ou política alterados');
  for (const [path, entry] of Object.entries(plan.protectedBlobs)) {
    if (applied && path === STATE) continue;
    const absolute = localPath(root, path);
    const mode = lstatSync(absolute).mode & 0o111 ? '100755' : '100644';
    if (hash(readFileSync(absolute)) !== hash(blob(root, entry.blob)) || mode !== entry.mode) throw new Error('Configuração protegida alterada');
  }
  for (const change of plan.changes) {
    if (protectedPath(change.path, policy(root))) throw new Error('Plano toca caminho protegido');
    const entry = applied ? change.after : change.before, absolute = localPath(root, change.path);
    if (!entry) { if (existsSync(absolute)) throw new Error('Arquivo inesperado no destino'); }
    else if (!existsSync(absolute) || hash(readFileSync(absolute)) !== hash(blob(source, entry.blob))
      || (lstatSync(absolute).mode & 0o111 ? '100755' : '100644') !== entry.mode) throw new Error('Conteúdo/modo do candidato divergente');
  }
  if (applied) {
    const allowed = new Set([...plan.changes.map(c => c.path), STATE]);
    const changed = git(root, ['status', '--porcelain', '-z', '--untracked-files=all']).split('\0').filter(Boolean);
    for (const line of changed) if (!allowed.has(line.slice(3))) throw new Error('Mudança fora do plano');
    const state = loadState(root);
    if (JSON.stringify(state) !== JSON.stringify(plan.target)) throw new Error('Estado aplicado divergente');
  }
}
export function applyPlan(root, source, plan) {
  if (plan.status === 'up_to_date') return false;
  verifyPlan(root, source, plan);
  const rollback = [];
  try {
    for (const change of plan.changes) {
      const absolute = localPath(root, change.path);
      rollback.push({ absolute, data: change.before ? readFileSync(absolute) : null, mode: change.before?.mode });
      if (change.after) {
        mkdirSync(dirname(absolute), { recursive: true });
        writeFileSync(absolute, blob(source, change.after.blob), { flag: 'w' });
        chmodSync(absolute, change.after.mode === '100755' ? 0o755 : 0o644);
      } else unlinkSync(absolute);
    }
    const statePath = localPath(root, STATE), old = readFileSync(statePath);
    rollback.push({ absolute: statePath, data: old, mode: '100644' });
    writeFileSync(statePath, JSON.stringify(plan.target, null, 2) + '\n');
    verifyPlan(root, source, plan, true);
    return true;
  } catch (error) {
    for (const item of rollback.reverse()) {
      if (item.data === null) { if (existsSync(item.absolute)) unlinkSync(item.absolute); }
      else { writeFileSync(item.absolute, item.data); chmodSync(item.absolute, item.mode === '100755' ? 0o755 : 0o644); }
    }
    throw error;
  }
}
