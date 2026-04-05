<template>
  <div id="globalHeader">
    <div class="header-inner">
      <!-- Logo区域 -->
      <RouterLink to="/" class="logo-section">
        <div class="logo-wrapper">
          <img class="logo" src="../assets/logo.png" alt="logo" />
          <div class="logo-text">
            <span class="title">灵图</span>
            <span class="subtitle">LingTu</span>
          </div>
        </div>
      </RouterLink>

      <!-- 导航菜单 -->
      <div class="nav-menu">
        <a-menu
          v-model:selectedKeys="current"
          mode="horizontal"
          :items="items"
          @click="doMenuClick"
          class="transparent-menu"
        />
      </div>

      <!-- 右侧操作区 -->
      <div class="header-actions">
        <!-- 搜索按钮 -->
        <a-tooltip title="搜索">
          <a-button type="text" class="action-btn" @click="showSearch = true">
            <template #icon><SearchOutlined /></template>
          </a-button>
        </a-tooltip>

        <!-- 主题切换 -->
        <a-tooltip title="主题">
          <a-button type="text" class="action-btn">
            <template #icon><BulbOutlined /></template>
          </a-button>
        </a-tooltip>

        <!-- 用户区域 -->
        <div class="user-section">
          <div v-if="loginUserStore.loginUser.id" class="user-info">
            <a-dropdown placement="bottomRight" :overlayStyle="{ background: 'rgba(26, 26, 46, 0.95)' }">
              <div class="user-avatar-wrapper">
                <a-avatar
                  :src="loginUserStore.loginUser.userAvatar"
                  :size="36"
                  class="user-avatar"
                />
                <div class="user-name">{{ loginUserStore.loginUser.userName ?? '无名' }}</div>
                <DownOutlined class="dropdown-icon" />
              </div>
              <template #overlay>
                <a-menu class="dropdown-menu">
                  <a-menu-item key="profile">
                    <router-link to="/my_space">
                      <UserOutlined />
                      <span>我的空间</span>
                    </router-link>
                  </a-menu-item>
                  <a-menu-divider />
                  <a-menu-item key="logout" @click="doLogout">
                    <LogoutOutlined />
                    <span>退出登录</span>
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </div>
          <div v-else class="login-section">
            <a-button type="primary" href="/user/login" class="login-btn">
              <template #icon><LoginOutlined /></template>
              登录
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索弹窗 -->
    <a-modal
      v-model:open="showSearch"
      :footer="null"
      :closable="false"
      class="search-modal"
      width="600px"
      centered
    >
      <div class="search-modal-content">
        <a-input-search
          v-model:value="searchText"
          placeholder="搜索图片、标签、分类..."
          size="large"
          enter-button="搜索"
          @search="doSearch"
          class="search-input"
        />
        <div class="hot-tags">
          <span class="hot-label">热门：</span>
          <a-tag v-for="tag in hotTags" :key="tag" class="hot-tag">{{ tag }}</a-tag>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, h, ref } from 'vue'
import {
  BulbOutlined,
  DownOutlined,
  HomeOutlined,
  LoginOutlined,
  LogoutOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import { MenuProps, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import { userLogoutUsingPost } from '@/api/userController.ts'

const current = ref<string[]>([])
const router = useRouter()
const showSearch = ref(false)
const searchText = ref('')
const hotTags = ['风景', '动漫', '人物', '建筑', '动物']

// 菜单列表
const originItems = [
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
  },
  {
    key: '/admin/pictureManage',
    label: '图片管理',
    title: '图片管理',
  },
  {
    key: '/admin/spaceManage',
    label: '空间管理',
    title: '空间管理',
  },
]

// 过滤菜单项
const filterMenus = (menus = [] as MenuProps['items']) => {
  return menus?.filter((menu) => {
    if (menu?.key?.startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser
      if (!loginUser || loginUser.userRole !== 'admin') {
        return false
      }
    }
    return true
  })
}

// 展示在菜单的路由数组
const items = computed<MenuProps['items']>(() => filterMenus(originItems))
const loginUserStore = useLoginUserStore()

// 路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  router.push({
    path: key,
  })
}

