<template>
  <div class="method-select">
    <div class="panel-header">
      <div class="header-icon">
        <el-icon :size="18"><DataAnalysis /></el-icon>
      </div>
      <div class="header-content">
        <span class="header-title">选择分析方法</span>
        <span class="header-hint">可选择多个方法同时分析</span>
      </div>
      <el-badge 
        v-if="store.selectedMethods.length" 
        :value="store.selectedMethods.length" 
        type="primary"
        class="selected-badge"
      />
    </div>

    <!-- 方法卡片列表 -->
    <div class="method-list">
      <el-tooltip
        v-for="m in methods"
        :key="m.key"
        :content="methodDescs[m.key]"
        placement="right"
        :offset="12"
        :show-after="600"
      >
        <div
          class="method-card"
          :class="{ active: store.selectedMethods.includes(m.key) }"
          @click="toggleMethod(m.key)"
        >
          <div class="method-icon" :class="[`icon-${getIconColor(m.key)}`]">
            <el-icon :size="20">
              <component :is="methodIcons[m.key] || 'PieChart'" />
            </el-icon>
          </div>
          <div class="method-content">
            <div class="method-header">
              <span class="method-name">{{ m.name }}</span>
              <el-icon v-if="store.selectedMethods.includes(m.key)" class="check-icon"><Check /></el-icon>
            </div>
            <p class="method-desc">{{ methodDescs[m.key] || '' }}</p>
          </div>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  DataAnalysis, Check, PieChart, TrendCharts, Histogram,
  Connection, Grid, Operation, Warning, Coin, Rank, Switch, Odometer
} from '@element-plus/icons-vue'
import { useAnalysisStore } from '../../stores/analysis.js'
import { getMethods } from '../../api/analysis.js'

const store = useAnalysisStore()
const methods = ref([])

const emit = defineEmits(['select'])

// 每个方法的默认参数模板
const defaultParamsMap = {
  distribution: { dimension: '', top_n: 20 },
  trend:        { time_field: '', measure: '', agg_func: 'count', freq: 'M' },
  attribution:  { target: '', factors: [] },
  funnel:       { stages: [] },
  heatmap:      { x_field: '', y_field: '', measure: '', agg_func: 'count' },
  cross:        { dimensions: [], measure: '', agg_func: 'count' },
  correlation:  { fields: [] },
  outlier:      { field: '', method: 'iqr', threshold: 1.5 },
  clustering:   { fields: [], n_clusters: 3 },
  pareto:       { dimension: '', threshold: 80 },
  comparison:   { group_field: '', measure_fields: [], agg_funcs: ['mean', 'sum', 'count'], top_n: 20 },
  statistics:   { fields: [], group_by: '' }
}

const methodIcons = {
  distribution: 'PieChart',
  trend: 'TrendCharts',
  attribution: 'Connection',
  funnel: 'Rank',
  heatmap: 'Grid',
  cross: 'Grid',
  correlation: 'Connection',
  outlier: 'Warning',
  clustering: 'Operation',
  pareto: 'Histogram',
  comparison: 'Switch',
  statistics: 'Odometer'
}

const methodDescs = {
  distribution: '研究数据在不同维度上的分布与集中程度',
  trend: '追踪数据随时间推移的变化趋势与规律',
  attribution: '分析不同因素对目标指标的影响程度',
  funnel: '观察用户行为在多个阶段间的转化与流失',
  heatmap: '直观展示两个维度交叉区域的数据密度分布',
  cross: '对两个维度进行交叉统计分析',
  correlation: '研究多个数值变量之间的相关性关系',
  outlier: '检测数据中偏离正常范围的异常值',
  clustering: '将相似的数据自动分组为不同的簇',
  pareto: '识别对结果影响最大的关键少数因素',
  comparison: '对不同分组的指标进行横向对比分析',
  statistics: '计算数据的基本统计特征与分布描述'
}

const iconColors = {
  distribution: 'blue',
  trend: 'green',
  attribution: 'purple',
  funnel: 'orange',
  heatmap: 'red',
  cross: 'cyan',
  correlation: 'purple',
  outlier: 'red',
  clustering: 'blue',
  pareto: 'orange',
  comparison: 'green',
  statistics: 'cyan'
}

function getIconColor(key) {
  return iconColors[key] || 'blue'
}

function toggleMethod(methodKey) {
  const idx = store.selectedMethods.indexOf(methodKey)
  if (idx > -1) {
    store.selectedMethods.splice(idx, 1)
    delete store.methodParamsMap[methodKey]
  } else {
    store.selectedMethods.push(methodKey)
    store.methodParamsMap[methodKey] = { ...(defaultParamsMap[methodKey] || {}) }
    emit('select', methodKey)
  }
}

onMounted(async () => {
  try {
    const res = await getMethods()
    methods.value = res.data || []
  } catch (e) {
    methods.value = [
      { key: 'distribution', name: '分布分析' },
      { key: 'trend', name: '趋势分析' },
      { key: 'attribution', name: '归因分析' },
      { key: 'funnel', name: '漏斗分析' },
      { key: 'heatmap', name: '热力分析' },
      { key: 'cross', name: '交叉分析' },
      { key: 'correlation', name: '相关性分析' },
      { key: 'outlier', name: '异常值检测' },
      { key: 'clustering', name: '聚类分析' },
      { key: 'pareto', name: '帕累托分析' },
      { key: 'comparison', name: '对比分析' },
      { key: 'statistics', name: '描述性统计' }
    ]
  }
})
</script>

<style scoped>
.method-select {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  flex-shrink: 0;
}

.header-icon {
  width: 36px;
  height: 36px;
  background: var(--primary-bg);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}

.header-content {
  flex: 1;
}

.header-title {
  display: block;
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.header-hint {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.method-list {
  flex: 1;
  overflow-y: auto;
  padding-right: var(--space-xs);
  max-height: 520px;
}

.method-card {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  background: var(--card-bg);
}

.method-card:hover {
  border-color: var(--primary-light);
  background: var(--primary-lighter);
  transform: translateX(4px);
}

.method-card.active {
  border-color: var(--primary-color);
  background: var(--primary-bg);
  box-shadow: var(--shadow-sm);
}

.method-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  transition: all var(--transition-base);
}

.method-icon.icon-blue { background: linear-gradient(135deg, #4468f1, #667eea); }
.method-icon.icon-green { background: linear-gradient(135deg, #52c41a, #73d13d); }
.method-icon.icon-purple { background: linear-gradient(135deg, #9254de, #b37feb); }
.method-icon.icon-orange { background: linear-gradient(135deg, #faad14, #ffc53d); }
.method-icon.icon-red { background: linear-gradient(135deg, #f5222d, #ff4d4f); }
.method-icon.icon-cyan { background: linear-gradient(135deg, #13c2c2, #36cfc9); }

.method-card:hover .method-icon {
  transform: scale(1.05);
}

.method-content {
  flex: 1;
  min-width: 0;
}

.method-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}

.method-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.check-icon {
  color: var(--primary-color);
  font-size: 16px;
}

.method-desc {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 滚动条 */
.method-list::-webkit-scrollbar {
  width: 4px;
}

.method-list::-webkit-scrollbar-thumb {
  background: var(--text-placeholder);
  border-radius: var(--radius-full);
}

.method-list::-webkit-scrollbar-track {
  background: transparent;
}
</style>
