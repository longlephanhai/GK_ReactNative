import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createLecturer,
  extractErrorMessage,
  resolveImageUrl,
  updateLecturer,
  uploadLecturerImage,
} from '../services/api';
import type { GiangVien } from '../types/giang-vien';

interface GiangVienFormModalProps {
  visible: boolean;
  editingLecturer: GiangVien | null;
  onClose: () => void;
  onSaved: () => void;
}

export function GiangVienFormModal({
  visible,
  editingLecturer,
  onClose,
  onSaved,
}: GiangVienFormModalProps) {
  const [idgv, setIdgv] = useState('');
  const [fullname, setFullname] = useState('');
  const [sumClass, setSumClass] = useState('');
  const [image, setImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      if (editingLecturer) {
        setIdgv(editingLecturer.IDGV);
        setFullname(editingLecturer.Fullname);
        setSumClass(String(editingLecturer.SumClass));
        setImage(editingLecturer.Image);
      } else {
        setIdgv('');
        setFullname('');
        setSumClass('0');
        setImage('');
      }
      setError('');
    }
  }, [visible, editingLecturer]);

  const handlePickFromLibrary = async () => {
    try {
      setError('');
      if (Platform.OS !== 'web') {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setError('Vui lòng cấp quyền truy cập thư viện ảnh để chọn hình.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      setUploadingImage(true);
      const uploadedUrl = await uploadLecturerImage({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
        file: (asset as unknown as { file?: File }).file,
      });
      setImage(uploadedUrl);
    } catch (err) {
      setError(extractErrorMessage(err, 'Tải ảnh lên thất bại'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setError('');
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setError('Vui lòng cấp quyền Camera để chụp ảnh giảng viên.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      setUploadingImage(true);
      const uploadedUrl = await uploadLecturerImage({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
      setImage(uploadedUrl);
    } catch (err) {
      setError(extractErrorMessage(err, 'Chụp và tải ảnh thất bại'));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    setError('');

    const trimmedId = idgv.trim();
    const trimmedName = fullname.trim();
    const trimmedImage = image.trim();
    const parsedSumClass = Number(sumClass);

    if (!trimmedId) {
      setError('Vui lòng nhập Mã giảng viên (IDGV).');
      return;
    }
    if (!trimmedName) {
      setError('Vui lòng nhập Họ và tên (Fullname).');
      return;
    }
    if (!trimmedImage) {
      setError('Vui lòng chọn ảnh hoặc nhập đường dẫn hình ảnh (Image).');
      return;
    }
    if (!Number.isInteger(parsedSumClass) || parsedSumClass < 0) {
      setError('Tổng số lớp (SumClass) phải là số nguyên >= 0.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        IDGV: trimmedId,
        Fullname: trimmedName,
        Image: trimmedImage,
        SumClass: parsedSumClass,
      };

      if (editingLecturer) {
        await updateLecturer(editingLecturer._id, payload);
      } else {
        await createLecturer(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err, 'Lưu thông tin giảng viên thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

  const previewUri = resolveImageUrl(image);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {editingLecturer ? 'Cập nhật Giảng viên' : 'Thêm Giảng viên mới'}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} disabled={submitting}>
              <Ionicons name="close" size={24} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.formBody}>
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={18} color="#B91C1C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mã giảng viên (IDGV) *</Text>
              <TextInput
                style={styles.input}
                value={idgv}
                onChangeText={setIdgv}
                placeholder="VD: GV001"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Họ và tên (Fullname) *</Text>
              <TextInput
                style={styles.input}
                value={fullname}
                onChangeText={setFullname}
                placeholder="VD: Nguyễn Văn An"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tổng số lớp (SumClass) *</Text>
              <TextInput
                style={styles.input}
                value={sumClass}
                onChangeText={setSumClass}
                placeholder="VD: 4"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Hình ảnh (Image) *</Text>

              <View style={styles.imagePreviewRow}>
                {previewUri ? (
                  <Image
                    source={{ uri: previewUri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.previewImage, styles.previewPlaceholder]}>
                    <Ionicons name="image-outline" size={28} color="#94A3B8" />
                  </View>
                )}

                <View style={styles.uploadButtonsCol}>
                  <Pressable
                    style={styles.uploadBtn}
                    onPress={handlePickFromLibrary}
                    disabled={uploadingImage || submitting}
                  >
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <Ionicons name="images-outline" size={16} color="#2563EB" />
                    )}
                    <Text style={styles.uploadBtnText}>
                      {uploadingImage ? 'Đang tải ảnh...' : 'Chọn ảnh từ máy'}
                    </Text>
                  </Pressable>

                  {Platform.OS !== 'web' ? (
                    <Pressable
                      style={styles.uploadBtn}
                      onPress={handleTakePhoto}
                      disabled={uploadingImage || submitting}
                    >
                      <Ionicons name="camera-outline" size={16} color="#2563EB" />
                      <Text style={styles.uploadBtnText}>Chụp ảnh (Camera)</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                value={image}
                onChangeText={setImage}
                placeholder="Hoặc dán URL ảnh (https://... hoặc /uploads/...)"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Hủy</Text>
            </Pressable>
            <Pressable
              style={[
                styles.btn,
                styles.submitBtn,
                (submitting || uploadingImage) && styles.disabledBtn,
              ]}
              onPress={handleSubmit}
              disabled={submitting || uploadingImage}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitText}>
                  {editingLecturer ? 'Lưu thay đổi' : 'Thêm giảng viên'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    maxWidth: 520,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  formBody: {
    padding: 20,
    gap: 14,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    flex: 1,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  imagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  previewImage: {
    width: 78,
    height: 78,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  previewPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButtonsCol: {
    flex: 1,
    gap: 8,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  uploadBtnText: {
    color: '#1D4ED8',
    fontWeight: '600',
    fontSize: 13,
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
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    color: '#334155',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
  },
  disabledBtn: {
    opacity: 0.65,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

