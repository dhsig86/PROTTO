const modelURL = "https://dhsig86.github.io/PROTTO/model.json";
const metadataURL = "https://dhsig86.github.io/PROTTO/metadata.json";

let model;
let labelContainer = document.getElementById("label-container");
let previewImage = document.getElementById("previewImage");

// Helper to choose bar color based on probability
function getBarColor(prob) {
  if (prob >= 0.75) return "#28a745"; // high confidence - green
  if (prob >= 0.5) return "#ffc107";  // medium confidence - yellow
  if (prob >= 0.25) return "#fd7e14"; // low-medium - orange
  return "#dc3545";                    // low confidence - red
}

window.onload = async () => {
  try {
    model = await tmImage.load(modelURL, metadataURL);
    console.log("Modelo carregado com sucesso.");
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
    labelContainer.innerHTML = "<p>Imagem carregada. Clique em 'Classificar'.</p>";
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

    labelContainer.innerHTML = "<h5 class='mb-3'>Top 3 classes mais prováveis:</h5>";
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
      fill.textContent = `${(p.probability * 100).toFixed(1)}%`;

      bar.appendChild(label);
      bar.appendChild(fill);
      labelContainer.appendChild(bar);
    });
    document.getElementById("label-container").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    labelContainer.innerHTML = "<p>Erro ao classificar a imagem.</p>";
    console.error("Erro ao classificar:", error);
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  previewImage.src = "#";
  previewImage.style.display = "none";
  document.getElementById("imageUpload").value = "";
  labelContainer.innerHTML = "Envie uma imagem para classificar.";
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
