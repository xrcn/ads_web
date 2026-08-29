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
    ['src/views/anchor/manage/component/anchorList.vue', ['data-mobile-view="anchor-list"', '<el-avatar class="anchor-mobile-avatar" :src="row.avatar?getUpFileUrl(row.avatar):\'\'">']],
    ['src/views/wechat/message/index.vue', ['data-mobile-view="wechat-message"']],
    ['src/views/wechat/template/index.vue', ['data-mobile-view="wechat-template"']],
    ['src/views/wechat/account/index.vue', ['data-mobile-view="wechat-account"']],
    ['src/views/wechat/scheduleDuration/index.vue', ['data-mobile-view="schedule-duration"']],
    ['src/views/anchor/mic/component/micList.vue', ['data-mobile-view="anchor-mic"']],
  ],
  monitor: [
    ['src/views/wechat/monitor/index.vue', ['data-mobile-view="wechat-monitor-accounts"', 'data-mobile-view="wechat-monitor-events"']],
    ['src/views/wechat/robotConfig/index.vue', ['mobile-robot-config', 'mobile-record-card__fields', 'class="config-tabs mobile-config-tabs-collapsed"', '.mobile-config-tabs-collapsed { min-height:0; }', 'width: 100% !important']],
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

if (selected.includes('business')) {
  const anchorSource = readFileSync(resolve(root, 'src/views/anchor/manage/component/anchorList.vue'), 'utf8');
  const anchorApiSource = readFileSync(resolve(root, 'src/api/anchor/index.ts'), 'utf8');
  const editAnchorSource = readFileSync(resolve(root, 'src/views/anchor/manage/component/editAnchor.vue'), 'utf8');
  const bankCardDialogSource = readFileSync(resolve(root, 'src/views/anchor/manage/component/bankCardDialog.vue'), 'utf8');
  const editBankCardSource = readFileSync(resolve(root, 'src/views/anchor/manage/component/editBankCard.vue'), 'utf8');
  const desktopSection = anchorSource.split('<template #desktop>')[1]?.split('</el-table></template>')[0] || '';
  const mobileSection = anchorSource.split('<template #default="{ row }">')[1]?.split('</template></MobileRecordList>')[0] || '';
  for (const label of ['label="微信昵称"', 'label="wxid"', 'label="手机号"']) {
    assert.ok(!desktopSection.includes(label), `anchor desktop should hide: ${label}`);
  }
  for (const pattern of ['anchor-mobile-avatar', 'row.nickname', 'item.anchorId', 'item.groupName']) {
    assert.ok(mobileSection.includes(pattern), `anchor mobile is missing: ${pattern}`);
  }
  for (const pattern of ['row.wechatNickname', 'row.memberWxid', 'row.profileCompleteness', 'row.bindingStatus', 'row.mobile', 'row.updatedAt', '<details']) {
    assert.ok(!mobileSection.includes(pattern), `anchor mobile should hide: ${pattern}`);
  }
  for (const pattern of ['deleteLegacyAnchor', "row.recordType==='PROFILE'?row.profileId:0", "row.recordType==='LEGACY_ANCHOR'?row.id:0", '@click="deleteRow(row)"']) {
    assert.ok((anchorSource + anchorApiSource).includes(pattern), `anchor ownership UI is missing: ${pattern}`);
  }
  assert.ok(anchorSource.includes("const hasBankCardOwner=(row:any)=>row.bindings?.some((binding:any)=>binding.anchorId&&binding.hallId);"), 'bank card entry must require both anchor id and hall');
  assert.equal(anchorSource.split('v-if="hasBankCardOwner(row)"').length - 1, 2, 'desktop and mobile must share the bank card visibility rule');
  assert.equal(anchorSource.split('@click="openBankCardDialog(row)"').length - 1, 2, 'desktop and mobile must share the bank card row handler');
  for (const pattern of ['class="profile-hall-field"', 'v-model="form.hallId"', "hallId:form.hallId||''", 'hallId:form.hallId||0']) {
    assert.ok(editAnchorSource.includes(pattern), `anchor profile hall editor is missing: ${pattern}`);
  }
  for (const pattern of ['profileId', 'anchorInfoId']) {
    assert.ok(bankCardDialogSource.includes(pattern) && editBankCardSource.includes(pattern), `bank card owner field is missing: ${pattern}`);
  }
  assert.ok(editBankCardSource.includes('Object.assign(form,res.data,owner)'), 'bank card edit must preserve the owner used to open the dialog');
}

console.log(`MOBILE_RESPONSIVE_VERIFY_PASS phase=${phase}`);
