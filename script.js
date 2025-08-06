const useLocalModel = false;

const onlineModelBase = "https://teachablemachine.withgoogle.com/models/AyY1FsbFD/";
const modelURL = useLocalModel ? "model.json" : `${onlineModelBase}model.json`;
const metadataURL = useLocalModel ? "metadata.json" : `${onlineModelBase}metadata.json`;

let model;
let top1Prediction = null;
let base64Image = null;

const labelContainer = document.getElementById("label-container");
const preview = document.getElementById("preview");

// Carregar modelo na inicialização
window.onload = async () => {
  try {
    model = await tmImage.load(modelURL, metadataURL);
    console.log("✅ Modelo carregado com sucesso.");
  } catch (error) {
    labelContainer.innerHTML = "❌ Erro ao carregar o modelo.";
    console.error("Erro ao carregar o modelo:", error);
  }
};

// Ao carregar imagem
document.getElementById("imageUpload").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    preview.src = e.target.result;
    preview.style.display = "block";
    base64Image = e.target.result;

    labelContainer.innerHTML = "<p>Imagem carregada. Clique em 'Classificar'.</p>";
    document.getElementById("feedbackSection").classList.add("d-none");
    document.getElementById("correctionSection").classList.add("d-none");
    document.getElementById("resultado-area").classList.remove("d-none");
    document.getElementById("btn-upload").style.display = "none";

  };
  reader.readAsDataURL(file);
});

// Classificar imagem
document.getElementById("classifyBtn").addEventListener("click", async () => {
  if (!preview.src || preview.src === "#") {
    labelContainer.innerHTML = "<p>Por favor, envie uma imagem primeiro.</p>";
    return;
  }

  try {
    const prediction = await model.predict(preview);
    const top3 = prediction.sort((a, b) => b.probability - a.probability).slice(0, 3);
    top1Prediction = top3[0]?.className || null;

    labelContainer.innerHTML = "<h5 class='mb-3'>TOP 3 - DIAGNÓSTICOS</h5>";
    top3.forEach(p => {
      const bar = document.createElement("div");
      bar.className = "probability-bar";

      const label = document.createElement("div");
      label.className = "bar-label";
      label.textContent = `${p.className} - ${(p.probability * 100).toFixed(1)}%`;

      const fill = document.createElement("div");
      fill.className = "bar-fill";
      fill.style.width = `${(p.probability * 100).toFixed(1)}%`;
      fill.style.backgroundColor = getBarColor(p.probability);

      bar.appendChild(label);
      bar.appendChild(fill);
      labelContainer.appendChild(bar);
    });

    document.getElementById("feedbackSection").classList.remove("d-none");
    document.getElementById("correctionSection").classList.add("d-none");
    document.getElementById("correctionSelect").value = "";
    document.getElementById("clinico-container").classList.remove("d-none");

    document.getElementById("label-container").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    labelContainer.innerHTML = "<p>❌ Erro ao classificar a imagem.</p>";
    console.error("Erro ao classificar:", error);
  }
});

// Feedback positivo
document.getElementById("feedback-yes").addEventListener("click", () => {
  document.getElementById("correctionSection").classList.add("d-none");
  alert("✅ Obrigado! Feedback registrado como correto.");
});

// Feedback negativo
document.getElementById("feedback-no").addEventListener("click", () => {
  document.getElementById("correctionSection").classList.remove("d-none");
});

// Exportar feedback corrigido
document.getElementById("exportFeedbackBtn").addEventListener("click", () => {
  const correcao = document.getElementById("correctionSelect").value;
  if (!correcao) {
    alert("❗ Selecione uma classe correta antes de exportar.");
    return;
  }

  const filename = `feedback_${new Date().toISOString().replace(/[:.]/g, "_")}.json`;
  window.lastFeedback = {
    data: new Date().toISOString(),
    classificacao_top1: top1Prediction,
    correcao_usuario: correcao,
    imagem_base64: base64Image,
    nome_arquivo: filename
  };

  const blob = new Blob([JSON.stringify(window.lastFeedback, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
});

// Recalcular com sintomas clínicos
document.getElementById("ajustarBtn").addEventListener("click", async () => {
  if (!model || !preview.src || preview.src === "#") {
    alert("⚠️ Classifique uma imagem primeiro.");
    return;
  }

  const predicoes = await model.predict(preview);
  const sintomasSelecionados = Array.from(document.querySelectorAll("#sintomas-form input:checked")).map(cb => cb.value);
  const resultadoAjustado = ajustarComSintomas(predicoes, sintomasSelecionados);

  const container = document.getElementById("ajuste-labels");
  container.innerHTML = "";
  resultadoAjustado.forEach(p => {
    const linha = document.createElement("p");
    linha.innerHTML = `${p.classe} — <strong>${(p.ajustado * 100).toFixed(1)}%</strong>`;
    container.appendChild(linha);
  });

  document.getElementById("ajuste-container").classList.remove("d-none");
});

// Exportar resultado ajustado
document.getElementById("exportAjustadoBtn").addEventListener("click", () => {
  const ajustadoTexto = document.getElementById("ajuste-labels").innerText;
  const filename = `ajuste_clinico_${new Date().toISOString().replace(/[:.]/g, "_")}.json`;

  const dados = {
    data: new Date().toISOString(),
    imagem_base64: base64Image,
    resultado_ajustado: ajustadoTexto
  };

  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
});

// Função de reinício
function reiniciar() {
  preview.src = "#";
  preview.style.display = "none";
  document.getElementById("imageUpload").value = "";
  labelContainer.innerHTML = "Envie uma imagem para classificar.";
  document.getElementById("feedbackSection").classList.add("d-none");
  document.getElementById("correctionSection").classList.add("d-none");
  document.getElementById("resultado-area").classList.add("d-none");
  document.getElementById("clinico-container").classList.add("d-none");
  document.getElementById("ajuste-container").classList.add("d-none");
  document.getElementById("inicio-upload").classList.remove("d-none");
  
  top1Prediction = null;
  base64Image = null;
  document.getElementById("ajuste-labels").innerHTML = "";
  document.querySelectorAll("#sintomas-form input").forEach(cb => cb.checked = false);
}

// Cores para a barra de probabilidade
function getBarColor(prob) {
  if (prob >= 0.75) return "#28a745";  // verde
  if (prob >= 0.5) return "#ffc107";   // amarelo
  if (prob >= 0.25) return "#fd7e14";  // laranja
  return "#dc3545";                    // vermelho
}
