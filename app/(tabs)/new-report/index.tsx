import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  ImagePlus,
  X,
  Send,
  MapPin,
  Wrench,
  AlertTriangle,
  Box,
  Cable,
  StickyNote,
  Zap,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useReports } from '@/contexts/ReportsContext';
import { ReportFormData } from '@/types/report';
import {
  WORK_TYPES,
  FAULT_TYPES,
  CABINET_DAMAGE_SUB_TYPES,
  ADDITION_ACTIONS,
  ADDITION_TARGETS,
  CLOSURE_SIZES,
} from '@/constants/fieldOptions';
import { SegmentButtons } from '@/components/SegmentButtons';
import { SplitterSelector } from '@/components/SplitterSelector';
import { CableSelector } from '@/components/CableSelector';
import { shareReportViaWhatsApp } from '@/utils/whatsappUtils';

const INITIAL_FORM: ReportFormData = {
  report_type: 'fault',
  technician_name: '',
  street: '',
  city: '',
  map_number: '',
  note: '',
  images: [],
  work_type: '',
  cabinet_number: '',
  cabinet_location: '',
  cabinet_splitters: [],
  closure_size: '',
  closure_number: '',
  closure_cables: [],
  closure_welds: '',
  closure_splitters: [],
  addition_action: '',
  addition_target: '',
  addition_number: '',
  addition_for_cabinet: '',
  addition_welds: '',
  addition_cable_type: '',
  ticket: '',
  arrival_time: '',
  fault_type: '',
  cabinet_damage_sub: '',
  fault_splitters: [],
  fault_welds: '',
  fault_openings: '',
  fiber_openings: '',
  fiber_welds: '',
  fiber_otdr: '',
  cable_openings: '',
  cable_welds: '',
  cable_otdr: '',
  cable_type: '',
  cable_length: '',
  cable_from: '',
  cable_to: '',
  infra_openings: '',
  infra_welds: '',
  infra_cable_opening: '',
  infra_cable_type: '',
};

function formatCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

