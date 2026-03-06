<template>
  <div class="method-params">
    <!-- 已选方法导航 -->
    <div class="selected-methods-nav">
      <div class="panel-header">
        <div class="header-icon">
          <el-icon :size="18"><Setting /></el-icon>
        </div>
        <div class="header-content">
          <span class="header-title">参数配置</span>
          <span class="header-hint">为选中的方法配置参数</span>
        </div>
      </div>

      <div v-if="store.selectedMethods.length === 0" class="empty-state">
        <div class="empty-icon-wrapper">
          <el-icon :size="32"><Setting /></el-icon>
        </div>
        <p class="empty-title">请先选择分析方法</p>
        <p class="empty-desc">在左侧选择需要执行的分析方法</p>
      </div>

      <template v-else>
        <!-- 方法标签页 -->
        <div class="method-tabs">
          <div
            v-for="key in store.selectedMethods"
            :key="key"
            class="method-tab"
            :class="{ active: currentMethod === key }"
            @click="currentMethod = key"
          >
            <el-icon :size="14">
              <component :is="methodIcons[key] || 'PieChart'" />
            </el-icon>
            <span>{{ methodNames[key] }}</span>
          </div>
        </div>

        <!-- 当前方法的参数表单 -->
        <div class="params-body" v-if="currentMethod && params">
          <!-- 分布分析 -->
          <el-form v-if="currentMethod === 'distribution'" label-position="top" size="default">
            <el-form-item label="维度字段" required>
              <el-select v-model="params.dimension" placeholder="请选择维度字段" filterable style="width: 100%">
                <el-option v-for="f in dimensionFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
            <el-form-item label="Top N">
              <el-input-number v-model="params.top_n" :min="5" :max="50" :step="5" style="width: 100%" />
            </el-form-item>
          </el-form>

          <!-- 趋势分析 -->
          <el-form v-if="currentMethod === 'trend'" label-position="top" size="default">
            <el-form-item label="时间字段" required>
              <el-select v-model="params.time_field" placeholder="请选择时间字段" filterable style="width: 100%">
                <el-option v-for="f in timeFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
            <el-form-item label="度量字段">
              <el-select v-model="params.measure" placeholder="选填" clearable filterable style="width: 100%">
                <el-option v-for="f in measureFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
            <div class="form-row">
              <el-form-item label="聚合方式" class="form-row-item">
                <el-select v-model="params.agg_func" style="width: 100%">
                  <el-option label="计数" value="count" />
                  <el-option label="求和" value="sum" />
                  <el-option label="平均值" value="mean" />
                </el-select>
              </el-form-item>
              <el-form-item label="时间粒度" class="form-row-item">
                <el-select v-model="params.freq" style="width: 100%">
                  <el-option label="日" value="D" />
                  <el-option label="周" value="W" />
                  <el-option label="月" value="M" />
                  <el-option label="季" value="Q" />
                  <el-option label="年" value="Y" />
                </el-select>
              </el-form-item>
            </div>
          </el-form>

          <!-- 归因分析 -->
          <el-form v-if="currentMethod === 'attribution'" label-position="top" size="default">
            <el-form-item label="目标字段" required>
              <el-select v-model="params.target" placeholder="请选择目标字段" filterable style="width: 100%">
                <el-option v-for="f in allFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
            <el-form-item label="因素字段" required>
              <el-select v-model="params.factors" multiple placeholder="请选择因素字段" filterable style="width: 100%">
                <el-option v-for="f in allFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
          </el-form>

          <!-- 漏斗分析 -->
          <el-form v-if="currentMethod === 'funnel'" label-position="top" size="default">
            <p class="form-hint">定义漏斗的各个阶段</p>
            <div v-for="(stage, idx) in funnelStages" :key="idx" class="funnel-stage-row">
              <el-input v-model="stage.name" placeholder="阶段名称" class="stage-input" />
              <el-select v-model="stage.field" placeholder="字段" filterable class="stage-select">
                <el-option v-for="f in allFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
              <el-input v-model="stage.value" placeholder="值" class="stage-input" />
              <el-button type="danger" :icon="Delete" circle size="small" @click="funnelStages.splice(idx, 1)" />
            </div>
            <el-button type="primary" plain @click="funnelStages.push({ name: '', field: '', value: '' })">
              <el-icon><Plus /></el-icon>
              添加阶段
            </el-button>
          </el-form>

          <!-- 热力分析 -->
          <el-form v-if="currentMethod === 'heatmap'" label-position="top" size="default">
            <div class="form-row">
              <el-form-item label="X轴字段" required class="form-row-item">
                <el-select v-model="params.x_field" placeholder="请选择" filterable style="width: 100%">
                  <el-option v-for="f in dimensionFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
                </el-select>
              </el-form-item>
              <el-form-item label="Y轴字段" required class="form-row-item">
                <el-select v-model="params.y_field" placeholder="请选择" filterable style="width: 100%">
                  <el-option v-for="f in dimensionFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
                </el-select>
              </el-form-item>
            </div>
            <div class="form-row">
              <el-form-item label="度量字段" class="form-row-item">
                <el-select v-model="params.measure" placeholder="请选择" filterable style="width: 100%">
                  <el-option v-for="f in allFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
                </el-select>
              </el-form-item>
              <el-form-item label="聚合方式" class="form-row-item">
                <el-select v-model="params.agg_func" style="width: 100%">
                  <el-option label="计数" value="count" />
                  <el-option label="求和" value="sum" />
                  <el-option label="平均值" value="mean" />
                </el-select>
              </el-form-item>
            </div>
          </el-form>

          <!-- 交叉分析 -->
          <el-form v-if="currentMethod === 'cross'" label-position="top" size="default">
            <el-form-item label="维度字段" required>
              <el-select v-model="params.dimensions" multiple placeholder="请选择2个维度" filterable style="width: 100%">
                <el-option v-for="f in dimensionFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
            <div class="form-row">
              <el-form-item label="度量字段" class="form-row-item">
                <el-select v-model="params.measure" placeholder="请选择" filterable style="width: 100%">
                  <el-option v-for="f in allFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
                </el-select>
              </el-form-item>
              <el-form-item label="聚合方式" class="form-row-item">
                <el-select v-model="params.agg_func" style="width: 100%">
                  <el-option label="计数" value="count" />
                  <el-option label="求和" value="sum" />
                  <el-option label="平均值" value="mean" />
                </el-select>
              </el-form-item>
            </div>
          </el-form>

          <!-- 相关性分析 -->
          <el-form v-if="currentMethod === 'correlation'" label-position="top" size="default">
            <el-form-item label="度量字段" required>
              <el-select v-model="params.fields" multiple placeholder="选择多个度量字段" filterable style="width: 100%">
                <el-option v-for="f in measureFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
          </el-form>

          <!-- 异常值检测 -->
          <el-form v-if="currentMethod === 'outlier'" label-position="top" size="default">
            <el-form-item label="度量字段" required>
              <el-select v-model="params.field" placeholder="请选择" filterable style="width: 100%">
                <el-option v-for="f in measureFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
            <div class="form-row">
              <el-form-item label="检测方法" class="form-row-item">
                <el-select v-model="params.method" style="width: 100%">
                  <el-option label="IQR (四分位距)" value="iqr" />
                  <el-option label="Z-Score" value="zscore" />
                </el-select>
              </el-form-item>
              <el-form-item label="阈值" class="form-row-item">
                <el-input-number v-model="params.threshold" :min="0.5" :max="5" :step="0.5" :precision="1" style="width: 100%" />
              </el-form-item>
            </div>
          </el-form>

          <!-- 聚类分析 -->
          <el-form v-if="currentMethod === 'clustering'" label-position="top" size="default">
            <el-form-item label="度量字段" required>
              <el-select v-model="params.fields" multiple placeholder="选择多个度量字段" filterable style="width: 100%">
                <el-option v-for="f in measureFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
            <el-form-item label="聚类数">
              <el-input-number v-model="params.n_clusters" :min="2" :max="10" style="width: 100%" />
            </el-form-item>
          </el-form>

          <!-- 帕累托分析 -->
          <el-form v-if="currentMethod === 'pareto'" label-position="top" size="default">
            <el-form-item label="维度字段" required>
              <el-select v-model="params.dimension" placeholder="请选择" filterable style="width: 100%">
                <el-option v-for="f in dimensionFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
            <el-form-item label="阈值 (%)">
              <el-slider v-model="params.threshold" :min="50" :max="100" show-input />
            </el-form-item>
          </el-form>

          <!-- 对比分析 -->
          <el-form v-if="currentMethod === 'comparison'" label-position="top" size="default">
            <el-form-item label="分组字段" required>
              <el-select v-model="params.group_field" placeholder="请选择" filterable style="width: 100%">
                <el-option v-for="f in dimensionFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
            <el-form-item label="度量字段" required>
              <el-select v-model="params.measure_fields" multiple placeholder="请选择" filterable style="width: 100%">
                <el-option v-for="f in numberFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
            <div class="form-row">
              <el-form-item label="聚合方式" class="form-row-item">
                <el-select v-model="params.agg_funcs" multiple style="width: 100%">
                  <el-option label="均值" value="mean" />
                  <el-option label="求和" value="sum" />
                  <el-option label="计数" value="count" />
                </el-select>
              </el-form-item>
              <el-form-item label="Top N" class="form-row-item">
                <el-input-number v-model="params.top_n" :min="5" :max="50" :step="5" style="width: 100%" />
              </el-form-item>
            </div>
          </el-form>

          <!-- 描述性统计 -->
          <el-form v-if="currentMethod === 'statistics'" label-position="top" size="default">
            <el-form-item label="度量字段" required>
              <el-select v-model="params.fields" multiple placeholder="请选择" filterable style="width: 100%">
                <el-option v-for="f in measureFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
            <el-form-item label="分组字段">
              <el-select v-model="params.group_by" placeholder="可选" clearable filterable style="width: 100%">
                <el-option v-for="f in dimensionFields" :key="f.id" :label="f.original_name" :value="f.original_name" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  Setting, Delete, Plus, PieChart, TrendCharts, Histogram,
  Connection, Grid, Operation, Warning, Rank, Switch, Odometer
} from '@element-plus/icons-vue'
import { useAnalysisStore } from '../../stores/analysis.js'
import { useDatasourceStore } from '../../stores/datasource.js'

