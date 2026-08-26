import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
const api=read('src/api/anchor/index.ts'); const page=read('src/views/anchor/manage/index.vue'); const list=read('src/views/anchor/manage/component/anchorList.vue'); const edit=read('src/views/anchor/manage/component/editAnchor.vue'); const group=read('src/views/wechat/group/index.vue');
const required=[
	[api,'/anchor/profile/batchPreview'],[api,'/anchor/profile/batchDelete'],[api,'/anchor/profile/batchIgnore'],[api,'/anchor/profile/batchCancelIgnore'],[api,'/anchor/binding/save'],
	[page,'platformCode'],[page,'bindingStatus'],[page,'recordState'],[list,'平台'],[list,'主播ID'],[list,'所属厅'],
	[edit,'platformCode'],[edit,'anchorId'],[edit,'hallId'],[group,'收集群成员'],[group,'runningStatus'],[group,'defaultPlatformCode'],[group,'defaultHallId'],
];
for(const [source,needle] of required){if(!source.includes(needle))throw new Error(`missing anchor profile contract: ${needle}`);}
console.log(`anchor profile verifier passed: ${required.length} assertions`);
