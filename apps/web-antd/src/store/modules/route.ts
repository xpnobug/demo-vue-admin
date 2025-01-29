import type { RouteRecordRaw } from 'vue-router';

import { ref } from 'vue';

import { cloneDeep, omit } from 'lodash-es';
import { defineStore } from 'pinia';
import { mapTree, toTreeArray } from 'xe-utils';

import { getUserRoute, type RouteItem } from '#/api';
import { BasicLayout } from '#/layouts';
import { accessRoutes } from '#/router/routes';
import { filterTree, transformPathToName } from '#/utils';

import ParentView from '../../components/ParentView/index.vue';

// 匹配views里面所有的.vue文件
const modules = import.meta.glob('../../views/**/*.vue');
/** 加载模块 */
export const loadView = (view: string) => {
  for (const path of Object.keys(modules)) {
    // 使用正则提取视图文件名
    const dir = path.match(/views\/(.*)\.vue$/)?.[1];
    // 如果视图名称匹配，返回一个函数形式的动态导入
    if (dir === view) {
      return () => modules[path](); // 返回一个函数形式的导入
    }
  }
  // 如果未匹配到，返回 null
  return null;
};

/** 将component由字符串转成真正的模块 */
const transformComponentView = (component: string) => {
  if (component === 'BasicLayout') {
    return BasicLayout as never;
  } else if (component === 'ParentView') {
    return ParentView as never;
  } else {
    return loadView(component) as never;
  }
};

/**
 * @description 前端来做排序、格式化
 * @params {menus} 后端返回的路由数据，已经根据当前用户角色过滤掉了没权限的路由
 * 1. 对后端返回的路由数据进行排序，格式化
 * 2. 同时将component由字符串转成真正的模块
 */
const formatAsyncRoutes = (menus: RouteItem[]) => {
  menus = menus.data;
  if (menus === null || menus.length === 0) return [];
  menus.sort((a, b) => (a?.sort ?? 0) - (b?.sort ?? 0)); // 排序
  const pathMap = new Map();
  const routes = mapTree(menus, (item) => {
    pathMap.set(item.id, item.path);
    if (item.children && item.children.length > 0) {
      item.children.sort((a, b) => (a?.sort ?? 0) - (b?.sort ?? 0)); // 排序
    }
    // 部分子菜单，例如：通知公告新增、查看详情，需要选中其父菜单
    if (item.parentId && item.type === 2 && item.permission) {
      item.activeMenu = pathMap.get(item.parentId);
    }
    return {
      meta: {
        badgeType: item.badgeType,
        order: item.sort,
        title: item.title,
        hidden: item.isHidden,
        keepAlive: item.isCache,
        icon: item.icon,
        showInTabs: item.showInTabs,
        activeMenu: item.activeMenu,
      },
      name: item.name ?? transformPathToName(item.path),
      path: item.path,
      component: transformComponentView(item.component),
      redirect: item.redirect,
    };
  });
  filterTree(routes, (i) => i.meta?.hidden === false);
  return routes as RouteRecordRaw[];
};

/** 判断路由层级是否大于 2 */
export const isMultipleRoute = (route: RouteRecordRaw) => {
  const children = route.children;
  if (children?.length) {
    // 只要有一个子路由的 children 长度大于 0，就说明是三级及其以上路由
    return children.some((child) => child.children?.length);
  }
  return false;
};

/** 路由降级（把三级及其以上的路由转化为二级路由） */
export const flatMultiLevelRoutes = (routes: RouteRecordRaw[]) => {
  const cloneRoutes = cloneDeep(routes);
  cloneRoutes.forEach((route) => {
    if (isMultipleRoute(route)) {
      const flatRoutes = toTreeArray(route.children);
      route.children = flatRoutes.map((i) =>
        omit(i, 'children'),
      ) as RouteRecordRaw[];
    }
  });
  return cloneRoutes;
};

const storeSetup = () => {
  // 所有路由(常驻路由 + 动态路由)
  const routes = ref<RouteRecordRaw[]>([]);
  // 动态路由(异步路由)
  const asyncRoutes = ref<RouteRecordRaw[]>([]);

  // 合并路由
  const setRoutes = (data: RouteRecordRaw[]) => {
    routes.value = [...accessRoutes].concat(data);
    asyncRoutes.value = data;
  };

  // 生成路由
  const generateRoutes = (): Promise<RouteRecordRaw[]> => {
    return new Promise((resolve) => {
      // 向后端请求路由数据 这个接口已经根据用户角色过滤了没权限的路由(后端根据用户角色过滤路由显得比较安全些)
      getUserRoute().then((res) => {
        const asyncRoutes = formatAsyncRoutes(res);
        setRoutes(asyncRoutes);
        const cloneRoutes = cloneDeep(asyncRoutes);
        const flatRoutes = flatMultiLevelRoutes(
          cloneRoutes as RouteRecordRaw[],
        );
        resolve(flatRoutes);
      });
    });
  };

  return {
    routes,
    asyncRoutes,
    generateRoutes,
  };
};

export const useRouteStore = defineStore('route', storeSetup, {
  persist: true,
});
