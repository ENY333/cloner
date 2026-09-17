function readStoredList(key){
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value.filter(item => typeof item === "string") : [];
  } catch {
    return [];
  }
}

const state = {
  route: "home",
  themeAlt: localStorage.getItem("toolverse:theme") === "alt",
  favorites: readStoredList("toolverse:favorites"),
  recent: readStoredList("toolverse:recent"),
  files: []
};

const catalog = {
  ai: {
    title: "Công cụ AI",
    subtitle: "Viết, phân tích, prompt và tự động hóa bằng AI.",
    icon: "✦",
    tools: [
      ["ai-chat","Không gian AI","Trò chuyện và làm việc với AI trong một không gian thống nhất.","AI","✦"],
      ["prompt-lab","Phòng Prompt","Tạo, thử nghiệm và quản lý prompt có thể tái sử dụng.","AI","⌘"],
      ["text-summarizer","Tóm tắt văn bản","Tóm tắt nội dung dài ngay trên máy hoặc qua API.","AI","≋"],
      ["translate-ai","Dịch bằng AI","Dịch và viết lại văn bản theo ngữ cảnh.","AI","文"]
    ]
  },
  files: {
    title: "Công cụ tệp",
    subtitle: "Xử lý PDF, hình ảnh, OCR và chuyển đổi tệp.",
    icon: "▣",
    tools: [
      ["pdf-toolbox","Bộ công cụ PDF","Gộp, tách, đọc thông tin và xử lý PDF.","PDF","▤"],
      ["image-toolbox","Bộ công cụ ảnh","Đổi kích thước, cắt, nén và chuyển đổi ảnh.","ẢNH","▧"],
      ["ocr-studio","OCR Studio","Trích xuất văn bản từ ảnh và tài liệu quét.","OCR","⌗"],
      ["converter","Bộ chuyển đổi","Chuyển đổi các định dạng văn bản, ảnh và tài liệu phổ biến.","CHUYỂN ĐỔI","⇄"]
    ]
  },
  google: {
    title: "Công cụ Google",
    subtitle: "Sao chép, quản lý Drive và theo dõi tác vụ trong một nơi.",
    icon: "G",
    tools: [
      ["drive-cloner","Drive Cloner Pro","Sao chép Drive, xem dung lượng và lịch sử tác vụ trong một ứng dụng.","GOOGLE DRIVE","G"]
    ]
  },
  developer: {
    title: "Công cụ lập trình",
    subtitle: "Tiện ích nhanh cho dữ liệu, API, mã hóa và mã nguồn.",
    icon: "</>",
    tools: [
      ["json","Định dạng JSON","Kiểm tra, định dạng, thu gọn và xem JSON.","LẬP TRÌNH","{}"],
      ["base64","Base64","Mã hóa và giải mã văn bản bằng Base64.","LẬP TRÌNH","64"],
      ["api-tester","Kiểm thử API","Gọi endpoint HTTP và xem phản hồi JSON.","LẬP TRÌNH","↗"],
      ["code-tools","Công cụ mã nguồn","Định dạng đoạn mã, so sánh và biến đổi văn bản nhanh.","DEV","</>"]
    ]
  },
  engineering: {
    title: "Công cụ kỹ thuật",
    subtitle: "Tiện ích kỹ thuật cho CAD, CNC, MATLAB và PLC.",
    icon: "⌬",
    tools: [
      ["cad","Công cụ CAD","Hình học, tọa độ, layer và tiện ích hỗ trợ bản vẽ.","CAD","⌬"],
      ["cnc","Công cụ CNC","Tọa độ, lượng chạy dao, tốc độ và hỗ trợ G-code.","CNC","CNC"],
      ["matlab","Công cụ MATLAB","Tiện ích nhanh cho điều khiển, đồ thị và mã MATLAB.","MATLAB","M"],
      ["plc","Công cụ PLC","Logic PLC, địa chỉ và tiện ích điều khiển điện.","PLC","PLC"]
    ]
  }
};

const toolRegistry = Object.fromEntries(
  Object.values(catalog).flatMap(group => group.tools.map(t => [t[0], {id:t[0],name:t[1],desc:t[2],tag:t[3],icon:t[4]}]))
);

