import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, Filter, FileDown } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useFilteredReports, useReports } from '@/contexts/ReportsContext';
import { ReportCard } from '@/components/ReportCard';
import { exportReportsCsv } from '@/utils/exportUtils';
import { Report } from '@/types/report';

export default function ReportsListScreen() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { isLoading, isSyncing, refetch } = useReports();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'fault' | 'work'>('all');

  const filteredReports = useFilteredReports(user?.username ?? '', isAdmin, searchQuery);

  const displayReports = React.useMemo(() => {
    if (filterType === 'all') return filteredReports;
    return filteredReports.filter((r) => r.report_type === filterType);
  }, [filteredReports, filterType]);

  const handleExport = useCallback(() => {
    exportReportsCsv(displayReports);
  }, [displayReports]);

  const handleReportPress = useCallback((report: Report) => {
    router.push(`/(tabs)/(reports)/${report.id}` as any);
  }, [router]);

  const renderReport = useCallback(({ item }: { item: Report }) => (
    <ReportCard report={item} onPress={() => handleReportPress(item)} />
  ), [handleReportPress]);

  const keyExtractor = useCallback((item: Report) => item.id, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <View style={styles.searchInputWrapper}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="חיפוש דיווחים..."
            placeholderTextColor={Colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            textAlign="right"
            testID="search-input"
          />
        </View>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExport}
          testID="export-button"
        >
          <FileDown size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'fault', 'work'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterChip, filterType === type && styles.filterChipActive]}
            onPress={() => setFilterType(type)}
          >
            <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
              {type === 'all' ? 'הכל' : type === 'fault' ? 'תקלות' : 'עבודות'}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{displayReports.length}</Text>
        </View>
      </View>

      <FlatList
        data={displayReports}
        renderItem={renderReport}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isSyncing} onRefresh={refetch} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Filter size={48} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>אין דיווחים</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'נסה לחפש מחדש' : 'צור דיווח חדש מהטאב השני'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 15,
    color: Colors.text,
  },
  exportButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: Colors.white,
  },
  countBadge: {
    marginLeft: 'auto' as const,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  listContent: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
