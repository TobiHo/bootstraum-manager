import { useCallback } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { authAPI } from '../api/endpoints';
import { UserCreate, UserResponse } from '../types/api';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, setUser, setTokens, logout, getAccessToken } =
    useAuthContext();

  const register = useCallback(
    async (data: UserCreate) => {
      try {
        const response = await authAPI.register(data);
        const { access_token, refresh_token, user: userData } = response;
        setTokens({ access_token, refresh_token, token_type: 'Bearer' });
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      } catch (error) {
        console.error('Register error:', error);
        throw error;
      }
    },
    [setTokens, setUser]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await authAPI.login(email, password);
        const { access_token, refresh_token, user: userData } = response;
        setTokens({ access_token, refresh_token, token_type: 'Bearer' });
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    [setTokens, setUser]
  );

  const handleLogout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
    }
  }, [logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    register,
    login,
    logout: handleLogout,
    getAccessToken,
  };
};
