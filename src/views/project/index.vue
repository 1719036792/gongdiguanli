<template>
  <div class="app-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>新建项目
      </el-button>
      <el-button type="warning" @click="handleModify" :disabled="!selectedRow">
        <el-icon><Edit /></el-icon>修改项目
      </el-button>
      <el-button type="danger" @click="handleDelete" :disabled="!selectedRow">
        <el-icon><Delete /></el-icon>删除项目
      </el-button>
      <el-form inline class="toolbar-form">
        <el-form-item label="项目名称">
          <el-input v-model="queryParams.name" placeholder="请输入项目名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="项目状态">
          <el-select v-model="queryParams.status" placeholder="请选择项目状态" clearable>
            <el-option label="未开始" value="1" />
            <el-option label="进行中" value="2" />
            <el-option label="已完成" value="3" />
            <el-option label="已暂停" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="创建时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="handleDateRangeChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 项目列表 -->
    <el-table :data="tableData" border style="width: 100%" @row-click="handleRowClick" highlight-current-row v-loading="loading">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="项目名称" />
      <el-table-column prop="code" label="项目编号" width="120" />
      <el-table-column prop="location" label="施工地点" />
      <el-table-column prop="managerName" label="项目经理" width="100" />
      <el-table-column prop="startDate" label="开始日期" width="100" />
      <el-table-column prop="endDate" label="计划结束日期" width="120" />
      <el-table-column prop="status" label="项目状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '1'">未开始</el-tag>
          <el-tag type="success" v-else-if="scope.row.status === '2'">进行中</el-tag>
          <el-tag type="info" v-else-if="scope.row.status === '3'">已完成</el-tag>
          <el-tag type="warning" v-else-if="scope.row.status === '4'">已暂停</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="完成进度" width="110">
        <template #default="scope">
          <el-progress :percentage="scope.row.progress" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button type="primary" link @click.stop="handleDetail(scope.row)">
            <el-icon><View /></el-icon>详情
          </el-button>
          <el-button type="success" link @click.stop="handleAssignWorkers(scope.row)" :disabled="scope.row.status !== '1'">
            <el-icon><User /></el-icon>分配工人
          </el-button>
          <el-button type="warning" link @click.stop="handleTasks(scope.row)">
            <el-icon><List /></el-icon>任务管理
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

    <!-- 添加/修改项目弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新建项目' : '修改项目'"
      width="700px"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="项目名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目编号" prop="code">
          <el-input v-model="formData.code" placeholder="请输入项目编号" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker
                v-model="formData.startDate"
                type="date"
                placeholder="选择开始日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker
                v-model="formData.endDate"
                type="date"
                placeholder="选择计划结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="施工地点" prop="location">
          <el-input v-model="formData.location" placeholder="请输入施工地点" />
        </el-form-item>
        <el-form-item label="项目经理" prop="managerId">
          <el-select v-model="formData.managerId" placeholder="请选择项目经理" style="width: 100%">
            <el-option
              v-for="item in managers"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="项目状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择项目状态" style="width: 100%">
            <el-option label="未开始" value="1" />
            <el-option label="进行中" value="2" />
            <el-option label="已完成" value="3" />
            <el-option label="已暂停" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="完成进度" prop="progress">
          <el-slider v-model="formData.progress" :step="5" :max="100" show-input input-size="small" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入项目描述"
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

    <!-- 分配工人弹窗 -->
    <el-dialog
      v-model="workerDialogVisible"
      title="分配工人"
      width="800px"
    >
      <div v-if="currentProject" class="project-worker-assignment">
        <div class="project-info">
          <h3>{{ currentProject.name }}</h3>
          <p>项目编号: {{ currentProject.code }}</p>
          <p>项目经理: {{ currentProject.managerName }}</p>
        </div>

        <el-divider />

        <div class="search-workers">
          <el-input
            v-model="workerSearch"
            placeholder="搜索工人姓名"
            clearable
            @input="filterWorkers"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <div class="worker-assignment-container">
          <div class="available-workers">
            <h4>可选工人</h4>
            <el-table :data="availableWorkers" height="300" @row-click="selectWorker">
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="position" label="工种" />
              <el-table-column prop="department" label="部门" />
              <el-table-column label="操作" width="80">
                <template #default="scope">
                  <el-button type="primary" link @click.stop="addWorker(scope.row)">
                    <el-icon><ArrowRight /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="assigned-workers">
            <h4>已分配工人</h4>
            <el-table :data="assignedWorkers" height="300">
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="position" label="工种" />
              <el-table-column prop="department" label="部门" />
              <el-table-column label="操作" width="80">
                <template #default="scope">
                  <el-button type="danger" link @click.stop="removeWorker(scope.row)">
                    <el-icon><ArrowLeft /></el-icon>
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="workerDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveWorkerAssignment">保存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 项目详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="项目详情"
      width="800px"
    >
      <div v-if="currentProject" class="project-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="项目名称" :span="2">{{ currentProject.name }}</el-descriptions-item>
          <el-descriptions-item label="项目编号">{{ currentProject.code }}</el-descriptions-item>
          <el-descriptions-item label="项目经理">{{ getManagerName(currentProject.managerId) }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentProject.startDate }}</el-descriptions-item>
          <el-descriptions-item label="计划结束日期">{{ currentProject.endDate }}</el-descriptions-item>
          <el-descriptions-item label="施工地点" :span="2">{{ currentProject.location }}</el-descriptions-item>
          <el-descriptions-item label="项目状态">
            <el-tag v-if="currentProject.status === '1'">未开始</el-tag>
            <el-tag type="success" v-else-if="currentProject.status === '2'">进行中</el-tag>
            <el-tag type="info" v-else-if="currentProject.status === '3'">已完成</el-tag>
            <el-tag type="warning" v-else-if="currentProject.status === '4'">已暂停</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="完成进度">
            <el-progress :percentage="currentProject.progress" />
          </el-descriptions-item>
          <el-descriptions-item label="项目描述" :span="2">
            {{ currentProject.description || '暂无描述' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider />

        <el-tabs>
          <el-tab-pane label="项目工人">
            <el-table :data="projectWorkers" height="240">
              <el-table-column prop="name" label="姓名" />
              <el-table-column prop="position" label="工种" />
              <el-table-column prop="department" label="部门" />
              <el-table-column prop="phone" label="联系电话" />
              <el-table-column prop="joinDate" label="加入日期" />
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="任务进度">
            <el-table :data="projectTasks" height="240">
              <el-table-column prop="name" label="任务名称" />
              <el-table-column prop="assigneeName" label="负责人" />
              <el-table-column prop="startDate" label="开始日期" />
              <el-table-column prop="endDate" label="截止日期" />
              <el-table-column prop="status" label="任务状态">
                <template #default="scope">
                  <el-tag v-if="scope.row.status === '1'">未开始</el-tag>
                  <el-tag type="success" v-else-if="scope.row.status === '2'">进行中</el-tag>
                  <el-tag type="info" v-else-if="scope.row.status === '3'">已完成</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="progress" label="完成进度">
                <template #default="scope">
                  <el-progress :percentage="scope.row.progress" />
                </template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh, View, User, List, ArrowRight, ArrowLeft } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { getProjectList, addProject, updateProject, deleteProject, getProjectMembers, assignProjectMembers, updateProjectProgress } from '../../api/project.js'
import { getUsersByRole } from '../../api/user.js'
import { getTaskList } from '../../api/task.js'

const router = useRouter()

// 表格数据
const tableData = ref([])
const selectedRow = ref(null)
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

// 查询参数
const queryParams = reactive({
  name: '',
  status: '',
  startTime: '',
  endTime: ''
})
const dateRange = ref([])

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const formData = reactive({
  id: null,
  name: '',
  code: '',
  startDate: '',
  endDate: '',
  location: '',
  managerId: '',
  status: '1',
  progress: 0,
  description: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入项目编号', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择计划结束日期', trigger: 'change' }],
  location: [{ required: true, message: '请输入施工地点', trigger: 'blur' }],
  managerId: [{ required: true, message: '请选择项目经理', trigger: 'change' }],
  status: [{ required: true, message: '请选择项目状态', trigger: 'change' }]
}

