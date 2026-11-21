<template>
 <el-card shadow="never" class="release-page">
  <template #header><div class="heading"><strong>自动作业版本</strong><el-button :loading="loading" @click="load">刷新版本</el-button></div></template>
  <el-alert title="上传后先校验。版本发布后，客户端按当前更新策略处理。" type="info" :closable="false" show-icon />
  <p v-if="error" role="alert" class="error">{{ error }}</p>
  <div v-if="loaded" class="summary"><el-tag :type="catalog.active ? 'success' : 'info'">{{ catalog.active ? `当前发布 build ${catalog.active}` : '暂无对外发布版本' }}</el-tag><span>最高已发布 build：{{ catalog.highest || '—' }}</span><a :href="publicBase + '/index.json'" target="_blank" rel="noopener noreferrer">查看公开签名索引</a></div>
  <section v-if="loaded" class="policy-panel">
   <div class="heading">
    <h3>客户端更新策略</h3>
    <el-button v-auth="'api/v1/system/vvHomework/release/policy'" :disabled="loading || changing || uploading" @click="openPolicy">更换更新方式</el-button>
   </div>
   <p>当前更新方式 <el-tag effect="plain">{{ currentModeLabel }}</el-tag></p>
   <p v-if="catalog.policyHistory?.length" class="hint">最近策略变更：{{ beijingTime(catalog.policyHistory[catalog.policyHistory.length - 1].at) }}，管理员 #{{ catalog.policyHistory[catalog.policyHistory.length - 1].actor }}</p>
  </section>
  <el-dialog v-model="policyDialogOpen" :title="editingBuild ? `编辑 build ${editingBuild} 的更新策略` : '编辑客户端更新策略'" width="min(560px, calc(100% - 32px))" append-to-body :close-on-click-modal="false" :close-on-press-escape="!changing" :show-close="!changing">
   <el-alert :title="policySupported ? '自动下载，手动重启：完成校验后，用户正常退出并再次打开时使用新版。空闲重启会等待作业和编辑完成。强制更新生效后，旧版停止新派发，已有回执仍可结算。' : '当前发布包未声明策略支持；请先以手动方式发布支持策略的兼容客户端。'" type="info" :closable="false" />
   <p v-if="policyError || error" role="alert" class="error">{{ policyError || error }}</p>
   <el-form class="policy-editor" label-position="top" :disabled="loading || changing || uploading" @submit.prevent>
    <el-form-item label="更新方式">
     <el-select v-model="policy.mode" aria-label="客户端更新方式" @change="policy.mode === 'mandatory' && policy.minimumBuild === 0 && (policy.minimumBuild = editingBuild)">
      <el-option :label="modeLabels.manual" value="manual" />
      <el-option :label="modeLabels.auto_download" value="auto_download" :disabled="!autoDownloadSupported" />
      <el-option :label="modeLabels.automatic" value="automatic" :disabled="!policySupported" />
      <el-option :label="modeLabels.mandatory" value="mandatory" :disabled="!policySupported" />
     </el-select>
     <span v-if="!autoDownloadSupported" class="hint">发布支持后台下载的客户端后，可选择「自动下载，手动重启」。</span>
    </el-form-item>
    <template v-if="policy.mode === 'mandatory'">
     <el-form-item label="最低允许作业 build"><el-input-number v-model="policy.minimumBuild" :min="1" :max="editingBuild" :precision="0" :controls="false" /></el-form-item>
     <el-form-item label="生效时间"><el-checkbox v-model="scheduled">定时生效（不选为立即生效）</el-checkbox><el-date-picker v-if="scheduled" v-model="policy.effectiveAt" type="datetime" value-format="x" placeholder="选择生效时间" /><span class="hint">界面按本机时区输入；保存后由服务端时间判定。</span></el-form-item>
    </template>
    <el-form-item :label="policy.mode === 'mandatory' ? '强制更新原因（必填，展示给用户）' : '策略说明'"><el-input v-model="policy.reason" type="textarea" :rows="2" maxlength="500" show-word-limit /></el-form-item>
   </el-form>
   <p class="hint">离线设备会在下次连接或申请许可时被拦截。撤回包不会解除最低版本门槛；降低或取消门槛需要明确确认。版本状态以最后一次上报为准。</p>
   <template #footer>
    <span class="hint policy-revision">策略修订 {{ policy.revision }}</span>
    <el-button :loading="loading" :disabled="changing" title="放弃未保存策略并重新加载" @click="reloadPolicy">重新加载策略</el-button>
    <el-button :disabled="changing" @click="policyDialogOpen = false">取消</el-button>
    <el-button v-auth="'api/v1/system/vvHomework/release/policy'" type="primary" :loading="changing" :disabled="loading || uploading" @click="savePolicy">保存更新策略</el-button>
   </template>
  </el-dialog>
  <el-form label-position="top" class="upload-form" :disabled="uploading || changing">
   <el-form-item label="完整程序 ZIP（最大 48 MiB，不包含账号数据）"><input ref="fileInput" type="file" accept=".zip,application/zip" :disabled="uploading || changing" aria-label="完整更新ZIP包" @change="choose" /></el-form-item>
   <el-form-item label="更新说明"><el-input v-model="notes" type="textarea" :rows="3" maxlength="3000" show-word-limit placeholder="说明本次修复或改进" /></el-form-item>
   <el-progress v-if="uploading" :percentage="progress" :status="progress === 100 ? 'success' : undefined" /><p v-if="uploading" class="hint">{{ progress === 100 ? '上传完成，服务端正在校验并签名，请等待结果。' : '正在上传完整包…' }}</p>
   <el-button v-auth="'api/v1/system/vvHomework/release/upload'" type="primary" :loading="uploading" :disabled="!file || !loaded || changing" @click="upload">上传并校验</el-button>
  </el-form>
  <el-table v-loading="loading" :data="pageEntries" row-key="sequence" empty-text="暂无版本，请上传完整程序ZIP">
   <el-table-column label="版本 / build" min-width="175"><template #default="{ row }"><strong>{{ row.version }}</strong><div>{{ row.sequence }}</div></template></el-table-column>
   <el-table-column label="状态" width="130"><template #default="{ row }"><el-tag :type="row.sequence === catalog.active ? 'success' : 'info'">{{ row.sequence === catalog.active ? '当前发布' : statusNames[row.status] }}</el-tag><div class="hint">{{ row.policyProtocol === 2 ? '支持后台下载' : row.policyProtocol === 1 ? '支持更新策略' : '仅手动更新' }}</div></template></el-table-column>
   <el-table-column label="更新方式" min-width="200">
    <template #default="{ row }">
     <div v-if="row.sequence === catalog.active && row.status === 'PUBLISHED'" class="row-policy">
      <span>{{ currentModeLabel }}</span>
      <el-button v-auth="'api/v1/system/vvHomework/release/policy'" type="primary" link :disabled="loading || changing || uploading" @click="openPolicy">更换</el-button>
     </div>
     <span v-else class="hint">—</span>
    </template>
   </el-table-column>
   <el-table-column prop="notes" label="更新说明" min-width="240" show-overflow-tooltip />
   <el-table-column label="大小" width="100"><template #default="{ row }">{{ (row.size / 1024 / 1024).toFixed(2) }} MiB</template></el-table-column>
   <el-table-column label="上传时间 / 人员" min-width="180"><template #default="{ row }">{{ beijingTime(row.uploadedAt) }}<div>管理员 #{{ row.uploadedBy }}</div></template></el-table-column>
   <el-table-column label="包 SHA256" min-width="150" show-overflow-tooltip prop="sha256" />
   <el-table-column label="操作" width="160" fixed="right"><template #default="{ row }"><el-button v-if="row.status === 'READY' && row.sequence > catalog.highest" v-auth="'api/v1/system/vvHomework/release/publish'" type="primary" link :disabled="changing || uploading" @click="change('publish', row)">发布</el-button><el-button v-if="row.status === 'PUBLISHED'" v-auth="'api/v1/system/vvHomework/release/withdraw'" type="danger" link :disabled="changing || uploading" @click="change('withdraw', row)">撤回</el-button></template></el-table-column>
  </el-table>
  <el-pagination v-if="catalog.entries.length" v-model:current-page="page" v-model:page-size="pageSize" :page-sizes="[10, 20, 50]" :total="catalog.entries.length" layout="total, sizes, prev, pager, next" class="release-pagination" @size-change="page = 1" />
  <p class="hint">撤回当前版本会停止提供更新索引，已升级的软件不会自动降级。旧包保留，重复或倒序 build 不可发布。</p>
 </el-card>
