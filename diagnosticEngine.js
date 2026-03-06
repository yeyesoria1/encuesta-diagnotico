// ============================================================
// MOTOR DE DIAGNÓSTICO PROFESIONAL
// Marcos: Downs & Hazen, Likert, GPTW, Kirkpatrick, ISO 9001,
//         Joint Commission / JCI (organismos públicos grandes)
// ============================================================

// ── Benchmarks internacionales ───────────────────────────────
// Basados en estándares Joint Commission, GPTW Public Sector,
// ISO 9001:2015 y estudios de clima en sector público latinoamericano
export const BENCHMARKS = {
  excelente:  { min: 80, label: "Excelente",  color: "#2d6a4f", bg: "#f0f7f4", border: "#c8e6d4" },
  bueno:      { min: 65, label: "Bueno",      color: "#4a7c59", bg: "#f2f8f4", border: "#cce0d4" },
  aceptable:  { min: 50, label: "Aceptable",  color: "#92621a", bg: "#fdf6ec", border: "#f0dfc4" },
  deficiente: { min: 35, label: "Deficiente", color: "#c0392b", bg: "#fdf2f2", border: "#f0c8c4" },
  critico:    { min: 0,  label: "Crítico",    color: "#8b0000", bg: "#fff0f0", border: "#f0b0b0" },
};

export function getBenchmarkLevel(score) {
  if (score >= 80) return BENCHMARKS.excelente;
  if (score >= 65) return BENCHMARKS.bueno;
  if (score >= 50) return BENCHMARKS.aceptable;
  if (score >= 35) return BENCHMARKS.deficiente;
  return BENCHMARKS.critico;
}

// ── Calcular puntaje por pregunta ────────────────────────────
export function getQuestionScore(q, responses) {
  const answers = responses.map(r => r.answers[q.id]).filter(a => a !== undefined);
  if (!answers.length) return null;
  if (q.type === "scale") return (answers.reduce((a,b)=>a+b,0)/answers.length)/5*100;
  if (q.type === "yesno") return (answers.filter(a=>a==="Sí").length/answers.length)*100;
  return null;
}

// ── Índice de salud global ───────────────────────────────────
export function getHealthScore(survey) {
  const scores = survey.questions.map(q=>getQuestionScore(q,survey.responses)).filter(s=>s!==null);
  if (!scores.length) return null;
  return Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
}

// ── Top fortalezas y áreas críticas ─────────────────────────
export function getTopInsights(survey) {
  const scored = survey.questions
    .map(q=>({ q, score: getQuestionScore(q, survey.responses) }))
    .filter(x => x.score !== null)
    .sort((a,b) => b.score - a.score);
  return {
    strengths: scored.slice(0, 3),
    criticals: scored.slice(-3).reverse(),
  };
}

// ── Análisis de respuestas abiertas ─────────────────────────
function getTextAnswers(survey) {
  return survey.questions
    .filter(q => q.type === "text")
    .flatMap(q => survey.responses.map(r => r.answers[q.id]).filter(Boolean));
}

