<template>
	<el-card shadow="never">
		<template #header><strong>自动作业用户</strong><span class="intro">软件账号独立于 ADS 管理员与家族账号</span></template>
		<el-form inline :model="query" class="filters">
			<el-form-item label="VV号 / 昵称"><el-input v-model="query.keyword" clearable maxlength="128" @keyup.enter="search" /></el-form-item>
			<el-form-item label="启停"><el-select v-model="query.status" clearable style="width:110px"><el-option label="启用" value="1" /><el-option label="停用" value="0" /></el-select></el-form-item>
			<el-form-item label="软件在线"><el-select v-model="query.online" clearable style="width:110px"><el-option label="在线" value="1" /><el-option label="离线" value="0" /></el-select></el-form-item>
			<el-form-item label="授权"><el-select v-model="query.authorization" clearable style="width:140px"><el-option label="待授权" value="PENDING" /><el-option label="有效" value="VALID" /><el-option label="已到期" value="EXPIRED" /><el-option label="7天内到期" value="SOON" /></el-select></el-form-item>
			<el-form-item><el-button type="primary" @click="search">查询</el-button><el-button @click="reset">重置</el-button></el-form-item>
		</el-form>
		<el-alert v-if="listError" :title="listError" type="error" :closable="false" class="error" />
		<el-table v-loading="loading" :data="users" border stripe empty-text="暂无软件用户，用户通过 VV 身份校验后会自动登记。">
			<el-table-column label="用户" min-width="230" fixed><template #default="{ row }"><div class="identity"><el-avatar :src="row.avatarUrl" :size="38">VV</el-avatar><div><strong>{{ row.vvAccount }}</strong><div class="muted">{{ row.nickname || '昵称未获取' }}</div></div></div></template></el-table-column>
			<el-table-column label="性别" width="85"><template #default="{ row }">{{ row.virtualRoleSex === 1 ? '男' : row.virtualRoleSex === 2 ? '女' : '未知' }}</template></el-table-column>
			<el-table-column label="授权" width="95"><template #default="{ row }"><el-tag :type="row.authorization.status === 'VALID' ? 'success' : 'warning'">{{ authorizationNames[row.authorization.status] }}</el-tag></template></el-table-column>
			<el-table-column label="到期时间（北京）" min-width="185"><template #default="{ row }">{{ beijingTime(row.expiresAt) }}</template></el-table-column>
			<el-table-column label="今日成功 / 日限" width="140"><template #default="{ row }">{{ row.usage.confirmed }} / {{ row.dailyLimit }}</template></el-table-column>
			<el-table-column label="预占 / 剩余" width="120"><template #default="{ row }">{{ row.usage.reserved }} / {{ row.usage.remaining }}</template></el-table-column>
			<el-table-column label="软件 / VV" width="150"><template #default="{ row }"><el-tag :type="row.softwareOnline ? 'success' : 'info'">{{ row.softwareOnline ? '在线' : '离线' }}</el-tag><div class="muted">VV {{ row.vvReady ? '已连接' : '未连接' }}</div></template></el-table-column>
			<el-table-column label="最近活跃（北京）" min-width="185"><template #default="{ row }">{{ beijingTime(row.lastActiveAt) }}</template></el-table-column>
			<el-table-column label="操作" width="235" fixed="right"><template #default="{ row }"><el-button text @click="openDetail(row)">详情</el-button><el-button v-auth="'api/v1/system/vvHomework/user/authorization'" text type="primary" @click="openEdit(row)">授权</el-button><el-button v-auth="'api/v1/system/vvHomework/user/status'" text @click="toggle(row)">{{ row.status ? '停用' : '启用' }}</el-button></template></el-table-column>
		</el-table>
		<pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
	</el-card>

	<el-dialog v-model="editOpen" title="用户授权" width="540px" :close-on-click-modal="false">
		<el-alert v-if="editError" :title="editError" type="error" :closable="false" /><el-form label-position="top" :disabled="saving">
			<el-form-item label="VV号"><el-input :model-value="editing?.vvAccount" disabled /></el-form-item>
			<el-form-item label="授权到期时间（北京时间，留空为待授权）"><el-date-picker v-model="editDate" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" format="YYYY-MM-DD HH:mm:ss" clearable /></el-form-item>
			<el-form-item label="每日成功触达上限"><el-input-number v-model="edit.dailyLimit" :min="0" :max="10000" :precision="0" /><span class="muted">0表示禁发，不会清空今日已用。</span></el-form-item>
			<el-form-item label="账号状态"><el-switch v-model="edit.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="停用" /></el-form-item>
			<el-form-item label="备注"><el-input v-model="edit.remark" type="textarea" maxlength="500" :rows="3" /></el-form-item>
			<el-alert title="修改授权不会自动启动用户的作业；在途单条消息仍可完成结算。" type="info" :closable="false" />
		</el-form>
		<template #footer><el-button @click="editOpen = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveEdit">保存授权</el-button></template>
	</el-dialog>

	<el-drawer v-model="detailOpen" title="软件用户详情" size="720px" @closed="closeDetail">
		<el-alert v-if="detailError" :title="detailError" type="error" :closable="false" />
		<el-descriptions v-if="detail" :column="2" border>
			<el-descriptions-item label="VV号">{{ detail.vvAccount }}</el-descriptions-item><el-descriptions-item label="昵称">{{ detail.nickname }}</el-descriptions-item>
			<el-descriptions-item label="资料来源">{{ detail.profileSource }}</el-descriptions-item><el-descriptions-item label="密码">{{ detail.hasPassword ? '已加密保存' : '未保存' }} <el-button v-auth="'api/v1/system/vvHomework/user/password'" text type="primary" @click="showPassword">查看密码</el-button></el-descriptions-item>
			<el-descriptions-item label="首次登记">{{ beijingTime(detail.createdAt) }}</el-descriptions-item><el-descriptions-item label="最近登录">{{ beijingTime(detail.lastLoginAt) }}</el-descriptions-item>
			<el-descriptions-item label="累计成功触达人次">{{ detail.totalSuccess }}</el-descriptions-item><el-descriptions-item label="最近IP">{{ detail.ip || '—' }}</el-descriptions-item>
			<el-descriptions-item label="客户端版本">{{ detail.clientVersion || '—' }}</el-descriptions-item><el-descriptions-item label="构建ID">{{ detail.buildId || '—' }}</el-descriptions-item>
			<el-descriptions-item label="离线时间">{{ beijingTime(detail.offlineAt) }}</el-descriptions-item><el-descriptions-item label="离线原因">{{ detail.offlineReason || '—' }}</el-descriptions-item>
			<el-descriptions-item label="备注" :span="2">{{ detail.remark || '—' }}</el-descriptions-item>
		</el-descriptions>
		<el-button v-if="detail" v-auth="'api/v1/system/vvHomework/user/logout'" class="section" type="warning" plain @click="forceLogout">强制软件下线</el-button>
		<h3 class="section">未决记录</h3><p class="muted">显示最多100条。请按记录标识核对本机工作明细；未确认前保留预占，不自动重发。</p>
		<el-table v-loading="auditLoading" :data="pending" border empty-text="没有未决记录"><el-table-column prop="recordId" label="记录标识" min-width="190" show-overflow-tooltip /><el-table-column prop="workDay" label="发送日" width="120" /><el-table-column prop="state" label="状态" width="110" /><el-table-column label="操作" width="85"><template #default="{ row }"><el-button v-auth="'api/v1/system/vvHomework/attempt/resolve'" text type="primary" @click="openResolve(row)">核实</el-button></template></el-table-column></el-table>
		<h3 class="section">审计记录</h3><el-alert v-if="auditError" :title="auditError" type="error" :closable="false" />
		<el-table v-loading="auditLoading" :data="audits" border><el-table-column label="时间（北京）" min-width="175"><template #default="{ row }">{{ beijingTime(row.at) }}</template></el-table-column><el-table-column prop="event" label="事件" min-width="150" /><el-table-column prop="actorId" label="操作者" width="90" /><el-table-column prop="detail" label="说明" min-width="180" show-overflow-tooltip /></el-table>
		<pagination v-show="auditTotal > 0" v-model:page="auditPage" :limit="20" :total="auditTotal" @pagination="loadAudit" />
	</el-drawer>

	<el-dialog v-model="passwordOpen" title="查看已保存密码" width="440px" @closed="clearPassword"><el-alert v-if="passwordError" :title="passwordError" type="error" :closable="false" /><p>此操作已记录审计。关闭窗口或30秒后自动清除显示。</p><div v-loading="passwordLoading" class="secret" v-if="!passwordError">{{ password }}</div></el-dialog>
	<el-dialog v-model="resolveOpen" title="核实未决记录" width="540px" :close-on-click-modal="false">
		<el-alert v-if="resolutionError" :title="resolutionError" type="error" :closable="false" /><el-form label-position="top"><el-form-item label="记录标识"><el-input :model-value="resolution.recordId" readonly /></el-form-item><el-form-item label="核实结果"><el-select v-model="resolution.status"><el-option label="确认未发送" value="NOT_SENT" /><el-option label="已取得真实成功回执" value="CONFIRMED" /></el-select></el-form-item><el-form-item v-if="resolution.status === 'CONFIRMED'" label="真实消息ID"><el-input v-model="resolution.messageId" maxlength="512" /></el-form-item><el-form-item label="核实依据"><el-input v-model="resolution.reason" type="textarea" maxlength="500" :rows="3" /></el-form-item><el-alert title="核实不会触发消息发送。活跃的在途许可不能更正。" type="warning" :closable="false" /></el-form><template #footer><el-button @click="resolveOpen = false">取消</el-button><el-button type="primary" :loading="resolving" @click="resolve">保存核实结果</el-button></template>
	</el-dialog>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { authorizationNames, beijingTime, homeworkError, listHomeworkUsers, getHomeworkUser, getHomeworkAudit, saveHomeworkAuthorization, setHomeworkStatus, logoutHomeworkUser, viewHomeworkPassword, resolveHomeworkAttempt, type HomeworkUser, type UserQuery, type Pending, type Audit } from '/@/api/vvHomework';
