
import { create } from 'zustand';

const getStoredUser = () => {
  const storedUser = localStorage.getItem('user');

  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error('Unable to restore the saved user profile:', error);
    localStorage.removeItem('user');
    return null;
  }
};

const useAuthStore = create((set) => ({
  token: localStorage.getItem('token'),
  user: getStoredUser(),

  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },
}));

export { useAuthStore };
