import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Props {
  color?: string;
  opacity?: number;
}

// Linha ondulada decorativa (separa a área de destaque do cartão "Caixa do
// Dia" da faixa de mini-estatísticas). O viewBox tem uma única onda que se
// estica para preencher a largura real do cartão via preserveAspectRatio
// "none" — não precisa medir o container como o ReceiptTornEdge faz.
export function WaveDivider({ color = '#FFFFFF', opacity = 0.35 }: Props) {
  return (
    <View style={styles.wrap} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 10" preserveAspectRatio="none">
        <Path
          d="M0,5 C 12.5,10 12.5,0 25,5 C 37.5,10 37.5,0 50,5 C 62.5,10 62.5,0 75,5 C 87.5,10 87.5,0 100,5"
          stroke={color}
          strokeWidth={1.6}
          strokeOpacity={opacity}
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 10,
    width: '100%',
  },
});
