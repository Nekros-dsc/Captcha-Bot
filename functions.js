const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

function generateRandomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function generateCaptcha() {
  const canvasWidth = 200;
  const canvasHeight = 100;
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#7289DA';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.font = 'bold 30px Arial';
  ctx.fillStyle = '#FFF';

  const captchaText = generateRandomString(6);
  ctx.fillText(captchaText, 40, 60);

  for (let i = 0; i < 20; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvasWidth, Math.random() * canvasHeight);
    ctx.lineTo(Math.random() * canvasWidth, Math.random() * canvasHeight);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FFF';
    ctx.stroke();
  }

  const out = fs.createWriteStream(__dirname + '/canva.png');
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  out.on('finish', () => console.log('The CAPTCHA image was saved to a file.'));

  return captchaText;
}

module.exports = generateCaptcha;
