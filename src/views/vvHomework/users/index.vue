<template>
	<div>
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
		<el-table ref="usersTable" v-loading="loading" :data="users" border stripe @sort-change="handleSortChange" empty-text="暂无软件用户，用户通过 VV 身份校验后会自动登记。">
			<el-table-column prop="vvAccount" label="用户" sortable="custom" min-width="230" fixed><template #default="{ row }"><div class="identity"><el-avatar :src="row.avatarUrl" :size="38">VV</el-avatar><div><strong>{{ row.vvAccount }}</strong><div class="muted">{{ row.nickname || '昵称未获取' }}</div></div></div></template></el-table-column>
			<el-table-column prop="sex" label="性别" sortable="custom" width="85"><template #default="{ row }">{{ row.sex === 1 ? '男' : row.sex === 2 ? '女' : '未知' }}</template></el-table-column>
			<el-table-column prop="authorization" label="授权" sortable="custom" width="95"><template #default="{ row }"><el-tag :type="row.authorization.status === 'VALID' ? 'success' : 'warning'">{{ authorizationNames[row.authorization.status] }}</el-tag></template></el-table-column>
			<el-table-column prop="expiresAt" label="到期时间（北京）" sortable="custom" min-width="185"><template #default="{ row }">{{ beijingTime(row.expiresAt) }}</template></el-table-column>
			<el-table-column prop="confirmed" label="今日成功 / 日限" sortable="custom" width="140"><template #default="{ row }">{{ row.usage.confirmed }} / {{ row.dailyLimit }}</template></el-table-column>
			<el-table-column prop="reserved" label="预占 / 剩余" sortable="custom" width="120"><template #default="{ row }">{{ row.usage.reserved }} / {{ row.usage.remaining }}</template></el-table-column>
			<el-table-column prop="softwareOnline" label="软件 / VV" sortable="custom" width="150"><template #default="{ row }"><el-tag :type="row.softwareOnline ? 'success' : 'info'">{{ row.softwareOnline ? '在线' : '离线' }}</el-tag><div class="muted">VV {{ row.vvReady ? '已连接' : '未连接' }}</div></template></el-table-column>
			<el-table-column prop="lastActiveAt" label="最近活跃（北京）" sortable="custom" min-width="185"><template #default="{ row }">{{ beijingTime(row.lastActiveAt) }}</template></el-table-column>
			<el-table-column prop="buildId" label="上报 build" sortable="custom" min-width="205"><template #default="{ row }">{{ row.buildId || '未上报' }}</template></el-table-column>
			<el-table-column label="操作" width="300" fixed="right"><template #default="{ row }"><el-button text @click="openDetail(row)">详情</el-button><el-button v-auth="'api/v1/system/vvHomework/user/authorization'" text type="primary" @click="openEdit(row)">授权</el-button><el-button v-auth="'api/v1/system/vvHomework/user/status'" text @click="toggle(row)">{{ row.status ? '停用' : '启用' }}</el-button><el-button v-auth="'api/v1/system/vvHomework/user/delete'" text type="danger" :disabled="row.softwareOnline" :title="row.softwareOnline ? '请先在详情中强制下线' : '彻底删除此用户'" @click="openDelete(row)">删除</el-button></template></el-table-column>
		</el-table>
		<pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="load" />
	</el-card>

 <el-dialog v-model="deleteOpen" title="彻底删除软件用户" destroy-on-close @closed="closeDelete" width="540px" :close-on-click-modal="false" :close-on-press-escape="!deleting" :show-close="!deleting">
  <el-alert v-if="deleteError" :title="deleteError" type="error" :closable="false" />
  <p>将彻底删除 {{ deletingUser?.vvAccount }} / {{ deletingUser?.nickname || '昵称未获取' }} 的资料、密码密文、授权、会话、额度、发送记录和用户审计。</p>
  <el-alert title="不可通过撤销恢复；已发送消息不会撤回。同号再次登录将按新用户登记，旧账本不回灌，本机模板与素材保留。" type="warning" :closable="false" />
  <el-form label-position="top" :disabled="deleting"><el-form-item label="手工输入该VV号确认删除"><el-input v-model="deleteConfirmation" autocomplete="off" :placeholder="deletingUser?.vvAccount" /></el-form-item></el-form>
  <template #footer><el-button :disabled="deleting" @click="deleteOpen = false">取消</el-button><el-button type="danger" :loading="deleting" :disabled="deleteConfirmation.trim() !== deletingUser?.vvAccount" @click="removeUser">彻底删除</el-button></template>
 </el-dialog>

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
			<el-descriptions-item label="性别（VV资料）">{{ detail.sex === 1 ? '男' : detail.sex === 2 ? '女' : '未知' }}</el-descriptions-item><el-descriptions-item label="资料来源">{{ detail.profileSource }}</el-descriptions-item><el-descriptions-item label="密码">{{ detail.hasPassword ? '已加密保存' : '未保存' }} <el-button v-auth="'api/v1/system/vvHomework/user/password'" text type="primary" @click="showPassword">查看密码</el-button></el-descriptions-item>
			<el-descriptions-item label="首次登记">{{ beijingTime(detail.createdAt) }}</el-descriptions-item><el-descriptions-item label="最近登录">{{ beijingTime(detail.lastLoginAt) }}</el-descriptions-item>
			<el-descriptions-item label="累计成功触达人次">{{ detail.totalSuccess }}</el-descriptions-item>
			<el-descriptions-item label="最近登录公网 IP">{{ detailLoaded ? detail.ip || '当时未记录公网 IP' : detailError ? '读取失败' : '正在读取' }}</el-descriptions-item>
			<el-descriptions-item label="IP 归属地" :span="2">
				{{ detailLoaded ? detail.ipRegion || (detail.ip ? '暂未查到归属地' : '暂无公网 IP 可查询') : detailError ? '读取失败' : '正在读取' }}
			</el-descriptions-item>
			<el-descriptions-item label="客户端版本">{{ detail.clientVersion || '—' }}</el-descriptions-item><el-descriptions-item label="构建ID">{{ detail.buildId || '—' }}</el-descriptions-item>
			<el-descriptions-item label="离线时间">{{ beijingTime(detail.offlineAt) }}</el-descriptions-item><el-descriptions-item label="离线原因">{{ detail.offlineReason || '—' }}</el-descriptions-item>
			<el-descriptions-item label="备注" :span="2">{{ detail.remark || '—' }}</el-descriptions-item>
		</el-descriptions>
		<el-button v-if="detail" v-auth="'api/v1/system/vvHomework/user/logout'" class="section" type="warning" plain @click="forceLogout">强制软件下线</el-button>
		<div v-if="detail" v-auth="'api/v1/system/vvHomework/user/reconnect'" class="section">
			<el-button :disabled="!detailLoaded || !detail.vvReconnect?.canRequest" :loading="reconnectBusy" plain @click="requestVVReconnect">帮用户重连 VV</el-button>
			<span class="muted" role="status">{{ vvReconnectStatusText(detail.vvReconnect) }}</span>
		</div>
		<h3 class="section">未决记录</h3><p class="muted">显示最多100条。请按记录标识核对本机工作明细；未确认前保留预占，不自动重发。</p>
		<el-table v-loading="auditLoading" :data="pending" border empty-text="没有未决记录"><el-table-column prop="recordId" label="记录标识" min-width="190" show-overflow-tooltip /><el-table-column prop="workDay" label="发送日" width="120" /><el-table-column prop="state" label="状态" width="110" /><el-table-column label="操作" width="85"><template #default="{ row }"><el-button v-auth="'api/v1/system/vvHomework/attempt/resolve'" text type="primary" @click="openResolve(row)">核实</el-button></template></el-table-column></el-table>
		<h3 class="section">审计记录</h3><el-alert v-if="auditError" :title="auditError" type="error" :closable="false" />
		<el-table v-loading="auditLoading" :data="audits" border :empty-text="auditError ? '操作记录加载失败' : '暂无操作记录'">
			<el-table-column label="时间（北京）" min-width="165"><template #default="{ row }">{{ beijingTime(row.at) }}</template></el-table-column>
			<el-table-column label="事件" min-width="110"><template #default="{ row }">{{ auditEvents[row.event]?.[0] || '其他操作' }}</template></el-table-column>
			<el-table-column label="操作者" min-width="135"><template #default="{ row }">{{ row.actorId === 0 ? '客户端（用户本人）' : `管理员（编号 ${row.actorId}）` }}</template></el-table-column>
			<el-table-column label="说明" min-width="240" show-overflow-tooltip><template #default="{ row }">{{ auditDescription(row) }}</template></el-table-column>
		</el-table>
		<pagination v-show="auditTotal > 0" v-model:page="auditPage" :limit="20" :total="auditTotal" @pagination="loadAudit" />
	</el-drawer>

	<el-dialog v-model="passwordOpen" title="查看已保存密码" width="440px" @closed="clearPassword"><el-alert v-if="passwordError" :title="passwordError" type="error" :closable="false" /><p>此操作已记录审计。关闭窗口或30秒后自动清除显示。</p><div v-loading="passwordLoading" class="secret" v-if="!passwordError">{{ password }}</div></el-dialog>
	<el-dialog v-model="resolveOpen" title="核实未决记录" width="540px" :close-on-click-modal="false">
		<el-alert v-if="resolutionError" :title="resolutionError" type="error" :closable="false" /><el-form label-position="top"><el-form-item label="记录标识"><el-input :model-value="resolution.recordId" readonly /></el-form-item><el-form-item label="核实结果"><el-select v-model="resolution.status"><el-option label="确认未发送" value="NOT_SENT" /><el-option label="已取得真实成功回执" value="CONFIRMED" /></el-select></el-form-item><el-form-item v-if="resolution.status === 'CONFIRMED'" label="真实消息ID"><el-input v-model="resolution.messageId" maxlength="512" /></el-form-item><el-form-item label="核实依据"><el-input v-model="resolution.reason" type="textarea" maxlength="500" :rows="3" /></el-form-item><el-alert title="核实不会触发消息发送。活跃的在途许可不能更正。" type="warning" :closable="false" /></el-form><template #footer><el-button @click="resolveOpen = false">取消</el-button><el-button type="primary" :loading="resolving" @click="resolve">保存核实结果</el-button></template>
	</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { ElMessage, type TableInstance } from 'element-plus';
