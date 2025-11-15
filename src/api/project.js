import { get, post, put, del } from '../utils/request.js'

/**
 * 分页查询项目列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getProjectList(params) {
  return post('/api/project/list', params)
}

/**
 * 获取项目详情
 * @param {Number} id 项目ID
 * @returns {Promise}
 */
export function getProjectDetail(id) {
  return get(`/api/project/get/${id}`)
}

/**
 * 新增项目
 * @param {Object} data 项目数据
 * @returns {Promise}
 */
export function addProject(data) {
  return post('/api/project/add', data)
}

/**
 * 修改项目
 * @param {Object} data 项目数据
 * @returns {Promise}
 */
export function updateProject(data) {
  return put('/api/project/update', data)
}

/**
 * 删除项目
 * @param {Number} id 项目ID
 * @returns {Promise}
 */
export function deleteProject(id) {
  return del(`/api/project/delete/${id}`)
}

/**
 * 获取项目成员
 * @param {Number} projectId 项目ID
 * @returns {Promise}
 */
export function getProjectMembers(projectId) {
  return get(`/api/project/members/${projectId}`)
}

/**
 * 分配项目成员
 * @param {Object} data 分配数据
 * @returns {Promise}
 */
export function assignProjectMembers(data) {
  return post('/api/project/assignMembers', data)
}

/**
 * 手动更新项目进度
 * @param {Number} projectId 项目ID
 * @returns {Promise}
 */
export function updateProjectProgress(projectId) {
  return put(`/api/project/updateProgress/${projectId}`)
}

/**
 * 获取所有项目(用于设备分配选择)
 * @returns {Promise}
 */
export function getAllProjectsForEquipment() {
  return get('/api/project/getAllProjectsForEquipment')
}

/**
 * 获取项目下的工作人员(用于设备分配选择)
 * @param {Number} projectId 项目ID
 * @returns {Promise}
 */
export function getProjectWorkersForEquipment(projectId) {
  return get(`/api/project/getProjectWorkersForEquipment/${projectId}`)
}

/**
 * 获取所有工作人员(用于设备分配选择)
 * @returns {Promise}
 */
export function getAllWorkersForEquipment() {
  return get('/api/project/getAllWorkersForEquipment')
}