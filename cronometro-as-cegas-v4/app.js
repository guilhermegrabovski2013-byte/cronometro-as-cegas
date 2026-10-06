let room={code:"",host:"",target:0,count:0,players:[],started:false};let current=0,elapsed=0,base=0,running=false,lastPause=null,raf=null,resultTimer=null;

function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active")}
function toast(t){let x=document.getElementById("toast");x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),2200)}
function modal(t,p,i="⚠️"){document.getElementById("modalIcon").textContent=i;document.getElementById("modalTitle").textContent=t;document.getElementById("modalText").textContent=p;document.getElementById("modal").classList.remove("hidden")}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
function code(){return Math.random().toString(36).slice(2,8).toUpperCase()}
function createRoom(){
 const name=document.getElementById("hostName").value.trim(),target=Number(document.getElementById("target").value),count=Number(document.getElementById("count").value),err=document.getElementById("createError");
 if(!name||!target||target<=0||count<2||count>20){err.textContent="Preencha nome, tempo-alvo e quantidade de jogadores corretamente.";return}
 room={code:code(),host:name,target,count,players:[{name,host:true,alive:true}],started:false};renderLobby();show("lobby")
}
function joinRoom(){
 const name=document.getElementById("joinName").value.trim(),c=document.getElementById("roomCode").value.trim().toUpperCase(),err=document.getElementById("joinError");
 if(!name||c.length!==6){err.textContent="Informe seu nome e um código de 6 caracteres.";return}
 /* Primeira versão: demonstração local. Salas reais entre dispositivos exigirão backend. */
 room={code:c,host:"Criador",target:3.62,count:4,players:[{name:"Criador",host:true,alive:true},{name,host:false,alive:true}],started:false};
 renderLobby();show("lobby");toast("Sala carregada em modo demonstração")
}
function renderLobby(){
 document.getElementById("lobbyCode").textContent=room.code;document.getElementById("shareCode").textContent=room.code;document.getElementById("lobbyTarget").textContent=room.target.toFixed(2)+" s";
 document.getElementById("playerTotal").textContent=room.players.length;
 document.getElementById("lobbyPlayers").innerHTML=room.players.map((p,i)=>`<div class="player"><span class="avatar">${i+1}</span><strong>${safe(p.name)}</strong>${p.host?'<span class="host">CRIADOR</span>':''}</div>`).join("");
 document.getElementById("startMatch").disabled=room.players.length<2;
}
function copyRoom(){navigator.clipboard?.writeText(room.code);toast("Código copiado: "+room.code)}
function startMatch(){
 if(room.players.length<2){toast("É preciso ter pelo menos 2 jogadores.");return}
 room.players.sort(()=>Math.random()-.5);current=0;elapsed=0;base=0;running=false;lastPause=null;room.started=true;renderGame();show("game")
}
function renderGame(){
 let p=room.players[current];document.getElementById("turnName").textContent=p?.name||"—";document.getElementById("gameTarget").textContent="ALVO: "+room.target.toFixed(2)+" s";
 document.getElementById("gamePlayers").innerHTML=room.players.map((x,i)=>x.alive?`<div class="player"><span class="avatar">${i+1}</span><strong>${safe(x.name)}</strong>${i===current?'<span class="host">VEZ</span>':''}</div>`:"").join("");
}
function safe(s){let d=document.createElement("div");d.textContent=s;return d.innerHTML}
function tick(){if(!running)return;elapsed=base+(performance.now()-startedAt)/1000;raf=requestAnimationFrame(tick)}
function startTimer(){
 if(running)return;running=true;startedAt=performance.now();document.getElementById("startBtn").disabled=true;document.getElementById("pauseBtn").disabled=false;document.getElementById("gameStatus").textContent="Cronômetro correndo — tempo escondido.";cancelAnimationFrame(raf);raf=requestAnimationFrame(tick)
}
function pauseTimer(){
 if(!running)return;elapsed=base+(performance.now()-startedAt)/1000;base=elapsed;running=false;cancelAnimationFrame(raf);lastPause=room.players[current];nextTurn();document.getElementById("gameStatus").textContent="Pausado. A vez passou.";document.getElementById("startBtn").disabled=false;document.getElementById("pauseBtn").disabled=true
}
function nextTurn(){for(let i=1;i<=room.players.length;i++){current=(current+1)%room.players.length;if(room.players[current].alive)break}renderGame()}
function doubt(){
 if(elapsed<=0){toast("Inicie o cronômetro primeiro.");return}
 if(running){elapsed=base+(performance.now()-startedAt)/1000;base=elapsed;running=false;cancelAnimationFrame(raf)}
 let passed=elapsed>=room.target,loser=passed?(lastPause&&lastPause.alive?lastPause:room.players[current]):room.players[current];
 loser.alive=false;
 document.querySelector(".timer").classList.add("revealed");document.getElementById("timer").textContent=elapsed.toFixed(2)+"s";
 document.getElementById("result").innerHTML=`<div class="eyebrow">TEMPO REVELADO</div><div class="time">${elapsed.toFixed(2)}s</div><h3>${passed?"ALVO ATINGIDO/PASSADO":"ALVO NÃO ATINGIDO"}</h3><p>${safe(loser.name)} foi eliminado.</p>`;document.getElementById("result").classList.remove("hidden");
 document.getElementById("doubtBtn").disabled=true;renderGame();
 resultTimer=setTimeout(()=>{document.querySelector(".timer").classList.remove("revealed");document.getElementById("timer").textContent="████";document.getElementById("result").classList.add("hidden");elapsed=0;base=0;lastPause=null;let alive=room.players.filter(x=>x.alive);if(alive.length<=1){document.getElementById("winnerName").textContent=alive[0]?.name||"—";document.getElementById("winnerText").textContent="Você chegou ao fim da partida.";show("winner");return}if(!room.players[current].alive)nextTurn();document.getElementById("doubtBtn").disabled=false;document.getElementById("gameStatus").textContent="Próxima rodada pronta.";},2300)
}
function newMatch(){room.players.forEach(p=>p.alive=true);room.started=false;elapsed=base=0;current=0;renderLobby();show("lobby")}
function confirmLeave(){modal("Sair da partida?","Você perderá o estado desta demonstração.","🚪")}


