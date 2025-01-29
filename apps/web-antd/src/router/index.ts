import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import { resetStaticRoutes } from '@vben/utils';

import { createRouterGuard } from './guard';
import { routes } from './routes';

/**
 *  @zh_CN 创建vue-router实例
 */
const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_HISTORY === 'hash'
      ? createWebHashHistory(import.meta.env.VITE_BASE)
      : createWebHistory(import.meta.env.VITE_BASE),
  // 应该添加到路由的初始路由列表。
  routes,
  scrollBehavior: (to, _from, savedPosition) => {
    if (savedPosition) {
      return savedPosition;
    }
    return to.hash ? { behavior: 'smooth', el: to.hash } : { left: 0, top: 0 };
  },
  // 是否应该禁止尾部斜杠。
  // strict: true,
});


const resetRoutes = () => resetStaticRoutes(router, routes);

/**
 * @description 重置路由
 * @description 注意：所有动态路由路由必须带有 name 属性，否则可能会不能完全重置干净
 */
// export function resetRouter() {
//   try {
//     const routeStore = useRouteStore()
//     routeStore.asyncRoutes.forEach((route) => {
//       const { name } = route
//       if (name) {
//         router.hasRoute(name) && router.removeRoute(name)
//       }
//     })
//   } catch (error) {
//     // 强制刷新浏览器也行，只是交互体验不是很好
//     window.location.reload()
//   }
// }

// 创建路由守卫
createRouterGuard(router);

export { resetRoutes, router };