import { deleteHomeworkUser, authorizationNames, beijingTime, homeworkError, listHomeworkUsers, getHomeworkUser, getHomeworkAudit, saveHomeworkAuthorization, setHomeworkStatus, logoutHomeworkUser, requestHomeworkVVReconnect, viewHomeworkPassword, resolveHomeworkAttempt, type HomeworkUser, type UserQuery, type Pending, type Audit, type VVReconnectStatus } from '/@/api/vvHomework';
defineOptions({ name: 'vvHomeworkUsers' });
const usersTable = ref<TableInstance>();
const query = reactive<UserQuery>({ keyword: '', status: '', online: '', authorization: '', pageNum: 1, pageSize: 20 });
const users = ref<HomeworkUser[]>([]), total = ref(0), loading = ref(false), listError = ref('');
const detail = ref<HomeworkUser>(), detailOpen = ref(false), detailError = ref(''), auditError = ref(''), auditLoading = ref(false);
const detailLoaded = ref(false);
const audits = ref<Audit[]>([]), pending = ref<Pending[]>([]), auditTotal = ref(0), auditPage = ref(1);
const auditEvents: Record<string, [string, string]> = {
	REGISTER: ['首次登记', '该账号首次使用软件，已创建软件用户记录。'],
	LOGIN: ['登录软件', '软件账号身份验证通过。'],
	LOGOUT: ['退出软件', '软件会话已结束。'],
	AUTHORIZATION_UPDATE: ['修改授权', '管理员更新了授权设置。'],
	AUTHORIZATION_TRANSFER_OUT: ['授权转出', '已记录授权转出，详情暂不可读。'],
	AUTHORIZATION_TRANSFER_IN: ['授权转入', '已记录授权转入，详情暂不可读。'],
	FORCE_LOGOUT: ['强制下线', '管理员结束了软件会话。已发送消息仍可结算回执。'],
	PASSWORD_VIEW: ['查看密码', '管理员查看了该账号保存的密码。'],
	ATTEMPT_RESOLVE: ['核实发送结果', '管理员核实并更新了发送结果。'],
	CODE_REDEEM: ['兑换授权码', '用户使用授权码延长了授权。'],
	CODE_REVEAL: ['查看授权码', '用户查看了已兑换的授权码。'],
	VV_DISCONNECTED: ['VV 断线', '客户端检测到 VV 连接失效。'],
	VV_RECONNECT_STARTED: ['VV 开始重连', '客户端开始核对并尝试恢复 VV 连接。'],
	VV_RECONNECT_SUCCEEDED: ['VV 重连成功', '客户端已恢复 VV 连接。'],
	VV_RECONNECT_FAILED: ['VV 重连失败', '客户端尝试恢复 VV 连接失败。'],
	VV_RECONNECT_SKIPPED: ['VV 未执行重连', '客户端未满足重连条件。'],
	VV_ADMIN_RECONNECT_REQUESTED: ['管理员请求 VV 重连', '请求已提交，等待用户的小助手处理。'],
	VV_ADMIN_RECONNECT_CLAIMED: ['小助手已接收重连请求', '小助手已接收请求，将按在线状态判断。'],
	VV_ADMIN_RECONNECT_RESULT: ['管理员重连结果', '小助手已上报处理结果。'],
};

