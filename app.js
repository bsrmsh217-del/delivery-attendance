import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import{getAuth,signInWithEmailAndPassword,signOut}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import{getFirestore,collection,doc,getDoc,getDocs,setDoc,addDoc,updateDoc,deleteDoc,query,where,orderBy,limit,onSnapshot,writeBatch,runTransaction,serverTimestamp}from"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const FC={apiKey:"AIzaSyD-4qMzlL0BhvuXdZKX3uAU1Ip_zMCaQCg",authDomain:"delivery-attendance-20663.firebaseapp.com",projectId:"delivery-attendance-20663",storageBucket:"delivery-attendance-20663.firebasestorage.app",messagingSenderId:"235545157551",appId:"1:235545157551:web:74b49e281b6b5f04c1195a"};
const app=initializeApp(FC),db=getFirestore(app),auth=getAuth(app);
window.$=(id)=>document.getElementById(id);
// The Android APK loads this file from Capacitor's local origin, so relative /api paths would stay inside the APK.
// Keep the website and APK on the same production API and Firestore project.
const API_ORIGIN='https://delivery-attendance.vercel.app';
const APP_VERSION='2.0.56', UPDATE_MANIFEST=`${API_ORIGIN}/version.json`;
const IS_NATIVE=!!(window.Capacitor?.isNativePlatform?.() || (window.Capacitor?.getPlatform?.() && window.Capacitor.getPlatform()!=='web'));
let trustedDid=null,insideSince=null,stabilityTimer=null,securityState={mockLocation:false,developerOptions:false,native:false};

async function sha(m){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(m+'del_salt_#2024!'));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('');}
function getDid(){if(trustedDid)return trustedDid;let id=localStorage.getItem('_did');if(!id){id='D'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);localStorage.setItem('_did',id);}return id;}
async function loadDeviceSecurity(){try{const p=window.Capacitor?.Plugins?.DeviceSecurity;if(!p)return;const r=await p.check();trustedDid=r.deviceId||null;securityState={...securityState,...r,native:true};}catch(e){console.warn('Device security unavailable',e);}}
async function refreshDeviceSecurity(){await loadDeviceSecurity();return securityState;}
function getDinfo(){const ua=navigator.userAgent;if(/Android/i.test(ua))return'Android '+(ua.match(/Android ([0-9.]+)/)?.[1]||'');if(/iPhone/i.test(ua))return'iPhone';if(/iPad/i.test(ua))return'iPad';return'Desktop';}
const $=id=>document.getElementById(id);
const toDate=v=>v?.toDate?v.toDate():new Date(v);
const dStr=(d=new Date())=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Baghdad',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(toDate(d)).reduce((a,x)=>(a[x.type]=x.value,a),{});return `${p.year}-${p.month}-${p.day}`;};
const fT=d=>toDate(d).toLocaleTimeString('ar-IQ',{timeZone:'Asia/Baghdad',hour:'2-digit',minute:'2-digit',second:'2-digit'});
const fD=s=>{if(!s)return'-';return new Date((s.includes('T')?s:s+'T00:00:00')).toLocaleDateString('ar-IQ',{weekday:'long',year:'numeric',month:'long',day:'numeric'});};
const fDT=d=>toDate(d).toLocaleDateString('ar-IQ',{timeZone:'Asia/Baghdad',year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
function dur(a,b){const ms=toDate(b)-toDate(a);if(ms<0)return'-';return`${Math.floor(ms/3600000)}س ${Math.floor((ms%3600000)/60000)}د ${Math.floor((ms%60000)/1000)}ث`;}
function dist(a,b,c,d){const R=6371000,dA=(c-a)*Math.PI/180,dO=(d-b)*Math.PI/180,x=Math.sin(dA/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dO/2)**2;return Math.round(R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x)));}
function toast(m,ms=3000){const t=$('toast');t.textContent=m;t.style.display='block';clearTimeout(t._t);t._t=setTimeout(()=>t.style.display='none',ms);}
function sErr(id,m){const e=$(id);e.textContent=m;e.style.display='block';}
function hErr(id){$(id).style.display='none';}
function showScr(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active');}
window.closeM=id=>$(id).classList.remove('open');
function openM(id){$(id).classList.add('open');}
document.querySelectorAll('.ov').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));
function hideLd(){$('LS').classList.add('hide');setTimeout(()=>$('LS').style.display='none',400);}
function setupNetworkState(){const up=()=>{$('netbar').style.display=navigator.onLine?'none':'block';if($('mainBtn')&&!navigator.onLine)$('mainBtn').disabled=true;};addEventListener('online',()=>{up();toast('عاد الاتصال بالإنترنت');if(CU?.role!=='admin')startLoc();});addEventListener('offline',()=>{up();locOk=false;toast('انقطع الإنترنت - التسجيل متوقف');});up();}
let pendingUpdateUrl='',updateTimer=null;
window.checkForUpdates=async(manual=false)=>{try{const r=await fetch(UPDATE_MANIFEST+'?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('manifest');const v=await r.json();const newer=String(v.version||'0').localeCompare(APP_VERSION,undefined,{numeric:true})>0;if(newer&&v.apkUrl){pendingUpdateUrl=v.apkUrl;$('updateCard').style.display='block';$('updateText').textContent=`الإصدار ${v.version}: ${v.notes||'تحسينات جديدة'}`;if(CU&&IS_NATIVE){$('forceUpdateText').textContent=`الإصدار ${v.version} متوفر. يجب تنزيله وتثبيته قبل متابعة استخدام التطبيق.`;$('forceUpdateCard').classList.add('open');}if(manual)toast('يتوفر تحديث جديد');}else if(manual)toast('أنت تستخدم أحدث إصدار');}catch(e){if(manual)toast('تعذر فحص التحديث الآن');}};
window.downloadUpdate=async()=>{if(!IS_NATIVE||!pendingUpdateUrl)return;try{const p=window.Capacitor?.Plugins?.DeviceSecurity;if(p)await p.openUpdate({url:pendingUpdateUrl});else location.href=pendingUpdateUrl;}catch(e){location.href=pendingUpdateUrl;}};
async function addAudit(action,target='',details=''){try{await addDoc(collection(db,'auditLogs'),{action,target,details,actorId:CU?.id||null,actorName:CU?.name||'النظام',actorUsername:CU?.username||'',deviceId:getDid(),clientTime:new Date().toISOString(),createdAt:serverTimestamp()});}catch(e){}}
async function logLoginAttempt(username,success,reason=''){try{await addDoc(collection(db,'loginAttempts'),{username,success,reason,deviceId:getDid(),deviceInfo:getDinfo(),clientTime:new Date().toISOString(),createdAt:serverTimestamp()});}catch(e){}}
async function apiCall(path,body={},needsAuth=true){const headers={'Content-Type':'application/json'};if(needsAuth){if(!auth.currentUser)throw Error('UNAUTHORIZED');headers.Authorization='Bearer '+await auth.currentUser.getIdToken();}const url=path.startsWith('http')?path:`${API_ORIGIN}${path}`;const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(body)}),d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'SERVER_ERROR');return d;}
const apiMsg=e=>({INVALID_CREDENTIALS:'اسم المستخدم أو كلمة المرور غير صحيحة',ACCOUNT_PENDING:'الحساب بانتظار موافقة الأدمن',ACCOUNT_NOT_ACTIVE:'الحساب بانتظار موافقة الأدمن قبل تسجيل الدخول',PROFILE_NOT_FOUND:'لم يتم العثور على ملف الحساب، تواصل مع الأدمن',ACCOUNT_BLOCKED:'الحساب محظور',SECOND_DEVICE_BLOCKED:'الحساب مرتبط بجهاز آخر',USERNAME_TAKEN:'اسم المستخدم مستخدم بالفعل',INVALID_REGISTRATION_DATA:'تحقق من البيانات وكلمة مرور من 8 أحرف',OUTSIDE_GEOFENCE:'أنت خارج نطاق مخزن فرعك',BRANCH_LOCATION_NOT_CONFIGURED:'موقع فرعك غير محدد من الإدارة',WAREHOUSE_NOT_CONFIGURED:'موقع المخزن غير مهيأ',GPS_ACCURACY_TOO_LOW:'دقة GPS غير كافية',MOCK_LOCATION_REJECTED:'تم رفض الموقع الوهمي أو إعدادات المطور',ALREADY_CHECKED_IN:'يوجد تسجيل دخول مفتوح من يوم سابق - يجب تسجيل الخروج منه أولاً',NO_OPEN_ATTENDANCE:'لا يوجد تسجيل دخول مفتوح'}[e.message]||e.message||'حدث خطأ');

