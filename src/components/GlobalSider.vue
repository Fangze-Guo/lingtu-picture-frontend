<template>
  <div id="globalSider" v-if="loginUserStore.loginUser.id">
    <a-layout-sider
      class="sider"
      width="220"
      breakpoint="lg"
      collapsed-width="0"
      :trigger="null"
    >
      <div class="sider-content">
        <!-- 用户信息卡片 -->
        <div class="user-card">
          <a-avatar
            :src="loginUserStore.loginUser.userAvatar"
            :size="56"
            class="user-avatar"
          />
          <div class="user-info">
            <div class="user-name">{{ loginUserStore.loginUser.userName || '用户' }}</div>
            <div class="user-role">
              <a-tag color="purple" size="small">
                {{ loginUserStore.loginUser.userRole === 'admin' ? '管理员' : '普通用户' }}
              </a-tag>
            </div>
          </div>
        </div>

        <!-- 菜单 -->
        <div class="menu-section">
          <div class="menu-label">导航</div>
          <a-menu
            mode="inline"
            v-model:selectedKeys="current"
            :items="menuItems"
            @click="doMenuClick"
            class="sider-menu"
          />
        </div>

        <!-- 底部装饰 -->
        <div class="sider-footer">
          <div class="decoration-line"></div>
        </div>
      </div>
    </a-layout-sider>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { h, ref } from 'vue'
import { PictureOutlined, UserOutlined, AppstoreOutlined, StarOutlined } from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'

const menuItems = [
  {
    key: '/',
    label: '公共图库',
    icon: () => h(PictureOutlined),
  },
  {
    key: '/space/my_space',
    label: '我的空间',
    icon: () => h(UserOutlined),
  },
  {
    key: '/space/my_space',
    label: '收藏夹',
    icon: () => h(StarOutlined),
  },
]

const router = useRouter()
const loginUserStore = useLoginUserStore()

// 当前选中菜单
const current = ref<string[]>([])

// 监听路由变化，更新当前选中菜单
router.afterEach((to) => {
  current.value = [to.path]
})

// 路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  router.push({
    path: key,
  })
}
</script>

<style scoped>
#globalSider {
  height: 100%;
}

.sider {
  background: rgba(26, 26, 46, 0.6) !important;
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  height: 100%;
}

.sider-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
}

/* 用户卡片 */
.user-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
  text-align: center;
}

.user-avatar {
  border: 3px solid rgba(102, 126, 234, 0.5);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.user-name {
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.user-role :deep(.ant-tag) {
  background: rgba(102, 126, 234, 0.3) !important;
  border: 1px solid rgba(102, 126, 234, 0.4) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  border-radius: 12px;
  padding: 2px 10px;
}

/* 菜单区域 */
.menu-section {
  flex: 1;
}

.menu-label {
  color: rgba(255, 255, 255, 0.4);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 0 12px;
  margin-bottom: 8px;
}

.sider-menu {
  background: transparent !important;
  border: none !important;
}

.sider-menu :deep(.ant-menu-item) {
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 12px !important;
  margin: 4px 0 !important;
  padding: 12px 16px !important;
  height: auto !important;
  line-height: 1.5 !important;
  transition: all 0.3s ease !important;
  display: flex;
  align-items: center;
  gap: 12px;
}

.sider-menu :deep(.ant-menu-item:hover) {
  color: #fff !important;
  background: rgba(102, 126, 234, 0.15) !important;
  transform: translateX(4px);
}

.sider-menu :deep(.ant-menu-item-selected) {
  color: #fff !important;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%) !important;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
}

.sider-menu :deep(.ant-menu-item .anticon) {
  font-size: 16px;
}

/* 底部装饰 */
.sider-footer {
  padding-top: 20px;
}

.decoration-line {
  height: 3px;
  background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.5), transparent);
  border-radius: 2px;
}

/* 响应式 */
@media (max-width: 992px) {
  .sider {
    position: fixed !important;
    left: 0;
    top: 64px;
    bottom: 0;
    z-index: 99;
  }
}
</style>
