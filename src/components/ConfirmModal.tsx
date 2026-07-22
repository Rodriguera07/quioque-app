import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';
import { Button } from './Button';

interface Props {
  visible: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  message?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm?: () => void;
  onCancel: () => void;
}

// Modal de confirmação com a mesma linguagem visual do resto do app (cartão
// arredondado, ícone com fundo suave), usado no lugar do Alert nativo do SO
// nos fluxos mais importantes (ex.: encerrar o dia), que é visualmente cru
// e destoa do restante da interface.
export function ConfirmModal({
  visible,
  icon,
  iconColor = colors.primary,
  title,
  message,
  children,
  confirmLabel = 'OK',
  cancelLabel = 'Cancelar',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1F` }]}>
            <Ionicons name={icon} size={26} color={iconColor} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          {children}

          <View style={styles.actions}>
            {onConfirm && (
              <Button
                label={cancelLabel}
                variant="ghost"
                onPress={onCancel}
                disabled={loading}
                style={styles.actionBtn}
              />
            )}
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'emerald'}
              loading={loading}
              onPress={onConfirm ?? onCancel}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
  },
});
