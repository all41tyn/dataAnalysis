import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { executeAnalysis as apiExecute, getAnalysisResult } from '../api/analysis.js'

export const useAnalysisStore = defineStore('analysis', () => {
  // 步骤控制: 1=上传数据, 2=分析设置, 3=分析结果
  const currentStep = ref(1)

  // 分析设置
  const selectedFields = ref([])
  const selectedMethods = ref([])
  const methodParamsMap = ref({})  // { methodKey: {params} }  按方法隔离参数

  // 分析结果
  const analysisResult = ref(null)
  const isLoading = ref(false)
  const taskId = ref(null)

  // AI对话
  const sessionId = ref('')

  function nextStep() {
    if (currentStep.value < 3) {
      currentStep.value++
    }
  }

  function prevStep() {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  function goToStep(step) {
    currentStep.value = step
  }

  function reset() {
    currentStep.value = 1
    selectedFields.value = []
    selectedMethods.value = []
    methodParamsMap.value = {}
    analysisResult.value = null
    isLoading.value = false
    taskId.value = null
    sessionId.value = ''
  }

  async function doExecute(datasourceId, method, params = {}) {
    isLoading.value = true
    analysisResult.value = null
    try {
      const res = await apiExecute({
        datasource_id: datasourceId,
        method: method,
        params: params,
        session_id: sessionId.value || undefined
      })
      analysisResult.value = res.data
      taskId.value = res.data?.task_id
      return res.data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchResult(tid) {
    isLoading.value = true
    try {
      const res = await getAnalysisResult(tid)
      analysisResult.value = res.data
      return res.data
    } finally {
      isLoading.value = false
    }
  }

  return {
    currentStep,
    selectedFields,
    selectedMethods,
    methodParamsMap,
    analysisResult,
    isLoading,
    taskId,
    sessionId,
    nextStep,
    prevStep,
    goToStep,
    reset,
    doExecute,
    fetchResult
  }
})
