import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GiangVienListScreen } from './src/screens/GiangVienListScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import {
  clearSession,
  getDefaultApiUrl,
  loadSavedSession,
  setUnauthorizedHandler,
} from './src/services/api';
import type { AuthUser } from './src/types/giang-vien';

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [apiUrl, setApiUrlState] = useState(getDefaultApiUrl());

  useEffect(() => {
    setUnauthorizedHandler(() => {
      void clearSession().then(() => setUser(null));
    });

    void loadSavedSession().then((session) => {
      setApiUrlState(session.apiUrl);
      if (session.token && session.user) {
        setUser(session.user);
      }
      setInitializing(false);
    });

    return () => setUnauthorizedHandler(null);
  }, []);

  if (initializing) {
    return (
      <SafeAreaProvider>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar style="dark" />
        {user ? (
          <GiangVienListScreen
            user={user}
            onLogout={() => setUser(null)}
          />
        ) : (
          <LoginScreen
            initialApiUrl={apiUrl}
            onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
});
