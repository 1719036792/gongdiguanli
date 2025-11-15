import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/portal'
  },
  {
    path: '/portal',
    name: 'Portal',
    component: () => import('../views/Portal.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { title: 'home' },
    children: [
      {
        path: '/dashboard',
        component: () => import('../views/Workbench.vue'),
        meta: { title: '工作台', requiresAdmin: true }
      },
      {
        path: '/system/user',
        component: () => import('../views/system/user/index.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: '/system/role',
        component: () => import('../views/system/role/index.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: '/system/department',
        component: () => import('../views/system/department/index.vue'),
        meta: { title: '部门管理' }
      },
      {
        path: '/employee/list',
        component: () => import('../views/employee/list/index.vue'),
        meta: { title: '员工信息管理' }
      },

      {
        path: '/flow/definition',
        component: () => import('../views/flow/definition/index.vue'),
        meta: { title: '流程定义' }
      },
      {
        path: '/flow/design',
        component: () => import('../views/flow/design/index.vue'),
        meta: { title: '流程设计' }
      },
      {
        path: '/leave/apply',
        component: () => import('../views/leave/apply/index.vue'),
        meta: { title: '请假申请' }
      },
      {
        path: '/leave/approval',
        component: () => import('../views/leave/approval/index.vue'),
        meta: { title: '请假审批' }
      },
      {
        path: '/leave/record',
        component: () => import('../views/leave/record/index.vue'),
        meta: { title: '请假记录' }
      },
      {
        path: '/project',
        component: () => import('../views/project/index.vue'),
        name: 'ProjectList',
        meta: { title: '项目管理' }
      },
      {
        path: '/logistics',
        component: () => import('../views/logistics/index.vue'),
        meta: { title: '后勤管理' }
      },
      {
        path: '/logistics/accommodation',
        component: () => import('../views/logistics/accommodation/index.vue'),
        meta: { title: '住宿管理' }
      },
      {
        path: '/logistics/equipment',
        component: () => import('../views/logistics/equipment/index.vue'),
        meta: { title: '设备管理' }
      },
      {
        path: '/logistics/supplies',
        component: () => import('../views/logistics/supplies/index.vue'),
        meta: { title: '物资管理' }
      },
      {
        path: '/task/list',
        component: () => import('../views/task/list/index.vue'),
        meta: { title: '任务列表' }
      },
      {
        path: '/task/my',
        component: () => import('../views/task/my/index.vue'),
        meta: { title: '我的任务' }
      },
      {
        path: '/task/statistics',
        component: () => import('../views/task/statistics/index.vue'),
        meta: { title: '任务统计' }
      },
      {
        path: '/announcement',
        component: () => import('../views/announcement/index.vue'),
        meta: { title: '公告管理' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const roleId = localStorage.getItem('roleId')
  
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.meta.requiresAdmin && roleId !== '1') {
    // 如果页面需要管理员权限但当前用户不是管理员，重定向到用户个人任务页面
    next('/task/my')
  } else {
    next()
  }
})

export default router