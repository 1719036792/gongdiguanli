import { get, post, put, del } from '../utils/request.js'

/**
 * 获取请假申请列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getLeaveList(params) {
  return post('/api/leaveApplication/my/list', params)
}

/**
 * 获取待审批的请假列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getWaitingApprovalList(params) {
  return get('/api/leaveApplication/wait/list', params)
}

/** 
 * 取消请假申请
 * @param {Object} data 请假申请数据
 * @returns {Promise}
 */
export function cancelLeaveApplication(id) {
  return post(`/api/leaveApplication/cancel/${id}`)
}

/**
 * 提交请假申请
 * @param {Object} data 请假申请数据
 * @returns {Promise}
 */
export function submitLeaveApplication(data) {
  return post('/api/leaveApplication/add', data)
}

/**
 * 审批请假申请
 * @param {Object} data 审批数据
 * @returns {Promise}
 */
export function approveLeaveApplication(data) {
  return post('/api/leaveApplication/approve', data)
}