function hasAdminPerm(k){return CU?.role!=='admin'||isRasimPrimary()||CU?.adminLevel==='primary'||CU?.permissions?.[k]!==false;}
function isRasimPrimary(){return String(CU?.username||'').trim().toLowerCase()==='rasim1010';}
let CU=null,allU=[],agPage=0,allUsersRaw=[],allA=[],allAttendanceRaw=[],filteredA=[],myL=null,locOk=false,locAccuracy=null,openR=null,clkInt=null,wid=null,aU=null,nU=null,uU=null,sessionUnsub=null,sessionId=null,agTab='active',warehouseMap=null,warehouseMarker=null,warehouseCircle=null,adminDashTimer=null;
const readCache=new Map(),readInFlight=new Map(),readStats={day:localStorage.getItem('read_stats_day')||'',misses:Number(localStorage.getItem('read_stats_misses')||0),warned:false};
function trackReadMiss(){const day=dStr();if(readStats.day!==day){readStats.day=day;readStats.misses=0;readStats.warned=false;}readStats.misses++;localStorage.setItem('read_stats_day',day);localStorage.setItem('read_stats_misses',String(readStats.misses));if(readStats.misses>=100&&!readStats.warned&&CU?.role==='owner'){readStats.warned=true;toast('تنبيه مراقبة: تم تنفيذ 100 قراءة جديدة اليوم من هذه الجلسة',6000);}}
function cacheKey(refOrQuery,key){return key||refOrQuery?.path||String(refOrQuery);}
async function cachedRead(key,reader,ttl=30000){const now=Date.now(),hit=readCache.get(key);if(hit&&now-hit.at<ttl)return hit.value;if(readInFlight.has(key))return readInFlight.get(key);trackReadMiss();const pending=Promise.resolve().then(reader).then(value=>{readCache.set(key,{at:Date.now(),value});readInFlight.delete(key);return value;},error=>{readInFlight.delete(key);throw error;});readInFlight.set(key,pending);return pending;}
function invalidateReadCache(prefix=''){for(const key of readCache.keys())if(!prefix||key.startsWith(prefix))readCache.delete(key);}
function clearReadCache(){readCache.clear();readInFlight.clear();}
function cachedDoc(ref,ttl=30000,key){return cachedRead(cacheKey(ref,key),()=>getDoc(ref),ttl);}
function cachedDocs(q,ttl=30000,key){return cachedRead(cacheKey(q,key),()=>getDocs(q),ttl);}

function applyTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem('theme',theme);const b=document.querySelector('.theme-toggle');if(b)b.textContent=theme==='dark'?'الوضع الفاتح':'الوضع الليلي';}
function toggleTheme(){applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');}
function togglePassword(id,button){const input=document.getElementById(id);if(!input)return;const visible=input.type==='text';input.type=visible?'password':'text';button.textContent=visible?'إظهار':'إخفاء';}
function acceptCookies(){localStorage.setItem('cookie_notice','1');const b=document.getElementById('cookieBanner');if(b)b.remove();}
window.toggleTheme=toggleTheme;window.togglePassword=togglePassword;window.acceptCookies=acceptCookies;
function trackCampaign(){const params=new URLSearchParams(location.search);const campaign={};['utm_source','utm_medium','utm_campaign'].forEach(k=>{if(params.get(k))campaign[k]=params.get(k)});if(Object.keys(campaign).length)localStorage.setItem('campaign',JSON.stringify(campaign));}
(function bootUi(){applyTheme(localStorage.getItem('theme')||'light');trackCampaign();if(localStorage.getItem('cookie_notice'))document.getElementById('cookieBanner')?.remove();window.addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;document.getElementById('scrollProgress').style.width=(max>0?scrollY/max*100:0)+'%';document.getElementById('topBtn').classList.toggle('visible',scrollY>420);},{passive:true});})();
async function init(){
  $('appVer')&&($('appVer').textContent=APP_VERSION);setupNetworkState();await loadDeviceSecurity();if(IS_NATIVE){checkForUpdates(false);updateTimer=setInterval(()=>checkForUpdates(false),5*60*1000);}else $('updateCard')&&($('updateCard').style.display='none');
  try{
    await auth.authStateReady();const sv=localStorage.getItem('_s');
    if(sv&&auth.currentUser){const s=JSON.parse(sv);if(s.uid===auth.currentUser.uid&&s.did===getDid()){const sn=await cachedDoc(doc(db,'users',s.uid),30000,`users:${s.uid}`);if(sn.exists()){const u={id:sn.id,...sn.data(),username:String(sn.data().username||'').trim().toLowerCase()};if(u.status==='active'&&(!u.activeSessionId||['admin','owner'].includes(u.role)||u.activeSessionId===s.sessionId)){CU=u;sessionId=s.sessionId||null;hideLd();if(['admin','owner'].includes(u.role)){showScr('adminScreen');initAdmin();}else{showScr('agentScreen');initAgent();}if(IS_NATIVE)checkForUpdates(false);return;}}}}
    localStorage.removeItem('_s');if(auth.currentUser)await signOut(auth);
  }catch(e){localStorage.removeItem('_s');}
  hideLd();showScr('loginScreen');
}

window.switchTab=tab=>{
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',(tab==='login')?i===0:i===1));
  $('loginForm').style.display=tab==='login'?'block':'none';
  $('regForm').style.display=tab==='reg'?'block':'none';
};

window.doLogin=async()=>{
  const u=$('lu').value.trim().toLowerCase(),p=$('lp').value;hErr('lerr');if(!u||!p){sErr('lerr','أدخل اسم المستخدم وكلمة المرور');return;}
  const btn=$('loginBtn');btn.disabled=true;btn.innerHTML='<div class="sp"></div>';
  try{
    const credential=await signInWithEmailAndPassword(auth,`${u}@deliveryattendance.app`,p);
    const session=await apiCall('/api/session',{deviceId:getDid(),deviceInfo:getDinfo(),clientType:IS_NATIVE?'native':'web'});
    let profile=session.profile||null;
    if(!profile){const ps=await cachedDoc(doc(db,'users',credential.user.uid),30000,`users:${credential.user.uid}`);if(ps.exists())profile={id:ps.id,...ps.data()};}
    if(!profile?.role)throw Error('PROFILE_NOT_FOUND');
    CU={id:credential.user.uid,...profile};sessionId=session.sessionId||null;localStorage.setItem('_s',JSON.stringify({uid:CU.id,did:getDid(),sessionId}));
    if(['admin','owner'].includes(CU.role)){showScr('adminScreen');initAdmin();}else{showScr('agentScreen');initAgent();}if(IS_NATIVE)checkForUpdates(false);toast(`مرحباً ${CU.name}${CU.branch?' - '+CU.branch:''}!`);
  }catch(e){try{await signOut(auth);}catch(_){}const m=e.code==='auth/invalid-credential'?'اسم المستخدم أو كلمة المرور غير صحيحة':apiMsg(e);sErr('lerr',m);}
  btn.disabled=false;btn.innerHTML='دخول';
};

window.doRegister=async()=>{
  const n=$('rn').value.trim(),u=$('ru').value.trim().toLowerCase(),phone=$('rphone').value.trim(),employeeId=$('rempid').value.trim(),area=$('rarea').value.trim(),branch=$('rbranch').value,p=$('rp').value,p2=$('rp2').value;
  hErr('rerr');
  if(!n||!u||!p||!branch){sErr('rerr','أكمل جميع الحقول واختر الفرع');return;}
  if(!/^[a-z0-9_]+$/.test(u)){sErr('rerr','اسم المستخدم: أحرف إنجليزية صغيرة وأرقام فقط');return;}
  if(u.length<3){sErr('rerr','اسم المستخدم 3 أحرف على الأقل');return;}
  if(p.length<8){sErr('rerr','كلمة المرور 8 أحرف على الأقل');return;}
  if(p!==p2){sErr('rerr','كلمة المرور غير متطابقة');return;}
  try{
    await apiCall('/api/register',{name:n,username:u,password:p,phone,employeeId,area,branch},false);
    toast('تم إنشاء الحساب! انتظر موافقة الأدمن');
    ['rn','ru','rphone','rempid','rarea','rbranch','rp','rp2'].forEach(id=>$(id).value='');window.switchTab('login');
  }catch(e){sErr('rerr',apiMsg(e));}
};

window.doLogout=async()=>{
  if(wid)navigator.geolocation.clearWatch(wid);if(clkInt)clearInterval(clkInt);if(adminDashTimer)clearInterval(adminDashTimer);if(updateTimer)clearInterval(updateTimer);if(aU)aU();if(nU)nU();if(uU)uU();if(sessionUnsub)sessionUnsub();if(auditUnsub)auditUnsub();clearReadCache();
  if(!['admin','owner'].includes(CU?.role)&&CU?.id&&sessionId){try{await updateDoc(doc(db,'users',CU.id),{activeSessionId:null,lastLogoutAt:serverTimestamp()});}catch(e){}}try{await signOut(auth);}catch(e){}localStorage.removeItem('_s');CU=null;sessionId=null;allU=[];allA=[];openR=null;showScr('loginScreen');toast('تم تسجيل الخروج');
};

function initAgent(){
  $('agName').textContent=CU.name+(CU.branch?' - '+CU.branch:'');startClk();startLoc();loadTR();updBtn();watchSession();
}
function watchSession(){if(sessionUnsub)sessionUnsub();sessionUnsub=onSnapshot(doc(db,'users',CU.id),sn=>{if(!sn.exists())return;const u=sn.data();if(u.status!=='active'||(u.activeSessionId&&u.activeSessionId!==sessionId)){localStorage.removeItem('_s');toast('تم إنهاء الجلسة لأن الحساب فُتح في جلسة أخرى',5000);setTimeout(()=>location.reload(),1800);}});}

function startClk(){
  if(clkInt)clearInterval(clkInt);
  const up=()=>{const n=new Date();$('clk').textContent=n.toLocaleTimeString('ar-IQ');$('dtxt').textContent=n.toLocaleDateString('ar-IQ',{weekday:'long',year:'numeric',month:'long',day:'numeric'});if(openR)$('durT').textContent='مدة الدوام: '+dur(openR.checkinTime,n.toISOString());};
  up();clkInt=setInterval(up,1000);
}

async function loadTR(){
  const q=query(collection(db,'attendance'),where('agentId','==',CU.id),where('date','==',dStr()));
  const sn=await cachedDocs(q,15000,`attendance:today:${CU.id}:${dStr()}`);renderTR(sn.docs.map(d=>({id:d.id,...d.data()})));
}

