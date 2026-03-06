<template>
  <div class="file-upload">
    <div class="upload-header">
      <div class="header-icon">
        <el-icon :size="20"><Upload /></el-icon>
      </div>
      <div class="header-text">
        <h3 class="section-title">上传数据</h3>
        <p class="header-hint">支持 Excel、CSV 格式文件</p>
      </div>
    </div>

    <!-- 上传区域 -->
    <el-upload
      ref="uploadRef"
      class="upload-area"
      drag
      :auto-upload="false"
      :show-file-list="false"
      accept=".xlsx,.xls,.csv"
      :on-change="handleFileChange"
      :disabled="!!selectedFile"
    >
      <div class="upload-content">
        <div class="upload-icon-wrapper">
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
        </div>
        <div class="upload-text">
          <p class="upload-title">点击或拖拽选择文件</p>
          <p class="upload-hint">xlsx, xls, csv, 最大 50MB</p>
        </div>
      </div>
    </el-upload>

    <!-- 选中的文件预览 -->
    <Transition name="slide-fade">
      <div v-if="selectedFile" class="selected-file-preview">
        <div class="file-info">
          <div class="file-icon-wrapper" :class="getFileTypeClass(selectedFile.name)">
            <el-icon :size="24">
              <component :is="getFileIcon(selectedFile.name)" />
            </el-icon>
          </div>
          <div class="file-details">
            <p class="file-name">{{ selectedFile.name }}</p>
            <p class="file-meta">
              <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
              <span class="file-type">{{ getFileExtension(selectedFile.name) }}</span>
            </p>
          </div>
          <el-button 
            type="danger" 
            :icon="Delete" 
            circle 
            size="small"
            class="delete-btn"
            @click="clearSelectedFile"
          />
        </div>
        <el-button
          type="primary"
          :loading="uploading"
          class="upload-btn"
          @click="doUpload"
        >
          <el-icon><Upload /></el-icon>
          开始上传
        </el-button>
      </div>
    </Transition>

    <!-- 已上传列表 -->
    <Transition name="slide-fade">
      <div class="uploaded-section" v-if="dsStore.datasources.length">
        <div class="section-divider">
          <span class="divider-text">已上传文件</span>
          <el-badge :value="dsStore.datasources.length" type="primary" />
        </div>
        <div class="ds-list-container">
          <div
            v-for="ds in dsStore.datasources"
            :key="ds.id"
            class="ds-card"
            :class="{ active: dsStore.currentDatasource?.id === ds.id }"
            @click="selectDatasource(ds)"
          >
            <div class="ds-card-icon">
              <el-icon :size="20"><Document /></el-icon>
            </div>
            <div class="ds-card-info">
              <p class="ds-name">{{ ds.name || ds.original_filename }}</p>
              <p class="ds-meta">
                <span>{{ ds.row_count }} 行</span>
                <span class="meta-dot"></span>
                <span>{{ ds.col_count }} 列</span>
              </p>
            </div>
            <div class="ds-actions">
              <el-icon v-if="dsStore.currentDatasource?.id === ds.id" class="check-icon"><Check /></el-icon>
              <el-icon
                class="ds-delete"
                @click.stop="handleDelete(ds)"
              ><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { UploadFilled, Document, Close, DocumentCopy, Tickets, Delete, Upload, Check } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadFile } from '../../api/upload.js'
import { useDatasourceStore } from '../../stores/datasource.js'

const dsStore = useDatasourceStore()
const uploadRef = ref(null)
const selectedFile = ref(null)
const uploading = ref(false)

const emit = defineEmits(['uploaded'])

function getFileIcon(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') return 'Document'
  if (ext === 'csv') return 'Tickets'
  return 'DocumentCopy'
}

function getFileTypeClass(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  if (ext === 'xlsx' || ext === 'xls') return 'excel'
  if (ext === 'csv') return 'csv'
  return 'other'
}

