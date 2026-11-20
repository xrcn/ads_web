<template>
 <div class="system-user-container layout-padding">
  <el-card shadow="hover" class="layout-padding-auto">
   <h2>授权码管理</h2>
   <el-alert v-if="error" :title="error" type="error" show-icon @close="error = ''" />
   <el-form inline label-position="top" @submit.prevent>
    <el-form-item label="种类">
     <el-select v-model="form.kind" style="width:160px" :disabled="busy">
      <el-option label="A 类 · 30 天" value="A" /><el-option label="B 类 · 60 天" value="B" />
      <el-option :label="customDays ? 'C 类 · ' + customDays + ' 天' : 'C 类 · 待配置'" value="C" />
     </el-select>
    </el-form-item>
    <el-form-item label="生成数量"><el-input-number v-model="form.count" :min="1" :max="500" :precision="0" :disabled="busy" /></el-form-item>
    <el-form-item label="兑换截止（北京时间）"><el-date-picker v-model="form.deadline" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" placeholder="可选" :disabled="busy" /></el-form-item>
    <el-form-item label="生成授权码"><el-button v-auth="'api/v1/system/vvHomework/codes/generate'" type="primary" :loading="busy" @click="generate">生成</el-button></el-form-item>
    <el-form-item label="C 类天数">
     <el-input-number v-model="customDaysInput" :min="1" :max="36500" :precision="0" />
     <el-button v-auth="'api/v1/system/vvHomework/codes/config'" :loading="busy" @click="saveDays">保存</el-button>
    </el-form-item>
   </el-form>
   <el-divider />
   <el-form inline @submit.prevent="search">
    <el-form-item label="批次"><el-input v-model="query.batchId" clearable inputmode="numeric" style="width:125px" /></el-form-item>
    <el-form-item label="种类"><el-select v-model="query.kind" clearable style="width:100px"><el-option v-for="kind in ['A','B','C']" :key="kind" :label="kind+' 类'" :value="kind" /></el-select></el-form-item>
    <el-form-item label="状态"><el-select v-model="query.status" clearable style="width:120px"><el-option v-for="(name, key) in statuses" :key="key" :label="name" :value="key" /></el-select></el-form-item>
    <el-form-item label="发放状态">
     <el-select v-model="query.dispatch" clearable style="width:125px">
      <el-option v-for="(name, key) in dispatchStatuses" :key="key" :label="name" :value="key" />
     </el-select>
    </el-form-item>
    <el-form-item label="使用人 ID"><el-input v-model="query.userId" placeholder="VV 号或软件用户 ID" clearable inputmode="numeric" maxlength="20" style="width:175px" /></el-form-item>
    <el-form-item label="授权码"><el-input v-model="query.code" placeholder="输入完整授权码" clearable maxlength="43" autocomplete="off" style="width:195px" /></el-form-item>
    <el-button native-type="submit">查询</el-button>
    <el-button :type="query.status === 'UNUSED' && query.dispatch === 'SENT' ? 'primary' : 'default'" plain @click="showIssuedUnused">已发未兑换</el-button>
   </el-form>
   <div class="code-actions">
    <el-button type="primary" :disabled="busy || loading || !selected.length" @click="copySelected">复制选中（{{ selected.length }}）</el-button>
    <el-button v-if="canDispatch" :disabled="busy || loading || !issuableSelection.length" @click="markIssued">标记已发（{{ issuableSelection.length }}）</el-button>
   </div>
   <el-table ref="codeTable" v-loading="loading" :data="rows" row-key="id" @selection-change="selected = $event">
    <el-table-column type="selection" width="46" :selectable="canSelectCode" />
    <el-table-column prop="batchId" label="批次" width="75" />
    <el-table-column label="授权码" min-width="220"><template #default="{ row }"><span class="code-text">{{ row.code || '…' + row.tail }}</span></template></el-table-column>
    <el-table-column label="种类 / 时长" width="110"><template #default="{ row }">{{ row.kind }} 类 / {{ row.days }} 天</template></el-table-column>
    <el-table-column label="状态" width="90"><template #default="{ row }">{{ statuses[row.status] }}</template></el-table-column>
    <el-table-column label="发放状态" min-width="165">
     <template #default="{ row }">
      <el-tag size="small" :type="row.issuedAt ? 'success' : row.copiedAt ? 'warning' : 'info'">{{ row.issuedAt ? '已发' : row.copiedAt ? '已复制' : '未记录' }}</el-tag>
      <div v-if="row.issuedAt || row.copiedAt" class="dispatch-detail">{{ beijingTime(row.issuedAt || row.copiedAt || null) }}</div>
      <div v-if="row.issuedBy" class="dispatch-detail">操作人 ID {{ row.issuedBy }}</div>
      <div v-if="row.issueNote" class="dispatch-detail">{{ row.issueNote }}</div>
     </template>
    </el-table-column>
    <el-table-column label="生成时间" min-width="155"><template #default="{ row }">{{ beijingTime(row.createdAt) }}</template></el-table-column>
    <el-table-column label="兑换截止" min-width="155"><template #default="{ row }">{{ beijingTime(row.deadline) }}</template></el-table-column>
    <el-table-column label="使用人" min-width="140">
     <template #default="{ row }">
      <template v-if="row.userDeleted">用户已删除</template>
      <template v-else-if="row.account">
       <div v-if="row.nickname">{{ row.nickname }}</div>
       <div :class="{ 'dispatch-detail': row.nickname }">{{ row.account }}</div>
      </template>
      <template v-else>—</template>
     </template>
    </el-table-column>
    <el-table-column label="使用时间" min-width="155"><template #default="{ row }">{{ beijingTime(row.usedAt) }}</template></el-table-column>
    <el-table-column label="兑换后到期" min-width="155"><template #default="{ row }">{{ beijingTime(row.expiresAt) }}</template></el-table-column>
    <el-table-column label="操作" width="175" fixed="right"><template #default="{ row }">
     <el-button v-auth="'api/v1/system/vvHomework/codes/copy'" text :disabled="busy" @click="recover(row.batchId)">查看批次</el-button>
     <el-button v-if="row.status === 'UNUSED'" v-auth="'api/v1/system/vvHomework/codes/revoke'" text type="danger" :disabled="busy" @click="revoke(row)">撤销</el-button>
    </template></el-table-column>
   </el-table>
   <el-pagination v-model:current-page="query.pageNum" :page-size="20" :total="total" layout="total, prev, pager, next" @current-change="load()" />
  </el-card>
  <el-dialog :model-value="batch !== null" :title="'批次 ' + (batch?.id ?? '')" width="640px" @close="batch = null">
   <el-input v-if="batch?.codes.length" type="textarea" :rows="10" :model-value="batch.codes.join('\n')" readonly />
   <el-empty v-else description="本批次暂无可复制的授权码" />
   <template #footer><el-button v-if="batch?.codes.length" type="primary" :disabled="busy" @click="copyAll">复制全部</el-button></template>
  </el-dialog>
  <el-dialog :model-value="manualCopy !== ''" title="手动复制授权码" width="640px" @close="manualCopy = ''">
   <el-input type="textarea" :rows="10" :model-value="manualCopy" readonly />
   <template #footer><el-button v-if="canDispatch && manualCopyIDs.length" :loading="busy" @click="confirmManualCopy">确认已复制</el-button></template>
  </el-dialog>
 </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { beijingTime, homeworkError } from '/@/api/vvHomework';
