let myFont;
let glyphShapes = []; // { outer: [{x,y}...], holes: [[{x,y}...], ...] }
let bounds;

function preload() {
  myFont = loadFont('IBMPlexMono-Regular.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  let txt = "HIROMASA";
  let fontSize = 150;

  bounds = myFont.textBounds(txt, 0, 0, fontSize);

  // opentype.jsのパスコマンドから輪郭を正確に抽出
  let rawContours = extractContoursFromPath(myFont, txt, 0, 0, fontSize);

  // 外側輪郭と内側輪郭（穴）をグループ化する
  glyphShapes = groupContours(rawContours);

}

// opentype.jsのパスコマンドから輪郭を抽出しポイント配列にサンプリング
function extractContoursFromPath(font, txt, x, y, fontSize) {
  let path = font.font.getPath(txt, x, y, fontSize);
  let contours = [];
  let currentContour = [];
  let lastX = 0, lastY = 0;
  let sampleRate = 10; // ピクセル間隔（小さいほど密になる）

  for (let cmd of path.commands) {
    if (cmd.type === 'M') {
      // 新しい輪郭の開始
      if (currentContour.length > 0) {
        contours.push(currentContour);
      }
      currentContour = [{ x: cmd.x, y: cmd.y }];
      lastX = cmd.x;
      lastY = cmd.y;

    } else if (cmd.type === 'L') {
      // 直線 — サンプリング
      let d = dist(lastX, lastY, cmd.x, cmd.y);
      let steps = max(1, floor(d / sampleRate));
      for (let i = 1; i <= steps; i++) {
        let t = i / steps;
        currentContour.push({
          x: lerp(lastX, cmd.x, t),
          y: lerp(lastY, cmd.y, t)
        });
      }
      lastX = cmd.x;
      lastY = cmd.y;

    } else if (cmd.type === 'Q') {
      // 2次ベジェ曲線
      let sx = lastX, sy = lastY;
      let d = dist(sx, sy, cmd.x, cmd.y);
      let steps = max(2, floor(d / sampleRate));
      for (let i = 1; i <= steps; i++) {
        let t = i / steps;
        let mt = 1 - t;
        currentContour.push({
          x: mt * mt * sx + 2 * mt * t * cmd.x1 + t * t * cmd.x,
          y: mt * mt * sy + 2 * mt * t * cmd.y1 + t * t * cmd.y
        });
      }
      lastX = cmd.x;
      lastY = cmd.y;

    } else if (cmd.type === 'C') {
      // 3次ベジェ曲線
      let sx = lastX, sy = lastY;
      let d = dist(sx, sy, cmd.x, cmd.y);
      let steps = max(2, floor(d / sampleRate));
      for (let i = 1; i <= steps; i++) {
        let t = i / steps;
        let mt = 1 - t;
        currentContour.push({
          x: mt * mt * mt * sx + 3 * mt * mt * t * cmd.x1 + 3 * mt * t * t * cmd.x2 + t * t * t * cmd.x,
          y: mt * mt * mt * sy + 3 * mt * mt * t * cmd.y1 + 3 * mt * t * t * cmd.y2 + t * t * t * cmd.y
        });
      }
      lastX = cmd.x;
      lastY = cmd.y;

    } else if (cmd.type === 'Z') {
      // 輪郭の終了
      if (currentContour.length > 0) {
        contours.push(currentContour);
        currentContour = [];
      }
    }
  }
  if (currentContour.length > 0) {
    contours.push(currentContour);
  }

  return contours;
}

// 輪郭の符号付き面積を計算（巻き方向の判定に使用）
function signedArea(contour) {
  let area = 0;
  for (let i = 0; i < contour.length; i++) {
    let j = (i + 1) % contour.length;
    area += (contour[j].x - contour[i].x) * (contour[j].y + contour[i].y);
  }
  return area;
}

// 輪郭のバウンディングボックスを取得
function getContourBounds(contour) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (let p of contour) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY, area: (maxX - minX) * (maxY - minY) };
}

// バウンディングボックスAがBを包含するかチェック
function boundsContains(outer, inner) {
  return outer.minX <= inner.minX && outer.minY <= inner.minY &&
    outer.maxX >= inner.maxX && outer.maxY >= inner.maxY;
}

// 輪郭を外側（outer）と内側（holes）にグループ化
function groupContours(rawContours) {
  let contourData = rawContours.map((c, i) => ({
    index: i,
    points: c,
    bounds: getContourBounds(c),
    area: signedArea(c)
  }));

  // バウンディングボックス面積の大きい順にソート（外側が先）
  contourData.sort((a, b) => b.bounds.area - a.bounds.area);

  let shapes = [];
  let assigned = new Set();

  for (let i = 0; i < contourData.length; i++) {
    if (assigned.has(contourData[i].index)) continue;

    let outerContour = contourData[i];
    assigned.add(outerContour.index);
    let holes = [];

    // この外側輪郭に包含される小さい輪郭を探す（穴）
    for (let j = i + 1; j < contourData.length; j++) {
      if (assigned.has(contourData[j].index)) continue;
      if (boundsContains(outerContour.bounds, contourData[j].bounds)) {
        holes.push({
          points: contourData[j].points,
          area: contourData[j].area
        });
        assigned.add(contourData[j].index);
      }
    }

    shapes.push({
      outer: outerContour.points,
      outerArea: outerContour.area,
      holes: holes
    });
  }

  return shapes;
}


function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}


function draw() {
  background(0);

  fill(255);
  noStroke();
  let centerX = (width - bounds.w) / 2 - bounds.x;
  let centerY = (height - bounds.h) / 2 - bounds.y;

  push();
  translate(centerX, centerY);

  for (let shape of glyphShapes) {
    beginShape();

    // 外側の輪郭
    for (let p of shape.outer) {
      let nx = noise(p.x * 0.01, p.y * 0.01, frameCount * 0.01) * 100 - 100 / 2;
      let ny = noise(p.y * 0.01, p.x * 0.01, frameCount * 0.01) * 100 - 100 / 2;
      vertex(p.x + nx, p.y + ny);
    }

    // 内側の輪郭（穴）
    for (let hole of shape.holes) {
      beginContour();
      // 穴は外側と逆の巻き方向で描画する必要がある
      // 外側と同じ方向なら逆順にする
      let holePoints = hole.points;
      let needReverse = (shape.outerArea > 0 && hole.area > 0) ||
        (shape.outerArea < 0 && hole.area < 0);
      if (needReverse) {
        // 同じ巻き方向なので逆順にする
        for (let i = holePoints.length - 1; i >= 0; i--) {
          let p = holePoints[i];
          let nx = noise(p.x * 0.01, p.y * 0.01, frameCount * 0.01) * 100 - 100 / 2;
          let ny = noise(p.y * 0.01, p.x * 0.01, frameCount * 0.01) * 100 - 100 / 2;
          vertex(p.x + nx, p.y + ny);
        }
      } else {
        // 既に逆方向なのでそのまま描画
        for (let p of holePoints) {
          let nx = noise(p.x * 0.01, p.y * 0.01, frameCount * 0.01) * 100 - 100 / 2;
          let ny = noise(p.y * 0.01, p.x * 0.01, frameCount * 0.01) * 100 - 100 / 2;
          vertex(p.x + nx, p.y + ny);
        }
      }
      endContour();
    }

    endShape(CLOSE);
  }
  pop();

}
