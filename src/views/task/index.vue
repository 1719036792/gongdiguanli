<template>
  <div class="app-container">
    <div class="project-info" v-if="projectId">
      <el-alert
        title="项目任务管理"
        type="info"
        :description="`当前项目：${projectName || projectId}`"
        :closable="false"
        show-icon
      />
    </div>

    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>新建任务
      </el-button>
      <el-button type="warning" @click="handleModify" :disabled="!selectedRow">
        <el-icon><Edit /></el-icon>修改任务
      </el-button>
      <el-button type="danger" @click="handleDelete" :disabled="!selectedRow">
        <el-icon><Delete /></el-icon>删除任务
      </el-button>
      <el-form inline class="toolbar-form">
        <el-form-item label="任务名称">
          <el-input v-model="queryParams.name" placeholder="请输入任务名称" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="queryParams.status" placeholder="请选择任务状态" clearable>
            <el-option label="未开始" value="1" />
            <el-option label="进行中" value="2" />
            <el-option label="已完成" value="3" />
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

    <!-- 任务列表 -->
    <el-table :data="tableData" border style="width: 100%" @row-click="handleRowClick" highlight-current-row v-loading="loading">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="name" label="任务名称" min-width="120" />
      <el-table-column prop="projectName" label="所属项目" min-width="120" />
      <el-table-column prop="assigneeName" label="负责人" width="100" />
      <el-table-column prop="priority" label="优先级" width="80">
        <template #default="scope">
          <el-tag type="danger" v-if="scope.row.priority === 'high'">高</el-tag>
          <el-tag type="warning" v-else-if="scope.row.priority === 'medium'">中</el-tag>
          <el-tag type="info" v-else>低</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startDate" label="开始日期" width="100" />
      <el-table-column prop="endDate" label="截止日期" width="100" />
      <el-table-column prop="status" label="任务状态" width="90">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '1'">未开始</el-tag>
          <el-tag type="success" v-else-if="scope.row.status === '2'">进行中</el-tag>
          <el-tag type="info" v-else-if="scope.row.status === '3'">已完成</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="完成进度" min-width="110">
        <template #default="scope">
          <el-progress :percentage="scope.row.progress" :status="scope.row.status === '3' ? 'success' : ''" />
        </template>
      </el-table-column>
      <el-table-column prop="flowStatus" label="审批状态" width="90">
        <template #default="scope">
          <el-tag v-if="scope.row.flowStatus === 'pending'">待审批</el-tag>
          <el-tag type="success" v-else-if="scope.row.flowStatus === 'approved'">已审批</el-tag>
          <el-tag type="danger" v-else-if="scope.row.flowStatus === 'rejected'">已拒绝</el-tag>
          <el-tag type="info" v-else>未提交</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button type="primary" link @click.stop="handleDetail(scope.row)">
            <el-icon><View /></el-icon>详情
          </el-button>
          <el-button type="success" link @click.stop="handleUpdateProgress(scope.row)" v-if="scope.row.status !== '3'">
            <el-icon><Edit /></el-icon>更新进度
          </el-button>
          <el-button type="warning" link @click.stop="handleSubmitFlow(scope.row)" v-if="scope.row.flowStatus === 'none' || scope.row.flowStatus === 'rejected'">
            <el-icon><Connection /></el-icon>提交审批
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

    <!-- 添加/修改任务弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新建任务' : '修改任务'"
      width="600px"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="所属项目" prop="projectId">
          <el-select v-model="formData.projectId" placeholder="请选择所属项目" style="width: 100%">
            <el-option
              v-for="item in projects"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
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
            <el-form-item label="截止日期" prop="endDate">
              <el-date-picker
                v-model="formData.endDate"
                type="date"
                placeholder="选择截止日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="负责人" prop="assigneeId">
          <el-select v-model="formData.assigneeId" placeholder="请选择负责人" style="width: 100%">
            <el-option
              v-for="item in workers"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="formData.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务状态" prop="status">
          <el-select v-model="formData.status" placeholder="请选择任务状态" style="width: 100%">
            <el-option label="未开始" value="1" />
            <el-option label="进行中" value="2" />
            <el-option label="已完成" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="完成进度" prop="progress">
          <el-slider v-model="formData.progress" :step="5" :max="100" show-input input-size="small" />
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
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

    <!-- 更新进度弹窗 -->
    <el-dialog
      v-model="progressDialogVisible"
      title="更新任务进度"
      width="500px"
    >
      <div v-if="currentTask" class="task-progress-update">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务名称">{{ currentTask.name }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentTask.assigneeName }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ currentTask.endDate }}</el-descriptions-item>
          <el-descriptions-item label="当前进度">
            <el-progress :percentage="currentTask.progress" />
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="progress-form">
          <el-form :model="progressForm" ref="progressFormRef" label-width="100px">
            <el-form-item label="最新进度" prop="progress">
              <el-slider v-model="progressForm.progress" :step="5" :max="100" show-input input-size="small" />
            </el-form-item>
            <el-form-item label="任务状态" prop="status">
              <el-select v-model="progressForm.status" placeholder="请选择任务状态" style="width: 100%">
                <el-option label="未开始" value="1" />
                <el-option label="进行中" value="2" />
                <el-option label="已完成" value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="进度描述">
              <el-input
                v-model="progressForm.comment"
                type="textarea"
                :rows="3"
                placeholder="请输入进度描述"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="progressDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProgressUpdate">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 任务审批弹窗 -->
    <el-dialog
      v-model="flowDialogVisible"
      title="提交任务审批"
      width="500px"
    >
      <div v-if="currentTask" class="task-flow-submit">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="任务名称">{{ currentTask.name }}</el-descriptions-item>
          <el-descriptions-item label="所属项目">{{ currentTask.projectName }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentTask.assigneeName }}</el-descriptions-item>
          <el-descriptions-item label="当前进度">
            <el-progress :percentage="currentTask.progress" />
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="flow-form">
          <el-form :model="flowForm" :rules="flowRules" ref="flowFormRef" label-width="100px">
            <el-form-item label="流程类型" prop="flowType">
              <el-select v-model="flowForm.flowType" placeholder="请选择流程类型" style="width: 100%">
                <el-option label="任务审批" value="task_approval" />
                <el-option label="进度确认" value="progress_confirmation" />
              </el-select>
            </el-form-item>
            <el-form-item label="审批人" prop="approverId">
              <el-select v-model="flowForm.approverId" placeholder="请选择审批人" style="width: 100%">
                <el-option
                  v-for="item in managers"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="审批说明">
              <el-input
                v-model="flowForm.comment"
                type="textarea"
                :rows="3"
                placeholder="请输入审批说明"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="flowDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitFlowForm">确认提交</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 任务详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="任务详情"
      width="700px"
    >
      <div v-if="currentTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务名称" :span="2">{{ currentTask.name }}</el-descriptions-item>
          <el-descriptions-item label="所属项目">{{ currentTask.projectName }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentTask.assigneeName }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentTask.startDate }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ currentTask.endDate }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag type="danger" v-if="currentTask.priority === 'high'">高</el-tag>
            <el-tag type="warning" v-else-if="currentTask.priority === 'medium'">中</el-tag>
            <el-tag type="info" v-else>低</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="任务状态">
            <el-tag v-if="currentTask.status === '1'">未开始</el-tag>
            <el-tag type="success" v-else-if="currentTask.status === '2'">进行中</el-tag>
            <el-tag type="info" v-else-if="currentTask.status === '3'">已完成</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="完成进度" :span="2">
            <el-progress :percentage="currentTask.progress" :status="currentTask.status === '3' ? 'success' : ''" />
          </el-descriptions-item>
          <el-descriptions-item label="审批状态">
            <el-tag v-if="currentTask.flowStatus === 'pending'">待审批</el-tag>
            <el-tag type="success" v-else-if="currentTask.flowStatus === 'approved'">已审批</el-tag>
            <el-tag type="danger" v-else-if="currentTask.flowStatus === 'rejected'">已拒绝</el-tag>
            <el-tag type="info" v-else>未提交</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="任务描述" :span="2">
            {{ currentTask.description || '暂无描述' }}
          </el-descriptions-item>
        </el-descriptions>
        
        <el-divider />
        
        <h4>进度更新记录</h4>
        <el-timeline>
          <el-timeline-item
            v-for="(activity, index) in taskActivities"
            :key="index"
            :timestamp="activity.timestamp"
            :type="activity.type"
            :color="activity.color"
          >
            {{ activity.content }}
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh, View, Connection } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 从路由参数获取项目ID和名称
const projectId = ref(route.query.projectId || '')
const projectName = ref(route.query.projectName || '')

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
  endTime: '',
  projectId: projectId.value
})
const dateRange = ref([])

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const formRef = ref(null)
const formData = reactive({
  id: null,
  name: '',
  projectId: projectId.value,
  startDate: '',
  endDate: '',
  assigneeId: '',
  priority: 'medium',
  status: '1',
  progress: 0,
  description: '',
  flowStatus: 'none'
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  projectId: [{ required: true, message: '请选择所属项目', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择截止日期', trigger: 'change' }],
  assigneeId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  status: [{ required: true, message: '请选择任务状态', trigger: 'change' }]
}

// 项目列表
const projects = ref([
  { id: '1', name: '城市中心广场施工项目' },
  { id: '2', name: '江滨路桥梁维修工程' },
  { id: '3', name: '新城区住宅小区建设' }
])

// 工人列表
const workers = ref([
  { id: '1', name: '张三' },
  { id: '2', name: '李四' },
  { id: '3', name: '王五' },
  { id: '4', name: '赵六' },
  { id: '5', name: '钱七' }
])

// 经理列表
const managers = ref([
  { id: '1', name: '张经理' },
  { id: '2', name: '李经理' },
  { id: '3', name: '王经理' }
])

// 任务详情相关
const detailDialogVisible = ref(false)
const currentTask = ref(null)
const taskActivities = ref([])

// 更新进度相关
const progressDialogVisible = ref(false)
const progressFormRef = ref(null)
const progressForm = reactive({
  progress: 0,
  status: '1',
  comment: ''
})

// 工作流相关
const flowDialogVisible = ref(false)
const flowFormRef = ref(null)
const flowForm = reactive({
  flowType: 'task_approval',
  approverId: '',
  comment: ''
})

// 流程验证规则
const flowRules = {
  flowType: [{ required: true, message: '请选择流程类型', trigger: 'change' }],
  approverId: [{ required: true, message: '请选择审批人', trigger: 'change' }]
}

watch(() => projectId.value, (newVal) => {
  queryParams.projectId = newVal
  handleQuery()
})

const handleDateRangeChange = (val) => {
  if (val) {
    queryParams.startTime = val[0]
    queryParams.endTime = val[1]
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }
}

// 获取任务列表
const getList = () => {
  loading.value = true
  
  // 这里使用模拟数据
  setTimeout(() => {
    const allTasks = [
      {
        id: '1',
        name: '基础施工',
        projectId: '1',
        projectName: '城市中心广场施工项目',
        assigneeId: '1',
        assigneeName: '张三',
        priority: 'high',
        startDate: '2023-03-05',
        endDate: '2023-04-15',
        status: '3',
        progress: 100,
        flowStatus: 'approved',
        description: '完成广场基础部分的施工，包括地基处理、排水系统安装等。'
      },
      {
        id: '2',
        name: '主体结构施工',
        projectId: '1',
        projectName: '城市中心广场施工项目',
        assigneeId: '2',
        assigneeName: '李四',
        priority: 'medium',
        startDate: '2023-04-16',
        endDate: '2023-06-30',
        status: '2',
        progress: 65,
        flowStatus: 'pending',
        description: '完成广场主体结构的施工，包括雕塑底座、休息区架构等。'
      },
      {
        id: '3',
        name: '桥面铺装更换',
        projectId: '2',
        projectName: '江滨路桥梁维修工程',
        assigneeId: '3',
        assigneeName: '王五',
        priority: 'high',
        startDate: '2023-04-20',
        endDate: '2023-05-30',
        status: '2',
        progress: 40,
        flowStatus: 'approved',
        description: '更换桥面铺装材料，确保平整度和防滑性能。'
      },
      {
        id: '4',
        name: '防撞护栏维修',
        projectId: '2',
        projectName: '江滨路桥梁维修工程',
        assigneeId: '4',
        assigneeName: '赵六',
        priority: 'medium',
        startDate: '2023-05-15',
        endDate: '2023-06-15',
        status: '1',
        progress: 0,
        flowStatus: 'none',
        description: '修复或更换损坏的防撞护栏，确保安全性。'
      },
      {
        id: '5',
        name: '地基勘测',
        projectId: '3',
        projectName: '新城区住宅小区建设',
        assigneeId: '5',
        assigneeName: '钱七',
        priority: 'high',
        startDate: '2023-05-01',
        endDate: '2023-05-15',
        status: '1',
        progress: 0,
        flowStatus: 'none',
        description: '对建设地块进行地基勘测，评估土壤条件和地下水位情况。'
      }
    ]
    
    // 根据项目ID筛选
    let filteredData = allTasks
    if (projectId.value) {
      filteredData = allTasks.filter(task => task.projectId === projectId.value)
    }
    
    // 根据查询条件筛选
    if (queryParams.name) {
      filteredData = filteredData.filter(task => task.name.includes(queryParams.name))
    }
    if (queryParams.status) {
      filteredData = filteredData.filter(task => task.status === queryParams.status)
    }
    if (queryParams.startTime && queryParams.endTime) {
      filteredData = filteredData.filter(task => {
        const createTime = new Date(task.startDate).getTime()
        const start = new Date(queryParams.startTime).getTime()
        const end = new Date(queryParams.endTime).getTime() + 86400000 // 包含结束当天
        return createTime >= start && createTime <= end
      })
    }
    
    tableData.value = filteredData
    total.value = filteredData.length
    loading.value = false
  }, 300)
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

// 添加任务
const handleAdd = () => {
  dialogType.value = 'add'
  formData.id = null
  formData.name = ''
  formData.projectId = projectId.value || ''
  formData.startDate = ''
  formData.endDate = ''
  formData.assigneeId = ''
  formData.priority = 'medium'
  formData.status = '1'
  formData.progress = 0
  formData.description = ''
  formData.flowStatus = 'none'
  dialogVisible.value = true
}

// 修改任务
const handleModify = () => {
  if (!selectedRow.value) {
    ElMessage.warning('请先选择一条记录')
    return
  }
  dialogType.value = 'edit'
  const row = selectedRow.value
  formData.id = row.id
  formData.name = row.name
  formData.projectId = row.projectId
  formData.startDate = row.startDate
  formData.endDate = row.endDate
  formData.assigneeId = row.assigneeId
  formData.priority = row.priority
  formData.status = row.status
  formData.progress = row.progress
  formData.description = row.description
  formData.flowStatus = row.flowStatus
  dialogVisible.value = true
}

// 删除任务
const handleDelete = () => {
  if (!selectedRow.value) {
    ElMessage.warning('请先选择一条记录')
    return
  }
  
  ElMessageBox.confirm('确认删除该任务吗？删除后将无法恢复！', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 模拟删除成功
    const index = tableData.value.findIndex(item => item.id === selectedRow.value.id)
    if (index !== -1) {
      tableData.value.splice(index, 1)
      total.value--
      ElMessage.success('删除成功')
      selectedRow.value = null
    }
  }).catch(() => {})
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      if (formData.endDate < formData.startDate) {
        ElMessage.error('截止日期必须晚于开始日期')
        return
      }
      
      if (dialogType.value === 'add') {
        // 模拟添加成功
        const projectObj = projects.value.find(item => item.id === formData.projectId)
        const assigneeObj = workers.value.find(item => item.id === formData.assigneeId)
        const newItem = {
          id: Date.now().toString(),
          name: formData.name,
          projectId: formData.projectId,
          projectName: projectObj ? projectObj.name : '',
          assigneeId: formData.assigneeId,
          assigneeName: assigneeObj ? assigneeObj.name : '',
          priority: formData.priority,
          startDate: formData.startDate,
          endDate: formData.endDate,
          status: formData.status,
          progress: formData.progress,
          description: formData.description,
          flowStatus: 'none'
        }
        tableData.value.unshift(newItem)
        total.value++
        ElMessage.success('添加成功')
      } else {
        // 模拟修改成功
        const index = tableData.value.findIndex(item => item.id === formData.id)
        if (index !== -1) {
          const projectObj = projects.value.find(item => item.id === formData.projectId)
          const assigneeObj = workers.value.find(item => item.id === formData.assigneeId)
          const updatedItem = {
            ...tableData.value[index],
            name: formData.name,
            projectId: formData.projectId,
            projectName: projectObj ? projectObj.name : '',
            assigneeId: formData.assigneeId,
            assigneeName: assigneeObj ? assigneeObj.name : '',
            priority: formData.priority,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status,
            progress: formData.progress,
            description: formData.description
          }
          tableData.value.splice(index, 1, updatedItem)
          if (selectedRow.value && selectedRow.value.id === formData.id) {
            selectedRow.value = updatedItem
          }
          ElMessage.success('修改成功')
        }
      }
      dialogVisible.value = false
    }
  })
}