</template>
<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getReleases, uploadRelease, changeRelease, saveReleasePolicy, type ReleaseCatalog, type ReleaseEntry, type UpdatePolicy } from '/@/api/vvHomework/releases';
import { beijingTime, homeworkError } from '/@/api/vvHomework';
defineOptions({ name: 'vvHomeworkReleases' });
const catalog = ref<ReleaseCatalog>({ active: 0, highest: 0, entries: [] });
const page = ref(1);
const pageSize = ref(10);
const pageEntries = computed(() => {
 const start = (page.value - 1) * pageSize.value;
 return catalog.value.entries.slice(start, start + pageSize.value);
});
watch(() => catalog.value.entries.length, total => {
 page.value = Math.min(page.value, Math.max(1, Math.ceil(total / pageSize.value)));
});
const modeLabels: Record<UpdatePolicy['mode'], string> = {
 manual: '手动更新',
 auto_download: '自动下载，手动重启',
 automatic: '自动下载，空闲重启',
 mandatory: '强制更新',
};
const currentModeLabel = computed(() => modeLabels[catalog.value.policy?.mode || 'manual']);
const policy = reactive({ mode: 'manual' as UpdatePolicy['mode'], minimumBuild: 0, effectiveAt: 0 as number | string, reason: '', revision: 0 });
const editingBuild = ref(0);
const policyDialogOpen = ref(false);
const policyError = ref('');
const scheduled = ref(false);
const activePolicyProtocol = computed(() => catalog.value.entries.find(row => row.sequence === catalog.value.active && row.status === 'PUBLISHED')?.policyProtocol);
const policySupported = computed(() => activePolicyProtocol.value === 1 || activePolicyProtocol.value === 2);
const autoDownloadSupported = computed(() => activePolicyProtocol.value === 2);
function applyPolicy() {
 Object.assign(policy, catalog.value.policy || { mode: 'manual', minimumBuild: 0, effectiveAt: 0, reason: '' });
 policy.revision = catalog.value.policyRevision || 0;
 editingBuild.value = catalog.value.active;
 scheduled.value = Number(policy.effectiveAt) > 0;
 policyError.value = '';
}
function openPolicy() {
 applyPolicy();
 policyDialogOpen.value = true;
}
async function reloadPolicy() {
 policyError.value = '';
 if (await load()) applyPolicy();
}
async function savePolicy() {
 const input = { mode: policy.mode, minimumBuild: policy.mode === 'mandatory' ? policy.minimumBuild : 0, effectiveAt: policy.mode === 'mandatory' && scheduled.value ? Number(policy.effectiveAt) : 0, reason: policy.reason.trim(), revision: policy.revision, confirmRelaxation: false };
 if (input.mode === 'mandatory' && (!Number.isSafeInteger(input.minimumBuild) || input.minimumBuild < 1 || input.minimumBuild > editingBuild.value || !input.reason || !Number.isSafeInteger(input.effectiveAt) || scheduled.value && !input.effectiveAt)) { policyError.value = '请填写合法的最低build、生效时间和更新原因。'; return; }
 const relax = input.minimumBuild < (catalog.value.policy?.minimumBuild || 0);
 if (relax || input.mode === 'mandatory') { try { await ElMessageBox.confirm(relax ? '这会降低或取消最低版本限制，旧版可能重新获得作业许可。确认修改？' : `最低允许作业 build 为 ${input.minimumBuild}，${input.effectiveAt ? beijingTime(new Date(input.effectiveAt).toISOString()) + '（北京）生效' : '立即生效'}。低版本的新派发会被拒绝，已有回执仍可结算。确认启用？`, '确认更新策略', { type: 'warning', confirmButtonText: '确认策略', cancelButtonText: '取消' }); } catch { return; } input.confirmRelaxation = relax; }
 changing.value = true;
 policyError.value = '';
 try {
  await saveReleasePolicy(input, lifetime.signal);
  if (!lifetime.signal.aborted) {
   policyDialogOpen.value = false;
   ElMessage.success('更新策略已保存，联网客户端将在轮询后处理');
   await load();
  }
 } catch (e) {
  if (!lifetime.signal.aborted) policyError.value = homeworkError(e);
 } finally {
  changing.value = false;
 }
}
const publicBase = ref(''), maxSize = ref(48 * 1024 * 1024), notes = ref(''), error = ref(''), progress = ref(0);
const loading = ref(false), loaded = ref(false), uploading = ref(false), changing = ref(false), file = ref<File>(), fileInput = ref<HTMLInputElement>();
const statusNames: Record<string, string> = { READY: '已校验', PUBLISHED: '历史发布', WITHDRAWN: '已撤回' };
const lifetime = new AbortController(); let generation = 0, loader: AbortController | undefined;
async function load() {
 const own = ++generation;
 loader?.abort();
 loader = new AbortController();
 loading.value = true;
 error.value = '';
 try {
  const r = await getReleases(loader.signal);
  if (own !== generation || lifetime.signal.aborted) return false;
  catalog.value = r.data.catalog;
  publicBase.value = r.data.publicBase;
  maxSize.value = r.data.maxUploadBytes;
  loaded.value = true;
  return true;
 } catch (e) {
  if (own === generation && !lifetime.signal.aborted) error.value = homeworkError(e);
  return false;
 } finally {
  if (own === generation) loading.value = false;
 }
}
function choose(event: Event) { file.value = (event.target as HTMLInputElement).files?.[0]; if (file.value && (!file.value.name.toLowerCase().endsWith('.zip') || file.value.size > maxSize.value)) { error.value = '请选择不超过48 MiB的完整ZIP包。'; file.value = undefined; if (fileInput.value) fileInput.value.value = ''; } }
async function upload() { if (!file.value || uploading.value) return; uploading.value = true; progress.value = 0; error.value = ''; try { await uploadRelease(file.value, notes.value, lifetime.signal, (n, total) => { progress.value = Math.min(100, Math.floor(n * 100 / total)); }); if (!lifetime.signal.aborted) { ElMessage.success('已校验并签名，点击发布后生效'); file.value = undefined; if (fileInput.value) fileInput.value.value = ''; notes.value = ''; await load(); } } catch (e) { if (!lifetime.signal.aborted) error.value = homeworkError(e); } finally { uploading.value = false; } }
async function change(action: 'publish' | 'withdraw', row: ReleaseEntry) { try { await ElMessageBox.confirm(action === 'publish' ? `发布 build ${row.sequence}？客户端将能检查并下载此版本，并按当前更新策略处理重启。` : `撤回 build ${row.sequence}？若是当前版本，将停止提供更新索引；不会自动降级或解除已有强制门槛。`, action === 'publish' ? '确认发布版本' : '确认撤回版本', { type: 'warning', confirmButtonText: action === 'publish' ? '发布' : '撤回', cancelButtonText: '取消' }); } catch { return; } changing.value = true; error.value = ''; try { await changeRelease(action, row.sequence, lifetime.signal); if (!lifetime.signal.aborted) { ElMessage.success(action === 'publish' ? '版本已发布' : '版本已撤回'); await load(); } } catch (e) { if (!lifetime.signal.aborted) error.value = homeworkError(e); } finally { changing.value = false; } }
onMounted(load); onBeforeUnmount(() => { ++generation; loader?.abort(); lifetime.abort(); });
</script>
<style scoped>
.policy-panel{max-width:900px;margin:20px 0;padding:18px;border:1px solid var(--el-border-color);border-radius:8px}.policy-editor{margin-top:16px}.heading,.summary{display:flex;align-items:center;gap:20px}.heading{justify-content:space-between}.summary{margin:20px 0;flex-wrap:wrap}.upload-form{max-width:760px;margin:24px 0}.hint{color:var(--el-text-color-secondary);font-size:13px}.error{color:var(--el-color-danger)}
.policy-revision{margin-right:12px}
.row-policy{display:flex;align-items:center;gap:8px}
.release-pagination{justify-content:flex-end;flex-wrap:wrap;margin-top:16px}
</style>
