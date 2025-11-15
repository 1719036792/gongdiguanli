<template>
  <div class="app-container">
    <div class="filter-container">
      <el-form inline>
        <el-form-item label="统计类型">
          <el-select v-model="statisticsType" placeholder="请选择统计类型" @change="handleTypeChange">
            <el-option label="按状态统计" value="status" />
            <el-option label="按优先级统计" value="priority" />
            <el-option label="按项目统计" value="project" />
            <el-option label="按负责人统计" value="assignee" />
            <el-option label="按月份统计" value="month" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button 
            icon="Refresh" 
            circle 
            @click="refreshData" 
            :loading="refreshLoading"
            title="刷新数据"
          />
        </el-form-item>
      </el-form>
    </div>

    <div class="chart-container">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>{{ chartTitle }}</span>
                <el-tooltip :content="getChartDescription()" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <div class="chart" ref="mainChartRef"></div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="12">
          <el-card class="chart-card">
            <template #header>
              <div class="card-header">
                <span>优先级分布</span>
                <el-tooltip content="显示不同优先级任务的数量分布" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <div class="chart" ref="progressChartRef"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="summary-container">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="summary-card" shadow="hover">
            <div class="summary-item">
              <div class="summary-icon blue">
                <el-icon><Document /></el-icon>
              </div>
              <div class="summary-content">
                <div class="summary-title">总任务数</div>
                <div class="summary-value">{{ summaryData.total }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="summary-card" shadow="hover">
            <div class="summary-item">
              <div class="summary-icon green">
                <el-icon><VideoPlay /></el-icon>
              </div>
              <div class="summary-content">
                <div class="summary-title">进行中</div>
                <div class="summary-value">{{ summaryData.inProgress }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="summary-card" shadow="hover">
            <div class="summary-item">
              <div class="summary-icon gray">
                <el-icon><Check /></el-icon>
              </div>
              <div class="summary-content">
                <div class="summary-title">已完成</div>
                <div class="summary-value">{{ summaryData.completed }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="6" :xl="6">
          <el-card class="summary-card" shadow="hover">
            <div class="summary-item">
              <div class="summary-icon red">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="summary-content">
                <div class="summary-title">未开始</div>
                <div class="summary-value">{{ summaryData.overdue }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="table-container">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>任务完成率排名</span>
          </div>
        </template>
        <el-table 
          :data="rankData" 
          border 
          style="width: 100%" 
          v-loading="rankLoading"
          :empty-text="rankEmptyText"
        >
          <el-table-column prop="rank" label="排名" width="80" />
          <el-table-column prop="name" label="名称" min-width="150" />
          <el-table-column prop="total" label="总任务数" width="100" />
          <el-table-column prop="completed" label="已完成" width="100" />
          <el-table-column prop="completionRate" label="完成率" width="120">
            <template #default="scope">
              <el-progress :percentage="scope.row.completionRate" />
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, shallowRef, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { 
  Refresh, 
  Document, 
  VideoPlay, 
  Check, 
  Warning, 
  InfoFilled
} from '@element-plus/icons-vue';
import { getTaskStats, getTaskSummary, getCompletionRank } from '../../../api/task.js'

// 格式化百分比
const formatPercentage = (value) => {
  return `${value}%`;
};

// 响应式数据
const statisticsType = ref('status');
const chartTitle = ref('任务状态分布');
const summaryData = ref({
  total: 0,
  inProgress: 0,
  completed: 0,
  overdue: 0
});
const rankData = ref([]);
const rankLoading = ref(false);
const rankEmptyText = ref('请选择项目或负责人统计模式查看排名数据');
const refreshLoading = ref(false);

// DOM引用
const mainChartRef = ref(null);
const progressChartRef = ref(null);

// 图表实例
const mainChartInstance = shallowRef(null);
const progressChartInstance = shallowRef(null);

// 处理类型变化
const handleTypeChange = () => {
  switch (statisticsType.value) {
    case 'status':
      chartTitle.value = '任务状态分布';
      rankEmptyText.value = '请选择项目或负责人统计模式查看排名数据';
      break;
    case 'priority':
      chartTitle.value = '任务优先级分布';
      rankEmptyText.value = '请选择项目或负责人统计模式查看排名数据';
      break;
    case 'project':
      chartTitle.value = '项目任务分布';
      rankEmptyText.value = '加载项目任务完成率排名...';
      break;
    case 'assignee':
      chartTitle.value = '负责人任务分布';
      rankEmptyText.value = '加载用户任务完成率排名...';
      break;
    case 'month':
      chartTitle.value = '任务月度分布';
      rankEmptyText.value = '请选择项目或负责人统计模式查看排名数据';
      break;
  }
  
  refreshData();
};

// 刷新所有数据
const refreshData = () => {
  refreshLoading.value = true;
  Promise.all([
    loadTaskStats(),
    loadTaskSummary(),
    loadRankingData()
  ]).finally(() => {
    refreshLoading.value = false;
  });
};

// 加载任务统计数据
const loadTaskStats = () => {
  const params = {
    type: statisticsType.value
  };
  
  return getTaskStats(params).then(res => {
    if (statisticsType.value === 'month') {
      updateMonthChart(res.data);
    } else if (statisticsType.value === 'priority') {
      updatePriorityChart(res.data);
    } else {
      updateMainChart(res.data);
    }
  }).catch(error => {
    console.error('获取任务统计数据失败', error);
  });
};

// 加载摘要数据
const loadTaskSummary = () => {
  const params = {
    type: statisticsType.value
  };
  
  return getTaskSummary(params).then(res => {
    summaryData.value = res.data;
  }).catch(error => {
    console.error('获取任务摘要数据失败', error);
  });
};

// 加载排名数据
const loadRankingData = () => {
  // 只在项目或负责人统计模式下加载排名数据
  if (statisticsType.value !== 'project' && statisticsType.value !== 'assignee') {
    rankData.value = [];
    return Promise.resolve();
  }
  
  rankLoading.value = true;
  const params = {
    type: statisticsType.value
  };
  
  return getCompletionRank(params).then(res => {
    rankData.value = res.data.map((item, index) => {
      return {
        rank: index + 1,
        name: item.name,
        total: item.total,
        completed: item.completed,
        completionRate: parseInt(item.completionRate)
      };
    });
  }).catch(error => {
    console.error('获取任务完成率排名数据失败', error);
  }).finally(() => {
    rankLoading.value = false;
  });
};

// 更新主图表
const updateMainChart = (data) => {
  if (!mainChartRef.value || !mainChartInstance.value) return;
  
  const names = [];
  const values = [];
  const statusColors = {
    '未开始': '#409EFF',
    '进行中': '#67C23A',
    '已完成': '#67C23A',
    '已取消': '#909399',
    '已超期': '#F56C6C'
  };
  
  // 处理数据
  if (data && data.length) {
    data.forEach((item) => {
      names.push(item.name);
      values.push({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: statusColors[item.name] || '#409EFF'
        }
      });
    });
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 'bottom',
      data: names
    },
    series: [
      {
        name: chartTitle.value,
        type: 'pie',
        radius: statisticsType.value === 'status' ? '75%' : ['40%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'inside',
          formatter: '{d}%',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#fff'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        data: values
      }
    ]
  };
  
  mainChartInstance.value.setOption(option);
  mainChartInstance.value.resize();
};

// 更新优先级图表
const updatePriorityChart = (data) => {
  if (!progressChartRef.value || !progressChartInstance.value) return;
  
  const names = [];
  const values = [];
  const priorityColors = {
    '低': '#67C23A',  // 绿色
    '中': '#E6A23C',  // 黄色
    '高': '#F56C6C',  // 红色
    '紧急': '#FF4500' // 深红色
  };
  
  // 处理数据
  if (data && data.length) {
    data.forEach(item => {
      names.push(item.name);
      values.push({
        value: item.value,
        name: item.name,
        itemStyle: {
          color: priorityColors[item.name] || '#409EFF'
        }
      });
    });
  }
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 'bottom',
      data: names
    },
    series: [
      {
        name: '优先级分布',
        type: 'pie',
        radius: '75%',
        center: ['50%', '45%'],
        roseType: 'radius',
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'inside',
          formatter: '{d}%',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#fff'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        data: values
      }
    ]
  };
  
  progressChartInstance.value.setOption(option);
  progressChartInstance.value.resize();
};

// 更新月度统计图表
const updateMonthChart = (data) => {
  if (!mainChartRef.value || !mainChartInstance.value) return;
  
  const months = [];
  const seriesData = [];
  
  // 处理数据
  if (data && data.length) {
    data.forEach(item => {
      months.push(item.name);
      seriesData.push({
        value: item.value,
        name: item.name
      });
    });
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      name: '任务数量'
    },
    series: [
      {
        name: '任务数量',
        type: 'bar',
        barWidth: '60%',
        data: seriesData,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#4084F0' },
            { offset: 0.5, color: '#0F56B3' },
            { offset: 1, color: '#0A387A' }
          ])
        }
      }
    ]
  };
  
  mainChartInstance.value.setOption(option);
  mainChartInstance.value.resize();
};

