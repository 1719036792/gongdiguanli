<template>
  <div class="flow-designer-container" ref="container">
    <iframe ref="iframe" :src="iframeUrl" frameborder="0" width="100%" height="100%"></iframe>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits } from 'vue';

const props = defineProps({
  definitionId: {
    type: [String, Number],
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  baseUrl: {
    type: String,
    default: 'http://localhost:9999'
  }
});

const emit = defineEmits(['close', 'save']);

// 构建iframe URL
const iframeUrl = ref(`${props.baseUrl}/warm-flow-ui/index.html?id=${props.definitionId}&disabled=${props.disabled}`);

const iframeLoaded = () => {
  // iframe监听组件内设计器事件
  window.onmessage = (event) => {
    switch (event.data.method) {
      case "close":
        emit('close');
        break;
      case "save":
        emit('save', event.data.data);
        break;
    }
  }
};

onMounted(() => {
  iframeLoaded();
});
</script>

<style scoped>
.flow-designer-container {
  width: 100%;
  height: 100%;
  min-height: 600px;
}
</style>