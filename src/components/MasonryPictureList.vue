<template>
  <div class="masonry-picture-list" ref="scrollContainer">
    <!-- 模式切换 -->
    <div class="mode-switch">
      <div class="mode-switch-inner">
        <a-radio-group v-model:value="loadMode" button-style="solid" size="small">
          <a-radio-button value="infinite">
            <template #icon><ThunderboltOutlined :spin="loading" /></template>
            无限滚动
          </a-radio-button>
          <a-radio-button value="pagination">
            <template #icon><UnorderedListOutlined /></template>
            分页
          </a-radio-button>
        </a-radio-group>
      </div>
    </div>

    <!-- 骨架屏 -->
    <div v-if="loading && dataList.length === 0" class="skeleton-grid">
      <div v-for="i in 20" :key="i" class="skeleton-card">
        <div class="skeleton-image" :style="{ height: `${120 + Math.random() * 100}px` }">
          <div class="skeleton-shimmer"></div>
        </div>
        <div class="skeleton-content">
          <div class="skeleton-line" style="width: 70%"></div>
          <div class="skeleton-line" style="width: 40%"></div>
        </div>
      </div>
    </div>

    <!-- 瀑布流网格 -->
    <div v-else class="masonry-grid" :style="gridStyle">
      <div
        v-for="(picture, index) in dataList"
        :key="picture.id"
        class="masonry-item"
        :style="{ animationDelay: `${index * 30}ms` }"
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

            <!-- 渐变遮罩 -->
            <div class="image-gradient"></div>

            <!-- 顶部标签 -->
            <div class="top-tags">
              <div class="category-badge" v-if="picture.category">
                {{ picture.category }}
              </div>
            </div>

            <!-- 悬浮信息层 -->
            <div class="hover-layer">
              <div class="hover-content">
                <div class="picture-title">{{ picture.name }}</div>
                <div class="picture-meta">
                  <span v-if="picture.picWidth && picture.picHeight">
                    <PictureOutlined /> {{ picture.picWidth }} × {{ picture.picHeight }}
                  </span>
                  <span v-if="picture.picSize">
                    <FileOutlined /> {{ formatSize(picture.picSize) }}
                  </span>
                </div>
                <div class="picture-tags" v-if="picture.tags && picture.tags.length > 0">
                  <a-tag
                    v-for="tag in picture.tags.slice(0, 3)"
                    :key="tag"
                    class="meta-tag"
                  >
                    {{ tag }}
                  </a-tag>
                  <span v-if="picture.tags.length > 3" class="more-tags">
                    +{{ picture.tags.length - 3 }}
                  </span>
                </div>
              </div>

              <!-- 快捷操作 -->
              <div class="quick-actions">
                <div class="action-btn" @click="(e) => doSearch(picture, e)">
                  <SearchOutlined />
                </div>
                <div class="action-btn" @click="(e) => doShare(picture, e)">
                  <ShareAltOutlined />
                </div>
                <template v-if="showOps">
                  <div class="action-btn" @click="(e) => doEdit(picture, e)">
                    <EditOutlined />
                  </div>
                  <div class="action-btn danger" @click="(e) => doDelete(picture, e)">
                    <DeleteOutlined />
                  </div>
                </template>
              </div>
            </div>

            <!-- 收藏按钮 -->
            <div class="favorite-btn" @click.stop>
              <HeartOutlined />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无限滚动加载更多 -->
    <div v-if="loadMode === 'infinite'" class="infinite-loader" ref="loaderRef">
      <div v-if="hasMore" class="loading-spinner">
        <div class="spinner"></div>
        <span>加载更多...</span>
      </div>
      <div v-else-if="dataList.length > 0" class="no-more">
        <div class="no-more-decor">
          <span class="line"></span>
          <span class="diamond"></span>
          <span class="line"></span>
        </div>
        <span class="no-more-text">已经到底啦</span>
        <div class="no-more-decor">
          <span class="line"></span>
          <span class="diamond"></span>
          <span class="line"></span>
        </div>
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
        :show-total="(total) => `共 ${total} 张图片`"
        @change="onPageChange"
        class="custom-pagination"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && dataList.length === 0" class="empty-state">
      <div class="empty-icon">
        <PictureOutlined />
      </div>
      <div class="empty-text">暂无图片</div>
      <div class="empty-hint">换个关键词试试吧</div>
    </div>

    <ShareModel ref="shareModalRef" :link="shareLink" :title="'分享图片'" />
  </div>
</template>

<script setup lang="ts">
import { deletePictureUsingPost } from '@/api/pictureController.ts'
import {
  DeleteOutlined,
  EditOutlined,
  FileOutlined,
  HeartOutlined,
  PictureOutlined,
  SearchOutlined,
  ShareAltOutlined,
  ThunderboltOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { h, computed, ref, watch, onBeforeUnmount } from 'vue'
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
  columnCount: 6,
  gap: 16,
  total: 0,
  currentPage: 1,
  pageSize: 20,
  hasMore: true,
  onLoadMore: () => {},
  onReload: () => {},
  onPageChange: () => {},
})

// 加载模式
const loadMode = ref<'infinite' | 'pagination'>('infinite')

// 滚动容器引用
const scrollContainer = ref<HTMLElement>()
const loaderRef = ref<HTMLElement>()

// Intersection Observer
let observer: IntersectionObserver | null = null

