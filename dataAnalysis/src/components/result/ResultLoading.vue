<template>
  <div class="result-loading">
    <div class="loading-animation">
      <div class="loading-circle"></div>
      <div class="loading-circle delay-1"></div>
      <div class="loading-circle delay-2"></div>
    </div>
    <div class="loading-content">
      <h3 class="loading-title">正在分析数据</h3>
      <p class="loading-desc">AI 正在处理您的数据，请稍候...</p>
    </div>
    <div class="loading-progress">
      <div class="progress-bar"></div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.result-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: var(--space-2xl);
  animation: fadeIn 0.3s ease;
}

.loading-animation {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: var(--space-lg);
}

.loading-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
}

.loading-circle.delay-1 {
  width: 60px;
  height: 60px;
  top: 10px;
  left: 10px;
  border-top-color: var(--primary-hover);
  animation-delay: 0.2s;
  animation-direction: reverse;
}

.loading-circle.delay-2 {
  width: 40px;
  height: 40px;
  top: 20px;
  left: 20px;
  border-top-color: var(--primary-light);
  animation-delay: 0.4s;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-content {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.loading-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.loading-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.loading-progress {
  width: 200px;
  height: 4px;
  background: var(--fill-color);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 30%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-hover));
  border-radius: var(--radius-full);
  animation: progress 1.5s ease-in-out infinite;
}

@keyframes progress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
