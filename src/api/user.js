import { get, post, put, del } from '../utils/request.js'

/**
 * 用户登录
 * @param {Object} data 登录数据
 * @returns {Promise}
 */
export function login(data) {
  return post('/api/noLogin/login', data)
}

/**
 * 用户注册
 * @param {Object} data 注册数据
 * @returns {Promise}
 */
export function register(data) {
  return post('/api/noLogin/register', data)
}

export function getPageUsersByRole(params) {
  return post('/api/user/role/list', params)
}

export function removeUser(id) {
  return put(`/api/user/removeRole/${id}`)
}

/**
 * 从部门中移除用户
 * @param {Number} id 用户ID
 * @returns {Promise}
 */
export function removeUserFromDept(id) {
  return put(`/api/user/removeDept/${id}`)
}

/**
 * 修改密码
 * @param {Object} data 密码数据
 * @returns {Promise}
 */
export function updatePassword(data) {
  return post('/api/update-password', data)
}

/**
 * 获取指定角色的用户列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getUsersByRole(roleId) {
  return get(`/api/user/list/${roleId}`)
}

/**
 * 获取用户列表（分页）
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getUserList(params) {
  return post('/api/user/page', params)
}

/**
 * 获取用户详情
 * @param {Number} id 用户ID
 * @returns {Promise}
 */
export function getUserDetail(id) {
  return get(`/api/user/${id}`)
}

/**
 * 新增用户
 * @param {Object} data 用户数据
 * @returns {Promise}
 */
export function addUser(data) {
  return post('/api/user/add', data)
}

/**
 * 更新用户
 * @param {Object} data 用户数据
 * @returns {Promise}
 */
export function updateUser(data) {
  return put('/api/user/update', data)
}

/**
 * 删除用户
 * @param {Number} id 用户ID
 * @returns {Promise}
 */
export function deleteUser(id) {
  return del(`/api/user/${id}`)
}

/**
 * 修改用户启用状态
 * @param {Object} data 用户数据
 * @returns {Promise}
 */
export function changeUserStatus(data) {
  return put('/api/enable', data)
}

/**
 * 获取当前登录用户信息
 * @returns {Promise}
 */
export function getCurrentUser() {
  return get('/api/user/current')
}

/**
 * 修改密码
 * @param {Object} data 密码信息
 * @returns {Promise}
 */
export function changePassword(data) {
  return put('/api/user/password', data)
}

/**
 * 获取指定部门的用户列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getUsersByDept(params) {
  return post('/api/user/dept/list', params)
}

/**
 * 搜索用户
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function searchUsers(params) {
  return post('/api/user/search', params)
} 