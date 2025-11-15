<template>
  <div class="portal-container">
    <div class="bg-decoration"></div>

    <div class="header">
      <div class="logo">
        <h1>工地管理系统</h1>
      </div>
      <div class="nav">
        <el-button type="primary" @click="goToLogin">登录系统</el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="left-section">
        <div class="welcome-card">
          <h1>高效智能的工地管理平台</h1>
          <p>全方位优化项目管理流程，提升工作效率</p>
          <el-button type="primary" size="large" @click="goToLogin">立即体验系统</el-button>
        </div>

        <div class="feature-cards">
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <el-icon><DataLine /></el-icon>
            </div>
            <h3>项目全生命周期管理</h3>
            <p>从立项到交付的全流程监控</p>
            <ul class="feature-list">
              <li>项目进度实时追踪</li>
              <li>资源智能分配</li>
              <li>多维度数据分析</li>
            </ul>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <el-icon><Management /></el-icon>
            </div>
            <h3>人员高效调度</h3>
            <p>优化人员分配与工作安排</p>
            <ul class="feature-list">
              <li>人员技能匹配</li>
              <li>工作负载均衡</li>
              <li>考勤自动化管理</li>
            </ul>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <el-icon><SetUp /></el-icon>
            </div>
            <h3>设备物资管理</h3>
            <p>追踪设备与物资使用情况</p>
            <ul class="feature-list">
              <li>设备状态监控</li>
              <li>库存预警机制</li>
              <li>物资使用分析</li>
            </ul>
          </div>
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <el-icon><Document /></el-icon>
            </div>
            <h3>工作流程自动化</h3>
            <p>自动化任务分配与审批流程</p>
            <ul class="feature-list">
              <li>智能任务指派</li>
              <li>流程自动化处理</li>
              <li>一键生成报表</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="right-section">
        <div class="stat-container">
          <h2>系统概览</h2>
          <div class="stat-cards">
            <div class="stat-card">
              <div class="stat-icon-bg">
                <el-icon><Monitor /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.projectCount }}+</div>
                <div class="stat-label">在建项目</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon-bg">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.userCount }}+</div>
                <div class="stat-label">注册用户</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon-bg">
                <el-icon><Histogram /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.taskMonthlyCount }}+</div>
                <div class="stat-label">月任务量</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon-bg">
                <el-icon><Checked /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ stats.availabilityRate }}%</div>
                <div class="stat-label">系统可用率</div>
              </div>
            </div>
          </div>
        </div>

        <div class="system-info">
          <h2>系统公告</h2>
          <div class="info-content">
            <div v-for="announcement in announcements" :key="announcement.id" class="announcement">
              <div class="announcement-header">
                <el-icon><Bell /></el-icon>
                <span class="announcement-title">{{ announcement.title }}</span>
                <span class="announcement-date">{{ formatDate(announcement.publishTime) }}</span>
              </div>
              <div class="announcement-content">
                {{ announcement.content }}
              </div>
            </div>
            <div v-if="announcements.length === 0" class="empty-announcements">
              <p>暂无公告</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>© 2024 工地管理系统 版权所有</p>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import {
  DataLine, Management, SetUp, Document,
  Monitor, UserFilled, Histogram, Checked, Bell
} from '@element-plus/icons-vue'
import { ref, onMounted } from 'vue'
import axios from 'axios'

const router = useRouter()
const stats = ref({
  projectCount: 0,
  userCount: 0,
  taskMonthlyCount: 0,
  availabilityRate: 0
})
const announcements = ref([])

// 获取系统统计数据
const fetchStats = async () => {
  try {
    const res = await axios.get('/api/noLogin/portal/stats')
    if (res.data.code === 200) {
      stats.value = res.data.data
    }
  } catch (error) {
    console.error('获取系统统计数据失败', error)
  }
}

// 获取最新公告
const fetchAnnouncements = async () => {
  try {
    const res = await axios.get('/api/noLogin/portal/announcements')
    if (res.data.code === 200) {
      announcements.value = res.data.data.list
    }
  } catch (error) {
    console.error('获取最新公告失败', error)
  }
}

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const goToLogin = () => {
  router.push('/login')
}

