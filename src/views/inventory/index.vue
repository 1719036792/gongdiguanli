<template>
  <div class="inventory-container">
    <div class="inventory-header">
      <h2>库存管理</h2>
      <div class="inventory-actions">
        <el-input
          v-model="searchQuery"
          placeholder="名称"
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
        <el-select v-model="typeFilter" placeholder="库存类型" clearable @change="handleSearch">
          <el-option label="成品" value="1" />
          <el-option label="原材料" value="2" />
        </el-select>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon> 新增库存
        </el-button>
      </div>
    </div>

    <el-table
      v-loading="loading"
      :data="inventoryList"
      border
      style="width: 100%"
      row-key="id"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.type === '1' ? 'success' : 'warning'">
            {{ scope.row.type === '1' ? '成品' : '原材料' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="unitName" label="单位名称" />
      <el-table-column prop="quantity" label="库存数量" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">
            {{ scope.row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="restockThreshold" label="补货阈值" width="100" />
      <el-table-column prop="createdAt" label="创建时间" width="180" />
      <el-table-column prop="updatedAt" label="更新时间" width="180" />
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="scope">
          <el-button type="primary" size="small" @click="handleEdit(scope.row)">
            编辑
          </el-button>
          <el-button type="danger" size="small" @click="handleDelete(scope.row)">
            删除
          </el-button>
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

    <!-- 新增/编辑库存对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增库存' : '编辑库存'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="库存类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择库存类型" style="width: 100%">
            <el-option label="成品" value="1" />
            <el-option label="原材料" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="单位名称" prop="unitName">
          <el-input v-model="form.unitName" placeholder="请输入单位名称" />
        </el-form-item>
        <el-form-item label="库存数量" prop="quantity">
          <el-input-number v-model="form.quantity" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="库存状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择库存状态" style="width: 100%">
            <el-option label="正常" value="正常" />
            <el-option label="缺货" value="缺货" />
            <el-option label="充足" value="充足" />
          </el-select>
        </el-form-item>
        <el-form-item label="补货阈值" prop="restockThreshold">
          <el-input-number v-model="form.restockThreshold" :min="0" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus } from '@element-plus/icons-vue'
import { get, post, put, del } from '../../utils/request.js'

// 数据加载状态
const loading = ref(false)

// 库存列表数据
const inventoryList = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const typeFilter = ref('')

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' 或 'edit'
const formRef = ref(null)
const form = reactive({
  id: null,
  type: '',
  unitName: '',
  quantity: 0,
  status: 'normal',
  restockThreshold: 0
})

// 表单验证规则
const rules = {
  type: [{ required: true, message: '请选择库存类型', trigger: 'change' }],
  unitName: [{ required: true, message: '请输入单位名称', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入库存数量', trigger: 'blur' }],
  status: [{ required: true, message: '请选择库存状态', trigger: 'change' }],
  restockThreshold: [{ required: true, message: '请输入补货阈值', trigger: 'blur' }]
}

// 获取库存列表
const fetchInventoryList = async () => {
  loading.value = true
  try {
    // 构建查询参数
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize.value
    }

    if (searchQuery.value) {
      params.keyword = searchQuery.value
    }

    if (typeFilter.value) {
      params.type = typeFilter.value
    }

    // 调用API获取库存列表
    const res = await post('/api/inventory/list', params)

    if (res.code === 200) {
      inventoryList.value = res.data.records || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取库存列表失败')
    }
  } catch (error) {
    console.error('获取库存列表失败:', error)
    ElMessage.error('获取库存列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchInventoryList()
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchInventoryList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchInventoryList()
}

// 新增库存
const handleAdd = () => {
  dialogType.value = 'add'
  resetForm()
  dialogVisible.value = true
}

// 编辑库存
const handleEdit = async (row) => {
  dialogType.value = 'edit'
  resetForm()

  try {
    // 获取最新的库存详情
    const res = await get(`/api/inventory/get/${row.id}`)

    if (res.code === 200 && res.data) {
      // 填充表单数据
      Object.keys(form).forEach(key => {
        if (key in res.data) {
          form[key] = res.data[key]
        }
      })

      dialogVisible.value = true
    } else {
      ElMessage.error(res.msg || '获取库存详情失败')
    }
  } catch (error) {
    console.error('获取库存详情失败:', error)
    ElMessage.error('获取库存详情失败')
  }
}

// 删除库存
const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该库存记录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await del(`/api/inventory/delete/${row.id}`)

      if (res.code === 200) {
        ElMessage.success('删除成功')
        fetchInventoryList()
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

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res

        if (dialogType.value === 'add') {
          // 新增库存
          res = await post('/api/inventory/add', form)
        } else {
          // 编辑库存
          res = await put('/api/inventory/update', form)
        }

        if (res.code === 200) {
          ElMessage.success(dialogType.value === 'add' ? '新增成功' : '更新成功')
          dialogVisible.value = false
          fetchInventoryList()
        } else {
          ElMessage.error(res.msg || (dialogType.value === 'add' ? '新增失败' : '更新失败'))
        }
      } catch (error) {
        console.error(dialogType.value === 'add' ? '新增失败:' : '更新失败:', error)
        ElMessage.error(dialogType.value === 'add' ? '新增失败' : '更新失败')
      }
    } else {
      return false
    }
  })
}

// 重置表单
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }

  form.id = null
  form.type = ''
  form.unitName = ''
  form.quantity = 0
  form.status = 'normal'
  form.restockThreshold = 0
}

// 获取状态类型
const getStatusType = (status) => {
  if (status === '正常') return 'success'
  if (status === '缺货') return 'danger'
  if (status === '过剩') return 'warning'
  return 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  if (status === '正常') return '正常'
  if (status === '缺货') return '缺货'
  if (status === '充足') return '充足'
  return '未知'
}

// 页面加载时获取库存列表
onMounted(() => {
  fetchInventoryList()
})
</script>

<style scoped>
.inventory-container {
  padding: 20px;
}

.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.inventory-actions {
  display: flex;
  gap: 10px;
}

.search-input {
  width: 250px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
