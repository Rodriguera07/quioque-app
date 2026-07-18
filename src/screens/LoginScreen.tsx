import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { useAuthStore } from '../context/useAuthStore';
import { colors, radius, spacing, typography } from '../theme';

export function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'user' | 'pass' | null>(null);

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

  const handleLogin = () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Preencha usuário e senha.');
      runShake();
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const ok = login(username, password);
      setLoading(false);
      if (!ok) {
        setError('Usuário ou senha inválidos.');
        runShake();
      }
    }, 350);
  };

  const brandStyle = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
    ],
  };
  const formStyle = {
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
      <LinearGradient
        colors={[colors.backgroundAlt, colors.background, colors.background]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.flex}
      >
        <View pointerEvents="none" style={styles.glowTop}>
          <LinearGradient
            colors={[colors.primaryGlow, 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.glowCircle}
          />
        </View>
        <View pointerEvents="none" style={styles.glowBottom}>
          <LinearGradient
            colors={[colors.coralGlow, 'transparent']}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0 }}
            style={styles.glowCircle}
          />
        </View>

        <View style={styles.container}>
          <Animated.View style={[styles.brandWrap, brandStyle]}>
            <View style={styles.logoRing}>
              <LinearGradient
                colors={[colors.emerald, colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoCircle}
              >
                <Ionicons name="storefront" size={32} color={colors.textInverse} />
              </LinearGradient>
            </View>
            <Text style={styles.brand}>Quiosque PDV</Text>
            <View style={styles.brandBadge}>
              <View style={styles.brandBadgeDot} />
              <Text style={styles.brandSub}>Painel de gestão do gerente</Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.form, formStyle]}>
            <LinearGradient
              colors={[colors.borderLight, colors.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.formBorder}
            >
              <View style={styles.formInner}>
                <Text style={styles.fieldLabel}>USUÁRIO</Text>
                <View
                  style={[
                    styles.inputWrap,
                    focusedField === 'user' && styles.inputWrapFocused,
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={focusedField === 'user' ? colors.primary : colors.textMuted}
                  />
                  <TextInput
                    value={username}
                    onChangeText={(v) => {
                      setUsername(v);
                      if (error) setError('');
                    }}
                    onFocus={() => setFocusedField('user')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="admin"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    returnKeyType="next"
                  />
                </View>

                <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>SENHA</Text>
                <View
                  style={[
                    styles.inputWrap,
                    focusedField === 'pass' && styles.inputWrapFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={focusedField === 'pass' ? colors.primary : colors.textMuted}
                  />
                  <TextInput
                    value={password}
                    onChangeText={(v) => {
                      setPassword(v);
                      if (error) setError('');
                    }}
                    onFocus={() => setFocusedField('pass')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    onSubmitEditing={handleLogin}
                    returnKeyType="go"
                  />
                  <Pressable
                    hitSlop={10}
                    onPress={() => setShowPassword((v) => !v)}
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={15} color={colors.danger} />
                    <Text style={styles.error}>{error}</Text>
                  </View>
                ) : null}

                <View style={{ marginTop: spacing.xl }}>
                  <Button
                    label="Entrar"
                    size="lg"
                    onPress={handleLogin}
                    loading={loading}
                    icon={<Ionicons name="log-in-outline" size={20} color={colors.white} />}
                  />
                </View>
              </View>
            </LinearGradient>

            <View style={styles.hintPill}>
              <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
              <Text style={styles.hint}>Credenciais de teste: admin / admin123</Text>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  glowTop: {
    position: 'absolute',
    top: -140,
    right: -100,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -160,
    left: -120,
  },
  glowCircle: {
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.emerald,
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  brand: {
    ...typography.display,
    fontSize: 28,
    color: colors.textPrimary,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  brandBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },
  brandSub: {
    ...typography.body,
    color: colors.textMuted,
  },
  form: {},
  formBorder: {
    borderRadius: radius.xl + 1,
    padding: 1,
  },
  formInner: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
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
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    height: 50,
    gap: spacing.xs,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
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
    marginTop: spacing.sm,
  },
  error: {
    ...typography.bodySm,
    color: colors.danger,
    flexShrink: 1,
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.lg,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
  },
});
