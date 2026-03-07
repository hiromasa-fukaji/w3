/*
 * CONTEXT: p5.js Creative Coding
 * GOAL: Create generative art using textToPoints
 * RULES:
 * 1. Use global variables declared at the top.
 * 2. Do NOT redeclare variables inside draw() (e.g., let points = ...).
 * 3. Keep the code simple and readable for students.
 * 4. Use vector math (p5.Vector) for physics.
 */

let myFont;
let points = [];
let bounds;
let tracking = 40; // 文字間の追加スペース（px）
let kerning = { 'AS': -12, 'SA': -5, 'OM': -4, 'MA': -2 }; // 特定ペアの間隔調整（マイナスで詰まる）

function preload() {
  // フォントを読み込む
  myFont = loadFont('IBMPlexMono-Regular.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  let txt = "HIROMASA";
  let fontSize = 140;

  // 1文字ずつポイントを取得し、tracking分だけ間隔を広げる
  points = [];
  let currentX = 0;
  for (let i = 0; i < txt.length; i++) {
    let ch = txt[i];
    let charPoints = myFont.textToPoints(ch, currentX, 0, fontSize, {
      sampleFactor: 0.5,
      simplifyThreshold: 0
    });
    points.push(...charPoints);
    let charBounds = myFont.textBounds(ch, 0, 0, fontSize);
    let pair = txt[i] + (txt[i + 1] || '');
    let kern = kerning[pair] || 0;
    currentX += charBounds.w + tracking + kern;
  }

  // センタリング用のバウンディングボックス
  let originalBounds = myFont.textBounds(txt, 0, 0, fontSize);
  bounds = {
    x: 0,
    y: originalBounds.y,
    w: currentX - tracking,
    h: originalBounds.h
  };

}

function windowResized() {
  // ウィンドウがリサイズされたら、キャンバスの大きさも再設定する
  resizeCanvas(windowWidth, windowHeight);
}


function draw() {
  background(200);

  noStroke();
  let centerX = (width - bounds.w) / 2 - bounds.x;
  let centerY = (height - bounds.h) / 2 - bounds.y;

  push();
  translate(centerX, centerY);
  for (let i = 0; i < points.length; i++) {
    let pt = points[i];
    // グラデーションのための補間値を計算
    // 各円が独立した周期で色変化するように、iごとに異なる位相を加える
    let t = (frameCount * 0.02 + i * 0.1) % 2;

    let r = lerp(0, 255, t);
    let g = 255;
    let b = lerp(0, 255, t);
    fill(r, g, b);
    ellipse(pt.x, pt.y, 22, 22);
  }
  pop();
}