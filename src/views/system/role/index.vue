<template>
  <div class="role-management">
    <div class="header">
      <h2>角色管理</h2>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-container">
      <div class="search-wrapper">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="角色名称">
            <el-input v-model="searchForm.roleName" placeholder="请输入角色名称" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="getRoleList">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
          </el-form-item>
        </el-form>
        <div class="operation-buttons">
          <el-button type="success" @click="openDialog()">
            <el-icon><Plus /></el-icon>新增角色
          </el-button>
          <el-button type="danger" :disabled="!selectedRows.length" @click="batchDelete">
            <el-icon><Delete /></el-icon>批量删除
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 角色列表 -->
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
        <el-table-column prop="roleName" label="角色名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="roleDescription" label="角色描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="createdTime" label="创建时间" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button-group>
              <el-button link type="primary" @click="openDialog(row)">
                <el-icon><Edit /></el-icon>编辑
              </el-button>
              <el-button link type="warning" @click="openUserManageDialog(row)">
                <el-icon><UserFilled /></el-icon>用户管理
              </el-button>
              <el-button link type="danger" @click="deleteRole(row.id)">
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

    <!-- 新建/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑角色' : '新增角色'"
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
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="formData.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色描述" prop="roleDescription">
          <el-input
            v-model="formData.roleDescription"
            type="textarea"
            placeholder="请输入角色描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 用户管理对话框 -->
    <el-dialog
      v-model="userManageDialogVisible"
      :title="`${currentRole.roleName || ''}角色用户管理`"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="user-manage-container" v-loading="userLoading">
        <div class="user-manage-header">
          <el-input v-model="userSearchKeyword" placeholder="请输入用户名搜索" style="width: 300px;" clearable @clear="searchRoleUsers" @input="handleUserSearchInput">
            <template #append>
              <el-button :icon="Search" @click="searchRoleUsers"></el-button>
            </template>
          </el-input>
          <el-button type="primary" @click="openAddUserDialog">
            <el-icon><Plus /></el-icon>添加用户
          </el-button>
        </div>
        
        <el-table :data="roleUsers" border stripe style="width: 100%">
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column prop="phone" label="联系方式" min-width="120" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.enableFlag ? 'success' : 'danger'">
                {{ row.enableFlag ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <el-button link type="danger" @click="removeUserFromRole(row)">
                <el-icon><Delete /></el-icon>移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 用户列表分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="userPageNo"
            v-model:page-size="userPageSize"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="userTotal"
            @size-change="handleUserSizeChange"
            @current-change="handleUserCurrentChange"
            background
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userManageDialogVisible = false">关 闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 添加用户对话框 -->
    <el-dialog
      v-model="addUserDialogVisible"
      title="添加用户"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
      append-to-body
    >
      <div class="add-user-container" v-loading="allUserLoading">
        <el-input v-model="allUserSearchKeyword" placeholder="请输入用户名搜索" style="width: 100%;" clearable @clear="searchAllUsers" @input="handleAllUserSearchInput">
          <template #append>
            <el-button :icon="Search" @click="searchAllUsers"></el-button>
          </template>
        </el-input>
        
        <el-table 
          :data="availableUsers" 
          border 
          stripe 
          style="width: 100%; margin-top: 20px;"
          height="300px"
          @selection-change="handleAddUserSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column prop="phone" label="联系方式" min-width="120" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.enableFlag ? 'success' : 'danger'">
                {{ row.enableFlag ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addUserDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="addUsersToRole" :disabled="selectedUsers.length === 0">
            确 定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Refresh, Plus, Edit, Delete, UserFilled, Setting } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getRoleList, addRole, updateRole, deleteRole as removeRole } from '../../../api/role.js'
import { getPageUsersByRole, searchUsers as fetchUsers, updateUser, removeUser } from '../../../api/user.js'

// 状态数据
const loading = ref(false)
const userLoading = ref(false)
const allUserLoading = ref(false)
const dialogVisible = ref(false)
const userManageDialogVisible = ref(false)
const addUserDialogVisible = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const formRef = ref(null)
const currentRole = ref({})

// 用户管理相关
const roleUsers = ref([])
const userSearchKeyword = ref('')
const userPageNo = ref(1)
const userPageSize = ref(10)
const userTotal = ref(0)

// 添加用户相关
const availableUsers = ref([])
const allUserSearchKeyword = ref('')
const selectedUsers = ref([])

// 分页参数
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 搜索表单
const searchForm = reactive({
  roleName: ''
})

// 表单数据
const formData = reactive({
  id: '',
  roleName: '',
  roleDescription: ''
})

// 表单校验规则
const rules = {
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 获取角色列表
const fetchRoleList = async () => {
  loading.value = true
  try {
    const params = {
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      ...searchForm
    }
    const res = await getRoleList(params)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    console.error('获取角色列表失败', error)
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
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
      roleName: '',
      roleDescription: ''
    })
  }
  dialogVisible.value = true
}

// 打开用户管理对话框
const openUserManageDialog = async (row) => {
  currentRole.value = row
  userManageDialogVisible.value = true
  userPageNo.value = 1
  userSearchKeyword.value = ''
  userLoading.value = true
  
  try {
    await loadRoleUsers()
  } catch (error) {
    console.error('获取角色用户失败', error)
    ElMessage.error('获取角色用户失败')
  } finally {
    userLoading.value = false
  }
}

// 加载角色下的用户
const loadRoleUsers = async () => {
  userLoading.value = true
  try {
    const params = {
      pageNo: userPageNo.value,
      pageSize: userPageSize.value,
      roleId: currentRole.value.id,
      username: userSearchKeyword.value
    }
    const res = await getPageUsersByRole(params)
    roleUsers.value = res.data.list
    userTotal.value = res.data.total
  } catch (error) {
    console.error('获取角色用户失败', error)
    ElMessage.error('获取角色用户失败')
  } finally {
    userLoading.value = false
  }
}

// 用户搜索输入防抖
let userSearchTimer = null
const handleUserSearchInput = () => {
  if (userSearchTimer) {
    clearTimeout(userSearchTimer)
  }
  userSearchTimer = setTimeout(() => {
    searchRoleUsers()
  }, 500)
}

// 搜索角色下的用户
const searchRoleUsers = () => {
  userPageNo.value = 1
  loadRoleUsers()
}

// 打开添加用户对话框
const openAddUserDialog = async () => {
  addUserDialogVisible.value = true
  allUserSearchKeyword.value = ''
  selectedUsers.value = []
  await searchAllUsers()
}

// 所有用户搜索防抖
let allUserSearchTimer = null
const handleAllUserSearchInput = () => {
  if (allUserSearchTimer) {
    clearTimeout(allUserSearchTimer)
  }
  allUserSearchTimer = setTimeout(() => {
    searchAllUsers()
  }, 500)
}

// 搜索所有可添加的用户
const searchAllUsers = async () => {
  allUserLoading.value = true
  try {
    const params = {
      pageNo: 1,
      pageSize: 100,
      username: allUserSearchKeyword.value,
      excludeRoleId: currentRole.value.id // 排除已在该角色的用户
    }
    const res = await fetchUsers(params)
    availableUsers.value = res.data.list || []
  } catch (error) {
    console.error('搜索用户失败', error)
    ElMessage.error('搜索用户失败')
  } finally {
    allUserLoading.value = false
  }
}

// 选择要添加的用户
const handleAddUserSelectionChange = (selection) => {
  selectedUsers.value = selection
}

// 添加用户到角色
const addUsersToRole = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请选择要添加的用户')
    return
  }
  
  allUserLoading.value = true
  try {
    const promises = selectedUsers.value.map(user => {
      return updateUser({
        id: user.id,
        roleId: currentRole.value.id
      })
    })
    
    await Promise.all(promises)
    ElMessage.success('添加用户成功')
    addUserDialogVisible.value = false
    await loadRoleUsers()
  } catch (error) {
    console.error('添加用户失败', error)
    ElMessage.error('添加用户失败')
  } finally {
    allUserLoading.value = false
  }
}

