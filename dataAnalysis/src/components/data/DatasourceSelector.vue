<template>
  <el-dialog
    v-model="dialogVisible"
    width="800px"
    :close-on-click-modal="false"
    destroy-on-close
    class="datasource-dialog"
    :show-close="false"
  >
    <template #header="{ close }">
      <div class="dialog-header">
        <div class="header-icon">
          <el-icon :size="20"><Document /></el-icon>
        </div>
        <div class="header-text">
          <h3 class="dialog-title">选择数据源</h3>
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
    
    <!-- 搜索区域 -->
    <div class="search-area">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索数据源名称..."
        clearable
        size="large"
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 数据源列表 -->
    <div class="datasource-list" v-loading="loading">
      <div 
        v-for="ds in filteredDatasources" 
        :key="ds.id"
        class="datasource-item"
        :class="{ selected: modelValue === ds.id }"
        @click="selectDatasource(ds)"
      >
        <!-- 左侧图标 -->
        <div class="datasource-icon">
          <el-icon><Document /></el-icon>
        </div>
        
        <!-- 中间信息 -->
        <div class="datasource-info">
          <div class="datasource-name">{{ ds.name }}</div>
          <div class="datasource-meta">
            {{ ds.row_count || 0 }} 行 · {{ ds.col_count || 0 }} 列
          </div>
        </div>
        
        <!-- 右侧状态 -->
        <div class="datasource-status">
          <el-icon v-if="modelValue === ds.id" class="selected-icon"><Check /></el-icon>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="filteredDatasources.length === 0 && !loading" class="empty-state">
        <el-icon class="empty-icon"><FolderOpened /></el-icon>
        <p class="empty-text">
          {{ searchKeyword ? '未找到匹配的数据源' : '暂无数据源' }}
        </p>
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="cancel">取消</el-button>
        <el-button 
          type="primary" 
          @click="confirm"
          :disabled="!modelValue"
        >
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, Document, Check, FolderOpened, Close } from '@element-plus/icons-vue'
import { getDatasources } from '../../api/analysis.js'

const props = defineProps({
  modelValue: [Number, String],
  visible: Boolean
})

const emit = defineEmits(['update:modelValue', 'update:visible', 'confirm'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val)
})

const searchKeyword = ref('')
const datasources = ref([])
const loading = ref(false)

// 过滤后的数据源列表
const filteredDatasources = computed(() => {
  if (!searchKeyword.value) {
    return datasources.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return datasources.value.filter(ds => 
    ds.name.toLowerCase().includes(keyword)
  )
})

// 选择数据源
function selectDatasource(datasource) {
  emit('update:modelValue', datasource.id)
}

// 确认选择
function confirm() {
  emit('confirm', props.modelValue)
  emit('update:visible', false)
}

// 取消
function cancel() {
  emit('update:visible', false)
}

// 加载数据源列表
async function loadDatasources() {
  loading.value = true
  try {
    const res = await getDatasources()
    datasources.value = res.data || []
  } catch (e) {
    datasources.value = []
  } finally {
    loading.value = false
  }
}

// 监听弹窗显示状态
watch(() => props.visible, (val) => {
  if (val) {
    loadDatasources()
    searchKeyword.value = ''
  }
})
</script>

<style>
/* 全局样式 - 修复数据源选择弹窗关闭按钮位置 */
.datasource-dialog.el-dialog__wrapper .el-dialog {
  position: relative !important;
}

.datasource-dialog.el-dialog__wrapper .el-dialog__header {
  padding: 0 !important;
}
</style>

<style scoped>
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
.search-area {
  margin-bottom: var(--space-lg);
}

.search-input {
  width: 100%;
}

.datasource-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-sm);
}

/* 防止意外元素溢出 */
.datasource-list ::v-deep(*) {
  box-sizing: border-box;
}

.datasource-item {
  display: flex;
  align-items: center;
  padding: var(--space-sm);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-height: 60px;
}

.datasource-item:hover {
  background: var(--fill-color);
}

.datasource-item.selected {
  border-color: var(--primary-color);
  background: var(--primary-lighter);
}

.datasource-icon {
  width: 32px;
  height: 32px;
  background: var(--success-light);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--success-color);
  margin-right: var(--space-sm);
  flex-shrink: 0;
}

.datasource-info {
  flex: 1;
  min-width: 0;
}

.datasource-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.datasource-meta {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.datasource-status {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.selected-icon {
  color: var(--primary-color);
  font-size: 18px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  color: var(--text-placeholder);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-md);
}

.empty-text {
  font-size: var(--font-size-base);
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}
</style>