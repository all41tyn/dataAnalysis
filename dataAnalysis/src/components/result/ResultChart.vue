<template>
  <div class="result-chart">
    <!-- 图表控制栏 -->
    <div class="chart-controls" v-if="chartConfig">
      <div class="control-left">
        <div class="control-group" v-if="supportedChartTypes.length > 0">
          <span class="control-label">图表类型</span>
          <el-select 
            v-model="currentChartType" 
            size="default" 
            style="width: 130px"
            @change="changeChartType"
          >
            <el-option 
              v-for="type in supportedChartTypes" 
              :key="type.value"
              :label="type.label" 
              :value="type.value" 
            />
          </el-select>
        </div>
        <div v-else class="control-group">
          <span class="control-label">图表类型</span>
          <el-select 
            v-model="currentChartType" 
            size="default" 
            style="width: 130px"
            @change="changeChartType"
          >
            <el-option label="柱状图" value="bar" />
            <el-option label="折线图" value="line" />
            <el-option label="饼图" value="pie" />
            <el-option label="散点图" value="scatter" />
            <el-option label="雷达图" value="radar" />
            <el-option label="热力图" value="heatmap" />
          </el-select>
        </div>
        
        <div class="control-group">
          <span class="control-label">主题色</span>
          <el-color-picker 
            v-model="themeColor" 
            size="default"
            @change="applyTheme"
          />
        </div>
      </div>
      
      <div class="control-right">
        <el-button 
          type="primary" 
          :icon="Download"
          @click="downloadChart"
        >
          下载图片
        </el-button>
      </div>
    </div>

    <!-- 图表容器 -->
    <div class="chart-wrapper">
      <div ref="chartRef" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const props = defineProps({
  chartConfig: { type: Object, default: () => null },
  method: { type: String, default: '' },
  supportedCharts: { type: Array, default: () => [] }
})

const chartRef = ref(null)
let chartInstance = null
const currentChartType = ref('bar')
const themeColor = ref('#4468F1')

// 图表类型映射
const chartTypeMap = {
  bar: '柱状图',
  line: '折线图',
  pie: '饼图',
  scatter: '散点图',
  radar: '雷达图',
  heatmap: '热力图',
  funnel: '漏斗图'
}

// 计算支持的图表类型选项
const supportedChartTypes = computed(() => {
  if (!props.supportedCharts || props.supportedCharts.length === 0) {
    return []
  }
  return props.supportedCharts.map(type => ({
    value: type,
    label: chartTypeMap[type] || type
  }))
})

function getThemeColors(color) {
  const r = parseInt(color.slice(1, 3), 16)
  const g = parseInt(color.slice(3, 5), 16) 
  const b = parseInt(color.slice(5, 7), 16)
  
  return [
    `rgb(${r}, ${g}, ${b})`,
    `rgb(${Math.min(255, r+30)}, ${Math.min(255, g+30)}, ${Math.min(255, b+30)})`,
    `rgb(${Math.min(255, r+60)}, ${Math.min(255, g+60)}, ${Math.min(255, b+60)})`,
    `rgb(${Math.min(255, r+90)}, ${Math.min(255, g+90)}, ${Math.min(255, b+90)})`,
    `rgb(${Math.min(255, r+120)}, ${Math.min(255, g+120)}, ${Math.min(255, b+120)})`
  ]
}

function renderChart() {
  if (!chartRef.value || !props.chartConfig) return

  // 检查容器尺寸，但如果等待太久就强制渲染
  const container = chartRef.value
  if (container.offsetWidth === 0 || container.offsetHeight === 0) {
    // 容器尺寸为0，但给一个合理的等待时间后强制渲染
    setTimeout(() => {
      renderChartForce()
    }, 300)
    return
  }

  renderChartForce()
}

function renderChartForce() {
  if (!chartRef.value || !props.chartConfig) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(chartRef.value)
  
  const convertedConfig = convertChartConfig(props.chartConfig, currentChartType.value)
  chartInstance.setOption(convertedConfig)
  
  // 确保图表正确调整大小
  setTimeout(() => {
    chartInstance?.resize()
  }, 100)
}

