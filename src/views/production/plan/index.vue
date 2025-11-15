<script setup>
import { ref, onMounted, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, put, del } from '../../../utils/request'
import { marked } from 'marked'
import { DataAnalysis, InfoFilled, Check } from '@element-plus/icons-vue'

// 表格数据
const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(10)

const currentRoleId = localStorage.getItem('roleId')

// 搜索条件
const searchForm = ref({
  planName: '',
  productName: '',
  status: ''
})

// 表单数据
const dialogVisible = ref(false)
const formData = ref({
  planName: '',
  productName: '',
  quantity: 1,
  artDate: '',
  endDate: '',
  status: ''
})

// 表单规则
const rules = {
  planName: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  productName: [{ required: true, message: '请选择产品', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入生产数量', trigger: 'blur' }],
  artDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

// 状态选项
const statusOptions = [
  { value: '等待原材料', label: '等待原材料' },
  { value: '已开始', label: '已开始' },
  { value: '已分配', label: '已分配' },
  { value: '进行中', label: '进行中' },
  { value: '已完成', label: '已完成' }
]

// 产品列表
const productList = ref([])

// 表单ref
const formRef = ref()

// 分配任务对话框
const assignDialogVisible = ref(false)
const assignFormRef = ref()
const assignForm = ref({
  planId: null,
  planName: '',
  operatorId: null,
  amount: 1,
  remainingQuantity: 0,
  totalQuantity: 0
})

// 智能分析相关变量
const aiAnalysisVisible = ref(false)
const aiAnalysisLoading = ref(false)
const aiAnalysisResult = ref('')
const currentPlanData = ref(null)
const aiSuggestion = ref(null)

// 分配表单验证规则
const assignRules = {
  operatorId: [{ required: true, message: '请选择操作员', trigger: 'change' }],
  amount: [
    { required: true, message: '请输入分配数量', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value <= 0) {
          callback(new Error('分配数量必须大于0'))
        } else if (value > assignForm.value.remainingQuantity) {
          callback(new Error(`分配数量不能超过剩余数量${assignForm.value.remainingQuantity}`))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 操作员列表
const operators = ref([])

// 获取产品列表
const getProductList = async () => {
  try {
    const res = await get('/api/productRecipe/products')
    if (res.code === 200) {
      productList.value = res.data || []
    }
  } catch (error) {
    console.error('获取产品列表失败', error)
  }
}

// 获取生产计划列表
const getProductionPlans = async () => {
  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      ...searchForm.value
    }
    const res = await post('/api/productionPlan/page', params)
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取生产计划列表失败', error)
  } finally {
    loading.value = false
  }
}

// 新建或更新生产计划
const savePlan = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.value.id) {
          // 编辑模式只更新时间
          await put('/api/productionPlan/update', {
            id: formData.value.id,
            startDate: formData.value.startDate,
            endDate: formData.value.endDate
          })
          ElMessage.success('更新成功')
        } else {
          // 新建模式提交所有字段
          await post('/api/productionPlan/create', formData.value)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        getProductionPlans()
      } catch (error) {
        console.error(formData.value.id ? '更新失败' : '创建失败', error)
      }
    }
  })
}

// 删除生产计划
const deletePlan = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该生产计划？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await del(`/api/productionPlan/delete/${id}`)
    ElMessage.success('删除成功')
    getProductionPlans()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

// 打开新建对话框
const openDialog = (row) => {
  if (row) {
    // 编辑模式
    formData.value = { ...row }
  } else {
    // 新建模式
    formData.value = {
      planName: '',
      productName: '',
      quantity: 1,
      artDate: '',
      endDate: '',
      status: ''
    }
  }
  dialogVisible.value = true
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.value = {
    planName: '',
    productName: '',
    status: ''
  }
  pageNo.value = 1
  getProductionPlans()
}

// 页码变化
const handleCurrentChange = (val) => {
  pageNo.value = val
  getProductionPlans()
}

// 每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  pageNo.value = 1
  getProductionPlans()
}

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    '等待原材料': 'warning',
    '已开始': 'primary',
    '已完成': 'success'
  }
  return statusMap[status] || 'info'
}

// 获取操作员列表
const getOperators = async () => {
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
    console.error('获取操作员列表失败', error)
  }
}

