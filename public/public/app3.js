let voices=[];function loadVoices(){voices=window.speechSynthesis?speechSynthesis.getVoices():[]}
if(window.speechSynthesis){speechSynthesis.onvoiceschanged=loadVoices;loadVoices()}
function speak(txt){if(!window.speechSynthesis)return;stopSpeak();const u=new SpeechSynthesisUtterance(cleanSpeech(txt));const b=bcpOf(settings.lang);u.lang=b;const v=voices.find(v=>v.lang&&v.lang.replace('_','-').toLowerCase().startsWith(b.slice(0,2).toLowerCase()));if(v)u.voice=v;u.rate=1;speechSynthesis.speak(u)}
function stopSpeak(){if(window.speechSynthesis)speechSynthesis.cancel()}
function toggleSpeak(txt){if(window.speechSynthesis&&speechSynthesis.speaking){stopSpeak()}else speak(txt)}
function toggleMic(){
  if(micOn){rec&&rec.stop();return}
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){toast(t('micNo'));return}
  rec=new SR();rec.lang=bcpOf(settings.lang);rec.interimResults=true;rec.continuous=false;rec.maxAlternatives=1;
  micBase=input.value?input.value.replace(/\s*$/,' '):'';
  rec.onresult=e=>{let fin='',inter='';for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)fin+=r[0].transcript;else inter+=r[0].transcript}input.value=micBase+fin+inter;autosize()};
  rec.onend=()=>{micOn=false;btnMic.classList.remove('listening')};
  micOn=true;btnMic.classList.add('listening');toast(t('listening'));rec.start();
}
function renderAttach(){
  const row=el('attachRow');row.innerHTML='';
  attachments.forEach((a,i)=>{const c=document.createElement('span');c.className='fchip';c.innerHTML=(a.data&&a.mime.startsWith('image/')?'🖼️ ':icon('clip'))+'<span>'+esc(a.name)+'</span><button aria-label="remove">'+icon('x')+'</button>';c.querySelector('button').onclick=()=>{attachments.splice(i,1);renderAttach()};row.appendChild(c)});
}
async function addFile(f){
  if(f.size>8*1024*1024){toast(t('fileBig'));return}
  const isText=/^text\//.test(f.type)||/\.(txt|md|csv|json|js|ts|py|html|css|xml|yml|yaml|log)$/i.test(f.name);
  if(isText){const txt=await f.text();attachments.push({name:f.name,mime:f.type||'text/plain',text:txt.slice(0,60000)})}
  else{const data=await new Promise(r=>{const rd=new FileReader();rd.onload=()=>r(String(rd.result).split(',')[1]);rd.readAsDataURL(f)});attachments.push({name:f.name,mime:f.type||'application/octet-stream',data})}
  renderAttach();
}
let toastTimer=null;
function toast(s){const elT=el('toast');elT.textContent=s;elT.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>elT.classList.remove('show'),2200)}
function autosize(){input.style.height='auto';input.style.height=Math.min(input.scrollHeight,160)+'px'}
function updatePlaceholder(){input.placeholder=t(mode==='image'?'phImage':'phChat')}
function setMode(m){
  mode=m;
  document.querySelectorAll('#modeBar .mchip').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));
  el('translateBar').hidden=m!=='translate';el('writeBar').hidden=m!=='write';
  updatePlaceholder();
}
function openSettings(){el('mKey').value=settings.key;el('selLang').value=settings.lang;el('selModel').value=settings.model;el('selTheme').value=settings.theme;el('chkSpeak').checked=!!settings.autoSpeak;el('modalWrap').hidden=false}
function closeSettings(){el('modalWrap').hidden=true}
function openDrawer(){el('sidebar').classList.add('open');el('backdrop').classList.add('show')}
function closeDrawer(){el('sidebar').classList.remove('open');el('backdrop').classList.remove('show')}
function applyTheme(){document.documentElement.setAttribute('data-theme',settings.theme);el('btnTheme').innerHTML=icon(settings.theme==='dark'?'sun':'moon')}
function applyLang(){
  const L=settings.lang;document.documentElement.lang=L;
  document.documentElement.dir=(L==='ar'||L==='ur')?'rtl':'ltr';
  document.querySelectorAll('[data-i18n]').forEach(e=>{e.textContent=t(e.dataset.i18n)});
  document.querySelectorAll('[data-i18n-tip]').forEach(e=>{const s=t(e.dataset.i18nTip);e.setAttribute('aria-label',s);e.title=s});
  el('selFrom').innerHTML='<option value="auto">'+t('auto')+'</option>'+LANGS.map(l=>'<option value="'+l[0]+'">'+l[1]+'</option>').join('');
  el('selTo').innerHTML=LANGS.map(l=>'<option value="'+l[0]+'">'+l[1]+'</option>').join('');
  el('selTo').value=LANGS.some(l=>l[0]===settings.lang)?settings.lang:'en';
  updatePlaceholder();renderSidebar();renderChat();
}
(function init(){
  el('logo1').innerHTML=icon('spark');el('logo2').innerHTML=icon('spark');
  el('btnMenu').innerHTML=icon('menu');el('btnSettings').innerHTML=icon('gear');el('btnCloseSide').innerHTML=icon('x');
  el('btnNew').innerHTML=icon('plus')+'<span data-i18n="newChat"></span>';
  el('btnAttach').innerHTML=icon('clip');el('btnMic').innerHTML=icon('mic');setSendUI(false);
  el('btnSwap').innerHTML=icon('swap');el('mClose').innerHTML=icon('x');el('mEye').innerHTML=icon('eye');
  el('modeBar').innerHTML=[['chat','chat','mChat'],['write','pen','mWrite'],['translate','lang','mTranslate'],['image','img','mImage']].map(m=>'<button class="mchip" data-mode="'+m[0]+'">'+icon(m[1])+'<span data-i18n="'+m[2]+'"></span></button>').join('');
  document.querySelectorAll('#modeBar .mchip').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  el('writeBar').innerHTML=[['wBlog','pBlog'],['wEmail','pEmail'],['wScript','pScript'],['wAd','pAd'],['wCaption','pCaption']].map(w=>'<button class="wchip2" data-i18n="'+w[0]+'" data-p="'+w[1]+'"></button>').join('');
  document.querySelectorAll('#writeBar .wchip2').forEach(b=>b.onclick=()=>{input.value=t(b.dataset.p);input.focus();autosize()});
  el('selLang').innerHTML=UI_LANGS.map(l=>'<option value="'+l[0]+'">'+l[1]+'</option>').join('');
  el('btnMenu').onclick=openDrawer;el('btnCloseSide').onclick=closeDrawer;el('backdrop').onclick=closeDrawer;
  el('btnNew').onclick=()=>{activeId=null;store.set('dah_active',null);renderSidebar();renderChat();closeDrawer()};
  el('btnTheme').onclick=()=>{settings.theme=settings.theme==='dark'?'light':'dark';store.set('dah_settings',settings);applyTheme()};
  el('btnSettings').onclick=openSettings;el('mClose').onclick=closeSettings;
  el('modalWrap').addEventListener('click',e=>{if(e.target.id==='modalWrap')closeSettings()});
  el('mEye').onclick=()=>{const k=el('mKey');k.type=k.type==='password'?'text':'password'};
  el('mSave').onclick=()=>{settings.key=el('mKey').value.trim();settings.lang=el('selLang').value;settings.model=el('selModel').value;settings.theme=el('selTheme').value;settings.autoSpeak=el('chkSpeak').checked;store.set('dah_settings',settings);applyTheme();applyLang();closeSettings();toast(t('saved'))};
  el('mClear').onclick=()=>{if(confirm(t('confirmClear'))){chats=[];activeId=null;saveChats();renderSidebar();renderChat();closeSettings()}};
  el('btnAttach').onclick=()=>el('fileInput').click();
  el('fileInput').onchange=async()=>{for(const f of el('fileInput').files){await addFile(f)}el('fileInput').value=''};
  btnMic.onclick=toggleMic;
  btnSend.onclick=()=>{if(streaming){controller&&controller.abort()}else send()};
  input.addEventListener('input',autosize);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}});
  applyTheme();applyLang();setMode('chat');
  fetch('/api/health',{cache:'no-store'}).then(r=>r.json()).then(j=>{serverHasKey=!!j.hasKey;refreshKeyUI()}).catch(()=>{serverHasKey=false});
})();
