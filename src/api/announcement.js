import { get, post, put, del } from '../utils/request.js'

/**
 * 分页查询公告列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getAnnouncementList(params) {
  return post('/api/announcement/page', params)
}

/**
 * 获取公告详情
 * @param {Number} id 公告ID
 * @returns {Promise}
 */
export function getAnnouncementDetail(id) {
  return get(`/api/announcement/${id}`)
}

/**
 * 新增公告
 * @param {Object} data 公告数据
 * @returns {Promise}
 */
export function addAnnouncement(data) {
  return post('/api/announcement/add', data)
}

/**
 * 修改公告
 * @param {Object} data 公告数据
 * @returns {Promise}
 */
export function updateAnnouncement(data) {
  return put('/api/announcement/update', data)
}

/**
 * 删除公告
 * @param {Number} id 公告ID
 * @returns {Promise}
 */
export function deleteAnnouncement(id) {
  return del(`/api/announcement/${id}`)
}

/**
 * 发布公告
 * @param {Number} id 公告ID
 * @returns {Promise}
 */
export function publishAnnouncement(id) {
  return put(`/api/announcement/publish/${id}`)
}

/**
 * 撤回公告
 * @param {Number} id 公告ID
 * @returns {Promise}
 */
export function unpublishAnnouncement(id) {
  return put(`/api/announcement/unpublish/${id}`)
} 