const content = document.getElementById("content");
const toastEl = document.getElementById("toast");
const pageName = document.getElementById("pageName") || { textContent: "" };
const globalSearch = document.getElementById("globalSearch");

function saveState(){
  localStorage.setItem("toolverse:favorites", JSON.stringify(state.favorites));
  localStorage.setItem("toolverse:recent", JSON.stringify(state.recent));
  localStorage.setItem("toolverse:theme", state.themeAlt ? "alt" : "default");
}
function showToast(msg){
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(()=>toastEl.classList.remove("show"),2600);
}
function esc(v){
  return String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
function fmtBytes(n){
  if(!n) return "0 B";
  const u=["B","KB","MB","GB"]; const i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),u.length-1);
  return `${(n/Math.pow(1024,i)).toFixed(i?1:0)} ${u[i]}`;
}
function isFav(id){return state.favorites.includes(id)}
function toggleFav(id){
  state.favorites = isFav(id) ? state.favorites.filter(x=>x!==id) : [id,...state.favorites];
  saveState(); render();
}
function pushRecent(id){
  state.recent = [id,...state.recent.filter(x=>x!==id)].slice(0,12);
  saveState();
}
function toolCard(tool){
  return `<article class="tool-card" data-tool="${esc(tool[0])}" role="button" tabindex="0" aria-label="Mở ${esc(tool[1])}">
    <div class="tool-top">
      <div class="tool-icon">${esc(tool[4])}</div>
      <button class="icon-btn fav-btn" data-fav="${esc(tool[0])}" title="Yêu thích">${isFav(tool[0])?"★":"☆"}</button>
    </div>
    <h3>${esc(tool[1])}</h3>
    <p>${esc(tool[2])}</p>
    <div class="tool-bottom">
      <span class="tag">${esc(tool[3])}</span>
      <span class="open-arrow">→</span>
    </div>
  </article>`;
}

function statCard(value, label){
  return `<article class="stat"><strong>${esc(value)}</strong><span>${esc(label)}</span></article>`;
}

function categoryCard(key, group){
  return `<button class="category-card" type="button" data-route="${esc(key)}" aria-label="Mở ${esc(group.title)}">
    <span class="category-icon" aria-hidden="true">${esc(group.icon)}</span>
    <span class="category-copy"><strong>${esc(group.title)}</strong><small>${group.tools.length} công cụ</small></span>
    <span class="category-arrow" aria-hidden="true">→</span>
  </button>`;
}

function renderHome(){
  const all = Object.values(catalog).flatMap(x => x.tools);
  const favorites = state.favorites.map(id => toolRegistry[id]).filter(Boolean);
  const recent = state.recent.map(id => toolRegistry[id]).filter(Boolean);
  pageName.textContent = "Trang chủ";

  content.innerHTML = `
    <section class="hero">
      <div class="eyebrow">MỘT NƠI • NHIỀU QUY TRÌNH</div>
      <h1>Mọi công cụ. Một không gian.</h1>
      <p>ToolVerse tập hợp công cụ AI, tệp, Google, lập trình và kỹ thuật vào một giao diện duy nhất — chọn công cụ và bắt đầu làm việc ngay.</p>
      <div class="hero-actions">
        <button class="primary" data-route="all-tools">Xem tất cả công cụ</button>
        <button class="secondary" data-route="developer">Mở công cụ lập trình</button>
      </div>
    </section>

    <section class="dashboard-section">
      <div class="section-head">
        <div>
          <h2>Tổng quan</h2>
          <p>Thông tin nhanh về không gian công cụ của bạn.</p>
        </div>
      </div>
      <div class="stat-grid">
        ${statCard(all.length, "Công cụ")}
        ${statCard(Object.keys(catalog).length, "Danh mục")}
        ${statCard(state.favorites.length, "Yêu thích")}
        ${statCard(state.recent.length, "Gần đây")}
      </div>
    </section>

    <section class="dashboard-section">
      <div class="section-head">
        <div>
          <h2>Danh mục</h2>
          <p>Chọn nhóm công cụ theo nhu cầu của bạn.</p>
        </div>
      </div>
      <div class="category-strip">
        ${Object.entries(catalog).map(([key, group]) => categoryCard(key, group)).join("")}
      </div>
    </section>

    <section class="dashboard-section">
      <div class="section-head">
        <div>
          <h2>Công cụ nổi bật</h2>
          <p>Mở nhanh những tiện ích được sử dụng nhiều.</p>
        </div>
        <button class="secondary section-action" data-route="all-tools">Xem tất cả</button>
      </div>
      <div class="card-grid">
        ${all.slice(0, 8).map(t => toolCard(t)).join("")}
      </div>
    </section>

    ${favorites.length ? `
      <section class="dashboard-section">
        <div class="section-head">
          <div>
            <h2>Công cụ yêu thích</h2>
            <p>Những công cụ bạn đã đánh dấu.</p>
          </div>
        </div>
        <div class="card-grid">
          ${favorites.map(t => toolCard([t.id, t.name, t.desc, t.tag, t.icon])).join("")}
        </div>
      </section>
    ` : ""}

    ${recent.length ? `
      <section class="dashboard-section">
        <div class="section-head">
          <div><h2>Vừa sử dụng</h2><p>Tiếp tục nhanh từ các công cụ gần đây.</p></div>
          <button class="secondary section-action" type="button" data-route="recent">Xem lịch sử</button>
        </div>
        <div class="card-grid">${recent.slice(0, 4).map(t => toolCard([t.id, t.name, t.desc, t.tag, t.icon])).join("")}</div>
      </section>
    ` : ""}
  `;

  bindCards();
}

