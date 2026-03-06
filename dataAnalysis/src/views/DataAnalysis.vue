<template>
  <div class="data-analysis">
    <div class="page-card">
      <!-- ========== Step 1: 上传数据 ========== -->
      <div v-show="store.currentStep === 1" class="step-content">
        <div class="step1-layout">
          <div class="step1-left">
            <FileUpload @uploaded="onUploaded" />
          </div>
          <div class="step1-right">
            <DataPreview />
          </div>
        </div>
      </div>

      <!-- ========== Step 2: 分析设置 ========== -->
      <div v-show="store.currentStep === 2" class="step-content">
        
        <div class="step2-header">
          <div class="header-content">
            <h2 class="section-title">选择分析方法</h2>
            <p class="step2-desc">
              选择分析方法并配置相应参数，可同时选择多个方法进行综合分析
            </p>
          </div>
          <el-button type="warning" @click="showAiChat = true" class="ai-btn">
            <el-icon><ChatDotRound /></el-icon>
            AI 智能推荐
          </el-button>
        </div>

        <div class="step2-layout">
          <div class="step2-col step2-col-method">
            <MethodSelect @select="onMethodSelect" />
          </div>
          <div class="step2-col step2-col-params">
            <MethodParams ref="methodParamsRef" />
          </div>
        </div>
      </div>

      <!-- ========== Step 3: 分析结果 ========== -->
      <div v-show="store.currentStep === 3" class="step-content">
        <div class="step3-header">
          <h2 class="section-title">分析结果</h2>
        </div>

        <div class="step3-body">
          <!-- 加载中 -->
          <ResultLoading v-if="store.isLoading" />

          <!-- 结果内容 -->
          <template v-else-if="store.analysisResult?.results?.length > 0">
            <el-tabs 
              class="result-tabs" 
              v-model="activeResultTab"
            >
              <el-tab-pane 
                v-for="(result, index) in store.analysisResult.results" 
                :key="index"
                :label="getMethodName(result.method)"
                :name="`result-${index}`"
              >
                <div class="result-content">
                  <div class="result-type-switch">
                    <el-radio-group v-model="activeSubTab[index]" size="default">
                      <el-radio-button value="table">
                        <el-icon><Grid /></el-icon>
                        表格
                      </el-radio-button>
                      <el-radio-button value="chart">
                        <el-icon><PieChart /></el-icon>
                        图表
                      </el-radio-button>
                      <el-radio-button value="text">
                        <el-icon><Document /></el-icon>
                        文本
                      </el-radio-button>
                    </el-radio-group>
                  </div>
                  
                  <ResultTable
                    v-show="activeSubTab[index] === 'table'"
                    :data="result.data.detail_table"
                  />
                  <ResultChart
                    v-show="activeSubTab[index] === 'chart'"
                    :chart-config="result.data.chart_config"
                    :method="result.method"
                    :supported-charts="getMethodSupportedCharts(result.method)"
                  />
                  <ResultText
                    v-show="activeSubTab[index] === 'text'"
                    :content="getResultText(result.data)"
                  />
                </div>
              </el-tab-pane>
            </el-tabs>
          </template>

          <!-- 空状态 -->
          <div v-else class="empty-state">
            <div class="empty-icon-wrapper">
              <el-icon class="empty-icon"><DataAnalysis /></el-icon>
            </div>
            <p class="empty-title">暂无分析结果</p>
            <p class="empty-desc">请先配置分析参数并执行分析</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="step-footer">
      <el-button v-if="store.currentStep > 1" @click="handleReset">
        <el-icon><RefreshLeft /></el-icon>
        重置
      </el-button>
      <el-button
        v-if="store.currentStep === 1 && dsStore.currentDatasource"
        type="warning"
        @click="showPrivacy = true"
      >
        <el-icon><Lock /></el-icon>
        隐私设置
      </el-button>
      <div class="footer-spacer"></div>
      <el-button
        v-if="store.currentStep > 1"
        @click="store.prevStep()"
      >
        <el-icon><ArrowLeft /></el-icon>
        上一步
      </el-button>
      <el-button
        v-if="store.currentStep === 1"
        type="primary"
        :disabled="!dsStore.currentDatasource"
        @click="goStep2"
      >
        下一步
        <el-icon><ArrowRight /></el-icon>
      </el-button>
      <el-button
        v-if="store.currentStep === 2"
        type="primary"
        :disabled="store.selectedMethods.length === 0"
        @click="goStep3"
      >
        开始分析
        <el-icon><ArrowRight /></el-icon>
      </el-button>
    </div>

    <!-- 隐私设置弹窗 -->
    <PrivacyDialog v-model="showPrivacy" @rules-saved="handlePrivacyRulesSaved" />

    <!-- AI推荐弹窗 -->
    <AiChatDialog v-model="showAiChat" @adopt="onAdopt" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ChatDotRound, Check, ArrowLeft, ArrowRight, RefreshLeft, Lock, Grid, PieChart, Document, DataAnalysis } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { executeAnalysis, getMethods } from '../api/analysis.js'
