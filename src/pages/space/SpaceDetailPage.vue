<template>
  <div id="spaceDetailPage">
    <!-- 空间信息卡片 -->
    <div class="space-header">
      <div class="space-info">
        <div class="space-title">
          <h2>{{ space.spaceName }}</h2>
          <a-tag class="space-tag">私有空间</a-tag>
        </div>
        <div class="space-stats">
          <div class="stat-item">
            <div class="stat-label">图片数量</div>
            <div class="stat-value">{{ total }} / {{ space.maxCount || 0 }}</div>
            <a-progress
              :percent="Math.min((total / (space.maxCount || 1)) * 100, 100)"
              :show-info="false"
              stroke-color="#667eea"
              trail-color="rgba(255,255,255,0.1)"
            />
          </div>
          <div class="stat-item">
            <div class="stat-label">存储空间</div>
            <div class="stat-value">
              {{ formatSize(space.totalSize) }} / {{ formatSize(space.maxSize) }}
            </div>
            <a-tooltip :title="`占用空间 ${formatSize(space.totalSize)} / ${formatSize(space.maxSize)}`">
              <a-progress
                type="circle"
                :percent="Math.min((((space.totalSize ?? 0) * 100) / (space.maxSize ?? 1)), 100)"
                :size="60"
                :stroke-width="8"
                :stroke-color="getStorageColor(space.totalSize, space.maxSize)"
                trail-color="rgba(255,255,255,0.1)"
              />
            </a-tooltip>
          </div>
        </div>
      </div>
      <div class="space-actions">
        <a-space direction="vertical" :size="12">
          <a-button
            type="primary"
            size="large"
            @click="goToAddPicture"
            block
          >
            <template #icon><PlusOutlined /></template>
            创建图片
          </a-button>
          <a-button size="large" @click="doBatchEdit" block>
            <template #icon><EditOutlined /></template>
            批量编辑
          </a-button>
          <a-button
            type="primary"
            ghost
            size="large"
            @click="goToAnalyze"
            block
          >
            <template #icon><BarChartOutlined /></template>
            空间分析
          </a-button>
        </a-space>
      </div>
    </div>

    <!-- 搜索表单 -->
    <div class="filter-section">
      <PictureSearchForm :on-search="onSearch" :is-admin="false" />
    </div>

    <!-- 按颜色搜索 -->
    <div class="color-filter">
      <a-form-item label="按颜色搜索">
        <color-picker format="hex" @pureColorChange="onColorChange" />
      </a-form-item>
    </div>

    <!-- 图片列表 -->
    <MasonryPictureList
      :dataList="dataList"
      :loading="loading"
      :showOps="true"
      :total="total"
      :currentPage="searchParams.current"
      :pageSize="searchParams.pageSize"
      :hasMore="hasMore"
      :onLoadMore="loadMore"
      :onPageChange="onPageChange"
      :onReload="fetchData"
    />
  </div>

  <BatchEditPictureModal
    ref="batchEditPictureModalRef"
    :spaceId="id"
    :pictureList="dataList"
    :onSuccess="onBatchEditPictureSuccess"
  />
</template>

<script setup lang="ts">
import {
  listPictureVoByPageUsingPost,
  searchPictureByColorUsingPost,
} from '@/api/pictureController.ts'
import { getSpaceVoByIdUsingGet } from '@/api/spaceController.ts'
import BatchEditPictureModal from '@/components/BatchEditPictureModel.vue'
import MasonryPictureList from '@/components/MasonryPictureList.vue'
import PictureSearchForm from '@/components/PictureSearchForm.vue'
import { formatSize } from '@/utils'
import {
  BarChartOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ColorPicker } from 'vue3-colorpicker'
import 'vue3-colorpicker/style.css'

const props = defineProps<{
  id: number
}>()
const space = ref<API.SpaceVO>({})
const router = useRouter()

// 获取空间详情
const fetchSpaceDetail = async () => {
  try {
    const res = await getSpaceVoByIdUsingGet({
      id: props.id as number,
    })
    if (res.data.code === 200 && res.data.data) {
      space.value = res.data.data
    } else {
      message.error('获取空间详情失败，' + res.data.message)
    }
  } catch (e: unknown) {
    if (e instanceof Error) {
      message.error('获取空间详情失败：' + e.message)
    }
  }
}

// 数据
const dataList = ref<API.PictureVO[]>([])
const total = ref(0)
const loading = ref(true)
const hasMore = ref(true)
const isLoadingMore = ref(false)

// 搜索条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 20,
  sortField: 'createTime',
  sortOrder: 'descend',
  spaceId: props.id,
})

/**
 * 加载更多数据
 */
const loadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true
  searchParams.current++
  const res = await listPictureVoByPageUsingPost({ ...searchParams })

  if (res.data.data) {
    const newRecords = res.data.data.records ?? []
    dataList.value = [...dataList.value, ...newRecords]
    total.value = res.data.data.total ?? 0
    hasMore.value = dataList.value.length < total.value
  }

  isLoadingMore.value = false
}

/**
 * 分页参数
 */
const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  fetchData(false)
}

/**
 * 获取数据
 */
const fetchData = async (resetPage = true) => {
  loading.value = true
  if (resetPage) {
    searchParams.current = 1
  }
  dataList.value = []

  const res = await listPictureVoByPageUsingPost({ ...searchParams })

  if (res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
    hasMore.value = dataList.value.length < total.value
  } else {
    message.error('获取数据失败，' + res.data.message)
  }

  loading.value = false
}

// 页面加载时请求一次
onMounted(() => {
  fetchSpaceDetail()
  fetchData()
})

// 搜索
const onSearch = (newSearchParams: API.PictureQueryRequest) => {
  searchParams.current = 1
  searchParams.pageSize = 20
  Object.assign(searchParams, newSearchParams)
  fetchData()
}

/**
 * 切换颜色触发事件
 */
const onColorChange = async (color: string) => {
  loading.value = true
  dataList.value = []

  const res = await searchPictureByColorUsingPost({
    picColor: color,
    spaceId: props.id as number,
  })

  if (res.data.code === 200 && res.data.data) {
    const data = res.data.data ?? []
    dataList.value = data
    total.value = data.length
    hasMore.value = false
  } else {
    message.error('获取数据失败，' + res.data.message)
  }

  loading.value = false
}

// 批量编辑弹窗引用
const batchEditPictureModalRef = ref()

// 批量编辑成功后，刷新数据
const onBatchEditPictureSuccess = () => {
  fetchData()
}

// 打开批量编辑弹窗
const doBatchEdit = () => {
  if (batchEditPictureModalRef.value) {
    batchEditPictureModalRef.value.openModal()
  }
}

// 跳转到创建图片页
const goToAddPicture = () => {
  router.push({
    path: '/picture/add_picture',
    query: { spaceId: props.id }
  })
}

// 跳转到空间分析页
const goToAnalyze = () => {
  router.push({
    path: '/space_analyze',
    query: { spaceId: props.id }
  })
}

/**
 * 获取存储进度条颜色
 */
const getStorageColor = (used: number, total: number) => {
  const percent = (used / total) * 100
  if (percent < 50) return '#52c41a'
  if (percent < 80) return '#faad14'
  return '#ff4d4f'
}
</script>

<style scoped>
#spaceDetailPage {
  min-height: 100vh;
  padding-bottom: 40px;
}

/* 空间头部 */
.space-header {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 28px;
  margin: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  gap: 32px;
  align-items: stretch;
}

.space-info {
  flex: 1;
}

.space-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.space-title h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.space-tag {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%) !important;
  border: 1px solid rgba(102, 126, 234, 0.4) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  font-size: 13px;
  padding: 4px 14px;
  border-radius: 14px;
}

/* 空间统计 */
.space-stats {
  display: flex;
  gap: 48px;
}

.stat-item {
  flex: 1;
  max-width: 220px;
}

.stat-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.stat-value {
  font-size: 22px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
}

/* 空间操作 */
.space-actions {
  min-width: 180px;
}

.space-actions :deep(.ant-btn) {
  border-radius: 12px !important;
  height: 48px !important;
  font-size: 15px !important;
  font-weight: 500 !important;
}

.space-actions :deep(.ant-btn-primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
}

.space-actions :deep(.ant-btn-primary:not(.ant-btn-background-ghost)) {
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.space-actions :deep(.ant-btn-background-ghost) {
  border-color: #667eea !important;
  color: #667eea !important;
}

/* 筛选区域 */
.filter-section {
  background: rgba(26, 26, 46, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  margin: 0 24px 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* 颜色筛选 */
.color-filter {
  background: rgba(26, 26, 46, 0.4);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 16px;
  margin: 0 24px 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: center;
}

.color-filter :deep(.ant-form-item-label > label) {
  color: rgba(255, 255, 255, 0.7);
}

/* 响应式 */
@media (max-width: 768px) {
  .space-header {
    flex-direction: column;
    margin: 16px;
    padding: 20px;
  }

  .space-stats {
    flex-direction: column;
    gap: 20px;
  }

  .stat-item {
    max-width: none;
  }

  .filter-section,
  .color-filter {
    margin-left: 16px;
    margin-right: 16px;
  }

  .space-actions {
    min-width: auto;
  }
}
</style>
