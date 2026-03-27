import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Clock, Wrench, AlertTriangle, ChevronLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Report } from '@/types/report';
import { WORK_TYPE_LABELS, FAULT_TYPE_LABELS } from '@/constants/fieldOptions';

interface ReportCardProps {
  report: Report;
  onPress: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function getSubLabel(report: Report): string {
  if (report.report_type === 'work' && report.work_type) {
    return WORK_TYPE_LABELS[report.work_type] ?? '';
  }
  if (report.report_type === 'fault' && report.fault_type) {
    return FAULT_TYPE_LABELS[report.fault_type] ?? '';
  }
  return '';
}

function ReportCardComponent({ report, onPress }: ReportCardProps) {
  const isFault = report.report_type === 'fault';
  const subLabel = getSubLabel(report);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      testID={`report-card-${report.id}`}
    >
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={[styles.typeBadge, isFault ? styles.faultBadge : styles.workBadge]}>
            {isFault ? (
              <AlertTriangle size={14} color={Colors.fault} />
            ) : (
              <Wrench size={14} color={Colors.work} />
            )}
            <Text style={[styles.typeText, isFault ? styles.faultText : styles.workText]}>
              {isFault ? 'תקלה' : 'עבודה'}
            </Text>
          </View>
          {subLabel ? (
            <View style={styles.subBadge}>
              <Text style={styles.subBadgeText}>{subLabel}</Text>
            </View>
          ) : null}
        </View>
        <ChevronLeft size={20} color={Colors.textLight} />
      </View>

      <View style={styles.body}>
        <Text style={styles.techName} numberOfLines={1}>
          {report.technician_name}
        </Text>
        <View style={styles.infoRow}>
          <MapPin size={14} color={Colors.textSecondary} />
          <Text style={styles.infoText} numberOfLines={1}>
            {report.street}{report.city ? `, ${report.city}` : ''}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Clock size={14} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            {formatDate(report.created_at)} • {formatTime(report.created_at)}
          </Text>
        </View>
      </View>

      {report.ticket ? (
        <View style={styles.footer}>
          <Text style={styles.ticketLabel}>טיקט:</Text>
          <Text style={styles.ticketValue}>{report.ticket}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

export const ReportCard = React.memo(ReportCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  faultBadge: {
    backgroundColor: Colors.faultLight,
  },
  workBadge: {
    backgroundColor: Colors.workLight,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  faultText: {
    color: Colors.fault,
  },
  workText: {
    color: Colors.work,
  },
  subBadge: {
    backgroundColor: Colors.inputBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  subBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  body: {
    gap: 6,
  },
  techName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 2,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    gap: 4,
  },
  ticketLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  ticketValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
