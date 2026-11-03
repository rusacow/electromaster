```tsx
"use client";

import { useEffect, useState } from "react";
import {
  Activity, Bell, BookOpen, Calculator, Cable, ChevronDown,
  ChevronRight, ClipboardList, FileText, FolderKanban, House,
  LayoutDashboard, LifeBuoy, Plus, Search, Settings,
  ShieldCheck, X, Ruler, Pencil, Trash2, ArrowLeft
} from "lucide-react";

type Project = {
  id: number;
  name: string;
  client: string;
  status: string;
  progress: number;
  address: string;
  description: string;
  createdAt: string;
};

type EstimateItem = {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  category: "Материал" | "Работа";
};

type Estimate = {
  id: number;
  name: string;
  projectId: number | null;
  date: string;
  items: EstimateItem[];
};

const navigation = [
  { name: "Рабочий стол", icon: LayoutDashboard },
  { name: "Мои проекты", icon: FolderKanban },
  { name: "Чертежи и планы", icon: Ruler },
  { name: "Сметы", icon: ClipboardList },
  { name: "Инженерные расчёты", icon: Calculator },
  { name: "Каталог материалов", icon: Cable },
  { name: "Документы", icon: FileText },
  { name: "Обучение", icon: BookOpen }
];

const initialProjects: Project[] = [
  {
    id: 1,
    name: "Электрика — частный дом",
    client: "Александр",
    status: "В работе",
    progress: 68,
    address: "",
    description: "Демонстрационный проект",
    createdAt: "2026-11-01"
  },
  {
    id: 2,
    name: "Квартира, 2 комнаты",
    client: "Ирина",
    status: "Расчёт",
    progress: 35,
    address: "",
    description: "Демонстрационный проект",
    createdAt: "2026-11-02"
  },
  {
    id: 3,
    name: "Освещение мастерской",
    client: "Сергей",
    status: "Завершён",
    progress: 100,
    address: "",
    description: "Демонстрационный проект",
    createdAt: "2026-11-03"
  }
];

const statuses = ["Новый", "Расчёт", "В работе", "На паузе", "Завершён"];

const money = (value: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2
  }).format(value);

export default function Home() {
  const [active, setActive] = useState("Рабочий стол");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [modal, setModal] = useState(false);
  const [estimateModal, setEstimateModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedEstimateId, setSelectedEstimateId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Новый");
  const [progress, setProgress] = useState(0);

  const [estimateName, setEstimateName] = useState("");
  const [estimateProjectId, setEstimateProjectId] = useState("");

  const [itemName, setItemName] = useState("");
  const [itemUnit, setItemUnit] = useState("шт.");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemPrice, setItemPrice] = useState("0");
  const [itemCategory, setItemCategory] =
    useState<"Материал" | "Работа">("Материал");

  useEffect(() => {
    try {
      const savedProjects = localStorage.getItem("electromaster-projects");
      const savedEstimates = localStorage.getItem("electromaster-estimates");

      if (savedProjects) {
        const parsed = JSON.parse(savedProjects);
        if (Array.isArray(parsed)) setProjects(parsed);
      }

      if (savedEstimates) {
        const parsed = JSON.parse(savedEstimates);
        if (Array.isArray(parsed)) setEstimates(parsed);
      }
    } catch {
      console.warn("Не удалось загрузить сохранённые данные");
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("electromaster-projects", JSON.stringify(projects));
  }, [projects, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem("electromaster-estimates", JSON.stringify(estimates));
  }, [estimates, loaded]);

  const filtered = projects.filter(project =>
    `${project.name} ${project.client} ${project.address}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectedProject = projects.find(p => p.id === selectedId);
  const selectedEstimate = estimates.find(e => e.id === selectedEstimateId);

  function openCreate() {
    setEditingId(null);
    setName("");
    setClient("");
    setAddress("");
    setDescription("");
    setStatus("Новый");
    setProgress(0);
    setModal(true);
  }

  function openEdit(project: Project) {
    setEditingId(project.id);
    setName(project.name);
    setClient(project.client);
    setAddress(project.address);
    setDescription(project.description);
    setStatus(project.status);
    setProgress(project.progress);
    setModal(true);
  }

  function saveProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId !== null) {
      setProjects(current => current.map(project =>
        project.id === editingId
          ? {
              ...project,
              name: name.trim(),
              client: client.trim() || "Не указан",
              address: address.trim(),
              description: description.trim(),
              status,
              progress
            }
          : project
      ));
    } else {
      const project: Project = {
        id: Date.now(),
        name: name.trim(),
        client: client.trim() || "Не указан",
        address: address.trim(),
        description: description.trim(),
        status,
        progress,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      setProjects(current => [project, ...current]);
    }

    setModal(false);
  }

  function deleteProject(id: number) {
    if (!window.confirm("Удалить этот проект? Это действие нельзя отменить.")) return;
    setProjects(current => current.filter(project => project.id !== id));
    setSelectedId(null);
  }

  function changeStatus(id: number, value: string) {
    setProjects(current => current.map(project =>
      project.id === id ? { ...project, status: value } : project
    ));
  }

  function changeProgress(id: number, value: number) {
    setProjects(current => current.map(project =>
      project.id === id
        ? { ...project, progress: Math.max(0, Math.min(100, value)) }
        : project
    ));
  }

  function openNewEstimate() {
    setEstimateName("");
    setEstimateProjectId(projects.length ? String(projects[0].id) : "");
    setEstimateModal(true);
  }

  function saveEstimate(e: React.FormEvent) {
    e.preventDefault();
    if (!estimateName.trim()) return;

    const estimate: Estimate = {
      id: Date.now(),
      name: estimateName.trim(),
      projectId: estimateProjectId ? Number(estimateProjectId) : null,
      date: new Date().toISOString().slice(0, 10),
      items: []
    };

    setEstimates(current => [estimate, ...current]);
    setEstimateModal(false);
    setSelectedEstimateId(estimate.id);
  }

  function deleteEstimate(id: number) {
    if (!window.confirm("Удалить эту смету?")) return;
    setEstimates(current => current.filter(e => e.id !== id));
    setSelectedEstimateId(null);
  }

  function resetItemForm() {
    setEditingItemId(null);
    setItemName("");
    setItemUnit("шт.");
    setItemQuantity("1");
    setItemPrice("0");
    setItemCategory("Материал");
  }

  function editItem(item: EstimateItem) {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemUnit(item.unit);
    setItemQuantity(String(item.quantity));
    setItemPrice(String(item.price));
    setItemCategory(item.category);
  }

  function saveEstimateItem(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEstimate || !itemName.trim()) return;

    const quantity = Number(itemQuantity.replace(",", "."));
    const price = Number(itemPrice.replace(",", "."));

    if (!Number.isFinite(quantity) || quantity <= 0) {
      alert("Количество должно быть больше нуля.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      alert("Цена не может быть отрицательной.");
      return;
    }

    const item: EstimateItem = {
      id: editingItemId ?? Date.now(),
      name: itemName.trim(),
      unit: itemUnit.trim() || "шт.",
      quantity,
      price,
      category: itemCategory
    };

    setEstimates(current => current.map(estimate => {
      if (estimate.id !== selectedEstimate.id) return estimate;

      const items = editingItemId !== null
        ? estimate.items.map(existing => existing.id === editingItemId ? item : existing)
        : [...estimate.items, item];

      return { ...estimate, items };
    }));

    resetItemForm();
  }

  function deleteEstimateItem(itemId: number) {
    if (!selectedEstimate) return;
    if (!window.confirm("Удалить эту позицию?")) return;

    setEstimates(current => current.map(estimate =>
      estimate.id === selectedEstimate.id
        ? { ...estimate, items: estimate.items.filter(item => item.id !== itemId) }
        : estimate
    ));

    if (editingItemId === itemId) resetItemForm();
  }

  function estimateTotal(estimate: Estimate) {
    return estimate.items.reduce(
      (sum, item) => sum + item.quantity * item.price, 0
    );
  }

  function renderProjects() {
    return (
      <>
        <div className="welcome">
          <div>
            <span className="eyebrow">РАБОЧАЯ ОБЛАСТЬ</span>
            <h1>Мои проекты</h1>
            <p>Создавайте объекты и управляйте ходом электромонтажных
