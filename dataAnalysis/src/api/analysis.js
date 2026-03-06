import request from './request.js'

/** 获取数据源列表 */
export function getDatasources() {
  return request({
    url: '/analysis/datasources/',
    method: 'get'
  })
}

/** 获取数据源字段列表 */
export function getFields(datasourceId) {
  return request({
    url: '/analysis/fields/',
    method: 'get',
    params: { datasource_id: datasourceId }
  })
}

/** 获取分析方法列表 */
export function getMethods() {
  return request({
    url: '/analysis/methods/',
    method: 'get'
  })
}

/** 执行分析 */
export function executeAnalysis(data) {
  return request({
    url: '/analysis/execute/',
    method: 'post',
    data,
    timeout: 1200000
  })
}

/** 获取分析任务结果 */
export function getAnalysisResult(taskId) {
  return request({
    url: '/analysis/result/',
    method: 'get',
    params: { task_id: taskId }
  })
}

/** 获取分析任务列表 */
export function getAnalysisTasks(datasourceId) {
  return request({
    url: '/analysis/tasks/',
    method: 'get',
    params: { datasource_id: datasourceId }
  })
}
