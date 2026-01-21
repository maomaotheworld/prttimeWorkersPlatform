import { defineStore } from "pinia";
import { ref } from "vue";

export const useGroupsStore = defineStore("groups", () => {
  const groups = ref([]);
  const loading = ref(false);

  const fetchGroups = async () => {
    try {
      loading.value = true;
      console.log("Groups store: 開始獲取組別列表");

      const response = await fetch("http://localhost:3005/api/groups", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Groups store: 收到組別數據", data);

      if (data.success) {
        groups.value = data.data;
        console.log("Groups store: 組別列表更新成功", groups.value.length);
      } else {
        console.error("Groups store: 獲取組別失敗", data.message);
        throw new Error(data.message || "獲取組別列表失敗");
      }
    } catch (error) {
      console.error("Groups store: 獲取組別列表失敗:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const addGroup = async (groupData) => {
    try {
      console.log("Groups store: 開始添加組別", groupData);

      const response = await fetch("http://localhost:3005/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(groupData),
      });

      const data = await response.json();
      console.log("Groups store: 添加組別回應", data);

      if (data.success) {
        groups.value.push(data.data);
        console.log("Groups store: 組別添加成功");
        return data.data;
      } else {
        console.error("Groups store: 添加組別失敗", data.message);
        throw new Error(data.message || "添加組別失敗");
      }
    } catch (error) {
      console.error("Groups store: 添加組別失敗:", error);
      throw error;
    }
  };

  const updateGroup = async (id, groupData) => {
    try {
      console.log("Groups store: 開始更新組別", id, groupData);

      const response = await fetch(`http://localhost:3005/api/groups/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(groupData),
      });

      const data = await response.json();
      console.log("Groups store: 更新組別回應", data);

      if (data.success) {
        const index = groups.value.findIndex((g) => g.id === id);
        if (index !== -1) {
          groups.value[index] = data.data;
        }
        console.log("Groups store: 組別更新成功");
        return data.data;
      } else {
        console.error("Groups store: 更新組別失敗", data.message);
        throw new Error(data.message || "更新組別失敗");
      }
    } catch (error) {
      console.error("Groups store: 更新組別失敗:", error);
      throw error;
    }
  };

  const deleteGroup = async (id) => {
    try {
      console.log("Groups store: 開始刪除組別", id);

      const response = await fetch(`http://localhost:3005/api/groups/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Groups store: 刪除組別回應", data);

      if (data.success) {
        const index = groups.value.findIndex((g) => g.id === id);
        if (index !== -1) {
          groups.value.splice(index, 1);
        }
        console.log("Groups store: 組別刪除成功");
        return true;
      } else {
        console.error("Groups store: 刪除組別失敗", data.message);
        throw new Error(data.message || "刪除組別失敗");
      }
    } catch (error) {
      console.error("Groups store: 刪除組別失敗:", error);
      throw error;
    }
  };

  return {
    groups,
    loading,
    fetchGroups,
    addGroup,
    updateGroup,
    deleteGroup,
  };
});
