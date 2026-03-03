/**
 * Ethereal Clouds Sketch
 * Organic, randomly placed cloud-like objects using Perlin noise and soft gradients.
 */

let clouds = [];

function setup() {
    createCanvas(windowWidth, windowHeight);
    colorMode(HSB, 360, 100, 100, 1);
    noStroke();

    // Initialize a set of clouds
    for (let i = 0; i < 15; i++) {
        clouds.push(new Cloud());
    }
}

function draw() {
    // Beautiful sky gradient
    drawSky();

    // Update and show clouds
    for (let cloud of clouds) {
        cloud.update();
        cloud.display();
    }
}

function drawSky() {
    // Draw a radial or linear gradient background for the sky
    for (let y = 0; y < height; y++) {
        let inter = map(y, 0, height, 0, 1);
        let c = lerpColor(color(210, 80, 20), color(220, 40, 60), inter);
        stroke(c);
        line(0, y, width, y);
    }
}

class Cloud {
    constructor() {
        this.init();
    }

    init() {
        this.x = random(-200, width + 200);
        this.y = random(0, height * 0.7);
        this.speed = random(0.2, 1.0);
        this.size = random(100, 300);
        this.numCircles = floor(random(15, 30));
        this.offsets = [];
        this.colors = [];

        // Create random offsets for each circle in the cloud to make it "fluffy"
        for (let i = 0; i < this.numCircles; i++) {
            this.offsets.push({
                x: random(-this.size * 0.6, this.size * 0.6),
                y: random(-this.size * 0.3, this.size * 0.3),
                w: random(this.size * 0.5, this.size),
                h: random(this.size * 0.4, this.size * 0.8),
                noiseOffset: random(1000)
            });
            // Varying whites and light purples
            this.colors.push(color(random(200, 260), random(5, 15), 100, random(0.01, 0.05)));
        }
    }

    update() {
        this.x += this.speed;

        // Wrap around logic
        if (this.x - this.size > width) {
            this.x = -this.size * 2;
            this.y = random(0, height * 0.7);
        }
    }

    display() {
        noStroke();
        for (let i = 0; i < this.numCircles; i++) {
            let off = this.offsets[i];
            fill(this.colors[i]);

            // Add a bit of movement to individual puffs
            let xNoise = noise(off.noiseOffset + frameCount * 0.005) * 20 - 10;
            let yNoise = noise(off.noiseOffset + 100 + frameCount * 0.005) * 10 - 5;

            ellipse(this.x + off.x + xNoise, this.y + off.y + yNoise, off.w, off.h);
        }
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
