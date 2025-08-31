<template>
  <a-modal class="image-cropper" v-model:visible="visible" title="编辑图片" :footer="false" @cancel="closeModal">
    <vue-cropper
      ref="cropperRef"
      :img="props.imageUrl"
      :info="true"
      :auto-crop="true"
      :fixed-box="true"
      :center-box="true"
      :can-move-box="true"
      output-type="png"
    />
    <div style="margin-bottom: 16px" />
    <!-- 图片操作 -->
    <div class="image-cropper-actions">
      <a-button @click="rotateLeft">向左旋转</a-button>
      <a-button @click="rotateRight">向右旋转</a-button>
      <a-button @click="changeScale(1)">放大</a-button>
      <a-button @click="changeScale(-1)">缩小</a-button>
      <a-button type="primary" :loading="loading" @click="handleConfirm">确认</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { VueCropper } from 'vue-cropper'
import { message } from 'ant-design-vue'
import { uploadPictureUsingPost } from '@/api/pictureController'

interface Props {
  imageUrl?: string
  picture?: API.PictureVO
  spaceId?: number
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<Props>()
// 编辑器组件引用
const cropperRef = ref<VueCropper>()
const loading = ref<boolean>(false)

const rotateLeft = () => {
  cropperRef.value.rotateLeft()
}

const rotateRight = () => {
  cropperRef.value.rotateRight()
}

const changeScale = (scale: number) => {
  cropperRef.value.changeScale(scale)
}

// 确认裁剪
const handleConfirm = () => {
  cropperRef.value.getCropBlob((blob: Blob) => {
    // blob 为已裁切的文件
    const fileName = (props.picture?.name || 'image') + '.png'
    const file =  new File([blob], fileName, { type: blob.type })
    handleUpload(file)
  })
}

// 是否可见
const visible = ref(false)

// 打开弹窗
const openModal = () => {
  visible.value = true
}

// 关闭弹窗
const closeModal = () => {
  visible.value = false
}

// 暴露函数给父组件
defineExpose({
  openModal,
})

/**
 * 上传图片
 * @param file
 */
const handleUpload = async (file: File) => {
  loading.value = true
  try {
    // 上传时传递 spaceId
    const params: API.PictureUploadRequest = props.picture ? { id: props.picture.id } : {}
    params.spaceId = props.spaceId
    const res = await uploadPictureUsingPost(params, {}, file)
    if (res.data.code === 200 && res.data.data) {
      message.success('上传成功')
      // 将图片数据返回给父组件
      props.onSuccess?.(res.data.data)
      closeModal()
    } else {
      message.error('上传失败，' + res.data.message)
    }
  } catch (error) {
    message.error('上传失败，' + error.message)
  }
  loading.value = false
}
</script>

<style scoped>
.image-cropper {
  text-align: center;
}

.image-cropper .vue-cropper {
  height: 400px;
}

/* 操作按钮区域样式 */
.image-cropper-actions {
  margin-top: 16px;
  text-align: center;
}

.image-cropper-actions .ant-btn {
  margin: 0 8px;
}
</style>
