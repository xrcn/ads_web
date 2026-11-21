<template>
 <el-card shadow="never" class="release-page">
  <template #header><div class="heading"><strong>自动作业版本</strong><el-button :loading="loading" @click="load">刷新版本</el-button></div></template>
  <el-alert title="上传后先校验；发布后按下方更新策略处理。自动与强制更新均先等待当前回执和记录保存，再重启。" type="info" :closable="false" show-icon />
  <p v-if="error" role="alert" class="error">{{ error }}</p>
  <div v-if="loaded" class="summary"><el-tag :type="catalog.active ? 'success' : 'info'">{{ catalog.active ? `当前发布 build ${catalog.active}` : '暂无对外发布版本' }}</el-tag><span>最高已发布 build：{{ catalog.highest || '—' }}</span><a :href="publicBase + '/index.json'" target="_blank" rel="noopener noreferrer">查看公开签名索引</a></div>
  <section v-if="loaded" class="policy-panel">
   <h3>客户端更新策略</h3>
   <el-alert :title="policySupported ? '自动更新：下载后在作业结束且无未保存编辑时重启。强制更新：生效后旧版禁止新派发，已有回执仍可结算。' : '当前发布包未声明策略支持；请先以手动方式发布支持策略的兼容客户端。'" type="info" :closable="false" />
   <el-form label-position="top" :disabled="changing || uploading" @input="policyDirty = true" @change="policyDirty = true">
    <el-form-item label="更新方式"><el-select v-model="policy.mode" aria-label="客户端更新方式" @change="policy.mode === 'mandatory' && policy.minimumBuild === 0 && (policy.minimumBuild = catalog.active)"><el-option label="手动更新" value="manual" /><el-option label="自动下载，空闲重启" value="automatic" :disabled="!policySupported" /><el-option label="强制更新" value="mandatory" :disabled="!policySupported" /></el-select></el-form-item>
    <template v-if="policy.mode === 'mandatory'">
     <el-form-item label="最低允许作业 build"><el-input-number v-model="policy.minimumBuild" :min="1" :max="catalog.active" :precision="0" :controls="false" /></el-form-item>
     <el-form-item label="生效时间"><el-checkbox v-model="scheduled">定时生效（不选为立即生效）</el-checkbox><el-date-picker v-if="scheduled" v-model="policy.effectiveAt" type="datetime" value-format="x" placeholder="选择生效时间" /><span class="hint">界面按本机时区输入；保存后由服务端时间判定。</span></el-form-item>
    </template>
    <el-form-item :label="policy.mode === 'mandatory' ? '强制更新原因（必填，展示给用户）' : '策略说明'"><el-input v-model="policy.reason" type="textarea" :rows="2" maxlength="500" show-word-limit /></el-form-item>
    <el-button v-auth="'api/v1/system/vvHomework/release/policy'" type="primary" :loading="changing" @click="savePolicy">保存更新策略</el-button><el-button :disabled="changing" title="放弃未保存策略并重新加载" @click="reloadPolicy">重新加载策略</el-button><span class="hint">策略修订 {{ policy.revision }}</span>
   </el-form>
   <p class="hint">离线设备会在下次连接或申请许可时被拦截。撤回包不会解除最低版本门槛；降低或取消门槛需要明确确认。版本状态以最后一次上报为准。</p>
   <p v-if="catalog.policyHistory?.length" class="hint">最近策略变更：{{ beijingTime(catalog.policyHistory[catalog.policyHistory.length - 1].at) }}，管理员 #{{ catalog.policyHistory[catalog.policyHistory.length - 1].actor }}</p>
  </section>
  <el-form label-position="top" class="upload-form" :disabled="uploading || changing">
   <el-form-item label="完整程序 ZIP（最大 48 MiB，不包含账号数据）"><input ref="fileInput" type="file" accept=".zip,application/zip" :disabled="uploading || changing" aria-label="完整更新ZIP包" @change="choose" /></el-form-item>
   <el-form-item label="更新说明"><el-input v-model="notes" type="textarea" :rows="3" maxlength="3000" show-word-limit placeholder="说明本次修复或改进" /></el-form-item>
   <el-progress v-if="uploading" :percentage="progress" :status="progress === 100 ? 'success' : undefined" /><p v-if="uploading" class="hint">{{ progress === 100 ? '上传完成，服务端正在校验并签名，请等待结果。' : '正在上传完整包…' }}</p>
   <el-button v-auth="'api/v1/system/vvHomework/release/upload'" type="primary" :loading="uploading" :disabled="!file || !loaded || changing" @click="upload">上传并校验</el-button>
  </el-form>
  <el-table v-loading="loading" :data="catalog.entries" row-key="sequence" empty-text="暂无版本，请上传完整程序ZIP">
   <el-table-column label="版本 / build" min-width="175"><template #default="{ row }"><strong>{{ row.version }}</strong><div>{{ row.sequence }}</div></template></el-table-column>
   <el-table-column label="状态" width="130"><template #default="{ row }"><el-tag :type="row.sequence === catalog.active ? 'success' : 'info'">{{ row.sequence === catalog.active ? '当前发布' : statusNames[row.status] }}</el-tag><div class="hint">{{ row.policyProtocol === 1 ? '支持更新策略' : '仅手动更新' }}</div></template></el-table-column>
   <el-table-column prop="notes" label="更新说明" min-width="240" show-overflow-tooltip />
   <el-table-column label="大小" width="100"><template #default="{ row }">{{ (row.size / 1024 / 1024).toFixed(2) }} MiB</template></el-table-column>
   <el-table-column label="上传时间 / 人员" min-width="180"><template #default="{ row }">{{ beijingTime(row.uploadedAt) }}<div>管理员 #{{ row.uploadedBy }}</div></template></el-table-column>
   <el-table-column label="包 SHA256" min-width="150" show-overflow-tooltip prop="sha256" />
   <el-table-column label="操作" width="160" fixed="right"><template #default="{ row }"><el-button v-if="row.status === 'READY' && row.sequence > catalog.highest" v-auth="'api/v1/system/vvHomework/release/publish'" type="primary" link :disabled="changing || uploading" @click="change('publish', row)">发布</el-button><el-button v-if="row.status === 'PUBLISHED'" v-auth="'api/v1/system/vvHomework/release/withdraw'" type="danger" link :disabled="changing || uploading" @click="change('withdraw', row)">撤回</el-button></template></el-table-column>
  </el-table>
  <p class="hint">撤回当前版本会停止提供更新索引，已升级的软件不会自动降级。旧包保留，重复或倒序 build 不可发布。</p>
 </el-card>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getReleases, uploadRelease, changeRelease, saveReleasePolicy, type ReleaseCatalog, type ReleaseEntry, type UpdatePolicy } from '/@/api/vvHomework/releases';
