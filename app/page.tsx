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
            <p>Создавайте объекты и управляйте ходом электромонтажных работ.</p>
          </div>
          <button className="primary-button" onClick={openCreate}>
            <Plus size={19} /> Создать проект
          </button>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <Search size={19} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по названию, заказчику или адресу..."
            />
          </div>
          <button className="reset-button" onClick={() => setSearch("")}>
            Сбросить поиск
          </button>
        </div>

        <div className="stats">
          <article><span>Всего проектов</span><strong>{projects.length.toString().padStart(2, "0")}</strong><small>Все объекты</small></article>
          <article><span>В работе</span><strong>{projects.filter(p => p.status === "В работе").length.toString().padStart(2, "0")}</strong><small>Активные объекты</small></article>
          <article><span>На паузе</span><strong>{projects.filter(p => p.status === "На паузе").length.toString().padStart(2, "0")}</strong><small>Приостановленные</small></article>
          <article><span>Завершено</span><strong>{projects.filter(p => p.status === "Завершён").length.toString().padStart(2, "0")}</strong><small>Готовые объекты</small></article>
        </div>

        <div className="project-list">
          {filtered.map(project => (
            <article className="project-row" key={project.id}
              onClick={() => setSelectedId(project.id)} style={{ cursor: "pointer" }}>
              <div className="project-icon"><House /></div>
              <div className="project-name">
                <b>{project.name}</b>
                <small>{project.client}{project.address ? ` · ${project.address}` : ""}</small>
              </div>
              <div className="progress">
                <span>Готовность <b>{project.progress}%</b></span>
                <div className="progress-track"><i style={{ width: `${project.progress}%` }} /></div>
              </div>
              <span className={`status ${project.status === "Завершён" ? "done" : ""}`}>{project.status}</span>
              <ChevronRight className="row-arrow" size={19} />
            </article>
          ))}
          {!filtered.length && <p className="empty">Проекты не найдены.</p>}
        </div>
      </>
    );
  }

  function renderDashboard() {
    return (
      <>
        <div className="welcome">
          <div>
            <span className="eyebrow">РАБОЧАЯ ПАНЕЛЬ</span>
            <h1>Добро пожаловать в ElectroMaster</h1>
            <p>Всё необходимое для организации электромонтажных проектов — в одном месте.</p>
          </div>
          <button className="primary-button" onClick={openCreate}>
            <Plus size={19} /> Создать проект
          </button>
        </div>

        <div className="notice">
          <ShieldCheck size={23} />
          <div>
            <b>Демонстрационная версия</b>
            <p>Проекты и сметы сохраняются в браузере на этом устройстве. Регистрация, облачная база и синхронизация будут подключены отдельно.</p>
          </div>
        </div>

        <div className="stats">
          <article><span>Всего проектов</span><strong>{projects.length.toString().padStart(2, "0")}</strong><small>В списке проектов</small></article>
          <article><span>В работе</span><strong>{projects.filter(p => p.status === "В работе").length.toString().padStart(2, "0")}</strong><small>Активные объекты</small></article>
          <article><span>Завершено</span><strong>{projects.filter(p => p.status === "Завершён").length.toString().padStart(2, "0")}</strong><small>Готовые объекты</small></article>
          <article><span>Всего смет</span><strong>{estimates.length.toString().padStart(2, "0")}</strong><small>Созданные документы</small></article>
        </div>

        <div className="section-heading">
          <div><h2>Последние проекты</h2><p>Быстрый доступ к текущим объектам</p></div>
          <button className="text-button" onClick={() => setActive("Мои проекты")}>Все проекты <ChevronRight size={17} /></button>
        </div>

        <div className="project-list">
          {projects.slice(0, 3).map(project => (
            <article className="project-row" key={project.id}
              onClick={() => setSelectedId(project.id)} style={{ cursor: "pointer" }}>
              <div className="project-icon"><House /></div>
              <div className="project-name"><b>{project.name}</b><small>{project.client}</small></div>
              <div className="progress">
                <span>Готовность <b>{project.progress}%</b></span>
                <div className="progress-track"><i style={{ width: `${project.progress}%` }} /></div>
              </div>
              <span className={`status ${project.status === "Завершён" ? "done" : ""}`}>{project.status}</span>
              <ChevronRight className="row-arrow" size={19} />
            </article>
          ))}
          {!projects.length && <p className="empty">Пока нет проектов. Создайте первый объект.</p>}
        </div>

        <div className="shortcuts">
          <article><Calculator /><div><b>Инженерные расчёты</b><p>Предварительный подбор кабеля и защиты.</p><button onClick={() => setActive("Инженерные расчёты")}>Перейти <ChevronRight size={15} /></button></div></article>
          <article><Ruler /><div><b>Планы помещений</b><p>Схемы, размеры и размещение оборудования.</p><button onClick={() => setActive("Чертежи и планы")}>Перейти <ChevronRight size={15} /></button></div></article>
          <article><BookOpen /><div><b>База знаний</b><p>Справочные материалы и инструкции.</p><button onClick={() => setActive("Обучение")}>Перейти <ChevronRight size={15} /></button></div></article>
        </div>
      </>
    );
  }

  function renderProjectDetails(project: Project) {
    return (
      <>
        <button className="text-button" onClick={() => setSelectedId(null)}>
          <ArrowLeft size={17} /> Назад к проектам
        </button>

        <div className="welcome">
          <div>
            <span className="eyebrow">КАРТОЧКА ПРОЕКТА</span>
            <h1>{project.name}</h1>
            <p>Заказчик: {project.client}</p>
          </div>
          <button className="primary-button" onClick={() => openEdit(project)}>
            <Pencil size={17} /> Редактировать
          </button>
        </div>

        <div className="notice">
          <House size={23} />
          <div>
            <b>Информация об объекте</b>
            <p>{project.description || "Описание не добавлено."}</p>
            <p>Адрес: {project.address || "Не указан"}</p>
            <p>Дата создания: {project.createdAt}</p>
          </div>
        </div>

        <div className="stats">
          <article><span>Статус проекта</span><strong style={{ fontSize: 20 }}>{project.status}</strong><small>Текущий этап</small></article>
          <article><span>Готовность</span><strong>{project.progress}%</strong><small>Выполнение работ</small></article>
        </div>

        <div className="section-heading">
          <div><h2>Управление проектом</h2><p>Изменение статуса и готовности объекта</p></div>
        </div>

        <div className="notice">
          <div style={{ width: "100%" }}>
            <label style={{ display: "block", marginBottom: 8 }}>Статус</label>
            <select value={project.status} onChange={e => changeStatus(project.id, e.target.value)}
              style={{ padding: 12, borderRadius: 9, width: "100%", maxWidth: 350 }}>
              {statuses.map(value => <option key={value}>{value}</option>)}
            </select>
            <label style={{ display: "block", margin: "18px 0 8px" }}>Готовность: {project.progress}%</label>
            <input type="range" min="0" max="100" value={project.progress}
              onChange={e => changeProgress(project.id, Number(e.target.value))}
              style={{ width: "100%", maxWidth: 450 }} />
          </div>
        </div>

        <button className="reset-button" onClick={() => deleteProject(project.id)}
          style={{ color: "#c0392b", marginTop: 20 }}>
          <Trash2 size={17} /> Удалить проект
        </button>
      </>
    );
  }

  function renderEstimates() {
    if (selectedEstimate) {
      const linkedProject = projects.find(p => p.id === selectedEstimate.projectId);
      const total = estimateTotal(selectedEstimate);
      const materials = selectedEstimate.items.filter(i => i.category === "Материал");
      const works = selectedEstimate.items.filter(i => i.category === "Работа");

      return (
        <>
          <button className="text-button" onClick={() => { setSelectedEstimateId(null); resetItemForm(); }}>
            <ArrowLeft size={17} /> Назад к сметам
          </button>

          <div className="welcome">
            <div>
              <span className="eyebrow">СМЕТА</span>
              <h1>{selectedEstimate.name}</h1>
              <p>{linkedProject ? `Проект: ${linkedProject.name}` : "Без привязки к проекту"} · Дата: {selectedEstimate.date}</p>
            </div>
            <button className="reset-button" onClick={() => deleteEstimate(selectedEstimate.id)}
              style={{ color: "#c0392b" }}>
              <Trash2 size={17} /> Удалить смету
            </button>
          </div>

          <div className="stats">
            <article><span>Всего позиций</span><strong>{selectedEstimate.items.length}</strong><small>Материалы и работы</small></article>
            <article><span>Материалы</span><strong>{materials.length}</strong><small>Позиций материалов</small></article>
            <article><span>Работы</span><strong>{works.length}</strong><small>Позиций работ</small></article>
            <article><span>Итого</span><strong style={{ fontSize: 20 }}>{money(total)}</strong><small>Общая стоимость</small></article>
          </div>

          <div className="section-heading">
            <div><h2>Позиции сметы</h2><p>Добавляйте материалы и работы для расчёта стоимости</p></div>
          </div>

          <div className="notice" style={{ display: "block" }}>
            <form onSubmit={saveEstimateItem}>
              <h3 style={{ marginTop: 0 }}>{editingItemId !== null ? "Редактирование позиции" : "Добавить позицию"}</h3>

              <label style={{ display: "block", marginBottom: 8 }}>Тип позиции</label>
              <select value={itemCategory} onChange={e => setItemCategory(e.target.value as "Материал" | "Работа")}
                style={{ padding: 11, borderRadius: 8, width: "100%", marginBottom: 14 }}>
                <option value="Материал">Материал</option>
                <option value="Работа">Работа</option>
              </select>

              <label style={{ display: "block", marginBottom: 8 }}>Наименование</label>
              <input required value={itemName} onChange={e => setItemName(e.target.value)}
                placeholder="Например, кабель ВВГнг-LS 3×2,5"
                style={{ padding: 12, borderRadius: 8, width: "100%", marginBottom: 14, boxSizing: "border-box" }} />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 12 }}>
                <label>Единица измерения
                  <input value={itemUnit} onChange={e => setItemUnit(e.target.value)}
                    placeholder="м, шт., усл."
                    style={{ display: "block", padding: 11, borderRadius: 8, width: "100%", marginTop: 7, boxSizing: "border-box" }} />
                </label>
                <label>Количество
                  <input required type="number" min="0.001" step="any" value={itemQuantity}
                    onChange={e => setItemQuantity(e.target.value)}
                    style={{ display: "block", padding: 11, borderRadius: 8, width: "100%", marginTop: 7, boxSizing: "border-box" }} />
                </label>
                <label>Цена за единицу, ₽
                  <input required type="number" min="0" step="any" value={itemPrice}
                    onChange={e => setItemPrice(e.target.value)}
                    style={{ display: "block", padding: 11, borderRadius: 8, width: "100%", marginTop: 7, boxSizing: "border-box" }} />
                </label>
              </div>

              <p style={{ marginTop: 14 }}>
                Стоимость позиции: <b>{money((Number(itemQuantity) || 0) * (Number(itemPrice) || 0))}</b>
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                <button className="primary-button" type="submit">
                  <Plus size={17} /> {editingItemId !== null ? "Сохранить позицию" : "Добавить позицию"}
                </button>
                {editingItemId !== null && (
                  <button type="button" className="reset-button" onClick={resetItemForm}>Отмена</button>
                )}
              </div>
            </form>
          </div>

          {selectedEstimate.items.length === 0 ? (
            <div className="notice" style={{ marginTop: 20 }}>
              <ClipboardList size={24} />
              <div><b>Смета пока пустая</b><p>Добавьте первую позицию с помощью формы выше.</p></div>
            </div>
          ) : (
            <div className="project-list" style={{ marginTop: 20 }}>
              {selectedEstimate.items.map(item => (
                <article className="project-row" key={item.id} style={{ cursor: "default" }}>
                  <div className="project-icon"><ClipboardList /></div>
                  <div className="project-name">
                    <b>{item.name}</b>
                    <small>{item.category} · {item.quantity} {item.unit} × {money(item.price)}</small>
                  </div>
                  <strong>{money(item.quantity * item.price)}</strong>
                  <button className="icon-button" aria-label="Редактировать" onClick={() => editItem(item)}><Pencil size={17} /></button>
                  <button className="icon-button" aria-label="Удалить" onClick={() => deleteEstimateItem(item.id)}><Trash2 size={17} /></button>
                </article>
              ))}
            </div>
          )}

          <div className="notice" style={{ marginTop: 20 }}>
            <div style={{ width: "100%" }}>
              <h2 style={{ marginTop: 0 }}>Итоговая стоимость</h2>
              <p>Материалы: <b>{money(materials.reduce((s, i) => s + i.quantity * i.price, 0))}</b></p>
              <p>Работы: <b>{money(works.reduce((s, i) => s + i.quantity * i.price, 0))}</b></p>
              <h2 style={{ marginBottom: 0 }}>{money(total)}</h2>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <div className="welcome">
          <div>
            <span className="eyebrow">РАБОЧАЯ ОБЛАСТЬ</span>
            <h1>Сметы</h1>
            <p>Создавайте расчёты стоимости материалов и электромонтажных работ.</p>
          </div>
          <button className="primary-button" onClick={openNewEstimate}>
            <Plus size={19} /> Создать смету
          </button>
        </div>

        <div className="notice">
          <ClipboardList size={23} />
          <div>
            <b>Рабочий раздел смет</b>
            <p>Сметы сохраняются в браузере. Вы можете создавать несколько смет и связывать их с проектами.</p>
          </div>
        </div>

        <div className="stats">
          <article><span>Всего смет</span><strong>{estimates.length.toString().padStart(2, "0")}</strong><small>Созданные документы</small></article>
          <article><span>Общая стоимость</span><strong style={{ fontSize: 19 }}>{money(estimates.reduce((s, e) => s + estimateTotal(e), 0))}</strong><small>По всем сметам</small></article>
          <article><span>Материалы</span><strong>{estimates.reduce((s, e) => s + e.items.filter(i => i.category === "Материал").length, 0)}</strong><small>Позиций</small></article>
          <article><span>Работы</span><strong>{estimates.reduce((s, e) => s + e.items.filter(i => i.category === "Работа").length, 0)}</strong><small>Позиций</small></article>
        </div>

        <div className="section-heading">
          <div><h2>Мои сметы</h2><p>Откройте смету, чтобы посмотреть и изменить её позиции</p></div>
        </div>

        <div className="project-list">
          {estimates.map(estimate => {
            const project = projects.find(p => p.id === estimate.projectId);
            return (
              <article className="project-row" key={estimate.id}
                onClick={() => setSelectedEstimateId(estimate.id)} style={{ cursor: "pointer" }}>
                <div className="project-icon"><ClipboardList /></div>
                <div className="project-name">
                  <b>{estimate.name}</b>
                  <small>{project ? project.name : "Без привязки к проекту"} · {estimate.date} · {estimate.items.length} поз.</small>
                </div>
                <strong>{money(estimateTotal(estimate))}</strong>
                <ChevronRight className="row-arrow" size={19} />
              </article>
            );
          })}
          {!estimates.length && <p className="empty">Смет пока нет. Нажмите «Создать смету», чтобы начать.</p>}
        </div>
      </>
    );
  }

  function renderOtherSection() {
    const descriptions: Record<string, string> = {
      "Чертежи и планы": "Здесь будет редактор планов помещений с размерами, розетками, выключателями, светильниками и другими электрическими точками.",
      "Инженерные расчёты": "Здесь будут расчёты кабеля, автоматических выключателей, УЗО и дифавтоматов. Результаты будут предварительными и потребуют инженерной проверки.",
      "Каталог материалов": "Здесь будет каталог кабелей, автоматов, УЗО, розеток, выключателей и других материалов с возможностью добавлять собственные позиции.",
      "Документы": "Здесь будут храниться документы и файлы, связанные с проектами.",
      "Обучение": "Здесь появятся справочники, инструкции, схемы подключения и учебные материалы."
    };

    const icons: Record<string, React.ElementType> = {
      "Чертежи и планы": Ruler,
      "Инженерные расчёты": Calculator,
      "Каталог материалов": Cable,
      "Документы": FileText,
      "Обучение": BookOpen
    };

    const Icon = icons[active] || FileText;

    return (
      <>
        <div className="welcome">
          <div>
            <span className="eyebrow">РАБОЧАЯ ОБЛАСТЬ</span>
            <h1>{active}</h1>
            <p>{descriptions[active]}</p>
          </div>
        </div>
        <div className="notice">
          <Icon size={25} />
          <div>
            <b>Раздел подготовлен к разработке</b>
            <p>Функциональность этого раздела реализуем следующим этапом.</p>
          </div>
        </div>
        <div className="section-heading">
          <div><h2>Связанные проекты</h2><p>Выберите объект для дальнейшей работы</p></div>
          <button className="text-button" onClick={() => setActive("Мои проекты")}>Все проекты <ChevronRight size={17} /></button>
        </div>
        <div className="project-list">
          {projects.slice(0, 3).map(project => (
            <article className="project-row" key={project.id}
              onClick={() => setSelectedId(project.id)} style={{ cursor: "pointer" }}>
              <div className="project-icon"><House /></div>
              <div className="project-name"><b>{project.name}</b><small>{project.client}</small></div>
              <span className={`status ${project.status === "Завершён" ? "done" : ""}`}>{project.status}</span>
              <ChevronRight className="row-arrow" size={19} />
            </article>
          ))}
          {!projects.length && <p className="empty">Сначала создайте проект.</p>}
        </div>
      </>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Activity /></div>
          <div><b>ElectroMaster</b><small>РАБОЧЕЕ ПРОСТРАНСТВО</small></div>
        </div>

        <div className="workspace">
          <div className="workspace-icon"><House /></div>
          <div><b>Моя мастерская</b><small>Личный кабинет</small></div>
          <ChevronDown size={17} />
        </div>

        <div className="nav-title">РАБОЧАЯ ОБЛАСТЬ</div>
        <nav>
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.name}
                className={active === item.name ? "nav-item selected" : "nav-item"}
                onClick={() => {
                  setActive(item.name);
                  setSelectedId(null);
                  setSelectedEstimateId(null);
                  resetItemForm();
                  setSearch("");
                }}>
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <LifeBuoy size={20} />
            <b>Нужна помощь?</b>
            <p>Подсказки и материалы для работы с платформой.</p>
          </div>
          <button className="nav-item"><Settings size={19} />Настройки</button>
          <div className="profile">
            <div className="avatar">ЭМ</div>
            <div><b>Электромонтажник</b><small>Демонстрационный аккаунт</small></div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumbs">
            ElectroMaster <ChevronRight size={15} />
            <b>{selectedProject ? selectedProject.name : selectedEstimate ? selectedEstimate.name : active}</b>
          </div>
          <div className="top-actions">
            <span className="demo-label">● Демо-режим</span>
            <button className="icon-button" aria-label="Уведомления"><Bell /></button>
            <div className="avatar">ЭМ</div>
          </div>
        </header>

        <section className="content">
          {selectedProject
            ? renderProjectDetails(selectedProject)
            : active === "Рабочий стол"
              ? renderDashboard()
              : active === "Мои проекты"
                ? renderProjects()
                : active === "Сметы"
                  ? renderEstimates()
                  : renderOtherSection()}

          <footer>© 2026 ElectroMaster <span>Платформа для электромонтажников</span></footer>
        </section>
      </main>

      {modal && (
        <div className="modal-overlay">
          <form className="modal" onSubmit={saveProject}>
            <button type="button" className="modal-close" onClick={() => setModal(false)}><X /></button>
            <h2>{editingId !== null ? "Редактирование проекта" : "Новый проект"}</h2>
            <p>{editingId !== null ? "Измените данные объекта" : "Добавьте объект в список проектов"}</p>

            <label>Название проекта
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="Например, электрика в квартире" />
            </label>
            <label>Заказчик
              <input value={client} onChange={e => setClient(e.target.value)} placeholder="Имя заказчика" />
            </label>
            <label>Адрес объекта
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Адрес объекта" />
            </label>
            <label>Описание
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Дополнительная информация" rows={3} />
            </label>

            {editingId !== null && (
              <>
                <label>Статус
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    {statuses.map(value => <option key={value}>{value}</option>)}
                  </select>
                </label>
                <label>Готовность: {progress}%
                  <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))} />
                </label>
              </>
            )}

            <div className="modal-actions">
              <button type="button" className="reset-button" onClick={() => setModal(false)}>Отмена</button>
              <button className="primary-button" type="submit">{editingId !== null ? "Сохранить" : "Создать"}</button>
            </div>
          </form>
        </div>
      )}

      {estimateModal && (
        <div className="modal-overlay">
          <form className="modal" onSubmit={saveEstimate}>
            <button type="button" className="modal-close" onClick={() => setEstimateModal(false)}><X /></button>
            <h2>Новая смета</h2>
            <p>Создайте документ и при необходимости привяжите его к проекту.</p>

            <label>Название сметы
              <input required value={estimateName} onChange={e => setEstimateName(e.target.value)}
                placeholder="Например, электромонтаж частного дома" />
            </label>

            <label>Связанный проект
              <select value={estimateProjectId} onChange={e => setEstimateProjectId(e.target.value)}>
                <option value="">Без привязки</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="reset-button" onClick={() => setEstimateModal(false)}>Отмена</button>
              <button className="primary-button" type="submit"><Plus size={17} /> Создать смету</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
```
