<template>
  <el-dialog
    v-model="visible"
    title="生成总结报告"
    width="700px"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <div class="dialog-content">
      <!-- 已选任务列表 -->
      <div class="selected-tasks">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          <span>已选分析任务 ({{ selectedTasks.length }})</span>
        </div>
        <el-table :data="selectedTasks" size="small" border>
          <el-table-column prop="task_id" label="任务ID" width="80">
            <template #default="{ row }">
              <span class="task-id">#{{ row.task_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="method" label="分析方法" width="120">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">
                {{ methodNameMap[row.method] || row.method }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="create_time" label="创建时间" />
        </el-table>
      </div>

      <!-- 报告配置表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-position="top"
        class="report-form"
      >
        <!-- 报告标题 -->
        <el-form-item label="报告标题" prop="title">
          <el-input
            v-model="form.title"
            placeholder="请输入报告标题，留空将自动生成"
            clearable
          />
        </el-form-item>

        <!-- 用户问题 -->
        <el-form-item label="分析问题" prop="user_question">
          <el-input
            v-model="form.user_question"
            type="textarea"
            :rows="2"
            placeholder="例如：帮我分析一下各类问题的分布规律和时间趋势"
          />
        </el-form-item>

        <!-- 业务背景 -->
        <div class="section-title">
          <el-icon><OfficeBuilding /></el-icon>
          <span>业务背景（选填）</span>
        </div>

        <el-form-item label="所属行业" prop="business_context.industry">
          <el-input
            v-model="form.business_context.industry"
            placeholder="例如：政务服务/市民热线"
            clearable
          />
        </el-form-item>

        <el-form-item label="核心问题" prop="business_context.core_problem">
          <el-input
            v-model="form.business_context.core_problem"
            type="textarea"
            :rows="2"
            placeholder="例如：工单处理效率和问题分类优化"
          />
        </el-form-item>

        <el-form-item label="汇报对象" prop="business_context.audience">
          <el-input
            v-model="form.business_context.audience"
            placeholder="例如：管理层"
            clearable
          />
        </el-form-item>

        <el-form-item label="约束条件" prop="business_context.constraints">
          <el-input
            v-model="form.business_context.constraints"
            type="textarea"
            :rows="2"
            placeholder="例如：人力资源有限，需要优先处理高频问题"
          />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="generating"
          @click="handleGenerate"
        >
          <el-icon><DocumentChecked /></el-icon>
          {{ generating ? '生成中...' : '生成报告' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Document, OfficeBuilding, DocumentChecked } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { generateReport } from '../../api/report.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  selectedTasks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'success'])

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref(null)
const generating = ref(false)

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

const form = ref({
  title: '',
  user_question: '',
  business_context: {
    industry: '',
    core_problem: '',
    audience: '',
    constraints: ''
  }
})

const rules = {
  title: [
    { max: 100, message: '标题长度不能超过100个字符', trigger: 'blur' }
  ],
  user_question: [
    { max: 500, message: '问题描述不能超过500个字符', trigger: 'blur' }
  ]
}

// 重置表单
function resetForm() {
  form.value = {
    title: '',
    user_question: '',
    business_context: {
      industry: '',
      core_problem: '',
      audience: '',
      constraints: ''
    }
  }
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 生成报告
async function handleGenerate() {
  if (props.selectedTasks.length === 0) {
    ElMessage.warning('请至少选择一个分析任务')
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  generating.value = true

  try {
    const taskIds = props.selectedTasks.map(task => task.task_id)
    
    const requestData = {
      task_ids: taskIds,
      title: form.value.title || undefined,
      user_question: form.value.user_question || undefined
    }

    // 只添加有值的业务背景字段
    const businessContext = {}
    if (form.value.business_context.industry) {
      businessContext.industry = form.value.business_context.industry
    }
    if (form.value.business_context.core_problem) {
      businessContext.core_problem = form.value.business_context.core_problem
    }
    if (form.value.business_context.audience) {
      businessContext.audience = form.value.business_context.audience
    }
    if (form.value.business_context.constraints) {
      businessContext.constraints = form.value.business_context.constraints
    }

    if (Object.keys(businessContext).length > 0) {
      requestData.business_context = businessContext
    }

    const response = await generateReport(requestData)
    
    // 新的返回格式：{ report_id: 1, file_url: "/path/to/file.docx" }
    const { report_id, file_url } = response.data
    
    // 根据 file_url 下载文件
    if (file_url) {
      const fullUrl = `http://8.135.10.200:8788${file_url}`
      
      // 创建下载链接
      const link = document.createElement('a')
      link.href = fullUrl
      link.download = form.value.title ? `${form.value.title}.docx` : '数据分析报告.docx'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    ElMessage.success('报告生成成功！')
    emit('success')
    visible.value = false
    resetForm()
  } catch (error) {
    console.error('生成报告失败:', error)
    ElMessage.error('生成报告失败: ' + (error.message || '未知错误'))
  } finally {
    generating.value = false
  }
}

// 监听对话框打开，重置表单
watch(() => props.modelValue, (val) => {
  if (val) {
    resetForm()
  }
})
</script>

<style scoped>
.dialog-content {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 16px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light);
}

.section-title:first-child {
  margin-top: 0;
}

.selected-tasks {
  margin-bottom: 20px;
}

.task-id {
  font-family: monospace;
  color: var(--text-secondary);
}

.report-form {
  margin-top: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
