import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  fill?: string;
  stroke?: string;
}

// "Waterline" decorativa do cartão "Caixa do Dia": uma faixa escura (efeito
// de sombra da água) com uma linha de espuma clara por cima, estica para a
// largura real do cartão via preserveAspectRatio "none".
export function WaveDivider({ fill = 'rgba(0,0,0,0.12)', stroke = 'rgba(143,227,210,0.55)' }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 390 22" preserveAspectRatio="none">
        <Path
          d="M0,11 C40,3 70,19 110,11 C150,3 180,19 220,11 C260,3 290,19 330,11 C360,5 380,15 390,11 L390,22 L0,22 Z"
          fill={fill}
        />
        <Path
          d="M0,11 C40,3 70,19 110,11 C150,3 180,19 220,11 C260,3 290,19 330,11 C360,5 380,15 390,11"
          fill="none"
          stroke={stroke}
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 22,
    width: '100%',
  },
});
