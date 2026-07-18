import { DaySummary } from '../types';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  OpenTable: undefined;
  TableDetail: { tableId: string };
  AddItems: { tableId: string };
  CloseTable: { tableId: string };
  Reports: undefined;
  EndDaySummary: { summary: DaySummary };
};
