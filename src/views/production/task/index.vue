<template>
  <div class="task-container">
    <div class="task-header">
      <h2>生产任务管理</h2>
      <div class="task-actions">
        <el-input
          v-model="searchQuery"
          placeholder="计划名称"
          class="search-input"
          clearable
          @clear="handleSearch"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        <el-select 
          v-model="statusFilter" 
          placeholder="任务状态" 
          clearable 
          @change="handleSearch"
          class="status-select"
        >
          <el-option
            v-for="option in statusOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增任务
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="taskList"
      border
      style="width: 100%"
      row-key="id"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="productionPlanName" label="生产计划" />
      <el-table-column prop="amount" label="分配数量" width="100" align="center" />
      <el-table-column prop="operatorName" label="操作员" width="100" />
      <el-table-column prop="deadline" label="截止时间" width="180">
        <template #default="scope">
          <span :class="{ 'deadline-warning': isDeadlineNear(scope.row.deadline) }">
            {{ scope.row.deadline }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column prop="updatedAt" label="更新时间" width="180" />
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="scope">
          <el-button-group>
            <!-- 开始按钮：只在待开始状态且是当前操作员的任务时显示 -->
            <el-button
              v-if="scope.row.status == '待开始' && isCurrentOperator(scope.row)"
              link
              type="success"
              @click="handleStart(scope.row)"
            >
              <el-icon><VideoPlay /></el-icon>开始
            </el-button>
            
            <!-- 完成按钮：只在进行中状态且是当前操作员的任务时显示 -->
            <el-button
              v-if="scope.row.status === '进行中' && isCurrentOperator(scope.row)"
              link
              type="success"
              @click="handleComplete(scope.row)"
            >
              <el-icon><Select /></el-icon>完成
            </el-button>
            
            <!-- 删除按钮：只在已完成状态显示 -->
            <el-button
              v-if="scope.row.status === '已完成' && (currentRoleId == 6 || isCurrentOperator(scope.row))"
              link
              type="danger"
              @click="handleDelete(scope.row)"
            >
              <el-icon><Delete /></el-icon>删除
            </el-button>
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="新增任务"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="生产计划" prop="productionPlanId">
          <el-select v-model="form.productionPlanId" placeholder="请选择生产计划" style="width: 100%">
            <el-option
              v-for="plan in productionPlans"
              :key="plan.id"
              :label="plan.planName"
              :value="plan.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="截止时间" prop="deadline">
          <el-date-picker
            v-model="form.deadline"
            type="datetime"
            placeholder="请选择截止时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 分配任务对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配任务"
      width="500px"
    >
      <el-form
        ref="assignFormRef"
        :model="assignForm"
        :rules="assignRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="操作员" prop="operatorId">
          <el-select v-model="assignForm.operatorId" placeholder="请选择操作员" style="width: 100%">
            <el-option
              v-for="operator in operators"
              :key="operator.id"
              :label="operator.label"
              :value="operator.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAssign">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Edit, VideoPlay, Select, Delete } from '@element-plus/icons-vue'
import { get, post, put, del } from '../../../utils/request.js'

// 数据加载状态
const loading = ref(false)

// 任务列表数据
const taskList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const statusFilter = ref('')

// 生产计划列表
const productionPlans = ref([])

// 操作员列表
const operators = ref([])

// 当前用户ID（从localStorage或vuex获取）
const currentUserId = localStorage.getItem('userId')
const currentRoleId = localStorage.getItem('roleId')
// 对话框相关
const dialogVisible = ref(false)
const formRef = ref(null)
const form = reactive({
  id: null,
  productionPlanId: null,
  deadline: null,
  status: 'pending'
})

// 分配对话框相关
const assignDialogVisible = ref(false)
const assignFormRef = ref(null)
const assignForm = reactive({
  taskId: null,
  operatorId: null
})

// 表单验证规则
const rules = {
  productionPlanId: [{ required: true, message: '请选择生产计划', trigger: 'change' }],
  deadline: [{ required: true, message: '请选择截止时间', trigger: 'change' }]
}

// 分配表单验证规则
const assignRules = {
  operatorId: [{ required: true, message: '请选择操作员', trigger: 'change' }]
}

// 状态选项
const statusOptions = [
  { value: '待开始', label: '待开始' },
  { value: '进行中', label: '进行中' },
  { value: '已完成', label: '已完成' }
]