const vvConnectionReasons: Record<string, string> = {
	GATEWAY_HEARTBEAT_FAILED: 'VV 网关心跳失败',
	IM_SESSION_INVALIDATED: 'IM 会话失效',
	IM_TRANSPORT_CLOSED: 'IM 连接中断',
	LOCAL_MESSAGE_STATE_ERROR: '本机消息记录同步或保存失败',
	UNKNOWN: '断线原因尚未确认',
	MANUAL_REQUEST: '用户在小助手点击重新连接',
	NETWORK_TRANSIENT: '确认发生短时网络故障',
	VV_CONNECTED: 'VV 连接已恢复',
	PASSWORD_REJECTED: 'VV 密码认证失败',
	VERIFICATION_REQUIRED: '需要完成 VV 验证',
	ACCOUNT_IN_USE: '账号已被占用',
	BACKEND_UNAVAILABLE: '作业后台暂不可用',
	CONNECTION_TIMEOUT: 'VV 连接超时',
	CONNECT_FAILED: 'VV 连接失败，原因未确认',
	PASSWORD_REQUIRED: '需要用户输入 VV 密码',
	PRESENCE_ONLINE: 'VV 账号已在线',
	PRESENCE_UNKNOWN: '无法确认 VV 在线状态',
	SAFE_LOGIN_UNAVAILABLE: '尚未验证安全重连方式',
	NETWORK_NOT_CONFIRMED: '未确认是短时网络故障',
	NOT_ALLOWED: '当前软件会话不符合重连条件',
};

