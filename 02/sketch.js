let bolts = [];
let nextStrikeTime = 0;
let flashOpacity = 0;

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(5);
    nextStrikeTime = millis() + 500;
}

function draw() {
    // Deep dark background with fade for "ghosting" effect
    background(5, 5, 20, 60);

    // Background flash effect when lightning hits
    if (flashOpacity > 0) {
        noStroke();
        fill(180, 210, 255, flashOpacity);
        rect(0, 0, width, height);
        flashOpacity -= 5;
    }

    // Intermittent strike logic
    if (millis() > nextStrikeTime) {
        triggerStrike();
        nextStrikeTime = millis() + random(1000, 4000); // Random interval for authenticity
    }

    // Update and show bolts
    for (let i = bolts.length - 1; i >= 0; i--) {
        bolts[i].update();
        bolts[i].show();
        if (bolts[i].isFinished()) {
            bolts.splice(i, 1);
        }
    }
}

function triggerStrike() {
    let startX = random(width * 0.1, width * 0.9);
    // Main bolt
    bolts.push(new LightningBolt(startX, 0, startX + random(-200, 200), height, 7));
    flashOpacity = random(60, 110);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

class LightningBolt {
    constructor(x1, y1, x2, y2, thickness, branch = false) {
        this.segments = [];
        this.life = 255;
        this.fadeSpeed = random(8, 20);
        this.maxThickness = thickness;
        this.isBranch = branch;
        this.generate(x1, y1, x2, y2);
    }

    generate(x, y, targetX, targetY) {
        let currX = x;
        let currY = y;
        let count = 0;

        // Create segments until it reaches the target height
        while (currY < targetY && count < 100) {
            let nextX = currX + random(-40, 40);
            let nextY = currY + random(15, 50);

            // Pull slightly towards targetX
            nextX += (targetX - currX) * 0.1;

            this.segments.push({
                x1: currX,
                y1: currY,
                x2: nextX,
                y2: nextY
            });

            // Branching logic: branches are smaller and shorter
            if (!this.isBranch && random() < 0.08 && count > 5) {
                let bTargetX = nextX + random(-300, 300);
                let bTargetY = nextY + random(100, 400);
                bolts.push(new LightningBolt(nextX, nextY, bTargetX, min(bTargetY, height), this.maxThickness * 0.5, true));
            }

            currX = nextX;
            currY = nextY;
            count++;
        }
    }

    update() {
        this.life -= this.fadeSpeed;
    }

    show() {
        if (this.life <= 0) return;

        push();

        // Aesthetic Outer Glow
        drawingContext.shadowBlur = 40;
        // Use string template for rgba to ensure p5.js color handling works with shadowColor
        drawingContext.shadowColor = `rgba(180, 210, 255, ${this.life / 255})`;
        stroke(150, 180, 255, this.life);
        strokeWeight(this.maxThickness);
        noFill();
        this.drawSegments();

        // Secondary Core Glow
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = `rgba(255, 255, 255, ${this.life / 255})`;
        stroke(220, 240, 255, this.life);
        strokeWeight(this.maxThickness * 0.5);
        this.drawSegments();

        // Bright Core
        drawingContext.shadowBlur = 0;
        stroke(255, 255, 255, this.life);
        strokeWeight(this.maxThickness * 0.15);
        this.drawSegments();

        pop();
    }

    drawSegments() {
        beginShape(LINES);
        for (let seg of this.segments) {
            vertex(seg.x1, seg.y1);
            vertex(seg.x2, seg.y2);
        }
        endShape();
    }

    isFinished() {
        return this.life <= 0;
    }
}