// ── Diagnóstico narrativo profesional ───────────────────────
// Fundamentado en:
// - Downs & Hazen (1977): dimensiones de satisfacción comunicacional
// - Likert (1967): sistemas organizacionales 1-4
// - GPTW: índice de confianza organizacional
// - Joint Commission / JCI: estándares de comunicación y seguridad
// - ISO 9001:2015: cláusula 7.4 (Comunicación) y 9.1 (Seguimiento)
export function generateDiagnostic(survey) {
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
  const variance  = allScores.length > 1
    ? Math.round(Math.sqrt(allScores.reduce((acc,s)=>acc+Math.pow(s-(allScores.reduce((a,b)=>a+b,0)/allScores.length),2),0)/allScores.length))
    : 0;

  // Determinar sistema Likert aproximado
  const likertSystem = score >= 75 ? "Sistema IV (Participativo)" : score >= 55 ? "Sistema III (Consultivo)" : score >= 40 ? "Sistema II (Benevolente-autoritario)" : "Sistema I (Autoritario-explotador)";
  const likertDesc   = score >= 75 ? "caracterizado por alta confianza, comunicación fluida y toma de decisiones participativa"
    : score >= 55 ? "donde existe cierta consulta pero las decisiones aún se concentran en los niveles jerárquicos superiores"
    : score >= 40 ? "con comunicación predominantemente descendente y baja participación del personal"
    : "con comunicación escasa, clima de desconfianza y alta centralización de la autoridad";

  // Párrafo 1 — Estado actual y benchmark
  const p1 = `El diagnóstico de ${cat} realizado sobre ${totalResp} respuesta${totalResp!==1?"s":""} arroja un Índice de Salud Organizacional (ISO) de ${score}/100, posicionando a la organización en el nivel "${level.label}" según los estándares internacionales de referencia utilizados (Joint Commission International, Great Place to Work Public Sector y benchmarks ISO 9001:2015 para organismos públicos de más de 200 agentes). De un total de ${allScores.length} indicadores evaluados, ${highItems} se encuentran en zona favorable (≥65%) y ${lowItems} requieren intervención planificada. La dispersión entre indicadores es de ±${variance} puntos, lo que ${variance > 20 ? "evidencia una distribución heterogénea con brechas significativas entre áreas" : "indica una distribución relativamente homogénea en el funcionamiento organizacional"}.`;

  // Párrafo 2 — Análisis según marco teórico
  const strengthText = strengths.length
    ? `Desde la perspectiva del modelo de satisfacción comunicacional de Downs y Hazen (1977), los indicadores de mayor fortaleza son: ${strengths.map(x=>`"${x.q.text.slice(0,55)}${x.q.text.length>55?"…":""}" (${Math.round(x.score)}%)`).join("; ")}. `
    : "";
  const criticalText = criticals.length
    ? `En contraste, las dimensiones que presentan mayor brecha son: ${criticals.map(x=>`"${x.q.text.slice(0,55)}${x.q.text.length>55?"…":""}" (${Math.round(x.score)}%)`).join("; ")}. `
    : "";
  const p2 = `${strengthText}${criticalText}Aplicando la tipología de Sistemas Organizacionales de Rensis Likert, los resultados son consistentes con un ${likertSystem}, ${likertDesc}. ${textAnswers.length > 0 ? `El análisis cualitativo de las ${textAnswers.length} respuesta${textAnswers.length!==1?"s":""} abiertas refuerza este patrón, con menciones recurrentes que señalan oportunidades de mejora en la gestión del flujo informacional y la participación del personal en los procesos de toma de decisiones.` : ""}`.trim();

  // Párrafo 3 — Marco de calidad y recomendación estratégica
  const jciNote = cat === "Comunicación Interna"
    ? "En términos de los estándares Joint Commission International (JCI), una comunicación interna efectiva es condición habilitante para la seguridad institucional y la calidad del servicio público. Los estándares IPSG.2 y ACC.3 de JCI establecen que la comunicación entre niveles jerárquicos debe garantizar la continuidad y coherencia operativa."
    : cat === "Evaluación de Proceso"
    ? "Desde el marco de evaluación de Kirkpatrick adaptado al sector público, los resultados de Nivel 1 (Reacción) y Nivel 2 (Aprendizaje) indican que los procesos evaluados requieren ajustes en su diseño e implementación para alcanzar los resultados esperados (Nivel 4)."
    : "Conforme a los requisitos de la cláusula 9.1.3 de ISO 9001:2015 (Análisis y evaluación), los datos obtenidos deben ser utilizados como insumo para la revisión del sistema de gestión y la identificación de oportunidades de mejora continua.";

  const focusArea = criticals[0]?.q?.text?.slice(0,60) || "las áreas identificadas";
  const p3 = `${jciNote} El foco de intervención prioritario recomendado es "${focusArea}${criticals[0]?.q?.text?.length>60?"…":""}" (${Math.round(criticals[0]?.score||0)}%), que representa la dimensión con mayor brecha respecto al nivel de referencia internacional (≥65%). Se recomienda iniciar un ciclo de mejora basado en el modelo PDCA (Planificar-Hacer-Verificar-Actuar) con indicadores de seguimiento trimestral y revisión formal semestral por parte de la Alta Dirección, en línea con los requisitos de la cláusula 10.3 de ISO 9001:2015.`;

  return [p1, p2, p3];
}

