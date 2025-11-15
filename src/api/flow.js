import { get, post, put, del } from '../utils/request.js'
/**
 * 获取流程定义列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getFlowDefinitionList(params) {
  return get('/api/flow/definition/list', params)
}

/**
 * 添加流程定义
 * @param {Object} data 流程定义数据
 * @returns {Promise}
 */
export function addFlowDefinition(data) {
  return post('/api/flow/definition/add', data)
}

/**
 * 修改流程定义
 * @param {Object} data 流程定义数据
 * @returns {Promise}
 */
export function updateFlowDefinition(data) {
  return put('/api/flow/definition/update', data)
}

/**
 * 删除流程定义
 * @param {Number} id 流程定义ID
 * @returns {Promise}
 */
export function deleteFlowDefinition(id) {
  return del(`/api/flow/definition/delete/${id}`)
}

/**
 * 获取流程定义详情
 * @param {Number} id 流程定义ID
 * @returns {Promise}
 */
export function getFlowDefinitionDetail(id) {
  return get(`/api/flow/definition/detail/${id}`)
}

/**
 * 发布流程定义
 * @param {Number} id 流程定义ID
 * @returns {Promise}
 */
export function publishFlowDefinition(id) {
  return put(`/api/flow/definition/publish/${id}`)
}

/**
 * 取消发布流程定义
 * @param {Number} id 流程定义ID
 * @returns {Promise}
 */
export function unpublishFlowDefinition(id) {
  return post(`/api/flow/definition/unpublish/${id}`)
}

/**
 * 获取流程图数据
 * @param {Number} instanceId 流程实例ID
 * @returns {Promise}
 */
export function getFlowChart(instanceId) {
  return get(`/api/follow/flowChart/${instanceId}`)
}

/**
 * 获取流程记录
 * @param {Number} instanceId 流程实例ID
 * @returns {Promise}
 */
export function getFlowRecords(instanceId) {
  return get(`/api/flow/records/${instanceId}`)
} 