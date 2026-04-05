<template>
  <div id="userManagePage">
    <div class="page-header">
      <h2 class="page-title">
        <TeamOutlined />
        用户管理
      </h2>
    </div>

    <!-- 搜索表单 -->
    <div class="search-card">
      <a-form :model="searchParams" layout="inline" @finish="doSearch">
        <a-form-item label="账号">
          <a-input v-model:value="searchParams.userAccount" placeholder="请输入账号" allow-clear />
        </a-form-item>
        <a-form-item label="用户名">
          <a-input v-model:value="searchParams.userName" placeholder="请输入用户名" allow-clear />
        </a-form-item>
        <a-form-item label="用户角色">
          <a-select v-model:value="searchParams.userRole" style="width: 120px">
            <a-select-option value="">全部</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
            <a-select-option value="user">普通用户</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">
            <template #icon><SearchOutlined /></template>
            搜索
          </a-button>
        </a-form-item>
      </a-form>
    </div>

    <!-- 数据表格 -->
    <div class="table-card">
      <a-table
        :columns="columns"
        :data-source="dataList"
        :pagination="pagination"
        @change="doTableChange"
        class="dark-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'userAvatar'">
            <a-avatar :src="record.userAvatar" :size="44" class="user-avatar" />
          </template>
          <template v-else-if="column.dataIndex === 'userRole'">
            <a-tag v-if="record.userRole === 'admin'" class="role-tag admin">管理员</a-tag>
            <a-tag v-else class="role-tag user">普通用户</a-tag>
          </template>
          <template v-if="column.dataIndex === 'createTime'">
            {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-popconfirm
              title="确定删除该用户吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="doDelete(record)"
              ok-button-props="{ danger: true }"
            >
              <a-button danger size="small">
                <template #icon><DeleteOutlined /></template>
                删除
              </a-button>
            </a-popconfirm>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { deleteUserUsingPost, listUserVoByPageUsingPost } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { DeleteOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons-vue'

// 定义列
const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '账号', dataIndex: 'userAccount' },
  { title: '用户名', dataIndex: 'userName' },
  { title: '头像', dataIndex: 'userAvatar', width: 80 },
  { title: '简介', dataIndex: 'userProfile', ellipsis: true },
  { title: '角色', dataIndex: 'userRole', width: 100 },
  { title: '创建时间', dataIndex: 'createTime', width: 180 },
  { title: '操作', key: 'action', width: 100 },
]

const dataList = ref<API.UserVO[]>([])
const total = ref(0)

const searchParams = reactive<API.UserQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'ascend',
})

const pagination = computed(() => ({
  current: searchParams.current,
  pageSize: searchParams.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (total: any) => `共 ${total} 条`,
}))

onMounted(() => {
  fetchData()
})

const fetchData = async () => {
  const res = await listUserVoByPageUsingPost({ ...searchParams })
  if (res.data.code == 200 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
}

const doTableChange = (pagination: any) => {
  searchParams.current = pagination.current
  searchParams.pageSize = pagination.pageSize
  fetchData()
}

const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

const doDelete = async (record: API.UserVO) => {
  const res = await deleteUserUsingPost({ id: record.id })
  if (res.data.code == 200) {
    message.success('删除成功')
    await fetchData()
  } else {
    message.error('删除失败，' + res.data.message)
  }
}
</script>

<style scoped>
#userManagePage {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.search-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.search-card :deep(.ant-form-item-label > label) {
  color: rgba(255, 255, 255, 0.7);
}

.search-card :deep(.ant-input),
.search-card :deep(.ant-select-selector) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: #fff !important;
}

.search-card :deep(.ant-input::placeholder) {
  color: rgba(255, 255, 255, 0.3);
}

.table-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.dark-table :deep(.ant-table) {
  background: transparent !important;
}

.dark-table :deep(.ant-table-thead > tr > th) {
  background: rgba(102, 126, 234, 0.15) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.dark-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: rgba(255, 255, 255, 0.8) !important;
}

.dark-table :deep(.ant-table-tbody > tr:hover > td) {
  background: rgba(102, 126, 234, 0.1) !important;
}

.dark-table :deep(.ant-pagination) {
  margin-top: 20px;
}

.dark-table :deep(.ant-pagination-item) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.dark-table :deep(.ant-pagination-item a) {
  color: rgba(255, 255, 255, 0.7);
}

.dark-table :deep(.ant-pagination-item-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
}

.dark-table :deep(.ant-pagination-item-active a) {
  color: #fff;
}

.user-avatar {
  border: 2px solid rgba(102, 126, 234, 0.3);
}

.role-tag {
  border-radius: 12px;
  padding: 2px 12px;
  border: none;
}

.role-tag.admin {
  background: linear-gradient(135deg, rgba(82, 196, 26, 0.3) 0%, rgba(82, 196, 26, 0.2) 100%);
  color: #52c41a;
}

.role-tag.user {
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.3) 0%, rgba(24, 144, 255, 0.2) 100%);
  color: #1890ff;
}
</style>