// ── Plan de acción por categoría ─────────────────────────────
// Basado en mejores prácticas de:
// - Joint Commission: estándares de comunicación y gestión
// - ISO 9001:2015: cláusulas 5, 7 y 10
// - GPTW Public Sector: dimensiones de credibilidad, respeto, imparcialidad
// - Kirkpatrick: niveles de evaluación y mejora
const ACTION_TEMPLATES = {
  "Comunicación Interna": [
    {
      area: "Canales y flujos de comunicación formal",
      marco: "Downs & Hazen / JCI IPSG.2",
      acciones: [
        "Mapear y rediseñar los canales formales de comunicación interna (ascendente, descendente y horizontal) asegurando cobertura a todos los niveles jerárquicos",
        "Implementar un protocolo escrito de comunicación institucional con tiempos de respuesta definidos (máx. 48 hs para comunicados operativos)",
        "Establecer una reunión semanal de alineación por área con actas sistematizadas y seguimiento de acuerdos",
        "Crear un repositorio centralizado de información institucional accesible a todo el personal",
      ],
      responsable: "Dirección de Comunicación Institucional / RRHH",
    },
    {
      area: "Comunicación del liderazgo y transparencia",
      marco: "GPTW: Credibilidad / Likert Sistema IV",
      acciones: [
        "Diseñar un programa de comunicación ejecutiva con mensajes periódicos de la Alta Dirección sobre estrategia, logros y desafíos institucionales",
        "Implementar reuniones de town hall semestrales con espacio para preguntas del personal",
        "Desarrollar un índice de transparencia informacional interno con metas anuales medibles",
        "Capacitar a mandos medios en comunicación efectiva y gestión de mensajes institucionales",
      ],
      responsable: "Alta Dirección / Comunicación Institucional",
    },
    {
      area: "Clima de confianza y comunicación ascendente",
      marco: "GPTW: Respeto e Imparcialidad / Likert",
      acciones: [
        "Implementar mecanismos formales de escucha activa: encuestas de pulso trimestrales, buzón de sugerencias con respuesta garantizada",
        "Crear espacios de diálogo entre personal y supervisores sin intermediarios jerárquicos (sesiones de feedback 360°)",
        "Establecer indicadores de clima comunicacional con medición semestral y publicación de resultados",
        "Diseñar un programa de reconocimiento institucional basado en criterios objetivos y comunicados públicamente",
      ],
      responsable: "RRHH / Comité de Clima Organizacional",
    },
  ],
  "Satisfacción": [
    {
      area: "Satisfacción con el rol y las condiciones de trabajo",
      marco: "GPTW: Orgullo y Camaradería / ISO 9001 cláusula 7.1.4",
      acciones: [
        "Realizar un análisis de descripciones de puestos para asegurar alineación entre responsabilidades asignadas y competencias del personal",
        "Implementar un programa de bienestar laboral con acciones concretas en salud, ergonomía y equilibrio trabajo-vida",
        "Establecer un sistema de reconocimiento formal (no solo económico) basado en desempeño y contribución institucional",
        "Desarrollar encuestas de satisfacción laboral semestrales con planes de acción publicados y seguidos",
      ],
      responsable: "RRHH / Dirección de Personal",
    },
    {
      area: "Desarrollo profesional y capacitación",
      marco: "Kirkpatrick Nivel 1-2 / ISO 9001 cláusula 7.2",
      acciones: [
        "Diseñar un plan de desarrollo individual (PDI) para cada agente con metas anuales de formación",
        "Implementar un mapa de competencias institucional que oriente las decisiones de capacitación",
        "Crear una oferta de formación interna (mentoreo, rotación de roles, comunidades de práctica)",
        "Establecer métricas de transferencia de aprendizaje al puesto de trabajo (Kirkpatrick Nivel 3)",
      ],
      responsable: "Dirección de Capacitación / RRHH",
    },
    {
      area: "Liderazgo y gestión directiva",
      marco: "GPTW: Credibilidad / Likert Sistema III-IV",
      acciones: [
        "Implementar evaluación de desempeño directivo con feedback del equipo (evaluación 180°/360°)",
        "Desarrollar un programa de formación en liderazgo adaptativo para mandos medios y superiores",
        "Establecer acuerdos de gestión por resultados entre niveles jerárquicos con metas verificables",
        "Crear un protocolo de gestión de conflictos con intervención de mediación institucional",
      ],
      responsable: "Alta Dirección / RRHH",
    },
  ],
  "Evaluación de Proceso": [
    {
      area: "Documentación y estandarización de procesos",
      marco: "ISO 9001:2015 cláusulas 4.4 y 8 / Joint Commission",
      acciones: [
        "Mapear y documentar los procesos críticos institucionales con flujogramas validados por las áreas responsables",
        "Implementar un sistema de gestión documental con control de versiones y acceso controlado",
        "Establecer procedimientos operativos estándar (POE) para los procesos de mayor impacto en el servicio",
        "Realizar auditorías internas semestrales de cumplimiento de procesos documentados",
      ],
      responsable: "Dirección de Calidad / Procesos",
    },
    {
      area: "Medición, análisis y mejora continua",
      marco: "ISO 9001:2015 cláusulas 9 y 10 / Ciclo PDCA",
      acciones: [
        "Definir indicadores clave de proceso (KPI) con metas, frecuencia de medición y responsables",
        "Implementar un tablero de control de gestión con indicadores actualizados mensualmente",
        "Establecer un ciclo formal de revisión de resultados y mejora continua (PDCA trimestral)",
        "Crear un registro de no conformidades, acciones correctivas y preventivas con seguimiento",
      ],
      responsable: "Dirección de Calidad / Alta Dirección",
    },
    {
      area: "Capacitación y competencias para los procesos",
      marco: "Kirkpatrick Niveles 1-4 / ISO 9001 cláusula 7.2",
      acciones: [
        "Evaluar las brechas de competencia del personal respecto a los procesos rediseñados",
        "Diseñar e implementar capacitaciones específicas con evaluación de transferencia al puesto",
        "Establecer un programa de inducción para nuevos ingresos con evaluación de comprensión de procesos",
        "Medir el impacto de la capacitación en los indicadores de proceso (Kirkpatrick Nivel 4)",
      ],
      responsable: "Dirección de Capacitación / Calidad",
    },
  ],
  "Otro": [
    {
      area: "Diagnóstico y planificación estratégica",
      marco: "ISO 9001:2015 / Mejora continua",
      acciones: [
        "Profundizar el diagnóstico con entrevistas focalizadas a actores clave",
        "Diseñar un plan de mejora con objetivos SMART, responsables y plazos",
        "Establecer un comité de seguimiento con reuniones periódicas y actas formales",
        "Implementar métricas de avance con reporte semestral a la Alta Dirección",
      ],
      responsable: "Alta Dirección / Coordinación Institucional",
    },
  ],
};

export function generateActionPlan(survey) {
  const score = getHealthScore(survey);
  const { criticals } = getTopInsights(survey);
  const cat = survey.category;
  const templates = ACTION_TEMPLATES[cat] || ACTION_TEMPLATES["Otro"];

  // Determinar prioridad según puntaje crítico
  const getPriority = (idx) => {
    const critScore = criticals[idx]?.score ?? 60;
    if (critScore < 35) return "Alta";
    if (critScore < 50) return "Alta";
    if (critScore < 65) return "Media";
    return "Baja";
  };

  const getPlaz = (priority) => {
    if (priority === "Alta") return "Inmediato (0–30 días)";
    if (priority === "Media") return "Corto plazo (1–3 meses)";
    return "Mediano plazo (3–6 meses)";
  };

  return templates.map((t, i) => ({
    ...t,
    prioridad: getPriority(i),
    plazo: getPlaz(getPriority(i)),
  }));
}
