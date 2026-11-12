import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import net from 'node:net';

test('backend stays available and retries when database startup fails', {timeout:20000}, async () => {
  const probe=net.createServer();
  probe.listen(0,'127.0.0.1');
  await once(probe,'listening');
  const port=probe.address().port;
  await new Promise(resolve=>probe.close(resolve));
  const child=spawn(process.execPath,['server/src/server.js'],{
    env:{...process.env,PORT:String(port),MONGODB_URI:'invalid://database',MONGO_CA_CERT:'',SEED_ADMIN:'false'},
    stdio:['ignore','pipe','pipe']
  });
  let output='';
  child.stdout.on('data',chunk=>{output+=chunk});
  child.stderr.on('data',chunk=>{output+=chunk});
  const waitFor=async condition=>{
    const deadline=Date.now()+15000;
    while(!condition()) {
      assert.equal(child.exitCode,null,output);
      assert.ok(Date.now()<deadline,output);
      await new Promise(resolve=>setTimeout(resolve,50));
    }
  };
  try {
    await waitFor(()=>output.includes('Retrying in 10 seconds'));
    const base=`http://127.0.0.1:${port}`;
    const health=await fetch(`${base}/api/health`);
    assert.equal(health.status,503);
    assert.equal((await health.json()).database,'disconnected');
    const login=await fetch(`${base}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    assert.equal(login.status,503);
    assert.match((await login.json()).message,/Database connection unavailable/);
    await waitFor(()=>output.split('Retrying in 10 seconds').length>=3);
    assert.equal(child.exitCode,null);
  } finally {
    const exited=once(child,'exit');
    child.kill();
    await exited;
  }
});
