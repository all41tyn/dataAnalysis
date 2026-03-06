# 总结报告接口规范

## 基础路径
```
/api/analysis/
```

## 接口列表

### 1. 查看历史报告列表
- **方法**: GET
- **路径**: `/reports/`
- **参数**: `datasource_id` (查询参数)
- **示例**: `GET /api/analysis/reports/?datasource_id=1`

### 2. 首次生成报告
- **方法**: POST
- **路径**: `/export-report/`
- **参数**: 
  ```json
  {
    "task_ids": [1, 2, 3],
    "user_question": "分析问题描述",
    "business_context": {
      "industry": "行业",
      "core_problem": "核心问题",
      "audience": "汇报对象",
      "constraints": "约束条件"
    },
    "title": "报告标题"
  }
  ```
- **响应**: `{ "report_id": 1, "file_url": "/api/files/report_1.docx" }`
- **说明**: 不再直接返回文件流，而是返回文件URL，前端需根据file_url拼接完整地址下载

### 3. 重新下载报告
- **方法**: GET
- **路径**: `/download-report/`
- **参数**: `report_id=1` (查询参数)
- **示例**: `GET /api/analysis/download-report/?report_id=1`
- **响应**: Word文件流

### 4. 覆盖重新生成报告
- **方法**: POST
- **路径**: `/export-report/`
- **参数**: 
  ```json
  {
    "report_id": 1,
    "task_ids": [1, 2, 3],
    "user_question": "分析问题描述",
    "business_context": {
      "industry": "行业",
      "core_problem": "核心问题",
      "audience": "汇报对象",
      "constraints": "约束条件"
    },
    "title": "报告标题"
  }
  ```
- **响应**: `{ "report_id": 1, "file_url": "/api/files/report_1_updated.docx" }`
- **说明**: 包含 `report_id` 时为覆盖重新生成，会删除旧文件，返回新的file_url

### 5. 删除报告
- **方法**: POST
- **路径**: `/delete-report/`
- **参数**: 
  ```json
  {
    "report_id": 1
  }
  ```

## 前端实现文件

### API 接口文件
- `src/api/report.js` - 包含所有报告相关接口

### 主要组件
- `src/views/AnalysisHistory.vue` - 报告列表展示和操作
- `src/components/report/ReportGenerateDialog.vue` - 生成报告对话框

## 功能特性

1. **多选任务**: 可选择多个分析任务生成总结报告
2. **参数配置**: 支持用户问题和业务背景配置
3. **报告管理**: 支持查看、下载、重新生成、删除操作
4. **历史记录**: 按数据源分组显示历史报告列表