function vvConnectionAuditDescription(detail: string) {
	const payload = detail.match(/^[a-f0-9]{32} ([\s\S]+)$/)?.[1];
	if (!payload) return;
	try {
		const record: { occurredAt?: unknown; reason?: unknown } = JSON.parse(payload);
		const { occurredAt, reason } = record;
		if (typeof occurredAt !== 'string' || !Number.isFinite(Date.parse(occurredAt)) || typeof reason !== 'string' ||
			!Object.hasOwn(vvConnectionReasons, reason)) return;
		return `${vvConnectionReasons[reason]}。检测或操作时间 ${beijingTime(occurredAt)}（北京时间）。`;
	} catch {
		return;
	}
}

function vvReconnectStatusText(status?: VVReconnectStatus) {
	if (!status) return '尚未取得重连状态';
	switch (status.status) {
		case 'AVAILABLE': return '可向当前小助手会话发出请求';
		case 'OFFLINE': return '小助手离线';
		case 'UNSUPPORTED': return '当前小助手尚未报告重连支持';
		case 'NOT_ALLOWED': return '当前授权不符合重连条件';
		case 'VV_READY': return 'VV 已连接';
		case 'QUEUED': return '已提交，等待小助手接收';
		case 'CLAIMED': return '小助手正在核对 VV 在线状态';
		case 'EXPIRED': return '请求已超时，未取得客户端结果';
		case 'SUCCEEDED': return 'VV 重连成功';
		case 'BLOCKED':
		case 'FAILED': {
			const reason = status.reason;
			return reason && Object.hasOwn(vvConnectionReasons, reason) ? vvConnectionReasons[reason] : '无法确认重连结果';
		}
	}
}

