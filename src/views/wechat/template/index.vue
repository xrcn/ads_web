<template>
	<div class="wechat-message-template-container">
		<el-card shadow="hover">
			<MobileRecordList :data="list" :loading="loading" filter-summary="当前筛选" data-mobile-view="wechat-template">
			<template #filters>
			<el-form :model="query" inline label-width="88px" class="mb15">
				<el-form-item label="命令名称"><el-input v-model="query.commandName" clearable placeholder="请输入命令名称" @keyup.enter="loadList" /></el-form-item>
				<el-form-item label="触发口令"><el-input v-model="query.aliasText" clearable placeholder="请输入触发口令" @keyup.enter="loadList" /></el-form-item>
				<el-form-item label="绑定的微信群"><el-select v-model="query.groupId" clearable filterable placeholder="全部" style="width: 220px"><el-option v-for="item in groups" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
				<el-form-item label="类型"><el-select v-model="query.scopeType" clearable placeholder="全部" style="width: 140px"><el-option label="公共" value="PUBLIC" /><el-option label="群私有" value="GROUP" /></el-select></el-form-item>
				<el-form-item label="状态"><el-select v-model="query.status" clearable placeholder="全部" style="width: 140px"><el-option label="全部启用" value="ALL_ENABLED" /><el-option label="部分启用" value="PARTIAL_ENABLED" /><el-option label="全部停用" value="ALL_DISABLED" /></el-select></el-form-item>
				<el-form-item><el-button type="primary" @click="loadList">查询</el-button><el-button @click="resetQuery">重置</el-button><el-button v-auth="'api/v1/system/wechatMessageTemplate/groupAdd'" type="success" plain @click="openAdd">新增群私有模板</el-button></el-form-item>
			</el-form>
			</template>

			<template #desktop>
			<el-table v-loading="loading" :data="list" border stripe>
				<el-table-column type="expand" width="48">
					<template #default="{ row }">
						<div class="scenario-table-wrap">
							<el-table :data="row.scenarios" border size="small">
								<el-table-column label="回复场景" width="180"><template #default="scope"><span>{{ scenarioLabel(scope.row) }}</span></template></el-table-column>
								<el-table-column prop="eventKey" label="事件编码" min-width="210" />
								<el-table-column label="触发规则" min-width="170"><template #default="scope">{{ scope.row.triggerDescription || '-' }}</template></el-table-column>
								<el-table-column prop="content" label="回复模板" min-width="360" show-overflow-tooltip />
								<el-table-column label="状态" width="90" align="center"><template #default="scope"><el-tag :type="scope.row.status === 1 ? 'success' : 'info'">{{ scope.row.status === 1 ? '启用' : '停用' }}</el-tag></template></el-table-column>
								<el-table-column prop="updatedAt" label="更新时间" width="170" />
							</el-table>
						</div>
					</template>
				</el-table-column>
				<el-table-column type="index" label="序号" width="70" />
				<el-table-column prop="commandName" label="命令名称" min-width="130" />
				<el-table-column label="触发/命令" min-width="180"><template #default="{ row }"><span v-if="row.triggerKind === 'AUTO'">{{ row.triggerDescription || '自动触发' }}</span><span v-else>{{ compactCommandUsage(row.commandUsage) }}</span></template></el-table-column>
				<el-table-column label="场景数量" width="100" align="center"><template #default="{ row }">{{ row.scenarios?.length || 0 }}</template></el-table-column>
				<el-table-column label="类型" width="100" align="center"><template #default="{ row }"><el-tag :type="row.scopeType === 'PUBLIC' ? 'success' : 'warning'">{{ row.scopeType === 'PUBLIC' ? '公共' : '群私有' }}</el-tag></template></el-table-column>
				<el-table-column label="状态" width="110" align="center"><template #default="{ row }"><el-tag :type="groupStatusMeta(row.status).type">{{ groupStatusMeta(row.status).label }}</el-tag></template></el-table-column>
				<el-table-column label="生效微信群" min-width="180" show-overflow-tooltip><template #default="{ row }">{{ row.scopeType === 'PUBLIC' ? '全部微信群' : `${row.groupName || '-'}${row.groupWxid ? ` (${row.groupWxid})` : ''}` }}</template></el-table-column>
				<el-table-column prop="updatedAt" label="更新时间" width="170" />
				<el-table-column label="操作" width="220" fixed="right"><template #default="{ row }"><el-button v-auth="'api/v1/system/wechatMessageTemplate/groupEdit'" text type="primary" @click="openEdit(row)">编辑</el-button><el-button v-auth="'api/v1/system/wechatMessageTemplate/groupStatus'" text type="primary" @click="toggleStatus(row)">{{ row.status === 'ALL_DISABLED' ? '全部启用' : '全部停用' }}</el-button><el-button v-if="row.scopeType === 'PUBLIC'" v-auth="'api/v1/system/wechatMessageTemplate/groupReset'" text type="primary" @click="resetPublic(row)">恢复默认</el-button><el-button v-else v-auth="'api/v1/system/wechatMessageTemplate/groupDelete'" text type="danger" @click="deleteGroup(row)">删除</el-button></template></el-table-column>
			</el-table>
			</template>
			<template #default="{ row }">
				<div class="mobile-record-card__header"><div><h3 class="mobile-record-card__title">{{ row.commandName || '-' }}</h3><p class="mobile-record-card__subtitle">{{ row.triggerKind === 'AUTO' ? row.triggerDescription || '自动触发' : compactCommandUsage(row.commandUsage) }}</p></div><el-tag :type="groupStatusMeta(row.status).type">{{ groupStatusMeta(row.status).label }}</el-tag></div>
				<dl class="mobile-record-card__fields"><div><dt>类型</dt><dd>{{ row.scopeType === 'PUBLIC' ? '公共' : '群私有' }}</dd></div><div><dt>场景数量</dt><dd>{{ row.scenarios?.length || 0 }}</dd></div><div><dt>生效群</dt><dd>{{ row.scopeType === 'PUBLIC' ? '全部微信群' : row.groupName || '-' }}</dd></div></dl>
				<details class="mobile-record-card__details"><summary>查看完整信息</summary><dl class="mobile-record-card__fields"><div><dt>更新时间</dt><dd>{{ row.updatedAt || '-' }}</dd></div><div><dt>触发规则</dt><dd>{{ row.triggerDescription || '-' }}</dd></div></dl></details>
				<div class="mobile-record-card__actions"><el-button v-auth="'api/v1/system/wechatMessageTemplate/groupEdit'" type="primary" @click="openEdit(row)">编辑</el-button><el-button v-auth="'api/v1/system/wechatMessageTemplate/groupStatus'" @click="toggleStatus(row)">{{ row.status === 'ALL_DISABLED' ? '全部启用' : '全部停用' }}</el-button><el-dropdown><el-button>更多</el-button><template #dropdown><el-dropdown-menu><el-dropdown-item v-if="row.scopeType === 'PUBLIC'"><el-button v-auth="'api/v1/system/wechatMessageTemplate/groupReset'" text @click="resetPublic(row)">恢复默认</el-button></el-dropdown-item><el-dropdown-item v-else><el-button v-auth="'api/v1/system/wechatMessageTemplate/groupDelete'" text type="danger" @click="deleteGroup(row)">删除</el-button></el-dropdown-item></el-dropdown-menu></template></el-dropdown></div>
			</template>
			</MobileRecordList>
			<pagination v-show="total > 0" v-model:page="query.pageNum" v-model:limit="query.pageSize" :total="total" @pagination="loadList" />
		</el-card>

		<el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px" destroy-on-close>
			<el-form ref="formRef" :model="form" :rules="rules" label-width="110px">
				<el-form-item v-if="form.scopeType === 'GROUP' && !form.id" label="绑定微信群" prop="groupId"><el-select v-model="form.groupId" filterable class="w100" placeholder="请选择微信群"><el-option v-for="item in groups" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
				<el-form-item v-if="form.scopeType === 'GROUP' && !form.id" label="业务命令" prop="commandKey"><el-select v-model="form.commandKey" filterable class="w100" placeholder="请选择业务命令" @change="handleCommandChange"><el-option v-for="item in commandOptions" :key="item.commandKey" :label="item.commandName" :value="item.commandKey" /></el-select></el-form-item>
				<el-form-item label="命令名称"><el-input :model-value="form.commandName" disabled /></el-form-item>
				<el-form-item v-if="currentScenario?.triggerDescription || form.triggerDescription" label="触发规则"><span class="text-info">{{ currentScenario?.triggerDescription || form.triggerDescription }}</span></el-form-item>
				<el-form-item v-if="form.commandUsage" label="命令格式"><div class="command-usage">{{ form.commandUsage }}</div></el-form-item>
				<el-form-item label="触发口令"><el-select v-if="form.triggerKind !== 'AUTO'" v-model="form.aliases" multiple filterable allow-create default-first-option class="w100" placeholder="例如 p、P、排档" /><span v-else class="text-info">自动事件不支持口令配置</span></el-form-item>
				<el-form-item label="回复场景" required>
					<el-tabs v-model="activeEventKey" class="scenario-tabs w100">
						<el-tab-pane v-for="scenario in form.scenarios" :key="scenario.eventKey" :name="scenario.eventKey" :label="scenarioLabel(scenario)">
							<el-form-item label="回复模板" label-width="90px" required><el-input :ref="(input) => registerTemplateInput(scenario.eventKey, input)" v-model="scenario.content" type="textarea" :rows="8" placeholder="请输入回复模板" /></el-form-item>
							<el-form-item label="状态" label-width="90px"><el-switch v-model="scenario.status" :active-value="1" :inactive-value="0" /></el-form-item>
							<el-form-item label="全部变量" label-width="90px" class="variable-catalog"><el-tooltip v-for="item in variableCatalog" :key="item.name" :content="variableTooltip(scenario, item)" placement="top"><el-tag :class="['variable-tag', { 'variable-tag-unavailable': !isVariableAvailable(scenario, item.name) }]" :type="isVariableAvailable(scenario, item.name) ? 'primary' : 'info'" @click="insertVariable(scenario, item)">{{ variableToken(item.name) }} {{ item.label }}</el-tag></el-tooltip><span v-if="!variableCatalog.length" class="text-info">暂无变量目录</span></el-form-item>
							<el-form-item v-if="scenarioVariableErrors.get(scenario.eventKey)?.length" label="变量错误" label-width="90px"><div class="variable-errors"><div v-for="error in scenarioVariableErrors.get(scenario.eventKey)" :key="error.name">{{ error.message }}</div></div></el-form-item>
						</el-tab-pane>
					</el-tabs>
				</el-form-item>
				<el-form-item label="示例预览"><div class="preview-box">{{ previewContent || '选择场景后点击“预览”查看真实变量示例效果' }}</div></el-form-item>
			</el-form>
			<template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button :disabled="Boolean(currentScenario && scenarioVariableErrors.get(currentScenario.eventKey)?.length)" @click="preview">预览当前场景</el-button><el-button type="primary" :loading="saving" :disabled="hasVariableErrors" @click="submit">保存全部场景</el-button></template>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getWechatRobotGroupList } from '/@/api/wechatRobotGroup';
