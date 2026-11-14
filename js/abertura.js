// js/abertura.js — tela inicial: formigas passeando atrás do texto.
// Usa um gerador próprio (semente 2026), nunca compartilhado com a execução.
import { criarRng } from './prng.js';

const rng = criarRng(2026);
const COR = '#2a1d10';
const abertura = document.getElementById('abertura');
const canvas = document.getElementById('abertura-canvas');
const ctx = canvas.getContext('2d');
const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let W = 0, H = 0;
let idQuadro = 0;
let formigas = [];

// Desenha uma formiga em (x, y) virada para o ângulo ang; t anima as pernas.
function formiga(ctx, x, y, ang, s, cor, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = Math.max(0.8, s * 0.18); ctx.lineCap = 'round';
  const passo = Math.sin(t) * s * 0.45;
  for (let i = -1; i <= 1; i++) {
    const ox = i * s * 0.55, sw = (i % 2 === 0 ? passo : -passo);
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox + sw, -s * 1.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox - sw, s * 1.2); ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(-s * 1.15, 0, s * 0.85, s * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.38, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(s * 0.85, 0, s * 0.42, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(s * 1.1, -s * 0.2); ctx.quadraticCurveTo(s * 1.6, -s * 0.9, s * 2, -s * 0.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(s * 1.1, s * 0.2); ctx.quadraticCurveTo(s * 1.6, s * 0.9, s * 2, s * 0.8); ctx.stroke();
  ctx.restore();
}

function ajustar() {
  const r = canvas.getBoundingClientRect(), d = window.devicePixelRatio || 1;
  canvas.width = Math.round(r.width * d); canvas.height = Math.round(r.height * d);
  ctx.setTransform(d, 0, 0, d, 0, 0);
  W = r.width; H = r.height;
}

function criarFormigas() {
  const qtd = Math.min(60, Math.max(20, Math.round((W * H) / 25000)));
  formigas = [];
  for (let k = 0; k < qtd; k++) formigas.push({
    x: rng() * W, y: rng() * H, a: rng() * 6.28,
    giro: 0, vel: 22 + rng() * 22, tam: 1.8 + rng() * 1.1,
    parada: 0, fase: rng() * 6,
  });
}

function desenhar() {
  ctx.clearRect(0, 0, W, H);
  for (const f of formigas) formiga(ctx, f.x, f.y, f.a, f.tam, COR, f.fase);
}

function mover(dt) {
  for (const f of formigas) {
    if (f.parada > 0) { f.parada -= dt; }
    else {
      f.giro += (rng() - 0.5) * 6 * dt;       // muda a curva aos poucos
      f.giro *= 0.96;
      f.a += f.giro;
      f.x += Math.cos(f.a) * f.vel * dt; f.y += Math.sin(f.a) * f.vel * dt;
      f.fase += dt * f.vel * 0.5;
      if (rng() < 0.15 * dt) f.parada = 0.4 + rng() * 1.2; // para um pouquinho
    }
    const m = 12;                              // sai por uma borda, volta pela outra
    if (f.x < -m) f.x = W + m; else if (f.x > W + m) f.x = -m;
    if (f.y < -m) f.y = H + m; else if (f.y > H + m) f.y = -m;
  }
}

let ultimo = 0;
function quadro(agora) {
  const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
  mover(dt);
  desenhar();
  idQuadro = requestAnimationFrame(quadro);
}

function parar() {
  cancelAnimationFrame(idQuadro);
  idQuadro = 0;
}

ajustar();
criarFormigas();
desenhar();
window.addEventListener('resize', () => {
  if (abertura.hidden) return;
  ajustar();
  for (const f of formigas) { f.x = Math.min(f.x, W); f.y = Math.min(f.y, H); }
  desenhar();
});
if (!reduzir) {
  ultimo = performance.now();
  idQuadro = requestAnimationFrame(quadro);
}

// Iniciar: some com fade, esconde a abertura, para a animação e abre o simulador.
const btnIniciar = document.getElementById('btn-iniciar');
let aberto = false; // garante que a abertura só se fecha uma vez
function concluir() {
  if (aberto) return;
  aberto = true;
  abertura.hidden = true;
  parar();
  document.getElementById('simulador').hidden = false;
  document.dispatchEvent(new CustomEvent('simulador:aberto'));
}
btnIniciar.addEventListener('click', () => {
  if (btnIniciar.disabled) return;
  btnIniciar.disabled = true;
  abertura.classList.add('some');
  abertura.addEventListener('transitionend', (e) => {
    if (e.target === abertura && e.propertyName === 'opacity') concluir();
  });
  setTimeout(concluir, 500); // reserva caso a transição não dispare
});
