<template>
  <div class="app-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd" v-if="roleId === '1'">
        <el-icon><Plus /></el-icon>发布公告
      </el-button>
      <el-button type="warning" @click="handleModify" :disabled="!selectedRow" v-if="roleId === '1'">
        <el-icon><Edit /></el-icon>修改公告
      </el-button>
      <el-button type="danger" @click="handleDelete" :disabled="!selectedRow" v-if="roleId === '1'">
        <el-icon><Delete /></el-icon>删除公告
      </el-button>
      <el-form inline class="toolbar-form">
        <el-form-item label="公告标题">
          <el-input v-model="queryParams.title" placeholder="请输入公告标题" clearable @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="发布状态">
          <el-select v-model="queryParams.status" placeholder="请选择发布状态" clearable>
            <el-option label="已发布" value="1" />
            <el-option label="未发布" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="发布时间">
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

    <!-- 公告列表 -->
    <el-table :data="tableData" border style="width: 100%" @row-click="handleRowClick" highlight-current-row v-loading="loading">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="title" label="公告标题" />
      <el-table-column prop="type" label="公告类型">
        <template #default="scope">
          <el-tag v-if="scope.row.type === '1'">安全提示</el-tag>
          <el-tag type="success" v-else-if="scope.row.type === '2'">项目进展</el-tag>
          <el-tag type="warning" v-else-if="scope.row.type === '3'">会议通知</el-tag>
          <el-tag type="info" v-else>其他</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="发布状态">
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.status === '1'">已发布</el-tag>
          <el-tag type="info" v-else>未发布</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createBy" label="发布人" />
      <el-table-column prop="publishTime" label="发布时间" />
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button type="primary" link @click.stop="handleView(scope.row)">
            <el-icon><View /></el-icon>查看
          </el-button>
          <el-button type="success" link @click.stop="handlePublish(scope.row)" v-if="scope.row.status === '0' && roleId === '1'">
            <el-icon><Check /></el-icon>发布
          </el-button>
          <el-button type="warning" link @click.stop="handleUnpublish(scope.row)" v-else-if="roleId === '1'">
            <el-icon><Close /></el-icon>撤回
          </el-button>
          <el-button type="danger" link @click.stop="handleDelete(scope.row)" v-if="roleId === '1'">
            <el-icon><Delete /></el-icon>删除
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

    <!-- 添加/修改公告弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '发布公告' : '修改公告'"
      width="650px"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择公告类型" style="width: 100%">
            <el-option label="安全提示" value="1" />
            <el-option label="项目进展" value="2" />
            <el-option label="会议通知" value="3" />
            <el-option label="其他" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="接收部门">
          <el-cascader
            v-model="formData.departments"
            :options="departmentOptions"
            :props="{ multiple: true, checkStrictly: true }"
            placeholder="请选择接收部门"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input
            v-model="formData.content"
            type="textarea"
            :rows="8"
            placeholder="请输入公告内容"
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

    <!-- 查看公告弹窗 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="公告详情"
      width="650px"
    >
      <div v-if="currentAnnouncement" class="announcement-detail">
        <h2 class="announcement-title">{{ currentAnnouncement.title }}</h2>
        <div class="announcement-info">
          <span>发布人: {{ currentAnnouncement.createBy }}</span>
          <span>发布时间: {{ currentAnnouncement.publishTime }}</span>
          <span>公告类型: 
            <el-tag v-if="currentAnnouncement.type === '1'" size="small">安全提示</el-tag>
            <el-tag v-else-if="currentAnnouncement.type === '2'" type="success" size="small">项目进展</el-tag>
            <el-tag v-else-if="currentAnnouncement.type === '3'" type="warning" size="small">会议通知</el-tag>
            <el-tag v-else type="info" size="small">其他</el-tag>
          </span>
        </div>
        <div class="announcement-content">{{ currentAnnouncement.content }}</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Search, Refresh, View, Check, Close } from '@element-plus/icons-vue'
import { getAnnouncementList, getAnnouncementDetail, addAnnouncement, updateAnnouncement, deleteAnnouncement, publishAnnouncement, unpublishAnnouncement } from '../../api/announcement.js'
import { getDepartmentTree } from '../../api/department.js'

// 表格数据
const tableData = ref([])
const selectedRow = ref(null)
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)

const roleId = localStorage.getItem('roleId');

// 部门树数据
const departmentList = ref([])

// 查询参数
const queryParams = reactive({
  title: '',
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
  title: '',
  type: '',
  departments: [],
  content: '',
})

// 查看公告
const viewDialogVisible = ref(false)
const currentAnnouncement = ref(null)

// 表单验证规则
const rules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择公告类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
}

const handleDateRangeChange = (val) => {
  if (val) {
    queryParams.startTime = val[0]
    queryParams.endTime = val[1]
  } else {
    queryParams.startTime = ''
    queryParams.endTime = ''
  }
}

// 获取部门树数据
const getDepartments = () => {
  getDepartmentTree()
    .then(res => {
      if (res.code === 200) {
        departmentList.value = res.data || []
      } else {
        ElMessage.error(res.msg || '获取部门数据失败')
      }
    })
    .catch(err => {
      console.error('获取部门数据出错:', err)
      ElMessage.error('获取部门数据失败')
    })
}

