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
