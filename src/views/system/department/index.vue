<template>
  <div class="department-management">
    <div class="header">
      <h2>部门管理</h2>
    </div>
    
    <div class="content-container">
      <!-- 左侧部门树 -->
      <el-card class="tree-card">
        <div class="tree-header">
          <h3>部门列表</h3>
          <div class="tree-operations">
            <el-button type="success" size="small" @click="addTopDepartment">
              <el-icon><Plus /></el-icon>新增部门
            </el-button>
            <el-button type="primary" size="small" @click="refreshTree">
              <el-icon><Refresh /></el-icon>刷新
            </el-button>
          </div>
        </div>
        <div class="tree-container" v-loading="treeLoading">
          <el-tree
            ref="deptTree"
            :data="departmentTree"
            :props="{ label: 'deptName', children: 'children' }"
            node-key="id"
            highlight-current
            default-expand-all
            @node-click="handleNodeClick"
          >
            <template #default="{ node, data }">
              <div class="tree-node">
                <span>{{ node.label }}</span>
                <div class="node-operations">
                  <el-button link type="primary" @click.stop="addChildDepartment(data)">
                    <el-icon><Plus /></el-icon>
                  </el-button>
                  <el-button link type="primary" @click.stop="editDepartment(data)">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button link type="danger" @click.stop="deleteDepartment(data)">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </template>
          </el-tree>
        </div>
      </el-card>

      <!-- 右侧用户列表 -->
      <el-card class="user-list-card">
        <div class="user-list-header">
          <h3>{{ currentDept.deptName || '全部' }}部门用户</h3>
          <div class="user-list-operations">
            <el-button type="success" v-if="currentDept.id" @click="openAddUserDialog">
              <el-icon><Plus /></el-icon>添加用户
            </el-button>
            <el-input
              v-model="userSearchKeyword"
              placeholder="搜索用户"
              clearable
              style="width: 200px"
              @clear="searchDeptUsers"
              @input="handleUserSearchInput"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="searchDeptUsers">
              <el-icon><Search /></el-icon>搜索
            </el-button>
          </div>
        </div>
        
        <el-table
          v-loading="userListLoading"
          :data="userList"
          style="width: 100%"
          border
          stripe
        >
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.enableFlag ? 'success' : 'danger'">
                {{ row.enableFlag ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdTime" label="创建时间" min-width="160" show-overflow-tooltip />
          <el-table-column label="操作" width="120" align="center" v-if="currentDept.id">
            <template #default="{ row }">
              <el-button 
                type="danger" 
                link
                @click="removeUserFromDepartment(row)"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="userPageNo"
            v-model:page-size="userPageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="userTotal"
            @size-change="handleUserSizeChange"
            @current-change="handleUserCurrentChange"
            background
          />
        </div>
      </el-card>
    </div>

    <!-- 部门表单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="formData.id ? '编辑部门' : '新增部门'"
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
        <el-form-item label="上级部门">
          <el-input v-model="parentDeptName" disabled />
        </el-form-item>
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="formData.deptName" placeholder="请输入部门名称" />
        </el-form-item>
        <el-form-item label="排序号" prop="orderNum">
          <el-input-number v-model="formData.orderNum" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="部门状态">
          <el-switch v-model="formData.enableFlag" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
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
    
    <!-- 添加用户弹窗 -->
    <el-dialog
      v-model="userDialogVisible"
      title="添加部门用户"
      width="700px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="user-search-area">
        <el-input
          v-model="selectUserKeyword"
          placeholder="搜索用户"
          clearable
          style="width: 250px"
          @clear="searchSelectableUsers"
          @input="handleSelectUserInput"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="searchSelectableUsers">
          <el-icon><Search /></el-icon>搜索
        </el-button>
      </div>
      
      <el-table
        v-loading="selectUserLoading"
        :data="selectableUsers"
        style="width: 100%"
        border
        stripe
        @selection-change="handleUserSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enableFlag ? 'success' : 'danger'">
              {{ row.enableFlag ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
        
      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="selectUserPageNo"
          v-model:page-size="selectUserPageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="selectUserTotal"
          @size-change="handleSelectUserSizeChange"
          @current-change="handleSelectUserCurrentChange"
          background
        />
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="userDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="addUsersToDept">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Plus, Edit, Delete, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getDepartmentTree, 
  addDepartment, 
  updateDepartment, 
  deleteDepartment as removeDepartment 
} from '../../../api/department.js'
import { 
  getUsersByDept, 
  removeUserFromDept, 
  searchUsers,
  updateUser 
} from '../../../api/user.js'

// 状态数据
const treeLoading = ref(false)
const userListLoading = ref(false)
const dialogVisible = ref(false)
const userDialogVisible = ref(false)
const departmentTree = ref([])
const currentDept = ref({})
const formRef = ref(null)
const deptTree = ref(null)

// 用户列表数据
const userList = ref([])
const userSearchKeyword = ref('')
const userPageNo = ref(1)
const userPageSize = ref(10)
const userTotal = ref(0)

// 可选用户数据
const selectableUsers = ref([])
const selectedUsers = ref([])
const selectUserKeyword = ref('')
const selectUserLoading = ref(false)
const selectUserPageNo = ref(1)
const selectUserPageSize = ref(10)
const selectUserTotal = ref(0)

// 表单数据
const formData = reactive({
  id: '',
  parentId: 0,
  deptName: '',
  orderNum: 1,
  enableFlag: true,
  remark: ''
})

const parentDeptName = computed(() => {
  if (!formData.parentId) return '顶级部门'
  if (currentDept.value && formData.parentId === currentDept.value.id) {
    return currentDept.value.deptName
  }
  return '选中部门'
})

// 表单校验规则
const rules = {
  deptName: [
    { required: true, message: '请输入部门名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  orderNum: [
    { required: true, message: '请输入排序号', trigger: 'blur' }
  ]
}

// 获取部门树
const getDeptTree = async () => {
  treeLoading.value = true
  try {
    const res = await getDepartmentTree()
    departmentTree.value = res.data || []
  } catch (error) {
    console.error('获取部门树失败', error)
    ElMessage.error('获取部门树失败')
  } finally {
    treeLoading.value = false
  }
}

// 刷新部门树
const refreshTree = () => {
  getDeptTree()
}

// 点击树节点
const handleNodeClick = (data) => {
  currentDept.value = data
  userPageNo.value = 1
  getDeptUsers()
}

// 获取部门用户
const getDeptUsers = async () => {
  userListLoading.value = true
  try {
    const params = {
      pageNo: userPageNo.value,
      pageSize: userPageSize.value,
      deptId: currentDept.value.id || '',
      username: userSearchKeyword.value
    }
    const res = await getUsersByDept(params)
    userList.value = res.data.list
    userTotal.value = res.data.total
  } catch (error) {
    console.error('获取部门用户失败', error)
    ElMessage.error('获取部门用户失败')
  } finally {
    userListLoading.value = false
  }
}

// 搜索部门用户
const searchDeptUsers = () => {
  userPageNo.value = 1
  getDeptUsers()
}

// 用户搜索输入防抖
let userSearchTimer = null
const handleUserSearchInput = () => {
  if (userSearchTimer) {
    clearTimeout(userSearchTimer)
  }
  userSearchTimer = setTimeout(() => {
    searchDeptUsers()
  }, 500)
}

// 用户列表分页大小变更
const handleUserSizeChange = (val) => {
  userPageSize.value = val
  getDeptUsers()
}

// 用户列表当前页变更
const handleUserCurrentChange = (val) => {
  userPageNo.value = val
  getDeptUsers()
}

// 添加顶级部门
const addTopDepartment = () => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    id: '',
    parentId: 0,
    deptName: '',
    orderNum: 1,
    enableFlag: true,
    remark: ''
  })
  dialogVisible.value = true
}

// 添加子部门
const addChildDepartment = (data) => {
  formRef.value?.resetFields()
  Object.assign(formData, {
    id: '',
    parentId: data.id,
    deptName: '',
    orderNum: 1,
    enableFlag: true,
    remark: ''
  })
  dialogVisible.value = true
}

// 编辑部门
const editDepartment = (data) => {
  formRef.value?.resetFields()
  Object.assign(formData, { ...data })
  dialogVisible.value = true
}

// 删除部门
const deleteDepartment = (data) => {
  if (data.children && data.children.length > 0) {
    ElMessage.warning('该部门下有子部门，不能删除！')
    return
  }
  
  ElMessageBox.confirm(`确定要删除部门"${data.deptName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    treeLoading.value = true
    try {
      await removeDepartment(data.id)
      ElMessage.success('删除部门成功')
      await getDeptTree()
      if (currentDept.value.id === data.id) {
        currentDept.value = {}
        userList.value = []
        userTotal.value = 0
      }
    } catch (error) {
      console.error('删除部门失败', error)
      ElMessage.error('删除部门失败')
    } finally {
      treeLoading.value = false
    }
  }).catch(() => {})
}

// 从部门移除用户
const removeUserFromDepartment = (user) => {
  ElMessageBox.confirm(`确定从"${currentDept.value.deptName || '当前'}"部门中移除用户"${user.username}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    userListLoading.value = true
    try {
      await removeUserFromDept(user.id)
      ElMessage.success('已从部门移除该用户')
      getDeptUsers() // 刷新用户列表
    } catch (error) {
      console.error('移除用户失败', error)
      ElMessage.error('移除用户失败')
    } finally {
      userListLoading.value = false
    }
  }).catch(() => {})
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      treeLoading.value = true
      try {
        if (formData.id) {
          await updateDepartment(formData)
          ElMessage.success('更新部门成功')
        } else {
          await addDepartment(formData)
          ElMessage.success('新增部门成功')
        }
        dialogVisible.value = false
        await getDeptTree()
      } catch (error) {
        console.error('提交表单失败', error)
        ElMessage.error('提交表单失败')
      } finally {
        treeLoading.value = false
      }
    }
  })
}