// 任务详情
const handleDetail = (row) => {
  currentTask.value = row
  // 获取任务相关的活动记录
  getTaskActivities(row.id)
  detailDialogVisible.value = true
}

// 获取任务活动记录
const getTaskActivities = (taskId) => {
  // 模拟获取任务活动记录
  taskActivities.value = [
    {
      timestamp: '2023-03-05 09:00',
      content: '任务创建',
      type: 'primary',
      color: '#409EFF'
    },
    {
      timestamp: '2023-03-08 14:30',
      content: '提交审批',
      type: 'primary',
      color: '#409EFF'
    },
    {
      timestamp: '2023-03-09 10:15',
      content: '审批通过',
      type: 'success',
      color: '#67C23A'
    },
    {
      timestamp: '2023-03-15 16:45',
      content: '进度更新: 25%',
      type: 'info',
      color: '#909399'
    },
    {
      timestamp: '2023-03-30 11:20',
      content: '进度更新: 50%',
      type: 'info',
      color: '#909399'
    },
    {
      timestamp: '2023-04-10 15:00',
      content: '进度更新: 75%',
      type: 'info',
      color: '#909399'
    },
    {
      timestamp: '2023-04-15 09:30',
      content: '任务完成: 100%',
      type: 'success',
      color: '#67C23A'
    }
  ]
  
  // 根据任务状态筛选活动记录
  if (currentTask.value.status === '1') {
    taskActivities.value = taskActivities.value.slice(0, 3)
  } else if (currentTask.value.status === '2') {
    if (currentTask.value.progress < 50) {
      taskActivities.value = taskActivities.value.slice(0, 4)
    } else {
      taskActivities.value = taskActivities.value.slice(0, 5)
    }
  }
}

