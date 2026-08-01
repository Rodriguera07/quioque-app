import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { LegalDocument } from '../components/LegalDocument';
import { PRIVACY_POLICY, TERMS_OF_USE } from '../content/legal';
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

// Cores extraídas do próprio logo (ver assets/icon.png), só usadas aqui na
// tela de login — o resto do app mantém o teal/areia do tema.
const HERO = {
  shadowColor: '#0E0047',
  brandBlue: '#1F7BFF',
};

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'flash-outline', label: 'Tempo real' },
  { icon: 'bar-chart-outline', label: 'Relatórios' },
  { icon: 'people-outline', label: 'Equipe' },
];

const WELCOME_COPY: Record<Mode, { title: string; subtitle: string }> = {
  login: {
    title: 'Bem-vindo de volta',
    subtitle: 'Entre para acompanhar mesas, vendas e sua equipe em tempo real.',
  },
  signup: {
    title: 'Vamos começar',
    subtitle: 'Crie sua conta e organize seu quiosque em poucos minutos.',
  },
};

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
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);
  const { contentStyle } = useResponsiveContent(440);

  // Cadastro tem mais campos que login (nome do quiosque + nome do
  // responsável), então precisa de mais espaço vertical — a ilustração e os
  // selos decorativos cedem lugar ao formulário antes, e mais cedo, do que no
  // login. Em telas baixas (celulares menores), ambos os modos comprimem
  // ainda mais para caber sem rolagem antes do teclado abrir.
  const { height: windowHeight } = useWindowDimensions();
  const isShort = windowHeight < 900;
  const isCompact = isShort || mode === 'signup';
  // Cadastro + tela baixa é a combinação mais apertada (4 campos + selo) —
  // encolhe o selo ainda mais só nesse caso pra sobrar espaço pro formulário.
  const heroHeight = mode === 'signup' && isShort ? 44 : isShort ? 60 : isCompact ? 80 : 132;
  const showFeatures = mode === 'login' && !isShort;
  const showIntro = !(mode === 'signup' && isShort);
  const fieldGapStyle = { marginTop: isCompact ? spacing.xs : spacing.md };

  const enter = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const heroFloat = useRef(new Animated.Value(0)).current;
  const introFade = useRef(new Animated.Value(0)).current;
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 650,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  // Ilustração do topo flutua suavemente sem parar — dá vida à tela sem
  // disputar atenção com o formulário.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(heroFloat, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [heroFloat]);

  // Saudação e indicador da aba reagem à troca de modo (login/cadastro) com
  // um leve fade e um pill que desliza, em vez de trocar de estado seco.
  useEffect(() => {
    introFade.setValue(0);
    Animated.timing(introFade, { toValue: 1, duration: 380, useNativeDriver: true }).start();
  }, [mode, introFade]);

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: mode === 'login' ? 0 : 1,
      useNativeDriver: false,
      speed: 16,
      bounciness: 8,
    }).start();
  }, [mode, indicatorAnim]);

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
  const heroFloatY = heroFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const indicatorLeft = indicatorAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '50%'] });
  const welcome = WELCOME_COPY[mode];

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
          contentContainerStyle={[styles.container, isCompact && styles.containerCompact, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.brandWrap, isCompact && styles.brandWrapCompact, brandStyle]}>
            <Animated.View
              style={[
                styles.logoBadge,
                { width: heroHeight, height: heroHeight, transform: [{ translateY: heroFloatY }] },
              ]}
            >
              <Image
                source={require('../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </Animated.View>

            <Text style={styles.brandTiny}>TRAILER</Text>
            <Text style={styles.brandBig}>MAR AZUL</Text>

            <Animated.View style={{ opacity: introFade, alignItems: 'center' }}>
              <Text style={styles.brandSub}>{welcome.title}</Text>
              {showIntro && <Text style={styles.brandIntro}>{welcome.subtitle}</Text>}
            </Animated.View>

            {showFeatures && (
              <View style={styles.featureRow}>
                {FEATURES.map((f) => (
                  <View key={f.label} style={styles.featureBadge}>
                    <Ionicons name={f.icon} size={13} color={colors.emerald} />
                    <Text style={styles.featureBadgeText}>{f.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>

          <Animated.View style={cardStyle}>
            <View style={[styles.card, isCompact && styles.cardCompact]}>
              <View style={[styles.modeSwitch, isCompact && styles.modeSwitchCompact]}>
                <Animated.View style={[styles.modeIndicator, { left: indicatorLeft }]} />
                <AnimatedPressable style={styles.modeTab} onPress={() => switchMode('login')}>
                  <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                    Entrar
                  </Text>
                </AnimatedPressable>
                <AnimatedPressable style={styles.modeTab} onPress={() => switchMode('signup')}>
                  <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                    Cadastrar
                  </Text>
                </AnimatedPressable>
              </View>

              <Text style={[styles.cardLabel, isCompact && styles.cardLabelCompact]}>
                {mode === 'login' ? 'ACESSO AO CAIXA' : 'CRIAR CONTA DO QUIOSQUE'}
              </Text>

              {mode === 'signup' && (
                <>
                  <Text style={styles.fieldLabel}>NOME DO QUIOSQUE</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      isCompact && styles.inputWrapCompact,
                      focusedField === 'org' && styles.inputWrapFocused,
                    ]}
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

                  <Text style={[styles.fieldLabel, fieldGapStyle]}>SEU NOME</Text>
                  <View
                    style={[
                      styles.inputWrap,
                      isCompact && styles.inputWrapCompact,
                      focusedField === 'name' && styles.inputWrapFocused,
                    ]}
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

              <Text style={[styles.fieldLabel, mode === 'signup' && fieldGapStyle]}>
                E-MAIL
              </Text>
              <View
                style={[
                  styles.inputWrap,
                  isCompact && styles.inputWrapCompact,
                  focusedField === 'user' && styles.inputWrapFocused,
                ]}
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

              <Text style={[styles.fieldLabel, fieldGapStyle]}>SENHA</Text>
              <View
                style={[
                  styles.inputWrap,
                  isCompact && styles.inputWrapCompact,
                  focusedField === 'pass' && styles.inputWrapFocused,
                ]}
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

              <AnimatedPressable
                style={[styles.enterBtn, isCompact && styles.enterBtnCompact]}
                onPress={handleSubmit}
                disabled={loading}
              >
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

              <Text style={[styles.legalText, isCompact && styles.legalTextCompact]}>
                Ao continuar, você concorda com o{' '}
                <Text style={styles.legalLink} onPress={() => setLegalDoc('terms')}>
                  Termo de Uso
                </Text>{' '}
                e a{' '}
                <Text style={styles.legalLink} onPress={() => setLegalDoc('privacy')}>
                  Política de Privacidade
                </Text>
                .
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        <Modal
          visible={legalDoc !== null}
          animationType="slide"
          onRequestClose={() => setLegalDoc(null)}
        >
          <SafeAreaView style={styles.flex} edges={['top', 'left', 'right', 'bottom']}>
            <View style={styles.legalModalHeader}>
              <Text style={styles.legalModalTitle}>
                {legalDoc === 'privacy' ? PRIVACY_POLICY.title : TERMS_OF_USE.title}
              </Text>
              <TouchableOpacity
                onPress={() => setLegalDoc(null)}
                style={styles.legalCloseBtn}
                accessibilityLabel="Fechar"
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            {legalDoc ? (
              <LegalDocument doc={legalDoc === 'privacy' ? PRIVACY_POLICY : TERMS_OF_USE} />
            ) : null}
          </SafeAreaView>
        </Modal>
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
    paddingVertical: spacing.lg,
  },
  containerCompact: {
    paddingVertical: spacing.md,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  brandWrapCompact: {
    marginBottom: spacing.md,
  },
  logoBadge: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    shadowColor: HERO.shadowColor,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginBottom: spacing.md,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandTiny: {
    ...typography.label,
    color: colors.emerald,
    letterSpacing: 4,
  },
  brandBig: {
    ...typography.display,
    fontSize: 32,
    color: HERO.brandBlue,
    letterSpacing: 1,
    marginTop: 2,
  },
  brandSub: {
    ...typography.h3,
    fontFamily: nunitoFontFamily.extraBold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  brandIntro: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 3,
    maxWidth: 300,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.emeraldMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  featureBadgeText: {
    ...typography.caption,
    fontFamily: nunitoFontFamily.bold,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    shadowColor: HERO.shadowColor,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  cardCompact: {
    padding: spacing.sm,
    paddingBottom: spacing.md,
  },
  modeSwitch: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.full,
    padding: 4,
    marginBottom: spacing.lg,
  },
  modeSwitchCompact: {
    marginBottom: spacing.sm,
  },
  modeIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '50%',
    borderRadius: radius.full,
    backgroundColor: colors.sand,
    shadowColor: colors.sand,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modeTab: {
    flex: 1,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignItems: 'center',
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
  cardLabelCompact: {
    marginBottom: spacing.sm,
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
  inputWrapCompact: {
    height: 44,
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
  enterBtnCompact: {
    height: 48,
    marginTop: spacing.md,
  },
  enterBtnText: {
    ...typography.h3,
    color: colors.textInverse,
  },
  legalText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: spacing.md,
  },
  legalTextCompact: {
    marginTop: spacing.xs,
  },
  legalLink: {
    color: colors.primary,
    fontFamily: nunitoFontFamily.bold,
  },
  legalModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  legalModalTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  legalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
