import fs from 'node:fs';
import {createCanvas,DOMMatrix,ImageData,Path2D} from './pdf-tools/node_modules/@napi-rs/canvas/index.js';
Object.assign(globalThis,{DOMMatrix,ImageData,Path2D});
const pdfjs=await import('./pdf-tools/node_modules/pdfjs-dist/legacy/build/pdf.mjs');
const pdf=await pdfjs.getDocument({data:new Uint8Array(fs.readFileSync(process.argv[2])),useSystemFonts:true}).promise;
const page=await pdf.getPage(Number(process.argv[4] || 1));const viewport=page.getViewport({scale:1.4});
console.log('PAGES',pdf.numPages,'SIZE',page.view);console.log((await page.getTextContent()).items.map(x=>`${x.transform[4].toFixed(1)},${x.transform[5].toFixed(1)} ${x.str}`).join('\n'));
const canvas=createCanvas(viewport.width,viewport.height);await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;fs.mkdirSync('tmp/pdfs',{recursive:true});fs.writeFileSync(process.argv[3],canvas.toBuffer('image/png'));
