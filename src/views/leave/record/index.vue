<template>
  <div class="leave-record-container">
    <div class="header">
      <h2>我的请假记录</h2>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-container">
      <div class="search-wrapper">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="请假类型">
            <el-select v-model="searchForm.leaveType" placeholder="请选择请假类型" clearable style="width: 180px;">
              <el-option
                v-for="item in leaveTypes"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="申请状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 180px;">
              <el-option
                v-for="item in statusOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="申请时间">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 340px;"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="searchRecords">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 记录列表 -->
    <el-card class="record-list">
      <el-table :data="recordList" border style="width: 100%">
        <el-table-column prop="id" label="申请编号" width="100" />
        <el-table-column prop="leaveType" label="请假类型" width="100" />
        <el-table-column prop="startTime" label="开始时间" width="160" />
        <el-table-column prop="endTime" label="结束时间" width="160" />
        <el-table-column prop="days" label="天数" width="80" />
        <el-table-column prop="reason" label="请假原因" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ changeStatus(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" width="160" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              type="danger"
              link
              v-if="scope.row.status === 0"
              @click="cancelApplication(scope.row)"
            >
              取消申请
            </el-button>
            <el-button
              type="primary"
              link
              v-if="scope.row.instanceId"
              @click="viewProcess(scope.row)"
            >
              查看流程
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 流程组件 -->
    <FlowProcess
      v-model="processDialogVisible"
      :instance-id="currentInstanceId"
      :detail="currentDetail"
      title="请假流程"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, View } from '@element-plus/icons-vue'
import { getLeaveList, cancelLeaveApplication } from '../../../api/leave.js'
import FlowProcess from '../../../components/FlowProcess/index.vue'

// 搜索表单
const searchForm = reactive({
  leaveType: '',
  status: '',
  dateRange: []
})

// 请假类型选项
const leaveTypes = [
  { value: 1, label: '事假' },
  { value: 2, label: '病假' },
  { value: 3, label: '年假' },
  { value: 4, label: '婚假' },
  { value: 5, label: '产假' },
  { value: 6, label: '丧假' },
  { value: 7, label: '其他' }
]

// 状态选项
const statusOptions = [
  { value: 0, label: '待审批' },
  { value: 1, label: '已通过' },
  { value: 2, label: '已拒绝' },
  { value: 3, label: '已退回' }
]

// 获取状态对应的类型
const getStatusType = (status) => {
  switch (status) {
    case 0: return 'info'    // 待审批
    case 1: return 'success' // 已通过
    case 2: return 'danger'  // 已拒绝
    case 3: return 'warning' // 已退回
    default: return 'info'
  }
}

// 搜索
const searchRecords = () => {
  pageNo.value = 1
  getRecordList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.leaveType = ''
  searchForm.status = ''
  searchForm.dateRange = []
  searchRecords()
}

const recordList = ref([])

const changeStatus = (status) => {
  switch (status) {
    case 0: return '待审批'
    case 1: return '已通过'
    case 2: return '已拒绝'
    case 3: return '已取消'
  }
}

// 分页相关
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 获取记录列表
const getRecordList = async () => {
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      leaveType: searchForm.leaveType,
      status: searchForm.status,
      startTime: searchForm.dateRange[0],
      endTime: searchForm.dateRange[1]
    }
    const res = await getLeaveList(params)
    recordList.value = res.data.list
    total.value = res.data.total

  } catch (error) {
    console.error('获取请假记录列表失败', error)
  }
}

// 处理分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  getRecordList()
}

// 处理页码变化
const handleCurrentChange = (val) => {
  pageNo.value = val
  getRecordList()
}

// 查看详情
const processDialogVisible = ref(false)
const currentInstanceId = ref(null)
const currentDetail = ref(null)

// 取消申请
const cancelApplication = (row) => {
  ElMessageBox.confirm('确定要取消该请假申请吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消', 
    type: 'warning'
  }).then(() => {
    // 实际项目中应该调用API
    cancelLeaveApplication(row.instanceId).then(res => {
      if (res.code === 200) {
        getRecordList()
        ElMessage.success('申请已取消')
      }
    })
  }).catch(() => {})
}

// 下载文件
const downloadFile = (file) => {
  // 实际项目中应该调用下载API
  ElMessage.info('文件下载功能待实现')
}

// 查看流程
const viewProcess = (row) => {
  // 同时更新详情数据
  currentDetail.value = row
  currentInstanceId.value = row.instanceId
  processDialogVisible.value = true
}

onMounted(() => {
  getRecordList()
})
</script>

<style scoped>
.leave-record-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.search-container {
  margin-bottom: 20px;
}

.record-list {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
