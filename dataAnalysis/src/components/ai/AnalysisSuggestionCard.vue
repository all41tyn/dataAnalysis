<template>
  <div class="suggestion-card" :class="{ 'is-selected': selected }">
    <div class="card-header">
      <div class="method-info">
        <div class="method-icon" :class="[`icon-${getIconColor(suggestion.method)}`]">
          <el-icon :size="20">
            <component :is="getMethodIcon(suggestion.method)" />
          </el-icon>
        </div>
        <div class="method-text">
          <h4 class="method-name">{{ getMethodName(suggestion.method) }}</h4>
          <p class="method-desc">{{ getMethodDescription(suggestion.method) }}</p>
        </div>
      </div>
      <el-tag 
        v-if="suggestion.confidence" 
        :type="getConfidenceType(suggestion.confidence)"
        size="small"
        effect="plain"
      >
        置信度: {{ Math.round(suggestion.confidence * 100) }}%
      </el-tag>
    </div>

    <div class="card-content">
      <!-- 字段信息 -->
      <div v-if="fieldInfo.length" class="field-section">
        <div class="section-title">
          <el-icon><List /></el-icon>
          <span>推荐字段</span>
        </div>
        <div class="field-tags">
          <el-tag 
            v-for="field in fieldInfo" 
            :key="field"
            size="small"
            type="info"
            class="field-tag"
          >
            {{ field }}
          </el-tag>
        </div>
      </div>

      <!-- 参数配置 -->
      <div v-if="paramInfo.length" class="param-section">
        <div class="section-title">
          <el-icon><Setting /></el-icon>
          <span>参数配置</span>
        </div>
        <div class="param-list">
          <div 
            v-for="param in paramInfo" 
            :key="param.key"
            class="param-item"
          >
            <span class="param-key">{{ param.label }}:</span>
            <span class="param-value">{{ param.value }}</span>
          </div>
        </div>
      </div>

      <!-- 推荐理由 -->
      <div v-if="suggestion.reason" class="reason-section">
        <div class="section-title">
          <el-icon><Lightning /></el-icon>
          <span>推荐理由</span>
        </div>
        <p class="reason-text">{{ suggestion.reason }}</p>
      </div>

      <!-- 预期结果 -->
      <div v-if="suggestion.expected_insight" class="insight-section">
        <div class="section-title">
          <el-icon><Trophy /></el-icon>
          <span>预期结果</span>
        </div>
        <p class="insight-text">{{ suggestion.expected_insight }}</p>
      </div>
    </div>

    <div class="card-footer">
      <el-button 
        v-if="!selected"
        type="primary" 
        size="small" 
        @click="adoptSuggestion"
        class="adopt-btn"
      >
        <el-icon><Check /></el-icon>
        采纳此方案
      </el-button>
      <el-button 
        v-else
        type="success" 
        size="small" 
        disabled
        class="adopt-btn"
      >
        <el-icon><Check /></el-icon>
        已选择
      </el-button>
      <el-button 
        type="info" 
        size="small" 
        @click="viewDetails"
        plain
      >
        查看详情
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  PieChart, TrendCharts, Histogram, Connection, Grid, 
  Operation, Warning, Coin, Rank, Switch, Odometer, 
  List, Setting, Lightning, Check, Trophy
} from '@element-plus/icons-vue'

