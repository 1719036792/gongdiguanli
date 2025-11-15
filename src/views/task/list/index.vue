<template>
  <div class="app-container">
    <div class="page-header" v-if="taskQueryParams.projectId">
      <h2>{{ projectTitle }}</h2>
      <el-button size="small" @click="handleBackToProjects">
        <el-icon><Back /></el-icon>返回项目列表
      </el-button>
    </div>
    <div class="toolbar">
      <el-button type="warning" @click="handleTaskModify" :disabled="!selectedTask">
        <el-icon><Edit /></el-icon>修改任务
      </el-button>
      <el-button type="danger" @click="handleTaskDelete" :disabled="!selectedTask">
        <el-icon><Delete /></el-icon>删除任务
      </el-button>
      <el-form inline class="toolbar-form">
        <el-form-item label="任务名称">
          <el-input v-model="taskQueryParams.name" placeholder="请输入任务名称" clearable @keyup.enter="handleTaskQuery" />
        </el-form-item>
        <el-form-item label="任务状态">
          <el-select v-model="taskQueryParams.status" placeholder="请选择状态" clearable>
            <el-option label="未开始" value="1" />
            <el-option label="进行中" value="2" />
            <el-option label="已完成" value="3" />
            <el-option label="已取消" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="taskQueryParams.priority" placeholder="请选择优先级" clearable>
            <el-option label="低" value="1" />
            <el-option label="中" value="2" />
            <el-option label="高" value="3" />
            <el-option label="紧急" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleTaskQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetTaskQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 任务列表 -->
    <el-table :data="taskData" border style="width: 100%" @row-click="handleTaskRowClick" highlight-current-row v-loading="taskLoading">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="任务编号" width="80" />
      <el-table-column prop="name" label="任务名称" min-width="150" />
      <el-table-column prop="projectName" label="所属项目" width="150" />
      <el-table-column prop="assigneeName" label="负责人" width="100" />
      <el-table-column prop="priority" label="优先级" width="80">
        <template #default="scope">
          <el-tag v-if="scope.row.priority === '1'" type="info">低</el-tag>
          <el-tag v-else-if="scope.row.priority === '2'" type="success">中</el-tag>
          <el-tag v-else-if="scope.row.priority === '3'" type="warning">高</el-tag>
          <el-tag v-else-if="scope.row.priority === '4'" type="danger">紧急</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '1'">未开始</el-tag>
          <el-tag type="success" v-else-if="scope.row.status === '2'">进行中</el-tag>
          <el-tag type="info" v-else-if="scope.row.status === '3'">已完成</el-tag>
          <el-tag type="danger" v-else-if="scope.row.status === '4'">已取消</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="startDate" label="开始日期" width="100" />
      <el-table-column prop="endDate" label="截止日期" width="100" />
      <el-table-column prop="progress" label="进度" width="100">
        <template #default="scope">
          <el-progress :percentage="scope.row.progress" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="230">
        <template #default="scope">
          <el-button type="success" link @click.stop="handleUpdateProgress(scope.row)" :disabled="scope.row.status !== '2'">
            <el-icon><Edit /></el-icon>更新进度
          </el-button>
          <el-button type="info" link @click.stop="handleTaskDetail(scope.row)">
            <el-icon><View /></el-icon>详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="taskPageNo"
        v-model:page-size="taskPageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="taskTotal"
        @size-change="handleTaskSizeChange"
        @current-change="handleTaskCurrentChange"
      />
    </div>

    <!-- 任务新增/修改弹窗 -->
    <el-dialog
      v-model="taskDialogVisible"
      :title="taskDialogType === 'add' ? '新增任务' : '修改任务'"
      width="550px"
    >
      <el-form :model="taskForm" :rules="taskRules" ref="taskFormRef" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="所属项目" prop="projectId">
          <el-select v-model="taskForm.projectId" placeholder="请选择项目" style="width: 100%">
            <el-option
              v-for="project in projects"
              :key="project.id"
              :label="project.name"
              :value="project.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="assigneeId">
          <el-select v-model="taskForm.assigneeId" placeholder="请选择负责人" style="width: 100%">
            <el-option
              v-for="user in projectMembers"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="taskForm.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="低" value="1" />
            <el-option label="中" value="2" />
            <el-option label="高" value="3" />
            <el-option label="紧急" value="4" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker
                v-model="taskForm.startDate"
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
                v-model="taskForm.endDate"
                type="date"
                placeholder="选择截止日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="任务状态" prop="status">
          <el-select v-model="taskForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="未开始" value="1" />
            <el-option label="进行中" value="2" />
            <el-option label="已完成" value="3" />
            <el-option label="已取消" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述" prop="description">
          <el-input
            v-model="taskForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入任务描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="taskDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTaskForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 更新进度弹窗 -->
    <el-dialog
      v-model="progressDialogVisible"
      title="更新任务进度"
      width="550px"
    >
      <div v-if="currentTask" class="progress-update">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务名称">{{ currentTask.name }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentTask.assigneeName }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentTask.startDate }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ currentTask.endDate }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="progress-form">
          <h4>进度信息</h4>
          <el-form :model="progressForm" :rules="progressRules" ref="progressFormRef" label-width="100px">
            <el-form-item label="当前进度" prop="progress">
              <el-slider
                v-model="progressForm.progress"
                :step="5"
                show-stops
                :marks="{0:'0%', 25:'25%', 50:'50%', 75:'75%', 100:'100%'}"
              />
            </el-form-item>
            <el-form-item label="状态变更" prop="status">
              <el-select v-model="progressForm.status" placeholder="请选择状态" style="width: 100%">
                <el-option label="进行中" value="2" />
                <el-option label="已完成" value="3" :disabled="progressForm.progress < 100" />
              </el-select>
            </el-form-item>
            <el-form-item label="进度说明">
              <el-input
                v-model="progressForm.comment"
                type="textarea"
                :rows="3"
                placeholder="请输入进度说明"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="progressDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitProgress">确认更新</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 任务分配弹窗 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="任务分配"
      width="550px"
    >
      <div v-if="currentTask" class="task-assign">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务名称">{{ currentTask.name }}</el-descriptions-item>
          <el-descriptions-item label="所属项目">{{ currentTask.projectName }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentTask.startDate }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ currentTask.endDate }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="assign-form">
          <h4>分配信息</h4>
          <el-form :model="assignForm" :rules="assignRules" ref="assignFormRef" label-width="100px">
            <el-form-item label="负责人" prop="assigneeId">
              <el-select v-model="assignForm.assigneeId" placeholder="请选择负责人" style="width: 100%">
                <el-option
                  v-for="user in projectMembers"
                  :key="user.id"
                  :label="user.name"
                  :value="user.id"
                >
                  <span>{{ user.name }}</span>
                  <span style="color: #999; margin-left: 10px;">{{ user.department }}</span>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="assignForm.comment"
                type="textarea"
                :rows="3"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAssign">确认分配</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 任务详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="任务详情"
      width="650px"
    >
      <div v-if="currentTask" class="task-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务编号" width="100px">{{ currentTask.id }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ currentTask.name }}</el-descriptions-item>
          <el-descriptions-item label="所属项目">{{ currentTask.projectName }}</el-descriptions-item>
          <el-descriptions-item label="负责人">{{ currentTask.assigneeName }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag v-if="currentTask.priority === '1'" type="info">低</el-tag>
            <el-tag v-else-if="currentTask.priority === '2'" type="success">中</el-tag>
            <el-tag v-else-if="currentTask.priority === '3'" type="warning">高</el-tag>
            <el-tag v-else-if="currentTask.priority === '4'" type="danger">紧急</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag v-if="currentTask.status === '1'">未开始</el-tag>
            <el-tag type="success" v-else-if="currentTask.status === '2'">进行中</el-tag>
            <el-tag type="info" v-else-if="currentTask.status === '3'">已完成</el-tag>
            <el-tag type="danger" v-else-if="currentTask.status === '4'">已取消</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentTask.startDate }}</el-descriptions-item>
          <el-descriptions-item label="截止日期">{{ currentTask.endDate }}</el-descriptions-item>
          <el-descriptions-item label="进度">
            <el-progress :percentage="currentTask.progress" />
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentTask.createTime || '-' }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="detail-description">
          <h4>任务描述</h4>
          <p>{{ currentTask.description || '无任务描述' }}</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Search, Refresh, Plus, Edit, Delete, UserFilled, View, Back } from '@element-plus/icons-vue'
