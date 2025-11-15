import { get, post, put, del } from '../utils/request.js'

/**
 * 获取角色列表（分页）
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getRoleList(params) {
  return post('/api/role/page', params)
}

/**
 * 获取所有角色
 * @returns {Promise}
 */
export function getAllRoles() {
  return get('/api/role/list')
}

/**
 * 获取角色详情
 * @param {Number} id 角色ID
 * @returns {Promise}
 */
export function getRoleDetail(id) {
  return get(`/api/role/${id}`)
}

/**
 * 新增角色
 * @param {Object} data 角色信息
 * @returns {Promise}
 */
export function addRole(data) {
  return post('/api/role/add', data)
}

/**
 * 更新角色
 * @param {Object} data 角色信息
 * @returns {Promise}
 */
export function updateRole(data) {
  return put('/api/role/update', data)
}

/**
 * 删除角色
 * @param {Number} id 角色ID
 * @returns {Promise}
 */
export function deleteRole(id) {
  return del(`/api/role/${id}`)
}

/**
 * 获取角色权限列表
 * @param {Number} roleId 角色ID
 * @returns {Promise}
 */
export function getRoleMenus(roleId) {
  return get(`/api/role/menus/${roleId}`)
}

/**
 * 保存角色权限
 * @param {Object} data 角色权限数据
 * @returns {Promise}
 */
export function saveRoleMenus(data) {
  return post('/api/role/menus/save', data)
}