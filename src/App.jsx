import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxFVWds2VlvaEm2PMW-707-MDvO7m7pvY",
  authDomain: "encuestas-diagnostico.firebaseapp.com",
  projectId: "encuestas-diagnostico",
  storageBucket: "encuestas-diagnostico.firebasestorage.app",
  messagingSenderId: "763075474015",
  appId: "1:763075474015:web:aa66ba87840072aa6321ea"
};

const ADMIN_PASSWORD = "2701";
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');`;

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f7f7f5; color: #1a1a1a; -webkit-font-smoothing: antialiased; }
  :root {
    --bg: #f7f7f5; --white: #ffffff; --border: #e4e4e0; --border-dark: #c8c8c2;
    --accent: #1a1a1a; --accent-light: #f0f0ee;
    --positive: #2d6a4f; --positive-bg: #f0f7f4;
    --negative: #c0392b; --negative-bg: #fdf2f2;
    --warning: #92621a; --warning-bg: #fdf6ec;
    --neutral: #6b6b65; --neutral-bg: #f5f5f3;
    --muted: #8a8a84; --text: #1a1a1a;
    --serif: 'Playfair Display', Georgia, serif;
    --sans: 'Inter', sans-serif;
  }
  .app { min-height: 100vh; background: var(--bg); }
  .nav { display:flex; align-items:center; justify-content:space-between; padding:0 48px; height:64px; background:var(--white); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
  .nav-logo { font-family:var(--serif); font-weight:600; font-size:1.15rem; color:var(--text); }
  .nav-logo span { color:var(--muted); font-weight:400; }
  .nav-tabs { display:flex; gap:2px; }
  .nav-tab { padding:7px 18px; border-radius:6px; border:none; cursor:pointer; font-family:var(--sans); font-size:0.82rem; font-weight:500; transition:all 0.15s; background:transparent; color:var(--muted); }
  .nav-tab:hover { background:var(--accent-light); color:var(--text); }
  .nav-tab.active { background:var(--accent); color:#fff; }
  .nav-right { display:flex; align-items:center; gap:12px; }
  .nav-badge { font-size:0.75rem; color:var(--muted); border:1px solid var(--border); padding:4px 14px; border-radius:20px; background:var(--white); }
  .admin-badge { font-size:0.72rem; color:var(--positive); font-weight:600; border:1px solid #d4e8df; padding:4px 12px; border-radius:20px; background:var(--positive-bg); text-transform:uppercase; display:flex; align-items:center; gap:5px; }
  .logout-btn { font-size:0.75rem; color:var(--muted); background:none; border:none; cursor:pointer; padding:4px 8px; border-radius:4px; font-family:var(--sans); }
  .logout-btn:hover { color:var(--text); background:var(--accent-light); }
  .main { max-width:860px; margin:0 auto; padding:48px 24px; }

  /* LOGIN */
  .login-wrap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:var(--bg); }
  .login-card { background:var(--white); border:1px solid var(--border); border-radius:12px; padding:48px 40px; width:100%; max-width:380px; text-align:center; }
  .login-title { font-family:var(--serif); font-size:1.5rem; font-weight:600; margin-bottom:8px; }
  .login-sub { color:var(--muted); font-size:0.85rem; margin-bottom:32px; line-height:1.6; }
  .login-error { background:var(--negative-bg); color:var(--negative); font-size:0.8rem; padding:10px 14px; border-radius:6px; margin-bottom:16px; border:1px solid #f0d4d0; }

  /* LAYOUT */
  .section-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:32px; border-bottom:1px solid var(--border); padding-bottom:20px; }
  .section-title { font-family:var(--serif); font-weight:600; font-size:1.6rem; }
  .section-sub { color:var(--muted); font-size:0.82rem; margin-top:6px; }
  .card { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:28px 32px; margin-bottom:16px; }
  .card-title { font-family:var(--serif); font-size:0.95rem; font-weight:600; margin-bottom:20px; padding-bottom:12px; border-bottom:1px solid var(--border); }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }

  /* FORMS */
  .field { margin-bottom:18px; }
  .label { font-size:0.72rem; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:8px; display:block; }
  .input,.select,.textarea { width:100%; background:var(--white); border:1px solid var(--border); border-radius:6px; padding:10px 14px; color:var(--text); font-family:var(--sans); font-size:0.88rem; outline:none; transition:border-color 0.15s; }
  .input:focus,.select:focus,.textarea:focus { border-color:var(--accent); }
  .input::placeholder { color:var(--muted); }
  .textarea { min-height:80px; resize:vertical; line-height:1.6; }
  .select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238a8a84' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 14px center; padding-right:36px; }

  /* BUTTONS */
  .btn { display:inline-flex; align-items:center; gap:7px; padding:9px 20px; border-radius:6px; border:1px solid transparent; cursor:pointer; font-family:var(--sans); font-size:0.82rem; font-weight:500; transition:all 0.15s; }
  .btn-primary { background:var(--accent); color:#fff; border-color:var(--accent); }
  .btn-primary:hover { background:#333; }
  .btn-primary:disabled { background:var(--muted); border-color:var(--muted); cursor:not-allowed; opacity:0.7; }
  .btn-secondary { background:var(--white); color:var(--text); border-color:var(--border); }
  .btn-secondary:hover { border-color:var(--accent); }
  .btn-danger { background:transparent; color:var(--negative); border-color:#e8c5c2; }
  .btn-danger:hover { background:var(--negative-bg); }
  .btn-outline { background:transparent; color:var(--text); border-color:var(--border); }
  .btn-outline:hover { background:var(--accent-light); }
  .btn-sm { padding:6px 14px; font-size:0.78rem; }
  .btn-full { width:100%; justify-content:center; }

  /* SURVEY ITEMS */
  .survey-item { display:flex; justify-content:space-between; align-items:center; padding:18px 24px; background:var(--white); border:1px solid var(--border); border-radius:8px; margin-bottom:10px; transition:border-color 0.15s; }
  .survey-item:hover { border-color:var(--border-dark); }
  .survey-name { font-weight:500; font-size:0.92rem; }
  .survey-meta { font-size:0.78rem; color:var(--muted); margin-top:4px; }

  /* QUESTION ITEMS */
  .q-item { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:16px 20px; margin-bottom:10px; }
  .q-item-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
  .q-type-badge { font-size:0.7rem; padding:3px 10px; border-radius:20px; background:var(--white); border:1px solid var(--border); color:var(--muted); white-space:nowrap; font-weight:500; }
  .q-options { margin-top:12px; display:flex; flex-direction:column; gap:8px; }
  .q-opt-row { display:flex; gap:8px; align-items:center; }

  /* RESPONSE */
  .q-response { margin-bottom:32px; padding-bottom:32px; border-bottom:1px solid var(--border); }
  .q-response:last-child { border-bottom:none; }
  .q-text { font-size:1rem; font-weight:500; margin-bottom:16px; line-height:1.6; }
  .q-num { font-family:var(--serif); color:var(--muted); margin-right:10px; }
  .scale-row { display:flex; gap:10px; flex-wrap:wrap; }
  .scale-btn { width:52px; height:52px; border-radius:8px; border:1px solid var(--border); background:var(--white); color:var(--text); font-size:1rem; font-weight:500; cursor:pointer; transition:all 0.15s; }
  .scale-btn:hover { border-color:var(--accent); background:var(--accent-light); }
  .scale-btn.selected { background:var(--accent); border-color:var(--accent); color:#fff; }
  .yn-row { display:flex; gap:12px; }
  .yn-btn { flex:1; padding:14px; border-radius:8px; border:1px solid var(--border); background:var(--white); color:var(--text); font-size:0.9rem; font-weight:500; cursor:pointer; transition:all 0.15s; }
  .yn-btn:hover,.yn-btn.selected { background:var(--accent); border-color:var(--accent); color:#fff; }
  .mc-row { display:flex; flex-direction:column; gap:8px; }
  .mc-btn { padding:12px 16px; border-radius:8px; border:1px solid var(--border); background:var(--white); color:var(--text); font-size:0.88rem; cursor:pointer; transition:all 0.15s; text-align:left; font-family:var(--sans); }
  .mc-btn:hover,.mc-btn.selected { background:var(--accent); border-color:var(--accent); color:#fff; }
  .progress-bar { height:2px; background:var(--border); border-radius:1px; margin-bottom:40px; }
  .progress-fill { height:100%; background:var(--accent); border-radius:1px; transition:width 0.4s; }

  /* RESULTS — HEALTH INDEX */
  .health-card { background:var(--accent); color:#fff; border-radius:12px; padding:32px 36px; margin-bottom:16px; display:flex; align-items:center; gap:40px; }
  .health-score { font-family:var(--serif); font-size:5rem; font-weight:600; line-height:1; }
  .health-score span { font-size:1.8rem; opacity:0.6; }
  .health-label { font-size:0.75rem; opacity:0.6; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px; }
  .health-status { font-family:var(--serif); font-size:1.4rem; font-weight:600; margin-bottom:8px; }
  .health-bar-wrap { width:200px; height:6px; background:rgba(255,255,255,0.2); border-radius:3px; margin-top:12px; }
  .health-bar-fill { height:100%; border-radius:3px; background:#fff; transition:width 1s; }

  /* RESULTS — STATS */
  .stat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px; }
  .stat-card { background:var(--white); border:1px solid var(--border); border-radius:8px; padding:20px 24px; }
  .stat-num { font-family:var(--serif); font-weight:600; font-size:1.8rem; }
  .stat-label { font-size:0.72rem; color:var(--muted); margin-top:4px; font-weight:500; text-transform:uppercase; letter-spacing:0.07em; }

  /* RESULTS — RADAR */
  .radar-wrap { display:flex; justify-content:center; padding:16px 0; }

  /* RESULTS — FORTALEZAS/CRÍTICAS */
  .insight-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
  .insight-card { border-radius:10px; padding:20px 24px; }
  .insight-card.pos { background:var(--positive-bg); border:1px solid #c8e6d4; }
  .insight-card.neg { background:var(--negative-bg); border:1px solid #f0c8c4; }
  .insight-card-title { font-size:0.72rem; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:14px; }
  .insight-card.pos .insight-card-title { color:var(--positive); }
  .insight-card.neg .insight-card-title { color:var(--negative); }
  .insight-item { font-size:0.85rem; padding:8px 0; border-bottom:1px solid rgba(0,0,0,0.06); line-height:1.5; }
  .insight-item:last-child { border-bottom:none; }
  .insight-score { font-family:var(--serif); font-weight:600; float:right; }

  /* RESULTS — CHARTS */
  .chart-section { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:24px 28px; margin-bottom:12px; }
  .chart-q { font-size:0.92rem; font-weight:500; line-height:1.5; }
  .chart-q-meta { font-size:0.7rem; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:6px; }
  .bar-row { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
  .bar-label { min-width:110px; color:var(--muted); text-align:right; font-size:0.78rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .bar-track { flex:1; height:8px; background:var(--bg); border-radius:4px; overflow:hidden; border:1px solid var(--border); }
  .bar-fill { height:100%; border-radius:4px; background:var(--accent); transition:width 0.6s; }
  .bar-pct { min-width:36px; font-size:0.75rem; color:var(--muted); font-weight:500; }
  .avg-display { display:flex; align-items:baseline; gap:6px; margin-bottom:14px; }
  .avg-num { font-family:var(--serif); font-weight:600; font-size:2.2rem; }
  .avg-denom { font-size:0.95rem; color:var(--muted); }
  .tag { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:0.7rem; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; }
  .tag-pos { background:var(--positive-bg); color:var(--positive); }
  .tag-neg { background:var(--negative-bg); color:var(--negative); }
  .tag-neu { background:var(--neutral-bg); color:var(--neutral); }
  .responses-list { display:flex; flex-direction:column; gap:8px; }
  .response-text { background:var(--bg); border:1px solid var(--border); border-left:3px solid var(--border-dark); padding:10px 14px; border-radius:0 6px 6px 0; font-size:0.85rem; line-height:1.6; }

  /* ACTION PLAN */
  .plan-section { margin-bottom:16px; }
  .plan-item { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:20px 24px; margin-bottom:10px; }
  .plan-item-header { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:12px; }
  .plan-area { font-weight:600; font-size:0.92rem; flex:1; }
  .priority-badge { font-size:0.68rem; padding:3px 10px; border-radius:20px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap; }
  .priority-alta { background:#fdf2f2; color:var(--negative); border:1px solid #f0c8c4; }
  .priority-media { background:var(--warning-bg); color:var(--warning); border:1px solid #f0dfc4; }
  .priority-baja { background:var(--positive-bg); color:var(--positive); border:1px solid #c8e6d4; }
  .plan-actions { display:flex; flex-direction:column; gap:6px; }
  .plan-action { display:flex; gap:10px; font-size:0.85rem; line-height:1.5; color:#333; }
  .plan-action-num { color:var(--muted); font-family:var(--serif); font-weight:600; flex-shrink:0; }
  .plan-meta { display:flex; gap:16px; margin-top:12px; padding-top:12px; border-top:1px solid var(--border); }
  .plan-meta-item { font-size:0.75rem; color:var(--muted); display:flex; align-items:center; gap:5px; }

  /* AI ANALYSIS */
  .ai-section { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:24px 28px; margin-bottom:16px; }
  .ai-loading { display:flex; align-items:center; gap:12px; color:var(--muted); font-size:0.88rem; }
  .ai-text { font-size:0.88rem; line-height:1.8; color:#333; white-space:pre-wrap; }
  .ai-label { font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted); margin-bottom:12px; display:flex; align-items:center; gap:8px; }
  .ai-dot { width:6px; height:6px; border-radius:50%; background:var(--positive); display:inline-block; }

  /* SUCCESS/EMPTY/LOADING */
  .success-screen { text-align:center; padding:80px 20px; }
  .success-icon { font-size:2.5rem; margin-bottom:20px; }
  .success-title { font-family:var(--serif); font-weight:600; font-size:1.8rem; margin-bottom:12px; }
  .success-sub { color:var(--muted); max-width:380px; margin:0 auto; line-height:1.7; font-size:0.9rem; }
  .empty { text-align:center; padding:60px 20px; color:var(--muted); font-size:0.88rem; }
  .empty-icon { font-size:2rem; margin-bottom:12px; opacity:0.4; }
  .loading { text-align:center; padding:80px 20px; color:var(--muted); font-size:0.85rem; }
  .spinner { width:28px; height:28px; border:2px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 16px; }
  .spinner-sm { width:16px; height:16px; border:2px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; display:inline-block; }
  @keyframes spin { to { transform:rotate(360deg); } }

  @media(max-width:680px) {
    .stat-grid { grid-template-columns:1fr 1fr; }
    .insight-grid { grid-template-columns:1fr; }
    .two-col { grid-template-columns:1fr; }
    .health-card { flex-direction:column; gap:20px; }
    .nav { padding:0 16px; }
    .main { padding:32px 16px; }
  }
`;

const QUESTION_TYPES = [
  { value:"scale", label:"Escala 1–5" },
  { value:"yesno", label:"Sí / No" },
  { value:"multiple", label:"Opción múltiple" },
  { value:"text", label:"Texto libre" },
];
const SURVEY_CATEGORIES = ["Comunicación Interna","Satisfacción","Evaluación de Proceso","Otro"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getQuestionScore(q, responses) {
  const answers = responses.map(r => r.answers[q.id]).filter(a => a !== undefined);
  if (!answers.length) return null;
  if (q.type === "scale") return (answers.reduce((a,b) => a+b, 0) / answers.length) / 5 * 100;
  if (q.type === "yesno") return (answers.filter(a => a==="Sí").length / answers.length) * 100;
  return null;
}

function getHealthScore(survey) {
  const scores = survey.questions.map(q => getQuestionScore(q, survey.responses)).filter(s => s !== null);
  if (!scores.length) return null;
  return Math.round(scores.reduce((a,b) => a+b, 0) / scores.length);
}

function getHealthLabel(score) {
  if (score >= 80) return { label:"Excelente", color:"#2d6a4f" };
  if (score >= 65) return { label:"Bueno", color:"#4a8c6a" };
  if (score >= 50) return { label:"Regular", color:"#92621a" };
  if (score >= 35) return { label:"Deficiente", color:"#c0392b" };
  return { label:"Crítico", color:"#8b0000" };
}

function getTopInsights(survey) {
  const scored = survey.questions
    .map(q => ({ q, score: getQuestionScore(q, survey.responses) }))
    .filter(x => x.score !== null)
    .sort((a,b) => b.score - a.score);
  return {
    strengths: scored.slice(0, 3),
    criticals: scored.slice(-3).reverse()
  };
}

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function RadarChart({ survey }) {
  const questions = survey.questions.filter(q => q.type === "scale" || q.type === "yesno");
  if (questions.length < 3) return null;
  const size = 240, cx = size/2, cy = size/2, r = 90;
  const scores = questions.map(q => (getQuestionScore(q, survey.responses) || 0) / 100);
  const n = questions.length;
  const pts = scores.map((s, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI/2;
    return { x: cx + r * s * Math.cos(angle), y: cy + r * s * Math.sin(angle) };
  });
  const polyPts = pts.map(p => `${p.x},${p.y}`).join(" ");
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const labels = questions.map((q, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI/2;
    const lr = r + 28;
    return { x: cx + lr * Math.cos(angle), y: cy + lr * Math.sin(angle), text: q.text.length > 18 ? q.text.slice(0,16)+"…" : q.text };
  });
  const axes = questions.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI/2;
    return { x2: cx + r * Math.cos(angle), y2: cy + r * Math.sin(angle) };
  });
  return (
    <div className="radar-wrap">
      <svg width={size+100} height={size+60} viewBox={`-50 -20 ${size+100} ${size+60}`}>
        {gridLevels.map(lv => {
          const gpts = questions.map((_,i) => {
            const angle = (i/n)*2*Math.PI - Math.PI/2;
            return `${cx+r*lv*Math.cos(angle)},${cy+r*lv*Math.sin(angle)}`;
          }).join(" ");
          return <polygon key={lv} points={gpts} fill="none" stroke="#e4e4e0" strokeWidth="1" />;
        })}
        {axes.map((a,i) => <line key={i} x1={cx} y1={cy} x2={a.x2} y2={a.y2} stroke="#e4e4e0" strokeWidth="1" />)}
        <polygon points={polyPts} fill="rgba(26,26,26,0.08)" stroke="#1a1a1a" strokeWidth="2" />
        {pts.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#1a1a1a" />)}
        {labels.map((l,i) => (
          <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize:"9px", fill:"#8a8a84", fontFamily:"Inter,sans-serif" }}>{l.text}</text>
        ))}
      </svg>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.count), 1);
  const total = Math.max(data.reduce((a,b) => a+b.count, 0), 1);
  return (
    <div>
      {data.map((d,i) => (
        <div className="bar-row" key={i}>
          <div className="bar-label" title={d.label}>{d.label}</div>
          <div className="bar-track"><div className="bar-fill" style={{ width:`${(d.count/max)*100}%` }} /></div>
          <div className="bar-pct">{Math.round((d.count/total)*100)}%</div>
        </div>
      ))}
    </div>
  );
}

function ScaleChart({ answers }) {
  const avg = answers.length ? (answers.reduce((a,b)=>a+b,0)/answers.length).toFixed(1) : "—";
  return (
    <div>
      <div className="avg-display">
        <span className="avg-num">{avg}</span>
        <span className="avg-denom">/ 5</span>
        <span style={{ fontSize:"0.78rem", color:"var(--muted)", marginLeft:4 }}>· {answers.length} respuesta{answers.length!==1?"s":""}</span>
      </div>
      <BarChart data={[1,2,3,4,5].map(v => ({ label:`${v}`, count:answers.filter(a=>a===v).length }))} />
    </div>
  );
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

async function fetchAIAnalysis(survey) {
  const textAnswers = survey.questions
    .filter(q => q.type === "text")
    .map(q => ({
      pregunta: q.text,
      respuestas: survey.responses.map(r => r.answers[q.id]).filter(Boolean)
    }))
    .filter(x => x.respuestas.length > 0);

  const numericSummary = survey.questions
    .filter(q => q.type === "scale" || q.type === "yesno")
    .map(q => {
      const answers = survey.responses.map(r => r.answers[q.id]).filter(a => a !== undefined);
      if (q.type === "scale") {
        const avg = answers.length ? (answers.reduce((a,b)=>a+b,0)/answers.length).toFixed(1) : "—";
        return `- "${q.text}": promedio ${avg}/5`;
      }
      const yes = answers.filter(a=>a==="Sí").length;
      const pct = answers.length ? Math.round(yes/answers.length*100) : 0;
      return `- "${q.text}": ${pct}% Sí`;
    }).join("\n");

  const prompt = `Sos un especialista en comunicación interna y desarrollo organizacional. Analizá los resultados de la siguiente encuesta y brindá un diagnóstico profesional.

ENCUESTA: ${survey.title}
CATEGORÍA: ${survey.category}
TOTAL DE RESPUESTAS: ${survey.responses.length}

RESULTADOS NUMÉRICOS:
${numericSummary}

${textAnswers.length > 0 ? `RESPUESTAS ABIERTAS:
${textAnswers.map(x => `Pregunta: "${x.pregunta}"\nRespuestas: ${x.respuestas.slice(0,8).join(" | ")}`).join("\n\n")}` : ""}

Redactá un análisis en 3 párrafos:
1. Diagnóstico general del estado actual (2-3 oraciones)
2. Patrones identificados y factores clave que explican los resultados (2-3 oraciones)
3. Conclusión y foco de intervención prioritario (2 oraciones)

Sé específico, profesional y accionable. No uses listas ni bullets, solo párrafos fluidos.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json();
  return data.content?.[0]?.text || "No se pudo generar el análisis.";
}

async function fetchActionPlan(survey) {
  const summary = survey.questions.map(q => {
    const answers = survey.responses.map(r => r.answers[q.id]).filter(a => a !== undefined);
    if (!answers.length) return null;
    if (q.type === "scale") {
      const avg = (answers.reduce((a,b)=>a+b,0)/answers.length).toFixed(1);
      return `"${q.text}" [escala]: promedio ${avg}/5`;
    }
    if (q.type === "yesno") {
      const pct = Math.round(answers.filter(a=>a==="Sí").length/answers.length*100);
      return `"${q.text}" [sí/no]: ${pct}% Sí`;
    }
    if (q.type === "text") {
      return `"${q.text}" [abierta]: ${answers.slice(0,5).join(" | ")}`;
    }
    return null;
  }).filter(Boolean).join("\n");

  const prompt = `Sos un consultor experto en ${survey.category}. Basándote en estos resultados, generá un plan de acción concreto.

ENCUESTA: ${survey.title}
RESPUESTAS: ${survey.responses.length}

RESULTADOS:
${summary}

Respondé ÚNICAMENTE con un JSON válido con este formato exacto (sin texto adicional, sin markdown):
{
  "areas": [
    {
      "area": "nombre del área de mejora",
      "prioridad": "Alta" | "Media" | "Baja",
      "plazo": "Inmediato (0-30 días)" | "Corto plazo (1-3 meses)" | "Mediano plazo (3-6 meses)",
      "responsable": "rol sugerido",
      "acciones": ["acción concreta 1", "acción concreta 2", "acción concreta 3"]
    }
  ]
}
Generá entre 3 y 5 áreas priorizadas de mayor a menor urgencia.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });
  const data = await response.json();
  const text = data.content?.[0]?.text || "{}";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch { return { areas: [] }; }
}

// ─── Login Modal ──────────────────────────────────────────────────────────────

function LoginModal({ onSuccess, onCancel }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);
  const attempt = () => {
    if (pwd === ADMIN_PASSWORD) onSuccess();
    else { setError(true); setPwd(""); }
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200 }}>
      <div className="login-card" style={{ position:"relative" }}>
        <button onClick={onCancel} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", cursor:"pointer", color:"var(--muted)", fontSize:"1.1rem" }}>✕</button>
        <div className="login-title">Acceso administrativo</div>
        <div className="login-sub">Ingresá la contraseña para acceder al panel.</div>
        {error && <div className="login-error">Contraseña incorrecta.</div>}
        <div className="field">
          <label className="label">Contraseña</label>
          <input className="input" type="password" value={pwd} placeholder="••••••" onChange={e => { setPwd(e.target.value); setError(false); }} onKeyDown={e => e.key==="Enter" && attempt()} autoFocus />
        </div>
        <button className="btn btn-primary btn-full" onClick={attempt}>Ingresar</button>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

function AdminPanel({ surveys, loading }) {
  const [mode, setMode] = useState("list");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(SURVEY_CATEGORIES[0]);
  const [questions, setQuestions] = useState([]);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("scale");
  const [qOptions, setQOptions] = useState(["",""]);
  const [saving, setSaving] = useState(false);

  const addQ = () => {
    if (!qText.trim()) return;
    const q = { id: Date.now(), text: qText, type: qType };
    if (qType === "multiple") q.options = qOptions.filter(o => o.trim());
    setQuestions([...questions, q]); setQText(""); setQOptions(["",""]);
  };

  const save = async () => {
    if (!title.trim() || !questions.length) return;
    setSaving(true);
    try {
      await addDoc(collection(db,"surveys"), { title, category, questions, createdAt: new Date().toLocaleDateString("es-AR"), responses:[] });
      setTitle(""); setCategory(SURVEY_CATEGORIES[0]); setQuestions([]); setMode("list");
    } catch(e) { console.error(e); }
    setSaving(false);
  };

  const del = async id => {
    if (!confirm("¿Eliminar esta encuesta?")) return;
    await deleteDoc(doc(db,"surveys",id));
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando…</div>;

  if (mode === "list") return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Encuestas</div><div className="section-sub">{surveys.length} registrada{surveys.length!==1?"s":""}</div></div>
        <button className="btn btn-primary" onClick={() => setMode("create")}>+ Nueva encuesta</button>
      </div>
      {!surveys.length && <div className="empty"><div className="empty-icon">○</div><div>No hay encuestas aún.</div></div>}
      {surveys.map(s => (
        <div className="survey-item" key={s.id}>
          <div><div className="survey-name">{s.title}</div><div className="survey-meta">{s.category} · {s.questions.length} preguntas · {(s.responses||[]).length} respuestas · {s.createdAt}</div></div>
          <button className="btn btn-danger btn-sm" onClick={() => del(s.id)}>Eliminar</button>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Nueva encuesta</div><div className="section-sub">Completá los datos y agregá preguntas</div></div>
        <button className="btn btn-secondary" onClick={() => setMode("list")}>← Volver</button>
      </div>
      <div className="card">
        <div className="card-title">Datos generales</div>
        <div className="two-col">
          <div className="field"><label className="label">Título</label><input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Diagnóstico Q1 2025" /></div>
          <div className="field"><label className="label">Categoría</label><select className="select" value={category} onChange={e => setCategory(e.target.value)}>{SURVEY_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        </div>
      </div>
      <div className="card">
        <div className="card-title">Agregar pregunta</div>
        <div className="field"><label className="label">Pregunta</label><input className="input" value={qText} onChange={e => setQText(e.target.value)} placeholder="Ej: ¿Cómo calificás la comunicación entre áreas?" /></div>
        <div className="field"><label className="label">Tipo</label><select className="select" value={qType} onChange={e => { setQType(e.target.value); setQOptions(["",""]); }}>{QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        {qType === "multiple" && (
          <div className="field"><label className="label">Opciones</label>
            <div className="q-options">
              {qOptions.map((opt,i) => <div className="q-opt-row" key={i}><input className="input" value={opt} placeholder={`Opción ${i+1}`} onChange={e => { const o=[...qOptions]; o[i]=e.target.value; setQOptions(o); }} />{qOptions.length>2 && <button className="btn btn-danger btn-sm" onClick={() => setQOptions(qOptions.filter((_,j)=>j!==i))}>✕</button>}</div>)}
              <button className="btn btn-secondary btn-sm" style={{ alignSelf:"flex-start" }} onClick={() => setQOptions([...qOptions,""])}>+ Opción</button>
            </div>
          </div>
        )}
        <button className="btn btn-outline" onClick={addQ}>Agregar pregunta →</button>
      </div>
      {!!questions.length && (
        <div className="card">
          <div className="card-title">Preguntas ({questions.length})</div>
          {questions.map((q,i) => (
            <div className="q-item" key={q.id}>
              <div className="q-item-header">
                <div style={{ flex:1, fontSize:"0.88rem", lineHeight:1.5 }}><span style={{ color:"var(--muted)", fontFamily:"var(--serif)", marginRight:8 }}>{i+1}.</span>{q.text}{q.type==="multiple"&&q.options&&<div style={{ marginTop:6, color:"var(--muted)", fontSize:"0.78rem" }}>{q.options.join(" · ")}</div>}</div>
                <div style={{ display:"flex", gap:8, alignItems:"center", flexShrink:0 }}><span className="q-type-badge">{QUESTION_TYPES.find(t=>t.value===q.type)?.label}</span><button className="btn btn-danger btn-sm" onClick={() => setQuestions(questions.filter(x=>x.id!==q.id))}>✕</button></div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!!questions.length && title.trim() && <div style={{ display:"flex", justifyContent:"flex-end" }}><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?"Guardando…":"Guardar encuesta"}</button></div>}
    </div>
  );
}

// ─── Responder ────────────────────────────────────────────────────────────────

function RespondSurvey({ surveys, loading }) {
  const [selectedId, setSelectedId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [respondent, setRespondent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const survey = surveys.find(s => s.id === selectedId);
  const answered = survey ? survey.questions.filter(q => answers[q.id]!==undefined).length : 0;
  const total = survey ? survey.questions.length : 0;

  const submit = async () => {
    if (!survey) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db,"surveys",selectedId), { responses: arrayUnion({ id:Date.now(), respondent, answers, date:new Date().toLocaleDateString("es-AR") }) });
      setStep(2);
    } catch(e) { console.error(e); }
    setSubmitting(false);
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando…</div>;

  if (step === 2) return (
    <div className="success-screen">
      <div className="success-icon">✓</div>
      <div className="success-title">Respuestas registradas</div>
      <div className="success-sub">Gracias por completar la encuesta. Tus respuestas fueron guardadas correctamente.</div>
      <div style={{ marginTop:32 }}><button className="btn btn-secondary" onClick={() => { setStep(0); setSelectedId(null); setRespondent(""); setAnswers({}); }}>Responder otra encuesta</button></div>
    </div>
  );

  if (step === 1 && survey) return (
    <div>
      <div className="section-header">
        <div><div className="section-title">{survey.title}</div><div className="section-sub">{survey.category} · {answered} de {total} respondidas</div></div>
        <button className="btn btn-secondary btn-sm" onClick={() => setStep(0)}>← Salir</button>
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{ width:`${(answered/total)*100}%` }} /></div>
      <div className="card">
        {survey.questions.map((q,i) => (
          <div className="q-response" key={q.id}>
            <div className="q-text"><span className="q-num">{i+1}.</span>{q.text}</div>
            {q.type==="scale" && <div><div className="scale-row">{[1,2,3,4,5].map(v=><button key={v} className={`scale-btn${answers[q.id]===v?" selected":""}`} onClick={()=>setAnswers({...answers,[q.id]:v})}>{v}</button>)}</div><div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.72rem", color:"var(--muted)", marginTop:6 }}><span>Muy bajo</span><span>Muy alto</span></div></div>}
            {q.type==="yesno" && <div className="yn-row">{["Sí","No"].map(v=><button key={v} className={`yn-btn${answers[q.id]===v?" selected":""}`} onClick={()=>setAnswers({...answers,[q.id]:v})}>{v}</button>)}</div>}
            {q.type==="multiple"&&q.options && <div className="mc-row">{q.options.map(opt=><button key={opt} className={`mc-btn${answers[q.id]===opt?" selected":""}`} onClick={()=>setAnswers({...answers,[q.id]:opt})}>{opt}</button>)}</div>}
            {q.type==="text" && <textarea className="textarea" placeholder="Escribí tu respuesta aquí…" value={answers[q.id]||""} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})} />}
          </div>
        ))}
        <div style={{ textAlign:"center", paddingTop:8 }}>
          <button className="btn btn-primary" style={{ padding:"12px 40px" }} onClick={submit} disabled={answered<total||submitting}>
            {submitting?"Enviando…":answered<total?`Faltan ${total-answered} pregunta${total-answered!==1?"s":""}` : "Enviar respuestas"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="section-header"><div><div className="section-title">Completar encuesta</div><div className="section-sub">Seleccioná la encuesta e ingresá tus datos</div></div></div>
      {!surveys.length ? <div className="empty"><div className="empty-icon">○</div><div>No hay encuestas disponibles aún.</div></div> : (
        <div className="card">
          <div className="field"><label className="label">Nombre o identificador</label><input className="input" value={respondent} onChange={e=>setRespondent(e.target.value)} placeholder="Ej: María García / Área Comercial / Anónimo" /></div>
          <div className="field"><label className="label">Encuesta</label>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {surveys.map(s=><div key={s.id} onClick={()=>setSelectedId(s.id)} style={{ padding:"14px 18px", border:`1px solid ${selectedId===s.id?"var(--accent)":"var(--border)"}`, borderRadius:8, cursor:"pointer", background:selectedId===s.id?"var(--accent-light)":"var(--bg)", transition:"all 0.15s" }}><div style={{ fontWeight:500, fontSize:"0.9rem" }}>{s.title}</div><div style={{ fontSize:"0.78rem", color:"var(--muted)", marginTop:4 }}>{s.category} · {s.questions.length} preguntas</div></div>)}
            </div>
          </div>
          <button className="btn btn-primary" disabled={!selectedId||!respondent.trim()} onClick={()=>setStep(1)}>Comenzar →</button>
        </div>
      )}
    </div>
  );
}

// ─── Results Panel ────────────────────────────────────────────────────────────

function ResultsPanel({ surveys, loading }) {
  const [selectedId, setSelectedId] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [actionPlan, setActionPlan] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);

  const survey = surveys.find(s => s.id === selectedId);

  useEffect(() => {
    if (!survey || survey.responses.length === 0) return;
    setAiAnalysis(null); setActionPlan(null);
    setAiLoading(true);
    fetchAIAnalysis(survey).then(r => { setAiAnalysis(r); setAiLoading(false); });
    setPlanLoading(true);
    fetchActionPlan(survey).then(r => { setActionPlan(r); setPlanLoading(false); });
  }, [selectedId]);

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando…</div>;

  if (!selectedId || !survey) return (
    <div>
      <div className="section-header"><div><div className="section-title">Resultados</div><div className="section-sub">Seleccioná una encuesta para ver el diagnóstico completo</div></div></div>
      {!surveys.length ? <div className="empty"><div className="empty-icon">○</div><div>No hay encuestas creadas aún.</div></div>
        : surveys.map(s => (
          <div key={s.id} className="survey-item" onClick={() => setSelectedId(s.id)} style={{ cursor:"pointer" }}>
            <div><div className="survey-name">{s.title}</div><div className="survey-meta">{s.category} · {s.questions.length} preguntas · {(s.responses||[]).length} respuestas</div></div>
            <span style={{ color:"var(--muted)", fontSize:"1.2rem" }}>→</span>
          </div>
        ))}
    </div>
  );

  const responses = survey.responses || [];
  const healthScore = getHealthScore(survey);
  const healthInfo = healthScore !== null ? getHealthLabel(healthScore) : null;
  const { strengths, criticals } = responses.length ? getTopInsights(survey) : { strengths:[], criticals:[] };

  const getTag = score => {
    if (score === null) return null;
    if (score >= 70) return <span className="tag tag-pos">Positivo</span>;
    if (score >= 45) return <span className="tag tag-neu">Neutro</span>;
    return <span className="tag tag-neg">Crítico</span>;
  };

  const exportPDF = () => {
    const s = survey;
    const win = window.open("", "_blank");

    const radarQuestions = s.questions.filter(q => q.type==="scale"||q.type==="yesno");
    let radarSvg = "";
    if (radarQuestions.length >= 3) {
      const size=280, cx=size/2, cy=size/2, r=100;
      const scores = radarQuestions.map(q => (getQuestionScore(q, s.responses)||0)/100);
      const n = radarQuestions.length;
      const pts = scores.map((sc,i) => { const angle=(i/n)*2*Math.PI-Math.PI/2; return {x:cx+r*sc*Math.cos(angle),y:cy+r*sc*Math.sin(angle)}; });
      const polyPts = pts.map(p=>`${p.x},${p.y}`).join(" ");
      const gridLevels=[0.25,0.5,0.75,1];
      const labels = radarQuestions.map((q,i) => { const angle=(i/n)*2*Math.PI-Math.PI/2; const lr=r+32; return {x:cx+lr*Math.cos(angle),y:cy+lr*Math.sin(angle),text:q.text.length>20?q.text.slice(0,18)+"…":q.text}; });
      const axes = radarQuestions.map((_,i) => { const angle=(i/n)*2*Math.PI-Math.PI/2; return {x2:cx+r*Math.cos(angle),y2:cy+r*Math.sin(angle)}; });
      radarSvg = `<svg width="${size+120}" height="${size+60}" viewBox="-60 -20 ${size+120} ${size+60}" style="display:block;margin:0 auto">
        ${gridLevels.map(lv=>`<polygon points="${radarQuestions.map((_,i)=>{const a=(i/n)*2*Math.PI-Math.PI/2;return `${cx+r*lv*Math.cos(a)},${cy+r*lv*Math.sin(a)}`;}).join(" ")}" fill="none" stroke="#e4e4e0" stroke-width="1"/>`).join("")}
        ${axes.map(a=>`<line x1="${cx}" y1="${cy}" x2="${a.x2}" y2="${a.y2}" stroke="#e4e4e0" stroke-width="1"/>`).join("")}
        <polygon points="${polyPts}" fill="rgba(26,26,26,0.1)" stroke="#1a1a1a" stroke-width="2"/>
        ${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#1a1a1a"/>`).join("")}
        ${labels.map(l=>`<text x="${l.x}" y="${l.y}" text-anchor="middle" dominant-baseline="middle" style="font-size:9px;fill:#8a8a84;font-family:Helvetica,sans-serif">${l.text}</text>`).join("")}
      </svg>`;
    }

    let questionsHtml = "";
    s.questions.forEach((q,i) => {
      const answers = s.responses.map(r=>r.answers[q.id]).filter(a=>a!==undefined);
      const score = getQuestionScore(q, s.responses);
      let vizHtml = "";
      if (q.type==="scale") {
        const avg=answers.length?(answers.reduce((a,b)=>a+b,0)/answers.length).toFixed(1):"—";
        const counts=[1,2,3,4,5].map(v=>answers.filter(a=>a===v).length);
        const maxC=Math.max(...counts,1);
        vizHtml=`<div style="margin:14px 0"><div style="font-size:1.8rem;font-weight:600;font-family:Georgia,serif;color:#1a1a1a">${avg}<span style="font-size:1rem;color:#888"> / 5</span></div><div style="margin-top:10px">${[1,2,3,4,5].map((v,i)=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px"><span style="min-width:16px;font-size:.82rem;color:#888;text-align:right">${v}</span><div style="flex:1;height:8px;background:#f0f0ee;border-radius:4px;overflow:hidden"><div style="width:${(counts[i]/maxC)*100}%;height:100%;background:#1a1a1a;border-radius:4px"></div></div><span style="font-size:.75rem;color:#888;min-width:20px">${counts[i]}</span></div>`).join("")}</div></div>`;
      } else if (q.type==="yesno") {
        const yes=answers.filter(a=>a==="Sí").length,no=answers.filter(a=>a==="No").length,tot=yes+no||1;
        vizHtml=`<div style="display:flex;gap:12px;margin:14px 0"><div style="flex:1;background:#f0f7f4;border:1px solid #c8e6d4;border-radius:8px;padding:14px;text-align:center"><div style="font-size:1.4rem;font-weight:600;font-family:Georgia,serif;color:#2d6a4f">Sí</div><div style="font-size:.85rem;color:#555">${yes} · ${Math.round(yes/tot*100)}%</div></div><div style="flex:1;background:#fdf2f2;border:1px solid #f0c8c4;border-radius:8px;padding:14px;text-align:center"><div style="font-size:1.4rem;font-weight:600;font-family:Georgia,serif;color:#c0392b">No</div><div style="font-size:.85rem;color:#555">${no} · ${Math.round(no/tot*100)}%</div></div></div>`;
      } else if (q.type==="multiple"&&q.options) {
        const counts2=q.options.map(opt=>({label:opt,count:answers.filter(a=>a===opt).length}));
        const max2=Math.max(...counts2.map(c=>c.count),1),tot2=counts2.reduce((a,b)=>a+b.count,0)||1;
        vizHtml=`<div style="margin:14px 0">${counts2.map(c=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px"><span style="min-width:110px;font-size:.78rem;color:#888;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.label}</span><div style="flex:1;height:8px;background:#f0f0ee;border-radius:4px;overflow:hidden"><div style="width:${(c.count/max2)*100}%;height:100%;background:#1a1a1a;border-radius:4px"></div></div><span style="font-size:.75rem;color:#888;min-width:28px">${Math.round(c.count/tot2*100)}%</span></div>`).join("")}</div>`;
      } else if (q.type==="text") {
        vizHtml=`<div style="margin:12px 0">${answers.map(a=>`<div style="background:#f7f7f5;border-left:3px solid #c8c8c2;padding:9px 13px;margin-bottom:7px;border-radius:0 5px 5px 0;font-size:.83rem;line-height:1.6;color:#1a1a1a">${a}</div>`).join("")}</div>`;
      }
      const tagColor = score===null?null:score>=70?{bg:"#f0f7f4",color:"#2d6a4f",text:"Positivo"}:score>=45?{bg:"#f5f5f3",color:"#6b6b65",text:"Neutro"}:{bg:"#fdf2f2",color:"#c0392b",text:"Crítico"};
      questionsHtml+=`<div style="background:white;border:1px solid #e4e4e0;border-radius:8px;padding:22px;margin-bottom:12px;page-break-inside:avoid"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px"><div style="flex:1"><p style="font-size:.68rem;color:#8a8a84;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px">Pregunta ${i+1}</p><h3 style="font-size:.92rem;font-weight:500;color:#1a1a1a;line-height:1.5;margin:0">${q.text}</h3></div>${tagColor?`<span style="font-size:.65rem;padding:3px 9px;border-radius:20px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;background:${tagColor.bg};color:${tagColor.color}">${tagColor.text}</span>`:""}</div>${vizHtml}<p style="font-size:.7rem;color:#b0b0a8;margin-top:10px;border-top:1px solid #f0f0ee;padding-top:8px">${answers.length} respuesta${answers.length!==1?"s":""}</p></div>`;
    });

    const planHtml = actionPlan?.areas?.map(a => {
      const pColor = a.prioridad==="Alta"?{bg:"#fdf2f2",color:"#c0392b"}:a.prioridad==="Media"?{bg:"#fdf6ec",color:"#92621a"}:{bg:"#f0f7f4",color:"#2d6a4f"};
      return `<div style="background:white;border:1px solid #e4e4e0;border-radius:8px;padding:20px 24px;margin-bottom:10px;page-break-inside:avoid"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:12px"><div><h3 style="font-size:.92rem;font-weight:600;margin:0 0 4px">${a.area}</h3><span style="font-size:.7rem;color:#888">${a.plazo} · ${a.responsable}</span></div><span style="font-size:.65rem;padding:3px 10px;border-radius:20px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;background:${pColor.bg};color:${pColor.color};white-space:nowrap">Prioridad ${a.prioridad}</span></div><div>${a.acciones.map((ac,i)=>`<div style="display:flex;gap:10px;font-size:.83rem;line-height:1.5;margin-bottom:7px;color:#333"><span style="color:#8a8a84;font-family:Georgia,serif;font-weight:600;flex-shrink:0">${i+1}.</span><span>${ac}</span></div>`).join("")}</div></div>`;
    }).join("") || "";

    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${s.title} — Diagnóstico</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');
      body{font-family:'Inter',sans-serif;background:#f7f7f5;color:#1a1a1a;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .cover{background:#1a1a1a;color:white;padding:56px}
      .eyebrow{font-size:.68rem;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.12em;margin-bottom:16px}
      h1{font-family:'Playfair Display',Georgia,serif;font-size:2rem;font-weight:600;margin:0 0 8px;line-height:1.2}
      .cat{color:#888;font-size:.88rem;margin-bottom:32px}
      .stats{display:flex;gap:14px}
      .stat{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:14px 22px}
      .stat-n{font-family:'Playfair Display',Georgia,serif;font-size:1.5rem;font-weight:600;color:white}
      .stat-l{font-size:.68rem;color:#888;margin-top:3px;text-transform:uppercase;letter-spacing:.06em}
      .body{padding:40px 56px}
      .section-label{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#8a8a84;margin:32px 0 14px;padding-bottom:8px;border-bottom:1px solid #e4e4e0}
      .health-box{background:#1a1a1a;color:white;border-radius:10px;padding:24px 28px;display:flex;align-items:center;gap:32px;margin-bottom:14px}
      .health-score{font-family:'Playfair Display',Georgia,serif;font-size:4rem;font-weight:600;line-height:1}
      .health-denom{font-size:1.4rem;opacity:.5}
      .health-status{font-family:'Playfair Display',Georgia,serif;font-size:1.2rem;font-weight:600;margin-bottom:6px}
      .health-bar{width:160px;height:5px;background:rgba(255,255,255,.2);border-radius:3px;margin-top:8px}
      .health-bar-inner{height:100%;border-radius:3px;background:white}
      .two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
      .insight-box{border-radius:8px;padding:18px 22px}
      .insight-box.pos{background:#f0f7f4;border:1px solid #c8e6d4}
      .insight-box.neg{background:#fdf2f2;border:1px solid #f0c8c4}
      .insight-title{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px}
      .insight-box.pos .insight-title{color:#2d6a4f}
      .insight-box.neg .insight-title{color:#c0392b}
      .insight-row{font-size:.82rem;padding:6px 0;border-bottom:1px solid rgba(0,0,0,.05);line-height:1.4}
      .insight-row:last-child{border-bottom:none}
      .ai-box{background:white;border:1px solid #e4e4e0;border-radius:8px;padding:22px 26px;margin-bottom:12px}
      .ai-label{font-size:.68rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#8a8a84;margin-bottom:10px}
      .ai-text{font-size:.88rem;line-height:1.8;color:#333;white-space:pre-wrap}
      @media print{.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    </style></head><body>
    <div class="cover">
      <div class="eyebrow">Informe de diagnóstico · ${new Date().toLocaleDateString("es-AR")}</div>
      <h1>${s.title}</h1><div class="cat">${s.category}</div>
      <div class="stats">
        <div class="stat"><div class="stat-n">${s.responses.length}</div><div class="stat-l">Respuestas</div></div>
        <div class="stat"><div class="stat-n">${s.questions.length}</div><div class="stat-l">Preguntas</div></div>
        ${healthScore!==null?`<div class="stat"><div class="stat-n">${healthScore}/100</div><div class="stat-l">Índice de salud</div></div>`:""}
        <div class="stat"><div class="stat-n">${s.createdAt}</div><div class="stat-l">Fecha</div></div>
      </div>
    </div>
    <div class="body">
      ${healthScore!==null?`
      <div class="section-label">Índice de salud organizacional</div>
      <div class="health-box">
        <div><div class="health-score">${healthScore}<span class="health-denom">/100</span></div></div>
        <div><div class="health-status">${healthInfo.label}</div><div style="font-size:.82rem;opacity:.7">Basado en ${responses.length} respuestas</div><div class="health-bar"><div class="health-bar-inner" style="width:${healthScore}%"></div></div></div>
      </div>`:""}

      ${radarSvg?`<div class="section-label">Gráfico radar</div><div style="background:white;border:1px solid #e4e4e0;border-radius:8px;padding:20px;margin-bottom:12px">${radarSvg}</div>`:""}

      ${strengths.length?`
      <div class="section-label">Fortalezas y áreas críticas</div>
      <div class="two-col">
        <div class="insight-box pos"><div class="insight-title">▲ Top fortalezas</div>${strengths.map(x=>`<div class="insight-row">${x.q.text.slice(0,60)}${x.q.text.length>60?"…":""} <span style="float:right;font-weight:600">${Math.round(x.score)}%</span></div>`).join("")}</div>
        <div class="insight-box neg"><div class="insight-title">▼ Áreas críticas</div>${criticals.map(x=>`<div class="insight-row">${x.q.text.slice(0,60)}${x.q.text.length>60?"…":""} <span style="float:right;font-weight:600">${Math.round(x.score)}%</span></div>`).join("")}</div>
      </div>`:""}

      ${aiAnalysis?`
      <div class="section-label">Diagnóstico con IA</div>
      <div class="ai-box"><div class="ai-label">Análisis profesional</div><div class="ai-text">${aiAnalysis}</div></div>`:""}

      <div class="section-label">Resultados por pregunta</div>
      ${questionsHtml}

      ${planHtml?`
      <div class="section-label">Plan de acción</div>
      ${planHtml}`:""}

      <p style="margin-top:48px;padding-top:20px;border-top:1px solid #e4e4e0;text-align:center;font-size:.72rem;color:#b0b0a8">Diagnóstico generado automáticamente · ${new Date().toLocaleString("es-AR")}</p>
    </div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 800);
  };

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">{survey.title}</div><div className="section-sub">{survey.category}</div></div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedId(null)}>← Volver</button>
          <button className="btn btn-primary btn-sm" onClick={exportPDF} disabled={!responses.length}>Exportar PDF</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-num">{responses.length}</div><div className="stat-label">Respuestas</div></div>
        <div className="stat-card"><div className="stat-num">{survey.questions.length}</div><div className="stat-label">Preguntas</div></div>
        <div className="stat-card"><div className="stat-num">{survey.createdAt}</div><div className="stat-label">Creada</div></div>
      </div>

      {!responses.length && <div className="empty"><div className="empty-icon">○</div><div>Aún no hay respuestas registradas.</div></div>}

      {!!responses.length && <>

        {/* HEALTH INDEX */}
        {healthScore !== null && (
          <div className="health-card">
            <div>
              <div style={{ fontSize:"0.72rem", opacity:0.6, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4 }}>Índice de salud</div>
              <div className="health-score">{healthScore}<span style={{ fontSize:"1.8rem", opacity:0.5 }}>/100</span></div>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"0.72rem", opacity:0.6, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>Estado general</div>
              <div className="health-status">{healthInfo?.label}</div>
              <div style={{ fontSize:"0.82rem", opacity:0.6, marginBottom:10 }}>Basado en {responses.length} respuesta{responses.length!==1?"s":""}</div>
              <div className="health-bar-wrap"><div className="health-bar-fill" style={{ width:`${healthScore}%` }} /></div>
            </div>
          </div>
        )}

        {/* RADAR */}
        {survey.questions.filter(q=>q.type==="scale"||q.type==="yesno").length >= 3 && (
          <div className="card" style={{ marginBottom:16 }}>
            <div className="card-title">Gráfico radar — visión general</div>
            <RadarChart survey={survey} />
          </div>
        )}

        {/* FORTALEZAS / CRÍTICAS */}
        {strengths.length > 0 && (
          <div className="insight-grid">
            <div className="insight-card pos">
              <div className="insight-card-title">▲ Top fortalezas</div>
              {strengths.map((x,i) => <div className="insight-item" key={i}>{x.q.text.slice(0,60)}{x.q.text.length>60?"…":""}<span className="insight-score">{Math.round(x.score)}%</span></div>)}
            </div>
            <div className="insight-card neg">
              <div className="insight-card-title">▼ Áreas críticas</div>
              {criticals.map((x,i) => <div className="insight-item" key={i}>{x.q.text.slice(0,60)}{x.q.text.length>60?"…":""}<span className="insight-score">{Math.round(x.score)}%</span></div>)}
            </div>
          </div>
        )}

        {/* AI ANALYSIS */}
        <div className="ai-section">
          <div className="ai-label"><span className="ai-dot"></span>Diagnóstico con IA</div>
          {aiLoading
            ? <div className="ai-loading"><div className="spinner-sm"></div>Analizando respuestas…</div>
            : <div className="ai-text">{aiAnalysis}</div>}
        </div>

        {/* QUESTIONS */}
        <div style={{ marginBottom:8, marginTop:24 }}>
          <div style={{ fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted)", marginBottom:14 }}>Resultados por pregunta</div>
          {survey.questions.map((q,i) => {
            const answers = responses.map(r=>r.answers[q.id]).filter(a=>a!==undefined);
            const score = getQuestionScore(q, responses);
            return (
              <div className="chart-section" key={q.id}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div style={{ flex:1 }}><div className="chart-q-meta">Pregunta {i+1}</div><div className="chart-q">{q.text}</div></div>
                  {getTag(score) && <div style={{ marginLeft:16, flexShrink:0 }}>{getTag(score)}</div>}
                </div>
                {q.type==="scale"&&answers.length>0 && <ScaleChart answers={answers} />}
                {q.type==="yesno"&&answers.length>0 && <BarChart data={[{label:"Sí",count:answers.filter(a=>a==="Sí").length},{label:"No",count:answers.filter(a=>a==="No").length}]} />}
                {q.type==="multiple"&&q.options&&answers.length>0 && <BarChart data={q.options.map(opt=>({label:opt,count:answers.filter(a=>a===opt).length}))} />}
                {q.type==="text"&&answers.length>0 && <div className="responses-list">{answers.map((a,j)=><div className="response-text" key={j}>{a}</div>)}</div>}
                <div style={{ marginTop:12, fontSize:"0.72rem", color:"var(--muted)", borderTop:"1px solid var(--border)", paddingTop:10 }}>{answers.length} respuesta{answers.length!==1?"s":""}</div>
              </div>
            );
          })}
        </div>

        {/* ACTION PLAN */}
        <div style={{ marginTop:24 }}>
          <div style={{ fontSize:"0.72rem", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--muted)", marginBottom:14 }}>Plan de acción</div>
          {planLoading
            ? <div className="ai-section"><div className="ai-loading"><div className="spinner-sm"></div>Generando plan de acción…</div></div>
            : actionPlan?.areas?.map((a,i) => (
              <div className="plan-item" key={i}>
                <div className="plan-item-header">
                  <div className="plan-area">{a.area}</div>
                  <span className={`priority-badge priority-${a.prioridad.toLowerCase()}`}>Prioridad {a.prioridad}</span>
                </div>
                <div className="plan-actions">
                  {a.acciones.map((ac,j) => <div className="plan-action" key={j}><span className="plan-action-num">{j+1}.</span><span>{ac}</span></div>)}
                </div>
                <div className="plan-meta">
                  <div className="plan-meta-item">⏱ {a.plazo}</div>
                  <div className="plan-meta-item">👤 {a.responsable}</div>
                </div>
              </div>
            ))}
        </div>

      </>}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("respond");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db,"surveys"), snap => {
      setSurveys(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleTab = t => {
    if ((t==="admin"||t==="results") && !isAdmin) { setPendingTab(t); setShowLogin(true); }
    else setTab(t);
  };

  return (
    <>
      <style>{FONTS}{STYLES}</style>
      {showLogin && <LoginModal onSuccess={() => { setIsAdmin(true); setShowLogin(false); if (pendingTab) { setTab(pendingTab); setPendingTab(null); } }} onCancel={() => { setShowLogin(false); setPendingTab(null); }} />}
      <div className="app">
        <nav className="nav">
          <div className="nav-logo">Diagnóstico <span>/ Encuestas</span></div>
          <div className="nav-tabs">
            <button className={`nav-tab${tab==="respond"?" active":""}`} onClick={()=>handleTab("respond")}>Responder</button>
            <button className={`nav-tab${tab==="admin"?" active":""}`} onClick={()=>handleTab("admin")}>{!isAdmin?"🔒 ":""}Administrar</button>
            <button className={`nav-tab${tab==="results"?" active":""}`} onClick={()=>handleTab("results")}>{!isAdmin?"🔒 ":""}Resultados</button>
          </div>
          <div className="nav-right">
            {isAdmin
              ? <><span className="admin-badge">● Admin</span><button className="logout-btn" onClick={()=>{ setIsAdmin(false); setTab("respond"); }}>Cerrar sesión</button></>
              : <div className="nav-badge">{loading?"…":`${surveys.length} encuesta${surveys.length!==1?"s":""}`}</div>}
          </div>
        </nav>
        <main className="main">
          {tab==="respond" && <RespondSurvey surveys={surveys} loading={loading} />}
          {tab==="admin" && isAdmin && <AdminPanel surveys={surveys} loading={loading} />}
          {tab==="results" && isAdmin && <ResultsPanel surveys={surveys} loading={loading} />}
        </main>
      </div>
    </>
  );
}
