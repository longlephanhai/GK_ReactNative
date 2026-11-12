import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  extractErrorMessage,
  getApiUrl,
  getDefaultApiUrl,
  loginAdmin,
  setApiUrl,
} from '../services/api';
import type { AuthUser } from '../types/giang-vien';

interface LoginScreenProps {
  initialApiUrl: string;
  onLoginSuccess: (user: AuthUser) => void;
}

export function LoginScreen({
  initialApiUrl,
  onLoginSuccess,
}: LoginScreenProps) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(initialApiUrl || getApiUrl());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      await setApiUrl(serverUrl);
      const data = await loginAdmin(username.trim(), password);
      onLoginSuccess(data.user);
    } catch (err) {
      setError(extractErrorMessage(err, 'Đăng nhập thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <View style={styles.logoCircle}>
              <Ionicons name="school" size={32} color="#2563EB" />
            </View>
            <Text style={styles.title}>QLHocPhan Admin</Text>
            <Text style={styles.subtitle}>
              Hệ thống quản lý Giảng viên (MongoDB + NestJS)
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color="#64748B" />
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="admin"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                onSubmitEditing={handleLogin}
              />
              <Pressable
                onPress={() => setShowPassword((prev) => !prev)}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748B"
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[styles.loginBtn, loading && styles.disabledBtn]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                <Text style={styles.loginBtnText}>Đăng nhập Admin</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.serverToggle}
            onPress={() => setShowServerConfig((prev) => !prev)}
          >
            <Ionicons name="server-outline" size={15} color="#475569" />
            <Text style={styles.serverToggleText}>
              {showServerConfig
                ? 'Ẩn cấu hình API Server'
                : 'Cấu hình địa chỉ API Server'}
            </Text>
          </Pressable>

          {showServerConfig ? (
            <View style={styles.serverBox}>
              <Text style={styles.serverHint}>
                Web dùng http://localhost:3000. Expo Go trên điện thoại dùng IP mạng LAN của máy tính (VD: http://192.168.1.10:3000).
              </Text>
              <TextInput
                style={styles.serverInput}
                value={serverUrl}
                onChangeText={setServerUrl}
                placeholder="http://192.168.1.10:3000"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setServerUrl(getDefaultApiUrl())}
                style={styles.resetUrlBtn}
              >
                <Text style={styles.resetUrlText}>Khôi phục tự động</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 26,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    gap: 16,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 6,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    flex: 1,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 11 : 10,
    backgroundColor: '#F8FAFC',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563EB',
    paddingVertical: 13,
    borderRadius: 12,
    marginTop: 4,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  serverToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  serverToggleText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  serverBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  serverHint: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },
  serverInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#FFFFFF',
    color: '#0F172A',
  },
  resetUrlBtn: {
    alignSelf: 'flex-end',
  },
  resetUrlText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
});

