<template>
  <div id="addPictureBatchPage">
    <h2 style="margin-bottom: 16px">批量创建图片</h2>
    <a-form layout="vertical" :model="formData" @finish="handleSubmit">
      <a-form-item label="关键词" name="searchText">
        <a-input v-model:value="formData.searchText" placeholder="请输入关键词" />
      </a-form-item>
      <a-form-item label="抓取索引" name="searchText">
        <a-input-number
          v-model:value="formData.firstIndex"
          placeholder="请输入图片起始索引"
          :min="0"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="抓取数量" name="count">
        <a-input-number
          v-model:value="formData.count"
          placeholder="请输入数量"
          style="min-width: 180px"
          :min="1"
          :max="30"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="名称前缀" name="namePrefix">
        <a-input v-model:value="formData.namePrefix" placeholder="请输入名称前缀，会自动补充序号" />
      </a-form-item>
      <a-form-item name="category" label="分类">
        <a-auto-complete
          v-model:value="formData.category"
          placeholder="请输入分类"
          :options="categoryOptions"
          allow-clear
        />
      </a-form-item>
      <a-form-item name="tags" label="标签">
        <a-select
          v-model:value="formData.tags"
          mode="tags"
          placeholder="请输入标签"
          :options="tagOptions"
          allow-clear
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%" :loading="loading">
          执行任务
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { listPictureTagCategoryUsingGet, uploadPictureByBatchUsingPost } from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'

interface ItemOptions {
  value: string
  label: string
}

const router = useRouter()
const formData = reactive<API.PictureUploadByBatchRequest>({
  firstIndex: 0,
  count: 10,
})
const loading = ref(false)
const categoryOptions = ref<ItemOptions[]>([])
const tagOptions = ref<ItemOptions[]>([])

onMounted(() => {
  getTagCategoryOptions()
})

const handleSubmit = async (values: any) => {
  loading.value = true
  const res = await uploadPictureByBatchUsingPost({
    ...formData,
  })
  if (res.data.code === 200 && res.data.data) {
    message.success(`创建成功，共 ${res.data.data} 条`)
    await router.push({
      path: '/',
    })
  } else {
    message.error('创建失败，' + res.data.message)
  }
  loading.value = false
}

/**
 *  获取标签和分类
 */
const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 200 && res.data.data) {
    tagOptions.value = (res.data.data.tagList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })
    categoryOptions.value = (res.data.data.categoryList ?? []).map((data: string) => {
      return {
        value: data,
        label: data,
      }
    })
  } else {
    message.error('获取标签分类列表失败，' + res.data.message)
  }
}
</script>

<style scoped>
#addPictureBatchPage {
  margin: 0 auto;
  max-width: 720px;
}
</style>
