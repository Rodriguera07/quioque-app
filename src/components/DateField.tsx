import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { colors, shape, spacing, typography } from '../theme';
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
      <AnimatedPressable
        style={styles.field}
        stateLayerColor={colors.onSurface}
        onPress={() => setOpen(true)}
      >
        <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
        <Text style={styles.text}>{formatDateLabel(value.toISOString())}</Text>
      </AnimatedPressable>
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
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: shape.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
  },
  text: {
    ...typography.bodySm,
    color: colors.textPrimary,
  },
});
