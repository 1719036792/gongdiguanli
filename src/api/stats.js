import { get, post } from '../utils/request.js'

/**
 * 获取项目总数
 * @returns {Promise}
 */
export function getProjectCount() {
  return get('/api/project/count').catch(() => {
    console.warn('项目总数接口调用失败，返回模拟数据')
    return { code: 200, data: 12 }
  })
}

/**
 * 获取任务总数
 * @returns {Promise}
 */
export function getTaskCount() {
  return get('/api/task/count').catch(() => {
    console.warn('任务总数接口调用失败，返回模拟数据')
    return { code: 200, data: 68 }
  })
}

/**
 * 获取员工总数
 * @returns {Promise}
 */
export function getEmployeeCount() {
  return get('/api/employee/count').catch(() => {
    console.warn('员工总数接口调用失败，返回模拟数据')
    return { code: 200, data: 24 }
  })
}

/**
 * 获取设备总数
 * @returns {Promise}
 */
export function getEquipmentCount() {
  return get('/api/equipment/count').catch(() => {
    console.warn('设备总数接口调用失败，返回模拟数据')
    return { code: 200, data: 35 }
  })
}

/**
 * 获取设备状态统计
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getEquipmentStats(params) {
  return post('/api/equipment/stats', params).catch(() => {
    console.warn('设备状态统计接口调用失败，返回模拟数据')
    return { 
      code: 200, 
      data: [
        { name: '空闲', value: 15 },
        { name: '使用中', value: 12 },
        { name: '维修中', value: 5 },
        { name: '已报废', value: 3 }
      ] 
    }
  })
}

/**
 * 获取公告列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getAnnouncementList(params) {
  return post('/api/announcement/page', params).catch(() => {
    console.warn('公告列表接口调用失败，返回模拟数据')
    return { 
      code: 200, 
      data: {
        list: [
          { id: 1, title: '系统维护通知', type: '3', publishTime: '2023-10-01', content: '系统将于本周日进行例行维护' },
          { id: 2, title: '新项目启动', type: '2', publishTime: '2023-09-25', content: '新项目将于下周一正式启动' },
          { id: 3, title: '安全事件预警', type: '1', publishTime: '2023-09-20', content: '近期发现网络安全风险，请注意防范' }
        ],
        total: 3
      } 
    }
  })
}

/**
 * 获取任务趋势统计
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getTaskTrend(params) {
  return post('/api/task/trend', params).catch(() => {
    console.warn('任务趋势统计接口调用失败，返回模拟数据')
    let data = {}
    
    if (params.period === 'week') {
      data = {
        xAxis: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        newTasks: [5, 7, 10, 8, 6, 3, 2],
        completedTasks: [3, 4, 8, 6, 7, 2, 1],
        activeUsers: [8, 10, 12, 15, 13, 6, 4]
      }
    } else if (params.period === 'month') {
      // 生成30天的数据
      const days = Array.from({length: 30}, (_, i) => `${i+1}日`)
      const newTasks = Array.from({length: 30}, () => Math.floor(Math.random() * 5) + 1)
      const completedTasks = Array.from({length: 30}, () => Math.floor(Math.random() * 4) + 1)
      const activeUsers = Array.from({length: 30}, () => Math.floor(Math.random() * 10) + 5)
      
      data = {
        xAxis: days,
        newTasks,
        completedTasks,
        activeUsers
      }
    } else { // year
      data = {
        xAxis: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        newTasks: [30, 25, 35, 40, 45, 50, 42, 38, 46, 52, 48, 30],
        completedTasks: [28, 22, 32, 36, 40, 45, 38, 34, 40, 46, 42, 25],
        activeUsers: [15, 18, 22, 25, 28, 30, 26, 24, 28, 32, 30, 20]
      }
    }
    
    return { code: 200, data }
  })
}

/**
 * 获取任务分布统计
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export function getTaskDistributionStats(params) {
  return post('/api/task/stats', params).catch(() => {
    console.warn('任务分布统计接口调用失败，返回模拟数据')
    let data = []
    
    if (params.type === 'status') {
      data = [
        { name: '未开始', value: 25 },
        { name: '进行中', value: 40 },
        { name: '已完成', value: 30 },
        { name: '已逾期', value: 5 }
      ]
    } else if (params.type === 'priority') {
      data = [
        { name: '低', value: 15 },
        { name: '中', value: 35 },
        { name: '高', value: 40 },
        { name: '紧急', value: 10 }
      ]
    }
    
    return { code: 200, data }
  })
} 