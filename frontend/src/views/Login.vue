<template>
  <div class="login-container">
    <div class="login-card">
      <!-- Logo ?Ä??-->
      <div class="logo-section">
        <el-icon class="logo-icon" :size="60">
          <User />
        </el-icon>
        <h1 class="app-title">Â∑•Ë??üÁÆ°?ÜÁ≥ªÁµ?/h1>
        <p class="app-subtitle">Parttime Workers Management</p>
      </div>

      <!-- ?ªÂÖ•Ë°®ÂñÆ -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <h2 class="login-title">?ªÂÖ•Á≥ªÁµ±</h2>

        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="Ë´ãËº∏?•Â∏≥??
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
            placeholder="Ë´ãËº∏?•Â?Á¢?
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
            ?ªÂÖ•
          </el-button>
        </el-form-item>
      </el-form>

      <!-- Ë®™ÂÆ¢Ê®°Â? -->
      <div class="guest-section">
        <el-divider>
          <span class="divider-text">??/span>
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
          ‰ª•Ë®™ÂÆ¢Ë∫´‰ªΩÈÄ≤ÂÖ•ÔºàÂ??èË¶ΩÔº?
        </el-button>
      </div>

      <!-- Ê¨äÈ?Ë™™Ê? -->
      <div class="permission-info">
        <el-alert title="Ê¨äÈ?Ë™™Ê?" type="info" :closable="false" show-icon>
          <template #default>
            <div class="permission-list">
              <p><strong>ÁÆ°Á???/strong>ÔºöÂÖ®?®Â???+ Â∏≥Ë?ÁÆ°Á?</p>
              <p><strong>Â∞èÁ???/strong>ÔºöÁ∑®ËºØ„ÄÅÂåØ?•„ÄÅÊ??°„ÄÅÂ†±Ë°?/p>
              <p><strong>Ë®™ÂÆ¢</strong>ÔºöÂ??èË¶Ω?üËÉΩ</p>
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

// Ë°®ÂñÆ?∏Ê?
const loginForm = reactive({
  username: "",
  password: "",
});

// Ë°®ÂñÆÈ©óË?Ë¶èÂ?
const loginRules = {
  username: [{ required: true, message: "Ë´ãËº∏?•Â∏≥??, trigger: "blur" }],
  password: [{ required: true, message: "Ë´ãËº∏?•Â?Á¢?, trigger: "blur" }],
};

// ÂºïÁî®
const loginFormRef = ref();
const loading = ref(false);
const guestLoading = ref(false);

// ?ªÂÖ•?ïÁ?
const handleLogin = async () => {
  if (!loginFormRef.value) {
    ElMessage.error("Ë°®ÂñÆ?™Ë??•Â??êÔ?Ë´ãÁ?ÂæåÂ?Ë©?);
    return;
  }

  try {
    // Ë°®ÂñÆÈ©óË?
    const valid = await loginFormRef.value.validate();
    if (!valid) {
      ElMessage.warning("Ë´ãÂ°´ÂØ´Â??¥Ë?Ë®?);
      return;
    }

    loading.value = true;
    console.log("Login.vue: ?ãÂ??ªÂÖ•ÊµÅÁ?", { username: loginForm.username });

    const result = await authStore.login(
      loginForm.username,
      loginForm.password,
    );
    console.log("Login.vue: ?ªÂÖ•ÁµêÊ?", result);

    if (result.success) {
      ElMessage.success(result.message || "?ªÂÖ•?êÂ?");
      console.log("Login.vue: ?ªÂÖ•?êÂ?ÔºåÊ??ôË∑≥ËΩ?);
      console.log("Login.vue: Ë™çË??Ä??, {
        isLoggedIn: authStore.isLoggedIn,
        userRole: authStore.userRole,
        user: authStore.user,
      });

      // Á≠âÂ??Ä?ãÊõ¥?∞Â???
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Ë∑≥Ë??∞È???
      console.log("Login.vue: ?ãÂ?Ë∑≥Ë?");
      window.location.href = "/";
    } else {
      ElMessage.error(result.message || "?ªÂÖ•Â§±Ê?");
      console.error("Login.vue: ?ªÂÖ•Â§±Ê?", result.message);
    }
  } catch (error) {
    console.error("Login.vue: ?ªÂÖ•?ØË™§", error);
    ElMessage.error("?ªÂÖ•?éÁ?‰∏≠Áôº?üÈåØË™§Ô?Ë´ãÁ?ÂæåÂ?Ë©?);
  } finally {
    loading.value = false;
  }
};

// Ë®™ÂÆ¢?ªÂÖ•
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
    console.error("Ë®™ÂÆ¢?ªÂÖ•?ØË™§:", error);
    ElMessage.error("Ë®™ÂÆ¢?ªÂÖ•Â§±Ê?ÔºåË?Á®çÂ??çË©¶");
  } finally {
    guestLoading.value = false;
  }
};

// ÁµÑ‰ª∂?õË??ÇÊ™¢?•Áôª?•Á???
onMounted(() => {
  // ?ùÂ??ñË?Ë≠âÁ???
  authStore.initializeAuth();

  // Â¶ÇÊ?Â∑≤Á??ªÂÖ•ÔºåÁõ¥?•Ë∑≥ËΩ?
  if (authStore.isLoggedIn) {
    console.log("?®Êà∂Â∑≤Áôª?•Ô?Ë∑≥Ë??∞È???);
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

/* ?ãÊ??àÈÅ©??*/
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

/* Element Plus Ê®??Ë¶ÜË? */
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
