<template>
  <div class="result-text" v-if="content">
    <div class="text-header">
      <div class="ai-notice">
        <el-icon><InfoFilled /></el-icon>
        <span>以下内容由 AI 生成，仅供参考</span>
      </div>
      <el-button 
        type="primary" 
        size="small" 
        @click="copyToClipboard"
        :loading="copying"
        class="copy-btn"
      >
        <el-icon><CopyDocument /></el-icon>
        {{ copying ? '复制中...' : '复制全部' }}
      </el-button>
    </div>
    <div class="text-content">
      <pre class="analysis-text">{{ content }}</pre>
    </div>
  </div>
  <div v-else class="empty-state">
    <div class="empty-icon-wrapper">
      <el-icon class="empty-icon"><Document /></el-icon>
    </div>
    <p class="empty-title">暂无文本分析结果</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { InfoFilled, Document, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  content: { type: String, default: '' }
})

const copying = ref(false)

async function copyToClipboard() {
  if (!props.content) {
    ElMessage.warning('没有内容可复制')
    return
  }

  copying.value = true
  
  try {
    // 使用现代 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(props.content)
      ElMessage.success('复制成功！')
    } else {
      // 降级方案：使用传统的 execCommand
      const textArea = document.createElement('textarea')
      textArea.value = props.content
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        ElMessage.success('复制成功！')
      } else {
        ElMessage.error('复制失败，请手动选择文本复制')
      }
    }
  } catch (err) {
    console.error('复制失败:', err)
    ElMessage.error('复制失败：' + (err.message || '未知错误'))
  } finally {
    copying.value = false
  }
}
</script>

<style scoped>
.result-text {
  padding: var(--space-sm) 0;
}

.text-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.ai-notice {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: var(--warning-light);
  color: var(--warning-color);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
}

.copy-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  border: none;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.copy-btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.copy-btn:active {
  transform: translateY(0);
}

.text-content {
  background: var(--fill-lighter);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  /* 移除固定高度限制，让内容自然展开 */
  max-height: none;
  overflow-y: visible;
}

.analysis-text {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  line-height: var(--line-height-relaxed);
  color: var(--text-primary);
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
}

.empty-icon-wrapper {
  width: 64px;
  height: 64px;
  background: var(--fill-color);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
}

.empty-icon {
  font-size: 32px;
  color: var(--text-placeholder);
}

.empty-title {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 滚动条 */
.text-content::-webkit-scrollbar {
  width: 6px;
}

.text-content::-webkit-scrollbar-thumb {
  background: var(--text-placeholder);
  border-radius: var(--radius-full);
}
</style>
