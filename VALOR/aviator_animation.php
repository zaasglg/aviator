<?php
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aviator Multiplier Animation</title>
    <style>
        body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a; color: white; font-family: Arial, sans-serif; }
        canvas { background: #000; }
    </style>
</head>
<body>
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        class AviatorSimulator {
            constructor() {
                this.reset();
                this.particles = [];
            }

            reset() {
                this.multiplier = 1.00;
                this.time = 0;
                this.crashTime = (Math.random() * 10 + 2).toFixed(1); // 2–12 секунд
                this.isCrashed = false;
                this.crashPause = 0;
                this.particles = [];
            }

            update(deltaTime) {
                if (this.isCrashed) {
                    this.crashPause += deltaTime;
                    if (this.crashPause >= 2) { // Пауза 2 секунды перед новым раундом
                        this.reset();
                    }
                    return;
                }

                this.time += deltaTime;
                // Плавный рост без скачка: 1.00x при t=0
                this.multiplier = 1 + 0.5 * (Math.exp(this.time / 5) - 1);

                if (this.time >= this.crashTime) {
                    this.isCrashed = true;
                    this.createExplosion();
                }
            }

            createExplosion() {
                for (let i = 0; i < 50; i++) {
                    this.particles.push({
                        x: canvas.width / 2,
                        y: canvas.height / 2,
                        radius: Math.random() * 5 + 2,
                        vx: (Math.random() - 0.5) * 400,
                        vy: (Math.random() - 0.5) * 400,
                        alpha: 1
                    });
                }
            }

            draw() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // Отрисовка множителя
                ctx.font = 'bold 100px Arial';
                ctx.fillStyle = this.isCrashed ? 'red' : 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${this.multiplier.toFixed(2)}x`, canvas.width / 2, canvas.height / 2);

                // Отрисовка частиц при краше
                if (this.isCrashed) {
                    this.particles.forEach(p => {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(255, 100, 100, ${p.alpha})`;
                        ctx.fill();
                        p.x += p.vx * 0.016;
                        p.y += p.vy * 0.016;
                        p.alpha -= 0.02;
                        p.radius *= 0.98;
                    });
                    this.particles = this.particles.filter(p => p.alpha > 0);
                }
            }
        }

        const simulator = new AviatorSimulator();
        let lastTime = performance.now();

        function animate() {
            const currentTime = performance.now();
            const deltaTime = (currentTime - lastTime) / 1000; // В секундах
            lastTime = currentTime;

            simulator.update(deltaTime);
            simulator.draw();
            requestAnimationFrame(animate);
        }

        animate();
    </script>
</body>
</html>