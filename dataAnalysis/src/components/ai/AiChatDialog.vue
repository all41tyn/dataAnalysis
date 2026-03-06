<template>
  <el-dialog
    v-model="visible"
    title=""
    width="900px"
    top="8vh"
    :close-on-click-modal="false"
    :show-close="false"
    destroy-on-close
    class="ai-dialog"
    @open="onOpen"
  >
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog-header">
        <div class="header-icon">
          <el-icon :size="20"><Service /></el-icon>
        </div>
        <div class="header-text">
          <h3 class="dialog-title">AI 智能推荐</h3>
          <p class="dialog-subtitle">让 AI 帮您选择最合适的分析方法</p>
        </div>
        <!-- 手动添加关闭按钮 -->
        <button
          aria-label="关闭"
          class="el-dialog__headerbtn"
          type="button"
          @click="close"
        >
          <el-icon class="el-dialog__close"><Close /></el-icon>
        </button>
      </div>
    </template>

    <!-- 对话区域 -->
    <div class="chat-area" ref="chatAreaRef">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        class="chat-message"
        :class="msg.role"
      >
        <!-- AI消息 -->
        <template v-if="msg.role === 'ai'">
          <div class="avatar ai-avatar">
            <el-icon :size="18"><Service /></el-icon>
          </div>
          <div class="msg-bubble ai-bubble">
            <!-- 普通文本消息 -->
            <div v-if="!msg.isSuggestionResponse" class="msg-content" v-html="msg.content"></div>
            
            <!-- 分析建议卡片 -->
            <div v-if="msg.isSuggestionResponse && msg.suggestions?.length" class="suggestions-container">
              <div class="suggestions-header">
                <el-icon class="header-icon"><Lightning /></el-icon>
                <h3 class="suggestions-title">AI 推荐分析方案</h3>
                <p class="suggestions-desc">根据您的需求，我为您推荐以下分析方法：</p>
              </div>
              
              <AnalysisSuggestionCard
                v-for="(suggestion, index) in msg.suggestions"
                :key="index"
                :suggestion="suggestion"
                :selected="selectedSuggestions.has(getSuggestionKey(suggestion))"
                @adopt="adoptSuggestion"
                @view-details="viewSuggestionDetails"
                class="suggestion-card-item"
              />
              
              <div v-if="msg.summary" class="suggestions-summary">
                <el-alert
                  :title="msg.summary"
                  type="info"
                  show-icon
                  :closable="false"
                />
              </div>
            </div>
            
            <!-- 单个建议的行动按钮 -->
            <div v-if="msg.suggestion && !msg.isSuggestionResponse" class="suggestion-actions">
              <el-button type="primary" size="small" @click="adoptSuggestion(msg.suggestion)">
                <el-icon><Check /></el-icon>
                采纳建议
              </el-button>
            </div>
          </div>
        </template>

        <!-- 用户消息 -->
        <template v-if="msg.role === 'user'">
          <div class="msg-bubble user-bubble">
            {{ msg.content }}
          </div>
          <div class="avatar user-avatar">
            <el-icon :size="18"><User /></el-icon>
          </div>
        </template>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="chat-message ai">
        <div class="avatar ai-avatar">
          <el-icon :size="18"><Service /></el-icon>
        </div>
        <div class="msg-bubble ai-bubble">
          <span class="typing">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </span>
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input-area">
      <el-input
        v-model="inputText"
        placeholder="描述您的业务场景和分析需求..."
        @keydown.enter.prevent="sendMessage"
        :disabled="loading"
        size="large"
        class="chat-input"
      />
      <el-button 
        :icon="Promotion" 
        @click="sendMessage" 
        :loading="loading" 
        :disabled="!inputText.trim()"
        type="primary"
        size="large"
        class="send-btn"
      />
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { Service, User, Promotion, Check, Close, Lightning } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getSuggestion } from '../../api/llm.js'
import { useDatasourceStore } from '../../stores/datasource.js'
import { useAnalysisStore } from '../../stores/analysis.js'
import AnalysisSuggestionCard from './AnalysisSuggestionCard.vue'

const props = defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue', 'adopt'])

const dsStore = useDatasourceStore()
const analysisStore = useAnalysisStore()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const messages = ref([])
const inputText = ref('')
const loading = ref(false)
const chatAreaRef = ref(null)

