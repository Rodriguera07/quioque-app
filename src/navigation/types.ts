import { NavigatorScreenParams } from '@react-navigation/native';
import { ClosedSale, DaySummary } from '../types';

// Telas da pilha autenticada (dentro do menu hambúrguer).
export type RootStackParamList = {
  Dashboard: undefined;
  OpenTable: undefined;
  TableDetail: { tableId: string };
  AddItems: { tableId: string };
  CloseTable: { tableId: string };
  Reports: undefined;
  EndDaySummary: { summary: DaySummary };
  ClosedTablesHistory: undefined;
  ClosedTableDetail: { sale: ClosedSale };
  UserManagement: undefined;
  AuditLog: undefined;
};

export type DrawerParamList = {
  AppStack: NavigatorScreenParams<RootStackParamList>;
};