// 递归处理部门数据为下拉选项
const formatDepartmentOptions = (departments) => {
  if (!departments || departments.length === 0) {
    return []
  }
  
  return departments.map(dept => {
    const option = {
      value: dept.id.toString(),
      label: dept.deptName || dept.name,
    }
    
    if (dept.children && dept.children.length > 0) {
      option.children = formatDepartmentOptions(dept.children)
    }
    
    return option
  })
}

// 计算部门选项
const departmentOptions = computed(() => {
  return formatDepartmentOptions(departmentList.value)
})

// 获取公告列表
const getList = () => {
  loading.value = true
  
  const params = {
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    ...queryParams
  }
  
  getAnnouncementList(params)
    .then(res => {
      if (res.code === 200) {
        tableData.value = res.data.list
        total.value = res.data.total
      } else {
        ElMessage.error(res.msg || '获取公告列表失败')
      }
    })
    .catch(err => {
      console.error('获取公告列表出错:', err)
      ElMessage.error('获取公告列表失败')
    })
    .finally(() => {
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
  queryParams.title = ''
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

// 添加公告
const handleAdd = () => {
  dialogType.value = 'add'
  formData.id = null
  formData.title = ''
  formData.type = ''
  formData.departments = []
  formData.content = ''
  dialogVisible.value = true
}

// 修改公告
const handleModify = () => {
  if (!selectedRow.value) {
    ElMessage.warning('请先选择一条记录')
    return
  }
  dialogType.value = 'edit'
  formData.id = selectedRow.value.id
  formData.title = selectedRow.value.title
  formData.type = selectedRow.value.type
  formData.departments = selectedRow.value.departments ? selectedRow.value.departments.split(',') : []
  formData.content = selectedRow.value.content
  dialogVisible.value = true
}

// 查看公告
const handleView = (row) => {
  getAnnouncementDetail(row.id)
    .then(res => {
      if (res.code === 200) {
        currentAnnouncement.value = res.data
        viewDialogVisible.value = true
      } else {
        ElMessage.error(res.msg || '获取公告详情失败')
      }
    })
    .catch(err => {
      console.error('获取公告详情出错:', err)
      ElMessage.error('获取公告详情失败')
    })
}

// 发布公告
const handlePublish = (row) => {
  ElMessageBox.confirm('确认发布该公告吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    publishAnnouncement(row.id)
      .then(res => {
        if (res.code === 200) {
          ElMessage.success('公告发布成功')
          getList()
        } else {
          ElMessage.error(res.msg || '公告发布失败')
        }
      })
      .catch(err => {
        console.error('发布公告出错:', err)
        ElMessage.error('公告发布失败')
      })
  }).catch(() => {})
}

// 撤回公告
const handleUnpublish = (row) => {
  ElMessageBox.confirm('确认撤回该公告吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    unpublishAnnouncement(row.id)
      .then(res => {
        if (res.code === 200) {
          ElMessage.success('公告已撤回')
          getList()
        } else {
          ElMessage.error(res.msg || '公告撤回失败')
        }
      })
      .catch(err => {
        console.error('撤回公告出错:', err)
        ElMessage.error('公告撤回失败')
      })
  }).catch(() => {})
}

// 删除公告
const handleDelete = (row) => {
  const targetRow = row || selectedRow.value
  if (!targetRow) {
    ElMessage.warning('请先选择一条记录')
    return
  }
  
  ElMessageBox.confirm('确认删除该公告吗？删除后将无法恢复！', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteAnnouncement(targetRow.id)
      .then(res => {
        if (res.code === 200) {
          ElMessage.success('删除成功')
          if (selectedRow.value && selectedRow.value.id === targetRow.id) {
            selectedRow.value = null
          }
          getList()
        } else {
          ElMessage.error(res.msg || '删除失败')
        }
      })
      .catch(err => {
        console.error('删除公告出错:', err)
        ElMessage.error('删除失败')
      })
  }).catch(() => {})
}

// 提交表单
const submitForm = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      // 处理部门数据
      const departmentStr = formData.departments.join(',')
      
      const submitData = {
        ...formData,
        departments: departmentStr
      }
      
      if (dialogType.value === 'add') {
        addAnnouncement(submitData)
          .then(res => {
            if (res.code === 200) {
              ElMessage.success('添加成功')
              dialogVisible.value = false
              getList()
            } else {
              ElMessage.error(res.msg || '添加失败')
            }
          })
          .catch(err => {
            console.error('添加公告出错:', err)
            ElMessage.error('添加失败')
          })
      } else {
        updateAnnouncement(submitData)
          .then(res => {
            if (res.code === 200) {
              ElMessage.success('修改成功')
              dialogVisible.value = false
              getList()
            } else {
              ElMessage.error(res.msg || '修改失败')
            }
          })
          .catch(err => {
            console.error('修改公告出错:', err)
            ElMessage.error('修改失败')
          })
      }
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
  getDepartments()
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

.announcement-detail {
  padding: 0 20px;
}

.announcement-title {
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
}

.announcement-info {
  display: flex;
  justify-content: space-between;
  color: #606266;
  margin-bottom: 20px;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 10px;
}

.announcement-content {
  white-space: pre-line;
  line-height: 1.6;
  min-height: 100px;
  margin-bottom: 20px;
}
</style> 