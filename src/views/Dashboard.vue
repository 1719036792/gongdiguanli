<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="aside">
      <el-menu
        :default-active="activeMenu"
        class="menu"
        @select="handleSelect"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        
        <!-- 系统管理菜单 - 仅管理员可见 -->
        <el-sub-menu index="sys" v-if="currentRoleId === '1'">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system/user">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/system/role">
            <el-icon><Avatar /></el-icon>
            <span>角色管理</span>
          </el-menu-item>
          <el-menu-item index="/system/department">
            <el-icon><OfficeBuilding /></el-icon>
            <span>部门管理</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 人员管理 - 仅管理员可见 -->
        <el-sub-menu index="1" v-if="currentRoleId === '1'">
          <template #title>
            <el-icon><User /></el-icon>
            <span>人员管理</span>
          </template>
          <el-menu-item index="/employee/list">员工信息</el-menu-item>
        </el-sub-menu>
        
        <!-- 流程管理菜单 - 仅管理员可见 -->
        <el-sub-menu index="5" v-if="currentRoleId === '1'">
          <template #title>
            <el-icon><Connection /></el-icon>
            <span>流程管理</span>
          </template>
          <el-menu-item index="/flow/definition">
            <el-icon><Document /></el-icon>
            <span>流程定义</span>
          </el-menu-item>
        </el-sub-menu>

        <!-- 请假管理菜单 - 所有角色可见 -->
        <el-sub-menu index="6">
          <template #title>
            <el-icon><Calendar /></el-icon>
            <span>请假管理</span>
          </template>
          <el-menu-item index="/leave/apply">
            <el-icon><EditPen /></el-icon>
            <span>请假申请</span>
          </el-menu-item>
          <el-menu-item index="/leave/approval">
            <el-icon><Check /></el-icon>
            <span>请假审批</span>
          </el-menu-item>
          <el-menu-item index="/leave/record">
            <el-icon><Document /></el-icon>
            <span>请假记录</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 项目管理菜单 - 管理员和roleId=3可见 -->
        <el-sub-menu index="7" v-if="currentRoleId === '1' || currentRoleId === '3'">
          <template #title>
            <el-icon><Briefcase /></el-icon>
            <span>项目管理</span>
          </template>
          <el-menu-item index="/project">
            <el-icon><Management /></el-icon>
            <span>项目列表</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 任务管理菜单 - 根据角色显示不同子菜单 -->
        <el-sub-menu index="2" v-if="currentRoleId === '1' || currentRoleId === '3' || currentRoleId === '4'">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>任务管理</span>
          </template>
          <!-- 任务列表 - 管理员和roleId=3可见 -->
          <el-menu-item index="/task/list" v-if="currentRoleId === '1' || currentRoleId === '3'">
            <el-icon><Check /></el-icon>
            <span>任务列表</span>
          </el-menu-item>
          <!-- 我的任务 - 所有角色可见 -->
          <el-menu-item index="/task/my">
            <el-icon><User /></el-icon>
            <span>我的任务</span>
          </el-menu-item>
          <!-- 统计分析 - 管理员和roleId=3可见 -->
          <el-menu-item index="/task/statistics" v-if="currentRoleId === '1' || currentRoleId === '3'">
            <el-icon><Refresh /></el-icon>
            <span>统计分析</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 后勤管理菜单 - 仅管理员可见 -->
        <el-sub-menu index="8" v-if="currentRoleId === '1'">
          <template #title>
            <el-icon><HomeFilled /></el-icon>
            <span>后勤管理</span>
          </template>
          <el-menu-item index="/logistics/accommodation">
            <el-icon><House /></el-icon>
            <span>住宿管理</span>
          </el-menu-item>
          <el-menu-item index="/logistics/equipment">
            <el-icon><Tools /></el-icon>
            <span>设备管理</span>
          </el-menu-item>
        </el-sub-menu>
        
        <!-- 公告管理菜单 - 所有角色可见 -->
        <el-sub-menu index="9">
          <template #title>
            <el-icon><Bell /></el-icon>
            <span>公告管理</span>
          </template>
          <el-menu-item index="/announcement">
            <el-icon><ChatLineRound /></el-icon>
            <span>公告列表</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>
    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentMenu }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <span class="username">{{ username }}</span>
          <el-dropdown @command="handleCommand">
            <el-button type="text">
              <el-icon><User /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main">
        <router-view></router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Monitor, User, Tools, QuestionFilled, Refresh, Connection, Document, Calendar, EditPen, Check, Briefcase, HomeFilled, Bell, ChatLineRound, Management, House, Setting, Avatar, OfficeBuilding } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()

