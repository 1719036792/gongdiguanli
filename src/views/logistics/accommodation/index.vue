<template>
  <div class="app-container">
    <div class="toolbar">
      <el-button type="primary" @click="handleAccommodationAdd">
        <el-icon><Plus /></el-icon>新增住宿
      </el-button>
      <el-button type="warning" @click="handleAccommodationModify" :disabled="!selectedAccommodation">
        <el-icon><Edit /></el-icon>修改住宿
      </el-button>
      <el-button type="danger" @click="handleAccommodationDelete" :disabled="!selectedAccommodation">
        <el-icon><Delete /></el-icon>删除住宿
      </el-button>
      <el-form inline class="toolbar-form">
        <el-form-item label="房间号">
          <el-input v-model="accommodationQueryParams.roomNumber" placeholder="请输入房间号" clearable @keyup.enter="handleAccommodationQuery" />
        </el-form-item>
        <el-form-item label="住宿状态">
          <el-select v-model="accommodationQueryParams.status" placeholder="请选择状态" clearable>
            <el-option label="空闲" value="1" />
            <el-option label="已分配" value="2" />
            <el-option label="维修中" value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAccommodationQuery">
            <el-icon><Search /></el-icon>查询
          </el-button>
          <el-button @click="resetAccommodationQuery">
            <el-icon><Refresh /></el-icon>重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 住宿列表 -->
    <el-table :data="accommodationData" border style="width: 100%" @row-click="handleAccommodationRowClick" highlight-current-row v-loading="accommodationLoading">
      <el-table-column type="selection" width="55" />
      <el-table-column prop="roomNumber" label="房间号" width="100" />
      <el-table-column prop="building" label="楼栋" width="100" />
      <el-table-column prop="floor" label="楼层" width="80" />
      <el-table-column prop="type" label="房间类型" width="100">
        <template #default="scope">
          <span v-if="scope.row.type === '1'">单人间</span>
          <span v-else-if="scope.row.type === '2'">双人间</span>
          <span v-else-if="scope.row.type === '3'">四人间</span>
          <span v-else-if="scope.row.type === '4'">六人间</span>
          <span v-else>其他</span>
        </template>
      </el-table-column>
      <el-table-column prop="capacity" label="容纳人数" width="100" />
      <el-table-column prop="occupied" label="已住人数" width="100" />
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag v-if="scope.row.status === '1'">空闲</el-tag>
          <el-tag type="success" v-else-if="scope.row.status === '2'">已分配</el-tag>
          <el-tag type="warning" v-else-if="scope.row.status === '3'">维修中</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="facilities" label="设施" min-width="200" />
      <el-table-column label="操作" width="280">
        <template #default="scope">
          <el-button type="primary" link @click.stop="handleAssignRoom(scope.row)" :disabled="scope.row.status === '3' || scope.row.occupied >= scope.row.capacity">
            <el-icon><UserFilled /></el-icon>分配
          </el-button>
          <el-button type="info" link @click.stop="handleRoomDetail(scope.row)">
            <el-icon><View /></el-icon>详情
          </el-button>
          <el-button type="warning" link @click.stop="handleRoomMaintenance(scope.row)" :disabled="scope.row.status === '3'">
            <el-icon><Tools /></el-icon>报修
          </el-button>
          <el-button type="success" link v-if="scope.row.status === '3'" @click.stop="handleRoomRestore(scope.row)">
            <el-icon><Check /></el-icon>恢复
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="accommodationPageNo"
        v-model:page-size="accommodationPageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="accommodationTotal"
        @size-change="handleAccommodationSizeChange"
        @current-change="handleAccommodationCurrentChange"
      />
    </div>

    <!-- 住宿管理相关弹窗 -->
    <!-- 新增/修改住宿弹窗 -->
    <el-dialog
      v-model="accommodationDialogVisible"
      :title="accommodationDialogType === 'add' ? '新增住宿' : '修改住宿'"
      width="550px"
    >
      <el-form :model="accommodationForm" :rules="accommodationRules" ref="accommodationFormRef" label-width="100px">
        <el-form-item label="房间号" prop="roomNumber">
          <el-input v-model="accommodationForm.roomNumber" placeholder="请输入房间号" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="楼栋" prop="building">
              <el-input v-model="accommodationForm.building" placeholder="请输入楼栋" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="楼层" prop="floor">
              <el-input v-model="accommodationForm.floor" placeholder="请输入楼层" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="房间类型" prop="type">
          <el-select v-model="accommodationForm.type" placeholder="请选择房间类型" style="width: 100%">
            <el-option label="单人间" value="1" />
            <el-option label="双人间" value="2" />
            <el-option label="四人间" value="3" />
            <el-option label="六人间" value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="容纳人数" prop="capacity">
          <el-input-number v-model="accommodationForm.capacity" :min="1" :max="20" style="width: 100%" />
        </el-form-item>
        <el-form-item label="设施" prop="facilities">
          <el-input v-model="accommodationForm.facilities" placeholder="请输入房间设施，如空调、电视等" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="accommodationForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="空闲" value="1" />
            <el-option label="已分配" value="2" />
            <el-option label="维修中" value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="accommodationDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAccommodationForm">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 房间分配弹窗 -->
    <el-dialog
      v-model="roomAssignDialogVisible"
      title="房间分配"
      width="550px"
    >
      <div v-if="currentRoom" class="room-assign">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="房间号">{{ currentRoom.roomNumber }}</el-descriptions-item>
          <el-descriptions-item label="楼栋/楼层">{{ currentRoom.building }}/{{ currentRoom.floor }}</el-descriptions-item>
          <el-descriptions-item label="房间类型">
            <span v-if="currentRoom.type === '1'">单人间</span>
            <span v-else-if="currentRoom.type === '2'">双人间</span>
            <span v-else-if="currentRoom.type === '3'">四人间</span>
            <span v-else-if="currentRoom.type === '4'">六人间</span>
          </el-descriptions-item>
          <el-descriptions-item label="容纳/已住">
            {{ currentRoom.capacity }}/{{ currentRoom.occupied }}
            <el-progress
              :percentage="calculateRoomOccupancyRate(currentRoom)"
              :status="isRoomFull(currentRoom) ? 'exception' : 'success'"
            ></el-progress>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="worker-selection">
          <h4>选择工人</h4>
          <el-form :model="roomAssignForm" ref="roomAssignFormRef" label-width="100px">
            <el-form-item label="工人" prop="workerId">
              <el-select v-model="roomAssignForm.workerId" placeholder="请选择工人" style="width: 100%" v-loading="workersLoading">
                <el-option
                  v-for="worker in workers"
                  :key="worker.id"
                  :label="worker.name"
                  :value="worker.id"
                  :disabled="isWorkerAssigned(worker.id)"
                >
                  <div class="worker-option">
                    <span>{{ worker.name }}</span>
                    <span class="worker-department">{{ worker.department }}</span>
                    <el-tag size="small" type="danger" v-if="isWorkerAssigned(worker.id)">已分配</el-tag>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="入住日期" prop="startDate">
              <el-date-picker
                v-model="roomAssignForm.startDate"
                type="date"
                placeholder="选择入住日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="备注">
              <el-input
                v-model="roomAssignForm.remark"
                type="textarea"
                :rows="2"
                placeholder="请输入备注信息"
              />
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roomAssignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRoomAssign">确认分配</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 房间详情弹窗 -->
    <el-dialog
      v-model="roomDetailDialogVisible"
      title="房间详情"
      width="700px"
    >
      <div v-if="currentRoom" class="room-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="房间号">{{ currentRoom.roomNumber }}</el-descriptions-item>
          <el-descriptions-item label="楼栋">{{ currentRoom.building }}</el-descriptions-item>
          <el-descriptions-item label="楼层">{{ currentRoom.floor }}</el-descriptions-item>
          <el-descriptions-item label="房间类型">
            <span v-if="currentRoom.type === '1'">单人间</span>
            <span v-else-if="currentRoom.type === '2'">双人间</span>
            <span v-else-if="currentRoom.type === '3'">四人间</span>
            <span v-else-if="currentRoom.type === '4'">六人间</span>
          </el-descriptions-item>
          <el-descriptions-item label="容纳人数">{{ currentRoom.capacity }}</el-descriptions-item>
          <el-descriptions-item label="已住人数">{{ currentRoom.occupied }}</el-descriptions-item>
          <el-descriptions-item label="状态" :span="2">
            <el-tag v-if="currentRoom.status === '1'">空闲</el-tag>
            <el-tag type="success" v-else-if="currentRoom.status === '2'">已分配</el-tag>
            <el-tag type="warning" v-else-if="currentRoom.status === '3'">维修中</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="设施" :span="2">{{ currentRoom.facilities }}</el-descriptions-item>
          <el-descriptions-item label="创建时间" :span="2">{{ currentRoom.createdTime }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="assignment-history" v-if="roomAssignments && roomAssignments.length > 0">
          <h4>分配记录</h4>
          <el-table :data="roomAssignments" border style="width: 100%; margin-top: 10px;">
            <el-table-column prop="workerId" label="工人ID" width="80" />
            <el-table-column label="工人姓名" width="100">
              <template #default="scope">
                {{ getWorkerName(scope.row.workerId) || '未知' }}
              </template>
            </el-table-column>
            <el-table-column prop="startDate" label="入住日期" width="120" />
            <el-table-column prop="endDate" label="退房日期" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.status === '1'">在住</el-tag>
                <el-tag type="info" v-else-if="scope.row.status === '2'">已退房</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150" />
            <el-table-column prop="createdTime" label="创建时间" width="160" />
          </el-table>
        </div>
        <div class="no-data" v-else>
          <el-empty description="暂无分配记录" />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roomDetailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { 
  getAccommodationList, 
  getAccommodationById, 
  addAccommodation, 
  updateAccommodation, 
  deleteAccommodation, 
  setRoomMaintenance, 
  assignRoom, 
  getRoomAssignments,
  restoreRoomFromMaintenance
} from '../../../api/accommodation.js';
import { getUnassignedEmployees } from '../../../api/employee.js';

export default {
  data() {
    return {
      accommodationQueryParams: {
        roomNumber: '',
        status: '',
      },
      accommodationData: [],
      accommodationLoading: false,
      accommodationPageNo: 1,
      accommodationPageSize: 10,
      accommodationTotal: 0,
      selectedAccommodation: null,
      accommodationDialogVisible: false,
      accommodationDialogType: 'add',
      accommodationForm: {
        id: null,
        roomNumber: '',
        building: '',
        floor: '',
        type: '',
        capacity: 1,
        facilities: '',
        status: '1',
      },
      accommodationRules: {
        roomNumber: [{ required: true, message: '请输入房间号', trigger: 'blur' }],
        building: [{ required: true, message: '请输入楼栋', trigger: 'blur' }],
        floor: [{ required: true, message: '请输入楼层', trigger: 'blur' }],
        type: [{ required: true, message: '请选择房间类型', trigger: 'change' }],
        capacity: [{ required: true, message: '请输入容纳人数', trigger: 'blur' }],
        facilities: [{ required: true, message: '请输入房间设施', trigger: 'blur' }],
        status: [{ required: true, message: '请选择状态', trigger: 'change' }],
      },
      accommodationFormRef: null,
      roomAssignDialogVisible: false,
      currentRoom: null,
      roomAssignForm: {
        roomId: null,
        workerId: '',
        startDate: '',
        remark: '',
      },
      roomAssignFormRef: null,
      workers: [],
      workersLoading: false,
      assignedWorkers: [], // 已分配工人ID列表
      roomDetailDialogVisible: false,
      roomAssignments: []
    }
  },
  mounted() {
    this.fetchAccommodationList();
    this.fetchWorkers();
  },
  methods: {
    // 查询住宿列表
    fetchAccommodationList() {
      this.accommodationLoading = true;
      
      const params = {
        pageNo: this.accommodationPageNo,
        pageSize: this.accommodationPageSize,
        ...this.accommodationQueryParams
      };
      
      getAccommodationList(params).then(res => {
        const { data } = res;
        this.accommodationData = data.list;
        this.accommodationTotal = data.total;
      }).finally(() => {
        this.accommodationLoading = false;
      });
    },
    
    // 获取工人列表
    fetchWorkers() {
      this.workersLoading = true;
      
      const params = {
        pageNo: 1,
        pageSize: 100 // 获取足够的数据，实际项目可能需要更复杂的加载策略
      };
      
      getUnassignedEmployees(params).then(res => {
        const { data } = res;
        if (data && data.list) {
          this.workers = data.list.map(item => ({
            id: item.id,
            name: item.name,
            department: item.department || '未分配部门'
          }));
        }
      }).finally(() => {
        this.workersLoading = false;
      });
    },
    
    handleAccommodationQuery() {
      this.accommodationPageNo = 1;
      this.fetchAccommodationList();
    },
    
    resetAccommodationQuery() {
      this.accommodationQueryParams.roomNumber = '';
      this.accommodationQueryParams.status = '';
      this.handleAccommodationQuery();
    },
    
    handleAccommodationRowClick(row) {
      this.selectedAccommodation = row;
    },
    
    handleAccommodationSizeChange(size) {
      this.accommodationPageSize = size;
      this.fetchAccommodationList();
    },
    
    handleAccommodationCurrentChange(page) {
      this.accommodationPageNo = page;
      this.fetchAccommodationList();
    },
    
    handleAccommodationAdd() {
      this.accommodationDialogType = 'add';
      this.accommodationForm = {
        id: null,
        roomNumber: '',
        building: 'A楼',
        floor: '',
        type: '',
        capacity: 1,
        facilities: '',
        status: '1',
      };
      this.accommodationDialogVisible = true;
      this.$nextTick(() => {
        this.$refs.accommodationFormRef?.resetFields();
      });
    },
    
    handleAccommodationModify() {
      if (!this.selectedAccommodation) {
        this.$message.warning('请选择要修改的住宿');
        return;
      }
      this.accommodationDialogType = 'edit';
      const item = this.selectedAccommodation;
      this.accommodationForm = { ...item };
      this.accommodationDialogVisible = true;
    },
    
    handleAccommodationDelete() {
      if (!this.selectedAccommodation) {
        this.$message.warning('请选择要删除的住宿');
        return;
      }
      this.$confirm('确认删除该住宿记录吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteAccommodation(this.selectedAccommodation.id).then(() => {
          this.$message.success('删除成功');
          this.fetchAccommodationList();
          this.selectedAccommodation = null;
        }).catch(() => {
          this.$message.error('删除失败');
        });
      }).catch(() => {});
    },
    
    submitAccommodationForm() {
      this.$refs.accommodationFormRef.validate((valid) => {
        if (valid) {
          const formData = { ...this.accommodationForm };
          
          if (this.accommodationDialogType === 'add') {
            addAccommodation(formData).then(() => {
              this.$message.success('新增成功');
              this.accommodationDialogVisible = false;
              this.fetchAccommodationList();
            }).catch(() => {
              this.$message.error('新增失败');
            });
          } else {
            updateAccommodation(formData).then(() => {
              this.$message.success('修改成功');
              this.accommodationDialogVisible = false;
              this.fetchAccommodationList();
            }).catch(() => {
              this.$message.error('修改失败');
            });
          }
        }
      });
    },
    
    handleAssignRoom(row) {
      if (row.status === '3') {
        this.$message.warning('维修中的房间不能分配');
        return;
      }
      
      if (row.occupied >= row.capacity) {
        this.$message.warning('该房间已住满，不能继续分配');
        return;
      }
      
      this.currentRoom = row;
      this.roomAssignForm = {
        roomId: row.id,
        workerId: '',
        startDate: '',
        remark: '',
      };
      
      // 获取该房间已分配的工人列表
      this.getAssignedWorkers(row.id);
      
      this.roomAssignDialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.roomAssignFormRef) {
          this.$refs.roomAssignFormRef.resetFields();
          // 设置表单校验规则
          this.$refs.roomAssignFormRef.clearValidate();
          // 设置校验规则
          this.$refs.roomAssignFormRef.rules = {
            workerId: [{ required: true, message: '请选择工人', trigger: 'change' }],
            startDate: [{ required: true, message: '请选择入住日期', trigger: 'change' }]
          };
        }
      });
    },
    
    // 获取已分配的工人列表
    getAssignedWorkers(roomId) {
      getRoomAssignments(roomId).then(res => {
        const assignments = res.data || [];
        // 提取状态为"在住"的工人ID
        this.assignedWorkers = assignments
          .filter(item => item.status === '1')
          .map(item => item.workerId.toString());
      }).catch(() => {
        this.assignedWorkers = [];
      });
    },
    
    // 判断工人是否已分配
    isWorkerAssigned(workerId) {
      return this.assignedWorkers.includes(workerId.toString());
    },
    
    submitRoomAssign() {
      this.$refs.roomAssignFormRef.validate((valid) => {
        if (valid) {
          // 检查该工人是否已经分配到这个房间
          if (this.isWorkerAssigned(this.roomAssignForm.workerId)) {
            this.$message.warning('该工人已分配到此房间，不能重复分配');
            return;
          }
          
          assignRoom(this.roomAssignForm).then(() => {
            this.$message.success('房间分配成功');
            this.roomAssignDialogVisible = false;
            
            // 更新房间状态
            if (this.currentRoom) {
              this.currentRoom.occupied++;
              if (this.currentRoom.status === '1') {
                this.currentRoom.status = '2';
              }
            }
            
            // 刷新房间分配列表
            this.fetchAccommodationList();
            
            // 如果房间没住满，可以继续分配
            if (this.currentRoom && this.currentRoom.occupied < this.currentRoom.capacity) {
              this.$confirm('房间分配成功，是否继续分配?', '提示', {
                confirmButtonText: '继续分配',
                cancelButtonText: '关闭',
                type: 'info'
              }).then(() => {
                this.handleAssignRoom(this.currentRoom);
              }).catch(() => {
                // 用户选择不继续分配，无需操作
              });
            } else {
              this.$message.warning(`房间已住满(${this.currentRoom.occupied}/${this.currentRoom.capacity})，不能继续分配`);
            }
          }).catch(error => {
            this.$message.error(error.message || '房间分配失败');
          });
        }
      });
    },
    
    handleRoomMaintenance(row) {
      this.$confirm('确认将该房间标记为维修状态吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        setRoomMaintenance(row.id).then(() => {
          this.$message.success('房间已标记为维修状态');
          this.fetchAccommodationList();
        }).catch(() => {
          this.$message.error('设置维修状态失败');
        });
      }).catch(() => {});
    },
    
    handleRoomDetail(row) {
      this.currentRoom = row;
      this.roomDetailDialogVisible = true;
      
      // 确保有工人数据
      if (this.workers.length === 0) {
        this.fetchWorkers();
      }
      
      // 获取房间分配记录
      getRoomAssignments(row.id).then(res => {
        this.roomAssignments = res.data || [];
      }).catch(() => {
        this.roomAssignments = [];
        this.$message.error('获取分配记录失败');
      });
    },
    
    getWorkerName(workerId) {
      const worker = this.workers.find(w => w.id === workerId);
      return worker ? worker.name : null;
    },
    
    calculateRoomOccupancyRate(room) {
      if (room.occupied === 0) return 0;
      if (room.occupied === room.capacity) return 100;
      return (room.occupied / room.capacity) * 100;
    },
    
    isRoomFull(room) {
      return room.occupied >= room.capacity;
    },
    
    handleRoomRestore(row) {
      this.$confirm('确认将该房间恢复为空闲状态吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        restoreRoomFromMaintenance(row.id).then(() => {
          this.$message.success('房间已恢复为空闲状态');
          this.fetchAccommodationList();
        }).catch(() => {
          this.$message.error('恢复房间状态失败');
        });
      }).catch(() => {});
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

.room-assign, .room-detail {
  margin-top: 10px;
}

.assignment-history {
  margin-top: 20px;
}

.worker-selection {
  margin-top: 20px;
}

.worker-option {
  display: flex;
  align-items: center;
}

.worker-department {
  color: #999;
  margin-left: 10px;
  flex: 1;
}

h4 {
  margin: 10px 0;
  font-weight: 500;
  color: #606266;
}

.el-input-number {
  width: 100%;
}

.el-form-item {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.no-data {
  margin-top: 20px;
}
</style> 