import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { formatDateLabel } from '../utils/format';

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
};

export function DateField({ value, onChange, maximumDate }: Props) {
  const [open, setOpen] = useState(false);

  const handleChange = (_event: unknown, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (selected) onChange(selected);
  };

  return (
    <>
      <TouchableOpacity style={styles.field} onPress={() => setOpen(true)}>
        <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
        <Text style={styles.text}>{formatDateLabel(value.toISOString())}</Text>
      </TouchableOpacity>
      {open && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleChange}
          maximumDate={maximumDate}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  text: {
    ...typography.bodySm,
    color: colors.textPrimary,
  },
});