const activeMenu = ref(route.path)
const currentMenu = ref('工作台')
const username = ref(localStorage.getItem('username') || '用户')

const currentRoleId = localStorage.getItem('roleId')

// 路由路径与菜单名称的映射
const menuMap = {
  '/dashboard': '工作台',
  '/employee/list': '员工信息',
  '/flow/definition': '流程定义',
  '/flow/design': '流程设计',
  '/leave/apply': '请假申请',
  '/leave/approval': '请假审批',
  '/leave/record': '请假记录',
  '/project': '项目列表',
  '/logistics': '后勤服务',
  '/logistics/accommodation': '住宿管理',
  '/logistics/equipment': '设备管理',
  '/logistics/supplies': '物资管理',
  '/task/list': '任务列表',
  '/task/my': '我的任务',
  '/task/statistics': '任务统计',
  '/announcement': '公告列表',
  '/system/user': '用户管理',
  '/system/role': '角色管理',
  '/system/department': '部门管理'
}

// 监听路由变化，更新当前菜单
watch(() => route.path, (newPath) => {
  activeMenu.value = newPath
  currentMenu.value = menuMap[newPath] || ''
}, { immediate: true })

const handleSelect = (index) => {
  currentMenu.value = menuMap[index] || ''
  if (index.startsWith('/')) {
    router.push(index)
  }
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确认退出登录？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      // 清除登录信息
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
      localStorage.removeItem('roleId')
      // 跳转到登录页
      router.push('/portal')
    })
  }
}

onMounted(() => {
  // 检查是否是管理员，如果不是且当前路径为仅管理员可见的路径，则重定向
  if (route.path === '/dashboard' && currentRoleId !== '1') {
    router.push('/task/my')
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  width: 100%;
  display: flex;
  margin: 0;
  padding: 0;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.aside {
  background-color: #304156;
  height: 100%;
  overflow-y: auto;
  flex-shrink: 0;
}

.menu {
  height: 100%;
  border-right: none;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f0f2f5;
  height: 100%;
  overflow: hidden;
  min-width: 0;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.username {
  font-size: 14px;
  color: #606266;
}

.main {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.dashboard {
  padding: 20px;

  .time-range {
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .stat-cards {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .el-icon {
        font-size: 16px;
        color: #909399;
        cursor: help;
      }
    }

    .card-content {
      text-align: center;

      .rate {
        font-size: 36px;
        font-weight: bold;
        color: #409EFF;
      }

      .number {
        font-size: 36px;
        font-weight: bold;

        &.warning {
          color: #E6A23C;
        }

        &.alert {
          color: #F56C6C;
        }
      }

      .detail {
        margin-top: 10px;
        display: flex;
        justify-content: space-around;
        color: #606266;
      }

      .label {
        margin-top: 10px;
        color: #606266;
      }
    }
  }

  .charts {
    .chart {
      height: 300px;
    }
  }
}

/* 响应式布局 */
@media screen and (max-width: 1400px) {
  .chart-card {
    height: 350px;
  }
  
  .chart {
    height: 270px;
  }
}

@media screen and (max-width: 1200px) {
  .chart-card {
    height: 300px;
  }
  
  .chart {
    height: 220px;
  }
}
</style>