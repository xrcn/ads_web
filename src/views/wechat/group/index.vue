<template>
	<div class="wechat-robot-group-container">
		<el-card shadow="hover">
			<MobileRecordList :data="list" :loading="loading" row-key="id" filter-summary="全部机器人 · 全部状态" data-mobile-view="wechat-group">
			<template #filters>
			<el-form :model="query" inline label-width="92px" class="mb15">
				<el-form-item label="微信群名称">
					<el-input v-model="query.groupName" placeholder="请输入微信群名称" clearable style="width: 220px" @keyup.enter="loadList" />
				</el-form-item>
				<el-form-item label="微信群wxid">
					<el-input v-model="query.groupWxid" placeholder="请输入微信群wxid" clearable style="width: 220px" @keyup.enter="loadList" />
				</el-form-item>
				<el-form-item label="绑定机器人">
					<el-select v-model="query.wechatRobotAccountId" placeholder="全部" clearable filterable style="width: 220px">
						<el-option v-for="item in accountOptions" :key="item.value" :label="item.label" :value="item.value" />
					</el-select>
				</el-form-item>
				<el-form-item label="状态">
					<el-select v-model="query.status" placeholder="全部" clearable style="width: 220px">
						<el-option label="启用" :value="1" />
						<el-option label="停用" :value="0" />
					</el-select>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click="loadList">查询</el-button>
					<el-button @click="resetQuery">重置</el-button>
					<el-button v-auth="'api/v1/system/wechatRobotGroup/add'" type="success" plain @click="openAdd">新增微信群</el-button>
				</el-form-item>
			</el-form>
			</template>

			<template #desktop>
			<el-table v-loading="loading" :data="list" border stripe row-key="id" @expand-change="handleMemberExpand">
				<el-table-column type="index" label="序号" width="70" />
				<el-table-column v-if="canListMembers" type="expand" width="52">
					<template #default="{ row }">
						<div class="group-member-panel">
							<div class="group-member-toolbar">
								<el-switch v-model="memberPanel(row).includeLeft" active-text="包含已离群成员" @change="loadMembers(row, true)" />
								<el-button v-if="canSyncMembers" v-auth="'api/v1/system/wechatRobotGroup/memberSync'" type="primary" :loading="memberPanel(row).syncing" :disabled="row.status !== 1 || row.accountStatus !== 1" @click="syncMembers(row)">收集群成员</el-button>
								<span>最近成功同步：{{ memberPanel(row).lastSuccessfulSyncAt || '-' }}</span>
							</div>
							<el-alert v-if="memberPanel(row).error" :title="memberPanel(row).error" type="error" show-icon :closable="false" class="mb10" />
							<el-alert v-if="memberPanel(row).result" :title="memberPanel(row).result" type="success" show-icon :closable="false" class="mb10" />
							<el-table v-loading="memberPanel(row).loading" :data="memberPanel(row).list" border stripe max-height="420">
								<el-table-column label="头像" width="78" align="center"><template #default="{ row: member }"><el-avatar :size="34" :src="member.smallHeadImgUrl || member.bigHeadImgUrl">-</el-avatar></template></el-table-column>
								<el-table-column prop="displayName" label="群昵称" min-width="140"><template #default="{ row: member }">{{ member.displayName || '-' }}</template></el-table-column>
								<el-table-column prop="nickName" label="微信昵称" min-width="140"><template #default="{ row: member }">{{ member.nickName || '-' }}</template></el-table-column>
								<el-table-column prop="wxid" label="wxid" min-width="180" show-overflow-tooltip />
								<el-table-column prop="inviterUserName" label="邀请人" min-width="150"><template #default="{ row: member }">{{ member.inviterUserName || '-' }}</template></el-table-column>
								<el-table-column prop="memberFlag" label="memberFlag" width="110" />
								<el-table-column label="角色" min-width="180"><template #default="{ row: member }"><el-tag v-for="role in member.roles" :key="role" class="mr5">{{ role }}</el-tag><span v-if="!member.roles?.length">-</span></template></el-table-column>
								<el-table-column label="在群状态" width="105"><template #default="{ row: member }"><el-tag :type="member.isPresent ? 'success' : 'info'">{{ member.isPresent ? '在群' : '已离群' }}</el-tag></template></el-table-column>
								<el-table-column prop="firstSeenAt" label="首次同步发现" min-width="170" />
								<el-table-column prop="lastSeenAt" label="最近同步" min-width="170" />
								<el-table-column prop="leftAt" label="离群时间" min-width="170"><template #default="{ row: member }">{{ member.leftAt || '-' }}</template></el-table-column>
								<el-table-column prop="joinEventAt" label="入群事件时间" min-width="170"><template #default="{ row: member }">{{ member.joinEventAt || '-' }}</template></el-table-column>
							</el-table>
						</div>
					</template>
				</el-table-column>
				<el-table-column prop="groupName" label="微信群名称" min-width="160" show-overflow-tooltip />
				<el-table-column prop="hallNo" label="厅号" min-width="110" show-overflow-tooltip />
				<el-table-column prop="defaultPlatformCode" label="默认平台" min-width="110"><template #default="{row}">{{ platformName(row.defaultPlatformCode) }}</template></el-table-column>
				<el-table-column prop="defaultHallId" label="默认厅" min-width="100"><template #default="{row}">{{ hallName(row.defaultHallId) }}</template></el-table-column>
				<el-table-column prop="groupWxid" label="微信群wxid" min-width="180" show-overflow-tooltip />
				<el-table-column prop="robotName" label="绑定机器人" min-width="140" show-overflow-tooltip />
				<el-table-column prop="appId" label="机器人appId" min-width="170" show-overflow-tooltip />
				<el-table-column label="状态" width="100" align="center">
					<template #default="{ row }">
						<el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column label="排档" width="100"><template #default="{row}"><el-tag :type="row.runningStatus===1?'success':'info'">{{row.runningStatus===1?'运行中':'未启动'}}</el-tag></template></el-table-column>
				<el-table-column v-if="canReadFixedSchedule" label="固定档" width="150" align="center">
					<template #default="{ row }">
						<el-switch v-if="canSaveFixedSchedule" :model-value="row.fixedScheduleEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" :loading="Boolean(fixedScheduleSaving[row.id])" @change="toggleFixedSchedule(row, $event)" />
						<el-tag v-else :type="row.fixedScheduleEnabled === 1 ? 'success' : 'info'">{{ row.fixedScheduleEnabled === 1 ? '已开启' : '未开启' }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="remark" label="备注" min-width="180" show-overflow-tooltip />
				<el-table-column label="操作" width="410" fixed="right">
					<template #default="{ row }">
						<el-button v-if="canViewRobotConfig" v-auth="'api/v1/system/wechatRobotGroup/configOverview'" text type="primary" @click="openRobotConfig(row)">配置</el-button>
						<el-button v-auth="'api/v1/system/wechatRobotGroup/edit'" text type="primary" @click="openEdit(row)">编辑</el-button>
						<el-button v-auth-all="['api/v1/system/wechatRobotGroup/adminList', 'api/v1/system/wechatRobotGroup/queuePolicy']" text type="primary" @click="openPolicy(row)">管理员与排麦策略</el-button>
						<el-button v-auth="'api/v1/system/wechatRobotGroup/status'" text type="primary" @click="handleToggleStatus(row)">
							{{ row.status === 1 ? '停用' : '启用' }}
						</el-button>
						<el-button v-auth="'api/v1/system/wechatRobotGroup/runningStatus'" text :type="row.runningStatus===1?'danger':'success'" @click="toggleRunning(row)">{{row.runningStatus===1?'停止排档':'启动排档'}}</el-button>
					</template>
				</el-table-column>
			</el-table>
			</template>

			<template #default="{ row }">
				<div class="mobile-record-card__header">
					<div>
						<h3 class="mobile-record-card__title">{{ row.groupName }}</h3>
						<p class="mobile-record-card__subtitle">厅号 {{ row.hallNo || '-' }}</p>
					</div>
					<el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
				</div>
				<dl class="mobile-record-card__fields">
					<div><dt>绑定机器人</dt><dd>{{ row.robotName || '-' }}</dd></div>
					<div><dt>排档状态</dt><dd>{{ row.runningStatus === 1 ? '运行中' : '未启动' }}</dd></div>
					<div v-if="canReadFixedSchedule"><dt>固定档</dt><dd>{{ row.fixedScheduleEnabled === 1 ? '已开启' : '未开启' }}</dd></div>
				</dl>
				<details class="mobile-record-card__details">
					<summary>查看完整信息</summary>
					<dl class="mobile-record-card__fields">
						<div><dt>微信群 wxid</dt><dd>{{ row.groupWxid || '-' }}</dd></div>
						<div><dt>机器人 appId</dt><dd>{{ row.appId || '-' }}</dd></div>
						<div><dt>默认平台</dt><dd>{{ platformName(row.defaultPlatformCode) }}</dd></div>
						<div><dt>默认厅</dt><dd>{{ hallName(row.defaultHallId) }}</dd></div>
						<div><dt>备注</dt><dd>{{ row.remark || '-' }}</dd></div>
						<div v-if="canReadFixedSchedule"><dt>固定档设置</dt><dd><el-switch v-if="canSaveFixedSchedule" :model-value="row.fixedScheduleEnabled" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" :loading="Boolean(fixedScheduleSaving[row.id])" @change="toggleFixedSchedule(row, $event)" /><span v-else>{{ row.fixedScheduleEnabled === 1 ? '已开启' : '未开启' }}</span></dd></div>
					</dl>
					<div v-if="canListMembers" class="member-mobile-cards">
						<div class="group-member-toolbar">
							<el-switch v-model="memberPanel(row).includeLeft" active-text="包含已离群成员" @change="loadMembers(row, true)" />
							<el-button :loading="memberPanel(row).loading" @click="loadMembers(row)">加载群成员</el-button>
							<el-button v-if="canSyncMembers" v-auth="'api/v1/system/wechatRobotGroup/memberSync'" type="primary" :loading="memberPanel(row).syncing" :disabled="row.status !== 1 || row.accountStatus !== 1" @click="syncMembers(row)">收集群成员</el-button>
						</div>
						<el-alert v-if="memberPanel(row).error" :title="memberPanel(row).error" type="error" show-icon :closable="false" class="mb10" />
						<el-alert v-if="memberPanel(row).result" :title="memberPanel(row).result" type="success" show-icon :closable="false" class="mb10" />
						<p class="member-mobile-sync-time">最近成功同步：{{ memberPanel(row).lastSuccessfulSyncAt || '-' }}</p>
						<div v-for="member in memberPanel(row).list" :key="member.wxid" class="member-mobile-card">
							<strong>{{ member.displayName || member.nickName || '-' }}</strong>
							<dl class="mobile-record-card__fields">
								<div><dt>wxid</dt><dd>{{ member.wxid || '-' }}</dd></div>
								<div><dt>在群状态</dt><dd>{{ member.isPresent ? '在群' : '已离群' }}</dd></div>
								<div><dt>邀请人</dt><dd>{{ member.inviterUserName || '-' }}</dd></div>
								<div><dt>角色</dt><dd>{{ member.roles?.join('、') || '-' }}</dd></div>
								<div><dt>微信昵称</dt><dd>{{ member.nickName || '-' }}</dd></div>
								<div><dt>memberFlag</dt><dd>{{ member.memberFlag ?? '-' }}</dd></div>
								<div><dt>首次同步</dt><dd>{{ member.firstSeenAt || '-' }}</dd></div>
								<div><dt>最近同步</dt><dd>{{ member.lastSeenAt || '-' }}</dd></div>
								<div><dt>离群时间</dt><dd>{{ member.leftAt || '-' }}</dd></div>
								<div><dt>入群事件</dt><dd>{{ member.joinEventAt || '-' }}</dd></div>
							</dl>
						</div>
					</div>
				</details>
				<div class="mobile-record-card__actions">
					<el-button v-if="canViewRobotConfig" v-auth="'api/v1/system/wechatRobotGroup/configOverview'" type="primary" @click="openRobotConfig(row)">配置</el-button>
					<el-button v-auth="'api/v1/system/wechatRobotGroup/edit'" @click="openEdit(row)">编辑</el-button>
					<el-dropdown>
						<el-button>更多</el-button>
						<template #dropdown>
							<el-dropdown-menu>
								<el-dropdown-item><el-button v-auth-all="['api/v1/system/wechatRobotGroup/adminList', 'api/v1/system/wechatRobotGroup/queuePolicy']" text @click="openPolicy(row)">管理员与排麦策略</el-button></el-dropdown-item>
								<el-dropdown-item><el-button v-auth="'api/v1/system/wechatRobotGroup/status'" text @click="handleToggleStatus(row)">{{ row.status === 1 ? '停用' : '启用' }}</el-button></el-dropdown-item>
								<el-dropdown-item><el-button v-auth="'api/v1/system/wechatRobotGroup/runningStatus'" text :type="row.runningStatus === 1 ? 'danger' : 'success'" @click="toggleRunning(row)">{{ row.runningStatus === 1 ? '停止排档' : '启动排档' }}</el-button></el-dropdown-item>
							</el-dropdown-menu>
						</template>
					</el-dropdown>
				</div>
			</template>
			</MobileRecordList>

			<pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
		</el-card>

		<el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" destroy-on-close>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
				<el-row :gutter="20">
					<el-col :span="12">
						<el-form-item label="绑定机器人" prop="wechatRobotAccountId">
							<el-select v-model="form.wechatRobotAccountId" placeholder="请选择机器人" filterable class="w100">
								<el-option v-for="item in accountOptions" :key="item.value" :label="item.label" :value="item.value" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="微信群wxid" prop="groupWxid">
							<el-input v-model="form.groupWxid" placeholder="请输入微信群wxid" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="微信群名称" prop="groupName">
							<el-input v-model="form.groupName" placeholder="请输入微信群名称" />
						</el-form-item>
					</el-col>
					<el-col :span="12">
						<el-form-item label="厅号" prop="hallNo">
							<el-input v-model="form.hallNo" placeholder="未设置时定时播报显示未设置" />
						</el-form-item>
					</el-col>
					<el-col :span="12"><el-form-item label="默认平台"><el-select v-model="form.defaultPlatformCode" clearable class="w100"><el-option v-for="p in platformOptions" :key="p.code" :label="p.name" :value="p.code"/></el-select></el-form-item></el-col>
					<el-col :span="12"><el-form-item label="默认厅"><el-select v-model="form.defaultHallId" clearable class="w100"><el-option v-for="h in hallOptions" :key="h.hallId" :label="h.hallName" :value="h.hallId"/></el-select></el-form-item></el-col>
					<el-col :span="12">
						<el-form-item label="状态" prop="status">
							<el-select v-model="form.status" placeholder="请选择状态" class="w100">
								<el-option label="启用" :value="1" />
								<el-option label="停用" :value="0" />
							</el-select>
						</el-form-item>
					</el-col>
					<el-col :span="24">
						<el-form-item label="备注" prop="remark">
							<el-input v-model="form.remark" type="textarea" :rows="4" placeholder="请输入备注" />
						</el-form-item>
					</el-col>
				</el-row>
			</el-form>
			<template #footer>
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="saving" @click="submitForm">保存</el-button>
			</template>
		</el-dialog>

		<el-dialog v-model="policyVisible" :title="`${currentGroup.groupName || '微信群'}管理员与排麦策略`" width="760px" destroy-on-close>
			<el-alert title="管理员本人发送普通 p/P/排，仍为本人排麦；普通成员也可临时代发，但仅支持 @完整群昵称 p/P/排。" type="info" :closable="false" show-icon class="mb15" />
			<el-form :inline="true" label-width="92px" class="mb15">
				<el-form-item label="仅管理员排麦">
					<el-switch v-model="queuePolicyAdminOnly" :active-value="1" :inactive-value="0" active-text="开启" inactive-text="关闭" />
				</el-form-item>
				<el-form-item>
					<el-button v-auth="'api/v1/system/wechatRobotGroup/queuePolicySave'" type="primary" :loading="policySaving" @click="saveQueuePolicy">保存策略</el-button>
				</el-form-item>
			</el-form>

			<el-divider content-position="left">机器人管理员名单</el-divider>
			<el-form v-auth="'api/v1/system/wechatRobotGroup/adminSave'" :inline="true" :model="adminForm" class="mb15">
				<el-form-item label="成员 wxid"><el-input v-model="adminForm.memberWxid" placeholder="请输入成员 wxid" style="width: 230px" /></el-form-item>
				<el-form-item label="群内完整昵称"><el-input v-model="adminForm.memberName" placeholder="用于展示与代发匹配" style="width: 210px" /></el-form-item>
				<el-form-item><el-button type="primary" :loading="adminSaving" @click="saveAdmin">新增管理员</el-button></el-form-item>
			</el-form>
			<el-table v-loading="adminLoading" :data="admins" border stripe max-height="320">
				<el-table-column type="index" label="序号" width="70" />
				<el-table-column prop="memberName" label="群内完整昵称" min-width="220"><template #default="{ row }">{{ row.memberName || '-' }}</template></el-table-column>
				<el-table-column prop="memberWxid" label="成员 wxid" min-width="280" show-overflow-tooltip />
				<el-table-column label="操作" width="90" fixed="right"><template #default="{ row }"><el-button v-auth="'api/v1/system/wechatRobotGroup/adminDelete'" text type="danger" @click="deleteAdmin(row)">删除</el-button></template></el-table-column>
			</el-table>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
	addWechatRobotGroup,
	changeWechatRobotGroupStatus,
	changeWechatRobotGroupRunningStatus,
	deleteWechatRobotGroupAdmin,
	editWechatRobotGroup,
	getWechatRobotGroupAdmins,
	getWechatRobotGroupDetail,
	getWechatRobotGroupList,
	getWechatRobotGroupMemberList,
	getWechatRobotGroupFixedSchedule,
	getWechatRobotGroupQueuePolicy,
	saveWechatRobotGroupAdmin,
	saveWechatRobotGroupQueuePolicy,
	saveWechatRobotGroupFixedSchedule,
	syncWechatRobotGroupMembers,
} from '/@/api/wechatRobotGroup';
import { getWechatRobotAccountOptions } from '/@/api/wechatRobotAccount';
import { getAnchorHallOptions,getAnchorPlatformOptions } from '/@/api/anchor';
import { auth } from '/@/utils/authFunction';

