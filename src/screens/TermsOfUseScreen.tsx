import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { LegalDocument } from '../components/LegalDocument';
import { TERMS_OF_USE } from '../content/legal';
import { useResponsiveContent } from '../hooks/useResponsiveContent';
import { RootStackParamList } from '../navigation/types';
import { colors, shape, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'TermsOfUse'>;

export function TermsOfUseScreen({ navigation }: Props) {
  const { contentStyle } = useResponsiveContent();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <AnimatedPressable
          onPress={() => {
            navigation.goBack();
            navigation.dispatch(DrawerActions.openDrawer());
          }}
          style={styles.backBtn}
          stateLayerColor={colors.onSurface}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </AnimatedPressable>
        <Text style={styles.title}>Termo de Uso</Text>
        <View style={{ width: 36 }} />
      </View>

      <LegalDocument doc={TERMS_OF_USE} contentStyle={contentStyle} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: shape.full,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
  },
});
