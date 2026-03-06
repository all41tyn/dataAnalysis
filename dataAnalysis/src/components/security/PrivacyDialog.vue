<template>
  <el-dialog
    v-model="visible"
    width="720px"
    :close-on-click-modal="false"
    destroy-on-close
    class="privacy-dialog"
    @open="onOpen"
  >
    <!-- 自定义头部 -->
    <template #header>
      <div class="dialog-header">
        <div class="header-icon">
          <el-icon :size="20"><Lock /></el-icon>
        </div>
        <div class="header-text">
          <h3 class="dialog-title">隐私与安全设置</h3>
          <p class="dialog-subtitle">配置字段的加密和脱敏规则</p>
        </div>
      </div>
    </template>

    <!-- 警告信息 -->
    <div class="warning-card">
      <div class="warning-icon">
        <el-icon :size="24"><Warning /></el-icon>
      </div>
      <div class="warning-content">
        <h4 class="warning-title">加密与数据屏蔽警告</h4>
        <p class="warning-text">
          本平台的部分功能使用了AI大模型进行辅助分析。数据加密可以保障人工智能处理后的数据唯一性，
          但无法保证大模型原始的数据回忆可靠性。而数据屏蔽/脱敏会用格式化值替换特定数据点，
          可能会破坏数据唯一性从而降低分析精度。
        </p>
      </div>
    </div>

    <!-- 字段类型筛选 -->
    <div class="filter-section">
      <span class="filter-label">数据类型筛选</span>
      <div class="filter-tabs">
        <button
          v-for="tab in typeOptions"
          :key="tab.value"
          :class="['filter-tab', { active: typeFilter === tab.value }]"
          @click="typeFilter = tab.value"
        >
          <el-icon v-if="tab.icon" :size="14"><component :is="tab.icon" /></el-icon>
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 字段列表 -->
    <div class="field-list" v-loading="saving || loadingRules">
      <TransitionGroup name="field">
        <div
          v-for="field in filteredFields"
          :key="field.id"
          :class="[
            'field-card',
            { 
              'has-settings': fieldRules[field.id] !== 'none',
              'encrypt': fieldRules[field.id] === 'encrypt',
              'desensitize': fieldRules[field.id] === 'desensitize'
            }
          ]"
        >
          <div class="field-info">
            <span class="field-name">{{ field.original_name || field.display_name }}</span>
            <span :class="['field-type', `type-${field.data_type}`]">
              {{ getTypeLabel(field.data_type) }}
            </span>
            <!-- 状态指示器 -->
            <span 
              v-if="fieldRules[field.id] !== 'none'" 
              :class="['status-indicator', fieldRules[field.id]]"
            >
              <el-icon :size="12">
                <component :is="fieldRules[field.id] === 'encrypt' ? 'Key' : 'Hide'" />
              </el-icon>
            </span>
          </div>
          <div class="field-actions">
            <div class="rule-options">
              <button
                v-for="rule in ruleOptions.filter(r => r.value !== 'desensitize')"
                :key="rule.value"
                :class="['rule-btn', rule.value, { active: fieldRules[field.id] === rule.value }]"
                @click="fieldRules[field.id] = rule.value"
              >
                <el-icon :size="14"><component :is="rule.icon" /></el-icon>
                {{ rule.label }}
              </button>
            </div>
            
            <!-- 脱敏一体化区域 -->
            <div class="desensitize-unified" :class="{ active: fieldRules[field.id] === 'desensitize', disabled: fieldRules[field.id] !== 'desensitize' }">
              <button 
                class="desensitize-toggle"
                :class="{ active: fieldRules[field.id] === 'desensitize' }"
                @click="fieldRules[field.id] = fieldRules[field.id] === 'desensitize' ? 'none' : 'desensitize'"
              >
                <el-icon :size="14"><Hide /></el-icon>
                <span>脱敏</span>
              </button>
              
              <div class="pattern-selector">
                <el-select
                  v-model="fieldPatterns[field.id]"
                  placeholder="选择脱敏模式"
                  size="small"
                  filterable
                  :loading="loadingPatterns"
                  :disabled="fieldRules[field.id] !== 'desensitize'"
                >
                  <el-option
                    v-for="pattern in desensitizePatterns"
                    :key="pattern.value"
                    :label="pattern.label"
                    :value="pattern.value"
                  />
                </el-select>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <div v-if="!filteredFields.length" class="empty-state">
        <el-icon :size="48" class="empty-icon"><Document /></el-icon>
        <p class="empty-text">暂无符合条件的字段</p>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar" v-if="filteredFields.length">
      <div class="stat-item">
        <span class="stat-value">{{ encryptCount }}</span>
        <span class="stat-label">加密字段</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ desensitizeCount }}</span>
        <span class="stat-label">脱敏字段</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-value">{{ noneCount }}</span>
        <span class="stat-label">未处理</span>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button class="btn-cancel" @click="visible = false">取消</el-button>
        <el-button type="primary" class="btn-save" :loading="saving" @click="handleSave">
          <el-icon v-if="!saving"><Check /></el-icon>
          保存设置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, Warning, Document, Check, Key, Hide, CircleClose, Grid, Document as DocIcon, Clock, List } from '@element-plus/icons-vue'
