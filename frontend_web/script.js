const URL = "./model/";
let model, maxPredictions, uploadedImage;

async function loadModel() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";
  model = await tmImage.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();
}

window.onload = async () => {
  await loadModel();
  document.getElementById("imageUpload").addEventListener("change", handleImage, false);
  document.getElementById("classifyBtn").addEventListener("click", predict);
  document.getElementById("resetBtn").addEventListener("click", resetInterface);
  document.getElementById("printerBtn").addEventListener("click", () => window.print());
};

function handleImage(event) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const img = document.getElementById("previewImage");
    img.src = e.target.result;
    img.style.display = "block";
    uploadedImage = new Image();
    uploadedImage.src = e.target.result;
    uploadedImage.width = 224;
    uploadedImage.height = 224;
  };
  reader.readAsDataURL(event.target.files[0]);
}

function resetInterface() {
  document.getElementById("previewImage").style.display = "none";
  document.getElementById("label-container").innerHTML = "Envie uma imagem para classificar.";
  document.getElementById("imageUpload").value = "";
}

async function predict() {
  if (!uploadedImage) return;
  const prediction = await model.predict(uploadedImage);
  prediction.sort((a, b) => b.probability - a.probability);
  const top = prediction[0];
  const percent = (top.probability * 100).toFixed(1);
  const result = `
    <strong>Classe predita:</strong> ${top.className}<br>
    <strong>Confiança:</strong> ${percent}%<br>
    <small>Essa análise é apenas indicativa e não substitui avaliação médica.</small>
  `;
  document.getElementById("label-container").innerHTML = result;
}
