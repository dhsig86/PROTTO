# Front-end Web Interface

This folder contains a simple HTML page that allows you to load a model
exported from Teachable Machine. The model is loaded in the browser using the
`tmImage.load` API and can run predictions on otoscopic images.

## Files
 - `index.html` – main web page with a file input and a preview element
   identified by `previewImage`.
- `style.css` – basic styles for the page.
- `script.js` – JavaScript that loads the model and performs inference.
- `model/` – place the exported Teachable Machine model files here. Copy
  `model.json`, `metadata.json` and `weights.bin` from `../modelo_teachable/`.

## How It Works
`script.js` loads the model as soon as the page finishes loading using
`tmImage.load('model/model.json', 'model/metadata.json')`. When a file is
selected, the image is displayed inside the element with id `previewImage` and
then passed to `model.predict` to obtain the classification probabilities.

Before opening `index.html`, create the `model/` folder here and copy the files
from `../modelo_teachable/` into it. Then simply open `index.html` in a web
browser that supports JavaScript to test the classifier locally.
