<template>
  <div class="app-container">
    <div class="toolbar">
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

    <!-- 我的任务列表 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="待办任务" name="todo">
        <el-table :data="taskData" border style="width: 100%" highlight-current-row v-loading="taskLoading">
          <el-table-column prop="id" label="任务编号" width="80" />
          <el-table-column prop="name" label="任务名称" min-width="150" />
          <el-table-column prop="projectName" label="所属项目" width="150" />
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
          <el-table-column prop="progress" label="进度" width="120">
            <template #default="scope">
              <el-progress :percentage="scope.row.progress" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="250">
            <template #default="scope">
              <el-button type="primary" link @click="handleStart(scope.row)" v-if="scope.row.status === '1'">
                <el-icon><VideoPlay /></el-icon>开始任务
              </el-button>
              <el-button type="success" link @click="handleUpdateProgress(scope.row)" v-if="scope.row.status === '2'">
                <el-icon><Edit /></el-icon>更新进度
              </el-button>
              <el-button type="warning" link @click="handleComplete(scope.row)" v-if="scope.row.status === '2' && scope.row.progress === 100">
                <el-icon><Check /></el-icon>完成任务
              </el-button>
              <el-button type="info" link @click="handleTaskDetail(scope.row)">
                <el-icon><View /></el-icon>详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      
      <el-tab-pane label="已完成" name="completed">
        <el-table :data="completedData" border style="width: 100%" highlight-current-row v-loading="taskLoading">
          <el-table-column prop="id" label="任务编号" width="80" />
          <el-table-column prop="name" label="任务名称" min-width="150" />
          <el-table-column prop="projectName" label="所属项目" width="150" />
          <el-table-column prop="priority" label="优先级" width="80">
            <template #default="scope">
              <el-tag v-if="scope.row.priority === '1'" type="info">低</el-tag>
              <el-tag v-else-if="scope.row.priority === '2'" type="success">中</el-tag>
              <el-tag v-else-if="scope.row.priority === '3'" type="warning">高</el-tag>
              <el-tag v-else-if="scope.row.priority === '4'" type="danger">紧急</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="startDate" label="开始日期" width="100" />
          <el-table-column prop="endDate" label="截止日期" width="100" />
          <el-table-column prop="completedDate" label="完成日期" width="100" />
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button type="info" link @click="handleTaskDetail(scope.row)">
                <el-icon><View /></el-icon>详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="taskPageNo"
        v-model:page-size="taskPageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="activeTab === 'todo' ? taskTotal : completedTotal"
        @size-change="handleTaskSizeChange"
        @current-change="handleTaskCurrentChange"
      />
    </div>

    <!-- 更新进度弹窗 -->
    <el-dialog
      v-model="progressDialogVisible"
      title="更新任务进度"
      width="550px"
    >
      <div v-if="currentTask" class="progress-update">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="任务名称">{{ currentTask.name }}</el-descriptions-item>
          <el-descriptions-item label="所属项目">{{ currentTask.projectName }}</el-descriptions-item>
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
          <el-descriptions-item label="完成日期" v-if="currentTask.completedDate">{{ currentTask.completedDate }}</el-descriptions-item>
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
import { VideoPlay, Edit, Check, View, Search, Refresh } from '@element-plus/icons-vue'
import { getMyTaskList, updateTaskProgress } from '../../../api/task.js'

export default {
  data() {
    return {
      activeTab: 'todo',
      taskQueryParams: {
        name: '',
        status: '',
      },
      taskData: [],
      completedData: [],
      taskLoading: false,
      taskPageNo: 1,
      taskPageSize: 10,
      taskTotal: 0,
      completedTotal: 0,
      currentTask: null,
      progressDialogVisible: false,
      progressForm: {
        taskId: null,
        progress: 0,
        status: '2',
        comment: '',
      },
      progressRules: {
        progress: [{ required: true, message: '请设置当前进度', trigger: 'change' }],
        status: [{ required: true, message: '请选择状态', trigger: 'change' }],
      },
      progressFormRef: null,
      detailDialogVisible: false,
      projects: [
        { id: '1', name: '高速公路建设项目' },
        { id: '2', name: '城市地铁工程' },
        { id: '3', name: '商业中心建设' }
      ]
    }
  },
  mounted() {
    this.fetchMyTaskList();
  },
  methods: {
    // 获取我的任务列表
    fetchMyTaskList() {
      this.taskLoading = true;
      
      const params = {
        pageNo: this.taskPageNo,
        pageSize: this.taskPageSize,
        name: this.taskQueryParams.name,
        status: this.activeTab === 'todo' ? this.taskQueryParams.status : '3'  // 已完成标签固定筛选已完成状态
      };
      
      getMyTaskList(params).then(res => {
        if (this.activeTab === 'todo') {
          this.taskData = res.data.list.filter(task => task.status !== '3'); // 过滤掉已完成的任务
          this.taskTotal = this.taskData.length;
        } else {
          this.completedData = res.data.list.filter(task => task.status === '3'); // 只显示已完成的任务
          this.completedTotal = this.completedData.length;
        }
        this.taskLoading = false;
      }).catch(() => {
        this.taskLoading = false;
      });
    },
    
    // 查询任务
    handleTaskQuery() {
      this.taskPageNo = 1;
      this.fetchMyTaskList();
    },
    
    // 重置查询
    resetTaskQuery() {
      this.taskQueryParams.name = '';
      this.taskQueryParams.status = '';
      this.handleTaskQuery();
    },
    
    // 处理标签切换
    handleTabClick() {
      this.taskPageNo = 1;
      this.fetchMyTaskList();
    },
    
    // 开始任务
    handleStart(task) {
      this.$confirm('确认开始该任务？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        updateTaskProgress(task.id, 0, '2').then(() => {
          this.$message.success('任务已开始');
          this.fetchMyTaskList();
        });
      }).catch(() => {});
    },
    
    // 更新进度
    handleUpdateProgress(task) {
      this.currentTask = task;
      this.progressForm = {
        taskId: task.id,
        progress: task.progress,
        status: task.status,
        comment: '',
      };
      this.progressDialogVisible = true;
    },
    
    // 提交进度
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
            this.fetchMyTaskList();
          });
        }
      });
    },
    
    // 完成任务
    handleComplete(task) {
      this.$confirm('确认完成该任务？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'success'
      }).then(() => {
        updateTaskProgress(task.id, 100, '3').then(() => {
          this.$message.success('任务已完成');
          this.fetchMyTaskList();
        });
      }).catch(() => {});
    },
    
    // 任务详情
    handleTaskDetail(task) {
      this.currentTask = task;
      this.detailDialogVisible = true;
    },
    
    // 分页大小变化
    handleTaskSizeChange(val) {
      this.taskPageSize = val;
      this.fetchMyTaskList();
    },
    
    // 页码变化
    handleTaskCurrentChange(val) {
      this.taskPageNo = val;
      this.fetchMyTaskList();
    }
  }
};
</script>

<style scoped>
.app-container {
  padding: 20px;
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

.progress-update {
  margin-top: 10px;
}

.progress-form {
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

.el-tabs {
  margin-bottom: 20px;
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