import { getTaskList, getTaskById, addTask, updateTask, deleteTask, updateTaskProgress } from '../../../api/task.js'
import { getProjectMembers } from '../../../api/project.js'

export default {
  data() {
    return {
      projectTitle: '任务管理',
      taskData: [],
      selectedTask: null,
      taskPageNo: 1,
      taskPageSize: 10,
      taskTotal: 0,
      taskLoading: false,
      taskQueryParams: {
        name: '',
        projectId: null,
        status: '',
        priority: ''
      },
      taskDialogVisible: false,
      taskDialogType: 'add',
      taskFormRef: null,
      taskForm: {
        id: null,
        name: '',
        projectId: '',
        assigneeId: '',
        priority: '',
        status: '1',
        startDate: '',
        endDate: '',
        progress: 0,
        description: ''
      },
      taskRules: {
        name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
        projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
        assigneeId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
        priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
        startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
        endDate: [{ required: true, message: '请选择截止日期', trigger: 'change' }]
      },
      progressDialogVisible: false,
      progressFormRef: null,
      progressForm: {
        taskId: null,
        progress: 0,
        status: '2',
        description: ''
      },
      progressRules: {
        progress: [{ required: true, message: '请设置进度', trigger: 'change' }],
        status: [{ required: true, message: '请选择状态', trigger: 'change' }]
      },
      projects: [
        { id: '1', name: '高速公路建设项目' },
        { id: '2', name: '城市地铁工程' },
        { id: '3', name: '商业中心建设' }
      ],
      projectMembers: [], // 当前项目的成员列表
      detailDialogVisible: false,
      currentTask: null,
      assignDialogVisible: false,
      assignForm: {
        taskId: null,
        assigneeId: '',
        comment: '',
      },
      assignRules: {
        assigneeId: [{ required: true, message: '请选择负责人', trigger: 'change' }],
      },
      assignFormRef: null
    }
  },
  created() {
    // 从查询参数中获取项目信息
    const { projectId, projectName } = this.$route.query
    if (projectId) {
      this.taskQueryParams.projectId = projectId
      this.projectTitle = `项目任务管理: ${projectName || projectId}`
      // 获取项目成员列表
      this.getProjectMembers(projectId)
    }
    
    // 初始加载任务列表
    this.fetchTaskList()
  },
  methods: {
    // 获取项目成员列表
    getProjectMembers(projectId) {
      getProjectMembers(projectId).then(res => {
        this.projectMembers = res.data;
      });
    },

    // 获取任务列表
    fetchTaskList() {
      this.taskLoading = true;
      
      const params = {
        pageNo: this.taskPageNo,
        pageSize: this.taskPageSize,
        name: this.taskQueryParams.name,
        projectId: this.taskQueryParams.projectId,
        status: this.taskQueryParams.status,
        priority: this.taskQueryParams.priority
      }
      
      getTaskList(params).then(res => {
        this.taskData = res.data.list;
        this.taskTotal = res.data.total;
        this.taskLoading = false;
      }).catch(() => {
        this.taskLoading = false;
      });
    },
    
    // 查询任务
    handleTaskQuery() {
      this.taskPageNo = 1;
      this.fetchTaskList();
    },
    
    // 重置查询
    resetTaskQuery() {
      if (this.taskQueryParams.projectId) {
        // 如果是项目专属页面，只重置项目ID以外的参数
        const projectId = this.taskQueryParams.projectId;
        this.taskQueryParams = {
          name: '',
          projectId: projectId,
          status: '',
          priority: ''
        };
      } else {
        this.taskQueryParams = {
          name: '',
          projectId: null,
          status: '',
          priority: ''
        };
      }
      this.handleTaskQuery();
    },
    
    // 处理行点击事件
    handleTaskRowClick(row) {
      this.selectedTask = row;
    },
    
    // 修改任务
    handleTaskModify() {
      if (!this.selectedTask) {
        this.$message.warning('请先选择一条任务');
        return;
      }
      
      this.taskDialogType = 'edit';
      this.taskForm = { ...this.selectedTask };
      this.taskDialogVisible = true;
    },
    
    // 删除任务
    handleTaskDelete() {
      if (!this.selectedTask) {
        this.$message.warning('请先选择一条任务');
        return;
      }
      
      this.$confirm('确认删除该任务吗？删除后将无法恢复！', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteTask(this.selectedTask.id).then(() => {
          this.$message.success('删除成功');
          this.fetchTaskList();
          this.selectedTask = null;
        });
      }).catch(() => {});
    },
    
    // 提交任务表单
    submitTaskForm() {
      this.$refs.taskFormRef.validate((valid) => {
        if (valid) {
          if (this.taskForm.endDate < this.taskForm.startDate) {
            this.$message.error('截止日期必须晚于开始日期');
            return;
          }
          
          updateTask(this.taskForm).then(() => {
            this.$message.success('修改成功');
            this.taskDialogVisible = false;
            this.fetchTaskList();
          });
        }
      });
    },
    
    // 更新进度
    handleUpdateProgress(row) {
      this.currentTask = row;
      this.progressForm = {
        taskId: row.id,
        progress: row.progress,
        status: row.status,
        description: ''
      };
      this.progressDialogVisible = true;
    },
    
    // 提交进度更新
    submitProgress() {
      this.$refs.progressFormRef.validate((valid) => {
        if (valid) {
          updateTaskProgress(
            this.progressForm.taskId,
            this.progressForm.progress,
            this.progressForm.status
          ).then(() => {
            this.$message.success('进度更新成功');
            this.progressDialogVisible = false;
            this.fetchTaskList();
          });
        }
      });
    },
    
    // 查看任务详情
    handleTaskDetail(row) {
      this.currentTask = row;
      this.detailDialogVisible = true;
    },
    
    // 返回项目列表
    handleBackToProjects() {
      this.$router.push('/project');
    },
    
    // 分页大小变化
    handleTaskSizeChange(val) {
      this.taskPageSize = val;
      this.fetchTaskList();
    },
    
    // 页码变化
    handleTaskCurrentChange(val) {
      this.taskPageNo = val;
      this.fetchTaskList();
    },
    
    // 提交分配
    submitAssign() {
      this.$refs.assignFormRef.validate((valid) => {
        if (valid) {
          // 模拟提交操作
          this.$message.success('任务分配成功');
          this.assignDialogVisible = false;
          this.fetchTaskList();
        }
      });
    }
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.toolbar {
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.toolbar-form {
  margin-left: auto;
}

.pagination-container {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.progress-update,
.task-assign {
  margin-top: 10px;
}

.progress-form,
.assign-form {
  margin-top: 20px;
}

h4 {
  margin: 10px 0;
  font-weight: 500;
  color: #606266;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.task-detail {
  margin-top: 10px;
}

.detail-description {
  margin-top: 20px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
}
</style> 