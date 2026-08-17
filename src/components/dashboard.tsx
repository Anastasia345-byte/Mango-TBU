"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, BarChart3, BookOpen, CheckCircle2, ChevronDown, Copy, Download, Plus, RotateCcw, Save, Trash2, Upload } from "lucide-react";
import { exampleData } from "@/data/example";
import { calculateSalon } from "@/lib/finance";
import { salonSchema } from "@/lib/schema";
import type { SalonInputs } from "@/lib/types";

const rub = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 });
const num = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });
const percent = (value: number | null) => value === null ? "—" : `${(value * 100).toFixed(1)}%`;
const COLORS = ["#215f54", "#3b8276", "#68a89e", "#e7aa55", "#d57a55", "#68839c", "#95a867", "#8e6f9f", "#c18c9c", "#71837c", "#71a177"];
const STORAGE_KEY = "mango-tbu-v2";

type NumberKey = Exclude<keyof SalonInputs, "categories">;

function MoneyField({ label, name, register }: { label: string; name: NumberKey; register: ReturnType<typeof useForm<SalonInputs>>["register"] }) {
  return <label className="field"><span>{label}</span><input type="number" min="0" step="100" {...register(name, { valueAsNumber: true })} /></label>;
}

function RateField({ label, name, value, setValue }: { label: string; name: NumberKey; value: number; setValue: ReturnType<typeof useForm<SalonInputs>>["setValue"] }) {
  return <label className="field"><span>{label}</span><div className="suffix"><input type="number" min="0" max="100" step="0.1" value={Number.isFinite(value) ? Math.round(value * 1000) / 10 : 0} onChange={(e) => setValue(name, Number(e.target.value) / 100, { shouldDirty: true, shouldValidate: true })} /><b>%</b></div></label>;
}

function Kpi({ title, value, detail, tone = "neutral" }: { title: string; value: string; detail: string; tone?: "good" | "warn" | "bad" | "neutral" }) {
  return <article className={`kpi ${tone}`}><span>{title}</span><strong>{value}</strong><small>{detail}</small></article>;
}