// 打开添加用户对话框
const openAddUserDialog = () => {
  if (!currentDept.value.id) {
    ElMessage.warning('请先选择一个部门')
    return
  }
  userDialogVisible.value = true
  selectUserPageNo.value = 1
  selectUserKeyword.value = ''
  selectedUsers.value = []
  searchSelectableUsers()
}

// 搜索可选用户
const searchSelectableUsers = async () => {
  selectUserLoading.value = true
  try {
    const params = {
      pageNo: selectUserPageNo.value,
      pageSize: selectUserPageSize.value,
      username: selectUserKeyword.value
    }
    const res = await searchUsers(params)
    // 过滤掉已经在当前部门的用户
    selectableUsers.value = res.data.list.filter(user => user.deptId !== currentDept.value.id)
    selectUserTotal.value = res.data.total
  } catch (error) {
    console.error('搜索用户失败', error)
    ElMessage.error('搜索用户失败')
  } finally {
    selectUserLoading.value = false
  }
}

// 用户选择输入防抖
let selectUserTimer = null
const handleSelectUserInput = () => {
  if (selectUserTimer) {
    clearTimeout(selectUserTimer)
  }
  selectUserTimer = setTimeout(() => {
    searchSelectableUsers()
  }, 500)
}

// 用户选择表格分页大小变更
const handleSelectUserSizeChange = (val) => {
  selectUserPageSize.value = val
  searchSelectableUsers()
}