// ===== MODO SOLO / PRÁTICA =====
let solo={target:3.62,elapsed:0,base:0,running:false,startedAt:0,raf:null,attempts:0,best:null,finished:false};

function showSoloSetup(){
  const input=document.getElementById("soloTarget");
  input.value=solo.target.toFixed(2);
  document.getElementById("soloSetupError").textContent="";
  show("soloSetup");
}

function startSolo(){
  const target=Number(document.getElementById("soloTarget").value),err=document.getElementById("soloSetupError");
  if(!Number.isFinite(target)||target<0.10||target>3600){err.textContent="Escolha um tempo entre 0,10 e 3600 segundos.";return}
  solo.target=target;solo.attempts=0;solo.best=null;
  updateSoloStats();resetSoloRound();show("solo");
}

function updateSoloStats(){
  document.getElementById("soloAttempts").textContent=solo.attempts;
  document.getElementById("soloBest").textContent=solo.best===null?"—":solo.best.toFixed(2)+" s";
  document.getElementById("soloGameTarget").textContent="ALVO: "+solo.target.toFixed(2)+" s";
}

function soloTick(){
  if(!solo.running)return;
  solo.elapsed=solo.base+(performance.now()-solo.startedAt)/1000;
  solo.raf=requestAnimationFrame(soloTick);
}

function soloStartTimer(){
  if(solo.finished)return;
  if(solo.running)return;
  solo.running=true;solo.startedAt=performance.now();
  document.getElementById("soloStartBtn").disabled=true;
  document.getElementById("soloPauseBtn").disabled=false;
  document.getElementById("soloDoubtBtn").disabled=false;
  document.getElementById("soloStatus").textContent="Correndo... pare quando achar que chegou ao alvo.";
  cancelAnimationFrame(solo.raf);solo.raf=requestAnimationFrame(soloTick);
}

function soloPauseTimer(){
  if(!solo.running)return;
  solo.elapsed=solo.base+(performance.now()-solo.startedAt)/1000;
  solo.base=solo.elapsed;solo.running=false;cancelAnimationFrame(solo.raf);
  document.getElementById("soloStartBtn").disabled=false;
  document.getElementById("soloPauseBtn").disabled=true;
  document.getElementById("soloStatus").textContent="Pausado. Clique em INICIAR para continuar.";
}