// 获取任务列表
const fetchTaskList = async () => {
  loading.value = true
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      keyword: searchQuery.value,
      status: statusFilter.value
    }
    
    const res = await post('/api/production/task/list', params)
    
    if (res.code === 200) {
      taskList.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取任务列表失败')
    }
  } catch (error) {
    console.error('获取任务列表失败:', error)
    ElMessage.error('获取任务列表失败')
  } finally {
    loading.value = false
  }
}

// 获取生产计划列表
const fetchProductionPlans = async () => {
  try {
    const res = await get('/api/productionPlan/list/all')
    if (res.code === 200) {
      productionPlans.value = res.data || []
    }
  } catch (error) {
    console.error('获取生产计划列表失败:', error)
  }
}

// 获取操作员列表
const fetchOperators = async () => {
  try {
    const res = await get('/api/user/list/operators')
    if (res.code === 200) {
      operators.value = res.data.map(user => ({
        id: user.id,
        label: user.username,
        value: user.id
      }))
    }
  } catch (error) {
    console.error('获取操作员列表失败:', error)
  }
}

// 判断是否是当前操作员的任务
const isCurrentOperator = (task) => {
  return task.operatorId == currentUserId
}

// 判断是否临近截止时间（24小时内）
const isDeadlineNear = (deadline) => {
  if (!deadline) return false
  const deadlineTime = new Date(deadline).getTime()
  const now = new Date().getTime()
  const diff = deadlineTime - now
  return diff > 0 && diff <= 24 * 60 * 60 * 1000
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchTaskList()
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchTaskList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchTaskList()
}

// 新增任务
const handleAdd = () => {
  dialogVisible.value = true
  if (formRef.value) {
    formRef.value.resetFields()
  }
  form.productionPlanId = null
  form.deadline = null
}

// 分配任务
const handleAssign = (row) => {
  assignDialogVisible.value = true
  if (assignFormRef.value) {
    assignFormRef.value.resetFields()
  }
  assignForm.taskId = row.id
  assignForm.operatorId = null
}

// 提交分配
const submitAssign = async () => {
  if (!assignFormRef.value) return
  
  await assignFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await post('/api/production/task/assign', {
          id: assignForm.taskId,
          operatorId: assignForm.operatorId
        })
        
        if (res.code === 200) {
          ElMessage.success('分配成功')
          assignDialogVisible.value = false
          fetchTaskList()
        } else {
          ElMessage.error(res.msg || '分配失败')
        }
      } catch (error) {
        console.error('分配失败:', error)
        ElMessage.error('分配失败')
      }
    }
  })
}

// 开始任务
const handleStart = async (row) => {
  try {
    const res = await put('/api/production/task/start', { id: row.id })
    
    if (res.code === 200) {
      ElMessage.success('任务已开始')
      fetchTaskList()
    } else {
      ElMessage.error(res.msg || '开始任务失败')
    }
  } catch (error) {
    console.error('开始任务失败:', error)
    ElMessage.error('开始任务失败')
  }
}

// 完成任务
const handleComplete = async (row) => {
  try {
    const res = await put('/api/production/task/complete', { id: row.id })
    
    if (res.code === 200) {
      ElMessage.success('任务已完成')
      fetchTaskList()
    } else {
      ElMessage.error(res.msg || '完成任务失败')
    }
  } catch (error) {
    console.error('完成任务失败:', error)
    ElMessage.error('完成任务失败')
  }
}

// 删除任务
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该任务记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await del(`/api/production/task/delete/${row.id}`)
      
      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchTaskList()
      } else {
        ElMessage.error(res.msg || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    // 取消删除操作
  })
}

// 编辑任务
const handleEdit = (row) => {
  form.value = {
    id: row.id,
    deadline: row.deadline
  }
  dialogVisible.value = true
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let url = '/api/production/task/add'
        let data = {
          productionPlanId: form.productionPlanId,
          deadline: form.deadline
        }
        
        const res = await post(url, data)
        
        if (res.code === 200) {
          ElMessage.success('操作成功')
          dialogVisible.value = false
          fetchTaskList()
        } else {
          ElMessage.error(res.msg || '操作失败')
        }
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error('操作失败')
      }
    }
  })
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    '待开始': 'info',
    '进行中': 'primary',
    '已完成': 'success'
  }
  return statusMap[status] || 'info'
}

// 页面加载时获取数据
onMounted(() => {
  fetchTaskList()
  fetchProductionPlans()
  fetchOperators()
})
</script>

<style scoped>
.task-container {
  padding: 20px;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.task-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  width: 250px;
}

.status-select {
  width: 150px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.deadline-warning {
  color: #F56C6C;
  font-weight: bold;
}
</style> 