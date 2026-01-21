import { defineStore } from "pinia";
import { ref } from "vue";

export const useStatsStore = defineStore("stats", () => {
  const stats = ref({
    totalWorkers: 0,
    totalGroups: 0,
    todayClockedIn: 0,
    monthlyHours: 0,
  });

  const loading = ref(false);

  const fetchStats = async () => {
    try {
      loading.value = true;
      console.log("Stats store: 開始獲取統計資料");

      const response = await fetch(
        "http://localhost:3005/api/dashboard/stats",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      console.log("Stats store: 收到統計資料", data);

      if (data.success) {
        stats.value = data.data;
        console.log("Stats store: 統計資料更新成功", stats.value);
      } else {
        console.error("Stats store: 獲取統計資料失敗", data.message);
        throw new Error(data.message || "獲取統計資料失敗");
      }
    } catch (error) {
      console.error("Stats store: 獲取統計資料失敗:", error);
    } finally {
      loading.value = false;
    }
  };

  return {
    stats,
    loading,
    fetchStats,
  };
});