import { useAnalysisStore } from '../stores/analysis.js'
import { useDatasourceStore } from '../stores/datasource.js'

import FileUpload from '../components/upload/FileUpload.vue'
import DataPreview from '../components/upload/DataPreview.vue'
import PrivacyDialog from '../components/security/PrivacyDialog.vue'
import MethodSelect from '../components/analysis/MethodSelect.vue'
import MethodParams from '../components/analysis/MethodParams.vue'
import AiChatDialog from '../components/ai/AiChatDialog.vue'
import ResultLoading from '../components/result/ResultLoading.vue'
import ResultTable from '../components/result/ResultTable.vue'
import ResultChart from '../components/result/ResultChart.vue'
import ResultText from '../components/result/ResultText.vue'

const store = useAnalysisStore()
const dsStore = useDatasourceStore()

const showPrivacy = ref(false)
const showAiChat = ref(false)
const methodParamsRef = ref(null)
const activeSubTab = ref([])
const activeResultTab = ref('')

// 分析方法列表（包含支持的图表类型）
const methodList = ref([])

const methodNameMap = {
  distribution: '分布分析',
  trend: '趋势分析',
  attribution: '归因分析',
  funnel: '漏斗分析',
  heatmap: '热力分析',
  cross: '交叉分析',
  correlation: '相关性分析',
  outlier: '异常值检测',
  clustering: '聚类分析',
  pareto: '帕累托分析',
  comparison: '对比分析',
  statistics: '描述性统计'
}

function getMethodName(methodKey) {
  return methodNameMap[methodKey] || methodKey
}

// 获取分析方法支持的图表类型
function getMethodSupportedCharts(methodKey) {
  if (!methodList.value.length || !methodKey) return []
  const method = methodList.value.find(m => m.key === methodKey)
  return method?.supported_charts || []
}

// 加载分析方法列表
async function loadMethods() {
  try {
    const res = await getMethods()
    methodList.value = res.data || []
  } catch (e) { /* ignore */ }
}

function getResultText(result) {
  console.log('DataAnalysis - getResultText called with:', result)
  
  if (!result) {
    console.log('DataAnalysis - Result is null/undefined')
    return ''
  }
  
  // 直接检查report字段（execute接口返回的数据结构）
  if (result.report) {
    console.log('DataAnalysis - Using report field:', result.report)
    return processReportContent(result.report)
  }
  
  // 兼容旧的 summary 字段
  if (result.summary) {
    console.log('DataAnalysis - Using summary field:', result.summary)
    return processReportContent(result.summary)
  }
  
  // 如果result本身是字符串
  if (typeof result === 'string') {
    console.log('DataAnalysis - Using string result:', result)
    return processReportContent(result)
  }
  
  // 如果有result.result嵌套结构
  if (result.result && typeof result.result === 'object') {
    console.log('DataAnalysis - Checking nested result:', result.result)
    if (result.result.report) {
      console.log('DataAnalysis - Using nested report:', result.result.report)
      return processReportContent(result.result.report)
    }
    if (result.result.summary) {
      console.log('DataAnalysis - Using nested summary:', result.result.summary)
      return processReportContent(result.result.summary)
    }
  }
  
  console.log('DataAnalysis - No text content found in result')
  return ''
}

// 处理报告内容，包括转义符号等
function processReportContent(content) {
  if (!content) return ''
  
  let processed = content
  
  // 处理常见的转义字符
  processed = processed
    .replace(/\\n/g, '\n')      // 换行符
    .replace(/\\t/g, '\t')      // 制表符
    .replace(/\\r/g, '\r')      // 回车符
    .replace(/\\"/g, '"')       // 双引号
    .replace(/\\'/g, "'")       // 单引号
    .replace(/\\\\/g, '\\')     // 反斜杠
  
  // 处理 Unicode 转义序列
  processed = processed.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16))
  })
  
  // 处理 HTML 实体编码
  const div = document.createElement('div')
  div.innerHTML = processed
  processed = div.textContent || div.innerText || ''
  
  return processed.trim()
}

