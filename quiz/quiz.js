class QuizGame {
  constructor() {
    this.currentIndex = 0;
    this.cases = [];
    this.score = 0;
    this.labels = [];
    this.modoSelecionado = "aleatorio";
    if (typeof document !== "undefined") {
      document.addEventListener("keyup", this.handleKeyup.bind(this));
    }
  }

  async carregarClasses() {
    try {
      const response = await fetch("../classes.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.labels = await response.json();
      this.popularSelecao();
    } catch (error) {
      console.error("Erro ao carregar classes:", error);
    }
  }

  popularSelecao() {
    const select = document.getElementById("modo-selecao");
    if (!select) return;
    this.labels.forEach(label => {
      const option = document.createElement("option");
      option.value = label;
      option.textContent = `${labelEmojis[label] || ""} ${labelNames[label] || label}`;
      select.appendChild(option);
    });
  }

  async loadQuiz() {
    try {
      const response = await fetch("quiz_cases.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.cases = await response.json();
      this.aplicarFiltroOuAleatorio(this.modoSelecionado);
      this.currentIndex = 0;
      this.score = 0;
      this.loadCase(this.currentIndex);
    } catch (error) {
      const feedbackEl = document.getElementById("feedback");
      if (feedbackEl) {
        feedbackEl.innerText = "Erro ao carregar quiz.";
        feedbackEl.classList.add("text-danger");
      }
      console.error("Erro ao carregar quiz:", error);
    }
  }

  aplicarFiltroOuAleatorio(modo = "aleatorio") {
    if (modo === "aleatorio") {
      this.shuffle(this.cases);
    } else if (this.labels.includes(modo)) {
      this.cases = this.cases.filter(c => c.true_label === modo);
    }
  }

  shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  mudarModo(novoModo) {
    this.modoSelecionado = novoModo;
    this.loadQuiz();
  }

  loadCase(index) {
    const caso = this.cases[index];
    document.getElementById("quiz-image").src = "data:image/jpeg;base64," + caso.img_base64;

    const nextBtn = document.getElementById("next-btn");
    if (nextBtn) nextBtn.style.display = "none";
    const summary = document.getElementById("summary");
    if (summary) summary.innerText = "";

    const container = document.getElementById("options");
    container.innerHTML = "";

    this.labels.forEach((label, idx) => {
      const btn = document.createElement("button");
      btn.className = `btn btn-outline-${classeEstilo[label]} mb-2 option-btn`;
      btn.dataset.label = label;
      btn.innerText = labelNames[label] || label;
      btn.onclick = () => this.validateAnswer(label, caso);
      btn.tabIndex = idx + 1;
      container.appendChild(btn);
    });

    document.getElementById("feedback").innerText = "";
    document.getElementById("progresso").innerText = `Caso ${index + 1} de ${this.cases.length}`;

    const progressBar = document.getElementById("progress-bar");
    if (progressBar) {
      const percent = (index / this.cases.length) * 100;
      progressBar.style.width = `${percent}%`;
      progressBar.setAttribute("aria-valuenow", percent);
    }
  }

  handleKeyup(event) {
    const options = document.querySelectorAll('#options .option-btn');
    const num = parseInt(event.key, 10);
    if (num >= 1 && num <= options.length) {
      options[num - 1].click();
    } else if (event.key === 'Enter') {
      const focused = document.activeElement;
      if (focused && focused.classList.contains('option-btn')) {
        focused.click();
      }
    }
  }

  validateAnswer(resposta, caso) {
    const certo = resposta === caso.true_label;
    if (certo) this.score++;

    const buttons = document.querySelectorAll("#options .option-btn");
    buttons.forEach(btn => {
      btn.disabled = true;
      const lbl = btn.dataset.label;
      btn.className = `btn mb-2 option-btn`;
      if (lbl === caso.true_label) {
        btn.classList.add("btn-success");
      } else if (lbl === resposta) {
        btn.classList.add("btn-danger");
      } else {
        btn.classList.add(`btn-outline-${classeEstilo[lbl]}`);
      }
    });

    const feedback = certo
      ? "✅ Correto!"
      : `❌ Errado! Era: ${labelNames[caso.true_label] || caso.true_label}`;
    document.getElementById("feedback").innerText = feedback;

    this.saveFeedback(caso.filename, caso.predicted, resposta, caso.true_label);

    const nextBtn = document.getElementById("next-btn");
    if (nextBtn) nextBtn.style.display = "block";
  }

  nextCase() {
    this.currentIndex++;
    if (this.currentIndex < this.cases.length) {
      this.loadCase(this.currentIndex);
    } else {
      const progressBar = document.getElementById("progress-bar");
      if (progressBar) {
        progressBar.style.width = "100%";
        progressBar.setAttribute("aria-valuenow", 100);
      }
      const summary = document.getElementById("summary");
      if (summary) {
        summary.innerText = `🎉 Fim do quiz! Você acertou ${this.score} de ${this.cases.length}.`;
      }
      const nextBtn = document.getElementById("next-btn");
      if (nextBtn) nextBtn.style.display = "none";
    }
  }

  saveFeedback(nome, predicted, resposta, real) {
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

  exportarFeedbacks() {
    const data = localStorage.getItem("feedbacks");
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "feedback_log.json";
    a.click();
  }

  async modoRevisaoErros() {
    const historico = JSON.parse(localStorage.getItem("feedbacks") || "[]");
    if (!historico.length) {
      alert("Nenhum erro encontrado nos feedbacks anteriores.");
      return;
    }

    const agrupado = {};
    historico.forEach(registro => {
      const existente = agrupado[registro.filename];
      if (!existente || new Date(registro.timestamp) > new Date(existente.timestamp)) {
        agrupado[registro.filename] = registro;
      }
    });
    const recentes = Object.values(agrupado);

    const erros = recentes.filter(r => r.user_answer !== r.real_label);
    if (!erros.length) {
      alert("Todos os casos anteriores estavam corretos! Parabéns!");
      return;
    }

    try {
      const response = await fetch("quiz_cases.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.cases = await response.json();
    } catch (error) {
      console.error("Erro ao recarregar quiz:", error);
      alert("Erro ao carregar casos para revisão.");
      return;
    }

    const filenamesErro = erros.map(e => e.filename);
    this.cases = this.cases.filter(c => filenamesErro.includes(c.filename));
    this.currentIndex = 0;
    this.score = 0;
    this.loadCase(this.currentIndex);
  }
}

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
  "nao_otoscopica": "⚠️"
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = QuizGame;
}

if (typeof window !== "undefined") {
  window.onload = async () => {
    window.quizGame = new QuizGame();
    await window.quizGame.carregarClasses();
    await window.quizGame.loadQuiz();
  };
}

