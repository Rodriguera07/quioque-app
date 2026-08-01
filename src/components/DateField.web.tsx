import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, nunitoFontFamily, radius, spacing, typography } from '../theme';

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  maximumDate?: Date;
};

// `@react-native-community/datetimepicker` não tem build web (só existe o
// módulo nativo), então no web usamos o <input type="date"> do próprio
// Safari/iOS — que já abre como um seletor de roda nativo e otimizado para
// toque, sem precisarmos reimplementar um calendário.
function toInputValue(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DateField({ value, onChange, maximumDate }: Props) {
  return (
    <View style={styles.field}>
      <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
      <input
        type="date"
        value={toInputValue(value)}
        max={maximumDate ? toInputValue(maximumDate) : undefined}
        onChange={(event) => {
          const [y, m, d] = event.target.value.split('-').map(Number);
          if (y && m && d) onChange(new Date(y, m - 1, d));
        }}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          fontFamily: nunitoFontFamily.regular,
          fontSize: typography.bodySm.fontSize,
          color: colors.textPrimary,
          padding: 0,
        }}
      />
    </View>
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
    minHeight: 44,
  },
});