// 更新进度
const handleUpdateProgress = (row) => {
  currentTask.value = row
  progressForm.progress = row.progress
  progressForm.status = row.status
  progressForm.comment = ''
  progressDialogVisible.value = true
}

// 提交进度更新
const submitProgressUpdate = () => {
  if (progressForm.progress > currentTask.value.progress && progressForm.status < currentTask.value.status) {
    ElMessage.warning('任务状态与进度不一致，请检查')
    return
  }
  
  // 模拟更新成功
  const index = tableData.value.findIndex(item => item.id === currentTask.value.id)
  if (index !== -1) {
    const updatedTask = {
      ...tableData.value[index],
      progress: progressForm.progress,
      status: progressForm.status
    }
    tableData.value.splice(index, 1, updatedTask)
    if (selectedRow.value && selectedRow.value.id === currentTask.value.id) {
      selectedRow.value = updatedTask
    }
    ElMessage.success('进度更新成功')
    
    // 更新当前任务，以便在详情页面显示最新状态
    currentTask.value = updatedTask
    
    // 添加活动记录
    const timestamp = new Date().toLocaleString()
    const activity = {
      timestamp,
      content: `进度更新: ${progressForm.progress}%${progressForm.comment ? ' - ' + progressForm.comment : ''}`,
      type: 'info',
      color: '#909399'
    }
    
    if (progressForm.status === '3' && progressForm.progress === 100) {
      activity.content = `任务完成: 100%${progressForm.comment ? ' - ' + progressForm.comment : ''}`
      activity.type = 'success'
      activity.color = '#67C23A'
    }
    
    taskActivities.value.push(activity)
  }
  progressDialogVisible.value = false
}

