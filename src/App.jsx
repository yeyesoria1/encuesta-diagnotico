import { useState, useEffect, useRef } from "react";
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

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');`;

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0d0d0d; color: #f0ede6; }
  :root {
    --bg: #0d0d0d; --surface: #161616; --surface2: #1e1e1e; --border: #2a2a2a;
    --accent: #c8f04d; --accent2: #4df0c8; --text: #f0ede6; --muted: #888; --danger: #f04d4d;
  }
  .app { min-height: 100vh; background: var(--bg); }
  .nav { display:flex; align-items:center; justify-content:space-between; padding:18px 32px; border-bottom:1px solid var(--border); background:var(--surface); position:sticky; top:0; z-index:100; }
  .nav-logo { font-family:'Syne',sans-serif; font-weight:800; font-size:1.2rem; letter-spacing:-0.02em; }
  .nav-logo span { color:var(--accent); }
  .nav-tabs { display:flex; gap:4px; }
  .nav-tab { padding:8px 18px; border-radius:6px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.85rem; font-weight:500; transition:all 0.2s; background:transparent; color:var(--muted); }
  .nav-tab:hover { background:var(--surface2); color:var(--text); }
  .nav-tab.active { background:var(--accent); color:#0d0d0d; }
  .nav-badge { font-size:0.7rem; background:var(--surface2); border:1px solid var(--border); color:var(--muted); padding:4px 12px; border-radius:20px; }
  .main { max-width:900px; margin:0 auto; padding:40px 24px; }
  .card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:28px; margin-bottom:20px; }
  .card-title { font-family:'Syne',sans-serif; font-weight:700; font-size:1.1rem; margin-bottom:20px; display:flex; align-items:center; gap:10px; }
  .dot { width:8px; height:8px; border-radius:50%; background:var(--accent); display:inline-block; }
  .field { margin-bottom:16px; }
  .label { font-size:0.8rem; color:var(--muted); font-weight:500; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; display:block; }
  .input, .select, .textarea { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:8px; padding:10px 14px; color:var(--text); font-family:'DM Sans',sans-serif; font-size:0.9rem; outline:none; transition:border-color 0.2s; }
  .input:focus, .select:focus, .textarea:focus { border-color:var(--accent); }
  .select option { background:var(--surface2); }
  .textarea { min-height:80px; resize:vertical; }
  .btn { display:inline-flex; align-items:center; gap:8px; padding:10px 20px; border-radius:8px; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; font-size:0.88rem; font-weight:500; transition:all 0.18s; }
  .btn-primary { background:var(--accent); color:#0d0d0d; }
  .btn-primary:hover { background:#d4f560; transform:translateY(-1px); }
  .btn-secondary { background:var(--surface2); color:var(--text); border:1px solid var(--border); }
  .btn-secondary:hover { border-color:var(--accent); color:var(--accent); }
  .btn-danger { background:transparent; color:var(--danger); border:1px solid var(--danger); }
  .btn-danger:hover { background:var(--danger); color:#fff; }
  .btn-accent2 { background:var(--accent2); color:#0d0d0d; }
  .btn-sm { padding:6px 14px; font-size:0.8rem; }
  .q-item { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:18px; margin-bottom:12px; }
  .q-item-header { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
  .q-type-badge { font-size:0.72rem; padding:3px 10px; border-radius:20px; background:var(--border); color:var(--muted); white-space:nowrap; }
  .q-options { margin-top:12px; display:flex; flex-direction:column; gap:8px; }
  .q-opt-row { display:flex; gap:8px; align-items:center; }
  .survey-item { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; background:var(--surface2); border:1px solid var(--border); border-radius:10px; margin-bottom:10px; }
  .survey-meta { font-size:0.8rem; color:var(--muted); margin-top:4px; }
  .survey-actions { display:flex; gap:8px; }
  .q-response { margin-bottom:28px; }
  .q-text { font-size:1rem; font-weight:500; margin-bottom:14px; line-height:1.5; }
  .q-num { color:var(--accent); font-family:'Syne',sans-serif; font-weight:700; margin-right:8px; }
  .scale-row { display:flex; gap:8px; flex-wrap:wrap; }
  .scale-btn { width:48px; height:48px; border-radius:8px; border:2px solid var(--border); background:var(--surface2); color:var(--text); font-size:1.1rem; font-weight:600; cursor:pointer; transition:all 0.15s; font-family:'Syne',sans-serif; }
  .scale-btn:hover { border-color:var(--accent); color:var(--accent); }
  .scale-btn.selected { background:var(--accent); border-color:var(--accent); color:#0d0d0d; }
  .yn-row { display:flex; gap:12px; }
  .yn-btn { flex:1; padding:14px; border-radius:8px; border:2px solid var(--border); background:var(--surface2); color:var(--text); font-size:0.95rem; font-weight:600; cursor:pointer; transition:all 0.15s; }
  .yn-btn:hover { border-color:var(--accent2); }
  .yn-btn.selected { background:var(--accent2); border-color:var(--accent2); color:#0d0d0d; }
  .mc-row { display:flex; flex-direction:column; gap:8px; }
  .mc-btn { padding:12px 16px; border-radius:8px; border:2px solid var(--border); background:var(--surface2); color:var(--text); font-size:0.9rem; cursor:pointer; transition:all 0.15s; text-align:left; }
  .mc-btn:hover { border-color:var(--accent); }
  .mc-btn.selected { border-color:var(--accent); background:rgba(200,240,77,0.08); color:var(--accent); }
  .progress-bar { height:4px; background:var(--border); border-radius:2px; margin-bottom:32px; }
  .progress-fill { height:100%; background:var(--accent); border-radius:2px; transition:width 0.3s; }
  .stat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-bottom:24px; }
  .stat-card { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:20px; text-align:center; }
  .stat-num { font-family:'Syne',sans-serif; font-weight:800; font-size:2rem; color:var(--accent); }
  .stat-label { font-size:0.8rem; color:var(--muted); margin-top:4px; }
  .chart-wrap { margin-bottom:24px; }
  .bar-row { display:flex; align-items:center; gap:12px; margin-bottom:8px; font-size:0.85rem; }
  .bar-label { min-width:120px; color:var(--muted); text-align:right; font-size:0.8rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .bar-track { flex:1; height:22px; background:var(--surface2); border-radius:4px; overflow:hidden; }
  .bar-fill { height:100%; border-radius:4px; background:var(--accent); transition:width 0.6s; display:flex; align-items:center; padding-left:8px; font-size:0.75rem; font-weight:600; color:#0d0d0d; }
  .responses-list { display:flex; flex-direction:column; gap:8px; }
  .response-text { background:var(--surface2); border-left:3px solid var(--accent2); padding:10px 14px; border-radius:0 8px 8px 0; font-size:0.88rem; line-height:1.5; color:var(--text); }
  .tag { display:inline-block; padding:2px 10px; border-radius:20px; font-size:0.75rem; font-weight:500; }
  .tag-pos { background:rgba(77,240,200,0.15); color:var(--accent2); }
  .tag-neg { background:rgba(240,77,77,0.15); color:var(--danger); }
  .tag-neu { background:rgba(255,255,255,0.08); color:var(--muted); }
  .success-screen { text-align:center; padding:60px 20px; }
  .success-icon { font-size:4rem; margin-bottom:20px; }
  .success-title { font-family:'Syne',sans-serif; font-weight:800; font-size:1.8rem; margin-bottom:12px; }
  .success-sub { color:var(--muted); max-width:400px; margin:0 auto; line-height:1.6; }
  .empty { text-align:center; padding:48px 20px; color:var(--muted); }
  .empty-icon { font-size:2.5rem; margin-bottom:12px; }
  .section-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
  .section-title { font-family:'Syne',sans-serif; font-weight:800; font-size:1.4rem; }
  .section-sub { color:var(--muted); font-size:0.88rem; margin-top:4px; }
  .loading { text-align:center; padding:60px 20px; color:var(--muted); font-size:0.9rem; }
  .spinner { width:32px; height:32px; border:3px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 16px; }
  @keyframes spin { to { transform:rotate(360deg); } }
  @media(max-width:600px) {
    .stat-grid { grid-template-columns:1fr 1fr; }
    .nav { padding:14px 16px; }
    .main { padding:24px 16px; }
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
  const total = data.reduce((a, b) => a + b.count, 0);
  return (
    <div>
      {data.map((d, i) => (
        <div className="bar-row" key={i}>
          <div className="bar-label" title={d.label}>{d.label}</div>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(d.count / max) * 100}%` }}>
              {d.count > 0 ? d.count : ""}
            </div>
          </div>
          <div style={{ minWidth: 32, textAlign: "right", fontSize: "0.8rem", color: "var(--muted)" }}>
            {Math.round((d.count / Math.max(total, 1)) * 100)}%
          </div>
        </div>
      ))}
    </div>
  );
}

function ScaleChart({ answers }) {
  const counts = [1,2,3,4,5].map((v) => ({ label: `⭐ ${v}`, count: answers.filter((a) => a === v).length }));
  const avg = answers.length ? (answers.reduce((a, b) => a + b, 0) / answers.length).toFixed(1) : "—";
  return (
    <div>
      <div style={{ marginBottom: 12, display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "2rem", color: "var(--accent)" }}>{avg}</div>
        <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>promedio<br />{answers.length} respuestas</div>
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

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando encuestas...</div>;

  if (mode === "list") return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">Mis Encuestas</div>
          <div className="section-sub">{surveys.length} encuesta{surveys.length !== 1 ? "s" : ""} creada{surveys.length !== 1 ? "s" : ""}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setMode("create")}>+ Nueva encuesta</button>
      </div>
      {surveys.length === 0 && <div className="empty"><div className="empty-icon">📋</div><div>No hay encuestas aún.<br />Creá la primera.</div></div>}
      {surveys.map((s) => (
        <div className="survey-item" key={s.id}>
          <div>
            <div style={{ fontWeight: 600 }}>{s.title}</div>
            <div className="survey-meta">{s.category} · {s.questions.length} preguntas · {(s.responses || []).length} respuestas · {s.createdAt}</div>
          </div>
          <div className="survey-actions">
            <button className="btn btn-danger btn-sm" onClick={() => deleteSurvey(s.id)}>Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Nueva Encuesta</div><div className="section-sub">Configurá título, categoría y preguntas</div></div>
        <button className="btn btn-secondary" onClick={() => setMode("list")}>← Volver</button>
      </div>
      <div className="card">
        <div className="card-title"><span className="dot"></span>Datos generales</div>
        <div className="field">
          <label className="label">Título</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Encuesta de Comunicación Interna Q1 2025" />
        </div>
        <div className="field">
          <label className="label">Categoría</label>
          <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {SURVEY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><span className="dot"></span>Agregar pregunta</div>
        <div className="field">
          <label className="label">Texto de la pregunta</label>
          <input className="input" value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Ej: ¿Cómo calificás la comunicación entre equipos?" />
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
              <button className="btn btn-secondary btn-sm" onClick={() => setQOptions([...qOptions, ""])}>+ Opción</button>
            </div>
          </div>
        )}
        <button className="btn btn-secondary" onClick={addQuestion}>Agregar pregunta →</button>
      </div>
      {questions.length > 0 && (
        <div className="card">
          <div className="card-title"><span className="dot"></span>Preguntas ({questions.length})</div>
          {questions.map((q, i) => (
            <div className="q-item" key={q.id}>
              <div className="q-item-header">
                <div style={{ flex: 1 }}>
                  <span style={{ color: "var(--accent)", fontWeight: 700, marginRight: 8 }}>{i + 1}.</span>{q.text}
                  {q.type === "multiple" && q.options && <div style={{ marginTop: 8, color: "var(--muted)", fontSize: "0.82rem" }}>Opciones: {q.options.join(" · ")}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="q-type-badge">{QUESTION_TYPES.find((t) => t.value === q.type)?.label}</span>
                  <button className="btn btn-danger btn-sm" onClick={() => setQuestions(questions.filter((x) => x.id !== q.id))}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {questions.length > 0 && title.trim() && (
        <div style={{ textAlign: "right" }}>
          <button className="btn btn-primary" onClick={saveSurvey} disabled={saving}>
            {saving ? "Guardando..." : "💾 Guardar encuesta"}
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

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando...</div>;

  if (step === 2) return (
    <div className="success-screen">
      <div className="success-icon">✅</div>
      <div className="success-title">¡Respuestas enviadas!</div>
      <div className="success-sub">Tus respuestas fueron guardadas correctamente en la base de datos.</div>
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
        <div><div className="section-title">{survey.title}</div><div className="section-sub">{survey.category} · {answered}/{total} respondidas</div></div>
        <button className="btn btn-secondary btn-sm" onClick={() => setStep(0)}>← Salir</button>
      </div>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${(answered / total) * 100}%` }}></div></div>
      {survey.questions.map((q, i) => (
        <div className="q-response" key={q.id}>
          <div className="q-text"><span className="q-num">{i + 1}.</span>{q.text}</div>
          {q.type === "scale" && (
            <div className="scale-row">
              {[1,2,3,4,5].map((v) => (
                <button key={v} className={`scale-btn${answers[q.id] === v ? " selected" : ""}`} onClick={() => setAnswers({ ...answers, [q.id]: v })}>{v}</button>
              ))}
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
            <textarea className="textarea" placeholder="Escribí tu respuesta aquí..." value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
          )}
        </div>
      ))}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <button className="btn btn-primary" style={{ padding: "14px 40px", fontSize: "1rem" }} onClick={submit} disabled={answered < total || submitting}>
          {submitting ? "Enviando..." : answered < total ? `Faltan ${total - answered} respuestas` : "Enviar respuestas ✓"}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Completar Encuesta</div><div className="section-sub">Seleccioná la encuesta y completá tus datos</div></div>
      </div>
      {surveys.length === 0
        ? <div className="empty"><div className="empty-icon">📭</div><div>No hay encuestas disponibles aún.</div></div>
        : (
          <div className="card">
            <div className="field">
              <label className="label">Tu nombre o identificador</label>
              <input className="input" value={respondent} onChange={(e) => setRespondent(e.target.value)} placeholder="Ej: Juan Pérez / Área Ventas / Anónimo" />
            </div>
            <div className="field">
              <label className="label">Seleccioná la encuesta</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {surveys.map((s) => (
                  <div key={s.id} onClick={() => setSelectedId(s.id)}
                    style={{ padding: "16px 20px", border: `2px solid ${selectedId === s.id ? "var(--accent)" : "var(--border)"}`, borderRadius: 10, cursor: "pointer", background: selectedId === s.id ? "rgba(200,240,77,0.06)" : "var(--surface2)", transition: "all 0.15s" }}>
                    <div style={{ fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 4 }}>{s.category} · {s.questions.length} preguntas</div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn btn-primary" disabled={!selectedId || !respondent.trim()} onClick={() => setStep(1)} style={{ marginTop: 8 }}>
              Comenzar encuesta →
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
      if (avg >= 4) return { tag: "Positivo", cls: "tag-pos", insight: "Alta satisfacción en este ítem." };
      if (avg >= 3) return { tag: "Neutro", cls: "tag-neu", insight: "Resultado promedio, hay margen de mejora." };
      return { tag: "Crítico", cls: "tag-neg", insight: "Puntaje bajo. Se recomienda acción inmediata." };
    }
    if (q.type === "yesno") {
      const yes = answers.filter((a) => a === "Sí").length;
      const pct = answers.length ? Math.round((yes / answers.length) * 100) : 0;
      if (pct >= 70) return { tag: "Positivo", cls: "tag-pos", insight: `${pct}% respondió Sí.` };
      if (pct >= 40) return { tag: "Neutro", cls: "tag-neu", insight: `${pct}% respondió Sí. Resultado mixto.` };
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
        vizHtml = `<div style="margin:12px 0"><div style="font-size:2rem;font-weight:800;color:#4a6e00">Promedio: ${avg}/5</div><div style="margin-top:10px">${[1,2,3,4,5].map((v,i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="min-width:30px;font-weight:600">${v}⭐</span><div style="flex:1;height:18px;background:#eee;border-radius:4px;overflow:hidden"><div style="width:${(counts[i]/maxC)*100}%;height:100%;background:#c8f04d"></div></div><span style="font-size:.85rem;color:#666">${counts[i]}</span></div>`).join("")}</div></div>`;
      } else if (q.type === "yesno") {
        const yes=answers.filter(a=>a==="Sí").length,no=answers.filter(a=>a==="No").length,tot=yes+no||1;
        vizHtml=`<div style="display:flex;gap:20px;margin:12px 0"><div style="flex:1;background:#e8f8e8;border-radius:8px;padding:16px;text-align:center"><div style="font-size:1.8rem;font-weight:800;color:#2a8a2a">Sí</div><div>${yes} (${Math.round(yes/tot*100)}%)</div></div><div style="flex:1;background:#fce8e8;border-radius:8px;padding:16px;text-align:center"><div style="font-size:1.8rem;font-weight:800;color:#8a2a2a">No</div><div>${no} (${Math.round(no/tot*100)}%)</div></div></div>`;
      } else if (q.type === "multiple" && q.options) {
        const counts2=q.options.map(opt=>({label:opt,count:answers.filter(a=>a===opt).length}));
        const max2=Math.max(...counts2.map(c=>c.count),1);
        vizHtml=`<div style="margin:12px 0">${counts2.map(c=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px"><span style="min-width:120px;font-size:.85rem;color:#555">${c.label}</span><div style="flex:1;height:18px;background:#eee;border-radius:4px;overflow:hidden"><div style="width:${(c.count/max2)*100}%;height:100%;background:#4df0c8"></div></div><span style="font-size:.85rem;color:#666">${c.count}</span></div>`).join("")}</div>`;
      } else if (q.type === "text") {
        vizHtml=`<div style="margin:12px 0">${answers.map(a=>`<div style="background:#f5f5f5;border-left:3px solid #4df0c8;padding:10px 14px;margin-bottom:8px;border-radius:0 6px 6px 0;font-size:.9rem">${a}</div>`).join("")}</div>`;
      }
      questionsHtml+=`<div style="background:white;border:1px solid #e0e0e0;border-radius:10px;padding:24px;margin-bottom:20px;page-break-inside:avoid"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px"><h3 style="font-size:1rem;font-weight:600;color:#1a1a1a;line-height:1.4;flex:1">${i+1}. ${q.text}</h3>${analysis?`<span style="font-size:.75rem;padding:3px 10px;border-radius:20px;background:${analysis.cls==='tag-pos'?'#e8f8e8':analysis.cls==='tag-neg'?'#fce8e8':'#f0f0f0'};color:${analysis.cls==='tag-pos'?'#2a7a2a':analysis.cls==='tag-neg'?'#8a2a2a':'#555'};margin-left:12px;white-space:nowrap">${analysis.tag}</span>`:''}</div>${analysis?`<p style="font-size:.85rem;color:#888;margin-bottom:8px">${analysis.insight}</p>`:''} ${vizHtml}<p style="font-size:.8rem;color:#aaa;margin-top:8px">${answers.length} respuesta${answers.length!==1?'s':''}</p></div>`;
    });
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Informe: ${s.title}</title><style>body{font-family:'Helvetica Neue',sans-serif;background:#f8f8f8;color:#1a1a1a;margin:0;padding:0}.cover{background:linear-gradient(135deg,#0d0d0d,#1a1a1a);color:white;padding:60px 48px}.cover h1{font-size:2.2rem;font-weight:800;margin-bottom:8px}.cover .sub{color:#aaa;margin-bottom:24px}.stats{display:flex;gap:24px}.stat{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:16px 24px;text-align:center}.stat-n{font-size:1.8rem;font-weight:800;color:#c8f04d}.stat-l{font-size:.8rem;color:#888;margin-top:4px}.body{padding:40px 48px}@media print{.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="cover"><div style="font-size:.8rem;color:#666;margin-bottom:16px">INFORME DE DIAGNÓSTICO · ${new Date().toLocaleDateString("es-AR")}</div><h1>${s.title}</h1><div class="sub">${s.category}</div><div class="stats"><div class="stat"><div class="stat-n">${s.responses.length}</div><div class="stat-l">Respuestas</div></div><div class="stat"><div class="stat-n">${s.questions.length}</div><div class="stat-l">Preguntas</div></div><div class="stat"><div class="stat-n">${s.createdAt}</div><div class="stat-l">Creada</div></div></div></div><div class="body"><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#aaa;margin:0 0 16px">Resultados por pregunta</div>${questionsHtml}<div style="margin-top:40px;padding-top:20px;border-top:1px solid #e0e0e0;text-align:center;font-size:.8rem;color:#aaa">Informe generado automáticamente · ${new Date().toLocaleString("es-AR")}</div></div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando resultados...</div>;

  if (!selectedId || !survey) return (
    <div>
      <div className="section-header">
        <div><div className="section-title">Resultados</div><div className="section-sub">Seleccioná una encuesta para ver el análisis</div></div>
      </div>
      {surveys.length === 0
        ? <div className="empty"><div className="empty-icon">📊</div><div>No hay encuestas creadas aún.</div></div>
        : surveys.map((s) => (
          <div key={s.id} onClick={() => setSelectedId(s.id)}
            style={{ padding: "20px 24px", border: "1px solid var(--border)", borderRadius: 10, cursor: "pointer", background: "var(--surface)", marginBottom: 12, transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            <div style={{ fontWeight: 600, fontFamily: "'Syne',sans-serif" }}>{s.title}</div>
            <div className="survey-meta">{s.category} · {s.questions.length} preguntas · {(s.responses||[]).length} respuestas</div>
          </div>
        ))}
    </div>
  );

  const responses = survey.responses || [];
  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">{survey.title}</div><div className="section-sub">{survey.category}</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedId(null)}>← Volver</button>
          <button className="btn btn-accent2" onClick={exportPDF} disabled={responses.length === 0}>📄 Exportar PDF</button>
        </div>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-num">{responses.length}</div><div className="stat-label">Respuestas</div></div>
        <div className="stat-card"><div className="stat-num">{survey.questions.length}</div><div className="stat-label">Preguntas</div></div>
        <div className="stat-card"><div className="stat-num">{survey.createdAt}</div><div className="stat-label">Creada</div></div>
      </div>
      {responses.length === 0 && <div className="empty"><div className="empty-icon">⏳</div><div>Aún no hay respuestas registradas.</div></div>}
      {survey.questions.map((q, i) => {
        const answers = responses.map((r) => r.answers[q.id]).filter((a) => a !== undefined);
        const analysis = getAnalysis(q, responses);
        return (
          <div className="card chart-wrap" key={q.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", flex: 1, lineHeight: 1.4 }}>
                <span style={{ color: "var(--accent)", fontFamily: "'Syne',sans-serif", marginRight: 8 }}>{i + 1}.</span>{q.text}
              </div>
              {analysis && <span className={`tag ${analysis.cls}`} style={{ marginLeft: 12 }}>{analysis.tag}</span>}
            </div>
            {analysis && <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: 14 }}>{analysis.insight}</div>}
            {q.type === "scale" && answers.length > 0 && <ScaleChart answers={answers} />}
            {q.type === "yesno" && answers.length > 0 && <BarChart data={[{label:"Sí",count:answers.filter(a=>a==="Sí").length},{label:"No",count:answers.filter(a=>a==="No").length}]} />}
            {q.type === "multiple" && q.options && answers.length > 0 && <BarChart data={q.options.map(opt=>({label:opt,count:answers.filter(a=>a===opt).length}))} />}
            {q.type === "text" && answers.length > 0 && <div className="responses-list">{answers.map((a,j)=><div className="response-text" key={j}>{a}</div>)}</div>}
            <div style={{ marginTop: 12, fontSize: "0.78rem", color: "var(--muted)" }}>{answers.length} respuesta{answers.length !== 1 ? "s" : ""}</div>
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
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setSurveys(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <>
      <style>{FONTS}{STYLES}</style>
      <div className="app">
        <nav className="nav">
          <div className="nav-logo">survey<span>.</span>diag</div>
          <div className="nav-tabs">
            <button className={`nav-tab${tab === "admin" ? " active" : ""}`} onClick={() => setTab("admin")}>Admin</button>
            <button className={`nav-tab${tab === "respond" ? " active" : ""}`} onClick={() => setTab("respond")}>Responder</button>
            <button className={`nav-tab${tab === "results" ? " active" : ""}`} onClick={() => setTab("results")}>Resultados</button>
          </div>
          <div className="nav-badge">{loading ? "..." : `${surveys.length} encuesta${surveys.length !== 1 ? "s" : ""}`}</div>
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
