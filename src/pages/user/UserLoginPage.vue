<template>
  <div id="userLoginPage">
    <div class="login-container">
      <!-- 左侧装饰 -->
      <div class="login-decoration">
        <div class="deco-content">
          <div class="deco-title">灵图</div>
          <div class="deco-subtitle">发现美好，分享精彩</div>
          <div class="deco-features">
            <div class="feature-item">
              <PictureOutlined />
              <span>海量高清壁纸</span>
            </div>
            <div class="feature-item">
              <CloudOutlined />
              <span>云端存储管理</span>
            </div>
            <div class="feature-item">
              <TeamOutlined />
              <span>团队协作共享</span>
            </div>
          </div>
        </div>
        <div class="deco-bg">
          <div class="circle circle-1"></div>
          <div class="circle circle-2"></div>
          <div class="circle circle-3"></div>
        </div>
      </div>

      <!-- 右侧表单 -->
      <div class="login-form-wrapper">
        <div class="login-form">
          <div class="form-header">
            <div class="logo">
              <img src="@/assets/logo.png" alt="logo" />
            </div>
            <h2 class="title">欢迎回来</h2>
            <div class="subtitle">登录您的账户</div>
          </div>

          <a-form
            :model="formState"
            name="basic"
            autocomplete="off"
            @finish="handleSubmit"
            layout="vertical"
            class="form"
          >
            <a-form-item
              name="userAccount"
              :rules="[{ required: true, message: '请输入账号' }]"
            >
              <a-input
                v-model:value="formState.userAccount"
                placeholder="请输入账号"
                size="large"
              >
                <template #prefix>
                  <UserOutlined class="input-icon" />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item
              name="userPassword"
              :rules="[
                { required: true, message: '请输入密码' },
                { min: 8, message: '密码不能小于 8 位' },
              ]"
            >
              <a-input-password
                v-model:value="formState.userPassword"
                placeholder="请输入密码"
                size="large"
              >
                <template #prefix>
                  <LockOutlined class="input-icon" />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                html-type="submit"
                size="large"
                block
                class="login-btn"
                :loading="loading"
              >
                登录
              </a-button>
            </a-form-item>

            <div class="form-footer">
              <span class="footer-text">还没有账号？</span>
              <RouterLink to="/user/register" class="register-link">立即注册</RouterLink>
            </div>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { userLoginUsingPost } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore.ts'
import router from '@/router'
import {
  CloudOutlined,
  LockOutlined,
  PictureOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'

const formState = reactive<API.UserLoginRequest>({
  userAccount: '',
  userPassword: '',
})
const loginUserStore = useLoginUserStore()
const loading = ref(false)

const handleSubmit = async (values: any) => {
  loading.value = true
  try {
    const res = await userLoginUsingPost(values)
    if (res.data.code === 200 && res.data.data) {
      await loginUserStore.fetchLoginUser()
      message.success('登录成功')
      await router.push({
        path: '/',
        replace: true,
      })
    } else {
      message.error('登录失败，' + res.data.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
#userLoginPage {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-container {
  display: flex;
  max-width: 1000px;
  width: 100%;
  min-height: 600px;
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}

/* 左侧装饰 */
.login-decoration {
  flex: 1;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
  padding: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.deco-content {
  position: relative;
  z-index: 2;
  text-align: center;
}

.deco-title {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, #fff 0%, rgba(255, 255, 255, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 12px;
}

.deco-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 48px;
}

.deco-features {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
  font-size: 15px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(8px);
}

.feature-item :deep(.anticon) {
  font-size: 20px;
  color: #667eea;
}

/* 装饰背景 */
.deco-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: -50px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 30%;
}

/* 右侧表单 */
.login-form-wrapper {
  flex: 1;
  padding: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-form {
  width: 100%;
  max-width: 360px;
}

.form-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.subtitle {
  color: rgba(255, 255, 255, 0.5);
  font-size: 15px;
}

/* 表单样式 */
.form :deep(.ant-form-item) {
  margin-bottom: 24px;
}

.form :deep(.ant-input-affix-wrapper) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 2px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  transition: all 0.3s ease;
}

.form :deep(.ant-input-affix-wrapper:hover) {
  border-color: rgba(102, 126, 234, 0.4) !important;
}

.form :deep(.ant-input-affix-wrapper-focused) {
  border-color: #667eea !important;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
}

.form :deep(.ant-input) {
  background: transparent !important;
  color: #fff !important;
  font-size: 15px;
}

.form :deep(.ant-input::placeholder) {
  color: rgba(255, 255, 255, 0.3);
}

.input-icon {
  color: rgba(255, 255, 255, 0.4);
}

.form :deep(.ant-input-password-icon) {
  color: rgba(255, 255, 255, 0.4);
}

/* 登录按钮 */
.login-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  height: 48px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4) !important;
  transition: all 0.3s ease !important;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5) !important;
}

/* 表单底部 */
.form-footer {
  text-align: center;
  padding-top: 8px;
}

.footer-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
}

.register-link {
  color: #667eea;
  font-weight: 500;
  margin-left: 4px;
  transition: color 0.3s ease;
}

.register-link:hover {
  color: #8b9cf5;
}

/* 响应式 */
@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    max-width: 400px;
  }

  .login-decoration {
    padding: 40px;
    min-height: auto;
  }

  .deco-title {
    font-size: 36px;
  }

  .deco-subtitle {
    margin-bottom: 32px;
  }

  .deco-features {
    display: none;
  }

  .login-form-wrapper {
    padding: 40px;
  }
}
</style>
