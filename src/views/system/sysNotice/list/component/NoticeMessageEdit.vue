<template>
  <div class="system-sysNotice-edit">
    <!-- 添加或修改私信对话框 -->
    <el-dialog v-model="isShowDialog" width="800px" :close-on-click-modal="false" :destroy-on-close="true">
      <template #header>
        <div v-drag="['.system-sysNotice-edit .el-dialog', '.system-sysNotice-edit .el-dialog__header']">
          <span style="font-weight: 500;font-size: 18px;color: rgb(31 34 37);"> {{
              (!formData.id || formData.id == 0 ? '发送' : '修改') + title
            }} </span>
        </div>
      </template>
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入标题"/>
        </el-form-item>
        <el-form-item v-if="formData.type==2" label="接收用户">
          <el-select
              style="width: 100%;"
              v-model="formData.receiver"
              multiple
              filterable
              remote
              reserve-keyword
              placeholder="可输入要指定的用户名称搜索"
              :remote-method="remoteUserMethod"
              :loading="loading"
              @visible-change="handleSelectVisible"
          >
            <el-option
                v-for="item in userListOptions"
                :key="item.id"
                :label="item.userNickname"
                :value="item.id"
            />
            <template #footer>
              <div class="select-dropdown-footer">
                <el-button v-if="hasMoreUsers" type="primary" link @click="loadMoreUsers" :loading="loading">{{ loading ? '加载中...' : '加载更多' }}</el-button>
                <span v-else class="no-more-text">没有更多数据</span>
              </div>
            </template>
          </el-select>
        </el-form-item>
        <el-form-item label="标签" prop="tag">
          <el-select v-model="formData.tag" placeholder="请选择标签">
            <el-option
                v-for="dict in tagOptions"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <gf-ueditor editorId="ueSysNoticeContent" v-model="formData.content"></gf-ueditor>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <!--          <el-radio-group v-model="formData.status">
                      <el-radio>请选择字典生成</el-radio>
                    </el-radio-group>-->
          <el-switch
              v-model="formData.status"
              style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
              :active-value="1"
              :inactive-value="0"
              active-text="正常"
              inactive-text="停用"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input show-word-limit maxlength="200" v-model="formData.remark" type="textarea" placeholder="请输入备注"/>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number type="num" v-model="formData.sort"/>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="onSubmit" :disabled="loading">确 定</el-button>
          <el-button @click="onCancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import {reactive, onMounted, toRefs, defineComponent, ref, unref, getCurrentInstance} from 'vue';
import { ElMessage} from 'element-plus';
import {
  getSysNotice,
  addSysNotice,
  updateSysNotice, getUserList,
} from "/@/api/system/notice/sysNotice";
import GfUeditor from "/@/components/ueditor/index.vue"
import {
  SysNoticeInfoData,
  SysNoticeEditState
} from "/@/views/system/sysNotice/list/component/model"
defineOptions({ name: "NoticeMessageEdit"})
const props = defineProps({
  tagOptions: {
    type: Array,
    default: () => []
  },
})
const emit = defineEmits(["sysNoticeList"]);
const {proxy} = <any>getCurrentInstance()
const formRef = ref<HTMLElement | null>(null);
const menuRef = ref();
const state = reactive<SysNoticeEditState>({
  loading: false,
  isShowDialog: false,
  title: "",
  userListOptions: [],
  userSearchQuery: "",
  userPageNum: 1,
  userPageSize: 10,
  hasMoreUsers: false,
  selectVisible: false,
  formData: {
    id: undefined,
    receiver: undefined,
    title: undefined,
    type: undefined,
    tag: undefined,
    content: undefined,
    remark: undefined,
    sort: undefined,
    status: 0,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    deletedAt: undefined,
  },

  // 表单校验
  rules: {
    id: [
      {required: true, message: "ID不能为空", trigger: "blur"}
    ],
    title: [
      {required: true, message: "标题不能为空", trigger: "blur"}
    ],
    type: [
      {required: true, message: "类型不能为空", trigger: "blur"}
    ],
    content: [
      {required: true, message: "内容不能为空", trigger: "blur"}
    ],
    status: [
      {required: true, message: "状态不能为空", trigger: "blur"}
    ],
  }
});
const { isShowDialog,formData,loading,userListOptions,rules,title,userSearchQuery,userPageNum,userPageSize,hasMoreUsers,selectVisible} = toRefs(state)
onMounted(() => {
  // 初始化时不加载用户列表，等到下拉框打开时再加载
});
// 打开弹窗
const openDialog = (row?: SysNoticeInfoData) => {
  resetForm();
  if (row) {
    getSysNotice(row.id!).then((res: any) => {
      const data = res.data;
      data.type = parseInt(data.type)
      if(data.type===2&&data.receiverUser){
        const userListOptions = [...state.userListOptions,...data.receiverUser]
        let uniqueSet = new Set(userListOptions.map(item => item.id));
        state.userListOptions = userListOptions.filter((value, index, self) => {
          return uniqueSet.has(value.id) && uniqueSet.delete(value.id)
        });
      }
      data.tag = '' + data.tag
      data.status = parseInt(data.status)
      state.formData = data;
    })
  }
  state.isShowDialog = true;
};
// 处理下拉框显示状态变化
const handleSelectVisible = (visible: boolean) => {
  state.selectVisible = visible;
  if (visible && state.userListOptions.length === 0) {
    // 下拉框打开且没有数据时，加载第一页数据
    state.userPageNum = 1;
    loadUserList();
  }
};

