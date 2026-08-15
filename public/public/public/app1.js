'use strict';
const $=s=>document.querySelector(s);
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const IC={menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',plus:'<path d="M12 5v14M5 12h14"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',gear:'<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',mic:'<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4"/>',clip:'<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',send:'<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/>',stop:'<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none"/>',copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',share:'<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v13"/>',vol:'<path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14"/>',refr:'<path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',down:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',trash:'<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',swap:'<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="M16 21l4-4-4-4"/><path d="M20 17H4"/>',img:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>',chat:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',lang:'<path d="M2 5h12"/><path d="M7 2h1"/><path d="M5 8l6 6"/><path d="M4 14l6-6 2-3"/><path d="M22 22l-5-10-5 10"/><path d="M14 18h6"/>',spark:'<path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" fill="currentColor" stroke="none"/>',eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'};
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
let settings=store.get('dah_settings',{key:'',lang:'en',theme:'light',autoSpeak:false,model:'gemini-2.5-flash'});
let chats=store.get('dah_chats',[]);
let activeId=store.get('dah_active',null);
let mode='chat',attachments=[],streaming=false,controller=null,rec=null,micOn=false,micBase='',serverHasKey=false;
const BASE='https://generativelanguage.googleapis.com/v1beta';
const useOwnKey=()=>!!settings.key;
const el=(id)=>document.getElementById(id);
const chatArea=el('chatArea'),chatScroll=el('chatScroll'),sideChats=el('sideChats'),input=el('input'),btnSend=el('btnSend'),btnMic=el('btnMic');
function md(src){
  const codes=[];
  src=src.replace(/```(\w*)\n?([\s\S]*?)```/g,(m,l,c)=>{codes.push('<pre><code>'+esc(c.replace(/\n$/,''))+'</code></pre>');return '\u0000'+(codes.length-1)+'\u0000';});
  let s=esc(src);
  s=s.replace(/`([^`\n]+)`/g,'<code class="ic">$1</code>');
  s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*\n]+)\*/g,'<em>$1</em>');
  s=s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  const lines=s.split('\n'),out=[];let list=null,para=[];
  const fP=()=>{if(para.length){out.push('<p>'+para.join('<br>')+'</p>');para=[]}};
  const cL=()=>{if(list){out.push(list==='ul'?'</ul>':'</ol>');list=null}};
  for(const ln of lines){
    const h=ln.match(/^(#{1,4})\s+(.*)/),ul=ln.match(/^\s*[-•]\s+(.*)/),ol=ln.match(/^\s*\d+[.)]\s+(.*)/),q=ln.match(/^&gt;\s?(.*)/);
    if(!ln.trim()){fP();cL();continue}
    if(h){fP();cL();out.push('<h'+h[1].length+'>'+h[2]+'</h'+h[1].length+'>');continue}
    if(ul){fP();if(list!=='ul'){cL();out.push('<ul>');list='ul'}out.push('<li>'+ul[1]+'</li>');continue}
    if(ol){fP();if(list!=='ol'){cL();out.push('<ol>');list='ol'}out.push('<li>'+ol[1]+'</li>');continue}
    if(q){fP();cL();out.push('<blockquote>'+q[1]+'</blockquote>');continue}
    if(/^(-{3,}|\*{3,})$/.test(ln.trim())){fP();cL();out.push('<hr>');continue}
    cL();para.push(ln);
  }
  fP();cL();
  return out.join('\n').replace(/\u0000(\d+)\u0000/g,(m,i)=>codes[+i]);
}
const cleanSpeech=s=>s.replace(/```[\s\S]*?```/g,' ').replace(/`([^`]*)`/g,'$1').replace(/[#>*_\-]+/g,' ').replace(/\[([^\]]*)\]\([^)]*\)/g,'$1').replace(/\s+/g,' ').trim().slice(0,4000);
function mapErr(err){const m=(err&&err.message)||'';if(/SERVER_KEY_MISSING/.test(m))return t('errKey');if(/RATE_LIMITED|429/.test(m))return t('errLimit');if(/401|403|API key|permission|key not valid/i.test(m))return t('errKey');if(err instanceof TypeError)return t('errNet');return t('errGeneric')}
function headers(){return{'Content-Type':'application/json','x-goog-api-key':settings.key}}
function systemPrompt(){
  const langName=nameOf(settings.lang);
  let base='You are "Daily AI Helper", a friendly, professional AI assistant. Always reply in '+langName+' unless the user asks otherwise. Be clear, helpful and concise. Use markdown formatting when it improves readability.';
  if(mode==='write')base+=' You are an expert professional writer: produce polished scripts, articles, emails and marketing copy with strong structure.';
  return base;
}
function buildContents(chat){
  const msgs=chat.messages.filter(m=>!m.pending).slice(-12),out=[];
  for(const m of msgs){
    const parts=[];
    if(m.role==='user'){
      (m.atts||[]).forEach(a=>{if(a.data)parts.push({inline_data:{mime_type:a.mime,data:a.data}});else if(a.text)parts.push({text:'[File: '+a.name+']\n'+a.text})});
      if(m.text)parts.push({text:m.text});
      if(!parts.length)parts.push({text:'(attachment)'});
    }else{
      if(m.text)parts.push({text:m.text});else parts.push({text:'[Image generated]'});
    }
    out.push({role:m.role,parts});
  }
  return out;
}
async function streamText(contents,onDelta,signal){
  const model=settings.model||'gemini-2.5-flash';
  const body=JSON.stringify({model,contents,system_instruction:{parts:[{text:systemPrompt()}]},generationConfig:{temperature:0.7}});
  const url=useOwnKey()?BASE+'/models/'+model+':streamGenerateContent?alt=sse':'/api/chat';
  const hd=useOwnKey()?headers():{'Content-Type':'application/json'};
  const res=await fetch(url,{method:'POST',signal,headers:hd,body});
  if(!res.ok){let m='';try{const j=await res.json();m=(j.error&&j.error.message)||j.error||''}catch(e){}throw new Error(m||('HTTP '+res.status))}
  let full='';
  if(res.body){
    const reader=res.body.getReader(),dec=new TextDecoder();let buf='';
    for(;;){const{done,value}=await reader.read();if(done)break;buf+=dec.decode(value,{stream:true});
      let i;while((i=buf.indexOf('\n'))>=0){const line=buf.slice(0,i).trim();buf=buf.slice(i+1);
        if(line.startsWith('data:')){const s=line.slice(5).trim();if(!s)continue;
          try{const o=JSON.parse(s);const parts=(o.candidates&&o.candidates[0]&&o.candidates[0].content&&o.candidates[0].content.parts)||[];
            for(const p of parts){if(typeof p.text==='string'){full+=p.text;onDelta(full)}}}catch(e){}}}}
  }else{
    const j=await res.json();const parts=(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[];
    for(const p of parts){if(typeof p.text==='string'){full+=p.text;onDelta(full)}}
  }
  if(!full)throw new Error('Empty response');
  return full;
}
async function generateImage(chat,signal){
  const last=[...chat.messages].reverse().find(m=>m.role==='user');
  const parts=[];(last.atts||[]).forEach(a=>{if(a.data)parts.push({inline_data:{mime_type:a.mime,data:a.data}})});
  parts.push({text:last.text||'image'});
  if(!useOwnKey()){
    const res=await fetch('/api/image',{method:'POST',signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({parts,prompt:last.text||'image'})});
    const j=await res.json().catch(()=>null);
    if(res.ok&&j&&j.dataUrl)return j.dataUrl;
    throw new Error((j&&j.error)||('HTTP '+res.status));
  }
  for(const m of ['gemini-2.5-flash-image','gemini-2.0-flash-preview-image-generation']){
    try{
      const res=await fetch(BASE+'/models/'+m+':generateContent',{method:'POST',signal,headers:headers(),body:JSON.stringify({contents:[{role:'user',parts}]})});
      if(res.ok){const j=await res.json();const ps=(j.candidates&&j.candidates[0]&&j.candidates[0].content&&j.candidates[0].content.parts)||[];
        for(const p of ps){const d=p.inlineData||p.inline_data;if(d&&d.data)return 'data:'+(d.mime_type||'image/png')+';base64,'+d.data}}
    }catch(e){if(e.name==='AbortError')throw e}
  }
  const res=await fetch(BASE+'/models/imagen-3.0-generate-002:predict',{method:'POST',signal,headers:headers(),body:JSON.stringify({instances:[{prompt:last.text||'image'}],parameters:{sampleCount:1}})});
  if(res.ok){const j=await res.json();const b=j.predictions&&j.predictions[0]&&j.predictions[0].bytesBase64Encoded;if(b)return 'data:image/png;base64,'+b}
  throw new Error('Image generation failed');
                                                                        }
