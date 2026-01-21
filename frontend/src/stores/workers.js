import { defineStore } from "pinia";
import { ref } from "vue";

export const useWorkersStore = defineStore("workers", () => {
  const workers = ref([]);
  const loading = ref(false);

  const fetchWorkers = async () => {
    try {
      loading.value = true;
      console.log("Workers store: ?‹å??²å?å·¥è??Ÿå?è¡?);

      const response = await fetch("/api/workers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Workers store: ?¶åˆ°å·¥è??Ÿæ•¸??, data);

      if (data.success) {
        workers.value = data.data;
        console.log("Workers store: å·¥è??Ÿå?è¡¨æ›´?°æ???, workers.value.length);
      } else {
        console.error("Workers store: ?²å?å·¥è??Ÿå¤±??, data.message);
        throw new Error(data.message || "?²å?å·¥è??Ÿå?è¡¨å¤±??);
      }
    } catch (error) {
      console.error("Workers store: ?²å?å·¥è??Ÿå?è¡¨å¤±??", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const addWorker = async (workerData) => {
    try {
      console.log("Workers store: ?‹å??°å?å·¥è???, workerData);

      const response = await fetch("/api/workers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workerData),
      });

      const data = await response.json();
      console.log("Workers store: ?°å?å·¥è??Ÿå???, data);

      if (data.success) {
        workers.value.push(data.data);
        console.log("Workers store: å·¥è??Ÿæ–°å¢æ???);
        return data.data;
      } else {
        console.error("Workers store: ?°å?å·¥è??Ÿå¤±??, data.message);
        throw new Error(data.message || "?°å?å·¥è??Ÿå¤±??);
      }
    } catch (error) {
      console.error("Workers store: ?°å?å·¥è??Ÿå¤±??", error);
      throw error;
    }
  };

  const updateWorker = async (id, workerData) => {
    try {
      console.log("Workers store: ?‹å??´æ–°å·¥è???, id, workerData);

      const response = await fetch(`/api/workers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workerData),
      });

      const data = await response.json();
      console.log("Workers store: ?´æ–°å·¥è??Ÿå???, data);

      if (data.success) {
        const index = workers.value.findIndex((w) => w.id === id);
        if (index !== -1) {
          workers.value[index] = data.data;
        }
        console.log("Workers store: å·¥è??Ÿæ›´?°æ???);
        return data.data;
      } else {
        console.error("Workers store: ?´æ–°å·¥è??Ÿå¤±??, data.message);
        throw new Error(data.message || "?´æ–°å·¥è??Ÿå¤±??);
      }
    } catch (error) {
      console.error("Workers store: ?´æ–°å·¥è??Ÿå¤±??", error);
      throw error;
    }
  };

  const deleteWorker = async (id) => {
    try {
      console.log("Workers store: ?‹å??ªé™¤å·¥è???, id);

      const response = await fetch(`/api/workers/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Workers store: ?ªé™¤å·¥è??Ÿå???, data);

      if (data.success) {
        const index = workers.value.findIndex((w) => w.id === id);
        if (index !== -1) {
          workers.value.splice(index, 1);
        }
        console.log("Workers store: å·¥è??Ÿåˆª?¤æ???);
        return true;
      } else {
        console.error("Workers store: ?ªé™¤å·¥è??Ÿå¤±??, data.message);
        throw new Error(data.message || "?ªé™¤å·¥è??Ÿå¤±??);
      }
    } catch (error) {
      console.error("Workers store: ?ªé™¤å·¥è??Ÿå¤±??", error);
      throw error;
    }
  };

  const batchUpdateWage = async (workerIds, wageData) => {
    try {
      console.log("Workers store: ?‹å??¹æ¬¡?´æ–°?ªè?", workerIds, wageData);

      const response = await fetch("/api/workers/batch-update-wage", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workerIds,
          ...wageData,
        }),
      });

      const data = await response.json();
      console.log("Workers store: ?¹æ¬¡?´æ–°?ªè??æ?", data);

      if (data.success) {
        // ?´æ–°?¬åœ°?¸æ?
        data.data.updated.forEach((updatedWorker) => {
          const index = workers.value.findIndex((w) => w.id === updatedWorker.id);
          if (index !== -1) {
            workers.value[index] = updatedWorker;
          }
        });
        console.log("Workers store: ?¹æ¬¡?´æ–°?ªè??å?");
        return data.data;
      } else {
        console.error("Workers store: ?¹æ¬¡?´æ–°?ªè?å¤±æ?", data.message);
        throw new Error(data.message || "?¹æ¬¡?´æ–°?ªè?å¤±æ?");
      }
    } catch (error) {
      console.error("Workers store: ?¹æ¬¡?´æ–°?ªè?å¤±æ?:", error);
      throw error;
    }
  };

  const addTimeRecord = async (timeRecord) => {
    try {
      console.log("Workers store: ?‹å??°å??‚æ•¸è¨˜é?", timeRecord);

      // å¾?localStorage ?²å? tokenï¼ˆç”¨?¼è??¥æ?ä½œè€…ï?
      const token = localStorage.getItem("auth_token") || "";

      const response = await fetch("/api/time-records/additional-hours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          workerId: timeRecord.workerId,
          date: timeRecord.date,
          hours: Math.abs(timeRecord.hours),
          reason: timeRecord.description,
          adjustmentType: timeRecord.adjustmentType || "add", // ?³é?èª¿æ•´é¡å?ï¼šadd ??subtract
        }),
      });

      const data = await response.json();
      console.log("Workers store: ?°å??‚æ•¸è¨˜é??æ?", data);

      if (data.success) {
        console.log("Workers store: ?‚æ•¸è¨˜é??°å??å?");
        return data.data;
      } else {
        console.error("Workers store: ?°å??‚æ•¸è¨˜é?å¤±æ?", data.message);
        throw new Error(data.message || "?°å??‚æ•¸è¨˜é?å¤±æ?");
      }
    } catch (error) {
      console.error("Workers store: ?°å??‚æ•¸è¨˜é?å¤±æ?:", error);
      throw error;
    }
  };

  return {
    workers,
    loading,
    fetchWorkers,
    addWorker,
    updateWorker,
    deleteWorker,
    batchUpdateWage,
    addTimeRecord,
  };
});
