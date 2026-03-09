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
  card: (extra = {}) => ({ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12
