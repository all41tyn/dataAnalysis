import axios from 'axios'
import { ElMessage } from 'element-plus'

const service = axios.create({
  baseURL: 'http://8.135.10.200:8788/api',
  timeout: 60000
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 预留 token 注入
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 如果是blob响应，直接返回整个response，不做code检查
    if (response.config.responseType === 'blob') {
      return response
    }
    
    const res = response.data
    if (res.code !== 200) {
      ElMessage.error(res.msg || '请求失败')
      return Promise.reject(new Error(res.msg || '请求失败'))
    }
    return res
  },
  (error) => {
    const msg = error.response?.data?.msg || error.message || '网络错误'
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default service
