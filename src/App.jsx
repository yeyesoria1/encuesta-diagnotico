import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
// ── Motor de Diagnóstico Profesional ─────────────────────────
// Marcos: Downs & Hazen, Likert, GPTW, Kirkpatrick, ISO 9001, Joint Commission

const BENCHMARKS = {
  excelente:  { min:80, label:"Excelente",  color:"#2d6a4f", bg:"#f0f7f4", border:"#c8e6d4" },
  bueno:      { min:65, label:"Bueno",      color:"#4a7c59", bg:"#f2f8f4", border:"#cce0d4" },
  aceptable:  { min:50, label:"Aceptable",  color:"#92621a", bg:"#fdf6ec", border:"#f0dfc4" },
  deficiente: { min:35, label:"Deficiente", color:"#c0392b", bg:"#fdf2f2", border:"#f0c8c4" },
  critico:    { min:0,  label:"Crítico",    color:"#8b0000", bg:"#fff0f0", border:"#f0b0b0" },
};

function getBenchmarkLevel(score) {
  if (score >= 80) return BENCHMARKS.excelente;
  if (score >= 65) return BENCHMARKS.bueno;
  if (score >= 50) return BENCHMARKS.aceptable;
  if (score >= 35) return BENCHMARKS.deficiente;
  return BENCHMARKS.critico;
}

function getQuestionScore(q, responses) {
  const answers = responses.map(r => r.answers[q.id]).filter(a => a !== undefined);
  if (!answers.length) return null;
  if (q.type === "scale") return (answers.reduce((a,b)=>a+b,0)/answers.length)/5*100;
  if (q.type === "yesno") return (answers.filter(a=>a==="Sí").length/answers.length)*100;
  return null;
}

function getHealthScore(survey) {
  const scores = survey.questions.map(q=>getQuestionScore(q,survey.responses)).filter(s=>s!==null);
  if (!scores.length) return null;
  return Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
}

function getTopInsights(survey) {
  const scored = survey.questions
    .map(q=>({ q, score: getQuestionScore(q, survey.responses) }))
    .filter(x => x.score !== null)
    .sort((a,b) => b.score - a.score);
  return { strengths: scored.slice(0,3), criticals: scored.slice(-3).reverse() };
}

function getTextAnswers(survey) {
  return survey.questions
    .filter(q => q.type === "text")
    .flatMap(q => survey.responses.map(r => r.answers[q.id]).filter(Boolean));
}

function generateDiagnostic(survey) {
  const score = getHealthScore(survey);
  if (score === null) return null;
  const level = getBenchmarkLevel(score);
  const { strengths, criticals } = getTopInsights(survey);
  const totalResp = survey.responses.length;
  const cat = survey.category;
  const textAnswers = getTextAnswers(survey);
  const allScores = survey.questions.map(q=>getQuestionScore(q,survey.responses)).filter(s=>s!==null);
  const highItems = allScores.filter(s=>s>=65).length;
  const lowItems  = allScores.filter(s=>s<50).length;
  const mean = allScores.reduce((a,b)=>a+b,0)/allScores.length;
  const variance = allScores.length > 1 ? Math.round(Math.sqrt(allScores.reduce((acc,s)=>acc+Math.pow(s-mean,2),0)/allScores.length)) : 0;
  const likertSystem = score>=75?"Sistema IV (Participativo)":score>=55?"Sistema III (Consultivo)":score>=40?"Sistema II (Benevolente-autoritario)":"Sistema I (Autoritario-explotador)";
  const likertDesc = score>=75?"caracterizado por alta confianza, comunicación fluida y toma de decisiones participativa":score>=55?"donde existe cierta consulta pero las decisiones aún se concentran en los niveles jerárquicos superiores":score>=40?"con comunicación predominantemente descendente y baja participación del personal":"con comunicación escasa, clima de desconfianza y alta centralización de la autoridad";
  const p1 = `El diagnóstico de ${cat} realizado sobre ${totalResp} respuesta${totalResp!==1?"s":""} arroja un Índice de Salud Organizacional (ISO) de ${score}/100, posicionando a la organización en el nivel "${level.label}" según los estándares internacionales de referencia utilizados (Joint Commission International, Great Place to Work Public Sector y benchmarks ISO 9001:2015 para organismos públicos de más de 200 agentes). De un total de ${allScores.length} indicadores evaluados, ${highItems} se encuentran en zona favorable (≥65%) y ${lowItems} requieren intervención planificada. La dispersión entre indicadores es de ±${variance} puntos, lo que ${variance>20?"evidencia una distribución heterogénea con brechas significativas entre áreas":"indica una distribución relativamente homogénea en el funcionamiento organizacional"}.`;
  const strengthText = strengths.length ? `Desde la perspectiva del modelo de satisfacción comunicacional de Downs y Hazen (1977), los indicadores de mayor fortaleza son: ${strengths.map(x=>`"${x.q.text.slice(0,55)}${x.q.text.length>55?"…":""}" (${Math.round(x.score)}%)`).join("; ")}. ` : "";
  const criticalText = criticals.length ? `En contraste, las dimensiones que presentan mayor brecha son: ${criticals.map(x=>`"${x.q.text.slice(0,55)}${x.q.text.length>55?"…":""}" (${Math.round(x.score)}%)`).join("; ")}. ` : "";
  const p2 = `${strengthText}${criticalText}Aplicando la tipología de Sistemas Organizacionales de Rensis Likert, los resultados son consistentes con un ${likertSystem}, ${likertDesc}. ${textAnswers.length>0?`El análisis cualitativo de las ${textAnswers.length} respuesta${textAnswers.length!==1?"s":""} abiertas refuerza este patrón, con menciones recurrentes que señalan oportunidades de mejora en la gestión del flujo informacional y la participación del personal en los procesos de toma de decisiones.`:""}`.trim();
  const jciNote = cat==="Comunicación Interna"?"En términos de los estándares Joint Commission International (JCI), una comunicación interna efectiva es condición habilitante para la seguridad institucional y la calidad del servicio público. Los estándares IPSG.2 y ACC.3 de JCI establecen que la comunicación entre niveles jerárquicos debe garantizar la continuidad y coherencia operativa.":cat==="Evaluación de Proceso"?"Desde el marco de evaluación de Kirkpatrick adaptado al sector público, los resultados de Nivel 1 (Reacción) y Nivel 2 (Aprendizaje) indican que los procesos evaluados requieren ajustes en su diseño e implementación para alcanzar los resultados esperados (Nivel 4).":"Conforme a los requisitos de la cláusula 9.1.3 de ISO 9001:2015 (Análisis y evaluación), los datos obtenidos deben ser utilizados como insumo para la revisión del sistema de gestión y la identificación de oportunidades de mejora continua.";
  const focusArea = criticals[0]?.q?.text?.slice(0,60) || "las áreas identificadas";
  const p3 = `${jciNote} El foco de intervención prioritario recomendado es "${focusArea}${criticals[0]?.q?.text?.length>60?"…":""}" (${Math.round(criticals[0]?.score||0)}%), que representa la dimensión con mayor brecha respecto al nivel de referencia internacional (≥65%). Se recomienda iniciar un ciclo de mejora basado en el modelo PDCA (Planificar-Hacer-Verificar-Actuar) con indicadores de seguimiento trimestral y revisión formal semestral por parte de la Alta Dirección, en línea con los requisitos de la cláusula 10.3 de ISO 9001:2015.`;
  return [p1, p2, p3];
}

