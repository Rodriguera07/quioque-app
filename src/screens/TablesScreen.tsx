import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { BeachUmbrellaIcon } from '../components/BeachUmbrellaIcon';
import { TableCard } from '../components/TableCard';
import { getOpenTables, getTableCurrentTotal, usePosStore } from '../context/usePosStore';
import { useTick } from '../hooks/useTick';
import { useResponsiveContent, widthForColumns } from '../hooks/useResponsiveContent';
import { TabScreenProps } from '../navigation/types';
import { colors, elevationShadow, nunitoFontFamily, shape, spacing } from '../theme';
import { dashboardPalette } from '../theme/dashboardPalette';

type Props = TabScreenProps<'Mesas'>;

export function TablesScreen({ navigation }: Props) {
  useTick(30000); // mantém o tempo decorrido e a cor de urgência de cada mesa atualizados

  const { contentStyle, tableColumns } = useResponsiveContent();
  const tableCardWidth = widthForColumns(tableColumns);

  const tables = usePosStore((s) => s.tables);
  const openTables = getOpenTables(tables);
  const openTablesTotal = openTables.reduce((sum, t) => sum + getTableCurrentTotal(t), 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <AnimatedPressable
          style={styles.menuButton}
          stateLayerColor={colors.onPrimaryContainer}
          accessibilityLabel="Abrir menu"
          accessibilityRole="button"
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          <Ionicons name="menu" size={20} color={colors.onPrimaryContainer} />
        </AnimatedPressable>
        <Text style={styles.title}>Mesas</Text>
        <AnimatedPressable
          style={styles.addButton}
          stateLayerColor={colors.white}
          accessibilityLabel="Abrir nova mesa"
          onPress={() => navigation.navigate('OpenTable')}
        >
          <Ionicons name="add" size={20} color={colors.white} />
        </AnimatedPressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {openTables.length === 0 ? (
          <View style={styles.empty}>
            <LinearGradient
              colors={['#EAF6F3', '#DCEEEA']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 0.8, y: 1 }}
              style={styles.emptyIll}
            >
              <BeachUmbrellaIcon size={30} color={dashboardPalette.teal500} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>Nenhuma mesa aberta</Text>
            <Text style={styles.emptyText}>
              Abra uma mesa para lançar pedidos e acompanhar o atendimento em tempo real.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Valor em aberto</Text>
              <Text style={styles.totalValue}>
                R$ {openTablesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.tablesGrid}>
              {openTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  style={{ width: tableCardWidth }}
                  onPress={() => navigation.navigate('TableDetail', { tableId: table.id })}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: 6,
    paddingBottom: spacing.md,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: shape.full,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  title: {
    flex: 1,
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: shape.full,
    backgroundColor: dashboardPalette.teal700,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: shape.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    ...elevationShadow(1),
  },
  totalLabel: {
    fontFamily: nunitoFontFamily.medium,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  totalValue: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 17,
    color: dashboardPalette.teal500,
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  empty: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyIll: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: nunitoFontFamily.extraBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontFamily: nunitoFontFamily.semiBold,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 260,
  },
});
