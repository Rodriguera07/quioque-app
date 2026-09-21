import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { dashboardPalette } from '../theme/dashboardPalette';
import { colors, nunitoFontFamily, shape, spacing, typography } from '../theme';

interface Props {
  message?: string;
}

// Mesma paleta "mar ao amanhecer" do hero da tela de login (ver
// LoginHeroBackground) — reaproveitada aqui para que a transição
// abertura do app -> login -> painel pareça uma única cena, não telas soltas.
const SEA = {
  light: '#2a9a89',
  mid: '#17756a',
  deep: '#0b4a42',
  trailerText: '#8fe0d0',
  leadText: '#cdeae3',
};

function LoadingDots() {
  const anims = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const loops = anims.map((val, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(val, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 420,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay((2 - i) * 160),
        ])
      )
    );
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [anims]);

  return (
    <View style={styles.dotsRow}>
      {anims.map((val, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
              transform: [
                { translateY: val.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

// Tela de loading com a mesma linguagem visual do hero de login (gradiente
// "mar ao amanhecer" + selo do logo) — usada tanto na abertura do app
// (restaurando sessão / carregando fontes) quanto logo após o envio do
// login, pra evitar o corte seco de "formulário" direto pro painel.
export function LoadingScreen({ message = 'Carregando…' }: Props) {
  const float = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
  }, [fade]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [float]);

  const floatY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });

  return (
    <View style={styles.flex}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="loadingSea" cx="50%" cy="28%" r="85%">
            <Stop offset="0%" stopColor={SEA.light} />
            <Stop offset="45%" stopColor={SEA.mid} />
            <Stop offset="100%" stopColor={SEA.deep} />
          </RadialGradient>
          <RadialGradient id="loadingSun" cx="82%" cy="8%" r="55%">
            <Stop offset="0%" stopColor="#ec9a3f" stopOpacity={0.5} />
            <Stop offset="70%" stopColor="#ec9a3f" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill="url(#loadingSea)" />
        <Circle cx="85%" cy="6%" r="42%" fill="url(#loadingSun)" />
      </Svg>

      <Animated.View style={[styles.center, { opacity: fade }]}>
        <Animated.View style={[styles.logoBadge, { transform: [{ translateY: floatY }] }]}>
          <Image source={require('../../assets/icon.png')} style={styles.logoImage} resizeMode="cover" />
        </Animated.View>

        <Text style={styles.brandTiny}>TRAILER</Text>
        <Text style={styles.brandBig}>MAR AZUL</Text>

        <View style={styles.loaderWrap}>
          <LoadingDots />
          <Text style={styles.message}>{message}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: SEA.deep },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoBadge: {
    width: 84,
    height: 84,
    borderRadius: shape.extraLarge,
    overflow: 'hidden',
    shadowColor: '#0E0047',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    marginBottom: spacing.md,
  },
  logoImage: { width: '100%', height: '100%' },
  brandTiny: {
    ...typography.label,
    color: SEA.trailerText,
    letterSpacing: 4,
  },
  brandBig: {
    ...typography.display,
    fontSize: 28,
    color: colors.white,
    letterSpacing: 1,
    marginTop: 2,
  },
  loaderWrap: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: dashboardPalette.mint,
  },
  message: {
    ...typography.bodySm,
    fontFamily: nunitoFontFamily.semiBold,
    color: SEA.leadText,
    marginTop: spacing.xs,
  },
});