function renderCategory(key){
  const g=catalog[key];
  pageName.textContent=g.title;
  content.innerHTML=`
    <div class="page-title"><h1>${g.icon} ${esc(g.title)}</h1><p>${esc(g.subtitle)}</p></div>
    <div class="section-head"><div><h2>Công cụ</h2><p>${g.tools.length} công cụ trong danh mục này.</p></div></div>
    <div class="card-grid">${g.tools.map(toolCard).join("")}</div>
  `;
  bindCards();
}

function renderSimplePage(key,title,desc,items){
  pageName.textContent=title;
  const tools=items.map(id=>toolRegistry[id]).filter(Boolean);
  content.innerHTML=`
    <div class="page-title"><h1>${esc(title)}</h1><p>${esc(desc)}</p></div>
    <div class="section-head"><div><h2>${tools.length ? "Công cụ của bạn" : "Chưa có gì ở đây"}</h2><p>${tools.length?"Chọn một công cụ để tiếp tục.":"Các công cụ bạn sử dụng sẽ xuất hiện tại đây."}</p></div></div>
    ${tools.length?`<div class="card-grid">${tools.map(t=>toolCard([t.id,t.name,t.desc,t.tag,t.icon])).join("")}</div>`:`<div class="empty">Chưa có dữ liệu.</div>`}
  `;
  bindCards();
}

function renderAllTools(){
  pageName.textContent="Tất cả công cụ";
  const groups=Object.entries(catalog);
  content.innerHTML=`
    <div class="page-title"><h1>Tất cả công cụ</h1><p>Toàn bộ công cụ hiện có trong ToolVerse.</p></div>
    ${groups.map(([k,g])=>`<div class="section-head"><div><h2>${g.icon} ${esc(g.title)}</h2><p>${g.tools.length} công cụ</p></div><button class="secondary" data-route="${k}">Mở danh mục</button></div><div class="card-grid">${g.tools.map(toolCard).join("")}</div>`).join("")}
  `;
  bindCards();
}

