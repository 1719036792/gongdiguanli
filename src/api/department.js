import { get, post, put, del } from '../utils/request.js'

/**
 * 获取部门列表（分页）
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getDepartmentList(params) {
  return post('/api/department/page', params)
}

/**
 * 获取部门树形结构
 * @returns {Promise}
 */
export function getDepartmentTree() {
  return get('/api/department/tree')
}

/**
 * 获取部门详情
 * @param {Number} id 部门ID
 * @returns {Promise}
 */
export function getDepartmentDetail(id) {
  return get(`/api/department/${id}`)
}

/**
 * 新增部门
 * @param {Object} data 部门数据
 * @returns {Promise}
 */
export function addDepartment(data) {
  return post('/api/department/add', data)
}

/**
 * 更新部门
 * @param {Object} data 部门数据
 * @returns {Promise}
 */
export function updateDepartment(data) {
  return put('/api/department/update', data)
}

/**
 * 删除部门
 * @param {Number} id 部门ID
 * @returns {Promise}
 */
export function deleteDepartment(id) {
  return del(`/api/department/${id}`)
} 