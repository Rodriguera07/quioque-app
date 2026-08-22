import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  color: string;
}

// Transição ondulada entre o hero (teal) e a folha (creme) da tela de
// login — duas cristas sobrepostas, a de trás mais translúcida, imitando
// espuma de onda batendo na areia.
export function HeroWave({ color }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 440 34" preserveAspectRatio="none">
        <Path d="M0 20Q55 6 110 20T220 20T330 20T440 20V34H0Z" fill={color} opacity={0.35} />
        <Path d="M0 26Q55 14 110 26T220 26T330 26T440 26V34H0Z" fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 26,
    width: '100%',
  },
});