defineOptions({ name: 'wechatRobotGroup' });

const router = useRouter();
const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增微信群');
const accountOptions = ref<any[]>([]);
const platformOptions = ref<any[]>([]); const hallOptions = ref<any[]>([]);
const policyVisible = ref(false);
const adminLoading = ref(false);
const adminSaving = ref(false);
const policySaving = ref(false);
const currentGroup = ref({ id: 0, groupName: '' });
const admins = ref<any[]>([]);
const queuePolicyAdminOnly = ref(0);
const adminForm = reactive({ memberWxid: '', memberName: '' });
const memberPanels = reactive<Record<number, any>>({});
const canListMembers = auth('api/v1/system/wechatRobotGroup/memberList');
const canSyncMembers = auth('api/v1/system/wechatRobotGroup/memberSync');
const canReadFixedSchedule = auth('api/v1/system/wechatRobotGroup/fixedSchedule');
const canSaveFixedSchedule = auth('api/v1/system/wechatRobotGroup/fixedScheduleSave');
const canViewRobotConfig = auth('api/v1/system/wechatRobotGroup/configOverview');
const fixedScheduleSaving = reactive<Record<number, boolean>>({});

const query = reactive({
	groupName: '',
	groupWxid: '',
	wechatRobotAccountId: '' as string | number,
	status: '' as string | number,
	pageNum: 1,
	pageSize: 10,
});

