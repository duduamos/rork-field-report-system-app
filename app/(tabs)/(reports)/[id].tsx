import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  MapPin,
  Clock,
  Wrench,
  AlertTriangle,
  Trash2,
  Box,
  Cable,
  StickyNote,
  Send,
  Zap,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useReports } from '@/contexts/ReportsContext';
import { useAuth } from '@/contexts/AuthContext';
import { shareReportViaWhatsApp } from '@/utils/whatsappUtils';
import { SplitterItem, CableItem } from '@/types/report';
import {
  WORK_TYPE_LABELS,
  FAULT_TYPE_LABELS,
  CABINET_DAMAGE_SUB_LABELS,
  CLOSURE_SIZE_LABELS,
} from '@/constants/fieldOptions';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

interface DetailRowProps {
  label: string;
  value: string | number | undefined;
  highlight?: boolean;
}

function DetailRow({ label, value, highlight }: DetailRowProps) {
  if (value === undefined || value === null || value === '' || value === 0) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && styles.detailValueHighlight]}>
        {String(value)}
      </Text>
    </View>
  );
}

function SplittersDisplay({ items, title }: { items?: SplitterItem[]; title?: string }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.chipsContainer}>
      {title ? <Text style={styles.chipsTitle}>{title}</Text> : null}
      <View style={styles.chipsRow}>
        {items.map((s) => (
          <View key={s.type} style={styles.chipItem}>
            <Text style={styles.chipValue}>{s.quantity}</Text>
            <Text style={styles.chipLabel}>PLC {s.type}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CablesDisplay({ items, title }: { items?: CableItem[]; title?: string }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.chipsContainer}>
      {title ? <Text style={styles.chipsTitle}>{title}</Text> : null}
      <View style={styles.chipsRow}>
        {items.map((c) => (
          <View key={c.type} style={[styles.chipItem, styles.chipItemCable]}>
            <Text style={styles.chipValue}>{c.quantity}</Text>
            <Text style={styles.chipLabel}>כבל {c.type}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getReportById, deleteReport } = useReports();
  const { isAdmin } = useAuth();

  const report = useMemo(() => getReportById(id ?? ''), [getReportById, id]);

  if (!report) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>הדיווח לא נמצא</Text>
      </View>
    );
  }

  const isFault = report.report_type === 'fault';
  const isWork = report.report_type === 'work';

  const handleDelete = () => {
    Alert.alert('מחיקת דיווח', 'האם אתה בטוח שברצונך למחוק דיווח זה?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחק',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteReport(report.id);
            router.back();
          } catch (error) {
            console.error('[Detail] Failed to delete:', error);
            Alert.alert('שגיאה', 'מחיקת הדיווח נכשלה');
          }
        },
      },
    ]);
  };

  const workLabel = report.work_type ? WORK_TYPE_LABELS[report.work_type] : '';
  const faultLabel = report.fault_type ? FAULT_TYPE_LABELS[report.fault_type] : '';
  const subTypeLabel = report.cabinet_damage_sub ? CABINET_DAMAGE_SUB_LABELS[report.cabinet_damage_sub] : '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.typeBanner, isFault ? styles.faultBanner : styles.workBanner]}>
        {isFault ? (
          <AlertTriangle size={22} color={Colors.fault} />
        ) : (
          <Wrench size={22} color={Colors.work} />
        )}
        <Text style={[styles.typeText, isFault ? styles.faultTypeText : styles.workTypeText]}>
          {isFault ? `דיווח תקלה — ${faultLabel}` : `דיווח עבודה — ${workLabel}`}
        </Text>
      </View>

      <View style={styles.headerCard}>
        <Text style={styles.techName}>{report.technician_name}</Text>
        <View style={styles.headerMeta}>
          <View style={styles.metaItem}>
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {formatDate(report.created_at)} • {formatTime(report.created_at)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {report.street}{report.city ? `, ${report.city}` : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Box size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>פרטים</Text>
        </View>
        <View style={styles.sectionCard}>
          {isFault && <DetailRow label="טיקט" value={report.ticket} highlight />}
          <DetailRow label="מספר מפה" value={report.map_number} />
          {isFault && <DetailRow label="הגעה" value={report.arrival_time} />}

          {isWork && report.work_type === 'cabinet' && (
            <>
              <DetailRow label="מספר ארון" value={report.cabinet_number} />
              <DetailRow label="מיקום ארון" value={report.cabinet_location} />
              <SplittersDisplay items={report.cabinet_splitters} title="מפצלים" />
            </>
          )}

          {isWork && report.work_type === 'closure' && (
            <>
              <DetailRow label="גודל קלוזר" value={report.closure_size ? CLOSURE_SIZE_LABELS[report.closure_size] : undefined} />
              <CablesDisplay items={report.closure_cables} title="כבלים" />
              <DetailRow label="ריתוכים" value={report.closure_welds} />
              <SplittersDisplay items={report.closure_splitters} title="מפצלים" />
            </>
          )}

          {isWork && report.work_type === 'addition' && (
            <>
              <DetailRow label="סוג תוספת" value={report.addition_action === 'cable_insert' ? 'הכנסת כבל' : report.addition_action === 'weld_add' ? 'הוספת ריתוך' : undefined} />
              <DetailRow label="יעד" value={report.addition_target === 'cabinet' ? 'ארון' : report.addition_target === 'closure' ? 'קלוזר' : undefined} />
              <DetailRow label="מספר" value={report.addition_number} />
              <DetailRow label="לטובת ארון" value={report.addition_for_cabinet} />
            </>
          )}

          {isFault && report.fault_type === 'empty' && (
            <View style={styles.damageTag}>
              <Text style={styles.damageTagText}>נזק פנימי</Text>
            </View>
          )}

          {isFault && report.fault_type === 'cabinet_damage' && (
            <>
              <DetailRow label="סוג נזק" value={subTypeLabel} />
              {report.cabinet_damage_sub === 'broken_splitter' && (
                <SplittersDisplay items={report.fault_splitters} title="מפצלים" />
              )}
              {report.cabinet_damage_sub === 'cable_pulled' && (
                <>
                  <View style={styles.damageTag}>
                    <Text style={styles.damageTagText}>פתיחת כבל 12 -1 / פתיחה -1</Text>
                  </View>
                  <DetailRow label="ריתוכים" value={report.fault_welds} />
                </>
              )}
              {report.cabinet_damage_sub === 'broken_weld' && (
                <View style={styles.damageTag}>
                  <Text style={styles.damageTagText}>נזק פנימי</Text>
                </View>
              )}
            </>
          )}

          {isFault && report.fault_type === 'broken_fiber' && (
            <>
              <DetailRow label="פתיחות" value={report.fiber_openings} />
              {report.fiber_openings !== undefined && (
                <View style={styles.damageTag}>
                  <Text style={styles.damageTagText}>
                    {report.fiber_openings >= 2 ? 'נזק חיצוני' : 'נזק פנימי'}
                  </Text>
                </View>
              )}
              <DetailRow label="ריתוכים" value={report.fiber_welds} />
              <DetailRow label="OTDR" value={report.fiber_otdr} />
            </>
          )}

          {isFault && report.fault_type === 'cable_replace' && (
            <>
              <DetailRow label="פתיחות" value={report.cable_openings} />
              <DetailRow label="ריתוכים" value={report.cable_welds} />
              <DetailRow label="OTDR" value={report.cable_otdr} />
              <DetailRow label="סוג כבל" value={report.cable_type} />
              <DetailRow label="אורך" value={report.cable_length} />
              <DetailRow label="מאיפה" value={report.cable_from} />
              <DetailRow label="לאיפה" value={report.cable_to} />
            </>
          )}

          {isFault && report.fault_type === 'infrastructure_fix' && (
            <>
              <DetailRow label="פתיחות" value={report.infra_openings} />
              <DetailRow label="ריתוכים" value={report.infra_welds} />
              <DetailRow label="פתיחת כבל" value={report.infra_cable_opening} />
            </>
          )}
        </View>
      </View>

      {report.note ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <StickyNote size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>הערות</Text>
          </View>
          <View style={styles.sectionCard}>
            <Text style={styles.noteText}>{report.note}</Text>
          </View>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.whatsappButton}
        onPress={() => shareReportViaWhatsApp(report)}
        activeOpacity={0.8}
        testID="share-whatsapp"
      >
        <Send size={18} color="#ffffff" />
        <Text style={styles.whatsappText}>שלח ב-WhatsApp</Text>
      </TouchableOpacity>

      {report.images && report.images.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>תמונות ({report.images.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
            {report.images.map((uri, index) => (
              <Image
                key={`img-${index}`}
                source={{ uri }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {isAdmin ? (
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} testID="delete-report">
          <Trash2 size={18} color={Colors.error} />
          <Text style={styles.deleteText}>מחק דיווח</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  typeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  faultBanner: {
    backgroundColor: Colors.faultLight,
  },
  workBanner: {
    backgroundColor: Colors.workLight,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  faultTypeText: {
    color: Colors.fault,
  },
  workTypeText: {
    color: Colors.work,
  },
  headerCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  techName: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'right',
    marginBottom: 10,
  },
  headerMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'right',
  },
  detailValueHighlight: {
    color: Colors.primary,
  },
  chipsContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  chipsTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  chipItem: {
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  chipItemCable: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
  },
  chipValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  chipLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  damageTag: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  damageTagText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#92400E',
    textAlign: 'right',
  },
  noteText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    textAlign: 'right',
  },
  imagesRow: {
    marginTop: 8,
  },
  image: {
    width: 160,
    height: 160,
    borderRadius: 12,
    marginRight: 10,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.errorLight,
    gap: 8,
  },
  deleteText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#25D366',
    gap: 8,
  },
  whatsappText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#ffffff',
  },
  bottomSpacer: {
    height: 20,
  },
});
