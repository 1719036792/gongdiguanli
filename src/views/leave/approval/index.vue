<template>
  <div class="leave-approval-container">
    <div class="header">
      <h2>待审批请假</h2>
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
          <el-form-item label="申请人">
            <el-input v-model="searchForm.applicant" placeholder="请输入申请人" clearable style="width: 180px;"></el-input>
          </el-form-item>
          <el-form-item label="状态">
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
        <el-table-column prop="userName" label="申请人" width="100" />
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              type="success"
              link
              @click="approveApplication(scope.row, 'PASS', '同意')"
            >
              同意
            </el-button>
            <el-button
              type="danger"
              link
              @click="approveApplication(scope.row, 'PASS', '拒绝')"
            >
              拒绝
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

    <!-- 审批弹窗 -->
    <el-dialog
      v-model="approveDialogVisible"
      :title="`${approveAction}申请`"
      width="500px"
    >
      <div class="approve-form">
        <el-form :model="approveForm" label-width="80px" :rules="approveRules" ref="approveFormRef">
          <el-form-item label="审批意见" prop="comment">
            <el-input
              v-model="approveForm.comment"
              type="textarea"
              :rows="4"
              placeholder="请输入审批意见"
            ></el-input>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="approveDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitApprove">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

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
import { Search, Refresh } from '@element-plus/icons-vue'
import { getWaitingApprovalList, approveLeaveApplication } from '../../../api/leave.js'
import FlowProcess from '../../../components/FlowProcess/index.vue'

// 搜索表单
const searchForm = reactive({
  leaveType: '',
  applicant: '',
  status: '',
  dateRange: []
})

// 请假类型选项
const leaveTypes = [
  { value: '事假', label: '事假' },
  { value: '病假', label: '病假' },
  { value: '年假', label: '年假' },
  { value: '婚假', label: '婚假' },
  { value: '产假', label: '产假' },
  { value: '丧假', label: '丧假' },
  { value: '其他', label: '其他' }
]

// 状态选项
const statusOptions = [
  { value: 0, label: '待审批' },
  { value: 1, label: '已通过' },
  { value: 2, label: '已拒绝' },
  { value: 3, label: '已退回' }
]

// 搜索
const searchRecords = () => {
  pageNo.value = 1
  getRecordList()
}

// 重置搜索
const resetSearch = () => {
  searchForm.leaveType = ''
  searchForm.applicant = ''
  searchForm.status = ''
  searchForm.dateRange = []
  searchRecords()
}

const recordList = ref([])

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
      applicant: searchForm.applicant,
      status: searchForm.status,
      startTime: searchForm.dateRange[0],
      endTime: searchForm.dateRange[1]
    }
    const res = await getWaitingApprovalList(params)
    recordList.value = res.data.list || []
    total.value = res.data.total || 0

  } catch (error) {
    console.error('获取待审批列表失败', error)
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

// 查看流程
const processDialogVisible = ref(false)
const currentInstanceId = ref(null)
const currentDetail = ref(null)

const viewProcess = (row) => {
  // 同时更新详情数据
  currentDetail.value = row
  currentInstanceId.value = row.instanceId
  processDialogVisible.value = true
}

// 审批相关
const approveDialogVisible = ref(false)
const approveType = ref('PASS') // PASS或REJECT
const approveAction = ref('同意') // 同意、拒绝或打回
const currentApproveRow = ref(null)
const approveFormRef = ref(null)
const approveForm = reactive({
  comment: ''
})

// 审批表单校验规则
const approveRules = {
  comment: [{ required: true, message: '请输入审批意见', trigger: 'blur' }]
}

// 打开审批弹窗
const approveApplication = (row, type, action) => {
  approveType.value = type
  approveAction.value = action
  currentApproveRow.value = row
  approveForm.comment = ''
  approveDialogVisible.value = true
}

// 提交审批
const submitApprove = async () => {
  if (!approveFormRef.value) return
  
  await approveFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      const data = {
        id: currentApproveRow.value.instanceId,
        skipType: approveType.value,
        message: approveForm.comment,
        action: approveAction.value
      }

      const res = await approveLeaveApplication(data)
      if (res.code === 200) {
        ElMessage.success(`已${approveAction.value}申请`)
        approveDialogVisible.value = false
        getRecordList()
      } else {
        ElMessage.error(res.message || '审批失败')
      }
    } catch (error) {
      console.error('审批失败', error)
      ElMessage.error('审批失败，请稍后重试')
    }
  })
}

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

// 状态转换
const changeStatus = (status) => {
  switch (status) {
    case 0: return '待审批'
    case 1: return '已通过'
    case 2: return '已拒绝'
    case 3: return '已退回'
    default: return '未知'
  }
}

onMounted(() => {
  getRecordList()
})
</script>

<style scoped>
.leave-approval-container {
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

.approve-form {
  padding: 10px;
}
</style> 