import fs from 'node:fs';

const source = fs.readFileSync(new URL('../src/views/wechat/aiMemory/index.vue', import.meta.url), 'utf8');

if (source.includes(':disabled="!!form.id"')) {
	throw new Error('identity fields are still disabled while editing');
}
for (const required of [
	'@change="changeMemoryType"',
	'@change="changeMemoryScope"',
	'@change="changeMemoryGroup"',
	':disabled="form.memoryType!==\'PERSON\'||form.scopeType===\'GLOBAL\'"',
	"form.subjectWxid=''",
	"form.scopeType='GROUP'",
	"form.sensitivity='NORMAL'",
	"form.groupId=''",
	'loadMembers(groupId)',
	'memberRequestSequence',
	'request!==memberRequestSequence',
	'Number(form.groupId)!==groupId',
	':disabled="form.memoryType===\'CONVERSATION\'"',
	"form.scopeType==='GROUP'||form.memoryType==='PERSON'",
	'row.subjectGroupId||row.groupId',
	"form.scopeType==='GROUP'||form.memoryType==='PERSON'?form.groupId||undefined:undefined",
	"if(form.scopeType==='GLOBAL')form.sensitivity='NORMAL'",
]) {
	if (!source.includes(required)) {
		throw new Error(`memory edit contract missing: ${required}`);
	}
}

console.log('PASS');
