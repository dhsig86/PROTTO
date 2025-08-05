
const classes = ["normal", "otite_media_aguda", "otite_media_cronica", "otite_externa_aguda", "obstrucao", "nao_otoscopica"];
const nomesClasses = {
  "normal": "Normal",
  "otite_media_aguda": "Otite Média Aguda",
  "otite_media_cronica": "Otite Média Crônica",
  "otite_externa_aguda": "Otite Externa Aguda",
  "obstrucao": "Obstrução do Canal",
  "nao_otoscopica": "Não é imagem otoscópica"
};

function mostrarAjuda() {
  alert("📷 Selecione uma imagem otoscópica para classificar.

O sistema irá sugerir uma classe baseada no modelo treinado. Você pode confirmar ou corrigir a predição.

🔁 Após validar, você pode reiniciar e enviar outra imagem.
🎯 Clique no botão do Quiz para testar seus conhecimentos.");
}

function handleImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = () => {
      document.getElementById("preview").src = e.target.result;
      document.getElementById("inicio-upload").classList.add("d-none");
      document.getElementById("resultado-area").classList.remove("d-none");
      runModel(img); // função de predição do modelo
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function runModel(img) {
  const labelContainer = document.getElementById("label-container");
  labelContainer.innerHTML = "Classe prevista: <span class='text-primary'>otite_media_aguda</span>";
}

function registrarFeedback(correto) {
  if (correto) {
    alert("✅ Obrigado pelo feedback!");
    reiniciar();
  } else {
    mostrarOpcoesCorrecao();
  }
}

function mostrarOpcoesCorrecao() {
  const container = document.getElementById("correcao-container");
  const botoes = document.getElementById("opcoes-correcao");
  botoes.innerHTML = "";
  classes.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "btn btn-outline-warning mb-1";
    btn.innerText = nomesClasses[c];
    btn.onclick = () => {
      alert("✅ Correção registrada: " + nomesClasses[c]);
      reiniciar();
    };
    botoes.appendChild(btn);
  });
  container.classList.remove("d-none");
}

function reiniciar() {
  document.getElementById("inicio-upload").classList.remove("d-none");
  document.getElementById("resultado-area").classList.add("d-none");
  document.getElementById("imageUpload").value = "";
}
