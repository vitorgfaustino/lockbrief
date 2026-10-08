import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

// Gate exclusivo do código-fonte público. Não usar em wrangler operacional.
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0");
const privateFiles = files.filter(path => /(^|\/)(\.dev\.vars(?:\..*)?|\.env(?:\..*)?|wrangler(?:\..*)?\.local\.toml|\.wrangler\/.*)$/.test(path)
  && !path.endsWith(".env.example"));
assert.equal(privateFiles.length, 0, "Há arquivo operacional privado rastreado pelo Git");
const config = readFileSync("wrangler.toml", "utf8");
const ids = [...config.matchAll(/^\s*database_id\s*=\s*"([^"]*)"/gm)].map(match => match[1]);
assert.deepEqual(ids, ["00000000-0000-0000-0000-000000000000"], "O template público deve conter somente D1 placeholder");
assert.ok(!/^\s*(account_id|zone_id|routes?)\s*=/m.test(config), "O template não deve conter destino operacional");
assert.ok(!/^\s*\[(?:vars|env\.)/m.test(config), "Revisar configuração privada no template");
console.log("Template público e arquivos protegidos: OK");
