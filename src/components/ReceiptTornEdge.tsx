import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

const NOTCH_SIZE = 12;
const NOTCH_STEP = NOTCH_SIZE / 2; // cada notch avança metade da largura por causa da sobreposição

interface Props {
  color?: string;
}

export function ReceiptTornEdge({ color = colors.background }: Props) {
  const [width, setWidth] = useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    const measured = e.nativeEvent.layout.width;
    if (Math.abs(measured - width) > 1) setWidth(measured);
  };

  // Notches suficientes para cobrir a largura real do card, então funciona
  // igual em telefones estreitos e tablets largos (recalcula em rotação).
  const notchCount = width > 0 ? Math.ceil(width / NOTCH_STEP) + 1 : 30;

  return (
    <View style={styles.row} onLayout={handleLayout} pointerEvents="none">
      {Array.from({ length: notchCount }).map((_, i) => (
        <View key={i} style={[styles.notch, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    height: NOTCH_SIZE,
    marginLeft: -NOTCH_STEP,
    overflow: 'hidden',
  },
  notch: {
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    marginLeft: -NOTCH_STEP,
    transform: [{ rotate: '45deg' }],
  },
});