function renderSettings(){
  pageName.textContent="Cài đặt";
  content.innerHTML=`
    <div class="page-title"><h1>Cài đặt</h1><p>Thiết lập workspace và trải nghiệm ToolVerse.</p></div>
    <div class="setting-grid" style="margin-top:18px">
      <div class="setting-card">
        <h3>Giao diện</h3><p>Chuyển accent theme của giao diện.</p>
        <div class="switch-line"><span>Màu nhấn thay thế</span><button class="switch ${state.themeAlt?"on":""}" id="altTheme"><i></i></button></div>
      </div>
      <div class="setting-card">
        <h3>Lưu trữ cục bộ</h3><p>Yêu thích và công cụ gần đây được lưu trong trình duyệt.</p>
        <button class="secondary" id="clearLocal">Xóa dữ liệu cục bộ</button>
      </div>
      <div class="setting-card">
        <h3>Google Apps Script</h3><p>Drive Cloner dùng API proxy `/api/gas` khi project được deploy trên Vercel.</p>
        <div class="note">Environment variable: GAS_API_URL</div>
      </div>
      <div class="setting-card">
        <h3>Không gian</h3><p>Kiến trúc sẵn sàng để thêm tools mới mà không cần đổi layout.</p>
        <div class="note">${Object.values(catalog).flatMap(x=>x.tools).length} công cụ đã đăng ký</div>
      </div>
    </div>
  `;
  document.getElementById("altTheme").onclick=()=>{
    state.themeAlt=!state.themeAlt;
    document.body.classList.toggle("dark-alt",state.themeAlt);
    renderSettings();
  };
  document.getElementById("clearLocal").onclick=()=>{
    state.favorites=[]; state.recent=[]; saveState(); showToast("Đã xóa dữ liệu cục bộ."); renderSettings();
  };
}

function openTool(id){
  const t=toolRegistry[id];
  if(!t) return;
  pushRecent(id);
  pageName.textContent=t.name;
  const panels = {
    "json": toolJson,
    "base64": toolBase64,
    "api-tester": toolApiTester,
    "code-tools": toolCodeTools,
    "image-toolbox": toolImageToolbox,
    "converter": toolConverter,
    "ocr-studio": toolOcrStudio,
    "drive-cloner": toolDriveCloner
  };
  (panels[id] || (()=>toolGeneric(t)))();
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
}

function toolHeader(t, body){
  content.innerHTML=`<div class="page-title"><h1>${esc(t.icon)} ${esc(t.name)}</h1><p>${esc(t.desc)}</p></div><div class="tool-workspace">${body}</div>`;
}

function toolJson(){
  const t=toolRegistry.json;
  toolHeader(t,`
    <div class="workspace-header"><h2>JSON Không gian</h2><span>kiểm tra • định dạng • thu gọn</span></div>
    <textarea id="jsonInput" placeholder='{"name":"ToolVerse","tools":42}'></textarea>
    <div class="actionbar"><button class="primary" id="jsonFormat">Format</button><button class="secondary" id="jsonMinify">Minify</button><button class="secondary" id="jsonValidate">Validate</button></div>
    <div class="output" id="jsonOutput">Kết quả sẽ xuất hiện ở đây.</div>
  `);
  const inp=document.getElementById("jsonInput"),out=document.getElementById("jsonOutput");
  const parse=()=>{try{return JSON.parse(inp.value)}catch(e){out.textContent="❌ "+e.message;throw e}};
  document.getElementById("jsonFormat").onclick=()=>{try{out.textContent=JSON.stringify(parse(),null,2)}catch{}};
  document.getElementById("jsonMinify").onclick=()=>{try{out.textContent=JSON.stringify(parse())}catch{}};
  document.getElementById("jsonValidate").onclick=()=>{try{parse();out.textContent="✓ JSON hợp lệ."}catch{}};
}

function toolBase64(){
  const t=toolRegistry.base64;
  toolHeader(t,`
    <div class="workspace-header"><h2>Base64</h2><span>xử lý trên trình duyệt</span></div>
    <textarea id="b64Input" placeholder="Nhập text..."></textarea>
    <div class="actionbar"><button class="primary" id="b64Encode">Encode</button><button class="secondary" id="b64Decode">Decode</button></div>
    <div class="output" id="b64Output"></div>
  `);
  const inp=document.getElementById("b64Input"),out=document.getElementById("b64Output");
  document.getElementById("b64Encode").onclick=()=>{try{out.textContent=btoa(unescape(encodeURIComponent(inp.value)))}catch(e){out.textContent=e.message}};
  document.getElementById("b64Decode").onclick=()=>{try{out.textContent=decodeURIComponent(escape(atob(inp.value.trim())))}catch(e){out.textContent="❌ Base64 không hợp lệ."}};
}

