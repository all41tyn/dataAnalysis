<template>
  <div class="analysis-history">
    <div class="page-card">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">
            <el-icon :size="24"><Calendar /></el-icon>
          </div>
          <div class="header-text">
            <h1 class="page-title">分析记录</h1>
            <p class="page-desc">查看历史分析任务和结果</p>
          </div>
        </div>
        <div class="header-actions">
          <span v-if="selectedDatasourceName" class="selected-datasource">
            当前: {{ selectedDatasourceName }}
          </span>
          <el-button 
            v-if="selectedTasks.length > 0"
            type="success" 
            @click="showReportDialog = true"
          >
            <el-icon><DocumentChecked /></el-icon>
            生成总结报告 ({{ selectedTasks.length }})
          </el-button>
          <el-button 
            type="primary" 
            @click="handleOpenDatasourceSelector"
          >
            <el-icon><Document /></el-icon>
            选择数据源
          </el-button>
        </div>
      </div>

      <!-- 列表切换Tab -->
      <div class="list-tabs" v-if="selectedDatasource">
        <el-radio-group v-model="activeListTab" size="default">
          <el-radio-button value="tasks">
            <el-icon><DataAnalysis /></el-icon>
            分析任务 ({{ tasks.length }})
          </el-radio-button>
          <el-radio-button value="reports">
            <el-icon><DocumentChecked /></el-icon>
            总结报告 ({{ reports.length }})
          </el-radio-button>
        </el-radio-group>
        
        <!-- 调试按钮 -->
        <div v-if="false" style="margin: 10px 0;">
          <el-button @click="console.log('当前选中:', selectedTasks)">查看选中项</el-button>
          <el-button @click="selectedTasks = []">清空选择</el-button>
        </div>
      </div>

      <!-- 任务列表 -->
      <div v-show="activeListTab === 'tasks'" class="task-list-wrapper">
        <!-- 调试信息 -->
        <div v-if="false" style="margin-bottom: 10px; padding: 10px; background: #f0f0f0; border-radius: 4px;">
          已选择的任务数: {{ selectedTasks.length }}
          <div v-for="task in selectedTasks" :key="task.task_id">
            选中: #{{ task.task_id }}
          </div>
        </div>
        
        <el-table 
          :data="tasks" 
          v-loading="loading" 
          empty-text="暂无分析记录" 
          stripe
          :header-cell-style="{ background: 'var(--fill-color)', fontWeight: '600' }"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="task_id" label="任务 ID" width="100">
            <template #default="{ row }">
              <span class="task-id">#{{ row.task_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="method" label="分析方法" width="140">
            <template #default="{ row }">
              <el-tag effect="plain" size="small">
                {{ methodNameMap[row.method] || row.method }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="params" label="分析参数" min-width="200">
            <template #default="{ row }">
              <el-tooltip 
                :content="formatParams(row.params)" 
                placement="top" 
                :disabled="!shouldShowTooltip(row.params)"
                :show-after="500"
              >
                <span 
                  class="params-text" 
                  :class="{ 'has-tooltip': shouldShowTooltip(row.params) }"
                >
                  {{ formatParams(row.params) }}
                </span>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column prop="create_time" label="创建时间" width="180">
            <template #default="{ row }">
              <span class="time-text">{{ row.create_time }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link @click="viewResult(row)"><el-icon><View /></el-icon><span>查看结果</span></el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 报告列表 -->
      <div v-show="activeListTab === 'reports'" class="task-list-wrapper">
        <el-table 
          :data="reports" 
          v-loading="reportsLoading" 
          empty-text="暂无总结报告" 
          stripe
          :header-cell-style="{ background: 'var(--fill-color)', fontWeight: '600' }"
        >
          <el-table-column prop="report_id" label="ID" width="80">
            <template #default="{ row }">
              <span class="task-id">#{{ row.report_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="title" label="报告名称" min-width="250">
            <template #default="{ row }">
              <span class="report-title">{{ row.title }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="create_time" label="创建时间" width="180">
            <template #default="{ row }">
              <span class="time-text">{{ row.create_time }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <div class="action-buttons" v-if="row.status === 'done'">
                <el-button 
                  type="primary" 
                  link 
                  @click="handleDownloadReport(row)"
                  size="small"
                >
                  <el-icon><Download /></el-icon>下载
                </el-button>
                <el-button 
                  type="danger" 
                  link 
                  @click="handleDeleteReport(row)"
                  size="small"
                >
                  <el-icon><Delete /></el-icon>删除
                </el-button>
              </div>
              <span v-else class="status-text">
                {{ row.status || '处理中' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 结果查看弹窗 -->
    <el-dialog 
      v-model="resultVisible" 
      title=""
      width="90%" 
      top="3vh" 
      :show-close="false"
      destroy-on-close
      class="result-dialog"
    >
      <template #header="{ close }">
        <div class="dialog-header">
          <div class="header-icon">
            <el-icon :size="20"><DataAnalysis /></el-icon>
          </div>
          <div class="header-text">
            <h3 class="dialog-title">分析结果</h3>
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
      <div v-loading="resultLoading" class="dialog-content">
        <div v-if="resultData">
          <!-- 结果类型切换 -->
          <div class="result-type-switch">
            <el-radio-group v-model="activeTab" size="default">
              <el-radio-button value="table">
                <el-icon><Grid /></el-icon>
                表格
              </el-radio-button>
              <el-radio-button value="chart">
                <el-icon><PieChart /></el-icon>
                图表
              </el-radio-button>
              <el-radio-button value="text" v-if="hasTextResult">
                <el-icon><Document /></el-icon>
                文本
              </el-radio-button>
            </el-radio-group>
          </div>
          
          <!-- 表格结果 -->
          <div v-show="activeTab === 'table'" class="result-content">
            <ResultTable :data="tableData" />
          </div>
          
          <!-- 图表结果 -->
          <div v-show="activeTab === 'chart'" class="result-content">
            <ResultChart 
              v-if="chartConfig" 
              :chart-config="chartConfig"
              :method="currentTask?.method"
              :supported-charts="currentMethodSupportedCharts"
            />
            <div v-else class="empty-chart">
              <el-icon class="empty-icon"><PieChart /></el-icon>
              <p>该分析结果暂无图表数据</p>
            </div>
          </div>
          
          <!-- 文本结果 -->
          <div v-show="activeTab === 'text'" class="result-content">
            <ResultText :content="textResult" />
          </div>
        </div>
        <div v-else-if="!resultLoading" class="empty-result">
          <el-icon class="empty-icon"><Document /></el-icon>
          <p>未找到分析结果数据</p>
          <p class="hint" v-if="resultData === null">请求失败或数据不存在</p>
          <p class="hint" v-else>该任务可能还未完成或无表格数据</p>
        </div>
      </div>
    </el-dialog>

    <!-- 数据源选择弹窗 -->
    <DatasourceSelector
      v-model="selectedDatasource"
      v-model:visible="showDatasourceSelector"
      @confirm="handleDatasourceSelect"
    />

    <!-- 生成报告对话框 -->
    <ReportGenerateDialog
      v-model="showReportDialog"
      :selected-tasks="selectedTasks"
      @success="handleReportGenerated"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { Calendar, View, Document, PieChart, Grid, DataAnalysis, Close, CopyDocument, InfoFilled, DocumentChecked, Download, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDatasources, getAnalysisTasks, getAnalysisResult, getMethods } from '../api/analysis.js'
import { getReports, downloadReportById, deleteReport } from '../api/report.js'
import ResultTable from '../components/result/ResultTable.vue'
import ResultChart from '../components/result/ResultChart.vue'
import ResultText from '../components/result/ResultText.vue'
import DatasourceSelector from '../components/data/DatasourceSelector.vue'
import ReportGenerateDialog from '../components/report/ReportGenerateDialog.vue'

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

const loading = ref(false)
const datasources = ref([])
const selectedDatasource = ref(null)
const tasks = ref([])
const showDatasourceSelector = ref(false)

// 多选相关
const selectedTasks = ref([])
const showReportDialog = ref(false)

// 报告列表相关
const reports = ref([])
const reportsLoading = ref(false)
const activeListTab = ref('tasks') // 'tasks' | 'reports'

const resultVisible = ref(false)
const resultLoading = ref(false)
const resultData = ref(null)
const activeTab = ref('table')

// 当前查看结果的任务
const currentTask = ref(null)

// 分析方法列表（包含支持的图表类型）
const methodList = ref([])

// 判断是否需要显示 tooltip（参数内容过长时）
const shouldShowTooltip = (params) => {
  if (!params) return false
  const paramString = formatParams(params)
  // 超过50个字符，或者包含复杂嵌套结构
  return paramString.length > 50 || paramString.includes('{') || paramString.includes('[')
}

// 格式化参数显示
const formatParams = (params) => {
  if (!params) return ''
  try {
    // 如果是对象，格式化显示
    if (typeof params === 'object') {
      // 简化显示，只显示主要参数
      const simplified = {}
      Object.keys(params).forEach(key => {
        const value = params[key]
        if (Array.isArray(value)) {
          simplified[key] = `[${value.length}项]`
        } else if (typeof value === 'object' && value !== null) {
          simplified[key] = '{...}'
        } else {
          simplified[key] = String(value)
        }
      })
      return JSON.stringify(simplified)
    }
    return String(params)
  } catch (e) {
    return String(params)
  }
}

// 计算属性
const selectedDatasourceName = computed(() => {
  const ds = datasources.value.find(d => d.id === selectedDatasource.value)
  return ds ? ds.name : ''
})

// 当前分析方法支持的图表类型
const currentMethodSupportedCharts = computed(() => {
  if (!currentTask.value || !methodList.value.length) return []
  const method = methodList.value.find(m => m.key === currentTask.value.method)
  return method?.supported_charts || []
})

const hasTextResult = computed(() => {
  // 检查 resultData.value 直接包含的 report 字段（最外层）
  if (resultData.value?.report) {
    console.log('hasTextResult: found report at root level')
    return true
  }
  if (resultData.value?.text) {
    console.log('hasTextResult: found text at root level')
    return true
  }
  if (resultData.value?.summary) {
    console.log('hasTextResult: found summary at root level')
    return true
  }
  
  // 检查 result 对象内部
  const result = resultData.value?.result
  console.log('hasTextResult computed - result:', result)
  
  if (!result) {
    console.log('hasTextResult: result is null/undefined')
    return false
  }
  
  // 检查是否存在文本相关内容
  const hasText = (
    typeof result === 'string' || 
    (typeof result === 'object' && (
      result.report || 
      result.text || 
      result.summary ||
      (result.result && (
        result.result.report || 
        result.result.text || 
        result.result.summary
      ))
    ))
  )
  
  console.log('hasTextResult result:', hasText, {
    isString: typeof result === 'string',
    hasReport: !!result.report,
    hasText: !!result.text,
    hasSummary: !!result.summary,
    hasNestedResult: !!(result.result && (result.result.report || result.result.text || result.result.summary))
  })
  
  return hasText
})

const textResult = computed(() => {
  // 首先检查 resultData.value 最外层的 report/text/summary 字段
  if (resultData.value?.report) {
    console.log('Using root level report field:', resultData.value.report)
    return processReportContent(resultData.value.report)
  }
  if (resultData.value?.text) {
    console.log('Using root level text field:', resultData.value.text)
    return processReportContent(resultData.value.text)
  }
  if (resultData.value?.summary) {
    console.log('Using root level summary field:', resultData.value.summary)
    return processReportContent(resultData.value.summary)
  }
  
  // 然后检查 result 对象内部
  const result = resultData.value?.result
  console.log('textResult computed - result:', result)
  
  if (!result) {
    console.log('Result is null/undefined')
    return ''
  }
  
  // 优先使用 report 字段
  if (result.report) {
    console.log('Using report field:', result.report)
    return processReportContent(result.report)
  }
  
  // 兼容旧的 text 和 summary 字段
  if (typeof result === 'string') {
    console.log('Using string result:', result)
    return processReportContent(result)
  }
  if (typeof result === 'object' && result.text) {
    console.log('Using text field:', result.text)
    return processReportContent(result.text)
  }
  if (typeof result === 'object' && result.summary) {
    console.log('Using summary field:', result.summary)
    return processReportContent(result.summary)
  }
  
  // 处理嵌套的 result.result 结构
  if (typeof result === 'object' && result.result) {
    const nestedResult = result.result
    if (nestedResult.report) {
      console.log('Using nested report field:', nestedResult.report)
      return processReportContent(nestedResult.report)
    }
    if (nestedResult.text) {
      console.log('Using nested text field:', nestedResult.text)
      return processReportContent(nestedResult.text)
    }
    if (nestedResult.summary) {
      console.log('Using nested summary field:', nestedResult.summary)
      return processReportContent(nestedResult.summary)
    }
  }
  
  console.log('No text content found in result')
  return ''
})

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

const chartConfig = computed(() => {
  return resultData.value?.chart_config || null
})

const detailColumns = computed(() => {
  const data = tableData.value
  if (!Array.isArray(data) || !data.length) return []
  
  // 获取第一行的所有键作为列名
  const firstRow = data[0]
  const columns = Object.keys(firstRow)
  
  console.log('表格列名:', columns)
  return columns
})

const tableData = computed(() => {
  // 检查不同的数据源
  const resultObj = resultData.value?.result
  
  console.log('原始结果对象:', resultObj)
  
  // 如果有 detail_table，直接使用
  if (resultData.value?.detail_table) {
    const data = resultData.value.detail_table
    console.log('使用 detail_table 数据:', data)
    return Array.isArray(data) ? data : []
  }
  
  // 处理分布分析等特定格式的数据
  if (resultObj && typeof resultObj === 'object') {
    // 分布分析数据格式处理
    if (resultObj.categories && resultObj.values && resultObj.percentages) {
      const rows = resultObj.categories.map((category, index) => ({
        维度: resultObj.dimension || '未知维度',
        分类: category,
        数量: resultObj.values[index] || 0,
        百分比: (resultObj.percentages[index] || 0).toFixed(2) + '%'
      }))
      console.log('转换分布分析数据为表格:', rows)
      return rows
    }
    
    // 其他可能的数据格式...
    // 如果 result 本身是数组
    if (Array.isArray(resultObj)) {
      console.log('result 是数组格式')
      return resultObj
    }
    
    // 如果 result 包含 data 字段
    if (resultObj.data && Array.isArray(resultObj.data)) {
      console.log('使用 result.data 作为表格数据')
      return resultObj.data
    }
  }
  
  console.log('未找到可用的表格数据')
  return []
})

const loadDatasources = async () => {
  try {
    const res = await getDatasources()
    datasources.value = res.data || []
  } catch (e) { /* ignore */ }
}

const loadMethods = async () => {
  try {
    const res = await getMethods()
    methodList.value = res.data || []
  } catch (e) { /* ignore */ }
}

const loadTasks = async () => {
  if (!selectedDatasource.value) {
    tasks.value = []
    return
  }
  loading.value = true
  try {
    const res = await getAnalysisTasks(selectedDatasource.value)
    tasks.value = res.data || []
  } catch (e) {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

// 加载报告列表
const loadReports = async () => {
  if (!selectedDatasource.value) {
    reports.value = []
    return
  }
  reportsLoading.value = true
  try {
    const res = await getReports(selectedDatasource.value)
    reports.value = res.data || []
  } catch (e) {
    reports.value = []
  } finally {
    reportsLoading.value = false
  }
}

// 处理多选变化
function handleSelectionChange(selection) {
  selectedTasks.value = selection
}

// 处理报告生成成功
function handleReportGenerated() {
  // 切换到报告列表并刷新
  activeListTab.value = 'reports'
  loadReports()
  // 清空选择
  selectedTasks.value = []
}

// 下载报告
async function handleDownloadReport(row) {
  try {
    const response = await downloadReportById(row.report_id)
    
    // 获取文件名
    const contentDisposition = response.headers?.['content-disposition']
    let filename = row.title + '.docx'
    if (contentDisposition) {
      const match = contentDisposition.match(/filename\*=UTF-8''(.+)/)
      if (match) {
        filename = decodeURIComponent(match[1])
      }
    }

    // 下载文件
    const blob = new Blob([response.data], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('下载成功！')
  } catch (error) {
    console.error('下载报告失败:', error)
    ElMessage.error('下载报告失败: ' + (error.message || '未知错误'))
  }
}

// 删除报告
async function handleDeleteReport(row) {
  try {
    await ElMessageBox.confirm(
      `确定要删除报告 "${row.title}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteReport(row.report_id)
    ElMessage.success('删除成功！')
    loadReports()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除报告失败:', error)
      ElMessage.error('删除报告失败: ' + (error.message || '未知错误'))
    }
  }
}

// 处理数据源选择确认
function handleDatasourceSelect(datasourceId) {
  console.log('数据源选择确认:', datasourceId)
  selectedDatasource.value = datasourceId
  loadTasks()
  loadReports()
}

// 调试：打开数据源选择器
function handleOpenDatasourceSelector() {
  console.log('点击选择数据源按钮')
  console.log('当前 showDatasourceSelector 值:', showDatasourceSelector.value)
  showDatasourceSelector.value = true
  console.log('设置后 showDatasourceSelector 值:', showDatasourceSelector.value)
}

const viewResult = async (row) => {
  console.log('查看结果 - 任务ID:', row.task_id)
  currentTask.value = row
  resultVisible.value = true
  resultLoading.value = true
  activeTab.value = 'table'
  
  // 添加超时处理
  const timeoutId = setTimeout(() => {
    if (resultLoading.value) {
      resultLoading.value = false
      ElMessage.warning('请求超时，请稍后重试')
    }
  }, 30000) // 30秒超时
  
  try {
    const res = await getAnalysisResult(row.task_id)
    clearTimeout(timeoutId)
    console.log('API返回结果:', res)
    resultData.value = res.data
    console.log('处理后的结果数据:', resultData.value)
    console.log('完整数据结构:', JSON.stringify(resultData.value, null, 2))
    console.log('数据结构详情:', {
      has_detail_table: !!resultData.value?.detail_table,
      has_result: !!resultData.value?.result,
      detail_table_type: typeof resultData.value?.detail_table,
      detail_table_is_array: Array.isArray(resultData.value?.detail_table),
      detail_table_length: Array.isArray(resultData.value?.detail_table) ? resultData.value.detail_table.length : 'N/A',
      result_type: typeof resultData.value?.result,
      result_is_array: Array.isArray(resultData.value?.result),
      result_keys: resultData.value?.result ? Object.keys(resultData.value.result) : null,
      result_value: resultData.value?.result,
      hasTextResult: hasTextResult.value,
      table_data: tableData.value,
      table_data_length: tableData.value?.length
    })
    
    // 检查是否有有效数据
    if (!resultData.value) {
      ElMessage.error('未收到有效的分析结果数据')
      return
    }
    
    if (!resultData.value.detail_table && !resultData.value.result) {
      ElMessage.info('该任务暂无可用的数据结果')
      return
    }
    
    if (tableData.value.length === 0) {
      ElMessage.info('该任务的表格数据为空')
    }
  } catch (e) {
    clearTimeout(timeoutId)
    console.error('获取分析结果失败:', e)
    resultData.value = null
    ElMessage.error('获取分析结果失败: ' + (e.message || '未知错误'))
  } finally {
    resultLoading.value = false
  }
}

watch(activeTab, async (val) => {
  if (val === 'chart' && resultData.value?.chart_config) {
    // 移除旧的直接初始化方式，让 ResultChart 组件处理
    // 这里不再需要手动初始化图表
  }
})

loadDatasources()
loadMethods()
</script>

<style>
/* 全局样式 - 修复分析结果弹窗关闭按钮位置 */
.result-dialog.el-dialog__wrapper .el-dialog {
  position: relative !important;
}

.result-dialog.el-dialog__wrapper .el-dialog__header {
  padding: 0 !important;
}
</style>

<style scoped>
.analysis-history {
  animation: fadeIn 0.4s ease;
}

/* 弹窗 header 样式 */
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
  margin: 0;
}

/* 自定义关闭按钮样式 */
.dialog-header .el-dialog__headerbtn {
  position: absolute !important;
  top: 16px !important;
  right: 16px !important;
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

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-lg);
  border-bottom: 1px solid var(--border-light);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.selected-datasource {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--fill-color);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
}

.header-icon {
  width: 48px;
  height: 48px;
  background: var(--primary-bg);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.page-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.list-tabs {
  margin-bottom: var(--space-lg);
  display: flex;
  justify-content: center;
}

.task-list-wrapper {
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-light);
}

.report-title {
  font-weight: 500;
  color: var(--text-primary);
}

.status-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 4px; /* 减小按钮间距 */
  align-items: center;
  justify-content: center; /* 水平居中对齐 */
  height: 100%; /* 确保占满单元格高度 */
}

.task-id {
  font-family: monospace;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.params-text {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  display: block;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  position: relative;
  padding-right: 20px;
}

/* 为有 tooltip 的参数文本添加视觉提示 */
.params-text.has-tooltip::after {
  content: "ⓘ";
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.6;
}

.time-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 弹窗内容 */
.dialog-content {
  min-height: 300px;
}

.result-type-switch {
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-light);
}

.result-content {
  min-height: 400px;
}

.table-wrapper {
  border-radius: var(--radius-md);
  overflow: hidden;
}

.chart-container {
  width: 100%;
  height: 450px;
  background: var(--fill-lighter);
  border-radius: var(--radius-md);
}

.empty-chart, .empty-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-secondary);
}

.empty-chart .empty-icon, .empty-result .empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
  color: var(--text-placeholder);
}

.empty-chart p, .empty-result p {
  margin: var(--space-xs) 0;
  font-size: var(--font-size-base);
}

.empty-result .hint {
  font-size: var(--font-size-sm);
  color: var(--text-placeholder);
}

/* 隐藏表格行末尾的点 - 可能是行悬停或选中状态的指示器 */
:deep(.el-table__row) {
  &::after,
  &::before {
    display: none !important;
    content: none !important;
  }
  
  .el-table__cell {
    &::after,
    &::before {
      display: none !important;
      content: none !important;
    }
  }
}

/* 隐藏表格行的任何伪元素 */
:deep(.el-table__body) {
  .el-table__row {
    position: relative;
    
    *::after,
    *::before {
      display: none !important;
    }
  }
}

/* 修复操作列中按钮后面的点 - 隐藏固定列的阴影指示器 */
:deep(.el-table__fixed-right) {
  &::before {
    display: none !important;
  }
  
  .el-table__cell {
    .cell {
      /* 移除可能产生的额外内容 */
      &::after {
        display: none !important;
      }
    }
  }
}

/* 修复链接按钮样式 */
:deep(.el-button.is-link) {
  &::after {
    display: none !important;
  }
}

/* 隐藏表格固定列的阴影效果 */
:deep(.el-table__fixed-right-patch) {
  display: none !important;
}

:deep(.el-table__fixed-right::before) {
  display: none !important;
}

/* 隐藏表格行的装饰元素 */
:deep(.el-table--striped) {
  .el-table__body {
    .el-table__row {
      &--striped {
        &::after,
        &::before {
          display: none !important;
        }
      }
    }
  }
}

/* 简化版修复：只确保选择列居中 */
:deep(.el-table-column--selection .cell) {
  text-align: center !important;
}

/* 修复勾选标记显示 - 只针对表格内的复选框 */
:deep(.el-table .el-checkbox__inner::after) {
  box-sizing: content-box !important;
  content: "" !important;
  border: 2px solid #FFFFFF !important;
  border-left: 0 !important;
  border-top: 0 !important;
  height: 8px !important;
  left: 5px !important;
  position: absolute !important;
  top: 1px !important;
  transform: rotate(45deg) scaleY(0) !important;
  width: 4px !important;
  transition: transform .15s ease-in .05s !important;
  transform-origin: center !important;
}

:deep(.el-table .el-checkbox__input.is-checked .el-checkbox__inner::after) {
  transform: rotate(45deg) scaleY(1) !important;
}

:deep(.el-table .el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--el-checkbox-checked-bg-color) !important;
  border-color: var(--el-checkbox-checked-border-color) !important;
}
</style>
