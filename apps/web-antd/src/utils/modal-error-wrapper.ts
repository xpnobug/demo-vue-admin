import { Modal } from 'ant-design-vue'
import ModalReturn from "ant-design-vue"
let modalInstance: ModalReturn | null = null

// 封装 Modal 错误提示框
const modalErrorWrapper = (options: {
  title: string
  content: string
  maskClosable?: boolean
  escToClose?: boolean
  okText?: string
  onOk?: () => Promise<void> | void
}) => {
  // 如果之前有 Modal 实例，先关闭它
  if (modalInstance) {
    modalInstance.close()
  }

  // 通过 Modal.error 打开新的错误提示框，并保存实例
  modalInstance = Modal.error({
    ...options,
    maskClosable: options.maskClosable ?? false,
    keyboard: options.escToClose ?? false,
    onOk: async () => {
      if (options.onOk) {
        await options.onOk()
      }
      modalInstance = null // 关闭后清空实例
    }
  })
}

export default modalErrorWrapper
