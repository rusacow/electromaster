"use client";

import { useState } from "react";
import {
  Activity, Bell, BookOpen, Calculator, Cable, ChevronDown,
  ChevronRight, ClipboardList, FileText, FolderKanban, House,
  LayoutDashboard, LifeBuoy, Menu, Plus, Search, Settings,
  ShieldCheck, X, Zap, Ruler
} from "lucide-react";

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

export default function Home() {
  const [active, setActive] = useState("Рабочий стол");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [projects, setProjects] = useState([
    { id: 1, name: "Электрика — частный дом", client: "Александр", status: "В работе", progress: 68 },
    { id: 2, name: "Квартира, 2 комнаты", client: "Ирина", status: "Расчёт", progress: 35 },
    { id: 3, name: "Освещение мастерской", client: "Сергей", status: "Завершён", progress: 100 }
  ]);

  const filtered = projects.filter(p =>
    (p.name + p.client).toLowerCase().includes(search.toLowerCase())
  );

  function addProject(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setProjects([
      { id: Date.now(), name, client: client || "Не указан", status: "Новый", progress: 0 },
      ...projects
    ]);
    setName("");
    setClient("");
    setModal(false);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Zap fill="currentColor" /></div>
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
                onClick={() => setActive(item.name)}
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
          <div className="breadcrumbs">ElectroMaster <ChevronRight size={15} /> <b>{active}</b></div>
          <div className="top-actions">
            <span className="demo-label">● Демо-режим</span>
            <button className="icon-button" aria-label="Уведомления"><Bell /></button>
            <div className="avatar">ЭМ</div>
          </div>
        </header>

        <section className="content">
          <div className="welcome">
            <div>
              <span className="eyebrow">РАБОЧАЯ ПАНЕЛЬ</span>
              <h1>Добро пожаловать в ElectroMaster</h1>
              <p>Всё необходимое для организации электромонтажных проектов — в одном месте.</p>
            </div>
            <button className="primary-button" onClick={() => setModal(true)}>
              <Plus size={19} /> Создать проект
            </button>
          </div>

          <div className="notice">
            <ShieldCheck size={23} />
            <div>
              <b>Демонстрационная версия</b>
              <p>Пока данные хранятся только в текущем сеансе браузера. Регистрация, база данных и синхронизация будут подключены отдельно.</p>
            </div>
          </div>

          <div className="stats">
            <article><span>Всего проектов</span><strong>{projects.length.toString().padStart(2, "0")}</strong><small>В списке проектов</small></article>
            <article><span>В работе</span><strong>{projects.filter(p => p.status === "В работе").length.toString().padStart(2, "0")}</strong><small>Активные объекты</small></article>
            <article><span>Сметы</span><strong>02</strong><small>Демонстрационные записи</small></article>
            <article><span>Документы</span><strong>08</strong><small>Демонстрационные записи</small></article>
          </div>

          <div className="section-heading">
            <div><h2>Последние проекты</h2><p>Быстрый доступ к текущим объектам</p></div>
            <button className="text-button" onClick={() => setActive("Мои проекты")}>Все проекты <ChevronRight size={17} /></button>
          </div>

          <div className="toolbar">
            <div className="search-box"><Search size={19} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по проектам..." /></div>
            <button className="reset-button" onClick={() => setSearch("")}>Сбросить поиск</button>
          </div>

          <div className="project-list">
            {filtered.map(project => (
              <article className="project-row" key={project.id}>
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
            {!filtered.length && <p className="empty">Проекты не найдены.</p>}
          </div>

          <div className="shortcuts">
            <article><Calculator /><div><b>Инженерные расчёты</b><p>Предварительный подбор кабеля и защиты.</p><button onClick={() => setActive("Инженерные расчёты")}>Перейти <ChevronRight size={15} /></button></div></article>
            <article><Ruler /><div><b>Планы помещений</b><p>Схемы, размеры и размещение оборудования.</p><button onClick={() => setActive("Чертежи и планы")}>Перейти <ChevronRight size={15} /></button></div></article>
            <article><BookOpen /><div><b>База знаний</b><p>Справочные материалы и инструкции.</p><button onClick={() => setActive("Обучение")}>Перейти <ChevronRight size={15} /></button></div></article>
          </div>

          <footer>© 2026 ElectroMaster <span>Платформа для электромонтажников</span></footer>
        </section>
      </main>

      {modal && (
        <div className="modal-overlay">
          <form className="modal" onSubmit={addProject}>
            <button type="button" className="modal-close" onClick={() => setModal(false)}><X /></button>
            <h2>Новый проект</h2>
            <p>Добавьте объект в список проектов</p>
            <label>Название проекта<input required value={name} onChange={e => setName(e.target.value)} placeholder="Например, электрика в квартире" /></label>
            <label>Заказчик<input value={client} onChange={e => setClient(e.target.value)} placeholder="Имя заказчика" /></label>
            <div className="modal-actions">
              <button type="button" className="reset-button" onClick={() => setModal(false)}>Отмена</button>
              <button className="primary-button">Создать</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
