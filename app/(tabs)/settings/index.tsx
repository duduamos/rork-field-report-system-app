import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  LogOut,
  FileDown,
  User,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/contexts/ReportsContext';
import { exportReportsCsv } from '@/utils/exportUtils';
import { testBackendConnection, getBackendUrl } from '@/lib/api';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, isAdmin, logout, changePassword } = useAuth();
  const { reports, refetch, isSyncing, backendAvailable } = useReports();

  const userReports = React.useMemo(() => {
    if (isAdmin) return reports;
    return reports.filter((r) => r.username === user?.username);
  }, [reports, isAdmin, user?.username]);

  const [showPasswordSection, setShowPasswordSection] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrent, setShowCurrent] = useState<boolean>(false);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [isChanging, setIsChanging] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; reportCount?: number } | null>(null);

  const workCount = userReports.filter((r) => r.report_type === 'work').length;
  const faultCount = userReports.filter((r) => r.report_type === 'fault').length;

  const handleChangePassword = useCallback(async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('שגיאה', 'יש למלא את כל השדות');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('שגיאה', 'הסיסמאות החדשות לא תואמות');
      return;
    }
    setIsChanging(true);
    try {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        Alert.alert('הצלחה', result.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      } else {
        Alert.alert('שגיאה', result.message);
      }
    } finally {
      setIsChanging(false);
    }
  }, [currentPassword, newPassword, confirmPassword, changePassword]);

  const handleExport = useCallback(() => {
    exportReportsCsv(userReports);
  }, [userReports]);

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    setTestResult(null);
    console.log('[Settings] Testing backend connection...');
    const result = await testBackendConnection();
    console.log('[Settings] Test result:', result);
    setTestResult(result);
    setIsTesting(false);
  }, []);

  const handleForceSync = useCallback(async () => {
    console.log('[Settings] Force sync triggered');
    await refetch();
    Alert.alert('סנכרון', `סנכרון הושלם. ${reports.length} דיווחים נטענו.`);
  }, [refetch, reports.length]);

  const handleLogout = useCallback(() => {
    Alert.alert('התנתקות', 'האם אתה בטוח?', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'התנתק',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login' as any);
        },
      },
    ]);
  }, [logout, router]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <User size={28} color={Colors.white} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.name ?? ''}</Text>
          <View style={styles.roleRow}>
            <Shield size={14} color={Colors.textSecondary} />
            <Text style={styles.roleText}>
              {isAdmin ? 'מנהל' : 'טכנאי'} • {user?.username ?? ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{userReports.length}</Text>
          <Text style={styles.statLabel}>סה״כ דיווחים</Text>
        </View>
        <View style={[styles.statCard, styles.statCardFault]}>
          <Text style={[styles.statValue, { color: Colors.fault }]}>{faultCount}</Text>
          <Text style={styles.statLabel}>תקלות</Text>
        </View>
        <View style={[styles.statCard, styles.statCardWork]}>
          <Text style={[styles.statValue, { color: Colors.work }]}>{workCount}</Text>
          <Text style={styles.statLabel}>עבודות</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ייצוא</Text>
        <TouchableOpacity style={styles.actionCard} onPress={handleExport} testID="export-button">
          <View style={styles.exportIconCircle}>
            <FileDown size={22} color={Colors.white} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>ייצוא ל-CSV</Text>
            <Text style={styles.actionSubtitle}>
              ייצא {userReports.length} דיווחים לקובץ Excel
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setShowPasswordSection(!showPasswordSection)}
          testID="change-password-toggle"
        >
          <View style={[styles.exportIconCircle, { backgroundColor: Colors.warning }]}>
            <KeyRound size={22} color={Colors.white} />
          </View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>שינוי סיסמה</Text>
            <Text style={styles.actionSubtitle}>עדכן את הסיסמה שלך</Text>
          </View>
          {showPasswordSection ? (
            <ChevronUp size={20} color={Colors.textSecondary} />
          ) : (
            <ChevronDown size={20} color={Colors.textSecondary} />
          )}
        </TouchableOpacity>

        {showPasswordSection && (
          <View style={styles.passwordForm}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="סיסמה נוכחית"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                textAlign="right"
                testID="current-password-input"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? (
                  <EyeOff size={18} color={Colors.textSecondary} />
                ) : (
                  <Eye size={18} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="סיסמה חדשה"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
                textAlign="right"
                testID="new-password-input"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowNew(!showNew)}
              >
                {showNew ? (
                  <EyeOff size={18} color={Colors.textSecondary} />
                ) : (
                  <Eye size={18} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.passwordInput}
                placeholder="אימות סיסמה חדשה"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showNew}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                textAlign="right"
                testID="confirm-password-input"
              />
            </View>

            <TouchableOpacity
              style={[styles.savePasswordButton, isChanging && styles.savePasswordButtonDisabled]}
              onPress={handleChangePassword}
              disabled={isChanging}
              testID="save-password-button"
            >
              {isChanging ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.savePasswordText}>שמור סיסמה</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>אבחון חיבור לשרת</Text>
          <View style={styles.diagnosticsCard}>
            <View style={styles.diagRow}>
              <View style={styles.diagLabelRow}>
                <Database size={14} color={Colors.textSecondary} />
                <Text style={styles.diagLabel}>כתובת שרת:</Text>
              </View>
              <Text style={styles.diagValue} numberOfLines={1}>
                {getBackendUrl()}
              </Text>
            </View>
            <View style={styles.diagRow}>
              <View style={styles.diagLabelRow}>
                {backendAvailable ? (
                  <Wifi size={14} color={Colors.success} />
                ) : (
                  <WifiOff size={14} color={Colors.error} />
                )}
                <Text style={styles.diagLabel}>מצב:</Text>
              </View>
              <Text style={[styles.diagValue, { color: backendAvailable ? Colors.success : Colors.error }]}>
                {backendAvailable ? 'מחובר' : 'לא מחובר'}
              </Text>
            </View>
            <View style={styles.diagRow}>
              <View style={styles.diagLabelRow}>
                <Database size={14} color={Colors.textSecondary} />
                <Text style={styles.diagLabel}>דיווחים שנטענו:</Text>
              </View>
              <Text style={styles.diagValue}>{reports.length}</Text>
            </View>

            {testResult && (
              <View style={[styles.testResultBox, { backgroundColor: testResult.ok ? Colors.successLight : Colors.errorLight }]}>
                <Text style={[styles.testResultText, { color: testResult.ok ? Colors.success : Colors.error }]}>
                  {testResult.message}
                </Text>
              </View>
            )}

            <View style={styles.diagButtons}>
              <TouchableOpacity
                style={[styles.diagButton, isTesting && styles.diagButtonDisabled]}
                onPress={handleTestConnection}
                disabled={isTesting}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Wifi size={16} color={Colors.white} />
                )}
                <Text style={styles.diagButtonText}>בדיקת חיבור</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.diagButton, styles.diagButtonSecondary, isSyncing && styles.diagButtonDisabled]}
                onPress={handleForceSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <RefreshCw size={16} color={Colors.primary} />
                )}
                <Text style={[styles.diagButtonText, { color: Colors.primary }]}>רענון כפוי</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} testID="logout-button">
        <LogOut size={20} color={Colors.error} />
        <Text style={styles.logoutText}>התנתק</Text>
      </TouchableOpacity>

      <Text style={styles.version}>גרסה 1.0.0</Text>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 14,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'right',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    justifyContent: 'flex-end',
  },
  roleText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  statCardFault: {
    borderColor: Colors.faultLight,
    backgroundColor: Colors.faultLight,
  },
  statCardWork: {
    borderColor: Colors.workLight,
    backgroundColor: Colors.workLight,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'right',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 14,
  },
  exportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'right',
  },
  actionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    textAlign: 'right',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.errorLight,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 16,
  },
  passwordForm: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  savePasswordButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  savePasswordButtonDisabled: {
    opacity: 0.6,
  },
  savePasswordText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600' as const,
  },
  diagnosticsCard: {
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  diagLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diagLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  diagValue: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'right',
  },
  testResultBox: {
    borderRadius: 8,
    padding: 10,
    marginTop: 4,
  },
  testResultText: {
    fontSize: 13,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  diagButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  diagButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 11,
  },
  diagButtonSecondary: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  diagButtonDisabled: {
    opacity: 0.6,
  },
  diagButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.white,
  },
});