// 从角色中移除用户
const removeUserFromRole = async (user) => {
  ElMessageBox.confirm(`确定要将用户"${user.username}"从角色"${currentRole.value.roleName}"中移除吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    userLoading.value = true
    try {
      await removeUser(user.id)
      ElMessage.success('移除用户成功')
      await loadRoleUsers()
    } catch (error) {
      console.error('移除用户失败', error)
      ElMessage.error('移除用户失败')
    } finally {
      userLoading.value = false
    }
  }).catch(() => {})
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (formData.id) {
          await updateRole(formData)
          ElMessage.success('更新角色成功')
        } else {
          await addRole(formData)
          ElMessage.success('新增角色成功')
        }
        dialogVisible.value = false
        fetchRoleList()
      } catch (error) {
        console.error('提交表单失败', error)
        ElMessage.error('提交表单失败')
      } finally {
        loading.value = false
      }
    }
  })
}

// 删除角色
const deleteRole = async (id) => {
  ElMessageBox.confirm('确定要删除该角色吗？删除后相关用户将无法正常使用系统功能！', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    loading.value = true
    try {
      await removeRole(id)
      ElMessage.success('删除角色成功')
      fetchRoleList()
    } catch (error) {
      console.error('删除角色失败', error)
      ElMessage.error('删除角色失败')
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
  
  ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 条记录吗？删除后相关用户将无法正常使用系统功能！`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    loading.value = true
    try {
      const ids = selectedRows.value.map(item => item.id)
      // TODO: 调用批量删除接口
      ElMessage.success('批量删除成功')
      fetchRoleList()
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
  fetchRoleList()
}

// 当前页变更
const handleCurrentChange = (val) => {
  pageNo.value = val
  fetchRoleList()
}

// 用户列表分页大小变更
const handleUserSizeChange = (val) => {
  userPageSize.value = val
  loadRoleUsers()
}

// 用户列表当前页变更
const handleUserCurrentChange = (val) => {
  userPageNo.value = val
  loadRoleUsers()
}

// 重置搜索条件
const resetSearch = () => {
  Object.assign(searchForm, {
    roleName: ''
  })
  pageNo.value = 1
  fetchRoleList()
}

// 页面挂载时执行
onMounted(() => {
  fetchRoleList()
})
</script>

<style scoped>
.role-management {
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

.user-manage-container {
  min-height: 400px;
}

.user-manage-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.add-user-container {
  min-height: 350px;
}
</style> 