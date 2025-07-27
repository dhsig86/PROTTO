# Front-end Web Interface

This folder contains a simple HTML page that allows you to load a TensorFlow.js
model and run predictions on otoscopic images in the browser.

## Files
- `index.html` – main web page with a file input and canvas.
- `style.css` – basic styles for the page.
- `script.js` – JavaScript that loads the model and performs inference.
- `model/` – place the converted TensorFlow.js model files here (`model.json`
  and the corresponding `*.bin` weight files).

## How It Works
`script.js` uses `tf.loadLayersModel('model/model.json')` to load the model
when the user first requests a prediction. Uploaded images are drawn to the
canvas and converted to tensors with `tf.browser.fromPixels`. After normalizing,
the tensor is passed to `model.predict` and the predicted class index is shown
on screen.

Simply open `index.html` in a web browser that supports JavaScript to test the
classifier locally. Make sure the converted model files are inside the
`model/` folder so they can be loaded.

# PROTTO · GitHub Pages Deployment

Este repositório é parte do projeto **PROTTO** – um sistema de classificação de imagens otoscópicas com frontend web e validação backend.

Esta branch (`gh-pages`) contém **apenas os arquivos do frontend responsivo** para exibição via [GitHub Pages](https://pages.github.com/).

> 🔗 Acesse: https://dhsig86.github.io/PROTTO/

---

## 🔍 Funcionalidade

Este frontend utiliza **TensorFlow.js** e modelos exportados pelo [Teachable Machine](https://teachablemachine.withgoogle.com/) para:

- Carregar um modelo `.json` otoscópico
- Classificar uma imagem carregada do usuário (em breve via upload)
- Exibir as probabilidades de cada classe

---

## 📁 Estrutura da Página


A página principal (`index.html`) é composta por:

- Um campo de upload (`#imageUpload`) para selecionar a imagem otoscópica.
- A imagem escolhida aparece em `<img id="previewImage">` para confirmação.
- O contêiner `#label-container` dentro de um card exibe as probabilidades calculadas.
- Três botões controlam as ações: **Classificar Imagem**, **Imprimir Resultado** e **Reset**.

## ▶️ Como Utilizar

1. Acesse o link acima ou abra `index.html` localmente em um navegador moderno.
2. Selecione uma imagem no botão de upload e aguarde a prévia aparecer.
3. Clique em **Classificar Imagem** para que o modelo processe a foto.
4. Consulte o resultado com as probabilidades no cartão central.
5. Opcionalmente utilize **Imprimir Resultado** para gerar um PDF/impresso ou **Reset** para limpar a tela.
