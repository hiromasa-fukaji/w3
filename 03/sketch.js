let drops = [];
let splashes = [];
let numDrops = 1000;

function setup() {
    createCanvas(windowWidth, windowHeight);
    for (let i = 0; i < numDrops; i++) {
        drops.push(new Drop());
    }
}

function draw() {
    // 非常に暗い、少し青みがかった背景
    background(5, 10, 20, 180);

    // 雨粒の描画
    for (let drop of drops) {
        drop.fall();
        drop.show();
    }

    // 地面の水しぶきの描画
    for (let i = splashes.length - 1; i >= 0; i--) {
        splashes[i].update();
        splashes[i].show();
        if (splashes[i].isDead()) {
            splashes.splice(i, 1);
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

class Drop {
    constructor() {
        this.init();
        this.y = random(height); // 初回は画面内に散らす
    }

    init() {
        this.x = random(-200, width);
        this.y = random(-1000, -100);
        this.z = random(0, 20);
        this.len = map(this.z, 0, 20, 10, 40);
        this.yspeed = map(this.z, 0, 20, 10, 30);
        this.thickness = map(this.z, 0, 20, 0.5, 3);
        this.opacity = map(this.z, 0, 20, 40, 200);
    }

    fall() {
        this.y += this.yspeed;
        this.x += 1; // わずかな風

        if (this.y > height) {
            // 地面に当たったら水しぶきを追加（手前の雨粒のみ）
            if (this.z > 15 && random() > 0.7) {
                splashes.push(new Splash(this.x, height));
            }
            this.init();
        }
    }

    show() {
        stroke(180, 200, 255, this.opacity);
        strokeWeight(this.thickness);
        line(this.x, this.y, this.x + 1, this.y + this.len);
    }
}

class Splash {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alpha = 200;
        this.size = random(2, 6);
        this.vx = random(-2, 2);
        this.vy = random(-2, -5);
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3; // 重力
        this.alpha -= 10;
    }

    show() {
        stroke(200, 220, 255, this.alpha);
        strokeWeight(1);
        noFill();
        ellipse(this.x, this.y, this.size, this.size * 0.5);
    }

    isDead() {
        return this.alpha <= 0;
    }
}