const openRobotConfig = (row: any) => router.push({ path: '/wechat/robotConfig', query: { groupId: row.id } });

const list = ref<any[]>([]);
const total = ref(0);

const createForm = () => ({
	id: 0,
	wechatRobotAccountId: '',
	groupWxid: '',
	groupName: '',
	hallNo: '',
	defaultPlatformCode: '',
	defaultHallId: '',
	status: 1,
	remark: '',
});

const form = reactive(createForm());

const rules: FormRules = {
	wechatRobotAccountId: [{ required: true, message: '机器人账号不能为空', trigger: 'change' }],
	groupWxid: [{ required: true, message: '微信群wxid不能为空', trigger: 'blur' }],
	groupName: [{ required: true, message: '微信群名称不能为空', trigger: 'blur' }],
	status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
};

const resetForm = () => {
	Object.assign(form, createForm());
	formRef.value?.clearValidate();
};

const loadAccounts = () => {
	getWechatRobotAccountOptions().then((res: any) => {
		accountOptions.value = res.data.list ?? [];
	});
};

const loadList = () => {
	loading.value = true;
	getWechatRobotGroupList(query)
		.then((res: any) => {
			list.value = res.data.list ?? [];
			total.value = res.data.total ?? 0;
		})
		.finally(() => {
			loading.value = false;
		});
};

