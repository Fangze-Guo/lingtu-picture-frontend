<template>
  <div class="masonry-picture-list">
    <!-- 加载骨架屏 -->
    <div v-if="loading && dataList.length === 0" class="skeleton-grid">
      <div v-for="i in 12" :key="i" class="skeleton-card">
        <a-skeleton active :paragraph="{ rows: 2 }" />
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
        <a-card
          hoverable
          class="picture-card"
          :bordered="false"
          @click="doClickPicture(picture)"
        >
          <!-- 图片容器 -->
          <div class="image-container">
            <img
              :alt="picture.name"
              :src="picture.thumbnailUrl ?? picture.url"
              loading="lazy"
              @load="handleImageLoad(index)"
            />
            <!-- 遮罩层 -->
            <div class="image-overlay">
              <a-space :size="8">
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
              </a-space>
            </div>
          </div>

          <!-- 卡片内容 -->
          <template #title>
            <div class="card-title">
              <a-typography-paragraph
                :ellipsis="{ rows: 1, tooltip: picture.name }"
                :content="picture.name"
              />
            </div>
          </template>

          <template #extra>
            <div class="card-extra">
              <a-tag color="green" size="small">
                {{ picture.category ?? '默认' }}
              </a-tag>
            </div>
          </template>

          <template v-if="showOps" #actions>
            <search-outlined @click="(e) => doSearch(picture, e)" />
            <share-alt-outlined @click="(e) => doShare(picture, e)" />
            <edit-outlined @click="(e) => doEdit(picture, e)" />
            <delete-outlined @click="(e) => doDelete(picture, e)" />
          </template>

          <!-- 底部信息 -->
          <div class="card-footer">
            <a-space :size="4" wrap>
              <a-tag
                v-for="tag in (picture.tags || []).slice(0, 3)"
                :key="tag"
                size="small"
                color="blue"
              >
                {{ tag }}
              </a-tag>
              <a-tag v-if="(picture.tags || []).length > 3" size="small">
                +{{ (picture.tags || []).length - 3 }}
              </a-tag>
            </a-space>
          </div>
        </a-card>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="loading && dataList.length > 0" class="loading-more">
      <a-spin tip="加载中..." />
    </div>

    <!-- 空状态 -->
    <a-empty v-if="!loading && dataList.length === 0" description="暂无图片" />

    <ShareModel ref="shareModalRef" :link="shareLink" :title="'分享图片'" />
  </div>
</template>

<script setup lang="ts">
import { deletePictureUsingPost } from '@/api/pictureController.ts'
import { DeleteOutlined, EditOutlined, SearchOutlined, ShareAltOutlined } from '@ant-design/icons-vue'
import { message, Modal } from 'ant-design-vue'
import { h, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import ShareModel from '@/components/ShareModel.vue'

interface Props {
  dataList?: API.PictureVO[]
  loading?: boolean
  showOps?: boolean
  columnCount?: number
  gap?: number
  onReload?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  showOps: false,
  columnCount: 4,
  gap: 16,
  onReload: () => {},
})

// 计算网格样式
const gridStyle = computed(() => {
  return {
    '--column-count': props.columnCount,
    '--gap': `${props.gap}px`,
  }
})

// 图片加载处理
const handleImageLoad = (index: number) => {
  // 可以在这里添加图片加载完成的逻辑
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
        // 让外层刷新
        props?.onReload()
      } else {
        message.error('删除失败')
      }
    },
  })
  const id = picture.id
  if (!id) {
    return
  }
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
  padding: 16px;
}

/* 骨架屏样式 */
.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
}

.skeleton-card {
  padding: 16px;
  border-radius: 12px;
  background: #fff;
}

/* 瀑布流网格 - 使用纯 CSS Grid 实现多列布局 */
.masonry-grid {
  display: grid;
  grid-template-columns: repeat(var(--column-count, 4), 1fr);
  gap: var(--gap, 16px);
}

@media (max-width: 1400px) {
  .masonry-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .masonry-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
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
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 图片卡片样式 */
.picture-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.picture-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 图片容器 */
.image-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.image-container img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.image-container:hover img {
  transform: scale(1.08);
}

/* 图片遮罩层 */
.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-container:hover .image-overlay {
  opacity: 1;
}

/* 卡片标题 */
.card-title {
  margin: 0;
}

.card-title :deep(.ant-typography) {
  margin-bottom: 0;
  font-weight: 500;
}

/* 卡片额外信息 */
.card-extra {
  display: flex;
  align-items: center;
}

/* 卡片底部 */
.card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 加载更多 */
.loading-more {
  display: flex;
  justify-content: center;
  padding: 24px;
}

/* 按钮样式优化 */
.picture-card :deep(.ant-btn-circle) {
  opacity: 0.9;
  transition: opacity 0.2s;
}

.picture-card :deep(.ant-btn-circle:hover) {
  opacity: 1;
  transform: scale(1.1);
}

/* 卡片操作按钮 */
.picture-card :deep(.ant-card-actions) {
  background: linear-gradient(to bottom, #fafafa, #f5f5f5);
  border-top: 1px solid #f0f0f0;
}

.picture-card :deep(.ant-card-actions > li) {
  margin: 8px 0;
}

.picture-card :deep(.ant-card-actions > li > span) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transition: all 0.2s;
}

.picture-card :deep(.ant-card-actions > li > span:hover) {
  color: #1890ff;
  transform: scale(1.2);
}
</style>
