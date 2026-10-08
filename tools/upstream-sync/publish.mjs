import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { verifyCandidate, fingerprint } from './validate.mjs';
import { STATE, OFFICIAL } from './engine.mjs';

export async function publish({ root, source, plan, report, repository, api }) {
  if (repository !== 'vitorgfaustino/lockbrief-demo' || repository === OFFICIAL) throw new Error('Destino não autorizado');
  verifyCandidate(root, source, plan);
  if (report.result !== 'passed' || report.gates !== 10 || report.fingerprint !== fingerprint(root, plan)
    || JSON.stringify(report.target) !== JSON.stringify(plan.target)) throw new Error('Validação ausente ou desatualizada');
  const repo = await api('GET', `/repos/${repository}`);
  if (!repo.private || repo.default_branch !== 'main') throw new Error('Destino não privado ou branch não reconhecida');
  const base = await api('GET', `/repos/${repository}/git/ref/heads/main`);
  if (base.object.sha !== plan.baseDemo) throw new Error('Main remota mudou; refazer planejamento e validação');
  const commit = await api('GET', `/repos/${repository}/git/commits/${plan.baseDemo}`);
  const entries = [];
  for (const c of [...plan.changes, { path: STATE, after: { mode: '100644' } }]) {
    let sha = null;
    if (c.after) {
      const b = await api('POST', `/repos/${repository}/git/blobs`, { content: readFileSync(join(root, c.path)).toString('base64'), encoding: 'base64' });
      sha = b.sha;
    }
    entries.push({ path: c.path, mode: c.after?.mode ?? c.before.mode, type: 'blob', sha });
  }
  const t = await api('POST', `/repos/${repository}/git/trees`, { base_tree: commit.tree.sha, tree: entries });
  const c = await api('POST', `/repos/${repository}/git/commits`, { message: `chore: sync ${plan.target.tag}`, tree: t.sha, parents: [plan.baseDemo] });
  const current = await api('GET', `/repos/${repository}/git/ref/heads/main`);
  if (current.object.sha !== plan.baseDemo) throw new Error('Main mudou antes da PR');
  const branch = `sync/${plan.target.tag}-${plan.baseDemo.slice(0, 12)}`;
  // create ref é exclusivo; nunca atualizar à força uma branch existente.
  await api('POST', `/repos/${repository}/git/refs`, { ref: `refs/heads/${branch}`, sha: c.sha });
  const body = [
    `Atualização ${plan.previous.tag} → ${plan.target.tag}. Upstream: ${plan.target.sha}.`,
    `Validação local isolada: 10 gates aprovados (${report.node}, npm ${report.npm}).`,
    'Configuração Wrangler, workflows privados, estado de operação e caminhos protegidos preservados.',
    'Nenhuma migration remota ou deploy executado. Merge exige revisão humana e CI completa para o SHA abaixo.',
    `SHA candidato: ${c.sha}.`,
    'Arquivos:', ...plan.changes.map(x => `- ${x.before ? x.after ? 'modificado' : 'removido' : 'adicionado'}: ${x.path}`),
  ].join('\n\n');
  const pr = await api('POST', `/repos/${repository}/pulls`, { title: `Atualizar LockBrief para ${plan.target.tag}`, head: branch, base: 'main', body });
  // workflow_dispatch independe do disparo de pull_request criado pelo GITHUB_TOKEN.
  await api('POST', `/repos/${repository}/actions/workflows/sync-ci.yml/dispatches`, {
    ref: branch, inputs: { expected_sha: c.sha } });
  return { url: pr.html_url, sha: c.sha, branch, ci: 'dispatched' };
}