import {
	addWechatGroupMessageTemplateGroup,
	changeWechatMessageTemplateGroupStatus,
	deleteWechatGroupMessageTemplateGroup,
	editWechatMessageTemplateGroup,
	getWechatMessageTemplateGroupDetail,
	getWechatMessageTemplateList,
	getWechatMessageTemplateOptions,
	previewWechatMessageTemplate,
	resetWechatPublicMessageTemplateGroup,
} from '/@/api/wechatMessageTemplate';

defineOptions({ name: 'wechatMessageTemplate' });

type TemplateScenario = { id: number; eventKey: string; eventName: string; triggerDescription: string; content: string; status: number; variables: string[] };
type CommandOption = { commandKey: string; commandName: string; triggerKind: string; triggerDescription: string; commandUsage: string; scenarios: TemplateScenario[] };
type TemplateVariable = { name: string; label: string; description: string; example: string };
type VariableError = { name: string; message: string };

const formRef = ref<FormInstance>();
const loading = ref(false);
const saving = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增群私有模板');
const list = ref<any[]>([]);
const groups = ref<any[]>([]);
const options = ref<any[]>([]);
const variableCatalog = ref<TemplateVariable[]>([]);
const total = ref(0);
const previewContent = ref('');
const activeEventKey = ref('');
const query = reactive({ commandName: '', aliasText: '', groupId: '' as string | number, scopeType: '', status: '', pageNum: 1, pageSize: 10 });
const createForm = () => ({ id: 0, groupId: '' as string | number, commandKey: '', commandName: '', triggerKind: 'COMMAND', triggerDescription: '', commandUsage: '', scopeType: 'GROUP', aliases: [] as string[], scenarios: [] as TemplateScenario[] });
const form = reactive(createForm());
const rules: FormRules = { groupId: [{ required: true, message: '绑定微信群不能为空', trigger: 'change' }], commandKey: [{ required: true, message: '业务命令不能为空', trigger: 'change' }] };

