<template>
  <div id="basicLayout">
    <a-layout class="layout-container">
      <!-- 顶部导航 -->
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>

      <a-layout class="main-layout">
        <!-- 侧边栏 -->
        <GlobalSider class="sider" />

        <!-- 主内容区 -->
        <a-layout-content class="content">
          <div class="content-wrapper">
            <router-view v-slot="{ Component }">
              <transition name="fade-slide" mode="out-in">
                <component :is="Component" />
              </transition>
            </router-view>
          </div>
        </a-layout-content>
      </a-layout>

      <!-- 底部 -->
      <a-layout-footer class="footer">
        <div class="footer-content">
          <span class="footer-text">
            <HeartFilled class="heart-icon" />
            灵图 - 发现美好，分享精彩
          </span>
          <span class="footer-copyright">© 2024 LingTu</span>
        </div>
      </a-layout-footer>
    </a-layout>

    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from '@/components/GlobalHeader.vue'
import GlobalSider from '@/components/GlobalSider.vue'
import { HeartFilled } from '@ant-design/icons-vue'
</script>

<style scoped>
#basicLayout {
  min-height: 100vh;
  position: relative;
}

/* 背景装饰 */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
  overflow: hidden;
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
  background-size: 60px 60px;
}

.bg-decoration::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 30%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 70% 70%, rgba(118, 75, 162, 0.1) 0%, transparent 50%);
  animation: bgFloat 20s ease-in-out infinite;
}

@keyframes bgFloat {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-5%, -5%);
  }
}

/* 布局容器 */
.layout-container {
  min-height: 100vh;
  background: transparent;
}

/* 顶部导航 */
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 0;
  height: auto;
  line-height: normal;
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 主布局 */
.main-layout {
  background: transparent;
}

/* 侧边栏 */
.sider {
  background: rgba(26, 26, 46, 0.6) !important;
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
}

/* 内容区 */
.content {
  min-height: calc(100vh - 64px - 60px);
  background: transparent;
  padding: 0;
}

.content-wrapper {
  min-height: 100%;
}

/* 底部 */
.footer {
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 20px 24px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.footer-text {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.heart-icon {
  color: #ff6b6b;
  animation: heartbeat 1.5s ease-in-out infinite;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.footer-copyright {
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}

/* 页面切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 菜单样式覆盖 */
:deep(.ant-menu) {
  background: transparent !important;
  border: none !important;
}

:deep(.ant-menu-item) {
  color: rgba(255, 255, 255, 0.7) !important;
  border-radius: 8px !important;
  margin: 4px 8px !important;
  transition: all 0.3s ease !important;
}

:deep(.ant-menu-item:hover) {
  color: #fff !important;
  background: rgba(102, 126, 234, 0.2) !important;
}

:deep(.ant-menu-item-selected) {
  color: #fff !important;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.4) 0%, rgba(118, 75, 162, 0.4) 100%) !important;
}

:deep(.ant-menu-horizontal) {
  border-bottom: none !important;
  line-height: 62px !important;
}

:deep(.ant-menu-horizontal > .ant-menu-item) {
  top: 0 !important;
}

:deep(.ant-menu-inline) {
  border-inline-end: none !important;
}

/* 响应式 */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
}
</style>
