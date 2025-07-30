const useLocalModel = false;  // ✅ Altere para true se quiser usar arquivos locais

const onlineModelBase = "https://teachablemachine.withgoogle.com/models/AyY1FsbFD/";
const modelURL = useLocalModel ? "model.json" : `${onlineModelBase}model.json`;
const metadataURL = useLocalModel ? "metadata.json" : `${onlineModelBase}metadata.json`;

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
    labelContainer.innerHTML = "❌ Erro ao carregar o modelo.";
    console.error("Erro ao carregar o modelo:", error);
  }
};

document.getElementById("imageUpload").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
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
    labelContainer.innerHTML = "<p>❌ Erro ao classificar a imagem.</p>";
    console.error("Erro ao classificar:", error);
  }
});

document.getElementById("feedback-yes").addEventListener("click", () => {
  correctionSection.style.display = "none";
  alert("✅ Obrigado! Feedback registrado como correto.");
});

document.getElementById("feedback-no").addEventListener("click", () => {
  correctionSection.style.display = "block";
});

document.getElementById("export-feedback").addEventListener("click", () => {
  const correcao = correctionSelect.value;
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
       </div>` : "";

  document.body.innerHTML = `
    <h1 style="text-align:center;margin-bottom:1rem;">Resultado da Classificação - OTOSCOP-I.A</h1>
    ${imageSection}
    <div style="margin:1rem;font-size:1.1rem;">${result}</div>
  `;
  window.print();
  document.body.innerHTML = original;
  location.reload();
});

document.getElementById("btnDownloadJSON").addEventListener("click", () => {
  if (!window.lastFeedback) {
    alert("❗ Gere e corrija um feedback primeiro.");
    return;
  }

  const blob = new Blob([JSON.stringify(window.lastFeedback, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = window.lastFeedback.nome_arquivo || "feedback_protto.json";
  a.click();
});

document.getElementById("btnEmailJSON").addEventListener("click", () => {
  if (!window.lastFeedback) {
    alert("❗ Gere e corrija um feedback primeiro.");
    return;
  }

  const blob = new Blob([JSON.stringify(window.lastFeedback, null, 2)], { type: "application/json" });
  const filename = window.lastFeedback.nome_arquivo || "feedback_protto.json";
  const file = new File([blob], filename, { type: "application/json" });

  const subject = encodeURIComponent("PROTTO TEST");
  const body = encodeURIComponent(`Segue em anexo o feedback gerado pelo sistema OTOSCOP-I.A.\n\nArquivo: ${filename}`);

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({
      title: "PROTTO TEST",
      text: "Feedback para o classificador otoscópico.",
      files: [file]
    }).catch(err => {
      alert("Erro ao compartilhar via app. Tente o método manual.");
      window.location.href = `mailto:drdariootorrino@gmail.com?subject=${subject}&body=${body}`;
    });
  } else {
    alert("Seu navegador não suporta envio automático com anexo.\nVocê será redirecionado ao e-mail para envio manual.");
    window.location.href = `mailto:drdariootorrino@gmail.com?subject=${subject}&body=${body}`;
  }
});

// Cor da barra com base na probabilidade
function getBarColor(prob) {
  if (prob >= 0.75) return "#28a745";  // verde
  if (prob >= 0.5) return "#ffc107";   // amarelo
  if (prob >= 0.25) return "#fd7e14";  // laranja
  return "#dc3545";                    // vermelho
}