// 项目经理列表
const managers = ref([])

// 获取项目经理列表
const getManagersList = () => {
  // 从接口获取角色为3的用户列表（项目经理）
  getUsersByRole(3).then(res => {
    managers.value = res.data.map(user => {
      return {
        id: user.id,
        name: user.name
      };
    });
  }).catch(() => {
    ElMessage.error('获取项目经理列表失败');
  });
};

// 项目详情相关
const detailDialogVisible = ref(false)
const currentProject = ref(null)
const projectWorkers = ref([])
const projectTasks = ref([])

// 工人分配相关
const workerDialogVisible = ref(false)
const workerSearch = ref('')
const availableWorkers = ref([])
const assignedWorkers = ref([])
const originalAssignedWorkers = ref([])

const handleDateRangeChange = (val) => {
  if (val) {
    queryParams.startTime = val[0]
    queryParams.endTime = val[1]
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }
}

// 获取项目列表
const getList = () => {
  loading.value = true

  const params = {
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    name: queryParams.name,
    status: queryParams.status,
    startTime: queryParams.startTime,
    endTime: queryParams.endTime
  }

  getProjectList(params).then(res => {
    tableData.value = res.data.list
    total.value = res.data.total
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

// 查询
const handleQuery = () => {
  pageNo.value = 1
  getList()
}

// 重置查询
const resetQuery = () => {
  queryParams.name = ''
  queryParams.status = ''
  queryParams.startTime = ''
  queryParams.endTime = ''
  dateRange.value = []
  handleQuery()
}

// 行点击事件
const handleRowClick = (row) => {
  selectedRow.value = row
}

// 添加项目
const handleAdd = () => {
  // 确保有项目经理数据
  if (managers.value.length === 0) {
    getManagersList();
  }
  
  dialogType.value = 'add'
  formData.id = null
  formData.name = ''
  formData.code = ''
  formData.startDate = ''
  formData.endDate = ''
  formData.location = ''
  formData.managerId = ''
  formData.status = '1'
  formData.progress = 0
  formData.description = ''
  dialogVisible.value = true
}

// 修改项目
const handleModify = () => {
  if (!selectedRow.value) {
    ElMessage.warning('请先选择一条记录')
    return
  }
  
  // 确保有项目经理数据
  if (managers.value.length === 0) {
    getManagersList();
  }
  
  dialogType.value = 'edit'
  const row = selectedRow.value
  formData.id = row.id
  formData.name = row.name
  formData.code = row.code
  formData.startDate = row.startDate
  formData.endDate = row.endDate
  formData.location = row.location
  formData.managerId = row.managerId
  formData.status = row.status
  formData.progress = row.progress
  formData.description = row.description
  dialogVisible.value = true
}

// 删除项目
const handleDelete = () => {
  if (!selectedRow.value) {
    ElMessage.warning('请先选择一条记录')
    return
  }

  ElMessageBox.confirm('确认删除该项目吗？删除后将无法恢复！', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteProject(selectedRow.value.id).then(() => {
      ElMessage.success('删除成功')
      getList()
      selectedRow.value = null
    })
  }).catch(() => {})
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      if (formData.endDate < formData.startDate) {
        ElMessage.error('计划结束日期必须晚于开始日期')
        return
      }

      if (dialogType.value === 'add') {
        addProject(formData).then(() => {
          ElMessage.success('添加成功')
          dialogVisible.value = false
          getList()
        })
      } else {
        updateProject(formData).then(() => {
          ElMessage.success('修改成功')
          dialogVisible.value = false
          getList()
        })
      }
    }
  })
}

