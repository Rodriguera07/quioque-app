import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

const NOTCH_COUNT = 22;

interface Props {
  color?: string;
}

export function ReceiptTornEdge({ color = colors.background }: Props) {
  return (
    <View style={styles.row} pointerEvents="none">
      {Array.from({ length: NOTCH_COUNT }).map((_, i) => (
        <View key={i} style={[styles.notch, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    height: 12,
    marginLeft: -6,
    overflow: 'hidden',
  },
  notch: {
    width: 12,
    height: 12,
    marginLeft: -6,
    transform: [{ rotate: '45deg' }],
  },
});
