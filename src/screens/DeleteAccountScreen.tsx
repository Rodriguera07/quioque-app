import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuthStore } from '../context/useAuthStore';
import { useResponsiveContent } from '../hooks/useResponsiveContent';
import { RootStackParamList } from '../navigation/types';
import { colors, nunitoFontFamily, radius, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DeleteAccount'>;

export function DeleteAccountScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const getRemainingAdminCount = useAuthStore((s) => s.getRemainingAdminCount);
  const { contentStyle } = useResponsiveContent(440);

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remainingAdmins, setRemainingAdmins] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    getRemainingAdminCount().then(setRemainingAdmins);
  }, [user?.role, getRemainingAdminCount]);

  const handleContinue = () => {
    setError('');
    if (!password) {
      setError('Digite sua senha para confirmar.');
      return;
    }
    setConfirmVisible(true);
  };

  const handleConfirmDelete = async () => {
    setSubmitting(true);
    const { ok, error: deleteError } = await deleteAccount(password);
    setSubmitting(false);
    if (!ok) {
      setConfirmVisible(false);
      setError(deleteError ?? 'Não foi possível excluir a conta.');
      return;
    }
    // Sucesso: o listener de auth derruba a sessão e o RootNavigator já
    // volta para a tela de login sozinho — nada a navegar aqui.
  };

  const willOrphanOrg = user?.role === 'admin' && remainingAdmins === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
            navigation.dispatch(DrawerActions.openDrawer());
          }}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Excluir Minha Conta</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.warnIconWrap}>
            <Ionicons name="warning-outline" size={26} color={colors.danger} />
          </View>

          <Text style={styles.lead}>
            Esta ação é permanente. Ao excluir sua conta, você perde o acesso ao app com este
            login e os seguintes dados são removidos:
          </Text>

          <View style={styles.list}>
            <ListRow text="Seu nome, e-mail e login de acesso" />
            <ListRow text="Seu vínculo com esta organização" />
          </View>

          <Text style={styles.leadKept}>O que é mantido, por exigência legal/fiscal:</Text>
          <View style={styles.list}>
            <ListRow text="Histórico de mesas e vendas já fechadas do estabelecimento" kept />
            <ListRow text="Registros de auditoria já gerados (sem vínculo de login ativo)" kept />
          </View>

          {willOrphanOrg && (
            <View style={styles.orphanWarning}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
              <Text style={styles.orphanWarningText}>
                Você é o único administrador desta organização. Depois de excluir sua conta,
                ninguém poderá gerenciar usuários, ver o log de auditoria ou fechar o dia.
              </Text>
            </View>
          )}

          <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>
            CONFIRME SUA SENHA PARA CONTINUAR
          </Text>
          <View style={styles.inputWrap}>
            <TextInput
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) setError('');
              }}
              placeholder="Sua senha atual"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleContinue}
              returnKeyType="go"
              style={styles.input}
            />
            <Pressable
              hitSlop={10}
              onPress={() => setShowPassword((v) => !v)}
              accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={17}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            label="Excluir minha conta"
            variant="danger"
            onPress={handleContinue}
            style={{ marginTop: spacing.lg }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmModal
        visible={confirmVisible}
        icon="trash-outline"
        iconColor={colors.danger}
        title="Excluir sua conta?"
        message="Essa ação não pode ser desfeita. Você será desconectado imediatamente."
        confirmLabel="Sim, excluir"
        destructive
        loading={submitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

function ListRow({ text, kept }: { text: string; kept?: boolean }) {
  return (
    <View style={styles.listRow}>
      <Ionicons
        name={kept ? 'checkmark-circle-outline' : 'close-circle-outline'}
        size={16}
        color={kept ? colors.emerald : colors.danger}
      />
      <Text style={styles.listRowText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  warnIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.dangerMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  lead: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  leadKept: {
    ...typography.bodySm,
    fontFamily: nunitoFontFamily.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.xxs,
  },
  list: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  listRowText: {
    ...typography.bodySm,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 19,
  },
  orphanWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginTop: spacing.lg,
  },
  orphanWarningText: {
    ...typography.bodySm,
    color: colors.danger,
    flex: 1,
    lineHeight: 19,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xxs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 46,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    height: '100%',
  },
  error: {
    ...typography.bodySm,
    color: colors.danger,
    marginTop: spacing.sm,
  },
});