export function Dashboard() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeScenario, setActiveScenario] = useState("Базовый");
  const [savedNames, setSavedNames] = useState<string[]>([]);
  const [expandedExpense, setExpandedExpense] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const form = useForm<SalonInputs>({ defaultValues: exampleData, resolver: zodResolver(salonSchema), mode: "onChange" });
  const { register, watch, reset, setValue, getValues, control, formState } = form;
  const fields = useFieldArray({ control, name: "categories", keyName: "formId" });
  const values = watch();
  const result = useMemo(() => calculateSalon(values), [values]);
  const baseResult = useMemo(() => calculateSalon(exampleData), []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { current?: SalonInputs; active?: string; scenarios?: Record<string, SalonInputs> };
        if (parsed.current) reset(parsed.current);
        if (parsed.active) setActiveScenario(parsed.active);
        setSavedNames(Object.keys(parsed.scenarios ?? {}));
      }
    } catch { /* Повреждённые локальные данные игнорируются. */ }
    setHydrated(true);
  }, [reset]);

  useEffect(() => {
    if (!hydrated) return;
    const old = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<string, unknown>;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...old, current: values, active: activeScenario }));
  }, [values, activeScenario, hydrated]);

  const loadPreset = (scenario: string) => {
    setActiveScenario(scenario);
    if (scenario === "Базовый") reset(exampleData);
    if (scenario === "Консервативный") reset({ ...exampleData, categories: exampleData.categories.map(c => ({ ...c, volume: Math.round(c.volume * .85) })) });
    if (scenario === "Целевой") reset({ ...exampleData, categories: exampleData.categories.map(c => ({ ...c, price: Math.round(c.price * 1.1), volume: Math.round(c.volume * 1.08) })) });
    if (scenario === "Пользовательский") {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as { scenarios?: Record<string, SalonInputs> };
      const last = Object.values(stored.scenarios ?? {}).at(-1);
      if (last) reset(last);
    }
  };

  const saveScenario = () => {
    const name = window.prompt("Название сценария", `Сценарий ${savedNames.length + 1}`)?.trim();
    if (!name) return;
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as { scenarios?: Record<string, SalonInputs> };
    const scenarios = { ...(stored.scenarios ?? {}), [name]: getValues() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, current: getValues(), active: "Пользовательский", scenarios }));
    setSavedNames(Object.keys(scenarios)); setActiveScenario("Пользовательский");
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(getValues(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "mango-tbu-scenario.json"; a.click(); URL.revokeObjectURL(url);
  };

  const importJson = async (file?: File) => {
    if (!file) return;
    try { const parsed = salonSchema.parse(JSON.parse(await file.text())); reset(parsed); setActiveScenario("Пользовательский"); }
    catch { window.alert("Файл не соответствует структуре сценария."); }
  };

  const categoryChart = result.categories.map(c => ({ name: `${c.direction}: ${c.name}`, "План": c.revenue, "Индивидуальная ТБУ": c.individualBepRevenue ?? 0, "Доля общей ТБУ": c.allocatedServiceBep ?? 0 }));
  const priceChart = result.categories.map(c => ({ name: c.name, "Текущая": c.price, "Минимальная": c.minimumPrice ?? 0, "Рекомендуемая": c.targetPrice ?? 0 }));
  const scenarioChart = [
    { name: "Выручка", Базовый: baseResult.totalRevenue, Текущий: result.totalRevenue },
    { name: "ТБУ", Базовый: baseResult.businessBep ?? 0, Текущий: result.businessBep ?? 0 },
    { name: "Прибыль", Базовый: baseResult.profit, Текущий: result.profit },
    { name: "Запас", Базовый: baseResult.safetyMarginRub ?? 0, Текущий: result.safetyMarginRub ?? 0 },
  ];
  const topExpenses = [...result.expenseBreakdown].filter(e => e.type !== "Результат").sort((a,b) => b.value-a.value).slice(0,3);

  return <main>
    <header className="topbar">
      <div><p className="eyebrow">MANGO · ПЛАН ИЮНЯ 2026</p><h1>Калькулятор ТБУ салона</h1><p>Заполнен по финансовой модели: безубыточность, рекомендуемые цены и структура каждого рубля выручки.</p></div>
      <div className="actions">
        <select aria-label="Сценарий" value={activeScenario} onChange={e => loadPreset(e.target.value)}>{["Базовый", "Консервативный", "Целевой", "Пользовательский"].map(s => <option key={s}>{s}</option>)}</select>
        <button onClick={() => reset(exampleData)}><RotateCcw />Загрузить пример</button>
        <button onClick={saveScenario}><Save />Сохранить</button>
        <button onClick={exportJson}><Download />JSON</button>
        <button onClick={() => fileRef.current?.click()}><Upload />Импорт</button>
        <input ref={fileRef} hidden type="file" accept="application/json" onChange={e => void importJson(e.target.files?.[0])} />
      </div>
    </header>

    <section className="kpi-grid" aria-label="Ключевые показатели">
      <Kpi title="Общая выручка" value={rub.format(result.totalRevenue)} detail="все направления" />
      <Kpi title="Выручка услуг" value={rub.format(result.serviceRevenue)} detail={`${result.categories.length} категорий`} />
      <Kpi title="Общая ТБУ бизнеса" value={result.businessBep === null ? "Не рассчитывается" : rub.format(result.businessBep)} detail={`КМД ${percent(result.businessCmr)}`} tone={result.businessBep !== null && result.totalRevenue >= result.businessBep ? "good" : "bad"} />
      <Kpi title="ТБУ направления услуг" value={result.serviceBep === null ? "Не рассчитывается" : rub.format(result.serviceBep)} detail={`КМД ${percent(result.serviceCmr)}`} tone={result.serviceBep !== null && result.serviceRevenue >= result.serviceBep ? "good" : "bad"} />
      <Kpi title="Прибыль" value={rub.format(result.profit)} detail={`рентабельность ${percent(result.profitMargin)}`} tone={result.profit >= 0 ? "good" : "bad"} />
      <Kpi title="Запас прочности" value={result.safetyMarginRub === null ? "—" : rub.format(result.safetyMarginRub)} detail={percent(result.safetyMarginPercent)} tone={(result.safetyMarginPercent ?? -1) >= values.minimumSafetyMargin ? "good" : "warn"} />
    </section>

    <section className="panel">
      <div className="section-title"><div><p className="step">01 · Исходные данные</p><h2>Экономика салона</h2></div><span className="legend input">Вводимые значения</span></div>
      <div className="form-groups">
        <fieldset><legend>Выручка вне услуг</legend><MoneyField label="Розничные продажи" name="retailRevenue" register={register}/><MoneyField label="Обучение" name="educationRevenue" register={register}/><MoneyField label="Сертификаты" name="certificatesRevenue" register={register}/><MoneyField label="Собственная косметика" name="ownCosmeticsRevenue" register={register}/><MoneyField label="Прочая выручка" name="otherRevenue" register={register}/></fieldset>
        <fieldset><legend>Налоги и комиссии</legend><RateField label="Эффективная ставка налога" name="taxRate" value={values.taxRate} setValue={setValue}/><RateField label="НДС" name="vatRate" value={values.vatRate} setValue={setValue}/><RateField label="Эквайринг" name="acquiringRate" value={values.acquiringRate} setValue={setValue}/><RateField label="Клиентский сервис" name="clientServiceRate" value={values.clientServiceRate} setValue={setValue}/><RateField label="Прочие переменные" name="otherBusinessVariableRate" value={values.otherBusinessVariableRate} setValue={setValue}/></fieldset>
        <fieldset><legend>Постоянные расходы</legend><MoneyField label="Аренда" name="rent" register={register}/><MoneyField label="Коммунальные" name="utilities" register={register}/><MoneyField label="Административный ФОТ" name="adminPayroll" register={register}/><MoneyField label="Взносы на адм. ФОТ" name="adminContributions" register={register}/><MoneyField label="Маркетинг" name="marketing" register={register}/><MoneyField label="ПО" name="software" register={register}/><MoneyField label="Бухгалтерия" name="accounting" register={register}/><MoneyField label="Хозяйственные" name="household" register={register}/><MoneyField label="Прочие" name="otherFixed" register={register}/></fieldset>
        <fieldset><legend>Себестоимость и цели</legend><MoneyField label="Себестоимость розницы" name="retailCost" register={register}/><MoneyField label="Себестоимость косметики" name="ownCosmeticsCost" register={register}/><MoneyField label="Постоянные расходы услуг" name="serviceFixedCosts" register={register}/><RateField label="Целевая рентабельность" name="targetMargin" value={values.targetMargin} setValue={setValue}/><RateField label="Минимальный запас" name="minimumSafetyMargin" value={values.minimumSafetyMargin} setValue={setValue}/></fieldset>
      </div>
      {Object.keys(formState.errors).length > 0 && <p className="error"><AlertTriangle/>Проверьте отрицательные значения и ставки выше 100%.</p>}
    </section>

    <section className="panel">
      <div className="section-title"><div><p className="step">02 · Конструктор</p><h2>Направления и категории мастеров</h2></div><button className="primary" onClick={() => fields.append({ id: crypto.randomUUID(), direction: "Новое направление", name: "Мастер", masters: 1, price: 0, volume: 0, commissionRate: .4, payoutPerService: 0, consumablesRate: 0, otherVariableRate: 0, otherVariablePerService: 0 })}><Plus/>Добавить категорию</button></div>
      <div className="table-wrap"><table className="editor"><thead><tr><th>Направление</th><th>Категория</th><th>Мастеров</th><th>Цена</th><th>Услуг</th><th>Комиссия, %</th><th>Выплата/услуга</th><th>Материалы, %</th><th>Прочие, %</th><th>Прочие/услуга</th><th></th></tr></thead><tbody>{fields.fields.map((field, i) => <tr key={field.formId}>
        <td><input {...register(`categories.${i}.direction`)} /></td><td><input {...register(`categories.${i}.name`)} /></td>
        {(["masters","price","volume"] as const).map(k => <td key={k}><input type="number" min="0" {...register(`categories.${i}.${k}`, { valueAsNumber: true })}/></td>)}
        <td><input type="number" min="0" max="100" value={Math.round((values.categories?.[i]?.commissionRate ?? 0)*1000)/10} onChange={e=>setValue(`categories.${i}.commissionRate`,Number(e.target.value)/100,{shouldValidate:true})}/></td>
        <td><input type="number" min="0" {...register(`categories.${i}.payoutPerService`,{valueAsNumber:true})}/></td>
        <td><input type="number" min="0" max="100" value={Math.round((values.categories?.[i]?.consumablesRate ?? 0)*1000)/10} onChange={e=>setValue(`categories.${i}.consumablesRate`,Number(e.target.value)/100,{shouldValidate:true})}/></td>
        <td><input type="number" min="0" max="100" value={Math.round((values.categories?.[i]?.otherVariableRate ?? 0)*1000)/10} onChange={e=>setValue(`categories.${i}.otherVariableRate`,Number(e.target.value)/100,{shouldValidate:true})}/></td>
        <td><input type="number" min="0" {...register(`categories.${i}.otherVariablePerService`,{valueAsNumber:true})}/></td>
        <td className="row-actions"><button title="Копировать" onClick={()=>fields.insert(i+1,{...getValues(`categories.${i}`),id:crypto.randomUUID()})}><Copy/></button><button title="Удалить" onClick={()=>fields.remove(i)}><Trash2/></button></td>
      </tr>)}</tbody></table></div>
      <p className="note"><strong>Важно:</strong> комиссия мастера и фиксированная выплата применяются одновременно. Налоги и общие комиссии добавляются один раз к каждой категории.</p>
    </section>

    <section className="panel">
      <div className="section-title"><div><p className="step">03 · Расчёт</p><h2>ТБУ и план цен по категориям</h2></div><span className="legend calc">Расчётные значения</span></div>
      <div className="table-wrap"><table><thead><tr><th>Направление / категория</th><th>Выручка</th><th>Переменные расходы</th><th>Маржа/услуга</th><th>КМД</th><th>Выделено постоянных</th><th title="Самостоятельная безубыточность категории; складывать с другими нельзя">Индивидуальная ТБУ</th><th title="Распределение общей ТБУ услуг; сумма равна общей ТБУ">Доля общей ТБУ</th><th>Мин. цена</th><th>Рекоменд. цена</th><th>Прибыль</th><th>Статус</th></tr></thead><tbody>{result.categories.map(c => <tr key={c.id}><td><b>{c.direction}</b><small>{c.name} · {c.masters} маст.</small></td><td>{rub.format(c.revenue)}</td><td>{rub.format(c.variableCosts)}</td><td>{c.contributionPerService === null ? "—" : rub.format(c.contributionPerService)}</td><td>{percent(c.cmr)}</td><td>{rub.format(c.allocatedFixedCosts)}</td><td>{c.individualBepRevenue === null ? "—" : <>{rub.format(c.individualBepRevenue)}<small>{num.format(c.individualBepUnits ?? 0)} услуг</small></>}</td><td>{c.allocatedServiceBep === null ? "—" : rub.format(c.allocatedServiceBep)}</td><td>{c.minimumPrice === null ? "—" : rub.format(c.minimumPrice)}</td><td>{c.targetPrice === null ? <span className="bad-text">Недостижима</span> : rub.format(c.targetPrice)}</td><td className={c.profit >= 0 ? "good-text" : "bad-text"}>{rub.format(c.profit)}</td><td><span className={`status ${c.status}`}>{c.status === "safe" ? "Выше ТБУ" : c.status === "warning" ? "Малый запас" : c.status === "loss" ? "Ниже ТБУ" : "Нет данных"}</span></td></tr>)}</tbody><tfoot><tr><td>Итого по услугам</td><td>{rub.format(result.serviceRevenue)}</td><td>{rub.format(result.serviceVariableCosts)}</td><td>—</td><td>{percent(result.serviceCmr)}</td><td>{rub.format(result.serviceFixedCosts)}</td><td><span title="Справочно; не является общей ТБУ">{rub.format(result.categories.reduce((s,c)=>s+(c.individualBepRevenue??0),0))}</span></td><td>{result.serviceBep === null ? "—" : rub.format(result.serviceBep)}</td><td colSpan={4}></td></tr></tfoot></table></div>
      <div className="explain"><AlertTriangle/><p><strong>Почему две ТБУ?</strong> Индивидуальная ТБУ показывает самостоятельную безубыточность категории и не складывается с другими. Для сверки с общей ТБУ используется «Доля общей ТБУ услуг»: сумма этих долей всегда равна ТБУ услуг.</p></div>
    </section>

    <section className="charts-grid">
      <article className="panel chart large"><div className="section-title"><div><p className="step">04 · Структура</p><h2>Куда уходят средства</h2></div></div><div className="donut-layout"><ResponsiveContainer width="100%" height={330}><PieChart><Pie data={result.expenseBreakdown} dataKey="value" nameKey="name" innerRadius={75} outerRadius={120} paddingAngle={2}>{result.expenseBreakdown.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={(v)=>rub.format(Number(v))}/></PieChart></ResponsiveContainer><div className="expense-list">{result.expenseBreakdown.map((e,i)=><button key={e.name} onClick={()=>setExpandedExpense(expandedExpense===e.name?null:e.name)}><i style={{background:COLORS[i%COLORS.length]}}/><span>{e.name}<small>{e.type}{expandedExpense===e.name ? ` · ${percent(e.value/result.totalRevenue)}` : ""}</small></span><b>{rub.format(e.value)}</b><ChevronDown/></button>)}</div></div><p className="insight">Три крупнейшие статьи: {topExpenses.map(e=>`${e.name} — ${percent(e.value/result.totalRevenue)}`).join(", ")}. После покрытия расходов остаётся {percent(result.profitMargin)} {result.profit >= 0 ? "прибыли" : "убытка"}.</p></article>
      <article className="panel chart"><h2>От выручки к прибыли</h2><ResponsiveContainer width="100%" height={300}><BarChart data={[{name:"Выручка",value:result.totalRevenue},{name:"Переменные",value:-result.totalVariableCosts},{name:"Марж. доход",value:result.totalContribution},{name:"Постоянные",value:-result.businessFixedCosts},{name:"Прибыль",value:result.profit}]}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis tickFormatter={v=>`${Math.round(v/1000)}к`}/><Tooltip formatter={v=>rub.format(Number(v))}/><Bar dataKey="value" radius={[6,6,0,0]}>{[0,1,2,3,4].map((_,i)=><Cell key={i} fill={["#215f54","#d57a55","#68a89e","#e7aa55",result.profit>=0?"#4f8c62":"#c65151"][i]}/>)}</Bar></BarChart></ResponsiveContainer></article>
      <article className="panel chart large"><h2>ТБУ по категориям</h2><ResponsiveContainer width="100%" height={330}><BarChart data={categoryChart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:11}} interval={0}/><YAxis tickFormatter={v=>`${Math.round(v/1000)}к`}/><Tooltip formatter={v=>rub.format(Number(v))}/><Legend/><Bar dataKey="План" fill="#215f54"/><Bar dataKey="Индивидуальная ТБУ" fill="#e7aa55"/><Bar dataKey="Доля общей ТБУ" fill="#68a89e"/></BarChart></ResponsiveContainer></article>
      <article className="panel chart"><h2>Цены по категориям</h2><ResponsiveContainer width="100%" height={300}><BarChart data={priceChart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis/><Tooltip formatter={v=>rub.format(Number(v))}/><Legend/><Bar dataKey="Текущая" fill="#68839c"/><Bar dataKey="Минимальная" fill="#e7aa55"/><Bar dataKey="Рекомендуемая" fill="#215f54"/></BarChart></ResponsiveContainer></article>
      <article className="panel chart"><h2>Сравнение сценариев</h2><ResponsiveContainer width="100%" height={300}><BarChart data={scenarioChart}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name"/><YAxis tickFormatter={v=>`${Math.round(v/1000)}к`}/><Tooltip formatter={v=>rub.format(Number(v))}/><Legend/><Bar dataKey="Базовый" fill="#b6c4c1"/><Bar dataKey="Текущий" fill="#215f54"/></BarChart></ResponsiveContainer></article>
    </section>

    <section className="lower-grid">
      <article className="panel"><p className="step">05 · Автоматический анализ</p><h2>Выводы и рекомендации</h2><div className="recommendations">{result.recommendations.map((r,i)=><div key={i}><BarChart3/><p>{r}</p></div>)}</div></article>
      <article className="panel"><p className="step">06 · Контроль</p><h2>Проверка расчётов</h2><div className="checks">{result.checks.map(c=><div key={c.label}>{c.ok?<CheckCircle2/>:<AlertTriangle/>}<span>{c.label}{c.delta !== undefined && Math.abs(c.delta)>.01?<small>Расхождение {rub.format(c.delta)}</small>:null}</span></div>)}</div></article>
    </section>

    <section className="panel help"><div><p className="step">07 · Справка</p><h2>Как считается ТБУ</h2></div><div className="help-grid"><div><BookOpen/><h3>1. Считаем маржу</h3><p>Из выручки вычитаются комиссия мастера, фиксированная выплата, материалы, налоги и другие переменные расходы. Эти расходы учитываются по одному разу.</p></div><div><BookOpen/><h3>2. Находим коэффициент</h3><p>Маржинальный доход делится на выручку. Он показывает, какая часть каждого рубля остаётся для покрытия постоянных расходов.</p></div><div><BookOpen/><h3>3. Рассчитываем ТБУ</h3><p>Постоянные расходы делятся на коэффициент маржинального дохода. Ниже этой выручки бизнес убыточен.</p></div><div><BookOpen/><h3>4. Разделяем показатели</h3><p>Общая ТБУ бизнеса включает все направления. ТБУ услуг — только услуги. Индивидуальная ТБУ категории является отдельным аналитическим сценарием.</p></div></div></section>
    <footer>Данные хранятся только в вашем браузере и не отправляются на сервер.</footer>
  </main>;
}
