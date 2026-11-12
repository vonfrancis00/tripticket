import {spawn} from 'node:child_process';
import path from 'node:path';
const proc=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--remote-debugging-port=9336',`--user-data-dir=${path.resolve('tmp/pdf-preview-chrome')}`,'http://localhost:5173'],{stdio:'ignore'});
let ws;
try {
let tabs;
for(let i=0;i<40;i++){try{tabs=await(await fetch('http://127.0.0.1:9336/json')).json();break;}catch{await new Promise(r=>setTimeout(r,250));}}
ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);
await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let id=0;const pending=new Map();ws.addEventListener('message',e=>{const v=JSON.parse(e.data);if(pending.has(v.id)){pending.get(v.id)(v);pending.delete(v.id);}});
const send=(method,params={})=>new Promise(r=>{const n=++id;pending.set(n,r);ws.send(JSON.stringify({id:n,method,params}));});
await new Promise(r=>setTimeout(r,1500));
const result=await send('Runtime.evaluate',{expression:`(async()=>{
const {default:React}=await import('/node_modules/.vite/deps/react.js');
const {default:ReactDOM}=await import('/node_modules/.vite/deps/react-dom_client.js'); const {createRoot}=ReactDOM;
const {default:PdfPreview}=await import('/src/components/PdfPreview.jsx');
const {jsPDF}=await import('/node_modules/.vite/deps/jspdf.js');
const pdf=new jsPDF();pdf.text('Trip ticket preview verification',20,20);pdf.addPage();pdf.text('Second page',20,20);
const url=URL.createObjectURL(pdf.output('blob'));
const root=document.createElement('div');document.body.append(root);createRoot(root).render(React.createElement(PdfPreview,{url}));
for(let i=0;i<80;i++){await new Promise(r=>setTimeout(r,100));if(root.querySelectorAll('canvas').length===2 || root.textContent.includes('Unable'))break;}
return {pages:root.querySelectorAll('canvas').length,status:root.textContent,dimensions:[...root.querySelectorAll('canvas')].map(c=>[c.width,c.height])};
})()`,awaitPromise:true,returnByValue:true});
console.log(JSON.stringify(result.result));
await send('Browser.close');
}finally{ws?.close();proc.kill();}


