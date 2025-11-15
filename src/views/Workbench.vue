<template>
  <div class="workbench-container">
    <!-- 顶部统计卡片区域 -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="12" :sm="6" :md="6" :lg="6" :xl="6" v-for="(item, index) in systemStats" :key="index">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-card-content">
            <div class="stat-icon" :class="item.iconClass">
              <el-icon><component :is="item.icon"></component></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-title">{{ item.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 中间内容区域 -->
    <el-row :gutter="20" class="content-row">
      <el-col :span="24">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>项目任务分布统计</span>
              <el-radio-group v-model="taskStatsType" size="small" @change="handleTaskStatsTypeChange">
                <el-radio-button value="status">按状态</el-radio-button>
                <el-radio-button value="priority">按优先级</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="overview-chart-container">
            <div id="taskDistributionChart" class="overview-chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部卡片区域 -->
    <el-row :gutter="20" class="bottom-row">
      <el-col :span="12">
        <el-card class="box-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>公告信息</span>
              <el-button class="button" link @click="goToAnnouncements">查看更多</el-button>
            </div>
          </template>
          <div class="announcement-list">
            <el-empty description="暂无公告信息" v-if="announcements.length === 0"></el-empty>
            <div v-else>
              <div v-for="(item, index) in announcements" :key="index" class="announcement-item" @click="viewAnnouncement(item)">
                <div class="announcement-title">
                  <el-tag size="small" :type="getAnnouncementTagType(item.type)">{{ getAnnouncementType(item.type) }}</el-tag>
                  {{ item.title }}
                </div>
                <div class="announcement-time">{{ formatTime(item.publishTime) }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="box-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>设备状态</span>
            </div>
          </template>
          <div class="equipment-stats">
            <el-empty description="暂无设备数据" v-if="equipmentStats.length === 0"></el-empty>
            <div v-else class="pie-chart-container">
              <div id="equipmentChart" class="chart"></div>
              <div class="equipment-legend">
                <div v-for="(item, index) in equipmentStats" :key="index" class="legend-item">
                  <div class="legend-color" :style="{backgroundColor: getChartColor(index)}"></div>
                  <div class="legend-text">{{ item.name }}: {{ item.value }}台</div>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 公告详情对话框 -->
    <el-dialog
      v-model="announcementDialogVisible"
      title="公告详情"
      width="600px"
    >
      <div v-if="currentAnnouncement" class="announcement-detail">
        <h2 class="detail-title">{{ currentAnnouncement.title }}</h2>
        <div class="detail-info">
          <el-tag size="small" :type="getAnnouncementTagType(currentAnnouncement.type)">
            {{ getAnnouncementType(currentAnnouncement.type) }}
          </el-tag>
          <span class="detail-date">发布时间: {{ formatTime(currentAnnouncement.publishTime) }}</span>
          <span v-if="currentAnnouncement.publishBy" class="detail-publisher">
            发布人: {{ currentAnnouncement.publishBy }}
          </span>
        </div>
        <div class="detail-content">{{ currentAnnouncement.content }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed, onBeforeUnmount, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts/core'
import { PieChart, LineChart, BarChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, LegendComponent, GridComponent } from 'echarts/components'
import { LabelLayout } from 'echarts/features'
import { CanvasRenderer } from 'echarts/renderers'
import { Briefcase, List, User, Monitor, Calendar, Bell, Document } from '@element-plus/icons-vue'
import { getProjectCount, getTaskCount, getEmployeeCount, getEquipmentCount, getEquipmentStats, getAnnouncementList, getTaskDistributionStats } from '../api/stats.js'

// 注册ECharts必需的组件
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  PieChart,
  LineChart,
  BarChart,
  CanvasRenderer,
  LabelLayout
])

const router = useRouter()
const systemStats = ref([
  { title: '项目总数', value: 0, icon: markRaw(Briefcase), iconClass: 'project-icon' },
  { title: '任务总数', value: 0, icon: markRaw(List), iconClass: 'task-icon' },
  { title: '员工人数', value: 0, icon: markRaw(User), iconClass: 'employee-icon' },
  { title: '设备总数', value: 0, icon: markRaw(Monitor), iconClass: 'equipment-icon' }
])
const announcements = ref([])
const equipmentStats = ref([])
const taskStatsType = ref('status')
const currentAnnouncement = ref(null)
const announcementDialogVisible = ref(false)
let equipmentChart = null
let taskDistributionChart = null

// 处理任务统计类型变化
const handleTaskStatsTypeChange = (type) => {
  taskStatsType.value = type
  fetchTaskDistributionStats(type)
}

// 获取任务分布统计数据
const fetchTaskDistributionStats = async (type = 'status') => {
  try {
    const params = {
      type: type,
      startDate: new Date().getFullYear() + '-01-01',
      endDate: new Date().getFullYear() + '-12-31'
    }
    
    const response = await getTaskDistributionStats(params)
    if (response.code === 200) {
      nextTick(() => {
        updateTaskDistributionChart(response.data)
      })
    }
  } catch (error) {
    console.error('获取任务分布统计失败', error)
  }
}

