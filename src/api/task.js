import { get, post, put, del } from '../utils/request.js'

/**
 * 获取任务列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getTaskList(params) {
  return post('/api/task/list', params)
}

/**
 * 获取我的任务列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getMyTaskList(params) {
  return post('/api/task/my/list', params)
}

/**
 * 获取任务详情
 * @param {Number} id 任务ID
 * @returns {Promise}
 */
export function getTaskById(id) {
  return get(`/api/task/get/${id}`)
}

/**
 * 新增任务
 * @param {Object} data 任务数据
 * @returns {Promise}
 */
export function addTask(data) {
  return post('/api/task/add', data)
}

/**
 * 修改任务
 * @param {Object} data 任务数据
 * @returns {Promise}
 */
export function updateTask(data) {
  return put('/api/task/update', data)
}

/**
 * 删除任务
 * @param {Number} id 任务ID
 * @returns {Promise}
 */
export function deleteTask(id) {
  return del(`/api/task/delete/${id}`)
}

/**
 * 更新任务进度
 * @param {Number} taskId 任务ID
 * @param {Number} progress 进度
 * @param {String} status 状态
 * @returns {Promise}
 */
export function updateTaskProgress(taskId, progress, status) {
  return put(`/api/task/progress?taskId=${taskId}&progress=${progress}${status ? `&status=${status}` : ''}`)
}

/**
 * 获取任务统计数据
 * @param {Object} params 统计参数
 * @returns {Promise}
 */
export function getTaskStats(params) {
  return post('/api/task/stats', params)
}

/**
 * 获取任务统计摘要
 * @param {Object} params 统计参数
 * @returns {Promise}
 */
export function getTaskSummary(params) {
  return post('/api/task/summary', params)
}

/**
 * 获取完成率排名
 * @param {Object} params 统计参数
 * @returns {Promise}
 */
export function getCompletionRank(params) {
  return post('/api/task/rank', params)
}