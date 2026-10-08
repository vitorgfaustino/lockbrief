import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, unlinkSync, chmodSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { OFFICIAL, STATE, git, planUpdate, applyPlan, safePath, selectRelease, tree, verifyPlan } from '../engine.mjs';
import { validate, fingerprint } from '../validate.mjs';
import { publish } from '../publish.mjs';
import { discover } from '../source.mjs';
function fixture(t) {
  const home = mkdtempSync(join(tmpdir(), 'lockbrief-sync-test-')); t.after(() => rmSync(home, { recursive: true, force: true }));
  const source = join(home, 'source'), root = join(home, 'demo'); mkdirSync(source);
  git(source, ['init', '-q']); git(source, ['config', 'user.name', 'Fixture']); git(source, ['config', 'user.email', 'fixture@example.invalid']);
  const put = (dir, path, value) => { mkdirSync(dirname(join(dir,path)), { recursive: true }); writeFileSync(join(dir,path), value); };
  const pkg = v => ({ name: 'fixture', version: v, devDependencies: {}, engines: { node: '>=22' } });
  const manifests = v => { put(source,'package.json',JSON.stringify(pkg(v))); put(source,'package-lock.json',JSON.stringify({ version:v, packages:{'':pkg(v)} })); };
  const commit = dir => { git(dir,['add','.']); git(dir,['commit','-qm','fixture']); return git(dir,['rev-parse','HEAD']).trim(); };
  manifests('1.2.0'); put(source,'wrangler.toml','PUBLIC TEMPLATE\n'); put(source,'a.txt','old'); put(source,'obsolete.txt','obsolete'); put(source,'migrations/0001.sql','CREATE TABLE x(a);');
  const old = commit(source); git(source,['tag','v1.2.0']);
  execFileSync('git',['clone','-q',source,root],{stdio:'pipe'}); git(root,['config','user.name','Fixture']); git(root,['config','user.email','fixture@example.invalid']);
  put(root,'wrangler.toml','PRIVATE OPERATIONAL PLACEHOLDER\n');
  put(root,STATE,JSON.stringify({repository:OFFICIAL,tag:'v1.2.0',sha:old})); put(root,'.lockbrief/sync-policy.json',JSON.stringify({protectedPaths:[]}));
  put(root,'.gitignore','.dev.vars\ndist/\n');
  // A política reconhece explicitamente a configuração privada de bootstrap.
  put(root,'.lockbrief/sync-policy.json',JSON.stringify({protectedPaths:['.gitignore']}));
  const base = commit(root);
  manifests('1.2.1'); put(source,'a.txt','new'); unlinkSync(join(source,'obsolete.txt')); put(source,'new.txt','new file'); chmodSync(join(source,'new.txt'),0o755);
  const sha = commit(source); git(source,['tag','v1.2.1']);
  const target={repository:OFFICIAL,tag:'v1.2.1',sha};
  return {home,source,root,old,base,target,put,commit,manifests,plan:()=>planUpdate({root,source,target})};
}
test('overlay real aplica adições, remoções, modos e estado; preserva configuração e arquivos ignorados', t=>{
  const f=fixture(t), plan=f.plan(); assert.equal(plan.status,'available');
  f.put(f.root,'.dev.vars','LOCAL ONLY'); f.put(f.root,'dist/custom.txt','IGNORED');
  assert.equal(applyPlan(f.root,f.source,plan),true); verifyPlan(f.root,f.source,plan,true);
  assert.equal(readFileSync(join(f.root,'a.txt'),'utf8'),'new'); assert.equal(readFileSync(join(f.root,'wrangler.toml'),'utf8'),'PRIVATE OPERATIONAL PLACEHOLDER\n');
  assert.equal(readFileSync(join(f.root,'dist/custom.txt'),'utf8'),'IGNORED'); assert.throws(()=>readFileSync(join(f.root,'obsolete.txt')));
  f.commit(f.root); assert.equal(f.plan().status,'up_to_date'); assert.equal(applyPlan(f.root,f.source,f.plan()),false);
});
test('personalização desconhecida bloqueia inclusive arquivo sem mudança upstream',t=>{
  const f=fixture(t); f.put(f.root,'local.txt','custom'); f.commit(f.root);
  const p=f.plan(); assert.equal(p.status,'blocked'); assert.ok(p.conflicts.some(x=>x.path==='local.txt')); assert.throws(()=>applyPlan(f.root,f.source,p));
});
test('personalização explicitamente protegida é preservada',t=>{
  const f=fixture(t); f.put(f.root,'a.txt','branding'); f.put(f.root,'.lockbrief/sync-policy.json',JSON.stringify({protectedPaths:['.gitignore','a.txt']})); f.commit(f.root);
  applyPlan(f.root,f.source,f.plan()); assert.equal(readFileSync(join(f.root,'a.txt'),'utf8'),'branding');
});
test('schema e template alterados exigem revisão manual',t=>{
  const f=fixture(t); f.put(f.source,'migrations/0002.sql','ALTER TABLE x ADD COLUMN b;'); f.put(f.source,'wrangler.toml','CHANGED'); f.target.sha=f.commit(f.source);
  const p=f.plan(); assert.equal(p.status,'blocked'); assert.ok(p.conflicts.some(x=>x.reason==='schema_exige_autorização_operacional')); assert.ok(p.conflicts.some(x=>x.reason==='template_operacional_alterado'));
});
test('downgrade, SHA de tag alterada e origem não oficial são rejeitados',t=>{
  const f=fixture(t); assert.throws(()=>planUpdate({...f,target:{...f.target,tag:'v1.1.1'}}),/Downgrade/);
  assert.throws(()=>planUpdate({...f,target:{...f.target,tag:'v1.2.0'}}),/Tag alterada/);
  assert.throws(()=>planUpdate({...f,target:{...f.target,repository:'other/repo'}}),/não autorizado/);
});
test('checkout sujo e plano adulterado são recusados antes de escrever',t=>{
  const f=fixture(t), p=f.plan(); const forged=structuredClone(p); forged.changes=[]; assert.throws(()=>applyPlan(f.root,f.source,forged),/alterados/);
  f.put(f.root,'a.txt','dirty'); assert.throws(f.plan,/limpo/); assert.equal(readFileSync(join(f.root,'a.txt'),'utf8'),'dirty');
});
test('lockfile incoerente impede atualização',t=>{
  const f=fixture(t); f.put(f.source,'package-lock.json','{"version":"1.2.0"}'); f.target.sha=f.commit(f.source); assert.throws(f.plan,/divergentes/);
});
test('arquivos privados e symlinks na release impedem overlay',t=>{
  const f=fixture(t); f.put(f.source,'.env.production','PLACEHOLDER'); f.target.sha=f.commit(f.source); assert.equal(f.plan().status,'blocked');
  symlinkSync('/tmp',join(f.source,'link')); f.target.sha=f.commit(f.source); assert.throws(f.plan,/Symlink/);
});
test('symlink na raiz e caminhos com travessia são rejeitados',t=>{
  const f=fixture(t); symlinkSync(f.root,join(f.home,'alias')); assert.throws(()=>planUpdate({...f,root:join(f.home,'alias')}),/symlink/);
  for(const path of ['../escape','x/../escape','/tmp/escape','x\\y','.GIT/config','x\ny']) assert.throws(()=>safePath(path));
});
test('falha durante overlay desfaz arquivos e estado anteriores',t=>{
  const f=fixture(t), p=f.plan(); const entry=tree(f.source,f.target.sha).get('new.txt');
  unlinkSync(join(f.source,'.git/objects',entry.blob.slice(0,2),entry.blob.slice(2)));
  assert.throws(()=>applyPlan(f.root,f.source,p)); assert.equal(git(f.root,['status','--porcelain']).trim(),'');
  assert.equal(readFileSync(join(f.root,'a.txt'),'utf8'),'old'); assert.equal(JSON.parse(readFileSync(join(f.root,STATE))).tag,'v1.2.0');
});
test('release estável tem ordenação numérica; draft/prerelease não elegíveis',()=>{
  const r=(tag,extra={})=>({tag_name:tag,published_at:'date',...extra});
  assert.equal(selectRelease([r('v1.9.0'),r('v1.10.0'),r('v9.0.0',{draft:true}),r('v8.0.0',{prerelease:true})]).tag,'v1.10.0'); assert.throws(()=>selectRelease([]));
});
test('descoberta pagina exclusivamente upstream oficial e falha fechada',async()=>{
  const seen=[]; const result=await discover(async url=>{seen.push(url);return {ok:true,json:async()=>seen.length===1?Array.from({length:100},()=>({draft:true})): [{tag_name:'v1.2.1',published_at:'date'}]};});
  assert.equal(result.tag,'v1.2.1'); assert.equal(seen.length,2); assert.ok(seen.every(u=>u.startsWith('https://api.github.com/repos/'+OFFICIAL+'/')));
  await assert.rejects(discover(async()=>({ok:false})),/indisponível/);
});
test('validação usa template público, ambiente sem credenciais e somente D1 local/dry-run',t=>{
  const f=fixture(t), p=f.plan(); applyPlan(f.root,f.source,p); const commands=[];
  const report=validate(f.root,f.source,p,{run:(command,args,opts)=>{
    commands.push([command,args]); assert.equal(readFileSync(join(opts.cwd,'wrangler.toml'),'utf8'),'PUBLIC TEMPLATE\n');
    assert.equal(opts.env.GH_TOKEN,undefined); assert.equal(opts.env.CLOUDFLARE_API_TOKEN,undefined); assert.notEqual(opts.env.HOME,process.env.HOME);
    assert.equal(opts.env.npm_config_ignore_scripts,'true');
  }}); assert.equal(report.gates,10); assert.ok(!commands.some(([,a])=>a.includes('--remote'))); assert.ok(commands.at(-1)[1].includes('--dry-run'));
});
test('publicação cria PR sem automerge e despacha CI explicitamente no SHA gerado',async t=>{
  const f=fixture(t), p=f.plan(); applyPlan(f.root,f.source,p); const calls=[];
  const api=async(method,path,body)=>{calls.push({method,path,body});
    if(path.endsWith('/git/ref/heads/main'))return {object:{sha:f.base}};
    if(method==='GET'&&path.endsWith('/lockbrief-demo'))return {private:true,default_branch:'main'};
    if(path.includes('/git/commits/')&&method==='GET')return {tree:{sha:'tree-base'}};
    if(path.endsWith('/git/commits'))return {sha:'c'.repeat(40)};
    if(path.endsWith('/pulls'))return {html_url:'https://example.invalid/pr'};
    return {sha:'b'.repeat(40)};
  };
  const report={result:'passed',gates:10,target:p.target,fingerprint:fingerprint(f.root,p),node:process.version,npm:'10.9.2'};
  const result=await publish({...f,plan:p,report,repository:'vitorgfaustino/lockbrief-demo',api});
  assert.equal(result.ci,'dispatched'); const dispatch=calls.find(c=>c.path.endsWith('/dispatches')); assert.equal(dispatch.body.inputs.expected_sha,'c'.repeat(40));
  assert.ok(!calls.some(c=>c.path.includes('/merges')||c.method==='PATCH')); assert.ok(calls.find(c=>c.path.endsWith('/git/trees')).body.tree.some(x=>x.path==='obsolete.txt'&&x.sha===null));
  await assert.rejects(publish({...f,plan:p,report:{...report,result:'failed'},repository:'vitorgfaustino/lockbrief-demo',api}),/Validação/);
  await assert.rejects(publish({...f,plan:p,report,repository:OFFICIAL,api}),/Destino/);
  await assert.rejects(publish({...f,plan:p,report,repository:'vitorgfaustino/lockbrief-demo',api:async(m,path,b)=>path.endsWith('/git/ref/heads/main')?{object:{sha:'d'.repeat(40)}}:api(m,path,b)}),/Main remota mudou/);
});
test('histórico sem ancestralidade e proteção de schema continuam bloqueados',t=>{
  const f=fixture(t); f.put(f.source,'migrations/0002.sql','ALTER TABLE x ADD COLUMN b;'); f.target.sha=f.commit(f.source);
  f.put(f.root,'.lockbrief/sync-policy.json',JSON.stringify({protectedPaths:['.gitignore','migrations/']})); f.commit(f.root); assert.equal(f.plan().status,'blocked');
  git(f.source,['checkout','-q','--orphan','other']); git(f.source,['rm','-rfq','.']); f.manifests('1.2.2'); f.target.tag='v1.2.2'; f.target.sha=f.commit(f.source); assert.throws(f.plan,/divergente/);
});
test('mudança de arquivo protegido depois de aplicar invalida candidato e relatório',t=>{
  const f=fixture(t),p=f.plan(); applyPlan(f.root,f.source,p); f.put(f.root,'wrangler.toml','OPERATION CHANGED'); assert.throws(()=>verifyPlan(f.root,f.source,p,true),/protegida/);
});
test('reestruturação arquivo/diretório para em revisão manual',t=>{
  const f=fixture(t); unlinkSync(join(f.source,'a.txt')); f.put(f.source,'a.txt/child','new structure'); f.target.sha=f.commit(f.source);
  assert.ok(f.plan().conflicts.some(x=>x.reason==='reestruturação_exige_revisão_manual'));
});
