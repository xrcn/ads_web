import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const phase = process.argv[2] || 'all';

const checks = {
  base: [
    ['src/components/mobileRecordList/index.vue', ['mobile-record-list__filter-toggle', '<slot name="desktop"', '<slot :row="row" :index="index"', 'mobile-record-card__actions']],
    ['src/main.ts', ["import MobileRecordList from '/@/components/mobileRecordList/index.vue'", "app.component('MobileRecordList', MobileRecordList)"]],
  ],
  shell: [
    ['src/views/login/index.vue', ['mobile-login-shell']],
    ['src/theme/media/login.scss', ['min-height: 100dvh', '.login-footer', '.login-icon-group-title']],
    ['src/views/wechat/visualConsole/index.vue', ['mobile-console-host']],
    ['public/wechat-visual-console/css/style.css', ['@media (max-width: 768px)', '.layout-body', 'flex-direction: column', '.side-menu', 'width: max-content']],
  ],
  group: [
    ['src/views/wechat/group/index.vue', ['<MobileRecordList', 'data-mobile-view="wechat-group"', 'mobile-record-card__details', 'member-mobile-cards']],
  ],
  business: [
    ['src/views/anchor/manage/component/anchorList.vue', ['data-mobile-view="anchor-list"']],
    ['src/views/wechat/message/index.vue', ['data-mobile-view="wechat-message"']],
    ['src/views/wechat/template/index.vue', ['data-mobile-view="wechat-template"']],
    ['src/views/wechat/account/index.vue', ['data-mobile-view="wechat-account"']],
    ['src/views/wechat/scheduleDuration/index.vue', ['data-mobile-view="schedule-duration"']],
    ['src/views/anchor/mic/component/micList.vue', ['data-mobile-view="anchor-mic"']],
  ],
  monitor: [
    ['src/views/wechat/monitor/index.vue', ['data-mobile-view="wechat-monitor-accounts"', 'data-mobile-view="wechat-monitor-events"']],
    ['src/views/wechat/robotConfig/index.vue', ['mobile-robot-config', 'mobile-record-card__fields', 'width: 100% !important']],
  ],
  system: [
    ['src/views/system/config/index.vue', ['data-mobile-view="system-config"']],
    ['src/views/system/menu/index.vue', ['data-mobile-view="system-menu"']],
    ['src/views/system/role/index.vue', ['data-mobile-view="system-role"']],
    ['src/views/system/dept/index.vue', ['data-mobile-view="system-dept"']],
    ['src/views/system/post/index.vue', ['data-mobile-view="system-post"']],
    ['src/views/system/monitor/loginLog/index.vue', ['data-mobile-view="login-log"']],
    ['src/views/system/monitor/operLog/index.vue', ['data-mobile-view="operation-log"']],
    ['src/views/system/monitor/userOnline/index.vue', ['data-mobile-view="online-user"']],
    ['src/views/system/tools/gen/index.vue', ['data-mobile-view="code-generator"']],
    ['src/views/system/sysJob/list/index.vue', ['data-mobile-view="system-job"']],
  ],
  twoColumn: [
    ['src/views/system/dict/index.vue', ['mobile-dict-layout']],
    ['src/views/system/dict/dataList.vue', ['data-mobile-view="system-dict"']],
    ['src/views/system/user/index.vue', ['mobile-user-layout']],
    ['src/views/system/user/component/userList.vue', ['data-mobile-view="system-user"']],
  ],
};

const phaseOrder = ['base', 'shell', 'group', 'business', 'monitor', 'system', 'twoColumn'];
const selected = phase === 'all' ? phaseOrder : [phase];

for (const name of selected) {
  assert.ok(checks[name], `unknown phase: ${name}`);
  for (const [relativePath, patterns] of checks[name]) {
    const file = resolve(root, relativePath);
    assert.ok(existsSync(file), `${relativePath} is missing`);
    const source = readFileSync(file, 'utf8');
    for (const pattern of patterns) {
      assert.ok(source.includes(pattern), `${relativePath} is missing: ${pattern}`);
    }
  }
}

console.log(`MOBILE_RESPONSIVE_VERIFY_PASS phase=${phase}`);