// 用户选择表格当前页变更
const handleSelectUserCurrentChange = (val) => {
  selectUserPageNo.value = val
  searchSelectableUsers()
}

// 用户选择变更处理
const handleUserSelectionChange = (selection) => {
  selectedUsers.value = selection
}

// 添加用户到部门
const addUsersToDept = async () => {
  if (selectedUsers.value.length === 0) {
    ElMessage.warning('请至少选择一个用户')
    return
  }

  userDialogVisible.value = false
  userListLoading.value = true

  try {
    // 并行处理所有用户的更新
    const updatePromises = selectedUsers.value.map(user => {
      const updateData = {
        id: user.id,
        deptId: currentDept.value.id
      }
      return updateUser(updateData)
    })

    await Promise.all(updatePromises)
    ElMessage.success(`成功添加${selectedUsers.value.length}个用户到部门`)
    getDeptUsers() // 刷新部门用户列表
  } catch (error) {
    console.error('添加用户到部门失败', error)
    ElMessage.error('添加用户到部门失败')
  } finally {
    userListLoading.value = false
  }
}

// 页面挂载时执行
onMounted(() => {
  getDeptTree()
  getDeptUsers() // 初始加载所有用户
})
</script>

<style scoped>
.department-management {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.content-container {
  display: flex;
  gap: 20px;
}

.tree-card {
  width: 350px;
  flex-shrink: 0;
}

.user-list-card {
  flex-grow: 1;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.tree-container {
  min-height: 400px;
}

.tree-node {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.node-operations {
  display: flex;
  gap: 5px;
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node:hover .node-operations {
  opacity: 1;
}

.user-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.user-list-operations {
  display: flex;
  gap: 10px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.dialog-form {
  margin-right: 20px;
}

.user-search-area {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}
</style> 