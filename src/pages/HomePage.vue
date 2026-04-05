<template>
  <div id="homePage">
    <!-- 顶部英雄区 -->
    <div class="hero-section">
      <div class="hero-content">
        <div class="hero-title">
          <span class="title-line">发现</span>
          <span class="title-gradient">精美壁纸</span>
        </div>
        <div class="hero-subtitle">探索海量高清图片，打造专属视觉空间</div>

        <!-- 搜索框 -->
        <div class="hero-search">
          <a-input-search
            v-model:value="searchParams.searchText"
            placeholder="搜索你想要的图片..."
            enter-button
            size="large"
            @search="doSearch"
            class="search-input"
          >
            <template #prefix>
              <SearchOutlined class="search-icon" />
            </template>
            <template #enterButton>
              <span class="search-btn-text">搜索</span>
            </template>
          </a-input-search>
        </div>

        <!-- 热门标签 -->
        <div class="hero-tags">
          <span class="tags-label">热门：</span>
          <a-tag
            v-for="tag in hotTags"
            :key="tag"
            class="hero-tag"
            @click="searchByTag(tag)"
          >
            {{ tag }}
          </a-tag>
        </div>
      </div>

      <!-- 装饰元素 -->
      <div class="hero-decoration">
        <div class="deco-circle deco-1"></div>
        <div class="deco-circle deco-2"></div>
        <div class="deco-circle deco-3"></div>
      </div>
    </div>

    <!-- 分类标签栏 -->
    <div class="category-bar">
      <div class="category-inner">
        <a-tabs v-model:activeKey="selectedCategory" @change="doSearch" class="category-tabs">
          <a-tab-pane key="all">
            <template #tab>
              <span class="tab-item">
                <AppstoreOutlined />
                <span>全部</span>
              </span>
            </template>
          </a-tab-pane>
          <a-tab-pane v-for="category in categoryList" :key="category">
            <template #tab>
              <span class="tab-item">{{ category }}</span>
            </template>
          </a-tab-pane>
        </a-tabs>

        <!-- 颜色筛选 -->
        <div class="color-filter">
          <span class="filter-label">颜色</span>
          <color-picker format="hex" @pureColorChange="onColorChange" />
        </div>
      </div>
    </div>

    <!-- 标签筛选 -->
    <div class="tags-filter" v-if="tagList.length > 0">
      <div class="tags-inner">
        <span class="tags-title">
          <TagsOutlined />
          标签筛选
        </span>
        <div class="tags-list">
          <a-checkable-tag
            v-for="(tag, index) in tagList"
            :key="tag"
            v-model:checked="selectedTagList[index]"
            @change="doSearch"
            class="filter-tag"
          >
            {{ tag }}
          </a-checkable-tag>
        </div>
      </div>
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
    <div class="floating-actions">
      <a-tooltip title="回到顶部" placement="left">
        <div class="floating-btn" @click="scrollToTop" v-show="showBackTop">
          <UpOutlined />
        </div>
      </a-tooltip>
      <a-tooltip title="上传图片" placement="left">
        <div class="floating-btn primary" @click="goToAddPicturePage">
          <PlusOutlined />
        </div>
      </a-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, onBeforeUnmount } from 'vue'
import {
  listPictureTagCategoryUsingGet,
  listPictureVoByPageUsingPost,
  searchPictureByColorUsingPost,
} from '@/api/pictureController.ts'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import MasonryPictureList from '@/components/MasonryPictureList.vue'
import { ColorPicker } from 'vue3-colorpicker'
import {
  AppstoreOutlined,
  PlusOutlined,
  SearchOutlined,
  TagsOutlined,
  UpOutlined,
} from '@ant-design/icons-vue'

const dataList = ref<API.PictureVO[]>([])
const total = ref(0)
const loading = ref(true)
const hasMore = ref(true)
const isLoadingMore = ref(false)

// 热门标签
const hotTags = ['风景', '动漫', '人物', '动物', '建筑', '抽象']

// 回到顶部
const showBackTop = ref(false)
const handleScroll = () => {
  showBackTop.value = window.scrollY > 300
}
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

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

onMounted(() => {
  fetchData()
  getTagCategoryOptions()
})

// 加载更多
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

// 构建搜索参数
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

// 获取数据
const fetchData = async (resetPage = true) => {
  loading.value = true
  if (resetPage) {
    searchParams.current = 1
  }
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

// 分页
const onPageChange = (page: number, pageSize: number) => {
  searchParams.current = page
  searchParams.pageSize = pageSize
  fetchData(false)
}

// 搜索
const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

// 按标签搜索
const searchByTag = (tag: string) => {
  searchParams.searchText = tag
  doSearch()
}

// 获取标签分类
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

// 颜色搜索
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
  min-height: 100vh;
}

