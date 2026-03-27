import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { CableItem } from '@/types/report';
import { CABLE_TYPES } from '@/constants/fieldOptions';

interface CableSelectorProps {
  value: CableItem[];
  onChange: (items: CableItem[]) => void;
  label?: string;
}

function CableSelectorComponent({ value, onChange, label }: CableSelectorProps) {
  const getQuantity = useCallback((type: string) => {
    return value.find((c) => c.type === type)?.quantity ?? 0;
  }, [value]);

  const isSelected = useCallback((type: string) => {
    return value.some((c) => c.type === type && c.quantity > 0);
  }, [value]);

  const updateQuantity = useCallback((type: string, delta: number) => {
    const existing = value.find((c) => c.type === type);
    const newQty = Math.max(0, (existing?.quantity ?? 0) + delta);

    if (newQty === 0) {
      onChange(value.filter((c) => c.type !== type));
    } else if (existing) {
      onChange(value.map((c) => c.type === type ? { ...c, quantity: newQty } : c));
    } else {
      onChange([...value, { type: type as CableItem['type'], quantity: newQty }]);
    }
  }, [value, onChange]);

  const setQuantity = useCallback((type: string, text: string) => {
    const num = parseInt(text, 10) || 0;
    if (num === 0) {
      onChange(value.filter((c) => c.type !== type));
    } else {
      const existing = value.find((c) => c.type === type);
      if (existing) {
        onChange(value.map((c) => c.type === type ? { ...c, quantity: num } : c));
      } else {
        onChange([...value, { type: type as CableItem['type'], quantity: num }]);
      }
    }
  }, [value, onChange]);

  const toggleType = useCallback((type: string) => {
    if (isSelected(type)) {
      onChange(value.filter((c) => c.type !== type));
    } else {
      onChange([...value, { type: type as CableItem['type'], quantity: 1 }]);
    }
  }, [value, onChange, isSelected]);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.chipsRow}>
        {CABLE_TYPES.map((type) => (
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
      {value.filter((c) => c.quantity > 0).map((item) => (
        <View key={item.type} style={styles.quantityRow}>
          <Text style={styles.quantityLabel}>כבל {item.type}</Text>
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

export const CableSelector = React.memo(CableSelectorComponent);

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
    backgroundColor: '#FFF7ED',
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.accent,
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
