import { useState, useEffect } from "react";

// ─── UK Tax Constants 2024/25 ─────────────────────────────────────────────────
const PA = 12570;
const BASIC_LIMIT = 50270;
const HIGHER_LIMIT = 125140;
const NI_PT = 12570;
const NI_UEL = 50270;
const MIN_ANNUAL = Math.round(11.44 * 16 * 52);
const UPPER_LIMIT = 100000;
const AVG_UK_NURSERY_HOURLY = 10.07;

// ─── Tax Engine ───────────────────────────────────────────────────────────────
function calcTax(gross, sacrifice = 0, studentLoan = "none") {
  const adj = Math.max(0, gross - sacrifice);
  let pa = PA;
  if (adj > 100000) pa = Math.max(0, PA - Math.floor((adj - 100000) / 2));
  const taxable = Math.max(0, adj - pa);
  const basicBand = Math.max(0, BASIC_LIMIT - pa);
  let incomeTax = 0;
  if (taxable <= basicBand) incomeTax = taxable * 0.20;
  else if (taxable <= HIGHER_LIMIT - pa) incomeTax = basicBand * 0.20 + (taxable - basicBand) * 0.40;
  else incomeTax = basicBand * 0.20 + (HIGHER_LIMIT - pa - basicBand) * 0.40 + (taxable - (HIGHER_LIMIT - pa)) * 0.45;
  const niBase = Math.max(0, adj - NI_PT);
  const ni = Math.min(niBase, NI_UEL - NI_PT) * 0.08 + Math.max(0, niBase - (NI_UEL - NI_PT)) * 0.02;
  const slThresh = { plan1: 22015, plan2: 27295, plan4: 27660 }[studentLoan] || 0;
  const sl = slThresh > 0 ? Math.max(0, adj - slThresh) * 0.09 : 0;
  const marginalRate = adj > HIGHER_LIMIT ? 0.45 : adj > BASIC_LIMIT ? 0.40 : adj > PA ? 0.20 : 0;
  return { gross, adj, sacrifice, pa, incomeTax, ni, sl, takeHome: adj - incomeTax - ni - sl, marginalRate };
}

function calcCycleToWork(gross, bikeCost, months, studentLoan) {
  if (!bikeCost || bikeCost <= 0) return null;
  const annualSacrifice = (bikeCost / months) * 12;
  const without = calcTax(gross, 0, studentLoan);
  const withScheme = calcTax(gross, annualSacrifice, studentLoan);
  const totalSaving = (without.incomeTax + without.ni - withScheme.incomeTax - withScheme.ni) * (months / 12);
  return { bikeCost, months, annualSacrifice, totalSaving, effectiveCost: bikeCost - totalSaving, savingPct: (totalSaving / bikeCost) * 100 };
}