import { copyCodeBatch, generateCodes, listCodes, loadCodeConfig, recordCodeDispatch, revokeCode, saveCodeConfig, type CodeBatch, type CodeRecord } from '/@/api/vvHomework/codes';
import { auth } from '/@/utils/authFunction';

const statuses: Record<string,string> = { UNUSED:'未使用', USED:'已使用', REVOKED:'已撤销', EXPIRED:'已过期' };
const dispatchStatuses = { UNRECORDED: '未记录', COPIED: '已复制', SENT: '已发' };
const canDispatch = auth('api/v1/system/vvHomework/codes/dispatch');
const lifetime = new AbortController();
let listRequest: AbortController | undefined;
const error = ref('');
const busy = ref(false);
const loading = ref(false);
const form = reactive({kind:'A',count:1,deadline:''});
const query = reactive({kind:'',status:'',batchId:'',dispatch:'',userId:'',code:'',pageNum:1});
const rows = ref<CodeRecord[]>([]);
const selected = ref<CodeRecord[]>([]);
const codeTable = ref<{clearSelection(): void; toggleRowSelection(row: CodeRecord, selected: boolean): void}>();
const issuableSelection = computed(() => selected.value.filter(row => row.status === 'UNUSED' && !row.issuedAt));
const manualCopy = ref('');
const manualCopyIDs = ref<number[]>([]);
const total = ref(0);
const batch = ref<CodeBatch | null>(null);
const customDays = ref(0);
const customDaysInput = ref<number>();
let pending: { key: string; id: string } | undefined;

