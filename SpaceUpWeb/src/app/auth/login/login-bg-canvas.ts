export function startCanvasAnimation() {
  const canvas = document.getElementById('bgCanvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d')!;
  let w = (canvas.width = window.innerWidth);
  let h = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  const blobs = Array.from({ length: 6 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 300 + 200,
    dx: (Math.random() - 0.5) * 0.2,
    dy: (Math.random() - 0.5) * 0.2,
    color: ['#5955B3', '#9385FE', '#6E63C9', '#443E9F', '#7A6FEF', '#282C76'][Math.floor(Math.random() * 6)],
  }));

  interface ShootingStar {
    x: number;
    y: number;
    length: number;
    speed: number;
    opacity: number;
    trail: { x: number; y: number; opacity: number }[];
    active: boolean;
    angle: number;
  }

  const shootingStars: ShootingStar[] = [];

  function createShootingStar(): ShootingStar {
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.3;
    return {
      x: Math.random() * w * 0.7,
      y: Math.random() * h * 0.3,
      length: Math.random() * 80 + 60,
      speed: Math.random() * 8 + 12,
      opacity: 1,
      trail: [],
      active: true,
      angle: angle,
    };
  }

  function spawnShootingStar() {
    if (shootingStars.length < 3 && Math.random() < 0.015) {
      shootingStars.push(createShootingStar());
    }
  }

  function updateShootingStars() {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
      const star = shootingStars[i];
      
      star.trail.unshift({ x: star.x, y: star.y, opacity: star.opacity });
      
      if (star.trail.length > 20) {
        star.trail.pop();
      }
      
      star.x += Math.cos(star.angle) * star.speed;
      star.y += Math.sin(star.angle) * star.speed;
      
      if (star.x > w + 100 || star.y > h + 100) {
        star.opacity -= 0.05;
      }
      
      if (star.opacity <= 0) {
        shootingStars.splice(i, 1);
      }
    }
  }

  function drawShootingStars() {
    shootingStars.forEach((star) => {
      star.trail.forEach((point, index) => {
        const trailOpacity = (1 - index / star.trail.length) * point.opacity * 0.8;
        const trailWidth = (1 - index / star.trail.length) * 3;
        
        ctx.beginPath();
        ctx.arc(point.x, point.y, trailWidth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 178, 61, ${trailOpacity})`;
        ctx.fill();
      });
      
      const gradient = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 6);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
      gradient.addColorStop(0.3, `rgba(245, 178, 61, ${star.opacity * 0.8})`);
      gradient.addColorStop(1, 'rgba(245, 178, 61, 0)');
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
      ctx.fill();
    });
  }

  interface StaticStar {
    x: number;
    y: number;
    size: number;
    opacity: number;
    twinkleSpeed: number;
    twinkleOffset: number;
  }

  const staticStars: StaticStar[] = Array.from({ length: 50 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.5 + 0.3,
    twinkleSpeed: Math.random() * 0.02 + 0.01,
    twinkleOffset: Math.random() * Math.PI * 2,
  }));

  let time = 0;

  function drawStaticStars() {
    staticStars.forEach((star) => {
      const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
      const currentOpacity = star.opacity * twinkle;
      
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
      ctx.fill();
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    time++;

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#4C48A2');
    bg.addColorStop(1, '#282C76');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    blobs.forEach((b) => {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      grad.addColorStop(0, `${b.color}90`);
      grad.addColorStop(1, `${b.color}00`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();

      b.x += b.dx;
      b.y += b.dy;

      if (b.x < -b.r) b.x = w + b.r;
      if (b.x > w + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = h + b.r;
      if (b.y > h + b.r) b.y = -b.r;
    });

    drawStaticStars();
    spawnShootingStar();
    updateShootingStars();
    drawShootingStars();

    requestAnimationFrame(draw);
  }

  draw();
}