function toolApiTester(){
  const t=toolRegistry["api-tester"];
  toolHeader(t,`
    <div class="workspace-header"><h2>Kiểm thử API</h2><span>GET • POST • JSON</span></div>
    <div class="tool-row"><input class="input" id="apiUrl" placeholder="https://api.example.com/data"><select id="apiMethod"><option>GET</option><option>POST</option></select></div>
    <textarea id="apiBody" style="margin-top:10px;min-height:120px" placeholder='Nội dung POST dạng JSON (không bắt buộc)'></textarea>
    <div class="actionbar"><button class="primary" id="apiSend">Gửi yêu cầu</button></div>
    <div class="output" id="apiOutput">Phản hồi sẽ xuất hiện ở đây...</div>
  `);
  document.getElementById("apiSend").onclick=async()=>{
    const url=document.getElementById("apiUrl").value.trim(), method=document.getElementById("apiMethod").value;
    const out=document.getElementById("apiOutput");
    if(!url){out.textContent="Nhập URL.";return}
    try{
      const opt={method};
      if(method==="POST"){opt.headers={"Content-Type":"application/json"};opt.body=document.getElementById("apiBody").value||"{}"}
      const started=performance.now(),res=await fetch(url,opt),text=await res.text();
      out.textContent=`HTTP ${res.status} • ${(performance.now()-started).toFixed(0)} ms\\n\\n${text}`;
    }catch(e){out.textContent="❌ "+e.message}
  };
}

function toolCodeTools(){
  const t=toolRegistry["code-tools"];
  toolHeader(t,`
    <div class="workspace-header"><h2>Code Không gian</h2><span>bảng thao tác nhanh</span></div>
    <textarea id="codeIn" placeholder="// Dán code hoặc text..."></textarea>
    <div class="actionbar"><button class="primary" id="copyCode">Sao chép</button><button class="secondary" id="cleanCode">Xóa khoảng trắng cuối dòng</button></div>
    <div class="note">Đây là workspace nhẹ; parser/formatter chuyên sâu có thể gắn thêm ở backend sau.</div>
  `);
  document.getElementById("copyCode").onclick=async()=>{await navigator.clipboard.writeText(document.getElementById("codeIn").value);showToast("Đã copy.")};
  document.getElementById("cleanCode").onclick=()=>{document.getElementById("codeIn").value=document.getElementById("codeIn").value.split("\\n").map(s=>s.trimEnd()).join("\\n").trim()};
}

