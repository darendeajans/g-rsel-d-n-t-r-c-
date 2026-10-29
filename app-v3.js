'use strict';
/* Darende Image Converter v3 - enhanced iOS input, preview & real WebP fallback */
const $ = id => document.getElementById(id);
const picker = $('files');
const preview = $('preview');
const output = $('output');
const status = $('status');
const selectStatus = $('selectStatus');
let chosen = [];
let previewURLs = [];
let convertedURLs = [];
let lastSelectionId = '';

function cleanup(urls) {
  for (const url of urls) URL.revokeObjectURL(url);
  urls.length = 0;
}
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function item(container, url, name, downloadURL, downloadName) {
  const box = el('div', 'item');
  const image = el('img');
  image.src = url;
  image.alt = name;
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    image.replaceWith(el('div', 'previewUnavailable', 'Önizleme desteklenmiyor; dosya seçildi.'));
  }, {once: true});
  box.append(image, el('p', 'filename', name));
  if (downloadURL) {
    const a = el('a', 'download', '⬇ İndir');
    a.href = downloadURL;
    a.download = downloadName;
    a.setAttribute('aria-label', `${downloadName} dosyasını indir`);
    box.append(a);
  }
  container.append(box);
}

function selectionChanged() {
  const next = [...(picker.files || [])];
  const signature = next.map(f => [f.name, f.size, f.lastModified].join('/')).join('|');
  if (signature === lastSelectionId && next.length) return;
  lastSelectionId = signature;
  chosen = next;
  cleanup(previewURLs);
  cleanup(convertedURLs);
  preview.replaceChildren();
  output.replaceChildren();
  $('outputSection').hidden = true;
  $('inputSection').hidden = next.length === 0;
  $('count').textContent = `(${next.length})`;
  $('convert').disabled = next.length === 0;
  status.textContent = '';
  if (!next.length) {
    selectStatus.textContent = 'Henüz görsel seçilmedi.';
    return;
  }
  selectStatus.textContent = `${next.length} dosya seçildi. Fotoğraflar aşağıda listelendi.`;
  for (const file of next) {
    const url = URL.createObjectURL(file);
    previewURLs.push(url);
    item(preview, url, file.name);
  }
}
// Safari sometimes fires input instead of change; handle either without duplicate renders.
picker.addEventListener('change', selectionChanged);
picker.addEventListener('input', selectionChanged);

async function loadImage(file) {
  const objectURL = URL.createObjectURL(file);
  try {
    const image = new Image();
    const viaImage = new Promise((resolve, reject) => {
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Fotoğraf görüntü çözücüsü bu dosyayı açamadı.'));
      image.src = objectURL;
    });
    try { return await viaImage; }
    catch (firstError) {
      if (typeof createImageBitmap === 'function') {
        try { return await createImageBitmap(file); }
        catch (_) { /* show helpful message below */ }
      }
      throw new Error('Seçilen fotoğraf okunamadı. iPhone HEIC/HEIF fotoğraflarında Dosyalar üzerinden JPEG veya PNG dene.');
    }
  } finally {
    URL.revokeObjectURL(objectURL);
  }
}
function drawImage(image, width, height, preserveAspect, mime) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', {willReadFrequently: true});
  if (!ctx) throw new Error('Bu tarayıcıda Canvas başlatılamadı.');
  if (mime === 'image/jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  if (!iw || !ih) throw new Error('Fotoğraf boyutları okunamadı.');
  if (preserveAspect) {
    const scale = Math.min(width / iw, height / ih);
    const w = Math.max(1, Math.round(iw * scale));
    const h = Math.max(1, Math.round(ih * scale));
    ctx.drawImage(image, Math.floor((width - w) / 2), Math.floor((height - h) / 2), w, h);
  } else {
    ctx.drawImage(image, 0, 0, width, height);
  }
  if (typeof image.close === 'function') image.close();
  return canvas;
}

