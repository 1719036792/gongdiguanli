<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { get, post, put, del } from '../../../utils/request'
import { Search, Refresh, Plus, Edit, Delete, Check } from '@element-plus/icons-vue'

// 表格数据
const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(10)

// 搜索条件
const searchForm = ref({
  materialName: '',
  status: ''
})

// 表单数据
const dialogVisible = ref(false)
const formData = ref({
  materialName: '',
  quantity: 1,
  status: '待采购',
  productionPlanId: null,
  productionPlanName: ''
})

// 表单规则
const rules = {
  materialName: [{ required: true, message: '请输入原材料名称', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入采购数量', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

// 状态选项
const statusOptions = [
  { value: '待采购', label: '待采购' },
  { value: '采购中', label: '采购中' },
  { value: '已完成', label: '已完成' }
]

// 生产计划列表
const planList = ref([])

// 表单ref
const formRef = ref()

// 获取生产计划列表
const getProductionPlans = async () => {
  try {
    const params = {
      pageNo: 1,
      pageSize: 100,
      status: '等待原材料'
    }
    const res = await post('/api/productionPlan/page', params)
    planList.value = res.data.list || []
  } catch (error) {
    console.error('获取生产计划列表失败', error)
  }
}

// 获取采购订单列表
const getPurchaseOrders = async () => {
  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      ...searchForm.value
    }
    const res = await post('/api/purchaseOrder/page', params)
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } catch (error) {
    console.error('获取采购订单列表失败', error)
  } finally {
    loading.value = false
  }
}

// 新建或更新采购订单
const saveOrder = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.value.id) {
          await put('/api/purchaseOrder/update', formData.value)
          ElMessage.success('更新成功')
        } else {
          await post('/api/purchaseOrder/add', formData.value)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        getPurchaseOrders()
      } catch (error) {
        console.error(formData.value.id ? '更新失败' : '创建失败', error)
      }
    }
  })
}

// 删除采购订单
const deleteOrder = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该采购订单？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await del(`/api/purchaseOrder/delete/${id}`)
    ElMessage.success('删除成功')
    getPurchaseOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
    }
  }
}

// 完成采购
const completeOrder = async (id) => {
  try {
    await ElMessageBox.confirm('确认完成该采购订单？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    await post(`/api/purchaseOrder/complete/${id}`)
    ElMessage.success('采购完成')
    getPurchaseOrders()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败', error)
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
      materialName: '',
      quantity: 1,
      status: '待采购',
      productionPlanId: null,
      productionPlanName: ''
    }
  }
  dialogVisible.value = true
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.value = {
    materialName: '',
    status: ''
  }
  pageNo.value = 1
  getPurchaseOrders()
}

// 页码变化
const handleCurrentChange = (val) => {
  pageNo.value = val
  getPurchaseOrders()
}

// 每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  pageNo.value = 1
  getPurchaseOrders()
}

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    '待采购': 'warning',
    '采购中': 'primary',
    '已完成': 'success'
  }
  return statusMap[status] || 'info'
}

// 选择生产计划
const handlePlanChange = (planId) => {
  if (planId) {
    const selectedPlan = planList.value.find(plan => plan.id === planId)
    if (selectedPlan) {
      formData.value.productionPlanName = selectedPlan.planName
    }
  } else {
    formData.value.productionPlanName = ''
  }
}

// 页面加载时获取数据
onMounted(() => {
  getPurchaseOrders()
  getProductionPlans()
})
</script>

<template>
  <div class="purchase-order">
    <div class="header">
      <h2>采购订单管理</h2>
    </div>

    <el-card shadow="hover" class="main-card">
      <!-- 搜索区域 -->
      <div class="search-container">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-form-item label="原材料名称">
                <el-input v-model="searchForm.materialName" placeholder="请输入原材料名称" clearable />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="状态">
                <el-select v-model="searchForm.status" placeholder="请选择状态" clearable style="width: 100%">
                  <el-option
                    v-for="option in statusOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item class="search-buttons">
                <el-button type="primary" @click="getPurchaseOrders">
                  <el-icon><Search /></el-icon>搜索
                </el-button>
                <el-button @click="resetSearch">
                  <el-icon><Refresh /></el-icon>重置
                </el-button>
                <el-button type="success" @click="openDialog()">
                  <el-icon><Plus /></el-icon>新建采购
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 采购订单列表 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        border
        stripe
        highlight-current-row
      >
        <el-table-column prop="materialName" label="原材料名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="quantity" label="采购数量" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="productionPlanName" label="关联生产计划" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="创建时间" width="160" align="center" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDialog(row)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
            <el-button link type="success" @click="completeOrder(row.id)" v-if="row.status !== '已完成'">
              <el-icon><Check /></el-icon>完成采购
            </el-button>
            <el-button link type="danger" @click="deleteOrder(row.id)">
              <el-icon><Delete /></el-icon>删除
            </el-button>
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

    <!-- 新建/编辑采购订单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑采购订单' : '新建采购订单'"
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
        <el-form-item label="原材料名称" prop="materialName">
          <el-input v-model="formData.materialName" placeholder="请输入原材料名称" />
        </el-form-item>
        <el-form-item label="采购数量" prop="quantity">
          <el-input-number v-model="formData.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <!-- <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item> -->
        <el-form-item label="关联计划">
          <el-select 
            v-model="formData.productionPlanId" 
            placeholder="请选择关联的生产计划" 
            clearable 
            style="width: 100%"
            @change="handlePlanChange"
          >
            <el-option
              v-for="plan in planList"
              :key="plan.id"
              :label="plan.planName"
              :value="plan.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveOrder">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.purchase-order {
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

.main-card {
  margin-bottom: 20px;
}

.search-container {
  margin-bottom: 20px;
}

.search-form {
  width: 100%;
}

.search-form .el-form-item {
  margin-bottom: 18px;
  width: 100%;
}

.search-buttons {
  display: flex;
  justify-content: flex-start;
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

:deep(.el-button--link) {
  padding: 4px 8px;
}

:deep(.el-button--link .el-icon) {
  margin-right: 4px;
}
</style> 