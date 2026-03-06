<template>
  <el-dialog
    v-model="visible"
    title="常见问题 FAQ"
    width="60%"
    class="faq-dialog"
    :close-on-click-modal="false"
    destroy-on-close
    :fullscreen="isMobile"
  >
    <div class="faq-container">
      <el-scrollbar class="faq-scrollbar" wrap-class="faq-scroll-wrapper">
        <div class="faq-content" v-html="formattedFaq"></div>
      </el-scrollbar>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import faqContent from '@/assets/faq-content.md?raw'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 移动端检测
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
}

// 格式化FAQ内容
const formattedFaq = computed(() => {
  return faqContent
    // 转换粗体
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // 转换列表项
    .replace(/^(\s*)[-*+]\s+(.*)$/gm, '$1<li>$2</li>')
    // 包装列表
    .replace(/(<li>.*<\/li>(?:\n\s*<li>.*<\/li>)*)/gs, '<ul>$1</ul>')
    // 转换代码块
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // 处理换行
    .replace(/\n/g, '<br>')
})

// 关闭弹窗
const closeDialog = () => {
  visible.value = false
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.faq-dialog {
  max-height: 75vh;
  max-width: 90vw;
}

.faq-dialog :deep(.el-dialog) {
  max-height: 75vh;
  max-width: 90vw;
  margin: 12.5vh auto !important;
  position: fixed;
  top: 12.5vh;
  left: 50%;
  transform: translateX(-50%);
}

.faq-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: calc(75vh - 120px);
  overflow: hidden;
}

.faq-container {
  height: 100%;
  max-height: calc(75vh - 120px);
}

.faq-scrollbar {
  height: 100%;
  max-height: calc(75vh - 120px);
}

:deep(.faq-scroll-wrapper) {
  max-height: calc(75vh - 120px);
  overflow-y: auto;
}

.faq-content {
  padding: 20px 30px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  min-height: 100%;
}

.faq-content :deep(h2) {
  color: var(--el-text-color-primary);
  font-size: 20px;
  margin: 25px 0 15px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--el-color-primary-light-7);
}

.faq-content :deep(strong) {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

/* 分类标题样式 */
.faq-content :deep(.faq-category) {
  display: block;
  font-size: 22px;
  margin: 30px 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 3px solid var(--el-color-primary-light-7);
  color: var(--el-color-primary);
  font-weight: 600;
}

.faq-content :deep(.faq-category strong) {
  color: var(--el-color-primary);
  font-weight: 600;
}

.faq-content :deep(br) {
  display: block;
  margin: 8px 0;
}

.faq-content :deep(ul) {
  padding-left: 20px;
  margin: 10px 0;
}

.faq-content :deep(li) {
  margin: 6px 0;
}

.faq-content :deep(code) {
  background: var(--el-color-primary-light-9);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 13px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .faq-dialog :deep(.el-dialog) {
    max-height: 80vh;
    max-width: 95vw;
    margin: 10vh auto !important;
    top: 10vh;
  }
  
  .faq-dialog :deep(.el-dialog__body) {
    max-height: calc(80vh - 100px);
  }
  
  .faq-container {
    max-height: calc(80vh - 100px);
  }
  
  .faq-scrollbar {
    max-height: calc(80vh - 100px);
  }
  
  :deep(.faq-scroll-wrapper) {
    max-height: calc(80vh - 100px);
  }
  
  .faq-content {
    padding: 15px 20px;
  }
  
  .faq-content :deep(strong:first-child) {
    font-size: 20px;
    margin: 25px 0 15px 0;
  }
}

/* 超宽屏适配 */
@media (min-width: 1200px) {
  .faq-dialog :deep(.el-dialog) {
    max-width: 800px;
  }
}
</style>