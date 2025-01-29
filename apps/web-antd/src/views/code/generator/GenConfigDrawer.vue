<template>
  <a-drawer
    v-model:open="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 1350 ? 1350 : '100%'"
    @before-ok="save"
    @close="reset"
  >

    <a-tabs v-model:activeKey="activeKey">
      <a-tab-pane key="1" tab="生成配置">
        <GiForm ref="formRef" v-model="form" :options="options" :columns="formColumns" />
      </a-tab-pane>
      <a-tab-pane key="2" tab="字段配置">
        <GiTable
          row-key="tableName"
          :data="dataList"
          :columns="columns"
          :loading="loading"
          :scroll="{ x: '100%', y: 800, minWidth: 900 }"
          :pagination="false"
          :draggable="{ type: 'handle', width: 40 }"
          :disabled-tools="['setting', 'refresh']"
          :disabled-column-keys="['tableName']"
          @change="handleChangeSort"
        >
          <template #toolbar-left>
            <a-popconfirm
              title="是否确定同步最新数据表结构？同步后只要不点击确定保存，则不影响原有配置数据。"
              type="warning"
              @ok="handleRefresh(form.tableName)"
            >
              <a-tooltip title="同步最新数据表结构">
                <a-button
                  type="primary"
                  status="success"
                  size="small"
                  title="同步"
                  :disabled="dataList.length !== 0 && dataList[0].createTime == null"
                >
<!--                  <template #icon><icon-sync /></template>-->
                  同步
                </a-button>
              </a-tooltip>
            </a-popconfirm>
          </template>
          <template #bodyCell="{ column, record, rowIndex, index }">
            <template v-if="column.slotName === 'fieldName'">
              <a-input v-model:value="record.fieldName" />
            </template>
            <template v-if="column.slotName === 'fieldType'">
              <a-select
                v-model:value="record.fieldType"
                placeholder="请选择字段类型"
                allow-search
                allow-create
                :error="!record.fieldType"
              >
                <a-select-option value="String">String</a-select-option>
                <a-select-option value="Integer">Integer</a-select-option>
                <a-select-option value="Long">Long</a-select-option>
                <a-select-option value="Float">Float</a-select-option>
                <a-select-option value="Double">Double</a-select-option>
                <a-select-option value="Boolean">Boolean</a-select-option>
                <a-select-option value="BigDecimal">BigDecimal</a-select-option>
                <a-select-option value="LocalDate">LocalDate</a-select-option>
                <a-select-option value="LocalTime">LocalTime</a-select-option>
                <a-select-option value="LocalDateTime">LocalDateTime</a-select-option>
              </a-select>
            </template>
            <template v-if="column.slotName === 'comment'">
              <a-input v-model:value="record.comment" />
            </template>
            <template v-if="column.slotName === 'showInList'">
              <a-checkbox v-model:checked="record.showInList" value="true" />
            </template>
            <template v-if="column.slotName === 'showInForm'">
              <a-checkbox v-model:checked="record.showInForm" value="true" />
            </template>
            <template v-if="column.slotName === 'isRequired'">
              <a-checkbox v-if="record.showInForm" v-model:checked="record.isRequired" value="true" />
              <a-checkbox v-else disabled />
            </template>
            <template v-if="column.slotName === 'showInQuery'">
              <a-checkbox v-model:checked="record.showInQuery" value="true" />
            </template>
            <template v-if="column.slotName === 'formType'">
<!--              :options="form_type_enum"-->
              <a-select
                v-if="record.showInForm || record.showInQuery"
                v-model:value="record.formType"
                :default-value="1"
                placeholder="请选择表单类型"
              />
              <span v-else>无需设置</span>
            </template>
            <template v-if="column.slotName === 'queryType'">
<!--              :options="query_type_enum"-->
              <a-select
                v-if="record.showInQuery"
                v-model:value="record.queryType"
                :default-value="1"
                placeholder="请选择查询方式"
              />
              <span v-else>无需设置</span>
            </template>
            <template v-if="column.slotName === 'dictCode'">
              <a-select
                v-model:value="record.dictCode"
                :options="dictList"
                placeholder="请选择字典类型"
                allow-search
                allow-clear
              />
            </template>
          </template>
        </GiTable>
      </a-tab-pane>
    </a-tabs>
    <template #footer>
      <a-button style="margin-right: 8px" @click="onClose">取消</a-button>
      <a-button type="primary" @click="save">保存</a-button>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useWindowSize } from '@vueuse/core'
