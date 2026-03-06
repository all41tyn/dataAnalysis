<template>
  <div class="field-select">
    <div class="panel-header">
      <el-icon><List /></el-icon>
      <span>选择字段</span>
    </div>

    <!-- 搜索 -->
    <el-input
      v-model="searchText"
      placeholder="搜索字段"
      clearable
      size="small"
      style="margin-bottom: 10px;"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>

    <!-- 类型筛选 -->
    <div class="type-tags">
      <el-tag
        v-for="t in typeOptions"
        :key="t.value"
        :type="activeType === t.value ? '' : 'info'"
        :effect="activeType === t.value ? 'dark' : 'plain'"
        class="type-tag"
        @click="activeType = t.value"
      >
        {{ t.label }}
      </el-tag>
    </div>

    <!-- 字段列表 -->
    <div class="field-list">
      <el-checkbox-group v-model="store.selectedFields">
        <div
          v-for="field in filteredFields"
          :key="field.id"
          class="field-item"
        >
          <el-checkbox :value="field.original_name">
            <span class="field-label">{{ field.original_name }}</span>
          </el-checkbox>
        </div>
      </el-checkbox-group>

      <div v-if="!filteredFields.length" class="no-result">
        无匹配字段
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { List, Search } from '@element-plus/icons-vue'
import { useDatasourceStore } from '../../stores/datasource.js'
import { useAnalysisStore } from '../../stores/analysis.js'

const dsStore = useDatasourceStore()
const store = useAnalysisStore()

const searchText = ref('')
const activeType = ref('')

const typeOptions = [
  { value: '', label: '全部' },
  { value: 'number', label: '数字' },
  { value: 'text', label: '文本' },
  { value: 'datetime', label: '时间' },
  { value: 'enum', label: '枚举' }
]

const filteredFields = computed(() => {
  let fields = dsStore.fields
  if (activeType.value) {
    fields = fields.filter(f => f.data_type === activeType.value)
  }
  if (searchText.value) {
    const keyword = searchText.value.toLowerCase()
    fields = fields.filter(f =>
      (f.original_name || '').toLowerCase().includes(keyword) ||
      (f.display_name || '').toLowerCase().includes(keyword)
    )
  }
  return fields
})
</script>

<style scoped>
.field-select {
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

.type-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.type-tag {
  cursor: pointer;
}

.field-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

.field-item {
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
}

.field-item:last-child {
  border-bottom: none;
}

.field-label {
  font-size: 14px;
}

.no-result {
  text-align: center;
  padding: 24px;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