// 打开分配对话框
const openAssignDialog = async (row) => {
  if (row.status === '已完成') {
    ElMessage.warning('已完成的计划不能分配任务')
    return
  }
  
  currentPlanData.value = row
  assignForm.value = {
    planId: row.id,
    planName: row.planName,
    operatorId: null,
    amount: 1,
    remainingQuantity: 0,
    totalQuantity: row.quantity
  }
  
  // 获取已分配数量
  try {
    const res = await get(`/api/production/task/assigned/${row.id}`)
    if (res.code === 200) {
      const assignedQuantity = res.data || 0
      assignForm.value.remainingQuantity = row.quantity - assignedQuantity
      
      if (assignForm.value.remainingQuantity <= 0) {
        ElMessage.warning('该计划的任务已全部分配完成')
        return
      }
    }
  } catch (error) {
    console.error('获取已分配数量失败', error)
    ElMessage.error('获取已分配数量失败')
    return
  }
  
  assignDialogVisible.value = true
}

// 提交分配
const submitAssign = async () => {
  if (!assignFormRef.value) return
  
  await assignFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const res = await post('/api/production/task/assign', {
          productionPlanId: assignForm.value.planId,
          operatorId: assignForm.value.operatorId,
          amount: assignForm.value.amount
        })
        
        if (res.code === 200) {
          ElMessage.success('分配成功')
          assignDialogVisible.value = false
          getProductionPlans()
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

// 打开智能分析对话框
const openAiAnalysis = async () => {
  if (!currentPlanData.value) return
  
  aiAnalysisVisible.value = true
  aiAnalysisLoading.value = true
  aiAnalysisResult.value = ''
  aiSuggestion.value = null
  
  try {
    // 准备分析所需数据
    const requestData = {
      planId: currentPlanData.value.id,
      planName: currentPlanData.value.planName,
      productName: currentPlanData.value.productName,
      totalQuantity: currentPlanData.value.quantity,
      remainingQuantity: assignForm.value.remainingQuantity
    }
    
    // 调用后端接口获取构建好的问题
    const response = await post('/api/production/task/analysis/prepare', requestData)
    if (response.code !== 200) {
      throw new Error(response.msg || '获取分析数据失败')
    }
    
    const question = response.data.question
    
    // 调用AI接口
    const eventSource = new EventSource(`http://localhost:8000/api/chat?question=${encodeURIComponent(question)}`)
    let fullResponse = ''
    let hasReceivedFirstResponse = false
      
    eventSource.onmessage = (event) => {
      try {
        // 收到第一个响应时关闭loading状态
        if (!hasReceivedFirstResponse) {
          aiAnalysisLoading.value = false
          hasReceivedFirstResponse = true
        }
        
        const data = JSON.parse(event.data)
        if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
          fullResponse += data.choices[0].delta.content
          aiAnalysisResult.value = marked.parse(fullResponse)
          
          // 尝试提取AI建议的分配方案
          if (data.suggestion) {
            aiSuggestion.value = data.suggestion
          }
        }
      } catch (e) {
        // 处理非JSON格式的数据
        if (event.data !== '[DONE]') {
          // 收到第一个响应时关闭loading状态
          if (!hasReceivedFirstResponse) {
            aiAnalysisLoading.value = false
            hasReceivedFirstResponse = true
          }
          
          fullResponse += event.data
          aiAnalysisResult.value = marked.parse(fullResponse)
        }
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('AI分析请求错误:', error)
      eventSource.close()
      aiAnalysisLoading.value = false
      if (!aiAnalysisResult.value) {
        aiAnalysisResult.value = marked.parse('分析请求失败，请稍后重试。')
      }
    }
    
    eventSource.addEventListener('done', () => {
      eventSource.close()
    })
    
  } catch (error) {
    console.error('AI分析请求错误:', error)
    aiAnalysisLoading.value = false
    aiAnalysisResult.value = marked.parse('分析请求失败，请稍后重试。')
  }
}

// 应用AI建议的分配方案
const applyAiSuggestion = () => {
  if (!aiSuggestion.value) {
    ElMessage.warning('没有可应用的AI建议')
    return
  }
  
  try {
    // 将AI建议应用到表单
    if (aiSuggestion.value.operatorId) {
      assignForm.value.operatorId = aiSuggestion.value.operatorId
    }
    
    if (aiSuggestion.value.amount && aiSuggestion.value.amount <= assignForm.value.remainingQuantity) {
      assignForm.value.amount = aiSuggestion.value.amount
    }
    
    // 关闭AI分析弹窗
    aiAnalysisVisible.value = false
    
    ElMessage.success({
      message: 'AI建议已应用',
      icon: h(Check, { style: 'color: #67c23a' })
    })
  } catch (error) {
    console.error('应用AI建议失败', error)
    ElMessage.error('应用AI建议失败')
  }
}

// 页面加载时获取数据
onMounted(() => {
  getProductionPlans()
  getProductList()
  getOperators()
})
</script>

<template>
  <div class="production-plan">
    <div class="header">
      <h2>生产计划管理</h2>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-container">
      <div class="search-wrapper">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="计划名称">
            <el-input v-model="searchForm.planName" placeholder="请输入计划名称" clearable />
          </el-form-item>
          <el-form-item label="产品名称">
            <el-input v-model="searchForm.productName" placeholder="请输入产品名称" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getProductionPlans">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
          </el-form-item>
        </el-form>
        <div class="operation-buttons">
          <el-button type="success" @click="openDialog()">
            <el-icon><Plus /></el-icon>新建计划
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 生产计划列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        border
        stripe
        highlight-current-row
      >
        <el-table-column prop="planName" label="计划名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="productName" label="产品名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="quantity" label="生产数量" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="startDate" label="开始日期" width="120" align="center" />
        <el-table-column prop="endDate" label="结束日期" width="120" align="center" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button-group>
              <el-button link type="primary" @click="openDialog(row)" v-if="currentRoleId == 1 || currentRoleId == 6">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button link type="danger" @click="deletePlan(row.id)" v-if="currentRoleId == 1 || currentRoleId == 6">
                <el-icon><Delete /></el-icon>删除
              </el-button>
              <el-button link type="primary" @click="openAssignDialog(row)" v-if="row.status !== '已完成' && row.status !== '等待原材料' && (currentRoleId == 1 || currentRoleId == 6)">
                <el-icon><User /></el-icon>分配
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          background
        />
      </div>
    </el-card>

    <!-- 新建/编辑计划对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑生产计划' : '新建生产计划'"
      width="550px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        class="dialog-form"
      >
        <el-form-item label="计划名称" prop="planName">
          <el-input v-model="formData.planName" placeholder="请输入计划名称" :disabled="!!formData.id" />
        </el-form-item>
        <el-form-item label="产品名称" prop="productName">
          <el-select v-model="formData.productName" placeholder="请选择产品" style="width: 100%" :disabled="!!formData.id">
            <el-option
              v-for="item in productList"
              :key="item.productName"
              :label="item.productName"
              :value="item.productName"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="生产数量" prop="quantity">
          <el-input-number v-model="formData.quantity" :min="1" style="width: 100%" :disabled="!!formData.id" />
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker
            v-model="formData.startDate"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="formData.endDate"
            type="date"
            placeholder="选择结束日期"
            style="width: 100%"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="savePlan">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配任务对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配任务"
      width="550px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="assign-dialog-header">
        <h3>任务分配</h3>
        <el-button 
          type="primary" 
          @click="openAiAnalysis" 
          class="ai-analysis-btn"
        >
          <el-icon><DataAnalysis /></el-icon>
          <span>智能分析</span>
        </el-button>
      </div>
      <el-form
        ref="assignFormRef"
        :model="assignForm"
        :rules="assignRules"
        label-width="100px"
        class="dialog-form"
      >
        <el-form-item label="计划名称">
          <el-input v-model="assignForm.planName" disabled />
        </el-form-item>
        <el-form-item label="总数量">
          <el-input :value="assignForm.totalQuantity" disabled />
        </el-form-item>
        <el-form-item label="剩余数量">
          <el-input :value="assignForm.remainingQuantity" disabled />
        </el-form-item>
        <el-form-item label="操作员" prop="operatorId">
          <el-select v-model="assignForm.operatorId" placeholder="请选择操作员" style="width: 100%">
            <el-option
              v-for="item in operators"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分配数量" prop="amount">
          <el-input-number 
            v-model="assignForm.amount" 
            :min="1" 
            :max="assignForm.remainingQuantity"
            style="width: 100%" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assignDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAssign">确定</el-button>
      </template>
    </el-dialog>

    <!-- 智能分析对话框 -->
    <el-dialog
      v-model="aiAnalysisVisible"
      title="智能分配分析"
      width="700px"
      :close-on-click-modal="false"
      destroy-on-close
      class="ai-analysis-dialog"
    >
      <template #header>
        <div class="ai-dialog-header">
          <div class="ai-dialog-title">
            <el-icon class="ai-title-icon"><DataAnalysis /></el-icon>
            <span>智能分配分析</span>
          </div>
          <el-tooltip content="AI智能分析为您提供最优分配方案" placement="top">
            <el-icon class="ai-info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
      </template>
      <div v-loading="aiAnalysisLoading" class="ai-analysis-content">
        <div v-if="aiAnalysisResult" v-html="aiAnalysisResult" class="markdown-body"></div>
        <div v-else class="ai-analysis-placeholder">
          <div class="ai-loading-animation">
            <el-icon class="ai-loading-icon"><Loading /></el-icon>
          </div>
          <span class="ai-loading-text">正在分析最佳分配方案，请稍候...</span>
          <div class="ai-loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="ai-dialog-footer">
          <el-button @click="aiAnalysisVisible = false" class="ai-close-btn">关闭</el-button>
          <!-- <el-button type="primary" @click="applyAiSuggestion" class="ai-apply-btn" :disabled="!aiAnalysisResult">
            <el-icon><Check /></el-icon>应用建议
          </el-button> -->
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.production-plan {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 22px;
  color: #303133;
}

.search-container {
  margin-bottom: 20px;
}

.search-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 10px;
}

.search-form :deep(.el-form-item__content) {
  margin-left: 0 !important;
}

.operation-buttons {
  margin-left: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-form .el-form-item {
  margin-bottom: 20px;
}

:deep(.el-select) {
  width: 100%;
}

:deep(.el-tag) {
  padding: 0 10px;
  height: 28px;
  line-height: 28px;
  font-size: 13px;
}

:deep(.el-table .cell) {
  padding: 8px 12px;
}

:deep(.el-button-group) {
  display: flex;
  gap: 8px;
}

:deep(.el-button--link) {
  height: 28px;
  padding: 0 8px;
}

:deep(.el-button--link .el-icon) {
  margin-right: 4px;
}

/* 智能分析相关样式 */
.assign-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.assign-dialog-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.ai-analysis-btn {
  background: linear-gradient(135deg, #409eff, #3a8ee6);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
}

.ai-analysis-btn:hover {
  background: linear-gradient(135deg, #66b1ff, #409eff);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.ai-analysis-btn .el-icon {
  font-size: 18px;
  margin-right: 2px;
}

/* 智能分析弹窗样式 */
.ai-analysis-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.ai-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 10px;
  border-bottom: 1px solid #ebeef5;
}

.ai-dialog-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.ai-title-icon {
  color: #409eff;
  font-size: 22px;
}

.ai-info-icon {
  color: #909399;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.3s;
}

.ai-info-icon:hover {
  color: #409eff;
}

.ai-analysis-content {
  min-height: 350px;
  max-height: 550px;
  overflow-y: auto;
  padding: 20px;
  border-radius: 0;
  background-color: #ffffff;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.03);
}

.ai-analysis-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
  color: #909399;
}

.ai-loading-animation {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 20px;
}

.ai-loading-icon {
  font-size: 48px;
  color: #409eff;
  animation: rotate 2s linear infinite;
}

.ai-loading-text {
  font-size: 16px;
  margin-bottom: 20px;
  color: #606266;
}

.ai-loading-dots {
  display: flex;
  gap: 6px;
}

.ai-loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #409eff;
  display: inline-block;
  animation: dots 1.4s infinite ease-in-out both;
}

.ai-loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.ai-loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes dots {
  0%, 80%, 100% { 
    transform: scale(0);
  } 
  40% { 
    transform: scale(1.0);
  }
}

.ai-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 10px 20px 20px;
  border-top: 1px solid #ebeef5;
}

.ai-close-btn {
  border-radius: 6px;
}

.ai-apply-btn {
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, #67c23a, #5daf34);
  border: none;
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.2);
  transition: all 0.3s;
}

.ai-apply-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #85ce61, #67c23a);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.3);
}

.ai-apply-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
  box-shadow: none;
}

/* Markdown样式 */
.markdown-body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #24292e;
}

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body h1 {
  font-size: 2em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eaecef;
  padding-bottom: 0.3em;
}

.markdown-body h3 {
  font-size: 1.25em;
}

.markdown-body p,
.markdown-body ul,
.markdown-body ol {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
}

.markdown-body pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
}

.markdown-body table {
  display: block;
  width: 100%;
  overflow: auto;
  border-spacing: 0;
  border-collapse: collapse;
}

.markdown-body table th,
.markdown-body table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-body table tr {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.markdown-body table tr:nth-child(2n) {
  background-color: #f6f8fa;
}
</style>