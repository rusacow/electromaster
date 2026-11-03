
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CableLine,
  createFloorPlan,
  createId,
  DEFAULT_EDITOR_STATE,
  DEFAULT_GRID_SIZE,
  DEFAULT_WALL_HEIGHT,
  DEFAULT_WALL_THICKNESS,
  distanceBetween,
  EditorTool,
  EQUIPMENT_CATALOG,
  Equipment,
  EquipmentType,
  FloorPlan,
  Point,
  snapPoint,
  Wall,
  wallLength
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

const STORAGE_KEY = "electromaster-floorplans";

const TOOL_GROUPS: { title: string; tools: { id: EditorTool; label: string; icon: string }[] }[] = [
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

function makeInitialPlan(projectId: number | null): FloorPlan {
  return createFloorPlan("Новый план", projectId);
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
  const [dragTarget, setDragTarget] = useState<{ type: "wall" | "equipment"; id: string } | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [planName, setPlanName] = useState("");
  const [showCatalog, setShowCatalog] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [notice, setNotice] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);

  const currentPlan = useMemo(
    () => plans.find(plan => plan.id === currentPlanId) ?? null,
    [plans, currentPlanId]
  );

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

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch {
      setNotice("Не удалось сохранить план. Возможно, закончилось место в браузере.");
    }
  }, [plans, loaded]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const updateCurrentPlan = useCallback((updater: (plan: FloorPlan) => FloorPlan) => {
    setPlans(previous =>
      previous.map(plan =>
        plan.id === currentPlanId
          ? { ...updater(plan), updatedAt: new Date().toISOString() }
          : plan
      )
    );
  }, [currentPlanId]);

  const createNewPlan = () => {
    const plan = makeInitialPlan(initialProjectId);
    setPlans(previous => [plan, ...previous]);
    setCurrentPlanId(plan.id);
    setSelectedWallId(null);
    setSelectedEquipmentId(null);
    setActiveTool("select");
    setNotice("Создан новый план");
  };

  const deleteCurrentPlan = () => {
    if (!currentPlan || !window.confirm(`Удалить план «${currentPlan.name}»?`)) return;
    const remaining = plans.filter(plan => plan.id !== currentPlan.id);
    setPlans(remaining);
    setCurrentPlanId(remaining[0]?.id ?? null);
    setSelectedWallId(null);
    setSelectedEquipmentId(null);
    setNotice("План удалён");
  };

  const screenToPlan = (event: React.MouseEvent<SVGSVGElement>): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    return {
      x: (screenX - rect.width / 2) / zoom + 5000,
      y: (screenY - rect.height / 2) / zoom + 5000
    };
  };

  const snapWithExisting = (point: Point): Point => {
    if (!currentPlan) return point;
    let result = snapPoint(point, gridSize, snapEnabled);

    const endpoints = currentPlan.walls.flatMap(wall => [wall.start, wall.end]);
    const nearest = endpoints.find(endpoint => distanceBetween(endpoint, result) < 180);

    if (nearest) result = { ...nearest };
    return result;
  };

  const clearSelection = () => {
    setSelectedWallId(null);
    setSelectedEquipmentId(null);
  };

  const addEquipment = (type: EquipmentType, position: Point) => {
    if (!currentPlan) return;

    const item: Equipment = {
      id: createId(),
      type,
      position,
      rotation: 0,
      label: EQUIPMENT_CATALOG.find(entry => entry.type === type)?.label ?? "Элемент",
      properties: {}
    };

    updateCurrentPlan(plan => ({
      ...plan,
      equipment: [...plan.equipment, item]
    }));

    setSelectedEquipmentId(item.id);
    setSelectedWallId(null);
  };

  const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!currentPlan || dragging) return;

    const point = snapWithExisting(screenToPlan(event));

    if (activeTool === "wall" || activeTool === "partition") {
      if (!drawingStart) {
        setDrawingStart(point);
        clearSelection();
      } else {
        if (distanceBetween(drawingStart, point) < 50) {
          setDrawingStart(null);
          return;
        }

        const wall: Wall = {
          id: createId(),
          start: drawingStart,
          end: point,
          thickness: DEFAULT_WALL_THICKNESS,
          height: DEFAULT_WALL_HEIGHT,
          type: activeTool === "wall" ? "wall" : "partition"
        };

        updateCurrentPlan(plan => ({
          ...plan,
          walls: [...plan.walls, wall]
        }));

        setSelectedWallId(wall.id);
        setSelectedEquipmentId(null);
        setDrawingStart(null);
      }
      return;
    }

    if (activeTool === "cable") {
      setCablePoints(previous => [...previous, point]);
      return;
    }

    if (activeTool === "dimension") {
      if (!drawingStart) {
        setDrawingStart(point);
      } else {
        const line: CableLine = {
          id: createId(),
          points: [drawingStart, point],
          cableType: "Размер",
          groupName: "Размерная линия",
          color: "#9aa8b7"
        };
        updateCurrentPlan(plan => ({
          ...plan,
          cableLines: [...plan.cableLines, line]
        }));
        setDrawingStart(null);
      }
      return;
    }

    if (activeTool === "eraser") {
      const equipment = [...currentPlan.equipment].reverse().find(
        item => distanceBetween(item.position, point) < 300
      );
      if (equipment) {
        updateCurrentPlan(plan => ({
          ...plan,
          equipment: plan.equipment.filter(item => item.id !== equipment.id)
        }));
        return;
      }

      const wall = [...currentPlan.walls].reverse().find(
        item => distanceToSegment(point, item.start, item.end) < 250
      );
      if (wall) {
        updateCurrentPlan(plan => ({
          ...plan,
          walls: plan.walls.filter(item => item.id !== wall.id)
        }));
      }
      return;
    }

    if (activeTool === "select") {
      clearSelection();
    }
  };

  const finishCable = () => {
    if (!currentPlan || cablePoints.length < 2) {
      setCablePoints([]);
      return;
    }

    const line: CableLine = {
      id: createId(),
      points: cablePoints,
      cableType: "ВВГнг-LS 3×2,5",
      groupName: "Группа 1",
      color: "#4cc9a0"
    };

    updateCurrentPlan(plan => ({
      ...plan,
      cableLines: [...plan.cableLines, line]
    }));

    setCablePoints([]);
    setActiveTool("select");
  };

  const selectEquipment = (event: React.MouseEvent, item: Equipment) => {
    event.stopPropagation();
    setSelectedEquipmentId(item.id);
    setSelectedWallId(null);
    setActiveTool("select");
  };

  const selectWall = (event: React.MouseEvent, wall: Wall) => {
    event.stopPropagation();
    setSelectedWallId(wall.id);
    setSelectedEquipmentId(null);
    setActiveTool("select");
  };

  const startEquipmentDrag = (event: React.MouseEvent, item: Equipment) => {
    event.stopPropagation();
    const point = screenToPlan(event as unknown as React.MouseEvent<SVGSVGElement>);
    setSelectedEquipmentId(item.id);
    setSelectedWallId(null);
    setDragTarget({ type: "equipment", id: item.id });
    setDragOffset({
      x: item.position.x - point.x,
      y: item.position.y - point.y
    });
    setDragging(true);
  };

  const startWallDrag = (event: React.MouseEvent, wall: Wall) => {
    event.stopPropagation();
    const point = screenToPlan(event as unknown as React.MouseEvent<SVGSVGElement>);
    setSelectedWallId(wall.id);
    setSelectedEquipmentId(null);
    setDragTarget({ type: "wall", id: wall.id });
    setDragOffset({
      x: wall.start.x - point.x,
      y: wall.start.y - point.y
    });
    setDragging(true);
  };

  const handlePointerMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !dragTarget || !currentPlan) return;

    const point = screenToPlan(event);
    const target = snapWithExisting({
      x: point.x + dragOffset.x,
      y: point.y + dragOffset.y
    });

    if (dragTarget.type === "equipment") {
      updateCurrentPlan(plan => ({
        ...plan,
        equipment: plan.equipment.map(item =>
          item.id === dragTarget.id ? { ...item, position: target } : item
        )
      }));
    } else {
      const wall = currentPlan.walls.find(item => item.id === dragTarget.id);
      if (!wall) return;
      const dx = target.x - wall.start.x;
      const dy = target.y - wall.start.y;

      updateCurrentPlan(plan => ({
        ...plan,
        walls: plan.walls.map(item =>
          item.id === dragTarget.id
            ? {
                ...item,
                start: { x: item.start.x + dx, y: item.start.y + dy },
                end: { x: item.end.x + dx, y: item.end.y + dy }
              }
            : item
        )
      }));
    }
  };

  const stopDragging = () => {
    setDragging(false);
    setDragTarget(null);
  };

  const deleteSelected = () => {
    if (!currentPlan) return;

    if (selectedWallId) {
      updateCurrentPlan(plan => ({
        ...plan,
        walls: plan.walls.filter(wall => wall.id !== selectedWallId)
      }));
      setSelectedWallId(null);
    }

    if (selectedEquipmentId) {
      updateCurrentPlan(plan => ({
        ...plan,
        equipment: plan.equipment.filter(item => item.id !== selectedEquipmentId)
      }));
      setSelectedEquipmentId(null);
    }
  };

  const updateEquipmentProperty = (field: string, value: string | number) => {
    if (!selectedEquipmentId) return;
    updateCurrentPlan(plan => ({
      ...plan,
      equipment: plan.equipment.map(item =>
        item.id === selectedEquipmentId
          ? { ...item, [field]: value }
          : item
      )
    }));
  };

  const updateWallProperty = (field: "thickness" | "height", value: number) => {
    if (!selectedWallId) return;
    updateCurrentPlan(plan => ({
      ...plan,
      walls: plan.walls.map(wall =>
        wall.id === selectedWallId ? { ...wall, [field]: value } : wall
      )
    }));
  };

  const exportSvg = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "1600");
    svg.setAttribute("height", "1000");

    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentPlan?.name || "plan"}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPng = () => {
    if (!svgRef.current) return;

    const svg = svgRef.current.cloneNode(true) as SVGSVGElement;
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", "1600");
    svg.setAttribute("height", "1000");

    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 1000;
      const context = canvas.getContext("2d");

      if (context) {
        context.fillStyle = "#111820";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const png = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = png;
        link.download = `${currentPlan?.name || "plan"}.png`;
        link.click();
      }

      URL.revokeObjectURL(url);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      setNotice("Не удалось экспортировать PNG");
    };

    image.src = url;
  };

  const printPlan = () => {
    window.print();
  };

  const selectedWall = currentPlan?.walls.find(wall => wall.id === selectedWallId);
  const selectedEquipment = currentPlan?.equipment.find(item => item.id === selectedEquipmentId);

  const totalWallLength = currentPlan?.walls.reduce((sum, wall) => sum + wallLength(wall), 0) ?? 0;

  if (!loaded) {
    return <div style={{ padding: 30, color: "#aab5c1" }}>Загрузка редактора...</div>;
  }

  const buttonStyle = (active = false): React.CSSProperties => ({
    background: active ? "#244b3d" : "#202a35",
    border: active ? "1px solid #40bd87" : "1px solid #34414f",
    color: active ? "#75e4ae" : "#d8e0e8",
    borderRadius: 8,
    padding: "9px 11px",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600
  });

  const panelStyle: React.CSSProperties = {
    background: "#18212b",
    border: "1px solid #2b3744",
    borderRadius: 12,
    padding: 14,
    color: "#dce5ed"
  };

  return (
    <div className="em-editor" style={{ color: "#e5edf4", display: "flex", flexDirection: "column", gap: 14 }}>
      <style>{`
        .em-editor * { box-sizing: border-box; }
        .em-editor button:hover { filter: brightness(1.15); }
        .em-editor input, .em-editor select {
          background: #111a23; color: #e5edf4; border: 1px solid #344352;
          border-radius: 7px; padding: 8px; width: 100%; min-width: 0;
        }
        .em-editor .editor-layout {
          display: grid; grid-template-columns: 205px minmax(0, 1fr) 230px; gap: 12px;
          align-items: start;
        }
        .em-editor .editor-canvas {
          background: #101820; border: 1px solid #2c3946; border-radius: 12px;
          overflow: hidden; min-height: 600px; position: relative;
        }
        .em-editor .editor-canvas svg { display: block; width: 100%; height: 600px; }
        .em-editor .editor-panel { background: #18212b; border: 1px solid #2b3744; border-radius: 12px; padding: 12px; }
        .em-editor .tool-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
        .em-editor .catalog-item {
          display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
          background: #202a35; color: #dce5ed; border: 1px solid #34414f;
          border-radius: 8px; padding: 9px; cursor: pointer; margin-top: 6px;
        }
        .em-editor .catalog-symbol {
          width: 28px; height: 28px; display: grid; place-items: center; border-radius: 7px;
          background: #293744; font-weight: 800; flex-shrink: 0;
        }
        .em-editor .muted { color: #8f9eac; font-size: 12px; }
        @media(max-width: 1100px) {
          .em-editor .editor-layout { grid-template-columns: 180px minmax(0, 1fr); }
          .em-editor .properties-panel { grid-column: 1 / -1; }
        }
        @media(max-width: 700px) {
          .em-editor .editor-layout { grid-template-columns: 1fr; }
          .em-editor .editor-canvas { min-height: 450px; }
          .em-editor .editor-canvas svg { height: 450px; }
        }
        @media print {
          body * { visibility: hidden !important; }
          .em-editor .editor-canvas, .em-editor .editor-canvas * { visibility: visible !important; }
          .em-editor .editor-canvas { position: absolute; left: 0; top: 0; width: 100%; border: 0; }
          .em-editor .editor-canvas svg { height: 95vh; }
        }
      `}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Чертежи и планы</div>
          <div className="muted">Редактор электрических планов помещений</div>
        </div>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {onBack && <button style={buttonStyle()} onClick={onBack}>← Назад</button>}
          <button style={buttonStyle()} onClick={createNewPlan}>＋ Новый план</button>
          <button style={buttonStyle()} onClick={exportPng} disabled={!currentPlan}>PNG</button>
          <button style={buttonStyle()} onClick={exportSvg} disabled={!currentPlan}>SVG</button>
          <button style={buttonStyle()} onClick={printPlan} disabled={!currentPlan}>PDF / Печать</button>
        </div>
      </div>

      {notice && (
        <div style={{ background: "#244b3d", color: "#8df0b9", padding: 10, borderRadius: 8 }}>
          {notice}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", ...panelStyle }}>
        <div style={{ minWidth: 180, flex: 1 }}>
          <div className="muted">Выбранный план</div>
          <select value={currentPlanId ?? ""} onChange={event => {
            setCurrentPlanId(event.target.value || null);
            clearSelection();
            setDrawingStart(null);
          }}>
            {plans.length === 0 && <option value="">Нет планов</option>}
            {plans.map(plan => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </select>
        </div>
        {currentPlan && (
          <>
            <div style={{ minWidth: 180, flex: 1 }}>
              <div className="muted">Название</div>
              <input value={currentPlan.name} onChange={event => {
                const value = event.target.value;
                updateCurrentPlan(plan => ({ ...plan, name: value }));
              }} />
            </div>
            <button style={buttonStyle()} onClick={deleteCurrentPlan}>Удалить план</button>
          </>
        )}
      </div>

      {!currentPlan ? (
        <div style={{ ...panelStyle, textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⌗</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Пока нет чертежей</div>
          <p className="muted">Создайте новый план, чтобы начать рисование.</p>
          <button style={buttonStyle(true)} onClick={createNewPlan}>Создать план</button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button style={buttonStyle(showCatalog)} onClick={() => setShowCatalog(value => !value)}>Каталог</button>
            <button style={buttonStyle(showProperties)} onClick={() => setShowProperties(value => !value)}>Свойства</button>
            <button style={buttonStyle(showGrid)} onClick={() => setShowGrid(value => !value)}>Сетка</button>
            <button style={buttonStyle(snapEnabled)} onClick={() => setSnapEnabled(value => !value)}>Привязка</button>
            <button style={buttonStyle(showDimensions)} onClick={() => setShowDimensions(value => !value)}>Размеры</button>
            <button style={buttonStyle()} onClick={() => setZoom(value => Math.min(0.3, value * 1.2))}>＋ Масштаб</button>
            <button style={buttonStyle()} onClick={() => setZoom(value => Math.max(0.04, value / 1.2))}>－ Масштаб</button>
            <button style={buttonStyle()} onClick={() => setZoom(0.1)}>100%</button>
            <button style={buttonStyle()} onClick={deleteSelected} disabled={!selectedWallId && !selectedEquipmentId}>Удалить выбранное</button>
          </div>

          <div className="editor-layout">
            {showCatalog && (
              <aside className="editor-panel">
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Инструменты</div>
                {TOOL_GROUPS.map(group => (
                  <div key={group.title}>
                    <div className="muted" style={{ margin: "8px 0" }}>{group.title}</div>
                    <div className="tool-grid">
                      {group.tools.map(tool => (
                        <button key={tool.id} style={buttonStyle(activeTool === tool.id)} onClick={() => {
                          setActiveTool(tool.id);
                          setDrawingStart(null);
                          setCablePoints([]);
                        }}>
                          <span style={{ marginRight: 5 }}>{tool.icon}</span>{tool.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="muted" style={{ margin: "16px 0 7px" }}>Электрооборудование</div>
                {EQUIPMENT_CATALOG.map(item => (
                  <button
                    key={item.type}
                    className="catalog-item"
                    onClick={() => {
                      setActiveTool(item.type);
                      setDrawingStart(null);
                    }}
                    style={{ borderColor: activeTool === item.type ? "#40bd87" : "#34414f" }}
                  >
                    <span className="catalog-symbol" style={{ color: equipmentColor(item.type) }}>
                      {equipmentSymbol(item.type)}
                    </span>
                    <span>
                      <span style={{ display: "block", fontSize: 12, fontWeight: 700 }}>{item.label}</span>
                      <span className="muted">{item.category}</span>
                    </span>
                  </button>
                ))}

                <div className="muted" style={{ marginTop: 14 }}>Шаг сетки, мм</div>
                <select value={gridSize} onChange={event => setGridSize(Number(event.target.value))}>
                  <option value={50}>50 мм</option>
                  <option value={100}>100 мм</option>
                  <option value={200}>200 мм</option>
                  <option value={250}>250 мм</option>
                  <option value={500}>500 мм</option>
                </select>
              </aside>
            )}

            <main className="editor-canvas">
              <div style={{
                position: "absolute", zIndex: 2, left: 10, top: 10,
                background: "#18212bdd", padding: "7px 10px", borderRadius: 7,
                color: "#aab9c7", fontSize: 11, pointerEvents: "none"
              }}>
                {activeTool === "wall" || activeTool === "partition"
                  ? drawingStart ? "Укажите конец стены" : "Укажите начало стены"
                  : activeTool === "cable"
                    ? "Указывайте точки кабельной трассы"
                    : activeTool === "dimension"
                      ? "Укажите две точки размера"
                      : EQUIPMENT_CATALOG.some(item => item.type === activeTool)
                        ? "Нажмите на план, чтобы разместить элемент"
                        : "Выберите или переместите элемент"}
              </div>

              <svg
                ref={svgRef}
                viewBox="0 0 1000 600"
                preserveAspectRatio="xMidYMid meet"
                onClick={handleCanvasClick}
                onMouseMove={handlePointerMove}
                onMouseUp={stopDragging}
                onMouseLeave={stopDragging}
                style={{
                  cursor: activeTool === "select" ? dragging ? "grabbing" : "default" : "crosshair",
                  background: "#101820"
                }}
              >
                <defs>
                  <pattern id="editor-grid-small" width={gridSize * zoom} height={gridSize * zoom} patternUnits="userSpaceOnUse">
                    <path d={`M ${gridSize * zoom} 0 L 0 0 0 ${gridSize * zoom}`} fill="none" stroke="#293642" strokeWidth="0.7" />
                  </pattern>
                  <pattern id="editor-grid-large" width={gridSize * zoom * 5} height={gridSize * zoom * 5} patternUnits="userSpaceOnUse">
                    <rect width={gridSize * zoom * 5} height={gridSize * zoom * 5} fill="url(#editor-grid-small)" />
                    <path d={`M ${gridSize * zoom * 5} 0 L 0 0 0 ${gridSize * zoom * 5}`} fill="none" stroke="#40505e" strokeWidth="1" />
                  </pattern>
                </defs>

                <rect width="1000" height="600" fill="#101820" />
                {showGrid && <rect width="1000" height="600" fill="url(#editor-grid-large)" />}

                <g transform={`translate(${500 - 5000 * zoom},${300 - 5000 * zoom}) scale(${zoom})`}>
                  {currentPlan.cableLines.map(line => (
                    <g key={line.id}>
                      <polyline
                        points={line.points.map(point => `${point.x},${point.y}`).join(" ")}
                        fill="none"
                        stroke={line.color}
                        strokeWidth={line.cableType === "Размер" ? 14 : 22}
                        strokeDasharray={line.cableType === "Размер" ? "70 40" : "none"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {line.cableType === "Размер" && (
                        <text
                          x={(line.points[0].x + line.points[1].x) / 2}
                          y={(line.points[0].y + line.points[1].y) / 2 - 60}
                          fill="#cbd5df"
                          fontSize="120"
                          textAnchor="middle"
                        >
                          {(distanceBetween(line.points[0], line.points[1]) / 1000).toFixed(2)} м
                        </text>
                      )}
                    </g>
                  ))}

                  {currentPlan.walls.map(wall => (
                    <g key={wall.id} onClick={event => selectWall(event, wall)} onMouseDown={event => startWallDrag(event, wall)}>
                      <line
                        x1={wall.start.x} y1={wall.start.y}
                        x2={wall.end.x} y2={wall.end.y}
                        stroke={selectedWallId === wall.id ? "#54e0a0" : wall.type === "wall" ? "#d4dce4" : "#a1b0be"}
                        strokeWidth={wall.thickness}
                        strokeLinecap="square"
                        opacity="0.95"
                      />
                      <line
                        x1={wall.start.x} y1={wall.start.y}
                        x2={wall.end.x} y2={wall.end.y}
                        stroke="#18232e"
                        strokeWidth={12}
                        strokeLinecap="square"
                        pointerEvents="none"
                      />
                      {showDimensions && (
                        <text
                          x={(wall.start.x + wall.end.x) / 2}
                          y={(wall.start.y + wall.end.y) / 2 - 100}
                          fill="#b9c8d6"
                          fontSize="115"
                          textAnchor="middle"
                          pointerEvents="none"
                        >
                          {(wallLength(wall) / 1000).toFixed(2)} м
                        </text>
                      )}
                    </g>
                  ))}

                  {currentPlan.equipment.map(item => (
                    <g
                      key={item.id}
                      transform={`translate(${item.position.x},${item.position.y}) rotate(${item.rotation})`}
                      onClick={event => selectEquipment(event, item)}
                      onMouseDown={event => startEquipmentDrag(event, item)}
                      style={{ cursor: "move" }}
                    >
                      <circle
                        r="145"
                        fill={selectedEquipmentId === item.id ? "#244b3d" : "#17232e"}
                        stroke={selectedEquipmentId === item.id ? "#54e0a0" : equipmentColor(item.type)}
                        strokeWidth="18"
                      />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={equipmentColor(item.type)}
                        fontSize="105"
                        fontWeight="bold"
                        pointerEvents="none"
                      >
                        {equipmentSymbol(item.type)}
                      </text>
                      <text
                        x="0"
                        y="205"
                        textAnchor="middle"
                        fill="#dce5ed"
                        fontSize="70"
                        pointerEvents="none"
                      >
                        {item.label}
                      </text>
                    </g>
                  ))}

                  {drawingStart && (
                    <circle cx={drawingStart.x} cy={drawingStart.y} r="65" fill="#54e0a0" />
                  )}

                  {cablePoints.length > 0 && (
                    <polyline
                      points={cablePoints.map(point => `${point.x},${point.y}`).join(" ")}
                      fill="none"
                      stroke="#4cc9a0"
                      strokeWidth="30"
                      strokeDasharray="70 30"
                    />
                  )}
                </g>
              </svg>

              {activeTool === "cable" && cablePoints.length >= 2 && (
                <button
                  style={{ ...buttonStyle(true), position: "absolute", right: 12, bottom: 12 }}
                  onClick={finishCable}
                >
                  Завершить трассу
                </button>
              )}
            </main>

            {showProperties && (
              <aside className="properties-panel editor-panel">
                <div style={{ fontWeight: 800, marginBottom: 12 }}>Свойства</div>

                {selectedWall && (
                  <>
                    <div style={{ color: "#75e4ae", fontWeight: 700, marginBottom: 8 }}>
                      {selectedWall.type === "wall" ? "Стена" : "Перегородка"}
                    </div>
                    <div className="muted">Длина</div>
                    <div style={{ marginBottom: 12 }}>{(wallLength(selectedWall) / 1000).toFixed(2)} м</div>
                    <div className="muted">Толщина, мм</div>
                    <input type="number" value={selectedWall.thickness} onChange={event => updateWallProperty("thickness", Number(event.target.value))} />
                    <div className="muted" style={{ marginTop: 10 }}>Высота, мм</div>
                    <input type="number" value={selectedWall.height} onChange={event => updateWallProperty("height", Number(event.target.value))} />
                    <button style={{ ...buttonStyle(), width: "100%", marginTop: 12 }} onClick={deleteSelected}>Удалить стену</button>
                  </>
                )}

                {selectedEquipment && (
                  <>
                    <div style={{ color: equipmentColor(selectedEquipment.type), fontWeight: 700, marginBottom: 8 }}>
                      {selectedEquipment.label}
                    </div>
                    <div className="muted">Название</div>
                    <input value={selectedEquipment.label} onChange={event => updateEquipmentProperty("label", event.target.value)} />
                    <div className="muted" style={{ marginTop: 10 }}>Поворот, градусы</div>
                    <input type="number" value={selectedEquipment.rotation} onChange={event => updateEquipmentProperty("rotation", Number(event.target.value))} />
                    <div className="muted" style={{ marginTop: 10 }}>Координаты, мм</div>
                    <div style={{ fontSize: 12, marginTop: 5 }}>
                      X: {Math.round(selectedEquipment.position.x)}<br />
                      Y: {Math.round(selectedEquipment.position.y)}
                    </div>
                    <button style={{ ...buttonStyle(), width: "100%", marginTop: 12 }} onClick={deleteSelected}>Удалить элемент</button>
                  </>
                )}

                {!selectedWall && !selectedEquipment && (
                  <>
                    <div className="muted">Выберите стену или оборудование на чертеже, чтобы изменить его свойства.</div>
                    <div style={{ marginTop: 18, borderTop: "1px solid #34414f", paddingTop: 12 }}>
                      <div className="muted">Статистика плана</div>
                      <div style={{ marginTop: 8 }}>Стены: {currentPlan.walls.length}</div>
                      <div>Оборудование: {currentPlan.equipment.length}</div>
                      <div>Кабельные линии: {currentPlan.cableLines.length}</div>
                      <div style={{ marginTop: 8, color: "#75e4ae" }}>
                        Общая длина стен: {(totalWallLength / 1000).toFixed(2)} м
                      </div>
                    </div>
                  </>
                )}

                <div style={{ marginTop: 18, borderTop: "1px solid #34414f", paddingTop: 12 }}>
                  <div className="muted">Подсказка</div>
                  <p style={{ fontSize: 12, lineHeight: 1.5 }}>
                    Стена: выберите инструмент и укажите две точки. Оборудование: выберите элемент каталога и нажмите на план.
                  </p>
                  <p style={{ fontSize: 11, color: "#e7b86c" }}>
                    Чертёж является схемой. Перед монтажом проверяйте проектные решения и соответствие действующим нормам.
                  </p>
                </div>
              </aside>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function distanceToSegment(point: Point, start: Point, end: Point): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) return distanceBetween(point, start);

  const t = Math.max(0, Math.min(1, (
    (point.x - start.x) * dx + (point.y - start.y) * dy
  ) / lengthSquared));

  return distanceBetween(point, {
    x: start.x + t * dx,
    y: start.y + t * dy
  });
}