function toolImageToolbox(){
  const t=toolRegistry["image-toolbox"];
  toolHeader(t,`
    <div class="workspace-header"><h2>Image Toolbox</h2><span>xử lý cục bộ</span></div>
    <label class="dropzone" id="imgDrop"><input id="imgInput" type="file" accept="image/*" hidden><strong>Chọn ảnh</strong><span>Ảnh được xử lý trực tiếp trên trình duyệt</span></label>
    <div class="tool-row" style="margin-top:10px"><input class="input" id="imgW" type="number" placeholder="Chiều rộng"><input class="input" id="imgH" type="number" placeholder="Chiều cao"></div>
    <div class="actionbar"><button class="primary" id="imgProcess">Đổi kích thước & tải PNG</button></div>
    <canvas id="imgCanvas" style="display:none"></canvas>
  `);
  const input=document.getElementById("imgInput");
  document.getElementById("imgDrop").onclick=()=>input.click();
  document.getElementById("imgProcess").onclick=()=>{
    const file=input.files?.[0]; if(!file){showToast("Chưa chọn ảnh.");return}
    const img=new Image();img.onload=()=>{
      const w=Number(document.getElementById("imgW").value)||img.width, h=Number(document.getElementById("imgH").value)||img.height;
      const c=document.getElementById("imgCanvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);
      const a=document.createElement("a");a.href=c.toDataURL("image/png");a.download="toolverse-image.png";a.click();
    };img.src=URL.createObjectURL(file);
  };
}

function toolConverter(){
  const t=toolRegistry.converter;
  toolHeader(t,`
    <div class="workspace-header"><h2>Bộ chuyển đổi văn bản</h2><span>line • case • cleanup</span></div>
    <textarea id="convIn" placeholder="Nhập nội dung..."></textarea>
    <div class="actionbar"><button class="secondary" data-conv="upper">UPPER</button><button class="secondary" data-conv="lower">lower</button><button class="secondary" data-conv="trim">Trim</button><button class="secondary" data-conv="lines">Sắp xếp dòng</button></div>
    <div class="output" id="convOut"></div>
  `);
  document.querySelectorAll("[data-conv]").forEach(b=>b.onclick=()=>{
    let v=document.getElementById("convIn").value;
    const mode=b.dataset.conv;
    if(mode==="upper")v=v.toUpperCase(); if(mode==="lower")v=v.toLowerCase(); if(mode==="trim")v=v.trim();
    if(mode==="lines")v=v.split("\\n").map(x=>x.trim()).filter(Boolean).sort((a,b)=>a.localeCompare(b)).join("\\n");
    document.getElementById("convOut").textContent=v;
  });
}

function toolOcrStudio(){
  const t=toolRegistry["ocr-studio"];
  toolHeader(t,`
    <div class="workspace-header"><h2>OCR Studio</h2><span>mô-đun đang chờ triển khai</span></div>
    <div class="empty">OCR engine chưa được gắn vào bản này.<br><br>UI đã sẵn sàng để nối Tesseract.js hoặc một OCR API.</div>
  `);
}

function toolDriveCloner(){
  const t=toolRegistry["drive-cloner"];
  toolHeader(t,`
    <div class="workspace-header"><h2>Drive Cloner Pro</h2><span>Sao chép • dung lượng • lịch sử tác vụ</span></div>
    <div class="tool-row"><input class="input" id="srcId" placeholder="ID hoặc link tệp nguồn"><input class="input" id="dstId" placeholder="ID hoặc link thư mục đích"></div>
    <div class="actionbar"><button class="primary" id="cloneDrive">Bắt đầu sao chép</button><button class="secondary" id="checkDrive">Kiểm tra kết nối</button><button class="secondary" id="showQuota">Xem dung lượng</button><button class="secondary" id="loadTasks">Lịch sử tác vụ</button></div>
    <div class="output" id="driveOut">Sẵn sàng kết nối với Google Drive.</div>
    <div class="file-list" id="taskList" aria-live="polite"></div>
  `);
  async function call(action, params={}){
    const u=new URL("/api/gas",location.origin);u.searchParams.set("action",action);
    Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));
    const r=await fetch(u),txt=await r.text();
    let d;try{d=JSON.parse(txt)}catch{throw new Error("API không trả JSON")}
    if(!r.ok||d.ok===false||d.success===false)throw new Error(d.error||d.message||`HTTP ${r.status}`); return d;
  }
  const out=document.getElementById("driveOut"), list=document.getElementById("taskList");
  const action=(button, work)=>button.onclick=async()=>{
    button.disabled=true;
    try{await work()}catch(e){out.textContent="❌ "+e.message}finally{button.disabled=false}
  };
  action(document.getElementById("checkDrive"), async()=>{
    const d=await call("health"); out.textContent=d.message||"✓ Kết nối Google Drive đang hoạt động.";
  });
  action(document.getElementById("cloneDrive"), async()=>{
    const src=document.getElementById("srcId").value.trim(),dst=document.getElementById("dstId").value.trim();
    if(!src||!dst){out.textContent="Nhập tệp nguồn và thư mục đích.";return}
    const d=await call("create_batch",{src,dst});out.textContent=d.message||"✓ Đã gửi yêu cầu sao chép.";
  });
  action(document.getElementById("showQuota"), async()=>{
    const d=await call("quota"), quota=d.quota||d.data||d;
    const used=quota.used ?? quota.storageUsed, limit=quota.limit ?? quota.storageLimit;
    out.textContent=Number.isFinite(Number(used))&&Number.isFinite(Number(limit))
      ? `Đã dùng ${fmtBytes(Number(used))} / ${fmtBytes(Number(limit))}.`
      : JSON.stringify(d,null,2);
  });
  action(document.getElementById("loadTasks"), async()=>{
    const d=await call("list"), tasks=Array.isArray(d.tasks)?d.tasks:[];
    out.textContent=tasks.length?`Có ${tasks.length} tác vụ gần đây.`:"Chưa có tác vụ nào.";
    list.innerHTML=tasks.map(task=>`<div class="file-row"><span class="name">${esc(task.name||"Tác vụ Drive")}</span><span class="size">${esc(task.status||"đang xử lý")} · ${esc(task.message||"")}</span></div>`).join("");
  });
}