function renderTR(recs){
  const c=$('todayR');
  if(!recs.length){c.innerHTML='<div class="empty"><div class="ei"></div>لا يوجد سجل اليوم</div>';return;}
  c.innerHTML=recs.map(r=>`<div class="hi"><div class="hd ${r.checkoutTime?'out':'in'}"></div><div><div style="font-weight:700">${r.agentName||CU.name} - ${r.branch||CU.branch||'بدون فرع'}</div><div style="font-weight:700">▶ دخول: ${fT(r.checkinTime)}</div>${r.checkoutTime?`<div style="font-weight:700">◀ خروج: ${fT(r.checkoutTime)}</div>`:'<div style="color:#059669;font-size:13px;font-weight:600"> لا يزال داخل المخزن</div>'}${r.checkoutTime?`<div style="font-size:13px;color:var(--p);font-weight:600;margin-top:3px">⏱ ${r.duration||dur(r.checkinTime,r.checkoutTime)}</div>`:''}</div></div>`).join('');
}

async function updBtn(){
  const sn=await cachedDocs(query(collection(db,'attendance'),where('agentId','==',CU.id),limit(1000)),15000,`attendance:open:${CU.id}`);const openDocs=sn.docs.filter(d=>!d.data().checkoutTime).sort((a,b)=>(toDate(b.data().checkinTime)-toDate(a.data().checkinTime)));const btn=$('mainBtn');
  if(openDocs.length){openR={id:openDocs[0].id,...openDocs[0].data()};btn.className='cbtn co';btn.disabled=false;$('mainLbl').textContent='تسجيل خروج';$('ciT').textContent=fT(openR.checkinTime);$('sbox').style.display='block';$('durT').textContent='مدة الدوام: '+dur(openR.checkinTime,new Date().toISOString());}
  else{openR=null;btn.className='cbtn ci';$('mainLbl').textContent='تسجيل دخول';$('sbox').style.display='none';if(!locOk)btn.disabled=true;}
}

window.doCheck=async()=>{
  const btn=$('mainBtn');btn.disabled=true;
  try{
    if(!navigator.onLine)throw Error('لا يوجد اتصال بالإنترنت');
    await refreshDeviceSecurity();
    if(securityState.mockLocation||securityState.developerOptions)throw Error('تم رفض العملية: إعدادات المطور أو الموقع الوهمي مفعّلة');
    if(!locOk)throw Error('يجب البقاء داخل نطاق المخزن 10 ثوانٍ مع دقة GPS جيدة');
    const action=openR?'checkout':'checkin';
    await apiCall('/api/attendance',{action,lat:myL.lat,lng:myL.lng,accuracy:locAccuracy,deviceId:getDid(),deviceInfo:getDinfo(),mockLocation:!!securityState.mockLocation,developerOptions:!!securityState.developerOptions});
    toast(action==='checkin'?'تم تسجيل الدخول بنجاح':'تم تسجيل الخروج بنجاح');
    invalidateReadCache(`attendance:${CU.id}`);invalidateReadCache(`attendance:today:${CU.id}`);invalidateReadCache(`attendance:open:${CU.id}`);invalidateReadCache(`attendance:history:${CU.id}`);
    await new Promise(r=>setTimeout(r,700));await loadTR();await updBtn();
  }catch(e){toast(apiMsg(e),5000);}
  btn.disabled=!locOk;
};

window.showAHist=async()=>{
  const q=query(collection(db,'attendance'),where('agentId','==',CU.id),orderBy('checkinTime','desc'));
  const sn=await cachedDocs(q,60000,`attendance:history:${CU.id}`);const recs=sn.docs.map(d=>({id:d.id,...d.data()}));
  const c=$('ahBody');
  if(!recs.length){c.innerHTML='<div class="empty"><div class="ei"></div>لا يوجد سجل</div>';openM('ahModal');return;}
  const g={};recs.forEach(r=>{if(!g[r.date])g[r.date]=[];g[r.date].push(r);});
  c.innerHTML=Object.entries(g).map(([date,rs])=>`<div style="margin-bottom:16px"><div style="font-weight:700;font-size:13px;color:var(--p);padding:8px;background:var(--pl);border-radius:8px;margin-bottom:8px"> ${fD(date)}</div>${rs.map(r=>`<div class="hi"><div><div><span style="color:#059669">▶</span> دخول: <strong>${fT(r.checkinTime)}</strong></div>${r.checkoutTime?`<div><span style="color:#dc2626">◀</span> خروج: <strong>${fT(r.checkoutTime)}</strong></div>`:'<div style="color:#d97706;font-size:13px"> لم يسجل خروجاً</div>'}${r.duration?`<div style="font-size:13px;color:var(--p)">⏱ ${r.duration}</div>`:''}</div></div>`).join('')}</div>`).join('');
  openM('ahModal');
};

function startLoc(){
  if(!navigator.geolocation){setLP('bad','GPS غير مدعوم');$('gpsRequestBtn').style.display='block';return;}
  $('gpsRequestBtn').style.display='none';
  if(wid)navigator.geolocation.clearWatch(wid);
  wid=navigator.geolocation.watchPosition(
    pos=>{myL={lat:pos.coords.latitude,lng:pos.coords.longitude};locAccuracy=Math.round(pos.coords.accuracy||0);chkLoc();},
    ()=>{setLP('bad','تعذّر تحديد الموقع - فعّل GPS من إعدادات الجهاز أو المتصفح');$('mainBtn').disabled=true;$('gpsRequestBtn').style.display='block';},
    {enableHighAccuracy:true,timeout:8000,maximumAge:3000}
  );
}
window.requestGPS=()=>{try{navigator.geolocation.getCurrentPosition(()=>startLoc(),()=>{setLP('bad','اسمح للموقع من نافذة المتصفح ثم اضغط مرة أخرى');$('gpsRequestBtn').style.display='block';},{enableHighAccuracy:true,timeout:10000,maximumAge:0});}catch(e){startLoc();}};

async function chkLoc(){
  try{
    if(!navigator.onLine){locOk=false;setLP('bad','لا يوجد اتصال بالإنترنت');return;}
    await refreshDeviceSecurity();if(securityState.mockLocation||securityState.developerOptions){locOk=false;insideSince=null;setLP('bad','الموقع الوهمي أو إعدادات المطور مفعّلة');$('mainBtn').disabled=true;return;}
    const ls=await cachedDoc(doc(db,'settings','locations'),120000,'settings:locations'),locs=ls.exists()?ls.data():{},branch=String(CU?.branch||'').trim(),allowedBranches=(branch==='المركز'||branch==='الحر')?['المركز','الحر']:[branch],available=allowedBranches.filter(b=>locs[b]&&Number.isFinite(Number(locs[b].lat))&&Number.isFinite(Number(locs[b].lng))).map(b=>({name:b,w:locs[b],d:dist(myL.lat,myL.lng,locs[b].lat,locs[b].lng),r:Number(locs[b].radius||100)})),match=available.sort((a,b)=>a.d-b.d)[0];
    if(!match){locOk=false;insideSince=null;$('mainBtn').disabled=true;setLP('bad',`موقع فرع ${branch||'الحساب'} غير مهيأ`);$('dstxt').textContent='يرجى من الإدارة تحديد موقع الفرع';return;}
    if(match.d>match.r){locOk=false;insideSince=null;$('mainBtn').disabled=true;setLP('bad',`خارج نطاق موقع ${branch==='المركز'||branch==='الحر'?'المركز والحر':branch}`);$('dstxt').textContent=`الموقع المسموح: ${branch==='المركز'||branch==='الحر'?'المركز والحر':branch} - المسافة: ${match.d} م - الحد: ${match.r} م`;return;}
    const {name:attendanceBranch,w:wh,d,r}=match,accuracyOk=locAccuracy>0&&locAccuracy<=Math.min(50,r);
    $('dstxt').textContent=`${attendanceBranch} - المسافة: ${d} م - الحد: ${r} م - دقة GPS: ${locAccuracy||'?'} م`;
    if(d<=r&&accuracyOk){
      if(!insideSince){insideSince=Date.now();locOk=false;setLP('chk','اثبت داخل النطاق لمدة 3 ثوانٍ');clearTimeout(stabilityTimer);stabilityTimer=setTimeout(()=>{if(insideSince&&navigator.onLine){locOk=true;setLP('ok',`داخل النطاق (${d}م)`);$('mainBtn').disabled=false;}},3000);}
      else if(Date.now()-insideSince>=3000){locOk=true;setLP('ok',`داخل النطاق (${d}م)`);$('mainBtn').disabled=false;}
    }else{clearTimeout(stabilityTimer);insideSince=null;locOk=false;$('mainBtn').disabled=true;if(d<=r)setLP('bad','دقة GPS غير كافية - انتظر ثبات الموقع');else setLP('bad',`خارج النطاق (${d}م)`);}
  }catch(e){locOk=false;$('mainBtn').disabled=true;}
}

function setLP(t,tx){const p=$('lpill');p.className='lpill '+t;$('ltxt').textContent=tx;}