function getFileExtension(filename) {
  return filename.split('.').pop().toUpperCase()
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function clearSelectedFile() {
  selectedFile.value = null
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

function handleFileChange(file) {
  const raw = file.raw
  const maxSize = 50 * 1024 * 1024
  if (raw.size > maxSize) {
    ElMessage.warning('文件大小不能超过 50MB')
    return
  }
  const ext = raw.name.split('.').pop().toLowerCase()
  if (!['xlsx', 'xls', 'csv'].includes(ext)) {
    ElMessage.warning('仅支持 xlsx, xls, csv 格式')
    return
  }
  selectedFile.value = raw
}

async function doUpload() {
  if (!selectedFile.value) return
  uploading.value = true
  try {
    const res = await uploadFile(selectedFile.value)
    ElMessage.success('上传成功')
    const ds = {
      id: res.data.datasource_id,
      name: res.data.name,
      original_filename: selectedFile.value.name,
      file_type: selectedFile.value.name.split('.').pop(),
      row_count: res.data.row_count,
      col_count: res.data.col_count,
      status: 'ready',
      fields: res.data.fields
    }
    dsStore.addDatasource(ds)
    dsStore.setCurrentDatasource(ds)
    selectedFile.value = null
    emit('uploaded', ds)
  } catch (e) {
    // 错误已在拦截器中处理
  } finally {
    uploading.value = false
  }
}

function selectDatasource(ds) {
  dsStore.setCurrentDatasource(ds)
}

async function handleDelete(ds) {
  try {
    await ElMessageBox.confirm(`确定删除数据源"${ds.name}"吗？删除后不可恢复。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await dsStore.removeDatasource(ds.id)
    ElMessage.success('删除成功')
  } catch (e) {
    // 取消或错误
  }
}

// 初始化加载数据源列表
dsStore.fetchDatasources()
</script>

<style scoped>
.file-upload {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.upload-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.header-icon {
  width: 44px;
  height: 44px;
  background: var(--primary-bg);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
}

.header-text .section-title {
  margin-bottom: var(--space-xs);
}

.header-hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 上传区域 */
.upload-area {
  width: 100%;
}

.upload-area :deep(.el-upload) {
  width: 100%;
}

.upload-area :deep(.el-upload-dragger) {
  width: 100%;
  padding: var(--space-xl) var(--space-lg);
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--fill-lighter);
  transition: all var(--transition-base);
}

.upload-area :deep(.el-upload-dragger:hover) {
  border-color: var(--primary-color);
  background: var(--primary-lighter);
}

.upload-area.disabled :deep(.el-upload-dragger) {
  background: var(--fill-color);
  cursor: not-allowed;
  opacity: 0.6;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.upload-icon-wrapper {
  width: 64px;
  height: 64px;
  background: var(--primary-light);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-icon {
  font-size: 32px;
  color: var(--primary-color);
}

.upload-text {
  text-align: center;
}

.upload-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.upload-hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 选中文件预览 */
.selected-file-preview {
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--fill-lighter);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
}

.file-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.file-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-icon-wrapper.excel {
  background: linear-gradient(135deg, #52c41a, #73d13d);
  color: #fff;
}

.file-icon-wrapper.csv {
  background: linear-gradient(135deg, #faad14, #ffc53d);
  color: #fff;
}

.file-icon-wrapper.other {
  background: var(--fill-color);
  color: var(--text-secondary);
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--space-xs);
}

.file-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.file-type {
  padding: 2px 6px;
  background: var(--fill-color);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
}

.delete-btn {
  flex-shrink: 0;
}

.upload-btn {
  width: 100%;
}

/* 已上传列表 */
.uploaded-section {
  margin-top: var(--space-lg);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.divider-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-regular);
}

.ds-list-container {
  flex: 1;
  overflow-y: auto;
  padding-right: var(--space-xs);
  max-height: calc(100vh - 520px);
}

.ds-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-base);
  margin-bottom: var(--space-sm);
  background: var(--card-bg);
}

.ds-card:hover {
  border-color: var(--primary-light);
  background: var(--primary-lighter);
}

.ds-card.active {
  border-color: var(--primary-color);
  background: var(--primary-bg);
}

.ds-card-icon {
  width: 40px;
  height: 40px;
  background: var(--success-light);
  color: var(--success-color);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ds-card-info {
  flex: 1;
  min-width: 0;
}

.ds-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: var(--space-xs);
}

.ds-meta {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.meta-dot {
  width: 3px;
  height: 3px;
  background: var(--text-placeholder);
  border-radius: 50%;
}

.ds-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.check-icon {
  color: var(--primary-color);
}

.ds-delete {
  color: var(--text-placeholder);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.ds-delete:hover {
  color: var(--danger-color);
}

/* 过渡动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all var(--transition-base);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 滚动条 */
.ds-list-container::-webkit-scrollbar {
  width: 4px;
}

.ds-list-container::-webkit-scrollbar-thumb {
  background: var(--text-placeholder);
  border-radius: var(--radius-full);
}

.ds-list-container::-webkit-scrollbar-track {
  background: transparent;
}
</style>
