import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { HeroWave } from '../components/HeroWave';
import { LegalDocument } from '../components/LegalDocument';
import { LoginHeroBackground } from '../components/LoginHeroBackground';
import { LoginHeroScene } from '../components/LoginHeroScene';
import { PRIVACY_POLICY, TERMS_OF_USE } from '../content/legal';
import { useAuthStore } from '../context/useAuthStore';
import { useResponsiveContent } from '../hooks/useResponsiveContent';
import { sendPasswordReset } from '../services/adminApi';
import { colors, monoFontFamily, nunitoFontFamily, radius, spacing, typography } from '../theme';
import { showAlert } from '../utils/alert';

// Paleta "mar ao amanhecer" usada só no hero desta tela (ver mockup de
// design) — o resto do app mantém o teal/areia padrão de `theme/colors.ts`.
const HERO = {
  shadowColor: '#0E0047',
  seaLight: '#2a9a89',
  sea: '#17756a',
  seaDeep: '#0b4a42',
  trailerText: '#8fe0d0',
  leadText: '#cdeae3',
  bronzeLight: '#d9a648',
  bronze: '#c68f34',
  bronzeDeep: '#9a6a1c',
  tabTrack: '#e7dcc4',
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
  const [resettingPassword, setResettingPassword] = useState(false);
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
  const heroHeight = mode === 'signup' && isShort ? 44 : isShort ? 60 : isCompact ? 80 : 108;
  const showDecor = mode === 'login' && !isShort;
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

  // Logo flutua suavemente sem parar — dá vida à tela sem disputar atenção
  // com o formulário.
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

  // Sem isso, quem esquece a senha (ou é o único admin da organização) fica
  // sem nenhuma forma de recuperar a conta — o reset de senha por um outro
  // admin (ver UserManagementScreen) só existe pra quem já está logado.
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Informe seu e-mail para recuperar a senha.');
      runShake();
      return;
    }
    setResettingPassword(true);
    try {
      await sendPasswordReset(email);
      showAlert('E-mail enviado', `Enviamos um link de redefinição de senha para ${email.trim()}.`);
    } catch (err: any) {
      setError(err?.message ?? 'Não foi possível enviar o e-mail de redefinição.');
      runShake();
    } finally {
      setResettingPassword(false);
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
  const sheetStyle = {
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
        <ScrollView
          contentContainerStyle={[styles.scroll, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.hero, isCompact && styles.heroCompact]}>
            <LoginHeroBackground />

            <Animated.View style={[styles.brandWrap, brandStyle]}>
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

              {showDecor && (
                <View style={styles.featureRow}>
                  {FEATURES.map((f) => (
                    <View key={f.label} style={styles.featureBadge}>
                      <Ionicons name={f.icon} size={13} color={HERO.leadText} />
                      <Text style={styles.featureBadgeText}>{f.label}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>

            {showDecor && <LoginHeroScene />}

            <HeroWave color={colors.background} />
          </View>

          <Animated.View style={sheetStyle}>
            <View style={[styles.sheet, isCompact && styles.sheetCompact]}>
              <View style={[styles.modeSwitch, isCompact && styles.modeSwitchCompact]}>
                <Animated.View style={[styles.modeIndicator, { left: indicatorLeft }]}>
                  <LinearGradient
                    colors={[HERO.bronzeLight, HERO.bronze, HERO.bronzeDeep]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </Animated.View>
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

              <Text style={[styles.sheetLabel, isCompact && styles.sheetLabelCompact]}>
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
                      color={focusedField === 'org' ? HERO.sea : colors.textMuted}
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
                      color={focusedField === 'name' ? HERO.sea : colors.textMuted}
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
                  color={focusedField === 'user' ? HERO.sea : colors.textMuted}
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
                  color={focusedField === 'pass' ? HERO.sea : colors.textMuted}
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

              {mode === 'login' && (
                <Pressable
                  hitSlop={8}
                  onPress={handleForgotPassword}
                  disabled={resettingPassword}
                  style={styles.forgotPasswordWrap}
                >
                  <Text style={styles.forgotPasswordText}>
                    {resettingPassword ? 'Enviando…' : 'Esqueceu a senha?'}
                  </Text>
                </Pressable>
              )}

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
                <LinearGradient
                  colors={[HERO.bronzeLight, HERO.bronze, HERO.bronzeDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
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
  scroll: {
    flexGrow: 1,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    backgroundColor: HERO.sea,
  },
  heroCompact: {
    paddingTop: spacing.lg,
  },
  brandWrap: {
    alignItems: 'center',
  },
  logoBadge: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    shadowColor: HERO.shadowColor,
    shadowOpacity: 0.35,
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
    color: HERO.trailerText,
    letterSpacing: 4,
  },
  brandBig: {
    ...typography.display,
    fontSize: 30,
    color: colors.white,
    letterSpacing: 1,
    marginTop: 2,
  },
  brandSub: {
    ...typography.h3,
    fontFamily: nunitoFontFamily.extraBold,
    color: colors.white,
    marginTop: spacing.sm,
  },
  brandIntro: {
    ...typography.bodySm,
    color: HERO.leadText,
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
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  featureBadgeText: {
    ...typography.caption,
    fontFamily: nunitoFontFamily.bold,
    color: '#eafaf6',
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginTop: -18,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetCompact: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  modeSwitch: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: HERO.tabTrack,
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
    overflow: 'hidden',
    shadowColor: HERO.bronzeDeep,
    shadowOpacity: 0.35,
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
  sheetLabel: {
    ...typography.caption,
    fontFamily: monoFontFamily,
    letterSpacing: 2.5,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  sheetLabelCompact: {
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
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 50,
    gap: spacing.xs,
  },
  inputWrapCompact: {
    height: 44,
  },
  inputWrapFocused: {
    borderColor: HERO.sea,
  },
  input: {
    flex: 1,
    ...typography.bodyLg,
    color: colors.textPrimary,
    height: '100%',
  },
  forgotPasswordWrap: {
    alignSelf: 'flex-end',
    marginTop: spacing.xs,
  },
  forgotPasswordText: {
    ...typography.bodySm,
    color: HERO.sea,
    fontFamily: nunitoFontFamily.bold,
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
    borderRadius: radius.lg,
    height: 54,
    marginTop: spacing.xl,
    overflow: 'hidden',
    shadowColor: HERO.bronzeDeep,
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
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
    color: HERO.sea,
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
