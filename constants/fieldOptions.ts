export const SPLITTER_TYPES = ['1:4', '1:8', '1:16', '1:32'] as const;

export const CABLE_TYPES = ['12', '36', '72', '144', '288'] as const;

export const CLOSURE_SIZES = [
  { label: 'קטן', value: 'small' as const },
  { label: 'בינוני', value: 'medium' as const },
  { label: 'גדול', value: 'large' as const },
];

export const WORK_TYPES = [
  { label: 'ארון', value: 'cabinet' as const },
  { label: 'קלוזר', value: 'closure' as const },
  { label: 'תוספת', value: 'addition' as const },
];

export const FAULT_TYPES = [
  { label: 'סרק', value: 'empty' as const },
  { label: 'נזק בארון', value: 'cabinet_damage' as const },
  { label: 'החלפת כבל', value: 'cable_replace' as const },
  { label: 'סיב שבור בקלוזר', value: 'broken_fiber' as const },
  { label: 'חזר מתשתיות', value: 'infrastructure_fix' as const },
];

export const CABINET_DAMAGE_SUB_TYPES = [
  { label: 'מפצל שבור', value: 'broken_splitter' as const },
  { label: 'כבל נשלף', value: 'cable_pulled' as const },
  { label: 'ריתוך שבור', value: 'broken_weld' as const },
];

export const ADDITION_ACTIONS = [
  { label: 'הכנסת כבל', value: 'cable_insert' as const },
  { label: 'הוספת ריתוך', value: 'weld_add' as const },
];

export const ADDITION_TARGETS = [
  { label: 'ארון', value: 'cabinet' as const },
  { label: 'קלוזר', value: 'closure' as const },
];

export const FAULT_TYPE_LABELS: Record<string, string> = {
  empty: 'סרק',
  cabinet_damage: 'נזק בארון',
  cable_replace: 'החלפת כבל',
  broken_fiber: 'סיב שבור בקלוזר',
  infrastructure_fix: 'חזר מתשתיות',
};

export const WORK_TYPE_LABELS: Record<string, string> = {
  cabinet: 'ארון',
  closure: 'קלוזר',
  addition: 'תוספת',
};

export const CABINET_DAMAGE_SUB_LABELS: Record<string, string> = {
  broken_splitter: 'מפצל שבור',
  cable_pulled: 'כבל נשלף',
  broken_weld: 'ריתוך שבור',
};

export const CLOSURE_SIZE_LABELS: Record<string, string> = {
  small: 'קטן',
  medium: 'בינוני',
  large: 'גדול',
};