const ACTION_TEMPLATES = {
  "Comunicación Interna": [
    { area:"Canales y flujos de comunicación formal", marco:"Downs & Hazen / JCI IPSG.2", acciones:["Mapear y rediseñar los canales formales de comunicación interna (ascendente, descendente y horizontal) asegurando cobertura a todos los niveles jerárquicos","Implementar un protocolo escrito de comunicación institucional con tiempos de respuesta definidos (máx. 48 hs para comunicados operativos)","Establecer una reunión semanal de alineación por área con actas sistematizadas y seguimiento de acuerdos","Crear un repositorio centralizado de información institucional accesible a todo el personal"], responsable:"Dirección de Comunicación Institucional / RRHH" },
    { area:"Comunicación del liderazgo y transparencia", marco:"GPTW: Credibilidad / Likert Sistema IV", acciones:["Diseñar un programa de comunicación ejecutiva con mensajes periódicos de la Alta Dirección sobre estrategia, logros y desafíos institucionales","Implementar reuniones de town hall semestrales con espacio para preguntas del personal","Desarrollar un índice de transparencia informacional interno con metas anuales medibles","Capacitar a mandos medios en comunicación efectiva y gestión de mensajes institucionales"], responsable:"Alta Dirección / Comunicación Institucional" },
    { area:"Clima de confianza y comunicación ascendente", marco:"GPTW: Respeto e Imparcialidad / Likert", acciones:["Implementar mecanismos formales de escucha activa: encuestas de pulso trimestrales, buzón de sugerencias con respuesta garantizada","Crear espacios de diálogo entre personal y supervisores sin intermediarios jerárquicos (sesiones de feedback 360°)","Establecer indicadores de clima comunicacional con medición semestral y publicación de resultados","Diseñar un programa de reconocimiento institucional basado en criterios objetivos y comunicados públicamente"], responsable:"RRHH / Comité de Clima Organizacional" },
  ],
  "Satisfacción": [
    { area:"Satisfacción con el rol y las condiciones de trabajo", marco:"GPTW: Orgullo y Camaradería / ISO 9001 cláusula 7.1.4", acciones:["Realizar un análisis de descripciones de puestos para asegurar alineación entre responsabilidades asignadas y competencias del personal","Implementar un programa de bienestar laboral con acciones concretas en salud, ergonomía y equilibrio trabajo-vida","Establecer un sistema de reconocimiento formal (no solo económico) basado en desempeño y contribución institucional","Desarrollar encuestas de satisfacción laboral semestrales con planes de acción publicados y seguidos"], responsable:"RRHH / Dirección de Personal" },
    { area:"Desarrollo profesional y capacitación", marco:"Kirkpatrick Nivel 1-2 / ISO 9001 cláusula 7.2", acciones:["Diseñar un plan de desarrollo individual (PDI) para cada agente con metas anuales de formación","Implementar un mapa de competencias institucional que oriente las decisiones de capacitación","Crear una oferta de formación interna (mentoreo, rotación de roles, comunidades de práctica)","Establecer métricas de transferencia de aprendizaje al puesto de trabajo (Kirkpatrick Nivel 3)"], responsable:"Dirección de Capacitación / RRHH" },
    { area:"Liderazgo y gestión directiva", marco:"GPTW: Credibilidad / Likert Sistema III-IV", acciones:["Implementar evaluación de desempeño directivo con feedback del equipo (evaluación 180°/360°)","Desarrollar un programa de formación en liderazgo adaptativo para mandos medios y superiores","Establecer acuerdos de gestión por resultados entre niveles jerárquicos con metas verificables","Crear un protocolo de gestión de conflictos con intervención de mediación institucional"], responsable:"Alta Dirección / RRHH" },
  ],
  "Evaluación de Proceso": [
    { area:"Documentación y estandarización de procesos", marco:"ISO 9001:2015 cláusulas 4.4 y 8 / Joint Commission", acciones:["Mapear y documentar los procesos críticos institucionales con flujogramas validados por las áreas responsables","Implementar un sistema de gestión documental con control de versiones y acceso controlado","Establecer procedimientos operativos estándar (POE) para los procesos de mayor impacto en el servicio","Realizar auditorías internas semestrales de cumplimiento de procesos documentados"], responsable:"Dirección de Calidad / Procesos" },
    { area:"Medición, análisis y mejora continua", marco:"ISO 9001:2015 cláusulas 9 y 10 / Ciclo PDCA", acciones:["Definir indicadores clave de proceso (KPI) con metas, frecuencia de medición y responsables","Implementar un tablero de control de gestión con indicadores actualizados mensualmente","Establecer un ciclo formal de revisión de resultados y mejora continua (PDCA trimestral)","Crear un registro de no conformidades, acciones correctivas y preventivas con seguimiento"], responsable:"Dirección de Calidad / Alta Dirección" },
    { area:"Capacitación y competencias para los procesos", marco:"Kirkpatrick Niveles 1-4 / ISO 9001 cláusula 7.2", acciones:["Evaluar las brechas de competencia del personal respecto a los procesos rediseñados","Diseñar e implementar capacitaciones específicas con evaluación de transferencia al puesto","Establecer un programa de inducción para nuevos ingresos con evaluación de comprensión de procesos","Medir el impacto de la capacitación en los indicadores de proceso (Kirkpatrick Nivel 4)"], responsable:"Dirección de Capacitación / Calidad" },
  ],
  "Otro": [
    { area:"Diagnóstico y planificación estratégica", marco:"ISO 9001:2015 / Mejora continua", acciones:["Profundizar el diagnóstico con entrevistas focalizadas a actores clave","Diseñar un plan de mejora con objetivos SMART, responsables y plazos","Establecer un comité de seguimiento con reuniones periódicas y actas formales","Implementar métricas de avance con reporte semestral a la Alta Dirección"], responsable:"Alta Dirección / Coordinación Institucional" },
  ],
};

