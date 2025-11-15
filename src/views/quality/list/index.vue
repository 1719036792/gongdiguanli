<template>
  <div class="quality-list">
    <div class="header">
      <h2>检修列表</h2>
    </div>

    <!-- 搜索区域 -->
    <el-card class="search-container">
      <div class="search-wrapper">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="计划名称">
            <el-input v-model="searchForm.planName" placeholder="请输入计划名称" clearable />
          </el-form-item>
          <el-form-item label="检修状态">
            <el-select v-model="searchForm.repairStatus" placeholder="请选择状态" clearable class="status-select">
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
        <el-table-column prop="inspectedQuantity" label="检查数量" width="100" align="center" />
        <el-table-column prop="qualifiedQuantity" label="合格数量" width="100" align="center" />
        <el-table-column prop="unqualifiedQuantity" label="不合格数量" width="100" align="center" />
        <el-table-column prop="reworkQuantity" label="返修数量" width="100" align="center" />
        <el-table-column prop="repairStatus" label="检修状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.repairStatus)">{{ row.repairStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="repairUser" label="检修人" width="120" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center" />
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.repairStatus === '待检'"
              link
              type="primary"
              @click="handleClaim(row)"
            >
              <el-icon><User /></el-icon>认领
            </el-button>
          </template>
        </el-table-column>
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
import { Search, Refresh, User } from '@element-plus/icons-vue'
import { get, post, put } from '../../../utils/request'

// 搜索表单
const searchForm = ref({
  planName: '',
  repairStatus: ''
})

// 表格数据
const tableData = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 状态选项
const statusOptions = [
  { value: '待检', label: '待检' },
  { value: '检修中', label: '检修中' },
  { value: '通过', label: '通过' },
  { value: '返修', label: '返修' }
]

// 获取列表数据
const fetchList = async () => {
  loading.value = true
  try {
    const params = {
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      ...searchForm.value
    }
    const res = await post('/api/qualityControl/list', params)
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
    repairStatus: ''
  }
  currentPage.value = 1
  fetchList()
}

// 认领任务
const handleClaim = async (row) => {
  try {
    const res = await put('/api/qualityControl/claim', { id: row.id })
    if (res.code === 200) {
      ElMessage.success('认领成功')
      fetchList()
    } else {
      ElMessage.error(res.msg || '认领失败')
    }
  } catch (error) {
    console.error('认领失败:', error)
    ElMessage.error('认领失败')
  }
}

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    '待检': 'info',
    '检修中': 'warning',
    '通过': 'success',
    '返修': 'danger'
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
.quality-list {
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