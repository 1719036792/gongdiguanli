<template>
  <div class="leave-apply-container">
    <div class="header">
      <h2>请假申请</h2>
    </div>

    <!-- 申请表单 -->
    <el-card class="form-container">
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="请假类型" prop="leaveType">
          <el-select v-model="formData.leaveType" placeholder="请选择请假类型" style="width: 100%">
            <el-option
              v-for="item in leaveTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="formData.startTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker
            v-model="formData.endTime"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="请假天数">
          <span>{{ leaveDays }} 天</span>
        </el-form-item>
        
        <el-form-item label="请假原因" prop="reason">
          <el-input
            v-model="formData.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入请假原因"
          />
        </el-form-item>
        
        <el-form-item label="去向">
          <el-input v-model="formData.destination" placeholder="请输入去向" />
        </el-form-item>
        
        <el-form-item label="证明材料">
          <el-upload
            class="upload-demo"
            action="#"
            :http-request="handleUpload"
            :on-preview="handlePreview"
            :on-remove="handleRemove"
            :before-upload="beforeUpload"
            :limit="3"
            :file-list="fileList"
          >
            <el-button type="primary">点击上传</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持jpg/png/pdf文件，不超过5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm">提交申请</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>


  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { submitLeaveApplication} from '../../../api/leave.js'

// 表单数据
const formRef = ref(null)
const formData = reactive({
  leaveType: '',
  startTime: '',
  endTime: '',
  reason: '',
  destination: '',
  attachments: []
})

