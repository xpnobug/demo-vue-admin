<template>
  <Page>
    <GiTable
      title="代码生成"
      row-key="tableName"
      :data="dataList"
      :columns="columns"
      :loading="loading"
      :scroll="{ x: '100%', y: '100%', minWidth: 1000 }"
      :disabled-tools="['size', 'setting']"
      :disabled-column-keys="['tableName']"
      @refresh="search"
    >
      <template #toolbar-left>
        <a-input v-model="queryForm.tableName" placeholder="请输入表名称" allow-clear @change="search">
          <!--          <template #prefix><icon-search /></template>-->
        </a-input>
        <a-button @click="reset">
          <!--          <template #icon><icon-refresh /></template>-->
          <template #default>重置</template>
        </a-button>
      </template>
      <template #bodyCell="{ column, record, rowIndex, index }">
        <template v-if="column.dataIndex === 'action'">
          <a-space>
            <!--          v-permission="['code:generator:config']"-->
            <a-typography-link  title="配置" @click="onConfig(record.tableName, record.comment)">配置</a-typography-link>
            <!--          v-permission="['code:generator:preview']"-->
            <a-typography-link
              :disabled="!record.createTime"
              :title="record.createTime ? '生成' : '请先进行生成配置'"
              @click="onPreview(record.tableName)"
            >
              生成
            </a-typography-link>
          </a-space>
        </template>
      </template>
    </GiTable>
    <GenConfigDrawer ref="GenConfigDrawerRef" @save-success="search" />
    <GenPreviewModal ref="GenPreviewModalRef" @generate="onGenerate" />
  </Page>
</template>

<script setup lang="ts">
import { reactive, ref, defineAsyncComponent, defineOptions, h } from 'vue'
import {Page} from '@vben/common-ui';
import GenConfigDrawer from './GenConfigDrawer.vue'
import { generate, listGenConfig } from '#/api/code/generator'
import GiTable from '#/components/GiTable/index.vue';
import { useTable } from '#/hooks'
import { isMobile } from '#/utils'
import type { TableInstanceColumns } from '#/components/GiTable/type'

defineOptions({ name: 'CodeGenerator' })
const GenPreviewModal = defineAsyncComponent(() => import('./GenPreviewModal.vue'))

const queryForm = reactive({
  tableName: undefined,
})

const {
  tableData: dataList,
  loading,
  pagination,
  search,
} = useTable((page) => listGenConfig({ ...queryForm, ...page }), { immediate: true })
const columns = [
  {
    title: '序号',
    width: 66,
    align: 'center',
    render: ({ rowIndex }) => h('span', {}, rowIndex + 1 + (pagination.current - 1) * pagination.pageSize),
  },
  { title: '表名称', dataIndex: 'tableName', minWidth: 225, ellipsis: true, tooltip: true },
  { title: '描述', dataIndex: 'comment', ellipsis: true, tooltip: true },
  { title: '类名前缀', dataIndex: 'classNamePrefix', ellipsis: true, tooltip: true },
  { title: '作者名称', dataIndex: 'author' },
  { title: '所属模块', dataIndex: 'moduleName', ellipsis: true, tooltip: true },
  { title: '模块包名', dataIndex: 'packageName', ellipsis: true, tooltip: true },
  { title: '配置时间', dataIndex: 'createTime', width: 180 },
  { title: '修改时间', dataIndex: 'updateTime', width: 180 },
  { title: '操作', dataIndex: 'action', slotName: 'action', width: 160, align: 'center', fixed: !isMobile() ? 'right' : undefined },
]

// 重置
const reset = () => {
  queryForm.tableName = undefined
  search()
}

const GenConfigDrawerRef = ref<InstanceType<typeof GenConfigDrawer>>()
// 配置
const onConfig = (tableName: string, comment: string) => {
  GenConfigDrawerRef.value?.onOpen(tableName, comment)
}

const GenPreviewModalRef = ref<InstanceType<typeof GenPreviewModal>>()
// 预览
const onPreview = (tableName: string) => {
  GenPreviewModalRef.value?.onOpen(tableName)
}

// 生成
const onGenerate = async (tableNames: Array<string>) => {
  const res = await generate(tableNames)
  console.log(res)
  const contentDisposition = res.headers['content-disposition']
  const pattern = /filename=([^;]+\.[^.;]+);*/
  const result = pattern.exec(contentDisposition) || ''
  // 对名字进行解码
  const fileName = window.decodeURI(result[1])
  // 创建下载的链接
  const blob = new Blob([res.data])
  const downloadElement = document.createElement('a')
  const href = window.URL.createObjectURL(blob)
  downloadElement.style.display = 'none'
  downloadElement.href = href
  // 下载后文件名
  downloadElement.download = fileName
  document.body.appendChild(downloadElement)
  // 点击下载
  downloadElement.click()
  // 下载完成，移除元素
  document.body.removeChild(downloadElement)
  // 释放掉 blob 对象
  window.URL.revokeObjectURL(href)
}
</script>

<style scoped lang="scss"></style>
