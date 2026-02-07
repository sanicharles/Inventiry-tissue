
import { ToiletType, InventoryRecord } from './types';

export const FLOORS_CONFIG = [
  { floor: '2', types: [ToiletType.MALE_PUBLIC, ToiletType.FEMALE_PUBLIC, ToiletType.MALE_STAFF, ToiletType.FEMALE_STAFF] },
  { floor: '85', types: [ToiletType.MALE_PUBLIC, ToiletType.FEMALE_PUBLIC] },
  { floor: '86', types: [ToiletType.FEMALE_PUBLIC] },
  { floor: '87', types: [ToiletType.MALE_PUBLIC] },
  { floor: '99', types: [ToiletType.MALE_PUBLIC, ToiletType.FEMALE_PUBLIC, ToiletType.MALE_STAFF, ToiletType.FEMALE_STAFF] },
  { floor: '100', types: [ToiletType.MALE_PUBLIC, ToiletType.FEMALE_PUBLIC, ToiletType.MALE_STAFF, ToiletType.FEMALE_STAFF] },
  { floor: '105', types: [ToiletType.POWDER_ROOM] },
  { floor: '107', types: [ToiletType.POWDER_ROOM] },
  { floor: '108', types: [ToiletType.POWDER_ROOM] },
];

export const INITIAL_RECORDS: InventoryRecord[] = FLOORS_CONFIG.flatMap(f => 
  f.types.map(t => ({
    floor: f.floor,
    type: t,
    usage: {}
  }))
);
