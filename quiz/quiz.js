let currentIndex = 0;
let cases = [];
const labels = ["normal", "otite_media_aguda", "otite_media_cronica", "otite_externa_aguda", "obstrucao", "nao_otoscopica"];

async function loadQuiz() {
  const response = await fetch("quiz_cases.json");
  cases = await response.json();
  loadCase(0);
}

function loadCase(index) {
  const caso = cases[index];
  document.getElementById("quiz-image").src = "data:image/jpeg;base64," + caso.img_base64;
  const container = document.getElementById("options");
  container.innerHTML = "";
  labels.forEach(label => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-primary mb-2";
    btn.innerText = label.replace("_", " ");
    btn.onclick = () => validateAnswer(label, caso);
    container.appendChild(btn);
  });
  document.getElementById("feedback").innerText = "";
}

function validateAnswer(resposta, caso) {
  const certo = resposta === caso.true_label;
  const feedback = certo ? "✅ Correto!" : `❌ Errado! Era: ${caso.true_label}`;
  document.getElementById("feedback").innerText = feedback;
  saveFeedback(caso.filename, caso.predicted, resposta, caso.true_label);
  setTimeout(() => {
    currentIndex++;
    if (currentIndex < cases.length) loadCase(currentIndex);
    else alert("Fim do quiz!");
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
  const blob = new Blob([data], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "feedback_log.json";
  a.click();
}

window.onload = loadQuiz;