function soloDoubt(){
  if(!solo.running&&solo.elapsed<=0){toast("Clique em INICIAR primeiro.");return}
  if(solo.running){
    solo.elapsed=solo.base+(performance.now()-solo.startedAt)/1000;
    solo.base=solo.elapsed;solo.running=false;cancelAnimationFrame(solo.raf);
  }
  solo.finished=true;solo.attempts++;
  const diff=Math.abs(solo.elapsed-solo.target);
  if(solo.best===null||diff<solo.best)solo.best=diff;
  updateSoloStats();
  const passed=solo.elapsed>=solo.target;
  let quality="Boa tentativa!";
  if(diff<0.05)quality="🔥 PERFEITO! Você chegou muito perto.";
  else if(diff<0.20)quality="🎯 Excelente precisão!";
  else if(diff<0.50)quality="👏 Muito bom!";
  else if(diff<1)quality="👍 Continue treinando.";
  else quality="💪 Tente de novo e procure melhorar.";
  document.getElementById("soloTimerBox").classList.add("revealed");
  document.getElementById("soloTimer").textContent=solo.elapsed.toFixed(2)+"s";
  document.getElementById("soloStatus").textContent="Tempo revelado.";
  document.getElementById("soloStartBtn").disabled=true;
  document.getElementById("soloPauseBtn").disabled=true;
  document.getElementById("soloDoubtBtn").disabled=true;
  document.getElementById("soloResult").innerHTML=`<div class="eyebrow">RESULTADO</div><div class="time">${solo.elapsed.toFixed(2)}s</div><h3>${quality}</h3><p>Alvo: <b>${solo.target.toFixed(2)}s</b> • Diferença: <b>${diff.toFixed(2)}s</b> • ${passed?"Você passou do alvo.":"Você ficou abaixo do alvo."}</p>`;
  document.getElementById("soloResult").classList.remove("hidden");
  document.getElementById("soloAgainBtn").classList.remove("hidden");
}

function resetSoloRound(){
  cancelAnimationFrame(solo.raf);solo.running=false;solo.finished=false;solo.elapsed=0;solo.base=0;
  document.getElementById("soloTimerBox").classList.remove("revealed");
  document.getElementById("soloTimer").textContent="████";
  document.getElementById("soloStatus").textContent="Pronto. Clique em INICIAR.";
  document.getElementById("soloStartBtn").disabled=false;
  document.getElementById("soloPauseBtn").disabled=true;
  document.getElementById("soloDoubtBtn").disabled=true;
  document.getElementById("soloResult").classList.add("hidden");
  document.getElementById("soloAgainBtn").classList.add("hidden");
  updateSoloStats();
}

// Atalho de teclado: ESPAÇO pausa/despausa o cronômetro.
document.addEventListener("keydown",(event)=>{
  if(event.code!=="Space" || event.repeat) return;
  const tag=document.activeElement?.tagName;
  if(tag==="INPUT" || tag==="TEXTAREA" || tag==="SELECT" || document.activeElement?.isContentEditable) return;

  const soloScreen=document.getElementById("solo");
  const gameScreen=document.getElementById("game");

  if(soloScreen?.classList.contains("active")){
    event.preventDefault();
    if(solo.finished) return;
    if(solo.running) soloPauseTimer();
    else soloStartTimer();
    return;
  }

  if(gameScreen?.classList.contains("active")){
    event.preventDefault();
    if(running) pauseTimer();
    else startTimer();
  }
});

// ===== MODO OFFLINE / AMIGOS NO MESMO DISPOSITIVO =====
let offline={target:3.62,players:[],current:0,elapsed:0,base:0,running:false,startedAt:0,lastPauseIndex:null,raf:null,resultTimer:null,started:false};

function showOfflineSetup(){
  document.getElementById('offlineSetupError').textContent='';
  const input=document.getElementById('offlineTarget');
  input.value=offline.target.toFixed(2);
  show('offlineSetup');
}