import { type FieldConfigResp, type GeneratorConfigResp, getGenConfig, listFieldConfig, listFieldConfigDict, saveGenConfig } from '#/api/code/generator'
import type { LabelValueState } from '#/types/global'
import type { TableInstanceColumns } from '#/components/GiTable/type'
import { type Columns, GiForm, type Options } from '#/components/GiForm'
import { useForm } from '#/hooks'
// import { useDict } from '#/hooks/app'
import GiTable from '#/components/GiTable/index.vue';

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const title = ref('')
const visible = ref(false)
const activeKey = ref('1')
const formRef = ref<InstanceType<typeof GiForm>>()
// const { form_type_enum, query_type_enum } = useDict('form_type_enum', 'query_type_enum')
const dictList = ref<LabelValueState[]>([])

const options: Options = {
  form: { size: 'large' },
  grid: { cols: 2 },
  btns: { hide: true },
}
const { form, resetForm } = useForm({
  isOverride: false,
})
const formColumns: Columns = reactive([
  {
    label: '作者名称',
    field: 'author',
    type: 'input',
    props: {
      placeholder: '请输入作者名称',
    },
    rules: [{ required: true, message: '请输入作者名称' }],
  },
  {
    label: '业务名称',
    field: 'businessName',
    type: 'input',
    props: {
      placeholder: '自定义业务名称，例如：用户',
    },
    rules: [{ required: true, message: '请输入业务名称' }],
  },
  {
    label: '所属模块',
    field: 'moduleName',
    type: 'input',
    props: {
      placeholder: '项目模块名称，例如：continew-system',
    },
    rules: [{ required: true, message: '请输入所属模块' }],
  },
  {
    label: '模块包名',
    field: 'packageName',
    type: 'input',
    props: {
      placeholder: '项目模块包名，例如：top.continew.admin.system',
    },
    rules: [{ required: true, message: '请输入模块包名' }],
  },
  {
    label: '去表前缀',
    field: 'tablePrefix',
    type: 'input',
    props: {
      placeholder: '数据库表前缀，例如：sys_',
      width: '200',
    },
  },
  {
    label: '是否覆盖',
    field: 'isOverride',
    type: 'switch',
    props: {
      type: 'round',
      checkedValue: true,
      uncheckedValue: false,
      checkedText: '是',
      uncheckedText: '否',
    },
  },
])

const dataList = ref<FieldConfigResp[]>([])
const loading = ref(false)
// 查询列表数据
const getDataList = async (tableName: string, requireSync: boolean) => {
  try {
    loading.value = true
    const data = await listFieldConfig(tableName, requireSync)
    dataList.value = data
  } finally {
    loading.value = false
  }
}

// Table 字段配置
const columns = [
  { title: '名称', slotName: 'fieldName' },
  { title: '类型', slotName: 'fieldType' },
  { title: '描述', slotName: 'comment', width: 170 },
  { title: '列表', slotName: 'showInList', width: 60, align: 'center' },
  { title: '表单', slotName: 'showInForm', width: 60, align: 'center' },
  { title: '必填', slotName: 'isRequired', width: 60, align: 'center' },
  { title: '查询', slotName: 'showInQuery', width: 60, align: 'center' },
  { title: '表单类型', slotName: 'formType' },
  { title: '查询方式', slotName: 'queryType' },
  { title: '关联字典', slotName: 'dictCode' },
]

// 重置
const reset = () => {
  formRef.value?.formRef?.resetFields()
  resetForm()
}

// 同步
const handleRefresh = async (tableName: string) => {
  await getDataList(tableName, true)
}

// 拖拽排序
const handleChangeSort = (newDataList: FieldConfigResp[]) => {
  dataList.value = newDataList
}

// 保存
const save = async () => {
  try {
    const isInvalid = await formRef.value?.formRef?.validate()
    console.log(isInvalid)
    // if (isInvalid) {
    //   activeKey.value = '1'
    //   return false
    // }
    await saveGenConfig(form.tableName, {
      genConfig: form,
      fieldConfigs: dataList.value,
    } as GeneratorConfigResp)
    message.success('保存成功')
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 打开
const onOpen = async (tableName: string, comment: string) => {
  reset()
  comment = comment ? `（${comment}）` : ' '
  title.value = `${tableName}${comment}配置`
  // 查询生成配置
  const data = await getGenConfig(tableName)
  Object.assign(form, data)
  form.isOverride = form.isOverride || false
  visible.value = true
  // 查询字段配置
  await getDataList(tableName, false)
  // const res = await listFieldConfigDict()
  // dictList.value = res.data
}
const onClose = () => {
  visible.value = false;
};
defineExpose({ onOpen })
</script>

<style scoped lang="scss">
:deep(.gen-config.arco-form) {
  width: 50%;
}
</style>