function convertChartConfig(originalConfig, type) {
  const colors = getThemeColors(themeColor.value)
  
  // 如果是归因分析的特殊数据结构
  if (props.method === 'attribution' && originalConfig.factor_impacts) {
    return convertAttributionData(originalConfig, type, colors)
  }
  
  // 如果是分布分析且没有chart_config，从categories和values构造
  if (props.method === 'distribution' && !originalConfig.xAxis && originalConfig.categories && originalConfig.values) {
    return convertDistributionData(originalConfig, type, colors)
  }
  
  const baseOption = {
    color: colors,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e5e6eb',
      borderWidth: 1,
      textStyle: { color: '#1d2129' },
      padding: [12, 16],
      borderRadius: 8
    },
    grid: {
      left: '10%',
      right: '10%',
      top: '15%', 
      bottom: '15%',
      containLabel: true
    }
  }

  switch (type) {
    case 'bar':
      // 优化柱状图配置，确保X轴标签完整显示
      const xAxisConfig = originalConfig.xAxis || { 
        type: 'category',
        axisLabel: {
          show: true,
          interval: 0, // 显示所有标签
          rotate: 0,   // 不旋转标签
          margin: 8,   // 标签与轴线的距离
          fontSize: 12,
          overflow: 'break' // 允许换行显示长标签
        },
        axisTick: {
          alignWithLabel: true // 刻度线与标签对齐
        }
      }
      
      return {
        ...baseOption,
        xAxis: xAxisConfig,
        yAxis: originalConfig.yAxis || { 
          type: 'value',
          axisLabel: {
            fontSize: 12
          }
        },
        series: (originalConfig.series || []).map(series => ({
          ...series,
          type: 'bar',
          barMaxWidth: 60,
          itemStyle: { borderRadius: [6, 6, 0, 0] }
        })),
        // 增加底部边距以容纳X轴标签
        grid: {
          ...baseOption.grid,
          bottom: originalConfig.xAxis?.axisLabel?.rotate ? '25%' : '15%'
        }
      }
      
    case 'line':
      return {
        ...baseOption,
        xAxis: originalConfig.xAxis || { type: 'category' },
        yAxis: originalConfig.yAxis || { type: 'value' },
        series: (originalConfig.series || []).map(series => ({
          ...series,
          type: 'line',
          smooth: true,
          symbolSize: 8,
          lineStyle: { width: 3 }
        }))
      }
      
    case 'pie':
      return {
        ...baseOption,
        tooltip: { trigger: 'item' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: originalConfig.series?.[0]?.data || [],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: { show: true, formatter: '{b}: {d}%' }
        }]
      }
      
    case 'scatter':
      return {
        ...baseOption,
        xAxis: originalConfig.xAxis || { type: 'value' },
        yAxis: originalConfig.yAxis || { type: 'value' },
        series: (originalConfig.series || []).map(series => ({
          ...series,
          type: 'scatter',
          symbolSize: 12
        }))
      }
      
    case 'radar':
      return {
        ...baseOption,
        radar: {
          indicator: originalConfig.indicator || [],
          shape: 'polygon',
          splitNumber: 5,
          axisName: { color: '#86909c' }
        },
        series: [{
          type: 'radar',
          data: originalConfig.series?.[0]?.data ? [{
            value: originalConfig.series[0].data,
            name: originalConfig.series[0].name || '数据'
          }] : []
        }]
      }
      
    case 'heatmap':
      return {
        ...baseOption,
        tooltip: { position: 'top' },
        xAxis: originalConfig.xAxis || { type: 'category' },
        yAxis: originalConfig.yAxis || { type: 'category' },
        visualMap: {
          min: 0,
          max: 100,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%'
        },
        series: [{
          type: 'heatmap',
          data: originalConfig.series?.[0]?.data || [],
          label: { show: true }
        }]
      }
      
    default:
      return originalConfig
  }
}

