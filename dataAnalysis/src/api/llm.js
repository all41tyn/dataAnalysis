import request from './request.js'

/** 大模型对话 */
export function chat(data) {
  return request({
    url: '/llm/chat/',
    method: 'post',
    data,
    timeout: 120000
  })
}

/** 获取分析建议 */
export function getSuggestion(data) {
  return request({
    url: '/llm/suggestion/',
    method: 'post',
    data,
    timeout: 120000
  })
}
