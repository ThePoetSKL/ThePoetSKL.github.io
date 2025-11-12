// script.js — animated particle background with click effects
// Keeps canvas full-screen and draws moving nodes + links. Clicks create particle bursts.

(() => {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W = canvas.width = innerWidth;
  let H = canvas.height = innerHeight;
  const DPR = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = W * DPR; canvas.height = H * DPR; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.scale(DPR, DPR);

  const nodes = [];
  const mouse = {x: W/2, y: H/2};
  const NODE_COUNT = Math.max(28, Math.floor((W*H)/50000));

  function rand(min, max){return Math.random()*(max-min)+min}

  class Node{
    constructor(){
      this.reset();
    }
    reset(){
      this.x = rand(0, W);
      this.y = rand(0, H);
      const speed = rand(0.15, 0.7);
      const ang = rand(0, Math.PI*2);
      this.vx = Math.cos(ang)*speed;
      this.vy = Math.sin(ang)*speed;
      this.r = rand(1.2, 3.2);
      this.baseR = this.r;
      this.phase = rand(0, Math.PI*2);
    }
    step(){
      this.x += this.vx;
      this.y += this.vy;
      this.phase += 0.02;
      this.r = this.baseR + Math.sin(this.phase)*0.6;
      if(this.x<-20||this.x>W+20||this.y<-20||this.y>H+20) this.reset();
    }
    draw(){
      ctx.beginPath();
      const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r*6);
      g.addColorStop(0, 'rgba(32,244,255,0.9)');
      g.addColorStop(0.35, 'rgba(32,244,255,0.25)');
      g.addColorStop(1, 'rgba(32,244,255,0)');
      ctx.fillStyle = g;
      ctx.arc(this.x, this.y, this.r*4, 0, Math.PI*2);
      ctx.fill();
    }
  }

  for(let i=0;i<NODE_COUNT;i++) nodes.push(new Node());

  function connectNodes(){
    const maxDist = 140;
    for(let i=0;i<nodes.length;i++){
      const a = nodes[i];
      for(let j=i+1;j<nodes.length;j++){
        const b = nodes[j];
        const dx = a.x-b.x; const dy = a.y-b.y;
        const d = Math.sqrt(dx*dx+dy*dy);
        if(d<maxDist){
          const alpha = 1 - d/maxDist;
          ctx.strokeStyle = `rgba(32,244,255,${0.09*alpha})`;
          ctx.lineWidth = 1*alpha;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // connect to mouse if near
      const md = Math.hypot(a.x-mouse.x, a.y-mouse.y);
      if(md < 160){
        const alpha = 1 - md/160;
        ctx.strokeStyle = `rgba(255,102,184,${0.06*alpha})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
  }

  // click burst particles
  const bursts = [];
  class BurstParticle{
    constructor(x,y){
      this.x = x; this.y = y;
      const ang = rand(0, Math.PI*2);
      const s = rand(1.8, 6);
      this.vx = Math.cos(ang)*s; this.vy = Math.sin(ang)*s;
      this.life = rand(40,80); this.age=0; this.r = rand(1,3);
      this.color = Math.random() > 0.5 ? 'rgba(32,244,255,' : 'rgba(255,102,184,';
    }
    step(){
      this.x += this.vx; this.y += this.vy; this.vy += 0.03; this.age++;
    }
    draw(){
      const t = 1 - this.age/this.life;
      ctx.fillStyle = this.color + (0.9*t) + ')';
      ctx.beginPath(); ctx.arc(this.x,this.y,this.r*t,0,Math.PI*2); ctx.fill();
    }
    get dead(){return this.age>=this.life}
  }

  function animate(){
    ctx.clearRect(0,0,W,H);

    // subtle background gradient
    const g = ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'rgba(5,6,10,0.95)');
    g.addColorStop(1,'rgba(11,15,26,0.95)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // step and draw nodes
    for(const n of nodes){ n.step(); n.draw(); }

    // draw lines
    connectNodes();

    // draw bursts
    for(let i=bursts.length-1;i>=0;i--){ const p=bursts[i]; p.step(); p.draw(); if(p.dead) bursts.splice(i,1); }

    requestAnimationFrame(animate);
  }
  animate();

  // responsiveness
  function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; canvas.width = W * DPR; canvas.height = H * DPR; canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; ctx.scale(DPR, DPR); }
  addEventListener('resize', ()=>{ // debounce
    setTimeout(()=>{ resize(); },120);
  });

  // mouse follow
  addEventListener('mousemove', (e)=>{ mouse.x = e.clientX; mouse.y = e.clientY; });
  addEventListener('touchmove', (e)=>{ if(e.touches && e.touches[0]){ mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; } },{passive:true});

  // create burst at position
  function createBurst(x,y){
    const count = Math.round(rand(14,26));
    for(let i=0;i<count;i++) bursts.push(new BurstParticle(x,y));
  }

  // click handler: particle burst + ripple effect on closest card
  addEventListener('click', (e)=>{
    const x = e.clientX; const y = e.clientY; createBurst(x,y);

    // ripple on clicked element if it's a .card or .btn
    let el = e.target;
    while(el && el !== document.body){
      if(el.classList && (el.classList.contains('card') || el.classList.contains('btn'))){
        el.animate([
          { boxShadow: '0 6px 24px rgba(32,244,255,0.06)', transform: 'scale(1)' },
          { boxShadow: '0 18px 40px rgba(32,244,255,0.12)', transform: 'scale(1.02)' },
          { boxShadow: '0 6px 24px rgba(32,244,255,0.06)', transform: 'scale(1)' }
        ],{ duration:420, easing:'cubic-bezier(.2,.9,.3,1)' });
        break;
      }
      el = el.parentElement;
    }
  });

  // small accessibility: press space on focused .card triggers burst
  addEventListener('keydown',(e)=>{
    if(e.code==='Space' && document.activeElement && document.activeElement.classList.contains('card')){
      const rect = document.activeElement.getBoundingClientRect();
      createBurst(rect.left + rect.width/2, rect.top + rect.height/2);
    }
  });

})();