// 专门处理归因分析数据结构的转换函数
function convertAttributionData(data, type, colors) {
  const { target, total_count, target_distribution, factor_impacts } = data
  
  switch (type) {
    case 'bar':
      // 因素影响力柱状图 - 优化X轴标签显示
      if (factor_impacts && factor_impacts.length > 0) {
        const factors = factor_impacts.map(f => f.factor_name || f.factor)
        const scores = factor_impacts.map(f => f.impact_score || 0)
        
        return {
          color: colors,
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
          },
          grid: {
            left: '15%',
            right: '10%',
            top: '15%',
            bottom: '25%', // 增加底部边距
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: factors,
            axisLabel: {
              show: true,
              interval: 0,     // 显示所有标签
              rotate: 15,      // 轻微旋转以适应长标签
              margin: 12,      // 增加标签间距
              fontSize: 12,
              overflow: 'break',// 允许换行
              width: 80        // 限制标签宽度
            },
            axisTick: {
              alignWithLabel: true
            }
          },
          yAxis: {
            type: 'value',
            name: '影响力得分',
            axisLabel: {
              fontSize: 12
            }
          },
          series: [{
            type: 'bar',
            data: scores,
            barMaxWidth: 60,
            itemStyle: { 
              borderRadius: [6, 6, 0, 0],
              color: colors[0]
            }
          }]
        }
      }
      break
      
    case 'pie':
      // 目标字段分布饼图
      if (target_distribution && target_distribution.length > 0) {
        const pieData = target_distribution.map(item => ({
          name: item.value,
          value: item.count
        }))
        
        return {
          color: colors,
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b}: {c} ({d}%)'
          },
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data: pieData,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            label: { 
              show: true, 
              formatter: '{b}\n{d}%'
            }
          }]
        }
      }
      break
      
    case 'scatter':
      // 因素相关性散点图
      if (factor_impacts && factor_impacts.length > 0) {
        const scatterData = factor_impacts.map(f => [
          f.cramers_v || 0,
          f.information_gain || 0,
          f.impact_score || 0,
          f.factor_name || f.factor
        ])
        
        return {
          color: colors,
          tooltip: {
            trigger: 'item',
            formatter: function(params) {
              const data = params.data
              return `${data[3]}<br/>Cramér's V: ${data[0].toFixed(3)}<br/>信息增益: ${data[1].toFixed(3)}<br/>影响力: ${data[2].toFixed(1)}`
            }
          },
          xAxis: {
            type: 'value',
            name: "Cramér's V"
          },
          yAxis: {
            type: 'value',
            name: '信息增益'
          },
          series: [{
            type: 'scatter',
            data: scatterData,
            symbolSize: function(data) {
              return Math.max(10, data[2] / 2) // 根据影响力调整点大小
            },
            itemStyle: {
              color: colors[0]
            }
          }]
        }
      }
      break
      
    case 'heatmap':
      // 交叉分析热力图
      if (factor_impacts && factor_impacts.length > 0) {
        // 取第一个因素的交叉详情作为示例
        const firstFactor = factor_impacts[0]
        if (firstFactor.cross_detail && firstFactor.factor_values) {
          const xData = firstFactor.factor_values.map(v => v.value)
          const yData = target_distribution.map(t => t.value)
          
          // 构造热力图数据
          const heatmapData = []
          firstFactor.cross_detail.forEach((detail, i) => {
            target_distribution.forEach((targetItem, j) => {
              const rate = detail[`${targetItem.value}_rate`] || 0
              heatmapData.push([i, j, rate])
            })
          })
          
          return {
            tooltip: {
              position: 'top',
              formatter: function(params) {
                const [xIndex, yIndex, value] = params.data
                return `${xData[xIndex]} → ${yData[yIndex]}<br/>比例: ${value.toFixed(2)}%`
              }
            },
            xAxis: {
              type: 'category',
              data: xData,
              splitArea: { show: true }
            },
            yAxis: {
              type: 'category',
              data: yData,
              splitArea: { show: true }
            },
            visualMap: {
              min: 0,
              max: 100,
              calculable: true,
              orient: 'horizontal',
              left: 'center',
              bottom: '5%'
            },
            series: [{
              type: 'heatmap',
              data: heatmapData,
              label: { show: true },
              emphasis: {
                itemStyle: { shadowBlur: 10 }
              }
            }]
          }
        }
      }
      break
  }
  
  // 如果没有匹配的图表类型，返回默认配置
  return {
    title: {
      text: '暂无适用的图表类型',
      left: 'center',
      top: 'center'
    }
  }
}

