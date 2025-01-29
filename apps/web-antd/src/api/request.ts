import type {AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios'
import axios from 'axios'
import qs from 'query-string'
import {getToken} from '#/utils/auth'
import {message} from 'ant-design-vue';
import {useAppConfig} from '@vben/hooks';
import {useAuthStore} from "#/store";
import {useAccessStore} from "@vben/stores";
import {preferences} from '@vben/preferences';

interface ICodeMessage {
  [propName: number]: string
}

const StatusCodeMessage: ICodeMessage = {
  200: '服务器成功返回请求的数据',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）',
  204: '删除数据成功',
  400: '请求错误(400)',
  401: '未授权，请重新登录(401)',
  403: '拒绝访问(403)',
  404: '请求出错(404)',
  408: '请求超时(408)',
  500: '服务器错误(500)',
  501: '服务未实现(501)',
  502: '网络错误(502)',
  503: '服务不可用(503)',
  504: '网络超时(504)',
}
const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
console.log("当前环境使用接口：",apiURL)
const http: AxiosInstance = axios.create({
  baseURL: apiURL,
  timeout: 30 * 1000,
})

const handleError = (msg: string) => {
  // if (msg.length >= 15) {
  //   message.error(msg || '服务器端错误');
  // }
  // message.error(msg || '服务器端错误', 5 * 1000);
  message.error(msg || '服务器端错误');
}

// 请求拦截器
http.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = getToken()
    if (token) {
      if (!config.headers) {
        config.headers = {}
      }
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器
http.interceptors.response.use(
  async (response: AxiosResponse) => {
    const {data} = response
    const {success, code, message} = data
    console.log(success, code, message)
    if (response.request.responseType === 'blob' || success) {
      return response
    }

    if (code === 401 && response.config.url == '/auth/user/info') {
      doReAuthenticate()
    }else {
      handleError(message)
    }
    return Promise.reject(new Error(message || '服务器端错误'))
  },
  (error: AxiosError) => {
    const { data } = error.response
    const { code, message } = data
    if (!error.response) {
      handleError('网络连接失败，请检查您的网络')
      return Promise.reject(error)
    }
    const status = error.response?.status
    if (code === -1) {
      handleError(message || StatusCodeMessage[status])
    }
    // const errorMsg = StatusCodeMessage[status] || '服务器暂时未响应，请刷新页面并重试。若无法解决，请联系管理员'
    // handleError(errorMsg)
    return Promise.reject(error)
  },
)

const request = async <T = unknown>(config: AxiosRequestConfig): Promise<ApiRes<T>> => {
  return http.request<T>(config)
    .then((res: AxiosResponse) => res.data)
    .catch((err: { msg: string }) => Promise.reject(err))
}

const requestNative = async <T = unknown>(config: AxiosRequestConfig): Promise<AxiosResponse> => {
  return http.request<T>(config)
    .then((res: AxiosResponse) => res)
    .catch((err: { msg: string }) => Promise.reject(err))
}

const createRequest = (method: string) => {
  return <T = any>(url: string, params?: object, config?: AxiosRequestConfig): Promise<ApiRes<T>> => {
    return request({
      method,
      url,
      [method === 'get' ? 'params' : 'data']: params,
      ...(method === 'get'
        ? {
          paramsSerializer: (obj) => qs.stringify(obj),
        }
        : {}),
      ...config,
    })
  }
}

const download = (url: string, params?: object, config?: AxiosRequestConfig): Promise<AxiosResponse> => {
  return requestNative({
    method: 'get',
    url,
    responseType: 'blob',
    params,
    paramsSerializer: (obj) => qs.stringify(obj),
    ...config,
  })
}
/**
 * 重新认证逻辑
 */
async function doReAuthenticate() {
  console.warn('Access token or refresh token is invalid or expired. ');
  const accessStore = useAccessStore();
  const authStore = useAuthStore();
  accessStore.setAccessToken(null);
  if (
    preferences.app.loginExpiredMode === 'modal' &&
    accessStore.isAccessChecked
  ) {
    accessStore.setLoginExpired(true);
  } else {
    await authStore.logout();
  }
}

export default {
  get: createRequest('get'),
  post: createRequest('post'),
  put: createRequest('put'),
  patch: createRequest('patch'),
  del: createRequest('delete'),
  request,
  requestNative,
  download,
}