onMounted(() => {
  fetchStats()
  fetchAnnouncements()
})
</script>

<style scoped>
.portal-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f5fa;
  color: #333;
  overflow: hidden;
  position: relative;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 10% 20%, rgba(21, 101, 192, 0.05) 0%, transparent 20%),
    radial-gradient(circle at 85% 60%, rgba(0, 176, 255, 0.05) 0%, transparent 30%),
    radial-gradient(circle at 40% 80%, rgba(24, 144, 255, 0.05) 0%, transparent 25%),
    linear-gradient(135deg, rgba(24, 144, 255, 0.03) 0%, transparent 100%);
  z-index: 0;
  pointer-events: none;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  height: 60px;
  z-index: 10;
  position: relative;
}

.logo h1 {
  margin: 0;
  font-size: 20px;
  color: #1890ff;
  font-weight: 600;
}

.main-content {
  flex: 1;
  display: flex;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.left-section {
  flex: 3;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 150px;
  position: relative;
  overflow: hidden;
}

.welcome-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='rgba(255,255,255,0.1)' fill-rule='evenodd'/%3E%3C/svg%3E");
  opacity: 0.3;
}

.welcome-card h1 {
  font-size: 28px;
  margin: 0 0 12px 0;
  font-weight: 600;
  position: relative;
}

.welcome-card p {
  font-size: 16px;
  margin: 0 0 24px 0;
  opacity: 0.9;
  position: relative;
}

.feature-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 20px;
  flex: 1;
}

.feature-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  border: 1px solid rgba(24, 144, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, transparent 100%);
  z-index: 0;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.feature-icon-wrapper {
  width: 60px;
  height: 60px;
  background-color: rgba(24, 144, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  position: relative;
}

.feature-icon-wrapper el-icon {
  font-size: 30px;
  color: #1890ff;
}

.feature-card h3 {
  font-size: 16px;
  margin: 0 0 8px 0;
  color: #333;
  font-weight: 600;
  position: relative;
}

.feature-card p {
  font-size: 14px;
  margin: 0 0 12px 0;
  color: #666;
  position: relative;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  width: 100%;
  position: relative;
}

.feature-list li {
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
  padding-left: 18px;
  position: relative;
}

.feature-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #1890ff;
}

.stat-container, .system-info {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  border: 1px solid rgba(24, 144, 255, 0.1);
}

.stat-container h2, .system-info h2 {
  font-size: 18px;
  margin: 0 0 16px 0;
  color: #333;
  font-weight: 600;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  transition: transform 0.2s;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  transform: translateY(-3px);
  background-color: #f0f7ff;
}

.stat-icon-bg {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(24, 144, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.stat-icon-bg el-icon {
  font-size: 20px;
  color: #1890ff;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.system-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.announcement {
  margin-bottom: 15px;
  border-radius: 6px;
  background-color: #f9f9f9;
  overflow: hidden;
  transition: transform 0.2s;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.announcement:last-child {
  margin-bottom: 0;
}

.announcement:hover {
  transform: translateY(-3px);
  background-color: #f0f7ff;
}

.announcement-header {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  background-color: rgba(24, 144, 255, 0.05);
}

.announcement-header el-icon {
  color: #1890ff;
  margin-right: 10px;
}

.announcement-title {
  font-weight: 500;
  font-size: 14px;
  flex: 1;
  color: #1890ff;
}

.announcement-date {
  font-size: 12px;
  color: #999;
}

.announcement-content {
  padding: 12px 14px;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.footer {
  background-color: #fff;
  color: #666;
  text-align: center;
  padding: 12px;
  font-size: 14px;
  border-top: 1px solid #eee;
  position: relative;
  z-index: 1;
}

.empty-announcements {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
  background-color: #f9f9f9;
  border-radius: 6px;
  color: #999;
  font-size: 14px;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
  }

  .left-section, .right-section {
    flex: auto;
  }

  .feature-cards, .stat-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .welcome-card {
    min-height: auto;
  }
}

@media (max-width: 768px) {
  .feature-cards, .stat-cards {
    grid-template-columns: 1fr;
  }
}
</style>
