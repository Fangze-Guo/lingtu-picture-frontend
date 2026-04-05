<template>
  <div id="userRegisterPage">
    <div class="register-container">
      <!-- 左侧装饰 -->
      <div class="register-decoration">
        <div class="deco-content">
          <div class="deco-title">灵图</div>
          <div class="deco-subtitle">发现美好，分享精彩</div>
          <div class="deco-features">
            <div class="feature-item">
              <SafetyOutlined />
              <span>安全可靠存储</span>
            </div>
            <div class="feature-item">
              <CloudUploadOutlined />
              <span>一键上传图片</span>
            </div>
            <div class="feature-item">
              <ShareAltOutlined />
              <span>轻松分享协作</span>
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
      <div class="register-form-wrapper">
        <div class="register-form">
          <div class="form-header">
            <div class="logo">
              <img src="@/assets/logo.png" alt="logo" />
            </div>
            <h2 class="title">创建账户</h2>
            <div class="subtitle">加入灵图社区</div>
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

            <a-form-item
              name="checkPassword"
              :rules="[
                { required: true, message: '请确认密码' },
                { min: 8, message: '密码不能小于 8 位' },
                { validator: validateCheckPassword },
              ]"
            >
              <a-input-password
                v-model:value="formState.checkPassword"
                placeholder="请确认密码"
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
                class="register-btn"
                :loading="loading"
              >
                注册
              </a-button>
            </a-form-item>

            <div class="form-footer">
              <span class="footer-text">已有账号？</span>
              <RouterLink to="/user/login" class="login-link">立即登录</RouterLink>
            </div>
          </a-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { userRegisterUsingPost } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import router from '@/router'
import {
  CloudUploadOutlined,
  LockOutlined,
  SafetyOutlined,
  ShareAltOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'

const formState = reactive<API.UserRegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: '',
})

const loading = ref(false)

// 验证确认密码
const validateCheckPassword = async (_rule: any, value: string) => {
  if (value && value !== formState.userPassword) {
    return Promise.reject('两次输入的密码不一致')
  }
  return Promise.resolve()
}

const handleSubmit = async (values: any) => {
  loading.value = true
  try {
    const res = await userRegisterUsingPost(values)
    if (res.data.code === 200 && res.data.data) {
      message.success('注册成功')
      await router.push({
        path: '/user/login',
        replace: true,
      })
    } else {
      message.error('注册失败，' + res.data.message)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
#userRegisterPage {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.register-container {
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
.register-decoration {
  flex: 1;
  background: linear-gradient(135deg, rgba(118, 75, 162, 0.3) 0%, rgba(102, 126, 234, 0.3) 100%);
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
  color: #764ba2;
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
  left: -100px;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  right: -50px;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  right: 30%;
}

/* 右侧表单 */
.register-form-wrapper {
  flex: 1;
  padding: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-form {
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
  box-shadow: 0 8px 24px rgba(118, 75, 162, 0.3);
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
  margin-bottom: 20px;
}

.form :deep(.ant-input-affix-wrapper) {
  background: rgba(255, 255, 255, 0.05) !important;
  border: 2px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 12px !important;
  padding: 12px 16px !important;
  transition: all 0.3s ease;
}

.form :deep(.ant-input-affix-wrapper:hover) {
  border-color: rgba(118, 75, 162, 0.4) !important;
}

.form :deep(.ant-input-affix-wrapper-focused) {
  border-color: #764ba2 !important;
  box-shadow: 0 0 0 4px rgba(118, 75, 162, 0.1) !important;
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

.form :deep(.ant-form-item-explain-error) {
  color: #ff6b6b;
  font-size: 12px;
  margin-top: 4px;
}

/* 注册按钮 */
.register-btn {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  height: 48px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  box-shadow: 0 8px 24px rgba(118, 75, 162, 0.4) !important;
  transition: all 0.3s ease !important;
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(118, 75, 162, 0.5) !important;
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

.login-link {
  color: #764ba2;
  font-weight: 500;
  margin-left: 4px;
  transition: color 0.3s ease;
}

.login-link:hover {
  color: #9b6fc5;
}

/* 响应式 */
@media (max-width: 768px) {
  .register-container {
    flex-direction: column;
    max-width: 400px;
  }

  .register-decoration {
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

  .register-form-wrapper {
    padding: 40px;
  }
}
</style>
