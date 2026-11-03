
export type Point = {
  x: number;
  y: number;
};

export type Wall = {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  height: number;
  type: "wall" | "partition";
  color?: string;
};

export type EquipmentType =
  | "socket"
  | "double-socket"
  | "power-socket"
  | "switch"
  | "double-switch"
  | "pass-switch"
  | "light"
  | "spotlight"
  | "wall-light"
  | "junction-box"
  | "electrical-panel";

export type Equipment = {
  id: string;
  type: EquipmentType;
  position: Point;
  rotation: number;
  label: string;
  wallId?: string;
  properties?: Record<string, string | number | boolean>;
};

export type CableLine = {
  id: string;
  points: Point[];
  cableType: string;
  groupName: string;
  color: string;
};

export type Room = {
  id: string;
  name: string;
  wallIds: string[];
  area?: number;
};

export type FloorPlan = {
  id: string;
  projectId: number | null;
  name: string;
  description: string;
  walls: Wall[];
  equipment: Equipment[];
  cableLines: CableLine[];
  rooms: Room[];
  gridSize: number;
  scale: number;
  createdAt: string;
  updatedAt: string;
};

export type EditorTool =
  | "select"
  | "wall"
  | "partition"
  | "socket"
  | "double-socket"
  | "power-socket"
  | "switch"
  | "double-switch"
  | "pass-switch"
  | "light"
  | "spotlight"
  | "wall-light"
  | "junction-box"
  | "electrical-panel"
  | "cable"
  | "dimension"
  | "eraser";

export type EditorState = {
  activeTool: EditorTool;
  selectedWallId: string | null;
  selectedEquipmentId: string | null;
  drawingStart: Point | null;
  zoom: number;
  offset: Point;
  snapToGrid: boolean;
  showGrid: boolean;
  showDimensions: boolean;
};

export const DEFAULT_GRID_SIZE = 100;

export const DEFAULT_WALL_THICKNESS = 120;

export const DEFAULT_WALL_HEIGHT = 2700;

export const DEFAULT_EDITOR_STATE: EditorState = {
  activeTool: "select",
  selectedWallId: null,
  selectedEquipmentId: null,
  drawingStart: null,
  zoom: 1,
  offset: { x: 0, y: 0 },
  snapToGrid: true,
  showGrid: true,
  showDimensions: true
};

export const EQUIPMENT_CATALOG: {
  type: EquipmentType;
  label: string;
  description: string;
  category: "Розетки" | "Выключатели" | "Освещение" | "Оборудование";
}[] = [
  {
    type: "socket",
    label: "Розетка",
    description: "Обычная одинарная розетка",
    category: "Розетки"
  },
  {
    type: "double-socket",
    label: "Двойная розетка",
    description: "Двойная бытовая розетка",
    category: "Розетки"
  },
  {
    type: "power-socket",
    label: "Силовая розетка",
    description: "Силовая электрическая точка",
    category: "Розетки"
  },
  {
    type: "switch",
    label: "Выключатель",
    description: "Одноклавишный выключатель",
    category: "Выключатели"
  },
  {
    type: "double-switch",
    label: "Двойной выключатель",
    description: "Двухклавишный выключатель",
    category: "Выключатели"
  },
  {
    type: "pass-switch",
    label: "Проходной выключатель",
    description: "Управление освещением из нескольких мест",
    category: "Выключатели"
  },
  {
    type: "light",
    label: "Светильник",
    description: "Потолочный светильник",
    category: "Освещение"
  },
  {
    type: "spotlight",
    label: "Точечный светильник",
    description: "Встраиваемый точечный светильник",
    category: "Освещение"
  },
  {
    type: "wall-light",
    label: "Бра",
    description: "Настенный светильник",
    category: "Освещение"
  },
  {
    type: "junction-box",
    label: "Распредкоробка",
    description: "Распределительная коробка",
    category: "Оборудование"
  },
  {
    type: "electrical-panel",
    label: "Электрощит",
    description: "Распределительный электрический щит",
    category: "Оборудование"
  }
];

export function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function snapPoint(
  point: Point,
  gridSize: number,
  enabled: boolean
): Point {
  if (!enabled || gridSize <= 0) return point;

  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  };
}

export function distanceBetween(
  first: Point,
  second: Point
): number {
  return Math.sqrt(
    Math.pow(second.x - first.x, 2) +
    Math.pow(second.y - first.y, 2)
  );
}

export function wallLength(wall: Wall): number {
  return distanceBetween(wall.start, wall.end);
}

export function calculateRoomArea(
  walls: Wall[]
): number {
  if (walls.length < 3) return 0;

  const points = walls.map(wall => wall.start);

  let area = 0;

  for (let i = 0; i < points.length; i++) {
    const next = points[(i + 1) % points.length];

    area +=
      points[i].x * next.y -
      next.x * points[i].y;
  }

  return Math.abs(area / 2) / 1_000_000;
}

export function createFloorPlan(
  name: string,
  projectId: number | null = null
): FloorPlan {
  const now = new Date().toISOString();

  return {
    id: createId(),
    projectId,
    name,
    description: "",
    walls: [],
    equipment: [],
    cableLines: [],
    rooms: [],
    gridSize: DEFAULT_GRID_SIZE,
    scale: 1,
    createdAt: now,
    updatedAt: now
  };
}
