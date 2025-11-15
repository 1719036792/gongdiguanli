import request from '../utils/request.js'

/**
 * 获取概览数据
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getOverviewData(params) {
  return request({
    url: '/api/dashboard/overview',
    method: 'get',
    params
  })
}

/**
 * 获取生产任务趋势
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getProductionTrend(params) {
  return request({
    url: '/api/dashboard/production/trend',
    method: 'get',
    params
  })
}

/**
 * 获取产品合格率分布
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getQualityDistribution(params) {
  return request({
    url: '/api/dashboard/quality/distribution',
    method: 'get',
    params
  })
}

/**
 * 获取库存状态分布
 * @returns {Promise}
 */
export function getInventoryStatus() {
  return request({
    url: '/api/dashboard/inventory/status',
    method: 'get'
  })
}

/**
 * 获取返修任务趋势
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getReworkTrend(params) {
  return request({
    url: '/api/dashboard/rework/trend',
    method: 'get',
    params
  })
} 