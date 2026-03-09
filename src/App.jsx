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
    return { label: new Date(yr, mi, 1).toLocaleString("en-GB", { month: "short", year: "2-digit" }), fullLabel: new Date(yr, mi, 1).toLocaleString("en-GB", { month: "long", year: "numeric" }), key: `${yr}-${mi}` };
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
  bg: "#fafaf8",
  surface: "#ffffff",
  surfaceHover: "#f5f5f2",
  border: "#e8e8e4",
  borderStrong: "#d4d4ce",
  text: "#1a1a18",
  textSub: "#6b6b65",
  textMuted: "#9c9c94",
  accent: "#d97757",       // warm terracotta — like Claude's UI
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

// ─── Base styles ──────────────────────────────────────────────────────────────
const css = {
  input: {
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
    padding: "9px 12px", color: T.text, fontSize: 14, fontFamily: SANS,
    width: "100%", boxSizing: "border-box", outline: "none",
    transition: "border-color 0.15s",
  },
  inputSm: {
    background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6,
    padding: "7px 10px", color: T.text, fontSize: 13, fontFamily: SANS, outline: "none",
    width: "100%", boxSizing: "border-box",
  },
  label: { fontSize: 12, color: T.textSub, marginBottom: 6, display: "block", fontFamily: SANS, letterSpacing: "0.01em" },
  divider: { height: 1, background: T.border, margin: "20px 0" },
  card: (extra = {}) => ({ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "20px 24px", ...extra }),
  sectionLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.textMuted, marginBottom: 14, fontFamily: SANS },
  statLabel: { fontSize: 12, color: T.textSub, marginBottom: 4, fontFamily: SANS },
  statValue: { fontSize: 28, fontWeight: 400, fontFamily: SERIF, color: T.text, lineHeight: 1.1 },
  statSub: { fontSize: 13, color: T.textSub, marginTop: 4, fontFamily: SANS },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14, fontFamily: SANS },
};

function Pill({ ok, children }) {
  return (
    <span style={{
      display: "inline-block", padding: "4px 12px", borderRadius: 20,
      fontSize: 12, fontWeight: 500, fontFamily: SANS,
      background: ok ? T.greenLight : T.redLight,
      color: ok ? T.green : T.red,
      border: `1px solid ${ok ? T.greenBorder : "#f5c6c2"}`,
    }}>{children}</span>
  );
}

function Notice({ type = "info", children }) {
  const styles = {
    info:   { bg: "#f0f4ff", border: "#c7d7ff", text: "#3045a0" },
    good:   { bg: T.greenLight, border: T.greenBorder, text: T.green },
    warn:   { bg: T.amberLight, border: T.amberBorder, text: T.amber },
    danger: { bg: T.redLight, border: "#f5c6c2", text: T.red },
  }[type];
  return (
    <div style={{ background: styles.bg, border: `1px solid ${styles.border}`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: styles.text, marginBottom: 16, fontFamily: SANS, lineHeight: 1.6 }}>
      {children}
    </div>
  );
}

