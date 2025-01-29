import type {Recordable, UserInfo} from '@vben/types';

import {ref} from 'vue';
import {useRouter} from 'vue-router';

import {DEFAULT_HOME_PATH, LOGIN_PATH} from '@vben/constants';
import {useAccessStore, useUserStore} from '@vben/stores';

import {notification} from 'ant-design-vue';
import {defineStore} from 'pinia';

import {getUserInfo, logoutAuth} from '#/api';
import {$t} from '#/locales';

import {useUserStoreAuth} from '#/store';
import {encryptByRsa} from "#/utils/encrypt";

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();
  const userStoreAuth = useUserStoreAuth()

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   */
  async function authLogin(params: Recordable<any>, onSuccess?: () => Promise<void> | void) {
    // 异步处理用户登录操作并获取 accessToken
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;

      await userStoreAuth.accountLogin({
        username: params.username,
        password: encryptByRsa(params.password) || '',
        captcha: params.captcha,
        uuid: params.uuid,
      });
      const token = userStoreAuth.token;
      // 如果成功获取到 accessToken
      if (token) {
        accessStore.setAccessToken(token);
        // 获取用户信息并存储到 accessStore 中
        const [fetchUserInfoResult, accessCodes] = await Promise.all([
          fetchUserInfo(),
          // getAccessCodesApi(),
        ]);

        userInfo = fetchUserInfoResult;

        userStore.setUserInfo(userInfo);
        // accessStore.setAccessCodes(accessCodes);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess
            ? await onSuccess?.()
            : await router.push(userInfo.homePath || DEFAULT_HOME_PATH);
        }

        if (userInfo?.nickName) {
          notification.success({
            description: `${$t('authentication.loginSuccessDesc')}:${userInfo?.nickName}`,
            duration: 3,
            message: $t('authentication.loginSuccess'),
          });
        }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutAuth();
    } catch {
      // 不做任何处理
    }
    // resetAllStores();
    accessStore.setAccessToken('');
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    let userInfo: null | UserInfo = null;
    userInfo = await getUserInfo();
    userStore.setUserInfo(userInfo.data);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
