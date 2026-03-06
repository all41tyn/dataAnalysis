<template>
  <div class="result-table" v-if="processedData && processedData.length">
    <div class="table-toolbar">
      <span class="row-count">共 {{ processedData.length }} 条记录</span>
      <span class="data-info" v-if="originalData !== processedData">
        (已转换格式)
      </span>
    </div>
    <div class="table-wrapper">
      <el-table 
        :data="processedData" 
        stripe 
        border 
        max-height="550" 
        style="width: 100%"
        :header-cell-style="{ background: 'var(--fill-color)', fontWeight: '600' }"
      >
        <el-table-column
          v-for="col in tableColumns"
          :key="col"
          :prop="col"
          :label="col"
          min-width="130"
          show-overflow-tooltip
        />
      </el-table>
    </div>
  </div>
  <div v-else class="empty-state">
    <div class="empty-icon-wrapper">
      <el-icon class="empty-icon"><Grid /></el-icon>
    </div>
    <p class="empty-title">暂无表格数据</p>
    <p class="empty-desc" v-if="data !== null && data !== undefined">
      数据格式: {{ Array.isArray(data) ? '数组[' + data.length + ']' : typeof data }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Grid } from '@element-plus/icons-vue'

const props = defineProps({
  data: { type: [Array, Object], default: () => [] }
})

// 处理不同格式的数据
const processedData = computed(() => {
  console.log('ResultTable 接收数据:', props.data)
  console.log('数据类型:', typeof props.data)
  console.log('是否为数组:', Array.isArray(props.data))
  
  // 如果是数组，直接返回
  if (Array.isArray(props.data)) {
    console.log('直接使用数组数据，长度:', props.data.length)
    return props.data
  }
  
  // 如果是对象，尝试提取数据
  if (props.data && typeof props.data === 'object') {
    // 检查是否有 data 字段
    if (Array.isArray(props.data.data)) {
      console.log('使用 data 字段作为表格数据')
      return props.data.data
    }
    
    // 检查是否有 detail_table 字段
    if (Array.isArray(props.data.detail_table)) {
      console.log('使用 detail_table 字段作为表格数据')
      return props.data.detail_table
    }
    
    // 尝试将对象转换为单行数据
    const keys = Object.keys(props.data)
    if (keys.length > 0) {
      console.log('将对象转换为单行数据')
      return [props.data]
    }
  }
  
  console.log('无法处理的数据格式')
  return []
})

const originalData = computed(() => props.data)
const tableColumns = computed(() => {
  if (!processedData.value?.length) return []
  return Object.keys(processedData.value[0])
})
</script>

<style scoped>
.result-table {
  padding: var(--space-sm) 0;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.row-count {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.data-info {
  font-size: var(--font-size-xs);
  color: var(--primary-color);
  background: var(--primary-lighter);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.table-wrapper {
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--border-light);
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
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-placeholder);
}
</style>
