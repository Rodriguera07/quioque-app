import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, nunitoFontFamily, radius, spacing, typography } from '../theme';
import { LegalDoc } from '../content/legal';

interface Props {
  doc: LegalDoc;
  contentStyle?: object;
}

export function LegalDocument({ doc, contentStyle }: Props) {
  return (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.updatedAt}>ATUALIZADO EM {doc.updatedAt.toUpperCase()}</Text>
      <Text style={styles.intro}>{doc.intro}</Text>

      <View style={styles.card}>
        {doc.sections.map((section, index) => (
          <View
            key={section.title}
            style={[styles.section, index === doc.sections.length - 1 && { marginBottom: 0 }]}
          >
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  updatedAt: {
    ...typography.label,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  intro: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    fontFamily: nunitoFontFamily.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xxs,
  },
  sectionBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});
