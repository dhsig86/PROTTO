const MODEL_URL = 'https://dhsig86.github.io/PROTTO/modelo_teachable/';
let model;
let loadedImage = null;

async function loadModel() {
  const modelURL = MODEL_URL + 'model.json';
  const metadataURL = MODEL_URL + 'metadata.json';
  model = await tmImage.load(modelURL, metadataURL);
}

function handleFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const imgEl = document.getElementById('input-image');
  imgEl.src = URL.createObjectURL(file);
  imgEl.style.display = 'block';
  loadedImage = imgEl;

  imgEl.onload = () => URL.revokeObjectURL(imgEl.src);
}

function resetView() {
  document.getElementById('imageUpload').value = '';
  document.getElementById('input-image').src = '';
  document.getElementById('input-image').style.display = 'none';
  document.getElementById('label-container').innerHTML = '';
  loadedImage = null;
}

function printResults() {
  const result = document.getElementById('label-container').innerHTML;
  const w = window.open('', '', 'width=600,height=400');
  w.document.write(`<html><body>${result}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}

async function classifyImage() {
  if (!loadedImage || !model) return;

  const predictions = await model.predict(loadedImage);
  predictions.sort((a, b) => b.probability - a.probability);
  const top3 = predictions.slice(0, 3);

  const container = document.getElementById('label-container');
  container.innerHTML = '';

  top3.forEach(p => {
    const percent = (p.probability * 100).toFixed(1);
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-2';

    const info = document.createElement('div');
    info.className = 'd-flex justify-content-between';
    info.innerHTML = `<span>${p.className}</span><span>${percent}%</span>`;

    const barContainer = document.createElement('div');
    barContainer.className = 'progress';

    const bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.role = 'progressbar';
    bar.style.width = `${percent}%`;
    bar.ariaValuemin = '0';
    bar.ariaValuemax = '100';
    bar.innerText = percent + '%';

    barContainer.appendChild(bar);
    wrapper.appendChild(info);
    wrapper.appendChild(barContainer);
    container.appendChild(wrapper);
  });
}

window.onload = async () => {
  await loadModel();
  document.getElementById('imageUpload').addEventListener('change', handleFile);
  document.getElementById('classifyBtn').addEventListener('click', classifyImage);
  document.getElementById('resetBtn').addEventListener('click', resetView);
  document.getElementById('printerBtn').addEventListener('click', printResults);
};