// 提交审批
const handleSubmitFlow = (row) => {
  currentTask.value = row
  flowForm.flowType = 'task_approval'
  flowForm.approverId = ''
  flowForm.comment = ''
  flowDialogVisible.value = true
}

// 提交审批表单
const submitFlowForm = () => {
  flowFormRef.value.validate((valid) => {
    if (valid) {
      // 模拟提交成功
      const index = tableData.value.findIndex(item => item.id === currentTask.value.id)
      if (index !== -1) {
        const updatedTask = {
          ...tableData.value[index],
          flowStatus: 'pending'
        }
        tableData.value.splice(index, 1, updatedTask)
        if (selectedRow.value && selectedRow.value.id === currentTask.value.id) {
          selectedRow.value = updatedTask
        }
        ElMessage.success('提交审批成功，等待审批')
        
        // 更新当前任务，以便在详情页面显示最新状态
        currentTask.value = updatedTask
        
        // 添加活动记录
        const timestamp = new Date().toLocaleString()
        taskActivities.value.push({
          timestamp,
          content: `提交${flowForm.flowType === 'task_approval' ? '任务审批' : '进度确认'}${flowForm.comment ? ' - ' + flowForm.comment : ''}`,
          type: 'primary',
          color: '#409EFF'
        })
      }
      flowDialogVisible.value = false
    }
  })
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

// 初始化
onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.project-info {
  margin-bottom: 20px;
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

.task-detail {
  padding: 0 10px;
}

.task-progress-update, .task-flow-submit {
  padding: 0 10px;
}

.progress-form, .flow-form {
  margin-top: 20px;
}
</style> 