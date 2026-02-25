import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { User } from '@/types/report';
import { DEFAULT_USERS } from '@/constants/users';

const AUTH_STORAGE_KEY = 'field_reports_auth';
const PASSWORDS_STORAGE_KEY = 'field_reports_passwords';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as User;
          console.log('[Auth] Restored user session:', parsed.username);
          setUser(parsed);
        }
      } catch (error) {
        console.error('[Auth] Failed to load user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const getCustomPasswords = useCallback(async (): Promise<Record<string, string>> => {
    try {
      const stored = await AsyncStorage.getItem(PASSWORDS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; message: string }> => {
    console.log('[Auth] Attempting login for:', username);
    const customPasswords = await getCustomPasswords();
    const defaultUser = DEFAULT_USERS.find((u) => u.username === username);
    if (!defaultUser) {
      console.log('[Auth] Login failed - user not found');
      return { success: false, message: 'שם משתמש או סיסמה שגויים' };
    }
    const expectedPassword = customPasswords[username] ?? defaultUser.password;
    const found = expectedPassword === password ? defaultUser : undefined;

    if (!found) {
      console.log('[Auth] Login failed - invalid credentials');
      return { success: false, message: 'שם משתמש או סיסמה שגויים' };
    }

    const userData: User = {
      username: found.username,
      name: found.name,
      role: found.role,
    };

    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
      setUser(userData);
      console.log('[Auth] Login successful:', userData.username);
      return { success: true, message: 'התחברת בהצלחה' };
    } catch (error) {
      console.error('[Auth] Failed to save user:', error);
      return { success: false, message: 'שגיאה בשמירת הנתונים' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
      console.log('[Auth] User logged out');
    } catch (error) {
      console.error('[Auth] Failed to logout:', error);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'לא מחובר' };
    }
    const customPasswords = await getCustomPasswords();
    const defaultUser = DEFAULT_USERS.find((u) => u.username === user.username);
    if (!defaultUser) {
      return { success: false, message: 'משתמש לא נמצא' };
    }
    const currentExpected = customPasswords[user.username] ?? defaultUser.password;
    if (currentPassword !== currentExpected) {
      return { success: false, message: 'סיסמה נוכחית שגויה' };
    }
    if (newPassword.length < 4) {
      return { success: false, message: 'סיסמה חדשה חייבת להכיל לפחות 4 תווים' };
    }
    try {
      customPasswords[user.username] = newPassword;
      await AsyncStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(customPasswords));
      console.log('[Auth] Password changed for:', user.username);
      return { success: true, message: 'הסיסמה שונתה בהצלחה' };
    } catch (error) {
      console.error('[Auth] Failed to change password:', error);
      return { success: false, message: 'שגיאה בשמירת הסיסמה' };
    }
  }, [user, getCustomPasswords]);

  const isAdmin = user?.role === 'admin';

  return { user, isLoading, login, logout, isAdmin, changePassword };
});
