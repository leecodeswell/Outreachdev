require('./solver.js'); const E = globalThis.SAEngine;
function rnd(seed){let s=seed;return()=>{s=(s*1103515245+12345)%2147483648;return s/2147483648;};}
let fails=0, hard=0, cases=0, fill=0, slotsTot=0, opt=0, optCases=0;
function brute(P){ // tiny exact search on assignments of each position
  const C=E._build(P), sc=E._scorer(C); const free=C.pos.map((p,k)=>p.locked?-1:k).filter(k=>k>=0);
  const A=C.pos.map(p=>p.init); let best=Infinity;
  (function rec(i){ if(i===free.length){const v=sc(A); if(v<best)best=v; return;}
    const k=free[i], s=C.S[C.pos[k].s]; for(const p of [-1,...s.eligList]){ if(p>=0 && s.pos.some(q=>q!==k&&A[q]===p)) continue; A[k]=p; rec(i+1);} A[k]=-1; })(0);
  return best;
}
for(let t=0;t<300;t++){
  const r=rnd(t+1), small=t<80;
  const NP= small? 3+((r()*2)|0) : 6+((r()*12)|0), days= small?2:7, shiftsPer= small?1:2+((r()*2)|0);
  const roles=['mgr','bar'];
  const people=[...Array(NP)].map((_,i)=>({id:'p'+i,name:'P'+i,roles: r()<0.35?['mgr']:(r()<0.5?['bar']:[]), min: (r()*10)|0, max: 12+((r()*20)|0), prefs:{}}));
  const slots=[]; for(let d=0;d<days;d++) for(let k=0;k<shiftsPer;k++){ const st=d*1440+360+k*420, en=st+360;
    slots.push({key:d+'|'+k, day:d, start:st, end:en, hours:6, count: small?1+((r()*2)|0):1+((r()*2)|0), needs: r()<0.5?[{role:'mgr',count:1}]:[], shiftId:'s'+k,
      eligible: people.filter(()=>r()<0.7).map(p=>p.id), locked: []}); }
  people.forEach(p=>{ if(r()<0.5) p.prefs['s'+((r()*shiftsPer)|0)]= r()<0.5?1:-1; });
  const never=[], prefer=[]; for(let i=0;i<2;i++){ never.push(['p'+((r()*NP)|0),'p'+((r()*NP)|0)]); prefer.push(['p'+((r()*NP)|0),'p'+((r()*NP)|0)]); }
  const P={slots,people,never,prefer,features:{roles:true,avoidPairs:true,preferPairs:true,preferences:true,fairness:true,rest:true},weights:{},allowDoubles:false};
  const res=E.solve(P,{seed:t+7,budgetMs: small?60:250});
  cases++;
  const an=E.analyze(P,res.assign);
  if(Math.abs(an.score-res.score)>1e-6){ fails++; console.log('score mismatch',t,an.score,res.score); }
  // hard checks on result: no overlap/double or unavailable
  for(const i of an.issues){ if(['overlap','double','unavailable'].includes(i.type)) { hard++; } }
  Object.values(res.assign).forEach(a=>fill+=a.length); slotsTot+=slots.reduce((s,x)=>s+x.count,0);
  if(small){ optCases++; const b=brute(P); if(res.score<=b+1e-6) opt++; else console.log('not optimal',t,res.score,b); }
  // rank sanity
  const k=slots[0].key; const rk=E.rank(P,res.assign,k); if(!Array.isArray(rk)) fails++;
}
console.log({cases,fails,hardViolations:hard,fillRate:(fill/slotsTot).toFixed(3),optimalSmall:opt+'/'+optCases});
// timing on a big week
const NP=20, people=[...Array(NP)].map((_,i)=>({id:'p'+i,name:'P'+i,roles:i<5?['mgr']:[],min:10,max:30,prefs:{}}));
const slots=[];for(let d=0;d<7;d++)for(let k=0;k<4;k++){const st=d*1440+300+k*240;slots.push({key:d+'|'+k,day:d,start:st,end:st+360,hours:6,count:3,needs:[{role:'mgr',count:1}],shiftId:'s'+k,eligible:people.filter((p,i)=>(i+d+k)%4).map(p=>p.id),locked:[]});}
let t0=Date.now(); const big=E.solve({slots,people,never:[],prefer:[],features:{roles:true,fairness:true,rest:true,preferences:true},weights:{}},{seed:3,budgetMs:700});
console.log('big ms',Date.now()-t0,'issues',big.issues.map(i=>i.type).join(','));

