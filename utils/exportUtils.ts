import { Platform, Alert } from 'react-native';
import { Report, SplitterItem, CableItem } from '@/types/report';
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

function escapeCsvField(value: string | number | boolean | undefined): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatSplitters(items?: SplitterItem[]): string {
  if (!items || items.length === 0) return '';
  return items.map((s) => `${s.type} x${s.quantity}`).join('; ');
}

function formatCables(items?: CableItem[]): string {
  if (!items || items.length === 0) return '';
  return items.map((c) => `${c.type} x${c.quantity}`).join('; ');
}

export function generateCsvContent(reports: Report[]): string {
  const BOM = '\uFEFF';

  const headers = [
    'ID',
    'תאריך',
    'שעה',
    'שם משתמש',
    'שם טכנאי',
    'סוג דיווח',
    'סוג משנה',
    'רחוב',
    'עיר',
    'מספר מפה',
    'טיקט',
    'הגעה',
    'מספר ארון',
    'מיקום ארון',
    'מפצלים (ארון)',
    'גודל קלוזר',
    'כבלים',
    'ריתוכים (קלוזר)',
    'מפצלים (קלוזר)',
    'סוג תוספת',
    'יעד תוספת',
    'מספר תוספת',
    'לטובת ארון',
    'סוג תקלה',
    'סוג נזק בארון',
    'מפצלים (תקלה)',
    'ריתוכים (תקלה)',
    'פתיחות סיב',
    'ריתוכים סיב',
    'OTDR סיב',
    'פתיחות כבל',
    'ריתוכים כבל',
    'OTDR כבל',
    'סוג כבל',
    'אורך כבל',
    'מאיפה',
    'לאיפה',
    'פתיחות תשתית',
    'ריתוכים תשתית',
    'פתיחת כבל תשתית',
    'הערות',
  ];

  const rows = reports.map((r) => [
    r.id,
    formatDate(r.created_at),
    formatTime(r.created_at),
    r.username,
    r.technician_name,
    r.report_type === 'fault' ? 'תקלה' : 'עבודה',
    r.report_type === 'work' && r.work_type ? WORK_TYPE_LABELS[r.work_type] ?? '' : r.report_type === 'fault' && r.fault_type ? FAULT_TYPE_LABELS[r.fault_type] ?? '' : '',
    r.street,
    r.city,
    r.map_number,
    r.ticket ?? '',
    r.arrival_time ?? '',
    r.cabinet_number ?? '',
    r.cabinet_location ?? '',
    formatSplitters(r.cabinet_splitters),
    r.closure_size ? CLOSURE_SIZE_LABELS[r.closure_size] ?? '' : '',
    formatCables(r.closure_cables),
    r.closure_welds ?? '',
    formatSplitters(r.closure_splitters),
    r.addition_action === 'cable_insert' ? 'הכנסת כבל' : r.addition_action === 'weld_add' ? 'הוספת ריתוך' : '',
    r.addition_target === 'cabinet' ? 'ארון' : r.addition_target === 'closure' ? 'קלוזר' : '',
    r.addition_number ?? '',
    r.addition_for_cabinet ?? '',
    r.fault_type ? FAULT_TYPE_LABELS[r.fault_type] ?? '' : '',
    r.cabinet_damage_sub ? CABINET_DAMAGE_SUB_LABELS[r.cabinet_damage_sub] ?? '' : '',
    formatSplitters(r.fault_splitters),
    r.fault_welds ?? '',
    r.fiber_openings ?? '',
    r.fiber_welds ?? '',
    r.fiber_otdr ?? '',
    r.cable_openings ?? '',
    r.cable_welds ?? '',
    r.cable_otdr ?? '',
    r.cable_type ?? '',
    r.cable_length ?? '',
    r.cable_from ?? '',
    r.cable_to ?? '',
    r.infra_openings ?? '',
    r.infra_welds ?? '',
    r.infra_cable_opening ?? '',
    r.note,
  ]);

  const csvLines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ];

  return BOM + csvLines.join('\n');
}

export async function exportReportsCsv(reports: Report[]): Promise<void> {
  if (reports.length === 0) {
    Alert.alert('אין דיווחים', 'אין דיווחים לייצוא');
    return;
  }

  const csvContent = generateCsvContent(reports);
  const fileName = `reports_${new Date().toISOString().split('T')[0]}.csv`;

  if (Platform.OS === 'web') {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('[Export] CSV downloaded on web');
    } catch (error) {
      console.error('[Export] Web export failed:', error);
      Alert.alert('שגיאה', 'הייצוא נכשל');
    }
  } else {
    try {
      const { File, Paths } = await import('expo-file-system');
      const Sharing = await import('expo-sharing');

      const file = new File(Paths.cache, fileName);
      file.create({ overwrite: true });
      file.write(csvContent);
      console.log('[Export] File created at:', file.uri);

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/csv',
          dialogTitle: 'ייצוא דיווחים',
        });
        console.log('[Export] CSV shared on native');
      } else {
        Alert.alert('שגיאה', 'שיתוף קבצים לא זמין במכשיר זה');
      }
    } catch (error) {
      console.error('[Export] Native export failed:', error);
      try {
        const FileSystemLegacy = await import('expo-file-system/legacy');
        const Sharing = await import('expo-sharing');

        const fileUri = FileSystemLegacy.cacheDirectory + fileName;
        await FileSystemLegacy.writeAsStringAsync(fileUri, csvContent, {
          encoding: FileSystemLegacy.EncodingType.UTF8,
        });
        console.log('[Export] File created with legacy API at:', fileUri);

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'ייצוא דיווחים',
          });
          console.log('[Export] CSV shared via legacy API');
        } else {
          Alert.alert('שגיאה', 'שיתוף קבצים לא זמין במכשיר זה');
        }
      } catch (legacyError) {
        console.error('[Export] Legacy export also failed:', legacyError);
        Alert.alert('שגיאה', 'הייצוא נכשל. נסה שוב.');
      }
    }
  }
}
