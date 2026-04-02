const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * 同步相关 API
 */
export const syncApi = {
  /**
   * 获取同步状态
   */
  getStatus: async () => {
    const response = await fetch(`${API_BASE_URL}/sync/status`);
    if (!response.ok) throw new Error('获取同步状态失败');
    return response.json();
  },

  /**
   * 执行完整同步
   */
  syncAll: async () => {
    const response = await fetch(`${API_BASE_URL}/sync/all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('同步失败');
    return response.json();
  },

  /**
   * 同步规划表
   */
  syncPlans: async () => {
    const response = await fetch(`${API_BASE_URL}/sync/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('同步规划表失败');
    return response.json();
  },

  /**
   * 同步待办事项
   */
  syncTodos: async () => {
    const response = await fetch(`${API_BASE_URL}/sync/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('同步待办事项失败');
    return response.json();
  },

  /**
   * 同步育儿经验
   */
  syncNotes: async () => {
    const response = await fetch(`${API_BASE_URL}/sync/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('同步育儿经验失败');
    return response.json();
  }
};
