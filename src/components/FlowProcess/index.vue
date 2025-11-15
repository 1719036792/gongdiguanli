<template>
  <div class="flow-process-container">
    <el-dialog
      v-model="dialogVisible"
      :title="title"
      width="900px"
      :destroy-on-close="true"
    >
      <div class="process-tabs">
        <el-tabs v-model="activeTab">
          <!-- 流程图标签页 -->
          <el-tab-pane label="流程图" name="flowChart">
            <div class="flow-chart-container" v-loading="chartLoading">
              <img v-if="flowChartData" :src="'data:image/png;base64,' + flowChartData" class="chart-image" alt="流程图"/>
              <div v-else class="empty-data">暂无流程图数据</div>
            </div>
          </el-tab-pane>
          
          <!-- 请假详情标签页 -->
          <el-tab-pane label="请假详情" name="leaveDetail">
            <div class="leave-detail-container">
              <div class="leave-detail" v-if="leaveDetail">
                <div class="detail-item">
                  <span class="label">申请编号：</span>
                  <span class="value">{{ leaveDetail.id }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">请假类型：</span>
                  <span class="value">{{ leaveDetail.leaveType }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">开始时间：</span>
                  <span class="value">{{ leaveDetail.startTime }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">结束时间：</span>
                  <span class="value">{{ leaveDetail.endTime }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">请假天数：</span>
                  <span class="value">{{ leaveDetail.days }} 天</span>
                </div>
                <div class="detail-item">
                  <span class="label">请假原因：</span>
                  <span class="value">{{ leaveDetail.reason }}</span>
                </div>
                <div class="detail-item" v-if="leaveDetail.destination">
                  <span class="label">去向：</span>
                  <span class="value">{{ leaveDetail.destination }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">申请状态：</span>
                  <span class="value">
                    <el-tag :type="getStatusType(leaveDetail.status)">{{ getStatusText(leaveDetail.status) }}</el-tag>
                  </span>
                </div>
                <div class="detail-item" v-if="leaveDetail.approvalInfo">
                  <span class="label">审批意见：</span>
                  <span class="value">{{ leaveDetail.approvalInfo.comment }}</span>
                </div>
                <div class="detail-item" v-if="leaveDetail.attachments && leaveDetail.attachments.length > 0">
                  <span class="label">证明材料：</span>
                  <div class="attachments">
                    <div v-for="(file, index) in leaveDetail.attachments" :key="index" class="attachment-item">
                      <el-link type="primary" @click="downloadFile(file)">{{ file.name }}</el-link>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="empty-data">暂无请假详情</div>
            </div>
          </el-tab-pane>
          
          <!-- 流程记录标签页 -->
          <el-tab-pane label="审批信息" name="flowRecord">
            <div class="flow-record-container" v-loading="recordLoading">
              <div v-if="recordList && recordList.length > 0" class="record-content">
                <el-table :data="recordList" border style="width: 100%" size="large">
                  <el-table-column prop="serialNo" label="序号" width="80" />
                  <el-table-column prop="taskName" label="任务名称" />
                  <el-table-column prop="handlerName" label="办理人" />
                  <el-table-column prop="status" label="状态">
                    <template #default="scope">
                      <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="approvalOpinion" label="审批意见" />
                  <el-table-column prop="startTime" label="开始时间" width="180" />
                  <el-table-column prop="endTime" label="结束时间" width="180" />
                  <el-table-column prop="duration" label="运行时长" width="120" />
                  <el-table-column prop="attachments" label="附件" width="120">
                    <template #default="scope">
                      <el-link 
                        v-if="scope.row.attachments && scope.row.attachments.length > 0"
                        type="primary" 
                        @click="handleViewAttachments(scope.row)"
                      >
                        查看附件
                      </el-link>
                      <span v-else>无</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-else class="empty-data">暂无流程记录</div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getFlowChart, getFlowRecords } from '../../api/flow'

const props = defineProps({
  instanceId: {
    type: [String, Number],
    default: null
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '请假流程'
  },
  detail: {
    type: Object,
    default: () => null
  }
})

const emit = defineEmits(['update:modelValue'])

// 控制对话框显示
const dialogVisible = ref(false)
// 当前活动标签页
const activeTab = ref('flowChart')
// 加载状态
const chartLoading = ref(false)
const recordLoading = ref(false)
// 流程图数据
const flowChartData = ref('')
// 流程记录列表
const recordList = ref([])
// 请假详情
const leaveDetail = ref(null)

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  dialogVisible.value = newVal
  if (newVal && props.instanceId) {
    loadFlowData()
  }
  // 设置请假详情
  leaveDetail.value = props.detail
})

// 监听 dialog 状态变化
watch(() => dialogVisible.value, (newVal) => {
  emit('update:modelValue', newVal)
})

// 监听 detail 变化
watch(() => props.detail, (newVal) => {
  leaveDetail.value = newVal
})

// 获取状态对应的类型
const getStatusType = (status) => {
  if (typeof status === 'string') {
    switch (status) {
      case '待审批': return 'info'
      case '通过': return 'success'
      case '拒绝': return 'danger'
      case '退回': return 'warning'
      case '终止': return 'danger'
      default: return 'info'
    }
  } else {
    switch (status) {
      case 0: return 'info'    // 待审批
      case 1: return 'success' // 已通过
      case 2: return 'danger'  // 已拒绝
      case 3: return 'warning' // 已退回
      default: return 'info'
    }
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 0: return '待审批'
    case 1: return '已通过'
    case 2: return '已拒绝'
    case 3: return '已取消'
    default: return '未知'
  }
}

// 获取请假类型名称
const getLeaveTypeName = (type) => {
  const leaveTypes = {
    1: '事假',
    2: '病假',
    3: '年假',
    4: '婚假',
    5: '产假',
    6: '丧假',
    7: '其他'
  }
  return leaveTypes[type] || '未知'
}

// 查看附件
const handleViewAttachments = (row) => {
  // 实现附件查看逻辑
  console.log('查看附件', row.attachments)
}

// 下载文件
const downloadFile = (file) => {
  // 实现文件下载逻辑
  console.log('下载文件', file)
}

// 加载流程数据
const loadFlowData = async () => {
  if (!props.instanceId) return
  
  // 加载流程图
  loadFlowChart()
  
  // 加载流程记录
  loadFlowRecords()
}

// 加载流程图
const loadFlowChart = async () => {
  try {
    chartLoading.value = true
    const res = await getFlowChart(props.instanceId)
    if (res.code === 200) {
      flowChartData.value = res.data
    }
  } catch (error) {
    console.error('获取流程图失败', error)
  } finally {
    chartLoading.value = false
  }
}

// 加载流程记录
const loadFlowRecords = async () => {
  try {
    recordLoading.value = true
    const res = await getFlowRecords(props.instanceId)
    if (res.code === 200) {
      recordList.value = res.data || []
    }
  } catch (error) {
    console.error('获取流程记录失败', error)
  } finally {
    recordLoading.value = false
  }
}

// 初始化
onMounted(() => {
  if (props.modelValue && props.instanceId) {
    loadFlowData()
  }
  // 设置请假详情
  leaveDetail.value = props.detail
})

// 暴露组件方法
defineExpose({
  open: (instanceId, detail) => {
    dialogVisible.value = true
    if (instanceId) {
      props.instanceId = instanceId
      loadFlowData()
    }
    if (detail) {
      leaveDetail.value = detail
    }
  }
})
</script>

<style scoped>
.flow-process-container {
  width: 100%;
}

.process-tabs {
  padding: 10px 0;
}

.flow-chart-container, 
.flow-record-container,
.leave-detail-container {
  min-height: 400px;
  width: 100%;
}

.chart-content {
  width: 100%;
  height: 100%;
  overflow: auto;
}

.chart-image {
  max-width: 100%;
  display: block;
  margin: 0 auto;
}

.empty-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #909399;
  font-size: 14px;
}

:deep(.el-dialog__body) {
  padding: 10px 20px;
}

:deep(.el-tabs__header) {
  margin-bottom: 15px;
}

.leave-detail {
  padding: 10px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
}

.detail-item .label {
  width: 100px;
  font-weight: bold;
  color: #606266;
}

.detail-item .value {
  flex: 1;
}

.attachments {
  display: flex;
  flex-direction: column;
}

.attachment-item {
  margin-bottom: 5px;
}
</style> 