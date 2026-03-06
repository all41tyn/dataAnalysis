import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDatasources, getFields } from '../api/analysis.js'
import { deleteDatasource as apiDeleteDatasource } from '../api/upload.js'

export const useDatasourceStore = defineStore('datasource', () => {
  const datasources = ref([])
  const currentDatasource = ref(null)
  const fields = ref([])
  const previewData = ref([])

  async function fetchDatasources() {
    const res = await getDatasources()
    datasources.value = res.data || []
    return datasources.value
  }

  async function fetchFields(datasourceId) {
    const res = await getFields(datasourceId)
    fields.value = res.data?.fields || []
    return res.data
  }

  function setCurrentDatasource(ds) {
    currentDatasource.value = ds
    if (ds) {
      fetchFields(ds.id)
    } else {
      fields.value = []
      previewData.value = []
    }
  }

  function addDatasource(ds) {
    datasources.value.unshift(ds)
  }

  async function removeDatasource(id) {
    await apiDeleteDatasource(id)
    datasources.value = datasources.value.filter(d => d.id !== id)
    if (currentDatasource.value?.id === id) {
      currentDatasource.value = null
      fields.value = []
      previewData.value = []
    }
  }

  function setPreviewData(data) {
    previewData.value = data
  }

  return {
    datasources,
    currentDatasource,
    fields,
    previewData,
    fetchDatasources,
    fetchFields,
    setCurrentDatasource,
    addDatasource,
    removeDatasource,
    setPreviewData
  }
})