export default function NewReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { addReport, isAdding } = useReports();
  const [form, setForm] = useState<ReportFormData>({
    ...INITIAL_FORM,
    technician_name: user?.name ?? '',
  });
  const scrollRef = useRef<ScrollView>(null);
  const tabAnim = useRef(new Animated.Value(1)).current;

  const isWork = form.report_type === 'work';
  const isFault = form.report_type === 'fault';

  const updateField = useCallback(<K extends keyof ReportFormData>(key: K, value: ReportFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const switchType = useCallback((type: 'work' | 'fault') => {
    setForm((prev) => ({
      ...INITIAL_FORM,
      technician_name: prev.technician_name,
      report_type: type,
      arrival_time: type === 'fault' ? formatCurrentTime() : '',
    }));
    Animated.spring(tabAnim, {
      toValue: type === 'work' ? 0 : 1,
      useNativeDriver: false,
      friction: 8,
    }).start();
    console.log('[Form] Switched to', type, 'report');
  }, [tabAnim]);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 5,
      });
      if (!result.canceled && result.assets) {
        const uris = result.assets.map((a) => a.uri);
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, ...uris].slice(0, 10),
        }));
      }
    } catch (error) {
      console.error('[Form] Image picker error:', error);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('שגיאה', 'נדרשת הרשאת מצלמה');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled && result.assets) {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, result.assets[0].uri].slice(0, 10),
        }));
      }
    } catch (error) {
      console.error('[Form] Camera error:', error);
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.technician_name.trim()) {
      Alert.alert('שגיאה', 'נא למלא שם טכנאי');
      return;
    }
    if (!form.street.trim()) {
      Alert.alert('שגיאה', 'נא למלא רחוב');
      return;
    }
    if (isFault && !form.ticket.trim()) {
      Alert.alert('שגיאה', 'נא למלא מספר טיקט');
      return;
    }
    if (isWork && !form.work_type) {
      Alert.alert('שגיאה', 'נא לבחור סוג עבודה (ארון/קלוזר/תוספת)');
      return;
    }
    if (isFault && !form.fault_type) {
      Alert.alert('שגיאה', 'נא לבחור סוג תקלה');
      return;
    }

    let savedReport;
    try {
      savedReport = await addReport({
        ...form,
        username: user?.username ?? '',
      });
      console.log('[Form] Report saved successfully:', savedReport.id);
    } catch (error) {
      console.error('[Form] Save error:', error);
      Alert.alert('שגיאה', 'שמירת הדיווח נכשלה. נסה שנית.');
      return;
    }

    setForm({ ...INITIAL_FORM, technician_name: user?.name ?? '', report_type: 'fault', arrival_time: formatCurrentTime() });
    scrollRef.current?.scrollTo({ y: 0, animated: true });

    shareReportViaWhatsApp(savedReport).catch((e) => {
      console.warn('[Form] WhatsApp share failed (report was saved):', e);
    });

    Alert.alert('הצלחה', 'הדיווח נשמר בהצלחה', [
      {
        text: 'אישור',
        onPress: () => {
          router.push('/(tabs)/(reports)' as never);
        },
      },
    ]);
  }, [form, user, addReport, router, isFault, isWork]);

  const indicatorLeft = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['2%', '50%'],
  });

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.typeSelectorWrapper}>
        <View style={styles.typeSelector}>
          <Animated.View
            style={[
              styles.typeIndicator,
              { left: indicatorLeft, backgroundColor: isWork ? Colors.work : Colors.fault },
            ]}
          />
          <TouchableOpacity style={styles.typeTab} onPress={() => switchType('work')} activeOpacity={0.7}>
            <Wrench size={18} color={isWork ? Colors.white : Colors.work} />
            <Text style={[styles.typeTabText, isWork && styles.typeTabTextActive]}>עבודה</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.typeTab} onPress={() => switchType('fault')} activeOpacity={0.7}>
            <AlertTriangle size={18} color={isFault ? Colors.white : Colors.fault} />
            <Text style={[styles.typeTabText, isFault && styles.typeTabTextActive]}>תקלה</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MapPin size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>פרטים כלליים</Text>
        </View>
        <View style={styles.sectionCard}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>שם טכנאי *</Text>
            <TextInput
              style={styles.textInput}
              value={form.technician_name}
              onChangeText={(v) => updateField('technician_name', v)}
              placeholder="הכנס שם טכנאי"
              placeholderTextColor={Colors.textLight}
              textAlign="right"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>רחוב *</Text>
            <TextInput
              style={styles.textInput}
              value={form.street}
              onChangeText={(v) => updateField('street', v)}
              placeholder="הכנס שם רחוב"
              placeholderTextColor={Colors.textLight}
              textAlign="right"
            />
          </View>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>עיר</Text>
            <TextInput
              style={styles.textInput}
              value={form.city}
              onChangeText={(v) => updateField('city', v)}
              placeholder="הכנס עיר"
              placeholderTextColor={Colors.textLight}
              textAlign="right"
            />
          </View>
          {isFault && (
            <View style={styles.fieldContainer}>
              <Text style={[styles.fieldLabel, styles.requiredField]}>טיקט *</Text>
              <TextInput
                style={[styles.textInput, styles.ticketInput]}
                value={form.ticket}
                onChangeText={(v) => updateField('ticket', v)}
                placeholder="מספר טיקט (חובה)"
                placeholderTextColor={Colors.textLight}
                textAlign="right"
              />
            </View>
          )}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>מספר מפה</Text>
            <TextInput
              style={styles.textInput}
              value={form.map_number}
              onChangeText={(v) => updateField('map_number', v)}
              placeholder="מספר מפה"
              placeholderTextColor={Colors.textLight}
              textAlign="right"
            />
          </View>
          {isFault && (
            <View style={styles.arrivalRow}>
              <Text style={styles.arrivalLabel}>הגעה:</Text>
              <Text style={styles.arrivalTime}>{form.arrival_time || formatCurrentTime()}</Text>
            </View>
          )}
        </View>
      </View>

      {isWork && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wrench size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>סוג עבודה</Text>
          </View>
          <View style={styles.sectionCard}>
            <SegmentButtons
              options={WORK_TYPES}
              value={form.work_type}
              onChange={(v) => updateField('work_type', v)}
              activeColor={Colors.work}
              activeBg="#EBF5FF"
            />

            {form.work_type === 'cabinet' && (
              <View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>מספר ארון</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.cabinet_number}
                    onChangeText={(v) => updateField('cabinet_number', v)}
                    placeholder="מספר ארון"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                  />
                </View>
                <SplitterSelector
                  label="סוג מפצלים"
                  value={form.cabinet_splitters}
                  onChange={(v) => updateField('cabinet_splitters', v)}
                />
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>מיקום ארון</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.cabinet_location}
                    onChangeText={(v) => updateField('cabinet_location', v)}
                    placeholder="מיקום ארון"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                  />
                </View>
              </View>
            )}

            {form.work_type === 'closure' && (
              <View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>מספר קלוזר</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.closure_number}
                    onChangeText={(v) => updateField('closure_number', v)}
                    placeholder="מספר קלוזר"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                  />
                </View>
                <SegmentButtons
                  label="גודל קלוזר"
                  options={CLOSURE_SIZES}
                  value={form.closure_size}
                  onChange={(v) => updateField('closure_size', v)}
                  activeColor={Colors.accent}
                  activeBg="#FFF7ED"
                  compact
                />
                <CableSelector
                  label="סוג כבלים"
                  value={form.closure_cables}
                  onChange={(v) => updateField('closure_cables', v)}
                />
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>ריתוכים</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.closure_welds}
                    onChangeText={(v) => updateField('closure_welds', v)}
                    placeholder="0"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                    keyboardType="number-pad"
                  />
                </View>
                <SplitterSelector
                  label="סוג מפצלים"
                  value={form.closure_splitters}
                  onChange={(v) => updateField('closure_splitters', v)}
                />
              </View>
            )}

            {form.work_type === 'addition' && (
              <View>
                <SegmentButtons
                  label="סוג תוספת"
                  options={ADDITION_ACTIONS}
                  value={form.addition_action}
                  onChange={(v) => {
                    setForm((prev) => ({
                      ...prev,
                      addition_action: v,
                      addition_welds: '',
                      addition_cable_type: '',
                    }));
                  }}
                  activeColor={Colors.success}
                  activeBg="#DCFCE7"
                />

                {form.addition_action === 'cable_insert' && (
                  <View>
                    <SegmentButtons
                      label="סוג כבל"
                      options={[
                        { label: '12', value: '12' },
                        { label: '36', value: '36' },
                        { label: '72', value: '72' },
                        { label: '144', value: '144' },
                        { label: '288', value: '288' },
                      ]}
                      value={form.addition_cable_type}
                      onChange={(v) => updateField('addition_cable_type', v)}
                      activeColor={Colors.accent}
                      activeBg="#FFF7ED"
                      compact
                    />
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>ריתוכים</Text>
                      <TextInput
                        style={styles.textInput}
                        value={form.addition_welds}
                        onChangeText={(v) => updateField('addition_welds', v)}
                        placeholder="0"
                        placeholderTextColor={Colors.textLight}
                        textAlign="right"
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                )}

                {form.addition_action === 'weld_add' && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>ריתוכים</Text>
                    <TextInput
                      style={styles.textInput}
                      value={form.addition_welds}
                      onChangeText={(v) => updateField('addition_welds', v)}
                      placeholder="0"
                      placeholderTextColor={Colors.textLight}
                      textAlign="right"
                      keyboardType="number-pad"
                    />
                  </View>
                )}

                <SegmentButtons
                  label="יעד"
                  options={ADDITION_TARGETS}
                  value={form.addition_target}
                  onChange={(v) => updateField('addition_target', v)}
                  activeColor={Colors.primary}
                  activeBg="#EBF5FF"
                  compact
                />
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>מספר</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.addition_number}
                    onChangeText={(v) => updateField('addition_number', v)}
                    placeholder="מספר"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                  />
                </View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>לטובת ארון</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.addition_for_cabinet}
                    onChangeText={(v) => updateField('addition_for_cabinet', v)}
                    placeholder="לטובת ארון"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {isFault && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Zap size={18} color={Colors.fault} />
            <Text style={styles.sectionTitle}>סוג תקלה</Text>
          </View>
          <View style={styles.sectionCard}>
            <SegmentButtons
              options={FAULT_TYPES}
              value={form.fault_type}
              onChange={(v) => {
                setForm((prev) => ({
                  ...prev,
                  fault_type: v,
                  cabinet_damage_sub: '',
                  fault_splitters: [],
                  fault_welds: '',
                  fault_openings: '',
                  fiber_openings: '',
                  fiber_welds: '',
                  fiber_otdr: '',
                  cable_openings: '',
                  cable_welds: '',
                  cable_otdr: '',
                  cable_type: '',
                  cable_length: '',
                  cable_from: '',
                  cable_to: '',
                  infra_openings: '',
                  infra_welds: '',
                  infra_cable_opening: '',
                }));
              }}
              activeColor={Colors.fault}
              activeBg="#FEF2F2"
            />

            {form.fault_type === 'empty' && (
              <View style={[styles.infoBox, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
                <Text style={[styles.infoBoxText, { color: '#166534' }]}>סרק - עוצמות תקינות</Text>
              </View>
            )}

            {form.fault_type === 'cabinet_damage' && (
              <View>
                <SegmentButtons
                  label="סוג נזק"
                  options={CABINET_DAMAGE_SUB_TYPES}
                  value={form.cabinet_damage_sub}
                  onChange={(v) => updateField('cabinet_damage_sub', v)}
                  activeColor={Colors.fault}
                  activeBg="#FEF2F2"
                  compact
                />

                {form.cabinet_damage_sub === 'broken_splitter' && (
                  <SplitterSelector
                    label="סוג מפצלים"
                    value={form.fault_splitters}
                    onChange={(v) => updateField('fault_splitters', v)}
                  />
                )}

                {form.cabinet_damage_sub === 'cable_pulled' && (
                  <View>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoBoxText}>פתיחת כבל 12 -1</Text>
                      <Text style={styles.infoBoxText}>פתיחה -1</Text>
                    </View>
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>ריתוכים</Text>
                      <TextInput
                        style={styles.textInput}
                        value={form.fault_welds}
                        onChangeText={(v) => updateField('fault_welds', v)}
                        placeholder="0"
                        placeholderTextColor={Colors.textLight}
                        textAlign="right"
                        keyboardType="number-pad"
                      />
                    </View>
                  </View>
                )}

                {form.cabinet_damage_sub === 'broken_weld' && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxText}>נזק פנימי</Text>
                  </View>
                )}
              </View>
            )}

            {form.fault_type === 'broken_fiber' && (
              <View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>פתיחת קלוזר</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.fiber_openings}
                    onChangeText={(v) => updateField('fiber_openings', v)}
                    placeholder="מספר פתיחות"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                    keyboardType="number-pad"
                  />
                </View>
                {form.fiber_openings !== '' && (
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxText}>
                      {parseInt(form.fiber_openings, 10) >= 2 ? 'נזק חיצוני' : 'נזק פנימי'}
                    </Text>
                  </View>
                )}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>ריתוכים</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.fiber_welds}
                    onChangeText={(v) => updateField('fiber_welds', v)}
                    placeholder="0"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>OTDR</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.fiber_otdr}
                    onChangeText={(v) => updateField('fiber_otdr', v)}
                    placeholder="OTDR"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                  />
                </View>
              </View>
            )}

            {form.fault_type === 'cable_replace' && (
              <View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>פתיחות</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.cable_openings}
                    onChangeText={(v) => updateField('cable_openings', v)}
                    placeholder="0"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>ריתוכים</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.cable_welds}
                    onChangeText={(v) => updateField('cable_welds', v)}
                    placeholder="0"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>OTDR</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.cable_otdr}
                    onChangeText={(v) => updateField('cable_otdr', v)}
                    placeholder="OTDR"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                  />
                </View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>סוג כבל</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.cable_type}
                    onChangeText={(v) => updateField('cable_type', v)}
                    placeholder="סוג כבל"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                  />
                </View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>אורך הכבל</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.cable_length}
                    onChangeText={(v) => updateField('cable_length', v)}
                    placeholder="אורך"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                  />
                </View>
                <View style={styles.rowFields}>
                  <View style={styles.halfField}>
                    <Text style={styles.fieldLabel}>מאיפה</Text>
                    <TextInput
                      style={styles.textInput}
                      value={form.cable_from}
                      onChangeText={(v) => updateField('cable_from', v)}
                      placeholder="מאיפה"
                      placeholderTextColor={Colors.textLight}
                      textAlign="right"
                    />
                  </View>
                  <View style={styles.halfField}>
                    <Text style={styles.fieldLabel}>לאיפה</Text>
                    <TextInput
                      style={styles.textInput}
                      value={form.cable_to}
                      onChangeText={(v) => updateField('cable_to', v)}
                      placeholder="לאיפה"
                      placeholderTextColor={Colors.textLight}
                      textAlign="right"
                    />
                  </View>
                </View>
              </View>
            )}

            {form.fault_type === 'infrastructure_fix' && (
              <View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>פתיחות</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.infra_openings}
                    onChangeText={(v) => updateField('infra_openings', v)}
                    placeholder="0"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>ריתוכים</Text>
                  <TextInput
                    style={styles.textInput}
                    value={form.infra_welds}
                    onChangeText={(v) => updateField('infra_welds', v)}
                    placeholder="0"
                    placeholderTextColor={Colors.textLight}
                    textAlign="right"
                    keyboardType="number-pad"
                  />
                </View>
                <SegmentButtons
                  label="סוג כבל"
                  options={[
                    { label: '12', value: '12' },
                    { label: '36', value: '36' },
                    { label: '72', value: '72' },
                    { label: '144', value: '144' },
                    { label: '288', value: '288' },
                  ]}
                  value={form.infra_cable_type}
                  onChange={(v) => updateField('infra_cable_type', v)}
                  activeColor={Colors.accent}
                  activeBg="#FFF7ED"
                  compact
                />
              </View>
            )}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <StickyNote size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}>הערות ותמונות</Text>
        </View>
        <View style={styles.sectionCard}>
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>הערות</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={form.note}
              onChangeText={(v) => updateField('note', v)}
              placeholder="הערות נוספות..."
              placeholderTextColor={Colors.textLight}
              textAlign="right"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <ImagePlus size={20} color={Colors.primary} />
              <Text style={styles.imageButtonText}>גלריה</Text>
            </TouchableOpacity>
            {Platform.OS !== 'web' && (
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Camera size={20} color={Colors.primary} />
                <Text style={styles.imageButtonText}>צלם</Text>
              </TouchableOpacity>
            )}
          </View>
          {form.images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesPreview}>
              {form.images.map((uri, index) => (
                <View key={`img-${index}`} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={() => removeImage(index)}>
                    <X size={14} color={Colors.white} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          isAdding && styles.submitButtonDisabled,
          isFault && styles.submitButtonFault,
        ]}
        onPress={handleSubmit}
        disabled={isAdding}
        activeOpacity={0.8}
        testID="submit-report"
      >
        {isAdding ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <>
            <Send size={20} color={Colors.white} />
            <Text style={styles.submitText}>
              {isWork ? 'שלח דיווח עבודה' : 'שלח דיווח תקלה'}
            </Text>
          </>
        )}
      </TouchableOpacity>

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
  typeSelectorWrapper: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  typeIndicator: {
    position: 'absolute' as const,
    top: 4,
    bottom: 4,
    width: '48%',
    borderRadius: 11,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    zIndex: 1,
  },
  typeTabText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  typeTabTextActive: {
    color: Colors.white,
  },
  section: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 8,
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
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
    textAlign: 'right',
  },
  requiredField: {
    color: Colors.fault,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    backgroundColor: Colors.inputBg,
  },
  ticketInput: {
    borderColor: Colors.fault,
    borderWidth: 1.5,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 12,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
    marginBottom: 14,
  },
  arrivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    marginTop: 4,
  },
  arrivalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  arrivalTime: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.success,
  },
  infoBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  infoBoxText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#92400E',
    textAlign: 'right',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderStyle: 'dashed',
    gap: 6,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  imagesPreview: {
    marginTop: 4,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.work,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    shadowColor: Colors.work,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  submitButtonFault: {
    backgroundColor: Colors.fault,
    shadowColor: Colors.fault,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.white,
  },
  bottomSpacer: {
    height: 40,
  },
});