// 已选择的建议（使用建议的唯一标识：方法+参数哈希）
const selectedSuggestions = ref(new Set())

// 生成建议的唯一标识
function getSuggestionKey(suggestion) {
  // 使用方法名和参数JSON字符串的组合作为唯一标识
  const paramsStr = JSON.stringify(suggestion.params || {})
  return `${suggestion.method}:${paramsStr}`
}

function onOpen() {
  messages.value = [
    {
      role: 'ai',
      content: '您好！请描述您的业务类型、分析目标以及相关要求，我将为您推荐最合适的分析方法。'
    }
  ]
  // 重置已选择的建议
  selectedSuggestions.value.clear()
}

function scrollToBottom() {
  nextTick(() => {
    if (chatAreaRef.value) {
      chatAreaRef.value.scrollTop = chatAreaRef.value.scrollHeight
    }
  })
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text) {
    ElMessage.warning('请输入内容')
    return
  }
  if (loading.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  scrollToBottom()

  loading.value = true
  try {
    const dsId = dsStore.currentDatasource?.id

    if (dsId) {
      try {
        const sugRes = await getSuggestion({
          datasource_id: dsId,
          question: text
        })
        const sugData = sugRes.data

        // 处理嵌套的suggestions结构
        const actualSuggestions = sugData?.suggestions?.suggestions || sugData?.suggestions || []
        
        if (actualSuggestions?.length) {
          // 创建分析建议卡片消息
          messages.value.push({
            role: 'ai',
            isSuggestionResponse: true,
            suggestions: actualSuggestions,
            summary: sugData?.suggestions?.analysis_plan || sugData?.suggestions?.summary || sugData.summary
          })
        } else {
          messages.value.push({
            role: 'ai',
            content: '很抱歉，暂时无法为您生成合适的分析建议。请尝试提供更多关于您的业务场景和分析目标的详细信息。'
          })
        }
      } catch (e) {
        messages.value.push({
          role: 'ai',
          content: '获取分析建议时出现错误，请稍后重试。'
        })
      }
    } else {
      messages.value.push({
        role: 'ai',
        content: '请先选择或上传数据源，然后我可以为您推荐合适的分析方法。'
      })
    }
  } catch (e) {
    messages.value.push({
      role: 'ai',
      content: '请求出错了，请稍后重试。'
    })
  } finally {
    loading.value = false
    scrollToBottom()
  }
}

async function adoptSuggestion(suggestion) {
  if (!suggestion) return
  
  const methodNames = {
    distribution: '分布分析', trend: '趋势分析', attribution: '归因分析',
    funnel: '漏斗分析', heatmap: '热力分析', cross: '交叉分析',
    correlation: '相关性分析', outlier: '异常值检测', clustering: '聚类分析',
    pareto: '帕累托分析', comparison: '对比分析', statistics: '描述性统计'
  }
  
  const methodName = methodNames[suggestion.method] || suggestion.method
  
  // 检查该方法是否已有配置
  const hasExistingConfig = analysisStore.selectedMethods.includes(suggestion.method)
  const existingParams = analysisStore.methodParamsMap[suggestion.method]
  
  if (hasExistingConfig && existingParams && Object.keys(existingParams).length > 0) {
    // 显示覆盖确认对话框
    try {
      await ElMessageBox.confirm(
        `检测到"${methodName}"方法已有配置，是否要用AI推荐的配置覆盖现有配置？`,
        '配置覆盖确认',
        {
          confirmButtonText: '覆盖',
          cancelButtonText: '忽略',
          type: 'warning',
          distinguishCancelAndClose: true
        }
      )
      
      // 用户选择覆盖
      applySuggestion(suggestion, methodName)
    } catch (action) {
      // 用户选择忽略或关闭对话框
      if (action === 'cancel') {
        ElMessage.info('已保留现有配置')
      }
      // 如果是关闭对话框，什么都不做
    }
  } else {
    // 没有现有配置，直接应用
    applySuggestion(suggestion, methodName)
  }
}

function applySuggestion(suggestion, methodName) {
  // 添加方法到选中列表（如果还没有的话）
  if (!analysisStore.selectedMethods.includes(suggestion.method)) {
    analysisStore.selectedMethods.push(suggestion.method)
  }
  
  // 应用参数配置
  analysisStore.methodParamsMap[suggestion.method] = { ...suggestion.params }
  
  // 记录已选择的建议（使用方法+参数的组合作为唯一标识）
  selectedSuggestions.value.add(getSuggestionKey(suggestion))
  
  ElMessage.success(`已采纳"${methodName}"的推荐配置，可以继续选择其他分析方法`)
  emit('adopt', suggestion)
  // 不关闭弹窗，允许继续选择其他方法
}