function buildOfflineNames(){
  const target=Number(document.getElementById('offlineTarget').value);
  const count=Math.floor(Number(document.getElementById('offlineCount').value));
  const err=document.getElementById('offlineSetupError');
  if(!Number.isFinite(target)||target<0.10||target>3600){err.textContent='Escolha um tempo entre 0,10 e 3600 segundos.';return}
  if(!Number.isFinite(count)||count<2||count>20){err.textContent='Escolha entre 2 e 20 jogadores.';return}
  offline.target=target;
  const wrap=document.getElementById('offlineNameInputs');
  wrap.innerHTML='';
  for(let i=0;i<count;i++){
    const label=document.createElement('label');
    label.textContent=`Jogador ${i+1}`;
    const input=document.createElement('input');
    input.type='text'; input.maxLength=24; input.placeholder=`Nome do jogador ${i+1}`; input.dataset.index=i;
    label.appendChild(input); wrap.appendChild(label);
  }
  document.getElementById('offlineNamesError').textContent='';
  show('offlineNames');
  wrap.querySelector('input')?.focus();
}

function sortOfflinePlayers(){
  const inputs=[...document.querySelectorAll('#offlineNameInputs input')];
  if(inputs.length<2){showOfflineSetup();return}
  const names=inputs.map(i=>i.value.trim());
  const err=document.getElementById('offlineNamesError');
  if(names.some(n=>!n)){err.textContent='Preencha o nome de todos os jogadores.';return}
  const normalized=names.map(n=>n.toLowerCase());
  if(new Set(normalized).size!==normalized.length){err.textContent='Os nomes precisam ser diferentes.';return}
  err.textContent='';
  offline.players=names.map(name=>({name,alive:true}));
  for(let i=offline.players.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[offline.players[i],offline.players[j]]=[offline.players[j],offline.players[i]];}
  offline.current=0; offline.elapsed=0; offline.base=0; offline.running=false; offline.lastPauseIndex=null; offline.started=false;
  renderOfflineOrder();
  show('offlineOrder');
}

function renderOfflineOrder(){
  const list=document.getElementById('offlineOrderList');
  list.innerHTML=offline.players.map((p,i)=>`<div class="order-item" style="animation-delay:${i*70}ms"><span class="order-number">${i+1}</span><strong>${safe(p.name)}</strong>${i===0?'<span class="order-badge">COMEÇA</span>':''}</div>`).join('');
}

function startOfflineMatch(){
  if(offline.players.length<2){showOfflineSetup();return}
  offline.players.forEach(p=>p.alive=true); offline.current=0; offline.elapsed=0; offline.base=0; offline.running=false; offline.lastPauseIndex=null; offline.started=true;
  cancelAnimationFrame(offline.raf);
  resetOfflineUI(); renderOfflineGame(); show('offlineGame');
}

function renderOfflineGame(){
  const current=offline.players[offline.current];
  document.getElementById('offlineTurnName').textContent=current?.name||'—';
  document.getElementById('offlineGameTarget').textContent='ALVO: '+offline.target.toFixed(2)+' s';
  document.getElementById('offlineGamePlayers').innerHTML=offline.players.map((p,i)=>{
    const dead=!p.alive;
    return `<div class="player ${dead?'offline-dead':''}"><span class="avatar">${i+1}</span><strong>${safe(p.name)}</strong>${dead?'<span class="offline-eliminated-badge">ELIMINADO</span>':(i===offline.current?'<span class="host">VEZ</span>':'<span class="offline-alive-badge">ATIVO</span>')}</div>`;
  }).join('');
}

function offlineTick(){
  if(!offline.running)return;
  offline.elapsed=offline.base+(performance.now()-offline.startedAt)/1000;
  offline.raf=requestAnimationFrame(offlineTick);
}

function offlineStartTimer(){
  if(!offline.started||offline.running)return;
  offline.running=true; offline.startedAt=performance.now();
  document.getElementById('offlineStartBtn').disabled=true;
  document.getElementById('offlinePauseBtn').disabled=false;
  document.getElementById('offlineDoubtBtn').disabled=false;
  document.getElementById('offlineGameStatus').textContent='Cronômetro correndo — tempo escondido.';
  cancelAnimationFrame(offline.raf); offline.raf=requestAnimationFrame(offlineTick);
}

function offlinePauseTimer(){
  if(!offline.running)return;
  offline.elapsed=offline.base+(performance.now()-offline.startedAt)/1000;
  offline.base=offline.elapsed; offline.running=false; cancelAnimationFrame(offline.raf);
  offline.lastPauseIndex=offline.current;
  offline.current=offlineNextAlive(offline.current);
  document.getElementById('offlineStartBtn').disabled=false;
  document.getElementById('offlinePauseBtn').disabled=true;
  document.getElementById('offlineGameStatus').textContent='Pausado. A vez passou para '+offline.players[offline.current].name+'.';
  renderOfflineGame();
}