function calcEVCar(gross, monthlyLease, p11d = 40000, bikRate = 0.02, studentLoan = "none") {
  if (!monthlyLease || monthlyLease <= 0) return null;
  const annualLease = monthlyLease * 12;
  const without = calcTax(gross, 0, studentLoan);
  const withCar = calcTax(gross, annualLease, studentLoan);
  const taxNiSaving = (without.incomeTax + without.ni) - (withCar.incomeTax + withCar.ni);
  const bikTax = p11d * bikRate * (withCar.marginalRate || 0.20);
  const netBenefit = taxNiSaving - bikTax;
  return { annualLease, p11d, bikRate, bikTax, taxNiSaving, netBenefit, effectiveMonthly: (annualLease - netBenefit) / 12 };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const pn = (v) => { const n = parseFloat(String(v || "").replace(/,/g, "")); return isNaN(n) ? 0 : n; };
const fmt = (n, d = 0) => "£" + Math.abs(Math.round(n * 10 ** d) / 10 ** d).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtPct = (v) => Math.round(v) + "%";
const clampPct = (v, mx) => Math.min(100, Math.max(0, (v / mx) * 100));

function currentTaxYear() { const n = new Date(); return n.getMonth() >= 3 ? n.getFullYear() : n.getFullYear() - 1; }
function monthsInTaxYear() {
  const ty = currentTaxYear();
  return Array.from({ length: 12 }, (_, i) => {
    const mi = (3 + i) % 12, yr = mi >= 3 ? ty : ty + 1;
    return { label: new Date(yr, mi, 1).toLocaleString("en-GB", { month: "short", year: "2-digit" }), key: `${yr}-${mi}` };
  });
}
const MONTHS = monthsInTaxYear();
const _n = new Date();
const TODAY_KEY = `${_n.getFullYear()}-${_n.getMonth()}`;

function getTermDate(dob) {
  if (!dob) return null;
  const d = new Date(dob), nine = new Date(d);
  nine.setMonth(nine.getMonth() + 9);
  const yr = nine.getFullYear();
  return [new Date(yr-1,0,1),new Date(yr-1,3,1),new Date(yr-1,8,1),new Date(yr,0,1),new Date(yr,3,1),new Date(yr,8,1),new Date(yr+1,0,1),new Date(yr+1,3,1),new Date(yr+1,8,1)].sort((a,b)=>a-b).find(t=>t>=nine)||null;
}
const daysUntil = (d) => d ? Math.ceil((d - new Date()) / 86400000) : null;

const defaultProfile = (who) => ({
  who, inputMode: "simple", annualSalary: "", monthlyOverrides: {}, bonuses: [],
  studentLoan: "none",
  pension: { enabled: false, type: "percent", value: "" },
  cycleToWork: { enabled: false, bikeCost: "", months: "12" },
  evCar: { enabled: false, monthlyLease: "", p11d: "", bikRate: "2" },
});

// ─── Design Tokens ───────────────────────────────────────────────────────────
const T = {
  bg: "#f7f6f3",
  surface: "#ffffff",
  border: "#e4e2dc",
  borderStrong: "#ccc9c0",
  text: "#1c1b18",
  textSub: "#6b6860",
  textMuted: "#a09d96",
  accent: "#d97757",
  accentLight: "#fdf0eb",
  accentBorder: "#f0c4b0",
  green: "#2d6a4f",
  greenLight: "#edf7f2",
  greenBorder: "#a8d5bf",
  red: "#c0392b",
  redLight: "#fdf2f1",
  amber: "#9a6700",
  amberLight: "#fef9ec",
  amberBorder: "#f0d080",
};

const SERIF = "'Georgia', 'Times New Roman', serif";
const SANS = "-apple-system, 'Segoe UI', sans-serif";

const css = {
  input: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "9px 12px", color: T.text, fontSize: 14, fontFamily: SANS, width: "100%", boxSizing: "border-box", outline: "none" },
  inputSm: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "7px 10px", color: T.text, fontSize: 13, fontFamily: SANS, outline: "none", width: "100%", boxSizing: "border-box" },
  label: { fontSize: 12, color: T.textSub, marginBottom: 6, display: "block", fontFamily: SANS },
  divider: { height: 1, background: T.border, margin: "20px 0" },
  card: (extra = {}) => ({ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", ...extra }),
  sectionLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textMuted, marginBottom: 14, fontFamily: SANS },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14, fontFamily: SANS },
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
function Pill({ ok, children }) {
  return <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500, fontFamily: SANS, background: ok ? T.greenLight : T.redLight, color: ok ? T.green : T.red, border: `1px solid ${ok ? T.greenBorder : "#f5c6c2"}` }}>{children}</span>;
}

function Notice({ type = "info", children }) {
  const s = { info: { bg: "#f0f4ff", border: "#c7d7ff", text: "#3045a0" }, good: { bg: T.greenLight, border: T.greenBorder, text: T.green }, warn: { bg: T.amberLight, border: T.amberBorder, text: T.amber }, danger: { bg: T.redLight, border: "#f5c6c2", text: T.red } }[type];
  return <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: s.text, marginBottom: 16, fontFamily: SANS, lineHeight: 1.6 }}>{children}</div>;
}

function ProgressBar({ value, max, color = T.accent }) {
  return <div style={{ height: 3, borderRadius: 2, background: T.border, overflow: "hidden", marginTop: 6 }}><div style={{ height: "100%", width: `${clampPct(value, max)}%`, background: color, borderRadius: 2, transition: "width 0.4s ease" }} /></div>;
}

