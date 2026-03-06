import request from './request.js'

/**
 * 首次生成总结性Word报告
 * @param {Object} data - 请求参数
 * @param {number[]} data.task_ids - 任务ID列表
 * @param {string} [data.user_question] - 用户问题
 * @param {Object} [data.business_context] - 业务背景
 * @param {string} [data.business_context.industry] - 行业
 * @param {string} [data.business_context.core_problem] - 核心问题
 * @param {string} [data.business_context.audience] - 汇报对象
 * @param {string} [data.business_context.constraints] - 约束条件
 * @param {string} [data.title] - 报告标题
 * @returns {Promise<Object>} - 返回 { report_id: 1, file_url: "/path/to/file.docx" }
 */
export function generateReport(data) {
  return request({
    url: '/analysis/export-report/',
    method: 'post',
    data,
    timeout: 300000 // 5分钟超时
  })
}

/**
 * 重新下载报告
 * @param {number} reportId - 报告ID
 * @returns {Promise<Blob>} - 返回文件流
 */
export function downloadReportById(reportId) {
  return request({
    url: '/analysis/download-report/',
    method: 'get',
    params: { report_id: reportId },
    responseType: 'blob'
  })
}

/**
 * 覆盖重新生成报告
 * @param {Object} data - 请求参数
 * @param {number} data.report_id - 报告ID
 * @param {number[]} data.task_ids - 任务ID列表
 * @param {string} [data.user_question] - 用户问题
 * @param {Object} [data.business_context] - 业务背景
 * @param {string} [data.business_context.industry] - 行业
 * @param {string} [data.business_context.core_problem] - 核心问题
 * @param {string} [data.business_context.audience] - 汇报对象
 * @param {string} [data.business_context.constraints] - 约束条件
 * @param {string} [data.title] - 报告标题
 * @returns {Promise<Object>} - 返回 { report_id: 1, file_url: "/path/to/file.docx" }
 */
export function regenerateReport(data) {
  return request({
    url: '/analysis/export-report/',
    method: 'post',
    data,
    timeout: 300000 // 5分钟超时
  })
}

/**
 * 删除报告
 * @param {number} reportId - 报告ID
 * @returns {Promise}
 */
export function deleteReport(reportId) {
  return request({
    url: '/analysis/delete-report/',
    method: 'post',
    data: { report_id: reportId }
  })
}

/**
 * 获取报告列表
 * @param {number} datasourceId - 数据源ID
 * @returns {Promise}
 */
export function getReports(datasourceId) {
  return request({
    url: '/analysis/reports/',
    method: 'get',
    params: { datasource_id: datasourceId }
  })
}