// 监听加载模式变化
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
      rootMargin: '300px',
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
const handleImageLoad = () => {}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  if (target) {
    target.style.opacity = '0.3'
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
    okButtonProps: { danger: true },
    onOk: async () => {
      const id = picture.id
      if (!id) return
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

// 分享
const shareModalRef = ref()
const shareLink = ref<string>('')
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
  padding: 20px;
  min-height: calc(100vh - 200px);
}

/* 模式切换 */
.mode-switch {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.mode-switch-inner {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  padding: 12px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mode-switch-inner :deep(.ant-radio-group) {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 3px;
}

.mode-switch-inner :deep(.ant-radio-button-wrapper) {
  border: none !important;
  border-radius: 10px !important;
  padding: 8px 20px;
  color: rgba(255, 255, 255, 0.6) !important;
  background: transparent !important;
  transition: all 0.3s ease;
}

.mode-switch-inner :deep(.ant-radio-button-wrapper:hover) {
  color: rgba(255, 255, 255, 0.9) !important;
}

.mode-switch-inner :deep(.ant-radio-button-wrapper-checked) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: #fff !important;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

/* 骨架屏 */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.skeleton-card {
  background: rgba(26, 26, 46, 0.6);
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.skeleton-image {
  position: relative;
  background: rgba(102, 126, 234, 0.1);
  overflow: hidden;
}

.skeleton-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.skeleton-content {
  padding: 16px;
}

.skeleton-line {
  height: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  margin-bottom: 8px;
}

/* 瀑布流网格 */
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(var(--column-count, 6), 1fr);
  gap: var(--gap, 16px);
}

@media (min-width: 1800px) {
  .masonry-grid { grid-template-columns: repeat(7, 1fr); }
}

@media (max-width: 1600px) {
  .masonry-grid { grid-template-columns: repeat(6, 1fr); }
}

@media (max-width: 1400px) {
  .masonry-grid { grid-template-columns: repeat(5, 1fr); }
}

@media (max-width: 1100px) {
  .masonry-grid { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 768px) {
  .masonry-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .masonry-picture-list { padding: 12px; }
}

@media (max-width: 480px) {
  .masonry-grid { grid-template-columns: repeat(2, 1fr); }
}

/* 卡片项动画 */
.masonry-item {
  animation: cardFadeIn 0.6s ease-out backwards;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 图片卡片 */
.picture-card {
  cursor: pointer;
  border-radius: 16px;
  overflow: hidden;
  background: rgba(26, 26, 46, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.picture-card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.4),
    0 0 40px rgba(102, 126, 234, 0.15);
}

/* 图片容器 */
.image-wrapper {
  position: relative;
  aspect-ratio: 3/4;
  overflow: hidden;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.picture-card:hover .image-wrapper img {
  transform: scale(1.1);
}

/* 渐变遮罩 */
.image-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    transparent 40%,
    rgba(0, 0, 0, 0.7) 100%
  );
  pointer-events: none;
  z-index: 1;
}

/* 顶部标签 */
.top-tags {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 3;
}

.category-badge {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 悬浮层 */
.hover-layer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.3) 0%,
    transparent 20%,
    transparent 50%,
    rgba(0, 0, 0, 0.8) 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 16px;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.picture-card:hover .hover-layer {
  opacity: 1;
}

.hover-content {
  transform: translateY(10px);
  transition: transform 0.3s ease;
}

.picture-card:hover .hover-content {
  transform: translateY(0);
}

.picture-title {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.picture-meta {
  display: flex;
  gap: 12px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  margin-bottom: 8px;
}

.picture-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.picture-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.meta-tag {
  background: rgba(255, 255, 255, 0.15) !important;
  border: none !important;
  color: rgba(255, 255, 255, 0.9) !important;
  border-radius: 12px !important;
  padding: 2px 10px;
  font-size: 10px;
}

.more-tags {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
}

/* 快捷操作 */
.quick-actions {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
  z-index: 4;
}

.picture-card:hover .quick-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transform: scale(1.15);
}

.action-btn.danger:hover {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
}

/* 收藏按钮 */
.favorite-btn {
  position: absolute;
  bottom: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 4;
  opacity: 0;
}

.picture-card:hover .favorite-btn {
  opacity: 1;
}

.favorite-btn:hover {
  color: #ff6b6b;
  transform: scale(1.2);
}

/* 无限滚动加载 */
.infinite-loader {
  display: flex;
  justify-content: center;
  padding: 40px;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: rgba(255, 255, 255, 0.6);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(102, 126, 234, 0.2);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.no-more {
  display: flex;
  align-items: center;
  gap: 20px;
}

.no-more-decor {
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-more-decor .line {
  width: 40px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2));
}

.no-more-decor .diamond {
  width: 6px;
  height: 6px;
  background: rgba(102, 126, 234, 0.5);
  transform: rotate(45deg);
}

.no-more-text {
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  background: rgba(26, 26, 46, 0.4);
  border-radius: 20px;
  margin: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.custom-pagination :deep(.ant-pagination-item) {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.custom-pagination :deep(.ant-pagination-item a) {
  color: rgba(255, 255, 255, 0.7);
}

.custom-pagination :deep(.ant-pagination-item:hover) {
  border-color: #667eea;
}

.custom-pagination :deep(.ant-pagination-item-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
}

.custom-pagination :deep(.ant-pagination-item-active a) {
  color: #fff;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
}

.empty-icon {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-icon .anticon {
  font-size: 48px;
  color: rgba(102, 126, 234, 0.6);
}

.empty-text {
  color: rgba(255, 255, 255, 0.8);
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.empty-hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}
</style>