// 专门处理分布分析数据结构的转换函数
function convertDistributionData(data, type, colors) {
  const { categories, values, dimension } = data
  
  switch (type) {
    case 'bar':
      return {
        color: colors,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        grid: {
          left: '15%',
          right: '10%',
          top: '15%',
          bottom: '25%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            show: true,
            interval: 0,
            rotate: 15,
            margin: 12,
            fontSize: 12,
            overflow: 'break',
            width: 80
          },
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: {
          type: 'value',
          name: '数量',
          axisLabel: {
            fontSize: 12
          }
        },
        series: [{
          name: dimension || '数据',
          type: 'bar',
          data: values,
          barMaxWidth: 60,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
            color: colors[0]
          }
        }]
      }
      
    case 'pie':
      const pieData = categories.map((category, index) => ({
        name: category,
        value: values[index] || 0
      }))
      
      return {
        color: colors,
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [{
          name: dimension || '分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '50%'],
          data: pieData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          }
        }]
      }
  }
  
  // 默认返回柱状图配置
  return {
    color: colors,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '15%',
      right: '10%',
      top: '15%',
      bottom: '25%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        show: true,
        interval: 0,
        rotate: 15,
        margin: 12,
        fontSize: 12,
        overflow: 'break',
        width: 80
      },
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value',
      name: '数量',
      axisLabel: {
        fontSize: 12
      }
    },
    series: [{
      name: dimension || '数据',
      type: 'bar',
      data: values,
      barMaxWidth: 60,
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: colors[0]
      }
    }]
  }
}

function changeChartType() {
  nextTick(renderChart)
}

function applyTheme() {
  nextTick(renderChart)
}

function downloadChart() {
  if (!chartInstance) {
    ElMessage.warning('图表未初始化')
    return
  }
  
  try {
    const dataUrl = chartInstance.getDataURL({
      type: 'png',
      pixelRatio: 2,
      backgroundColor: '#fff'
    })
    
    const link = document.createElement('a')
    link.download = `chart_${new Date().getTime()}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    ElMessage.success('图片下载成功')
  } catch (error) {
    ElMessage.error('下载失败：' + error.message)
  }
}

watch(() => props.chartConfig, () => {
  if (props.chartConfig) {
    // 延迟渲染确保DOM更新完成
    setTimeout(() => {
      renderChart()
    }, 50)
  }
}, { deep: true })

// 监听支持的图表类型变化，设置默认值
watch(() => props.supportedCharts, (newVal) => {
  if (newVal && newVal.length > 0) {
    // 如果当前选中的类型不在支持列表中，切换到第一个支持的类型
    if (!newVal.includes(currentChartType.value)) {
      currentChartType.value = newVal[0]
    }
  }
}, { immediate: true })

onMounted(() => {
  // 简单的延迟渲染确保容器准备就绪
  setTimeout(() => {
    renderChart()
  }, 100)
  
  // 添加窗口大小监听
  window.addEventListener('resize', handleResize)
  
  // 添加容器大小变化监听（如果支持 ResizeObserver）
  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      if (chartInstance) {
        chartInstance.resize()
      }
    })
    if (chartRef.value) {
      resizeObserver.observe(chartRef.value)
    }
  }
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  chartInstance?.resize()
}
</script>

<style scoped>
.result-chart {
  padding: var(--space-sm) 0;
}

.chart-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--fill-lighter);
  border-radius: var(--radius-lg);
  margin-bottom: var(--space-md);
  border: 1px solid var(--border-light);
}

.control-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.control-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.control-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  white-space: nowrap;
}

.chart-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 500px;
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  padding: var(--space-md);
}

.chart-container {
  width: 100%;
  height: 550px;
  max-width: 1000px;
}

/* 响应式 */
@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    gap: var(--space-md);
    align-items: flex-start;
  }
  
  .control-left {
    flex-wrap: wrap;
  }
  
  .chart-container {
    height: 400px;
  }
}
</style>
