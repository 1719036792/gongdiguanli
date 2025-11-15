import { get, post, put, del } from '../utils/request.js'

/**
 * 获取员工列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getEmployeeList(params) {
  return post('/api/employee/page', params)
}

/**
 * 获取员工详情
 * @param {Number} id 员工ID
 * @returns {Promise}
 */
export function getEmployeeById(id) {
  return get(`/api/employee/get/${id}`)
}

/**
 * 新增员工
 * @param {Object} data - 员工数据
 * @returns {Promise}
 */
export function addEmployee(data) {
  return post('/api/employee/add', data)
}

/**
 * 更新员工信息
 * @param {Object} data - 员工数据
 * @returns {Promise}
 */
export function updateEmployee(data) {
  return put('/api/employee/update', data)
}

/**
 * 删除员工
 * @param {Number} id - 员工ID
 * @returns {Promise}
 */
export function deleteEmployee(id) {
  return del(`/api/employee/delete/${id}`)
}

/**
 * 批量删除员工
 * @param {Array} ids - 员工ID数组
 * @returns {Promise}
 */
export function batchDeleteEmployees(ids) {
  return post('/api/employee/batch/delete', ids)
}

/**
 * 批量添加员工
 * @param {Array} employees - 员工数据数组
 * @returns {Promise}
 */
export function batchAddEmployees(employees) {
  return post('/api/employee/batch/add', employees)
}

/**
 * 获取未分配住宿的员工列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getUnassignedEmployees(params) {
  return post('/api/employee/unassigned', params)
} 