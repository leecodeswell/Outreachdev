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
