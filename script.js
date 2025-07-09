let baseImage = new Image();
let canvas = document.getElementById('imageCanvas');
let ctx = canvas.getContext('2d');
let overlay = document.getElementById('overlayCanvas');
let octx = overlay.getContext('2d');
let cropMode = false;
let cropRect = null;

let transform = {
    width: 0,
    height: 0,
    rotation: 0,
    flipX: false,
    flipY: false,
    brightness: 100,
    contrast: 100,
    saturation: 100,
    grayscale: false,
    sepia: false
};

function resetOverlay() {
    overlay.width = canvas.width;
    overlay.height = canvas.height;
    octx.clearRect(0,0,overlay.width, overlay.height);
}

function updateCanvas() {
    if (!baseImage.src) return;
    let angle = parseInt(transform.rotation);
    let rad = angle * Math.PI / 180;
    let width = transform.width;
    let height = transform.height;
    let rotated = angle === 90 || angle === 270;
    canvas.width = rotated ? height : width;
    canvas.height = rotated ? width : height;
    resetOverlay();

    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(rad);
    ctx.scale(transform.flipX ? -1 : 1, transform.flipY ? -1 : 1);
    ctx.filter = `brightness(${transform.brightness}%) contrast(${transform.contrast}%) ` +
                 `saturate(${transform.saturation}%) grayscale(${transform.grayscale?100:0}%) ` +
                 `sepia(${transform.sepia?100:0}%)`;
    ctx.drawImage(baseImage, -width/2, -height/2, width, height);
    ctx.restore();
}

function applyCrop() {
    if (!cropRect) return;
    let temp = document.createElement('canvas');
    temp.width = cropRect.w;
    temp.height = cropRect.h;
    let tctx = temp.getContext('2d');
    tctx.drawImage(baseImage, cropRect.x, cropRect.y, cropRect.w, cropRect.h, 0, 0, cropRect.w, cropRect.h);
    baseImage.onload = () => {
        transform.width = baseImage.width;
        transform.height = baseImage.height;
        updateCanvas();
    };
    baseImage.src = temp.toDataURL();
    cropRect = null;
    cropMode = false;
    resetOverlay();
}

document.getElementById('upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        baseImage.onload = () => {
            transform.width = baseImage.width;
            transform.height = baseImage.height;
            updateCanvas();
        };
        baseImage.src = reader.result;
    };
    reader.readAsDataURL(file);
});

// Resize controls
const preset = document.getElementById('presetSize');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
document.getElementById('applyResize').addEventListener('click', () => {
    let w = parseInt(widthInput.value);
    let h = parseInt(heightInput.value);
    if (!isNaN(w) && !isNaN(h)) {
        transform.width = w;
        transform.height = h;
        updateCanvas();
    }
});
preset.addEventListener('change', () => {
    if (!preset.value) return;
    const [w, h] = preset.value.split('x').map(Number);
    widthInput.value = w;
    heightInput.value = h;
});

// Crop controls
let startX, startY;
document.getElementById('startCrop').addEventListener('click', () => {
    cropMode = true;
});
canvas.addEventListener('mousedown', (e) => {
    if (!cropMode) return;
    const rect = canvas.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;
    cropRect = {x: startX, y: startY, w:0, h:0};
});
canvas.addEventListener('mousemove', (e) => {
    if (!cropMode || !cropRect) return;
    const rect = canvas.getBoundingClientRect();
    cropRect.w = (e.clientX - rect.left) - startX;
    cropRect.h = (e.clientY - rect.top) - startY;
    resetOverlay();
    octx.strokeStyle = 'red';
    octx.setLineDash([6]);
    octx.strokeRect(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
});
canvas.addEventListener('mouseup', () => {
    if (cropMode) {
        octx.setLineDash([]);
    }
});

document.getElementById('applyCrop').addEventListener('click', applyCrop);

// Rotation and flip
const rotation = document.getElementById('rotation');
rotation.addEventListener('change', () => {
    transform.rotation = parseInt(rotation.value);
    updateCanvas();
});
document.getElementById('flipH').addEventListener('click', () => {
    transform.flipX = !transform.flipX;
    updateCanvas();
});
document.getElementById('flipV').addEventListener('click', () => {
    transform.flipY = !transform.flipY;
    updateCanvas();
});

// Adjustments
function sliderHandler(id, key) {
    document.getElementById(id).addEventListener('input', (e) => {
        transform[key] = e.target.value;
        updateCanvas();
    });
}
sliderHandler('brightness', 'brightness');
sliderHandler('contrast', 'contrast');
sliderHandler('saturation', 'saturation');

document.getElementById('grayscale').addEventListener('change', (e) => {
    transform.grayscale = e.target.checked;
    updateCanvas();
});
document.getElementById('sepia').addEventListener('change', (e) => {
    transform.sepia = e.target.checked;
    updateCanvas();
});

// Download
function download(type) {
    const link = document.createElement('a');
    link.download = `image.${type === 'image/png' ? 'png' : 'jpg'}`;
    link.href = canvas.toDataURL(type);
    link.click();
}
document.getElementById('downloadPNG').addEventListener('click', () => download('image/png'));
document.getElementById('downloadJPEG').addEventListener('click', () => download('image/jpeg'));
