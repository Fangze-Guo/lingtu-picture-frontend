<template>
  <div id="pictureDetailPage">
    <a-row :gutter="[24, 24]">
      <!-- 图片展示区 -->
      <a-col :sm="24" :md="16" :xl="16">
        <div class="image-preview-card">
          <div class="preview-header">
            <PictureOutlined />
            <span>图片预览</span>
          </div>
          <div class="preview-content">
            <a-image
              style="max-height: 600px; object-fit: contain"
              :src="picture.url"
              :preview="{ mask: '点击查看大图' }"
            />
          </div>
        </div>
      </a-col>

      <!-- 图片信息区 -->
      <a-col :sm="24" :md="8" :xl="8">
        <div class="info-card">
          <div class="info-header">
            <InfoCircleOutlined />
            <span>图片信息</span>
          </div>
          <div class="info-content">
            <!-- 作者 -->
            <div class="info-item">
              <div class="info-label">作者</div>
              <div class="info-value">
                <a-avatar :size="28" :src="picture.user?.userAvatar" class="author-avatar" />
                <span class="author-name">{{ picture.user?.userName || '未知' }}</span>
              </div>
            </div>

            <!-- 名称 -->
            <div class="info-item">
              <div class="info-label">名称</div>
              <div class="info-value">{{ picture.name ?? '未命名' }}</div>
            </div>

            <!-- 简介 -->
            <div class="info-item" v-if="picture.introduction">
              <div class="info-label">简介</div>
              <div class="info-value intro">{{ picture.introduction }}</div>
            </div>

            <!-- 分类 -->
            <div class="info-item">
              <div class="info-label">分类</div>
              <div class="info-value">
                <a-tag class="category-tag">{{ picture.category ?? '默认' }}</a-tag>
              </div>
            </div>

            <!-- 标签 -->
            <div class="info-item" v-if="picture.tags?.length">
              <div class="info-label">标签</div>
              <div class="info-value">
                <a-tag v-for="tag in picture.tags" :key="tag" class="picture-tag">{{ tag }}</a-tag>
              </div>
            </div>

            <!-- 图片尺寸 -->
            <div class="info-item">
              <div class="info-label">尺寸</div>
              <div class="info-value">{{ picture.picWidth }} × {{ picture.picHeight }}</div>
            </div>

            <!-- 格式 -->
            <div class="info-item">
              <div class="info-label">格式</div>
              <div class="info-value">{{ picture.picFormat ?? '-' }}</div>
            </div>

            <!-- 大小 -->
            <div class="info-item">
              <div class="info-label">大小</div>
              <div class="info-value">{{ formatSize(picture.picSize) }}</div>
            </div>

            <!-- 主色调 -->
            <div class="info-item" v-if="picture.picColor">
              <div class="info-label">主色调</div>
              <div class="info-value">
                <div
                  class="color-block"
                  :style="{ backgroundColor: toHexColor(picture.picColor) }"
                ></div>
                <span>{{ picture.picColor }}</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="action-buttons">
              <a-button type="primary" class="action-btn" @click="doDownload">
                <template #icon><DownloadOutlined /></template>
                下载
              </a-button>
              <a-button class="action-btn" @click="doShare">
                <template #icon><ShareAltOutlined /></template>
                分享
              </a-button>
              <template v-if="canEdit">
                <a-button class="action-btn" @click="doEdit">
                  <template #icon><EditOutlined /></template>
                  编辑
                </a-button>
                <a-popconfirm
                  title="确定删除该图片吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="doDelete"
                  ok-button-props="{ danger: true }"
                >
                  <a-button danger class="action-btn">
                    <template #icon><DeleteOutlined /></template>
                    删除
                  </a-button>
                </a-popconfirm>
              </template>
            </div>
          </div>
        </div>
      </a-col>
    </a-row>

    <ShareModel ref="shareModalRef" :link="shareLink" :title="'分享图片'" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { deletePictureUsingPost, getPictureVoByIdUsingGet } from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { useRouter } from 'vue-router'
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  ShareAltOutlined,
} from '@ant-design/icons-vue'
import { downloadImage, formatSize, toHexColor } from '@/utils'
import ShareModel from '@/components/ShareModel.vue'

interface Props {
  id: number | string
}

const router = useRouter()
const props = defineProps<Props>()
const picture = ref<API.PictureVO>({})

const loginUserStore = useLoginUserStore()
// 是否具有编辑权限
const canEdit = computed(() => {
  const loginUser = loginUserStore.loginUser
  if (!loginUser.id) return false
  const user = picture.value.user || {}
  return loginUser.id === user.id || loginUser.userRole === 'admin'
})

onMounted(() => {
  getPictureDetail()
})

const getPictureDetail = async () => {
  const res = await getPictureVoByIdUsingGet({ id: props.id as any })
  if (res.data.code === 200 && res.data.data) {
    picture.value = res.data.data
  } else {
    message.error('获取图片详情失败，' + res.data.message)
  }
}

const doEdit = () => {
  router.push({
    path: '/picture/add_picture',
    query: { id: picture.value.id, spaceId: picture.value.spaceId },
  })
}

const doDelete = async () => {
  const id = picture.value.id
  if (!id) return
  const res = await deletePictureUsingPost({ id })
  if (res.data.code === 200) {
    message.success('删除成功')
    router.back()
  } else {
    message.error('删除失败')
  }
}

const doDownload = () => {
  downloadImage(picture.value.downloadUrl)
}

const shareModalRef = ref()
const shareLink = ref<string>('')
const doShare = () => {
  shareLink.value = `${window.location.protocol}//${window.location.host}/picture/${picture.value.id}`
  if (shareModalRef.value) {
    shareModalRef.value.openModal()
  }
}
</script>

<style scoped>
#pictureDetailPage {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

/* 图片预览卡片 */
.image-preview-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.preview-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 500;
}

.preview-content {
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.preview-content :deep(.ant-image) {
  max-width: 100%;
}

.preview-content :deep(.ant-image-img) {
  border-radius: 8px;
}

/* 信息卡片 */
.info-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.info-header {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  font-weight: 500;
}

.info-content {
  padding: 20px 24px;
}

.info-item {
  margin-bottom: 20px;
}

.info-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.info-value.intro {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

.author-avatar {
  border: 2px solid rgba(102, 126, 234, 0.3);
}

.author-name {
  font-weight: 500;
}

/* 标签样式 */
.category-tag {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
  border: 1px solid rgba(102, 126, 234, 0.4);
  color: #fff;
  border-radius: 12px;
  padding: 2px 12px;
}

.picture-tag {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  margin: 2px;
}

/* 颜色块 */
.color-block {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.action-btn {
  border-radius: 10px !important;
  height: 40px !important;
  font-weight: 500 !important;
}

.action-btn:not(.ant-btn-dangerous) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.9) !important;
}

.action-btn:not(.ant-btn-dangerous):hover {
  background: rgba(102, 126, 234, 0.2) !important;
  border-color: rgba(102, 126, 234, 0.4) !important;
}

.action-btn.ant-btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
}

.action-btn.ant-btn-dangerous {
  background: rgba(255, 77, 79, 0.2) !important;
  border: 1px solid rgba(255, 77, 79, 0.4) !important;
}

/* 响应式 */
@media (max-width: 768px) {
  #pictureDetailPage {
    padding: 16px;
  }

  .action-buttons {
    flex-direction: column;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
