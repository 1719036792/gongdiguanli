<template>
  <div class="rework-list">
    <div class="header">
      <h2>返修记录</h2>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-container">
      <div class="search-wrapper">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="计划名称">
            <el-input v-model="searchForm.planName" placeholder="请输入计划名称" clearable />
          </el-form-item>
          <el-form-item label="任务状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" clearable class="status-select">
              <el-option
                v-for="option in statusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="fetchList">
              <el-icon><Search /></el-icon>搜索
            </el-button>
            <el-button @click="resetSearch">
              <el-icon><Refresh /></el-icon>重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        stripe
      >
        <el-table-column prop="planName" label="计划名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="reworkQuantity" label="返修数量" width="100" align="center" />
        <el-table-column prop="status" label="任务状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center" />
        <el-table-column prop="updatedAt" label="更新时间" width="180" align="center" />
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { post } from '../../../utils/request'

// 搜索表单
const searchForm = ref({
  planName: '',
  status: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 状态选项
const statusOptions = [
  { value: '待开始', label: '待开始' },
  { value: '进行中', label: '进行中' },
  { value: '已完成', label: '已完成' }
]

// 获取列表数据
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      productionPlanName: searchForm.value.planName,
      status: searchForm.value.status
    }
    const res = await post('/api/reworkTask/list', params)
    if (res.code === 200) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
    } else {
      ElMessage.error(res.msg || '获取列表失败')
    }
  } catch (error) {
    console.error('获取列表失败:', error)
    ElMessage.error('获取列表失败')
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.value = {
    planName: '',
    status: ''
  }
  currentPage.value = 1
  fetchList()
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    '待开始': 'info',
    '进行中': 'warning',
    '已完成': 'success'
  }
  return statusMap[status] || 'info'
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  fetchList()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchList()
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.rework-list {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 22px;
  color: #303133;
}

.search-container {
  margin-bottom: 20px;
}

.search-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-form :deep(.el-form-item) {
  margin-bottom: 0;
  margin-right: 10px;
}

.status-select {
  width: 150px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-tag) {
  padding: 0 10px;
  height: 28px;
  line-height: 28px;
  font-size: 13px;
}
</style>
