<template>
  <div id="pictureManagePage">
    <a-space style="margin-bottom: 16px">
      <a-button type="primary" href="/picture/add_picture" target="_blank">+ 创建图片</a-button>
      <a-button type="primary" href="/picture/add_picture/batch" target="_blank" ghost>+ 批量创建图片</a-button>
    </a-space>
    <!-- 搜索表单 -->
    <a-form :model="searchParams" layout="inline" @finish="doSearch" style="margin-bottom: 30px">
      <a-form-item label="关键词">
        <a-input
          v-model:value="searchParams.searchText"
          placeholder="从名称和简介搜索"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="类型">
        <a-input v-model:value="searchParams.category" placeholder="请输入类型" allow-clear />
      </a-form-item>
      <a-form-item label="标签">
        <a-select
          v-model:value="searchParams.tags"
          mode="tags"
          placeholder="请输入标签"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="审核状态">
        <a-select
          v-model:value="searchParams.reviewStatus"
          placeholder="请选择审核状态"
          :options="PIC_REVIEW_STATUS_OPTIONS"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>
    <!-- 数据表格 -->
    <a-table
      :columns="columns"
      :data-source="dataList"
      :pagination="pagination"
      @change="doTableChange"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.dataIndex === 'url'">
          <a-image :src="record.url" alt="图片头像" />
        </template>
        <template v-if="column.dataIndex === 'tags'">
          <a-space wrap>
            <a-tag v-for="tag in JSON.parse(record.tags || '[]')" :key="tag">{{ tag }}</a-tag>
          </a-space>
        </template>
        <template v-if="column.dataIndex === 'picInfo'">
          <div>格式：{{ record.picFormat }}</div>
          <div>宽度：{{ record.picWidth }}</div>
          <div>高度：{{ record.picHeight }}</div>
          <div>宽高比：{{ record.picScale }}</div>
          <div>大小：{{ formatSize(record.picSize) }}</div>
        </template>
        <template v-if="column.dataIndex === 'reviewMessage'">
          <div>
            审核状态：
            <span
              :style="{
                color:
                  record.reviewStatus === PIC_REVIEW_STATUS_ENUM.PASS
                    ? 'green'
                    : record.reviewStatus === PIC_REVIEW_STATUS_ENUM.REJECT
                      ? 'red'
                      : 'orange',
              }"
            >
              {{ PIC_REVIEW_STATUS_MAP[record.reviewStatus] }}
            </span>
          </div>
          <div>审核信息：{{ record.reviewMessage }}</div>
          <div>审核人：{{ record.reviewerId }}</div>
          <div v-if="record.reviewTime">
            审核时间：{{ dayjs(record.reviewTime).format('YYYY-MM-DD HH:mm:ss') }}
          </div>
        </template>
        <template v-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-if="column.dataIndex === 'editTime'">
          {{ dayjs(record.editTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-if="column.key === 'action'">
          <a-space wrap>
            <a-button
              type="link"
              v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.PASS"
              @click="handleReview(record, PIC_REVIEW_STATUS_ENUM.PASS)"
            >
              通过
            </a-button>
            <div>
              <a-button
                type="link"
                v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.REJECT"
                danger
                @click="showModal"
              >
                拒绝
              </a-button>
              <a-modal
                v-model:open="open"
                title="填写拒绝原因"
                @ok="handleReview(record, PIC_REVIEW_STATUS_ENUM.REJECT)"
              >
                <a-input v-model:value="rejectMessage" placeholder="请输入拒绝原因" />
              </a-modal>
            </div>
            <a-button type="link" :href="`/picture/add_picture?id=${record.id}`">编辑</a-button>
            <a-popconfirm
              title="您确定删除该图片吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="doDelete(record)"
            >
              <a-button type="link" danger>删除</a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  deletePictureUsingPost,
  doPictureReviewUsingPost,
  listPictureByPageUsingPost,
} from '@/api/pictureController.ts'
import {
  PIC_REVIEW_STATUS_ENUM,
  PIC_REVIEW_STATUS_MAP,
  PIC_REVIEW_STATUS_OPTIONS,
} from '@/constants/picture.ts'
import { formatSize } from '@/utils'

// 定义列
const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 120,
  },
  {
    title: '图片',
    dataIndex: 'url',
  },
  {
    title: '名称',
    dataIndex: 'name',
  },
  {
    title: '简介',
    dataIndex: 'introduction',
    ellipsis: true,
  },
  {
    title: '类型',
    dataIndex: 'category',
  },
  {
    title: '标签',
    dataIndex: 'tags',
  },
  {
    title: '图片信息',
    dataIndex: 'picInfo',
  },
  {
    title: '用户 id',
    dataIndex: 'userId',
    width: 120,
  },
  {
    title: '审核信息',
    dataIndex: 'reviewMessage',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
  },
  {
    title: '编辑时间',
    dataIndex: 'editTime',
  },
  {
    title: '操作',
    key: 'action',
  },
]
// 定义数据
const dataList = ref<API.Picture[]>([])
const total = ref(0)
// 搜索条件
const searchParams = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: 'createTime',
  sortOrder: 'descend',
})
// 分页信息
const pagination = computed(() => {
  return {
    current: searchParams.current,
    pageSize: searchParams.pageSize,
    total: total.value,
    showSizeChanger: true,
    showTotal: (total: any) => `共 ${total} 条`,
  }
})
const rejectMessage = ref<string>('')
const open = ref<boolean>(false)

onMounted(() => {
  fetchData()
})

const showModal = () => {
  open.value = true
}

/**
 * 获取数据
 */
const fetchData = async () => {
  const res = await listPictureByPageUsingPost({
    ...searchParams,
  })
  if (res.data.code == 200 && res.data.data) {
    dataList.value = res.data.data.records ?? []
    total.value = res.data.data.total ?? 0
  } else {
    message.error('获取数据失败，' + res.data.message)
  }
}

/**
 * 表格改变
 * @param pagination
 */
const doTableChange = (pagination: any) => {
  searchParams.current = pagination.current
  searchParams.pageSize = pagination.pageSize
  fetchData()
}

/**
 * 搜索
 */
const doSearch = () => {
  searchParams.current = 1
  fetchData()
}

/**
 * 删除数据
 * @param record
 */
const doDelete = async (record: API.PictureVO) => {
  const res = await deletePictureUsingPost({ id: record.id })
  if (res.data.code == 200) {
    message.success('删除成功')
    // 重新获取列表数据
    await fetchData()
  } else {
    message.error('删除失败，' + res.data.message)
  }
}

/**
 * 审核图片
 * @param record
 * @param reviewStatus
 */
const handleReview = async (record: API.Picture, reviewStatus: number) => {
  open.value = false
  const reviewMessage =
    reviewStatus === PIC_REVIEW_STATUS_ENUM.PASS ? '管理员操作通过' : rejectMessage.value
  const res = await doPictureReviewUsingPost({
    id: record.id,
    reviewStatus,
    reviewMessage,
  })
  if (res.data.code === 200) {
    message.success('审核操作成功')
    // 重新获取列表数据
    await fetchData()
  } else {
    message.error('审核操作失败，' + res.data.message)
  }
}
</script>

<style scoped></style>
