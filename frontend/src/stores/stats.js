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
      console.log("Stats store: ?ãÂ??≤Â?Áµ±Ë?Ë≥áÊ?");

      const response = await fetch(
        "/api/dashboard/stats",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      console.log("Stats store: ?∂Âà∞Áµ±Ë?Ë≥áÊ?", data);

      if (data.success) {
        stats.value = data.data;
        console.log("Stats store: Áµ±Ë?Ë≥áÊ??¥Êñ∞?êÂ?", stats.value);
      } else {
        console.error("Stats store: ?≤Â?Áµ±Ë?Ë≥áÊ?Â§±Ê?", data.message);
        throw new Error(data.message || "?≤Â?Áµ±Ë?Ë≥áÊ?Â§±Ê?");
      }
    } catch (error) {
      console.error("Stats store: ?≤Â?Áµ±Ë?Ë≥áÊ?Â§±Ê?:", error);
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