function updateAdminHeader(){if($('adminName'))$('adminName').textContent=CU?.name||'الأدمن';}
function normalizeAdminSections(){const host=$('adminScreen');if(!host)return;['sec_adminaccounts','sec_adminlogs'].forEach(id=>{const el=$(id);if(el&&el.parentElement!==host)host.appendChild(el);});}
function initAdmin(){normalizeAdminSections();updateAdminHeader();gotoSec('dashboard');const primary=CU.role==='owner'||isRasimPrimary()||CU.adminLevel==='primary';const secondary=CU.role==='admin'&&!primary;['navAgents','navNotifications','navLocation','navManagement'].forEach(id=>{if($(id))$(id).style.display='';});if(secondary&& !hasAdminPerm('reports'))$('navManagement').style.display='none';if($('nBtn'))$('nBtn').style.display=secondary&&!hasAdminPerm('notifications')?'none':'';if($('navAttendance'))$('navAttendance').style.display=secondary&&!hasAdminPerm('attendance')?'none':'';if($('navAgents'))$('navAgents').style.display=secondary&&!hasAdminPerm('editAgents')?'none':'';if($('navLocation'))$('navLocation').style.display=secondary&&!hasAdminPerm('locations')?'none':'';if($('ownerAuditNav'))$('ownerAuditNav').style.display=CU.role==='owner'?'block':'none';if($('ownerStatusNav'))$('ownerStatusNav').style.display=CU.role==='owner'?'block':'none';if($('navAdminAccounts'))$('navAdminAccounts').style.display=(CU.role==='owner'||primary)?'block':'none';if($('newAccountCard'))$('newAccountCard').style.display=(CU.role==='owner'||primary)?'block':'none';if($('resetOpenMarkersBtn'))$('resetOpenMarkersBtn').style.display=CU.role==='owner'?'block':'none';if($('adminAccountsCard'))$('adminAccountsCard').style.display='block';if($('selfAccountCard')){$('selfAccountCard').style.display=(CU.role==='owner'||primary)?'block':'none';$('self_name').value=CU.name||'';$('self_username').value=CU.username||'';}subUsers();subAtt();if(!secondary||hasAdminPerm('devices'))loadAdminAccounts();if(adminDashTimer)clearInterval(adminDashTimer);adminDashTimer=setInterval(()=>{if(CU?.role==='admin')refDash();},60000);}

function applyUsersSnapshot(sn){
  allUsersRaw=sn.docs.map(d=>({id:d.id,...d.data()}));
  allU=[...allUsersRaw];
  if(CU?.role==='admin'&&!(isRasimPrimary()||CU.adminLevel==='primary'))allU=allU.filter(u=>u.role==='agent'&&u.branch===CU.branch);
  syncAttendanceView();refDash();renderAgs();updPB();if(CU?.role==='owner'||isRasimPrimary()||CU?.adminLevel==='primary')loadAdminAccounts();
  const la=$('leaveAgent');
  if(la)la.innerHTML='<option value="">اختر المندوب</option>'+allU.filter(u=>u.role!=='admin').map(u=>`<option value="${u.id}">${u.name} (@${u.username})</option>`).join('');
}
function subUsers(){
  if(uU)uU();
  uU=null;
  loadAllU();
}
async function loadAllU(){
  try{applyUsersSnapshot(await cachedDocs(query(collection(db,'users'),limit(1000)),15000,'users:list'));}catch(e){console.error('users load',e);toast('تعذر تحميل قائمة المندوبين',5000);}
}

function syncAttendanceView(){const primary=CU?.role==='owner'||isRasimPrimary()||CU?.adminLevel==='primary';if(CU?.role==='admin'&&!primary){const branch=String(CU.branch||'').trim();const agents=allUsersRaw.filter(u=>u.role==='agent'&&String(u.branch||'').trim()===branch);const ids=new Set(agents.map(u=>u.id)),names=new Set(agents.map(u=>String(u.name||'').trim())),users=new Set(agents.map(u=>String(u.username||'').trim().toLowerCase()));const matched=allAttendanceRaw.filter(a=>String(a.branch||'').trim()===branch||ids.has(a.agentId)||names.has(String(a.agentName||'').trim())||users.has(String(a.username||'').trim().toLowerCase()));if(agents.length||matched.length||!allA.length)allA=matched;}else allA=[...allAttendanceRaw];refDash();filterAtt();}
function subAtt(){
  if(aU)aU();
  aU=onSnapshot(query(collection(db,'attendance'),where('date','==',dStr()),limit(500)),sn=>{allAttendanceRaw=sn.docs.map(d=>({id:d.id,...d.data()}));syncAttendanceView();});
}

function subN(){
  if(nU)nU();
  nU=onSnapshot(query(collection(db,'notifications'),orderBy('createdAt','desc'),limit(100)),sn=>{
    const ns=sn.docs.map(d=>({id:d.id,...d.data()}));renderN(ns);
    const visible=CU?.role==='admin'&&!(isRasimPrimary()||CU.adminLevel==='primary')?ns.filter(n=>n.branch===CU.branch):ns;const u=visible.filter(n=>!n.read&&n.type==='alert').length;
    $('nBdg').style.display='inline-flex';$('nBdg').textContent=u;$('s3').textContent=u;
  });
}

function refDash(){
  const td=dStr(),ags=allU.filter(u=>u.role==='agent'&&u.status==='active'),tr=allA.filter(a=>a.date===td),pr=tr.filter(a=>!a.checkoutTime);
  $('s0').textContent=pr.length;$('s1').textContent=ags.length;$('s2').textContent=tr.length;
  const pe=$('presNow');
  if(!pr.length){pe.innerHTML='<div class="empty"><div class="ei"></div>لا يوجد حضور الآن</div>';return;}
  pe.innerHTML=pr.map(a=>`<div class="agr" style="cursor:default"><div class="av">${a.agentName?.charAt(0)||'؟'}</div><div style="flex:1"><div style="font-weight:700">${a.agentName} - ${a.branch||'بدون فرع'}</div><div style="font-size:13px;color:var(--mu)">دخل: ${fT(a.checkinTime)}</div></div><div class="sd on"></div></div>`).join('');
}

