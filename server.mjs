import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT)||4183;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.mp4':'video/mp4','.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.glb':'model/gltf-binary','.blend':'application/octet-stream','.hdr':'application/octet-stream','.json':'application/json; charset=utf-8'};
http.createServer(async(req,res)=>{
  try{
    const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const relative=requested==='/'?'index.html':requested.replace(/^\/+/, '');
    const file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep)||!types[path.extname(file)]){res.writeHead(404);res.end('Not found');return;}
    const info=await stat(file);
    if(!info.isFile()){res.writeHead(404);res.end('Not found');return;}
    if(path.extname(file)==='.mp4'&&req.headers.range){
      const match=req.headers.range.match(/^bytes=(\d*)-(\d*)$/);
      let start=match?.[1]?Number(match[1]):0,end=match?.[2]?Number(match[2]):info.size-1;
      if(match&&!match[1]&&match[2]){start=Math.max(0,info.size-Number(match[2]));end=info.size-1;}
      if(!match||(!match[1]&&!match[2])||start>=info.size||start>end){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return;}
      end=Math.min(end,info.size-1);
      res.writeHead(206,{'Content-Type':'video/mp4','Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${info.size}`,'Accept-Ranges':'bytes','Cache-Control':'no-cache'});
      if(req.method==='HEAD')res.end();else createReadStream(file,{start,end}).pipe(res);
      return;
    }
    res.writeHead(200,{'Content-Type':types[path.extname(file)],'Content-Length':info.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
    if(req.method==='HEAD')res.end();else createReadStream(file).pipe(res);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`MYLODGE preview: http://127.0.0.1:${port}`));