const scenarioNames: Record<string, string> = {
	QUEUE_SELF_SUCCESS: '手速成功', QUEUE_SELF_SUPPLEMENT_SUCCESS: '补位成功', QUEUE_SELF_ALREADY: '已在麦位', QUEUE_SELF_FULL: '满排拒绝', QUEUE_SELF_CLOSED: '麦序已关闭', QUEUE_SELF_REJECTED: '排麦失败',
	TASK_BID_SUCCESS: '任务排成功', TASK_BID_TOPPED_SUCCESS: '任务排顶位成功', TASK_BID_UNFILLED_SUCCESS: '未满任务排成功', TASK_BID_BOSS_SUCCESS: 'P8老板位任务排成功', TASK_BID_INSUFFICIENT: '任务值不足', TASK_BID_SLOT_NOT_FOUND: '指定任务麦位不存在', TASK_BID_BOSS_RESERVED: 'P8老板位强制保留', TASK_BID_BOSS_INSUFFICIENT: 'P8老板位任务值不足', TASK_BID_REJECTED: '任务排失败',
	TAKE_QUEUE_SUCCESS: '取排成功', TAKE_QUEUE_NOT_FOUND: '没有可取麦序', TAKE_QUEUE_TASK_REJECTED: '取任务排拒绝', TAKE_QUEUE_GUEST_REJECTED: '取P8老板位拒绝', TAKE_QUEUE_ENDED_SUCCESS: '已结束档期取排', TAKE_QUEUE_MEMBER_NOT_FOUND: '指定成员未找到', TAKE_QUEUE_MEMBER_AMBIGUOUS: '指定成员昵称重名', TAKE_QUEUE_MEMBER_RESOLVE_FAILED: '指定成员解析失败',
	REPORT_START_SUCCESS: '报备成功', REPORT_NO_RUNNING_ROUND: '无运行中麦序', REPORT_NO_CURRENT_SLOT: '不在当前麦位', REPORT_DUPLICATE: '重复报备', REPORT_FULL: '报备人数已满', REPORT_RETURN_SUCCESS: '及时回厅成功', REPORT_RETURN_MISSING: '未找到有效报备', REPORT_EXPIRED: '报备到期提醒', REPORT_SET_MAX_COUNT_SUCCESS: '设置报备人数', REPORT_SET_MINUTES_SUCCESS: '设置报备时间', REPORT_SET_START_TEXT_SUCCESS: '设置报备开始文字', REPORT_SET_END_TEXT_SUCCESS: '设置报备结束文字', REPORT_CONFIG_UNAUTHORIZED: '报备配置权限不足',
	AUTO_CURRENT_ROUND_REPORT: '定时麦序播报', AUTO_NEXT_ROUND_REPORT: '下一档简版麦序', AUTO_ATTENDANCE_REPORT: '累计打卡记录',
	GROUP_MEMBER_JOIN: '成员入群', GROUP_MEMBER_LEAVE: '成员离群',
};
const scenarioName = (item: any) => scenarioNames[item.eventKey] || item.commandName;
const scenarioLabel = (scenario: Pick<TemplateScenario, 'eventName'>) => scenario.eventName;
const commandOptions = computed<CommandOption[]>(() => {
	const result = new Map<string, CommandOption>();
	for (const item of options.value) {
		let command = result.get(item.commandKey);
		if (!command) {
			command = { commandKey: item.commandKey, commandName: item.commandName, triggerKind: item.triggerKind, triggerDescription: item.triggerDescription, commandUsage: item.commandUsage, scenarios: [] };
			result.set(item.commandKey, command);
		} else if (command.triggerKind !== item.triggerKind) {
			command.triggerKind = 'COMMAND';
			command.triggerDescription = '';
		}
		command.scenarios.push({ id: 0, eventKey: item.eventKey, eventName: scenarioName(item), triggerDescription: item.triggerDescription, content: item.defaultContent, status: 1, variables: item.variables || [] });
	}
	return Array.from(result.values()).sort((left, right) => left.commandName.localeCompare(right.commandName, 'zh-CN'));
});