const memberPanel = (row: any) => {
	if (!memberPanels[row.id]) {
		memberPanels[row.id] = { includeLeft: false, loading: false, syncing: false, list: [], error: '', result: '', loaded: false, lastSuccessfulSyncAt: '' };
	}
	return memberPanels[row.id];
};

const loadMembers = (row: any, force = false) => {
	if (!canListMembers) return;
	const panel = memberPanel(row);
	if (panel.loaded && !force) return;
	panel.loading = true;
	panel.error = '';
	getWechatRobotGroupMemberList(row.id, panel.includeLeft)
		.then((res: any) => {
			panel.list = res.data.list ?? [];
			panel.lastSuccessfulSyncAt = res.data.lastSuccessfulSyncAt ?? '';
			panel.loaded = true;
		})
		.catch((error: any) => {
			panel.error = error?.message || '加载本地成员列表失败';
		})
		.finally(() => {
			panel.loading = false;
		});
};

const handleMemberExpand = (row: any, expandedRows: any[]) => {
	if (!canListMembers) return;
	if (expandedRows.some((item) => item.id === row.id)) loadMembers(row);
};

const syncMembers = (row: any) => {
	const panel = memberPanel(row);
	panel.syncing = true;
	panel.error = '';
	panel.result = '';
	syncWechatRobotGroupMembers(row.id)
		.then((res: any) => {
			const result = res.data || {};
			panel.result = `收集成功：当前 ${result.memberCount ?? 0} 人，新增 ${result.added ?? 0}，更新 ${result.updated ?? 0}，恢复 ${result.restored ?? 0}，离群 ${result.left ?? 0}，已忽略 ${result.ignored ?? 0}`;
			panel.loaded = false;
			loadMembers(row, true);
		})
		.catch((error: any) => {
			panel.error = error?.message || '同步失败，已保留原成员快照';
		})
		.finally(() => {
			panel.syncing = false;
		});
};
const loadDefaults=async()=>{const [p,h]:any[]=await Promise.all([getAnchorPlatformOptions(),getAnchorHallOptions()]);platformOptions.value=p.data.list??[];hallOptions.value=h.data.list??[];};
const platformName=(code:string)=>platformOptions.value.find((p:any)=>p.code===code)?.name||code||'-'; const hallName=(id:number)=>hallOptions.value.find((h:any)=>h.hallId===id)?.hallName||'-';