// 项目详情
const handleDetail = (row) => {
  // 确保有项目经理数据
  if (managers.value.length === 0) {
    getManagersList();
  }
  
  currentProject.value = row
  // 获取项目相关的工人和任务数据
  getProjectWorkers(row.id)
  getProjectTasks(row.id)
  detailDialogVisible.value = true
}

// 获取项目工人
const getProjectWorkers = (projectId) => {
  getProjectMembers(projectId).then(res => {
    projectWorkers.value = res.data
  })
}

// 获取项目任务
const getProjectTasks = (projectId) => {
  // 使用任务API查询指定项目的任务列表
  getTaskList({
    pageNo: 1,
    pageSize: 10,
    projectId: projectId
  }).then(res => {
    projectTasks.value = res.data.list;
  }).catch(() => {
    ElMessage.error('获取项目任务失败');
  });
}

// 分配工人
const handleAssignWorkers = (row) => {
  if (row.status !== '1') {
    ElMessage.warning('只有未开始状态的项目才能分配工人');
    return;
  }
  
  currentProject.value = row
  // 初始化已分配工人和可用工人
  getAvailableWorkers()
  getAssignedWorkers(row.id)
  workerDialogVisible.value = true
}

// 获取可用工人
const getAvailableWorkers = () => {
  // 从接口获取角色为4的用户列表（工人）
  getUsersByRole(4).then(res => {
    // 获取当前已分配的工人ID
    let assignedIds = assignedWorkers.value.map(worker => worker.id);
    
    // 过滤出未分配到当前项目的工人
    availableWorkers.value = res.data.filter(worker => !assignedIds.includes(worker.id)).map(user => {
      return {
        id: user.id,
        name: user.name,
        // 以下字段可能需要从后端补充，或者前端默认设置
        position: user.position || '普通工人',
        department: user.department || '施工部'
      };
    });
  }).catch(() => {
    ElMessage.error('获取可用工人列表失败');
  });
}

