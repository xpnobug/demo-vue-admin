import type * as T from './type'

import {requestClient} from '#/api/request';

export type * from './type'

const BASE_URL = '/system/menu'

/** @desc 查询菜单列表 */
export function listMenu(query: T.MenuQuery) {
  return requestClient.get<T.MenuResp[]>(`${BASE_URL}/tree`, query)
}

/** @desc 查询菜单详情 */
export function getMenu(id: string) {
  return requestClient.get<T.MenuResp>(`${BASE_URL}/${id}`)
}

/** @desc 新增菜单 */
export function addMenu(data: any) {
  return requestClient.post<boolean>(`${BASE_URL}/add`, data)
}

/** @desc 修改菜单 */
export function updateMenu(data: any, id: string) {
  return requestClient.post(`${BASE_URL}/update/${id}`, data)
}

/** @desc 删除菜单 */
export function deleteMenu(id: string) {
  return requestClient.del(`${BASE_URL}/${id}`)
}