const toggleFixedSchedule = async (row: any, enabled: number) => {
	if (!canSaveFixedSchedule || fixedScheduleSaving[row.id]) return;
	if (enabled === 0) {
		try {
			await ElMessageBox.confirm('关闭后会保留固定档成员配置，但之后新建档不再自动带入。确认关闭吗？', '关闭固定档', { type: 'warning' });
		} catch {
			return;
		}
	}
	fixedScheduleSaving[row.id] = true;
	try {
		await saveWechatRobotGroupFixedSchedule(row.id, enabled);
		const response: any = await getWechatRobotGroupFixedSchedule(row.id);
		row.fixedScheduleEnabled = response.data.enabled ?? 0;
		ElMessage.success(row.fixedScheduleEnabled === 1 ? '固定档已开启' : '固定档已关闭');
	} finally {
		fixedScheduleSaving[row.id] = false;
	}
};

const resetQuery = () => {
	query.groupName = '';
	query.groupWxid = '';
	query.wechatRobotAccountId = '';
	query.status = '';
	query.pageNum = 1;
	query.pageSize = 10;
	loadList();
};

const openAdd = () => {
	resetForm();
	dialogTitle.value = '新增微信群';
	dialogVisible.value = true;
};

const openEdit = (row: any) => {
	resetForm();
	dialogTitle.value = '编辑微信群';
	getWechatRobotGroupDetail(row.id).then((res: any) => {
		Object.assign(form, res.data.wechatRobotGroup || res.data || {});
		dialogVisible.value = true;
	});
};

