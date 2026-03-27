import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { SplitterItem } from '@/types/report';
import { SPLITTER_TYPES } from '@/constants/fieldOptions';

interface SplitterSelectorProps {
  value: SplitterItem[];
  onChange: (items: SplitterItem[]) => void;
  label?: string;
}

function SplitterSelectorComponent({ value, onChange, label }: SplitterSelectorProps) {
  const getQuantity = useCallback((type: string) => {
    return value.find((s) => s.type === type)?.quantity ?? 0;
  }, [value]);

  const isSelected = useCallback((type: string) => {
    return value.some((s) => s.type === type && s.quantity > 0);
  }, [value]);

  const updateQuantity = useCallback((type: string, delta: number) => {
    const existing = value.find((s) => s.type === type);
    const newQty = Math.max(0, (existing?.quantity ?? 0) + delta);

    if (newQty === 0) {
      onChange(value.filter((s) => s.type !== type));
    } else if (existing) {
      onChange(value.map((s) => s.type === type ? { ...s, quantity: newQty } : s));
    } else {
      onChange([...value, { type: type as SplitterItem['type'], quantity: newQty }]);
    }
  }, [value, onChange]);

  const setQuantity = useCallback((type: string, text: string) => {
    const num = parseInt(text, 10) || 0;
    if (num === 0) {
      onChange(value.filter((s) => s.type !== type));
    } else {
      const existing = value.find((s) => s.type === type);
      if (existing) {
        onChange(value.map((s) => s.type === type ? { ...s, quantity: num } : s));
      } else {
        onChange([...value, { type: type as SplitterItem['type'], quantity: num }]);
      }
    }
  }, [value, onChange]);

  const toggleType = useCallback((type: string) => {
    if (isSelected(type)) {
      onChange(value.filter((s) => s.type !== type));
    } else {
      onChange([...value, { type: type as SplitterItem['type'], quantity: 1 }]);
    }
  }, [value, onChange, isSelected]);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.chipsRow}>
        {SPLITTER_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, isSelected(type) && styles.chipActive]}
            onPress={() => toggleType(type)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isSelected(type) && styles.chipTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {value.filter((s) => s.quantity > 0).map((item) => (
        <View key={item.type} style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>PLC {item.type}</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => updateQuantity(item.type, -1)}
            >
              <Minus size={16} color={Colors.text} />
            </TouchableOpacity>
            <TextInput
              style={styles.stepperInput}
              value={String(item.quantity)}
              onChangeText={(t) => setQuantity(item.type, t)}
              keyboardType="number-pad"
              textAlign="center"
            />
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => updateQuantity(item.type, 1)}
            >
              <Plus size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

export const SplitterSelector = React.memo(SplitterSelectorComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textAlign: 'right',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    borderWidth: 1.5,
    borderColor: Colors.inputBorder,
  },
  chipActive: {
    backgroundColor: '#EBF5FF',
    borderColor: Colors.work,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.work,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    backgroundColor: Colors.inputBg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperInput: {
    width: 44,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingHorizontal: 4,
  },
});