function transferAuditDescription(detail: string) {
	const payload = detail.match(/^[a-f0-9]{32} ([\s\S]+)$/)?.[1];
	if (!payload) return;
	let receipt: Record<string, unknown> | undefined;
	try {
		receipt = JSON.parse(payload)?.receipt;
	} catch {
		return;
	}
	const { sourceAccount, targetAccount, remainingMillis, targetExpiresAt } = receipt ?? {};
	if (
		typeof sourceAccount !== 'string' || !/^\d+$/.test(sourceAccount) ||
		typeof targetAccount !== 'string' || !/^\d+$/.test(targetAccount) ||
		typeof remainingMillis !== 'number' || !Number.isSafeInteger(remainingMillis) || remainingMillis <= 0 ||
		typeof targetExpiresAt !== 'string' || !Number.isFinite(Date.parse(targetExpiresAt))
	) return;

	const seconds = Math.floor(remainingMillis / 1000);
	const units = [
		{ amount: Math.floor(seconds / 86400), label: '天' },
		{ amount: Math.floor(seconds / 3600) % 24, label: '小时' },
		{ amount: Math.floor(seconds / 60) % 60, label: '分' },
		{ amount: seconds % 60, label: '秒' },
	];
	const duration = units.filter(({ amount }) => amount > 0).map(({ amount, label }) => `${amount} ${label}`).join(' ');
	const transfer = duration ? `转移 ${duration}` : '转移不足 1 秒';
	return `转出方 VV 号 ${sourceAccount}，接收方 VV 号 ${targetAccount}。${transfer}，接收方授权到期时间为 ${beijingTime(targetExpiresAt)}（北京时间）。`;
}

