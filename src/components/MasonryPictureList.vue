<template>
  <div class="masonry-picture-list" ref="scrollContainer">
    <!-- 模式切换 -->
    <div class="mode-switch">
      <a-radio-group v-model:value="loadMode" button-style="solid" size="small">
        <a-radio-button value="infinite">
          <template #icon><SyncOutlined :spin="loading" /></template>
          无限滚动
        </a-radio-button>
        <a-radio-button value="pagination">
          <template #icon><UnorderedListOutlined /></template>
          分页
        </a-radio-button>
      </a-radio-group>
    </div>

    <!-- 骨架屏 -->
    <div v-if="loading && dataList.length === 0" class="skeleton-grid">
      <div v-for="i in 16" :key="i" class="skeleton-card">
        <div class="skeleton-image"></div>
        <a-skeleton active :paragraph="{ rows: 1 }" />
      </div>
    </div>

    <!-- 瀑布流网格 -->
    <div v-else class="masonry-grid" :style="gridStyle">
      <div
        v-for="(picture, index) in dataList"
        :key="picture.id"
        class="masonry-item"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <div class="picture-card" @click="doClickPicture(picture)">
          <!-- 图片容器 -->
          <div class="image-wrapper">
            <img
              :alt="picture.name"
              :src="picture.thumbnailUrl ?? picture.url"
              loading="lazy"
              @load="handleImageLoad"
              @error="handleImageError"
            />
            <!-- 图片信息覆盖层 -->
            <div class="info-overlay">
              <div class="overlay-content">
                <div class="picture-name">{{ picture.name }}</div>
                <div class="picture-meta">
                  <span v-if="picture.picWidth && picture.picHeight">
                    {{ picture.picWidth }} × {{ picture.picHeight }}
                  </span>
                  <span v-if="picture.picSize">
                    {{ formatSize(picture.picSize) }}
                  </span>
                </div>
                <div class="picture-tags" v-if="picture.tags && picture.tags.length > 0">
                  <a-tag
                    v-for="tag in picture.tags.slice(0, 2)"
                    :key="tag"
                    size="small"
                    color="white"
                    style="background: rgba(255,255,255,0.2); border: none;"
                  >
                    {{ tag }}
                  </a-tag>
                </div>
              </div>
              <!-- 快捷操作按钮 -->
              <div class="action-buttons">
                <a-tooltip title="以图搜图">
                  <a-button
                    type="primary"
                    shape="circle"
                    :icon="h(SearchOutlined)"
                    size="small"
                    @click="(e) => doSearch(picture, e)"
                  />
                </a-tooltip>
                <a-tooltip title="分享">
                  <a-button
                    type="primary"
                    shape="circle"
                    :icon="h(ShareAltOutlined)"
                    size="small"
                    @click="(e) => doShare(picture, e)"
                  />
                </a-tooltip>
                <template v-if="showOps">
                  <a-tooltip title="编辑">
                    <a-button
                      type="primary"
                      shape="circle"
                      :icon="h(EditOutlined)"
                      size="small"
                      @click="(e) => doEdit(picture, e)"
                    />
                  </a-tooltip>
                  <a-tooltip title="删除">
                    <a-button
                      danger
                      shape="circle"
                      :icon="h(DeleteOutlined)"
                      size="small"
                      @click="(e) => doDelete(picture, e)"
                    />
                  </a-tooltip>
                </template>
              </div>
            </div>
            <!-- 分类标签 -->
            <div class="category-tag" v-if="picture.category">
              <a-tag color="cyan" size="small">{{ picture.category }}</a-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无限滚动加载更多 -->
    <div v-if="loadMode === 'infinite'" class="infinite-loader" ref="loaderRef">
      <div v-if="hasMore">
        <a-spin tip="加载更多..." />
      </div>
      <div v-else-if="dataList.length > 0" class="no-more">
        <span class="divider"></span>
        <span class="text">没有更多了</span>
        <span class="divider"></span>
      </div>
    </div>

    <!-- 分页 -->
    <div v-else-if="loadMode === 'pagination'" class="pagination-wrapper">
      <a-pagination
        :current="currentPage"
        :page-size="pageSize"
        :total="total"
        :show-size-changer="true"
        :show-quick-jumper="true"
        :show-total="(total) => `共 ${total} 张`"
        @change="onPageChange"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && dataList.length === 0" class="empty-state">
      <a-empty description="暂无图片">
        <template #image>
          <div class="empty-icon">
            <PictureOutlined style="font-size: 64px; color: #d9d9d9;" />
          </div>
        </template>
      </a-empty>
    </div>

    <ShareModel ref="shareModalRef" :link="shareLink" :title="'分享图片'" />
  </div>
