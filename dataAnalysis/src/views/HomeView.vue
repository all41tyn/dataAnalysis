<template>
  <div class="home-view">
    <!-- Hero 区域 -->
    <div class="hero-section">
      <div class="hero-layout">
        <!-- 左侧内容区域 -->
        <div class="hero-content">
          <h1 class="hero-title">
            欢迎使用<span class="highlight">数据分析平台</span>
          </h1>
          
          <div class="hero-description">
            <p>上传数据、配置分析、获取洞察，一站式完成数据分析任务。</p>
            <p>借助 AI 智能推荐，让数据分析更简单高效。</p>
          </div>
          
          <div class="feature-tags">
            <div class="feature-tag">
              <el-icon><Upload /></el-icon>
              <span>支持多格式数据上传</span>
            </div>
            <div class="feature-tag">
              <el-icon><MagicStick /></el-icon>
              <span>AI智能分析推荐</span>
            </div>
            <div class="feature-tag">
              <el-icon><DataLine /></el-icon>
              <span>丰富的可视化图表</span>
            </div>
          </div>
          
          <div class="hero-stats">
            <div class="stat-item">
              <div class="stat-number">12+</div>
              <div class="stat-label">分析方法</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">∞</div>
              <div class="stat-label">数据洞察</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">99%</div>
              <div class="stat-label">用户满意度</div>
            </div>
          </div>
          
          <div class="hero-actions">
            <el-button type="primary" size="large" class="primary-btn" @click="$router.push('/analysis')">
              <el-icon><DataAnalysis /></el-icon>
              开始分析
            </el-button>
            <el-button size="large" class="secondary-btn" @click="$router.push('/history')">
              <el-icon><Calendar /></el-icon>
              查看历史
            </el-button>
          </div>
        </div>
        
        <!-- 右侧视觉区域 -->
        <div class="hero-visual">
          <div class="visual-card">
            <div class="card-content">
              <div class="icon-item top-left">
                <el-icon><InfoFilled /></el-icon>
              </div>
              <div class="icon-item center">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="icon-item bottom-right">
                <el-icon><Histogram /></el-icon>
              </div>
              <div class="icon-item bottom-left">
                <el-icon><Refresh /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  DataAnalysis, Calendar, TrendCharts, Upload, MagicStick, DataLine, 
  InfoFilled, Refresh, Histogram 
} from '@element-plus/icons-vue'
</script>

<style scoped>
.home-view {
  min-height: 80vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.hero-section {
  min-height: 85vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 2rem 0;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 10% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 30%),
              radial-gradient(circle at 90% 80%, rgba(100, 116, 139, 0.1) 0%, transparent 30%);
}

.hero-layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3rem;
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* 左侧内容区域 */
.hero-content {
  flex: 1;
  max-width: 600px;
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.2;
  margin-bottom: 1rem;
  letter-spacing: -0.03em;
}

.hero-title .highlight {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-description {
  font-size: 1.125rem;
  color: #64748b;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.hero-description p {
  margin: 0 0 0.5rem 0;
}

/* 功能标签 */
.feature-tags {
  display: flex;
  gap: 1rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.feature-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  color: #334155;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.feature-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #3b82f6;
}

.feature-tag .el-icon {
  color: #3b82f6;
  font-size: 1.125rem;
}

/* 数据统计 */
.hero-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 2.5rem;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: #3b82f6;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
}

/* 操作按钮 */
.hero-actions {
  display: flex;
  gap: 1rem;
}

.primary-btn {
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  border: none;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

.secondary-btn {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.secondary-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 右侧视觉区域 */
.hero-visual {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.visual-card {
  width: 280px;
  height: 280px;
  background: linear-gradient(135deg, #3b82f6, #60a5fa);
  border-radius: 2rem;
  position: relative;
  transform: perspective(1000px) rotateY(-15deg) rotateX(10deg);
  box-shadow: 25px 25px 50px rgba(59, 130, 246, 0.2);
  overflow: hidden;
}

.visual-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, transparent 50%);
}

.card-content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-item {
  position: absolute;
  width: 60px;
  height: 60px;
  background: white;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  font-size: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.5s ease;
}

.icon-item.top-left {
  top: 20%;
  left: 15%;
  animation: float 4s ease-in-out infinite;
}

.icon-item.center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  font-size: 2rem;
  animation: pulse 3s ease-in-out infinite;
}

.icon-item.bottom-right {
  bottom: 20%;
  right: 15%;
  animation: float 4s ease-in-out infinite 1s;
}

.icon-item.bottom-left {
  bottom: 25%;
  left: 20%;
  animation: rotate 6s linear infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .hero-layout {
    gap: 2rem;
    padding: 0 1.5rem;
  }
  
  .visual-card {
    width: 240px;
    height: 240px;
  }
}

@media (max-width: 1024px) {
  .hero-layout {
    flex-direction: column;
    text-align: center;
    gap: 2rem;
    padding: 0 1rem;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-stats {
    justify-content: center;
  }
  
  .feature-tags {
    justify-content: center;
  }
  
  .hero-actions {
    justify-content: center;
  }
  
  .visual-card {
    width: 200px;
    height: 200px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 1rem 0;
  }
  
  .hero-layout {
    gap: 1.5rem;
    padding: 0 1rem;
  }
  
  .hero-title {
    font-size: 1.75rem;
  }
  
  .hero-description {
    font-size: 1rem;
  }
  
  .hero-stats {
    flex-direction: column;
    gap: 1rem;
  }
  
  .feature-tags {
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  
  .hero-actions {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .primary-btn,
  .secondary-btn {
    width: 100%;
    max-width: 300px;
    padding: 0.75rem 1.5rem;
  }
  
  .visual-card {
    width: 180px;
    height: 180px;
  }
  
  .icon-item {
    width: 45px;
    height: 45px;
    font-size: 1.125rem;
  }
  
  .icon-item.center {
    width: 60px;
    height: 60px;
    font-size: 1.5rem;
  }
}
</style>