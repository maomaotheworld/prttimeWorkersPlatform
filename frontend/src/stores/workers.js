import { defineStore } from "pinia";
import { ref } from "vue";
import { getApiUrl } from "@/config/api";

export const useWorkersStore = defineStore("workers", () => {
  const workers = ref([]);
  const loading = ref(false);

  const fetchWorkers = async () => {
    try {
      loading.value = true;
      console.log("Workers store: 獲取工讀生列表");

      // 獲取認證token
      const token = localStorage.getItem("auth_token");
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl("/api/workers"), {
        method: "GET",
        headers: headers,
      });

      const data = await response.json();
      console.log("Workers store: 收到工讀生數據", data);

      if (data.success) {
        workers.value = data.data;
        console.log("Workers store: 工讀生列表更新完成", workers.value.length);
      } else {
        console.error("Workers store: 獲取工讀生失敗", data.message);
        throw new Error(data.message || "獲取工讀生列表失敗");
      }
    } catch (error) {
      console.error("Workers store: 獲取工讀生列表失敗", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 獲取group名稱到ID的映射
  const getGroupMapping = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(getApiUrl("/api/groups"), {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('獲取組別列表失敗');
      }
      
      const result = await response.json();
      const mapping = {};
      
      if (result.success && result.data) {
        result.data.forEach(group => {
          mapping[group.name] = group.id;
        });
      }
      
      return mapping;
    } catch (error) {
      console.error('獲取組別映射失敗:', error);
      return {};
    }
  };

  const addWorker = async (workerData) => {
    try {
      console.log("Workers store: 新增工讀生", workerData);

      // 獲取group映射
      const groupMapping = await getGroupMapping();
      console.log("Workers store: Group映射", groupMapping);

      // 根據後端API格式準備數據
      const requestData = {
        number: String(workerData.workerNumber || "").trim(),
        name: String(workerData.name || "").trim(),
        baseHourlyWage: Number(workerData.hourlyWage) || 0,
        baseWorkingHours: Number(workerData.baseHours) || 8,
        groupId: groupMapping[workerData.group] || 'group-1', // 如果找不到對應組別，使用預設值
        floor: String(workerData.floor || "").trim(),
        // 設置預設值
        gender: '男',
        level: '工讀生',
        phone: '',
        email: '',
        address: '',
        emergencyContact: '',
        bankAccount: '',
        startDate: new Date().toISOString().split('T')[0],
        status: 'active'
      };

      console.log("Workers store: 發送的數據", requestData);

      // 獲取認證token
      const token = localStorage.getItem("auth_token");
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl("/api/workers"), {
        method: "POST",
        headers: headers,
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log("Workers store: 新增工讀生回應", data);

      if (data.success) {
        workers.value.push(data.data);
        console.log("Workers store: 工讀生新增完成");
        return data.data;
      } else {
        console.error("Workers store: 新增工讀生失敗", data.message);
        throw new Error(data.message || "新增工讀生失敗");
      }
    } catch (error) {
      console.error("Workers store: 新增工讀生失敗", error);
      throw error;
    }
  };

  const updateWorker = async (id, workerData) => {
    try {
      console.log("Workers store: 更新工讀生", id, workerData);

      // 獲取認證token
      const token = localStorage.getItem("auth_token");
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(`/api/workers/${id}`), {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(workerData),
      });

      const data = await response.json();
      console.log("Workers store: 更新工讀生回應", data);

      if (data.success) {
        const index = workers.value.findIndex((w) => w.id === id);
        if (index !== -1) {
          workers.value[index] = data.data;
        }
        console.log("Workers store: 工讀生更新完成");
        return data.data;
      } else {
        console.error("Workers store: 更新工讀生失敗", data.message);
        throw new Error(data.message || "更新工讀生失敗");
      }
    } catch (error) {
      console.error("Workers store: 更新工讀生失敗", error);
      throw error;
    }
  };

  const deleteWorker = async (id) => {
    try {
      console.log("Workers store: 刪除工讀生", id);

      // 獲取認證token
      const token = localStorage.getItem("auth_token");
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(getApiUrl(`/api/workers/${id}`), {
        method: "DELETE",
        headers: headers,
      });

      const data = await response.json();
      console.log("Workers store: 刪除工讀生回應", data);

      if (data.success) {
        const index = workers.value.findIndex((w) => w.id === id);
        if (index !== -1) {
          workers.value.splice(index, 1);
        }
        console.log("Workers store: 工讀生刪除完成");
        return true;
      } else {
        console.error("Workers store: 刪除工讀生失敗", data.message);
        throw new Error(data.message || "刪除工讀生失敗");
      }
    } catch (error) {
      console.error("Workers store: 刪除工讀生失敗", error);
      throw error;
    }
  };

  const batchUpdateWage = async (workerIds, wageData) => {
    try {
      console.log("Workers store: 批次更新薪資", workerIds, wageData);

      // 獲取認證token
      const token = localStorage.getItem("auth_token");
      
      const headers = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        getApiUrl("/api/workers/batch-update-wage"),
        {
          method: "PUT",
          headers: headers,
          body: JSON.stringify({
            workerIds,
            ...wageData,
          }),
        },
      );

      const data = await response.json();
      console.log("Workers store: 批次更新薪資回應", data);

      if (data.success) {
        // 更新本地數據
        data.data.updated.forEach((updatedWorker) => {
          const index = workers.value.findIndex(
            (w) => w.id === updatedWorker.id,
          );
          if (index !== -1) {
            workers.value[index] = updatedWorker;
          }
        });
        console.log("Workers store: 批次更新薪資完成");
        return data.data;
      } else {
        console.error("Workers store: 批次更新薪資失敗", data.message);
        throw new Error(data.message || "批次更新薪資失敗");
      }
    } catch (error) {
      console.error("Workers store: 批次更新薪資失敗:", error);
      throw error;
    }
  };

  const addTimeRecord = async (timeRecord) => {
    try {
      console.log("Workers store: 新增額外工時記錄", timeRecord);

      // 從localStorage 獲取 token（用於身份驗證）
      const token = localStorage.getItem("auth_token") || "";

      const response = await fetch(
        getApiUrl("/api/time-records/additional-hours"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            workerId: timeRecord.workerId,
            date: timeRecord.date,
            hours: Math.abs(timeRecord.hours),
            reason: timeRecord.description,
            adjustmentType: timeRecord.adjustmentType || "add", // 預設調整類型：add 或 subtract
          }),
        },
      );

      const data = await response.json();
      console.log("Workers store: 新增工時記錄回應", data);

      if (data.success) {
        console.log("Workers store: 工時記錄新增完成");
        return data.data;
      } else {
        console.error("Workers store: 新增工時記錄失敗", data.message);
        throw new Error(data.message || "新增工時記錄失敗");
      }
    } catch (error) {
      console.error("Workers store: 新增工時記錄失敗:", error);
      throw error;
    }
  };

  const importWorkers = async (workersList) => {
    try {
      console.log("Workers store: 批量匯入工讀生", workersList);

      for (const worker of workersList) {
        await addWorker(worker);
      }

      console.log("Workers store: 批量匯入完成");
      return true;
    } catch (error) {
      console.error("Workers store: 批量匯入失敗:", error);
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
    importWorkers,
  };
});
