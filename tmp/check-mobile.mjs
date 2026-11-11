import {spawn} from 'node:child_process';
import path from 'node:path';
const proc=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--remote-debugging-port=9335',`--user-data-dir=${path.resolve('tmp/mobile-chrome')}`,'about:blank'],{stdio:'ignore'});
let ws;
try {
let tabs;
for(let i=0;i<40;i++){try{tabs=await(await fetch('http://127.0.0.1:9335/json')).json();break;}catch{await new Promise(r=>setTimeout(r,250));}}
ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();ws.addEventListener('message',e=>{const v=JSON.parse(e.data);if(pending.has(v.id)){pending.get(v.id)(v);pending.delete(v.id);}});
const send=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});
for(const width of [320,390,440,768]){
await send('Emulation.setDeviceMetricsOverride',{width,height:956,deviceScaleFactor:1,mobile:true});
await send('Page.navigate',{url:'http://localhost:5173'});
await new Promise(r=>setTimeout(r,1500));
const result=await send('Runtime.evaluate',{expression:`JSON.stringify({viewport:innerWidth,page:document.documentElement.scrollWidth,overflow:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>e.className).slice(0,10)})`,returnByValue:true});
console.log(width,result.result?.result?.value);
}
await send('Browser.close');
}finally{ws?.close();proc.kill();}
