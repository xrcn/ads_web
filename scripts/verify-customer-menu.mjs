import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../src/stores/tagsViewRoutes.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
let cached=[
 {path:'/flowData/login',url:'/flowData/login?from=keep',query:{from:'keep'},meta:{title:'VV家族登录',icon:'old-icon',tagsViewName:'VV家族登录',isKeepAlive:true}},
 {path:'/details',query:{tagsViewName:'自定义详情名'},meta:{title:'旧详情标题',tagsViewName:'自定义详情名'}},
 {path:'/unknown',meta:{title:'保留原记录'}},
];
const original=JSON.parse(JSON.stringify(cached));
const output={};
const require=name=>name==='pinia'?{defineStore:(_name,definition)=>definition}:{Session:{get:()=>cached,set:(_key,value)=>{cached=value;}}};
new Function('require','exports',compiled)(require,output);
const definition=output.useTagsViewRoutes;
const store={...definition.state(),...definition.actions};
await store.setTagsViewRoutes([{path:'/flowData/login',meta:{title:'客户管理',icon:'ele-User'}},{path:'/details',meta:{title:'新详情标题'}}]);
assert.equal(cached[0].meta.title,'客户管理','cached tab must use the current menu title');
assert.equal(cached[0].meta.icon,'ele-User');
assert.equal(cached[0].meta.tagsViewName,undefined,'obsolete generated label must not override the new title');
assert.deepEqual(cached[0].query,original[0].query);
assert.equal(cached[0].url,original[0].url);
assert.equal(cached[0].meta.isKeepAlive,true);
assert.equal(cached[1].meta.tagsViewName,'自定义详情名');
assert.equal(cached[1].meta.title,'新详情标题');
assert.deepEqual(cached[2],original[2]);
cached=undefined;await store.setTagsViewRoutes([]);
console.log('Customer menu cached tab refresh PASS (title/icon, custom name, params and empty cache)');
