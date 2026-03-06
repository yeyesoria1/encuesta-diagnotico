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

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');`;

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #f7f7f5; color: #1a1a1a; -webkit-font-smoothing: antialiased; }
  :root {
    --bg: #f7f7f5;
    --white: #ffffff;
    --border: #e4e4e0;
    --border-dark: #c8c8c2;
    --accent: #1a1a1a;
    --accent-light: #f0f0ee;
    --positive: #2d6a4f;
    --positive-bg: #f0f7f4;
    --negative: #c0392b;
    --negative-bg: #fdf2f2;
    --neutral: #6b6b65;
    --neutral-bg: #f5f5f3;
    --muted: #8a8a84;
    --text: #1a1a1a;
    --serif: 'Playfair Display', Georgia, serif;
    --sans: 'Inter', sans-serif;
  }

  .app { min-height: 100vh; background: var(--bg); }

  /* NAV */
  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 64px;
    background: var(--white); border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 100;
  }
  .nav-logo {
    font-family: var(--serif); font-weight: 600; font-size: 1.15rem;
    color: var(--text); letter-spacing: 0.01em;
  }
  .nav-logo span { color: var(--muted); font-weight: 400; }
  .nav-tabs { display: flex; gap: 2px; }
  .nav-tab {
    padding: 7px 18px; border-radius: 6px; border: none; cursor: pointer;
    font-family: var(--sans); font-size: 0.82rem; font-weight: 500;
    letter-spacing: 0.02em; transition: all 0.15s;
    background: transparent; color: var(--muted);
  }
  .nav-tab:hover { background: var(--accent-light); color: var(--text); }
  .nav-tab.active { background: var(--accent); color: #fff; }
  .nav-badge {
    font-size: 0.75rem; color: var(--muted); font-weight: 400;
    border: 1px solid var(--border); padding: 4px 14px; border-radius: 20px;
    background: var(--white); letter-spacing: 0.02em;
  }

  /* MAIN */
  .main { max-width: 820px; margin: 0 auto; padding: 48px 24px; }

  /* SECTION HEADER */
  .section-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
  .section-title { font-family: var(--serif); font-weight: 600; font-size: 1.6rem; color: var(--text); letter-spacing: -0.01em; }
  .section-sub { color: var(--muted); font-size: 0.82rem; margin-top: 6px; font-weight: 400; letter-spacing: 0.01em; }

  /* CARDS */
  .card { background: var(--white); border: 1px solid var(--border); border-radius: 10px; padding: 28px 32px; margin-bottom: 16px; }
  .card-title { font-family: var(--serif); font-size: 0.95rem; font-weight: 600; color: var(--text); margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }

  /* FORMS */
  .field { margin-bottom: 18px; }
  .label { font-size: 0.72rem; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; display: block; }
  .input, .select, .textarea {
    width: 100%; background: var(--white); border: 1px solid var(--border);
    border-radius: 6px; padding: 10px 14px; color: var(--text);
    font-family: var(--sans); font-size: 0.88rem; font-weight: 400;
    outline: none; transition: border-color 0.15s;
  }
  .input:focus, .select:focus, .textarea:focus { border-color: var(--accent); }
  .input::placeholder { color: var(--muted); }
  .textarea { min-height: 80px; resize: vertical; line-height: 1.6; }
  .select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238a8a84' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 14px center; padding-right: 36px; }

  /* BUTTONS */
  .btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 6px; border: 1px solid transparent; cursor: pointer; font-family: var(--sans); font-size: 0.82rem; font-weight: 500; letter-spacing: 0.02em; transition: all 0.15s; }
  .btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
  .btn-primary:hover { background: #333; border-color: #333; }
  .btn-primary:disabled { background: var(--muted); border-color: var(--muted); cursor: not-allowed; }
  .btn-secondary { background: var(--white); color: var(--text); border-color: var(--border); }
  .btn-secondary:hover { border-color: var(--accent); }
  .btn-danger { background: transparent; color: var(--negative); border-color: #e8c5c2; }
  .btn-danger:hover { background: var(--negative-bg); }
  .btn-outline { background: transparent; color: var(--text); border-color: var(--border); }
  .btn-outline:hover { background: var(--accent-light); }
  .btn-sm { padding: 6px 14px; font-size: 0.78rem; }

  /* SURVEY LIST */
  .survey-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 18px 24px; background: var(--white); border: 1px solid var(--border);
    border-radius: 8px; margin-bottom: 10px; transition: border-color 0.15s;
  }
  .survey-item:hover { border-color: var(--border-dark); }
  .survey-name { font-weight: 500; font-size: 0.92rem; }
  .survey-meta { font-size: 0.78rem; color: var(--muted); margin-top: 4px; }

  /* QUESTION BUILDER */
  .q-item { background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 16px 20px; margin-bottom: 10px; }
  .q-item-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
  .q-type-badge { font-size: 0.7rem; padding: 3px 10px; border-radius: 20px; background: var(--white); border: 1px solid var(--border); color: var(--muted); white-space: nowrap; font-weight: 500; letter-spacing: 0.03em; }
  .q-options { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
  .q-opt-row { display: flex; gap: 8px; align-items: center; }

  /* SURVEY RESPONSE */
  .q-response { margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid var(--border); }
  .q-response:last-child { border-bottom: none; }
  .q-text { font-size: 1rem; font-weight: 500; margin-bottom: 16px; line-height: 1.6; color: var(--text); }
  .q-num { font-family: var(--serif); font-weight: 600; color: var(--muted); margin-right: 10px; font-size: 1rem; }

  .scale-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .scale-btn {
    width: 52px; height: 52px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--white);
    color: var(--text); font-size: 1rem; font-weight: 500;
    cursor: pointer; transition: all 0.15s; font-family: var(--sans);
  }
  .scale-btn:hover { border-color: var(--accent); background: var(--accent-light); }
  .scale-btn.selected { background: var(--accent); border-color: var(--accent); color: #fff; }

  .yn-row { display: flex; gap: 12px; }
  .yn-btn {
    flex: 1; padding: 14px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--white);
    color: var(--text); font-size: 0.9rem; font-weight: 500;
    cursor: pointer; transition: all 0.15s;
  }
  .yn-btn:hover { border-color: var(--accent); background: var(--accent-light); }
  .yn-btn.selected { background: var(--accent); border-color: var(--accent); color: #fff; }

  .mc-row { display: flex; flex-direction: column; gap: 8px; }
  .mc-btn {
    padding: 12px 16px; border-radius: 8px;
    border: 1px solid var(--border); background: var(--white);
    color: var(--text); font-size: 0.88rem; cursor: pointer;
    transition: all 0.15s; text-align: left; font-family: var(--sans);
  }
  .mc-btn:hover { border-color: var(--accent); background: var(--accent-light); }
  .mc-btn.selected { border-color: var(--accent); background: var(--accent); color: #fff; }

  .progress-bar { height: 2px; background: var(--border); border-radius: 1px; margin-bottom: 40px; }
  .progress-fill { height: 100%; background: var(--accent); border-radius: 1px; transition: width 0.4s; }

  /* RESULTS */
  .stat-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin-bottom: 28px; }
  .stat-card { background: var(--white); border: 1px solid var(--border); border-radius: 8px; padding: 20px 24px; }
  .stat-num { font-family: var(--serif); font-weight: 600; font-size: 1.8rem; color: var(--text); }
  .stat-label { font-size: 0.75rem; color: var(--muted); margin-top: 4px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.07em; }

  .chart-section { background: var(--white); border: 1px solid var(--border); border-radius: 10px; padding: 24px 28px; margin-bottom: 14px; }
  .chart-q { font-size: 0.92rem; font-weight: 500; color: var(--text); margin-bottom: 4px; line-height: 1.5; }
  .chart-q-num { font-family: var(--serif); color: var(--muted); margin-right: 8px; }
  .chart-insight { font-size: 0.78rem; color: var(--muted); margin-bottom: 16px; }

  .bar-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
  .bar-label { min-width: 110px; color: var(--muted); text-align: right; font-size: 0.78rem; font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar-track { flex: 1; height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden; border: 1px solid var(--border); }
  .bar-fill { height: 100%; border-radius: 4px; background: var(--accent); transition: width 0.6s; }
  .bar-pct { min-width: 36px; font-size: 0.75rem; color: var(--muted); font-weight: 500; }

  .responses-list { display: flex; flex-direction: column; gap: 8px; }
  .response-text { background: var(--bg); border: 1px solid var(--border); border-left: 3px solid var(--border-dark); padding: 10px 14px; border-radius: 0 6px 6px 0; font-size: 0.85rem; line-height: 1.6; color: var(--text); }

  .tag { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 20px; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
  .tag-pos { background: var(--positive-bg); color: var(--positive); }
  .tag-neg { background: var(--negative-bg); color: var(--negative); }
  .tag-neu { background: var(--neutral-bg); color: var(--neutral); }

  /* SUCCESS */
  .success-screen { text-align: center; padding: 80px 20px; }
  .success-icon { font-size: 2.5rem; margin-bottom: 20px; }
  .success-title { font-family: var(--serif); font-weight: 600; font-size: 1.8rem; margin-bottom: 12px; }
  .success-sub { color: var(--muted); max-width: 380px; margin: 0 auto; line-height: 1.7; font-size: 0.9rem; }

  /* EMPTY / LOADING */
  .empty { text-align: center; padding: 60px 20px; color: var(--muted); font-size: 0.88rem; }
  .empty-icon { font-size: 2rem; margin-bottom: 12px; opacity: 0.4; }
  .loading { text-align: center; padding: 80px 20px; color: var(--muted); font-size: 0.85rem; }
  .spinner { width: 28px; height: 28px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* DIVIDER */
  hr { border: none; border-top: 1px solid var(--border); margin: 24px 0; }

  /* AVG DISPLAY */
  .avg-display { display: flex; align-items: baseline; gap: 8px; margin-bottom: 16px; }
  .avg-num { font-family: var(--serif); font-weight: 600; font-size: 2.4rem; color: var(--text); }
  .avg-denom { font-size: 1rem; color: var(--muted); }
  .avg-label { font-size: 0.78rem; color: var(--muted); margin-left: 4px; }

  @media(max-width:600px) {
    .stat-grid { grid-template-columns: 1fr 1fr; }
    .nav { padding: 0 16px; }
    .main { padding: 32px 16px; }
    .card { padding: 20px; }
  }
`;

const QUESTION_TYPES = [
  { value: "scale", label: "Escala 1–5" },
  { value: "yesno", label: "Sí / No" },
  { value: "multiple", label: "Opción múltiple" },
  { value: "text", label: "Texto libre" },
];

const SURVEY_CATEGORIES = ["Comunicación Interna", "Satisfacción", "Evaluación de Proceso", "Otro"];

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = Math.max(data.reduce((a, b) => a + b.count, 0), 1);
  return (
    <div>
      {data.map((d, i) => (
        <div className="bar-row" key={i}>
          <div className="bar-label" title={d.label}>{d.label}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <div className="bar-pct">{Math.round((d.count / total) * 100)}%</div>
        </div>
      ))}
    </div>
  );
}

function ScaleChart({ answers }) {
  const counts = [1,2,3,4,5].map((v) => ({ label: `${v}`, count: answers.filter((a) => a === v).length }));
  const avg = answers.length ? (answers.reduce((a, b) => a + b, 0) / answers.length).toFixed(1) : "—";
  return (
    <div>
      <div className="avg-display">
        <span className="avg-num">{avg}</span>
        <span className="avg-denom">/ 5</span>
        <span className="avg-label">· {answers.length} respuesta{answers.length !== 1 ? "s" : ""}</span>
      </div>
      <BarChart data={counts} />
    </div>
  );
}

function AdminPanel({ surveys, loading }) {
  const [mode, setMode] = useState("list");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(SURVEY_CATEGORIES[0]);
  const [questions, setQuestions] = useState([]);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("scale");
  const [qOptions, setQOptions] = useState(["", ""]);
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    if (!qText.trim()) return;
    const q = { id: Date.now(), text: qText, type: qType };
    if (qType === "multiple") q.options = qOptions.filter((o) => o.trim());
    setQuestions([...questions, q]);
    setQText(""); setQOptions(["", ""]);
  };

  const saveSurvey = async () => {
    if (!title.trim() || questions.length === 0) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "surveys"), {
        title, category, questions,
        createdAt: new Date().toLocaleDateString("es-AR"),
        responses: []
      });
      setTitle(""); setCategory(SURVEY_CATEGORIES[0]); setQuestions([]); setMode("list");
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const deleteSurvey = async (id) => {
    if (!confirm("¿Eliminar esta encuesta y todas sus respuestas?")) return;
    await deleteDoc(doc(db, "surveys", id));
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando encuestas…</div>;

  if (mode === "list") return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Encuestas</div>
          <div className="section-sub">{surveys.length} encuesta{surveys.length !== 1 ? "s" : ""} registrada{surveys.length !== 1 ? "s" : ""}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setMode("create")}>+ Nueva encuesta</button>
      </div>
      {surveys.length === 0 && <div className="empty"><div className="empty-icon">○</div><div>No hay encuestas aún. Creá la primera.</div></div>}
      {surveys.map((s) => (
        <div className="survey-item" key={s.id}>
          <div>
            <div className="survey-name">{s.title}</div>
            <div className="survey-meta">{s.category} · {s.questions.length} preguntas · {(s.responses || []).length} respuestas · {s.createdAt}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-danger btn-sm" onClick={() => deleteSurvey(s.id)}>Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Nueva encuesta</div>
          <div className="section-sub">Completá los datos y agregá las preguntas</div>
        </div>
        <button className="btn btn-secondary" onClick={() => setMode("list")}>← Volver</button>
      </div>

      <div className="card">
        <div className="card-title">Datos generales</div>
        <div className="field">
          <label className="label">Título</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Diagnóstico de Comunicación Interna Q1 2025" />
        </div>
        <div className="field">
          <label className="label">Categoría</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {SURVEY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Agregar pregunta</div>
        <div className="field">
          <label className="label">Pregunta</label>
          <input className="input" value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Ej: ¿Cómo calificás la comunicación entre áreas?" />
        </div>
        <div className="field">
          <label className="label">Tipo de respuesta</label>
          <select className="select" value={qType} onChange={(e) => { setQType(e.target.value); setQOptions(["", ""]); }}>
            {QUESTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {qType === "multiple" && (
          <div className="field">
            <label className="label">Opciones</label>
            <div className="q-options">
              {qOptions.map((opt, i) => (
                <div className="q-opt-row" key={i}>
                  <input className="input" value={opt} placeholder={`Opción ${i + 1}`} onChange={(e) => { const o = [...qOptions]; o[i] = e.target.value; setQOptions(o); }} />
                  {qOptions.length > 2 && <button className="btn btn-danger btn-sm" onClick={() => setQOptions(qOptions.filter((_, j) => j !== i))}>✕</button>}
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" style={{ alignSelf: "flex-start" }} onClick={() => setQOptions([...qOptions, ""])}>+ Agregar opción</button>
            </div>
          </div>
        )}
        <button className="btn btn-outline" onClick={addQuestion}>Agregar pregunta →</button>
      </div>

      {questions.length > 0 && (
        <div className="card">
          <div className="card-title">Preguntas agregadas ({questions.length})</div>
          {questions.map((q, i) => (
            <div className="q-item" key={q.id}>
              <div className="q-item-header">
                <div style={{ flex: 1, fontSize: "0.88rem", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--muted)", fontFamily: "var(--serif)", marginRight: 8 }}>{i + 1}.</span>
                  {q.text}
                  {q.type === "multiple" && q.options && (
                    <div style={{ marginTop: 6, color: "var(--muted)", fontSize: "0.78rem" }}>{q.options.join(" · ")}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <span className="q-type-badge">{QUESTION_TYPES.find((t) => t.value === q.type)?.label}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => setQuestions(questions.filter((x) => x.id !== q.id))}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {questions.length > 0 && title.trim() && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-primary" onClick={saveSurvey} disabled={saving}>
            {saving ? "Guardando…" : "Guardar encuesta"}
          </button>
        </div>
      )}
    </div>
  );
}

function RespondSurvey({ surveys, loading }) {
  const [selectedId, setSelectedId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [respondent, setRespondent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const survey = surveys.find((s) => s.id === selectedId);
  const answered = survey ? survey.questions.filter((q) => answers[q.id] !== undefined).length : 0;
  const total = survey ? survey.questions.length : 0;

  const submit = async () => {
    if (!survey) return;
    setSubmitting(true);
    try {
      const response = { id: Date.now(), respondent, answers, date: new Date().toLocaleDateString("es-AR") };
      await updateDoc(doc(db, "surveys", selectedId), { responses: arrayUnion(response) });
      setStep(2);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando…</div>;

  if (step === 2) return (
    <div className="success-screen">
      <div className="success-icon">✓</div>
      <div className="success-title">Respuestas registradas</div>
      <div className="success-sub">Gracias por completar la encuesta. Tus respuestas fueron guardadas correctamente.</div>
      <div style={{ marginTop: 32 }}>
        <button className="btn btn-secondary" onClick={() => { setStep(0); setSelectedId(null); setRespondent(""); setAnswers({}); }}>
          Responder otra encuesta
        </button>
      </div>
    </div>
  );

  if (step === 1 && survey) return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">{survey.title}</div>
          <div className="section-sub">{survey.category} · {answered} de {total} preguntas respondidas</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setStep(0)}>← Salir</button>
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${(answered / total) * 100}%` }} /></div>

      <div className="card">
        {survey.questions.map((q, i) => (
          <div className="q-response" key={q.id}>
            <div className="q-text"><span className="q-num">{i + 1}.</span>{q.text}</div>
            {q.type === "scale" && (
              <div>
                <div className="scale-row">
                  {[1,2,3,4,5].map((v) => (
                    <button key={v} className={`scale-btn${answers[q.id] === v ? " selected" : ""}`} onClick={() => setAnswers({ ...answers, [q.id]: v })}>{v}</button>
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--muted)", marginTop: 6, paddingLeft: 2 }}>
                  <span>Muy bajo</span><span>Muy alto</span>
                </div>
              </div>
            )}
            {q.type === "yesno" && (
              <div className="yn-row">
                {["Sí","No"].map((v) => (
                  <button key={v} className={`yn-btn${answers[q.id] === v ? " selected" : ""}`} onClick={() => setAnswers({ ...answers, [q.id]: v })}>{v}</button>
                ))}
              </div>
            )}
            {q.type === "multiple" && q.options && (
              <div className="mc-row">
                {q.options.map((opt) => (
                  <button key={opt} className={`mc-btn${answers[q.id] === opt ? " selected" : ""}`} onClick={() => setAnswers({ ...answers, [q.id]: opt })}>{opt}</button>
                ))}
              </div>
            )}
            {q.type === "text" && (
              <textarea className="textarea" placeholder="Escribí tu respuesta aquí…" value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
            )}
          </div>
        ))}
        <div style={{ textAlign: "center", paddingTop: 8 }}>
          <button className="btn btn-primary" style={{ padding: "12px 40px" }} onClick={submit} disabled={answered < total || submitting}>
            {submitting ? "Enviando…" : answered < total ? `Faltan ${total - answered} pregunta${total - answered !== 1 ? "s" : ""}` : "Enviar respuestas"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Completar encuesta</div>
          <div className="section-sub">Seleccioná la encuesta e ingresá tus datos</div>
        </div>
      </div>
      {surveys.length === 0
        ? <div className="empty"><div className="empty-icon">○</div><div>No hay encuestas disponibles aún.</div></div>
        : (
          <div className="card">
            <div className="field">
              <label className="label">Nombre o identificador</label>
              <input className="input" value={respondent} onChange={(e) => setRespondent(e.target.value)} placeholder="Ej: María García / Área Comercial / Anónimo" />
            </div>
            <div className="field">
              <label className="label">Encuesta</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {surveys.map((s) => (
                  <div key={s.id} onClick={() => setSelectedId(s.id)}
                    style={{ padding: "14px 18px", border: `1px solid ${selectedId === s.id ? "var(--accent)" : "var(--border)"}`, borderRadius: 8, cursor: "pointer", background: selectedId === s.id ? "var(--accent-light)" : "var(--bg)", transition: "all 0.15s" }}>
                    <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{s.title}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 4 }}>{s.category} · {s.questions.length} preguntas</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" disabled={!selectedId || !respondent.trim()} onClick={() => setStep(1)}>
              Comenzar →
            </button>
          </div>
        )}
    </div>
  );
}

function ResultsPanel({ surveys, loading }) {
  const [selectedId, setSelectedId] = useState(null);
  const survey = surveys.find((s) => s.id === selectedId);

  const getAnalysis = (q, responses) => {
    const answers = responses.map((r) => r.answers[q.id]).filter((a) => a !== undefined);
    if (q.type === "scale") {
      const avg = answers.length ? answers.reduce((a, b) => a + b, 0) / answers.length : 0;
      if (avg >= 4) return { tag: "Positivo", cls: "tag-pos", insight: "Nivel de satisfacción alto en este ítem." };
      if (avg >= 3) return { tag: "Neutro", cls: "tag-neu", insight: "Resultado promedio. Hay margen de mejora." };
      return { tag: "Crítico", cls: "tag-neg", insight: "Puntaje bajo. Se recomienda intervención." };
    }
    if (q.type === "yesno") {
      const yes = answers.filter((a) => a === "Sí").length;
      const pct = answers.length ? Math.round((yes / answers.length) * 100) : 0;
      if (pct >= 70) return { tag: "Positivo", cls: "tag-pos", insight: `${pct}% respondió afirmativamente.` };
      if (pct >= 40) return { tag: "Neutro", cls: "tag-neu", insight: `${pct}% respondió Sí. Resultado dividido.` };
      return { tag: "Crítico", cls: "tag-neg", insight: `Solo ${pct}% respondió Sí. Revisar.` };
    }
    return null;
  };

  const exportPDF = () => {
    if (!survey) return;
    const s = survey;
    const win = window.open("", "_blank");
    let questionsHtml = "";
    s.questions.forEach((q, i) => {
      const answers = s.responses.map((r) => r.answers[q.id]).filter((a) => a !== undefined);
      const analysis = getAnalysis(q, s.responses);
      let vizHtml = "";
      if (q.type === "scale") {
        const avg = answers.length ? (answers.reduce((a,b)=>a+b,0)/answers.length).toFixed(1) : "—";
        const counts = [1,2,3,4,5].map(v=>answers.filter(a=>a===v).length);
        const maxC = Math.max(...counts,1);
        vizHtml = `<div style="margin:16px 0"><div style="font-size:2rem;font-weight:600;font-family:Georgia,serif;color:#1a1a1a">${avg}<span style="font-size:1rem;color:#888"> / 5</span></div><div style="margin-top:12px">${[1,2,3,4,5].map((v,i)=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:7px"><span style="min-width:20px;font-size:.85rem;color:#888;text-align:right">${v}</span><div style="flex:1;height:10px;background:#f0f0ee;border-radius:5px;overflow:hidden"><div style="width:${(counts[i]/maxC)*100}%;height:100%;background:#1a1a1a;border-radius:5px"></div></div><span style="font-size:.8rem;color:#888;min-width:20px">${counts[i]}</span></div>`).join("")}</div></div>`;
      } else if (q.type === "yesno") {
        const yes=answers.filter(a=>a==="Sí").length,no=answers.filter(a=>a==="No").length,tot=yes+no||1;
        vizHtml=`<div style="display:flex;gap:16px;margin:16px 0"><div style="flex:1;background:#f0f7f4;border:1px solid #d4e8df;border-radius:8px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:600;font-family:Georgia,serif;color:#2d6a4f">Sí</div><div style="font-size:0.9rem;color:#555">${yes} · ${Math.round(yes/tot*100)}%</div></div><div style="flex:1;background:#fdf2f2;border:1px solid #f0d4d0;border-radius:8px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:600;font-family:Georgia,serif;color:#c0392b">No</div><div style="font-size:0.9rem;color:#555">${no} · ${Math.round(no/tot*100)}%</div></div></div>`;
      } else if (q.type === "multiple" && q.options) {
        const counts2=q.options.map(opt=>({label:opt,count:answers.filter(a=>a===opt).length}));
        const max2=Math.max(...counts2.map(c=>c.count),1);
        const tot2=counts2.reduce((a,b)=>a+b.count,0)||1;
        vizHtml=`<div style="margin:16px 0">${counts2.map(c=>`<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px"><span style="min-width:120px;font-size:.8rem;color:#888;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.label}</span><div style="flex:1;height:10px;background:#f0f0ee;border-radius:5px;overflow:hidden"><div style="width:${(c.count/max2)*100}%;height:100%;background:#1a1a1a;border-radius:5px"></div></div><span style="font-size:.78rem;color:#888;min-width:32px">${Math.round(c.count/tot2*100)}%</span></div>`).join("")}</div>`;
      } else if (q.type === "text") {
        vizHtml=`<div style="margin:12px 0">${answers.map(a=>`<div style="background:#f7f7f5;border-left:3px solid #c8c8c2;padding:10px 14px;margin-bottom:8px;border-radius:0 6px 6px 0;font-size:.85rem;line-height:1.6;color:#1a1a1a">${a}</div>`).join("")}</div>`;
      }
      questionsHtml+=`<div style="background:white;border:1px solid #e4e4e0;border-radius:8px;padding:24px;margin-bottom:14px;page-break-inside:avoid"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px"><div style="flex:1"><p style="font-size:.7rem;color:#8a8a84;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px">Pregunta ${i+1}</p><h3 style="font-size:.95rem;font-weight:500;color:#1a1a1a;line-height:1.5;margin:0">${q.text}</h3></div>${analysis?`<span style="font-size:.65rem;padding:3px 10px;border-radius:20px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;background:${analysis.cls==='tag-pos'?'#f0f7f4':analysis.cls==='tag-neg'?'#fdf2f2':'#f5f5f3'};color:${analysis.cls==='tag-pos'?'#2d6a4f':analysis.cls==='tag-neg'?'#c0392b':'#6b6b65'}">${analysis.tag}</span>`:''}</div>${analysis?`<p style="font-size:.78rem;color:#8a8a84;margin:8px 0 0">${analysis.insight}</p>`:''} ${vizHtml}<p style="font-size:.72rem;color:#b0b0a8;margin-top:12px;border-top:1px solid #f0f0ee;padding-top:10px">${answers.length} respuesta${answers.length!==1?'s':''}</p></div>`;
    });
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${s.title}</title><style>@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');body{font-family:'Inter',sans-serif;background:#f7f7f5;color:#1a1a1a;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.cover{background:#1a1a1a;color:white;padding:56px 56px 48px}.eyebrow{font-size:.7rem;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.12em;margin-bottom:16px}.cover h1{font-family:'Playfair Display',Georgia,serif;font-size:2rem;font-weight:600;margin-bottom:8px;line-height:1.2}.cover .cat{color:#888;font-size:.88rem;margin-bottom:32px}.stats{display:flex;gap:16px}.stat{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:16px 24px}.stat-n{font-family:'Playfair Display',Georgia,serif;font-size:1.6rem;font-weight:600;color:white}.stat-l{font-size:.7rem;color:#888;margin-top:4px;text-transform:uppercase;letter-spacing:.06em}.body{padding:40px 56px}@media print{.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="cover"><div class="eyebrow">Informe de diagnóstico · ${new Date().toLocaleDateString("es-AR")}</div><h1>${s.title}</h1><div class="cat">${s.category}</div><div class="stats"><div class="stat"><div class="stat-n">${s.responses.length}</div><div class="stat-l">Respuestas</div></div><div class="stat"><div class="stat-n">${s.questions.length}</div><div class="stat-l">Preguntas</div></div><div class="stat"><div class="stat-n">${s.createdAt}</div><div class="stat-l">Fecha</div></div></div></div><div class="body"><p style="font-size:.7rem;color:#8a8a84;font-weight:600;text-transform:uppercase;letter-spacing:.1em;margin:0 0 20px">Resultados por pregunta</p>${questionsHtml}<p style="margin-top:48px;padding-top:20px;border-top:1px solid #e4e4e0;text-align:center;font-size:.75rem;color:#b0b0a8">Generado automáticamente · ${new Date().toLocaleString("es-AR")}</p></div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando resultados…</div>;

  if (!selectedId || !survey) return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Resultados</div>
          <div className="section-sub">Seleccioná una encuesta para ver el análisis</div>
        </div>
      </div>
      {surveys.length === 0
        ? <div className="empty"><div className="empty-icon">○</div><div>No hay encuestas creadas aún.</div></div>
        : surveys.map((s) => (
          <div key={s.id} className="survey-item" onClick={() => setSelectedId(s.id)} style={{ cursor: "pointer" }}>
            <div>
              <div className="survey-name">{s.title}</div>
              <div className="survey-meta">{s.category} · {s.questions.length} preguntas · {(s.responses||[]).length} respuestas</div>
            </div>
            <span style={{ color: "var(--muted)", fontSize: "1.2rem" }}>→</span>
          </div>
        ))}
    </div>
  );

  const responses = survey.responses || [];
  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">{survey.title}</div>
          <div className="section-sub">{survey.category}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedId(null)}>← Volver</button>
          <button className="btn btn-primary btn-sm" onClick={exportPDF} disabled={responses.length === 0}>Exportar PDF</button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-num">{responses.length}</div><div className="stat-label">Respuestas</div></div>
        <div className="stat-card"><div className="stat-num">{survey.questions.length}</div><div className="stat-label">Preguntas</div></div>
        <div className="stat-card"><div className="stat-num">{survey.createdAt}</div><div className="stat-label">Creada</div></div>
      </div>

      {responses.length === 0 && <div className="empty"><div className="empty-icon">○</div><div>Aún no hay respuestas registradas.</div></div>}

      {survey.questions.map((q, i) => {
        const answers = responses.map((r) => r.answers[q.id]).filter((a) => a !== undefined);
        const analysis = getAnalysis(q, responses);
        return (
          <div className="chart-section" key={q.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Pregunta {i + 1}</p>
                <div className="chart-q">{q.text}</div>
              </div>
              {analysis && <span className={`tag ${analysis.cls}`} style={{ marginLeft: 16, flexShrink: 0 }}>{analysis.tag}</span>}
            </div>
            {analysis && <div className="chart-insight">{analysis.insight}</div>}
            {!analysis && <div style={{ marginBottom: 16 }} />}

            {q.type === "scale" && answers.length > 0 && <ScaleChart answers={answers} />}
            {q.type === "yesno" && answers.length > 0 && <BarChart data={[{label:"Sí",count:answers.filter(a=>a==="Sí").length},{label:"No",count:answers.filter(a=>a==="No").length}]} />}
            {q.type === "multiple" && q.options && answers.length > 0 && <BarChart data={q.options.map(opt=>({label:opt,count:answers.filter(a=>a===opt).length}))} />}
            {q.type === "text" && answers.length > 0 && <div className="responses-list">{answers.map((a,j)=><div className="response-text" key={j}>{a}</div>)}</div>}
            <div style={{ marginTop: 14, fontSize: "0.72rem", color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>{answers.length} respuesta{answers.length !== 1 ? "s" : ""}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("admin");
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "surveys"), (snapshot) => {
      setSurveys(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <>
      <style>{FONTS}{STYLES}</style>
      <div className="app">
        <nav className="nav">
          <div className="nav-logo">Diagnóstico <span>/ Encuestas</span></div>
          <div className="nav-tabs">
            <button className={`nav-tab${tab === "admin" ? " active" : ""}`} onClick={() => setTab("admin")}>Administrar</button>
            <button className={`nav-tab${tab === "respond" ? " active" : ""}`} onClick={() => setTab("respond")}>Responder</button>
            <button className={`nav-tab${tab === "results" ? " active" : ""}`} onClick={() => setTab("results")}>Resultados</button>
          </div>
          <div className="nav-badge">{loading ? "…" : `${surveys.length} encuesta${surveys.length !== 1 ? "s" : ""}`}</div>
        </nav>
        <main className="main">
          {tab === "admin" && <AdminPanel surveys={surveys} loading={loading} />}
          {tab === "respond" && <RespondSurvey surveys={surveys} loading={loading} />}
          {tab === "results" && <ResultsPanel surveys={surveys} loading={loading} />}
        </main>
      </div>
    </>
  );
}