const store = useAnalysisStore()
const dsStore = useDatasourceStore()

const currentMethod = ref('')

const methodNames = {
  distribution: '分布分析', trend: '趋势分析', attribution: '归因分析',
  funnel: '漏斗分析', heatmap: '热力分析', cross: '交叉分析',
  correlation: '相关性分析', outlier: '异常值检测', clustering: '聚类分析',
  pareto: '帕累托分析', comparison: '对比分析', statistics: '描述性统计'
}

const methodIcons = {
  distribution: 'PieChart', trend: 'TrendCharts', attribution: 'Connection',
  funnel: 'Rank', heatmap: 'Grid', cross: 'Grid',
  correlation: 'Connection', outlier: 'Warning', clustering: 'Operation',
  pareto: 'Histogram', comparison: 'Switch', statistics: 'Odometer'
}

const params = computed(() => store.methodParamsMap[currentMethod.value])

const allFields = computed(() => dsStore.fields)
const measureFields = computed(() => dsStore.fields.filter(f => f.is_measure === true))
const numberFields = computed(() => dsStore.fields.filter(f => f.data_type === 'number'))
const timeFields = computed(() => dsStore.fields.filter(f => f.data_type === 'datetime'))
const dimensionFields = computed(() => dsStore.fields.filter(f => f.is_dimension || f.data_type === 'enum' || f.data_type === 'text'))