function blobFromCanvas(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Görsel kodlanamadı.')), type, quality);
    } catch (error) { reject(error); }
  });
}
let webpModulePromise = null;
async function fallbackWebP(canvas, quality) {
  // jSquash's libwebp WASM is used if WebKit toBlob silently gives PNG instead of WebP.
  // Pinned version; dynamically loaded only when needed, not used on normal desktop Chrome.
  webpModulePromise ||= import('https://esm.sh/@jsquash/webp@1.5.0');
  const {encode} = await webpModulePromise;
  const pixels = canvas.getContext('2d', {willReadFrequently: true})
    .getImageData(0, 0, canvas.width, canvas.height);
  const encoded = await encode(pixels, {quality: Math.round(quality * 100)});
  const file = new Blob([encoded], {type: 'image/webp'});
  if (file.size < 16 || !(await isWebP(file))) throw new Error('WebP dosyası doğrulanamadı.');
  return file;
}
async function isWebP(blob) {
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  return bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
}
async function encodeCanvas(canvas, mime, quality) {
  if (mime !== 'image/webp') {
    const blob = await blobFromCanvas(canvas, mime, quality);
    if (blob.type !== mime) throw new Error('Tarayıcı istenen dosya formatını oluşturamadı.');
    return blob;
  }
  try {
    const native = await blobFromCanvas(canvas, 'image/webp', quality);
    if (native.type === 'image/webp' && await isWebP(native)) return native;
  } catch (_) { /* fall through to WASM */ }
  status.textContent = 'iPhone için WebP kodlayıcısı yükleniyor… (internet bağlantısı gerekli)';
  try { return await fallbackWebP(canvas, quality); }
  catch (error) {
    throw new Error('WebP kodlayıcısı yüklenemedi veya çalışmadı. İnternetini kontrol edip yeniden dene; alternatif olarak JPG/PNG seç. (' + (error.message || 'hata') + ')');
  }
}

$('convert').addEventListener('click', async () => {
  const w = Number($('width').value);
  const h = Number($('height').value);
  const mime = $('format').value;
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 12000 || h > 12000) {
    status.textContent = 'Genişlik ve yükseklik 1 ile 12000 arasında olmalı.';
    return;
  }
  if (w * h > 24000000) {
    status.textContent = 'Telefon belleği için çok büyük ölçü. En fazla 24 milyon piksel seç.';
    return;
  }
  if (!chosen.length) {
    status.textContent = 'Önce görsel seç.';
    return;
  }
  const button = $('convert');
  button.disabled = true;
  output.replaceChildren();
  cleanup(convertedURLs);
  $('outputSection').hidden = false;
  let success = 0;
  const ext = {'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png'}[mime];
  for (let i = 0; i < chosen.length; i++) {
    const f = chosen[i];
    status.textContent = `Dönüştürülüyor: ${i + 1}/${chosen.length}`;
    await new Promise(resolve => requestAnimationFrame(resolve));
    try {
      const source = await loadImage(f);
      const canvas = drawImage(source, w, h, $('keep').checked, mime);
      const blob = await encodeCanvas(canvas, mime, .9);
      const url = URL.createObjectURL(blob);
      convertedURLs.push(url);
      const name = (f.name.replace(/\.[^.]*$/, '') || 'gorsel') + '-' + w + 'x' + h + '.' + ext;
      item(output, url, name, url, name);
      success++;
    } catch (error) {
      const errorBox = el('div', 'item');
      errorBox.append(el('p', 'err', f.name + ': ' + (error.message || 'Dönüştürme sırasında hata oluştu.')));
      output.append(errorBox);
    }
  }
  status.textContent = `${success}/${chosen.length} görsel dönüştürüldü. Alttaki İndir düğmesini kullan.`;
  button.disabled = false;
});

// Previously published version installed a SW that could serve old HTML/JS.
// Unregister only SWs controlling this application's path (not other projects).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    const currentURL = new URL('./', location.href).href;
    for (const reg of registrations) {
      if (currentURL.startsWith(reg.scope)) reg.unregister().catch(() => {});
    }
  }).catch(() => {});
}
window.addEventListener('pagehide', () => { cleanup(previewURLs); cleanup(convertedURLs); });
