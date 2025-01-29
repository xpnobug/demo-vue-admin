<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :mask-closable="false"
    :esc-to-close="false"
    :width="width >= 600 ? 600 : '100%'"
    draggable
    @ok="save"
    @close="reset"
  >
    <a-form ref="formRef" :model="form" :rules="formRules" auto-label-width>
      <a-form-item label="菜单类型" name="type">
        <a-radio-group v-model:value="form.type" type="button" :disabled="isUpdate" @change="onChangeType">
          <a-radio :value="1">目录</a-radio>
          <a-radio :value="2">菜单</a-radio>
          <a-radio :value="3">按钮</a-radio>
        </a-radio-group>
      </a-form-item>
      <a-form-item label="上级菜单" name="parentId">
        <a-tree-select
          v-model:value="form.parentId"
          placeholder="请选择上级菜单"
          allow-clear
          allow-search
          :treeData="menuSelectTree"
          :fallback-option="false"
          :filter-tree-node="filterOptions"
        />
      </a-form-item>
      <a-form-item v-if="[1, 2].includes(form.type)" label="菜单图标" name="icon">
        <GiIconSelector v-model="form.icon" />
      </a-form-item>
      <a-form-item label="菜单标题" name="title">
        <a-input v-model:value="form.title" placeholder="请输入菜单标题" allow-clear />
      </a-form-item>
      <a-form-item v-if="[1, 2].includes(form.type)" label="路由地址" name="path">
        <a-input v-model:value="form.path" placeholder="请输入路由地址" allow-clear />
      </a-form-item>
      <a-form-item v-if="[1, 2].includes(form.type) && !form.isExternal" label="重定向" name="redirect">
        <a-input v-model:value="form.redirect" placeholder="请输入重定向地址" allow-clear />
      </a-form-item>
      <a-form-item v-if="[1, 2].includes(form.type) && !form.isExternal" label="组件名称" name="name">
        <a-input v-model:value="form.name" placeholder="请输入组件名称" allow-clear />
        <template #extra>
          <div v-if="componentName">
            <span>建议组件名称：</span>
            <a-tag checkable @click="inputComponentName">{{ componentName }}</a-tag>
          </div>
        </template>
      </a-form-item>
      <a-form-item v-if="form.type === 2" label="组件路径" name="component">
        <a-input v-if="form.isExternal" v-model:value="form.component" placeholder="请输入组件路径" allow-clear />
        <a-input v-else v-model:value="form.component" placeholder="请输入组件路径" allow-clear>
          <template #prepend>@/views/</template>
          <template #append>.vue</template>
        </a-input>
      </a-form-item>
      <a-form-item v-if="form.type === 3" label="权限标识" name="permission">
        <a-input v-model:value="form.permission" placeholder="system:user:add" allow-clear />
      </a-form-item>
      <a-row v-if="[1, 2].includes(form.type)" :gutter="16">
        <a-col :xs="12" :sm="12" :md="8" :lg="8" :xl="8" :xxl="8">
          <a-form-item label="是否隐藏" name="hidden">
            {{form.isHidden}}
            <a-switch
              v-model:checked="form.isHidden"
              checked-children="是"
              un-checked-children="否"
              type="round"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="8" :xl="8" :xxl="8">
          <a-form-item label="是否缓存" name="keepAlive">
            <a-switch
              v-model:checked="form.isCache"
              checked-children="是"
              un-checked-children="否"
              type="round"
            />
          </a-form-item>
        </a-col>
        <a-col :xs="12" :sm="12" :md="8" :lg="8" :xl="8" :xxl="8">
          <a-form-item v-if="form.type === 2" label="是否外链" name="isExternalUrl">
            <a-switch
              v-model:checked="form.isExternal"
              checked-children="是"
              un-checked-children="否"
              type="round"
            />
          </a-form-item>
        </a-col>
      </a-row>
      <a-form-item label="菜单排序" name="sort">
        <a-input-number v-model="form.sort" placeholder="请输入菜单排序" :min="1" mode="button" style="width: 150px" />
      </a-form-item>
      <a-form-item label="状态" name="status">
        <a-switch
          v-model:checked="form.status"
          type="round"
          :checked-value="1"
          :unchecked-value="2"
          checked-children="启用"
          unchecked-children="禁用"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { type FormInstance, message, type TreeNodeData } from 'ant-design-vue'