const variableToken = (name: string) => `{{${name}}}`;
const compactCommandUsage = (usage: string) => usage.replace(/\n/g, '↵');
const templateVariablePattern = /\{\{([A-Za-z][A-Za-z0-9]*)\}\}/g;
const templateIfOpenPattern = /\{\{#if ([A-Za-z][A-Za-z0-9]*)\}\}/g;
const templateControlPattern = /\{\{(?:#if [A-Za-z][A-Za-z0-9]*|\/if)\}\}/g;
const currentScenario = computed(() => form.scenarios.find((item) => item.eventKey === activeEventKey.value));
const isVariableAvailable = (scenario: TemplateScenario, name: string) => scenario.variables?.includes(name) === true;
const variableErrors = (scenario: TemplateScenario): VariableError[] => {
	const known = new Set(variableCatalog.value.map((item) => item.name));
	const names = [
		...Array.from(scenario.content.replace(templateControlPattern, '').matchAll(templateVariablePattern), (match) => match[1]),
		...Array.from(scenario.content.matchAll(templateIfOpenPattern), (match) => match[1]),
	];
	return Array.from(new Set(names)).flatMap((name) => {
		if (!known.has(name)) return [{ name, message: `${variableToken(name)} 系统未定义此模板变量` }];
		if (!isVariableAvailable(scenario, name)) return [{ name, message: `${variableToken(name)} 当前回复场景不提供此数据` }];
		return [];
	});
};
const scenarioVariableErrors = computed(() => {
	const errors = new Map<string, VariableError[]>();
	for (const scenario of form.scenarios) errors.set(scenario.eventKey, variableErrors(scenario));
	return errors;
});
const hasVariableErrors = computed(() => Array.from(scenarioVariableErrors.value.values()).some((errors) => errors.length > 0));
const templateInputRefs = new Map<string, { textarea?: HTMLTextAreaElement }>();
const registerTemplateInput = (eventKey: string, input: any) => {
	if (input?.textarea) templateInputRefs.set(eventKey, input);
	else templateInputRefs.delete(eventKey);
};
const insertVariable = async (scenario: TemplateScenario, variable: TemplateVariable) => {
	if (!isVariableAvailable(scenario, variable.name)) return;
	const token = variableToken(variable.name);
	const textarea = templateInputRefs.get(scenario.eventKey)?.textarea;
	if (!textarea) {
		scenario.content += token;
		return;
	}
	const start = textarea.selectionStart ?? scenario.content.length;
	const end = textarea.selectionEnd ?? start;
	scenario.content = `${scenario.content.slice(0, start)}${token}${scenario.content.slice(end)}`;
	await nextTick();
	textarea.focus();
	textarea.setSelectionRange(start + token.length, start + token.length);
};
const variableTooltip = (scenario: TemplateScenario, variable: TemplateVariable) => [variable.label, variable.description, `示例：${variable.example}`, !isVariableAvailable(scenario, variable.name) ? '当前回复场景不提供此数据' : ''].filter(Boolean).join('\n');
const groupStatusMeta = (status: string) => ({ ALL_ENABLED: { label: '全部启用', type: 'success' }, PARTIAL_ENABLED: { label: '部分启用', type: 'warning' }, ALL_DISABLED: { label: '全部停用', type: 'info' } }[status] || { label: status || '-', type: 'info' });
const loadGroups = () => getWechatRobotGroupList({ pageNum: 1, pageSize: 1000, status: 1 }).then((res: any) => { groups.value = (res.data.list || []).map((item: any) => ({ value: item.id, label: `${item.groupName} (${item.groupWxid})` })); });
const loadOptions = () => getWechatMessageTemplateOptions().then((res: any) => { options.value = res.data.list || []; variableCatalog.value = res.data.variables || []; });
const loadList = () => { loading.value = true; getWechatMessageTemplateList(query).then((res: any) => { list.value = res.data.list || []; total.value = res.data.total || 0; }).finally(() => { loading.value = false; }); };
const resetQuery = () => { Object.assign(query, { commandName: '', aliasText: '', groupId: '', scopeType: '', status: '', pageNum: 1, pageSize: 10 }); loadList(); };
const resetForm = () => { Object.assign(form, createForm()); activeEventKey.value = ''; previewContent.value = ''; formRef.value?.clearValidate(); };
const openAdd = () => { resetForm(); dialogTitle.value = '新增群私有模板'; dialogVisible.value = true; };
const openEdit = (row: any) => { resetForm(); getWechatMessageTemplateGroupDetail(row.id).then((res: any) => { Object.assign(form, res.data.wechatMessageTemplateCommandGroup || res.data || {}); activeEventKey.value = form.scenarios[0]?.eventKey || ''; dialogTitle.value = form.scopeType === 'PUBLIC' ? '编辑公共模板' : '编辑群私有模板'; dialogVisible.value = true; }); };
const handleCommandChange = (commandKey: string) => { const option = commandOptions.value.find((item) => item.commandKey === commandKey); if (!option) return; form.commandName = option.commandName; form.triggerKind = option.triggerKind; form.triggerDescription = option.triggerDescription; form.commandUsage = option.commandUsage; form.aliases = []; form.scenarios = option.scenarios.map((item) => ({ ...item, variables: [...item.variables] })); activeEventKey.value = form.scenarios[0]?.eventKey || ''; previewContent.value = ''; };
const preview = () => { const scenario = currentScenario.value; if (!scenario?.content) return; previewWechatMessageTemplate({ eventKey: scenario.eventKey, content: scenario.content }).then((res: any) => { previewContent.value = res.data.content || ''; }); };
const submit = () => formRef.value?.validate((valid) => { if (!valid) return; if (hasVariableErrors.value) { ElMessage.error('请先修正模板变量错误'); return; } if (!form.scenarios.length || form.scenarios.some((item) => !item.content.trim())) { ElMessage.error('所有回复场景的模板内容都不能为空'); return; } saving.value = true; const request = form.id ? editWechatMessageTemplateGroup : addWechatGroupMessageTemplateGroup; request(form).then(() => { ElMessage.success('保存成功'); dialogVisible.value = false; loadList(); }).finally(() => { saving.value = false; }); });
const toggleStatus = (row: any) => changeWechatMessageTemplateGroupStatus({ id: row.id, status: row.status === 'ALL_DISABLED' ? 1 : 0 }).then(() => { ElMessage.success('整组状态已更新'); loadList(); });
const resetPublic = (row: any) => ElMessageBox.confirm('将恢复该业务命令的全部默认场景与公共口令，确认继续吗？', '提示', { type: 'warning' }).then(() => resetWechatPublicMessageTemplateGroup(row.id)).then(() => { ElMessage.success('已恢复默认'); loadList(); }).catch(() => {});
const deleteGroup = (row: any) => ElMessageBox.confirm('删除后该群的此业务命令将整体回退公共模板，确认继续吗？', '提示', { type: 'warning' }).then(() => deleteWechatGroupMessageTemplateGroup(row.id)).then(() => { ElMessage.success('已回退公共模板'); loadList(); }).catch(() => {});

onMounted(() => { loadGroups(); loadOptions(); loadList(); });
</script>

<style scoped lang="scss">
.scenario-table-wrap { padding: 12px 24px; background: var(--el-fill-color-light); }
.scenario-tabs { min-width: 0; }
.preview-box { white-space: pre-wrap; min-height: 44px; width: 100%; padding: 10px 12px; border: 1px solid var(--el-border-color); border-radius: 4px; color: var(--el-text-color-regular); background: var(--el-fill-color-lighter); }
.command-usage { white-space: pre-wrap; }
.variable-catalog :deep(.el-form-item__content) { gap: 8px; }
.variable-tag { cursor: pointer; }
.variable-tag-unavailable { cursor: not-allowed; opacity: 0.65; }
.variable-errors { color: var(--el-color-danger); line-height: 1.6; }
</style>
