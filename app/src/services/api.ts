import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type {
  AuthUser,
  GiangVien,
  GiangVienPayload,
  GiangVienStats,
  QueryParams,
} from '../types/giang-vien';

const TOKEN_STORAGE_KEY = 'qlhocphan_jwt_token';
const USER_STORAGE_KEY = 'qlhocphan_admin_user';
const API_URL_STORAGE_KEY = 'qlhocphan_api_url';

export function getDefaultApiUrl(): string {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.location?.hostname) {
      return `http://${window.location.hostname}:3000`;
    }
    return 'http://localhost:3000';
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } })
      .manifest2?.extra?.expoGo?.debuggerHost;

  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:3000`;
    }
  }

  return Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000';
}

let currentApiUrl = getDefaultApiUrl();
let currentToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export const apiClient = axios.create({
  baseURL: currentApiUrl,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = currentApiUrl;
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && onUnauthorizedCallback) {
      onUnauthorizedCallback();
    }
    return Promise.reject(error);
  },
);

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorizedCallback = handler;
}

export function getApiUrl(): string {
  return currentApiUrl;
}

export async function setApiUrl(url: string): Promise<string> {
  const cleaned = url.trim().replace(/\/+$/, '') || getDefaultApiUrl();
  currentApiUrl = cleaned;
  apiClient.defaults.baseURL = cleaned;
  await AsyncStorage.setItem(API_URL_STORAGE_KEY, cleaned);
  return cleaned;
}

export async function loadSavedSession(): Promise<{
  token: string | null;
  user: AuthUser | null;
  apiUrl: string;
}> {
  const [savedUrl, savedToken, savedUser] = await Promise.all([
    AsyncStorage.getItem(API_URL_STORAGE_KEY),
    AsyncStorage.getItem(TOKEN_STORAGE_KEY),
    AsyncStorage.getItem(USER_STORAGE_KEY),
  ]);

  if (savedUrl) {
    currentApiUrl = savedUrl;
    apiClient.defaults.baseURL = savedUrl;
  }

  currentToken = savedToken;

  let parsedUser: AuthUser | null = null;
  if (savedUser) {
    try {
      parsedUser = JSON.parse(savedUser) as AuthUser;
    } catch {
      parsedUser = null;
    }
  }

  return { token: savedToken, user: parsedUser, apiUrl: currentApiUrl };
}

export async function saveSession(token: string, user: AuthUser) {
  currentToken = token;
  await Promise.all([
    AsyncStorage.setItem(TOKEN_STORAGE_KEY, token),
    AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)),
  ]);
}

export async function clearSession() {
  currentToken = null;
  await Promise.all([
    AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
    AsyncStorage.removeItem(USER_STORAGE_KEY),
  ]);
}

export function resolveImageUrl(image: string): string {
  if (!image) return '';
  const trimmed = image.trim();
  if (trimmed.startsWith('/uploads/')) {
    return `${currentApiUrl}${trimmed}`;
  }
  return trimmed;
}

export function extractErrorMessage(err: unknown, fallback = 'Đã xảy ra lỗi'): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) {
      return msg.join(', ');
    }
    if (typeof msg === 'string' && msg.trim()) {
      return msg;
    }
    if (err.code === 'ECONNABORTED' || err.message === 'Network Error') {
      return `Không thể kết nối tới server (${currentApiUrl}). Kiểm tra backend đang chạy và cùng mạng LAN.`;
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export async function loginAdmin(username: string, password: string) {
  const { data } = await apiClient.post<{
    access_token: string;
    user: AuthUser;
  }>('/auth/login', { username, password });
  await saveSession(data.access_token, data.user);
  return data;
}

export async function fetchLecturers(params: QueryParams): Promise<GiangVien[]> {
  const { data } = await apiClient.get<GiangVien[]>('/giang-vien', { params });
  return data;
}

export async function fetchStats(): Promise<GiangVienStats> {
  const { data } = await apiClient.get<GiangVienStats>('/giang-vien/stats');
  return data;
}

export async function createLecturer(
  payload: GiangVienPayload,
): Promise<GiangVien> {
  const { data } = await apiClient.post<GiangVien>('/giang-vien', payload);
  return data;
}

export async function updateLecturer(
  id: string,
  payload: Partial<GiangVienPayload>,
): Promise<GiangVien> {
  const { data } = await apiClient.patch<GiangVien>(
    `/giang-vien/${id}`,
    payload,
  );
  return data;
}

export async function deleteLecturer(id: string): Promise<void> {
  await apiClient.delete(`/giang-vien/${id}`);
}

export async function exportCleanJson(): Promise<GiangVienPayload[]> {
  const { data } = await apiClient.get<GiangVienPayload[]>(
    '/giang-vien/export',
  );
  return data;
}

export async function uploadLecturerImage(asset: {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  file?: File;
}): Promise<string> {
  const formData = new FormData();
  const fileName =
    asset.fileName || `lecturer-${Date.now()}.${Platform.OS === 'web' ? 'png' : 'jpg'}`;
  const mimeType = asset.mimeType || 'image/jpeg';

  if (Platform.OS === 'web') {
    if (asset.file) {
      formData.append('file', asset.file, fileName);
    } else {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      formData.append('file', blob, fileName);
    }
  } else {
    formData.append('file', {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
  }

  const { data } = await apiClient.post<{ url: string }>(
    '/giang-vien/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return data.url;
}

