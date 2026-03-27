import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';

interface SegmentOption<T extends string> {
  label: string;
  value: T;
}

interface SegmentButtonsProps<T extends string> {
  options: SegmentOption<T>[];
  value: T | '';
  onChange: (value: T) => void;
  activeColor?: string;
  activeBg?: string;
  label?: string;
  compact?: boolean;
}

function SegmentButtonsInner<T extends string>({
  options,
  value,
  onChange,
  activeColor = Colors.work,
  activeBg = '#EBF5FF',
  label,
  compact,
}: SegmentButtonsProps<T>) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.row, compact && styles.rowCompact]}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.btn,
                compact && styles.btnCompact,
                active && { backgroundColor: activeBg, borderColor: activeColor },
              ]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.btnText,
                  compact && styles.btnTextCompact,
                  active && { color: activeColor },
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export const SegmentButtons = React.memo(SegmentButtonsInner) as typeof SegmentButtonsInner;

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  rowCompact: {
    gap: 6,
  },
  btn: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
  },
  btnCompact: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  btnTextCompact: {
    fontSize: 13,
  },
});
