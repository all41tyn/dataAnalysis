# 归因分析图表适配说明

## 新数据结构

归因分析接口返回的数据结构已更新为：

```json
{
  "target": "目标字段",
  "total_count": 10000,
  "target_distribution": [
    {"value": "A", "count": 5000, "percentage": 50.0},
    {"value": "B", "count": 3000, "percentage": 30.0}
  ],
  "factor_impacts": [
    {
      "factor": "col_5",
      "factor_name": "来源渠道",
      "impact_score": 85.5,
      "cramers_v": 0.82,
      "information_gain": 0.89,
      "unique_values": 12,
      "factor_values": [{"value": "线上", "count": 3000}, ...],
      "cross_detail": [{"factor_value": "线上", "total": 3000, "A": 2000, "A_rate": 66.67}, ...]
    }
  ]
}
```

## 图表适配实现

### 1. 柱状图 (Bar Chart)
- **用途**: 展示各因素的影响力得分
- **数据源**: `factor_impacts[].impact_score`
- **X轴**: 因素名称 (`factor_name`)
- **Y轴**: 影响力得分

### 2. 饼图 (Pie Chart)
- **用途**: 展示目标字段的分布情况
- **数据源**: `target_distribution[]`
- **数据项**: `{name: value, value: count}`

### 3. 散点图 (Scatter Plot)
- **用途**: 展示因素间的相关性关系
- **X轴**: Cramér's V 系数值
- **Y轴**: 信息增益值
- **点大小**: 根据影响力得分调整

### 4. 热力图 (Heatmap)
- **用途**: 展示因素与目标的交叉分析
- **数据源**: `factor_impacts[0].cross_detail`
- **X轴**: 因素值
- **Y轴**: 目标值
- **颜色深浅**: 表示比例大小

## 实现细节

### 核心转换函数
在 `ResultChart.vue` 中添加了 `convertAttributionData()` 函数：

```javascript
function convertAttributionData(data, type, colors) {
  // 根据图表类型转换不同的数据结构
  switch (type) {
    case 'bar':     // 因素影响力柱状图
    case 'pie':     // 目标分布饼图  
    case 'scatter': // 因素相关性散点图
    case 'heatmap': // 交叉分析热力图
  }
}
```

### 条件判断
在 `convertChartConfig()` 中添加了归因分析的特殊处理：

```javascript
// 如果是归因分析的特殊数据结构
if (props.method === 'attribution' && originalConfig.factor_impacts) {
  return convertAttributionData(originalConfig, type, colors)
}
```

## 测试数据
提供了 `test-attribution-data.json` 测试文件，包含完整的归因分析数据示例。

## 支持的图表类型
归因分析支持以下图表类型：
- 📊 柱状图 - 因素影响力对比
- 🥧 饼图 - 目标分布展示
- 🔵 散点图 - 相关性分析
- 🌡️ 热力图 - 交叉分析

## 使用方式
组件会自动识别归因分析方法并应用相应的数据转换逻辑，用户可以在图表类型下拉菜单中选择适合的展示方式。