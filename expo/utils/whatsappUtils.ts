import { Linking, Platform, Alert } from 'react-native';
import { Report, SplitterItem, CableItem } from '@/types/report';
import {
  FAULT_TYPE_LABELS,
  WORK_TYPE_LABELS,
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

function formatSplitters(items: SplitterItem[]): string {
  return items.filter((s) => s.quantity > 0).map((s) => `${s.type} x${s.quantity}`).join(', ');
}

function formatCables(items: CableItem[]): string {
  return items.filter((c) => c.quantity > 0).map((c) => `${c.type} x${c.quantity}`).join(', ');
}

function formatWorkReport(report: Report): string {
  const lines: string[] = [];
  const workLabel = report.work_type ? WORK_TYPE_LABELS[report.work_type] ?? '' : '';

  lines.push(`📍 ${report.street}${report.city ? `, ${report.city}` : ''}`);
  if (report.map_number) lines.push(`🗺 מספר מפה: ${report.map_number}`);

  if (report.work_type === 'cabinet') {
    if (report.cabinet_number) lines.push(`📦 ארון מספר: ${report.cabinet_number}`);
    if (report.cabinet_splitters && report.cabinet_splitters.length > 0) {
      lines.push(`מפצלים: ${formatSplitters(report.cabinet_splitters)}`);
    }
    if (report.cabinet_location) lines.push(`📍 מיקום: ${report.cabinet_location}`);
  }

  if (report.work_type === 'closure') {
    if (report.closure_size) lines.push(`📦 קלוזר: ${CLOSURE_SIZE_LABELS[report.closure_size] ?? report.closure_size}`);
    if (report.closure_cables && report.closure_cables.length > 0) {
      lines.push(`כבלים: ${formatCables(report.closure_cables)}`);
    }
    if (report.closure_welds) lines.push(`ריתוכים: ${report.closure_welds}`);
    if (report.closure_splitters && report.closure_splitters.length > 0) {
      lines.push(`מפצלים: ${formatSplitters(report.closure_splitters)}`);
    }
  }

  if (report.work_type === 'addition') {
    const actionLabel = report.addition_action === 'cable_insert' ? 'הכנסת כבל' : 'הוספת ריתוך';
    const targetLabel = report.addition_target === 'cabinet' ? 'ארון' : 'קלוזר';
    lines.push(`${actionLabel} / ${targetLabel}`);
    if (report.addition_cable_type) lines.push(`סוג כבל: ${report.addition_cable_type}`);
    if (report.addition_welds) lines.push(`ריתוכים: ${report.addition_welds}`);
    if (report.addition_number) lines.push(`מספר: ${report.addition_number}`);
    if (report.addition_for_cabinet) lines.push(`לטובת ארון: ${report.addition_for_cabinet}`);
  }

  if (report.note && report.note.trim()) {
    lines.push(`📝 הערות: ${report.note.trim()}`);
  }

  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

function formatFaultReport(report: Report): string {
  const lines: string[] = [];
  const faultLabel = report.fault_type ? FAULT_TYPE_LABELS[report.fault_type] ?? '' : '';

  lines.push(`📍 ${report.street}${report.city ? `, ${report.city}` : ''}`);
  if (report.ticket) lines.push(`🎫 טיקט: ${report.ticket}`);
  if (report.map_number) lines.push(`🗺 מספר מפה: ${report.map_number}`);
  lines.push('הגעה');

  if (report.fault_type === 'empty') {
    lines.push('סרק');
    lines.push('עוצמות תקינות');
  }

  if (report.fault_type === 'cabinet_damage') {
    const subLabel = report.cabinet_damage_sub ? CABINET_DAMAGE_SUB_LABELS[report.cabinet_damage_sub] ?? '' : '';
    lines.push(`נזק בארון - ${subLabel}`);
    lines.push('נזק פנימי');

    if (report.cabinet_damage_sub === 'broken_splitter') {
      if (report.fault_splitters && report.fault_splitters.length > 0) {
        lines.push(`מפצלים: ${formatSplitters(report.fault_splitters)}`);
        const totalSplitters = report.fault_splitters.reduce((sum, s) => sum + s.quantity, 0);
        lines.push(`ריתוכים: ${totalSplitters}`);
      }
    }

    if (report.cabinet_damage_sub === 'cable_pulled') {
      lines.push('פתיחת כבל 12 -1');
      lines.push('פתיחה -1');
      if (report.fault_welds) lines.push(`ריתוכים: ${report.fault_welds}`);
    }

    if (report.cabinet_damage_sub === 'broken_weld') {
      lines.push('1 ריתוך');
    }
  }

  if (report.fault_type === 'broken_fiber') {
    lines.push('סיב שבור בקלוזר');
    if (report.fiber_openings) {
      lines.push(`פתיחות: ${report.fiber_openings}`);
      lines.push(report.fiber_openings >= 2 ? 'נזק חיצוני' : 'נזק פנימי');
    }
    if (report.fiber_welds) lines.push(`ריתוכים: ${report.fiber_welds}`);
    if (report.fiber_otdr) lines.push(`OTDR: ${report.fiber_otdr}`);
  }

  if (report.fault_type === 'cable_replace') {
    lines.push('החלפת כבל');
    if (report.cable_openings) lines.push(`פתיחות: ${report.cable_openings}`);
    if (report.cable_welds) lines.push(`ריתוכים: ${report.cable_welds}`);
    if (report.cable_otdr) lines.push(`OTDR: ${report.cable_otdr}`);
    if (report.cable_type) lines.push(`סוג כבל: ${report.cable_type}`);
    if (report.cable_length) lines.push(`אורך: ${report.cable_length}`);
    if (report.cable_from || report.cable_to) {
      lines.push(`מ: ${report.cable_from || '-'} → ל: ${report.cable_to || '-'}`);
    }
  }

  if (report.fault_type === 'infrastructure_fix') {
    lines.push('חזר מתשתיות');
    if (report.infra_openings) lines.push(`פתיחות: ${report.infra_openings}`);
    if (report.infra_welds) lines.push(`ריתוכים: ${report.infra_welds}`);
    if (report.infra_cable_type) lines.push(`פתיחת כבל ${report.infra_cable_type} -2`);
  }

  if (report.note && report.note.trim()) {
    lines.push(`📝 הערות: ${report.note.trim()}`);
  }

  lines.push('━━━━━━━━━━━━━━━');
  return lines.join('\n');
}

export function formatReportForWhatsApp(report: Report): string {
  if (report.report_type === 'work') {
    return formatWorkReport(report);
  }
  return formatFaultReport(report);
}

export async function shareReportViaWhatsApp(report: Report): Promise<void> {
  const message = formatReportForWhatsApp(report);
  const encoded = encodeURIComponent(message);

  const whatsappUrl = Platform.OS === 'web'
    ? `https://wa.me/?text=${encoded}`
    : `whatsapp://send?text=${encoded}`;

  try {
    const supported = await Linking.canOpenURL(whatsappUrl);
    if (supported) {
      await Linking.openURL(whatsappUrl);
      console.log('[WhatsApp] Opened WhatsApp with report', report.id);
    } else {
      const webFallback = `https://wa.me/?text=${encoded}`;
      await Linking.openURL(webFallback);
      console.log('[WhatsApp] Used web fallback for report', report.id);
    }
  } catch (error) {
    console.error('[WhatsApp] Failed to open WhatsApp:', error);
    Alert.alert('שגיאה', 'לא ניתן לפתוח את WhatsApp. ודא שהאפליקציה מותקנת.');
  }
}
