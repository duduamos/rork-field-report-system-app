export interface SplitterItem {
  type: '1:4' | '1:8' | '1:16' | '1:32';
  quantity: number;
}

export interface CableItem {
  type: '12' | '36' | '72' | '144' | '288';
  quantity: number;
}

export type WorkType = 'cabinet' | 'closure' | 'addition';
export type FaultType = 'empty' | 'cabinet_damage' | 'cable_replace' | 'broken_fiber' | 'infrastructure_fix';
export type CabinetDamageSubType = 'broken_splitter' | 'cable_pulled' | 'broken_weld';
export type AdditionActionType = 'cable_insert' | 'weld_add';
export type AdditionTargetType = 'cabinet' | 'closure';
export type ClosureSizeType = 'small' | 'medium' | 'large';

export interface Report {
  id: string;
  created_at: string;
  username: string;
  technician_name: string;
  report_type: 'fault' | 'work';
  street: string;
  city: string;
  map_number: string;
  note: string;
  images: string[];

  work_type?: WorkType;
  cabinet_number?: string;
  cabinet_location?: string;
  cabinet_splitters?: SplitterItem[];

  closure_size?: ClosureSizeType;
  closure_number?: string;
  closure_cables?: CableItem[];
  closure_welds?: number;
  closure_splitters?: SplitterItem[];

  addition_action?: AdditionActionType;
  addition_target?: AdditionTargetType;
  addition_number?: string;
  addition_for_cabinet?: string;
  addition_welds?: number;
  addition_cable_type?: string;

  ticket?: string;
  arrival_time?: string;
  fault_type?: FaultType;

  cabinet_damage_sub?: CabinetDamageSubType;
  fault_splitters?: SplitterItem[];
  fault_welds?: number;
  fault_openings?: number;

  fiber_openings?: number;
  fiber_welds?: number;
  fiber_otdr?: string;

  cable_openings?: number;
  cable_welds?: number;
  cable_otdr?: string;
  cable_type?: string;
  cable_length?: string;
  cable_from?: string;
  cable_to?: string;

  infra_openings?: number;
  infra_welds?: number;
  infra_cable_opening?: string;
  infra_cable_type?: string;
}

export interface ReportFormData {
  report_type: 'fault' | 'work';
  technician_name: string;
  street: string;
  city: string;
  map_number: string;
  note: string;
  images: string[];

  work_type: WorkType | '';
  cabinet_number: string;
  cabinet_location: string;
  cabinet_splitters: SplitterItem[];

  closure_size: ClosureSizeType | '';
  closure_number: string;
  closure_cables: CableItem[];
  closure_welds: string;
  closure_splitters: SplitterItem[];

  addition_action: AdditionActionType | '';
  addition_target: AdditionTargetType | '';
  addition_number: string;
  addition_for_cabinet: string;
  addition_welds: string;
  addition_cable_type: string;

  ticket: string;
  arrival_time: string;
  fault_type: FaultType | '';

  cabinet_damage_sub: CabinetDamageSubType | '';
  fault_splitters: SplitterItem[];
  fault_welds: string;
  fault_openings: string;

  fiber_openings: string;
  fiber_welds: string;
  fiber_otdr: string;

  cable_openings: string;
  cable_welds: string;
  cable_otdr: string;
  cable_type: string;
  cable_length: string;
  cable_from: string;
  cable_to: string;

  infra_openings: string;
  infra_welds: string;
  infra_cable_opening: string;
  infra_cable_type: string;
}

export interface User {
  username: string;
  name: string;
  role: 'admin' | 'technician';
}

export interface DefaultUser {
  username: string;
  password: string;
  name: string;
  role: 'admin' | 'technician';
}