async function viewSuggestionDetails(suggestion) {
  const methodNames = {
    distribution: '分布分析', trend: '趋势分析', attribution: '归因分析',
    funnel: '漏斗分析', heatmap: '热力分析', cross: '交叉分析',
    correlation: '相关性分析', outlier: '异常值检测', clustering: '聚类分析',
    pareto: '帕累托分析', comparison: '对比分析', statistics: '描述性统计'
  }
  
  const paramsText = Object.entries(suggestion.params || {})
    .map(([key, value]) => `${key}: ${JSON.stringify(value, null, 2)}`)
    .join('\n')
  
  await ElMessageBox.alert(
    `<div>
      <h4>分析方法：${methodNames[suggestion.method] || suggestion.method}</h4>
      ${suggestion.reason ? `<p><strong>推荐理由：</strong>${suggestion.reason}</p>` : ''}
      ${suggestion.confidence ? `<p><strong>置信度：</strong>${Math.round(suggestion.confidence * 100)}%</p>` : ''}
      <h4>参数配置：</h4>
      <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; white-space: pre-wrap;">${paramsText}</pre>
    </div>`,
    '建议详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定'
    }
  )
}
</script>

<style>
/* 全局样式 - 修复 AI 对话框整体布局 */
.ai-dialog.el-dialog__wrapper .el-dialog {
  position: relative !important;
}

.ai-dialog.el-dialog__wrapper .el-dialog__header {
  padding: 0 !important;
}
</style>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  position: relative;
}

.header-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.dialog-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.dialog-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 自定义关闭按钮样式 */
.dialog-header .el-dialog__headerbtn {
  position: absolute !important;
  top: 10px !important;
  right: 0px !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  cursor: pointer !important;
  z-index: 10;
}

.dialog-header .el-dialog__headerbtn:focus,
.dialog-header .el-dialog__headerbtn:hover {
  outline: none !important;
  color: var(--text-primary) !important;
}

.dialog-header .el-dialog__close {
  font-size: 16px !important;
  color: var(--text-secondary) !important;
  width: 1em !important;
  height: 1em !important;
}

.dialog-header .el-dialog__headerbtn:hover .el-dialog__close {
  color: var(--text-primary) !important;
}

.chat-area {
  height: 400px;
  overflow-y: auto;
  padding: var(--space-md);
  background: var(--fill-lighter);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-md);
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.chat-message.user {
  justify-content: flex-end;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-avatar {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  color: #fff;
}

.user-avatar {
  background: var(--fill-color);
  color: var(--text-secondary);
}

.msg-bubble {
  max-width: 85%;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
}

.ai-bubble {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-top-left-radius: var(--radius-sm);
}

.user-bubble {
  background: var(--primary-color);
  color: #fff;
  border-top-right-radius: var(--radius-sm);
}

/* 分析建议容器样式 */
.suggestions-container {
  width: 100%;
}

.suggestions-header {
  text-align: center;
  margin-bottom: var(--space-md);
  padding: var(--space-md);
  background: linear-gradient(135deg, var(--primary-lighter), var(--fill-lighter));
  border-radius: var(--radius-md);
  border: 1px solid var(--primary-light);
}

.header-icon {
  font-size: 24px;
  color: var(--primary-color);
  margin-bottom: var(--space-xs);
}

.suggestions-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--space-xs) 0;
}

.suggestions-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.suggestion-card-item {
  margin-bottom: var(--space-md);
}

.suggestion-card-item:last-child {
  margin-bottom: 0;
}

.suggestions-summary {
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-light);
}

.suggestion-actions {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-light);
}

.typing {
  display: flex;
  gap: 4px;
  padding: 4px 0;
}

.dot {
  width: 8px;
  height: 8px;
  background: var(--text-placeholder);
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input-area {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.chat-input-area .chat-input {
  flex: 1;
}

.chat-input-area .send-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  flex-shrink: 0;
}

/* 滚动条 */
.chat-area::-webkit-scrollbar {
  width: 4px;
}
</style>