// 已移除滚动事件处理函数

// 加载更多用户
const loadMoreUsers = () => {
  if (state.loading || !state.hasMoreUsers) return;
  state.userPageNum++;
  console.log('点击加载更多，当前页码：', state.userPageNum);
  loadUserList(false);
};

// 加载用户列表
const loadUserList = (replace: boolean = true) => {
  state.loading = true;
  const params = {
    userNickname: state.userSearchQuery,
    pageNum: state.userPageNum,
    pageSize: state.userPageSize
  };

  getUserList(params).then((res: any) => {
    if (res.code === 0 && res.data) {
      const userList = res.data.userList || [];
      const total = res.data.total || 0;

      // 判断是否有更多数据
      state.hasMoreUsers = state.userPageNum * state.userPageSize < total;

      // 替换或追加数据
      if (replace) {
        state.userListOptions = userList;
      } else {
        // 合并数据并去重
        const newList = [...state.userListOptions, ...userList];
        const uniqueIds = new Set();
        state.userListOptions = newList.filter(item => {
          if (uniqueIds.has(item.id)) return false;
          uniqueIds.add(item.id);
          return true;
        });
      }
    } else {
      ElMessage.error(res.message || '获取用户列表失败');
    }
  }).catch(error => {
    console.error('获取用户列表出错:', error);
    ElMessage.error('获取用户列表失败');
  }).finally(() => {
    state.loading = false;
  });
};

// 远程搜索方法
const remoteUserMethod = (query: string) => {
  state.userSearchQuery = query;
  state.userPageNum = 1; // 重置页码
  state.userListOptions = []; // 清空现有数据
  loadUserList();
};
//设置类型
const setType = (type: number) => {
  state.formData.type = type
  if (type == 1) {
    state.title = "通知"
  } else if (type == 2) {
    state.title = "私信"
  }
};

// 关闭弹窗
const closeDialog = () => {
  state.isShowDialog = false;
};
// 取消
const onCancel = () => {
  closeDialog();
};
// 提交
const onSubmit = () => {
  const formWrap = unref(formRef) as any;
  if (!formWrap) return;
  formWrap.validate((valid: boolean) => {
    if (valid) {
      state.loading = true;
      if (!state.formData.id || state.formData.id === 0) {
        //添加
        addSysNotice(state.formData).then(() => {
          ElMessage.success('添加成功');
          closeDialog(); // 关闭弹窗
          emit('sysNoticeList')
        }).finally(() => {
          state.loading = false;
        })
      } else {
        //修改
        updateSysNotice(state.formData).then(() => {
          ElMessage.success('修改成功');
          closeDialog(); // 关闭弹窗
          emit('sysNoticeList')
        }).finally(() => {
          state.loading = false;
        })
      }
    }
  });
};
const resetForm = () => {
  state.formData = {
    receiver: undefined,
    type: undefined,
    id: undefined,
    title: undefined,
    tag: undefined,
    content: undefined,
    remark: undefined,
    sort: 0,
    status: 1,
    createdBy: undefined,
    updatedBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
    deletedAt: undefined
  }
};
//富文本编辑器内容
const setContentEditContent = (data: string) => {
  state.formData.content = data
}
defineExpose({openDialog,setType})
</script>
<style scoped>
.kv-label {
  margin-bottom: 15px;
  font-size: 14px;
}

.mini-btn i.el-icon {
  margin: unset;
}

.kv-row {
  margin-bottom: 12px;
}

.select-dropdown-footer {
  padding: 8px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  height: 36px;
  line-height: 20px;
  box-sizing: border-box;
}

.select-dropdown-footer .no-more-text {
  color: #909399;
  font-size: 13px;
}
</style>
