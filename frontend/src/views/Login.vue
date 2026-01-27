<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo 區域-->
      <div class="logo-section">
        <el-icon class="logo-icon" :size="60">
          <User />
        </el-icon>
        <h1 class="app-title">工讀生管理系統</h1>
        <p class="app-subtitle">Parttime Workers Management</p>
      </div>

      <!-- 登入表單 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <h2 class="login-title">登入系統</h2>

        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="請輸入帳號"
            size="large"
            :prefix-icon="User"
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="請輸入密碼"
            size="large"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            @click="handleLogin"
            block
          >
            <el-icon class="mr-2">
              <Key />
            </el-icon>
            登入
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 訪客模式 - 已隱藏 -->
      <div class="guest-section" style="display: none">
        <el-divider>
          <span class="divider-text">或</span>
        </el-divider>

        <el-button
          type="success"
          size="large"
          class="guest-button"
          :loading="guestLoading"
          @click="handleGuestLogin"
          block
          plain
        >
          <el-icon class="mr-2">
            <View />
          </el-icon>
          以訪客身份進入（唯讀模式）
        </el-button>
      </div>

      <!-- 權限說明 -->
      <div class="permission-info">
        <el-alert title="權限說明" type="info" :closable="false" show-icon>
          <template #default>
            <div class="permission-list">
              <p><strong>管理者</strong>：全部功能 + 帳號管理</p>
              <p><strong>小組長</strong>：編輯、匯入、刪除、報表</p>
              <p><strong>訪客</strong>：唯讀模式</p>
            </div>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { User, Lock, Key, View } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

// 表單資料
const loginForm = reactive({
  username: "",
  password: "",
});

// 表單驗證規則
const loginRules = {
  username: [{ required: true, message: "請輸入帳號", trigger: "blur" }],
  password: [{ required: true, message: "請輸入密碼", trigger: "blur" }],
};

// 引用
const loginFormRef = ref();
const loading = ref(false);
const guestLoading = ref(false);

// 登入處理
const handleLogin = async () => {
  if (!loginFormRef.value) {
    ElMessage.error("表單參考未初始化，請稍後重試");
    return;
  }

  try {
    // 表單驗證
    const valid = await loginFormRef.value.validate();
    if (!valid) {
      ElMessage.warning("請填寫完整資料");
      return;
    }

    loading.value = true;
    console.log("Login.vue: 開始登入流程", { username: loginForm.username });

    const result = await authStore.login(
      loginForm.username,
      loginForm.password,
    );
    console.log("Login.vue: 登入結果", result);

    if (result.success) {
      ElMessage.success(result.message || "登入成功");
      console.log("Login.vue: 登入成功，準備跳轉");
      console.log("Login.vue: 認證狀態", {
        isLoggedIn: authStore.isLoggedIn,
        userRole: authStore.userRole,
        user: authStore.user,
      });

      // 等待狀態更新完成
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 跳轉到首頁
      console.log("Login.vue: 開始跳轉");
      window.location.href = "/";
    } else {
      ElMessage.error(result.message || "登入失敗");
      console.error("Login.vue: 登入失敗", result.message);
    }
  } catch (error) {
    console.error("Login.vue: 登入錯誤", error);
    ElMessage.error("登入過程中發生錯誤，請稍後重試");
  } finally {
    loading.value = false;
  }
};

// 訪客登入
const handleGuestLogin = async () => {
  try {
    guestLoading.value = true;

    const result = await authStore.guestLogin();

    if (result.success) {
      ElMessage.success(result.message);
      window.location.href = "/";
    } else {
      ElMessage.error(result.message);
    }
  } catch (error) {
    console.error("訪客登入錯誤:", error);
    ElMessage.error("訪客登入失敗，請稍後重試");
  } finally {
    guestLoading.value = false;
  }
};

// 組件掛載時檢查登入狀態
onMounted(() => {
  // 初始化認證狀態
  authStore.initializeAuth();

  // 如果已經登入，直接跳轉
  if (authStore.isLoggedIn) {
    console.log("用戶已登入，跳轉到首頁");
    router.push("/");
  }
});
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 420px;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
}

.logo-icon {
  color: #667eea;
  margin-bottom: 15px;
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 8px 0;
}

.app-subtitle {
  color: #7f8c8d;
  font-size: 14px;
  margin: 0;
  opacity: 0.8;
}

.login-form {
  margin-bottom: 25px;
}

.login-title {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 25px;
  font-size: 20px;
  font-weight: 600;
}

.login-button {
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-weight: 600;
  font-size: 16px;
  border-radius: 12px;
}

.login-button:hover {
  opacity: 0.9;
}

.guest-section {
  margin-bottom: 25px;
}

.divider-text {
  color: #95a5a6;
  font-size: 14px;
}

.guest-button {
  height: 50px;
  font-weight: 600;
  font-size: 16px;
  border-radius: 12px;
  border: 2px dashed #27ae60;
}

.permission-info {
  margin-top: 20px;
}

.permission-list {
  font-size: 13px;
  line-height: 1.6;
}

.permission-list p {
  margin: 5px 0;
}

.mr-2 {
  margin-right: 8px;
}

/* 響應式適配 */
@media (max-width: 480px) {
  .login-container {
    padding: 15px;
  }

  .login-card {
    padding: 25px;
  }

  .app-title {
    font-size: 24px;
  }

  .login-button,
  .guest-button {
    height: 45px;
    font-size: 15px;
  }
}

/* Element Plus 樣式覆蓋 */
.login-form :deep(.el-input) {
  --el-input-border-radius: 12px;
  margin-bottom: 8px;
}

.login-form :deep(.el-input__wrapper) {
  padding: 12px 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e4e7ed;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.login-form :deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
}

.permission-info :deep(.el-alert) {
  border-radius: 12px;
  border: 1px solid #e1f0ff;
}

.permission-info :deep(.el-alert__content) {
  padding: 8px 0;
}
</style>
