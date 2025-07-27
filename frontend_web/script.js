let model;
const uploadInput = document.getElementById('imageUpload');
const preview = document.getElementById('preview');
const predictBtn = document.getElementById('predictBtn');
const resultDiv = document.getElementById('result');

async function loadModel() {
    if (!model) {
        model = await tf.loadLayersModel('model/model.json');
    }
}

function drawImage(file) {
    const ctx = preview.getContext('2d');
    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, preview.width, preview.height);
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

async function predict() {
    await loadModel();
    const tensor = tf.browser.fromPixels(preview)
        .toFloat()
        .div(255.0)
        .expandDims();
    const prediction = model.predict(tensor);
    const scores = await prediction.data();
    const classIndex = scores.indexOf(Math.max(...scores));
    resultDiv.textContent = `Predicted class: ${classIndex}`;
}

uploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        drawImage(file);
    }
});

predictBtn.addEventListener('click', predict);