function toolGeneric(t){
  toolHeader(t,`<div class="empty">Module <strong>${esc(t.name)}</strong> đã có trong ToolVerse nhưng chưa gắn engine xử lý.<br><br>UI/API hook sẵn sàng để triển khai.</div>`);
}

function bindCards(){
  document.querySelectorAll("[data-tool]").forEach(el=>el.onclick=e=>{
    if(e.target.closest("[data-fav]"))return;
    openTool(el.dataset.tool);
  });
  document.querySelectorAll("[data-tool]").forEach(el=>el.onkeydown=e=>{
    if((e.key === "Enter" || e.key === " ") && !e.target.closest("[data-fav]")){
      e.preventDefault();
      openTool(el.dataset.tool);
    }
  });
  document.querySelectorAll("[data-fav]").forEach(btn=>btn.onclick=e=>{e.stopPropagation();toggleFav(btn.dataset.fav)});
  document.querySelectorAll("[data-route]").forEach(el=>el.onclick=()=>navigate(el.dataset.route));
}

function render(){
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.route===state.route));
  if(state.route==="home") {pageName.textContent="Home";renderHome();return}
  if(state.route==="all-tools"){renderAllTools();return}
  if(state.route==="favorites"){renderSimplePage("favorites","Yêu thích","Các công cụ bạn đã đánh dấu.",state.favorites);return}
  if(state.route==="recent"){renderSimplePage("recent","Gần đây","Các tool bạn vừa mở.",state.recent);return}
  if(state.route==="settings"){renderSettings();return}
  if(catalog[state.route]){renderCategory(state.route);return}
  renderHome();
}

function navigate(route){
  state.route=route;
  history.replaceState({}, "", `#${route}`);
  render();
  setMobileMenu(false);
}
document.querySelectorAll(".nav-item").forEach(x=>x.addEventListener("click",()=>navigate(x.dataset.route)));

document.getElementById("collapseBtn").onclick=()=>{
  document.body.classList.toggle("sidebar-collapsed");
  localStorage.setItem("toolverse:sidebar-collapsed", document.body.classList.contains("sidebar-collapsed") ? "true" : "false");
};
function setMobileMenu(open){
  document.getElementById("sidebar").classList.toggle("open", open);
  document.getElementById("sidebarScrim").classList.toggle("visible", open);
  document.getElementById("mobileMenu").setAttribute("aria-expanded", String(open));
}
document.getElementById("mobileMenu").onclick=()=>setMobileMenu(!document.getElementById("sidebar").classList.contains("open"));
document.getElementById("sidebarScrim").onclick=()=>setMobileMenu(false);
document.getElementById("themeBtn").onclick=()=>{state.themeAlt=!state.themeAlt;document.body.classList.toggle("dark-alt",state.themeAlt);saveState();};

globalSearch.addEventListener("input",()=>{
  const q=globalSearch.value.trim().toLowerCase();
  if(!q){render();return}
  pageName.textContent="Tìm kiếm";
  const results=Object.values(toolRegistry).filter(t=>(t.name+" "+t.desc+" "+t.tag).toLowerCase().includes(q));
  content.innerHTML=`<div class="page-title"><h1>Tìm kiếm</h1><p>${results.length} kết quả cho “${esc(q)}”</p></div>
    <div class="card-grid" style="margin-top:18px">${results.length?results.map(t=>toolCard([t.id,t.name,t.desc,t.tag,t.icon])).join(""):`<div class="empty">Không tìm thấy tool phù hợp.</div>`}</div>`;
  bindCards();
});
document.addEventListener("keydown",e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();globalSearch.focus()}
  if(e.key==="Escape"&&document.activeElement===globalSearch){globalSearch.value="";render()}
  if(e.key==="Escape"){setMobileMenu(false)}
});
window.addEventListener("hashchange",()=>navigate(location.hash.slice(1)||"home"));

document.body.classList.toggle("dark-alt", state.themeAlt);
document.body.classList.toggle("sidebar-collapsed", localStorage.getItem("toolverse:sidebar-collapsed") === "true");
navigate(location.hash.slice(1)||"home");
