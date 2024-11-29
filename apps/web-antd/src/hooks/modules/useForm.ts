import { reactive } from 'vue'
import { cloneDeep } from 'lodash-es'

export function useForm<F extends object>(initValue: F) {
  const getInitValue = () => cloneDeep(initValue)

  // 使用 reactive 创建响应式数据
  const form = reactive(getInitValue())

  // 重置表单
  const resetForm = () => {
    // 直接使用 Object.assign 重置表单
    Object.assign(form, getInitValue())
  }

  return { form, resetForm }
}
