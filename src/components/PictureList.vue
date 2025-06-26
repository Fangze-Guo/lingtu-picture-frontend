<template>
  <div class="picture-list">
    <!-- 图片列表 -->
    <a-list
      :grid="{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }"
      :data-source="dataList"
      :loading="loading"
    >
      <template #renderItem="{ item: picture }">
        <a-list-item style="padding: 0">
          <!-- 单张图片 -->
          <a-card hoverable @click="doClickPicture(picture)">
            <template #cover>
              <img
                style="height: 180px; object-fit: cover"
                :alt="picture.name"
                :src="picture.thumbnailUrl ?? picture.url"
                loading="lazy"
              />
            </template>
            <a-card-meta :title="picture.name">
              <template #description>
                <a-flex>
                  <a-tag color="green">
                    {{ picture.category ?? '默认' }}
                  </a-tag>
                  <a-tag v-for="tag in picture.tags" :key="tag">
                    {{ tag }}
                  </a-tag>
                </a-flex>
              </template>
            </a-card-meta>
            <template v-if="showOps" #actions>
              <a-space @click="(e) => doEdit(picture, e)">
                <edit-outlined />
                编辑
              </a-space>
              <a-space @click="(e) => doDelete(picture, e)">
                <delete-outlined />
                删除
              </a-space>
            </template>
          </a-card>
        </a-list-item>
      </template>
    </a-list>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DeleteOutlined, EditOutlined } from '@ant-design/icons-vue'
import { deletePictureUsingPost } from '@/api/pictureController.ts'
import { message, Modal } from 'ant-design-vue'

interface Props {
  dataList?: API.PictureVO[]
  loading?: boolean
  showOps?: boolean
  onReload?: () => void
}

const props = withDefaults(defineProps<Props>(), {
  dataList: () => [],
  loading: false,
  showOps: false,
  onReload: () => {},
})

// 跳转至图片详情
const router = useRouter()
const doClickPicture = (picture: API.PictureVO) => {
  router.push({
    path: `/picture/${picture.id}`,
  })
}

// 编辑
const doEdit = (picture: API.PictureVO, e) => {
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
const doDelete = async (picture: API.PictureVO, e) => {
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
</script>

<style scoped></style>