import { useDatasourceStore } from '../../stores/datasource.js'
import { applySecurityRule, getSecurityRules, getDesensitizePatterns, deleteSecurityRule } from '../../api/security.js'

const props = defineProps({
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue', 'rules-saved'])

const dsStore = useDatasourceStore()
const typeFilter = ref('')
const fieldRules = ref({})
const fieldPatterns = ref({}) // 存储每个字段的脱敏模式
const fieldRuleIds = ref({}) // 存储每个字段对应的规则ID
const originalFieldRules = ref({}) // 存储原始规则状态用于比较
const desensitizePatterns = ref([]) // 脱敏模式选项
const saving = ref(false)
const loadingPatterns = ref(false)
const loadingRules = ref(false)

// 类型筛选选项
const typeOptions = [
  { value: '', label: '全部', icon: null },
  { value: 'number', label: '数字', icon: Grid },
  { value: 'text', label: '文本', icon: DocIcon },
  { value: 'datetime', label: '时间', icon: Clock },
  { value: 'enum', label: '枚举', icon: List }
]

// 规则选项
const ruleOptions = [
  { value: 'none', label: '无', icon: CircleClose },
  { value: 'encrypt', label: '加密', icon: Key },
  { value: 'desensitize', label: '脱敏', icon: Hide }
]

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const filteredFields = computed(() => {
  const fields = dsStore.fields
  if (!typeFilter.value) return fields
  return fields.filter(f => f.data_type === typeFilter.value)
})

// 统计数据
const encryptCount = computed(() => 
  Object.values(fieldRules.value).filter(v => v === 'encrypt').length
)
const desensitizeCount = computed(() => 
  Object.values(fieldRules.value).filter(v => v === 'desensitize').length
)
const noneCount = computed(() => 
  Object.values(fieldRules.value).filter(v => v === 'none').length
)

function getTypeLabel(type) {
  const map = { number: '数字', text: '文本', datetime: '时间', enum: '枚举' }
  return map[type] || type
}

// 获取脱敏模式列表
async function loadDesensitizePatterns() {
  if (desensitizePatterns.value.length > 0) return // 已加载过则不重复请求
  
  loadingPatterns.value = true
  try {
    const res = await getDesensitizePatterns()
    // API返回的数据格式: [{value, label, example}, ...]
    // 直接使用API返回的数据，显示label，传递value
    const patterns = res.data?.data || res.data?.patterns || res.data
    if (Array.isArray(patterns) && patterns.length > 0) {
      // 过滤掉自定义正则选项
      desensitizePatterns.value = patterns
        .filter(item => item.value !== 'custom')
        .map(item => ({
          value: item.value,
          label: item.label,
          example: item.example
        }))
    } else {
      throw new Error('Invalid response format')
    }
  } catch (e) {
    console.error('获取脱敏模式失败:', e)
    // 使用默认选项（与API返回格式一致，排除自定义正则）
    desensitizePatterns.value = [
      { value: 'phone', label: '手机号', example: '138****5678' },
      { value: 'idcard', label: '身份证', example: '110***********1234' },
      { value: 'credit_code', label: '统一信用代码', example: '9111****MA01****1X' },
      { value: 'address', label: '地址', example: '北京市朝阳区****' },
      { value: 'email', label: '邮箱', example: 'u***@example.com' }
    ]
  } finally {
    loadingPatterns.value = false
  }
}

// 获取字段的安全规则设置
async function loadFieldSecurityRules() {
  const dsId = dsStore.currentDatasource?.id
  console.log('查询安全规则 - datasource_id:', dsId)
  if (!dsId) {
    // 没有数据源时初始化为空
    fieldRules.value = {}
    fieldPatterns.value = {}
    dsStore.fields.forEach(f => {
      fieldRules.value[f.id] = 'none'
      fieldPatterns.value[f.id] = 'phone'
    })
    loadingRules.value = false
    return
  }

  try {
    const res = await getSecurityRules(dsId)
    console.log('API 原始返回:', res)
    
    // 兼容不同的返回格式
    let rules = []
    if (res.data?.rules) {
      rules = res.data.rules
    } else if (res.rules) {
      rules = res.rules
    } else if (Array.isArray(res.data)) {
      rules = res.data
    } else if (Array.isArray(res)) {
      rules = res
    }
    
    console.log('解析后的规则列表:', rules)
    
    // 重置所有字段为默认值
    fieldRules.value = {}
    fieldPatterns.value = {}
    fieldRuleIds.value = {} // 重置规则ID映射
    
    // 初始化所有字段为"无"
    dsStore.fields.forEach(f => {
      fieldRules.value[f.id] = 'none'
      fieldPatterns.value[f.id] = 'phone' // 默认脱敏模式
    })
    
    // 应用已有的规则
    if (Array.isArray(rules) && rules.length > 0) {
      rules.forEach(rule => {
        console.log('处理规则:', rule)
        // 兼容 field_id 可能是字符串或数字
        const fieldId = parseInt(rule.field_id)
        console.log('字段ID:', fieldId, '是否存在:', fieldRules.value.hasOwnProperty(fieldId))
        
        if (!isNaN(fieldId) && fieldRules.value.hasOwnProperty(fieldId)) {
          fieldRules.value[fieldId] = rule.rule_type
          fieldRuleIds.value[fieldId] = rule.id // 保存规则ID
          if (rule.rule_type === 'desensitize' && rule.desensitize_pattern) {
            fieldPatterns.value[fieldId] = rule.desensitize_pattern
          }
          console.log('已应用规则到字段', fieldId, ':', rule.rule_type, '规则ID:', rule.id)
        }
      })
    }
    
    console.log('最终状态 - fieldRules:', JSON.stringify(fieldRules.value))
    // 保存原始状态用于后续比较
    originalFieldRules.value = { ...fieldRules.value }
  } catch (e) {
    console.error('获取安全规则失败:', e)
    // 出错时使用字段自身的默认值
    fieldRules.value = {}
    fieldPatterns.value = {}
    dsStore.fields.forEach(f => {
      fieldRules.value[f.id] = f.security_type || 'none'
      fieldPatterns.value[f.id] = f.desensitize_pattern || 'phone'
    })
  } finally {
    loadingRules.value = false
  }
}

function onOpen() {
  // 先显示加载状态，避免闪烁
  loadingRules.value = true
  
  // 并行加载脱敏模式和安全规则
  Promise.all([
    loadDesensitizePatterns(),
    loadFieldSecurityRules()
  ]).catch(err => {
    console.error('初始化数据失败:', err)
    loadingRules.value = false
  })
}

async function handleSave() {
  const dsId = dsStore.currentDatasource?.id
  if (!dsId) return

  saving.value = true
  try {
    console.log('=== 开始保存隐私设置 ===')
    console.log('当前字段规则状态:', fieldRules.value)
    console.log('原始字段规则状态:', originalFieldRules.value)
    console.log('字段规则ID映射:', fieldRuleIds.value)
    
    // 找出需要处理的字段
    const fieldChanges = []
    
    // 检查每个字段的变化
    for (const field of dsStore.fields) {
      const fieldId = field.id
      const newRuleType = fieldRules.value[fieldId] || 'none'
      const oldRuleType = originalFieldRules.value[fieldId] || 'none'
      const ruleId = fieldRuleIds.value[fieldId] // 原有规则ID
      
      const hasChange = oldRuleType !== newRuleType
      const needDelete = ruleId && hasChange
      const needApply = newRuleType !== 'none'
      
      console.log(`字段 ${fieldId} (${field.original_name}):`, {
        oldRule: oldRuleType,
        newRule: newRuleType,
        ruleId: ruleId,
        hasChange: hasChange,
        needDelete: needDelete,
        needApply: needApply
      })
      
      fieldChanges.push({
        field_id: fieldId,
        field_name: field.original_name,
        old_rule_type: oldRuleType,
        new_rule_type: newRuleType,
        rule_id: ruleId,
        has_change: hasChange,
        need_delete: needDelete,
        need_apply: needApply,
        desensitize_pattern: newRuleType === 'desensitize' ? fieldPatterns.value[fieldId] : undefined
      })
    }
    
    console.log('=== 字段变更详情 ===', fieldChanges)
    
    // 处理每个字段的规则变更
    for (const change of fieldChanges) {
      console.log(`\n--- 处理字段: ${change.field_name} (ID: ${change.field_id}) ---`)
      
      // 如果有原有规则且规则发生变化，则先删除原有规则
      if (change.need_delete) {
        console.log('🔍 需要删除原有规则:', change.rule_id)
        try {
          const deleteResponse = await deleteSecurityRule(change.rule_id)
          console.log('✅ 规则删除成功:', change.rule_id, deleteResponse)
        } catch (deleteError) {
          console.error('❌ 删除规则失败:', change.rule_id, deleteError)
          ElMessage.error(`删除字段"${change.field_name}"的原有规则失败`)
          throw deleteError // 删除失败则中断整个保存过程
        }
      } else {
        console.log('➡️ 无需删除规则')
      }
      
      // 如果新规则不是"无"，则应用新规则
      if (change.need_apply) {
        const saveData = {
          datasource_id: dsId,
          field_id: change.field_id,
          rule_type: change.new_rule_type,
          desensitize_pattern: change.desensitize_pattern || ''
        }
        console.log('🔍 应用新规则请求:', saveData)
        try {
          const applyResponse = await applySecurityRule(saveData)
          console.log('✅ 新规则应用成功:', applyResponse)
        } catch (applyError) {
          console.error('❌ 应用新规则失败:', applyError)
          ElMessage.error(`应用字段"${change.field_name}"的新规则失败`)
          throw applyError // 应用失败则中断整个保存过程
        }
      } else {
        console.log('➡️ 无需应用新规则')
      }
    }

    ElMessage.success('隐私设置保存成功')
    visible.value = false
    // 通知父组件刷新数据
    emit('rules-saved')
  } catch (e) {
    console.error('保存失败:', e)
    ElMessage.error('隐私设置保存失败: ' + (e.message || '未知错误'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* 对话框头部 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-lg);
  background: linear-gradient(135deg, var(--warning-color), #ffc53d);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(250, 173, 20, 0.3);
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.dialog-subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
}

/* 警告卡片 */
.warning-card {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: linear-gradient(135deg, #fffbe6 0%, #fff7e0 100%);
  border: 1px solid #ffe58f;
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-lg);
}

.warning-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: rgba(250, 173, 20, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--warning-color);
}

.warning-content {
  flex: 1;
}

.warning-title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #ad6800;
}

.warning-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #614700;
}

/* 筛选区域 */
.filter-section {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.filter-label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.filter-tabs {
  display: flex;
  gap: var(--space-xs);
  flex-wrap: wrap;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  background: white;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-tab:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.filter-tab.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

/* 字段列表 */
.field-list {
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

.field-list::-webkit-scrollbar {
  width: 6px;
}

.field-list::-webkit-scrollbar-track {
  background: transparent;
}

.field-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.field-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-placeholder);
}

/* 字段卡片 */
.field-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-sm);
  transition: all var(--transition-fast);
}

.field-card:hover {
  border-color: var(--border-color);
  background: white;
}

/* 有设置的字段添加视觉标识 */
.field-card.has-settings {
  border-left: 3px solid var(--primary-color);
  background: var(--primary-lighter);
}

.field-card.has-settings.encrypt {
  border-left-color: var(--primary-color);
  background: linear-gradient(90deg, var(--primary-lighter) 0%, var(--primary-light) 100%);
}

.field-card.has-settings.desensitize {
  border-left-color: var(--warning-color);
  background: linear-gradient(90deg, #fffbe6 0%, #fff7e0 100%);
}

/* 确保未设置字段的样式统一 */
.field-card:not(.has-settings) {
  border-left: 3px solid transparent;
  background: var(--bg-secondary);
}

.field-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.field-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.field-type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
}

.field-type.type-number {
  background: #e6f4ff;
  color: #1677ff;
}

.field-type.type-text {
  background: #f6ffed;
  color: #52c41a;
}

.field-type.type-datetime {
  background: #fff7e6;
  color: #fa8c16;
}

.field-type.type-enum {
  background: #f9f0ff;
  color: #722ed1;
}

/* 状态指示器 */
.status-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  color: white;
}

