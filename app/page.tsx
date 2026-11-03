
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

export default function Home() {
  const [active, setActive] = useState("Рабочий стол");
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Новый");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("electromaster-projects");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setProjects(parsed);
      }
    } catch {
      console.warn("Не удалось загрузить проекты");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("electromaster-projects", JSON.stringify(projects));
    }
  }, [projects, loaded]);

  const filtered = projects.filter(project =>
    `${project.name} ${project.client} ${project.address}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectedProject = projects.find(p => p.id === selectedId);

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
            <article
              className="project-row"
              key={project.id}
              onClick={() => setSelectedId(project.id)}
              style={{ cursor: "pointer" }}
            >
              <div className="project-icon"><House /></div>
              <div className="project-name">
                <b>{project.name}</b>
                <small>{project.client}{project.address ? ` · ${project.address}` : ""}</small>
              </div>
              <div className="progress">
                <span>Готовность <b>{project.progress}%</b></span>
                <div className="progress-track">
                  <i style={{ width: `${project.progress}%` }} />
                </div>
              </div>
              <span className={`status ${project.status === "Завершён" ? "done" : ""}`}>
                {project.status}
              </span>
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
            <p>Проекты сохраняются в браузере на этом устройстве. Регистрация, облачная база и синхронизация будут подключены отдельно.</p>
          </div>
        </div>

        <div className="stats">
          <article><span>Всего проектов</span><strong>{projects.length.toString().padStart(2, "0")}</strong><small>В списке проектов</small></article>
          <article><span>В работе</span><strong>{projects.filter(p => p.status === "В работе").length.toString().padStart(2, "0")}</strong><small>Активные объекты</small></article>
          <article><span>Завершено</span><strong>{projects.filter(p => p.status === "Завершён").length.toString().padStart(2, "0")}</strong><small>Готовые объекты</small></article>
          <article><span>Всего заказчиков</span><strong>{new Set(projects.map(p => p.client)).size.toString().padStart(2, "0")}</strong><small>В списке проектов</small></article>
        </div>

        <div className="section-heading">
          <div><h2>Последние проекты</h2><p>Быстрый доступ к текущим объектам</p></div>
          <button className="text-button" onClick={() => setActive("Мои проекты")}>
            Все проекты <ChevronRight size={17} />
          </button>
        </div>

        <div className="project-list">
          {projects.slice(0, 3).map(project => (
            <article
              className="project-row"
              key={project.id}
              onClick={() => setSelectedId(project.id)}
              style={{ cursor: "pointer" }}
            >
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
          <article>
            <span>Статус проекта</span>
            <strong style={{ fontSize: 20 }}>{project.status}</strong>
            <small>Текущий этап</small>
          </article>
          <article>
            <span>Готовность</span>
            <strong>{project.progress}%</strong>
            <small>Выполнение работ</small>
          </article>
        </div>

        <div className="section-heading">
          <div><h2>Управление проектом</h2><p>Изменение статуса и готовности объекта</p></div>
        </div>

        <div className="notice">
          <div style={{ width: "100%" }}>
            <label style={{ display: "block", marginBottom: 8 }}>Статус</label>
            <select
              value={project.status}
              onChange={e => changeStatus(project.id, e.target.value)}
              style={{ padding: 12, borderRadius: 9, width: "100%", maxWidth: 350 }}
            >
              {statuses.map(value => <option key={value}>{value}</option>)}
            </select>

            <label style={{ display: "block", margin: "18px 0 8px" }}>
              Готовность: {project.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={project.progress}
              onChange={e => changeProgress(project.id, Number(e.target.value))}
              style={{ width: "100%", maxWidth: 450 }}
            />
          </div>
        </div>

        <button
          className="reset-button"
          onClick={() => deleteProject(project.id)}
          style={{ color: "#c0392b", marginTop: 20 }}
        >
          <Trash2 size={17} /> Удалить проект
        </button>
      </>
    );
  }

  function renderOtherSection() {
    const descriptions: Record<string, string> = {
      "Чертежи и планы": "Здесь будет редактор планов помещений с размерами, розетками, выключателями, светильниками и другими электрическими точками.",
      "Сметы": "Здесь можно будет создавать сметы, добавлять материалы и работы, указывать количество и стоимость, рассчитывать итоговую сумму.",
      "Инженерные расчёты": "Здесь будут расчёты кабеля, автоматических выключателей, УЗО и дифавтоматов. Результаты будут предварительными и потребуют инженерной проверки.",
      "Каталог материалов": "Здесь будет каталог кабелей, автоматов, УЗО, розеток, выключателей и других материалов с возможностью добавлять собственные позиции.",
      "Документы": "Здесь будут храниться документы и файлы, связанные с проектами.",
      "Обучение": "Здесь появятся справочники, инструкции, схемы подключения и учебные материалы."
    };

    const icons: Record<string, React.ElementType> = {
      "Чертежи и планы": Ruler,
      "Сметы": ClipboardList,
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
            <p>Сейчас здесь размещена информационная заглушка. Функциональность этого раздела реализуем следующим этапом.</p>
          </div>
        </div>
        <div className="section-heading">
          <div><h2>Связанные проекты</h2><p>Выберите объект для дальнейшей работы</p></div>
          <button className="text-button" onClick={() => setActive("Мои проекты")}>
            Все проекты <ChevronRight size={17} />
          </button>
        </div>
        <div className="project-list">
          {projects.slice(0, 3).map(project => (
            <article className="project-row" key={project.id} onClick={() => setSelectedId(project.id)} style={{ cursor: "pointer" }}>
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
              <button
                key={item.name}
                className={active === item.name ? "nav-item selected" : "nav-item"}
                onClick={() => {
                  setActive(item.name);
                  setSelectedId(null);
                  setSearch("");
                }}
              >
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
            ElectroMaster <ChevronRight size={15} /> <b>{selectedProject ? selectedProject.name : active}</b>
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
                : renderOtherSection()}

          <footer>© 2026 ElectroMaster <span>Платформа для электромонтажников</span></footer>
        </section>
      </main>

      {modal && (
        <div className="modal-overlay">
          <form className="modal" onSubmit={saveProject}>
            <button type="button" className="modal-close" onClick={() => setModal(false)}>
              <X />
            </button>
            <h2>{editingId !== null ? "Редактирование проекта" : "Новый проект"}</h2>
            <p>{editingId !== null ? "Измените данные объекта" : "Добавьте объект в список проектов"}</p>

            <label>
              Название проекта
              <input required value={name} onChange={e => setName(e.target.value)} placeholder="Например, электрика в квартире" />
            </label>
            <label>
              Заказчик
              <input value={client} onChange={e => setClient(e.target.value)} placeholder="Имя заказчика" />
            </label>
            <label>
              Адрес объекта
              <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Адрес объекта" />
            </label>
            <label>
              Описание
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Дополнительная информация" rows={3} />
            </label>
            {editingId !== null && (
              <>
                <label>
                  Статус
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    {statuses.map(value => <option key={value}>{value}</option>)}
                  </select>
                </label>
                <label>
                  Готовность: {progress}%
                  <input type="range" min="0" max="100" value={progress} onChange={e => setProgress(Number(e.target.value))} />
                </label>
              </>
            )}

            <div className="modal-actions">
              <button type="button" className="reset-button" onClick={() => setModal(false)}>Отмена</button>
              <button className="primary-button" type="submit">
                {editingId !== null ? "Сохранить" : "Создать"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
