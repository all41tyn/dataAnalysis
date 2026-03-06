import request from './request.js'

/** 应用安全规则(加密/脱敏) */
export function applySecurityRule(data) {
  return request({
    url: '/security/apply/',
    method: 'post',
    data,
    timeout: 300000 // 5分钟超时
  })
}

/** 获取安全规则列表 */
export function getSecurityRules(datasourceId) {
  return request({
    url: '/security/rules/',
    method: 'get',
    params: { datasource_id: datasourceId }
  })
}

/** 删除安全规则 */
export function deleteSecurityRule(ruleId) {
  return request({
    url: '/security/rule/',
    method: 'delete',
    params: { rule_id: ruleId }
  })
}

/** 获取脱敏模式列表 */
export function getDesensitizePatterns() {
  return request({
    url: '/security/patterns/',
    method: 'get'
  })
}
