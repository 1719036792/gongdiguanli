import { get, post, put, del } from '../utils/request.js'

/**
 * 分页查询设备列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getEquipmentList(params) {
  return post('/api/equipment/page', params)
}

/**
 * 获取设备详情
 * @param {Number} id 设备ID
 * @returns {Promise}
 */
export function getEquipmentDetail(id) {
  return get(`/api/equipment/detail/${id}`)
}

/**
 * 新增设备
 * @param {Object} data 设备数据
 * @returns {Promise}
 */
export function addEquipment(data) {
  return post('/api/equipment/add', data)
}

/**
 * 修改设备
 * @param {Object} data 设备数据
 * @returns {Promise}
 */
export function updateEquipment(data) {
  return post('/api/equipment/update', data)
}

/**
 * 删除设备
 * @param {Number} id 设备ID
 * @returns {Promise}
 */
export function deleteEquipment(id) {
  return del(`/api/equipment/delete/${id}`)
}

/**
 * 分配设备
 * @param {Object} data 分配数据
 * @returns {Promise}
 */
export function assignEquipment(data) {
  return post('/api/equipment/assign', data)
}

/**
 * 归还设备
 * @param {Number} id 设备ID
 * @returns {Promise}
 */
export function returnEquipment(id) {
  return post(`/api/equipment/return/${id}`)
}

/**
 * 报修设备
 * @param {Object} data 维修数据
 * @returns {Promise}
 */
export function reportMaintenance(data) {
  return post('/api/equipment/maintenance', data)
}

/**
 * 获取设备最新的使用记录
 * @param {Number} equipmentId 设备ID
 * @returns {Promise}
 */
export function getLatestEquipmentUsage(equipmentId) {
  return get(`/api/equipment/usage/latest/${equipmentId}`)
}

/**
 * 获取设备使用记录列表
 * @param {Number} equipmentId 设备ID
 * @returns {Promise}
 */
export function getEquipmentUsageRecords(equipmentId) {
  return get(`/api/equipment/usage/list/${equipmentId}`)
}

/**
 * 获取设备维修记录列表
 * @param {Number} equipmentId 设备ID
 * @returns {Promise}
 */
export function getEquipmentMaintenanceRecords(equipmentId) {
  return get(`/api/equipment/maintenance/list/${equipmentId}`)
}

/**
 * 完成设备维修
 * @param {Object} data 维修完成数据
 * @returns {Promise}
 */
export function completeEquipmentMaintenance(data) {
  return post('/api/equipment/maintenance/complete', data)
} 