function auditDescription(row: Audit) {
	const detail = row.detail?.trim() || '';
	if (row.event === 'VV_ADMIN_RECONNECT_RESULT') {
		const reason = detail.match(/^[a-f0-9]{64} [A-Za-z0-9_-]{43} ([A-Z_]+)$/)?.[1];
		return reason && Object.hasOwn(vvConnectionReasons, reason) ? vvConnectionReasons[reason] : auditEvents[row.event][1];
	}
	if (row.event.startsWith('VV_') && Object.hasOwn(auditEvents, row.event)) {
		return vvConnectionAuditDescription(detail) ?? auditEvents[row.event][1];
	}
	if (row.event === 'LOGOUT' && detail === 'EXIT') return '用户正常退出软件。';
	if (row.event === 'AUTHORIZATION_TRANSFER_OUT' || row.event === 'AUTHORIZATION_TRANSFER_IN') {
		return transferAuditDescription(detail) ?? auditEvents[row.event][1];
	}
	if (row.event === 'AUTHORIZATION_UPDATE') {
		const fields = detail.match(/^revision=\d+ dailyLimit=(\d+) expiresMs=(\d+) status=([01])$/);
		if (fields) {
			const [, limit, expiresMs, status] = fields;
			const expires = new Date(Number(expiresMs));
			if (Number.isFinite(expires.getTime())) {
				const expiration = Number(expiresMs) === 0 ? '未设置到期时间' : `到期时间为 ${beijingTime(expires.toISOString())}（北京）`;
				return `账号${status === '1' ? '启用' : '停用'}，每日上限 ${limit} 人，${expiration}。`;
			}
		}
	}
	if (row.event === 'ATTEMPT_RESOLVE') {
		const fields = detail.match(/^\S+ (CONFIRMED|NOT_SENT) ([\s\S]+)$/);
		if (fields) return `确认${fields[1] === 'CONFIRMED' ? '已发送' : '未发送'}。核实依据为「${fields[2]}」。`;
	}
	if (row.event === 'CODE_REDEEM') {
		const days = detail.match(/\bdays=(\d+)\b/)?.[1];
		if (days) return `用户兑换授权码，授权延长 ${days} 天。`;
	}
	return auditEvents[row.event]?.[1] || '暂无可读说明。';
}
const editOpen = ref(false), editing = ref<HomeworkUser>(), saving = ref(false), editDate = ref('');
const edit = reactive({ dailyLimit: 200, status: 1, remark: '' });
const passwordOpen = ref(false), passwordLoading = ref(false), password = ref('');
const resolveOpen = ref(false), resolving = ref(false), resolution = reactive({ recordId: '', status: 'NOT_SENT', messageId: '', reason: '' });
let listGeneration = 0, detailGeneration = 0, auditGeneration = 0, listController: AbortController | undefined, detailController: AbortController | undefined, auditController: AbortController | undefined, passwordController: AbortController | undefined, passwordTimer: ReturnType<typeof setTimeout> | undefined;
const lifetime = new AbortController();
const editError = ref(''), passwordError = ref(''), resolutionError = ref('');
let pollTimer: ReturnType<typeof setInterval> | undefined;
let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
const reconnectBusy = ref(false);
async function load() { const generation = ++listGeneration; listController?.abort(); listController = new AbortController(); loading.value = true; listError.value = ''; try { const res = await listHomeworkUsers({ ...query }, listController.signal); if (generation === listGeneration && !lifetime.signal.aborted) { users.value = res.data.list ?? []; total.value = res.data.total; } } catch { if (generation === listGeneration && !lifetime.signal.aborted) listError.value = '用户加载失败，请检查权限或连接后重试。'; } finally { if (generation === listGeneration) loading.value = false; } }
function search() { query.pageNum = 1; void load(); }
function reset() {
	Object.assign(query, { keyword: '', status: '', online: '', authorization: '', pageNum: 1, sortBy: '', sortOrder: '' });
	usersTable.value?.clearSort();
	void load();
}
function handleSortChange({ prop, order }: { prop?: string; order: 'ascending' | 'descending' | null }) {
	const sortBy = order ? prop || '' : '';
	const sortOrder = sortBy ? order || '' : '';
	if ((query.sortBy || '') === sortBy && (query.sortOrder || '') === sortOrder) return;
	Object.assign(query, { sortBy, sortOrder });
	search();
}
function openEdit(u: HomeworkUser) { editError.value = ''; editing.value = u; Object.assign(edit, { dailyLimit: u.dailyLimit, status: u.status, remark: u.remark }); editDate.value = u.expiresAt ? beijingTime(u.expiresAt) : ''; editOpen.value = true; }
async function saveEdit() { if (!editing.value) return; if (!Number.isInteger(edit.dailyLimit)) { ElMessage.warning('请填写每日上限'); return; } const date = editDate.value ? new Date(editDate.value.replace(' ', 'T') + '+08:00') : null; if (date && Number.isNaN(date.getTime())) { ElMessage.warning('请填写有效的北京时间'); return; } const expiresAt = date ? date.toISOString() : null; saving.value = true; editError.value = ''; try { await saveHomeworkAuthorization({ registrationId:editing.value.registrationId,id: editing.value.id, revision: editing.value.revision, expiresAt, ...edit }, lifetime.signal); if (!lifetime.signal.aborted) { editOpen.value = false; ElMessage.success('授权已保存'); await load(); } } catch (problem) { if (!lifetime.signal.aborted) editError.value = homeworkError(problem); } finally { saving.value = false; } }
async function toggle(u: HomeworkUser) { try { await setHomeworkStatus(u, lifetime.signal); if (!lifetime.signal.aborted) { ElMessage.success(u.status ? '账号已停用' : '账号已启用'); await load(); } } catch (problem) { if (!lifetime.signal.aborted) listError.value = homeworkError(problem); } }
async function openDetail(u: HomeworkUser) { closeDetail(); detailOpen.value = true; detail.value = u; auditPage.value = 1; const generation = ++detailGeneration; detailController = new AbortController(); void loadAudit(); try { const res = await getHomeworkUser(u.id, detailController.signal); if (generation === detailGeneration && detailOpen.value) { detail.value = res.data; detailLoaded.value = true; scheduleVVReconnectRefresh(); } } catch { if (generation === detailGeneration && detailOpen.value) detailError.value = '详情加载失败，可关闭后重新打开。'; } }
async function loadAudit() { if (!detail.value) return; const id = detail.value.id, generation = ++auditGeneration; auditController?.abort(); auditController = new AbortController(); auditLoading.value = true; auditError.value = ''; try { const res = await getHomeworkAudit(id, auditPage.value, auditController.signal); if (generation === auditGeneration && detail.value?.id === id) { audits.value = res.data.list; pending.value = res.data.pending; auditTotal.value = res.data.total; } } catch { if (generation === auditGeneration && detailOpen.value) auditError.value = '审计加载失败，可重新打开详情重试。'; } finally { if (generation === auditGeneration) auditLoading.value = false; } }
function closeDetail() { ++detailGeneration; ++auditGeneration; detailController?.abort(); auditController?.abort(); clearTimeout(reconnectTimer); reconnectBusy.value = false; detailLoaded.value = false; detailError.value = ''; auditError.value = ''; audits.value = []; pending.value = []; auditTotal.value = 0; clearPassword(); }

