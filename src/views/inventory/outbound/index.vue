<template>
  <div class="outbound-container">
    <!-- 搜索表单 -->
    <el-form :model="searchForm" inline class="search-form">
      <el-form-item label="物料名称">
        <el-input
          v-model="searchForm.unitName"
          placeholder="请输入物料名称"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="类型">
        <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
          <el-option label="成品" value="1" />
          <el-option label="原材料" value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="出库原因">
        <el-select v-model="searchForm.reason" placeholder="请选择原因" clearable>
          <el-option label="生产领料" value="生产领料" />
          <el-option label="质检返修" value="质检返修" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作人">
        <el-input
          v-model="searchForm.operator"
          placeholder="请输入操作人"
          clearable
          @keyup.enter="handleSearch"
        />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="searchForm.timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          value-format="YYYY-MM-DD HH:mm:ss"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="tableData"
      border
      style="width: 100%"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="unitName" label="物料名称" min-width="120" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="scope">
          {{ scope.row.type === '1' ? '成品' : '原材料' }}
        </template>
      </el-table-column>
      <el-table-column prop="quantity" label="出库数量" width="100" />
      <el-table-column prop="reason" label="出库原因" width="120" />
      <el-table-column prop="relatedId" label="关联单据ID" width="120" />
      <el-table-column prop="operator" label="操作人" width="120" />
      <el-table-column prop="createdAt" label="创建时间" width="180" />
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.pageNo"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getOutboundList } from '../../../api/inventory'
import { ElMessage } from 'element-plus'

// 搜索表单数据
const searchForm = reactive({
  unitName: '',
  type: '',
  reason: '',
  operator: '',
  timeRange: []
})

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 分页数据
const pagination = reactive({
  pageNo: 1,
  pageSize: 10,
  total: 0
})

// 获取表格数据
const getTableData = async () => {
  loading.value = true
  try {
    const params = {
      pageNo: pagination.pageNo,
      pageSize: pagination.pageSize,
      unitName: searchForm.unitName,
      type: searchForm.type,
      reason: searchForm.reason,
      operator: searchForm.operator,
      startTime: searchForm.timeRange?.[0],
      endTime: searchForm.timeRange?.[1]
    }

    const res = await getOutboundList(params)
    if (res.code === 200) {
      tableData.value = res.data.list
      pagination.total = res.data.total
    } else {
      ElMessage.error(res.message || '获取数据失败')
    }
  } catch (error) {
    console.error('获取出库记录失败:', error)
    ElMessage.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.pageNo = 1
  getTableData()
}

// 重置
const handleReset = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  searchForm.timeRange = []
  handleSearch()
}

// 分页大小改变
const handleSizeChange = (val) => {
  pagination.pageSize = val
  getTableData()
}

// 页码改变
const handleCurrentChange = (val) => {
  pagination.pageNo = val
  getTableData()
}

// 页面加载时获取数据
onMounted(() => {
  getTableData()
})
</script>

<style scoped>
.outbound-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 4px;
}

.search-form {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style> 