import { useWindowSize } from '@vueuse/core'
import { mapTree } from 'xe-utils'
import { type MenuResp, addMenu, getMenu, updateMenu } from '#/api/system/menu'
import { useForm } from '#/hooks'
import { filterTree, transformPathToName } from '#/utils'
import GiIconSelector from '#/components/GiIconSelector/index.vue'
interface Props {
  menus: MenuResp[]
}
const props = withDefaults(defineProps<Props>(), {
  menus: () => [],
})

const emit = defineEmits<{
  (e: 'save-success'): void
}>()

const { width } = useWindowSize()

const dataId = ref('')
const visible = ref(false)
const isUpdate = computed(() => !!dataId.value)
const title = computed(() => (isUpdate.value ? '修改菜单' : '新增菜单'))
const formRef = ref<FormInstance>()

const { form, resetForm } = useForm({
  type: 1,
  sort: 999,
  isExternal: false,
  isCache: false,
  isHidden: false,
  status: 1,
})

const componentName = computed(() => transformPathToName(form.path))

const rules: FormInstance['rules'] = {
  parentId: [{ required: true, message: '请选择上级菜单' }],
  title: [{ required: true, message: '请输入菜单标题' }],
  path: [{ required: true, message: '请输入路由地址' }],
  name: [{ required: true, message: '请输入组件名称' }],
  component: [{ required: true, message: '请输入组件路径' }],
  permission: [{ required: true, message: '请输入权限标识' }],
}
// eslint-disable-next-line vue/return-in-computed-property
const formRules = computed(() => {
  if ([1, 2].includes(form.type)) {
    const { title, name, path } = rules
    return { title, name, path } as FormInstance['rules']
  }
  if (form.type === 3) {
    const { parentId, title, permission } = rules
    return { parentId, title, permission } as FormInstance['rules']
  }
})

// 重置
const reset = () => {
  formRef.value?.resetFields()
  resetForm()
}

// 设置建议组件名
const inputComponentName = () => {
  form.name = componentName.value
}

// 切换类型清除校验
const onChangeType = () => {
  formRef.value?.clearValidate()
}

// 转换为菜单树
const menuSelectTree = computed(() => {
  const menus = JSON.parse(JSON.stringify(props.menus)) as MenuResp[]
  const data = filterTree(menus, (i) => [1, 2].includes(i.type))
  return mapTree(data, (i) => ({
    value: i.id,
    label: i.title,
    children: i.children,
  }))
})

// 过滤树
const filterOptions = (searchKey: string, nodeData: TreeNodeData) => {
  if (nodeData.title) {
    return nodeData.title.toLowerCase().includes(searchKey.toLowerCase())
  }
  return false
}

// 保存
const save = async () => {
  try {
    await formRef.value?.validate()
    // console.log('isInvalid',isInvalid)
    // if (isInvalid) return false
    if (isUpdate.value) {
      await updateMenu(form, dataId.value)
      message.success('修改成功')
    } else {
      await addMenu(form)
      message.success('新增成功')
    }
    emit('save-success')
    return true
  } catch (error) {
    return false
  }
}

// 新增
const onAdd = (id?: string) => {
  reset()
  console.log(id)
  form.parentId = id
  dataId.value = ''
  visible.value = true
}

// 修改
const onUpdate = async (id: string) => {
  reset()
  dataId.value = id
  const data = await getMenu(id)
  Object.assign(form, data)
  visible.value = true
}

defineExpose({ onAdd, onUpdate })
</script>

<style scoped lang="scss"></style>