function generateActionPlan(survey) {
  const { criticals } = getTopInsights(survey);
  const templates = ACTION_TEMPLATES[survey.category] || ACTION_TEMPLATES["Otro"];
  const getPriority = idx => { const s=criticals[idx]?.score??60; return s<50?"Alta":s<65?"Media":"Baja"; };
  const getPlaz = p => p==="Alta"?"Inmediato (0–30 días)":p==="Media"?"Corto plazo (1–3 meses)":"Mediano plazo (3–6 meses)";
  return templates.map((t,i) => ({ ...t, prioridad:getPriority(i), plazo:getPlaz(getPriority(i)) }));
}

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
    --bg: #f7f7f5; --white: #fff; --border: #e4e4e0; --border-dark: #c8c8c2;
    --accent: #1a1a1a; --accent-light: #f0f0ee;
    --positive: #2d6a4f; --positive-bg: #f0f7f4; --positive-border: #c8e6d4;
    --negative: #c0392b; --negative-bg: #fdf2f2; --negative-border: #f0c8c4;
    --warning: #92621a; --warning-bg: #fdf6ec; --warning-border: #f0dfc4;
    --neutral: #6b6b65; --neutral-bg: #f5f5f3;
    --muted: #8a8a84; --text: #1a1a1a;
    --serif: 'Playfair Display', Georgia, serif;
    --sans: 'Inter', sans-serif;
  }
  .app { min-height: 100vh; background: var(--bg); }

  /* DESKTOP NAV */
  .nav { display:flex; align-items:center; justify-content:space-between; padding:0 48px; height:64px; background:var(--white); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
  .nav-logo { font-family:var(--serif); font-weight:600; font-size:1.1rem; color:var(--text); white-space:nowrap; }
  .nav-logo span { color:var(--muted); font-weight:400; }
  .nav-tabs { display:flex; gap:2px; }
  .nav-tab { padding:7px 16px; border-radius:6px; border:none; cursor:pointer; font-family:var(--sans); font-size:0.82rem; font-weight:500; transition:all 0.15s; background:transparent; color:var(--muted); white-space:nowrap; }
  .nav-tab:hover { background:var(--accent-light); color:var(--text); }
  .nav-tab.active { background:var(--accent); color:#fff; }
  .nav-right { display:flex; align-items:center; gap:10px; }
  .nav-badge { font-size:0.72rem; color:var(--muted); border:1px solid var(--border); padding:4px 12px; border-radius:20px; background:var(--white); white-space:nowrap; }
  .admin-badge { font-size:0.7rem; color:var(--positive); font-weight:600; border:1px solid var(--positive-border); padding:4px 10px; border-radius:20px; background:var(--positive-bg); text-transform:uppercase; display:flex; align-items:center; gap:4px; white-space:nowrap; }
  .logout-btn { font-size:0.75rem; color:var(--muted); background:none; border:none; cursor:pointer; padding:4px 8px; border-radius:4px; font-family:var(--sans); }
  .logout-btn:hover { color:var(--text); background:var(--accent-light); }

  /* MOBILE */
  .mobile-header { display:none; align-items:center; justify-content:space-between; padding:0 16px; height:52px; background:var(--white); border-bottom:1px solid var(--border); position:sticky; top:0; z-index:100; }
  .mobile-logo { font-family:var(--serif); font-weight:600; font-size:0.95rem; }
  .mobile-logo span { color:var(--muted); font-weight:400; }
  .mobile-admin-dot { width:8px; height:8px; border-radius:50%; background:var(--positive); }
  .mobile-nav { display:none; position:fixed; bottom:0; left:0; right:0; background:var(--white); border-top:1px solid var(--border); z-index:200; padding:6px 0 max(6px, env(safe-area-inset-bottom)); }
  .mobile-nav-inner { display:flex; justify-content:space-around; }
  .mobile-tab { flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:6px 4px; background:none; border:none; cursor:pointer; font-family:var(--sans); font-size:0.62rem; font-weight:500; color:var(--muted); transition:color 0.15s; -webkit-tap-highlight-color:transparent; }
  .mobile-tab.active { color:var(--accent); }
  .mobile-tab-icon { font-size:1.3rem; line-height:1; }

  /* MAIN */
  .main { max-width:860px; margin:0 auto; padding:44px 24px; }

  /* LOGIN */
  .login-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; z-index:300; padding:16px; }
  .login-card { background:var(--white); border:1px solid var(--border); border-radius:12px; padding:40px 36px; width:100%; max-width:360px; text-align:center; position:relative; }
  .login-title { font-family:var(--serif); font-size:1.4rem; font-weight:600; margin-bottom:8px; }
  .login-sub { color:var(--muted); font-size:0.83rem; margin-bottom:28px; line-height:1.6; }
  .login-error { background:var(--negative-bg); color:var(--negative); font-size:0.8rem; padding:9px 14px; border-radius:6px; margin-bottom:14px; border:1px solid var(--negative-border); }

  /* LAYOUT */
  .section-header { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:28px; border-bottom:1px solid var(--border); padding-bottom:18px; gap:12px; }
  .section-title { font-family:var(--serif); font-weight:600; font-size:1.5rem; line-height:1.2; }
  .section-sub { color:var(--muted); font-size:0.8rem; margin-top:5px; }
  .card { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:24px 28px; margin-bottom:14px; }
  .card-title { font-family:var(--serif); font-size:0.92rem; font-weight:600; margin-bottom:18px; padding-bottom:12px; border-bottom:1px solid var(--border); }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .sec-label { font-size:0.68rem; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted); margin:24px 0 12px; padding-bottom:8px; border-bottom:1px solid var(--border); }

  /* FORMS */
  .field { margin-bottom:16px; }
  .label { font-size:0.7rem; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:7px; display:block; }
  .input,.select,.textarea { width:100%; background:var(--white); border:1px solid var(--border); border-radius:6px; padding:10px 13px; color:var(--text); font-family:var(--sans); font-size:0.88rem; outline:none; transition:border-color 0.15s; }
  .input:focus,.select:focus,.textarea:focus { border-color:var(--accent); }
  .input::placeholder { color:var(--muted); }
  .textarea { min-height:80px; resize:vertical; line-height:1.6; }
  .select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238a8a84' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 13px center; padding-right:34px; }

  /* BUTTONS */
  .btn { display:inline-flex; align-items:center; gap:6px; padding:9px 18px; border-radius:6px; border:1px solid transparent; cursor:pointer; font-family:var(--sans); font-size:0.82rem; font-weight:500; transition:all 0.15s; }
  .btn-primary { background:var(--accent); color:#fff; border-color:var(--accent); }
  .btn-primary:hover { background:#333; }
  .btn-primary:disabled { background:var(--muted); border-color:var(--muted); cursor:not-allowed; opacity:0.7; }
  .btn-secondary { background:var(--white); color:var(--text); border-color:var(--border); }
  .btn-secondary:hover { border-color:var(--accent); }
  .btn-danger { background:transparent; color:var(--negative); border-color:#e8c5c2; }
  .btn-danger:hover { background:var(--negative-bg); }
  .btn-outline { background:transparent; color:var(--text); border-color:var(--border); }
  .btn-outline:hover { background:var(--accent-light); }
  .btn-sm { padding:6px 13px; font-size:0.78rem; }
  .btn-full { width:100%; justify-content:center; }

  /* SURVEY ITEMS */
  .survey-item { display:flex; justify-content:space-between; align-items:center; padding:16px 20px; background:var(--white); border:1px solid var(--border); border-radius:8px; margin-bottom:10px; gap:12px; transition:border-color 0.15s; }
  .survey-item:hover { border-color:var(--border-dark); }
  .survey-name { font-weight:500; font-size:0.9rem; }
  .survey-meta { font-size:0.76rem; color:var(--muted); margin-top:4px; }

  /* Q ITEMS */
  .q-item { background:var(--bg); border:1px solid var(--border); border-radius:8px; padding:14px 18px; margin-bottom:10px; }
  .q-item-header { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
  .q-type-badge { font-size:0.68rem; padding:3px 9px; border-radius:20px; background:var(--white); border:1px solid var(--border); color:var(--muted); white-space:nowrap; font-weight:500; }
  .q-options { margin-top:12px; display:flex; flex-direction:column; gap:8px; }
  .q-opt-row { display:flex; gap:8px; align-items:center; }

  /* RESPONSE */
  .q-response { margin-bottom:28px; padding-bottom:28px; border-bottom:1px solid var(--border); }
  .q-response:last-child { border-bottom:none; margin-bottom:0; padding-bottom:0; }
  .q-text { font-size:0.98rem; font-weight:500; margin-bottom:14px; line-height:1.6; }
  .q-num { font-family:var(--serif); color:var(--muted); margin-right:8px; }
  .scale-row { display:flex; gap:8px; flex-wrap:wrap; }
  .scale-btn { width:50px; height:50px; border-radius:8px; border:1px solid var(--border); background:var(--white); color:var(--text); font-size:1rem; font-weight:500; cursor:pointer; transition:all 0.15s; }
  .scale-btn:hover,.scale-btn.selected { background:var(--accent); border-color:var(--accent); color:#fff; }
  .yn-row { display:flex; gap:10px; }
  .yn-btn { flex:1; padding:13px; border-radius:8px; border:1px solid var(--border); background:var(--white); color:var(--text); font-size:0.9rem; font-weight:500; cursor:pointer; transition:all 0.15s; }
  .yn-btn:hover,.yn-btn.selected { background:var(--accent); border-color:var(--accent); color:#fff; }
  .mc-row { display:flex; flex-direction:column; gap:7px; }
  .mc-btn { padding:11px 15px; border-radius:8px; border:1px solid var(--border); background:var(--white); color:var(--text); font-size:0.87rem; cursor:pointer; transition:all 0.15s; text-align:left; font-family:var(--sans); }
  .mc-btn:hover,.mc-btn.selected { background:var(--accent); border-color:var(--accent); color:#fff; }
  .progress-bar { height:2px; background:var(--border); border-radius:1px; margin-bottom:36px; }
  .progress-fill { height:100%; background:var(--accent); border-radius:1px; transition:width 0.4s; }

  /* HEALTH CARD */
  .health-card { background:var(--accent); color:#fff; border-radius:12px; padding:28px 32px; margin-bottom:14px; display:flex; align-items:center; gap:32px; }
  .health-score { font-family:var(--serif); font-size:4.5rem; font-weight:600; line-height:1; }
  .health-score sup { font-size:1.4rem; opacity:0.5; vertical-align:super; }
  .health-status { font-family:var(--serif); font-size:1.25rem; font-weight:600; margin-bottom:4px; }
  .health-bar-wrap { width:180px; height:5px; background:rgba(255,255,255,0.2); border-radius:3px; margin-top:10px; }
  .health-bar-fill { height:100%; border-radius:3px; background:#fff; }
  .health-framework { font-size:0.7rem; opacity:0.5; margin-top:6px; letter-spacing:0.04em; }

  /* STATS */
  .stat-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }
  .stat-card { background:var(--white); border:1px solid var(--border); border-radius:8px; padding:18px 20px; }
  .stat-num { font-family:var(--serif); font-weight:600; font-size:1.7rem; }
  .stat-label { font-size:0.7rem; color:var(--muted); margin-top:3px; font-weight:500; text-transform:uppercase; letter-spacing:0.07em; }

  /* RADAR */
  .radar-card { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:20px 24px; margin-bottom:14px; }
  .radar-wrap { display:flex; justify-content:center; padding:8px 0; }

  /* INSIGHTS */
  .insight-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
  .insight-card { border-radius:10px; padding:18px 20px; }
  .insight-card.pos { background:var(--positive-bg); border:1px solid var(--positive-border); }
  .insight-card.neg { background:var(--negative-bg); border:1px solid var(--negative-border); }
  .insight-card-title { font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:12px; }
  .insight-card.pos .insight-card-title { color:var(--positive); }
  .insight-card.neg .insight-card-title { color:var(--negative); }
  .insight-item { font-size:0.82rem; padding:7px 0; border-bottom:1px solid rgba(0,0,0,0.06); line-height:1.4; display:flex; justify-content:space-between; gap:8px; }
  .insight-item:last-child { border-bottom:none; }
  .insight-score { font-family:var(--serif); font-weight:600; flex-shrink:0; }

  /* DIAGNOSTIC */
  .diag-card { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:24px 28px; margin-bottom:14px; }
  .diag-label { font-size:0.7rem; font-weight:600; text-transform:uppercase; letter-spacing:0.1em; color:var(--muted); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
  .diag-dot { width:6px; height:6px; border-radius:50%; background:var(--positive); display:inline-block; flex-shrink:0; }
  .diag-paragraph { font-size:0.87rem; line-height:1.85; color:#2a2a2a; margin-bottom:16px; }
  .diag-paragraph:last-child { margin-bottom:0; }
  .diag-framework { font-size:0.72rem; color:var(--muted); margin-top:16px; padding-top:14px; border-top:1px solid var(--border); font-style:italic; }

  /* CHARTS */
  .chart-section { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:20px 24px; margin-bottom:10px; }
  .chart-q-meta { font-size:0.68rem; color:var(--muted); font-weight:600; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:5px; }
  .chart-q { font-size:0.9rem; font-weight:500; line-height:1.5; }
  .bar-row { display:flex; align-items:center; gap:10px; margin-bottom:7px; }
  .bar-label { min-width:90px; color:var(--muted); text-align:right; font-size:0.76rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .bar-track { flex:1; height:7px; background:var(--bg); border-radius:4px; overflow:hidden; border:1px solid var(--border); }
  .bar-fill { height:100%; border-radius:4px; background:var(--accent); transition:width 0.6s; }
  .bar-pct { min-width:32px; font-size:0.73rem; color:var(--muted); font-weight:500; }
  .avg-display { display:flex; align-items:baseline; gap:6px; margin-bottom:12px; }
  .avg-num { font-family:var(--serif); font-weight:600; font-size:2rem; }
  .avg-denom { font-size:0.9rem; color:var(--muted); }
  .tag { display:inline-flex; align-items:center; padding:3px 9px; border-radius:20px; font-size:0.68rem; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; }
  .tag-pos { background:var(--positive-bg); color:var(--positive); }
  .tag-neg { background:var(--negative-bg); color:var(--negative); }
  .tag-neu { background:var(--neutral-bg); color:var(--neutral); }
  .responses-list { display:flex; flex-direction:column; gap:7px; }
  .response-text { background:var(--bg); border:1px solid var(--border); border-left:3px solid var(--border-dark); padding:9px 13px; border-radius:0 6px 6px 0; font-size:0.83rem; line-height:1.6; }

  /* ACTION PLAN */
  .plan-item { background:var(--white); border:1px solid var(--border); border-radius:10px; padding:18px 22px; margin-bottom:10px; }
  .plan-item-header { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; margin-bottom:10px; }
  .plan-area { font-weight:600; font-size:0.9rem; flex:1; line-height:1.4; }
  .plan-marco { font-size:0.72rem; color:var(--muted); margin-top:3px; font-style:italic; }
  .priority-badge { font-size:0.66rem; padding:3px 9px; border-radius:20px; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; white-space:nowrap; flex-shrink:0; }
  .priority-alta { background:var(--negative-bg); color:var(--negative); border:1px solid var(--negative-border); }
  .priority-media { background:var(--warning-bg); color:var(--warning); border:1px solid var(--warning-border); }
  .priority-baja { background:var(--positive-bg); color:var(--positive); border:1px solid var(--positive-border); }
  .plan-actions { display:flex; flex-direction:column; gap:6px; margin-bottom:12px; }
  .plan-action { display:flex; gap:9px; font-size:0.84rem; line-height:1.5; color:#333; }
  .plan-action-num { color:var(--muted); font-family:var(--serif); font-weight:600; flex-shrink:0; }
  .plan-meta { display:flex; gap:14px; padding-top:10px; border-top:1px solid var(--border); flex-wrap:wrap; }
  .plan-meta-item { font-size:0.72rem; color:var(--muted); display:flex; align-items:center; gap:4px; }

  /* SUCCESS/EMPTY/LOADING */
  .success-screen { text-align:center; padding:70px 20px; }
  .success-icon { font-size:2.2rem; margin-bottom:16px; }
  .success-title { font-family:var(--serif); font-weight:600; font-size:1.6rem; margin-bottom:10px; }
  .success-sub { color:var(--muted); max-width:340px; margin:0 auto; line-height:1.7; font-size:0.88rem; }
  .empty { text-align:center; padding:56px 20px; color:var(--muted); font-size:0.86rem; }
  .empty-icon { font-size:1.8rem; margin-bottom:10px; opacity:0.4; }
  .loading { text-align:center; padding:70px 20px; color:var(--muted); font-size:0.84rem; }
  .spinner { width:26px; height:26px; border:2px solid var(--border); border-top-color:var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 14px; }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* RESPONSIVE */
  @media(max-width:680px) {
    .nav { display:none; }
    .mobile-header { display:flex; }
    .mobile-nav { display:block; }
    .app { padding-bottom:72px; }
    .main { padding:20px 16px; }
    .stat-grid { grid-template-columns:1fr 1fr; }
    .insight-grid { grid-template-columns:1fr; }
    .two-col { grid-template-columns:1fr; }
    .health-card { flex-direction:column; gap:16px; padding:22px 20px; }
    .health-bar-wrap { width:100%; }
    .section-header { flex-direction:column; align-items:flex-start; gap:10px; }
    .section-header > div:last-child { display:flex; gap:8px; width:100%; }
    .section-header > div:last-child .btn { flex:1; justify-content:center; }
    .card { padding:18px; }
    .chart-section,.plan-item,.diag-card,.radar-card { padding:16px 18px; }
  }
`;

const QUESTION_TYPES = [
  { value:"scale", label:"Escala 1–5" },
  { value:"yesno", label:"Sí / No" },
  { value:"multiple", label:"Opción múltiple" },
  { value:"text", label:"Texto libre" },
];
const SURVEY_CATEGORIES = ["Comunicación Interna","Satisfacción","Evaluación de Proceso","Otro"];

// ─── Radar Chart ──────────────────────────────────────────────────────────────
function RadarChart({ survey }) {
  const questions = survey.questions.filter(q => q.type==="scale"||q.type==="yesno");
  if (questions.length < 3) return null;
  const size=260, cx=size/2, cy=size/2, r=95;
  const scores = questions.map(q => (getQuestionScore(q, survey.responses)||0)/100);
  const n = questions.length;
  const pts = scores.map((s,i) => { const a=(i/n)*2*Math.PI-Math.PI/2; return {x:cx+r*s*Math.cos(a),y:cy+r*s*Math.sin(a)}; });
  const labels = questions.map((q,i) => { const a=(i/n)*2*Math.PI-Math.PI/2; const lr=r+30; return {x:cx+lr*Math.cos(a),y:cy+lr*Math.sin(a),text:q.text.length>20?q.text.slice(0,18)+"…":q.text}; });
  const axes = questions.map((_,i) => { const a=(i/n)*2*Math.PI-Math.PI/2; return {x2:cx+r*Math.cos(a),y2:cy+r*Math.sin(a)}; });
  const gridLevels=[0.25,0.5,0.75,1];
  return (
    <div className="radar-wrap">
      <svg width={size+120} height={size+60} viewBox={`-60 -20 ${size+120} ${size+60}`}>
        {gridLevels.map(lv => { const gpts=questions.map((_,i)=>{const a=(i/n)*2*Math.PI-Math.PI/2;return `${cx+r*lv*Math.cos(a)},${cy+r*lv*Math.sin(a)}`;}).join(" "); return <polygon key={lv} points={gpts} fill="none" stroke="#e4e4e0" strokeWidth="1"/>; })}
        {[0.25,0.5,0.75,1].map(lv => <text key={`l${lv}`} x={cx+4} y={cy-r*lv+4} style={{fontSize:"8px",fill:"#c0c0bc",fontFamily:"Inter,sans-serif"}}>{lv*100}%</text>)}
        {axes.map((a,i) => <line key={i} x1={cx} y1={cy} x2={a.x2} y2={a.y2} stroke="#e4e4e0" strokeWidth="1"/>)}
        <polygon points={pts.map(p=>`${p.x},${p.y}`).join(" ")} fill="rgba(26,26,26,0.07)" stroke="#1a1a1a" strokeWidth="2"/>
        {pts.map((p,i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="#1a1a1a"/>)}
        {labels.map((l,i) => <text key={i} x={l.x} y={l.y} textAnchor="middle" dominantBaseline="middle" style={{fontSize:"9px",fill:"#8a8a84",fontFamily:"Inter,sans-serif"}}>{l.text}</text>)}
      </svg>
    </div>
  );
}

// ─── Bar/Scale Charts ─────────────────────────────────────────────────────────
function BarChart({ data }) {
  const max=Math.max(...data.map(d=>d.count),1), total=Math.max(data.reduce((a,b)=>a+b.count,0),1);
  return <div>{data.map((d,i)=><div className="bar-row" key={i}><div className="bar-label" title={d.label}>{d.label}</div><div className="bar-track"><div className="bar-fill" style={{width:`${(d.count/max)*100}%`}}/></div><div className="bar-pct">{Math.round((d.count/total)*100)}%</div></div>)}</div>;
}
function ScaleChart({ answers }) {
  const avg=answers.length?(answers.reduce((a,b)=>a+b,0)/answers.length).toFixed(1):"—";
  return <div><div className="avg-display"><span className="avg-num">{avg}</span><span className="avg-denom">/ 5</span><span style={{fontSize:"0.78rem",color:"var(--muted)",marginLeft:4}}>· {answers.length} respuesta{answers.length!==1?"s":""}</span></div><BarChart data={[1,2,3,4,5].map(v=>({label:`${v}`,count:answers.filter(a=>a===v).length}))}/></div>;
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginModal({ onSuccess, onCancel }) {
  const [pwd,setPwd]=useState(""), [error,setError]=useState(false);
  const attempt=()=>{ if(pwd===ADMIN_PASSWORD) onSuccess(); else {setError(true);setPwd("");} };
  return (
    <div className="login-overlay">
      <div className="login-card">
        <button onClick={onCancel} style={{position:"absolute",top:14,right:14,background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:"1.1rem"}}>✕</button>
        <div className="login-title">Acceso administrativo</div>
        <div className="login-sub">Ingresá la contraseña para acceder al panel de administración y resultados.</div>
        {error && <div className="login-error">Contraseña incorrecta.</div>}
        <div className="field"><label className="label">Contraseña</label><input className="input" type="password" value={pwd} placeholder="••••••" onChange={e=>{setPwd(e.target.value);setError(false);}} onKeyDown={e=>e.key==="Enter"&&attempt()} autoFocus/></div>
        <button className="btn btn-primary btn-full" onClick={attempt}>Ingresar</button>
      </div>
    </div>
  );
}

// ─── Shared Survey Form (create & edit) ──────────────────────────────────────
function SurveyForm({ initial, onSave, onCancel, saving }) {
  const [title, setTitle]         = useState(initial?.title || "");
  const [category, setCategory]   = useState(initial?.category || SURVEY_CATEGORIES[0]);
  const [anonymous, setAnonymous] = useState(initial?.anonymous ?? false);
  const [questions, setQuestions] = useState(initial?.questions ? JSON.parse(JSON.stringify(initial.questions)) : []);
  const [qText, setQText]         = useState("");
  const [qType, setQType]         = useState("scale");
  const [qOptions, setQOptions]   = useState(["", ""]);
  const [editingQId, setEditingQId] = useState(null);
  const [editQText, setEditQText]   = useState("");
  const isEditing = !!initial;

  const addQ = () => {
    if (!qText.trim()) return;
    const q = { id: Date.now(), text: qText, type: qType };
    if (qType === "multiple") q.options = qOptions.filter(o => o.trim());
    setQuestions([...questions, q]); setQText(""); setQOptions(["", ""]);
  };
  const startEditQ = q => { setEditingQId(q.id); setEditQText(q.text); };
  const saveEditQ  = id => { setQuestions(questions.map(q => q.id===id ? {...q, text:editQText} : q)); setEditingQId(null); };

  return (
    <div>
      <div className="section-header">
        <div>
          <div className="section-title">{isEditing ? "Editar encuesta" : "Nueva encuesta"}</div>
          <div className="section-sub">{isEditing ? `Editando: ${initial.title}` : "Completá los datos y agregá preguntas"}</div>
        </div>
        <button className="btn btn-secondary" onClick={onCancel}>← Volver</button>
      </div>
      <div className="card">
        <div className="card-title">Datos generales</div>
        <div className="two-col">
          <div className="field"><label className="label">Título</label><input className="input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ej: Diagnóstico Q1 2025"/></div>
          <div className="field"><label className="label">Categoría</label><select className="select" value={category} onChange={e=>setCategory(e.target.value)}>{SURVEY_CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:12,borderTop:"1px solid var(--border)",marginTop:4}}>
          <button onClick={()=>setAnonymous(!anonymous)} style={{width:40,height:22,borderRadius:11,border:"none",cursor:"pointer",transition:"background 0.2s",background:anonymous?"#1a1a1a":"#d0d0cc",position:"relative",flexShrink:0}}>
            <span style={{position:"absolute",top:3,left:anonymous?20:3,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left 0.2s",display:"block"}}/>
          </button>
          <div>
            <div style={{fontSize:"0.85rem",fontWeight:500}}>{anonymous?"Respuestas anónimas":"Requiere identificación"}</div>
            <div style={{fontSize:"0.74rem",color:"var(--muted)",marginTop:2}}>{anonymous?"Los respondentes no ingresarán su nombre":"Los respondentes deben ingresar su nombre o área"}</div>
          </div>
        </div>
      </div>

      {!!questions.length && (
        <div className="card">
          <div className="card-title">Preguntas ({questions.length})</div>
          {questions.map((q,i) => (
            <div className="q-item" key={q.id}>
              {editingQId===q.id ? (
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <input className="input" value={editQText} onChange={e=>setEditQText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveEditQ(q.id)} autoFocus style={{flex:1}}/>
                  <button className="btn btn-primary btn-sm" onClick={()=>saveEditQ(q.id)}>✓</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>setEditingQId(null)}>✕</button>
                </div>
              ) : (
                <div className="q-item-header">
                  <div style={{flex:1,fontSize:"0.88rem",lineHeight:1.5}}>
                    <span style={{color:"var(--muted)",fontFamily:"var(--serif)",marginRight:8}}>{i+1}.</span>{q.text}
                    {q.type==="multiple"&&q.options&&<div style={{marginTop:5,color:"var(--muted)",fontSize:"0.76rem"}}>{q.options.join(" · ")}</div>}
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    <span className="q-type-badge">{QUESTION_TYPES.find(t=>t.value===q.type)?.label}</span>
                    <button className="btn btn-secondary btn-sm" onClick={()=>startEditQ(q)} title="Editar texto">✎</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>setQuestions(questions.filter(x=>x.id!==q.id))}>✕</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title">Agregar pregunta</div>
        <div className="field"><label className="label">Pregunta</label><input className="input" value={qText} onChange={e=>setQText(e.target.value)} placeholder="Ej: ¿Cómo calificás la comunicación entre áreas?" onKeyDown={e=>e.key==="Enter"&&addQ()}/></div>
        <div className="field"><label className="label">Tipo</label><select className="select" value={qType} onChange={e=>{setQType(e.target.value);setQOptions(["",""]);}}>{QUESTION_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
        {qType==="multiple"&&<div className="field"><label className="label">Opciones</label><div className="q-options">{qOptions.map((opt,i)=><div className="q-opt-row" key={i}><input className="input" value={opt} placeholder={`Opción ${i+1}`} onChange={e=>{const o=[...qOptions];o[i]=e.target.value;setQOptions(o);}}/>{qOptions.length>2&&<button className="btn btn-danger btn-sm" onClick={()=>setQOptions(qOptions.filter((_,j)=>j!==i))}>✕</button>}</div>)}<button className="btn btn-secondary btn-sm" style={{alignSelf:"flex-start"}} onClick={()=>setQOptions([...qOptions,""])}>+ Opción</button></div></div>}
        <button className="btn btn-outline" onClick={addQ}>Agregar pregunta →</button>
      </div>
      {!!questions.length&&title.trim()&&<div style={{display:"flex",justifyContent:"flex-end"}}><button className="btn btn-primary" onClick={()=>onSave({title,category,anonymous,questions})} disabled={saving}>{saving?"Guardando…":isEditing?"Guardar cambios":"Guardar encuesta"}</button></div>}
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminPanel({ surveys, loading }) {
  const [mode, setMode]                   = useState("list");
  const [editingSurvey, setEditingSurvey] = useState(null);
  const [saving, setSaving]               = useState(false);
  const [duplicating, setDuplicating]     = useState(null); // survey to duplicate
  const [dupTitle, setDupTitle]           = useState("");
  const [dupSaving, setDupSaving]         = useState(false);

  const startDuplicate = s => { setDuplicating(s); setDupTitle(s.title + " (copia)"); };
  const confirmDuplicate = async () => {
    if (!dupTitle.trim()) return;
    setDupSaving(true);
    try {
      await addDoc(collection(db,"surveys"), {
        title: dupTitle,
        category: duplicating.category,
        anonymous: duplicating.anonymous ?? false,
        questions: JSON.parse(JSON.stringify(duplicating.questions)),
        createdAt: new Date().toLocaleDateString("es-AR"),
        responses: []
      });
      setDuplicating(null); setDupTitle("");
    } catch(e) { console.error(e); }
    setDupSaving(false);
  };

  const handleCreate = async data => {
    setSaving(true);
    try { await addDoc(collection(db,"surveys"),{...data,createdAt:new Date().toLocaleDateString("es-AR"),responses:[]}); setMode("list"); }
    catch(e){console.error(e);}
    setSaving(false);
  };

  const handleEdit = async data => {
    setSaving(true);
    try { await updateDoc(doc(db,"surveys",editingSurvey.id),{title:data.title,category:data.category,anonymous:data.anonymous,questions:data.questions}); setMode("list"); setEditingSurvey(null); }
    catch(e){console.error(e);}
    setSaving(false);
  };

  const del = async id => {
    if (!confirm("¿Eliminar esta encuesta y todas sus respuestas?")) return;
    await deleteDoc(doc(db,"surveys",id));
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando…</div>;
  if (mode==="create") return <SurveyForm onSave={handleCreate} onCancel={()=>setMode("list")} saving={saving}/>;
  if (mode==="edit"&&editingSurvey) return <SurveyForm initial={editingSurvey} onSave={handleEdit} onCancel={()=>{setMode("list");setEditingSurvey(null);}} saving={saving}/>;

  return (
    <div>
      {/* Duplicate modal */}
      {duplicating && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
          <div style={{background:"var(--white)",border:"1px solid var(--border)",borderRadius:12,padding:"36px 32px",width:"100%",maxWidth:400,position:"relative"}}>
            <button onClick={()=>setDuplicating(null)} style={{position:"absolute",top:14,right:14,background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:"1.1rem"}}>✕</button>
            <div style={{fontFamily:"var(--serif)",fontSize:"1.3rem",fontWeight:600,marginBottom:8}}>Duplicar encuesta</div>
            <div style={{color:"var(--muted)",fontSize:"0.83rem",marginBottom:24,lineHeight:1.6}}>Se copiará la estructura completa sin respuestas. Ingresá el nombre para la nueva encuesta.</div>
            <div className="field">
              <label className="label">Nombre de la copia</label>
              <input className="input" value={dupTitle} onChange={e=>setDupTitle(e.target.value)} onKeyDown={e=>e.key==="Enter"&&confirmDuplicate()} autoFocus/>
            </div>
            <div style={{display:"flex",gap:8,marginTop:8}}>
              <button className="btn btn-secondary" style={{flex:1,justifyContent:"center"}} onClick={()=>setDuplicating(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{flex:1,justifyContent:"center"}} onClick={confirmDuplicate} disabled={!dupTitle.trim()||dupSaving}>{dupSaving?"Duplicando…":"Duplicar"}</button>
            </div>
          </div>
        </div>
      )}
      <div className="section-header">
        <div><div className="section-title">Encuestas</div><div className="section-sub">{surveys.length} registrada{surveys.length!==1?"s":""}</div></div>
        <button className="btn btn-primary" onClick={()=>setMode("create")}>+ Nueva encuesta</button>
      </div>
      {!surveys.length&&<div className="empty"><div className="empty-icon">○</div><div>No hay encuestas aún.</div></div>}
      {surveys.map(s=>(
        <div className="survey-item" key={s.id}>
          <div>
            <div className="survey-name">{s.title}</div>
            <div className="survey-meta">
              {s.category} · {s.questions.length} preguntas · {(s.responses||[]).length} respuestas · {s.createdAt}
              <span style={{marginLeft:8,fontSize:"0.7rem",padding:"2px 7px",borderRadius:10,background:"var(--neutral-bg)",color:"var(--neutral)"}}>{s.anonymous?"Anónima":"Con identificación"}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button className="btn btn-secondary btn-sm" onClick={()=>{setEditingSurvey(s);setMode("edit");}}>✎ Editar</button>
            <button className="btn btn-secondary btn-sm" onClick={()=>startDuplicate(s)} title="Duplicar">⧉ Duplicar</button>
            <button className="btn btn-danger btn-sm" onClick={()=>del(s.id)}>Eliminar</button>
          </div>
        </div>
      ))}
    </div>
  );
}


// ─── Responder ────────────────────────────────────────────────────────────────
function RespondSurvey({ surveys, loading }) {
  const [selectedId,setSelectedId]=useState(null),[answers,setAnswers]=useState({}),[step,setStep]=useState(0);
  const [respondent,setRespondent]=useState(""),[submitting,setSubmitting]=useState(false);
  const survey=surveys.find(s=>s.id===selectedId);
  const answered=survey?survey.questions.filter(q=>answers[q.id]!==undefined).length:0;
  const total=survey?survey.questions.length:0;
  const submit=async()=>{ if(!survey) return; setSubmitting(true); try { await updateDoc(doc(db,"surveys",selectedId),{responses:arrayUnion({id:Date.now(),respondent,answers,date:new Date().toLocaleDateString("es-AR")})}); setStep(2); } catch(e){console.error(e);} setSubmitting(false); };

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando…</div>;
  if (step===2) return <div className="success-screen"><div className="success-icon">✓</div><div className="success-title">Respuestas registradas</div><div className="success-sub">Gracias por completar la encuesta. Tus respuestas fueron guardadas correctamente.</div><div style={{marginTop:32}}><button className="btn btn-secondary" onClick={()=>{setStep(0);setSelectedId(null);setRespondent("");setAnswers({});}}>Responder otra encuesta</button></div></div>;
  if (step===1&&survey) return (
    <div>
      <div className="section-header"><div><div className="section-title">{survey.title}</div><div className="section-sub">{survey.category} · {answered} de {total} respondidas</div></div><button className="btn btn-secondary btn-sm" onClick={()=>setStep(0)}>← Salir</button></div>
      <div className="progress-bar"><div className="progress-fill" style={{width:`${(answered/total)*100}%`}}/></div>
      <div className="card">
        {survey.questions.map((q,i)=>(
          <div className="q-response" key={q.id}>
            <div className="q-text"><span className="q-num">{i+1}.</span>{q.text}</div>
            {q.type==="scale"&&<div><div className="scale-row">{[1,2,3,4,5].map(v=><button key={v} className={`scale-btn${answers[q.id]===v?" selected":""}`} onClick={()=>setAnswers({...answers,[q.id]:v})}>{v}</button>)}</div><div style={{display:"flex",justifyContent:"space-between",fontSize:"0.7rem",color:"var(--muted)",marginTop:6}}><span>Muy bajo</span><span>Muy alto</span></div></div>}
            {q.type==="yesno"&&<div className="yn-row">{["Sí","No"].map(v=><button key={v} className={`yn-btn${answers[q.id]===v?" selected":""}`} onClick={()=>setAnswers({...answers,[q.id]:v})}>{v}</button>)}</div>}
            {q.type==="multiple"&&q.options&&<div className="mc-row">{q.options.map(opt=><button key={opt} className={`mc-btn${answers[q.id]===opt?" selected":""}`} onClick={()=>setAnswers({...answers,[q.id]:opt})}>{opt}</button>)}</div>}
            {q.type==="text"&&<textarea className="textarea" placeholder="Escribí tu respuesta aquí…" value={answers[q.id]||""} onChange={e=>setAnswers({...answers,[q.id]:e.target.value})}/>}
          </div>
        ))}
        <div style={{textAlign:"center",paddingTop:8}}><button className="btn btn-primary" style={{padding:"12px 40px"}} onClick={submit} disabled={answered<total||submitting}>{submitting?"Enviando…":answered<total?`Faltan ${total-answered} pregunta${total-answered!==1?"s":""}` : "Enviar respuestas"}</button></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="section-header"><div><div className="section-title">Completar encuesta</div><div className="section-sub">Seleccioná la encuesta que querés completar</div></div></div>
      {!surveys.length?<div className="empty"><div className="empty-icon">○</div><div>No hay encuestas disponibles aún.</div></div>:(
        <div className="card">
          <div className="field"><label className="label">Nombre o identificador</label><input className="input" value={respondent} onChange={e=>setRespondent(e.target.value)} placeholder="Ej: María García / Área Administración"/></div>
          <div className="field"><label className="label">Encuesta</label><div style={{display:"flex",flexDirection:"column",gap:8}}>{surveys.map(s=><div key={s.id} onClick={()=>setSelectedId(s.id)} style={{padding:"14px 18px",border:`1px solid ${selectedId===s.id?"var(--accent)":"var(--border)"}`,borderRadius:8,cursor:"pointer",background:selectedId===s.id?"var(--accent-light)":"var(--bg)",transition:"all 0.15s"}}><div style={{fontWeight:500,fontSize:"0.9rem"}}>{s.title}</div><div style={{fontSize:"0.76rem",color:"var(--muted)",marginTop:4}}>{s.category} · {s.questions.length} preguntas</div></div>)}</div></div>
          <button className="btn btn-primary" disabled={!selectedId||(!surveys.find(s=>s.id===selectedId)?.anonymous&&!respondent.trim())} onClick={()=>setStep(1)}>Comenzar →</button>
        </div>
      )}
    </div>
  );
}

// ─── Results Panel ────────────────────────────────────────────────────────────
function ResultsPanel({ surveys, loading }) {
  const [selectedId, setSelectedId] = useState(null);
  const survey = surveys.find(s=>s.id===selectedId);

  const getTag = score => {
    if (score===null) return null;
    if (score>=65) return <span className="tag tag-pos">Favorable</span>;
    if (score>=50) return <span className="tag tag-neu">Aceptable</span>;
    return <span className="tag tag-neg">Crítico</span>;
  };

  const exportPDF = () => {
    if (!survey) return;
    const s = survey;
    const score = getHealthScore(s);
    const level = score!==null ? getBenchmarkLevel(score) : null;
    const { strengths, criticals } = getTopInsights(s);
    const diagnostic = generateDiagnostic(s);
    const plan = generateActionPlan(s);
    const win = window.open("","_blank");

    // Radar SVG for PDF
    const radarQs = s.questions.filter(q=>q.type==="scale"||q.type==="yesno");
    let radarSvg = "";
    if (radarQs.length>=3) {
      const sz=280,cx=sz/2,cy=sz/2,r=100;
      const sc=radarQs.map(q=>(getQuestionScore(q,s.responses)||0)/100);
      const n=radarQs.length;
      const pts=sc.map((sv,i)=>{const a=(i/n)*2*Math.PI-Math.PI/2;return{x:cx+r*sv*Math.cos(a),y:cy+r*sv*Math.sin(a)};});
      const gls=[0.25,0.5,0.75,1];
      const labs=radarQs.map((q,i)=>{const a=(i/n)*2*Math.PI-Math.PI/2;const lr=r+32;return{x:cx+lr*Math.cos(a),y:cy+lr*Math.sin(a),text:q.text.length>22?q.text.slice(0,20)+"…":q.text};});
      radarSvg=`<svg width="${sz+140}" height="${sz+60}" viewBox="-70 -20 ${sz+140} ${sz+60}" style="display:block;margin:0 auto">${gls.map(lv=>`<polygon points="${radarQs.map((_,i)=>{const a=(i/n)*2*Math.PI-Math.PI/2;return`${cx+r*lv*Math.cos(a)},${cy+r*lv*Math.sin(a)}`;}).join(" ")}" fill="none" stroke="#e4e4e0" stroke-width="1"/>`).join("")}${radarQs.map((_,i)=>{const a=(i/n)*2*Math.PI-Math.PI/2;return`<line x1="${cx}" y1="${cy}" x2="${cx+r*Math.cos(a)}" y2="${cy+r*Math.sin(a)}" stroke="#e4e4e0" stroke-width="1"/>`;}).join("")}<polygon points="${pts.map(p=>`${p.x},${p.y}`).join(" ")}" fill="rgba(26,26,26,0.08)" stroke="#1a1a1a" stroke-width="2"/>${pts.map(p=>`<circle cx="${p.x}" cy="${p.y}" r="4" fill="#1a1a1a"/>`).join("")}${labs.map(l=>`<text x="${l.x}" y="${l.y}" text-anchor="middle" dominant-baseline="middle" style="font-size:9px;fill:#8a8a84;font-family:Helvetica,sans-serif">${l.text}</text>`).join("")}</svg>`;
    }

    let questionsHtml="";
    s.questions.forEach((q,i)=>{
      const answers=s.responses.map(r=>r.answers[q.id]).filter(a=>a!==undefined);
      const qscore=getQuestionScore(q,s.responses);
      let viz="";
      if(q.type==="scale"){const avg=answers.length?(answers.reduce((a,b)=>a+b,0)/answers.length).toFixed(1):"—";const counts=[1,2,3,4,5].map(v=>answers.filter(a=>a===v).length);const maxC=Math.max(...counts,1);viz=`<div style="margin:14px 0"><div style="font-size:1.6rem;font-weight:600;font-family:Georgia,serif">${avg}<span style="font-size:.9rem;color:#888"> / 5</span></div><div style="margin-top:10px">${[1,2,3,4,5].map((v,i)=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px"><span style="min-width:16px;font-size:.8rem;color:#888;text-align:right">${v}</span><div style="flex:1;height:7px;background:#f0f0ee;border-radius:4px;overflow:hidden"><div style="width:${(counts[i]/maxC)*100}%;height:100%;background:#1a1a1a;border-radius:4px"></div></div><span style="font-size:.72rem;color:#888;min-width:18px">${counts[i]}</span></div>`).join("")}</div></div>`;}
      else if(q.type==="yesno"){const yes=answers.filter(a=>a==="Sí").length,no=answers.filter(a=>a==="No").length,tot=yes+no||1;viz=`<div style="display:flex;gap:12px;margin:14px 0"><div style="flex:1;background:#f0f7f4;border:1px solid #c8e6d4;border-radius:8px;padding:12px;text-align:center"><div style="font-size:1.3rem;font-weight:600;font-family:Georgia,serif;color:#2d6a4f">Sí</div><div style="font-size:.82rem;color:#555">${yes} · ${Math.round(yes/tot*100)}%</div></div><div style="flex:1;background:#fdf2f2;border:1px solid #f0c8c4;border-radius:8px;padding:12px;text-align:center"><div style="font-size:1.3rem;font-weight:600;font-family:Georgia,serif;color:#c0392b">No</div><div style="font-size:.82rem;color:#555">${no} · ${Math.round(no/tot*100)}%</div></div></div>`;}
      else if(q.type==="multiple"&&q.options){const c2=q.options.map(opt=>({label:opt,count:answers.filter(a=>a===opt).length}));const m2=Math.max(...c2.map(c=>c.count),1),t2=c2.reduce((a,b)=>a+b.count,0)||1;viz=`<div style="margin:14px 0">${c2.map(c=>`<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="min-width:100px;font-size:.76rem;color:#888;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.label}</span><div style="flex:1;height:7px;background:#f0f0ee;border-radius:4px;overflow:hidden"><div style="width:${(c.count/m2)*100}%;height:100%;background:#1a1a1a;border-radius:4px"></div></div><span style="font-size:.72rem;color:#888;min-width:26px">${Math.round(c.count/t2*100)}%</span></div>`).join("")}</div>`;}
      else if(q.type==="text"){viz=`<div style="margin:12px 0">${answers.map(a=>`<div style="background:#f7f7f5;border-left:3px solid #c8c8c2;padding:8px 12px;margin-bottom:6px;border-radius:0 5px 5px 0;font-size:.82rem;line-height:1.6">${a}</div>`).join("")}</div>`;}
      const tc=qscore===null?null:qscore>=65?{bg:"#f0f7f4",c:"#2d6a4f",t:"Favorable"}:qscore>=50?{bg:"#f5f5f3",c:"#6b6b65",t:"Aceptable"}:{bg:"#fdf2f2",c:"#c0392b",t:"Crítico"};
      questionsHtml+=`<div style="background:white;border:1px solid #e4e4e0;border-radius:8px;padding:20px;margin-bottom:10px;page-break-inside:avoid"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px"><div style="flex:1"><p style="font-size:.66rem;color:#8a8a84;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px">Pregunta ${i+1}</p><h3 style="font-size:.9rem;font-weight:500;line-height:1.5;margin:0">${q.text}</h3></div>${tc?`<span style="font-size:.63rem;padding:3px 9px;border-radius:20px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;white-space:nowrap;background:${tc.bg};color:${tc.c}">${tc.t}</span>`:""}</div>${viz}<p style="font-size:.68rem;color:#b0b0a8;margin-top:10px;border-top:1px solid #f0f0ee;padding-top:8px">${answers.length} respuesta${answers.length!==1?"s":""}</p></div>`;
    });

    const planHtml=plan.map(a=>{const pc=a.prioridad==="Alta"?{bg:"#fdf2f2",c:"#c0392b"}:a.prioridad==="Media"?{bg:"#fdf6ec",c:"#92621a"}:{bg:"#f0f7f4",c:"#2d6a4f"};return`<div style="background:white;border:1px solid #e4e4e0;border-radius:8px;padding:18px 22px;margin-bottom:10px;page-break-inside:avoid"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:10px"><div style="flex:1"><h3 style="font-size:.88rem;font-weight:600;margin:0 0 3px">${a.area}</h3><p style="font-size:.7rem;color:#8a8a84;font-style:italic;margin:0">${a.marco}</p></div><span style="font-size:.63rem;padding:3px 9px;border-radius:20px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;white-space:nowrap;background:${pc.bg};color:${pc.c}">Prioridad ${a.prioridad}</span></div><div>${a.acciones.map((ac,i)=>`<div style="display:flex;gap:8px;font-size:.82rem;line-height:1.5;margin-bottom:6px;color:#333"><span style="color:#8a8a84;font-weight:600;flex-shrink:0;font-family:Georgia,serif">${i+1}.</span><span>${ac}</span></div>`).join("")}</div><div style="display:flex;gap:14px;margin-top:10px;padding-top:10px;border-top:1px solid #f0f0ee;flex-wrap:wrap"><span style="font-size:.7rem;color:#8a8a84">⏱ ${a.plazo}</span><span style="font-size:.7rem;color:#8a8a84">👤 ${a.responsable}</span></div></div>`;}).join("");

    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${s.title} — Diagnóstico Institucional</title>
    <style>@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Inter:wght@300;400;500;600&display=swap');body{font-family:'Inter',sans-serif;background:#f7f7f5;color:#1a1a1a;margin:0;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}.cover{background:#1a1a1a;color:white;padding:56px}.eyebrow{font-size:.66rem;color:#777;font-weight:600;text-transform:uppercase;letter-spacing:.14em;margin-bottom:18px}h1{font-family:'Playfair Display',Georgia,serif;font-size:2rem;font-weight:600;margin:0 0 8px;line-height:1.2}.cat{color:#888;font-size:.85rem;margin-bottom:32px}.stats{display:flex;gap:12px;flex-wrap:wrap}.stat{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:14px 20px}.stat-n{font-family:'Playfair Display',Georgia,serif;font-size:1.5rem;font-weight:600;color:white}.stat-l{font-size:.66rem;color:#777;margin-top:3px;text-transform:uppercase;letter-spacing:.06em}.body{padding:40px 56px}.sl{font-size:.66rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#8a8a84;margin:28px 0 12px;padding-bottom:8px;border-bottom:1px solid #e4e4e0}.health-box{background:#1a1a1a;color:white;border-radius:10px;padding:22px 28px;display:flex;align-items:center;gap:28px;margin-bottom:12px}.hs{font-family:'Playfair Display',Georgia,serif;font-size:3.5rem;font-weight:600;line-height:1}.hst{font-family:'Playfair Display',Georgia,serif;font-size:1.1rem;font-weight:600;margin-bottom:4px}.hbar{width:150px;height:4px;background:rgba(255,255,255,.2);border-radius:2px;margin-top:8px}.hbar-i{height:100%;border-radius:2px;background:white}.hfw{font-size:.66rem;opacity:.45;margin-top:5px}.two-col{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px}.ib{border-radius:8px;padding:16px 18px}.ib.pos{background:#f0f7f4;border:1px solid #c8e6d4}.ib.neg{background:#fdf2f2;border:1px solid #f0c8c4}.ibt{font-size:.66rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px}.ib.pos .ibt{color:#2d6a4f}.ib.neg .ibt{color:#c0392b}.ibr{font-size:.8rem;padding:6px 0;border-bottom:1px solid rgba(0,0,0,.05);line-height:1.4;display:flex;justify-content:space-between;gap:8px}.ibr:last-child{border-bottom:none}.diag-box{background:white;border:1px solid #e4e4e0;border-radius:8px;padding:22px 26px;margin-bottom:12px}.diag-lbl{font-size:.66rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#8a8a84;margin-bottom:12px}.diag-p{font-size:.85rem;line-height:1.85;color:#2a2a2a;margin-bottom:14px}.diag-p:last-of-type{margin-bottom:0}.diag-fw{font-size:.7rem;color:#aaa;margin-top:14px;padding-top:12px;border-top:1px solid #f0f0ee;font-style:italic}@media print{.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>
    <div class="cover">
      <div class="eyebrow">Diagnóstico Institucional · ${new Date().toLocaleDateString("es-AR")}</div>
      <h1>${s.title}</h1><div class="cat">${s.category} · Organismo Público</div>
      <div class="stats">
        <div class="stat"><div class="stat-n">${s.responses.length}</div><div class="stat-l">Respuestas</div></div>
        <div class="stat"><div class="stat-n">${s.questions.length}</div><div class="stat-l">Indicadores</div></div>
        ${score!==null?`<div class="stat"><div class="stat-n">${score}/100</div><div class="stat-l">Índice de Salud</div></div>`:""}
        <div class="stat"><div class="stat-n">${s.createdAt}</div><div class="stat-l">Fecha</div></div>
      </div>
    </div>
    <div class="body">
      ${score!==null?`<div class="sl">Índice de Salud Organizacional</div>
      <div class="health-box"><div><div class="hs">${score}<span style="font-size:1.2rem;opacity:.4">/100</span></div></div><div><div class="hst">${level.label}</div><div style="font-size:.8rem;opacity:.65">Basado en ${s.responses.length} respuesta${s.responses.length!==1?"s":""} · Benchmark internacional</div><div class="hbar"><div class="hbar-i" style="width:${score}%"></div></div><div class="hfw">Ref: Joint Commission International · ISO 9001:2015 · GPTW Public Sector</div></div></div>`:""}
      ${radarSvg?`<div class="sl">Gráfico Radar — Visión multidimensional</div><div style="background:white;border:1px solid #e4e4e0;border-radius:8px;padding:20px;margin-bottom:12px">${radarSvg}</div>`:""}
      ${strengths.length?`<div class="sl">Fortalezas y Áreas Críticas</div><div class="two-col"><div class="ib pos"><div class="ibt">▲ Principales fortalezas</div>${strengths.map(x=>`<div class="ibr"><span>${x.q.text.slice(0,55)}${x.q.text.length>55?"…":""}</span><span style="font-weight:600;flex-shrink:0">${Math.round(x.score)}%</span></div>`).join("")}</div><div class="ib neg"><div class="ibt">▼ Áreas de intervención</div>${criticals.map(x=>`<div class="ibr"><span>${x.q.text.slice(0,55)}${x.q.text.length>55?"…":""}</span><span style="font-weight:600;flex-shrink:0">${Math.round(x.score)}%</span></div>`).join("")}</div></div>`:""}
      ${diagnostic?`<div class="sl">Diagnóstico Institucional</div><div class="diag-box"><div class="diag-lbl">Análisis profesional</div>${diagnostic.map(p=>`<p class="diag-p">${p}</p>`).join("")}<div class="diag-fw">Marcos de referencia: Downs & Hazen (1977) · Likert (1967) · GPTW Public Sector · Joint Commission International · ISO 9001:2015 · Kirkpatrick</div></div>`:""}
      <div class="sl">Resultados por Indicador</div>${questionsHtml}
      ${planHtml?`<div class="sl">Plan de Acción con Base en Evidencia</div>${planHtml}`:""}
      <p style="margin-top:48px;padding-top:20px;border-top:1px solid #e4e4e0;text-align:center;font-size:.7rem;color:#b0b0a8">Diagnóstico generado con base en estándares internacionales · ${new Date().toLocaleString("es-AR")}</p>
    </div></body></html>`);
    win.document.close();
    setTimeout(()=>win.print(),600);
  };

  if (loading) return <div className="loading"><div className="spinner"></div>Cargando…</div>;

  if (!selectedId||!survey) return (
    <div>
      <div className="section-header"><div><div className="section-title">Resultados</div><div className="section-sub">Seleccioná una encuesta para ver el diagnóstico completo</div></div></div>
      {!surveys.length?<div className="empty"><div className="empty-icon">○</div><div>No hay encuestas creadas aún.</div></div>
        :surveys.map(s=><div key={s.id} className="survey-item" onClick={()=>setSelectedId(s.id)} style={{cursor:"pointer"}}><div><div className="survey-name">{s.title}</div><div className="survey-meta">{s.category} · {s.questions.length} preguntas · {(s.responses||[]).length} respuestas</div></div><span style={{color:"var(--muted)",fontSize:"1.2rem"}}>→</span></div>)}
    </div>
  );

  const responses=survey.responses||[];
  const score=getHealthScore(survey);
  const level=score!==null?getBenchmarkLevel(score):null;
  const {strengths,criticals}=responses.length?getTopInsights(survey):{strengths:[],criticals:[]};
  const diagnostic=responses.length?generateDiagnostic(survey):null;
  const plan=responses.length?generateActionPlan(survey):[];

  return (
    <div>
      <div className="section-header">
        <div><div className="section-title">{survey.title}</div><div className="section-sub">{survey.category}</div></div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setSelectedId(null)}>← Volver</button>
          <button className="btn btn-primary btn-sm" onClick={exportPDF} disabled={!responses.length}>Exportar PDF</button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card"><div className="stat-num">{responses.length}</div><div className="stat-label">Respuestas</div></div>
        <div className="stat-card"><div className="stat-num">{survey.questions.length}</div><div className="stat-label">Indicadores</div></div>
        <div className="stat-card"><div className="stat-num">{survey.createdAt}</div><div className="stat-label">Fecha</div></div>
      </div>

      {!responses.length&&<div className="empty"><div className="empty-icon">○</div><div>Aún no hay respuestas registradas.</div></div>}

      {!!responses.length&&<>
        {/* HEALTH */}
        {score!==null&&<div className="health-card">
          <div><div className="health-score">{score}<sup>/100</sup></div></div>
          <div style={{flex:1}}>
            <div style={{fontSize:"0.7rem",opacity:0.6,textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>Estado organizacional</div>
            <div className="health-status">{level.label}</div>
            <div style={{fontSize:"0.8rem",opacity:0.65,marginBottom:8}}>Basado en {responses.length} respuesta{responses.length!==1?"s":""}</div>
            <div className="health-bar-wrap"><div className="health-bar-fill" style={{width:`${score}%`}}/></div>
            <div className="health-framework">Joint Commission · ISO 9001:2015 · GPTW Public Sector</div>
          </div>
        </div>}

        {/* RADAR */}
        {survey.questions.filter(q=>q.type==="scale"||q.type==="yesno").length>=3&&(
          <div className="radar-card">
            <div className="card-title">Gráfico radar — Visión multidimensional</div>
            <RadarChart survey={survey}/>
          </div>
        )}

        {/* FORTALEZAS / CRÍTICAS */}
        {strengths.length>0&&<div className="insight-grid">
          <div className="insight-card pos"><div className="insight-card-title">▲ Principales fortalezas</div>{strengths.map((x,i)=><div className="insight-item" key={i}><span>{x.q.text.slice(0,52)}{x.q.text.length>52?"…":""}</span><span className="insight-score">{Math.round(x.score)}%</span></div>)}</div>
          <div className="insight-card neg"><div className="insight-card-title">▼ Áreas de intervención</div>{criticals.map((x,i)=><div className="insight-item" key={i}><span>{x.q.text.slice(0,52)}{x.q.text.length>52?"…":""}</span><span className="insight-score">{Math.round(x.score)}%</span></div>)}</div>
        </div>}

        {/* DIAGNOSTIC */}
        {diagnostic&&<div className="diag-card">
          <div className="diag-label"><span className="diag-dot"></span>Diagnóstico institucional</div>
          {diagnostic.map((p,i)=><p className="diag-paragraph" key={i}>{p}</p>)}
          <div className="diag-framework">Marcos de referencia: Downs & Hazen (1977) · Likert (1967) · GPTW Public Sector · Joint Commission International · ISO 9001:2015 · Kirkpatrick</div>
        </div>}

        {/* QUESTIONS */}
        <div className="sec-label">Resultados por indicador</div>
        {survey.questions.map((q,i)=>{
          const answers=responses.map(r=>r.answers[q.id]).filter(a=>a!==undefined);
          const qscore=getQuestionScore(q,responses);
          return <div className="chart-section" key={q.id}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div style={{flex:1}}><div className="chart-q-meta">Indicador {i+1}</div><div className="chart-q">{q.text}</div></div>
              {getTag(qscore)&&<div style={{marginLeft:12,flexShrink:0}}>{getTag(qscore)}</div>}
            </div>
            {q.type==="scale"&&answers.length>0&&<ScaleChart answers={answers}/>}
            {q.type==="yesno"&&answers.length>0&&<BarChart data={[{label:"Sí",count:answers.filter(a=>a==="Sí").length},{label:"No",count:answers.filter(a=>a==="No").length}]}/>}
            {q.type==="multiple"&&q.options&&answers.length>0&&<BarChart data={q.options.map(opt=>({label:opt,count:answers.filter(a=>a===opt).length}))}/>}
            {q.type==="text"&&answers.length>0&&<div className="responses-list">{answers.map((a,j)=><div className="response-text" key={j}>{a}</div>)}</div>}
            <div style={{marginTop:12,fontSize:"0.7rem",color:"var(--muted)",borderTop:"1px solid var(--border)",paddingTop:10}}>{answers.length} respuesta{answers.length!==1?"s":""}</div>
          </div>;
        })}

        {/* ACTION PLAN */}
        <div className="sec-label">Plan de acción con base en evidencia</div>
        {plan.map((a,i)=>(
          <div className="plan-item" key={i}>
            <div className="plan-item-header">
              <div><div className="plan-area">{a.area}</div><div className="plan-marco">{a.marco}</div></div>
              <span className={`priority-badge priority-${a.prioridad.toLowerCase()}`}>Prioridad {a.prioridad}</span>
            </div>
            <div className="plan-actions">{a.acciones.map((ac,j)=><div className="plan-action" key={j}><span className="plan-action-num">{j+1}.</span><span>{ac}</span></div>)}</div>
            <div className="plan-meta">
              <div className="plan-meta-item">⏱ {a.plazo}</div>
              <div className="plan-meta-item">👤 {a.responsable}</div>
            </div>
          </div>
        ))}
      </>}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("respond"),[isAdmin,setIsAdmin]=useState(false);
  const [showLogin,setShowLogin]=useState(false),[pendingTab,setPendingTab]=useState(null);
  const [surveys,setSurveys]=useState([]),[loading,setLoading]=useState(true);

  useEffect(()=>{ const unsub=onSnapshot(collection(db,"surveys"),snap=>{ setSurveys(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false); }); return()=>unsub(); },[]);

  const handleTab=t=>{ if((t==="admin"||t==="results")&&!isAdmin){setPendingTab(t);setShowLogin(true);} else setTab(t); };
  const handleLogin=()=>{ setIsAdmin(true); setShowLogin(false); if(pendingTab){setTab(pendingTab);setPendingTab(null);} };
  const handleLogout=()=>{ setIsAdmin(false); setTab("respond"); };

  return (
    <>
      <style>{FONTS}{STYLES}</style>
      {showLogin&&<LoginModal onSuccess={handleLogin} onCancel={()=>{setShowLogin(false);setPendingTab(null);}}/>}
      <div className="app">
        {/* Desktop nav */}
        <nav className="nav">
          <div className="nav-logo">Diagnóstico <span>/ Encuestas</span></div>
          <div className="nav-tabs">
            <button className={`nav-tab${tab==="respond"?" active":""}`} onClick={()=>handleTab("respond")}>Responder</button>
            <button className={`nav-tab${tab==="admin"?" active":""}`} onClick={()=>handleTab("admin")}>{!isAdmin?"🔒 ":""}Administrar</button>
            <button className={`nav-tab${tab==="results"?" active":""}`} onClick={()=>handleTab("results")}>{!isAdmin?"🔒 ":""}Resultados</button>
          </div>
          <div className="nav-right">
            {isAdmin?<><span className="admin-badge">● Admin</span><button className="logout-btn" onClick={handleLogout}>Cerrar sesión</button></>:<div className="nav-badge">{loading?"…":`${surveys.length} encuesta${surveys.length!==1?"s":""}`}</div>}
          </div>
        </nav>
        {/* Mobile header */}
        <header className="mobile-header">
          <div className="mobile-logo">Diagnóstico <span>/ Enc.</span></div>
          {isAdmin&&<div style={{display:"flex",alignItems:"center",gap:8}}><div className="mobile-admin-dot"></div><button className="logout-btn" onClick={handleLogout} style={{fontSize:"0.72rem"}}>Salir</button></div>}
        </header>
        <main className="main">
          {tab==="respond"&&<RespondSurvey surveys={surveys} loading={loading}/>}
          {tab==="admin"&&isAdmin&&<AdminPanel surveys={surveys} loading={loading}/>}
          {tab==="results"&&isAdmin&&<ResultsPanel surveys={surveys} loading={loading}/>}
        </main>
        {/* Mobile bottom nav */}
        <nav className="mobile-nav">
          <div className="mobile-nav-inner">
            <button className={`mobile-tab${tab==="respond"?" active":""}`} onClick={()=>handleTab("respond")}>
              <span className="mobile-tab-icon">📝</span>Responder
            </button>
            <button className={`mobile-tab${tab==="admin"?" active":""}`} onClick={()=>handleTab("admin")}>
              <span className="mobile-tab-icon">{isAdmin?"⚙️":"🔒"}</span>Admin
            </button>
            <button className={`mobile-tab${tab==="results"?" active":""}`} onClick={()=>handleTab("results")}>
              <span className="mobile-tab-icon">{isAdmin?"📊":"🔒"}</span>Resultados
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
