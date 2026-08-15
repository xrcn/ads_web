<template>
	<div class="anchor-manage-container">
		<el-card shadow="hover">
			<div class="anchor-manage-search mb15">
				<el-form :model="query" ref="queryRef" :inline="true" label-width="68px">
					<el-form-item label="主播ID" prop="anchorId">
						<el-input v-model="query.anchorId" placeholder="请输入主播ID" clearable style="width: 220px" />
					</el-form-item>
					<el-form-item label="主播昵称" prop="nickname">
						<el-input v-model="query.nickname" placeholder="请输入主播昵称" clearable style="width: 220px" />
					</el-form-item>
					<el-form-item label="手机号" prop="mobile">
						<el-input v-model="query.mobile" placeholder="请输入手机号" clearable style="width: 220px" />
					</el-form-item>
					<el-form-item label="所属厅" prop="hallId">
						<el-select v-model="query.hallId" placeholder="请选择所属厅" clearable style="width: 220px">
							<el-option v-for="item in hallOptions" :key="item.deptId" :label="item.deptName" :value="item.deptId" />
						</el-select>
					</el-form-item>
					<el-form-item label="状态" prop="status">
						<el-select v-model="query.status" placeholder="请选择状态" clearable style="width: 220px">
							<el-option label="正常" value="normal" />
							<el-option label="封号" value="banned" />
							<el-option label="离职" value="left" />
						</el-select>
					</el-form-item>
					<el-form-item>
						<el-button type="primary" @click="loadList">
							<el-icon><ele-Search /></el-icon>
							查询
						</el-button>
						<el-button @click="resetQuery">
							<el-icon><ele-Refresh /></el-icon>
							重置
						</el-button>
						<el-button type="success" plain @click="openAddDialog">
							<el-icon><ele-FolderAdd /></el-icon>
							新增主播
						</el-button>
					</el-form-item>
				</el-form>
			</div>
			<AnchorList ref="anchorListRef" :query="query" :hall-options="hallOptions" />
		</el-card>
	</div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import type { FormInstance } from 'element-plus';
import AnchorList from '/@/views/anchor/manage/component/anchorList.vue';
import { getAnchorHallOptions } from '/@/api/anchor';

defineOptions({ name: 'anchorManage' });

const queryRef = ref<FormInstance>();
const anchorListRef = ref();
const hallOptions = ref<any[]>([]);
const query = reactive({
	anchorId: '',
	nickname: '',
	mobile: '',
	hallId: '',
	status: '',
});

const loadHallOptions = () => {
	getAnchorHallOptions().then((res: any) => {
		hallOptions.value = res.data.list ?? [];
	});
};

const loadList = () => {
	anchorListRef.value?.loadList();
};

const openAddDialog = () => {
	anchorListRef.value?.openAddDialog();
};

const resetQuery = () => {
	queryRef.value?.resetFields();
	loadList();
};

onMounted(() => {
	loadHallOptions();
});
</script>