.status-indicator.encrypt {
  background: var(--primary-color);
}

.status-indicator.desensitize {
  background: var(--warning-color);
}

/* 规则选项 */
.rule-options {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.rule-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: white;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.rule-btn:hover {
  border-color: var(--text-placeholder);
}

.rule-btn.active.none {
  background: var(--bg-tertiary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

.rule-btn.active.encrypt {
  background: linear-gradient(135deg, #4468f1, #667eea);
  border-color: var(--primary-color);
  color: white;
  box-shadow: 0 2px 8px rgba(68, 104, 241, 0.25);
}

.rule-btn.active.desensitize {
  background: linear-gradient(135deg, #faad14, #ffc53d);
  border-color: var(--warning-color);
  color: white;
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.25);
}

/* 脱敏一体化区域 */
.desensitize-unified {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: white;
  transition: all var(--transition-fast);
  min-width: 220px;
  overflow: hidden;
}

.desensitize-unified:hover {
  border-color: var(--text-placeholder);
}

.desensitize-unified:not(.disabled):hover {
  border-color: var(--border-color);
}

.desensitize-unified.active {
  border-color: var(--warning-color);
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.2);
}

.desensitize-unified.disabled {
  background: var(--fill-lighter);
  border-color: var(--border-light);
}

.desensitize-unified.disabled:hover {
  border-color: var(--border-light);
}

.desensitize-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: transparent;
  border: none;
  border-right: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.desensitize-unified.disabled .desensitize-toggle {
  color: var(--text-placeholder);
  cursor: not-allowed;
}

.desensitize-toggle:hover:not(:disabled) {
  background: var(--fill-light);
}

.desensitize-toggle.active {
  background: linear-gradient(135deg, #faad14, #ffc53d);
  color: white;
}

.pattern-selector {
  flex: 1;
  min-width: 120px;
}

.pattern-selector :deep(.el-select) {
  width: 100%;
}

.pattern-selector :deep(.el-input__wrapper) {
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

.pattern-selector :deep(.el-input.is-disabled .el-input__wrapper) {
  background: transparent;
}

.field-actions {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl);
  color: var(--text-placeholder);
}

.empty-icon {
  margin-bottom: var(--space-sm);
  opacity: 0.5;
}

.empty-text {
  margin: 0;
  font-size: 14px;
}

/* 统计栏 */
.stats-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  padding: var(--space-md);
  margin-top: var(--space-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--primary-color);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: var(--border-color);
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.btn-cancel {
  border-radius: var(--radius-md);
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--radius-md);
  padding: 10px 20px;
}

/* 过渡动画 */
.field-enter-active,
.field-leave-active {
  transition: all var(--transition-base);
}

.field-enter-from,
.field-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* 响应式 */
@media (max-width: 640px) {
  .filter-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .field-card {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }
  
  .stats-bar {
    gap: var(--space-md);
  }
}
</style>