function scheduleVVReconnectRefresh() {
	clearTimeout(reconnectTimer);
	const status = detail.value?.vvReconnect;
	if (!detailOpen.value || !status) return;
	const waiting = status.status === 'QUEUED' || status.status === 'CLAIMED';
	const untilExpiry = Date.parse(status.expiresAt || '') - Date.now();
	if (waiting || !status.canRequest && untilExpiry > 0) {
		reconnectTimer = setTimeout(() => void refreshVVReconnect(), waiting ? 2500 : untilExpiry + 250);
	}
}

async function refreshVVReconnect() {
	const selected = detail.value;
	const generation = detailGeneration;
	if (!selected || !detailOpen.value) return;
	try {
		const res = await getHomeworkUser(selected.id, detailController?.signal);
		if (generation !== detailGeneration || !detailOpen.value) return;
		detail.value = res.data;
		if (selected.vvReconnect?.status !== res.data.vvReconnect?.status) void loadAudit();
		scheduleVVReconnectRefresh();
	} catch {
		if (generation === detailGeneration && detailOpen.value) detailError.value = '重连状态读取失败，可关闭后重新打开详情核对。';
	}
}

async function requestVVReconnect() {
	const selected = detail.value;
	const generation = detailGeneration;
	const status = selected?.vvReconnect;
	if (!selected || !status?.canRequest || !status.sessionKey || reconnectBusy.value) return;
	reconnectBusy.value = true;
	detailError.value = '';
	clearTimeout(reconnectTimer);
	try {
		const res = await requestHomeworkVVReconnect(selected, status.sessionKey, detailController?.signal);
		if (generation !== detailGeneration || !detailOpen.value) return;
		detail.value = { ...selected, vvReconnect: res.data };
		auditPage.value = 1;
		void loadAudit();
		scheduleVVReconnectRefresh();
	} catch (problem) {
		if (generation === detailGeneration && detailOpen.value) {
			detailError.value = homeworkError(problem);
			void refreshVVReconnect();
		}
	} finally {
		if (generation === detailGeneration) reconnectBusy.value = false;
	}
}
async function forceLogout() { if (!detail.value) return; try { await logoutHomeworkUser(detail.value, lifetime.signal); if (!lifetime.signal.aborted) { ElMessage.success('已停止该软件会话的新派发'); detailOpen.value = false; await load(); } } catch (problem) { if (!lifetime.signal.aborted) detailError.value = homeworkError(problem); } }
function clearPassword() { passwordController?.abort(); password.value = ''; passwordError.value = ''; if (passwordTimer) clearTimeout(passwordTimer); passwordTimer = undefined; passwordOpen.value = false; }
async function showPassword() { if (!detail.value) return; clearPassword(); passwordController = new AbortController(); const controller = passwordController; passwordOpen.value = true; passwordLoading.value = true; try { const res = await viewHomeworkPassword(detail.value.id, controller.signal,detail.value.registrationId); if (!controller.signal.aborted && passwordOpen.value) { password.value = res.data.password; passwordTimer = setTimeout(clearPassword, 30000); } } catch (problem) { if (!controller.signal.aborted && passwordOpen.value) passwordError.value = homeworkError(problem); } finally { passwordLoading.value = false; } }
function openResolve(row: Pending) { resolutionError.value = ''; Object.assign(resolution, { recordId: row.recordId, status: 'NOT_SENT', messageId: '', reason: '' }); resolveOpen.value = true; }
async function resolve() { if (!detail.value) return; if (resolution.reason.trim().length < 2 || (resolution.status === 'CONFIRMED' && !resolution.messageId.trim())) { ElMessage.warning('请填写核实依据及必要的真实消息ID'); return; } resolving.value = true; try { await resolveHomeworkAttempt({ registrationId:detail.value.registrationId,id: detail.value.id, ...resolution }, lifetime.signal); if (!lifetime.signal.aborted) { resolveOpen.value = false; ElMessage.success('核实结果已记录'); await loadAudit(); await load(); } } catch (problem) { if (!lifetime.signal.aborted) resolutionError.value = homeworkError(problem); } finally { resolving.value = false; } }
const deleteOpen = ref(false), deleting = ref(false), deleteError = ref(''), deleteConfirmation = ref('');
const deletingUser = ref<HomeworkUser>();
function closeDelete() { deletingUser.value = undefined; deleteConfirmation.value = ''; deleteError.value = ''; }
function openDelete(row: HomeworkUser) { deletingUser.value = { ...row }; deleteConfirmation.value = ''; deleteError.value = ''; deleteOpen.value = true; }
async function removeUser() {
 const user = deletingUser.value;
 if (!user || deleting.value || deleteConfirmation.value.trim() !== user.vvAccount) return;
 deleting.value = true; deleteError.value = '';
 try {
  await deleteHomeworkUser({ registrationId:user.registrationId,id: user.id, revision: user.revision, confirmationAccount: deleteConfirmation.value.trim() }, lifetime.signal);
  if (lifetime.signal.aborted) return;
  deleteOpen.value = false;
  if (detail.value?.id === user.id) { detailOpen.value = false; closeDetail(); detail.value = undefined; }
  if (editing.value?.id === user.id) { editOpen.value = false; editing.value = undefined; }
  if (users.value.length === 1 && query.pageNum > 1) query.pageNum--;
  users.value = users.value.filter(row => row.id !== user.id); total.value = Math.max(0, total.value - 1);
  ElMessage.success('该软件用户及关联数据已删除'); await load();
 } catch (problem) { if (!lifetime.signal.aborted) deleteError.value = homeworkError(problem); }
 finally { deleting.value = false; }
}
onMounted(() => { void load(); pollTimer = setInterval(() => { if (document.visibilityState === 'visible' && !loading.value && !saving.value && !editOpen.value && !deleteOpen.value && !deleting.value && !listError.value) void load(); }, 30000); });
onBeforeUnmount(() => { if (pollTimer) clearInterval(pollTimer); lifetime.abort(); ++listGeneration; listController?.abort(); closeDetail(); });
</script>

<style scoped>
.intro{font-size:12px;color:var(--el-text-color-secondary);margin-left:16px}.identity{display:flex;align-items:center;gap:12px}.muted{font-size:12px;color:var(--el-text-color-secondary);line-height:1.8}.section{margin-top:24px}.error{margin-bottom:16px}.secret{padding:22px;margin-top:15px;background:var(--el-fill-color-light);font-family:monospace;font-size:20px;user-select:all;overflow-wrap:anywhere;min-height:70px}.filters{margin-bottom:10px}
</style>