// 监听路由变化，更新当前选中菜单
router.afterEach((to) => {
  current.value = [to.path]
})

// 搜索
const doSearch = () => {
  if (searchText.value.trim()) {
    router.push({
      path: '/',
      query: { searchText: searchText.value }
    })
    showSearch.value = false
    searchText.value = ''
  }
}

// 用户注销
const doLogout = async () => {
  const res = await userLogoutUsingPost()
  if (res.data.code === 200) {
    message.success('退出登录成功')
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    await router.push({
      path: '/user/login',
      replace: true,
    })
  } else {
    console.log('退出登录失败' + res.data.message)
  }
}
</script>

<style scoped>
#globalHeader {
  width: 100%;
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  max-width: 1600px;
  margin: 0 auto;
}

/* Logo区域 */
.logo-section {
  text-decoration: none;
}

.logo-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  transition: transform 0.3s ease;
}

.logo-wrapper:hover {
  transform: scale(1.05);
}

.logo {
  height: 40px;
  width: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}

.subtitle {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* 导航菜单 */
.nav-menu {
  flex: 1;
  display: flex;
  justify-content: center;
}

.transparent-menu {
  background: transparent !important;
}

/* 右侧操作区 */
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.action-btn:hover {
  color: #fff !important;
  background: rgba(102, 126, 234, 0.2) !important;
}

/* 用户区域 */
.user-section {
  margin-left: 16px;
}

.user-avatar-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-avatar-wrapper:hover {
  background: rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.3);
}

.user-avatar {
  border: 2px solid rgba(102, 126, 234, 0.5);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.user-name {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  font-weight: 500;
}

.dropdown-icon {
  color: rgba(255, 255, 255, 0.5);
  font-size: 10px;
  transition: transform 0.3s ease;
}

.user-avatar-wrapper:hover .dropdown-icon {
  transform: rotate(180deg);
}

/* 登录按钮 */
.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 20px !important;
  padding: 0 24px !important;
  height: 40px !important;
  font-weight: 500 !important;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4) !important;
  transition: all 0.3s ease !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
}

/* 下拉菜单 */
.dropdown-menu {
  background: rgba(26, 26, 46, 0.95) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 8px;
  min-width: 160px;
}

:deep(.dropdown-menu .ant-dropdown-menu-item) {
  color: rgba(255, 255, 255, 0.8) !important;
  border-radius: 8px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

:deep(.dropdown-menu .ant-dropdown-menu-item:hover) {
  background: rgba(102, 126, 234, 0.2) !important;
  color: #fff !important;
}

:deep(.dropdown-menu .ant-dropdown-menu-item a) {
  color: inherit;
  display: flex;
  align-items: center;
  gap: 10px;
}

:deep(.dropdown-menu .ant-dropdown-menu-item-divider) {
  background: rgba(255, 255, 255, 0.1) !important;
  margin: 4px 0;
}

/* 搜索弹窗 */
.search-modal-content {
  padding: 20px;
}

:deep(.search-modal .ant-modal-content) {
  background: rgba(26, 26, 46, 0.98) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

.search-input :deep(.ant-input) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px 0 0 12px !important;
  padding: 12px 20px;
  color: #fff !important;
}

.search-input :deep(.ant-input::placeholder) {
  color: rgba(255, 255, 255, 0.4);
}

.search-input :deep(.ant-input-search-button) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 0 12px 12px 0 !important;
  height: auto;
  padding: 0 24px;
}

.hot-tags {
  margin-top: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hot-label {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.hot-tag {
  background: rgba(102, 126, 234, 0.2) !important;
  border: 1px solid rgba(102, 126, 234, 0.3) !important;
  color: rgba(255, 255, 255, 0.8) !important;
  border-radius: 16px !important;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.hot-tag:hover {
  background: rgba(102, 126, 234, 0.4) !important;
  color: #fff !important;
}

/* 响应式 */
@media (max-width: 992px) {
  .nav-menu {
    display: none;
  }
}

@media (max-width: 576px) {
  .header-inner {
    padding: 0 16px;
  }

  .logo-text {
    display: none;
  }

  .user-name {
    display: none;
  }
}
</style>
