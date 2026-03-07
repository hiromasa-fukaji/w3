/*
 * CONTEXT: p5.js Creative Coding
 * GOAL: Perfect Pixel Sampling with createGraphics
 */

let points = [];
let samplingStep = 5; // ドットの粗さ
let pg; // 裏紙（グラフィックバッファ）用の変数
let tracking = 5; // トラッキング（文字間隔）ピクセル単位

function setup() {
  createCanvas(windowWidth, windowHeight);
  // メインキャンバスの pixelDensity は制限しません（高画質のまま）

  // 最初に一度サンプリングを実行
  sampleText();
}

function sampleText() {
  // 1. 画面と同じサイズの「裏紙」を作る
  pg = createGraphics(width, height);

  // ★重要: 裏紙だけ解像度を「1」に固定する
  // これにより、Retina画面でも計算が「y * width + x」だけで済みます
  pg.pixelDensity(1);

  // 2. 裏紙に文字を描く（pg. をつける）
  pg.background(0);
  pg.fill(255);
  pg.noStroke();
  pg.textFont('HelveticaNeue-Bold, sans-serif');
  pg.textStyle(BOLD);
  pg.textSize(min(width, height) * 0.15); // 画面サイズに合わせて調整
  pg.textAlign(LEFT, CENTER);
  drawTrackedText(pg, "HIROMASA", width / 2, height / 2 + 20, tracking);

  // 3. 裏紙のピクセルをロード
  pg.loadPixels();
  points = [];

  // 4. シンプルな計算でサンプリング
  // pg.pixelDensity(1) なので、pdの掛け算は一切不要！
  for (let y = 0; y < height; y += samplingStep) {
    for (let x = 0; x < width; x += samplingStep) {

      // 非常にシンプルなインデックス計算
      let index = 4 * (y * width + x);

      // pg.pixels（裏紙のデータ）を参照
      let r = pg.pixels[index];

      // しきい値判定（白ければ点に追加）
      if (r > 128) {
        // パーティクルとして登録（位置＋寿命情報）
        let life = random(100, 300); // 各パーティクルの寿命（フレーム数）
        points.push({
          x: x,
          y: y,
          life: life,                 // 寿命
          age: random(0, life)        // 進行度をランダムにずらしておく
        });
      }
    }
  }

  // メモリ節約のため、使い終わった裏紙は削除しても良いですが
  // p5.jsでは再代入でガベージコレクションされるのでそのままでもOK
}

function draw() {
  background(255); // 背景色

  noStroke();

  // パーティクルを描画
  for (let i = 0; i < points.length; i++) {
    let p = points[i];

    // 寿命の進行
    p.age++;
    if (p.age >= p.life) {
      // 寿命が尽きたら、また同じ位置で生まれ変わる
      p.life = random(200, 400);
      p.age = 0;
    }

    // 0 → 1 で一生分の進行度
    let t = p.age / p.life;

    // 前半でフェードイン、後半でフェードアウトする三角波的なアルファ
    let alpha;
    if (t < 0.5) {
      alpha = map(t, 0, 0.5, 0, 255);
    } else {
      alpha = map(t, 0.5, 1, 255, 0);
    }

    // 儚い光っぽい色と大きさ（アルファに応じてサイズも少し変える）
    let size = samplingStep * map(alpha, 0, 255, 0, 1.5);
    fill(0, 100, 255, alpha);
    ellipse(p.x, p.y, size * 1.75, size * 1.75);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // サイズが変わったら、裏紙を作り直して再サンプリング
  sampleText();
}

/**
 * トラッキング（文字間隔）付きでテキストを描画する
 * cx, cy を中心として文字列全体を中央揃えで配置
 */
function drawTrackedText(g, str, cx, cy, trackingPx) {
  // 全体の幅を計算
  let totalWidth = 0;
  for (let i = 0; i < str.length; i++) {
    totalWidth += g.textWidth(str[i]);
    if (i < str.length - 1) totalWidth += trackingPx;
  }
  // 左端の開始位置（中央揃え）
  let x = cx - totalWidth / 2;
  for (let i = 0; i < str.length; i++) {
    g.text(str[i], x, cy);
    x += g.textWidth(str[i]) + trackingPx;
  }
}