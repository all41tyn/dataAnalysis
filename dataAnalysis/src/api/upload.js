import request from './request.js'

/** 上传文件并解析入库 */
export function uploadFile(file, name) {
  const formData = new FormData()
  formData.append('file', file)
  if (name) formData.append('name', name)
  return request({
    url: '/upload/file/',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000
  })
}

/** 预览文件(不入库) */
export function previewFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/upload/preview/',
    method: 'post',
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/** 删除数据源 */
export function deleteDatasource(datasourceId) {
  return request({
    url: '/upload/datasource/',
    method: 'delete',
    params: { datasource_id: datasourceId }
  })
}