// 获取系统概况统计
const fetchSystemStats = async () => {
  try {
    const [projectResponse, taskResponse, employeeResponse, equipmentResponse] = await Promise.all([
      getProjectCount(),
      getTaskCount(),
      getEmployeeCount(),
      getEquipmentCount()
    ])
    
    systemStats.value = [
      {
        title: '项目总数',
        value: projectResponse.code === 200 ? projectResponse.data : 0,
        icon: markRaw(Briefcase),
        iconClass: 'project-icon'
      },
      {
        title: '任务总数',
        value: taskResponse.code === 200 ? taskResponse.data : 0,
        icon: markRaw(List),
        iconClass: 'task-icon'
      },
      {
        title: '员工人数',
        value: employeeResponse.code === 200 ? employeeResponse.data : 0,
        icon: markRaw(User),
        iconClass: 'employee-icon'
      },
      {
        title: '设备总数',
        value: equipmentResponse.code === 200 ? equipmentResponse.data : 0,
        icon: markRaw(Monitor),
        iconClass: 'equipment-icon'
      }
    ]
  } catch (error) {
    console.error('获取系统统计数据失败', error)
  }
}

// 获取公告列表
const fetchAnnouncements = async () => {
  try {
    const params = {
      pageNo: 1,
      pageSize: 5,
      status: '1' // 已发布的公告
    }
    const response = await getAnnouncementList(params)
    if (response.code === 200) {
      announcements.value = response.data.list || []
    }
  } catch (error) {
    console.error('获取公告列表失败', error)
  }
}

// 获取设备状态统计
const fetchEquipmentStats = async () => {
  try {
    const params = {
      type: 'status'
    }
    const response = await getEquipmentStats(params)
    if (response.code === 200) {
      equipmentStats.value = response.data || []
      nextTick(() => {
        initEquipmentChart()
      })
    }
  } catch (error) {
    console.error('获取设备状态统计失败', error)
    // 设置默认数据用于展示
    equipmentStats.value = [
      { name: '空闲', value: 0 },
      { name: '使用中', value: 0 },
      { name: '维修中', value: 0 },
      { name: '已报废', value: 0 }
    ]
    nextTick(() => {
      initEquipmentChart()
    })
  }
}

// 初始化系统概览图表
const initOverviewChart = () => {
  const chartDom = document.getElementById('overviewChart')
  if (!chartDom) return
  
  overviewChart = echarts.init(chartDom)
  fetchTaskTrend(chartPeriod.value)
}

// 更新系统概览图表数据
const updateOverviewChart = (data) => {
  if (!overviewChart) return
  
  let xAxisData = []
  let seriesData = []
  
  if (data && data.xAxis) {
    xAxisData = data.xAxis
    
    // 使用API返回的数据
    seriesData = [
      { name: '新建任务', data: data.newTasks || [] },
      { name: '完成任务', data: data.completedTasks || [] },
      { name: '活跃用户', data: data.activeUsers || [] }
    ]
  } else {
    // 如果没有数据，初始化为空数组
    updateOverviewChartWithEmptyData()
    return
  }
  
  const series = seriesData.map(item => ({
    name: item.name,
    type: 'line',
    smooth: true,
    data: item.data
  }))
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: seriesData.map(item => item.name),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData
    },
    yAxis: {
      type: 'value'
    },
    series: series
  }
  
  overviewChart.setOption(option)
}

// 使用空数据初始化图表
const updateOverviewChartWithEmptyData = () => {
  if (!overviewChart) return
  
  let xAxisData = []
  
  // 根据当前时间范围生成适当的空数据结构
  if (chartPeriod.value === 'week') {
    xAxisData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  } else if (chartPeriod.value === 'month') {
    xAxisData = Array.from({length: 30}, (_, i) => `${i+1}日`)
  } else {
    xAxisData = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']
  }
  
  const emptyData = Array(xAxisData.length).fill(0)
  
  const seriesData = [
    { name: '新建任务', data: emptyData },
    { name: '完成任务', data: emptyData },
    { name: '活跃用户', data: emptyData }
  ]
  
  const series = seriesData.map(item => ({
    name: item.name,
    type: 'line',
    smooth: true,
    data: item.data
  }))
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: seriesData.map(item => item.name),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData
    },
    yAxis: {
      type: 'value'
    },
    series: series
  }
  
  overviewChart.setOption(option)
}

// 初始化任务分布图表
const initTaskDistributionChart = () => {
  const chartDom = document.getElementById('taskDistributionChart')
  if (!chartDom) return
  
  // 确保在DOM加载完成后初始化图表
  setTimeout(() => {
    if (chartDom.clientWidth > 0 && chartDom.clientHeight > 0) {
      taskDistributionChart = echarts.init(chartDom)
      fetchTaskDistributionStats()
    } else {
      console.warn('DOM元素尺寸为0，延迟初始化图表')
      setTimeout(initTaskDistributionChart, 100)
    }
  }, 0)
}

