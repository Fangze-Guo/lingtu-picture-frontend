<template>
  <div id="pictureManagePage">
    <div class="page-header">
      <h2 class="page-title">
        <AppstoreOutlined />
        图片管理
      </h2>
      <a-space>
        <a-button type="primary" @click="goToAddPicture">
          <template #icon><PlusOutlined /></template>
          创建图片
        </a-button>
        <a-button type="primary" ghost @click="goToBatchAdd">
          <template #icon><PlusCircleOutlined /></template>
          批量创建
        </a-button>
      </a-space>
    </div>

    <!-- 搜索表单 -->
    <div class="search-card">
      <PictureSearchForm :on-search="doSearch" :is-admin="true" />
    </div>

    <!-- 数据表格 -->
    <div class="table-card">
      <a-table
        :columns="columns"
        :data-source="dataList"
        :pagination="pagination"
        @change="doTableChange"
        class="dark-table"
        :scroll="{ x: 1500 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'url'">
            <a-image
              :src="record.url"
              :width="80"
              class="table-image"
            />
          </template>
          <template v-if="column.dataIndex === 'tags'">
            <div class="tag-list">
              <a-tag
                v-for="tag in JSON.parse(record.tags || '[]').slice(0, 2)"
                :key="tag"
                class="picture-tag"
              >
                {{ tag }}
              </a-tag>
              <span v-if="JSON.parse(record.tags || '[]').length > 2" class="more">
                +{{ JSON.parse(record.tags || '[]').length - 2 }}
              </span>
            </div>
          </template>
          <template v-if="column.dataIndex === 'picInfo'">
            <div class="pic-info">
              <div><span class="label">格式：</span>{{ record.picFormat }}</div>
              <div><span class="label">尺寸：</span>{{ record.picWidth }} × {{ record.picHeight }}</div>
              <div><span class="label">大小：</span>{{ formatSize(record.picSize) }}</div>
            </div>
          </template>
          <template v-if="column.dataIndex === 'reviewMessage'">
            <div class="review-info">
              <div class="review-status">
                <span
                  class="status-dot"
                  :class="{
                    pass: record.reviewStatus === PIC_REVIEW_STATUS_ENUM.PASS,
                    reject: record.reviewStatus === PIC_REVIEW_STATUS_ENUM.REJECT,
                    pending: record.reviewStatus === PIC_REVIEW_STATUS_ENUM.REVIEWING,
                  }"
                ></span>
                <span>{{ PIC_REVIEW_STATUS_MAP[record.reviewStatus] }}</span>
              </div>
              <div v-if="record.reviewMessage" class="review-msg">{{ record.reviewMessage }}</div>
            </div>
          </template>
          <template v-if="column.dataIndex === 'createTime'">
            {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}
          </template>
          <template v-if="column.dataIndex === 'editTime'">
            {{ dayjs(record.editTime).format('YYYY-MM-DD HH:mm') }}
          </template>
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button
                v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.PASS"
                type="link"
                size="small"
                @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.PASS)"
              >
                通过
              </a-button>
              <a-button
                v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.REJECT"
                type="link"
                size="small"
                danger
                @click="showRejectModal(record)"
              >
                拒绝
              </a-button>
              <a-button type="link" size="small" @click="goToEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确定删除该图片吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="doDelete(record)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 拒绝弹窗 -->
    <a-modal
      v-model:open="rejectModalOpen"
      title="填写拒绝原因"
      @ok="handleReject"
      ok-text="确定"
      cancel-text="取消"
      class="dark-modal"
    >
      <a-input v-model:value="rejectMessage" placeholder="请输入拒绝原因" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import {
  deletePictureUsingPost,
  doPictureReviewUsingPost,
  listPictureByPageUsingPost,
} from '@/api/pictureController.ts'
import { PIC_REVIEW_STATUS_ENUM, PIC_REVIEW_STATUS_MAP } from '@/constants/picture.ts'
import { formatSize } from '@/utils'
import PictureSearchForm from '@/components/PictureSearchForm.vue'
import { AppstoreOutlined, PlusCircleOutlined, PlusOutlined } from '@ant-design/icons-vue'

const router = useRouter()

const columns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '图片', dataIndex: 'url', width: 100 },
  { title: '名称', dataIndex: 'name', width: 120 },
  { title: '类型', dataIndex: 'category', width: 80 },
  { title: '标签', dataIndex: 'tags', width: 120 },
  { title: '图片信息', dataIndex: 'picInfo', width: 140 },
  { title: '用户ID', dataIndex: 'userId', width: 80 },
  { title: '审核信息', dataIndex: 'reviewMessage', width: 150 },
  { title: '创建时间', dataIndex: 'createTime', width: 120 },
  { title: '编辑时间', dataIndex: 'editTime', width: 120 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' },
]

