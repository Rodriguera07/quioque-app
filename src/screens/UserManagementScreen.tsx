import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useAuthStore } from '../context/useAuthStore';
import { RootStackParamList } from '../navigation/types';
import { createOrgUser } from '../services/adminApi';
import { setOrgUserActive, subscribeOrgUsers } from '../services/firestoreOrg';
import { colors, radius, spacing, typography } from '../theme';
import { Role, UserProfile } from '../types';
import { showAlert } from '../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'UserManagement'>;

const ROLE_LABEL: Record<Role, string> = { admin: 'Administrador', staff: 'Equipe' };

export function UserManagementScreen({ navigation }: Props) {
  const orgId = useAuthStore((s) => s.user?.orgId ?? null);
  const currentUid = useAuthStore((s) => s.user?.uid);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('staff');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orgId) return;
    return subscribeOrgUsers(orgId, (data) => {
      setUsers([...data].sort((a, b) => a.displayName.localeCompare(b.displayName)));
    });
  }, [orgId]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('staff');
    setError('');
  };

  const handleCreate = async () => {
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Preencha nome, e-mail e senha.');
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter ao menos 6 caracteres.');
      return;
    }
    if (!orgId || !currentUid) return;
    setSubmitting(true);
    try {
      await createOrgUser({
        orgId,
        createdByUid: currentUid,
        displayName: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      resetForm();
      setShowForm(false);
      showAlert('Usuário cadastrado', `${name.trim()} já pode fazer login com o e-mail informado.`);
    } catch (err: any) {
      setError(err?.message ?? 'Não foi possível cadastrar o usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    if (!orgId) return;
    if (user.uid === currentUid) {
      showAlert('Ação não permitida', 'Você não pode desativar sua própria conta.');
      return;
    }
    try {
      await setOrgUserActive(orgId, user.uid, !user.active);
    } catch (err) {
      showAlert('Erro', 'Não foi possível atualizar o usuário. Tente novamente.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Gerenciar Usuários</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {showForm ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Novo usuário</Text>

              <Text style={styles.fieldLabel}>NOME</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nome completo"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>E-MAIL</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="pessoa@quiosque.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>SENHA PROVISÓRIA</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                style={styles.input}
              />

              <Text style={styles.fieldLabel}>PAPEL</Text>
              <View style={styles.roleRow}>
                {(['staff', 'admin'] as Role[]).map((r) => (
                  <AnimatedPressable
                    key={r}
                    style={[styles.roleChip, role === r && styles.roleChipActive]}
                    onPress={() => setRole(r)}
                  >
                    <Text style={[styles.roleChipText, role === r && styles.roleChipTextActive]}>
                      {ROLE_LABEL[r]}
                    </Text>
                  </AnimatedPressable>
                ))}
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.formActions}>
                <Button
                  label="Cancelar"
                  variant="ghost"
                  onPress={() => {
                    resetForm();
                    setShowForm(false);
                  }}
                  style={styles.formActionBtn}
                />
                <Button
                  label="Cadastrar"
                  variant="primary"
                  loading={submitting}
                  onPress={handleCreate}
                  style={styles.formActionBtn}
                />
              </View>
            </View>
          ) : (
            <AnimatedPressable style={styles.addBtn} onPress={() => setShowForm(true)}>
              <Ionicons name="person-add-outline" size={19} color={colors.textInverse} />
              <Text style={styles.addBtnText}>Novo usuário</Text>
            </AnimatedPressable>
          )}

          <Text style={styles.sectionTitle}>Equipe</Text>
          {users.length === 0 ? (
            <EmptyState icon="people-outline" title="Nenhum usuário cadastrado ainda" />
          ) : (
            <View style={styles.card}>
              {users.map((user, index) => (
                <View
                  key={user.uid}
                  style={[styles.row, index === users.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowName}>
                      {user.displayName}
                      {user.uid === currentUid ? ' (você)' : ''}
                    </Text>
                    <Text style={styles.rowEmail}>{user.email}</Text>
                    <View style={[styles.roleBadge, user.role === 'admin' && styles.roleBadgeAdmin]}>
                      <Text
                        style={[
                          styles.roleBadgeText,
                          user.role === 'admin' && styles.roleBadgeTextAdmin,
                        ]}
                      >
                        {ROLE_LABEL[user.role]}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    accessibilityLabel={user.active ? 'Desativar usuário' : 'Ativar usuário'}
                    value={user.active}
                    onValueChange={() => handleToggleActive(user)}
                    disabled={user.uid === currentUid}
                    trackColor={{ false: colors.surfaceHighlight, true: colors.emeraldMuted }}
                    thumbColor={user.active ? colors.emerald : colors.textMuted}
                  />
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  addBtnText: {
    ...typography.h3,
    color: colors.textInverse,
  },
  formCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  formTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  input: {
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 46,
    ...typography.body,
    color: colors.textPrimary,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  roleChip: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
  },
  roleChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  roleChipText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  roleChipTextActive: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  error: {
    ...typography.bodySm,
    color: colors.danger,
    marginTop: spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  formActionBtn: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 12,
    letterSpacing: 1.4,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowName: {
    ...typography.bodySm,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowEmail: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHighlight,
  },
  roleBadgeAdmin: {
    backgroundColor: colors.sandMuted,
  },
  roleBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  roleBadgeTextAdmin: {
    color: colors.sand,
  },
});
