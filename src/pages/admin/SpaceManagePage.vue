<template>
  <div id="spaceManagePage">
    <div class="page-header">
      <h2 class="page-title">
        <FolderOutlined />
        空间管理
      </h2>
      <a-space>
        <a-button type="primary" @click="goToCreateSpace">
          <template #icon><PlusOutlined /></template>
          创建空间
        </a-button>
        <a-button @click="goToAnalyzePublic">
          <template #icon><BarChartOutlined /></template>
          分析公共图库
        </a-button>
        <a-button @click="goToAnalyzeAll">
          <template #icon><PieChartOutlined /></template>
          分析全空间
        </a-button>
      </a-space>
    </div>

    <!-- 搜索表单 -->
    <div class="search-card">
      <a-form :model="searchParams" layout="inline" @finish="doSearch">
        <a-form-item label="空间名称">
          <a-input v-model:value="searchParams.spaceName" placeholder="请输入空间名称" allow-clear />
        </a-form-item>
        <a-form-item label="空间级别">
          <a-select
            v-model:value="searchParams.spaceLevel"
            placeholder="请选择空间级别"
            :options="SPACE_LEVEL_OPTIONS"
            style="min-width: 180px"
            allow-clear
          />
        </a-form-item>
        <a-form-item label="用户ID">
          <a-input v-model:value="searchParams.userId" placeholder="请输入用户ID" allow-clear />
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
          <template v-if="column.dataIndex === 'spaceLevel'">
            <a-tag :class="['level-tag', `level-${record.spaceLevel}`]">
              {{ SPACE_LEVEL_MAP[record.spaceLevel] }}
            </a-tag>
          </template>
          <template v-if="column.dataIndex === 'spaceUseInfo'">
            <div class="usage-info">
              <div class="usage-item">
                <span class="usage-label">容量</span>
                <a-progress
                  :percent="((record.totalSize / record.maxSize) * 100).toFixed(1)"
                  :show-info="false"
                  stroke-color="#667eea"
                  size="small"
                />
                <span class="usage-value">{{ formatSize(record.totalSize) }} / {{ formatSize(record.maxSize) }}</span>
              </div>
              <div class="usage-item">
                <span class="usage-label">数量</span>
                <span class="usage-value">{{ record.totalCount }} / {{ record.maxCount }}</span>
              </div>
            </div>
          </template>
          <template v-else-if="column.dataIndex === 'createTime'">
            {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}
          </template>
          <template v-else-if="column.dataIndex === 'editTime'">
            {{ dayjs(record.editTime).format('YYYY-MM-DD HH:mm') }}
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="goToEdit(record)">编辑</a-button>
              <a-button type="link" size="small" @click="goToAnalyze(record)">分析</a-button>
              <a-popconfirm
                title="确定删除该空间吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="doDelete(record)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { deleteSpaceUsingPost, listSpaceByPageUsingPost } from '@/api/spaceController.ts'
import { SPACE_LEVEL_MAP, SPACE_LEVEL_OPTIONS } from '@/constants/space.ts'
import { formatSize } from '@/utils'
import {
  BarChartOutlined,
  FolderOutlined,
  PieChartOutlined,
  PlusOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'

const router = useRouter()

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '空间名称', dataIndex: 'spaceName' },
  { title: '空间级别', dataIndex: 'spaceLevel', width: 100 },
  { title: '使用情况', dataIndex: 'spaceUseInfo', width: 200 },
  { title: '用户ID', dataIndex: 'userId', width: 80 },
  { title: '创建时间', dataIndex: 'createTime', width: 120 },
  { title: '编辑时间', dataIndex: 'editTime', width: 120 },
  { title: '操作', key: 'action', width: 180 },
]

const dataList = ref<API.Space[]>([])
const total = ref(0)

const searchParams = reactive<API.SpaceQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
})

const pagination = computed(() => ({
  current: searchParams.current,
  pageSize: searchParams.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
}))

onMounted(() => {
  fetchData()
})

const fetchData = async () => {
  const res = await listSpaceByPageUsingPost({ ...searchParams })
  if (res.data.code == 200 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
}

const doTableChange = (pagination: { current: number; pageSize: number }) => {
  searchParams.current = pagination.current
  searchParams.pageSize = pagination.pageSize
  fetchData()
}

const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

const doDelete = async (record: API.SpaceVO) => {
  const res = await deleteSpaceUsingPost({ id: record.id })
  if (res.data.code == 200) {
    message.success('删除成功')
    await fetchData()
  } else {
    message.error('删除失败，' + res.data.message)
  }
}

const goToCreateSpace = () => {
  router.push('/space/add_space')
}

const goToEdit = (record: API.Space) => {
  router.push(`/space/add_space?id=${record.id}`)
}

const goToAnalyze = (record: API.Space) => {
  router.push(`/space_analyze?spaceId=${record.id}`)
}

const goToAnalyzePublic = () => {
  router.push('/space_analyze?queryPublic=1')
}

const goToAnalyzeAll = () => {
  router.push('/space_analyze?queryAll=1')
}
</script>

<style scoped>
#spaceManagePage {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.level-tag {
  border-radius: 12px;
  border: none;
  padding: 2px 12px;
}

.level-tag.level-0 {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
}

.level-tag.level-1 {
  background: rgba(24, 144, 255, 0.3);
  color: #40a9ff;
}

.level-tag.level-2 {
  background: rgba(250, 173, 20, 0.3);
  color: #ffc53d;
}

.usage-info {
  font-size: 12px;
}

.usage-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.usage-label {
  color: rgba(255, 255, 255, 0.5);
  min-width: 32px;
}

.usage-value {
  color: rgba(255, 255, 255, 0.8);
}

.dark-table :deep(.ant-progress-bg) {
  background-color: #667eea !important;
}
</style>
