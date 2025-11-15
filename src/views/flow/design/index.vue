<template>
  <div class="container">
    <FlowDesigner 
      :definitionId="definitionId" 
      :disabled="disabled" 
      @close="handleClose"
      @save="handleSave"
    />
  </div>
</template>

<script setup name="FlowDesign">
import { ref, getCurrentInstance } from 'vue';
import { useRoute } from 'vue-router';
import FlowDesigner from '../../../components/FlowDesigner.vue';
import { ElMessage } from 'element-plus';

const { proxy } = getCurrentInstance();
const route = useRoute();

// 获取路由参数
const definitionId = ref(route.query.id || '');
const disabled = ref(route.query.disabled === 'true' || false);

// 处理关闭事件
const handleClose = () => {
  const obj = { path: "/flow/definition" };
  proxy.$tab.closeOpenPage(obj);
};

// 处理保存事件
const handleSave = (data) => {
  ElMessage.success('流程保存成功');
  console.log('保存的流程数据:', data);
};
</script>

<style scoped>
.container {
  width: 100%;
  height: calc(100vh - 84px);
}
</style> 