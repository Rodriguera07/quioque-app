import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { ReceiptTornEdge } from '../components/ReceiptTornEdge';
import { useAuthStore } from '../context/useAuthStore';
import { useResponsiveContent } from '../hooks/useResponsiveContent';
import { colors, monoFontFamily, nunitoFontFamily, radius, spacing, typography } from '../theme';

const AWNING_COLORS = [
  colors.danger,
  colors.surface,
  colors.emerald,
  colors.surface,
  colors.sand,
  colors.surface,
];

type Mode = 'login' | 'signup';

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const signUp = useAuthStore((s) => s.signUp);

  const [mode, setMode] = useState<Mode>('login');
  const [orgName, setOrgName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const { contentStyle } = useResponsiveContent(440);

  const enter = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const runShake = () => {
    shake.setValue(0);
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 1, duration: 55, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
  };

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Preencha e-mail e senha.');
      runShake();
      return;
    }
    setLoading(true);
    const { ok, error: loginError } = await login(email, password);
    setLoading(false);
    if (!ok) {
      setError(loginError ?? 'E-mail ou senha inválidos.');
      runShake();
    }
  };

  const handleSignUp = async () => {
    setError('');
    if (!orgName.trim() || !displayName.trim() || !email.trim() || !password.trim()) {
      setError('Preencha todos os campos.');
      runShake();
      return;
    }
    if (password.length < 6) {
      setError('A senha precisa ter ao menos 6 caracteres.');
      runShake();
      return;
    }
    setLoading(true);
    const { ok, error: signUpError } = await signUp({
      orgName,
      displayName,
      email,
      password,
    });
    setLoading(false);
    if (!ok) {
      setError(signUpError ?? 'Não foi possível criar a conta.');
      runShake();
    }
  };

  const handleSubmit = mode === 'login' ? handleLogin : handleSignUp;

  const brandStyle = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
    ],
  };
  const cardStyle = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
      { translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) },
    ],
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.awning}>
          {AWNING_COLORS.map((c, i) => (
            <View key={i} style={[styles.awningStripe, { backgroundColor: c }]} />
          ))}
        </View>

        <ScrollView
          contentContainerStyle={[styles.container, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.brandWrap, brandStyle]}>
            <Text style={styles.brandTop}>QUIOSQUE</Text>
            <View style={styles.brandBottomRow}>
              <View style={styles.brandLine} />
              <Text style={styles.brandBottom}>PDV</Text>
              <View style={styles.brandLine} />
            </View>
            <Text style={styles.brandSub}>Painel do gerente</Text>
          </Animated.View>

          <Animated.View style={cardStyle}>
            <View style={styles.card}>
              <View style={styles.modeSwitch}>
                <AnimatedPressable
                  style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
                  onPress={() => switchMode('login')}
                >
                  <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                    Entrar
                  </Text>
                </AnimatedPressable>
                <AnimatedPressable
                  style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
                  onPress={() => switchMode('signup')}
                >
                  <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                    Cadastrar
                  </Text>
                </AnimatedPressable>
              </View>

              <Text style={styles.cardLabel}>
                {mode === 'login' ? 'ACESSO AO CAIXA' : 'CRIAR CONTA DO QUIOSQUE'}
              </Text>

              {mode === 'signup' && (
                <>
                  <Text style={styles.fieldLabel}>NOME DO QUIOSQUE</Text>
                  <View
                    style={[styles.inputWrap, focusedField === 'org' && styles.inputWrapFocused]}
                  >
                    <Ionicons
                      name="storefront-outline"
                      size={17}
                      color={focusedField === 'org' ? colors.sand : colors.textMuted}
                    />
                    <TextInput
                      value={orgName}
                      onChangeText={(v) => {
                        setOrgName(v);
                        if (error) setError('');
                      }}
                      onFocus={() => setFocusedField('org')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Quiosque do Rodrigo"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      returnKeyType="next"
                    />
                  </View>

                  <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>SEU NOME</Text>
                  <View
                    style={[styles.inputWrap, focusedField === 'name' && styles.inputWrapFocused]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={17}
                      color={focusedField === 'name' ? colors.sand : colors.textMuted}
                    />
                    <TextInput
                      value={displayName}
                      onChangeText={(v) => {
                        setDisplayName(v);
                        if (error) setError('');
                      }}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Seu nome completo"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      returnKeyType="next"
                    />
                  </View>
                </>
              )}

              <Text style={[styles.fieldLabel, mode === 'signup' && { marginTop: spacing.md }]}>
                E-MAIL
              </Text>
              <View
                style={[styles.inputWrap, focusedField === 'user' && styles.inputWrapFocused]}
              >
                <Ionicons
                  name="mail-outline"
                  size={17}
                  color={focusedField === 'user' ? colors.sand : colors.textMuted}
                />
                <TextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (error) setError('');
                  }}
                  onFocus={() => setFocusedField('user')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="voce@quiosque.com"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={styles.input}
                  returnKeyType="next"
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>SENHA</Text>
              <View
                style={[styles.inputWrap, focusedField === 'pass' && styles.inputWrapFocused]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={17}
                  color={focusedField === 'pass' ? colors.sand : colors.textMuted}
                />
                <TextInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (error) setError('');
                  }}
                  onFocus={() => setFocusedField('pass')}
                  onBlur={() => setFocusedField(null)}
                  placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  onSubmitEditing={handleSubmit}
                  returnKeyType="go"
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

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={14} color={colors.danger} />
                  <Text style={styles.error}>{error}</Text>
                </View>
              ) : null}

              <AnimatedPressable style={styles.enterBtn} onPress={handleSubmit} disabled={loading}>
                <Text style={styles.enterBtnText}>
                  {loading
                    ? mode === 'login'
                      ? 'Entrando…'
                      : 'Criando conta…'
                    : mode === 'login'
                      ? 'Entrar'
                      : 'Criar conta'}
                </Text>
                {!loading ? (
                  <Ionicons name="arrow-forward" size={19} color={colors.textInverse} />
                ) : null}
              </AnimatedPressable>
            </View>
            <ReceiptTornEdge />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  awning: {
    flexDirection: 'row',
    height: 6,
  },
  awningStripe: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandTop: {
    ...typography.display,
    fontSize: 32,
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  brandBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  brandLine: {
    width: 36,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  brandBottom: {
    ...typography.display,
    fontSize: 32,
    color: colors.sand,
    letterSpacing: 2,
  },
  brandSub: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderBottomWidth: 0,
    borderRadius: radius.xxl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: spacing.lg,
  },
  modeSwitch: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.lg,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: colors.sand,
    shadowColor: colors.sand,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modeTabText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: colors.textInverse,
    fontFamily: nunitoFontFamily.bold,
  },
  cardLabel: {
    ...typography.caption,
    fontFamily: monoFontFamily,
    letterSpacing: 2.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: spacing.sm,
    height: 50,
    gap: spacing.xs,
  },
  inputWrapFocused: {
    borderColor: colors.sand,
  },
  input: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.textPrimary,
    height: '100%',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
  },
  error: {
    ...typography.bodySm,
    color: colors.danger,
    flexShrink: 1,
  },
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.sand,
    borderRadius: radius.lg,
    height: 54,
    marginTop: spacing.xl,
  },
  enterBtnText: {
    ...typography.h3,
    color: colors.textInverse,
  },
});