const loadAdmins = () => {
	adminLoading.value = true;
	getWechatRobotGroupAdmins(currentGroup.value.id)
		.then((res: any) => {
			admins.value = res.data.list ?? [];
		})
		.finally(() => {
			adminLoading.value = false;
		});
};

const loadQueuePolicy = () => {
	getWechatRobotGroupQueuePolicy(currentGroup.value.id).then((res: any) => {
		queuePolicyAdminOnly.value = res.data.adminOnly ?? 0;
	});
};

const openPolicy = (row: any) => {
	currentGroup.value = { id: row.id, groupName: row.groupName };
	admins.value = [];
	queuePolicyAdminOnly.value = 0;
	adminForm.memberWxid = '';
	adminForm.memberName = '';
	policyVisible.value = true;
	loadAdmins();
	loadQueuePolicy();
};

const saveQueuePolicy = () => {
	policySaving.value = true;
	saveWechatRobotGroupQueuePolicy(currentGroup.value.id, queuePolicyAdminOnly.value)
		.then(() => {
			ElMessage.success('排麦策略保存成功');
		})
		.finally(() => {
			policySaving.value = false;
		});
};

const saveAdmin = () => {
	if (!adminForm.memberWxid.trim()) {
		ElMessage.error('成员 wxid 不能为空');
		return;
	}
	adminSaving.value = true;
	saveWechatRobotGroupAdmin({
		groupId: currentGroup.value.id,
		memberWxid: adminForm.memberWxid.trim(),
		memberName: adminForm.memberName.trim(),
	})
		.then(() => {
			ElMessage.success('管理员保存成功');
			adminForm.memberWxid = '';
			adminForm.memberName = '';
			loadAdmins();
		})
		.finally(() => {
			adminSaving.value = false;
		});
};