// 更新任务分布图表
const updateTaskDistributionChart = (data) => {
  if (!taskDistributionChart) return
  
  // 饼图 - 按状态或优先级显示
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 10,
      data: data.map(item => item.name)
    },
    series: [
      {
        name: taskStatsType.value === 'status' ? '任务状态' : '任务优先级',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  }
  
  taskDistributionChart.setOption(option)
}

// 初始化设备状态饼图
const initEquipmentChart = () => {
  const chartDom = document.getElementById('equipmentChart')
  if (!chartDom) return
  
  // 确保在DOM加载完成后初始化图表
  setTimeout(() => {
    if (chartDom.clientWidth > 0 && chartDom.clientHeight > 0) {
      equipmentChart = echarts.init(chartDom)
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'horizontal',
          bottom: 10,
          data: equipmentStats.value.map(item => item.name)
        },
        series: [
          {
            name: '设备状态',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold'
              }
            },
            data: equipmentStats.value
          }
        ]
      }
      equipmentChart.setOption(option)
    } else {
      console.warn('DOM元素尺寸为0，延迟初始化图表')
      setTimeout(initEquipmentChart, 100)
    }
  }, 0)
}

// 根据公告类型获取标签类型
const getAnnouncementTagType = (type) => {
  switch (type) {
    case '1': return 'danger'    // 安全提示
    case '2': return 'success'   // 项目进展
    case '3': return 'warning'   // 会议通知
    case '4': return 'info'      // 其他
    default: return 'info'
  }
}

// 获取公告类型名称
const getAnnouncementType = (type) => {
  switch (type) {
    case '1': return '安全提示'
    case '2': return '项目进展'
    case '3': return '会议通知'
    case '4': return '其他'
    default: return '其他'
  }
}

// 获取图表颜色
const getChartColor = (index) => {
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272']
  return colors[index % colors.length]
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 跳转到公告页面
const goToAnnouncements = () => {
  router.push('/announcement')
}

// 查看公告详情
const viewAnnouncement = (item) => {
  currentAnnouncement.value = item
  announcementDialogVisible.value = true
}

// 监听窗口大小变化
const handleResize = () => {
  if (equipmentChart) {
    equipmentChart.resize()
  }
  if (taskDistributionChart) {
    taskDistributionChart.resize()
  }
}

onMounted(() => {
  fetchSystemStats()
  fetchAnnouncements()
  fetchEquipmentStats()
  
  // 确保DOM已经渲染完成再初始化图表
  setTimeout(() => {
    initTaskDistributionChart()
    
    // 确保初始化时调整图表大小
    window.dispatchEvent(new Event('resize'))
  }, 300)
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (equipmentChart) {
    equipmentChart.dispose()
  }
  if (taskDistributionChart) {
    taskDistributionChart.dispose()
  }
})
</script>

<style scoped>
.workbench-container {
  padding: 20px;
}

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
  overflow: hidden;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-card-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border-radius: 12px;
  margin-right: 15px;
  font-size: 28px;
  color: #fff;
}

.project-icon {
  background-color: #409EFF;
}

.task-icon {
  background-color: #67C23A;
}

.employee-icon {
  background-color: #E6A23C;
}

.equipment-icon {
  background-color: #F56C6C;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.content-row {
  margin-bottom: 20px;
}

.bottom-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 460px;
}

.box-card {
  height: 380px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.overview-chart-container {
  height: 400px;
  width: 100%;
  position: relative;
}

.overview-chart {
  height: 100%;
  width: 100%;
  min-height: 360px;
}

.announcement-list,
.equipment-stats {
  height: 320px;
  overflow-y: auto;
}

.announcement-item {
  padding: 10px 0;
  border-bottom: 1px solid #EBEEF5;
  cursor: pointer;
  transition: all 0.2s;
}

.announcement-item:hover {
  background-color: #f5f7fa;
}

.announcement-title {
  font-size: 14px;
  color: #303133;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.announcement-time {
  font-size: 12px;
  color: #909399;
}

.pie-chart-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 10px;
}

.chart {
  height: 250px;
  width: 100%;
}

.equipment-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 5px 10px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  margin-right: 5px;
}

.legend-text {
  font-size: 12px;
  color: #606266;
}

.announcement-detail {
  padding: 10px;
}

.detail-title {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 18px;
  color: #303133;
}

.detail-info {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.detail-date, .detail-publisher {
  font-size: 13px;
  color: #606266;
}

.detail-content {
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  white-space: pre-line;
}

/* 响应式适配 */
@media screen and (max-width: 1200px) {
  .stat-value {
    font-size: 24px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 24px;
  }
  
  .chart-card, .box-card {
    height: 320px;
  }
}

@media screen and (max-width: 768px) {
  .content-row .el-col,
  .bottom-row .el-col {
    width: 100%;
    margin-bottom: 20px;
  }
  
  .chart-card, .box-card {
    height: 300px;
  }
}
</style>