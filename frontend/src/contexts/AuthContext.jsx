import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 检查token有效性
  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          if (response.ok) {
            const result = await response.json();
            // 后端返回的是 result.data 直接是用户对象
            const userData = result.data;
            setUser(userData);
            setToken(savedToken);
          } else {
            // Token 无效，清除
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // 登录
  const login = async (username, password) => {
    console.log('[Auth] 开始登录:', username);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const result = await response.json();
      console.log('[Auth] 登录响应:', result);
      
      if (!response.ok || !result.success) {
        throw new Error(result.message || '登录失败');
      }
      
      // 后端返回的是 result.data.token 和 result.data.user
      const { token, user } = result.data;
      
      if (!token || !user) {
        throw new Error('登录响应数据不完整');
      }
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      console.log('[Auth] 登录成功:', user.username);
      return { success: true };
    } catch (error) {
      console.error('[Auth] 登录失败:', error);
      return { success: false, message: error.message };
    }
  };

  // 登出
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // 检查是否是父母角色
  const isParent = user?.role === 'parent' || user?.role === 'admin';

  // 游客模式（孩子看板）
  const isGuest = !user;

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isParent,
    isGuest,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;