const deleteAdmin = (row: any) => {
	ElMessageBox.confirm(`确认删除管理员“${row.memberName || row.memberWxid}”吗？`, '提示', { type: 'warning' })
		.then(() => deleteWechatRobotGroupAdmin(currentGroup.value.id, row.memberWxid))
		.then(() => {
			ElMessage.success('删除成功');
			loadAdmins();
		})
		.catch(() => {});
};

const submitForm = () => {
	formRef.value?.validate((valid) => {
		if (!valid) return;
		saving.value = true;
		const request = form.id ? editWechatRobotGroup : addWechatRobotGroup;
		request(form)
			.then(() => {
				ElMessage.success(form.id ? '编辑成功' : '新增成功');
				dialogVisible.value = false;
				loadList();
			})
			.finally(() => {
				saving.value = false;
			});
	});
};

const handleToggleStatus = (row: any) => {
	const nextStatus = row.status === 1 ? 0 : 1;
	const text = nextStatus === 1 ? '启用' : '停用';
	ElMessageBox.confirm(`确认要${text}微信群“${row.groupName}”吗？`, '提示', { type: 'warning' })
		.then(() => changeWechatRobotGroupStatus(row.id, nextStatus))
		.then(() => {
			ElMessage.success(text + '成功');
			loadList();
		})
		.catch(() => {});
};
const toggleRunning=(row:any)=>{const next=row.runningStatus===1?0:1;ElMessageBox.confirm(`确认${next?'启动':'停止'}“${row.groupName}”排档？`,'排档状态',{type:'warning'}).then(()=>changeWechatRobotGroupRunningStatus(row.id,next)).then(()=>{ElMessage.success(next?'排档已启动':'排档已停止');loadList();}).catch(()=>{});};

onMounted(() => {
	loadAccounts();
	loadDefaults();
	loadList();
});
</script>

<style scoped>
.group-member-panel { padding: 12px 20px; }
.group-member-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.member-mobile-cards { display: grid; gap: 12px; }
.member-mobile-card { padding: 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; }
.member-mobile-sync-time { margin: 0; color: var(--el-text-color-secondary); }
</style>
