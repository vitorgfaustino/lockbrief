import { execFileSync } from 'node:child_process';
import { git, OFFICIAL, selectRelease, version } from './engine.mjs';
export async function discover(fetcher = fetch) {
  const releases = [];
  for (let page = 1; page <= 100; page++) {
    const response = await fetcher(`https://api.github.com/repos/${OFFICIAL}/releases?per_page=100&page=${page}`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'LockBrief-release-sync' }, signal: AbortSignal.timeout(30_000), redirect: 'error' });
    if (!response.ok) throw new Error('Upstream indisponível');
    const items = await response.json();
    if (!Array.isArray(items)) throw new Error('Resposta upstream inválida');
    releases.push(...items);
    if (items.length < 100) return selectRelease(releases);
  }
  throw new Error('Paginação de releases excedida');
}
export function fetchSource(path, selected, previous) {
  version(selected.tag); version(previous.tag);
  execFileSync('git', ['init', '--quiet', '--bare', path], { stdio: 'pipe' });
  const tags = [...new Set([selected.tag, previous.tag])];
  git(path, ['-c', 'credential.helper=', 'fetch', '--quiet', '--no-tags', `https://github.com/${OFFICIAL}.git`,
    ...tags.map(tag => `refs/tags/${tag}:refs/tags/${tag}`)]);
  const sha = git(path, ['rev-parse', `${selected.tag}^{commit}`]).trim();
  if (git(path, ['rev-parse', `${previous.tag}^{commit}`]).trim() !== previous.sha) throw new Error('Tag anterior foi alterada');
  return { ...selected, sha };
}
