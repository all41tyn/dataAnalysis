<template>
  <div class="data-preview">
    <div class="preview-header">
      <div class="header-left">
        <div class="header-icon">
          <el-icon :size="20"><DataLine /></el-icon>
        </div>
        <div class="header-text">
          <h3 class="section-title">数据预览</h3>
          <p class="header-hint">查看数据结构与样例，仅显示前20行</p>
        </div>
      </div>
      <div v-if="dsStore.currentDatasource" class="datasource-badge">
        <el-icon><Document /></el-icon>
        <span>{{ dsStore.currentDatasource?.name }}</span>
      </div>
    </div>

    <!-- 有数据 -->
    <div v-if="dsStore.fields.length" class="preview-content">
      <!-- 字段统计 -->
      <div class="field-stats">
        <div class="stat-item">
          <span class="stat-value">{{ dsStore.currentDatasource?.row_count }}</span>
          <span class="stat-label">行数据</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ dsStore.currentDatasource?.col_count }}</span>
          <span class="stat-label">列字段</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value">{{ numberFieldCount }}</span>
          <span class="stat-label">数值列</span>
        </div>
      </div>

      <!-- 数据表格 -->
      <div class="preview-table-container">
        <el-table
          :data="tableData"
          stripe
          border
          style="width: 100%"
          v-loading="loading"
          :max-height="600"
          :header-cell-style="{ background: 'var(--fill-color)', fontWeight: '600' }"
          :cell-style="{ height: '70px', padding: '8px 0' }"
        >
          <el-table-column
            v-for="field in dsStore.fields"
            :key="field.column_name"
            :prop="field.column_name"
            min-width="140"
          >
            <template #header>
              <div class="col-header">
                <span class="col-name">{{ field.original_name || field.display_name }}</span>
                <el-tag 
                  size="small" 
                  :type="typeTagMap[field.data_type] || 'info'" 
                  effect="plain"
                  class="col-type-tag"
                >
                  {{ typeNameMap[field.data_type] || field.data_type }}
                </el-tag>
              </div>
            </template>
            <template #default="{ row }">
              <div class="cell-content">
                <el-tooltip 
                  :content="String(row[field.column_name] || '')" 
                  placement="top"
                  :disabled="!shouldShowTooltip(row[field.column_name])"
                  popper-class="preview-tooltip"
                  effect="light"
                >
                  <div 
                    class="cell-text" 
                    :class="{ 'has-tooltip': shouldShowTooltip(row[field.column_name]) }"
                  >
                    {{ row[field.column_name] || '' }}
                  </div>
                </el-tooltip>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon-wrapper">
        <el-icon class="empty-icon"><FolderOpened /></el-icon>
      </div>
      <p class="empty-title">暂无数据</p>
      <p class="empty-desc">请先上传文件或选择已上传的数据源</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { FolderOpened, Document, DataLine } from '@element-plus/icons-vue'
import { useDatasourceStore } from '../../stores/datasource.js'

const dsStore = useDatasourceStore()
const loading = ref(false)

const typeTagMap = {
  number: 'warning',
  datetime: 'success',
  enum: '',
  text: 'info',
  boolean: 'danger'
}

const typeNameMap = {
  number: '数值',
  datetime: '时间',
  enum: '枚举',
  text: '文本',
  boolean: '布尔'
}

const numberFieldCount = computed(() => {
  return dsStore.fields.filter(f => f.data_type === 'number').length
})

// 使用 sample_values 构建预览数据
const tableData = computed(() => {
  const fields = dsStore.fields
  if (!fields.length) return []
  // 找到最大样例数量
  const maxSamples = Math.max(...fields.map(f => (f.sample_values || []).length), 0)
  if (maxSamples === 0) return []
  const rows = []
  for (let i = 0; i < maxSamples; i++) {
    const row = {}
    fields.forEach(f => {
      row[f.column_name] = f.sample_values?.[i] ?? ''
    })
    rows.push(row)
  }
  return rows
})

// 判断是否需要显示 tooltip（内容超过一定长度）
const shouldShowTooltip = (content) => {
  if (!content) return false
  const str = String(content)
  // 超过30个字符，或者包含换行符，或者显示被截断（包含省略号）
  return str.length > 30 || str.includes('\n') || str.includes('...')
}
</script>

<style scoped>
.data-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-md);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.header-icon {
  width: 44px;
  height: 44px;
  background: var(--info-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--info-color);
}

.header-text .section-title {
  margin-bottom: var(--space-xs);
}

.header-hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.datasource-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: var(--primary-bg);
  color: var(--primary-color);
  border-radius: var(--radius-full);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 字段统计 */
.field-stats {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  background: var(--fill-lighter);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm); /* 减小间距，为表格腾出更多空间 */
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: var(--space-xs);
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--border-color);
}

/* 表格容器 */
.preview-table-container {
  flex: 1;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  overflow: hidden;
  min-height: 400px; /* 适中的最小高度 */
}

/* 单元格内容样式 */
.cell-content {
  position: relative;
  width: 100%;
  height: 120px; /* 固定高度确保一致性 */
  padding: 0;
  display: flex;
  align-items: center;
}

.cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  line-height: 1.6;
  cursor: pointer;
  padding: 12px 8px;
  position: relative;
  display: block;
  height: 100%; /* 充分利用容器高度 */
}

/* 为有 tooltip 的单元格添加视觉提示 */
.cell-text.has-tooltip::after {
  content: "ⓘ";
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 12px;
  color: var(--text-secondary);
  opacity: 0.6;
}

/* 表格单元格悬停效果 */
:deep(.el-table__body tr:hover td) {
  background-color: var(--fill-lighter) !important;
}

.col-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  align-items: flex-start;
}

.col-name {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.col-type-tag {
  font-size: 9px !important;
  padding: 0 6px !important;
  height: 18px !important;
  line-height: 16px !important;
  align-self: flex-start;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.empty-icon-wrapper {
  width: 80px;
  height: 80px;
  background: var(--fill-color);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-md);
}

.empty-icon {
  font-size: 40px;
  color: var(--text-placeholder);
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

/* 滚动条 */
.preview-table-container ::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.preview-table-container ::-webkit-scrollbar-thumb {
  background: var(--text-placeholder);
  border-radius: var(--radius-full);
}

/* 自定义 tooltip 样式 */
:deep(.preview-tooltip) {
  max-width: 500px !important;
  word-wrap: break-word;
  white-space: pre-wrap; /* 保持换行符 */
  line-height: 1.6; /* 稍微增加行高提升可读性 */
  padding: 12px !important;
}
</style>
