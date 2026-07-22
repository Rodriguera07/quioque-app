import { useWindowDimensions } from 'react-native';
import { ViewStyle } from 'react-native';

const TABLET_BREAKPOINT = 700;
const LARGE_TABLET_BREAKPOINT = 1000;
const DEFAULT_MAX_CONTENT_WIDTH = 640;

// Mantém formulários, cards e linhas de lista com uma largura confortável de
// leitura em tablets, em vez de esticar de ponta a ponta da tela.
export function useResponsiveContent(maxWidth: number = DEFAULT_MAX_CONTENT_WIDTH) {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;

  const contentStyle: ViewStyle | undefined = isTablet
    ? { width: '100%', maxWidth, alignSelf: 'center' }
    : undefined;

  const tableColumns = width >= LARGE_TABLET_BREAKPOINT ? 4 : isTablet ? 3 : 2;
  const paymentColumns = isTablet ? 4 : 2;

  return { isTablet, contentStyle, tableColumns, paymentColumns };
}

const COLUMN_WIDTH: Record<number, `${number}%`> = {
  2: '48%',
  3: '31%',
  4: '23%',
};

export function widthForColumns(columns: number): `${number}%` {
  return COLUMN_WIDTH[columns] ?? `${Math.floor(100 / columns) - 3}%`;
}
