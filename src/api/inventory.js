import { get, post, put, del } from '../utils/request.js'

/**
 * 获取库存列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getInventoryList(params) {
  return post('/inventory/list', params)
}

/**
 * 根据ID获取库存详情
 * @param {Number} id - 库存ID
 * @returns {Promise}
 */
export function getInventoryById(id) {
  return get(`/inventory/get/${id}`)
}

/**
 * 新增库存
 * @param {Object} data - 库存数据
 * @returns {Promise}
 */
export function addInventory(data) {
  return post('/inventory/add', data)
}

/**
 * 更新库存
 * @param {Object} data - 库存数据
 * @returns {Promise}
 */
export function updateInventory(data) {
  return put('/inventory/update', data)
}

/**
 * 删除库存
 * @param {Number} id - 库存ID
 * @returns {Promise}
 */
export function deleteInventory(id) {
  return del(`/inventory/delete/${id}`)
}

/**
 * 获取出库记录列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
export function getOutboundList(params) {
  return post('/api/inventory-outbound/list',  params)
} 