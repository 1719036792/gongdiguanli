import { createApp } from 'vue'
// import './style.css'
// 引入全局弹窗样式
import './assets/styles/dialog.css'
// 引入全局通用样式
import './assets/styles/common.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(router)
app.use(ElementPlus)
app.mount('#app')
