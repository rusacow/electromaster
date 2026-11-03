
"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Zap,
  Cable,
  ShieldCheck,
  Calculator,
  RotateCcw,
  Info,
} from "lucide-react";

type CalculationType = "power" | "current" | "resistance";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm";

export default function CalculationsPage() {
  const [active, setActive] = useState<CalculationType>("current");
  const [voltage, setVoltage] = useState("230");
  const [power, setPower] = useState("3000");
  const [current, setCurrent] = useState("16");
  const [resistance, setResistance] = useState("10");
  const [powerFactor, setPowerFactor] = useState("1");

  const result = useMemo(() => {
    const u = Number(voltage);
    const p = Number(power);
    const i = Number(current);
    const r = Number(resistance);
    const cos = Number(powerFactor);

    if (
      !Number.isFinite(u) ||
      !Number.isFinite(p) ||
      !Number.isFinite(i) ||
      !Number.isFinite(r) ||
      !Number.isFinite(cos)
    ) {
      return null;
    }

    if (active === "current") {
      if (u <= 0 || p < 0 || cos <= 0 || cos > 1) return null;
      return {
        value: p / (u * cos),
        unit: "А",
        formula: "I = P / (U × cos φ)",
      };
    }

    if (active === "power") {
      if (u <= 0 || i < 0 || cos <= 0 || cos > 1) return null;
      return {
        value: u * i * cos,
        unit: "Вт",
        formula: "P = U × I × cos φ",
      };
    }

    if (u <= 0 || r <= 0) return null;

    return {
      value: u / r,
      unit: "А",
      formula: "I = U / R",
    };
  }, [active, voltage, power, current, resistance, powerFactor]);

  const reset = () => {
    setVoltage("230");
    setPower("3000");
    setCurrent("16");
    setResistance("10");
    setPowerFactor("1");
  };

  const tabs = [
    { id: "current" as const, label: "Расчёт тока", icon: Activity },
    { id: "power" as const, label: "Расчёт мощности", icon: Zap },
    { id: "resistance" as const, label: "Сопротивление", icon: Calculator },
  ];

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-600">
            <Zap size={18} />
            ElectroMaster
            <span className="text-gray-400">/</span>
            Инженерные расчёты
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Инженерные расчёты
          </h1>

          <p className="mt-3 max-w-2xl text-gray-500">
            Инструменты для электротехнических расчётов,
            предварительного подбора оборудования и проектирования.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Activity, title: "Электрические параметры", text: "Ток, мощность, сопротивление" },
            { icon: Cable, title: "Расчёт кабеля", text: "Сечение и падение напряжения" },
            { icon: ShieldCheck, title: "Защитные аппараты", text: "Автоматы, УЗО и дифавтоматы" },
            { icon: Calculator, title: "Инженерные формулы", text: "Основные электрические величины" },
          ].map((item) => (
            <div key={item.title} className={cardClass}>
              <item.icon className="mb-3 text-blue-600" size={25} />
              <h2 className="font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-gray-500">{item.text}</p>
            </div>
          ))}
        </section>

        <section className={cardClass}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Электрический калькулятор</h2>
              <p className="mt-1 text-sm text-gray-500">
                Выберите тип расчёта и укажите исходные данные.
              </p>
            </div>

            <button
              onClick={reset}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
            >
              <RotateCcw size={16} />
              Сбросить
            </button>
          </div>

          <div className="mb-6 grid gap-2 sm:grid-cols-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const selected = active === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    selected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Напряжение, В
                </label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="any"
                  value={voltage}
                  onChange={(e) => setVoltage(e.target.value)}
                />
              </div>

              {active === "current" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Активная мощность, Вт
                    </label>
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      step="any"
                      value={power}
                      onChange={(e) => setPower(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Коэффициент мощности cos φ
                    </label>
                    <input
                      className={inputClass}
                      type="number"
                      min="0.01"
                      max="1"
                      step="0.01"
                      value={powerFactor}
                      onChange={(e) => setPowerFactor(e.target.value)}
                    />
                  </div>
                </>
              )}

              {active === "power" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Ток, А
                    </label>
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      step="any"
                      value={current}
                      onChange={(e) => setCurrent(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Коэффициент мощности cos φ
                    </label>
                    <input
                      className={inputClass}
                      type="number"
                      min="0.01"
                      max="1"
                      step="0.01"
                      value={powerFactor}
                      onChange={(e) => setPowerFactor(e.target.value)}
                    />
                  </div>
                </>
              )}

              {active === "resistance" && (
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Сопротивление, Ом
                  </label>
                  <input
                    className={inputClass}
                    type="number"
                    min="0.01"
                    step="any"
                    value={resistance}
                    onChange={(e) => setResistance(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-between rounded-2xl bg-blue-50 p-6">
              <div>
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-blue-700">
                  <Activity size={18} />
                  Результат расчёта
                </div>

                {result && Number.isFinite(result.value) ? (
                  <>
                    <div className="text-4xl font-bold text-blue-900">
                      {result.value.toLocaleString("ru-RU", {
                        maximumFractionDigits: 3,
                      })}{" "}
                      <span className="text-2xl">{result.unit}</span>
                    </div>

                    <div className="mt-5 rounded-xl bg-white p-4">
                      <p className="text-xs text-gray-500">Используемая формула</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {result.formula}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-red-600">
                    Проверьте исходные данные. Значения должны быть корректными и положительными.
                  </p>
                )}
              </div>

              <p className="mt-6 text-xs text-blue-700">
                Результат является математическим расчётом по указанным
                исходным данным.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 shrink-0 text-amber-600" size={21} />
            <div>
              <h3 className="font-semibold text-amber-900">
                Важная информация
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-amber-800">
                Этот калькулятор выполняет базовые математические расчёты.
                Он не заменяет полноценный проектный расчёт с учётом ПУЭ,
                ГОСТ, СП, условий прокладки кабелей, токов короткого
                замыкания и характеристик защитных аппаратов.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

