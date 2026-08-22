import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import {
  CaipirinhaIllustration,
  ChoppIllustration,
  CocoIllustration,
  FritasIllustration,
} from './LoginIllustrations';

const ITEMS = [
  { key: 'caipi', left: '4%', bottom: 0, delay: 0, Illustration: CaipirinhaIllustration, size: 68 },
  { key: 'chopp', left: '28%', bottom: 10, delay: 300, Illustration: ChoppIllustration, size: 62 },
  { key: 'fritas', left: '52%', bottom: -4, delay: 600, Illustration: FritasIllustration, size: 76 },
  { key: 'coco', left: '78%', bottom: 14, delay: 900, Illustration: CocoIllustration, size: 56 },
] as const;

function FloatingItem({
  left,
  bottom,
  delay,
  size,
  Illustration,
}: Omit<(typeof ITEMS)[number], 'key'>) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: 2300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 2300,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    const timer = setTimeout(() => loop.start(), delay);
    return () => {
      clearTimeout(timer);
      loop.stop();
    };
  }, [bob, delay]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const rotate = bob.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-1.5deg'] });

  return (
    <Animated.View
      style={[
        styles.item,
        { left, bottom, transform: [{ translateY }, { rotate }] },
      ]}
    >
      <Illustration size={size} />
    </Animated.View>
  );
}

// Cena decorativa com as bebidas/petiscos "flutuando" no rodapé do hero da
// tela de login — só aparece em telas altas no modo de login (ver
// `showDecor` em LoginScreen), pra não brigar por espaço com o formulário.
export function LoginHeroScene() {
  return (
    <View style={styles.scene} pointerEvents="none">
      {ITEMS.map(({ key, ...item }) => (
        <FloatingItem key={key} {...item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    height: 92,
    marginTop: 8,
  },
  item: {
    position: 'absolute',
  },
});