watch(() => store.analysisResult?.results?.length, (len) => {
  if (len > 0) {
    activeSubTab.value = Array(len).fill('table')
    // 自动选中第一个结果TAB
    activeResultTab.value = 'result-0'
  }
})

function onMethodSelect(methodKey) {
  methodParamsRef.value?.focusMethod(methodKey)
}

function onUploaded(ds) {
  // 上传成功后
}

function goStep2() {
  if (!dsStore.currentDatasource) {
    ElMessage.warning('请先上传并选择数据源')
    return
  }
  store.nextStep()
}

async function goStep3() {
  if (store.selectedMethods.length === 0) {
    ElMessage.warning('请至少选择一个分析方法')
    return
  }

  store.nextStep()
  store.isLoading = true
  store.analysisResult = null

  try {
    const analysisPromises = store.selectedMethods.map(method => {
      let params = store.methodParamsMap[method] || {}
      
      if (method === 'attribution') {
        params = {
          ...params,
          fields: dsStore.fields.map(f => f.original_name)
        }
      }
      
      return executeAnalysis({
        datasource_id: dsStore.currentDatasource.id,
        method: method,
        params: params,
        session_id: store.sessionId || undefined
      })
    })
    
    const results = await Promise.all(analysisPromises)
    
    const combinedResult = {
      results: results.map((res, index) => ({
        method: store.selectedMethods[index],
        data: res.data
      }))
    }
    
    store.analysisResult = combinedResult
  } catch (e) {
    // 错误已在拦截器处理
  } finally {
    store.isLoading = false
  }
}

function handleReset() {
  store.reset()
}

function onAdopt(suggestion) {
  // AI推荐已在 AiChatDialog 中填充配置
}

// 处理隐私规则保存成功后的数据刷新
function handlePrivacyRulesSaved() {
  console.log('隐私规则保存成功，刷新数据预览')
  // 重新获取字段数据（包含隐私处理后的sample_values）
  if (dsStore.currentDatasource?.id) {
    dsStore.fetchFields(dsStore.currentDatasource.id)
  }
}

onMounted(() => {
  loadMethods()
})
</script>

<style scoped>
.data-analysis {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height) - 48px);
  animation: fadeIn 0.4s ease;
}

.page-card {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 0;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  display: flex;
  flex-direction: column;
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-bottom: var(--space-lg);
}

/* Step 1 */
.step1-layout {
  display: flex;
  gap: var(--space-lg);
  height: calc(100vh - var(--header-height) - 120px); /* 减去顶部和底部空间 */
  min-height: 600px;
}

.step1-left {
  width: 380px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.step1-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Step 2 */
.step2-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-lg);
}

.header-content .section-title {
  margin-bottom: var(--space-xs);
}

.step2-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.ai-btn {
  flex-shrink: 0;
}

.step2-layout {
  display: flex;
  gap: var(--space-lg);
  min-height: 500px;
}

.step2-col {
  min-width: 0;
  background: var(--fill-lighter);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  border: 1px solid var(--border-light);
}

.step2-col-method {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.step2-col-method > div {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.step2-col-params {
  flex: 1;
}

/* Step 3 */
.step3-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.step3-body {
  min-height: 400px;
  height: 100%;
}

.result-tabs {
  height: 100%;
}

.result-tabs :deep(.el-tabs__header) {
  margin-bottom: var(--space-md);
}

.result-tabs :deep(.el-tabs__content) {
  height: calc(100% - 55px);
  overflow-y: auto;
}

.result-tabs :deep(.el-tab-pane) {
  height: 100%;
}

.result-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.result-type-switch {
  margin-bottom: var(--space-md);
}

.result-type-switch :deep(.el-radio-button__inner) {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

/* 空状态 */
.empty-state .empty-icon-wrapper {
  width: 80px;
  height: 80px;
  background: var(--fill-color);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
}

.empty-state .empty-icon {
  font-size: 40px;
  color: var(--text-placeholder);
}

.empty-state .empty-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.empty-state .empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Footer */
.step-footer {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

.footer-spacer {
  flex: 1;
}

/* 响应式 */
@media (max-width: 1024px) {
  .step1-layout,
  .step2-layout {
    flex-direction: column;
  }
  
  .step1-left,
  .step2-col-method {
    width: 100%;
  }
}
</style>