/* 英雄区 */
.hero-section {
  position: relative;
  padding: 80px 24px 60px;
  text-align: center;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%);
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
  margin: 0 auto;
}

.hero-title {
  margin-bottom: 16px;
}

.title-line {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
}

.title-gradient {
  display: block;
  font-size: 56px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  margin-bottom: 40px;
}

/* 搜索框 */
.hero-search {
  max-width: 600px;
  margin: 0 auto 24px;
}

.search-input {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.search-input :deep(.ant-input-affix-wrapper) {
  background: rgba(26, 26, 46, 0.8) !important;
  border: 2px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 16px 0 0 16px !important;
  padding: 16px 24px;
  transition: all 0.3s ease;
}

.search-input :deep(.ant-input-affix-wrapper:hover),
.search-input :deep(.ant-input-affix-wrapper-focused) {
  border-color: rgba(102, 126, 234, 0.5) !important;
}

.search-input :deep(.ant-input) {
  background: transparent !important;
  color: #fff !important;
  font-size: 16px;
}

.search-input :deep(.ant-input::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.search-icon {
  color: rgba(255, 255, 255, 0.4);
  font-size: 18px;
}

.search-input :deep(.ant-input-search-button) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 0 16px 16px 0 !important;
  height: auto !important;
  padding: 0 32px;
}

.search-btn-text {
  font-size: 16px;
  font-weight: 600;
}

/* 热门标签 */
.hero-tags {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tags-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.hero-tag {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: rgba(255, 255, 255, 0.8) !important;
  border-radius: 20px !important;
  padding: 6px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hero-tag:hover {
  background: rgba(102, 126, 234, 0.3) !important;
  border-color: rgba(102, 126, 234, 0.5) !important;
  color: #fff !important;
}

/* 装饰元素 */
.hero-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.deco-circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.3;
}

.deco-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%);
  top: -100px;
  right: -50px;
  animation: float 8s ease-in-out infinite;
}

.deco-2 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(118, 75, 162, 0.3) 0%, transparent 70%);
  bottom: -50px;
  left: -50px;
  animation: float 6s ease-in-out infinite reverse;
}

.deco-3 {
  width: 150px;
  height: 150px;
  background: radial-gradient(circle, rgba(240, 147, 251, 0.2) 0%, transparent 70%);
  top: 50%;
  left: 20%;
  animation: float 7s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(20px, -20px); }
}

/* 分类标签栏 */
.category-bar {
  position: sticky;
  top: 64px;
  z-index: 50;
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0 24px;
}

.category-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category-tabs {
  flex: 1;
}

.category-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 0;
}

.category-tabs :deep(.ant-tabs-tab) {
  padding: 16px 24px;
  color: rgba(255, 255, 255, 0.6) !important;
  transition: all 0.3s ease;
}

.category-tabs :deep(.ant-tabs-tab:hover) {
  color: rgba(255, 255, 255, 0.9) !important;
}

.category-tabs :deep(.ant-tabs-tab-active) {
  color: #fff !important;
}

.category-tabs :deep(.ant-tabs-ink-bar) {
  background: linear-gradient(90deg, #667eea, #764ba2);
  height: 3px;
  border-radius: 2px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 颜色筛选 */
.color-filter {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

/* 标签筛选 */
.tags-filter {
  background: rgba(26, 26, 46, 0.4);
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tags-inner {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.tags-title {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  padding-top: 4px;
}

.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 16px !important;
  padding: 6px 16px;
  transition: all 0.3s ease;
}

.filter-tag:hover {
  border-color: rgba(102, 126, 234, 0.4) !important;
  color: #fff !important;
}

.filter-tag.ant-tag-checkable-checked {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%) !important;
  border-color: rgba(102, 126, 234, 0.5) !important;
  color: #fff !important;
}

/* 悬浮按钮 */
.floating-actions {
  position: fixed;
  right: 24px;
  bottom: 100px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 999;
}

.floating-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.floating-btn:hover {
  transform: translateY(-4px);
  color: #fff;
}

.floating-btn.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  width: 56px;
  height: 56px;
  font-size: 20px;
}

.floating-btn.primary:hover {
  box-shadow: 0 8px 30px rgba(102, 126, 234, 0.5);
  transform: translateY(-4px) rotate(90deg);
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-section {
    padding: 60px 16px 40px;
  }

  .title-line {
    font-size: 32px;
  }

  .title-gradient {
    font-size: 40px;
  }

  .hero-subtitle {
    font-size: 14px;
  }

  .category-inner {
    flex-direction: column;
    gap: 12px;
  }

  .category-tabs :deep(.ant-tabs-tab) {
    padding: 12px 16px;
  }

  .tags-inner {
    flex-direction: column;
    gap: 12px;
  }

  .floating-actions {
    right: 16px;
    bottom: 80px;
  }
}
</style>
