<template>
  <aside class="app-sidebar">
    <nav class="sidebar-nav">
      <router-link 
        v-for="item in menuItems" 
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ active: activeMenu === item.path }"
        @click="handleMenuClick(item)"
      >
        <div class="nav-icon">
          <el-icon :size="20"><component :is="item.icon" /></el-icon>
        </div>
        <span class="nav-label">{{ item.label }}</span>
        <div class="nav-indicator"></div>
      </router-link>
    </nav>
    
    <div class="sidebar-footer">
      <div class="version-info">
        <span>v1.0.0</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, DataAnalysis, Calendar } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)

const menuItems = [
  { path: '/', label: '首页', icon: 'HomeFilled' },
  { path: '/analysis', label: '数据分析', icon: 'DataAnalysis' },
  { path: '/history', label: '分析记录', icon: 'Calendar' }
]

function handleMenuClick(item) {
  console.log('菜单点击:', item)
}
</script>

<style scoped>
.app-sidebar {
  width: var(--sidebar-width);
  background: var(--card-bg);
  border-right: 1px solid var(--border-light);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  transition: width var(--transition-base);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-md);
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-xs);
  border-radius: var(--radius-md);
  color: var(--text-regular);
  text-decoration: none;
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.nav-item:hover {
  background: var(--fill-color);
  color: var(--primary-color);
}

.nav-item:hover .nav-icon {
  transform: scale(1.1);
}

.nav-item.active {
  background: var(--primary-bg);
  color: var(--primary-color);
  font-weight: var(--font-weight-semibold);
}

.nav-item.active .nav-indicator {
  opacity: 1;
  transform: scaleY(1);
}

.nav-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  flex-shrink: 0;
}

.nav-item.active .nav-icon {
  background: var(--primary-color);
  color: #fff;
  box-shadow: var(--shadow-primary);
}

.nav-label {
  font-size: var(--font-size-sm);
  white-space: nowrap;
  transition: opacity var(--transition-base);
}

.nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) scaleY(0);
  width: 3px;
  height: 20px;
  background: var(--primary-color);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  opacity: 0;
  transition: all var(--transition-base);
}

.sidebar-footer {
  padding: var(--space-md);
  border-top: 1px solid var(--border-light);
}

.version-info {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-placeholder);
}

/* 响应式 */
@media (max-width: 768px) {
  .app-sidebar {
    position: fixed;
    left: -100%;
    top: var(--header-height);
    height: calc(100vh - var(--header-height));
    z-index: 99;
    box-shadow: var(--shadow-lg);
  }
  
  .app-sidebar.open {
    left: 0;
    width: 240px;
  }
}
</style>
