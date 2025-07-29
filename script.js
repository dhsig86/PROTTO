const useLocalModel = false; // Altere para true se quiser usar modelo local

const modelURL = useLocalModel
  ? "model/model.json"
  : "https://teachablemachine.withgoogle.com/models/AyY1FsbFD/model.json";

const metadataURL = useLocalModel
  ? "model/metadata.json"
  : "https://teachablemachine.withgoogle.com/models/AyY1FsbFD/metadata.json";

let model;
let top1Prediction = null;
let base64Image = null;

const labelContainer = document.getElementById("label-container");
const previewImage = document.getElementById("previewImage");
const feedbackSection = document.getElementById("feedback-section");
const correctionSection = document.getElementById("correction-section");
const correctionSelect = document.getElementById("correction-select");

window.onload = async () => {
  try {
    model = await tmImage.load(modelURL, metadataURL);
    console.log("✅ Modelo carregado com sucesso.");
  } catch (error) {
    labelContainer.innerHTML = "Erro ao carregar o modelo.";
    console.error("Erro ao carregar o modelo:", error);
  }
};

document.getElementById("imageUpload").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    previewImage.src = e.target.result;
    previewImage.style.display = "block";
    base64Image = e.target.result;
    labelContainer.innerHTML = "<p>Imagem carregada. Clique em 'Classificar'.</p>";
    feedbackSection.style.display = "none";
    correctionSection.style.display = "none";
  };
  reader.readAsDataURL(file);
});

document.getElementById("classifyBtn").addEventListener("click", async () => {
  if (!previewImage.src || previewImage.src === "#") {
    labelContainer.innerHTML = "<p>Por favor, envie uma imagem primeiro.</p>";
    return;
  }

  try {
    const prediction = await model.predict(previewImage);
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

    feedbackSection.style.display = "block";
    correctionSection.style.display = "none";
    correctionSelect.value = "";

    document.getElementById("label-container").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    labelContainer.innerHTML = "<p>Erro ao classificar a imagem.</p>";
    console.error("Erro ao classificar:", error);
  }
});

document.getElementById("feedback-yes").addEventListener("click", () => {
  correctionSection.style.display = "none";
  alert("Obrigado! Feedback registrado como correto.");
});

document.getElementById("feedback-no").addEventListener("click", () => {
  correctionSection.style.display = "block";
});

document.getElementById("export-feedback").addEventListener("click", () => {
  const correcao = correctionSelect.value;
  if (!correcao) {
    alert("Selecione uma classe correta antes de exportar.");
    return;
  }

  const feedbackData = {
    data: new Date().toISOString(),
    classificacao_top1: top1Prediction,
    correcao_usuario: correcao,
    imagem_base64: base64Image
  };

  const blob = new Blob([JSON.stringify(feedbackData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `feedback_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "_")}.json`;
  a.click();

  URL.revokeObjectURL(url);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  previewImage.src = "#";
  previewImage.style.display = "none";
  document.getElementById("imageUpload").value = "";
  labelContainer.innerHTML = "Envie uma imagem para classificar.";
  feedbackSection.style.display = "none";
  correctionSection.style.display = "none";
  top1Prediction = null;
  base64Image = null;
});

document.getElementById("printerBtn").addEventListener("click", () => {
  const original = document.body.innerHTML;
  const result = labelContainer.innerHTML;
  const image = previewImage.src;
  const hasPreview = previewImage && previewImage.style.display !== "none" && image && image !== "#";

  const imageSection = hasPreview
    ? `<div style="text-align:center;margin:1rem 0;">
         <img src="${image}" style="max-width:260px;margin:auto;border:2px solid #ccc;border-radius:6px;">
       </div>`
    : "";

  document.body.innerHTML = `
    <h1 style="text-align:center;margin-bottom:1rem;">Resultado da Classificação - OTOSCOP-I.A</h1>
    ${imageSection}
    <div style="margin:1rem;font-size:1.1rem;">${result}</div>
  `;
  window.print();
  document.body.innerHTML = original;
  location.reload();
});

// Cores das barras
function getBarColor(prob) {
  if (prob >= 0.75) return "#28a745";
  if (prob >= 0.5) return "#ffc107";
  if (prob >= 0.25) return "#fd7e14";
  return "#dc3545";
}