import { beijingTime, homeworkError } from '/@/api/vvHomework';
defineOptions({ name: 'vvHomeworkReleases' });
const catalog = ref<ReleaseCatalog>({ active: 0, highest: 0, entries: [] });
const policy = reactive({ mode: 'manual' as UpdatePolicy['mode'], minimumBuild: 0, effectiveAt: 0 as number | string, reason: '', revision: 0 });
const scheduled = ref(false), policyDirty = ref(false);
const policySupported = computed(() => catalog.value.entries.some(row => row.sequence === catalog.value.active && row.policyProtocol === 1));
function applyPolicy() { Object.assign(policy, catalog.value.policy || { mode: 'manual', minimumBuild: 0, effectiveAt: 0, reason: '' }); policy.revision = catalog.value.policyRevision || 0; scheduled.value = Number(policy.effectiveAt) > 0; }
async function reloadPolicy() { policyDirty.value = false; await load(); }
async function savePolicy() {
 const input = { mode: policy.mode, minimumBuild: policy.mode === 'mandatory' ? policy.minimumBuild : 0, effectiveAt: policy.mode === 'mandatory' && scheduled.value ? Number(policy.effectiveAt) : 0, reason: policy.reason.trim(), revision: policy.revision, confirmRelaxation: false };
 if (input.mode === 'mandatory' && (!Number.isSafeInteger(input.minimumBuild) || input.minimumBuild < 1 || input.minimumBuild > catalog.value.active || !input.reason || !Number.isSafeInteger(input.effectiveAt) || scheduled.value && !input.effectiveAt)) { error.value = '请填写合法的最低build、生效时间和更新原因。'; return; }
 const relax = input.minimumBuild < (catalog.value.policy?.minimumBuild || 0);
 if (relax || input.mode === 'mandatory') { try { await ElMessageBox.confirm(relax ? '这会降低或取消最低版本限制，旧版可能重新获得作业许可。确认修改？' : `最低允许作业 build 为 ${input.minimumBuild}，${input.effectiveAt ? beijingTime(new Date(input.effectiveAt).toISOString()) + '（北京）生效' : '立即生效'}。低版本的新派发会被拒绝，已有回执仍可结算。确认启用？`, '确认更新策略', { type: 'warning', confirmButtonText: '确认策略', cancelButtonText: '取消' }); } catch { return; } input.confirmRelaxation = relax; }
 changing.value = true; error.value = ''; try { await saveReleasePolicy(input, lifetime.signal); if (!lifetime.signal.aborted) { policyDirty.value = false; ElMessage.success('更新策略已保存，联网客户端将在轮询后处理'); await load(); } } catch (e) { if (!lifetime.signal.aborted) error.value = homeworkError(e); } finally { changing.value = false; }
}
const publicBase = ref(''), maxSize = ref(48 * 1024 * 1024), notes = ref(''), error = ref(''), progress = ref(0);
const loading = ref(false), loaded = ref(false), uploading = ref(false), changing = ref(false), file = ref<File>(), fileInput = ref<HTMLInputElement>();
const statusNames: Record<string, string> = { READY: '已校验', PUBLISHED: '历史发布', WITHDRAWN: '已撤回' };
const lifetime = new AbortController(); let generation = 0, loader: AbortController | undefined;
async function load() { const own = ++generation; loader?.abort(); loader = new AbortController(); loading.value = true; error.value = ''; try { const r = await getReleases(loader.signal); if (own !== generation || lifetime.signal.aborted) return; catalog.value = r.data.catalog; if (!policyDirty.value) applyPolicy(); publicBase.value = r.data.publicBase; maxSize.value = r.data.maxUploadBytes; loaded.value = true; } catch (e) { if (own === generation && !lifetime.signal.aborted) error.value = homeworkError(e); } finally { if (own === generation) loading.value = false; } }
function choose(event: Event) { file.value = (event.target as HTMLInputElement).files?.[0]; if (file.value && (!file.value.name.toLowerCase().endsWith('.zip') || file.value.size > maxSize.value)) { error.value = '请选择不超过48 MiB的完整ZIP包。'; file.value = undefined; if (fileInput.value) fileInput.value.value = ''; } }
async function upload() { if (!file.value || uploading.value) return; uploading.value = true; progress.value = 0; error.value = ''; try { await uploadRelease(file.value, notes.value, lifetime.signal, (n, total) => { progress.value = Math.min(100, Math.floor(n * 100 / total)); }); if (!lifetime.signal.aborted) { ElMessage.success('已校验并签名，点击发布后生效'); file.value = undefined; if (fileInput.value) fileInput.value.value = ''; notes.value = ''; await load(); } } catch (e) { if (!lifetime.signal.aborted) error.value = homeworkError(e); } finally { uploading.value = false; } }
async function change(action: 'publish' | 'withdraw', row: ReleaseEntry) { try { await ElMessageBox.confirm(action === 'publish' ? `发布 build ${row.sequence}？客户端将能检查并下载此版本，并按当前更新策略处理重启。` : `撤回 build ${row.sequence}？若是当前版本，将停止提供更新索引；不会自动降级或解除已有强制门槛。`, action === 'publish' ? '确认发布版本' : '确认撤回版本', { type: 'warning', confirmButtonText: action === 'publish' ? '发布' : '撤回', cancelButtonText: '取消' }); } catch { return; } changing.value = true; error.value = ''; try { await changeRelease(action, row.sequence, lifetime.signal); if (!lifetime.signal.aborted) { ElMessage.success(action === 'publish' ? '版本已发布' : '版本已撤回'); await load(); } } catch (e) { if (!lifetime.signal.aborted) error.value = homeworkError(e); } finally { changing.value = false; } }
onMounted(load); onBeforeUnmount(() => { ++generation; loader?.abort(); lifetime.abort(); });
</script>
<style scoped>
.policy-panel{max-width:900px;margin:20px 0;padding:18px;border:1px solid var(--el-border-color);border-radius:8px}.policy-panel .el-form{margin-top:16px}.heading,.summary{display:flex;align-items:center;gap:20px}.heading{justify-content:space-between}.summary{margin:20px 0;flex-wrap:wrap}.upload-form{max-width:760px;margin:24px 0}.hint{color:var(--el-text-color-secondary);font-size:13px}.error{color:var(--el-color-danger)}
</style>