const props = defineProps({
  suggestion: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['adopt', 'view-details'])

// 方法名称映射
const methodNames = {
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

// 方法图标映射
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

// 方法描述映射
const methodDescriptions = {
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

// 图标颜色映射
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

const getMethodName = (methodKey) => {
  return methodNames[methodKey] || methodKey
}

const getMethodIcon = (methodKey) => {
  return methodIcons[methodKey] || 'PieChart'
}

const getMethodDescription = (methodKey) => {
  return methodDescriptions[methodKey] || ''
}

const getIconColor = (methodKey) => {
  return iconColors[methodKey] || 'blue'
}

const getConfidenceType = (confidence) => {
  if (confidence >= 0.8) return 'success'
  if (confidence >= 0.6) return 'warning'
  return 'danger'
}

// 提取字段信息
const fieldInfo = computed(() => {
  const params = props.suggestion.params || {}
  const fields = []
  
  // 收集所有字符串类型的参数值作为字段
  Object.values(params).forEach(value => {
    if (typeof value === 'string' && value) {
      fields.push(value)
    } else if (Array.isArray(value)) {
      value.forEach(item => {
        if (typeof item === 'string' && item) {
          fields.push(item)
        }
      })
    }
  })
  
  return [...new Set(fields)] // 去重
})

// 提取参数信息
const paramInfo = computed(() => {
  const params = props.suggestion.params || {}
  const info = []
  
  Object.entries(params).forEach(([key, value]) => {
    let label = key
    let displayValue = ''
    
    // 参数标签映射
    const paramLabels = {
      dimension: '维度字段',
      time_field: '时间字段',
      measure: '度量字段',
      agg_func: '聚合方式',
      freq: '时间粒度',
      target: '目标字段',
      factors: '因素字段',
      x_field: 'X轴字段',
      y_field: 'Y轴字段',
      fields: '字段列表',
      field: '数值字段',
      method: '检测方法',
      threshold: '阈值',
      n_clusters: '聚类数',
      group_field: '分组字段',
      measure_fields: '度量字段',
      agg_funcs: '聚合方式',
      group_by: '分组依据',
      top_n: 'Top N',
      stages: '漏斗阶段'
    }
    
    label = paramLabels[key] || key
    
    // 格式化显示值
    if (Array.isArray(value)) {
      displayValue = value.join(', ')
    } else if (typeof value === 'object' && value !== null) {
      displayValue = JSON.stringify(value)
    } else {
      // 值映射
      const valueMaps = {
        count: '计数',
        sum: '求和',
        mean: '平均值',
        iqr: 'IQR',
        zscore: 'Z-Score',
        D: '日',
        W: '周',
        M: '月',
        Q: '季',
        Y: '年'
      }
      displayValue = valueMaps[value] || String(value)
    }
    
    if (displayValue) {
      info.push({ key, label, value: displayValue })
    }
  })
  
  return info
})

function adoptSuggestion() {
  emit('adopt', props.suggestion)
}

function viewDetails() {
  emit('view-details', props.suggestion)
}
</script>

<style scoped>
.suggestion-card {
  background: var(--card-bg);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.suggestion-card:hover {
  border-color: var(--primary-light);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.suggestion-card.is-selected {
  border-color: var(--success-color);
  background: var(--success-light);
  box-shadow: 0 0 0 2px var(--success-light);
}

.suggestion-card.is-selected:hover {
  border-color: var(--success-color);
  transform: none;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--border-light);
}

.method-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
}

.method-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.method-icon.icon-blue { background: linear-gradient(135deg, #4468f1, #667eea); }
.method-icon.icon-green { background: linear-gradient(135deg, #52c41a, #73d13d); }
.method-icon.icon-purple { background: linear-gradient(135deg, #9254de, #b37feb); }
.method-icon.icon-orange { background: linear-gradient(135deg, #faad14, #ffc53d); }
.method-icon.icon-red { background: linear-gradient(135deg, #f5222d, #ff4d4f); }
.method-icon.icon-cyan { background: linear-gradient(135deg, #13c2c2, #36cfc9); }

.method-text {
  flex: 1;
  min-width: 0;
}

.method-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.method-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-content {
  margin-bottom: var(--space-md);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.field-section,
.param-section,
.reason-section,
.insight-section {
  margin-bottom: var(--space-md);
}

.field-section:last-child,
.param-section:last-child,
.reason-section:last-child,
.insight-section:last-child {
  margin-bottom: 0;
}

.field-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.field-tag {
  margin: 0;
}

.param-list {
  background: var(--fill-lighter);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
}

.param-item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-xs) 0;
  font-size: var(--font-size-sm);
}

.param-item:not(:last-child) {
  border-bottom: 1px solid var(--border-light);
}

.param-key {
  color: var(--text-secondary);
  flex-shrink: 0;
  margin-right: var(--space-sm);
}

.param-value {
  color: var(--text-primary);
  text-align: right;
  flex: 1;
  word-break: break-all;
}

.reason-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
  background: var(--fill-lighter);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  margin: 0;
}

.insight-text {
  font-size: var(--font-size-sm);
  color: var(--success-color);
  line-height: var(--line-height-relaxed);
  background: var(--success-light);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  margin: 0;
  border-left: 3px solid var(--success-color);
}

.card-footer {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

.adopt-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  border: none;
}

.adopt-btn:hover {
  background: linear-gradient(135deg, var(--primary-hover), var(--primary-color));
}
</style>