function ProgressBar({ value, max, color = T.accent }) {
  const p = clampPct(value, max);
  return (
    <div style={{ height: 3, borderRadius: 2, background: T.border, overflow: "hidden", marginTop: 6 }}>
      <div style={{ height: "100%", width: `${p}%`, background: color, borderRadius: 2, transition: "width 0.4s ease" }} />
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 36, height: 20, borderRadius: 10, background: on ? T.accent : T.border, cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: 3, left: on ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
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
      {/* Title + mode toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, fontFamily: SERIF, color: T.text }}>{title}</h3>
        <div style={{ display: "flex", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 3, gap: 2 }}>
          {["simple", "advanced"].map(mode => (
            <button key={mode} onClick={() => set("inputMode", mode)} style={{ padding: "5px 14px", fontSize: 12, fontFamily: SANS, fontWeight: profile.inputMode === mode ? 600 : 400, background: profile.inputMode === mode ? T.surface : "transparent", color: profile.inputMode === mode ? T.text : T.textMuted, border: `1px solid ${profile.inputMode === mode ? T.border : "transparent"}`, borderRadius: 4, cursor: "pointer", transition: "all 0.15s" }}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Simple mode */}
      {profile.inputMode === "simple" && (
        <div style={{ marginBottom: 16 }}>
          <label style={css.label}>{isHer ? "Normal annual salary" : "Annual salary"}</label>
          <input style={css.input} type="number" placeholder="e.g. 45000" value={profile.annualSalary ?? ""} onChange={e => set("annualSalary", e.target.value)} />
          {isHer && <p style={{ fontSize: 12, color: T.textSub, margin: "8px 0 0", fontFamily: SANS }}>She automatically meets the minimum earnings threshold while on maternity leave.</p>}
        </div>
      )}

      {/* Advanced mode */}
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
                    onChange={e => {
                      const overrides = { ...(profile.monthlyOverrides || {}), [m.key]: e.target.value };
                      onChange({ ...profile, monthlyOverrides: overrides });
                    }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bonuses */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label style={{ ...css.label, margin: 0 }}>One-off bonuses</label>
        <button onClick={() => set("bonuses", [...(profile.bonuses || []), { label: "", amount: "" }])}
          style={{ fontSize: 12, color: T.accent, background: "none", border: "none", cursor: "pointer", fontFamily: SANS, padding: 0 }}>
          + Add bonus
        </button>
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

      {/* Student loan */}
      <div style={css.divider} />
      <label style={css.label}>Student loan</label>
      <select style={{ ...css.input, marginBottom: 0 }} value={profile.studentLoan || "none"} onChange={e => set("studentLoan", e.target.value)}>
        <option value="none">None</option>
        <option value="plan1">Plan 1 — pre-2012 / Scotland / NI</option>
        <option value="plan2">Plan 2 — post-2012 England / Wales</option>
        <option value="plan4">Plan 4 — Scotland post-2021</option>
      </select>

      {/* Salary sacrifice */}
      <div style={css.divider} />
      <div style={css.sectionLabel}>Salary sacrifice</div>

      {/* Pension */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: profile.pension?.enabled ? 12 : 0 }}>
          <Toggle on={profile.pension?.enabled} onChange={v => setN("pension", "enabled", v)} />
          <span style={{ fontSize: 14, fontFamily: SANS, color: T.text }}>Pension contributions</span>
        </div>
        {profile.pension?.enabled && (
          <>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select style={{ ...css.inputSm, width: "auto" }} value={profile.pension?.type || "percent"} onChange={e => onChange({ ...profile, pension: { ...(profile.pension || {}), type: e.target.value, value: "" } })}>
                <option value="percent">% of salary</option>
                <option value="fixed">£ per year</option>
              </select>
              <input style={{ ...css.inputSm, width: 90 }} type="number" placeholder={profile.pension?.type === "percent" ? "e.g. 5" : "e.g. 3000"} value={profile.pension?.value ?? ""} onChange={e => setN("pension", "value", e.target.value)} />
              {pensionAmt > 0 && <span style={{ fontSize: 12, color: T.textSub, fontFamily: SANS }}>{fmt(pensionAmt)}/yr</span>}
            </div>
            {pensionAmt > 0 && (
              <div style={{ marginTop: 10, fontSize: 12, color: T.green, fontFamily: SANS }}>
                Saves ~{fmt(pensionSaving)}/yr in tax & NI · Adjusted net income: {fmt(tax.adj)}
                {gross > UPPER_LIMIT && gross - pensionAmt <= UPPER_LIMIT && <span style={{ color: T.green }}> — restores childcare eligibility ✓</span>}
                {gross > UPPER_LIMIT && gross - pensionAmt > UPPER_LIMIT && <span style={{ color: T.amber }}> — still {fmt(tax.adj - UPPER_LIMIT)} above £100k</span>}
              </div>
            )}
          </>
        )}
      </div>

      {/* Cycle to Work */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: profile.cycleToWork?.enabled ? 12 : 0 }}>
          <Toggle on={profile.cycleToWork?.enabled} onChange={v => setN("cycleToWork", "enabled", v)} />
          <span style={{ fontSize: 14, fontFamily: SANS, color: T.text }}>Cycle to Work scheme</span>
        </div>
        {profile.cycleToWork?.enabled && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
              <div>
                <label style={css.label}>Bike & equipment cost</label>
                <input style={css.inputSm} type="number" placeholder="e.g. 2000" value={profile.cycleToWork?.bikeCost ?? ""} onChange={e => setN("cycleToWork", "bikeCost", e.target.value)} />
              </div>
              <div>
                <label style={css.label}>Scheme length</label>
                <select style={css.inputSm} value={profile.cycleToWork?.months || "12"} onChange={e => setN("cycleToWork", "months", e.target.value)}>
                  <option value="12">12 months</option>
                  <option value="18">18 months</option>
                </select>
              </div>
            </div>
            {cycleResult && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {[["Bike cost", fmt(cycleResult.bikeCost), T.text], ["Tax & NI saved", fmt(cycleResult.totalSaving), T.green], ["You effectively pay", fmt(cycleResult.effectiveCost), T.accent]].map(([k, v, col]) => (
                  <div key={k} style={{ background: T.bg, borderRadius: 6, padding: "10px 12px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, fontFamily: SANS }}>{k}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: col, fontFamily: SERIF }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* EV Car */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: "14px 16px", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: profile.evCar?.enabled ? 12 : 0 }}>
          <Toggle on={profile.evCar?.enabled} onChange={v => setN("evCar", "enabled", v)} />
          <span style={{ fontSize: 14, fontFamily: SANS, color: T.text }}>Electric car salary sacrifice</span>
        </div>
        {profile.evCar?.enabled && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
              <div>
                <label style={css.label}>Monthly lease sacrifice</label>
                <input style={css.inputSm} type="number" placeholder="e.g. 500" value={profile.evCar?.monthlyLease ?? ""} onChange={e => setN("evCar", "monthlyLease", e.target.value)} />
              </div>
              <div>
                <label style={css.label}>Car P11D value</label>
                <input style={css.inputSm} type="number" placeholder="e.g. 40000" value={profile.evCar?.p11d ?? ""} onChange={e => setN("evCar", "p11d", e.target.value)} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={css.label}>BIK rate</label>
                <select style={css.inputSm} value={profile.evCar?.bikRate || "2"} onChange={e => setN("evCar", "bikRate", e.target.value)}>
                  <option value="2">2% — Pure EV (2024/25)</option>
                  <option value="3">3% — Pure EV (2025/26)</option>
                  <option value="5">5% — PHEV &lt;30g/km</option>
                  <option value="8">8% — PHEV 30–49g/km</option>
                </select>
              </div>
            </div>
            {evResult && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
                {[["Annual lease", fmt(evResult.annualLease), T.text], ["Tax & NI saved", fmt(evResult.taxNiSaving), T.green], ["BIK tax", fmt(evResult.bikTax), T.amber], ["Net saving", fmt(evResult.netBenefit), evResult.netBenefit > 0 ? T.green : T.red], ["Effective monthly", fmt(evResult.effectiveMonthly), T.accent]].map(([k, v, col]) => (
                  <div key={k} style={{ background: T.bg, borderRadius: 6, padding: "10px 12px", border: `1px solid ${T.border}` }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4, fontFamily: SANS }}>{k}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: col, fontFamily: SERIF }}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Take-home summary */}
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
              <span style={{ color: T.textSub }}>{k}</span>
              <span style={{ color: col }}>{v}</span>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: "16px 20px", background: T.accentLight, border: `1px solid ${T.accentBorder}`, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, color: T.textSub, fontFamily: SANS, marginBottom: 2 }}>Annual take-home</div>
              <div style={{ fontSize: 26, fontFamily: SERIF, color: T.text, fontWeight: 400 }}>{fmt(tax.takeHome)}</div>
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

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function ChildcareTracker() {
  const [dob, setDob] = useState("");
  const [myProfile, setMyProfile] = useState(defaultProfile("me"));
  const [herProfile, setHerProfile] = useState(defaultProfile("her"));
  const [activeTab, setActiveTab] = useState("dashboard");
  const [nursery, setNursery] = useState({ hourlyRate: "", hours: "30", useAvg: false });

  useEffect(() => {
    try {
      const d = localStorage.getItem("cc4-dob");
      const m = localStorage.getItem("cc4-my");
      const h = localStorage.getItem("cc4-her");
      const n = localStorage.getItem("cc4-nursery");
      if (d) setDob(d);
      if (m) setMyProfile(JSON.parse(m));
      if (h) setHerProfile(JSON.parse(h));
      if (n) setNursery(JSON.parse(n));
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

  const effectiveHourly = nursery.useAvg ? AVG_UK_NURSERY_HOURLY : pn(nursery.hourlyRate);
  const hours = pn(nursery.hours) || 30;
  const TERM_WEEKS = 38;
  const freeHrs = Math.min(30, hours);
  const paidHrs = Math.max(0, hours - 30);
  const annualFullCost = effectiveHourly * hours * TERM_WEEKS;
  const annualSaving = effectiveHourly * freeHrs * TERM_WEEKS;
  const annualYouPay = effectiveHourly * paidHrs * TERM_WEEKS;

  const TABS = [["dashboard", "Overview"], ["income", "Income & Tax"], ["betteroff", "Better Off?"], ["settings", "Settings"], ["guides", "Guides"]];

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: SANS }}>

      {/* ── Header ── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: "0 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 17, fontFamily: SERIF, color: T.text, fontWeight: 400 }}>Childcare Eligibility</span>
            <span style={{ fontSize: 12, color: T.textMuted, fontFamily: SANS }}>UK 30-Hour · {currentTaxYear()}/{String(currentTaxYear() + 1).slice(2)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <a href="/guide.html" style={{ fontSize: 13, color: T.textSub, fontFamily: SANS, textDecoration: "none" }}>Guide</a>
            <Pill ok={fullyEligible}>{fullyEligible ? "Eligible" : childEligible ? "Check income" : "Not yet eligible"}</Pill>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", padding: "0 32px", overflowX: "auto" }}>
          {TABS.map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)} style={{ background: "none", border: "none", borderBottom: `2px solid ${activeTab === id ? T.text : "transparent"}`, color: activeTab === id ? T.text : T.textMuted, padding: "14px 16px", fontSize: 13, fontFamily: SANS, fontWeight: activeTab === id ? 500 : 400, cursor: "pointer", whiteSpace: "nowrap", marginRight: 4, transition: "color 0.15s" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px" }}>

        {/* ════ OVERVIEW ════ */}
        {activeTab === "dashboard" && (
          <>
            {/* Countdown or eligible banner */}
            {!dob ? (
              <Notice type="info">Add your child's date of birth in Settings to begin the eligibility countdown.</Notice>
            ) : childEligible ? (
              <Notice type="good">Your child is eligible — they qualified from the term starting <strong>{termLabel}</strong>. Remember to reconfirm your HMRC code every 3 months.</Notice>
            ) : (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "28px 32px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 8, fontFamily: SANS, letterSpacing: "0.04em", textTransform: "uppercase" }}>Time until eligible</div>
                  <div style={{ fontSize: 48, fontFamily: SERIF, color: T.text, fontWeight: 400, lineHeight: 1 }}>{daysLeft}</div>
                  <div style={{ fontSize: 14, color: T.textSub, marginTop: 6, fontFamily: SANS }}>days until <strong style={{ color: T.text }}>{termLabel}</strong></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 12, color: T.textMuted, fontFamily: SANS, marginBottom: 4 }}>Apply to HMRC approximately 3 months before this date</div>
                  <div style={{ fontSize: 15, fontFamily: SANS, color: T.text }}>gov.uk/tax-free-childcare</div>
                </div>
              </div>
            )}

            {myOverLimit && <Notice type="danger">Your adjusted net income ({fmt(myTax.adj)}) exceeds £100,000. Consider increasing pension contributions to drop below the threshold and preserve eligibility.</Notice>}
            {!myMeetsMin && myGross > 0 && <Notice type="warn">Your income ({fmt(myTax.adj)}) is below the minimum threshold of {fmt(MIN_ANNUAL)}.</Notice>}

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
              {/* Your income */}
              <div style={css.card()}>
                <div style={css.statLabel}>Your income</div>
                <div style={css.statValue}>{myGross > 0 ? fmt(myGross) : "—"}</div>
                <div style={css.statSub}>{myGross > 0 ? `${fmt(myTax.takeHome)} take-home · ${fmt(myTax.takeHome / 12)}/mo` : "Enter in Income & Tax tab"}</div>
                {myGross > 0 && <>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textMuted, marginTop: 14, marginBottom: 2, fontFamily: SANS }}>
                    <span>Min. threshold</span>
                    <span style={{ color: myMeetsMin ? T.green : T.amber }}>{myMeetsMin ? "Met" : fmt(MIN_ANNUAL - myTax.adj) + " short"}</span>
                  </div>
                  <ProgressBar value={myTax.adj} max={MIN_ANNUAL} color={myMeetsMin ? T.green : T.amber} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textMuted, marginTop: 12, marginBottom: 2, fontFamily: SANS }}>
                    <span>£100k limit</span>
                    <span style={{ color: myTax.adj > 90000 ? T.red : T.textMuted }}>{fmtPct(clampPct(myTax.adj, UPPER_LIMIT))}</span>
                  </div>
                  <ProgressBar value={myTax.adj} max={UPPER_LIMIT} color={myTax.adj > 90000 ? T.red : myTax.adj > 75000 ? T.amber : T.green} />
                  <div style={{ fontSize: 12, color: T.textMuted, marginTop: 6, fontFamily: SANS }}>Headroom: {fmt(Math.max(0, UPPER_LIMIT - myTax.adj))}</div>
                </>}
              </div>

              {/* Partner */}
              <div style={css.card()}>
                <div style={css.statLabel}>Partner's income</div>
                <div style={css.statValue}>{herGross > 0 ? fmt(herGross) : "—"}</div>
                <div style={css.statSub}>{herGross > 0 ? "Normal salary (mat leave)" : "Enter in Income & Tax tab"}</div>
                <div style={{ marginTop: 14, padding: "10px 12px", background: T.greenLight, borderRadius: 6, border: `1px solid ${T.greenBorder}`, fontSize: 12, color: T.green, lineHeight: 1.5, fontFamily: SANS }}>
                  Maternity leave exception applies — she automatically meets the minimum earnings threshold.
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div style={css.card()}>
              <div style={css.sectionLabel}>Eligibility checklist — 30 hours (working parents)</div>
              {[
                { label: "Child is old enough", ok: childEligible, detail: !dob ? "Set date of birth in Settings" : childEligible ? "Eligible now" : `Eligible from ${termShort}` },
                { label: "You meet minimum earnings", ok: myMeetsMin && !myOverLimit, detail: myOverLimit ? `${fmt(myTax.adj)} — above £100,000 limit` : myMeetsMin ? `${fmt(myTax.adj)} adjusted net income` : `Minimum is ${fmt(MIN_ANNUAL)}` },
                { label: "Partner meets minimum earnings", ok: true, detail: "Maternity leave exception applies" },
                { label: "Neither parent exceeds £100,000", ok: !myOverLimit && !herOverLimit, detail: myOverLimit ? "Your income is over the limit" : herOverLimit ? "Partner's income is over the limit" : "Both incomes are within the limit" },
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

        {/* ════ INCOME & TAX ════ */}
        {activeTab === "income" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 24 }}>
            <div style={css.card()}><ProfileEditor profile={myProfile} onChange={p => saveProfile("me", p)} title="Your income" /></div>
            <div style={css.card()}><ProfileEditor profile={herProfile} onChange={p => saveProfile("her", p)} title="Partner's income" /></div>
          </div>
        )}

        {/* ════ BETTER OFF? ════ */}
        {activeTab === "betteroff" && (
          <>
            <p style={{ fontSize: 14, color: T.textSub, marginBottom: 24, maxWidth: 560, lineHeight: 1.6 }}>
              Calculate exactly how much the 30-hour entitlement saves your family compared to paying full nursery fees.
            </p>

            {/* Nursery inputs */}
            <div style={css.card({ marginBottom: 24 })}>
              <div style={css.sectionLabel}>Nursery details</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={css.label}>Hours per week</label>
                  <input style={css.input} type="number" placeholder="30" value={nursery.hours ?? ""} onChange={e => saveNursery({ ...nursery, hours: e.target.value })} />
                </div>
                <div>
                  <label style={css.label}>Your local hourly rate</label>
                  <input style={{ ...css.input, opacity: nursery.useAvg ? 0.45 : 1 }} type="number" placeholder={AVG_UK_NURSERY_HOURLY.toFixed(2)} disabled={nursery.useAvg} value={nursery.hourlyRate ?? ""} onChange={e => saveNursery({ ...nursery, hourlyRate: e.target.value })} />
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.textSub, cursor: "pointer", fontFamily: SANS }}>
                <input type="checkbox" checked={nursery.useAvg} onChange={e => saveNursery({ ...nursery, useAvg: e.target.checked })} />
                Use UK average rate ({fmt(AVG_UK_NURSERY_HOURLY, 2)}/hr — England 2024 average)
              </label>
            </div>

            {effectiveHourly > 0 ? (
              <>
                {/* Side-by-side comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                  <div style={css.card()}>
                    <div style={{ ...css.sectionLabel, marginBottom: 6 }}>UK average rate</div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, fontFamily: SANS }}>{fmt(AVG_UK_NURSERY_HOURLY, 2)}/hr</div>
                    {[["Without 30 hours", fmt(AVG_UK_NURSERY_HOURLY * hours * TERM_WEEKS), T.text], ["30-hour saving", `− ${fmt(AVG_UK_NURSERY_HOURLY * freeHrs * TERM_WEEKS)}`, T.green], ["You pay", fmt(AVG_UK_NURSERY_HOURLY * paidHrs * TERM_WEEKS), paidHrs > 0 ? T.text : T.green]].map(([k, v, col], i, arr) => (
                      <div key={k} style={{ ...css.row, borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                        <span style={{ color: T.textSub }}>{k}</span><span style={{ color: col, fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={css.card({ borderColor: !nursery.useAvg && pn(nursery.hourlyRate) > 0 ? T.accentBorder : T.border })}>
                    <div style={{ ...css.sectionLabel, marginBottom: 6, color: !nursery.useAvg && pn(nursery.hourlyRate) > 0 ? T.accent : T.textMuted }}>
                      {nursery.useAvg ? "UK average (selected)" : pn(nursery.hourlyRate) > 0 ? "Your local rate" : "Your local rate"}
                    </div>
                    {!nursery.useAvg && !pn(nursery.hourlyRate) ? (
                      <p style={{ fontSize: 13, color: T.textMuted, fontFamily: SANS }}>Enter your hourly rate above to compare.</p>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, fontFamily: SANS }}>
                          {fmt(effectiveHourly, 2)}/hr
                          {!nursery.useAvg && pn(nursery.hourlyRate) > 0 && (
                            <span style={{ color: effectiveHourly > AVG_UK_NURSERY_HOURLY ? T.red : T.green, marginLeft: 8 }}>
                              {effectiveHourly > AVG_UK_NURSERY_HOURLY ? `+${fmt(effectiveHourly - AVG_UK_NURSERY_HOURLY, 2)}` : `−${fmt(AVG_UK_NURSERY_HOURLY - effectiveHourly, 2)}`} vs UK avg
                            </span>
                          )}
                        </div>
                        {[["Without 30 hours", fmt(effectiveHourly * hours * TERM_WEEKS), T.text], ["30-hour saving", `− ${fmt(annualSaving)}`, T.green], ["You pay", fmt(annualYouPay), paidHrs > 0 ? T.text : T.green]].map(([k, v, col], i, arr) => (
                          <div key={k} style={{ ...css.row, borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
                            <span style={{ color: T.textSub }}>{k}</span><span style={{ color: col, fontWeight: 500 }}>{v}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* Annual saving highlight */}
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "28px 32px", marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 6, fontFamily: SANS, letterSpacing: "0.04em", textTransform: "uppercase" }}>Annual saving from 30 hours</div>
                    <div style={{ fontSize: 44, fontFamily: SERIF, color: T.green, fontWeight: 400, lineHeight: 1 }}>{fmt(annualSaving)}</div>
                    <div style={{ fontSize: 13, color: T.textSub, marginTop: 6, fontFamily: SANS }}>{freeHrs} hrs/wk × {TERM_WEEKS} term weeks × {fmt(effectiveHourly, 2)}/hr</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: T.textMuted, fontFamily: SANS, marginBottom: 4 }}>Plus Tax-Free Childcare top-up</div>
                    <div style={{ fontSize: 24, fontFamily: SERIF, color: T.text }}>+ £2,000</div>
                    <div style={{ fontSize: 12, color: T.textSub, fontFamily: SANS, marginTop: 2 }}>Government adds 20p per 80p you deposit</div>
                  </div>
                </div>

                {/* Full household picture */}
                <div style={css.card()}>
                  <div style={css.sectionLabel}>Household financial summary</div>
                  {[
                    ["Your annual take-home", fmt(myTax.takeHome), T.text],
                    ["Partner's annual take-home", fmt(herTax.takeHome), T.text],
                    ["Combined household income", fmt(myTax.takeHome + herTax.takeHome), T.text, true],
                    null,
                    ["Nursery without 30 hours", `− ${fmt(annualFullCost)}`, T.red],
                    ["30-hour entitlement saving", `+ ${fmt(annualSaving)}`, T.green],
                    ["Tax-Free Childcare top-up (est.)", "+ £2,000", T.green],
                    paidHrs > 0 ? ["Remaining nursery cost", `− ${fmt(annualYouPay)}`, T.textSub] : null,
                    null,
                    ["Household after childcare", fmt(myTax.takeHome + herTax.takeHome - annualYouPay + 2000), T.text, true],
                  ].filter(r => r !== undefined).map((row, i) => row === null
                    ? <div key={i} style={{ height: 1, background: T.border, margin: "6px 0" }} />
                    : <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "none", fontSize: 14, fontFamily: SANS }}>
                        <span style={{ color: T.textSub }}>{row[0]}</span>
                        <span style={{ color: row[2], fontWeight: row[3] ? 600 : 400, fontFamily: row[3] ? SERIF : SANS }}>{row[1]}</span>
                      </div>
                  )}
                </div>
              </>
            ) : (
              <Notice type="info">Enter your nursery's hourly rate above, or tick "Use UK average" to see your savings breakdown.</Notice>
            )}
          </>
        )}

        {/* ════ SETTINGS ════ */}
        {activeTab === "settings" && (
          <div style={{ maxWidth: 480 }}>
            <div style={css.card()}>
              <div style={css.sectionLabel}>Child's date of birth</div>
              <label style={css.label}>Date of birth</label>
              <input type="date" style={{ ...css.input, marginBottom: 10 }} value={dob} onChange={e => saveDob(e.target.value)} />
              {dob && termDate && (
                <p style={{ fontSize: 13, color: T.textSub, margin: "0 0 0", fontFamily: SANS, lineHeight: 1.6 }}>
                  {childEligible
                    ? <span style={{ color: T.green }}>Your child has been eligible since the term starting <strong>{termLabel}</strong>.</span>
                    : <span>Your child will be eligible from <strong style={{ color: T.text }}>{termLabel}</strong> — {daysLeft} days from now. Apply to HMRC approximately 3 months before this date.</span>
                  }
                </p>
              )}
              <div style={css.divider} />
              <div style={css.sectionLabel}>UK rules reference 2024/25</div>
              {[
                ["Minimum earnings (you)", fmt(MIN_ANNUAL) + " / year"],
                ["Partner minimum", "Waived on maternity leave"],
                ["Upper income limit", "£100,000 adjusted net, per parent"],
                ["Personal allowance taper", "Starts at £100,000"],
                ["Basic rate (20%)", `${fmt(PA)} – ${fmt(BASIC_LIMIT)}`],
                ["Higher rate (40%)", `${fmt(BASIC_LIMIT)} – ${fmt(HIGHER_LIMIT)}`],
                ["EV BIK rate 2024/25", "2% of P11D value"],
                ["EV BIK rate 2025/26", "3% of P11D value"],
                ["HMRC code renewal", "Every 3 months"],
                ["Term start dates", "1 January · 1 April · 1 September"],
              ].map(([k, v]) => (
                <div key={k} style={{ ...css.row, fontSize: 13 }}>
                  <span style={{ color: T.textSub }}>{k}</span>
                  <span style={{ color: T.text }}>{v}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "14px 16px", background: T.accentLight, border: `1px solid ${T.accentBorder}`, borderRadius: 8, fontSize: 13, color: T.text, lineHeight: 1.6, fontFamily: SANS }}>
                <strong>Tip:</strong> Pension salary sacrifice reduces your adjusted net income — which can protect 30-hour eligibility and restore your personal allowance if your gross income is near £100,000.
              </div>
            </div>
          </div>
        )}

        {activeTab === "guides" && (
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 64px" }}>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.accent, marginBottom: 8, fontFamily: SANS }}>Childcare Guides</div>
              <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, color: T.text, marginBottom: 8 }}>Free guides for working parents</div>
              <div style={{ fontSize: 14, color: T.textSub }}>Everything you need to know about 30-hour free childcare and Tax-Free Childcare — from eligibility rules to salary sacrifice strategies.</div>
            </div>

            {[
              { category: "Eligibility", colour: T.green, links: [
                { slug: "30-hour-free-childcare-eligibility", label: "30-Hour Free Childcare Eligibility", desc: "Do you qualify? Income rules, age requirements and how to apply." },
                { slug: "free-childcare-2-year-olds", label: "Free Childcare for 2 Year Olds", desc: "Working parents of 2-year-olds can now claim 15 free hours per week." },
                { slug: "free-childcare-maternity-leave", label: "Free Childcare on Maternity Leave", desc: "Maternity leave automatically passes the minimum earnings test." },
                { slug: "free-childcare-self-employed", label: "Free Childcare if Self-Employed", desc: "How HMRC assesses self-employed earnings and the start-up exception." },
                { slug: "free-childcare-single-parents", label: "Free Childcare for Single Parents", desc: "Single parents only need to meet the criteria themselves." },
                { slug: "15-hours-vs-30-hours-free-childcare", label: "15 Hours vs 30 Hours: What's the Difference?", desc: "All children get 15 hours. Working parents can get 30." },
              ]},
              { category: "Tax & Salary Sacrifice", colour: T.accent, links: [
                { slug: "adjusted-net-income", label: "What is Adjusted Net Income?", desc: "The £100,000 childcare limit is based on this figure — not your gross salary." },
                { slug: "salary-sacrifice-childcare", label: "How Salary Sacrifice Affects Eligibility", desc: "Pension, cycle to work and EV schemes all reduce your adjusted net income." },
                { slug: "pension-contributions-childcare", label: "Pension Contributions & Childcare", desc: "The most powerful tool for parents earning near £100,000." },
                { slug: "electric-car-salary-sacrifice-childcare", label: "Electric Car Salary Sacrifice & Childcare", desc: "How EV leasing reduces your adjusted net income. 2% BIK rate for 2024/25." },
                { slug: "tax-free-childcare-vs-vouchers", label: "Tax-Free Childcare vs Childcare Vouchers", desc: "Which saves more? And can you still switch?" },
                { slug: "universal-credit-childcare", label: "Universal Credit & Free Childcare", desc: "UC can cover up to 85% of childcare costs — how it interacts with TFC." },
              ]},
              { category: "How To", colour: "#5b6fa8", links: [
                { slug: "how-to-apply-tax-free-childcare", label: "How to Apply for Tax-Free Childcare", desc: "Step-by-step guide to the HMRC Childcare Service portal." },
                { slug: "childcare-term-dates", label: "30-Hour Childcare Term Dates 2025", desc: "When does your child actually become eligible? The term-date system explained." },
                { slug: "reconfirm-tax-free-childcare", label: "How to Reconfirm Every 3 Months", desc: "Miss this and your account is suspended. Here's how to stay on top of it." },
                { slug: "what-can-tax-free-childcare-be-used-for", label: "What Can Tax-Free Childcare Pay For?", desc: "Nurseries, childminders, holiday clubs, after-school care and nannies." },
                { slug: "tax-free-childcare-nannies", label: "Using Tax-Free Childcare for a Nanny", desc: "It's possible — but the nanny must be registered through an Ofsted agency." },
                { slug: "childcare-cost-calculator", label: "How Our Childcare Calculator Works", desc: "What the calculator shows, how the maths works, and its limitations." },
              ]},
              { category: "By Region", colour: T.textSub, links: [
                { slug: "free-childcare-scotland", label: "Free Childcare in Scotland", desc: "Scotland's ELC scheme offers 1,140 hours/year to all 3-4 year olds." },
                { slug: "free-childcare-wales", label: "Free Childcare in Wales", desc: "The Childcare Offer for Wales covers 48 weeks — more than England." },
              ]},
            ].map(({ category, colour, links }) => (
              <div key={category} style={{ marginBottom: 36 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: colour, marginBottom: 14, fontFamily: SANS }}>{category}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                  {links.map(({ slug, label, desc }) => (
                    <a key={slug} href={`/${slug}`} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px", textDecoration: "none", display: "block", transition: "border-color 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
                      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginBottom: 4, fontFamily: SANS }}>{label}</div>
                      <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.5 }}>{desc}</div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "24px 32px", marginTop: 16 }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 20px", justifyContent: "center", marginBottom: 12 }}>
              {[
                ["30-hour-free-childcare-eligibility","30-Hour Eligibility"],
                ["childcare-term-dates","Term Dates 2025"],
                ["adjusted-net-income","Adjusted Net Income"],
                ["salary-sacrifice-childcare","Salary Sacrifice"],
                ["how-to-apply-tax-free-childcare","How to Apply"],
                ["tax-free-childcare-vs-vouchers","TFC vs Vouchers"],
                ["free-childcare-maternity-leave","Maternity Leave"],
                ["free-childcare-self-employed","Self-Employed"],
                ["free-childcare-single-parents","Single Parents"],
                ["reconfirm-tax-free-childcare","Reconfirmation"],
                ["free-childcare-scotland","Scotland"],
                ["free-childcare-wales","Wales"],
              ].map(([slug, label]) => (
                <a key={slug} href={`/${slug}`} style={{ fontSize: 12, color: T.textMuted, textDecoration: "none" }}
                  onMouseEnter={e => e.currentTarget.style.color = T.accent}
                  onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
                  {label}
                </a>
              ))}
              </div>
            <div style={{ textAlign: "center", fontSize: 11, color: T.textMuted }}>
              © 2025 freechildcarehours.co.uk · For informational purposes only · Always verify at <a href="https://www.gov.uk/tax-free-childcare" style={{ color: T.textMuted }}>gov.uk</a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