async function load(preserveSelection = false) {
 listRequest?.abort();
 const keep = new Set(preserveSelection ? selected.value.map(row => row.id) : []);
 codeTable.value?.clearSelection();
 selected.value = [];
 const request = new AbortController();
 listRequest = request;
 loading.value = true;
 try {
  const {code, ...params} = {...query};
  const codeDigest = await digestSearchCode(code);
  if (request.signal.aborted) return;
  const result = await listCodes({...params,codeDigest},request.signal);
  if (!request.signal.aborted) {
   rows.value = result.data.list;
   total.value = result.data.total;
   if (keep.size) {
    await nextTick();
    if (!request.signal.aborted) rows.value.filter(row => keep.has(row.id)).forEach(row => codeTable.value?.toggleRowSelection(row,true));
   }
  }
 } catch (problem) {
  if (!request.signal.aborted) error.value = problem instanceof TypeError ? '请输入完整授权码，并使用 HTTPS 页面查询' : homeworkError(problem);
 } finally {
  if (!request.signal.aborted) loading.value = false;
 }
}
async function digestSearchCode(value: string) {
 const text = value.trim();
 if (!text) return undefined;
 const code = /^[a-zA-Z0-9]{16}$/.test(text) ? text.toUpperCase() : text;
 if (!crypto.subtle || !(/^[A-Z0-9]{16}$/.test(code) || /^[a-zA-Z0-9_-]{43}$/.test(code))) throw new TypeError('Invalid code search');
 const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
 return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2,'0')).join('');
}
function search() { query.pageNum = 1; void load(); }
function showIssuedUnused() { query.status = 'UNUSED'; query.dispatch = 'SENT'; search(); }
async function action(fn: () => Promise<void>) {
 if (busy.value) return;
 busy.value = true;
 error.value = '';
 try { await fn(); }
 catch (problem) { if (!lifetime.signal.aborted) error.value = homeworkError(problem); }
 finally { busy.value = false; }
}
async function generate() {
 const count = form.count;
 if (!Number.isInteger(count) || count < 1 || count > 500) { error.value = '生成数量须为 1–500 的整数'; return; }
 const deadline = form.deadline ? new Date(form.deadline.replace(' ','T') + '+08:00').toISOString() : null;
 const params = {kind:form.kind,count,deadline};
 const key = JSON.stringify(params);
 if (pending?.key !== key) pending = {key,id:Array.from(crypto.getRandomValues(new Uint8Array(16)), n => n.toString(16).padStart(2,'0')).join('')};
 const requestId = pending.id;
 await action(async () => {
  batch.value = (await generateCodes({...params,requestId},lifetime.signal)).data;
  pending = undefined;
  search();
 });
}
async function recover(id: number) {
 await action(async () => { batch.value = (await copyCodeBatch(id,lifetime.signal)).data; });
}
async function saveDays() {
 const days = customDaysInput.value;
 if (days === undefined || !Number.isInteger(days)) { error.value = '请填写 C 类天数'; return; }
 await action(async () => { await saveCodeConfig(days,lifetime.signal); customDays.value = days; });
}
async function revoke(row: CodeRecord) {
 try { await ElMessageBox.confirm('确认撤销尾号 ' + row.tail + ' 的授权码？','撤销授权码',{type:'warning'}); }
 catch { return; }
 await action(async () => { await revokeCode(row.id,lifetime.signal); await load(); });
}
async function copyAll() {
 const current = batch.value;
 if (current?.codes.length) await copyCodes(current.codes, current.codeIds ?? []);
}
function canSelectCode(row: CodeRecord) { return !!row.code; }
async function copySelected() {
 if (loading.value || busy.value) return;
 const selection = selected.value.filter(row => row.code);
 await copyCodes(selection.map(row => row.code!), selection.map(row => row.id));
}
async function copyCodes(codes: string[], ids: number[]) {
 if (!codes.length) return;
 const text = codes.join('\n');
 try {
  await navigator.clipboard.writeText(text);
 } catch {
  if (!lifetime.signal.aborted) {
   manualCopyIDs.value = ids.length === codes.length ? ids : [];
   manualCopy.value = text;
  }
  return;
 }
 if (lifetime.signal.aborted) return;
 if (!canDispatch || ids.length !== codes.length) {
  ElMessage.warning('已复制到剪贴板，当前无法记录复制状态');
  return;
 }
 try {
  await recordCodeDispatch(ids,'COPIED',lifetime.signal);
  if (!lifetime.signal.aborted) {
   ElMessage.success('已复制 ' + codes.length + ' 枚授权码');
   await load(true);
  }
 } catch {
  if (!lifetime.signal.aborted) ElMessage.warning('已复制到剪贴板，复制状态保存失败');
 }
}
async function confirmManualCopy() {
 const ids = [...manualCopyIDs.value];
 if (!manualCopy.value || !ids.length) return;
 await action(async () => {
  await recordCodeDispatch(ids,'COPIED',lifetime.signal);
  if (!lifetime.signal.aborted) {
   manualCopy.value = '';
   ElMessage.success('已记录复制状态');
   await load(true);
  }
 });
}
async function markIssued() {
 const ids = issuableSelection.value.map(row => row.id);
 if (!ids.length || busy.value || loading.value) return;
 let note = '';
 try {
  const result = await ElMessageBox.prompt('确认这 ' + ids.length + ' 枚授权码已实际发出。', '标记已发', {
   inputPlaceholder: '接收人备注（可选）',
   inputValidator: (value: string) => Array.from((value ?? '').trim()).length <= 120 || '备注最多 120 字',
   confirmButtonText: '标记已发',
  });
  note = (result.value ?? '').trim();
 } catch { return; }
 await action(async () => {
  await recordCodeDispatch(ids,'SENT',lifetime.signal,note);
  if (!lifetime.signal.aborted) { ElMessage.success('已标记发放'); await load(); }
 });
}
onMounted(async () => {
 void load();
 try {
  customDays.value = (await loadCodeConfig(lifetime.signal)).data.days;
  customDaysInput.value = customDays.value || undefined;
 } catch (problem) { if (!lifetime.signal.aborted) error.value = homeworkError(problem); }
});
onUnmounted(() => { lifetime.abort(); listRequest?.abort(); batch.value = null; });
</script>

<style scoped>
.el-pagination{margin-top:16px}
.code-text{font-family:monospace;overflow-wrap:anywhere}
.code-actions{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
.code-actions .el-button+.el-button{margin-left:0}
.dispatch-detail{margin-top:3px;font-size:12px;color:var(--el-text-color-secondary);overflow-wrap:anywhere}
</style>
