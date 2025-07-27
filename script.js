const modelURL = "https://dhsig86.github.io/PROTTO/model.json";
const metadataURL = "https://dhsig86.github.io/PROTTO/metadata.json";

let model;
let labelContainer = document.getElementById("label-container");
let previewImage = document.getElementById("previewImage");

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
      const line = document.createElement("div");
      line.innerHTML = `<strong>${p.className}</strong>: ${(p.probability * 100).toFixed(2)}%`;
      labelContainer.appendChild(line);
    });
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
  document.body.innerHTML = `<h1>Resultado da Classificação</h1><div>${result}</div>`;
  window.print();
  document.body.innerHTML = original;
  location.reload();
});