/* ---------- rule checks (v2): tiers, fair shares, edge cases ---------- */
(function(){
const E = globalThis.SAEngine;
let pass=0, fail=0; const ok=(c,m)=>{ if(c) pass++; else { fail++; console.log('FAIL', m); } };
const base=(o)=>Object.assign({slots:[],people:[],never:[],prefer:[],features:{roles:true,avoidPairs:true,preferPairs:true,preferences:true,fairness:true,rest:true},weights:{},allowDoubles:false},o);
const person=(id,o)=>Object.assign({id,name:id,roles:[],min:0,max:40,prefs:{},fixed:false},o);
const slot=(key,day,st,en,o)=>Object.assign({key,day,start:day*1440+st,end:day*1440+en,hours:(en-st)/60,count:1,needs:[],shiftId:'s',eligible:[],locked:[]},o);

// empty problems
let r=E.solve(base({}),{seed:1,budgetMs:50}); ok(r && Object.keys(r.assign).length===0, 'empty');
r=E.solve(base({people:[person('a')]}),{seed:1,budgetMs:50}); ok(r.issues.length===0, 'no slots');
r=E.solve(base({slots:[slot('x',0,540,1020,{eligible:[]})]}),{seed:1,budgetMs:50}); ok(r.issues.some(i=>i.type==='unfilled'&&i.available===0), 'no people -> unfilled');

// max hours beats required role: the only manager is at max, so the role goes uncovered (not over max)
let P=base({people:[person('m',{roles:['mgr'],max:8}),person('b')],
  slots:[slot('d0',0,540,1020,{needs:[{role:'mgr',count:1}],eligible:['m','b']}),slot('d1',1,540,1020,{needs:[{role:'mgr',count:1}],eligible:['m','b']})]});
r=E.solve(P,{seed:1,budgetMs:100});
ok(!r.issues.some(i=>i.type==='over'), 'never over max to cover a role'); ok(r.issues.filter(i=>i.type==='role').length===1, 'exactly one role uncovered');
ok(Object.values(r.assign).every(a=>a.length===1), 'both spots still filled');

// locked people stay, even over max; fixed people never moved
P=base({people:[person('a',{max:4}),person('f',{fixed:true}),person('c')],
  slots:[slot('s1',0,540,1020,{count:2,locked:['a','f'],eligible:['c']}),slot('s2',1,540,1020,{eligible:['c','a']})]});
r=E.solve(P,{seed:2,budgetMs:100});
ok(r.assign.s1.includes('a') && r.assign.s1.includes('f'), 'locked kept'); ok(r.assign.s2[0]==='c', 'over-max person not added again');

// overnight shift + rest: closing 17-01 then opening 07:00 next day is a short rest
P=base({people:[person('a'),person('b')], slots:[slot('n',0,1020,1500,{eligible:['a','b']}), slot('o',1,420,900,{eligible:['a','b']})]});
r=E.solve(P,{seed:3,budgetMs:100}); ok(r.assign.n[0]!==r.assign.o[0], 'avoids short turnaround when someone else can');
const an=E.analyze(P,{n:['a'],o:['a']}); ok(an.issues.some(i=>i.type==='rest'), 'analyze flags short rest across midnight');

// doubles allowed vs not
P=base({people:[person('a')], slots:[slot('am',0,420,660,{eligible:['a']}),slot('pm',0,1200,1380,{eligible:['a']})]});
r=E.solve(P,{seed:4,budgetMs:100}); ok(r.issues.some(i=>i.type==='unfilled'), 'no doubles: one spot left open');
P.allowDoubles=true; r=E.solve(P,{seed:4,budgetMs:100}); ok(r.assign.am.length===1 && r.assign.pm.length===1, 'doubles allowed: both filled');

// overlapping shifts are never given to one person
P=base({people:[person('a')], allowDoubles:true, slots:[slot('x',0,540,900,{eligible:['a']}),slot('y',0,800,1000,{eligible:['a']})]});
r=E.solve(P,{seed:5,budgetMs:100}); ok(!r.issues.some(i=>i.type==='overlap'), 'no overlaps');

// never-together kept even if it leaves a spot open
P=base({people:[person('a'),person('b')], never:[['a','b']], slots:[slot('x',0,540,900,{count:2,eligible:['a','b']})]});
r=E.solve(P,{seed:6,budgetMs:100}); ok(!r.issues.some(i=>i.type==='never') && r.assign.x.length===1, 'never-together kept');

// all sliders at 0 and features off still produce a valid schedule
P=base({people:[person('a'),person('b')], features:{}, weights:{preferences:0,pairs:0,fairness:0,rest:0,minHours:0}, slots:[slot('x',0,540,900,{eligible:['a','b']})]});
r=E.solve(P,{seed:7,budgetMs:50}); ok(r.assign.x.length===1, 'zero weights ok');

// fair shares add up to the hours there are, and respect availability caps
P=base({people:[person('a',{min:0,max:60}),person('b',{min:0,max:60}),person('c',{min:0,max:60})],
  slots:[0,1,2,3,4,5,6].map(d=>slot('d'+d,d,540,1020,{count:2,eligible: d<1?['a','b','c']:['a','b']}))});
const C=E._build(P), sum=C.share.reduce((a,b)=>a+b,0);
ok(Math.abs(sum-7*2*8)<1e-6, 'shares sum to demand ('+sum+')'); ok(Math.abs(C.share[2]-8)<1e-6, 'c capped at reachable 8h ('+C.share[2]+')');
ok(Math.abs(C.share[0]-C.share[1])<1e-6, 'equal ranges get equal shares');

// set-schedule hours are not counted as hours to share out
P=base({people:[person('f',{fixed:true}),person('a'),person('b')], slots:[slot('x',0,540,1020,{count:3,locked:['f'],eligible:['a','b']})]});
const C2=E._build(P); ok(Math.abs(C2.share[1]+C2.share[2]-16)<1e-6, 'fixed hours excluded from shares');

// rank still works and orders available people first
P=base({people:[person('a'),person('b',{max:0})], slots:[slot('x',0,540,1020,{eligible:['a','b']})]});
const rk=E.rank(P,{},'x'); ok(rk[0].pid==='a' && rk[0].ok, 'rank puts the right person first');

// drift check on random-ish problems
for(let t=0;t<20;t++){ const pp=[...Array(8)].map((_,i)=>person('p'+i,{roles:i<3?['mgr']:[],min:i%3*4,max:16+i*2,prefs:{s0:i%2?1:-1}}));
  const ss=[]; for(let d=0;d<7;d++) for(let k=0;k<2;k++) ss.push(slot(d+'|'+k,d,360+k*420,720+k*420,{count:1+(t+d+k)%2,needs:k?[]:[{role:'mgr',count:1}],shiftId:'s'+k,eligible:pp.filter((_,i)=>(i+d+t)%3).map(p=>p.id)}));
  try { E.solve(base({people:pp,slots:ss,never:[['p1','p2']],prefer:[['p3','p4']]}),{seed:t,budgetMs:60,check:37}); pass++; } catch(e){ fail++; console.log('FAIL drift',e.message); } }
console.log('rule checks',{pass,fail}); if(fail) process.exitCode=1;
})();