</template>

<script setup lang="ts">
import { deletePictureUsingPost } from '@/api/pictureController.ts'
import {
  DeleteOutlined,
  EditOutlined,
  PictureOutlined,
  SearchOutlined,
  ShareAltOutlined,
  SyncOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { h, computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import ShareModel from '@/components/ShareModel.vue'

interface Props {
  dataList?: API.PictureVO[]
  loading?: boolean
  showOps?: boolean
  columnCount?: number
  gap?: number
  total?: number
  currentPage?: number
  pageSize?: number
  hasMore?: boolean
  onLoadMore?: () => void
  onReload?: () => void
  onPageChange?: (page: number, pageSize: number) => void
}

const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  showOps: false,
  columnCount: 5,
  gap: 12,
  total: 0,
  currentPage: 1,
  pageSize: 20,
  hasMore: true,
  onLoadMore: () => {},
  onReload: () => {},
  onPageChange: () => {},
})

// 加载模式：infinite | pagination
const loadMode = ref<'infinite' | 'pagination'>('infinite')

// 滚动容器引用
const scrollContainer = ref<HTMLElement>()
const loaderRef = ref<HTMLElement>()

// Intersection Observer for infinite scroll
let observer: IntersectionObserver | null = null

// 监听加载模式变化，切换时触发刷新
watch(loadMode, () => {
  props.onReload?.()
})

// 设置 Intersection Observer
const setupIntersectionObserver = () => {
  if (loadMode.value !== 'infinite' || !loaderRef.value) return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && props.hasMore && !props.loading) {
          props.onLoadMore?.()
        }
      })
    },
    {
      rootMargin: '200px',
      threshold: 0.1,
    }
  )

  if (loaderRef.value) {
    observer.observe(loaderRef.value)
  }
}

// 清理 Observer
const cleanupObserver = () => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
}

// 监听加载模式变化
watch(
  () => [loadMode.value, loaderRef.value],
  () => {
    cleanupObserver()
    setupIntersectionObserver()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  cleanupObserver()
})

// 计算网格样式
const gridStyle = computed(() => {
  return {
    '--column-count': props.columnCount,
    '--gap': `${props.gap}px`,
  }
})

// 图片加载处理
const handleImageLoad = () => {
  // 图片加载完成
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  if (target) {
    target.style.opacity = '0.5'
  }
}

// 格式化文件大小
const formatSize = (bytes: number): string => {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// 跳转至图片详情
const router = useRouter()
const doClickPicture = (picture: API.PictureVO) => {
  router.push({
    path: `/picture/${picture.id}`,
  })
}

// 编辑
const doEdit = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  router.push({
    path: '/picture/add_picture',
    query: {
      id: picture.id,
      spaceId: picture.spaceId,
    },
  })
}

// 删除
const doDelete = async (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除 "${picture.name}" 吗？`,
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      const id = picture.id
      if (!id) {
        return
      }
      const res = await deletePictureUsingPost({ id })
      if (res.data.code === 200) {
        message.success('删除成功')
        props?.onReload()
      } else {
        message.error('删除失败')
      }
    },
  })
}

// 以图搜图
const doSearch = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  window.open(`/picture/search_picture?pictureId=${picture.id}`)
}

// 分享弹窗引用
const shareModalRef = ref()
// 分享链接
const shareLink = ref<string>('')
// 分享
const doShare = (picture: API.PictureVO, e: Event) => {
  e.stopPropagation()
  shareLink.value = `${window.location.protocol}//${window.location.host}/picture/${picture.id}`
  if (shareModalRef.value) {
    shareModalRef.value.openModal()
  }
}
</script>

