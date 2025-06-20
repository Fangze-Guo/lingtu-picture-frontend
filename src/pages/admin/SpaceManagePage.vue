<template>
  <div id="spaceManagePage">
    <a-space style="margin-bottom: 16px">
      <a-button type="primary" href="/space/add_space" target="_blank">+ 创建空间</a-button>
    </a-space>
    <!-- 搜索表单 -->
    <a-form :model="searchParams" layout="inline" @finish="doSearch" style="margin-bottom: 30px">
      <a-form-item label="空间名称">
        <a-input v-model:value="searchParams.spaceName" placeholder="请输入空间名称" allow-clear />
      </a-form-item>
      <a-form-item label="空间级别">
        <a-select
          v-model:value="searchParams.spaceLevel"
          placeholder="请选择空间级别"
          :options="SPACE_LEVEL_OPTIONS"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>
      <a-form-item label="用户 id">
        <a-input v-model:value="searchParams.userId" placeholder="请输入用户 id" allow-clear />
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
        <!-- 空间级别 -->
        <template v-if="column.dataIndex === 'spaceLevel'">
          <a-tag v-if="record.spaceLevel == 0">{{ SPACE_LEVEL_MAP[record.spaceLevel] }} </a-tag>
          <a-tag v-if="record.spaceLevel == 1" style="background-color: skyblue"
            >{{ SPACE_LEVEL_MAP[record.spaceLevel] }}
          </a-tag>
          <a-tag v-if="record.spaceLevel == 2" style="background-color: gold"
            >{{ SPACE_LEVEL_MAP[record.spaceLevel] }}
          </a-tag>
        </template>
        <!-- 使用情况 -->
        <template v-if="column.dataIndex === 'spaceUseInfo'">
          <div>大小：{{ formatSize(record.totalSize) }} / {{ formatSize(record.maxSize) }}</div>
          <div>数量：{{ record.totalCount }} / {{ record.maxCount }}</div>
        </template>
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.dataIndex === 'editTime'">
          {{ dayjs(record.editTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>
        <template v-else-if="column.key === 'action'">
          <a-space wrap>
            <a-button type="link" :href="`/space/add_space?id=${record.id}`" target="_blank">
              编辑
            </a-button>
            <a-button type="link" danger @click="doDelete(record.id)">删除</a-button>
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
import { deleteSpaceUsingPost, listSpaceByPageUsingPost } from '@/api/spaceController.ts'
import { SPACE_LEVEL_MAP, SPACE_LEVEL_OPTIONS } from '@/constants/space.ts'
import { formatSize } from '@/utils'

// 定义列
const columns = [
  {
    title: 'id',
    dataIndex: 'id',
    width: 80,
  },
  {
    title: '空间名称',
    dataIndex: 'spaceName',
  },
  {
    title: '空间级别',
    dataIndex: 'spaceLevel',
  },
  {
    title: '使用情况',
    dataIndex: 'spaceUseInfo',
  },
  {
    title: '用户 id',
    dataIndex: 'userId',
    width: 80,
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
const dataList = ref<API.Space[]>([])
const total = ref(0)
// 搜索条件
const searchParams = reactive<API.SpaceQueryRequest>({
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
  const res = await listSpaceByPageUsingPost({
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
const doDelete = async (record: API.SpaceVO) => {
  const res = await deleteSpaceUsingPost({ id: record.id })
  if (res.data.code == 200) {
    message.success('删除成功')
    // 重新获取列表数据
    await fetchData()
  } else {
    message.error('删除失败，' + res.data.message)
  }
}
</script>

<style scoped></style>
