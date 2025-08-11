
let currentIndex = 0;
let cases = [];
let score = 0;

let labels = [];

const labelNames = {
  "normal": "Normal",
  "otite_media_aguda": "Otite Média Aguda",
  "otite_media_cronica": "Otite Média Crônica",
  "otite_externa_aguda": "Otite Externa Aguda",
  "obstrucao": "Obstrução do Canal",
  "nao_otoscopica": "Não é imagem otoscópica"
};

const classeEstilo = {
  "normal": "success",
  "otite_media_aguda": "danger",
  "otite_media_cronica": "warning",
  "otite_externa_aguda": "info",
  "obstrucao": "secondary",
  "nao_otoscopica": "dark"
};

const labelEmojis = {
  "normal": "🟢",
  "otite_media_aguda": "🔴",
  "otite_media_cronica": "🟡",
  "otite_externa_aguda": "🔵",
  "obstrucao": "⚫",
  "nao_otoscopica": "⚠️",
};

// define modo inicial
let modoSelecionado = "aleatorio";

async function carregarClasses() {
  try {
    const response = await fetch("../classes.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    labels = await response.json();
    popularSelecao();
  } catch (error) {
    console.error("Erro ao carregar classes:", error);
  }
}

function popularSelecao() {
  const select = document.getElementById("modo-selecao");
  if (!select) return;
  labels.forEach(label => {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = `${labelEmojis[label] || ""} ${labelNames[label] || label}`;
    select.appendChild(option);
  });
}

async function loadQuiz() {
  try {
    const response = await fetch("quiz_cases.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    cases = await response.json();
    aplicarFiltroOuAleatorio(modoSelecionado);
    currentIndex = 0;
    score = 0;
    loadCase(currentIndex);
  } catch (error) {
    const feedbackEl = document.getElementById("feedback");
    if (feedbackEl) {
      feedbackEl.innerText = "Erro ao carregar quiz.";
      feedbackEl.classList.add("text-danger");
    }
    console.error("Erro ao carregar quiz:", error);
  }
}

function aplicarFiltroOuAleatorio(modo = "aleatorio") {
  if (modo === "aleatorio") {
    shuffle(cases);
  } else if (labels.includes(modo)) {
    cases = cases.filter(c => c.true_label === modo);
  }
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function mudarModo(novoModo) {
  modoSelecionado = novoModo;
  loadQuiz();
}

function loadCase(index) {
  const caso = cases[index];
  document.getElementById("quiz-image").src = "data:image/jpeg;base64," + caso.img_base64;

  const container = document.getElementById("options");
  container.innerHTML = "";

  labels.forEach(label => {
    const btn = document.createElement("button");
    btn.className = `btn btn-outline-${classeEstilo[label]} mb-2`;
    btn.innerText = labelNames[label] || label;
    btn.onclick = () => validateAnswer(label, caso);
    container.appendChild(btn);
  });

  document.getElementById("feedback").innerText = "";
  document.getElementById("progresso").innerText = `Caso ${index + 1} de ${cases.length}`;
}

function validateAnswer(resposta, caso) {
  const certo = resposta === caso.true_label;
  if (certo) score++;

  const feedback = certo
    ? "✅ Correto!"
    : `❌ Errado! Era: ${labelNames[caso.true_label] || caso.true_label}`;
  document.getElementById("feedback").innerText = feedback;

  saveFeedback(caso.filename, caso.predicted, resposta, caso.true_label);

  setTimeout(() => {
    currentIndex++;
    if (currentIndex < cases.length) {
      loadCase(currentIndex);
    } else {
      alert(`🎉 Fim do quiz! Você acertou ${score} de ${cases.length}.`);
    }
  }, 2000);
}

function saveFeedback(nome, predicted, resposta, real) {
  const registro = {
    filename: nome,
    predicted: predicted,
    user_answer: resposta,
    real_label: real,
    timestamp: new Date().toISOString()
  };
  const historico = JSON.parse(localStorage.getItem("feedbacks") || "[]");
  historico.push(registro);
  localStorage.setItem("feedbacks", JSON.stringify(historico));
}

function exportarFeedbacks() {
  const data = localStorage.getItem("feedbacks");
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "feedback_log.json";
  a.click();
}

async function modoRevisaoErros() {
  const historico = JSON.parse(localStorage.getItem("feedbacks") || "[]");
  if (!historico.length) {
    alert("Nenhum erro encontrado nos feedbacks anteriores.");
    return;
  }

  // agrupa por filename e mantém o registro mais recente
  const agrupado = {};
  historico.forEach(registro => {
    const existente = agrupado[registro.filename];
    if (!existente || new Date(registro.timestamp) > new Date(existente.timestamp)) {
      agrupado[registro.filename] = registro;
    }
  });
  const recentes = Object.values(agrupado);

  // pega apenas os erros na tentativa mais recente
  const erros = recentes.filter(r => r.user_answer !== r.real_label);
  if (!erros.length) {
    alert("Todos os casos anteriores estavam corretos! Parabéns!");
    return;
  }

  // recarrega todos os casos antes de filtrar
  try {
    const response = await fetch("quiz_cases.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    cases = await response.json();
  } catch (error) {
    console.error("Erro ao recarregar quiz:", error);
    alert("Erro ao carregar casos para revisão.");
    return;
  }

  // filtra os casos no JSON principal
  const filenamesErro = erros.map(e => e.filename);
  cases = cases.filter(c => filenamesErro.includes(c.filename));
  currentIndex = 0;
  score = 0;
  loadCase(currentIndex);
}

window.onload = async () => {
  await carregarClasses();
  await loadQuiz();
};
