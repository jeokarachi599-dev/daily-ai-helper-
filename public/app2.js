function saveChats(){
  const slim=chats.map(c=>({id:c.id,title:c.title,messages:c.messages.map(m=>{const o={role:m.role,text:m.text,ts:m.ts,kind:m.kind};if(m.img&&m.img.length<1500000)o.img=m.img;if(m.atts)o.atts=m.atts.map(a=>({name:a.name,mime:a.mime,text:a.text}));if(m.error)o.error=m.error;return o})}));
  store.set('dah_chats',slim);store.set('dah_active',activeId);
}
const getActive=()=>chats.find(c=>c.id===activeId)||null;
function dayLabel(ts){const d=new Date(ts),now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());const that=new Date(d.getFullYear(),d.getMonth(),d.getDate());const diff=Math.round((today-that)/864e5);if(diff===0)return t('today');if(diff===1)return t('yesterday');return d.toLocaleDateString(bcpOf(settings.lang),{month:'short',day:'numeric'})}
function renderSidebar(){
  sideChats.innerHTML='';
  if(!chats.length){sideChats.innerHTML='<div class="sfoot">'+t('empty')+'</div>';return}
  [...chats].sort((a,b)=>((b.messages[b.messages.length-1]||{}).ts||0)-((a.messages[a.messages.length-1]||{}).ts||0)).forEach(c=>{
    const last=(c.messages[c.messages.length-1]||{}).ts||Date.now();
    const d=document.createElement('div');d.className='schat'+(c.id===activeId?' active':'');
    d.innerHTML='<div class="t"><b>'+esc(c.title||'…')+'</b><span>'+dayLabel(last)+'</span></div><button class="del" aria-label="'+t('confirmDelete')+'">'+icon('trash')+'</button>';
    d.onclick=()=>{activeId=c.id;store.set('dah_active',activeId);renderSidebar();renderChat();closeDrawer()};
    d.querySelector('.del').onclick=e=>{e.stopPropagation();if(confirm(t('confirmDelete'))){chats=chats.filter(x=>x.id!==c.id);if(activeId===c.id)activeId=null;saveChats();renderSidebar();renderChat()}};
    sideChats.appendChild(d);
  });
}
function actsFor(m,isModel){
  const w=document.createElement('div');w.className='acts';
  const add=(ic,tip,fn)=>{const b=document.createElement('button');b.className='abtn';b.title=tip;b.setAttribute('aria-label',tip);b.innerHTML=icon(ic);b.onclick=fn;w.appendChild(b);return b};
  if(m.text)add('copy',t('copy'),()=>{navigator.clipboard.writeText(m.text).then(()=>toast(t('copied')))});
  if(isModel&&m.text){
    add('share',t('share'),async()=>{try{await navigator.share({title:'Daily AI Helper',text:m.text})}catch(e){navigator.clipboard.writeText(m.text).then(()=>toast(t('copied')))}});
    add('vol',t('speak'),()=>toggleSpeak(m.text));
    add('refr',t('regen'),regenerate);
  }
  if(isModel&&m.img)add('down',t('download'),()=>{const a=document.createElement('a');a.href=m.img;a.download='daily-ai-helper.png';a.click()});
  return w;
}
function msgNode(m){
  const w=document.createElement('div');w.className='msg '+(m.role==='user'?'user':'model');
  const b=document.createElement('div');b.className='bubble';
  if(m.role==='user'){
    if(m.atts&&m.atts.length){const a=document.createElement('div');a.className='atts';
      m.atts.forEach(at=>{if(at.data&&at.mime&&at.mime.startsWith('image/')){const im=new Image();im.src='data:'+at.mime+';base64,'+at.data;a.appendChild(im)}else{const c=document.createElement('span');c.className='fchip';c.innerHTML=icon('clip')+'<span>'+esc(at.name)+'</span>';a.appendChild(c)}});
      b.appendChild(a)}
    if(m.text){const d=document.createElement('div');d.textContent=m.text;d.style.whiteSpace='pre-wrap';b.appendChild(d)}
    w.appendChild(b);w.appendChild(actsFor(m,false));
  }else{
    if(m.img){const im=new Image();im.src=m.img;im.className='genimg';b.appendChild(im)}
    else if(m.kind==='image'&&!m.pending&&!m.error&&!m.img&&!m.text){const d=document.createElement('div');d.className='err';d.textContent=t('imgGone');b.appendChild(d)}
    if(m.pending&&!m.text&&!m.img){b.innerHTML='<span class="think"><i></i><i></i><i></i></span>'+(m.kind==='image'?'':'<div class="md"></div>')}
    else if(m.text){const d=document.createElement('div');d.className='md';d.innerHTML=md(m.text);b.appendChild(d)}
    if(m.error){const d=document.createElement('div');d.className='err';d.textContent='⚠️ '+m.error;b.appendChild(d)}
    w.appendChild(b);
    if(!m.pending)w.appendChild(actsFor(m,true));
  }
  return w;
}
function welcomeNode(){
  const w=document.createElement('div');w.className='welcome';
  w.innerHTML='<div class="wlogo">'+icon('spark')+'</div><h1>'+t('welcomeTitle')+'</h1><p>'+t('welcomeSub')+'</p>'
  +((settings.key||serverHasKey)?'':'<div class="keycard"><p>'+t('needKey')+'</p><button class="btn primary" id="wKey">'+t('getKey')+'</button></div>')
  +'<div class="wcards">'+[['chat','chat','mChat','dChat'],['write','pen','mWrite','dWrite'],['translate','lang','mTranslate','dTranslate'],['image','img','mImage','dImage']].map(c=>'<button class="wcard" data-mode="'+c[0]+'"><span class="ic">'+icon(c[1])+'</span><b>'+t(c[2])+'</b><span>'+t(c[3])+'</span></button>').join('')+'</div>'
  +'<div class="wchips">'+[['chat','ex1'],['chat','ex2'],['translate','ex3'],['image','ex4']].map(c=>'<button class="wchip2" data-mode="'+c[0]+'" data-k="'+c[1]+'">'+t(c[1])+'</button>').join('')+'</div>';
  w.querySelectorAll('.wcard').forEach(b=>b.onclick=()=>{setMode(b.dataset.mode);input.focus()});
  w.querySelectorAll('.wchip2').forEach(b=>b.onclick=()=>{setMode(b.dataset.mode);input.value=t(b.dataset.k);send()});
  const k=w.querySelector('#wKey');if(k)k.onclick=openSettings;
  return w;
}
function renderChat(){
  stopSpeak();chatArea.innerHTML='';
  const chat=getActive();
  if(!chat||!chat.messages.length){chatArea.appendChild(welcomeNode());return}
  chat.messages.forEach(m=>chatArea.appendChild(msgNode(m)));
  chatScroll.scrollTop=chatScroll.scrollHeight;
}
function refreshKeyUI(){const c=getActive();if(!c||!c.messages.length)renderChat()}
const pinScroll=()=>{if(chatScroll.scrollHeight-chatScroll.scrollTop-chatScroll.clientHeight<160)chatScroll.scrollTop=chatScroll.scrollHeight};
function ensureChat(){let c=getActive();if(!c){c={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),title:'',messages:[]};chats.unshift(c);activeId=c.id}return c}
function setSendUI(on){streaming=on;btnSend.classList.toggle('streaming',on);btnSend.innerHTML=icon(on?'stop':'send')}
async function send(){
  if(streaming)return;
  const text=input.value.trim();
  if(!text&&!attachments.length)return;
  if(!settings.key&&!serverHasKey){openSettings();toast(t('errKey'));return}
  stopSpeak();
  const chat=ensureChat();
  let finalText=text;
  if(mode==='translate'){const f=el('selFrom').value,to=el('selTo').value;finalText='Translate the following text '+(f!=='auto'?'from '+nameOf(f)+' ':'')+'to '+nameOf(to)+'. Output only the translation, no explanations:\n\n'+text}
  const userMsg={role:'user',text:finalText,atts:attachments.slice(),ts:Date.now()};
  chat.messages.push(userMsg);
  if(!chat.title)chat.title=(text||'📎 '+((attachments[0]||{}).name||'')).slice(0,42);
  attachments=[];renderAttach();input.value='';autosize();
  const mm={role:'model',text:'',ts:Date.now(),pending:true,kind:mode==='image'?'image':'text'};
  chat.messages.push(mm);
  saveChats();renderChat();renderSidebar();
  runFor(chat,mm);
}
async function runFor(chat,mm){
  setSendUI(true);controller=new AbortController();
  const bubble=chatArea.lastElementChild?chatArea.lastElementChild.querySelector('.bubble'):null;
  const mdEl=bubble?bubble.querySelector('.md'):null;
  let raf=false;
  try{
    if(mm.kind==='image'){mm.img=await generateImage(chat,controller.signal)}
    else{await streamText(buildContents(chat),txt=>{mm.text=txt;const th=bubble?bubble.querySelector('.think'):null;if(th)th.remove();if(!raf){raf=true;requestAnimationFrame(()=>{raf=false;if(mdEl)mdEl.innerHTML=md(mm.text);pinScroll()})}},controller.signal)}
  }catch(err){
    if(err.name==='AbortError'){if(!mm.text&&!mm.img)chat.messages=chat.messages.filter(x=>x!==mm)}
    else{console.error(err);mm.error=mapErr(err)}
  }
  mm.pending=false;controller=null;setSendUI(false);saveChats();renderChat();
  if(settings.autoSpeak&&mm.text&&!mm.error)speak(mm.text);
}
function regenerate(){
  const chat=getActive();if(!chat||streaming)return;
  let i=chat.messages.length-1;while(i>=0&&chat.messages[i].role!=='model')i--;if(i<0)return;
  const kind=chat.messages[i].kind;chat.messages.splice(i,1);
  const mm={role:'model',text:'',ts:Date.now(),pending:true,kind:kind||'text'};
  chat.messages.push(mm);renderChat();runFor(chat,mm);
  }