// 获取已分配工人
const getAssignedWorkers = (projectId) => {
  getProjectMembers(projectId).then(res => {
    assignedWorkers.value = res.data
    // 保存原始分配，用于取消时恢复
    originalAssignedWorkers.value = JSON.parse(JSON.stringify(assignedWorkers.value))
  })
}

// 搜索过滤工人
const filterWorkers = () => {
  if (!workerSearch.value) {
    getAvailableWorkers()
    return
  }

  const search = workerSearch.value.toLowerCase()
  // 过滤包含搜索词的工人
  availableWorkers.value = availableWorkers.value.filter(worker =>
    worker.name.toLowerCase().includes(search) ||
    worker.position.toLowerCase().includes(search) ||
    worker.department.toLowerCase().includes(search)
  )
}

// 选择工人
const selectWorker = (row) => {
  // 可以根据需要添加选择逻辑
}

// 添加工人到项目
const addWorker = (worker) => {
  // 检查是否已经添加过
  const exists = assignedWorkers.value.some(item => item.id === worker.id)
  if (exists) {
    ElMessage.warning(`${worker.name}已经添加到项目中`)
    return
  }

  // 添加到已分配列表
  assignedWorkers.value.push(worker)

  // 从可用列表移除
  const index = availableWorkers.value.findIndex(item => item.id === worker.id)
  if (index !== -1) {
    availableWorkers.value.splice(index, 1)
  }
}

// 从项目移除工人
const removeWorker = (worker) => {
  // 从已分配列表移除
  const index = assignedWorkers.value.findIndex(item => item.id === worker.id)
  if (index !== -1) {
    assignedWorkers.value.splice(index, 1)
  }

  // 添加到可用列表
  availableWorkers.value.push(worker)
}

// 保存工人分配
const saveWorkerAssignment = () => {
  const data = {
    projectId: currentProject.value.id,
    memberIds: assignedWorkers.value.map(item => item.id)
  }

  assignProjectMembers(data).then(() => {
    ElMessage.success(`已成功为项目"${currentProject.value.name}"分配${assignedWorkers.value.length}名工人`)
    workerDialogVisible.value = false

    // 获取项目列表以更新状态
    getList();
    
    // 手动更新项目进度
    updateProjectProgress(currentProject.value.id).then(() => {
      // 更新项目工人列表（如果详情页面打开的话）
      if (detailDialogVisible.value) {
        getProjectWorkers(currentProject.value.id);
        getProjectTasks(currentProject.value.id);
      }
    }).catch(() => {
      ElMessage.warning('项目进度更新失败，请手动刷新');
    });
  }).catch((error) => {
    ElMessage.error('分配工人失败: ' + (error.message || '未知错误'));
  });
}

// 任务管理
const handleTasks = (row) => {
  // 将当前项目ID存入sessionStorage
  sessionStorage.setItem('currentProjectId', row.id);
  sessionStorage.setItem('currentProjectName', row.name);

  // 导航到任务列表页面，并携带项目ID参数
  router.push({
    path: '/task/list',
    query: {
      projectId: row.id,
      projectName: row.name
    }
  });
}

// 分页大小变化
const handleSizeChange = (val) => {
  pageSize.value = val
  getList()
}

// 页码变化
const handleCurrentChange = (val) => {
  pageNo.value = val
  getList()
}

// 获取项目经理名称
const getManagerName = (managerId) => {
  if (!managerId || !managers.value.length) return '-';
  const manager = managers.value.find(m => m.id === managerId);
  return manager ? manager.name : currentProject.value.managerName || '-';
}

// 初始化
onMounted(() => {
  getList()
  getManagersList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.toolbar-form {
  margin-left: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.project-worker-assignment {
  display: flex;
  flex-direction: column;
}

.project-info {
  margin-bottom: 15px;
}

.search-workers {
  margin-bottom: 15px;
}

.worker-assignment-container {
  display: flex;
  justify-content: space-between;
}

.available-workers, .assigned-workers {
  width: 48%;
}

.project-detail {
  padding: 0 10px;
}
</style>
