import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface ExportJsonModalProps {
  visible: boolean;
  jsonText: string;
  onClose: () => void;
}

export function ExportJsonModal({
  visible,
  jsonText,
  onClose,
}: ExportJsonModalProps) {
  const handleDownloadOrShare = async () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'QLHocPhan.GiangVien.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }

    await Share.share({
      title: 'QLHocPhan.GiangVien.json',
      message: jsonText,
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Xuất CSDL (QLHocPhan.GiangVien.json)
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <Text style={styles.note}>
            Dữ liệu xuất ra chỉ gồm đúng 4 trường: IDGV, Fullname, Image, SumClass theo yêu cầu đề thi.
          </Text>

          <ScrollView style={styles.codeBox}>
            <Text selectable style={styles.codeText}>
              {jsonText}
            </Text>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable style={[styles.btn, styles.closeBtn]} onPress={onClose}>
              <Text style={styles.closeText}>Đóng</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.primaryBtn]}
              onPress={handleDownloadOrShare}
            >
              <Ionicons
                name={Platform.OS === 'web' ? 'download-outline' : 'share-outline'}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.primaryText}>
                {Platform.OS === 'web' ? 'Tải file JSON' : 'Chia sẻ / Lưu JSON'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  note: {
    fontSize: 13,
    color: '#475569',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  codeBox: {
    margin: 20,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    maxHeight: 320,
  },
  codeText: {
    color: '#E2E8F0',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
  },
  closeText: {
    color: '#334155',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#059669',
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

