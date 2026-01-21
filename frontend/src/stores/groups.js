import { defineStore } from "pinia";
import { ref } from "vue";
import { getApiUrl } from "@/config/api";

export const useGroupsStore = defineStore("groups", () => {
  const groups = ref([]);
  const loading = ref(false);

  const fetchGroups = async () => {
    try {
      loading.value = true;
      console.log("Groups store: ?‹å??²å?çµ„åˆ¥?—è¡¨");

      const response = await fetch(getApiUrl("/api/groups"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Groups store: ?¶åˆ°çµ„åˆ¥?¸æ?", data);

      if (data.success) {
        groups.value = data.data;
        console.log("Groups store: çµ„åˆ¥?—è¡¨?´æ–°?å?", groups.value.length);
      } else {
        console.error("Groups store: ?²å?çµ„åˆ¥å¤±æ?", data.message);
        throw new Error(data.message || "?²å?çµ„åˆ¥?—è¡¨å¤±æ?");
      }
    } catch (error) {
      console.error("Groups store: ?²å?çµ„åˆ¥?—è¡¨å¤±æ?:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const addGroup = async (groupData) => {
    try {
      console.log("Groups store: ?‹å?æ·»å?çµ„åˆ¥", groupData);

      const response = await fetch(getApiUrl("/api/groups"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(groupData),
      });

      const data = await response.json();
      console.log("Groups store: æ·»å?çµ„åˆ¥?æ?", data);

      if (data.success) {
        groups.value.push(data.data);
        console.log("Groups store: çµ„åˆ¥æ·»å??å?");
        return data.data;
      } else {
        console.error("Groups store: æ·»å?çµ„åˆ¥å¤±æ?", data.message);
        throw new Error(data.message || "æ·»å?çµ„åˆ¥å¤±æ?");
      }
    } catch (error) {
      console.error("Groups store: æ·»å?çµ„åˆ¥å¤±æ?:", error);
      throw error;
    }
  };

  const updateGroup = async (id, groupData) => {
    try {
      console.log("Groups store: ?‹å??´æ–°çµ„åˆ¥", id, groupData);

      const response = await fetch(getApiUrl(`/api/groups/${id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(groupData),
      });

      const data = await response.json();
      console.log("Groups store: ?´æ–°çµ„åˆ¥?æ?", data);

      if (data.success) {
        const index = groups.value.findIndex((g) => g.id === id);
        if (index !== -1) {
          groups.value[index] = data.data;
        }
        console.log("Groups store: çµ„åˆ¥?´æ–°?å?");
        return data.data;
      } else {
        console.error("Groups store: ?´æ–°çµ„åˆ¥å¤±æ?", data.message);
        throw new Error(data.message || "?´æ–°çµ„åˆ¥å¤±æ?");
      }
    } catch (error) {
      console.error("Groups store: ?´æ–°çµ„åˆ¥å¤±æ?:", error);
      throw error;
    }
  };

  const deleteGroup = async (id) => {
    try {
      console.log("Groups store: ?‹å??ªé™¤çµ„åˆ¥", id);

      const response = await fetch(getApiUrl(`/api/groups/${id}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Groups store: ?ªé™¤çµ„åˆ¥?æ?", data);

      if (data.success) {
        const index = groups.value.findIndex((g) => g.id === id);
        if (index !== -1) {
          groups.value.splice(index, 1);
        }
        console.log("Groups store: çµ„åˆ¥?ªé™¤?å?");
        return true;
      } else {
        console.error("Groups store: ?ªé™¤çµ„åˆ¥å¤±æ?", data.message);
        throw new Error(data.message || "?ªé™¤çµ„åˆ¥å¤±æ?");
      }
    } catch (error) {
      console.error("Groups store: ?ªé™¤çµ„åˆ¥å¤±æ?:", error);
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
