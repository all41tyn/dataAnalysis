<template>
  <div class="filter-config">
    <div class="panel-header">
      <el-icon><Filter /></el-icon>
      <span>设置范围</span>
    </div>

    <!-- 条件列表 -->
    <div class="filter-list">
      <div
        v-for="(filter, idx) in store.filters"
        :key="idx"
        class="filter-row"
      >
        <el-select
          v-model="filter.field"
          placeholder="字段"
          size="small"
          filterable
          style="width: 130px"
        >
          <el-option
            v-for="f in dsStore.fields"
            :key="f.id"
            :label="f.original_name"
            :value="f.original_name"
          />
        </el-select>

        <el-select
          v-model="filter.operator"
          placeholder="条件"
          size="small"
          style="width: 100px"
        >
          <el-option
            v-for="op in operators"
            :key="op.value"
            :label="op.label"
            :value="op.value"
          />
        </el-select>

        <el-input
          v-model="filter.value"
          placeholder="值"
          size="small"
          style="width: 140px"
        />

        <el-button
          type="danger"
          :icon="Delete"
          size="small"
          circle
          @click="removeFilter(idx)"
        />
      </div>
    </div>

    <!-- 添加条件 -->
    <el-button
      type="primary"
      plain
      size="small"
      style="width: 100%; margin-top: 12px;"
      @click="addFilter"
    >
      <el-icon><Plus /></el-icon>
      点击添加筛选条件
    </el-button>
  </div>
</template>

<script setup>
import { Filter, Delete, Plus } from '@element-plus/icons-vue'
import { useDatasourceStore } from '../../stores/datasource.js'
import { useAnalysisStore } from '../../stores/analysis.js'

const dsStore = useDatasourceStore()
const store = useAnalysisStore()

const operators = [
  { value: '=', label: '等于' },
  { value: '!=', label: '不等于' },
  { value: '>', label: '大于' },
  { value: '<', label: '小于' },
  { value: '>=', label: '大于等于' },
  { value: '<=', label: '小于等于' },
  { value: 'contains', label: '包含' },
  { value: 'not_contains', label: '不包含' }
]

function addFilter() {
  store.filters.push({ field: '', operator: '=', value: '' })
}

function removeFilter(idx) {
  store.filters.splice(idx, 1)
}
</script>

<style scoped>
.filter-config {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 12px;
}

.filter-list {
  flex: 1;
  overflow-y: auto;
  max-height: 360px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
</style>
