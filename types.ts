
export enum ToiletType {
  MALE_PUBLIC = 'MALE PUBLIC',
  FEMALE_PUBLIC = 'FEMALE PUBLIC',
  MALE_STAFF = 'MALE STAFF',
  FEMALE_STAFF = 'FEMALE STAFF',
  POWDER_ROOM = 'POWDER ROOM'
}

export interface InventoryRecord {
  floor: string;
  type: ToiletType;
  usage: Record<string, number>; // key is ISO date string YYYY-MM-DD
}

export interface DailyLog {
  date: string; // ISO string for the month/year
  records: InventoryRecord[];
}

export interface AppState {
  currentLogs: InventoryRecord[];
  activeTab: 'entry' | 'reports' | 'scan';
}
