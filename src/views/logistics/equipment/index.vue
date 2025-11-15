<template>
  <div class="app-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleEquipmentAdd">
        <el-icon><Plus /></el-icon>新增设备
      </el-button>
      <el-button type="warning" @click="handleEquipmentModify" :disabled="!selectedEquipment">
        <el-icon><Edit /></el-icon>修改设备
      </el-button>
      <el-button type="danger" @click="handleEquipmentDelete" :disabled="!selectedEquipment">
        <el-icon><Delete /></el-icon>删除设备
      </el-button>
      <el-form inline class="toolbar-form">
        <el-form-item label="设备名称">
          <el-input v-model="equipmentQueryParams.name" placeholder="请输入设备名称" clearable @keyup.enter="handleEquipmentQuery" />
        </el-form-item>
        <el-form-item label="设备状态">
          <el-select v-model="equipmentQueryParams.status" placeholder="请选择状态" clearable>
            <el-option label="空闲" value="1" />
            <el-option label="使用中" value="2" />
            <el-option label="维修中" value="3" />
            <el-option label="报废" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleEquipmentQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetEquipmentQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 设备列表 -->
    <el-table :data="equipmentData" border style="width: 100%" @row-click="handleEquipmentRowClick" highlight-current-row v-loading="equipmentLoading">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="code" label="设备编号" width="120" />
      <el-table-column prop="name" label="设备名称" min-width="120" />
      <el-table-column prop="type" label="设备类型" width="100" />
      <el-table-column prop="purchaseDate" label="购入日期" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '1'">空闲</el-tag>
          <el-tag type="success" v-else-if="scope.row.status === '2'">使用中</el-tag>
          <el-tag type="warning" v-else-if="scope.row.status === '3'">维修中</el-tag>
          <el-tag type="danger" v-else-if="scope.row.status === '4'">报废</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="currentUser" label="当前使用人" width="100" />
      <el-table-column prop="projectName" label="所属项目" width="150" />
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button type="primary" link @click.stop="handleAssignEquipment(scope.row)" :disabled="scope.row.status !== '1'">
            <el-icon><UserFilled /></el-icon>分配
          </el-button>
          <el-button type="success" link @click.stop="handleReturnEquipment(scope.row)" :disabled="scope.row.status !== '2'">
            <el-icon><Back /></el-icon>归还
          </el-button>
          <el-button type="warning" link @click.stop="handleEquipmentMaintenance(scope.row)" :disabled="scope.row.status === '3' || scope.row.status === '4'">
            <el-icon><Tools /></el-icon>报修
          </el-button>
          <el-button type="info" link @click.stop="handleEquipmentDetail(scope.row)">
            <el-icon><View /></el-icon>详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="equipmentPageNo"
        v-model:page-size="equipmentPageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="equipmentTotal"
        @size-change="handleEquipmentSizeChange"
        @current-change="handleEquipmentCurrentChange"
      />
    </div>

    <!-- 设备分配弹窗 -->
    <el-dialog
      v-model="equipmentAssignDialogVisible"
      title="设备分配"
      width="550px"
    >
      <div v-if="currentEquipment" class="equipment-assign">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ currentEquipment.code }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ currentEquipment.name }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ currentEquipment.type }}</el-descriptions-item>
          <el-descriptions-item label="购入日期">{{ currentEquipment.purchaseDate }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="assignment-form">
          <h4>分配信息</h4>
          <el-form :model="equipmentAssignForm" :rules="equipmentAssignRules" ref="equipmentAssignFormRef" label-width="100px">
            <el-form-item label="项目" prop="projectId">
              <el-select 
                v-model="equipmentAssignForm.projectId" 
                placeholder="请选择项目" 
                style="width: 100%"
                @change="handleProjectChange"
                :loading="loadingProjects"
              >
                <el-option
                  v-for="project in projects"
                  :key="project.id"
                  :label="project.name"
                  :value="project.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="使用人" prop="userId">
              <div style="display: flex; align-items: center;">
                <el-select 
                  v-model="equipmentAssignForm.userId" 
                  placeholder="请选择使用人" 
                  style="flex: 1;"
                  :loading="loadingWorkers"
                >
                  <el-option
                    v-for="worker in workers"
                    :key="worker.id"
                    :label="worker.name"
                    :value="worker.id"
                  />
                </el-select>
                <el-button 
                  type="primary" 
                  link 
                  @click="toggleWorkerSource" 
                  style="margin-left: 5px; white-space: nowrap;"
                >
                  {{ useProjectWorkers ? '所有人员' : '项目人员' }}
                </el-button>
              </div>
            </el-form-item>
            <el-form-item label="借用日期" prop="startDate">
              <el-date-picker
                v-model="equipmentAssignForm.startDate"
                type="date"
                placeholder="选择借用日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="预计归还" prop="expectedEndDate">
              <el-date-picker
                v-model="equipmentAssignForm.expectedEndDate"
                type="date"
                placeholder="选择预计归还日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="用途描述">
              <el-input
                v-model="equipmentAssignForm.purpose"
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
          <el-button @click="equipmentAssignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEquipmentAssign">确认分配</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 新增/编辑设备弹窗 -->
    <el-dialog
      v-model="equipmentFormDialogVisible"
      :title="equipmentFormTitle"
      width="600px"
    >
      <el-form :model="equipmentForm" :rules="equipmentFormRules" ref="equipmentFormRef" label-width="100px">
        <el-form-item label="设备编号" prop="code">
          <el-input v-model="equipmentForm.code" placeholder="请输入设备编号" />
        </el-form-item>
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="equipmentForm.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="equipmentForm.type" placeholder="请选择设备类型" style="width: 100%">
            <el-option label="挖掘机" value="挖掘机" />
            <el-option label="推土机" value="推土机" />
            <el-option label="起重机" value="起重机" />
            <el-option label="混凝土搅拌机" value="混凝土搅拌机" />
            <el-option label="电焊机" value="电焊机" />
            <el-option label="发电机" value="发电机" />
            <el-option label="切割机" value="切割机" />
            <el-option label="压路机" value="压路机" />
          </el-select>
        </el-form-item>
        <el-form-item label="购入日期" prop="purchaseDate">
          <el-date-picker
            v-model="equipmentForm.purchaseDate"
            type="date"
            placeholder="选择购入日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="设备状态" prop="status">
          <el-select v-model="equipmentForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="空闲" value="1" />
            <el-option label="使用中" value="2" />
            <el-option label="维修中" value="3" />
            <el-option label="报废" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="规格参数" prop="specifications">
          <el-input v-model="equipmentForm.specifications" type="textarea" :rows="2" placeholder="请输入规格参数" />
        </el-form-item>
        <el-form-item label="设备描述" prop="description">
          <el-input v-model="equipmentForm.description" type="textarea" :rows="2" placeholder="请输入设备描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="equipmentFormDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitEquipmentForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设备维修弹窗 -->
    <el-dialog
      v-model="maintenanceDialogVisible"
      title="设备报修"
      width="550px"
    >
      <div v-if="currentEquipment" class="equipment-maintenance">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ currentEquipment.code }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ currentEquipment.name }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ currentEquipment.type }}</el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag v-if="currentEquipment.status === '1'">空闲</el-tag>
            <el-tag type="success" v-else-if="currentEquipment.status === '2'">使用中</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="maintenance-form">
          <h4>维修信息</h4>
          <el-form :model="maintenanceForm" :rules="maintenanceRules" ref="maintenanceFormRef" label-width="100px">
            <el-form-item label="维修类型" prop="maintenanceType">
              <el-select v-model="maintenanceForm.maintenanceType" placeholder="请选择维修类型" style="width: 100%">
                <el-option label="定期保养" value="1" />
                <el-option label="故障维修" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="开始日期" prop="startDate">
              <el-date-picker
                v-model="maintenanceForm.startDate"
                type="date"
                placeholder="选择开始日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="问题描述" prop="description">
              <el-input
                v-model="maintenanceForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入问题描述"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="maintenanceDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMaintenance">确认报修</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设备详情弹窗 -->
    <el-dialog
      v-model="equipmentDetailDialogVisible"
      title="设备详情"
      width="800px"
    >
      <div v-if="equipmentDetail" class="equipment-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ equipmentDetail.code }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ equipmentDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="设备类型">{{ equipmentDetail.type }}</el-descriptions-item>
          <el-descriptions-item label="购入日期">{{ equipmentDetail.purchaseDate }}</el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <el-tag v-if="equipmentDetail.status === '1'">空闲</el-tag>
            <el-tag type="success" v-else-if="equipmentDetail.status === '2'">使用中</el-tag>
            <el-tag type="warning" v-else-if="equipmentDetail.status === '3'">维修中</el-tag>
            <el-tag type="danger" v-else-if="equipmentDetail.status === '4'">报废</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="当前使用人">{{ equipmentDetail.currentUser || '无' }}</el-descriptions-item>
          <el-descriptions-item label="规格参数" :span="2">{{ equipmentDetail.specifications || '无' }}</el-descriptions-item>
          <el-descriptions-item label="设备描述" :span="2">{{ equipmentDetail.description || '无' }}</el-descriptions-item>
        </el-descriptions>
        
        <!-- 使用记录列表 -->
        <el-divider content-position="left">使用记录</el-divider>
        <el-table :data="usageRecords" border style="width: 100%" v-loading="loadingUsageRecords" max-height="300">
          <el-table-column prop="userName" label="使用人" width="100" />
          <el-table-column prop="projectName" label="所属项目" width="150" />
          <el-table-column prop="startDate" label="借用日期" width="110" />
          <el-table-column prop="expectedEndDate" label="预计归还日期" width="110" />
          <el-table-column prop="actualEndDate" label="实际归还日期" width="110" />
          <el-table-column prop="statusName" label="状态" width="80">
            <template #default="scope">
              <el-tag :type="scope.row.status === '1' ? 'primary' : 'success'">
                {{ scope.row.statusName }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="purpose" label="用途" min-width="150" />
        </el-table>
        
        <!-- 维修记录列表 -->
        <el-divider content-position="left">维修记录</el-divider>
        <el-table :data="maintenanceRecords" border style="width: 100%" v-loading="loadingMaintenanceRecords" max-height="300">
          <el-table-column prop="maintenanceTypeName" label="维修类型" width="100" />
          <el-table-column prop="startDate" label="开始日期" width="110" />
          <el-table-column prop="endDate" label="结束日期" width="110" />
          <el-table-column prop="description" label="问题描述" min-width="150" />
          <el-table-column prop="result" label="维修结果" min-width="150" />
          <el-table-column prop="cost" label="维修费用" width="100" />
          <el-table-column prop="statusName" label="状态" width="90">
            <template #default="scope">
              <el-tag :type="scope.row.status === '1' ? 'warning' : 'success'">
                {{ scope.row.statusName }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="scope">
              <el-button 
                type="primary" 
                link 
                @click.stop="handleCompleteMaintenance(scope.row)" 
                v-if="scope.row.status === '1'"
              >
                完成
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="equipmentDetailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 维修完成弹窗 -->
    <el-dialog
      v-model="maintenanceCompleteDialogVisible"
      title="维修完成"
      width="550px"
    >
      <div v-if="currentMaintenance" class="maintenance-complete">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备编号">{{ currentMaintenance.equipmentCode }}</el-descriptions-item>
          <el-descriptions-item label="设备名称">{{ currentMaintenance.equipmentName }}</el-descriptions-item>
          <el-descriptions-item label="维修类型">{{ currentMaintenance.maintenanceTypeName }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ currentMaintenance.startDate }}</el-descriptions-item>
          <el-descriptions-item label="问题描述" :span="2">{{ currentMaintenance.description }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="maintenance-complete-form">
          <h4>维修完成信息</h4>
          <el-form :model="maintenanceCompleteForm" :rules="maintenanceCompleteRules" ref="maintenanceCompleteFormRef" label-width="100px">
            <el-form-item label="结束日期" prop="endDate">
              <el-date-picker
                v-model="maintenanceCompleteForm.endDate"
                type="date"
                placeholder="选择结束日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="维修结果类型" prop="resultType">
              <el-radio-group v-model="maintenanceCompleteForm.resultType">
                <el-radio label="1">维修成功</el-radio>
                <el-radio label="2">维修失败(报废)</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="维修结果" prop="result">
              <el-input
                v-model="maintenanceCompleteForm.result"
                type="textarea"
                :rows="3"
                placeholder="请输入维修结果"
              />
            </el-form-item>
            <el-form-item label="维修费用" prop="cost">
              <el-input v-model="maintenanceCompleteForm.cost" placeholder="请输入维修费用" />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="maintenanceCompleteDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitMaintenanceComplete">确认完成</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getEquipmentList, getEquipmentDetail, addEquipment, updateEquipment, deleteEquipment, assignEquipment, returnEquipment, reportMaintenance, getLatestEquipmentUsage, getEquipmentUsageRecords, getEquipmentMaintenanceRecords, completeEquipmentMaintenance } from '../../../api/equipment.js'
import { getAllProjectsForEquipment, getProjectWorkersForEquipment, getAllWorkersForEquipment } from '../../../api/project.js'

export default {
  data() {
    return {
      equipmentQueryParams: {
        name: '',
        status: '',
      },
      equipmentData: [],
      equipmentLoading: false,
      equipmentPageNo: 1,
      equipmentPageSize: 10,
      equipmentTotal: 0,
      selectedEquipment: null,
      equipmentAssignDialogVisible: false,
      currentEquipment: null,
      equipmentAssignForm: {
        equipmentId: null,
        projectId: '',
        userId: '',
        startDate: '',
        expectedEndDate: '',
        purpose: '',
      },
      equipmentAssignRules: {
        projectId: [{ required: true, message: '请选择项目', trigger: 'change' }],
        userId: [{ required: true, message: '请选择使用人', trigger: 'change' }],
        startDate: [{ required: true, message: '请选择借用日期', trigger: 'change' }],
        expectedEndDate: [{ required: true, message: '请选择预计归还日期', trigger: 'change' }],
      },
      equipmentFormDialogVisible: false,
      equipmentFormTitle: '',
      equipmentForm: {
        id: null,
        code: '',
        name: '',
        type: '',
        purchaseDate: '',
        status: '1',
        specifications: '',
        description: '',
      },
      equipmentFormRules: {
        code: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
        name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
        type: [{ required: true, message: '请选择设备类型', trigger: 'change' }],
        purchaseDate: [{ required: true, message: '请选择购入日期', trigger: 'change' }],
        status: [{ required: true, message: '请选择设备状态', trigger: 'change' }],
      },
      maintenanceDialogVisible: false,
      maintenanceForm: {
        equipmentId: null,
        maintenanceType: '',
        startDate: '',
        description: '',
      },
      maintenanceRules: {
        maintenanceType: [{ required: true, message: '请选择维修类型', trigger: 'change' }],
        startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
        description: [{ required: true, message: '请输入问题描述', trigger: 'blur' }],
      },
      equipmentDetailDialogVisible: false,
      equipmentDetail: null,
      usageRecords: [],
      loadingUsageRecords: false,
      maintenanceRecords: [],
      loadingMaintenanceRecords: false,
      
      // 修改为空数组，从接口加载
      workers: [],
      projects: [],
      
      // 新增属性
      loadingProjects: false,
      loadingWorkers: false,
      useProjectWorkers: true, // 是否使用项目下的工作人员
      maintenanceCompleteDialogVisible: false,
      maintenanceCompleteForm: {
        id: null,
        endDate: '',
        resultType: '',
        result: '',
        cost: ''
      },
      maintenanceCompleteRules: {
        endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
        resultType: [{ required: true, message: '请选择维修结果类型', trigger: 'change' }],
        result: [{ required: true, message: '请输入维修结果', trigger: 'blur' }]
      },
      currentMaintenance: null
    }
  },
  watch: {
    // 监听维修结果类型变化
    'maintenanceCompleteForm.resultType'(newVal) {
      if (newVal === '2') {
        // 如果选择了报废，自动填充默认的报废原因
        if (!this.maintenanceCompleteForm.result) {
          this.maintenanceCompleteForm.result = '设备损坏严重，无法修复，建议报废';
        }
      }
    }
  },
  mounted() {
    this.fetchEquipmentList();
    this.fetchProjects(); // 加载项目数据
  },
  methods: {
    // 获取设备列表
    fetchEquipmentList() {
      this.equipmentLoading = true;
      const params = {
        pageNo: this.equipmentPageNo,
        pageSize: this.equipmentPageSize,
        name: this.equipmentQueryParams.name || null,
        status: this.equipmentQueryParams.status || null
      };
      
      getEquipmentList(params).then(response => {
        this.equipmentData = response.data.list;
        this.equipmentTotal = response.data.total;
        
        // 加载设备使用记录信息
        this.loadEquipmentUsageInfo();
      }).catch(error => {
        console.error('获取设备列表失败', error);
        this.$message.error('获取设备列表失败');
      }).finally(() => {
        this.equipmentLoading = false;
      });
    },
    
    // 加载设备使用记录信息
    loadEquipmentUsageInfo() {
      // 过滤出使用中的设备
      const usingEquipmentList = this.equipmentData.filter(item => item.status === '2');
      
      // 确保非使用中的设备不显示使用人和项目信息
      this.equipmentData.forEach(item => {
        if (item.status !== '2') {
          item.currentUser = null;
          item.projectName = null;
        }
      });
      
      if (usingEquipmentList.length > 0) {
        // 对每个使用中的设备获取最新的使用记录信息
        usingEquipmentList.forEach(equipment => {
          getLatestEquipmentUsage(equipment.id).then(response => {
            if (response.code === 200 && response.data) {
              const usageInfo = response.data;
              
              // 更新设备的使用人和项目信息
              if (usageInfo.userName) {
                equipment.currentUser = usageInfo.userName;
              }
              
              if (usageInfo.projectName) {
                equipment.projectName = usageInfo.projectName;
              }
            }
          }).catch(error => {
            console.error('获取设备使用记录失败', error);
          });
        });
      }
    },
    
    handleEquipmentQuery() {
      this.equipmentPageNo = 1;
      this.fetchEquipmentList();
    },
    
    resetEquipmentQuery() {
      this.equipmentQueryParams.name = '';
      this.equipmentQueryParams.status = '';
      this.handleEquipmentQuery();
    },
    
    handleEquipmentRowClick(row) {
      this.selectedEquipment = row;
    },
    
    handleEquipmentSizeChange(size) {
      this.equipmentPageSize = size;
      this.fetchEquipmentList();
    },
    
    handleEquipmentCurrentChange(page) {
      this.equipmentPageNo = page;
      this.fetchEquipmentList();
    },
    
    // 新增设备
    handleEquipmentAdd() {
      this.equipmentFormTitle = '新增设备';
      this.equipmentForm = {
        id: null,
        code: '',
        name: '',
        type: '',
        purchaseDate: '',
        status: '1',
        specifications: '',
        description: '',
      };
      this.equipmentFormDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.equipmentFormRef?.resetFields();
      });
    },
    
    // 修改设备
    handleEquipmentModify() {
      if (!this.selectedEquipment) {
        this.$message.warning('请选择要修改的设备');
        return;
      }
      
      this.equipmentFormTitle = '修改设备';
      this.equipmentForm = {
        id: this.selectedEquipment.id,
        code: this.selectedEquipment.code,
        name: this.selectedEquipment.name,
        type: this.selectedEquipment.type,
        purchaseDate: this.selectedEquipment.purchaseDate,
        status: this.selectedEquipment.status,
        specifications: this.selectedEquipment.specifications,
        description: this.selectedEquipment.description,
      };
      this.equipmentFormDialogVisible = true;
    },
    
    // 提交设备表单
    submitEquipmentForm() {
      this.$refs.equipmentFormRef.validate((valid) => {
        if (valid) {
          if (this.equipmentForm.id) {
            // 修改设备
            updateEquipment(this.equipmentForm).then(() => {
              this.$message.success('修改设备成功');
              this.equipmentFormDialogVisible = false;
              this.fetchEquipmentList();
            }).catch(error => {
              console.error('修改设备失败', error);
              this.$message.error('修改设备失败');
            });
          } else {
            // 新增设备
            addEquipment(this.equipmentForm).then(() => {
              this.$message.success('新增设备成功');
              this.equipmentFormDialogVisible = false;
              this.fetchEquipmentList();
            }).catch(error => {
              console.error('新增设备失败', error);
              this.$message.error('新增设备失败');
            });
          }
        }
      });
    },
    
    // 删除设备
    handleEquipmentDelete() {
      if (!this.selectedEquipment) {
        this.$message.warning('请选择要删除的设备');
        return;
      }
      
      this.$confirm('确认删除该设备记录吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteEquipment(this.selectedEquipment.id).then(() => {
          this.$message.success('删除成功');
          this.fetchEquipmentList();
          this.selectedEquipment = null;
        }).catch(error => {
          console.error('删除设备失败', error);
          this.$message.error('删除设备失败');
        });
      }).catch(() => {});
    },
    
    // 获取项目列表
    fetchProjects() {
      this.loadingProjects = true;
      getAllProjectsForEquipment()
        .then(response => {
          this.projects = response.data || [];
        })
        .catch(error => {
          console.error('获取项目列表失败', error);
          this.$message.error('获取项目列表失败');
        })
        .finally(() => {
          this.loadingProjects = false;
        });
    },
    
    // 获取工作人员列表（根据项目ID或获取所有）
    fetchWorkers(projectId) {
      this.loadingWorkers = true;
      
      if (projectId && this.useProjectWorkers) {
        // 获取指定项目的工作人员
        getProjectWorkersForEquipment(projectId)
          .then(response => {
            this.workers = response.data || [];
            // 如果没有项目成员，提示并切换到获取所有人员
            if (this.workers.length === 0) {
              this.$message.warning('该项目下没有工作人员，已切换为所有工作人员');
              this.useProjectWorkers = false;
              this.fetchWorkers();
            }
          })
          .catch(error => {
            console.error('获取项目工作人员失败', error);
            this.$message.error('获取项目工作人员失败');
          })
          .finally(() => {
            this.loadingWorkers = false;
          });
      } else {
        // 获取所有工作人员
        getAllWorkersForEquipment()
          .then(response => {
            this.workers = response.data || [];
          })
          .catch(error => {
            console.error('获取工作人员失败', error);
            this.$message.error('获取工作人员失败');
          })
          .finally(() => {
            this.loadingWorkers = false;
          });
      }
    },
    
    // 修改项目选择事件，实现联动
    handleProjectChange(projectId) {
      // 清空人员选择
      this.equipmentAssignForm.userId = '';
      
      if (projectId) {
        // 获取对应项目的工作人员
        this.fetchWorkers(projectId);
      } else {
        // 清空工作人员列表
        this.workers = [];
      }
    },
    
    // 切换是否使用项目工作人员
    toggleWorkerSource() {
      this.useProjectWorkers = !this.useProjectWorkers;
      
      if (this.equipmentAssignForm.projectId && this.useProjectWorkers) {
        // 如果有选择项目且需要项目工作人员，就获取项目工作人员
        this.fetchWorkers(this.equipmentAssignForm.projectId);
      } else {
        // 否则获取所有工作人员
        this.fetchWorkers();
      }
      
      // 清空人员选择
      this.equipmentAssignForm.userId = '';
    },
    
    // 分配设备
    handleAssignEquipment(row) {
      this.currentEquipment = row;
      this.equipmentAssignForm = {
        equipmentId: row.id,
        projectId: '',
        userId: '',
        startDate: '',
        expectedEndDate: '',
        purpose: '',
      };
      this.equipmentAssignDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.equipmentAssignFormRef?.resetFields();
      });
      
      // 重置使用项目工作人员的状态
      this.useProjectWorkers = true;
      
      // 清空工作人员列表
      this.workers = [];
      
      // 如果项目列表为空则加载
      if (this.projects.length === 0) {
        this.fetchProjects();
      }
    },
    
    // 提交设备分配
    submitEquipmentAssign() {
      this.$refs.equipmentAssignFormRef.validate((valid) => {
        if (valid) {
          assignEquipment(this.equipmentAssignForm).then(() => {
            this.$message.success('设备分配成功');
            this.equipmentAssignDialogVisible = false;
            this.fetchEquipmentList();
          }).catch(error => {
            console.error('设备分配失败', error);
            this.$message.error('设备分配失败');
          });
        }
      });
    },
    
    // 归还设备
    handleReturnEquipment(row) {
      this.$confirm('确认归还该设备吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        returnEquipment(row.id).then(() => {
          this.$message.success('设备归还成功');
          this.fetchEquipmentList();
        }).catch(error => {
          console.error('设备归还失败', error);
          this.$message.error('设备归还失败');
        });
      }).catch(() => {});
    },
    
    // 设备报修
    handleEquipmentMaintenance(row) {
      this.currentEquipment = row;
      this.maintenanceForm = {
        equipmentId: row.id,
        maintenanceType: '',
        startDate: '',
        description: '',
      };
      this.maintenanceDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.maintenanceFormRef?.resetFields();
      });
    },
    
    // 提交设备报修
    submitMaintenance() {
      this.$refs.maintenanceFormRef.validate((valid) => {
        if (valid) {
          reportMaintenance(this.maintenanceForm).then(() => {
            this.$message.success('设备报修成功');
            this.maintenanceDialogVisible = false;
            this.fetchEquipmentList();
          }).catch(error => {
            console.error('设备报修失败', error);
            this.$message.error('设备报修失败');
          });
        }
      });
    },
    
    // 查看设备详情
    handleEquipmentDetail(row) {
      getEquipmentDetail(row.id).then(response => {
        this.equipmentDetail = response.data;
        this.equipmentDetailDialogVisible = true;
        
        // 加载设备使用记录
        this.loadUsageRecords(row.id);
        
        // 加载设备维修记录
        this.loadMaintenanceRecords(row.id);
      }).catch(error => {
        console.error('获取设备详情失败', error);
        this.$message.error('获取设备详情失败');
      });
    },
    
    // 加载设备使用记录
    loadUsageRecords(equipmentId) {
      this.loadingUsageRecords = true;
      this.usageRecords = [];
      
      getEquipmentUsageRecords(equipmentId).then(response => {
        this.usageRecords = response.data || [];
      }).catch(error => {
        console.error('获取设备使用记录失败', error);
        this.$message.error('获取设备使用记录失败');
      }).finally(() => {
        this.loadingUsageRecords = false;
      });
    },
    
    // 加载设备维修记录
    loadMaintenanceRecords(equipmentId) {
      this.loadingMaintenanceRecords = true;
      this.maintenanceRecords = [];
      
      getEquipmentMaintenanceRecords(equipmentId).then(response => {
        this.maintenanceRecords = response.data || [];
      }).catch(error => {
        console.error('获取设备维修记录失败', error);
        this.$message.error('获取设备维修记录失败');
      }).finally(() => {
        this.loadingMaintenanceRecords = false;
      });
    },
    
    // 完成维修
    handleCompleteMaintenance(row) {
      this.currentMaintenance = row;
      this.maintenanceCompleteForm = {
        id: row.id,
        endDate: new Date().toISOString().substring(0, 10), // 默认当天
        resultType: '1', // 默认成功
        result: '',
        cost: null
      };
      this.maintenanceCompleteDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.maintenanceCompleteFormRef?.resetFields();
      });
    },
    
    // 提交维修完成
    submitMaintenanceComplete() {
      this.$refs.maintenanceCompleteFormRef.validate((valid) => {
        if (valid) {
          // 如果是报废，再次确认
          if (this.maintenanceCompleteForm.resultType === '2') {
            this.$confirm('您选择了将设备报废，确认继续？', '提示', {
              confirmButtonText: '确定',
              cancelButtonText: '取消',
              type: 'warning'
            }).then(() => {
              this.doSubmitMaintenanceComplete();
            }).catch(() => {});
          } else {
            // 直接提交
            this.doSubmitMaintenanceComplete();
          }
        }
      });
    },
    
    // 执行提交维修完成
    doSubmitMaintenanceComplete() {
      completeEquipmentMaintenance(this.maintenanceCompleteForm).then(() => {
        const successMsg = this.maintenanceCompleteForm.resultType === '1' ? 
          '维修完成成功，设备已恢复正常' : 
          '维修完成，设备已标记为报废';
        this.$message.success(successMsg);
        this.maintenanceCompleteDialogVisible = false;
        
        // 刷新设备列表和详情
        this.fetchEquipmentList();
        if (this.equipmentDetail) {
          this.loadMaintenanceRecords(this.equipmentDetail.id);
        }
      }).catch(error => {
        console.error('维修完成失败', error);
        this.$message.error('维修完成失败');
      });
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

.equipment-assign, .equipment-maintenance, .equipment-detail, .maintenance-complete {
  margin-top: 10px;
}

.assignment-form, .maintenance-form, .maintenance-complete-form {
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