const funnelStages = ref([
  { name: '', field: '', value: '' },
  { name: '', field: '', value: '' }
])

watch(funnelStages, (val) => {
  if (currentMethod.value === 'funnel' && params.value) {
    params.value.stages = val.filter(s => s.name && s.field && s.value)
  }
}, { deep: true })

watch(currentMethod, (method) => {
  if (method === 'funnel') {
    const p = store.methodParamsMap[method]
    if (p?.stages?.length) {
      funnelStages.value = [...p.stages]
    } else {
      funnelStages.value = [
        { name: '', field: '', value: '' },
        { name: '', field: '', value: '' }
      ]
    }
  }
})

watch(() => store.selectedMethods.length, () => {
  if (store.selectedMethods.length === 0) {
    currentMethod.value = ''
  } else if (!store.selectedMethods.includes(currentMethod.value)) {
    currentMethod.value = store.selectedMethods[0]
  }
}, { immediate: true })

function focusMethod(key) {
  currentMethod.value = key
}

defineExpose({ focusMethod })
</script>

<style scoped>
.method-params {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.selected-methods-nav {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.header-icon {
  width: 36px;
  height: 36px;
  background: var(--warning-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--warning-color);
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

/* 方法标签页 */
.method-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-light);
}

.method-tab {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: var(--fill-lighter);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all var(--transition-base);
  user-select: none;
}

.method-tab:hover {
  border-color: var(--primary-light);
  background: var(--primary-lighter);
}

.method-tab.active {
  color: var(--primary-color);
  border-color: var(--primary-color);
  background: var(--primary-bg);
  font-weight: var(--font-weight-medium);
}

/* 参数表单 */
.params-body {
  flex: 1;
  overflow-y: auto;
  background: var(--fill-lighter);
  border-radius: var(--radius-md);
  padding: var(--space-md);
}

.params-body :deep(.el-form-item__label) {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.form-row {
  display: flex;
  gap: var(--space-md);
}

.form-row-item {
  flex: 1;
}

.form-hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--space-md);
}

.empty-icon-wrapper {
  width: 64px;
  height: 64px;
  background: var(--fill-color);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-placeholder);
  margin-bottom: var(--space-md);
}

.empty-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 漏斗阶段 */
.funnel-stage-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.stage-input {
  width: 100px;
}

.stage-select {
  width: 140px;
}

/* 滚动条 */
.params-body::-webkit-scrollbar {
  width: 4px;
}

.params-body::-webkit-scrollbar-thumb {
  background: var(--text-placeholder);
  border-radius: var(--radius-full);
}
</style>
