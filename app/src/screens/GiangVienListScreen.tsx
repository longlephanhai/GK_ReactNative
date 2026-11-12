import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { ConfirmModal } from '../components/ConfirmModal';
import { ExportJsonModal } from '../components/ExportJsonModal';
import { GiangVienDetailModal } from '../components/GiangVienDetailModal';
import { GiangVienFormModal } from '../components/GiangVienFormModal';
import {
  clearSession,
  deleteLecturer,
  exportCleanJson,
  extractErrorMessage,
  fetchLecturers,
  fetchStats,
  resolveImageUrl,
} from '../services/api';
import type {
  AuthUser,
  GiangVien,
  GiangVienStats,
  SortField,
  SortOrder,
} from '../types/giang-vien';

interface GiangVienListScreenProps {
  user: AuthUser;
  onLogout: () => void;
}

type ClassFilter = 'all' | 'high' | 'low';

export function GiangVienListScreen({
  user,
  onLogout,
}: GiangVienListScreenProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [lecturers, setLecturers] = useState<GiangVien[]>([]);
  const [stats, setStats] = useState<GiangVienStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('IDGV');
  const [order, setOrder] = useState<SortOrder>('asc');
  const [classFilter, setClassFilter] = useState<ClassFilter>('all');

  const [formVisible, setFormVisible] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState<GiangVien | null>(null);
  const [detailLecturer, setDetailLecturer] = useState<GiangVien | null>(null);
  const [deletingLecturer, setDeletingLecturer] = useState<GiangVien | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportedJson, setExportedJson] = useState('');

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        setError('');

        const minSumClass = classFilter === 'high' ? 5 : undefined;
        const maxSumClass = classFilter === 'low' ? 4 : undefined;

        const [listData, statsData] = await Promise.all([
          fetchLecturers({
            search: search.trim() || undefined,
            sortBy,
            order,
            minSumClass,
            maxSumClass,
          }),
          fetchStats(),
        ]);

        setLecturers(listData);
        setStats(statsData);
      } catch (err) {
        setError(extractErrorMessage(err, 'Không tải được dữ liệu giảng viên'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search, sortBy, order, classFilter],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleExport = async () => {
    try {
      setError('');
      const data = await exportCleanJson();
      setExportedJson(JSON.stringify(data, null, 2));
      setExportModalVisible(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Không thể xuất file JSON'));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLecturer) return;
    try {
      setDeletingLoading(true);
      await deleteLecturer(deletingLecturer._id);
      setNotice(`Đã xóa giảng viên ${deletingLecturer.IDGV} - ${deletingLecturer.Fullname}`);
      setDeletingLecturer(null);
      await loadData(true);
    } catch (err) {
      setError(extractErrorMessage(err, 'Xóa giảng viên thất bại'));
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    onLogout();
  };

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setOrder('asc');
    }
  };

  return (
    <View style={styles.page}>
      {/* Header */}
      <View style={styles.topBar}>
        <View style={styles.brandWrap}>
          <View style={styles.brandIcon}>
            <Ionicons name="school" size={20} color="#2563EB" />
          </View>
          <View>
            <Text style={styles.brandTitle}>QLHocPhan • GiangVien</Text>
            <Text style={styles.brandSub}>
              Admin: {user.username} ({Platform.OS === 'web' ? 'Web' : 'Mobile'})
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.headerBtn} onPress={handleExport}>
            <Ionicons name="code-download-outline" size={16} color="#059669" />
            {isWide ? (
              <Text style={[styles.headerBtnText, { color: '#059669' }]}>
                Xuất JSON
              </Text>
            ) : null}
          </Pressable>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color="#DC2626" />
            {isWide ? <Text style={styles.logoutText}>Đăng xuất</Text> : null}
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadData(true)}
          />
        }
      >
        <View style={styles.container}>
          {/* Stats Cards */}
          <View style={[styles.statsGrid, !isWide && styles.statsGridMobile]}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tổng giảng viên</Text>
              <Text style={styles.statValue}>
                {stats?.totalLecturers ?? 0}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tổng số lớp (SumClass)</Text>
              <Text style={[styles.statValue, { color: '#2563EB' }]}>
                {stats?.totalClasses ?? 0}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Trung bình lớp/GV</Text>
              <Text style={[styles.statValue, { color: '#059669' }]}>
                {stats?.avgClasses ?? 0}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Nhiều lớp nhất</Text>
              <Text style={styles.statValue} numberOfLines={1}>
                {stats?.topLecturer
                  ? `${stats.topLecturer.Fullname} (${stats.maxClasses})`
                  : '—'}
              </Text>
            </View>
          </View>

          {notice ? (
            <View style={styles.noticeBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#047857" />
              <Text style={styles.noticeText}>{notice}</Text>
              <Pressable onPress={() => setNotice('')}>
                <Ionicons name="close" size={18} color="#047857" />
              </Pressable>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#B91C1C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Toolbar */}
          <View style={styles.toolbar}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color="#64748B" />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm theo Mã GV (IDGV) hoặc Họ tên..."
                placeholderTextColor="#94A3B8"
              />
              {search ? (
                <Pressable onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={18} color="#94A3B8" />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              style={styles.addBtn}
              onPress={() => {
                setEditingLecturer(null);
                setFormVisible(true);
              }}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.addBtnText}>Thêm giảng viên</Text>
            </Pressable>
          </View>

          {/* Filter & Sort Bar */}
          <View style={styles.filterRow}>
            <View style={styles.chipGroup}>
              {(
                [
                  { key: 'all', label: 'Tất cả' },
                  { key: 'high', label: '≥ 5 lớp' },
                  { key: 'low', label: '< 5 lớp' },
                ] as const
              ).map((item) => (
                <Pressable
                  key={item.key}
                  style={[
                    styles.chip,
                    classFilter === item.key && styles.chipActive,
                  ]}
                  onPress={() => setClassFilter(item.key)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      classFilter === item.key && styles.chipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.chipGroup}>
              <Text style={styles.sortCaption}>Sắp xếp:</Text>
              {(['IDGV', 'Fullname', 'SumClass'] as SortField[]).map((field) => {
                const active = sortBy === field;
                return (
                  <Pressable
                    key={field}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleSort(field)}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {field}{' '}
                      {active ? (order === 'asc' ? '↑' : '↓') : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.centerText}>Đang tải danh sách giảng viên...</Text>
            </View>
          ) : lecturers.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="folder-open-outline" size={44} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Chưa có giảng viên nào</Text>
              <Text style={styles.emptySub}>
                Nhấn "Thêm giảng viên" để thêm dữ liệu mới.
              </Text>
            </View>
          ) : isWide ? (
            /* Web / Desktop Table */
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { width: 84 }]}>Hình ảnh</Text>
                <Text style={[styles.th, { width: 130 }]}>IDGV</Text>
                <Text style={[styles.th, { flex: 1 }]}>Fullname</Text>
                <Text style={[styles.th, { width: 130, textAlign: 'center' }]}>
                  SumClass
                </Text>
                <Text style={[styles.th, { width: 180, textAlign: 'right' }]}>
                  Thao tác
                </Text>
              </View>

              {lecturers.map((item) => {
                const imgUri = resolveImageUrl(item.Image);
                return (
                  <View key={item._id} style={styles.tableRow}>
                    <View style={{ width: 84 }}>
                      {imgUri ? (
                        <Image
                          source={{ uri: imgUri }}
                          style={styles.tableAvatar}
                        />
                      ) : (
                        <View style={[styles.tableAvatar, styles.avatarEmpty]}>
                          <Ionicons name="person" size={20} color="#94A3B8" />
                        </View>
                      )}
                    </View>
                    <View style={{ width: 130 }}>
                      <View style={styles.idBadge}>
                        <Text style={styles.idBadgeText}>{item.IDGV}</Text>
                      </View>
                    </View>
                    <Text style={[styles.tdName, { flex: 1 }]}>
                      {item.Fullname}
                    </Text>
                    <View style={{ width: 130, alignItems: 'center' }}>
                      <View style={styles.classBadge}>
                        <Text style={styles.classBadgeText}>
                          {item.SumClass} lớp
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tableActions}>
                      <Pressable
                        style={styles.iconBtn}
                        onPress={() => setDetailLecturer(item)}
                      >
                        <Ionicons name="eye-outline" size={18} color="#475569" />
                      </Pressable>
                      <Pressable
                        style={styles.iconBtn}
                        onPress={() => {
                          setEditingLecturer(item);
                          setFormVisible(true);
                        }}
                      >
                        <Ionicons
                          name="create-outline"
                          size={18}
                          color="#2563EB"
                        />
                      </Pressable>
                      <Pressable
                        style={[styles.iconBtn, styles.iconBtnDanger]}
                        onPress={() => setDeletingLecturer(item)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={18}
                          color="#DC2626"
                        />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            /* Mobile Cards */
            <View style={styles.cardsList}>
              {lecturers.map((item) => {
                const imgUri = resolveImageUrl(item.Image);
                return (
                  <Pressable
                    key={item._id}
                    style={styles.mobileCard}
                    onPress={() => setDetailLecturer(item)}
                  >
                    {imgUri ? (
                      <Image
                        source={{ uri: imgUri }}
                        style={styles.mobileAvatar}
                      />
                    ) : (
                      <View style={[styles.mobileAvatar, styles.avatarEmpty]}>
                        <Ionicons name="person" size={24} color="#94A3B8" />
                      </View>
                    )}

                    <View style={styles.mobileInfo}>
                      <View style={styles.mobileTopRow}>
                        <View style={styles.idBadge}>
                          <Text style={styles.idBadgeText}>{item.IDGV}</Text>
                        </View>
                        <View style={styles.classBadge}>
                          <Text style={styles.classBadgeText}>
                            {item.SumClass} lớp
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.mobileName}>{item.Fullname}</Text>

                      <View style={styles.mobileActions}>
                        <Pressable
                          style={styles.mobileActionBtn}
                          onPress={() => setDetailLecturer(item)}
                        >
                          <Ionicons name="eye-outline" size={15} color="#475569" />
                          <Text style={styles.mobileActionText}>Xem</Text>
                        </Pressable>
                        <Pressable
                          style={styles.mobileActionBtn}
                          onPress={() => {
                            setEditingLecturer(item);
                            setFormVisible(true);
                          }}
                        >
                          <Ionicons
                            name="create-outline"
                            size={15}
                            color="#2563EB"
                          />
                          <Text
                            style={[styles.mobileActionText, { color: '#2563EB' }]}
                          >
                            Sửa
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[styles.mobileActionBtn, styles.mobileDeleteBtn]}
                          onPress={() => setDeletingLecturer(item)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={15}
                            color="#DC2626"
                          />
                          <Text
                            style={[styles.mobileActionText, { color: '#DC2626' }]}
                          >
                            Xóa
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <GiangVienFormModal
        visible={formVisible}
        editingLecturer={editingLecturer}
        onClose={() => setFormVisible(false)}
        onSaved={() => {
          setNotice(
            editingLecturer
              ? 'Cập nhật thông tin giảng viên thành công'
              : 'Thêm giảng viên mới thành công',
          );
          void loadData(true);
        }}
      />

      <GiangVienDetailModal
        visible={!!detailLecturer}
        lecturer={detailLecturer}
        onClose={() => setDetailLecturer(null)}
        onEdit={(lecturer) => {
          setEditingLecturer(lecturer);
          setFormVisible(true);
        }}
      />

      <ConfirmModal
        visible={!!deletingLecturer}
        title="Xác nhận xóa giảng viên"
        message={
          deletingLecturer
            ? `Bạn có chắc muốn xóa giảng viên "${deletingLecturer.Fullname}" (${deletingLecturer.IDGV}) khỏi cơ sở dữ liệu QLHocPhan?`
            : ''
        }
        confirmLabel="Xóa"
        loading={deletingLoading}
        onCancel={() => setDeletingLecturer(null)}
        onConfirm={() => void handleConfirmDelete()}
      />

      <ExportJsonModal
        visible={exportModalVisible}
        jsonText={exportedJson}
        onClose={() => setExportModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  topBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  brandSub: {
    fontSize: 12,
    color: '#64748B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563EB',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  container: {
    width: '100%',
    maxWidth: 1120,
    alignSelf: 'center',
    gap: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsGridMobile: {
    justifyContent: 'space-between',
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
  },
  noticeText: {
    flex: 1,
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
  },
  errorBanner: {
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
    flex: 1,
    color: '#B91C1C',
    fontSize: 13,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  sortCaption: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#1D4ED8',
  },
  centerBox: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
  },
  centerText: {
    color: '#64748B',
    fontSize: 14,
  },
  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  th: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  avatarEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  idBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  idBadgeText: {
    color: '#1D4ED8',
    fontWeight: '700',
    fontSize: 12,
  },
  tdName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  classBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  classBadgeText: {
    color: '#047857',
    fontWeight: '700',
    fontSize: 12,
  },
  tableActions: {
    width: 180,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBtnDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  cardsList: {
    gap: 12,
  },
  mobileCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  mobileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
  },
  mobileInfo: {
    flex: 1,
    gap: 6,
  },
  mobileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  mobileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  mobileActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  mobileActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mobileDeleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  mobileActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});

