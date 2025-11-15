<template>
  <div class="employee-management">
    <div class="header">
      <h2>员工信息管理</h2>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-container">
      <div class="search-wrapper">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="姓名">
            <el-input v-model="searchForm.name" placeholder="请输入姓名" clearable />
          </el-form-item>
          <el-form-item label="身份证号">
            <el-input v-model="searchForm.idCard" placeholder="请输入身份证号" clearable />
          </el-form-item>
          <el-form-item label="职位/工种">
            <el-input v-model="searchForm.position" placeholder="请输入职位/工种" clearable />
          </el-form-item>
          <el-form-item label="在职状态">
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
            <el-button type="primary" @click="getEmployeeList">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
          </el-form-item>
        </el-form>
        <div class="operation-buttons">
<!--           <el-button type="primary" @click="openBatchImportDialog">
            <el-icon><Upload /></el-icon>批量导入
          </el-button> -->
          <el-button type="danger" :disabled="!selectedRows.length" @click="batchDelete">
            <el-icon><Delete /></el-icon>批量删除
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 员工列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        border
        stripe
        highlight-current-row
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="姓名" min-width="100" show-overflow-tooltip />
        <el-table-column prop="username" label="用户名" min-width="100" show-overflow-tooltip />
        <el-table-column prop="gender" label="性别" width="80" align="center">
          <template #default="{ row }">
            {{ row.gender === 'M' ? '男' : row.gender === 'F' ? '女' : '' }}
          </template>
        </el-table-column>
        <el-table-column prop="idCard" label="身份证号" min-width="180" show-overflow-tooltip />
        <el-table-column prop="phone" label="联系方式" min-width="130" show-overflow-tooltip />
        <el-table-column prop="department" label="入职部门" min-width="120" show-overflow-tooltip />
        <el-table-column prop="position" label="角色" min-width="120" show-overflow-tooltip />
        <el-table-column prop="hireDate" label="入职时间" width="120" align="center" />
        <el-table-column prop="status" label="在职状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" effect="light">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button-group>
              <el-button link type="primary" @click="openDialog(row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button link type="danger" @click="deleteEmployee(row.id)">
                <el-icon><Delete /></el-icon>删除
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

    <!-- 新建/编辑员工对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑员工信息' : '新增员工信息'"
      width="600px"
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
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名" prop="name">
              <el-input v-model="formData.name" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="formData.gender" placeholder="请选择性别" style="width: 100%">
                <el-option label="男" value="M" />
                <el-option label="女" value="F" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名">
              <el-input v-model="formData.username" placeholder="用户名" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="身份证号" prop="idCard">
              <el-input v-model="formData.idCard" placeholder="请输入身份证号" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="联系方式" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入联系方式" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职部门">
              <el-input v-model="formData.department" placeholder="部门信息" disabled />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="角色">
              <el-input v-model="formData.position" placeholder="角色信息" disabled />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="入职时间" prop="hireDate">
              <el-date-picker
                v-model="formData.hireDate"
                type="date"
                placeholder="选择入职时间"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="在职状态" prop="status">
              <el-select v-model="formData.status" placeholder="请选择在职状态" style="width: 100%">
                <el-option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEmployee">确定</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="batchImportVisible"
      title="批量导入员工信息"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="batch-import-container">
        <div class="import-tips">
          <p>请按照以下格式准备Excel文件：</p>
          <ul>
            <li>用户名（必填）</li>
            <li>姓名（必填）</li>
            <li>性别（M-男，F-女）</li>
            <li>身份证号（必填）</li>
            <li>联系方式</li>
            <li>入职部门</li>
            <li>职位/工种</li>
            <li>入职时间（YYYY-MM-DD格式）</li>
            <li>在职状态（在职、请假、离职）</li>
          </ul>
        </div>
        
        <el-upload
          class="upload-demo"
          drag
          action="/api/employee/import"
          :headers="uploadHeaders"
          :on-success="handleImportSuccess"
          :on-error="handleImportError"
          :before-upload="beforeImportUpload"
          accept=".xlsx, .xls"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            拖拽文件到此处或 <em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传 xlsx/xls 文件
            </div>
          </template>
        </el-upload>
        
        <!-- 导入预览表格 -->
        <div v-if="importPreviewData.length" class="import-preview">
          <h3>导入预览</h3>
          <el-table
            :data="importPreviewData"
            border
            style="width: 100%"
            max-height="300"
          >
            <el-table-column prop="username" label="用户名" width="100" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column prop="gender" label="性别" width="60">
              <template #default="{ row }">
                {{ row.gender === 'M' ? '男' : row.gender === 'F' ? '女' : '' }}
              </template>
            </el-table-column>
            <el-table-column prop="idCard" label="身份证号" width="180" />
            <el-table-column prop="phone" label="联系方式" width="120" />
            <el-table-column prop="department" label="部门" width="100" />
            <el-table-column prop="position" label="职位" width="100" />
            <el-table-column prop="status" label="状态" width="80" />
          </el-table>
          
          <div class="import-actions">
            <el-button type="primary" @click="confirmImport">确认导入</el-button>
            <el-button @click="cancelImport">取消</el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh, Plus, Edit, Delete, Upload, UploadFilled } from '@element-plus/icons-vue'
import { getEmployeeList as fetchEmployeeList, addEmployee, updateEmployee, deleteEmployee as removeEmployee, batchDeleteEmployees, batchAddEmployees } from '../../../api/employee.js'

// 表格数据
const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const pageNo = ref(1)
const pageSize = ref(10)
const selectedRows = ref([])

