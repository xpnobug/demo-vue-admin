import type * as T from './type'
import {requestClient} from '#/api/request';
import type { LabelValueState } from '#/types/global'

export type * from './type'

const BASE_URL = '/code/generator'

/** @desc 查询代码生成列表 */
export function listGenConfig(query: T.GenConfigPageQuery) {
  return requestClient.get<PageRes<T.GenConfigResp[]>>(`${BASE_URL}/config`, query)
}

/** @desc 查询生成配置信息 */
export function getGenConfig(tableName: string) {
  return requestClient.get<T.GenConfigResp>(`${BASE_URL}/config/${tableName}`)
}

/** @desc 查询字段配置列表 */
export function listFieldConfig(tableName: string, requireSync: boolean) {
  return requestClient.get<T.FieldConfigResp[]>(`${BASE_URL}/field/${tableName}?requireSync=${requireSync}`)
}

/** @desc 保存配置信息 */
export function saveGenConfig(tableName: string, req: T.GeneratorConfigResp) {
  return requestClient.post(`${BASE_URL}/config/${tableName}`, req)
}

/** @desc 生成预览 */
export function genPreview(tableName: string) {
  return requestClient.get<T.GeneratePreviewResp[]>(`${BASE_URL}/preview/${tableName}`)
}

/** @desc 生成代码 */
export function generate(tableNames: Array<string>) {
  return requestClient.post(`${BASE_URL}/${tableNames}`, {}, {responseType: 'blob'})
}

/** @desc 查询字典列表 */
export function listFieldConfigDict() {
  return requestClient.get<LabelValueState[]>(`${BASE_URL}/dict`)
}