<style scoped>
.masonry-picture-list {
  padding: 0;
  min-height: calc(100vh - 200px);
}

/* 模式切换 */
.mode-switch {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 12px 0;
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.mode-switch :deep(.ant-radio-group) {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 2px;
}

.mode-switch :deep(.ant-radio-button-wrapper) {
  border: none;
  border-radius: 6px;
  padding: 6px 16px;
  transition: all 0.2s;
}

.mode-switch :deep(.ant-radio-button-wrapper-checked) {
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mode-switch :deep(.ant-radio-button-wrapper:first-child) {
  border-radius: 6px 0 0 6px;
}

.mode-switch :deep(.ant-radio-button-wrapper:last-child) {
  border-radius: 0 6px 6px 0;
}

/* 骨架屏 */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 16px;
}

.skeleton-card {
  background: transparent;
}

.skeleton-image {
  width: 100%;
  aspect-ratio: 16/9;
  background: linear-gradient(90deg, #f5f5f5 25%, #e8e8e8 50%, #f5f5f5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8px;
  margin-bottom: 12px;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* 瀑布流网格 */
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(var(--column-count, 5), 1fr);
  gap: var(--gap, 12px);
  padding: 16px;
}

@media (min-width: 1800px) {
  .masonry-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (max-width: 1600px) {
  .masonry-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 1400px) {
  .masonry-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1100px) {
  .masonry-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .masonry-grid {
    grid-template-columns: repeat(2, 1fr);
    padding: 12px;
    gap: 10px;
  }
}

@media (max-width: 480px) {
  .masonry-grid {
    grid-template-columns: 1fr;
  }
}

/* 卡片项动画 */
.masonry-item {
  animation: fadeInUp 0.5s ease-out backwards;
  break-inside: avoid;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 图片卡片 */
.picture-card {
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
}

.picture-card:hover {
  transform: translateY(-8px);
}

/* 图片容器 */
.image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 16/10;
  overflow: hidden;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.1) 0%,
    transparent 30%,
    transparent 70%,
    rgba(0, 0, 0, 0.3) 100%
  );
  pointer-events: none;
  z-index: 1;
}

.picture-card:hover .image-wrapper {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 0;
}

.picture-card:hover .image-wrapper img {
  transform: scale(1.08);
}

/* 信息覆盖层 */
.info-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.6) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.image-wrapper:hover .info-overlay {
  opacity: 1;
}

.overlay-content {
  transform: translateY(8px);
  transition: transform 0.3s ease;
}

.image-wrapper:hover .overlay-content {
  transform: translateY(0);
}

.picture-name {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.picture-meta {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.picture-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

/* 快捷操作按钮 */
.action-buttons {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transform: translateX(12px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 3;
}

.image-wrapper:hover .action-buttons {
  opacity: 1;
  transform: translateX(0);
}

.action-buttons .ant-btn {
  width: 36px;
  height: 36px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-buttons .ant-btn:hover {
  background: rgba(24, 144, 255, 0.9);
  border-color: rgba(24, 144, 255, 0.9);
  transform: scale(1.1);
}

.action-buttons .ant-btn.ant-btn-dangerous:hover {
  background: rgba(255, 77, 79, 0.9);
  border-color: rgba(255, 77, 79, 0.9);
}

/* 分类标签 */
.category-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 3;
}

.category-tag :deep(.ant-tag) {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* 无限滚动加载 */
.infinite-loader {
  display: flex;
  justify-content: center;
  padding: 24px;
  align-items: center;
}

.no-more {
  display: flex;
  align-items: center;
  gap: 16px;
  color: #999;
  font-size: 14px;
}

.no-more .divider {
  width: 80px;
  height: 1px;
  background: linear-gradient(to right, transparent, #ddd, transparent);
}

.no-more .text {
  white-space: nowrap;
}

/* 分页容器 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 32px 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  margin: 16px;
}

/* 空状态 */
.empty-state {
  padding: 80px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.empty-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.empty-icon :deep(.anticon) {
  color: #fff !important;
}

/* 按钮样式 */
:deep(.ant-btn-sm) {
  font-size: 14px;
}
</style>
