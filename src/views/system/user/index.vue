<template>
  <div class="user-management">
    <div class="header">
      <h2>用户管理</h2>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-container">
      <div class="search-wrapper">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="用户名">
            <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.enableFlag" placeholder="全部" clearable>
              <el-option label="启用" :value="true" />
              <el-option label="禁用" :value="false" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchUserList">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
          </el-form-item>
        </el-form>
        <div class="operation-buttons">
          <el-button type="success" @click="openDialog()">
            <el-icon><Plus /></el-icon>新增用户
          </el-button>
          <el-button type="danger" :disabled="!selectedRows.length" @click="batchDelete">
            <el-icon><Delete /></el-icon>批量删除
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 用户列表 -->
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
        <el-table-column prop="username" label="用户名" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enableFlag ? 'success' : 'danger'">
              {{ row.enableFlag ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="创建时间" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button-group>
              <el-button link type="primary" @click="openDialog(row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button link type="danger" @click="deleteUser(row.id)">
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

    <!-- 新建/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑用户' : '新增用户'"
      width="500px"
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
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="!formData.id" label="密码" prop="password">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="formData.roleId" placeholder="请选择角色" filterable clearable style="width: 100%">
            <el-option
              v-for="role in roleOptions"
              :key="role.id"
              :label="role.roleName"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="formData.enableFlag" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, addUser, updateUser, deleteUser as removeUser } from '../../../api/user.js'
import { getRoleList } from '../../../api/role.js'

// 状态数据
const loading = ref(false)
const dialogVisible = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const formRef = ref(null)
const roleOptions = ref([])

// 分页参数
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索表单
const searchForm = reactive({
  username: '',
  enableFlag: ''
})

// 表单数据
const formData = reactive({
  id: '',
  username: '',
  password: '',
  roleId: undefined,
  enableFlag: true
})

// 表单校验规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  roleId: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      ...searchForm
    }
    const res = await getUserList(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取用户列表失败', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

// 获取角色列表（用于下拉选择）
const fetchRoleOptions = async () => {
  try {
    const res = await getRoleList({ pageSize: 100 })
    roleOptions.value = res.data.list || []
  } catch (error) {
    console.error('获取角色列表失败', error)
    ElMessage.error('获取角色列表失败')
  }
}

// 打开对话框
const openDialog = (row) => {
  formRef.value?.resetFields()
  if (row) {
    Object.assign(formData, row)
  } else {
    Object.assign(formData, {
      id: '',
      username: '',
      password: '',
      roleId: undefined,
      enableFlag: true
    })
  }
  dialogVisible.value = true
  // 确保下拉选项已加载
  fetchRoleOptions()
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (formData.id) {
          await updateUser(formData)
          ElMessage.success('更新用户成功')
        } else {
          await addUser(formData)
          ElMessage.success('新增用户成功')
        }
        dialogVisible.value = false
        fetchUserList()
      } catch (error) {
        console.error('提交表单失败', error)
        ElMessage.error('提交表单失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 删除用户
const deleteUser = async (id) => {
  ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    loading.value = true
    try {
      await removeUser(id)
      ElMessage.success('删除用户成功')
      fetchUserList()
    } catch (error) {
      console.error('删除用户失败', error)
      ElMessage.error('删除用户失败')
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}

// 批量删除
const batchDelete = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条记录')
    return
  }
  
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    loading.value = true
    try {
      const ids = selectedRows.value.map(item => item.id)
      // TODO: 调用批量删除接口
      ElMessage.success('批量删除成功')
      fetchUserList()
    } catch (error) {
      console.error('批量删除失败', error)
      ElMessage.error('批量删除失败')
    } finally {
      loading.value = false
    }
  }).catch(() => {})
}

// 表格多选
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
}

// 分页大小变更
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchUserList()
}

// 当前页变更
const handleCurrentChange = (val) => {
  pageNo.value = val
  fetchUserList()
}

// 重置搜索条件
const resetSearch = () => {
  Object.assign(searchForm, {
    username: '',
    enableFlag: ''
  })
  pageNo.value = 1
  fetchUserList()
}

// 页面挂载时执行
onMounted(() => {
  fetchUserList()
  fetchRoleOptions()
})
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.search-container {
  margin-bottom: 20px;
}

.search-wrapper {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
}

.operation-buttons {
  display: flex;
  gap: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-form {
  margin-right: 20px;
}
</style> 