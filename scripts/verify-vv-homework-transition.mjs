import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse, compileTemplate } from '@vue/compiler-sfc';
import { baseParse } from '@vue/compiler-dom';

// Route pages participate in the shared out-in transition; fragment roots stall its leave hook.
for (const page of ['config', 'users', 'releases']) {
	const filename = new URL(`../src/views/vvHomework/${page}/index.vue`, import.meta.url);
	if (!fs.existsSync(filename)) continue;
	const { descriptor, errors } = parse(fs.readFileSync(filename, 'utf8'));
	assert.deepEqual(errors, []);
	const roots = baseParse(descriptor.template.content).children.filter(node => node.type !== 3 && !(node.type === 2 && !node.content.trim()));
	assert.equal(roots.length, 1, `${page}: route transition requires one root, found ${roots.length}`);
	assert.equal(roots[0].type, 1, `${page}: transition root must be an element or component`);
	const compiled = compileTemplate({ source: descriptor.template.content, filename: filename.pathname, id: `homework-${page}` });
	assert.deepEqual(compiled.errors, []);
	console.log(`${page}: single transition root verified`);
}