const dataList = ref<API.Picture[]>([])
const total = ref(0)

const searchParams = ref<API.PictureQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
})

const pagination = computed(() => ({
  current: searchParams.value.current,
  pageSize: searchParams.value.pageSize,
  total: total.value,
  showSizeChanger: true,
  showTotal: (total: any) => `共 ${total} 条`,
}))

const rejectMessage = ref<string>('')
const rejectModalOpen = ref<boolean>(false)
const currentRecord = ref<API.Picture | null>(null)

onMounted(() => {
  fetchData()
})

const fetchData = async () => {
  const res = await listPictureByPageUsingPost({
    ...searchParams.value,
    nullSpaceId: true,
  })
  if (res.data.code == 200 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
}

const doTableChange = (pagination: any) => {
  searchParams.value.current = pagination.current
  searchParams.value.pageSize = pagination.pageSize
  fetchData()
}

const doSearch = (newSearchParams: API.PictureQueryRequest) => {
  searchParams.value = {
    ...searchParams.value,
    ...newSearchParams,
    current: 1,
  }
  fetchData()
}

const doDelete = async (record: API.Picture) => {
  const res = await deletePictureUsingPost({ id: record.id })
  if (res.data.code == 200) {
    message.success('删除成功')
    await fetchData()
  } else {
    message.error('删除失败，' + res.data.message)
  }
}

const showRejectModal = (record: API.Picture) => {
  currentRecord.value = record
  rejectMessage.value = ''
  rejectModalOpen.value = true
}

const handleReject = async () => {
  if (!currentRecord.value) return
  await handleReview(currentRecord.value, PIC_REVIEW_STATUS_ENUM.REJECT)
}

const handleReview = async (record: API.Picture, reviewStatus: number) => {
  const msg = reviewStatus === PIC_REVIEW_STATUS_ENUM.PASS ? '管理员操作通过' : rejectMessage.value
  const res = await doPictureReviewUsingPost({
    id: record.id,
    reviewStatus,
    reviewMessage: msg,
  })
  if (res.data.code === 200) {
    message.success('审核操作成功')
    rejectModalOpen.value = false
    await fetchData()
  } else {
    message.error('审核操作失败，' + res.data.message)
  }
}

const goToAddPicture = () => {
  router.push('/picture/add_picture')
}

const goToBatchAdd = () => {
  router.push('/picture/add_picture/batch')
}

const goToEdit = (record: API.Picture) => {
  router.push(`/picture/add_picture?id=${record.id}`)
}
</script>

<style scoped>
#pictureManagePage {
  padding: 24px;
  min-height: calc(100vh - 64px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.search-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.table-card {
  background: rgba(26, 26, 46, 0.6);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.dark-table :deep(.ant-table) {
  background: transparent !important;
}

.dark-table :deep(.ant-table-thead > tr > th) {
  background: rgba(102, 126, 234, 0.15) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.dark-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
  color: rgba(255, 255, 255, 0.8) !important;
}

.dark-table :deep(.ant-table-tbody > tr:hover > td) {
  background: rgba(102, 126, 234, 0.1) !important;
}

.dark-table :deep(.ant-pagination-item) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
}

.dark-table :deep(.ant-pagination-item a) {
  color: rgba(255, 255, 255, 0.7);
}

.dark-table :deep(.ant-pagination-item-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
}

.table-image {
  border-radius: 8px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.picture-tag {
  background: rgba(102, 126, 234, 0.2);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  font-size: 12px;
}

.more {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}

.pic-info {
  font-size: 12px;
  line-height: 1.8;
}

.pic-info .label {
  color: rgba(255, 255, 255, 0.5);
}

.review-info {
  font-size: 12px;
}

.review-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.pass {
  background: #52c41a;
}

.status-dot.reject {
  background: #ff4d4f;
}

.status-dot.pending {
  background: #faad14;
}

.review-msg {
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.dark-modal :deep(.ant-modal-content) {
  background: rgba(26, 26, 46, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark-modal :deep(.ant-modal-header) {
  background: transparent;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dark-modal :deep(.ant-modal-title) {
  color: #fff;
}

.dark-modal :deep(.ant-input) {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  color: #fff;
}
</style>
