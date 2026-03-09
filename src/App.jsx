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
              <div style={{ fontSize: 20, fontFamily: SERIF, color: T.text }}>{fmt(tax.takeHome / 12)}</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const links = [
    ["30-hour-free-childcare-eligibility","30-Hour Eligibility"],["childcare-term-dates","Term Dates 2025"],
    ["adjusted-net-income","Adjusted Net Income"],["salary-sacrifice-childcare","Salary Sacrifice"],
    ["how-to-apply-tax-free-childcare","How to Apply"],["tax-free-childcare-vs-vouchers","TFC vs Vouchers"],
    ["free-childcare-maternity-leave","Maternity Leave"],["free-childcare-self-employed","Self-Employed"],
    ["free-childcare-single-parents","Single Parents"],["reconfirm-tax-free-childcare","Reconfirmation"],
    ["free-childcare-scotland","Scotland"],["free-childcare-wales","Wales"],
  ];
  return (
    <div style={{ borderTop: `1px solid ${T.border}`, padding: "28px 24px", background: T.surface }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", justifyContent: "center", marginBottom: 14 }}>
          {links.map(([slug, label]) => (
            <a key={slug} href={`/${slug}.html`} style={{ fontSize: 12, color: T.textMuted, textDecoration: "none" }}
              onMouseEnter={e => e.currentTarget.style.color = T.accent}
              onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>{label}</a>
          ))}
        </div>
        <div style={{ textAlign: "center", fontSize: 11, color: T.textMuted }}>
          © 2025 freechildcarehours.co.uk · For informational purposes only · Always verify at <a href="https://www.gov.uk/tax-free-childcare" style={{ color: T.textMuted }}>gov.uk</a>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ChildcareTracker() {
  const [dob, setDob] = useState("");
  const [myProfile, setMyProfile] = useState(defaultProfile("me"));
  const [herProfile, setHerProfile] = useState(defaultProfile("her"));
  const [activeTab, setActiveTab] = useState(null);
  const [nursery, setNursery] = useState({ hourlyRate: "", hours: "30", useAvg: false });
  const [checkAnswers, setCheckAnswers] = useState(null);
  const [checkDone, setCheckDone] = useState(false);

  useEffect(() => {
    try {
      const d = localStorage.getItem("cc4-dob"); if (d) setDob(d);
      const m = localStorage.getItem("cc4-my"); if (m) setMyProfile(JSON.parse(m));
      const h = localStorage.getItem("cc4-her"); if (h) setHerProfile(JSON.parse(h));
      const n = localStorage.getItem("cc4-nursery"); if (n) setNursery(JSON.parse(n));
      const ca = localStorage.getItem("cc4-check"); if (ca) { setCheckAnswers(JSON.parse(ca)); setCheckDone(true); }
    } catch {}
  }, []);

  const saveProfile = (who, p) => {
    try { localStorage.setItem(who === "me" ? "cc4-my" : "cc4-her", JSON.stringify(p)); } catch {}
    who === "me" ? setMyProfile(p) : setHerProfile(p);
  };
  const saveDob = (v) => { setDob(v); try { localStorage.setItem("cc4-dob", v); } catch {}; };
  const saveNursery = (v) => { setNursery(v); try { localStorage.setItem("cc4-nursery", JSON.stringify(v)); } catch {}; };

  const getGross = (p) => {
    if (p.inputMode === "simple") return pn(p.annualSalary) + (p.bonuses || []).reduce((s, b) => s + pn(b.amount), 0);
    const vals = Object.values(p.monthlyOverrides || {}).map(pn).filter(v => v > 0);
    return (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length * 12 : 0) + (p.bonuses || []).reduce((s, b) => s + pn(b.amount), 0);
  };
  const getTotalSac = (p, g) => {
    const pension = p.pension?.enabled ? (p.pension.type === "percent" ? g * (pn(p.pension.value) / 100) : pn(p.pension.value)) : 0;
    const cycle = p.cycleToWork?.enabled ? (pn(p.cycleToWork?.bikeCost) / (pn(p.cycleToWork?.months) || 12)) * 12 : 0;
    const ev = p.evCar?.enabled ? pn(p.evCar?.monthlyLease) * 12 : 0;
    return pension + cycle + ev;
  };

  const myGross = getGross(myProfile), herGross = getGross(herProfile);
  const myTax = calcTax(myGross, getTotalSac(myProfile, myGross), myProfile.studentLoan);
  const herTax = calcTax(herGross, getTotalSac(herProfile, herGross), herProfile.studentLoan);
  const myMeetsMin = myTax.adj >= MIN_ANNUAL;
  const myOverLimit = myTax.adj > UPPER_LIMIT;
  const herOverLimit = herTax.adj > UPPER_LIMIT;
  const incomeEligible = myMeetsMin && !myOverLimit && !herOverLimit;
  const termDate = getTermDate(dob);
  const daysLeft = daysUntil(termDate);
  const childEligible = termDate ? new Date() >= termDate : false;
  const fullyEligible = incomeEligible && childEligible;
  const termLabel = termDate?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const termShort = termDate?.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  const TERM_WEEKS = 38;

  const Header = ({ inCalculator }) => (
    <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 54, gap: 16 }}>
        <button onClick={() => setActiveTab(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 15, fontFamily: SERIF, color: T.text }}>Free Childcare Hours</span>
          <span style={{ fontSize: 11, color: T.textMuted, fontFamily: SANS }}>UK 2024/25</span>
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {inCalculator && <Pill ok={fullyEligible}>{fullyEligible ? "Eligible" : childEligible ? "Check income" : "Not yet eligible"}</Pill>}
          <button onClick={() => setActiveTab("guides")} style={{ fontSize: 13, color: T.textSub, fontFamily: SANS, background: "none", border: "none", cursor: "pointer", padding: 0 }}>Guides</button>
          {!inCalculator && (
            <button onClick={() => setActiveTab("dashboard")} style={{ fontSize: 13, color: T.surface, background: T.accent, border: "none", borderRadius: 6, padding: "7px 14px", fontFamily: SANS, cursor: "pointer", fontWeight: 500 }}>
              Calculator
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── HOMEPAGE ──────────────────────────────────────────────────────────────
  if (activeTab === null) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, fontFamily: SANS }}>
        <Header inCalculator={false} />

        <div style={{ background: "#1c1b18", color: "#fff", padding: "72px 24px 80px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "inline-block", background: "rgba(217,119,87,0.18)", border: "1px solid rgba(217,119,87,0.35)", borderRadius: 20, padding: "5px 14px", fontSize: 11, color: "#f0a080", fontFamily: SANS, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 24 }}>
              UK 30-hour free childcare · 2024/25
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: "clamp(26px, 5vw, 46px)", fontWeight: 400, lineHeight: 1.2, margin: "0 0 18px", color: "#fff" }}>
              Do you qualify for<br />30 hours free childcare?
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, margin: "0 0 36px", maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
              Answer 4 quick questions to find out — then use our free calculator to track your eligibility date and see exactly how much you'll save.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => document.getElementById("check-section")?.scrollIntoView({ behavior: "smooth" })}
                style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: "13px 26px", fontSize: 14, fontFamily: SANS, fontWeight: 500, cursor: "pointer" }}>
                Check eligibility →
              </button>
              <button onClick={() => setActiveTab("dashboard")}
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, padding: "13px 22px", fontSize: 14, fontFamily: SANS, cursor: "pointer" }}>
                Open calculator
              </button>
            </div>
          </div>
        </div>

        <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {[["£11,900+","Average annual saving"], ["30 hrs/wk","Over 38 term weeks"], ["+ £2,000","Tax-Free Childcare top-up"]].map(([val, label], i) => (
              <div key={label} style={{ padding: "20px 16px", textAlign: "center", borderRight: i < 2 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ fontFamily: SERIF, fontSize: 20, color: T.accent, marginBottom: 4 }}>{val}</div>
                <div style={{ fontSize: 12, color: T.textSub }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div id="check-section" style={{ maxWidth: 680, margin: "0 auto", padding: "56px 24px" }}>
          <div style={{ marginBottom: 32, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.accent, marginBottom: 10 }}>Quick eligibility check</div>
            <div style={{ fontFamily: SERIF, fontSize: 24, color: T.text, marginBottom: 10 }}>Find out in 60 seconds</div>
            <div style={{ fontSize: 14, color: T.textSub }}>Four yes/no questions. No numbers needed.</div>
          </div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: "36px 40px" }}>
            {!checkDone
              ? <EligibilityCheck onComplete={ans => { setCheckAnswers(ans); setCheckDone(true); try { localStorage.setItem("cc4-check", JSON.stringify(ans)); } catch {} }} />
              : <EligibilityResult answers={checkAnswers} onGoToCalculator={() => setActiveTab("dashboard")} onRetake={() => { setCheckDone(false); setCheckAnswers(null); }} />
            }
          </div>
        </div>

        <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ fontFamily: SERIF, fontSize: 22, color: T.text }}>How the scheme works</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 28 }}>
              {[
                { n: "1", title: "Check eligibility", body: "Both parents must be working and earning at least £9,518/year. Neither can earn over £100k adjusted." },
                { n: "2", title: "Apply to HMRC", body: "Apply at gov.uk around 3 months before your child's eligibility date. You'll receive an 11-digit code." },
                { n: "3", title: "Give code to nursery", body: "Your nursery redeems the code. You get 30 free hours per week across 38 term weeks each year." },
                { n: "4", title: "Reconfirm every 3 months", body: "You must reconfirm your eligibility via HMRC quarterly or your code is suspended." },
              ].map(({ n, title, body }) => (
                <div key={n}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.accentLight, border: `1px solid ${T.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: T.accent, fontFamily: SERIF, marginBottom: 10 }}>{n}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 13, color: T.textSub, lineHeight: 1.6 }}>{body}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: "0 auto", padding: "56px 24px", textAlign: "center" }}>
          <div style={{ fontFamily: SERIF, fontSize: 22, color: T.text, marginBottom: 10 }}>Ready to run the numbers?</div>
          <div style={{ fontSize: 14, color: T.textSub, marginBottom: 28, lineHeight: 1.6 }}>Model your income, salary sacrifice, eligibility countdown, and annual savings in one place.</div>
          <button onClick={() => setActiveTab("dashboard")} style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: "13px 30px", fontSize: 14, fontFamily: SANS, fontWeight: 500, cursor: "pointer" }}>
            Open the calculator →
          </button>
        </div>

        <Footer />
      </div>
    );
  }

  // ── CALCULATOR ────────────────────────────────────────────────────────────
  const CALC_TABS = [["dashboard","My eligibility"],["income","Income & Tax"],["betteroff","Savings"],["guides","Guides"]];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: SANS }}>
      <Header inCalculator={true} />

      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", padding: "0 24px", overflowX: "auto" }}>
          {CALC_TABS.map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ background: "none", border: "none", borderBottom: `2px solid ${activeTab === id ? T.text : "transparent"}`, color: activeTab === id ? T.text : T.textMuted, padding: "13px 16px", fontSize: 13, fontFamily: SANS, fontWeight: activeTab === id ? 500 : 400, cursor: "pointer", whiteSpace: "nowrap", marginRight: 2, transition: "color 0.15s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 64px" }}>

        {/* MY ELIGIBILITY */}
        {activeTab === "dashboard" && (
          <>
            {!dob ? (
              <div style={{ ...css.card(), marginBottom: 20 }}>
                <div style={{ fontFamily: SERIF, fontSize: 16, color: T.text, marginBottom: 6 }}>When is your child's date of birth?</div>
                <div style={{ fontSize: 13, color: T.textSub, marginBottom: 16, lineHeight: 1.5 }}>We'll calculate the exact term when your child becomes eligible and start the countdown.</div>
                <input type="date" style={{ ...css.input, maxWidth: 220 }} value={dob} onChange={e => saveDob(e.target.value)} />
                <div style={{ marginTop: 12, fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>Eligibility starts the <strong style={{ color: T.textSub }}>term after</strong> your child turns 9 months. Terms: <strong style={{ color: T.textSub }}>1 Jan · 1 Apr · 1 Sep</strong>.</div>
              </div>
            ) : childEligible ? (
              <Notice type="good">Your child qualified from the term starting <strong>{termLabel}</strong>. Remember to reconfirm your HMRC code every 3 months.</Notice>
            ) : (
              <div style={{ ...css.card(), marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>Time until eligible</div>
                  <div style={{ fontSize: 52, fontFamily: SERIF, color: T.text, lineHeight: 1 }}>{daysLeft}</div>
                  <div style={{ fontSize: 14, color: T.textSub, marginTop: 6 }}>days until <strong style={{ color: T.text }}>{termLabel}</strong></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Apply to HMRC ~3 months before this date</div>
                  <div style={{ fontSize: 13, color: T.text }}>gov.uk/tax-free-childcare</div>
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                    <label style={{ ...css.label, margin: 0, fontSize: 11 }}>Change DOB</label>
                    <input type="date" style={{ ...css.inputSm, width: "auto" }} value={dob} onChange={e => saveDob(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {myOverLimit && <Notice type="danger">Your adjusted net income ({fmt(myTax.adj)}) exceeds £100,000. Use the Income & Tax tab to model pension contributions — dropping below £100k restores eligibility.</Notice>}
            {!myMeetsMin && myGross > 0 && <Notice type="warn">Your income ({fmt(myTax.adj)}) is below the minimum threshold of {fmt(MIN_ANNUAL)}.</Notice>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
              <div style={css.card()}>
                <div style={css.sectionLabel}>Your income</div>
                <div style={{ fontSize: 28, fontFamily: SERIF, color: T.text, marginBottom: 4 }}>{myGross > 0 ? fmt(myGross) : "—"}</div>
                <div style={{ fontSize: 13, color: T.textSub, marginBottom: myGross > 0 ? 14 : 0 }}>
                  {myGross > 0 ? `${fmt(myTax.takeHome)} take-home · ${fmt(myTax.takeHome / 12)}/mo` : <span>Enter salary in <button onClick={() => setActiveTab("income")} style={{ color: T.accent, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: SANS, fontSize: 13 }}>Income & Tax →</button></span>}
                </div>
                {myGross > 0 && <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textMuted, marginBottom: 2 }}><span>Min. threshold</span><span style={{ color: myMeetsMin ? T.green : T.amber }}>{myMeetsMin ? "Met ✓" : fmt(MIN_ANNUAL - myTax.adj) + " short"}</span></div>
                  <ProgressBar value={myTax.adj} max={MIN_ANNUAL} color={myMeetsMin ? T.green : T.amber} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textMuted, marginTop: 12, marginBottom: 2 }}><span>£100k limit</span><span style={{ color: myTax.adj > 90000 ? T.red : T.textMuted }}>{fmtPct(clampPct(myTax.adj, UPPER_LIMIT))}</span></div>
                  <ProgressBar value={myTax.adj} max={UPPER_LIMIT} color={myTax.adj > 90000 ? T.red : myTax.adj > 75000 ? T.amber : T.green} />
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6 }}>Headroom: {fmt(Math.max(0, UPPER_LIMIT - myTax.adj))}</div>
                </>}
              </div>

              <div style={css.card()}>
                <div style={css.sectionLabel}>Partner's income</div>
                <div style={{ fontSize: 28, fontFamily: SERIF, color: T.text, marginBottom: 4 }}>{herGross > 0 ? fmt(herGross) : "—"}</div>
                <div style={{ fontSize: 13, color: T.textSub, marginBottom: 14 }}>{herGross > 0 ? "Normal salary (maternity leave)" : "Optional — enter in Income & Tax"}</div>
                <div style={{ padding: "10px 12px", background: T.greenLight, borderRadius: 6, border: `1px solid ${T.greenBorder}`, fontSize: 12, color: T.green, lineHeight: 1.5 }}>
                  Maternity leave — she automatically meets the minimum earnings threshold.
                </div>
              </div>
            </div>

            <div style={css.card()}>
              <div style={css.sectionLabel}>Eligibility checklist</div>
              {[
                { label: "Child is old enough", ok: childEligible, detail: !dob ? "Set date of birth above" : childEligible ? "Eligible now" : `Eligible from ${termShort}` },
                { label: "You meet minimum earnings", ok: myMeetsMin && !myOverLimit, detail: myOverLimit ? `${fmt(myTax.adj)} — above £100,000 limit` : myMeetsMin ? `${fmt(myTax.adj)} adjusted net income` : `Minimum is ${fmt(MIN_ANNUAL)}` },
                { label: "Partner meets minimum earnings", ok: true, detail: "Maternity leave exception applies" },
                { label: "Neither parent exceeds £100,000", ok: !myOverLimit && !herOverLimit, detail: myOverLimit ? "Your income is over the limit" : herOverLimit ? "Partner's income is over the limit" : "Both within the limit" },
              ].map((c, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: c.ok ? T.greenLight : T.redLight, border: `1px solid ${c.ok ? T.greenBorder : "#f5c6c2"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                    <span style={{ fontSize: 12, color: c.ok ? T.green : T.red }}>{c.ok ? "✓" : "✕"}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, color: T.text, fontWeight: 500, marginBottom: 2 }}>{c.label}</div>
                    <div style={{ fontSize: 13, color: T.textSub }}>{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* INCOME & TAX */}
        {activeTab === "income" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
            <div style={css.card()}><ProfileEditor profile={myProfile} onChange={p => saveProfile("me", p)} title="Your income" /></div>
            <div style={css.card()}><ProfileEditor profile={herProfile} onChange={p => saveProfile("her", p)} title="Partner's income" /></div>
          </div>
        )}

        {/* SAVINGS */}
        {activeTab === "betteroff" && (() => {
          const DAYS = ["Mon","Tue","Wed","Thu","Fri"];
          const activeDays = nursery.days ?? ["Mon","Tue","Wed","Thu","Fri"];
          const hoursPerDay = pn(nursery.hoursPerDay) || 8;
          const effectiveHrs = activeDays.length * hoursPerDay;
          const freeH = Math.min(30, effectiveHrs);
          const paidH = Math.max(0, effectiveHrs - 30);

          const monthlyBill = pn(nursery.monthlyBill);
          const impliedHourly = (monthlyBill > 0 && effectiveHrs > 0)
            ? (monthlyBill * 12) / (effectiveHrs * TERM_WEEKS)
            : 0;
          const resolvedHourly = monthlyBill > 0 ? impliedHourly
            : nursery.useAvg ? AVG_UK_NURSERY_HOURLY
            : pn(nursery.hourlyRate);

          const annualFull = resolvedHourly * effectiveHrs * TERM_WEEKS;
          const annualSav  = resolvedHourly * freeH * TERM_WEEKS;
          const annualPay  = resolvedHourly * paidH * TERM_WEEKS;
          const hasRate = resolvedHourly > 0 && activeDays.length > 0;

          return (
          <>
            <p style={{ fontSize: 14, color: T.textSub, marginBottom: 24, maxWidth: 560, lineHeight: 1.6 }}>Calculate exactly how much the 30-hour entitlement saves your family compared to paying full nursery fees.</p>
            <div style={css.card({ marginBottom: 24 })}>
              <div style={css.sectionLabel}>Your nursery schedule</div>

              <label style={css.label}>Days at nursery</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {DAYS.map(d => {
                  const on = activeDays.includes(d);
                  return (
                    <button key={d} onClick={() => {
                      const next = on ? activeDays.filter(x => x !== d) : [...activeDays, d];
                      saveNursery({ ...nursery, days: next });
                    }} style={{
                      width: 48, height: 40, borderRadius: 8, border: `1.5px solid ${on ? T.accent : T.border}`,
                      background: on ? T.accentLight : T.surface, color: on ? T.accent : T.textMuted,
                      fontSize: 12, fontFamily: SANS, fontWeight: on ? 600 : 400, cursor: "pointer", transition: "all 0.15s",
                    }}>{d}</button>
                  );
                })}
                <div style={{ display: "flex", alignItems: "center", marginLeft: 8, fontSize: 13, color: T.textMuted }}>
                  {activeDays.length} day{activeDays.length !== 1 ? "s" : ""}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={css.label}>Hours per day</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input style={{ ...css.input, maxWidth: 90 }} type="number" min="1" max="13" placeholder="8"
                    value={nursery.hoursPerDay ?? ""} onChange={e => saveNursery({ ...nursery, hoursPerDay: e.target.value })} />
                  <button onClick={() => saveNursery({ ...nursery, hoursPerDay: "8" })}
                    style={{ fontSize: 11, color: T.textMuted, background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontFamily: SANS, whiteSpace: "nowrap" }}>
                    9–5 default
                  </button>
                </div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>
                  = <strong style={{ color: T.textSub }}>{effectiveHrs} hrs/week</strong> · {freeH} free{paidH > 0 ? ` + ${paidH} paid` : ""}
                </div>
              </div>

              <div style={css.divider} />
              <div style={css.sectionLabel}>Your nursery cost</div>

              <div style={{ marginBottom: 16 }}>
                <label style={css.label}>Monthly nursery bill <span style={{ color: T.accent, fontWeight: 500 }}>— easiest to fill in</span></label>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: T.textSub, fontSize: 14, pointerEvents: "none" }}>£</span>
                    <input style={{ ...css.input, paddingLeft: 22, maxWidth: 140, opacity: nursery.useAvg ? 0.4 : 1 }}
                      type="number" placeholder="e.g. 1900"
                      disabled={nursery.useAvg}
                      value={nursery.monthlyBill ?? ""}
                      onChange={e => saveNursery({ ...nursery, monthlyBill: e.target.value, hourlyRate: "" })} />
                  </div>
                  <span style={{ fontSize: 13, color: T.textMuted }}>/month</span>
                  {monthlyBill > 0 && effectiveHrs > 0 && (
                    <span style={{ fontSize: 12, color: T.textSub, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px" }}>
                      = {fmt(impliedHourly, 2)}/hr implied
                    </span>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: 16, opacity: monthlyBill > 0 && !nursery.useAvg ? 0.4 : 1, transition: "opacity 0.2s" }}>
                <label style={css.label}>Or enter hourly rate instead</label>
                <input style={{ ...css.input, maxWidth: 140, opacity: nursery.useAvg || monthlyBill > 0 ? 0.4 : 1 }}
                  type="number" placeholder={AVG_UK_NURSERY_HOURLY.toFixed(2)}
                  disabled={nursery.useAvg || monthlyBill > 0}
                  value={nursery.hourlyRate ?? ""}
                  onChange={e => saveNursery({ ...nursery, hourlyRate: e.target.value, monthlyBill: "" })} />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.textSub, cursor: "pointer" }}>
                <input type="checkbox" checked={nursery.useAvg}
                  onChange={e => saveNursery({ ...nursery, useAvg: e.target.checked, monthlyBill: "", hourlyRate: "" })} />
                Use UK average rate ({fmt(AVG_UK_NURSERY_HOURLY, 2)}/hr — England 2024)
              </label>
            </div>

            {hasRate ? (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  {[
                    { title: "UK average rate", rate: AVG_UK_NURSERY_HOURLY },
                    { title: monthlyBill > 0 ? "Your nursery bill" : nursery.useAvg ? "UK average (selected)" : "Your local rate", rate: resolvedHourly },
                  ].map(({ title, rate }, ci) => {
                    const isYours = ci === 1;
                    const aFull = rate * effectiveHrs * TERM_WEEKS;
                    const aSav  = rate * freeH * TERM_WEEKS;
                    const aPay  = rate * paidH * TERM_WEEKS;
                    return (
                      <div key={title} style={css.card({ borderColor: isYours ? T.accentBorder : T.border })}>
                        <div style={{ ...css.sectionLabel, color: isYours ? T.accent : T.textMuted, marginBottom: 6 }}>{title}</div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>
                          {fmt(rate, 2)}/hr{isYours && monthlyBill > 0 ? ` · ${fmt(monthlyBill)}/mo` : ""}
                        </div>
                        {[["Without 30 hours", aFull, false, T.text], ["30-hour saving", aSav, true, T.green], ["You pay", aPay, false, paidH > 0 ? T.text : T.green]].map(([k, val, isSaving, col], i, arr) => (
                          <div key={k} style={{ ...css.row, borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                            <span style={{ color: T.textSub }}>{k}</span>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ color: col, fontWeight: 500 }}>{isSaving ? "− " : ""}{fmt(Math.abs(val))}</span>
                              <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 6 }}>{isSaving ? "− " : ""}{fmt(Math.abs(val / 12))}/mo</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>

                <div style={{ ...css.card(), marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>Annual saving from 30 hours</div>
                    <div style={{ fontSize: 44, fontFamily: SERIF, color: T.green, lineHeight: 1 }}>{fmt(annualSav)}</div>
                    <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>{fmt(annualSav / 12)}/month · {freeH} hrs × {TERM_WEEKS} weeks × {fmt(resolvedHourly, 2)}/hr</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 4 }}>Plus Tax-Free Childcare top-up</div>
                    <div style={{ fontSize: 24, fontFamily: SERIF, color: T.text }}>+ £2,000</div>
                    <div style={{ fontSize: 12, color: T.textSub, marginTop: 2 }}>Government adds 20p per 80p you deposit</div>
                  </div>
                </div>

                <div style={css.card()}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                    <div style={css.sectionLabel}>Household financial summary</div>
                    <div style={{ display: "flex", gap: 16, fontSize: 11, color: T.textMuted }}>
                      <span>Annual</span><span>Monthly</span>
                    </div>
                  </div>
                  {[
                    ["Your take-home",      myTax.takeHome,                                       true,  false],
                    ["Partner's take-home", herTax.takeHome,                                      true,  false],
                    ["Combined household",  myTax.takeHome + herTax.takeHome,                     true,  true],
                    null,
                    ["Nursery (full cost)", -annualFull,                                          false, false],
                    ["30-hour saving",       annualSav,                                           false, false],
                    ["Tax-Free Childcare",   2000,                                                false, false],
                    paidH > 0 ? ["Remaining nursery", -annualPay, false, false] : null,
                    null,
                    ["After childcare",     myTax.takeHome + herTax.takeHome - annualPay + 2000, true,  true],
                  ].filter(r => r !== undefined).map((row, i) => row === null
                    ? <div key={i} style={{ height: 1, background: T.border, margin: "6px 0" }} />
                    : (() => {
                        const [label, val, isIncome, bold] = row;
                        const col = bold ? T.text : val >= 0 ? (isIncome ? T.text : T.green) : T.red;
                        const prefix = !isIncome && val > 0 ? "+ " : !isIncome && val < 0 ? "− " : "";
                        const absVal = Math.abs(val);
                        return (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", fontSize: 14 }}>
                            <span style={{ color: T.textSub }}>{label}</span>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ color: col, fontWeight: bold ? 600 : 400, fontFamily: bold ? SERIF : SANS }}>{prefix}{fmt(absVal)}</span>
                              <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 8 }}>{prefix}{fmt(absVal / 12)}/mo</span>
                            </div>
                          </div>
                        );
                      })()
                  )}
                </div>
              </>
            ) : (
              <Notice type="info">
                {activeDays.length === 0 ? "Select at least one nursery day above." : "Enter your monthly nursery bill, hourly rate, or tick \"Use UK average\" to see your savings."}
              </Notice>
            )}
          </>
          );
        })()}

        {/* GUIDES */}
        {activeTab === "guides" && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.accent, marginBottom: 8 }}>Guides</div>
              <div style={{ fontFamily: SERIF, fontSize: 22, color: T.text, marginBottom: 8 }}>Free guides for working parents</div>
              <div style={{ fontSize: 14, color: T.textSub }}>Everything you need to know about 30-hour free childcare and Tax-Free Childcare.</div>
            </div>
            {[
              { category: "Eligibility", colour: T.green, links: [
                { slug: "30-hour-free-childcare-eligibility", label: "30-Hour Free Childcare Eligibility", desc: "Do you qualify? Income rules, age requirements and how to apply." },
                { slug: "free-childcare-2-year-olds", label: "Free Childcare for 2 Year Olds", desc: "Working parents of 2-year-olds can now claim 15 free hours per week." },
                { slug: "free-childcare-maternity-leave", label: "Free Childcare on Maternity Leave", desc: "Maternity leave automatically passes the minimum earnings test." },
                { slug: "free-childcare-self-employed", label: "Free Childcare if Self-Employed", desc: "How HMRC assesses self-employed earnings and the start-up exception." },
                { slug: "free-childcare-single-parents", label: "Free Childcare for Single Parents", desc: "Single parents only need to meet the criteria themselves." },
                { slug: "15-hours-vs-30-hours-free-childcare", label: "15 Hours vs 30 Hours", desc: "All children get 15 hours. Working parents can get 30." },
              ]},
              { category: "Tax & Salary Sacrifice", colour: T.accent, links: [
                { slug: "adjusted-net-income", label: "What is Adjusted Net Income?", desc: "The £100,000 childcare limit is based on this figure — not your gross salary." },
                { slug: "salary-sacrifice-childcare", label: "Salary Sacrifice & Eligibility", desc: "Pension, cycle to work and EV schemes all reduce your adjusted net income." },
                { slug: "pension-contributions-childcare", label: "Pension Contributions & Childcare", desc: "The most powerful tool for parents earning near £100,000." },
                { slug: "electric-car-salary-sacrifice-childcare", label: "Electric Car Salary Sacrifice", desc: "How EV leasing reduces your adjusted net income." },
                { slug: "tax-free-childcare-vs-vouchers", label: "Tax-Free Childcare vs Vouchers", desc: "Which saves more? And can you still switch?" },
                { slug: "universal-credit-childcare", label: "Universal Credit & Free Childcare", desc: "UC can cover up to 85% of childcare costs." },
              ]},
              { category: "How To", colour: "#5b6fa8", links: [
                { slug: "how-to-apply-tax-free-childcare", label: "How to Apply for Tax-Free Childcare", desc: "Step-by-step guide to the HMRC Childcare Service portal." },
                { slug: "childcare-term-dates", label: "30-Hour Childcare Term Dates 2025", desc: "When does your child actually become eligible?" },
                { slug: "reconfirm-tax-free-childcare", label: "How to Reconfirm Every 3 Months", desc: "Miss this and your account is suspended." },
                { slug: "what-can-tax-free-childcare-be-used-for", label: "What Can Tax-Free Childcare Pay For?", desc: "Nurseries, childminders, holiday clubs, after-school care and nannies." },
                { slug: "tax-free-childcare-nannies", label: "Using Tax-Free Childcare for a Nanny", desc: "Possible — but the nanny must be Ofsted registered." },
                { slug: "childcare-cost-calculator", label: "How Our Calculator Works", desc: "What the calculator shows and its limitations." },
              ]},
              { category: "By Region", colour: T.textSub, links: [
                { slug: "free-childcare-scotland", label: "Free Childcare in Scotland", desc: "Scotland's ELC scheme offers 1,140 hours/year." },
                { slug: "free-childcare-wales", label: "Free Childcare in Wales", desc: "The Childcare Offer for Wales covers 48 weeks." },
              ]},
            ].map(({ category, colour, links }) => (
              <div key={category} style={{ marginBottom: 36 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: colour, marginBottom: 14 }}>{category}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {links.map(({ slug, label, desc }) => (
                    <a key={slug} href={`/${slug}.html`} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", textDecoration: "none", display: "block", transition: "border-color 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
                      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>{desc}</div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
