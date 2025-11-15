import { get, post, put, del } from '../utils/request.js'

/**
 * 分页查询住宿列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getAccommodationList(params) {
  return post('/api/accommodation/page', params)
}

/**
 * 根据ID查询住宿详情
 * @param {Number} id 住宿ID
 * @returns {Promise}
 */
export function getAccommodationById(id) {
  return get(`/api/accommodation/get/${id}`)
}

/**
 * 新增住宿
 * @param {Object} data 住宿数据
 * @returns {Promise}
 */
export function addAccommodation(data) {
  return post('/api/accommodation/add', data)
}

/**
 * 修改住宿
 * @param {Object} data 住宿数据
 * @returns {Promise}
 */
export function updateAccommodation(data) {
  return put('/api/accommodation/update', data)
}

/**
 * 删除住宿
 * @param {Number} id 住宿ID
 * @returns {Promise}
 */
export function deleteAccommodation(id) {
  return del(`/api/accommodation/delete/${id}`)
}

/**
 * 报修房间
 * @param {Number} id 住宿ID
 * @returns {Promise}
 */
export function setRoomMaintenance(id) {
  return post(`/api/accommodation/maintenance/${id}`)
}

/**
 * 分配房间
 * @param {Object} data 分配数据
 * @returns {Promise}
 */
export function assignRoom(data) {
  return post('/api/accommodation/assign', data)
}

/**
 * 查询房间分配记录
 * @param {Number} roomId 房间ID
 * @returns {Promise}
 */
export function getRoomAssignments(roomId) {
  return get(`/api/accommodation/assignments/${roomId}`)
}

/**
 * 恢复房间（从维修状态恢复为空闲状态）
 * @param {Number} id 住宿ID
 * @returns {Promise}
 */
export function restoreRoomFromMaintenance(id) {
  return post(`/api/accommodation/restore/${id}`)
} 