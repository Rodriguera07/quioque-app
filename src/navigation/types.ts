import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ClosedSale, DaySummary } from '../types';

// As 4 telas principais, sempre acessíveis pela barra de abas inferior.
export type TabParamList = {
  Painel: undefined;
  Mesas: undefined;
  Produtos: undefined;
  Relatorios: undefined;
};

// Telas da pilha autenticada (dentro do menu hambúrguer + navegadas a partir
// das abas). MainTabs é a primeira tela da pilha e carrega as 4 abas.
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList>;
  OpenTable: undefined;
  TableDetail: { tableId: string };
  AddItems: { tableId: string };
  CloseTable: { tableId: string };
  EndDaySummary: { summary: DaySummary };
  ClosedTablesHistory: undefined;
  ClosedTableDetail: { sale: ClosedSale };
  UserManagement: undefined;
  AuditLog: undefined;
  ChangePassword: undefined;
  PrivacyPolicy: undefined;
  TermsOfUse: undefined;
  DeleteAccount: undefined;
};

export type DrawerParamList = {
  AppStack: NavigatorScreenParams<RootStackParamList>;
};

// Props de uma tela que vive dentro de uma aba — compõe o navigation da aba
// com o da pilha por fora, para `navigation.navigate('OpenTable')` etc. tipar
// corretamente mesmo vindo de dentro do Tab.Navigator.
export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;
