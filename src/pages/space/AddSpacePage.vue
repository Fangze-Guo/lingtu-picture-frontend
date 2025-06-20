<template>
  <div id="addSpacePage">
    <h2 style="margin-bottom: 16px">
      {{ route.query?.id ? '修改空间' : '创建空间' }}
    </h2>
    <a-form layout="vertical" :model="formData" @finish="handleSubmit">
      <a-form-item label="空间名称" name="spaceName">
        <a-input v-model:value="formData.spaceName" placeholder="请输入空间名称" allow-clear />
      </a-form-item>
      <a-form-item label="空间级别" name="spaceLevel">
        <a-select
          v-model:value="formData.spaceLevel"
          :options="SPACE_LEVEL_OPTIONS"
          placeholder="请输入空间级别"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>
      <a-form-item v-if="route.query?.id" label="空间条数" name="maxCount">
        <a-input v-model:value="formData.maxCount" placeholder="请输入空间条数" allow-clear />
      </a-form-item>
      <a-form-item v-if="route.query?.id" label="空间容量" name="maxSize">
        <a-input v-model:value="formData.maxSize" placeholder="请输入空间容量" allow-clear />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit" style="width: 100%" :loading="loading">
          提交
        </a-button>
      </a-form-item>
    </a-form>
    <a-card title="空间级别介绍">
      <a-typography-paragraph>
        * 目前仅支持开通普通版，如需升级空间，请联系
        <a href="https://blog.csdn.net/qq_53569667?type=blog" target="_blank">Fetters</a>。
      </a-typography-paragraph>
      <a-typography-paragraph v-for="spaceLevel in spaceLevelList">
        <a-typography-text v-if="spaceLevel.value == 0">
          ✨{{ spaceLevel.text }}： 大小 {{ formatSize(spaceLevel.maxSize) }}， 数量
          {{ spaceLevel.maxCount }}
        </a-typography-text>
        <a-typography-text v-else-if="spaceLevel.value == 1">
          💎{{ spaceLevel.text }}： 大小 {{ formatSize(spaceLevel.maxSize) }}， 数量
          {{ spaceLevel.maxCount }}
        </a-typography-text>
        <a-typography-text v-if="spaceLevel.value == 2">
          👑{{ spaceLevel.text }}： 大小 {{ formatSize(spaceLevel.maxSize) }}， 数量
          {{ spaceLevel.maxCount }}
        </a-typography-text>
      </a-typography-paragraph>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import {
  addSpaceUsingPost,
  getSpaceVoByIdUsingGet,
  listSpaceLevelUsingGet,
  updateSpaceUsingPost,
} from '@/api/spaceController.ts'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { SPACE_LEVEL_ENUM, SPACE_LEVEL_OPTIONS } from '@/constants/space.ts'
import { formatSize } from '@/utils'

const router = useRouter()
const route = useRoute()

const oldSpace = ref<API.SpaceVO>()
const formData = reactive<API.SpaceAddRequest | API.SpaceUpdateRequest>({
  spaceName: '',
  spaceLevel: SPACE_LEVEL_ENUM.COMMON,
})
const loading = ref(false)

const spaceLevelList = ref<API.SpaceLevel[]>([])

// 获取空间级别
const fetchSpaceLevelList = async () => {
  const res = await listSpaceLevelUsingGet()
  if (res.data.code === 200 && res.data.data) {
    spaceLevelList.value = res.data.data
  } else {
    message.error('加载空间级别失败，' + res.data.message)
  }
}

onMounted(() => {
  fetchSpaceLevelList()
  getOldSpace()
})

/**
 * 提交表单
 */
const handleSubmit = async () => {
  loading.value = true
  const spaceId = oldSpace.value?.id
  let res
  if (spaceId) {
    // 修改空间
    res = await updateSpaceUsingPost({
      id: spaceId,
      ...formData,
    })
  } else {
    // 创建空间
    res = await addSpaceUsingPost({
      ...formData,
    })
  }
  // 操作成功
  if (res.data.code === 200 && res.data.data) {
    message.success('操作成功')
    // 跳转到空间详情页
    await router.push({
      path: `/space/${res.data.data}`,
    })
  } else {
    message.error('操作失败，' + res.data.message)
  }
  loading.value = false
}

// 获取老数据
const getOldSpace = async () => {
  // 获取数据
  const id = route.query?.id
  if (id) {
    const res = await getSpaceVoByIdUsingGet({
      id: id,
    })
    if (res.data.code === 200 && res.data.data) {
      const data = res.data.data
      oldSpace.value = data
      formData.spaceName = data.spaceName
      formData.spaceLevel = data.spaceLevel
      formData.maxCount = data.maxCount
      formData.maxSize = data.maxSize
    }
  }
}
</script>

<style scoped>
#addSpacePage {
  margin: 0 auto;
  max-width: 720px;
}
</style>
