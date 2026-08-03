import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { AuditEventType } from '../types';

export const AUDIT_EVENT_META: Record<
  AuditEventType,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; muted: string }
> = {
  login: { label: 'Login', icon: 'log-in-outline', color: colors.primary, muted: colors.primaryMuted },
  logout: { label: 'Logout', icon: 'log-out-outline', color: colors.textMuted, muted: colors.surfaceHighlight },
  table_opened: {
    label: 'Abriu mesa',
    icon: 'add-circle-outline',
    color: colors.emerald,
    muted: colors.emeraldMuted,
  },
  table_renamed: {
    label: 'Renomeou mesa',
    icon: 'create-outline',
    color: colors.sand,
    muted: colors.sandMuted,
  },
  items_added: {
    label: 'Adicionou itens',
    icon: 'fast-food-outline',
    color: colors.sand,
    muted: colors.sandMuted,
  },
  table_closed: {
    label: 'Fechou mesa',
    icon: 'checkmark-done-circle-outline',
    color: colors.primary,
    muted: colors.primaryMuted,
  },
  payment_recorded: {
    label: 'Registrou pagamento',
    icon: 'card-outline',
    color: colors.coral,
    muted: colors.coralMuted,
  },
  password_changed: {
    label: 'Alterou a senha',
    icon: 'key-outline',
    color: colors.primary,
    muted: colors.primaryMuted,
  },
  password_reset_requested: {
    label: 'Solicitou redefinição de senha',
    icon: 'mail-outline',
    color: colors.primary,
    muted: colors.primaryMuted,
  },
  account_deleted: {
    label: 'Excluiu a própria conta',
    icon: 'trash-outline',
    color: colors.danger,
    muted: colors.dangerMuted,
  },
  menu_updated: {
    label: 'Atualizou o cardápio',
    icon: 'fast-food-outline',
    color: colors.sand,
    muted: colors.sandMuted,
  },
};
