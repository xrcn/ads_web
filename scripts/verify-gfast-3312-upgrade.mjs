import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const files = {
	request: readFileSync('src/utils/request.ts', 'utf8'),
	uploadFile: readFileSync('src/components/uploadFile/index.vue', 'utf8'),
	uploadImg: readFileSync('src/components/uploadImg/index.vue', 'utf8'),
	theme: readFileSync('src/theme/el-ui.scss', 'utf8'),
};

const canonicalUpdateBeforeEmit = (source) => /canonicalFileList\.value = list;[\s\S]*emit\('update:modelValue', _\.cloneDeep\(canonicalFileList\.value\)\)/.test(source);

const checks = [
	[files.request.includes('let isRelogin = false'), '401 single-dialog guard'],
	[files.request.includes('__requestToken'), 'request token snapshot'],
	[files.request.includes('requestToken !== currentToken'), 'refreshed-token retry'],
	[files.request.includes('__retriedAfterTokenRefresh = true'), '401 retry marker set'],
	[files.request.includes('!config.__retriedAfterTokenRefresh'), '401 retry marker checked'],
	[!files.request.includes('return service(response.config);'), '401 direct unbounded retry removed'],
	[/\.finally\(\(\) => \{\s*isRelogin = false;/.test(files.request), '401 dialog guard reset'],
	[files.uploadFile.includes('watch(() => props.modelValue'), 'file controlled state'],
	[files.uploadFile.includes('_.isEqual(dataFileList.value, transformed)'), 'file deep equality'],
	[files.uploadFile.includes('canonicalFileList'), 'file canonical list'],
	[files.uploadImg.includes('canonicalFileList'), 'image canonical list'],
	[canonicalUpdateBeforeEmit(files.uploadFile), 'file canonical list updated before emit'],
	[canonicalUpdateBeforeEmit(files.uploadImg), 'image canonical list updated before emit'],
	[files.uploadFile.includes('syncDataFileList(true);'), 'file failure cleanup'],
	[files.uploadImg.includes('syncDataFileList(true);'), 'image failure cleanup'],
	[!files.uploadFile.includes('filter((item: any) => item.name !== file.name)'), 'file delete does not remove all same-name items'],
	[!files.uploadImg.includes('filter((item: any) => item.name !== file.name)'), 'image delete does not remove all same-name items'],
	[files.uploadFile.includes('proxy.getUpFileUrl(item.url) === file.url'), 'file deletion matches display URL to canonical path'],
	[files.uploadImg.includes('proxy.getUpFileUrl(item.url) === file.url'), 'image deletion matches display URL to canonical path'],
	[files.uploadImg.includes('watch(() => props.modelValue'), 'image controlled state'],
	[files.uploadImg.includes("rawFile.type.substring(0, 5) !== 'image'"), 'image type guard'],
	[files.uploadImg.includes('props.limit === 1 ? [serverFile]'), 'single image replaces canonical value'],
	[files.uploadImg.includes('serverConfig.usingServerSize ? serverConfig.imageSize : props.uploadSize * 1024'), 'server image size priority'],
	[!files.uploadImg.includes('rawFile.size / 1024 / 1024 > props.uploadSize'), 'unconditional prop image size guard removed'],
	[files.theme.includes('--el-card-bg-color: var(--el-bg-color-overlay)'), 'dark card background'],
	[files.theme.includes('background-color: var(--el-bg-color-overlay, #ffffff)'), 'message background'],
];

for (const [passed, name] of checks) assert.ok(passed, name);
console.log('gfast-3.3.12 verifier: ' + checks.length + ' assertions passed');
