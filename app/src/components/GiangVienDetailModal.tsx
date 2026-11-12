import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { resolveImageUrl } from '../services/api';
import type { GiangVien } from '../types/giang-vien';

interface GiangVienDetailModalProps {
  visible: boolean;
  lecturer: GiangVien | null;
  onClose: () => void;
  onEdit: (lecturer: GiangVien) => void;
}

export function GiangVienDetailModal({
  visible,
  lecturer,
  onClose,
  onEdit,
}: GiangVienDetailModalProps) {
  if (!lecturer) return null;

  const imageUri = resolveImageUrl(lecturer.Image);

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
            <Text style={styles.headerTitle}>Thông tin giảng viên</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.imageWrapper}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.placeholder]}>
                  <Ionicons name="person" size={54} color="#94A3B8" />
                </View>
              )}
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>{lecturer.IDGV}</Text>
            </View>

            <Text style={styles.name}>{lecturer.Fullname}</Text>

            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Mã giảng viên (IDGV)</Text>
                <Text style={styles.infoValue}>{lecturer.IDGV}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Họ và tên (Fullname)</Text>
                <Text style={styles.infoValue}>{lecturer.Fullname}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Tổng số lớp (SumClass)</Text>
                <Text style={[styles.infoValue, styles.highlightValue]}>
                  {lecturer.SumClass} lớp
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Hình ảnh (Image)</Text>
                <Text style={styles.urlText} numberOfLines={2}>
                  {lecturer.Image}
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.btn, styles.secondaryBtn]}
              onPress={onClose}
            >
              <Text style={styles.secondaryBtnText}>Đóng</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.primaryBtn]}
              onPress={() => {
                onClose();
                onEdit(lecturer);
              }}
            >
              <Ionicons name="create-outline" size={16} color="#FFFFFF" />
              <Text style={styles.primaryBtnText}>Chỉnh sửa</Text>
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
    maxWidth: 460,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  body: {
    padding: 20,
    alignItems: 'center',
  },
  imageWrapper: {
    marginBottom: 14,
  },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    borderColor: '#DBEAFE',
    backgroundColor: '#F1F5F9',
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  badgeText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 13,
  },
  name: {
    fontSize: 21,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 18,
    textAlign: 'center',
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  infoColumn: {
    paddingVertical: 10,
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  highlightValue: {
    color: '#059669',
    fontWeight: '700',
  },
  urlText: {
    fontSize: 12,
    color: '#475569',
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
  secondaryBtn: {
    backgroundColor: '#F1F5F9',
  },
  secondaryBtnText: {
    color: '#334155',
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

