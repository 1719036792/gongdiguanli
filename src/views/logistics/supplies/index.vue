<template>
  <div class="app-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleSupplyAdd">
        <el-icon><Plus /></el-icon>新增物资
      </el-button>
      <el-button type="warning" @click="handleSupplyModify" :disabled="!selectedSupply">
        <el-icon><Edit /></el-icon>修改物资
      </el-button>
      <el-button type="danger" @click="handleSupplyDelete" :disabled="!selectedSupply">
        <el-icon><Delete /></el-icon>删除物资
      </el-button>
      <el-form inline class="toolbar-form">
        <el-form-item label="物资名称">
          <el-input v-model="supplyQueryParams.name" placeholder="请输入物资名称" clearable @keyup.enter="handleSupplyQuery" />
        </el-form-item>
        <el-form-item label="物资类型">
          <el-select v-model="supplyQueryParams.type" placeholder="请选择类型" clearable>
            <el-option label="建筑材料" value="1" />
            <el-option label="装修材料" value="2" />
            <el-option label="电气设备" value="3" />
            <el-option label="管道设备" value="4" />
            <el-option label="安全设备" value="5" />
            <el-option label="工具物资" value="6" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSupplyQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetSupplyQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 物资列表 -->
    <el-table :data="supplyData" border style="width: 100%" @row-click="handleSupplyRowClick" highlight-current-row v-loading="supplyLoading">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="code" label="物资编号" width="120" />
      <el-table-column prop="name" label="物资名称" min-width="120" />
      <el-table-column prop="type" label="物资类型" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.typeId === '1'">建筑材料</el-tag>
          <el-tag type="success" v-else-if="scope.row.typeId === '2'">装修材料</el-tag>
          <el-tag type="warning" v-else-if="scope.row.typeId === '3'">电气设备</el-tag>
          <el-tag type="danger" v-else-if="scope.row.typeId === '4'">管道设备</el-tag>
          <el-tag type="info" v-else-if="scope.row.typeId === '5'">安全设备</el-tag>
          <el-tag v-else-if="scope.row.typeId === '6'">工具物资</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="unit" label="单位" width="80" />
      <el-table-column prop="quantity" label="库存数量" width="100" />
      <el-table-column prop="price" label="单价(元)" width="100" />
      <el-table-column prop="supplier" label="供应商" width="150" />
      <el-table-column prop="storageLocation" label="存放位置" width="150" />
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button type="primary" link @click.stop="handleOutbound(scope.row)" :disabled="scope.row.quantity <= 0">
            <el-icon><Remove /></el-icon>出库
          </el-button>
          <el-button type="success" link @click.stop="handleInbound(scope.row)">
            <el-icon><Plus /></el-icon>入库
          </el-button>
          <el-button type="warning" link @click.stop="handleInventory(scope.row)">
            <el-icon><Document /></el-icon>盘点
          </el-button>
          <el-button type="info" link @click.stop="handleSupplyDetail(scope.row)">
            <el-icon><View /></el-icon>详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="supplyPageNo"
        v-model:page-size="supplyPageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="supplyTotal"
        @size-change="handleSupplySizeChange"
        @current-change="handleSupplyCurrentChange"
      />
    </div>

    <!-- 物资出库弹窗 -->
    <el-dialog
      v-model="outboundDialogVisible"
      title="物资出库"
      width="550px"
    >
      <div v-if="currentSupply" class="supply-outbound">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="物资编号">{{ currentSupply.code }}</el-descriptions-item>
          <el-descriptions-item label="物资名称">{{ currentSupply.name }}</el-descriptions-item>
          <el-descriptions-item label="物资类型">{{ currentSupply.type }}</el-descriptions-item>
          <el-descriptions-item label="当前库存">{{ currentSupply.quantity }} {{ currentSupply.unit }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="outbound-form">
          <h4>出库信息</h4>
          <el-form :model="outboundForm" :rules="outboundRules" ref="outboundFormRef" label-width="100px">
            <el-form-item label="出库数量" prop="quantity">
              <el-input-number 
                v-model="outboundForm.quantity" 
                :min="1" 
                :max="currentSupply.quantity"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="项目" prop="projectId">
              <el-select v-model="outboundForm.projectId" placeholder="请选择项目" style="width: 100%">
                <el-option
                  v-for="project in projects"
                  :key="project.id"
                  :label="project.name"
                  :value="project.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="领用人" prop="userId">
              <el-select v-model="outboundForm.userId" placeholder="请选择领用人" style="width: 100%">
                <el-option
                  v-for="worker in workers"
                  :key="worker.id"
                  :label="worker.name"
                  :value="worker.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="出库日期" prop="date">
              <el-date-picker
                v-model="outboundForm.date"
                type="date"
                placeholder="选择出库日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="用途描述">
              <el-input
                v-model="outboundForm.purpose"
                type="textarea"
                :rows="2"
                placeholder="请输入用途描述"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="outboundDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitOutbound">确认出库</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 物资入库弹窗 -->
    <el-dialog
      v-model="inboundDialogVisible"
      title="物资入库"
      width="550px"
    >
      <div v-if="currentSupply" class="supply-inbound">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="物资编号">{{ currentSupply.code }}</el-descriptions-item>
          <el-descriptions-item label="物资名称">{{ currentSupply.name }}</el-descriptions-item>
          <el-descriptions-item label="物资类型">{{ currentSupply.type }}</el-descriptions-item>
          <el-descriptions-item label="当前库存">{{ currentSupply.quantity }} {{ currentSupply.unit }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="inbound-form">
          <h4>入库信息</h4>
          <el-form :model="inboundForm" :rules="inboundRules" ref="inboundFormRef" label-width="100px">
            <el-form-item label="入库数量" prop="quantity">
              <el-input-number 
                v-model="inboundForm.quantity" 
                :min="1"
                :precision="0"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="供应商" prop="supplierId">
              <el-select v-model="inboundForm.supplierId" placeholder="请选择供应商" style="width: 100%">
                <el-option
                  v-for="supplier in suppliers"
                  :key="supplier.id"
                  :label="supplier.name"
                  :value="supplier.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="入库日期" prop="date">
              <el-date-picker
                v-model="inboundForm.date"
                type="date"
                placeholder="选择入库日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="入库批次">
              <el-input v-model="inboundForm.batchNo" placeholder="请输入入库批次" />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="inboundForm.remark"
                type="textarea"
                :rows="2"
                placeholder="请输入备注"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="inboundDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitInbound">确认入库</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      supplyQueryParams: {
        name: '',
        type: '',
      },
      supplyData: [],
      supplyLoading: false,
      supplyPageNo: 1,
      supplyPageSize: 10,
      supplyTotal: 0,
      selectedSupply: null,
      outboundDialogVisible: false,
      inboundDialogVisible: false,
      currentSupply: null,
      outboundForm: {
        supplyId: null,
        quantity: 1,
        projectId: '',
        userId: '',
        date: '',
        purpose: '',
      },
      outboundRules: {
        quantity: [{ required: true, message: '请输入出库数量', trigger: 'blur' }],
        projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
        userId: [{ required: true, message: '请选择领用人', trigger: 'change' }],
        date: [{ required: true, message: '请选择出库日期', trigger: 'change' }],
      },
      inboundForm: {
        supplyId: null,
        quantity: 1,
        supplierId: '',
        date: '',
        batchNo: '',
        remark: '',
      },
      inboundRules: {
        quantity: [{ required: true, message: '请输入入库数量', trigger: 'blur' }],
        supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
        date: [{ required: true, message: '请选择入库日期', trigger: 'change' }],
      },
      outboundFormRef: null,
      inboundFormRef: null,
      workers: [
        { id: '1', name: '张三', department: '施工部' },
        { id: '2', name: '李四', department: '施工部' },
        { id: '3', name: '王五', department: '技术部' },
        { id: '4', name: '赵六', department: '后勤部' },
        { id: '5', name: '钱七', department: '质检部' }
      ],
      projects: [
        { id: '1', name: '高速公路建设项目' },
        { id: '2', name: '城市地铁工程' },
        { id: '3', name: '商业中心建设' },
        { id: '4', name: '居民小区改造工程' },
        { id: '5', name: '工业园区建设' }
      ],
      suppliers: [
        { id: '1', name: '建筑材料有限公司' },
        { id: '2', name: '五金工具供应商' },
        { id: '3', name: '电气设备供应商' },
        { id: '4', name: '管道系统供应商' },
        { id: '5', name: '安全设备供应商' }
      ]
    }
  },
  mounted() {
    this.fetchSupplyList();
  },
  methods: {
    // 模拟API调用，获取物资列表
    fetchSupplyList() {
      this.supplyLoading = true;
      
      // 模拟API延迟
      setTimeout(() => {
        // 模拟数据
        const mockData = [];
        const supplyNames = {
          '1': ['水泥', '钢筋', '沙子', '石子', '石灰', '砖块'], // 建筑材料
          '2': ['地板砖', '墙面漆', '木板', '吊顶材料', '壁纸'], // 装修材料
          '3': ['配电箱', '电线', '插座', '开关', '照明设备'], // 电气设备
          '4': ['水管', '阀门', '接头', '保温材料', '下水管'], // 管道设备
          '5': ['安全帽', '警示带', '防毒面具', '防护服', '安全绳'], // 安全设备
          '6': ['扳手', '螺丝刀', '电钻', '手电筒', '测量工具'] // 工具物资
        };
        
        const units = ['个', '箱', '袋', '米', '吨', '桶', '卷'];
        
        for (let i = 1; i <= 50; i++) {
          const typeId = Math.floor(Math.random() * 6 + 1).toString();
          const nameArray = supplyNames[typeId];
          const nameIndex = Math.floor(Math.random() * nameArray.length);
          const unit = units[Math.floor(Math.random() * units.length)];
          const quantity = Math.floor(Math.random() * 1000);
          const price = Math.floor(Math.random() * 10000) / 100;
          const supplierId = Math.floor(Math.random() * 5 + 1).toString();
          
          mockData.push({
            id: i.toString(),
            code: `SP-${1000 + i}`,
            name: nameArray[nameIndex],
            typeId: typeId,
            type: ['', '建筑材料', '装修材料', '电气设备', '管道设备', '安全设备', '工具物资'][parseInt(typeId)],
            unit: unit,
            quantity: quantity,
            price: price,
            supplier: this.suppliers.find(s => s.id === supplierId)?.name || '',
            supplierId: supplierId,
            storageLocation: `仓库${Math.floor(Math.random() * 3 + 1)}-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 20 + 1)}`,
          });
        }
        
        // 应用查询条件过滤
        let filteredData = [...mockData];
        if (this.supplyQueryParams.name) {
          filteredData = filteredData.filter(item => 
            item.name.includes(this.supplyQueryParams.name)
          );
        }
        if (this.supplyQueryParams.type) {
          filteredData = filteredData.filter(item => 
            item.typeId === this.supplyQueryParams.type
          );
        }
        
        // 分页
        const start = (this.supplyPageNo - 1) * this.supplyPageSize;
        const end = start + this.supplyPageSize;
        
        this.supplyData = filteredData.slice(start, end);
        this.supplyTotal = filteredData.length;
        this.supplyLoading = false;
      }, 500);
    },
    
    handleSupplyQuery() {
      this.supplyPageNo = 1;
      this.fetchSupplyList();
    },
    
    resetSupplyQuery() {
      this.supplyQueryParams.name = '';
      this.supplyQueryParams.type = '';
      this.handleSupplyQuery();
    },
    
    handleSupplyRowClick(row) {
      this.selectedSupply = row;
    },
    
    handleSupplySizeChange(size) {
      this.supplyPageSize = size;
      this.fetchSupplyList();
    },
    
    handleSupplyCurrentChange(page) {
      this.supplyPageNo = page;
      this.fetchSupplyList();
    },
    
    handleSupplyAdd() {
      this.$message.info('新增物资功能待实现');
    },
    
    handleSupplyModify() {
      if (!this.selectedSupply) {
        this.$message.warning('请选择要修改的物资');
        return;
      }
      this.$message.info('修改物资功能待实现');
    },
    
    handleSupplyDelete() {
      if (!this.selectedSupply) {
        this.$message.warning('请选择要删除的物资');
        return;
      }
      this.$confirm('确认删除该物资记录吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        this.$message.success('删除成功');
        this.fetchSupplyList();
        this.selectedSupply = null;
      }).catch(() => {});
    },
    
    handleOutbound(row) {
      this.currentSupply = row;
      this.outboundForm = {
        supplyId: row.id,
        quantity: 1,
        projectId: '',
        userId: '',
        date: new Date().toISOString().split('T')[0],
        purpose: '',
      };
      this.outboundDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.outboundFormRef?.resetFields();
      });
    },
    
    submitOutbound() {
      this.$refs.outboundFormRef.validate((valid) => {
        if (valid) {
          // 模拟提交操作
          this.$message.success('物资出库成功');
          this.outboundDialogVisible = false;
          this.fetchSupplyList();
        }
      });
    },
    
    handleInbound(row) {
      this.currentSupply = row;
      this.inboundForm = {
        supplyId: row.id,
        quantity: 1,
        supplierId: row.supplierId,
        date: new Date().toISOString().split('T')[0],
        batchNo: `B${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}`,
        remark: '',
      };
      this.inboundDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.inboundFormRef?.resetFields();
      });
    },
    
    submitInbound() {
      this.$refs.inboundFormRef.validate((valid) => {
        if (valid) {
          // 模拟提交操作
          this.$message.success('物资入库成功');
          this.inboundDialogVisible = false;
          this.fetchSupplyList();
        }
      });
    },
    
    handleInventory(row) {
      this.$message.info('物资盘点功能待实现: ' + row.name);
    },
    
    handleSupplyDetail(row) {
      this.$message.info('查看物资详情: ' + row.name);
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

.supply-outbound,
.supply-inbound {
  margin-top: 10px;
}

.outbound-form,
.inbound-form {
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
</style> 