function Toggle({ on, onChange }) {
  return <div onClick={() => onChange(!on)} style={{ width: 36, height: 20, borderRadius: 10, background: on ? T.accent : T.border, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}><div style={{ position: "absolute", top: 3, left: on ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} /></div>;
}

// ─── Eligibility Check ────────────────────────────────────────────────────────
function EligibilityCheck({ onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const questions = [
    { id: "working", q: "Are you (and your partner, if you have one) currently working?", hint: "Both parents must be working — or one working and one on maternity, paternity, or sick leave.", yes: "Yes — we're both working (or one is on parental leave)", no: "No — one of us isn't working" },
    { id: "earning", q: "Do you each expect to earn at least £9,518 this tax year?", hint: "That's 16 hours/week at minimum wage. If you're on maternity leave, you automatically pass this test.", yes: "Yes — or I'm on maternity / parental leave", no: "No, I earn less than this" },
    { id: "upper", q: "Does either of you have an adjusted net income above £100,000?", hint: "Adjusted net income = gross salary minus pension contributions. Either parent over £100k makes the household ineligible.", yes: "Yes — one of us earns over £100,000", no: "No — we're both under £100,000" },
    { id: "age", q: "Is your child 9 months or older?", hint: "Eligibility starts the term after your child turns 9 months. Terms begin 1 Jan, 1 Apr, and 1 Sep.", yes: "Yes — they're over 9 months old", no: "No — not yet, or not born yet" },
  ];

  const current = questions[step];

  const answer = (val) => {
    const newAnswers = { ...answers, [current.id]: val };
    setAnswers(newAnswers);
    const earlyExit = (current.id === "working" && val === "no") || (current.id === "earning" && val === "no") || (current.id === "upper" && val === "yes");
    if (earlyExit || step === questions.length - 1) { onComplete(newAnswers); return; }
    setStep(step + 1);
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
        {questions.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? T.accent : T.border, transition: "background 0.3s" }} />)}
      </div>
      <div style={{ fontSize: 11, color: T.textMuted, fontFamily: SANS, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Question {step + 1} of {questions.length}</div>
      <div style={{ fontSize: 21, fontFamily: SERIF, color: T.text, fontWeight: 400, marginBottom: 10, lineHeight: 1.4 }}>{current.q}</div>
      <div style={{ fontSize: 13, color: T.textSub, marginBottom: 24, lineHeight: 1.6, fontFamily: SANS }}>{current.hint}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[{ val: "yes", label: current.yes, icon: "✓", iconColor: T.green }, { val: "no", label: current.no, icon: "✕", iconColor: T.red }].map(({ val, label, icon, iconColor }) => (
          <button key={val} onClick={() => answer(val)}
            style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "13px 18px", textAlign: "left", cursor: "pointer", fontFamily: SANS, fontSize: 14, color: T.text, display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = val === "yes" ? T.accent : T.borderStrong; e.currentTarget.style.background = val === "yes" ? T.accentLight : T.bg; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}>
            <span style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${T.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, color: iconColor }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>
      {step > 0 && <button onClick={() => setStep(step - 1)} style={{ marginTop: 18, background: "none", border: "none", color: T.textMuted, fontSize: 13, fontFamily: SANS, cursor: "pointer", padding: 0 }}>← Back</button>}
    </div>
  );
}

function EligibilityResult({ answers, onGoToCalculator, onRetake }) {
  const notWorking = answers.working === "no";
  const notEarning = answers.earning === "no";
  const overLimit = answers.upper === "yes";
  const childTooYoung = answers.age === "no";
  const eligible = !notWorking && !notEarning && !overLimit && !childTooYoung;
  const incomeOk = !notWorking && !notEarning && !overLimit;

  const { emoji, headline, detail, ctaLabel, type } = eligible
    ? { emoji: "✓", headline: "You appear to qualify for 30 hours free childcare", detail: "Use the calculator to track your eligibility date, model your income, and see exactly how much you'll save.", ctaLabel: "Open calculator →", type: "good" }
    : incomeOk && childTooYoung
    ? { emoji: "⏳", headline: "Your income qualifies — your child isn't old enough yet", detail: "Open the calculator, set your child's date of birth, and get an exact countdown to your eligibility date.", ctaLabel: "See countdown →", type: "warn" }
    : overLimit
    ? { emoji: "!", headline: "One of you earns over £100,000", detail: "Pension salary sacrifice can reduce your adjusted net income below £100k and restore eligibility. The Income & Tax tab models this for you.", ctaLabel: "Model pension sacrifice →", type: "danger" }
    : notEarning
    ? { emoji: "✕", headline: "You don't currently meet the minimum earnings threshold", detail: "The minimum is £9,518/year (16 hours/week at minimum wage). If you're about to start a new role, you may qualify soon.", ctaLabel: "Open calculator →", type: "danger" }
    : { emoji: "✕", headline: "One parent isn't working", detail: "Both parents must be working (unless one is on parental, adoption or sick leave).", ctaLabel: "Open calculator →", type: "danger" };

  const colors = { good: { bg: T.greenLight, border: T.greenBorder }, warn: { bg: T.amberLight, border: T.amberBorder }, danger: { bg: T.redLight, border: "#f5c6c2" } }[type];

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ borderRadius: 12, padding: "24px 28px", marginBottom: 20, background: colors.bg, border: `1.5px solid ${colors.border}` }}>
        <div style={{ fontSize: 26, marginBottom: 8 }}>{emoji}</div>
        <div style={{ fontFamily: SERIF, fontSize: 20, color: T.text, marginBottom: 8, lineHeight: 1.3 }}>{headline}</div>
        <div style={{ fontSize: 14, color: T.textSub, lineHeight: 1.6, fontFamily: SANS }}>{detail}</div>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={onGoToCalculator} style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: "12px 22px", fontSize: 14, fontFamily: SANS, fontWeight: 500, cursor: "pointer" }}>{ctaLabel}</button>
        <button onClick={onRetake} style={{ background: "none", color: T.textSub, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 18px", fontSize: 14, fontFamily: SANS, cursor: "pointer" }}>Retake check</button>
      </div>
    </div>
  );
}

