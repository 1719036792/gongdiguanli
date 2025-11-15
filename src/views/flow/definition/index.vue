<template>
  <div class="app-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>添加
      </el-button>
      <el-button type="warning" @click="handleModify" :disabled="!selectedRow">
        <el-icon><Edit /></el-icon>修改
      </el-button>
      <el-button type="danger" @click="handleDelete" :disabled="!selectedRow">
        <el-icon><Delete /></el-icon>删除
      </el-button>
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon>导出
      </el-button>
      <el-button type="primary" @click="getList">刷新</el-button>
    </div>

    <!-- 流程定义列表 -->
    <el-table :data="tableData" border style="width: 100%" @row-click="handleRowClick" highlight-current-row>
      <el-table-column type="selection" width="55" />
      <el-table-column prop="flowName" label="流程定义名称" />
      <el-table-column prop="flowCode" label="标识KEY" />
      <el-table-column prop="version" label="版本号" />
      <el-table-column prop="isPublish" label="发布状态">
        <template #default="scope">
          <el-tag type="success" v-if="scope.row.isPublish">已发布</el-tag>
          <el-tag type="info" v-else>未发布</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button type="primary" link @click.stop="handleDesign(scope.row)">
            <el-icon><Connection /></el-icon>编辑流程
          </el-button>
          <el-button type="success" link @click.stop="handlePublish(scope.row)" v-if="!scope.row.isPublish">
            <el-icon><Check /></el-icon>发布
          </el-button>
          <el-button type="warning" link @click.stop="handleUnpublish(scope.row)" v-else>
            <el-icon><Close /></el-icon>取消发布
          </el-button>
          <el-button type="info" link @click.stop="handleView(scope.row)">
            <el-icon><View /></el-icon>查看流程
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

    <!-- 添加/修改流程定义弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加流程定义' : '修改流程定义'"
      width="500px"
    >
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="流程名称" prop="flowName">
          <el-input v-model="formData.flowName" placeholder="请输入流程名称" />
        </el-form-item>
        <el-form-item label="标识KEY" prop="flowCode">
          <el-input v-model="formData.flowCode" placeholder="请输入流程标识KEY" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete, Download, Connection, Check, Close, View } from '@element-plus/icons-vue'
import { getFlowDefinitionList, addFlowDefinition, updateFlowDefinition, deleteFlowDefinition, publishFlowDefinition, unpublishFlowDefinition } from '../../../api/flow.js'
import { useRouter } from 'vue-router'

const router = useRouter()

// 表格数据
const tableData = ref([])
const selectedRow = ref(null)
const pageNo = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 弹窗相关
const dialogVisible = ref(false)
const dialogType = ref('add') // 'add' 或 'edit'
const formRef = ref(null)
const formData = reactive({
  id: null,
  flowName: '',
  flowCode: ''
})

// 表单验证规则
const rules = {
  flowName: [{ required: true, message: '请输入流程名称', trigger: 'blur' }],
  flowCode: [{ required: true, message: '请输入流程标识KEY', trigger: 'blur' }],
}

// 获取流程定义列表
const getList = async () => {
  try {
    const params = {
      page: pageNo.value,
      pageSize: pageSize.value
    }
    // 模拟数据，实际项目中应该调用API
    const res = await getFlowDefinitionList(params)
    if (res.code === 200) {
      tableData.value = res.data.list
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取流程定义列表失败', error)
  }
}

// 行点击事件
const handleRowClick = (row) => {
  selectedRow.value = row
}

// 添加流程定义
const handleAdd = () => {
  dialogType.value = 'add'
  formData.id = null
  formData.name = ''
  formData.key = ''
  formData.version = 'v1.0'
  dialogVisible.value = true
}

// 修改流程定义
const handleModify = () => {
  if (!selectedRow.value) {
    ElMessage.warning('请先选择一条记录')
    return
  }
  dialogType.value = 'edit'
  formData.id = selectedRow.value.id
  formData.name = selectedRow.value.name
  formData.key = selectedRow.value.key
  formData.version = selectedRow.value.version
  dialogVisible.value = true
}

// 删除流程定义
const handleDelete = () => {
  if (!selectedRow.value) {
    ElMessage.warning('请先选择一条记录')
    return
  }
  
  ElMessageBox.confirm('确认删除该流程定义吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      // 模拟API调用
      // const res = await deleteFlowDefinition(selectedRow.value.id)
      const res = { code: 200, msg: '删除成功' }
      if (res.code === 200) {
        ElMessage.success('删除成功')
        getList()
        selectedRow.value = null
      }
    } catch (error) {
      console.error('删除流程定义失败', error)
    }
  }).catch(() => {})
}

// 导出流程定义
const handleExport = () => {
  ElMessage.info('导出功能待实现')
}

// 设计流程
const handleDesign = (row) => {
  router.push({
    path: '/flow/design',
    query: {
      id: row.id,
      disabled: false
    }
  })
}

// 查看流程
const handleView = (row) => {
  router.push({
    path: '/flow/design',
    query: {
      id: row.id,
      disabled: true
    }
  })
}

// 发布流程
const handlePublish = async (row) => {
  try {
    // 模拟API调用
    const res = await publishFlowDefinition(row.id)
    if (res.code === 200) {
      ElMessage.success('发布成功')
      getList()
    }
  } catch (error) {
    console.error('发布流程定义失败', error)
  }
}

// 取消发布流程
const handleUnpublish = async (row) => {
  try {
    // 模拟API调用
    // const res = await unpublishFlowDefinition(row.id)
    const res = { code: 200, msg: '取消发布成功' }
    if (res.code === 200) {
      ElMessage.success('取消发布成功')
      getList()
    }
  } catch (error) {
    console.error('取消发布流程定义失败', error)
  }
}

// 提交表单
const submitForm = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        let res
        // 模拟API调用
        if (dialogType.value === 'add') {
          res = await addFlowDefinition(formData)
        } else {
          res = await updateFlowDefinition(formData)
        }
        
        if (res.code === 200) {
          ElMessage.success(dialogType.value === 'add' ? '添加成功' : '修改成功')
          dialogVisible.value = false
          getList()
        }
      } catch (error) {
        console.error(dialogType.value === 'add' ? '添加流程定义失败' : '修改流程定义失败', error)
      }
    }
  })
}

// 分页相关
const handleSizeChange = (val) => {
  pageSize.value = val
  getList()
}

const handleCurrentChange = (val) => {
  pageNo.value = val
  getList()
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 