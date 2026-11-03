"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  createFloorPlan,
  createId,
  DEFAULT_GRID_SIZE,
  DEFAULT_WALL_HEIGHT,
  DEFAULT_WALL_THICKNESS,
  distanceBetween,
  EQUIPMENT_CATALOG,
  snapPoint,
  wallLength
} from "./editor-types";

import type {
  CableLine,
  EditorTool,
  Equipment,
  EquipmentType,
  FloorPlan,
  Point,
  Wall
} from "./editor-types";

type ProjectOption = {
  id: number;
  name: string;
};

type Props = {
  projects?: ProjectOption[];
  initialProjectId?: number | null;
  onBack?: () => void;
};

type DragTarget = {
  type: "wall" | "equipment";
  id: string;
  startPoint: Point;
  originalWall?: Wall;
  originalEquipment?: Equipment;
};

const STORAGE_KEY = "electromaster-floorplans";

const TOOL_GROUPS: {
  title: string;
  tools: { id: EditorTool; label: string; icon: string }[];
}[] = [
  {
    title: "Инструменты",
    tools: [
      { id: "select", label: "Выбор", icon: "↖" },
      { id: "wall", label: "Стена", icon: "━" },
      { id: "partition", label: "Перегородка", icon: "┄" },
      { id: "cable", label: "Кабель", icon: "⌁" },
      { id: "dimension", label: "Размер", icon: "↔" },
      { id: "eraser", label: "Ластик", icon: "⌫" }
    ]
  }
];

function equipmentSymbol(type: EquipmentType): string {
  const symbols: Record<EquipmentType, string> = {
    socket: "Р",
    "double-socket": "Р2",
    "power-socket": "С",
    switch: "В",
    "double-switch": "В2",
    "pass-switch": "ПВ",
    light: "✦",
    spotlight: "●",
    "wall-light": "Б",
    "junction-box": "К",
    "electrical-panel": "Щ"
  };

  return symbols[type];
}

function equipmentColor(type: EquipmentType): string {
  if (type.includes("socket")) return "#55b8ff";
  if (type.includes("switch")) return "#f4bd58";
  if (type.includes("light")) return "#ffe17a";
  if (type === "junction-box") return "#c18aff";
  return "#ff7777";
}

function distanceToSegment(
  point: Point,
  start: Point,
  end: Point
): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return distanceBetween(point, start);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      (
        (point.x - start.x) * dx +
        (point.y - start.y) * dy
      ) / lengthSquared
    )
  );

  return distanceBetween(point, {
    x: start.x + t * dx,
    y: start.y + t * dy
  });
}

function safeFilename(name: string): string {
  return name
    .trim()
    .replace(/[\\/:*?"<>|]/g, "_")
    .slice(0, 80) || "electromaster-plan";
}

export default function FloorPlanEditor({
  projects = [],
  initialProjectId = null,
  onBack
}: Props) {
  const [plans, setPlans] = useState<FloorPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [activeTool, setActiveTool] = useState<EditorTool>("select");

  const [selectedWallId, setSelectedWallId] = useState<string | null>(null);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);

  const [drawingStart, setDrawingStart] = useState<Point | null>(null);
  const [cablePoints, setCablePoints] = useState<Point[]>([]);

  const [zoom, setZoom] = useState(0.1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);

  const [gridSize, setGridSize] = useState(DEFAULT_GRID_SIZE);

  const [dragging, setDragging] = useState(false);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);

  const [showCatalog, setShowCatalog] = useState(true);
  const [showProperties, setShowProperties] = useState(true);

  const [notice, setNotice] = useState("");

  const svgRef = useRef<SVGSVGElement>(null);
  const dragTargetRef = useRef<DragTarget | null>(null);

  const currentPlan = useMemo(
    () => plans.find(plan => plan.id === currentPlanId) ?? null,
    [plans, currentPlanId]
  );

  // Загрузка сохранённых планов
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as FloorPlan[];

        if (Array.isArray(parsed)) {
          setPlans(parsed);

          if (parsed.length > 0) {
            setCurrentPlanId(parsed[0].id);
          }
        }
      }
    } catch {
      setNotice("Не удалось загрузить сохранённые планы");
    }

    setLoaded(true);
  }, []);

  // Сохранение планов
  useEffect(() => {
    if (!loaded) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch {
      setNotice(
        "Не удалось сохранить план. Возможно, закончилось место в браузере."
      );
    }
  }, [plans, loaded]);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => {
      setNotice("");
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [notice]);

  const updateCurrentPlan = useCallback(
    (updater: (plan: FloorPlan) => FloorPlan) => {
      setPlans(previous =>
        previous.map(plan =>
          plan.id === currentPlanId
            ? {
                ...updater(plan),
                updatedAt: new Date().toISOString()
              }
            : plan
        )
      );
    },
    [currentPlanId]
  );

  const clearSelection = () => {
    setSelectedWallId(null);
    setSelectedEquipmentId(null);
  };

  const cancelDrawing = () => {
    setDrawingStart(null);
    setCablePoints([]);
  };

  const createNewPlan = () => {
    const plan = createFloorPlan(
      "Новый план",
      initialProjectId
    );

    setPlans(previous => [plan, ...previous]);
    setCurrentPlanId(plan.id);

    clearSelection();
    cancelDrawing();

    setActiveTool("select");
    setNotice("Создан новый план");
  };

  const deleteCurrentPlan = () => {
    if (
      !currentPlan ||
      !window.confirm(`Удалить план «${currentPlan.name}»?`)
    ) {
      return;
    }

    const remaining = plans.filter(
      plan => plan.id !== currentPlan.id
    );

    setPlans(remaining);
    setCurrentPlanId(remaining[0]?.id ?? null);

    clearSelection();
    cancelDrawing();

    setNotice("План удалён");
  };

  // Правильное преобразование координат:
  // координаты экрана -> SVG -> координаты чертежа в миллиметрах.
  const screenToPlan = (
    clientX: number,
    clientY: number
  ): Point => {
    const svg = svgRef.current;

    if (!svg) {
      return { x: 5000, y: 5000 };
    }

    const matrix = svg.getScreenCTM();

    if (!matrix) {
      return { x: 5000, y: 5000 };
    }

    const svgPoint = svg.createSVGPoint();

    svgPoint.x = clientX;
    svgPoint.y = clientY;

    const local