// ─── Profile Editor ───────────────────────────────────────────────────────────
function ProfileEditor({ profile, onChange, title }) {
  const isHer = profile.who === "her";
  const set = (k, v) => onChange({ ...profile, [k]: v });
  const setN = (k, s, v) => onChange({ ...profile, [k]: { ...(profile[k] || {}), [s]: v } });

  const gross = (() => {
    if (profile.inputMode === "simple") return pn(profile.annualSalary) + (profile.bonuses || []).reduce((s, b) => s + pn(b.amount), 0);
    const vals = Object.values(profile.monthlyOverrides || {}).map(pn).filter(v => v > 0);
    return (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length * 12 : 0) + (profile.bonuses || []).reduce((s, b) => s + pn(b.amount), 0);
  })();

  const pensionAmt = profile.pension?.enabled ? (profile.pension.type === "percent" ? gross * (pn(profile.pension.value) / 100) : pn(profile.pension.value)) : 0;
  const cycleMonths = pn(profile.cycleToWork?.months) || 12;
  const cycleAnnualSac = profile.cycleToWork?.enabled ? (pn(profile.cycleToWork?.bikeCost) / cycleMonths) * 12 : 0;
  const evAnnual = profile.evCar?.enabled ? pn(profile.evCar?.monthlyLease) * 12 : 0;
  const totalSacrifice = pensionAmt + cycleAnnualSac + evAnnual;
  const tax = calcTax(gross, totalSacrifice, profile.studentLoan);
  const taxNoSac = calcTax(gross, 0, profile.studentLoan);
  const pensionSaving = taxNoSac.incomeTax + taxNoSac.ni - calcTax(gross, pensionAmt, profile.studentLoan).incomeTax - calcTax(gross, pensionAmt, profile.studentLoan).ni;
  const cycleResult = profile.cycleToWork?.enabled ? calcCycleToWork(gross, pn(profile.cycleToWork?.bikeCost), cycleMonths, profile.studentLoan) : null;
  const evResult = profile.evCar?.enabled ? calcEVCar(gross, pn(profile.evCar?.monthlyLease), pn(profile.evCar?.p11d) || 40000, pn(profile.evCar?.bikRate || "2") / 100, profile.studentLoan) : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, fontFamily: SERIF, color: T.text }}>{title}</h3>
        <div style={{ display: "flex", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 3, gap: 2 }}>
          {["simple", "advanced"].map(mode => (
            <button key={mode} onClick={() => set("inputMode", mode)} style={{ padding: "5px 14px", fontSize: 12, fontFamily: SANS, fontWeight: profile.inputMode === mode ? 600 : 400, background: profile.inputMode === mode ? T.surface : "transparent", color: profile.inputMode === mode ? T.text : T.textMuted, border: `1px solid ${profile.inputMode === mode ? T.border : "transparent"}`, borderRadius: 4, cursor: "pointer" }}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {profile.inputMode === "simple" && (
        <div style={{ marginBottom: 16 }}>
          <label style={css.label}>{isHer ? "Normal annual salary" : "Annual salary"}</label>
          <input style={css.input} type="number" placeholder="e.g. 45000" value={profile.annualSalary ?? ""} onChange={e => set("annualSalary", e.target.value)} />
          {isHer && <p style={{ fontSize: 12, color: T.textSub, margin: "8px 0 0", fontFamily: SANS }}>She automatically meets the minimum earnings threshold while on maternity leave.</p>}
        </div>
      )}

      {profile.inputMode === "advanced" && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: T.textSub, margin: "0 0 12px", fontFamily: SANS }}>Enter gross monthly salary for each month of the current tax year.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {MONTHS.map(m => {
              const isNow = m.key === TODAY_KEY;
              return (
                <div key={m.key}>
                  <label style={{ ...css.label, color: isNow ? T.accent : T.textSub, fontWeight: isNow ? 600 : 400 }}>{m.label}</label>
                  <input style={{ ...css.input, borderColor: isNow ? T.accentBorder : T.border }} type="number" placeholder="—"
                    value={(profile.monthlyOverrides || {})[m.key] ?? ""}
                    onChange={e => onChange({ ...profile, monthlyOverrides: { ...(profile.monthlyOverrides || {}), [m.key]: e.target.value } })} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label style={{ ...css.label, margin: 0 }}>One-off bonuses</label>
        <button onClick={() => set("bonuses", [...(profile.bonuses || []), { label: "", amount: "" }])} style={{ fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer", fontFamily: SANS, padding: 0 }}>+ Add bonus</button>
      </div>
      {(profile.bonuses || []).length === 0
        ? <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 16px", fontFamily: SANS }}>No bonuses added.</p>
        : (profile.bonuses || []).map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input style={{ ...css.inputSm, flex: 2 }} placeholder="e.g. Annual bonus" value={b.label ?? ""} onChange={e => set("bonuses", profile.bonuses.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
            <input style={{ ...css.inputSm, flex: 1 }} type="number" placeholder="£" value={b.amount ?? ""} onChange={e => set("bonuses", profile.bonuses.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))} />
            <button onClick={() => set("bonuses", profile.bonuses.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: T.textMuted, fontSize: 18, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>×</button>
          </div>
        ))
      }

      <div style={css.divider} />
      <label style={css.label}>Student loan</label>
      <select style={{ ...css.input, marginBottom: 0 }} value={profile.studentLoan || "none"} onChange={e => set("studentLoan", e.target.value)}>
        <option value="none">None</option>
        <option value="plan1">Plan 1 — pre-2012 / Scotland / NI</option>
        <option value="plan2">Plan 2 — post-2012 England / Wales</option>
        <option value="plan4">Plan 4 — Scotland post-2021</option>
      </select>

      <div style={css.divider} />
      <div style={css.sectionLabel}>Salary sacrifice</div>

      {[
        {
          key: "pension", label: "Pension contributions",
          content: profile.pension?.enabled && (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select style={{ ...css.inputSm, width: "auto" }} value={profile.pension?.type || "percent"} onChange={e => onChange({ ...profile, pension: { ...(profile.pension || {}), type: e.target.value, value: "" } })}>
                  <option value="percent">% of salary</option>
                  <option value="fixed">£ per year</option>
                </select>
                <input style={{ ...css.inputSm, width: 90 }} type="number" placeholder={profile.pension?.type === "percent" ? "e.g. 5" : "e.g. 3000"} value={profile.pension?.value ?? ""} onChange={e => setN("pension", "value", e.target.value)} />
                {pensionAmt > 0 && <span style={{ fontSize: 12, color: T.textSub, fontFamily: SANS }}>{fmt(pensionAmt)}/yr</span>}
              </div>
              {pensionAmt > 0 && <div style={{ marginTop: 10, fontSize: 12, color: T.green, fontFamily: SANS }}>Saves ~{fmt(pensionSaving)}/yr · Adjusted net income: {fmt(tax.adj)}{gross > UPPER_LIMIT && gross - pensionAmt <= UPPER_LIMIT && <span> — restores eligibility ✓</span>}{gross > UPPER_LIMIT && gross - pensionAmt > UPPER_LIMIT && <span style={{ color: T.amber }}> — still {fmt(tax.adj - UPPER_LIMIT)} above £100k</span>}</div>}
            </>
          )
        },
        {
          key: "cycleToWork", label: "Cycle to Work scheme",
          content: profile.cycleToWork?.enabled && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                <div><label style={css.label}>Bike cost</label><input style={css.inputSm} type="number" placeholder="e.g. 2000" value={profile.cycleToWork?.bikeCost ?? ""} onChange={e => setN("cycleToWork", "bikeCost", e.target.value)} /></div>
                <div><label style={css.label}>Scheme length</label><select style={css.inputSm} value={profile.cycleToWork?.months || "12"} onChange={e => setN("cycleToWork", "months", e.target.value)}><option value="12">12 months</option><option value="18">18 months</option></select></div>
              </div>
              {cycleResult && <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[["Bike cost", fmt(cycleResult.bikeCost), T.text], ["Tax & NI saved", fmt(cycleResult.totalSaving), T.green], ["You effectively pay", fmt(cycleResult.effectiveCost), T.accent]].map(([k, v, col]) => (
                  <div key={k} style={{ background: T.bg, borderRadius: 6, padding: "10px 12px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, fontFamily: SANS }}>{k}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: col, fontFamily: SERIF }}>{v}</div>
                  </div>
                ))}
              </div>}
            </>
          )
        },
        {
          key: "evCar", label: "Electric car salary sacrifice",
          content: profile.evCar?.enabled && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                <div><label style={css.label}>Monthly lease sacrifice</label><input style={css.inputSm} type="number" placeholder="e.g. 500" value={profile.evCar?.monthlyLease ?? ""} onChange={e => setN("evCar", "monthlyLease", e.target.value)} /></div>
                <div><label style={css.label}>Car P11D value</label><input style={css.inputSm} type="number" placeholder="e.g. 40000" value={profile.evCar?.p11d ?? ""} onChange={e => setN("evCar", "p11d", e.target.value)} /></div>
                <div style={{ gridColumn: "1 / -1" }}><label style={css.label}>BIK rate</label><select style={css.inputSm} value={profile.evCar?.bikRate || "2"} onChange={e => setN("evCar", "bikRate", e.target.value)}><option value="2">2% — Pure EV (2024/25)</option><option value="3">3% — Pure EV (2025/26)</option><option value="5">5% — PHEV &lt;30g/km</option><option value="8">8% — PHEV 30–49g/km</option></select></div>
              </div>
              {evResult && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
                {[["Annual lease", fmt(evResult.annualLease), T.text], ["Tax & NI saved", fmt(evResult.taxNiSaving), T.green], ["BIK tax", fmt(evResult.bikTax), T.amber], ["Net saving", fmt(evResult.netBenefit), evResult.netBenefit > 0 ? T.green : T.red], ["Effective monthly", fmt(evResult.effectiveMonthly), T.accent]].map(([k, v, col]) => (
                  <div key={k} style={{ background: T.bg, borderRadius: 6, padding: "10px 12px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, fontFamily: SANS }}>{k}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: col, fontFamily: SERIF }}>{v}</div>
                  </div>
                ))}
              </div>}
            </>
          )
        }
      ].map(({ key, label, content }) => (
        <div key={key} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: profile[key]?.enabled ? 12 : 0 }}>
            <Toggle on={profile[key]?.enabled} onChange={v => setN(key, "enabled", v)} />
            <span style={{ fontSize: 14, fontFamily: SANS, color: T.text }}>{label}</span>
          </div>
          {content}
        </div>
      ))}

      {gross > 0 && (
        <>
          <div style={css.divider} />
          <div style={css.sectionLabel}>Estimated take-home</div>
          {[
            ["Gross salary", fmt(gross), T.text],
            totalSacrifice > 0 ? ["Salary sacrifice", `− ${fmt(totalSacrifice)}`, T.textSub] : null,
            ["Income tax", `− ${fmt(tax.incomeTax)}`, T.textSub],
            ["National Insurance", `− ${fmt(tax.ni)}`, T.textSub],
            tax.sl > 0 ? ["Student loan", `− ${fmt(tax.sl)}`, T.textSub] : null,
          ].filter(Boolean).map(([k, v, col], i, arr) => (
            <div key={k} style={{ ...css.row, borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
              <span style={{ color: T.textSub }}>{k}</span><span style={{ color: col }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: "16px 20px", background: T.accentLight, border: `1px solid ${T.accentBorder}`, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: T.textSub, fontFamily: SANS, marginBottom: 2 }}>Annual take-home</div>
              <div style={{ fontSize: 26, fontFamily: SERIF, color: T.text }}>{fmt(tax.takeHome)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, color: T.textSub, fontFamily: SANS, marginBottom: 2 }}>Monthly</div>
              <div style={{ fontSize: 20, fontFamily: SERIF, color: T.text }}>{fmt(tax.take
