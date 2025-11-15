<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>系统登录</h2>
      </template>
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef">
        <el-form-item prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名">
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" @keyup.enter="handleLogin">
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin" :loading="loading" class="login-button">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { post } from '../utils/request'

const router = useRouter()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    // 调用登录API
    const res = await post('/api/noLogin/login', {
      username: loginForm.username,
      password: loginForm.password
    })
    
    // 保存token和用户信息
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userId', res.data.userId)
    localStorage.setItem('username', res.data.username)
    localStorage.setItem('roleId', res.data.roleId)
    
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (error) {
    console.error('登录失败', error)
    ElMessage.error(error.message || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
  background-image: linear-gradient(to bottom right, #1976d2, #64b5f6);
}

.login-card {
  width: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.login-card :deep(.el-card__header) {
  text-align: center;
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.login-card :deep(.el-card__header h2) {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.login-card :deep(.el-card__body) {
  padding: 30px 20px;
}

.login-button {
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
}

.register-link {
  text-align: center;
  margin-top: 15px;
}

.register-link a {
  color: #409EFF;
  text-decoration: none;
  font-size: 14px;
}

.register-link a:hover {
  text-decoration: underline;
}

:deep(.el-input__wrapper) {
  padding: 0 15px;
}

:deep(.el-input__inner) {
  height: 42px;
}

:deep(.el-form-item) {
  margin-bottom: 25px;
}

:deep(.el-form-item:last-child) {
  margin-bottom: 0;
}
</style>