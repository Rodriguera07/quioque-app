import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, nunitoFontFamily, radius, spacing } from '../theme';

// Aviso de mensalidade do app: a assinatura vence todo dia 02. O card fica
// discreto na maior parte do mês e ganha urgência (cor + texto) conforme a
// data se aproxima, chega ou passa — sem exigir que o gerente vá procurar
// essa informação em outro lugar.
type Status = 'today' | 'overdue' | 'upcoming' | 'normal';

const DUE_DAY = 2;
const GRACE_DAYS = 5; // janela em que o aviso mostra "vencida há X dias"
const UPCOMING_DAYS = 5; // janela em que o aviso passa a contar os dias

function getMensalidadeStatus(now: Date): { status: Status; days: number } {
  const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = now.getDate();

  // Se ainda não passou do dia 02 deste mês, o próximo vencimento é este
  // mês; senão, já é o dia 02 do mês seguinte (o Date normaliza virada de
  // ano/mês sozinho).
  const nextDue =
    date <= DUE_DAY
      ? new Date(now.getFullYear(), now.getMonth(), DUE_DAY)
      : new Date(now.getFullYear(), now.getMonth() + 1, DUE_DAY);
  const prevDue =
    date <= DUE_DAY
      ? new Date(now.getFullYear(), now.getMonth() - 1, DUE_DAY)
      : new Date(now.getFullYear(), now.getMonth(), DUE_DAY);

  const daysUntilNext = Math.round((nextDue.getTime() - todayMid.getTime()) / 86400000);
  const daysSincePrev = Math.round((todayMid.getTime() - prevDue.getTime()) / 86400000);

  if (daysUntilNext === 0) return { status: 'today', days: 0 };
  if (daysSincePrev >= 1 && daysSincePrev <= GRACE_DAYS) return { status: 'overdue', days: daysSincePrev };
  if (daysUntilNext >= 1 && daysUntilNext <= UPCOMING_DAYS) return { status: 'upcoming', days: daysUntilNext };
  return { status: 'normal', days: 0 };
}

const STATUS_STYLE: Record<
  Status,
  { bg: string; iconBg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  today: { bg: colors.coralMuted, iconBg: colors.coral, fg: colors.coral, icon: 'alert-circle' },
  overdue: { bg: colors.coralMuted, iconBg: colors.coral, fg: colors.coral, icon: 'alert-circle' },
  upcoming: { bg: colors.sandMuted, iconBg: colors.sand, fg: colors.sand, icon: 'calendar' },
  normal: { bg: colors.primaryMuted, iconBg: colors.primary, fg: colors.primary, icon: 'calendar-outline' },
};

export function SubscriptionReminderBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { status, days } = getMensalidadeStatus(new Date());

  if (dismissed) return null;

  const style = STATUS_STYLE[status];

  const title =
    status === 'today'
      ? 'Mensalidade vence hoje'
      : status === 'overdue'
        ? `Mensalidade vencida há ${days} dia${days > 1 ? 's' : ''}`
        : status === 'upcoming'
          ? days === 1
            ? 'Mensalidade vence amanhã'
            : `Mensalidade vence em ${days} dias`
          : 'Mensalidade do aplicativo';

  const subtitle =
    status === 'today'
      ? 'Garanta o pagamento até o fim do dia para manter o app ativo sem interrupções.'
      : status === 'overdue'
        ? 'Regularize o quanto antes para evitar a suspensão do acesso.'
        : status === 'upcoming'
          ? 'O vencimento é sempre todo dia 02. Organize o pagamento com antecedência.'
          : 'Vencimento fixo todo dia 02 de cada mês.';

  return (
    <View style={[styles.card, { backgroundColor: style.bg }]}>
      <View style={[styles.iconWrap, { backgroundColor: style.iconBg }]}>
        <Ionicons name={style.icon} size={18} color={colors.white} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: style.fg }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Pressable
        style={styles.closeButton}
        accessibilityLabel="Dispensar aviso de mensalidade"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => setDismissed(true)}
      >
        <Ionicons name="close" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 13.5,
  },
  subtitle: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
    lineHeight: 15,
  },
  closeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