// 表单验证规则
const rules = {
  leaveType: [{ required: true, message: '请选择请假类型', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  reason: [{ required: true, message: '请输入请假原因', trigger: 'blur' }]
}

// 请假类型选项
const leaveTypes = [
  { value: '事假', label: '事假' },
  { value: '病假', label: '病假' },
  { value: '年假', label: '年假' },
  { value: '婚假', label: '婚假' },
  { value: '产假', label: '产假' },
  { value: '丧假', label: '丧假' },
  { value: '其他', label: '其他' }
]

// 计算请假天数
const leaveDays = computed(() => {
  if (!formData.startTime || !formData.endTime) {
    return 0
  }
  
  const start = new Date(formData.startTime)
  const end = new Date(formData.endTime)
  
  if (end <= start) {
    return 0
  }
  
  const diffTime = Math.abs(end - start)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  formData.days = diffDays
  return diffDays
})

// 文件上传相关
const fileList = ref([])

const beforeUpload = (file) => {
  const isValidType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
  const isLt5M = file.size / 1024 / 1024 < 5
  
  if (!isValidType) {
    ElMessage.error('上传文件只能是 JPG/PNG/PDF 格式!')
    return false
  }
  
  if (!isLt5M) {
    ElMessage.error('上传文件大小不能超过 5MB!')
    return false
  }
  
  return true
}

const handleUpload = async (options) => {
  const { file } = options
  
  // 实际项目中应该调用上传API
  // const formData = new FormData()
  // formData.append('file', file)
  // const res = await uploadProof(formData)
  
  // 模拟上传成功
  setTimeout(() => {
    formData.attachments.push({
      name: file.name,
      url: URL.createObjectURL(file)
    })
    
    ElMessage.success('上传成功')
  }, 500)
}

const handlePreview = (file) => {
  window.open(file.url)
}

const handleRemove = (file, fileList) => {
  const index = formData.attachments.findIndex(item => item.name === file.name)
  if (index !== -1) {
    formData.attachments.splice(index, 1)
  }
}

// 提交申请
const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      if (formData.endTime <= formData.startTime) {
        ElMessage.error('结束时间必须晚于开始时间')
        return
      }
      
      try {
        // 实际项目中应该调用API
        const res = await submitLeaveApplication(formData)
        
        // 模拟提交成功
        ElMessage.success('申请提交成功')
        resetForm()
        getMyApplications()
      } catch (error) {
        console.error('提交请假申请失败', error)
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  formRef.value.resetFields()
  formData.attachments = []
  fileList.value = []
}

// 我的申请列表
const myApplications = ref([
  {
    id: 10001,
    leaveType: 1,
    leaveTypeName: '事假',
    startTime: '2023-03-10 09:00:00',
    endTime: '2023-03-12 18:00:00',
    days: 3,
    reason: '家中有事需要处理',
    destination: '老家',
    status: 0,
    statusName: '待审批',
    createTime: '2023-03-08 14:30:00',
    attachments: [
      { name: '请假证明.jpg', url: '' }
    ]
  },
  {
    id: 10002,
    leaveType: 2,
    leaveTypeName: '病假',
    startTime: '2023-02-15 09:00:00',
    endTime: '2023-02-16 18:00:00',
    days: 2,
    reason: '感冒发烧，需要休息',
    destination: '家中',
    status: 1,
    statusName: '已通过',
    createTime: '2023-02-14 10:20:00',
    approvalInfo: {
      approver: '张经理',
      approveTime: '2023-02-14 15:30:00',
      comment: '批准，注意休息'
    },
    attachments: [
      { name: '医院诊断书.pdf', url: '' }
    ]
  },
  {
    id: 10003,
    leaveType: 3,
    leaveTypeName: '年假',
    startTime: '2023-01-20 09:00:00',
    endTime: '2023-01-25 18:00:00',
    days: 6,
    reason: '休年假',
    destination: '旅游',
    status: 2,
    statusName: '已拒绝',
    createTime: '2023-01-15 09:45:00',
    approvalInfo: {
      approver: '张经理',
      approveTime: '2023-01-16 11:20:00',
      comment: '当前工作任务紧急，建议延后休假'
    }
  }
])

// 获取我的申请列表
const getMyApplications = async () => {
  try {
    // 实际项目中应该调用API
    // const res = await getLeaveList({ employeeId: currentUser.id })
    // myApplications.value = res.data
    
    // 这里使用模拟数据，实际项目中应该替换为API调用
  } catch (error) {
    console.error('获取请假申请列表失败', error)
  }
}

// 获取状态对应的类型
const getStatusType = (status) => {
  switch (status) {
    case 0: return 'info'    // 待审批
    case 1: return 'success' // 已通过
    case 2: return 'danger'  // 已拒绝
    case 3: return 'warning' // 已退回
    default: return 'info'
  }
}

// 查看详情
const detailDialogVisible = ref(false)
const currentDetail = ref(null)

const viewDetail = async (row) => {
  try {
    // 实际项目中应该调用API获取详情
    // const res = await getLeaveDetail(row.id)
    // currentDetail.value = res.data
    
    // 这里使用模拟数据，实际项目中应该替换为API调用
    currentDetail.value = row
    detailDialogVisible.value = true
  } catch (error) {
    console.error('获取请假申请详情失败', error)
  }
}

// 取消申请
const cancelApplication = (row) => {
  ElMessageBox.confirm('确定要取消该请假申请吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 实际项目中应该调用API
    // 这里使用模拟数据，实际项目中应该替换为API调用
    const index = myApplications.value.findIndex(item => item.id === row.id)
    if (index !== -1) {
      myApplications.value.splice(index, 1)
      ElMessage.success('申请已取消')
    }
  }).catch(() => {})
}

// 下载文件
const downloadFile = (file) => {
  // 实际项目中应该调用下载API
  ElMessage.info('文件下载功能待实现')
}

onMounted(() => {
  getMyApplications()
})
</script>

<style scoped>
.leave-apply-container {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.form-container {
  margin-bottom: 30px;
}

.section-title {
  margin: 20px 0;
}

.my-applications {
  margin-top: 30px;
}

.leave-detail {
  padding: 10px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
}

.detail-item .label {
  width: 100px;
  font-weight: bold;
  color: #606266;
}

.detail-item .value {
  flex: 1;
}

.attachments {
  display: flex;
  flex-direction: column;
}

.attachment-item {
  margin-bottom: 5px;
}
</style> 