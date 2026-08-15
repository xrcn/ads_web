<template>
  <div class="login-container" :style="loginContainerStyle">
    <div class="login-content-out">
      <div class="login-content">
        <div class="login-content-main">
        <div class="login-icon-group">
            <div class="login-icon-group-title">
              <img :src="logoFull" alt="倚栏听枫" />
            </div>
          </div>
          <Account />
        </div>
      </div>
    </div>
    <div class="login-footer">
      <div class="login-footer-content mt15">
        <div class="login-footer-content-warp">
          <div>Copyright © 2026 倚栏听枫 All Rights Reserved.</div>
          <div class="mt5">龙岩市新罗区倚栏听枫文化传媒有限公司</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useThemeConfig } from '/@/stores/themeConfig';
import logoFull from '/@/assets/logo-maple-full.webp';
import loginBgOriental from '/@/assets/login-bg-oriental.webp';
import { NextLoading } from '/@/utils/loading';
import Account from '/@/views/login/component/account.vue';
defineOptions({ name: "loginIndex"})
const storesThemeConfig = useThemeConfig();
const { themeConfig } = storeToRefs(storesThemeConfig);
// 获取布局配置信息
const getThemeConfig = computed(() => {
  return themeConfig.value;
});
const loginContainerStyle = computed(() => {
  return {
    backgroundImage: `linear-gradient(180deg, rgba(250, 246, 238, 0.72) 0%, rgba(247, 243, 236, 0.82) 100%), url(${loginBgOriental})`,
  };
});
// 页面加载时
onMounted(() => {
  NextLoading.done();
});
</script>


<style scoped lang="scss">
.login-container {
  width: 100%;
  height: 100%;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  .login-icon-group {
    width: 100%;
    height: 100%;
    position: relative;
    .login-icon-group-title {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 18px;
      img {
        width: 320px;
        max-width: 100%;
        height: auto;
        object-fit: contain;
      }
    }
    &-icon {
      width: 60%;
      height: 70%;
      position: absolute;
      left: 0;
      bottom: 0;
    }
  }
  .login-content-out {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .login-content {
    width: 500px;
    padding: 24px 20px;
    margin: auto;
    background: rgba(255, 252, 247, 0.94);
    border: 1px solid rgba(191, 164, 122, 0.35);
    border-radius: 16px;
    box-shadow: 0 24px 60px rgba(108, 92, 68, 0.14);
    backdrop-filter: blur(6px);
    overflow: hidden;
    z-index: 1;
    position: relative;
    .login-content-main {
      margin: 0 auto;
      width: 84%;
      .login-content-title {
        color: var(--el-text-color-primary);
        font-weight: 500;
        font-size: 22px;
        text-align: center;
        letter-spacing: 4px;
        margin: 15px 0 30px;
        white-space: nowrap;
        z-index: 5;
        position: relative;
        transition: all 0.3s ease;
      }
    }
  }
  .login-footer{
    position: absolute;
    bottom: 12px;
    width: 100%;
    &-content {
      width: 100%;
      display: flex;
      &-warp {
        margin: auto;
        color: rgba(86, 72, 54, 0.82);
        text-align: center;
        font-size: 13px;
        text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
        animation: error-num 1s ease-in-out;
      }
    }
  }
}
</style>