function offlineNextAlive(from){
  for(let step=1;step<=offline.players.length;step++){
    const idx=(from+step)%offline.players.length;
    if(offline.players[idx].alive)return idx;
  }
  return from;
}

function offlineDoubt(){
  if(!offline.running&&offline.elapsed<=0){toast('Clique em INICIAR primeiro.');return;}
  if(offline.running){
    offline.elapsed=offline.base+(performance.now()-offline.startedAt)/1000;
    offline.base=offline.elapsed; offline.running=false; cancelAnimationFrame(offline.raf);
  }
  const passed=offline.elapsed>=offline.target;
  let loserIndex=offline.current;
  if(passed && offline.lastPauseIndex!==null && offline.players[offline.lastPauseIndex]?.alive){loserIndex=offline.lastPauseIndex;}
  const loser=offline.players[loserIndex];
  loser.alive=false;
  const doubterIndex=offline.current;
  const alive=offline.players.filter(p=>p.alive);

  document.getElementById('offlineTimerBox').classList.add('revealed');
  document.getElementById('offlineTimer').textContent=offline.elapsed.toFixed(2)+'s';
  document.getElementById('offlineStartBtn').disabled=true;
  document.getElementById('offlinePauseBtn').disabled=true;
  document.getElementById('offlineDoubtBtn').disabled=true;
  document.getElementById('offlineResult').innerHTML=`<div class="eyebrow">TEMPO REVELADO</div><div class="time">${offline.elapsed.toFixed(2)}s</div><h3>${passed?'ALVO ATINGIDO/PASSADO':'ALVO NÃO ATINGIDO'}</h3><p>${safe(loser.name)} foi eliminado${loserIndex===doubterIndex?' por duvidar.':' por ser o último a pausar.'}</p>`;
  document.getElementById('offlineResult').classList.remove('hidden');
  document.getElementById('offlineGameStatus').textContent='Resultado revelado.';
  renderOfflineGame();

  clearTimeout(offline.resultTimer);
  offline.resultTimer=setTimeout(()=>{
    document.getElementById('offlineTimerBox').classList.remove('revealed');
    document.getElementById('offlineTimer').textContent='████';
    document.getElementById('offlineResult').classList.add('hidden');
    offline.elapsed=0; offline.base=0; offline.lastPauseIndex=null;
    if(alive.length<=1){
      document.getElementById('winnerName').textContent=alive[0]?.name||'—';
      document.getElementById('winnerText').textContent='🏆 Vencedor do Modo Offline!';
      show('winner');
      return;
    }
    // A próxima vez começa depois do jogador que duvidou, pulando eliminados.
    offline.current=offlineNextAlive(doubterIndex);
    document.getElementById('offlineStartBtn').disabled=false;
    document.getElementById('offlinePauseBtn').disabled=true;
    document.getElementById('offlineDoubtBtn').disabled=true;
    document.getElementById('offlineGameStatus').textContent='Próxima rodada pronta. Clique em INICIAR.';
    renderOfflineGame();
  },2300);
}

function resetOfflineUI(){
  clearTimeout(offline.resultTimer); cancelAnimationFrame(offline.raf);
  document.getElementById('offlineTimerBox').classList.remove('revealed');
  document.getElementById('offlineTimer').textContent='████';
  document.getElementById('offlineResult').classList.add('hidden');
  document.getElementById('offlineGameStatus').textContent='Pronto. Clique em INICIAR.';
  document.getElementById('offlineStartBtn').disabled=false;
  document.getElementById('offlinePauseBtn').disabled=true;
  document.getElementById('offlineDoubtBtn').disabled=true;
}

function confirmOfflineLeave(){modal('Sair da partida?','O progresso desta partida offline será perdido.','🚪')}

// Atalho ESPAÇO também funciona no Modo Offline.
document.addEventListener('keydown',(event)=>{
  if(event.code!=='Space' || event.repeat)return;
  const tag=document.activeElement?.tagName;
  if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||document.activeElement?.isContentEditable)return;
  const screen=document.getElementById('offlineGame');
  if(!screen?.classList.contains('active'))return;
  event.preventDefault();
  if(offline.running)offlinePauseTimer(); else offlineStartTimer();
});