window.gotoSec=name=>{
  if(nU&&name!=='notifications'){nU();nU=null;}if(auditUnsub&&name!=='adminlogs'){auditUnsub();auditUnsub=null;}
  window.scrollTo({top:0,left:0,behavior:'smooth'});document.querySelectorAll('.asec').forEach(x=>x.scrollTop=0);
  document.querySelectorAll('.asec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  $('sec_'+name).classList.add('active');
  const navMap={dashboard:'navDashboard',attendance:'navAttendance',agents:'navAgents',notifications:'navNotifications',location:'navLocation',management:'navManagement',adminaccounts:'navAdminAccounts',adminlogs:'ownerAuditNav'};if($(navMap[name]))$(navMap[name]).classList.add('active');
  if(name==='adminlogs'&&CU.role==='owner')loadOwnerAudit();if(name==='adminaccounts'&&(CU.role==='owner'||CU.adminLevel==='primary'||isRasimPrimary())){loadAllU();loadAdminAccounts();}if(name==='notifications'){subN();markNR();}if(name==='agents'){loadAllU();renderAgs();}if(name==='management')loadManagement();if(name==='location'){loadBranchMaps();setTimeout(()=>{Object.values(branchMapState).forEach(x=>{x.map.invalidateSize(true);x.map.setView([x.lat,x.lng],15,{animate:false});});},250);}
};

window.filterAtt=()=>{
  const nm=($('fn')?.value||'').toLowerCase(),fr=$('ff')?.value||'',to=$('ft')?.value||'',st=$('fs')?.value||'',br=$('fb')?.value||'';
  let d=[...allA];
  if(nm)d=d.filter(a=>(a.agentName||'').toLowerCase().includes(nm)||(a.username||'').includes(nm));
  if(fr)d=d.filter(a=>a.date>=fr);if(to)d=d.filter(a=>a.date<=to);if(st==='open')d=d.filter(a=>!a.checkoutTime);if(st==='closed')d=d.filter(a=>a.checkoutTime);if(br)d=d.filter(a=>a.branch===br);const ord=$('fo')?.value==='asc'?1:-1;d.sort((a,b)=>(toDate(a.checkinTime)-toDate(b.checkinTime))*ord);filteredA=d;renderTbl(d);
};
window.clearF=()=>{['fn','ff','ft','fs','fb'].forEach(id=>$(id).value='');$('fo').value='desc';window.filterAtt();};
window.exportExcel=()=>{const rows=(filteredA.length?filteredA:allA).map(r=>({المندوب:(r.agentName||'')+' - '+(r.branch||''),المستخدم:r.username||'',التاريخ:r.date||'',الدخول:r.checkinTime?fT(r.checkinTime):'',الخروج:r.checkoutTime?fT(r.checkoutTime):'لم يسجل خروجًا',المدة:r.checkoutTime?(r.duration||dur(r.checkinTime,r.checkoutTime)):'',الحالة:r.checkoutTime?'مكتمل':'مفتوح'}));if(!rows.length){toast('لا توجد بيانات للتصدير');return;}const cols=Object.keys(rows[0]),esc=v=>'"'+String(v??'').replace(/"/g,'""')+'"',csv='\uFEFF'+[cols,...rows.map(r=>cols.map(c=>r[c]))].map(x=>x.map(esc).join(',')).join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`attendance-${dStr()}.csv`;a.click();URL.revokeObjectURL(a.href);addAudit('export_report','attendance',`${rows.length} records`);};
window.printReport=()=>{const d=filteredA.length?filteredA:allA,w=open('','_blank'),rows=d.map(r=>`<tr><td>${r.agentName||''}</td><td>${r.date||''}</td><td>${r.checkinTime?fT(r.checkinTime):''}</td><td>${r.checkoutTime?fT(r.checkoutTime):'لم يسجل'}</td><td>${r.checkoutTime?(r.duration||dur(r.checkinTime,r.checkoutTime)):'-'}</td></tr>`).join('');w.document.write(`<html dir="rtl"><head><meta charset="utf-8"><title>تقرير الحضور</title><style>body{font-family:Arial;padding:30px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:8px;text-align:right}</style></head><body><h2>تقرير حضور المندوبين</h2><p>تاريخ الطباعة: ${fDT(new Date())}</p><table><tr><th>المندوب</th><th>التاريخ</th><th>الدخول</th><th>الخروج</th><th>المدة</th></tr>${rows}</table></body></html>`);w.document.close();w.print();addAudit('print_report','attendance',`${d.length} records`);};

function renderTbl(d){
  const tb=$('attTb');
  if(!d.length){tb.innerHTML='<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--mu)">لا توجد سجلات</td></tr>';return;}
  tb.innerHTML=d.map((r,i)=>`<tr><td><span class="list-num">${i+1}</span> <strong>${r.agentName||'-'} - ${r.branch||'بدون فرع'}</strong><br><span style="font-size:12px;color:var(--mu)">@${r.username||''}</span></td><td>${fT(r.checkinTime)}<br><span style="font-size:11px;color:var(--mu)">${fD(r.date)}</span></td><td>${r.checkoutTime?fT(r.checkoutTime):'<span style="color:#d97706;font-size:12px"> لم يخرج</span>'}</td><td style="font-size:13px">${r.duration||(r.checkoutTime?'-':'<span style="color:#059669">جارٍ</span>')}</td><td>${r.checkoutTime?'<span class="tag to">خرج</span>':'<span class="tag ti">حاضر</span>'}</td><td><button class="btn bg" style="padding:6px 10px;font-size:12px;border-radius:8px" onclick="showAD('${r.id}')">تفاصيل</button></td></tr>`).join('');
}

window.showAD=id=>{
  const r=allA.find(a=>a.id===id);if(!r)return;
  $('attMBody').innerHTML=`<div class="dr"><span class="dl">المندوب</span><span class="dv">${r.agentName}</span></div><div class="dr"><span class="dl">اليوزر</span><span class="dv">@${r.username}</span></div><div class="dr"><span class="dl">التاريخ</span><span class="dv">${fD(r.date)}</span></div><div class="dr"><span class="dl">وقت الدخول</span><span class="dv" style="color:#059669">${fT(r.checkinTime)}</span></div><div class="dr"><span class="dl">وقت الخروج</span><span class="dv" style="color:#dc2626">${r.checkoutTime?fT(r.checkoutTime):' لم يسجل'}</span></div><div class="dr"><span class="dl">مدة الدوام</span><span class="dv">${r.checkoutTime?(r.duration||dur(r.checkinTime,r.checkoutTime)):'لا يزال داخل'}</span></div><div class="dr"><span class="dl">موقع الدخول</span><span class="dv" style="font-size:12px">${r.checkinLat?r.checkinLat.toFixed(5)+', '+r.checkinLng.toFixed(5):'-'}</span></div><div class="dr"><span class="dl">موقع الخروج</span><span class="dv" style="font-size:12px">${r.checkoutLat?r.checkoutLat.toFixed(5)+', '+r.checkoutLng.toFixed(5):'-'}</span></div>${!r.checkoutTime?`<button class="btn bd bb" style="margin-top:16px" onclick="manualCheckout('${r.id}')">تسجيل خروج يدوي</button>`:''}`;
  openM('attModal');
};

window.manualCheckout=async id=>{const reason=prompt('اكتب سبب تسجيل الخروج اليدوي');if(!reason?.trim())return;await updateDoc(doc(db,'attendance',id),{checkoutTime:serverTimestamp(),manualCheckout:true,manualReason:reason.trim(),manualBy:CU.id,updatedAt:serverTimestamp()});const r=allA.find(x=>x.id===id);if(r?.agentId)await deleteDoc(doc(db,'openAttendance',r.agentId)).catch(()=>{});await addAudit('manual_checkout',id,reason.trim());toast('تم تسجيل الخروج اليدوي');closeM('attModal');};

window.swAgTab=tab=>{agTab=tab;agPage=0;document.querySelectorAll('.stab').forEach((t,i)=>t.classList.toggle('active',tab==='active'?i===0:tab==='pending'?i===1:i===2));renderAgs();};
window.renderAgs=()=>{
  const s=($('ags')?.value||'').toLowerCase();
  const list=allU.filter(u=>{if(u.role!=='agent')return false;return agTab==='active'?(u.status==='active'):agTab==='pending'?(u.status==='pending'):(u.status==='blocked');}).filter(u=>!s||u.name.toLowerCase().includes(s)||u.username.includes(s)||(u.branch||'').includes(s)||(u.phone||'').includes(s)||(u.employeeId||'').toLowerCase().includes(s));
  const c=$('agList');
  if(!list.length){c.innerHTML='<div class="empty"><div class="ei"></div>لا يوجد مندوبون</div>';return;}
  const pageSize=50,totalPages=Math.ceil(list.length/pageSize);agPage=Math.max(0,Math.min(agPage,totalPages-1));const visible=list.slice(agPage*pageSize,(agPage+1)*pageSize);
  const td=dStr();
  c.innerHTML=visible.map((u,i)=>{const pr=allA.some(a=>a.agentId===u.id&&a.date===td&&!a.checkoutTime);return`<div class="agr" onclick="showAgD('${u.id}')"><span class="list-num">${i+1}</span><div class="av ${u.hasAlert?'red':''}">${u.name.charAt(0)}${u.hasAlert?'<div class="adot"></div>':''}</div><div style="flex:1"><div style="font-weight:700">${u.name} - ${u.branch||'بدون فرع'}</div><div style="font-size:13px;color:var(--mu)">@${u.username}</div></div>${CU.role==='admin'||CU.role==='owner'?`<div style="display:flex;gap:4px;flex-wrap:wrap"><button class="btn bp" style="padding:5px 7px;font-size:11px" onclick="event.stopPropagation();showAgD('${u.id}')">تعديل</button>${(CU.role==='owner'||isRasimPrimary()||CU.adminLevel==='primary')?`<button class="btn ${u.status==='blocked'?'bs':'bd'}" style="padding:5px 7px;font-size:11px" onclick="event.stopPropagation();blkAg('${u.id}')">${u.status==='blocked'?'تفعيل':'تعطيل'}</button><button class="btn bd" style="padding:5px 7px;font-size:11px" onclick="event.stopPropagation();deleteUser('${u.id}')">حذف</button>`:''}</div>`:''}${u.status==='pending'?`<div style="display:flex;gap:6px"><button class="btn bs" style="padding:6px 10px;font-size:12px" onclick="event.stopPropagation();apprAg('${u.id}')">قبول</button><button class="btn bd" style="padding:6px 10px;font-size:12px" onclick="event.stopPropagation();blkAg('${u.id}')">رفض</button></div>`:`<div class="sd ${pr?'on':'off'}"></div>`}</div>`;}).join('')+`<div style="display:flex;justify-content:center;gap:8px;align-items:center;margin:14px 0"><button class="btn bg" ${agPage===0?'disabled':''} onclick="agPage--;renderAgs()">السابق</button><span style="font-size:13px;color:var(--mu)">صفحة ${agPage+1} من ${totalPages} - ${list.length} مندوب</span><button class="btn bg" ${agPage>=totalPages-1?'disabled':''} onclick="agPage++;renderAgs()">التالي</button></div>`;
};

function updPB(){const p=allU.filter(u=>u.role!=='admin'&&u.status==='pending');const b=$('pb');b.style.display=p.length?'flex':'none';if(p.length)$('pc').textContent=p.length;}

window.showAgD=async uid=>{
  const u=allU.find(x=>x.id===uid);if(!u)return;
  const recs=allA.filter(a=>a.agentId===uid),days=[...new Set(recs.map(a=>a.date))].length,td=dStr(),pr=recs.some(a=>a.date===td&&!a.checkoutTime);
  $('agMBody').innerHTML=`<div style="text-align:center;margin-bottom:20px"><div style="width:76px;height:76px;background:${u.hasAlert?'var(--d)':'var(--p)'};border-radius:20px;align-items:center;justify-content:center;color:#fff;font-size:34px;font-weight:800;margin-bottom:10px">${u.name.charAt(0)}</div><div style="font-size:20px;font-weight:800">${u.name} - ${u.branch||'بدون فرع'}</div><div style="color:var(--mu)">@${u.username}</div>${u.hasAlert?'<div style="color:#ef4444;font-weight:700;margin-top:8px;font-size:14px"> تنبيه: فُتح الحساب من جهاز آخر!</div>':''}</div><div class="dr"><span class="dl">أيام الحضور</span><span class="dv">${days} يوم</span></div><div class="dr"><span class="dl">حالة اليوم</span><span class="dv">${pr?'<span class="tag ti">حاضر </span>':'<span class="tag to">غائب</span>'}</span></div><div class="dr"><span class="dl">الجهاز</span><span class="dv" style="font-size:12px">${u.deviceInfo||'لم يُسجَّل'}</span></div><div class="dr"><span class="dl">الهاتف</span><span class="dv">${u.phone||'-'}</span></div><div class="dr"><span class="dl">الرقم الوظيفي</span><span class="dv">${u.employeeId||'-'}</span></div><div class="dr"><span class="dl">المنطقة</span><span class="dv">${u.area||'-'}</span></div><div class="dr"><span class="dl">تاريخ الانضمام</span><span class="dv">${u.createdAt?fD(toDate(u.createdAt).toISOString().split('T')[0]):'-'}</span></div><div style="margin-top:20px"><div style="font-weight:700;margin-bottom:12px"> إجراءات الأدمن</div><div class="fg"><label>الاسم الكامل</label><input type="text" id="ename" value="${u.name||''}"></div><div class="fg"><label>تعديل اسم المستخدم</label><input type="text" id="eu" value="${u.username}"></div><div class="fg"><label>رقم الهاتف</label><input type="tel" id="ephone" value="${u.phone||''}"></div><div class="fg"><label>الرقم الوظيفي</label><input type="text" id="eempid" value="${u.employeeId||''}"></div><div class="fg"><label>المنطقة</label><input type="text" id="earea" value="${u.area||''}"></div>${(CU.role==='owner'||isRasimPrimary()||CU.adminLevel==='primary')?`<div class="fg"><label>الفرع</label><select id="ebranch"><option ${u.branch==='المركز'?'selected':''}>المركز</option><option ${u.branch==='الحسينية'?'selected':''}>الحسينية</option><option ${u.branch==='طويريج'?'selected':''}>طويريج</option><option ${u.branch==='الحر'?'selected':''}>الحر</option></select></div>`:''}<div class="fg"><label>كلمة مرور جديدة</label><input type="password" id="ep" placeholder="اتركه فارغاً إذا لا تريد التغيير"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">${(CU.role==='admin'||CU.role==='owner')?`<button class="btn bp" style="flex:1" onclick="svAgE('${uid}')"> حفظ</button>`:''}${u.status==='pending'?`<button class="btn bs" style="flex:1" onclick="apprAg('${uid}')"> قبول</button>`:''}<button class="btn bd" style="flex:1" onclick="blkAg('${uid}')">${u.status==='blocked'?' تفعيل':' تعطيل'}</button><button class="btn bg" style="flex:1" onclick="clrAlrt('${uid}')"> مسح التنبيه</button>${(CU.role==='owner'||isRasimPrimary()||CU.adminLevel==='primary')?`<button class="btn bd" style="flex:1" onclick="deleteUser('${uid}')"> حذف نهائي</button>`:''}${(u.lastBlockedDevice||u.hasAlert)?`<button class="btn bs" style="flex:1" onclick="allowBlockedDevice('${uid}')"> سماح للجهاز الآخر</button>`:''}<button class="btn bg" style="flex:1" onclick="rstDev('${uid}')">إعادة الجهاز</button></div></div>`;
  openM('agModal');
};

window.svAgE=async uid=>{
  const nu=$('eu')?.value.trim().toLowerCase(),np=$('ep')?.value;
  const u=allU.find(x=>x.id===uid);if(!u)return;const upd={name:$('ename')?.value.trim()||u.name,phone:$('ephone')?.value.trim()||'',employeeId:$('eempid')?.value.trim()||'',area:$('earea')?.value.trim()||'',branch:$('ebranch')?.value||u.branch||''};
  if(nu&&nu!==u.username)await apiCall('/api/admin-user',{action:'changeUsername',uid,username:nu});
  if(np)await apiCall('/api/admin-user',{action:'resetPassword',uid,password:np});
  if(CU.role==='admin'&&!(isRasimPrimary()||CU.adminLevel==='primary')){toast(' تم تعديل المعرف والرمز');closeM('agModal');invalidateReadCache('users:');await loadAllU();return;}
  if(CU.role==='owner'||isRasimPrimary()||CU.adminLevel==='primary')await apiCall('/api/admin-user',{action:'updateProfile',uid,...upd});await addAudit('edit_agent',uid,Object.keys(upd).join(','));
  toast(' تم حفظ التعديلات');closeM('agModal');invalidateReadCache('users:');await loadAllU();
};
window.resetOpenMarkers=async()=>{if(CU?.role!=='owner')return;if(!confirm('سيتم حذف مؤشرات الحضور المفتوحة فقط مع إبقاء سجلات الحضور. هل تريد البدء من جديد؟'))return;try{const d=await apiCall('/api/admin-user',{action:'resetOpenAttendance'});toast(`تم تنظيف ${d.cleared||0} مؤشراً، والسجلات محفوظة`);await updBtn();}catch(e){toast(apiMsg(e),5000);}};
window.createManagedUser=async()=>{const role=$('newRole').value;if(role==='agent'&&!(CU.role==='owner'||isRasimPrimary()||CU.adminLevel==='primary')){toast('إنشاء المندوبين متاح للـOwner والأدمن الأول فقط');return;}try{await apiCall('/api/admin-user',{action:'createUser',role,name:$('newName').value.trim(),username:$('newUsername').value.trim().toLowerCase(),password:$('newPassword').value,branch:$('newBranch').value});toast(' تم إنشاء الحساب');['newName','newUsername','newPassword'].forEach(id=>$(id).value='');invalidateReadCache('users:');await loadAllU();}catch(e){const m={INVALID_ROLE:'نوع الحساب غير صحيح',NAME_REQUIRED:'اكتب اسم الحساب',INVALID_USERNAME:'المعرف يجب أن يكون إنكليزيًا من 3 إلى 32 حرفاً أو رقماً',PASSWORD_MIN_6:'الرمز يجب أن يكون 6 أحرف على الأقل',BRANCH_REQUIRED:'اختر الفرع قبل إنشاء الحساب',USERNAME_TAKEN:'هذا المعرف مستخدم مسبقاً'};toast(m[e?.message]||m[e?.error]||apiMsg(e),5000);}};
window.deleteUser=async uid=>{if(!confirm('حذف نهائي لكل بيانات الحساب وسجلاته؟'))return;try{await apiCall('/api/admin-user',{action:'deleteUser',uid});invalidateReadCache('users:');toast('تم الحذف النهائي');closeM('agModal');invalidateReadCache('users:');await loadAllU();}catch(e){toast(apiMsg(e),5000);}};
window.apprAg=async uid=>{await apiCall('/api/admin-user',{action:'approve',uid});toast('تمت الموافقة');closeM('agModal');invalidateReadCache('users:');await loadAllU();};
window.blkAg=async uid=>{const u=allU.find(x=>x.id===uid);const action=u.status==='blocked'?'unblock':'block';await apiCall('/api/admin-user',{action,uid});toast(action==='block'?'محظور':'رُفع الحظر');closeM('agModal');invalidateReadCache('users:');await loadAllU();};
window.clrAlrt=async uid=>{await updateDoc(doc(db,'users',uid),{hasAlert:false});await addAudit('clear_device_alert',uid,'');toast('مسح التنبيه');closeM('agModal');invalidateReadCache('users:');await loadAllU();};
window.rstDev=async uid=>{await apiCall('/api/admin-user',{action:'resetDevice',uid});toast('تم إعادة تعيين الجهاز');closeM('agModal');invalidateReadCache('users:');await loadAllU();};
window.allowBlockedDevice=async uid=>{await apiCall('/api/admin-user',{action:'allowDevice',uid});toast('تم اعتماد الجهاز الجديد');closeM('agModal');invalidateReadCache('users:');await loadAllU();};

async function loadManagement(){if(!['admin','owner'].includes(CU?.role))return;try{const [ls,as]=await Promise.all([cachedDocs(query(collection(db,'leaves'),orderBy('createdAt','desc'),limit(100)),30000,'leaves:list'),CU.role==='owner'?cachedDocs(query(collection(db,'auditLogs'),orderBy('createdAt','desc'),limit(100)),30000,'audit:list'):Promise.resolve({docs:[]})]);const leaves=ls.docs.map(d=>({id:d.id,...d.data()})),audits=as.docs.map(d=>({id:d.id,...d.data()}));$('leaveList').innerHTML=leaves.length?leaves.map(x=>`<div class="ntf info"><div><strong>${x.agentName}</strong><div>${x.from} إلى ${x.to}</div><div style="font-size:12px;color:var(--mu)">${x.reason||''}</div></div><button class="btn bd" style="margin-right:auto;padding:6px 10px" onclick="deleteLeave('${x.id}')">حذف</button></div>`).join(''):'<div class="empty">لا توجد إجازات</div>';if($('auditList'))$('auditList').innerHTML=audits.length?audits.map(x=>`<div class="hi"><div><strong>${x.actorName||'النظام'}</strong> - ${x.action}<div style="font-size:12px;color:var(--mu)">${x.details||''} | ${x.clientTime?fDT(x.clientTime):''}</div></div></div>`).join(''):'<div class="empty">لا يوجد سجل تدقيق</div>';}catch(e){$('auditList').innerHTML='<div class="empty">تعذر تحميل سجل التدقيق</div>';}}
let ownerAudits=[],auditUnsub=null;
async function loadOwnerAudit(){if(CU?.role!=='owner')return;try{const sn=await cachedDocs(query(collection(db,'auditLogs'),orderBy('createdAt','desc'),limit(100)),30000,'audit:owner');const adminIds=new Set(allU.filter(u=>u.role==='admin'||u.role==='owner').map(u=>u.id));ownerAudits=sn.docs.map(d=>({id:d.id,...d.data()})).filter(x=>adminIds.has(x.actorId)).sort((a,b)=>toDate(b.createdAt||b.clientTime||0)-toDate(a.createdAt||a.clientTime||0));renderOwnerAudit();}catch(e){$('ownerAuditList').innerHTML='<div class="empty">تعذر تحميل تحركات الأدمنية</div>';}}
window.renderOwnerAudit=()=>{const admin=($('auditAdminFilter')?.value||'').trim().toLowerCase(),action=($('auditActionFilter')?.value||'').trim().toLowerCase(),date=$('auditDateFilter')?.value||'';const rows=ownerAudits.filter(x=>{const hay=`${x.actorName||''} ${x.actorUsername||''} ${x.actorId||''}`.toLowerCase(),act=String(x.action||'').toLowerCase(),day=x.createdAt?dStr(x.createdAt):'';return(!admin||hay.includes(admin))&&(!action||act.includes(action))&&(!date||day===date);});const labels={login:'تسجيل دخول',create_admin:'إضافة أدمن',create_primary_admin:'إضافة أدمن أولي',create_agent:'إضافة مندوب',edit_agent:'تعديل مندوب',updateProfile:'تعديل بيانات',changeUsername:'تغيير المعرف',resetPassword:'تغيير الرمز',allowDevice:'السماح بجهاز آخر',block:'تعطيل حساب',unblock:'تفعيل حساب',deleteUser:'حذف حساب',delete_user_permanent:'حذف نهائي',approve:'موافقة',resetDevice:'إعادة الجهاز',manual_checkout:'خروج يدوي',export_report:'تصدير تقرير',print_report:'طباعة تقرير'};$('ownerAuditList').innerHTML=rows.map(x=>`<div class="audit-row"><div class="audit-head"><strong> ${x.actorName||'النظام'} ${x.actorUsername?`(@${x.actorUsername})`:''}</strong><span class="audit-action">${labels[x.action]||x.action||'-'}</span></div><div class="audit-meta"> الحساب: ${x.target||'-'}${x.details?` | ${x.details}`:''}</div><div class="audit-meta"> ${x.createdAt?fDT(x.createdAt):x.clientTime?fDT(x.clientTime):'-'}</div></div>`).join('')||'<div class="empty">لا توجد تحركات مطابقة</div>';};
window.loadSystemStatus=async()=>{if(CU?.role!=='owner')return;const c=$('systemStatusBody');c.innerHTML='<div class="empty">جاري الفحص...</div>';try{const d=await apiCall('/api/system-status',{});c.innerHTML=`<div class="dr"><span class="dl">Firebase</span><span class="dv">${d.firebase?' يعمل':' مشكلة'}</span></div><div class="dr"><span class="dl">API</span><span class="dv">${d.api?' يعمل':' مشكلة'}</span></div><div class="dr"><span class="dl">المستخدمون</span><span class="dv">${d.users}</span></div><div class="dr"><span class="dl">المندوبون الفعالون</span><span class="dv">${d.agents}</span></div><div class="dr"><span class="dl">الأدمنية</span><span class="dv">${d.admins}</span></div><div class="dr"><span class="dl">الحضور المفتوح</span><span class="dv">${d.openAttendance}</span></div><div class="dr"><span class="dl">آخر نسخة منشورة</span><span class="dv">${d.publishedVersion||'-'}</span></div><div style="font-size:12px;color:var(--mu);margin-top:10px">آخر فحص: ${fDT(d.checkedAt)}</div>`;}catch(e){c.innerHTML='<div class="empty">تعذر فحص حالة النظام</div>';}};

window.clearAuditFilters=()=>{['auditAdminFilter','auditActionFilter','auditDateFilter'].forEach(id=>{if($(id))$(id).value='';});renderOwnerAudit();};
async function loadAdminAccounts(){if(!(CU?.role==='owner'||isRasimPrimary()||CU?.adminLevel==='primary'))return;const list=allU.filter(u=>u.role==='admin'&&String(u.username||'').toLowerCase()!=='rasim1010');$('adminAccountsList').innerHTML=list.map((u,i)=>`<div class="audit-row"><div class="audit-head"><strong><span class="list-num">${i+1}</span> ${u.name||'-'} (@${u.username})</strong><span>${u.adminLevel==='primary'?'أدمن أولي':'أدمن ثانوي'} - ${u.status==='blocked'?'معطل':'فعال'}</span></div><div class="audit-meta">الفرع: ${u.branch||'بدون فرع'} | الهاتف: ${u.phone||'-'}</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn bp" style="padding:7px 12px;font-size:12px" onclick="showAdminEdit('${u.id}')"> تعديل</button><button class="btn ${u.status==='blocked'?'bs':'bd'}" style="padding:7px 12px;font-size:12px" onclick="adminToggle('${u.id}')">${u.status==='blocked'?' تفعيل':' تعطيل'}</button><button class="btn bd" style="padding:7px 12px;font-size:12px" onclick="deleteAdminAccount('${u.id}')"> حذف</button></div></div>`).join('')||'<div class="empty">لا توجد حسابات أدمنية أخرى</div>';}
window.showAdminEdit=uid=>{const u=allUsersRaw.find(x=>x.id===uid)||allU.find(x=>x.id===uid);if(!u)return;$('agMBody').innerHTML=`<div class="ct"> تعديل حساب الأدمن</div><div class="ib2">${u.name||'-'} (@${u.username||''})</div><div class="fg"><label>الاسم</label><input id="adm_name_${uid}" value="${u.name||''}"></div><div class="fg"><label>المعرف</label><input id="adm_user_${uid}" value="${u.username||''}"></div><div class="fg"><label>الفرع</label><select id="adm_branch_${uid}"><option value="">بدون فرع</option><option ${u.branch==='المركز'?'selected':''}>المركز</option><option ${u.branch==='الحسينية'?'selected':''}>الحسينية</option><option ${u.branch==='طويريج'?'selected':''}>طويريج</option><option ${u.branch==='الحر'?'selected':''}>الحر</option></select></div><div class="fg"><label>رمز جديد (اختياري)</label><input type="password" id="adm_pw_${uid}" placeholder="اتركه فارغاً"></div><div class="ib2">صلاحيات الأدمن - يحددها الـOwner</div><div class="fg"><label><input type="checkbox" id="adm_p_att_${uid}" ${u.permissions?.attendance?'checked':''}> مشاهدة الحضور</label><label><input type="checkbox" id="adm_p_edit_${uid}" ${u.permissions?.editAgents?'checked':''}> تعديل المندوبين</label><label><input type="checkbox" id="adm_p_create_${uid}" ${u.permissions?.createAgents?'checked':''}> إنشاء مندوبين</label><label><input type="checkbox" id="adm_p_dev_${uid}" ${u.permissions?.devices?'checked':''}> إدارة الأجهزة</label><label><input type="checkbox" id="adm_p_loc_${uid}" ${u.permissions?.locations?'checked':''}> إدارة الفروع</label><label><input type="checkbox" id="adm_p_not_${uid}" ${u.permissions?.notifications?'checked':''}> مشاهدة الإشعارات</label><label><input type="checkbox" id="adm_p_rep_${uid}" ${u.permissions?.reports?'checked':''}> تصدير التقارير</label></div><button class="btn bp bb" onclick="saveAdminAccount('${uid}')"> حفظ التعديل</button>`;openM('agModal');};

window.adminToggle=async uid=>{try{const u=allU.find(x=>x.id===uid);if(!u)return;await apiCall('/api/admin-user',{action:u.status==='blocked'?'unblock':'block',uid});toast(u.status==='blocked'?' تم تفعيل الأدمن':' تم تعطيل الأدمن');invalidateReadCache('users:');await loadAllU();}catch(e){toast(apiMsg(e),5000);}};
window.deleteAdminAccount=async uid=>{if(!confirm('حذف حساب الأدمن نهائياً مع كل سجلاته؟'))return;try{await apiCall('/api/admin-user',{action:'deleteUser',uid});toast(' تم حذف حساب الأدمن');invalidateReadCache('users:');await loadAllU();}catch(e){toast(apiMsg(e),5000);}};

window.saveAdminAccount=async uid=>{try{const name=$('adm_name_'+uid).value.trim(),username=$('adm_user_'+uid).value.trim().toLowerCase(),branch=$('adm_branch_'+uid).value,password=$('adm_pw_'+uid).value,permissions={attendance:$('adm_p_att_'+uid)?.checked,editAgents:$('adm_p_edit_'+uid)?.checked,createAgents:$('adm_p_create_'+uid)?.checked,devices:$('adm_p_dev_'+uid)?.checked,locations:$('adm_p_loc_'+uid)?.checked,notifications:$('adm_p_not_'+uid)?.checked,reports:$('adm_p_rep_'+uid)?.checked};await apiCall('/api/admin-user',{action:'updateProfile',uid,name,branch,permissions});if(username)await apiCall('/api/admin-user',{action:'changeUsername',uid,username});if(password)await apiCall('/api/admin-user',{action:'resetPassword',uid,password});await addAudit('edit_admin',uid,`${name} | ${username} | ${branch}`);toast(' تم تعديل حساب الأدمن');invalidateReadCache('users:');await loadAllU();loadAdminAccounts();}catch(e){toast(apiMsg(e),5000);}};
window.saveSelfAccount=async()=>{try{const name=$('self_name').value.trim(),username=$('self_username').value.trim().toLowerCase(),password=$('self_password').value;if(!name){toast('اكتب الاسم');return;}if(!/^[a-z0-9_]{3,32}$/.test(username)){toast('المعرف يجب أن يكون إنكليزياً من 3 إلى 32 حرفاً أو رقماً');return;}await apiCall('/api/admin-user',{action:'updateProfile',uid:CU.id,name});if(username!==String(CU.username||'').toLowerCase())await apiCall('/api/admin-user',{action:'changeUsername',uid:CU.id,username});if(password){if(password.length<6){toast('الرمز يجب أن يكون 6 أحرف على الأقل');return;}await apiCall('/api/admin-user',{action:'resetPassword',uid:CU.id,password});}CU.name=name;CU.username=username;updateAdminHeader();$('self_password').value='';toast(' تم حفظ تعديل الحساب');}catch(e){toast(apiMsg(e),5000);}};
window.saveLeave=async()=>{const uid=$('leaveAgent').value,from=$('leaveFrom').value,to=$('leaveTo').value,reason=$('leaveReason').value.trim(),u=allU.find(x=>x.id===uid);if(!u||!from||!to||to<from){toast('اختر المندوب وتاريخًا صحيحًا');return;}invalidateReadCache('leaves:');await addDoc(collection(db,'leaves'),{agentId:uid,agentName:u.name,from,to,reason,createdBy:CU.id,createdAt:serverTimestamp()});await addAudit('add_leave',uid,`${from}..${to}`);toast('تم حفظ الإجازة');['leaveFrom','leaveTo','leaveReason'].forEach(id=>$(id).value='');loadManagement();};
window.deleteLeave=async id=>{await deleteDoc(doc(db,'leaves',id));invalidateReadCache('leaves:');await addAudit('delete_leave',id,'');loadManagement();};

async function addN(d){try{await addDoc(collection(db,'notifications'),{...d,read:false,createdAt:new Date().toISOString()});}catch(e){}}
function renderN(ns){
  if(CU?.role==='admin'&&!isRasimPrimary())ns=ns.filter(n=>n.branch===CU.branch);
  const c=$('nList');
  if(!ns.length){c.innerHTML='<div class="empty"><div class="ei"></div>لا توجد إشعارات</div>';return;}
  c.innerHTML=ns.map(n=>`<div class="ntf ${n.type}"><div style="font-size:22px;flex-shrink:0">${n.icon||'ℹ'}</div><div style="flex:1"><div style="font-weight:600;font-size:14px">${(n.text||'').replace(/\n/g,'<br>')}</div><div style="font-size:12px;color:var(--mu);margin-top:4px"> ${fDT(n.createdAt)}</div>${n.type==='alert'&&n.agentId?`<button class="btn bs" style="margin-top:8px;padding:7px 12px;font-size:12px" onclick="allowFromNotification('${n.agentId}','${n.id}')"> سماح للجهاز الآخر</button>`:''}</div></div>`).join('');
}
async function markNR(){const q=query(collection(db,'notifications'),where('read','==',false));const sn=await getDocs(q);const b=writeBatch(db);const docs=CU?.role==='admin'&&!(isRasimPrimary()||CU.adminLevel==='primary')?sn.docs.filter(d=>d.data().branch===CU.branch):sn.docs;docs.forEach(d=>b.update(d.ref,{read:true}));if(docs.length)await b.commit();}
window.allowFromNotification=async(uid,nid)=>{try{await apiCall('/api/admin-user',{action:'allowDevice',uid});await deleteDoc(doc(db,'notifications',nid)).catch(()=>{});toast(' تم السماح للجهاز الآخر');}catch(e){toast(apiMsg(e),5000);}};
window.clearNotifs=async()=>{const sn=await getDocs(collection(db,'notifications'));const b=writeBatch(db);sn.docs.forEach(d=>b.delete(d.ref));await b.commit();toast(' تم مسح الإشعارات');};


const branchNames=['المركز','الحسينية','طويريج','الحر'], branchMapState={};
async function loadBranchMaps(){const saved=(await cachedDoc(doc(db,'settings','locations'),120000,'settings:locations')).data()||{};const host=$('branchMaps');if(!host)return;host.innerHTML=branchNames.map((b,i)=>`<div class="card" style="margin:10px 0;padding:12px"><div style="font-weight:800;margin-bottom:8px">${b}</div><div id="branchMap_${i}" class="mapbox"></div><div class="rw"><span>النطاق</span><input id="branchRadius_${i}" type="range" min="25" max="500" step="25" value="${saved[b]?.radius||100}" oninput="$('branchRadiusValue_${i}').textContent=this.value+' م'"><span class="rv" id="branchRadiusValue_${i}">${saved[b]?.radius||100} م</span></div></div>`).join('');setTimeout(()=>branchNames.forEach((b,i)=>{const x=saved[b]||{lat:33.3152,lng:44.3661,radius:100};const m=L.map('branchMap_'+i).setView([x.lat,x.lng],15);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m);let marker=L.marker([x.lat,x.lng]).addTo(m),circle=L.circle([x.lat,x.lng],{radius:x.radius||100,color:'#1a56db',fillOpacity:.16}).addTo(m);m.on('click',e=>{marker.setLatLng(e.latlng);circle.setLatLng(e.latlng);branchMapState[b]={map:m,marker,circle,lat:e.latlng.lat,lng:e.latlng.lng};});branchMapState[b]={map:m,marker,circle,lat:x.lat,lng:x.lng};setTimeout(()=>m.invalidateSize(),100);}),150);}
window.saveBranchMaps=async()=>{const locations={};for(const [i,b] of branchNames.entries()){const x=branchMapState[b];if(x)locations[b]={lat:x.lat,lng:x.lng,radius:parseInt($('branchRadius_'+i).value||100)};}await setDoc(doc(db,'settings','locations'),locations);toast(' تم حفظ مواقع المخازن');};
function initWarehouseMap(){
  if(!window.L||warehouseMap||!$('warehouseMap'))return;
  warehouseMap=L.map('warehouseMap').setView([33.3152,44.3661],13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(warehouseMap);
  warehouseMap.on('click',e=>setWarehousePoint(e.latlng.lat,e.latlng.lng));
  setTimeout(()=>warehouseMap.invalidateSize(),100);
}
function setWarehousePoint(lat,lng){
  if(!warehouseMap)return;
  const radius=parseInt($('rslider')?.value||100);
  if(warehouseMarker)warehouseMap.removeLayer(warehouseMarker);
  if(warehouseCircle)warehouseMap.removeLayer(warehouseCircle);
  warehouseMarker=L.marker([lat,lng]).addTo(warehouseMap).bindPopup('موقع المخزن').openPopup();
  warehouseCircle=L.circle([lat,lng],{radius,color:'#1a56db',fillColor:'#1a56db',fillOpacity:.16}).addTo(warehouseMap);
  warehouseMap.setView([lat,lng],16);
  $('mlat').value=lat.toFixed(6);$('mlng').value=lng.toFixed(6);
  $('lprev').style.display='block';$('lprev').textContent=` ${lat.toFixed(6)}, ${lng.toFixed(6)} - النطاق: ${radius}م`;
}
async function loadWH(){
  try{const sn=await cachedDoc(doc(db,'settings','warehouse'),120000,'settings:warehouse');if(sn.exists()){const w=sn.data();$('whD').textContent=`${w.lat?.toFixed(6)||'?'}, ${w.lng?.toFixed(6)||'?'} - النطاق: ${w.radius||100} م`;$('rslider').value=w.radius||100;$('rv').textContent=(w.radius||100)+' م';if(w.lat){$('mlat').value=w.lat.toFixed(6);$('mlng').value=w.lng.toFixed(6);setWarehousePoint(w.lat,w.lng);}}else{$('whD').textContent='لم يُحدد بعد';}const loc=(await cachedDoc(doc(db,'settings','locations'),120000,'settings:locations')).data()||{},bs=['المركز','الحسينية','طويريج','الحر'];$('branchLocations').innerHTML=bs.map(b=>`<div style="border:1px solid var(--bdr);border-radius:10px;padding:10px;margin-bottom:8px"><strong>${b}</strong><div style="display:flex;gap:6px;margin-top:8px"><input id="lat_${b}" type="number" step="0.000001" placeholder="خط العرض" value="${loc[b]?.lat||''}"><input id="lng_${b}" type="number" step="0.000001" placeholder="خط الطول" value="${loc[b]?.lng||''}"><input id="rad_${b}" type="number" min="25" max="500" value="${loc[b]?.radius||100}" style="max-width:90px" title="النطاق بالمتر"></div></div>`).join('');}catch(e){}
}
window.saveLocations=async()=>{const bs=['المركز','الحسينية','طويريج','الحر'],locations={};for(const b of bs){const lat=parseFloat($('lat_'+b)?.value),lng=parseFloat($('lng_'+b)?.value),radius=parseInt($('rad_'+b)?.value||100);if(Number.isFinite(lat)&&Number.isFinite(lng))locations[b]={lat,lng,radius:Math.max(25,Math.min(500,radius))};}await setDoc(doc(db,'settings','locations'),locations);toast(' تم حفظ مواقع الفروع');};
window.useMyLoc=()=>{
  if(!navigator.geolocation){toast('GPS غير مدعوم');return;}toast('⏳ جاري تحديد موقعك...');
  navigator.geolocation.getCurrentPosition(pos=>{setWarehousePoint(pos.coords.latitude,pos.coords.longitude);$('lprev').textContent=` ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)} - دقة: ${Math.round(pos.coords.accuracy)}م`;toast(' تم تحديد موقعك');},()=>toast(' تعذّر تحديد الموقع'));
};
window.saveWH=async()=>{const point=warehouseMarker?.getLatLng(),lat=point?.lat,lng=point?.lng,r=parseInt($('rslider').value);if(isNaN(lat)||isNaN(lng)){toast(' أدخل إحداثيات صحيحة');return;}await setDoc(doc(db,'settings','warehouse'),{lat,lng,radius:r,updatedAt:new Date().toISOString()});setWarehousePoint(lat,lng);$('whD').textContent=`${lat.toFixed(6)}, ${lng.toFixed(6)} - النطاق: ${r} م`;toast(' تم حفظ إعدادات المخزن');};
window.chAdmPw=async()=>{const np=$('napw').value;if(!np||np.length<8){toast('8 أحرف على الأقل');return;}if(!CU?.id){toast('سجّل الدخول أولاً');return;}try{await apiCall('/api/admin-user',{action:'resetPassword',uid:CU.id,password:np});$('napw').value='';toast('تم تغيير كلمة المرور');}catch(e){toast(apiMsg(e));}};

init();
