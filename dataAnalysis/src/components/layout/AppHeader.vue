<template>
  <header class="app-header">
    <div class="header-left">
      <div class="logo-wrapper">
        <img src="/favicon.png" alt="logo" class="header-logo" />
      </div>
      <div class="brand-info">
        <span class="header-title">数据分析平台</span>
        <span class="header-subtitle">Data Analytics Platform</span>
      </div>
    </div>
    <div class="header-right">
      <div class="header-actions">
        <el-tooltip content="帮助文档" placement="bottom" :show-after="500">
          <div class="action-btn" @click="showHelpDialog = true">
            <el-icon :size="18"><QuestionFilled /></el-icon>
          </div>
        </el-tooltip>
        <!-- 系统设置按钮暂时隐藏 -->
        <!--
        <el-tooltip content="系统设置" placement="bottom" :show-after="500">
          <div class="action-btn">
            <el-icon :size="18"><Setting /></el-icon>
          </div>
        </el-tooltip>
        -->
      </div>
      <el-dropdown trigger="click" class="user-dropdown">
        <div class="user-info">
          <el-avatar :size="36" class="user-avatar">
            <el-icon :size="18"><User /></el-icon>
          </el-avatar>
          <span class="user-name">管理员</span>
          <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item :icon="User">个人中心</el-dropdown-item>
            <el-dropdown-item :icon="Setting">账号设置</el-dropdown-item>
            <el-dropdown-item divided :icon="SwitchButton">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
  
  <!-- 帮助文档弹窗 -->
  <HelpDialog v-model="showHelpDialog" />
</template>

<script setup>
import { ref } from 'vue'
import { User, Setting, QuestionFilled, ArrowDown, SwitchButton } from '@element-plus/icons-vue'
import HelpDialog from '@/components/HelpDialog.vue'

const showHelpDialog = ref(false)
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--header-height);
  padding: 0 var(--space-lg);
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  z-index: 100;
  box-shadow: var(--shadow-xs);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.logo-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-primary);
}

.header-logo {
  width: 26px;
  height: 26px;
  filter: brightness(10);
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
  line-height: var(--line-height-tight);
}

.header-subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  letter-spacing: 0.02em;
  margin-top: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.action-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.action-btn:hover {
  background: var(--fill-color);
  color: var(--primary-color);
}

.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.user-info:hover {
  background: var(--fill-color);
}

.user-avatar {
  background: linear-gradient(135deg, var(--primary-light), var(--primary-lighter));
  color: var(--primary-color);
}

.user-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-regular);
}

.dropdown-icon {
  font-size: 12px;
  color: var(--text-secondary);
  transition: transform var(--transition-base);
}

.user-info:hover .dropdown-icon {
  transform: rotate(180deg);
}

/* 响应式 */
@media (max-width: 768px) {
  .header-subtitle,
  .user-name,
  .header-actions {
    display: none;
  }
  
  .app-header {
    padding: 0 var(--space-md);
  }
}
</style>
