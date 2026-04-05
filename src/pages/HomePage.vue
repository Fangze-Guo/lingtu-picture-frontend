<template>
  <div id="homePage">
    <!-- 搜索框 -->
    <div class="search-container">
      <div class="search-bar">
        <a-input-search
          placeholder="从海量图片中搜索..."
          v-model:value="searchParams.searchText"
          enter-button="搜索"
          size="large"
          @search="doSearch"
          allow-clear
        />
      </div>
    </div>

    <!-- 按颜色搜索 -->
    <div class="filter-section">
      <a-form-item label="按颜色搜索" style="margin-bottom: 0">
        <color-picker format="hex" @pureColorChange="onColorChange" />
      </a-form-item>
    </div>

    <!-- 分类标签 -->
    <div class="tabs-section">
      <a-tabs v-model:activeKey="selectedCategory" @change="doSearch" centered>
        <a-tab-pane key="all" tab="全部" />
        <a-tab-pane v-for="category in categoryList" :key="category" :tab="category" />
      </a-tabs>
    </div>

    <!-- 标签筛选 -->
    <div class="tags-section">
      <div class="tags-label">热门标签</div>
      <a-space :size="[8, 8]" wrap>
        <a-checkable-tag
          v-for="(tag, index) in tagList"
          :key="tag"
          v-model:checked="selectedTagList[index]"
          @change="doSearch"
          class="filter-tag"
        >
          {{ tag }}
        </a-checkable-tag>
      </a-space>
    </div>

    <!-- 图片列表 -->
    <MasonryPictureList
      :dataList="dataList"
      :loading="loading"
      :total="total"
      :currentPage="searchParams.current"
      :pageSize="searchParams.pageSize"
      :hasMore="hasMore"
      :onLoadMore="loadMore"
      :onPageChange="onPageChange"
      :onReload="fetchData"
    />

    <!-- 悬浮按钮 -->
    <button class="floating-button" @click="goToAddPicturePage">
      <PlusOutlined />
    </button>
  </div>
</template>

<script setup lang="ts">
// 数据
import { onMounted, reactive, ref, watch } from 'vue'
import {
  listPictureTagCategoryUsingGet,
  listPictureVoByPageUsingPost,
  searchPictureByColorUsingPost,
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import MasonryPictureList from '@/components/MasonryPictureList.vue'
import { ColorPicker } from 'vue3-colorpicker'
import { PlusOutlined } from '@ant-design/icons-vue'

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
})

// 分类、标签列表
const categoryList = ref<string[]>([])
const selectedCategory = ref<string>('all')
const tagList = ref<string[]>([])
const selectedTagList = ref<boolean[]>([])

const router = useRouter()

// 页面加载时请求一次
onMounted(() => {
  fetchData()
  getTagCategoryOptions()
})

/**
 * 加载更多数据
 */
const loadMore = async () => {
  if (isLoadingMore.value || !hasMore.value) return

  isLoadingMore.value = true
  searchParams.current++
  const res = await listPictureVoByPageUsingPost(buildSearchParams())

  if (res.data.data) {
    const newRecords = res.data.data.records ?? []
    dataList.value = [...dataList.value, ...newRecords]
    total.value = res.data.data.total ?? 0
    hasMore.value = dataList.value.length < total.value
  }

  isLoadingMore.value = false
}

/**
 * 构建搜索参数
 */
const buildSearchParams = () => {
  const params: API.PictureQueryRequest = {
    ...searchParams,
    tags: [],
  }
  if (selectedCategory.value !== 'all') {
    params.category = selectedCategory.value
  }
  selectedTagList.value.forEach((useTag, index) => {
    if (useTag) {
      params.tags?.push(tagList.value[index])
    }
  })
  return params
}

/**
 * 获取数据
 */
const fetchData = async () => {
  loading.value = true
  searchParams.current = 1
  dataList.value = []

  const params = buildSearchParams()
  const res = await listPictureVoByPageUsingPost(params)

  if (res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
    hasMore.value = dataList.value.length < total.value
  } else {
    message.error('获取数据失败，' + res.data.message)
  }

  loading.value = false
}

/**
 * 分页参数
 */
const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  fetchData()
}

/**
 * 点击搜索
 */
const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

/**
 * 获取标签和分类选项
 */
const getTagCategoryOptions = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 200 && res.data.data) {
    categoryList.value = res.data.data.categoryList ?? []
    tagList.value = res.data.data.tagList ?? []
    selectedTagList.value = new Array(tagList.value.length).fill(false)
  } else {
    message.error('加载分类标签失败，' + res.data.message)
  }
}

const goToAddPicturePage = () => {
  router.push('/picture/add_picture')
}

/**
 * 切换颜色触发事件
 */
const onColorChange = async (color: string) => {
  loading.value = true
  dataList.value = []

  const res = await searchPictureByColorUsingPost({
    picColor: color,
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
</script>

<style scoped>
#homePage {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
  min-height: 100vh;
  padding-bottom: 80px;
}

/* 搜索容器 */
.search-container {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 50;
}

.search-bar {
  max-width: 600px;
  margin: 0 auto;
}

.search-bar :deep(.ant-input-search) {
  border-radius: 12px;
  overflow: hidden;
}

.search-bar :deep(.ant-input) {
  border-radius: 12px 0 0 12px;
  padding-left: 20px;
  height: 48px;
  font-size: 15px;
  border: 2px solid #e8e8e8;
  transition: all 0.3s;
}

.search-bar :deep(.ant-input:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.search-bar :deep(.ant-input-search-button) {
  border-radius: 0 12px 12px 0;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.search-bar :deep(.ant-input-search-button:hover) {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
}

/* 筛选区域 */
.filter-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  justify-content: center;
}

.filter-section :deep(.ant-form-item-label) {
  color: #666;
  font-weight: 500;
}

/* 标签页 */
.tabs-section {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  padding: 16px 24px 0;
}

.tabs-section :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.tabs-section :deep(.ant-tabs-tab) {
  padding: 12px 24px;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
}

.tabs-section :deep(.ant-tabs-tab:hover) {
  color: #667eea;
}

.tabs-section :deep(.ant-tabs-tab-active) {
  color: #667eea;
}

.tabs-section :deep(.ant-tabs-ink-bar) {
  background: linear-gradient(90deg, #667eea, #764ba2);
  height: 3px;
  border-radius: 2px;
}

/* 标签筛选 */
.tags-section {
  max-width: 1200px;
  margin: 20px auto;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 12px;
}

.tags-label {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  margin-bottom: 12px;
}

.filter-tag {
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 13px;
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
}

.filter-tag:hover {
  border-color: #667eea;
  color: #667eea;
}

.filter-tag.ant-tag-checkable-checked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: #fff;
}

/* 悬浮按钮 */
.floating-button {
  position: fixed;
  bottom: 100px;
  right: 32px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 24px;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.floating-button:hover {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

.floating-button:active {
  transform: scale(0.95) rotate(90deg);
}

.floating-button :deep(.anticon) {
  font-size: 24px;
}
</style>