// 初始化图表
const initCharts = () => {
  // 确保DOM已经就绪
  nextTick(() => {
    if (mainChartRef.value) {
      mainChartInstance.value = echarts.init(mainChartRef.value);
    }
    if (progressChartRef.value) {
      progressChartInstance.value = echarts.init(progressChartRef.value);
    }
    
    refreshData();
  });
};

// 处理窗口大小变化
const resizeHandler = () => {
  if (mainChartRef.value && mainChartInstance.value) {
    mainChartInstance.value.resize();
  }
  if (progressChartRef.value && progressChartInstance.value) {
    progressChartInstance.value.resize();
  }
};

// 生命周期钩子
onMounted(() => {
  initCharts();
  window.addEventListener('resize', resizeHandler);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeHandler);
  
  if (mainChartInstance.value) {
    mainChartInstance.value.dispose();
  }
  if (progressChartInstance.value) {
    progressChartInstance.value.dispose();
  }
});

// 监听统计类型变化
watch(statisticsType, () => {
  handleTypeChange();
});

// 获取图表描述
const getChartDescription = () => {
  switch (statisticsType.value) {
    case 'status':
      return '显示不同状态任务的数量分布';
    case 'priority':
      return '显示不同优先级任务的数量分布';
    case 'project': 
      return '显示各项目的任务数量分布';
    case 'assignee':
      return '显示各负责人的任务数量分布';
    case 'month':
      return '显示各月份的任务数量分布';
    default:
      return '';
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.filter-container {
  margin-bottom: 20px;
}

.chart-container {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart {
  height: 350px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-container {
  margin-bottom: 20px;
}

.summary-card {
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
}

.summary-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 16px;
}

.summary-icon .el-icon {
  font-size: 28px;
  color: white;
}

.summary-icon.blue {
  background-color: #409EFF;
}

.summary-icon.green {
  background-color: #67C23A;
}

.summary-icon.gray {
  background-color: #909399;
}

.summary-icon.red {
  background-color: #F56C6C;
}

.summary-content {
  flex: 1;
}

.summary-title {
  font-size: 14px;
  color: #606266;
}

.summary-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.table-container {
  margin-bottom: 20px;
}
</style> 