defineOptions({ name: 'vvHomeworkUsers' });
const query = reactive<UserQuery>({ keyword: '', status: '', online: '', authorization: '', pageNum: 1, pageSize: 20 });
const users = ref<HomeworkUser[]>([]), total = ref(0), loading = ref(false), listError = ref('');
const detail = ref<HomeworkUser>(), detailOpen = ref(false), detailError = ref(''), auditError = ref(''), auditLoading = ref(false);
const audits = ref<Audit[]>([]), pending = ref<Pending[]>([]), auditTotal = ref(0), auditPage = ref(1);
const editOpen = ref(false), editing = ref<HomeworkUser>(), saving = ref(false), editDate = ref('');
const edit = reactive({ dailyLimit: 200, status: 1, remark: '' });
const passwordOpen = ref(false), passwordLoading = ref(false), password = ref('');
const resolveOpen = ref(false), resolving = ref(false), resolution = reactive({ recordId: '', status: 'NOT_SENT', messageId: '', reason: '' });
let listGeneration = 0, detailGeneration = 0, auditGeneration = 0, listController: AbortController | undefined, detailController: AbortController | undefined, auditController: AbortController | undefined, passwordController: AbortController | undefined, passwordTimer: ReturnType<typeof setTimeout> | undefined;
const lifetime = new AbortController();
const editError = ref(''), passwordError = ref(''), resolutionError = ref('');
let pollTimer: ReturnType<typeof setInterval> | undefined;
async function load() { const generation = ++listGeneration; listController?.abort(); listController = new AbortController(); loading.value = true; listError.value = ''; try { const res = await listHomeworkUsers({ ...query }, listController.signal); if (generation === listGeneration && !lifetime.signal.aborted) { users.value = res.data.list ?? []; total.value = res.data.total; } } catch { if (generation === listGeneration && !lifetime.signal.aborted) listError.value = '用户加载失败，请检查权限或连接后重试。'; } finally { if (generation === listGeneration) loading.value = false; } }
function search() { query.pageNum = 1; void load(); }
function reset() { Object.assign(query, { keyword: '', status: '', online: '', authorization: '', pageNum: 1 }); void load(); }
function openEdit(u: HomeworkUser) { editError.value = ''; editing.value = u; Object.assign(edit, { dailyLimit: u.dailyLimit, status: u.status, remark: u.remark }); editDate.value = u.expiresAt ? beijingTime(u.expiresAt) : ''; editOpen.value = true; }
async function saveEdit() { if (!editing.value) return; if (!Number.isInteger(edit.dailyLimit)) { ElMessage.warning('请填写每日上限'); return; } const date = editDate.value ? new Date(editDate.value.replace(' ', 'T') + '+08:00') : null; if (date && Number.isNaN(date.getTime())) { ElMessage.warning('请填写有效的北京时间'); return; } const expiresAt = date ? date.toISOString() : null; saving.value = true; editError.value = ''; try { await saveHomeworkAuthorization({ id: editing.value.id, revision: editing.value.revision, expiresAt, ...edit }, lifetime.signal); if (!lifetime.signal.aborted) { editOpen.value = false; ElMessage.success('授权已保存'); await load(); } } catch (problem) { if (!lifetime.signal.aborted) editError.value = homeworkError(problem); } finally { saving.value = false; } }
async function toggle(u: HomeworkUser) { try { await setHomeworkStatus(u, lifetime.signal); if (!lifetime.signal.aborted) { ElMessage.success(u.status ? '账号已停用' : '账号已启用'); await load(); } } catch (problem) { if (!lifetime.signal.aborted) listError.value = homeworkError(problem); } }
async function openDetail(u: HomeworkUser) { closeDetail(); detailOpen.value = true; detail.value = u; auditPage.value = 1; const generation = ++detailGeneration; detailController = new AbortController(); void loadAudit(); try { const res = await getHomeworkUser(u.id, detailController.signal); if (generation === detailGeneration && detailOpen.value) detail.value = res.data; } catch { if (generation === detailGeneration && detailOpen.value) detailError.value = '详情加载失败，可关闭后重新打开。'; } }
async function loadAudit() { if (!detail.value) return; const id = detail.value.id, generation = ++auditGeneration; auditController?.abort(); auditController = new AbortController(); auditLoading.value = true; auditError.value = ''; try { const res = await getHomeworkAudit(id, auditPage.value, auditController.signal); if (generation === auditGeneration && detail.value?.id === id) { audits.value = res.data.list; pending.value = res.data.pending; auditTotal.value = res.data.total; } } catch { if (generation === auditGeneration && detailOpen.value) auditError.value = '审计加载失败，可重新打开详情重试。'; } finally { if (generation === auditGeneration) auditLoading.value = false; } }
function closeDetail() { ++detailGeneration; ++auditGeneration; detailController?.abort(); auditController?.abort(); detailError.value = ''; auditError.value = ''; audits.value = []; pending.value = []; auditTotal.value = 0; clearPassword(); }
async function forceLogout() { if (!detail.value) return; try { await logoutHomeworkUser(detail.value, lifetime.signal); if (!lifetime.signal.aborted) { ElMessage.success('已停止该软件会话的新派发'); detailOpen.value = false; await load(); } } catch (problem) { if (!lifetime.signal.aborted) detailError.value = homeworkError(problem); } }
function clearPassword() { passwordController?.abort(); password.value = ''; passwordError.value = ''; if (passwordTimer) clearTimeout(passwordTimer); passwordTimer = undefined; passwordOpen.value = false; }
async function showPassword() { if (!detail.value) return; clearPassword(); passwordController = new AbortController(); const controller = passwordController; passwordOpen.value = true; passwordLoading.value = true; try { const res = await viewHomeworkPassword(detail.value.id, controller.signal); if (!controller.signal.aborted && passwordOpen.value) { password.value = res.data.password; passwordTimer = setTimeout(clearPassword, 30000); } } catch (problem) { if (!controller.signal.aborted && passwordOpen.value) passwordError.value = homeworkError(problem); } finally { passwordLoading.value = false; } }
function openResolve(row: Pending) { resolutionError.value = ''; Object.assign(resolution, { recordId: row.recordId, status: 'NOT_SENT', messageId: '', reason: '' }); resolveOpen.value = true; }
async function resolve() { if (!detail.value) return; if (resolution.reason.trim().length < 2 || (resolution.status === 'CONFIRMED' && !resolution.messageId.trim())) { ElMessage.warning('请填写核实依据及必要的真实消息ID'); return; } resolving.value = true; try { await resolveHomeworkAttempt({ id: detail.value.id, ...resolution }, lifetime.signal); if (!lifetime.signal.aborted) { resolveOpen.value = false; ElMessage.success('核实结果已记录'); await loadAudit(); await load(); } } catch (problem) { if (!lifetime.signal.aborted) resolutionError.value = homeworkError(problem); } finally { resolving.value = false; } }
onMounted(() => { void load(); pollTimer = setInterval(() => { if (document.visibilityState === 'visible' && !loading.value && !saving.value && !editOpen.value && !listError.value) void load(); }, 30000); });
onBeforeUnmount(() => { if (pollTimer) clearInterval(pollTimer); lifetime.abort(); ++listGeneration; listController?.abort(); closeDetail(); });
</script>

<style scoped>
.intro{font-size:12px;color:var(--el-text-color-secondary);margin-left:16px}.identity{display:flex;align-items:center;gap:12px}.muted{font-size:12px;color:var(--el-text-color-secondary);line-height:1.8}.section{margin-top:24px}.error{margin-bottom:16px}.secret{padding:22px;margin-top:15px;background:var(--el-fill-color-light);font-family:monospace;font-size:20px;user-select:all;overflow-wrap:anywhere;min-height:70px}.filters{margin-bottom:10px}
</style>
