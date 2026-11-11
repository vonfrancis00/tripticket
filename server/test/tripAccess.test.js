import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';
import TripTicket from '../src/models/TripTicket.js';
import tickets from '../src/routes/tickets.js';
import dashboard from '../src/routes/dashboard.js';
import users from '../src/routes/users.js';
import {protect} from '../src/middleware/auth.js';
import {tripAccessFilter} from '../src/utils/tripAccess.js';

test('driver matching uses the full name and escapes regex characters', () => {
  const filter = tripAccessFilter({role:'driver',name:' Ana  D. Cruz '});
  const pattern = new RegExp(filter.driverName.$regex, 'i');
  assert.ok(pattern.test('  ANA D.   CRUZ '));
  assert.ok(!pattern.test('Ana DX Cruz'));
  assert.ok(!pattern.test('Ana D. Cruz Jr'));
  assert.deepEqual(tripAccessFilter({role:'admin'}), {});
  assert.deepEqual(tripAccessFilter({role:'admin_officer'}), {});
  assert.deepEqual(tripAccessFilter({role:'driver',name:''}), {_id:null});
});

test('API scopes lists, dashboard, details, edits and reports; blocks account escalation', async () => {
  process.env.JWT_SECRET='test-only-secret';
  const originals = {user:User.findById,find:TripTicket.find,one:TripTicket.findOne,count:TripTicket.countDocuments};
  const records = [{_id:'own',driverName:'Ana Cruz'}, {_id:'other',driverName:'Ben Cruz'}];
  const matches = (record, filter) => (!filter._id || record._id===filter._id) && (!filter.driverName || new RegExp(filter.driverName.$regex,'i').test(record.driverName));
  User.findById = async role => ({_id:role,role,active:true,name:'Ana Cruz'});
  TripTicket.find = filter => ({sort:()=>({limit:()=>({lean:async()=>records.filter(r=>matches(r,filter))})})});
  TripTicket.findOne = async filter => records.find(r=>matches(r,filter));
  TripTicket.countDocuments = async filter => records.filter(r=>matches(r,filter)).length;
  const app=express();app.use(express.json());app.use('/tickets',tickets);app.use('/dashboard',protect,dashboard);app.use('/users',protect,users);
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const request=async(path,role='driver',method='GET',body) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {method,headers:{Authorization:`Bearer ${jwt.sign({id:role},process.env.JWT_SECRET)}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  try {
    assert.equal((await (await request('/tickets')).json()).tickets.length,1);
    assert.equal((await (await request('/dashboard')).json()).stats.total,1);
    for(const [path,method] of [['/tickets/other','GET'],['/tickets/other','PUT'],['/tickets/other/report','PUT']]) assert.equal((await request(path,'driver',method,method==='PUT'?{}:undefined)).status,404);
    assert.equal((await request('/tickets/own')).status,200);
    assert.equal((await request('/tickets/own','driver','PUT',{driverName:'Ben Cruz'})).status,403);
    assert.equal((await request('/users','driver','POST',{role:'admin'})).status,403);
    assert.equal((await request('/users','admin_officer')).status,403);
    assert.equal((await request('/users','Admin Officer')).status,403);
    assert.equal((await request('/users','Driver','POST',{role:'Admin'})).status,403);
    assert.equal((await (await request('/tickets','Driver')).json()).tickets.length,1);
    for(const role of ['admin','admin_officer','Admin','Admin Officer',' Admin Officer ']) {
      assert.equal((await (await request('/tickets',role)).json()).tickets.length,2);
      assert.equal((await request('/tickets/other',role)).status,200);
      assert.equal((await (await request('/dashboard',role)).json()).stats.total,2);
    }
    assert.equal((await fetch(`http://127.0.0.1:${server.address().port}/tickets`)).status,401);
  } finally {
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
    User.findById=originals.user;TripTicket.find=originals.find;TripTicket.findOne=originals.one;TripTicket.countDocuments=originals.count;
  }
});

test('public driver options filter by role and keep account management protected', async () => {
  const originalFind = User.find;
  User.find = filter => {
    for (const role of ['driver', 'Driver', 'DRIVER', ' Driver ']) assert.ok(filter.role.test(role));
    for (const role of ['admin', 'Admin Officer', 'driver_admin']) assert.ok(!filter.role.test(role));
    return {select: fields => {
      assert.equal(fields, '_id name');
      return {sort: async order => {
        assert.deepEqual(order, {name:1});
        return [{_id:'driver-id',name:'Ana Cruz'}];
      }};
    }};
  };
  const app=express();
  app.use('/users',users);
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/users`;
  try {
    const response=await fetch(`${base}/drivers`);
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{drivers:[{_id:'driver-id',name:'Ana Cruz'}]});
    assert.equal((await fetch(base)).status,401);
    assert.equal((await fetch(base,{method:'POST'})).status,401);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve=>server.close(resolve));
    User.find=originalFind;
  }
});

test('user model accepts display role names and validates unknown roles', () => {
  for (const [input, expected] of [['Admin','admin'], ['Admin Officer','admin_officer'], ['Driver','driver'], ['admin','admin'], ['admin_officer','admin_officer'], ['driver','driver']]) {
    const user = new User({name:'Test',email:'test@example.com',password:'test-password',role:input});
    assert.equal(user.role,expected);
    assert.equal(user.validateSync(),undefined);
  }
  const user = new User({name:'Test',email:'test@example.com',password:'test-password',role:'Unknown'});
  assert.ok(user.validateSync().errors.role);
});