// 搜索条件
const searchForm = ref({
  name: '',
  idCard: '',
  position: '',
  status: ''
})

// 表单数据
const dialogVisible = ref(false)
const formData = ref({
  name: '',
  gender: '',
  idCard: '',
  phone: '',
  department: '',
  position: '',
  hireDate: '',
  status: '在职',
  username: '',
  password: ''
})

// 表单规则
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  idCard: [
    { required: true, message: '请输入身份证号', trigger: 'blur' },
    { pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/, message: '请输入正确的身份证号', trigger: 'blur' }
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  hireDate: [{ required: true, message: '请选择入职时间', trigger: 'change' }],
  status: [{ required: true, message: '请选择在职状态', trigger: 'change' }]
}

// 状态选项
const statusOptions = [
  { value: '在职', label: '在职' },
  { value: '离职', label: '离职' }
]

// 表单ref
const formRef = ref()

// 批量导入相关
const batchImportVisible = ref(false)
const importPreviewData = ref([])
const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('token')}`
}

// 获取员工列表
const getEmployeeList = async () => {
  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      ...searchForm.value
    }
    const res = await fetchEmployeeList(params)
    if (res.code === 200) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取员工列表失败')
    }
  } catch (error) {
    console.error('获取员工列表失败', error)
    ElMessage.error('获取员工列表失败')
  } finally {
    loading.value = false
  }
}

// 新建或更新员工信息
const saveEmployee = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (formData.value.id) {
          // 编辑模式
          await updateEmployee(formData.value)
          ElMessage.success('更新成功')
        } else {
          // 新建模式
          await addEmployee(formData.value)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        getEmployeeList()
      } catch (error) {
        console.error(formData.value.id ? '更新失败' : '创建失败', error)
        ElMessage.error(formData.value.id ? '更新失败' : '创建失败')
      }
    }
  })
}

// 删除员工信息
const deleteEmployee = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该员工信息？删除后将无法恢复！', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await removeEmployee(id)
    ElMessage.success('删除成功')
    getEmployeeList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
      ElMessage.error('删除失败')
    }
  }
}

// 批量删除员工信息
const batchDelete = async () => {
  if (!selectedRows.value.length) {
    ElMessage.warning('请选择要删除的员工')
    return
  }
  
  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条员工信息？删除后将无法恢复！`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const ids = selectedRows.value.map(row => row.id)
    await batchDeleteEmployees(ids)
    ElMessage.success('批量删除成功')
    getEmployeeList()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败', error)
      ElMessage.error('批量删除失败')
    }
  }
}

// 打开编辑对话框
const openDialog = (row) => {
  if (row) {
    // 编辑模式
    formData.value = { ...row }
  } else {
    // 新建模式不再支持
    return;
  }
  dialogVisible.value = true
}

// 重置搜索条件
const resetSearch = () => {
  searchForm.value = {
    name: '',
    idCard: '',
    position: '',
    status: ''
  }
  pageNo.value = 1
  getEmployeeList()
}

// 页码变化
const handleCurrentChange = (val) => {
  pageNo.value = val
  getEmployeeList()
}

// 每页条数变化
const handleSizeChange = (val) => {
  pageSize.value = val
  pageNo.value = 1
  getEmployeeList()
}

// 获取状态标签类型
const getStatusType = (status) => {
  const statusMap = {
    '在职': 'success',
    '请假': 'warning',
    '离职': 'danger'
  }
  return statusMap[status] || 'info'
}

// 表格选择变化
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 打开批量导入对话框
const openBatchImportDialog = () => {
  batchImportVisible.value = true
  importPreviewData.value = []
}

// 上传前校验
const beforeImportUpload = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                  file.type === 'application/vnd.ms-excel'
  if (!isExcel) {
    ElMessage.error('只能上传Excel文件!')
    return false
  }
  return true
}

// 上传成功回调
const handleImportSuccess = (response) => {
  if (response.code === 200) {
    importPreviewData.value = response.data || []
    ElMessage.success('文件解析成功，请确认导入数据')
  } else {
    ElMessage.error(response.msg || '文件解析失败')
  }
}

// 上传失败回调
const handleImportError = () => {
  ElMessage.error('文件上传失败')
}

// 确认导入
const confirmImport = async () => {
  if (!importPreviewData.value.length) {
    ElMessage.warning('没有可导入的数据')
    return
  }
  
  try {
    await batchAddEmployees(importPreviewData.value)
    ElMessage.success('批量导入成功')
    batchImportVisible.value = false
    getEmployeeList()
  } catch (error) {
    console.error('批量导入失败', error)
    ElMessage.error('批量导入失败')
  }
}

// 取消导入
const cancelImport = () => {
  importPreviewData.value = []
  batchImportVisible.value = false
}

// 页面加载时获取数据
onMounted(() => {
  getEmployeeList()
})
</script>

<style scoped>
.employee-management {
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
  align-items: flex-start;
  flex-wrap: wrap;
}

.search-form {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 10px;
  margin-right: 10px;
}

.operation-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
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

/* 批量导入样式 */
.batch-import-container {
  padding: 10px;
}

.import-tips {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
}

.import-tips p {
  margin-top: 0;
  font-weight: bold;
}

.import-tips ul {
  padding-left: 20px;
  margin-bottom: 0;
}

.import-preview {
  margin-top: 20px;
}

.import-preview h3 {
  margin-bottom: 10px;
}

.import-actions {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

:deep(.el-upload-dragger) {
  width: 100%;
}
</style> 