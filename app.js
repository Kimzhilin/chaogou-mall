/* =========================================================
   潮购 · 虚拟商城 应用逻辑（纯前端，数据存于本地）
   V2：真实商品图 + 限时秒杀 + 领券中心 + 优惠券抵扣
   ========================================================= */
'use strict';

const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];
const app = qs('#app');

/* ---------- 本地存储 ---------- */
const LS = {
  cart: 'cg_cart', orders: 'cg_orders', addr: 'cg_addr', addrs: 'cg_addrs', buynow: 'cg_buynow', coupons: 'cg_coupons', userrev: 'cg_userrev', user: 'cg_user',
};
const get = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let cart = get(LS.cart, []);
let orders = get(LS.orders, []);
let buyNow = get(LS.buynow, null);
let claimedCoupons = get(LS.coupons, []);
let checkoutCouponId = null;
let lastSearch = '';
/* 用户发表的评价（持久化，刷新后仍展示在商品页） */
let userReviews = get(LS.userrev, []);

/* =========================================================
   微信登录（前端 + 后端骨架）
   - 真实登录：配置 WECHAT_BACKEND / WECHAT_APPID 后走公众号 OAuth2 网页授权
   - 演示登录：未配置时自动生成「虚拟微信身份」（免费、无需任何资质），用于体验账号区分
   - 后端云函数代码见 functions/wechat_login/index.js（部署到 CloudBase / 任意 Serverless 即可）
   ========================================================= */
const WECHAT_BACKEND = '';   // 部署后填你的后端地址，如 'https://xxx.apigw.tencentcs.com'；留空=演示登录
const WECHAT_APPID = '';     // 公众号/开放平台 AppID（真实登录用）

function getWxUser() { return get(LS.user, null); }
function currentOpenid() { const u = getWxUser(); return u ? u.openid : 'anon'; }

async function wxLogin() {
  const u = getWxUser();
  if (u) return u;
  /* 真实 OAuth2 网页授权：跳微信授权页，回调由后端完成 code→openid 后带 token 跳回 */
  if (WECHAT_BACKEND && WECHAT_APPID) {
    const back = location.origin + location.pathname + location.hash;
    const url = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WECHAT_APPID}`
      + `&redirect_uri=${encodeURIComponent(WECHAT_BACKEND + '/wechat/callback')}`
      + `&response_type=code&scope=snsapi_userinfo&state=${encodeURIComponent(back)}#wechat_redirect`;
    location.href = url;
    return null;
  }
  /* 演示登录：生成本地虚拟身份，立即可用，无需任何资质/费用 */
  const id = 'wx_mock_' + Math.random().toString(36).slice(2, 10);
  const user = { openid: id, nickname: '微信用户_' + id.slice(-4), avatar: '', isMock: true, loginAt: Date.now() };
  set(LS.user, user);
  renderWxUser();
  showToast('已体验微信登录（演示虚拟账号）');
  return user;
}
function wxLogout() {
  set(LS.user, null);
  renderWxUser();
  showToast('已退出登录');
}
function renderWxUser() {
  const el = document.getElementById('wxLoginBtn');
  if (!el) return;
  const u = getWxUser();
  if (u) {
    el.innerHTML = `<span class="ic">${u.avatar ? `<img src="${esc(u.avatar)}" class="wx-ava">` : '👤'}</span>${esc(u.nickname)}`;
    el.dataset.act = 'wxlogout';
  } else {
    el.innerHTML = `<span class="ic">💬</span>微信登录`;
    el.dataset.act = 'wxlogin';
  }
}
/* 若后端回调带 ?wx_token= 回来，则落地为已登录态 */
(function handleWxCallback() {
  const m = location.search.match(/[?&]wx_token=([^&]+)/);
  if (!m) return;
  try {
    const u = JSON.parse(decodeURIComponent(m[1]));
    set(LS.user, u);
    history.replaceState(null, '', location.pathname + location.hash);
    setTimeout(renderWxUser, 0);
  } catch (_) {}
})();

/* ---------- 收货地址簿（常用地址管理） ---------- */
let addrs = get(LS.addrs, null);
/* 结算页当前选中的地址 id / 是否切换为“新增地址”模式 */
let checkoutAddrId = null;
let checkoutNewAddr = false;

const genAddrId = () => 'AD' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 90 + 10);

/* 首次进入：迁移旧版单地址 cg_addr → 地址簿 cg_addrs；否则播种一条示例默认地址 */
function initAddrBook() {
  if (Array.isArray(addrs) && addrs.length) { ensureDefault(); return; }
  addrs = [];
  const legacy = get(LS.addr, null);
  if (legacy && (legacy.name || legacy.phone || legacy.detail)) {
    addrs.push({
      id: genAddrId(),
      name: legacy.name || '', phone: legacy.phone || '',
      prov: legacy.prov || '广东省', city: legacy.city || '', detail: legacy.detail || '',
      tag: '家', isDefault: true,
    });
  } else {
    /* 播种一条示例地址，方便直接体验“默认地址自动填充” */
    addrs.push({
      id: genAddrId(),
      name: '张潮', phone: '13800138000',
      prov: '广东省', city: '深圳市', detail: '南山区科技园南区·潮购体验中心 1 栋 8 楼',
      tag: '家', isDefault: true,
    });
  }
  set(LS.addrs, addrs);
}

function saveAddrs() { set(LS.addrs, addrs); }
function ensureDefault() {
  if (!addrs.length) return;
  if (!addrs.some(a => a.isDefault)) addrs[0].isDefault = true;
}
function getDefaultAddr() {
  if (!addrs || !addrs.length) return null;
  return addrs.find(a => a.isDefault) || addrs[0];
}
function getAddr(id) { return addrs.find(a => a.id === id) || null; }
function addAddr(obj) {
  const first = addrs.length === 0;
  const a = { id: genAddrId(), tag: '', ...obj, isDefault: first || !!obj.isDefault };
  if (a.isDefault) addrs.forEach(x => x.isDefault = false);
  addrs.push(a);
  ensureDefault();
  saveAddrs();
  return a;
}
function updateAddr(id, obj) {
  const a = getAddr(id);
  if (!a) return null;
  Object.assign(a, obj);
  if (obj.isDefault) addrs.forEach(x => { if (x !== a) x.isDefault = false; });
  ensureDefault();
  saveAddrs();
  return a;
}
function deleteAddr(id) {
  const wasDefault = getAddr(id)?.isDefault;
  addrs = addrs.filter(a => a.id !== id);
  if (wasDefault && addrs.length) addrs[0].isDefault = true;
  saveAddrs();
}
function setDefaultAddr(id) {
  addrs.forEach(a => a.isDefault = (a.id === id));
  saveAddrs();
}
function addrOneLine(a) {
  return [a.prov, a.city, a.detail].filter(Boolean).join(' ');
}

/* 客服状态（模块级，render 内会引用） */
let csPanelEl = null, csBodyEl = null, csQuickEl = null, csInputEl = null, csTab = 'pre', csGreeted = false;

/* ---------- 工具 ---------- */
const money = n => '¥' + Number(n).toLocaleString('zh-CN');
const salesText = n => n >= 10000 ? (n / 10000).toFixed(1) + '万' : n;
const stars = r => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const genOrderId = () => 'CG' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);
const itemPrice = i => (i.price ?? PRODUCT_MAP[i.id].price);

function showToast(msg) {
  const t = qs('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2200);
}

function updateCartCount() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  qs('#cartCount').textContent = n;
}

/* ---------- 优惠券逻辑 ---------- */
function couponApplies(c, items) {
  if (c.scope === 'all') return true;
  const cats = c.scope.split(',');
  return items.some(i => cats.includes(PRODUCT_MAP[i.id].cat));
}
function couponDiscount(c, subtotal) {
  if (c.type === '满减') return subtotal >= c.threshold ? c.amount : 0;
  if (c.threshold && subtotal < c.threshold) return 0;
  return Math.min(subtotal * (1 - c.rate), c.cap || Infinity);
}
function couponShort(c) {
  return c.type === '满减' ? '¥' + c.amount : (c.rate * 10).toFixed(1).replace(/\.0$/, '') + '折';
}
function scopeText(scope) {
  if (scope === 'all') return '全场通用';
  return scope.split(',').map(id => CAT_NAME[id] || id).join(' / ');
}

/* ---------- 秒杀倒计时（今日 23:59:59 结束） ---------- */
function getSeckillEnd() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}
let skTimer = null;
function startSkCountdown() {
  clearInterval(skTimer);
  tickSk();
  skTimer = setInterval(tickSk, 1000);
}
function tickSk() {
  const box = qs('#skCountdown');
  if (!box) return;
  let diff = Math.max(0, getSeckillEnd() - Date.now());
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  const pad = n => String(n).padStart(2, '0');
  box.querySelector('[data-cd=h]').textContent = pad(h);
  box.querySelector('[data-cd=m]').textContent = pad(m);
  box.querySelector('[data-cd=s]').textContent = pad(s);
}
function cdBoxes() {
  const pad = n => String(n).padStart(2, '0');
  let diff = Math.max(0, getSeckillEnd() - Date.now());
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  return `<span class="cd-box" data-cd="h">${pad(h)}</span><span class="cd-colon">:</span><span class="cd-box" data-cd="m">${pad(m)}</span><span class="cd-colon">:</span><span class="cd-box" data-cd="s">${pad(s)}</span>`;
}

/* =========================================================
   路由
   ========================================================= */
let currentRoute = 'home', currentParam = '';
function navigate(hash) { location.hash = hash; }

function parseHash() {
  const h = location.hash.slice(1) || '/home';
  const parts = h.split('/');
  currentRoute = parts[1] || 'home';
  currentParam = parts[2] || '';
}

/* 首页无限滚动 / 分类·搜索分页 状态 */
let homeShown = 0, homeObserver = null;
const HOME_PAGE_SIZE = 20;        // 首页“猜你喜欢”每批加载数量
let listPage = 1, currentList = [];
const LIST_PAGE_SIZE = 24;        // 分类/搜索页每页数量

/* =========================================================
   横幅轮播数据
   ========================================================= */
const BANNERS = [
  { title: '新机首发 · 影像旗舰', sub: 'iPhone 16 Pro Max / 小米 15 Ultra 现货开抢', tag: '至高省 ¥1000', img: 'img/banner_phone.png', cat: 'phone' },
  { title: '无人机狂欢节', sub: '大疆全系直降 · 航拍自由触手可及', tag: '限时疯抢', img: 'img/banner_drone.png', cat: 'drone' },
  { title: '奢侈品专区 · 专柜同款', sub: 'LV / Rolex / Chanel 虚拟体验', tag: '尊享包邮', img: 'img/banner_luxury.png', cat: 'luxury' },
];

/* 分类专题页标语（点击首页横幅/分类条进入） */
const CAT_HERO = {
  phone:   '新机首发 · 影像旗舰现货开抢',
  laptop:  '生产力全开 · 轻薄与性能兼得',
  drone:   '大疆全系直降 · 航拍自由触手可及',
  luxury:  '专柜同款 · 经典传世匠心臻藏',
  watch:   '腕间智能 · 健康与品味随行',
  game:    '声画沉浸 · 主机外设一站购齐',
  camera:  '定格此刻 · 专业影像随手拍',
  home:    '懒人福音 · 家电焕新家',
  beauty:  '悦己之美 · 大牌护肤彩妆',
  sport:   '燃动日常 · 装备轻装上阵',
  auto:    '出行伴侣 · 爱车升级清单',
  smart:   '全屋互联 · 智慧生活新主张',
  fashion: '潮流衣橱 · 当季穿搭灵感',
  baby:    '温柔呵护 · 母婴好物精选',
  food:    '舌尖享受 · 甄选美食酒水',
  jewelry: '璀璨点缀 · 珠宝配饰传情',
  toy:       '盲盒手办 · 治愈系潮玩精选',
  pet:       '智能养宠 · 毛孩子安心之选',
  furniture: '人体工学 · 家居美学兼得',
  music:     '声动生活 · 乐器随心奏',
};

/* =========================================================
   视图：首页
   ========================================================= */
function viewHome() {
  const catHTML = CATEGORIES.map(c =>
    `<div class="cat-chip" data-act="cat:${c.id}"><span class="ic">${c.icon}</span>${c.name}</div>`
  ).join('');

  const bannerHTML = BANNERS.map((b, i) => {
    const bg = b.img
      ? `linear-gradient(rgba(0,0,0,.42),rgba(0,0,0,.28)), url('${b.img}')`
      : 'linear-gradient(120deg,#4f8cff,#8a5cff)';
    const bgsize = b.img ? 'cover' : '';
    const bgpos = b.img ? 'center' : '';
    return `<div class="slide ${i === 0 ? 'on' : ''}" data-act="cat:${b.cat}" style="background:${bg};background-size:${bgsize};background-position:${bgpos};background-repeat:no-repeat">
       <div><h3>${b.title}</h3><p>${b.sub}</p><span class="tag">${b.tag}</span></div>
     </div>`;
  }).join('') + `<div class="dots">${BANNERS.map((_, i) => `<i class="${i === 0 ? 'on' : ''}" data-banner="${i}"></i>`).join('')}</div>`;

  const hot = [...PRODUCTS].sort((a, b) => b.sales - a.sales).slice(0, 10);
  const couponStrip = `
    <div class="coupon-strip" data-act="coupons">
      <div class="cs-title">🎟️ 领券中心</div>
      <div class="cs-coupons">
        ${COUPONS.slice(0, 3).map(c => `<div class="cs-coupon"><b>${couponShort(c)}</b><small>${c.desc}</small></div>`).join('')}
      </div>
      <div class="cs-more">更多优惠券 ›</div>
    </div>`;

  app.innerHTML = `
    <div class="wrap">
      <div class="banner" id="banner">${bannerHTML}</div>
      ${couponStrip}
      ${seckillSectionHTML()}
      <div class="section-title"><h2>🔥 热销榜单</h2><span class="more" data-act="cat:phone">查看全部 ›</span></div>
      <div class="grid">${hot.map(cardHTML).join('')}</div>
      <div class="section-title"><h2>🛍️ 猜你喜欢</h2><span class="more" data-act="cat:phone">更多好物 ›</span></div>
      <div class="grid" id="guessGrid">${PRODUCTS.slice(0, HOME_PAGE_SIZE).map(cardHTML).join('')}</div>
      <div class="load-more" id="guessSentinel">${PRODUCTS.length > HOME_PAGE_SIZE ? '下拉加载更多好物…' : '已经到底啦 ~'}</div>
    </div>`;
  homeShown = HOME_PAGE_SIZE;
  startBanner();
  startSkCountdown();
  setupHomeObserver();
}

/* 首页“猜你喜欢”无限滚动：用 IntersectionObserver 监视底部哨兵，进入视口再追加下一批 */
function setupHomeObserver() {
  if (homeObserver) { homeObserver.disconnect(); homeObserver = null; }
  const sentinel = qs('#guessSentinel');
  if (!sentinel || typeof IntersectionObserver === 'undefined') return;
  homeObserver = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) appendHomeGuess(); });
  }, { rootMargin: '400px 0px' });
  homeObserver.observe(sentinel);
}

function appendHomeGuess() {
  const grid = qs('#guessGrid');
  if (!grid) return;
  if (homeShown >= PRODUCTS.length) {
    const s = qs('#guessSentinel');
    if (s) { s.textContent = '已经到底啦 ~'; if (homeObserver) homeObserver.unobserve(s); }
    return;
  }
  const next = PRODUCTS.slice(homeShown, homeShown + HOME_PAGE_SIZE);
  grid.insertAdjacentHTML('beforeend', next.map(cardHTML).join(''));
  homeShown += next.length;
  const s = qs('#guessSentinel');
  if (s) {
    if (homeShown >= PRODUCTS.length) { s.textContent = '已经到底啦 ~'; if (homeObserver) homeObserver.unobserve(s); }
    else s.textContent = '下拉加载更多好物…';
  }
}

/* 秒杀区块（首页与秒杀页共用） */
function seckillSectionHTML() {
  const items = SECKILL.map(s => {
    const p = PRODUCT_MAP[s.id];
    const stock = p.seckillStock ?? s.stock;
    const sold = s.total - stock;
    const pct = Math.max(0, Math.min(100, Math.round(sold / s.total * 100)));
    const soldOut = stock <= 0;
    return `<div class="sk-item" data-act="product:${p.id}">
      <div class="sk-thumb"><img src="${p.img}" alt="${esc(p.title)}" loading="lazy" /></div>
      <div class="sk-name">${esc(p.title)}</div>
      <div class="sk-price"><span class="now"><small>¥</small>${p.seckill.toLocaleString()}</span><span class="was">¥${p.old.toLocaleString()}</span></div>
      <div class="sk-bar"><i style="width:${pct}%"></i></div>
      <div class="sk-bar-txt"><span>已抢 ${pct}%</span><span>剩 ${stock}</span></div>
      <div class="sk-btn ${soldOut ? 'sk-sold-out' : ''}" data-act="seckill:${p.id}">${soldOut ? '已抢光' : '马上抢'}</div>
    </div>`;
  }).join('');

  return `<section class="seckill">
    <div class="seckill-head">
      <div class="sk-title"><span class="bolt">⚡</span>限时秒杀</div>
      <div class="sk-sub">每日 0 点上新 · 抢完即止</div>
      <div class="sk-countdown" id="skCountdown">${cdBoxes()}</div>
    </div>
    <div class="seckill-body">
      <div class="sk-scroll">${items}</div>
    </div>
  </section>`;
}

/* =========================================================
   视图：限时秒杀（独立页）
   ========================================================= */
function viewSeckill() {
  app.innerHTML = `
    <div class="wrap">
      ${seckillSectionHTML()}
      <div class="section-title"><h2>💡 秒杀说明</h2></div>
      <div class="form-card" style="color:var(--ink-2);font-size:14px;line-height:1.9">
        秒杀商品为虚拟仿真价格，点击「马上抢」即以下单方形式进入结算（不会真实扣款）。库存与抢购进度均为演示数据，刷新后重置。
      </div>
    </div>`;
  startSkCountdown();
}

/* =========================================================
   视图：领券中心
   ========================================================= */
function viewCoupons() {
  const html = COUPONS.map(c => {
    const claimed = claimedCoupons.includes(c.id);
    const amt = c.type === '满减'
      ? `<div class="c-amt"><small>¥</small>${c.amount}</div><div class="c-cond">满${c.threshold}元可用</div>`
      : `<div class="c-amt">${(c.rate * 10).toFixed(1).replace(/\.0$/, '')}<small>折</small></div><div class="c-cond">${c.threshold ? '满' + c.threshold + '元' : '无门槛'}</div>`;
    return `<div class="coupon ${c.type === '折扣' ? 'discount' : ''}">
      <div class="c-left">${amt}</div>
      <div class="c-right">
        <div class="c-title">${c.title}</div>
        <div class="c-desc">${c.desc}</div>
        <div class="c-scope">适用范围：${scopeText(c.scope)}</div>
        <button class="c-btn ${claimed ? 'claimed' : ''}" data-act="claim:${c.id}">${claimed ? '已领取' : '立即领取'}</button>
      </div>
    </div>`;
  }).join('');

  app.innerHTML = `<div class="wrap">
    <div class="section-title"><h2>🎟️ 领券中心</h2><span class="more" data-act="home">返回首页 ›</span></div>
    <div class="coupon-grid">${html}</div>
    <div style="text-align:center;color:var(--sub);font-size:13px;margin-top:20px">已领取 ${claimedCoupons.length} / ${COUPONS.length} 张 · 结算时自动抵扣</div>
  </div>`;
}

/* =========================================================
   视图：常用地址管理
   ========================================================= */
const PROVINCES = ['北京市', '上海市', '天津市', '重庆市', '广东省', '浙江省', '江苏省', '四川省', '湖北省', '湖南省', '河南省', '河北省', '山东省', '山西省', '陕西省', '福建省', '安徽省', '江西省', '辽宁省', '云南省', '广西壮族自治区', '贵州省', '海南省', '甘肃省'];
const ADDR_TAGS = ['家', '公司', '学校', '父母家', '其他'];

function viewAddress() {
  const list = addrs.length
    ? addrs.slice().sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)).map(addrCardHTML).join('')
    : `<div class="empty" style="padding:44px 0"><div class="big">📍</div>还没有收货地址，添加一个吧～</div>`;
  app.innerHTML = `<div class="wrap">
    <div class="section-title"><h2>📍 常用地址管理</h2><span class="more" data-act="home">返回首页 ›</span></div>
    <div class="addr-tip">💡 设为默认的地址会在下单结算时自动填好，省去每次重复输入～</div>
    <div class="addr-list">${list}</div>
    <button class="btn addr-add-btn" data-act="addrnew">＋ 新增收货地址</button>
  </div>`;
}

function addrCardHTML(a) {
  return `<div class="addr-card ${a.isDefault ? 'is-default' : ''}">
    <div class="ac-main">
      <div class="ac-line1">
        <span class="ac-name">${esc(a.name)}</span>
        <span class="ac-phone">${esc(maskPhone(a.phone))}</span>
        ${a.isDefault ? '<span class="ac-badge">默认</span>' : ''}
        ${a.tag ? `<span class="ac-tag">${esc(a.tag)}</span>` : ''}
      </div>
      <div class="ac-line2">${esc(addrOneLine(a))}</div>
    </div>
    <div class="ac-ops">
      ${a.isDefault ? '<span class="ac-op is-on">✓ 默认地址</span>' : `<span class="ac-op" data-act="setdefault:${a.id}">设为默认</span>`}
      <span class="ac-op" data-act="addredit:${a.id}">✎ 编辑</span>
      <span class="ac-op ac-del" data-act="addrdel:${a.id}">🗑 删除</span>
    </div>
  </div>`;
}

function maskPhone(p) {
  p = String(p || '');
  return p.length === 11 ? p.slice(0, 3) + '****' + p.slice(7) : p;
}

/* 视图：新增 / 编辑地址表单 */
function viewAddrEdit() {
  const editing = currentParam ? getAddr(currentParam) : null;
  const a = editing || { name: '', phone: '', prov: '广东省', city: '', detail: '', tag: '家', isDefault: addrs.length === 0 };
  app.innerHTML = `<div class="wrap">
    <div class="section-title"><h2>${editing ? '✎ 编辑地址' : '＋ 新增地址'}</h2><span class="more" data-act="address">返回地址簿 ›</span></div>
    <div class="form-card">
      <div class="field"><label>收货人姓名</label><input id="a_name" value="${esc(a.name)}" placeholder="请输入姓名" /></div>
      <div class="field"><label>手机号码</label><input id="a_phone" value="${esc(a.phone)}" placeholder="11位手机号" maxlength="11" /></div>
      <div class="field"><label>所在省份</label>
        <select id="a_prov">${PROVINCES.map(p => `<option ${a.prov === p ? 'selected' : ''}>${p}</option>`).join('')}</select>
      </div>
      <div class="field"><label>城市</label><input id="a_city" value="${esc(a.city)}" placeholder="如：深圳市" /></div>
      <div class="field"><label>详细地址</label><textarea id="a_detail" rows="2" placeholder="街道、小区、门牌号">${esc(a.detail)}</textarea></div>
      <div class="field"><label>地址标签</label>
        <div class="tag-pick" id="a_tagpick">
          ${ADDR_TAGS.map(t => `<button class="${a.tag === t ? 'on' : ''}" data-tag="${t}">${t}</button>`).join('')}
        </div>
      </div>
      <label class="addr-default-toggle"><input type="checkbox" id="a_default" ${a.isDefault ? 'checked' : ''} ${addrs.length === 0 ? 'disabled' : ''} /> 设为默认地址${addrs.length === 0 ? '（首个地址默认）' : ''}</label>
    </div>
    <div class="cart-foot">
      <button class="btn btn-ghost" data-act="address">取消</button>
      <button class="btn btn-buy" data-act="saveaddr:${editing ? editing.id : 'new'}">保存地址</button>
    </div>
  </div>`;
}

function saveAddrFromForm(id) {
  const name = qs('#a_name').value.trim();
  const phone = qs('#a_phone').value.trim();
  const prov = qs('#a_prov').value;
  const city = qs('#a_city').value.trim();
  const detail = qs('#a_detail').value.trim();
  const tag = qs('#a_tagpick .on') ? qs('#a_tagpick .on').dataset.tag : '';
  const isDefault = qs('#a_default').checked;
  if (!name || !/^1\d{10}$/.test(phone) || !city || !detail) {
    showToast('请完整填写姓名、正确手机号、城市与详细地址');
    return;
  }
  const payload = { name, phone, prov, city, detail, tag, isDefault };
  if (id && id !== 'new') updateAddr(id, payload);
  else addAddr(payload);
  showToast('✅ 地址已保存');
  navigate('#/address');
}

/* =========================================================
   视图：分类 / 搜索
   ========================================================= */
function viewList() {
  let list, title, c = null;
  if (currentRoute === 'search') {
    const q = lastSearch;
    list = PRODUCTS.filter(p => (p.title + p.name + p.brand + p.catName + p.sku).toLowerCase().includes(q.toLowerCase()));
    title = `“${esc(q)}” 的搜索结果（${list.length}）`;
  } else {
    list = PRODUCTS.filter(p => p.cat === currentParam);
    c = CATEGORIES.find(x => x.id === currentParam);
    title = c ? `${c.icon} ${c.name}` : '全部商品';
  }
  const heroImg = c ? `img/banner_${c.id}.png` : '';
  const heroSub = c ? (CAT_HERO[c.id] || `精选${c.name}好物，正品保障 · 顺丰包邮`) : '为你找到以下好物';
  const heroBG = heroImg
    ? `linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.35)), url('${heroImg}')`
    : 'linear-gradient(120deg,#4f8cff,#8a5cff)';
  const heroHTML = `
    <div class="cat-hero" style="background:${heroBG};background-size:cover;background-position:center">
      <div class="ch-ic">${c ? c.icon : '🔍'}</div>
      <div class="ch-title">${esc(title)}</div>
      <div class="ch-sub">${esc(heroSub)}</div>
      <div class="ch-count">共 ${list.length} 件好物</div>
    </div>`;
  app.innerHTML = `
    <div class="wrap">
      ${heroHTML}
      <div class="section-title"><h2>${title}</h2></div>
      <div id="listGrid"></div>
      <div id="listPager"></div>
    </div>`;
  currentList = list;
  renderListGrid(list);
}

/* 分类/搜索列表：分页渲染（默认每页 LIST_PAGE_SIZE 件，避免一次性渲染过多） */
function renderListGrid(list) {
  const grid = qs('#listGrid'); if (!grid) return;
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE));
  if (listPage > pages) listPage = pages;
  const start = (listPage - 1) * LIST_PAGE_SIZE;
  const slice = list.slice(start, start + LIST_PAGE_SIZE);
  grid.innerHTML = slice.length
    ? `<div class="grid">${slice.map(cardHTML).join('')}</div>`
    : `<div class="empty"><div class="big">🔍</div>没有找到相关商品，换个关键词试试～</div>`;
  renderListPager(list);
}

function renderListPager(list) {
  const pager = qs('#listPager'); if (!pager) return;
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / LIST_PAGE_SIZE));
  if (pages <= 1) { pager.innerHTML = ''; return; }
  const win = pagerWindow(listPage, pages);
  const btns = [];
  btns.push(`<button class="pg ${listPage === 1 ? 'dis' : ''}" ${listPage === 1 ? 'disabled' : ''} data-act="page:${listPage - 1}">‹ 上一页</button>`);
  if (win[0] > 1) {
    btns.push(`<button class="pg" data-act="page:1">1</button>`);
    if (win[0] > 2) btns.push(`<span class="pg-dots">…</span>`);
  }
  win.forEach(p => btns.push(`<button class="pg ${p === listPage ? 'on' : ''}" data-act="page:${p}">${p}</button>`));
  if (win[win.length - 1] < pages) {
    if (win[win.length - 1] < pages - 1) btns.push(`<span class="pg-dots">…</span>`);
    btns.push(`<button class="pg" data-act="page:${pages}">${pages}</button>`);
  }
  btns.push(`<button class="pg ${listPage === pages ? 'dis' : ''}" ${listPage === pages ? 'disabled' : ''} data-act="page:${listPage + 1}">下一页 ›</button>`);
  pager.innerHTML = `<div class="pager">${btns.join('')}<span class="pg-info">第 ${listPage}/${pages} 页 · 共 ${total} 件</span></div>`;
}

function pagerWindow(cur, pages) {
  const span = 2;
  let s = Math.max(1, cur - span), e = Math.min(pages, cur + span);
  const need = span * 2 - (e - s);
  if (need > 0) {
    if (s === 1) e = Math.min(pages, e + need);
    else if (e === pages) s = Math.max(1, s - need);
  }
  const out = []; for (let i = s; i <= e; i++) out.push(i); return out;
}

/* =========================================================
   商品卡片（真实商品图）
   ========================================================= */
function cardHTML(p) {
  const isSk = !!p.seckill;
  const price = isSk ? p.seckill : p.price;
  return `<div class="card" data-act="product:${p.id}">
    <div class="thumb">
      <img src="${p.img}" alt="${esc(p.title)}" loading="lazy" />
      <span class="cat-badge">${p.catName}</span>
      ${isSk ? '<span class="seckill-flag">秒杀</span>' : ''}
    </div>
    <div class="body">
      <div class="pname">${esc(p.title)}</div>
      <div class="brand">${esc(p.brand)} · ${esc(p.sku)}</div>
      <div class="price-row">
        <span class="price"><small>¥</small>${price.toLocaleString()}</span>
        <span class="old">¥${p.old.toLocaleString()}</span>
      </div>
      <div class="meta">
        <span class="stars">${stars(p.rating)} <b>${p.rating}</b></span>
        <span>已售 ${salesText(p.sales)}</span>
      </div>
    </div>
  </div>`;
}

/* =========================================================
   商品介绍 · 高端图文长图（海报风）
   ========================================================= */
const INTRO_KIT = {
  phone:   { slogan: '影像旗舰 · 一手掌握未来', en: 'FLAGSHIP VISION', design: '一体化金属中框，纳米级喷砂工艺，握持温润顺滑，颜值与手感兼得。', feats: [
    { i: '📸', t: '旗舰级影像', d: '大底主摄多焦段，暗光也纯净通透' },
    { i: '⚡', t: '性能狂飙', d: '旗舰芯片加持，大作满帧不掉链' },
    { i: '🔋', t: '超长续航', d: '大电池 + 超级快充，告别电量焦虑' },
    { i: '🖥️', t: '臻彩护眼屏', d: '高刷高亮，久看不累更跟手' } ] },
  laptop:  { slogan: '轻薄之下 · 澎湃生产力', en: 'PRO PERFORMANCE', design: 'CNC 一体成型金属机身，纤薄却坚固，商务与创作场景通吃。', feats: [
    { i: '🚀', t: '标压强芯', d: '多核释放，剪辑渲染一气呵成' },
    { i: '🎨', t: '高色域屏', d: '出厂校色，创作所见即所得' },
    { i: '🔌', t: '疾速快充', d: '一杯咖啡回血，移动办公无忧' },
    { i: '🪶', t: '轻薄随行', d: '轻至随手拎起，通勤零负担' } ] },
  drone:   { slogan: '起飞即成片 · 天空视角', en: 'AERIAL MASTER', design: '折叠式流线机身，专业云台稳如磐石，收纳即走随时起飞。', feats: [
    { i: '🎥', t: '专业影像', d: '三轴云台 + 大底相机，稳而清晰' },
    { i: '🛰️', t: '高清图传', d: '10km 级图传，画面实时不卡顿' },
    { i: '🛡️', t: '全向避障', d: '智能感知环境，新手也安心' },
    { i: '🎬', t: '一键大片', d: '智能航线，轻松产出电影感' } ] },
  luxury:  { slogan: '经典传世 · 匠心臻藏', en: 'TIMELESS CRAFT', design: '甄选顶级皮革与五金，专柜同源工艺，每一处缝线都经得起端详。', feats: [
    { i: '👜', t: '专柜品质', d: '原厂工艺，质感细腻温润' },
    { i: '✨', t: '经典设计', d: '历久弥新，百搭不过时' },
    { i: '🎁', t: '体面之选', d: '礼盒包装，送礼自用皆宜' },
    { i: '🔒', t: '正品保障', d: '假一赔十，安心之选' } ] },
  watch:   { slogan: '腕间格调 · 分秒精准', en: 'PRECISION TIME', design: '精钢表壳搭配蓝宝石镜面，抛光拉丝相映，佩戴质感一触即知。', feats: [
    { i: '⌚', t: '精准机芯', d: '走时稳定，分秒之间尽显考究' },
    { i: '❤️', t: '健康监测', d: '心率睡眠随身记录' },
    { i: '💧', t: '日常防水', d: '生活防护，佩戴无拘束' },
    { i: '🔋', t: '长效续航', d: '一次满电，多日无忧' } ] },
  game:    { slogan: '沉浸音画 · 决胜毫秒', en: 'IMMERSIVE PLAY', design: '人体工学握感设计，低延迟无线与高刷体验，畅玩不将就。', feats: [
    { i: '🎧', t: '沉浸音画', d: '空间音效，临场感拉满' },
    { i: '🎮', t: '低延迟', d: '毫秒响应，操作即刻反馈' },
    { i: '💡', t: '高刷体验', d: '画面顺滑，久玩不累' },
    { i: '🔧', t: '发烧配置', d: '进阶随心，玩家之选' } ] },
  camera:  { slogan: '定格光影 · 出片即高光', en: 'CAPTURE LIGHT', design: '轻量化机身握持稳定，快速对焦与强效防抖，随手皆是大片。', feats: [
    { i: '📷', t: '高像素传感', d: '细节丰富，放大依旧锐利' },
    { i: '🎯', t: '疾速对焦', d: '抓拍不糊，瞬间即定格' },
    { i: '🌀', t: '强效防抖', d: '手持稳拍，暗光也从容' },
    { i: '🎨', t: '直出好色', d: '色彩讨喜，无需后期' } ] },
  home:    { slogan: '静享品质 · 智享生活', en: 'SMART LIVING', design: '简约质感外观，静音节能内核，让居家每一天都更省心。', feats: [
    { i: '🔇', t: '静音运行', d: '低噪设计，安睡不打扰' },
    { i: '🌱', t: '节能省电', d: '智能调控，省心又省钱' },
    { i: '📱', t: '智能操控', d: 'App 远程，一键搞定' },
    { i: '🧼', t: '轻松打理', d: '易清洁设计，用着安心' } ] },
  beauty:  { slogan: '焕活肌肤 · 由内而外', en: 'GLOW UP', design: '核心成分高浓度加持，质地细腻易吸收，温和亲肤不刺激。', feats: [
    { i: '💧', t: '水润透亮', d: '深层滋养，肌肤自然发光' },
    { i: '🌿', t: '温和配方', d: '敏感肌也能安心使用' },
    { i: '⏳', t: '持久滋润', d: '长效锁水，不易紧绷' },
    { i: '🏅', t: '口碑之选', d: '高回购率，实力见证' } ] },
  sport:   { slogan: '突破自我 · 尽情驰骋', en: 'PUSH LIMITS', design: '专业运动结构，透气排汗与稳定支撑兼备，陪你挑战每一次极限。', feats: [
    { i: '🏃', t: '专业支撑', d: '稳定包裹，运动更安心' },
    { i: '💨', t: '透气排汗', d: '干爽体验，久动不闷' },
    { i: '🦶', t: '舒适脚感', d: '缓震回弹，落地更轻盈' },
    { i: '🏔️', t: '全场景', d: '训练户外，一双搞定' } ] },
  auto:    { slogan: '爱车必备 · 出行无忧', en: 'DRIVE SAFE', design: '原车适配精准，安装便捷免改装，稳定可靠提升每段旅程。', feats: [
    { i: '🚗', t: '原车适配', d: '即插即用，安装省心' },
    { i: '🛡️', t: '安全护航', d: '稳定可靠，行车更安心' },
    { i: '🔧', t: '便捷安装', d: '免改装，上手无门槛' },
    { i: '✅', t: '实用耐用', d: '经久耐用，值得信赖' } ] },
  smart:   { slogan: '全屋智能 · 一句话搞定', en: 'AI HOME', design: '灵敏稳定的智能内核，语音与 App 双控，让科技悄然融入生活。', feats: [
    { i: '🗣️', t: '语音控制', d: '动口不动手，灵敏响应' },
    { i: '🔗', t: '全屋联动', d: '设备互联，场景自动化' },
    { i: '📶', t: '稳定连接', d: '信号稳健，不掉线' },
    { i: '🔒', t: '安全省心', d: '隐私守护，用得放心' } ] },
  fashion: { slogan: '不费力的高级感', en: 'EFFORTLESS CHIC', design: '甄选优质面料与考究版型，保暖透气兼具，通勤出街轻松驾驭。', feats: [
    { i: '🧥', t: '优质面料', d: '亲肤舒适，质感在线' },
    { i: '📐', t: '考究版型', d: '修饰身形，穿着显气质' },
    { i: '🌡️', t: '保暖透气', d: '四季适穿，冷暖自如' },
    { i: '👗', t: '百搭耐看', d: '不挑人，怎么搭都对' } ] },
  baby:    { slogan: '温柔呵护 · 陪伴成长', en: 'GENTLE CARE', design: '食品级安全材质，圆润无棱角设计，每一处细节都为宝宝着想。', feats: [
    { i: '🍼', t: '安全材质', d: '食品级用料，贴身也放心' },
    { i: '🧸', t: '贴心设计', d: '细节圆润，呵护娇嫩肌肤' },
    { i: '🪶', t: '轻便好用', d: '带娃出行，省力不狼狈' },
    { i: '💛', t: '爸妈之选', d: '口碑之选，新手也安心' } ] },
  food:    { slogan: '醇香入味 · 佳节相宜', en: 'FINE TASTE', design: '优选原料层层把关，口感醇厚酥香，礼盒体面自饮送礼两相宜。', feats: [
    { i: '🍫', t: '醇厚口感', d: '入口即化，回味悠长' },
    { i: '🌾', t: '优选原料', d: '严选把关，品质看得见' },
    { i: '🎁', t: '体面礼盒', d: '包装精致，送礼有面子' },
    { i: '✅', t: '正品保障', d: '安心之选，吃得放心' } ] },
  jewelry: { slogan: '璀璨火彩 · 心意闪耀', en: 'BRILLIANT SHINE', design: '精工镶嵌牢固稳妥，切工火彩璀璨夺目，经典款式百搭耐看。', feats: [
    { i: '💎', t: '璀璨火彩', d: '切工考究，光芒动人' },
    { i: '🔩', t: '精工镶嵌', d: '牢固稳妥，佩戴安心' },
    { i: '💍', t: '经典百搭', d: '耐看不过时，怎么戴都美' },
    { i: '🎀', t: '高级包装', d: '仪式感满满，表达心意' } ] },
  toy: { slogan: '潮玩甄选 · 童心未泯', en: 'TOY & COLLECTIBLE', design: '一方小小的潮玩，藏着大大的快乐。我们精选做工细腻、造型讨喜的盲盒与手办，让收藏与把玩都成为日常的小确幸。', feats: [
    { i: '🎁', t: '惊喜盲盒', d: '开盒未知，乐趣加倍' },
    { i: '🧸', t: '精致做工', d: '细节满分，手感细腻' },
    { i: '🏆', t: '正版授权', d: '收藏保值，送礼体面' },
    { i: '✨', t: '桌面治愈', d: '装点生活，会心一笑' } ] },
  pet: { slogan: '智能养宠 · 安心之选', en: 'SMART PET', design: '再忙也要好好爱它。我们甄选智能静音、APP 可控的养宠好物，让喂食、清洁、陪伴都轻松省心，主子舒服你安心。', feats: [
    { i: '🐾', t: '智能省心', d: 'APP 远程，一目了然' },
    { i: '🔇', t: '静音设计', d: '不打扰，人宠安睡' },
    { i: '🛡️', t: '安全材质', d: '食品级，宠爱无忧' },
    { i: '💡', t: '贴心细节', d: '人宠共处，更从容' } ] },
  furniture: { slogan: '家居美学 · 松弛有度', en: 'HOME & LIVING', design: '家是充电的地方。我们挑选兼顾人体工学与美学的家具家装，让每一次落座与休憩，都成为温柔的治愈时刻。', feats: [
    { i: '🪑', t: '人体工学', d: '久坐不累，呵护脊背' },
    { i: '👁️', t: '护眼柔光', d: '无频闪，舒适阅读' },
    { i: '🌿', t: '环保用材', d: '安心入住，无负担' },
    { i: '🏡', t: '美学设计', d: '融入家居，提升格调' } ] },
  music: { slogan: '声动生活 · 随心而奏', en: 'MUSIC & SOUND', design: '音乐让日子有了旋律。我们甄选音色通透、做工扎实的乐器，从入门到进阶都有合适之选，让每一个想弹想唱的瞬间都被满足。', feats: [
    { i: '🎵', t: '音色出众', d: '温暖通透，富有质感' },
    { i: '🎸', t: '扎实做工', d: '选材考究，经久耐用' },
    { i: '🎯', t: '上手友好', d: '入门进阶，皆相宜' },
    { i: '✨', t: '便携随行', d: '随处开奏，灵感不停' } ] },
};
const INTRO_DEFAULT = { slogan: '官方臻选 · 品质之选', en: 'OFFICIAL SELECTION', design: '精工品质，用心之作，为你的每一次选择保驾护航。', feats: [
  { i: '🏅', t: '官方正品', d: '正品保障，假一赔十' },
  { i: '🚚', t: '顺丰包邮', d: '极速发货，快人一步' },
  { i: '🛡️', t: '全国联保', d: '售后无忧，安心购买' },
  { i: '↩️', t: '无理由退', d: '7 天无理由，购物无压力' } ] };

/* 规格 key → 图标：用于介绍长图「核心亮点」按商品真实参数生成 */
const SPEC_ICON = {
  屏幕: '🖥️', 处理器: '⚡', 芯片: '⚡', 存储: '💾', 内存: '💾', 电池: '🔋', 续航: '🔋',
  影像系统: '📷', 像素: '📷', 摄像头: '📷', 传感器: '🎯', 镜头: '🔭', 图传距离: '📡',
  避障: '🛡️', 重量: '⚖️', 材质: '✨', 机芯: '⚙️', 表盘: '⌚', 健康监测: '❤️', 防水: '💧',
  功率: '🌪️', 吸力: '🌪️', 容量: '📦', 能效: '🌿', 肤质: '🌸', 款式: '👜', 主石: '💎',
  联动: '🏠', 控制: '🎙️', 类型: '🎮', 连接: '🔗', 视频: '🎬', 防抖: '📹', 系统: '🧩',
  网络: '📶', 特性: '✨', 配件: '🎁', 尺寸: '📐'
};
/* 亮点挑选优先级：越靠前越像“卖点”，从商品真实 specs 按此顺序取前 3 条做核心亮点 */
const FEAT_PRIORITY = ['影像系统', '像素', '摄像头', '图传距离', '处理器', '芯片', '屏幕', '电池', '续航', '材质', '五金', '机芯', '健康监测', '避障', '功率', '吸力', '内存', '存储', '联动', '主石', '款式', '类型', '重量', '能效', '特性', '连接', '视频', '防抖', '传感器', '镜头'];

function introPosterHTML(p) {
  const kit = INTRO_KIT[p.cat] || INTRO_DEFAULT;
  const g = p.gallery || [p.img];
  const main = g[0];
  const splitImg = g[1] || main;
  const statImg = g[2] || splitImg;
  const specs = p.specs || {};
  const skip = new Set(['品牌', '型号', '产地', '保修', '配件']);
  /* 核心亮点：首条用商品独有卖点(sku)，其余从真实参数按卖点优先级补，不足再用品类模板兜底 */
  const feats = [];
  if (p.sku && String(p.sku).trim()) feats.push({ i: '🏷️', t: '核心卖点', d: String(p.sku) });
  for (const k of FEAT_PRIORITY) {
    if (feats.length >= 4) break;
    if (skip.has(k)) continue;
    const v = specs[k];
    if (v == null || !String(v).trim()) continue;
    if (p.sku && String(v).trim() === String(p.sku).trim()) continue; // 避免与“核心卖点(sku)”重复
    feats.push({ i: SPEC_ICON[k] || '⭐', t: k, d: String(v) });
  }
  while (feats.length < 4 && kit.feats[feats.length]) feats.push(kit.feats[feats.length]);
  /* 数据墙：取未被亮点用掉的真实参数（前 4 条） */
  const usedKeys = new Set(feats.map(f => f.t));
  const stats = Object.entries(specs).filter(([k, v]) => !skip.has(k) && !usedKeys.has(k) && String(v).trim()).slice(0, 4);
  /* 设计文案：品类工艺基调 + 本品真实规格，于细节见真章 */
  const specPts = Object.entries(specs).filter(([k]) => !skip.has(k)).slice(0, 2).map(([k, v]) => `${k}${v}`);
  const designBody = kit.design + (specPts.length ? ` 具体到本品，${specPts.join('、')}，于细微处见真章。` : '');
  const catName = p.catName || p.cat;
  return `
  <div class="intro-poster">
    <section class="ip-hero ip-use-main" style="background-image:url('${main}')">
      <div class="ip-hero-mask"></div>
      <div class="ip-hero-inner">
        <span class="ip-kicker">${esc(p.brand)} · OFFICIAL</span>
        <h2 class="ip-hero-title">${esc(p.name)}</h2>
        <div class="ip-hero-sub">${esc(p.sku)}</div>
        <div class="ip-hero-en">${kit.en}</div>
      </div>
      <span class="ip-hero-badge">官方正品 · 品质臻选</span>
    </section>

    <section class="ip-split">
      <div class="ip-split-txt">
        <span class="ip-eyebrow">DESIGN · ${esc(p.brand)}</span>
        <h3>细节，成就 ${esc(catName)} 的高级感</h3>
        <p>${esc(designBody)}</p>
        <p class="ip-split-desc">${esc(p.intro)}</p>
      </div>
      <div class="ip-split-img ip-use-main" style="background-image:url('${splitImg}')"></div>
    </section>

    <section class="ip-feats">
      <div class="ip-sec-title"><span>核心亮点</span><i>KEY&nbsp;FEATURES</i></div>
      <div class="ip-feat-grid">
        ${feats.map(f => `<div class="ip-feat"><div class="ip-feat-ic">${f.i}</div><div class="ip-feat-t">${esc(f.t)}</div><div class="ip-feat-d">${esc(f.d)}</div></div>`).join('')}
      </div>
    </section>

    ${stats.length ? `<section class="ip-stats ip-use-main" style="background-image:url('${statImg}')">
      <div class="ip-stats-mask"></div>
      <div class="ip-stats-inner">
        <div class="ip-stats-title">硬核参数 · 一目了然</div>
        <div class="ip-stats-row">
          ${stats.map(([k, v]) => `<div class="ip-stat"><div class="ip-stat-v">${esc(String(v))}</div><div class="ip-stat-k">${esc(k)}</div></div>`).join('')}
        </div>
      </div>
    </section>` : ''}

    <section class="ip-sec-title"><span>商品实拍</span><i>REAL SHOTS</i></section>
    <section class="ip-scenes">
      ${g.slice(1, 3).map((src, i) => `<figure class="ip-scene"><img src="${src}" alt="${esc(p.name)} 实拍图${i + 1}" loading="lazy" /></figure>`).join('')}
      ${g.length < 2 ? `<figure class="ip-scene"><img src="${main}" alt="${esc(p.name)} 实拍图" loading="lazy" /></figure>` : ''}
    </section>

    <section class="ip-assure">
      ${[['官方正品', '假一赔十'], ['顺丰包邮', '极速发货'], ['全国联保', '无忧售后'], ['7 天无理由', '退换无忧']].map(([a, b]) => `<div class="ip-assure-item"><div class="ip-assure-ic">✓</div><div><div class="ip-assure-a">${a}</div><div class="ip-assure-b">${b}</div></div></div>`).join('')}
    </section>

    <p class="ip-foot-tip">※ 以上图片均为 ${esc(p.name)} 官方示意图，具体以实物为准。</p>
  </div>`;
}

/* =========================================================
   规格变体价格工具
   ========================================================= */
function productEff(p, v, field) {
  if (p.seckill != null) {
    const ratio = p.seckill / p.price;
    return Math.round(v[field] * ratio);
  }
  return v[field];
}
function selectedVariant(p) {
  const vs = p.variants || [{ name: p.sku, price: p.price, old: p.old }];
  const onBtn = qs('#specPick .on');
  const nm = onBtn ? onBtn.dataset.spec : (vs.find(v => v.def) || vs[0]).name;
  return vs.find(v => v.name === nm) || vs[0];
}
function selectedColor(p) {
  const ax = p.specAxes;
  if (!ax || !ax[1]) return null;
  const on = qs('#specPick2 .on');
  return on ? on.dataset.spec2 : ax[1].opts[0];
}
function updateProductPrice() {
  const p = PRODUCT_MAP[currentParam];
  if (!p) return;
  const v = selectedVariant(p);
  const nowEl = qs('#dPriceNow'), oldEl = qs('#dPriceOld'), offEl = qs('#dPriceOff');
  if (nowEl) nowEl.innerHTML = `<small>¥</small>${productEff(p, v, 'price').toLocaleString()}`;
  if (oldEl) oldEl.textContent = '¥' + productEff(p, v, 'old').toLocaleString();
  if (offEl) {
    const save = productEff(p, v, 'old') - productEff(p, v, 'price');
    offEl.textContent = (p.seckill != null ? '⚡秒杀价 立减¥' : '省¥') + save.toLocaleString();
  }
}

/* =========================================================
   视图：商品详情
   ========================================================= */
function viewProduct() {
  const p = PRODUCT_MAP[currentParam];
  if (!p) { app.innerHTML = `<div class="empty"><div class="big">😢</div>商品不存在</div>`; return; }
  const revs = p.reviews;
  const avg = (revs.reduce((s, r) => s + r.rating, 0) / revs.length).toFixed(1);
  const dist = [5, 4, 3, 2, 1].map(star => {
    const c = revs.filter(r => r.rating === star).length;
    const pct = Math.round(c / revs.length * 100);
    return `<div class="rb">${star}星 <div class="track"><div class="fill" style="width:${pct}%"></div></div> ${pct}%</div>`;
  }).join('');

  const showSk = !!p.seckill;
  /* 规格变体：不同配置/版本对应不同价格（写实） */
  const variants = p.variants || [{ name: p.sku, price: p.price, old: p.old }];
  const defIdx = Math.max(0, variants.findIndex(v => v.def));
  const v0 = variants[defIdx];
  const effNow = v => productEff(p, v, 'price');
  const effOld = v => productEff(p, v, 'old');
  const nowPrice = effNow(v0);
  const save = effOld(v0) - nowPrice;

  /* 画廊：官方图集（所有图片均为本商品官方图） */
  const gallery = p.gallery || [p.img];
  const mainImg = gallery[0];
  const galleryHTML = `
    <div class="gallery">
      <div class="gallery-main"><img id="galleryMain" src="${mainImg}" alt="${esc(p.title)}" /></div>
      <div class="gallery-thumbs">
        ${gallery.map((g, idx) => `<div class="gthumb ${idx === 0 ? 'on' : ''}" data-gimg="${g}"><img src="${g}" alt="商品图${idx + 1}" loading="lazy" /></div>`).join('')}
      </div>
    </div>`;

  /* 商品详情 Tab：介绍 / 参数 / 营销实拍 */
  const prodDetailHTML = `
    <div class="prod-detail">
      <div class="pd-nav">
        <button class="on" data-pdtab="intro">商品介绍</button>
        <button data-pdtab="params">商品参数</button>
        <button data-pdtab="pics">商品图片</button>
      </div>
      <div class="pd-panel" data-pdpanel="intro">
        ${introPosterHTML(p)}
      </div>
      <div class="pd-panel" data-pdpanel="params" hidden>
        <table class="spec-table">
          ${Object.entries(p.specs).map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}
        </table>
      </div>
      <div class="pd-panel" data-pdpanel="pics" hidden>
        <div class="marketing-pics">
          ${gallery.map(g => `<img src="${g}" alt="${esc(p.name)} 官方图" loading="lazy" />`).join('')}
        </div>
        <p class="pics-tip">※ 以上为 ${esc(p.name)} 官方示意图，商品颜色/配置以实物为准。</p>
      </div>
    </div>`;

  app.innerHTML = `
    <div class="wrap">
      <div class="detail">
        ${galleryHTML}
        <div>
          <div class="d-name">${esc(p.title)}</div>
          <div class="d-sub">${esc(p.brand)} · ${esc(p.sku)}</div>
          <div class="d-price">
            <span class="now" id="dPriceNow"><small>¥</small>${nowPrice.toLocaleString()}</span>
            <span class="old" id="dPriceOld">¥${effOld(v0).toLocaleString()}</span>
            <span class="off" id="dPriceOff">${showSk ? '⚡秒杀价 立减¥' : '省¥'}${save.toLocaleString()}</span>
          </div>
          <div class="d-tags">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>
          <div class="d-row"><span class="lab">已售</span><b>${salesText(p.sales)}</b> 件　<span class="stars" style="color:var(--gold)">${stars(p.rating)}</span> ${p.rating} 分</div>
          <div class="d-row"><span class="lab">${esc((p.specAxes || [{}])[0].label || '规格')}</span><div class="spec-pick" id="specPick">
            ${variants.map((v, i) => `<button class="${v.def ? 'on' : ''}" data-spec="${esc(v.name)}">${esc(v.name)}</button>`).join('')}
          </div></div>
          ${(p.specAxes && p.specAxes[1]) ? `<div class="d-row"><span class="lab">${esc(p.specAxes[1].label)}</span><div class="spec-pick" id="specPick2">
            ${p.specAxes[1].opts.map((c, i) => `<button class="${i === 0 ? 'on' : ''}" data-spec2="${esc(c)}">${esc(c)}</button>`).join('')}
          </div></div>` : ''}
          <div class="d-row"><span class="lab">数量</span>
            <div class="qty">
              <button data-act="decQty">−</button>
              <input id="qtyVal" value="1" readonly />
              <button data-act="incQty">+</button>
            </div>
          </div>
          <div class="buy-row">
            <button class="btn btn-cart" data-act="addcart:${p.id}">加入购物车</button>
            <button class="btn btn-buy" data-act="buynow:${p.id}">${showSk ? '⚡ 马上抢' : '立即购买'}</button>
          </div>
        </div>
      </div>

      ${prodDetailHTML}

      <div class="reviews">
        <h3>📝 商品评价 <span style="color:var(--sub);font-weight:400;font-size:13px">（${revs.length}条）</span></h3>
        <div class="rev-summary">
          <div class="rev-score"><b>${avg}</b><span>综合评分</span></div>
          <div class="rev-bar">${dist}</div>
        </div>
        ${revs.map(revHTML).join('')}
      </div>
    </div>`;
}

function revHTML(r) {
  return `<div class="rev-item ${r.mine ? 'mine' : ''}">
    <div class="rev-head">
      <div class="rev-ava">${r.mine ? '我' : (r.user.slice(-2, -1) || '宝')}</div>
      <div><div class="rev-name">${esc(r.user)}${r.mine ? ' <span class="rev-mine">我的评价</span>' : ''}</div><div class="rev-stars">${stars(r.rating)}</div></div>
    </div>
    <div class="rev-text">${esc(r.text)}</div>
    <div class="rev-meta">${r.date} · ${esc(r.sku)}</div>
  </div>`;
}

/* =========================================================
   视图：购物车
   ========================================================= */
function viewCart() {
  if (!cart.length) {
    app.innerHTML = `<div class="wrap"><div class="empty"><div class="big">🛒</div>购物车还是空的，去逛逛吧～<div style="margin-top:18px"><button class="btn btn-buy" data-act="home">去逛街</button></div></div></div>`;
    return;
  }
  const total = cart.reduce((s, i) => s + itemPrice(i) * i.qty, 0);
  app.innerHTML = `<div class="wrap">
    <div class="section-title"><h2>🛍️ 我的购物车（${cart.length}）</h2></div>
    <div class="cart-list">
      ${cart.map(i => {
        const p = PRODUCT_MAP[i.id];
        return `<div class="cart-item">
          <div class="ci-thumb"><img src="${p.img}" alt="${esc(p.title)}" /></div>
          <div class="ci-info">
            <div class="ci-name">${esc(p.title)}</div>
            <div class="ci-sku">${esc(p.brand)} · ${esc(i.sku)}</div>
            <div class="ci-price">${money(itemPrice(i))}${i.seckill ? ' <span style="font-size:11px;color:var(--tb-red)">秒杀</span>' : ''}</div>
          </div>
          <div class="qty">
            <button data-act="dec:${i.id}">−</button>
            <input value="${i.qty}" readonly />
            <button data-act="inc:${i.id}">+</button>
          </div>
          <button class="btn-ghost" style="color:#bbb;padding:6px 10px" data-act="del:${i.id}">删除</button>
        </div>`;
      }).join('')}
    </div>
    <div class="cart-foot">
      <div>合计：<span class="total">${money(total)}</span></div>
      <button class="btn btn-buy" data-act="checkout">去结算（${cart.reduce((s, i) => s + i.qty, 0)}件）</button>
    </div>
  </div>`;
}

/* =========================================================
   视图：结算 / 下单表单（含优惠券）
   ========================================================= */
function viewCheckout() {
  const items = buyNow ? [buyNow] : cart;
  if (!items.length) { navigate('#/cart'); return; }
  /* 默认优先选中默认地址 */
  const def = getDefaultAddr();
  if (checkoutAddrId == null || !getAddr(checkoutAddrId)) checkoutAddrId = def ? def.id : null;
  const subtotal = items.reduce((s, i) => s + itemPrice(i) * i.qty, 0);
  const lines = items.map(i => {
    const p = PRODUCT_MAP[i.id];
    return `<div class="order-line">
      <div class="ol-thumb"><img src="${p.img}" alt="${esc(p.title)}" /></div>
      <div class="ol-info"><div style="font-weight:600">${esc(p.title)}</div><div style="color:var(--sub);font-size:12px">${esc(p.brand)} · ${esc(i.sku)} × ${i.qty}${i.seckill ? ' · 秒杀' : ''}</div></div>
      <div class="ol-price">${money(itemPrice(i) * i.qty)}</div>
    </div>`;
  }).join('');

  const couponBlock = claimedCoupons.length
    ? COUPONS.filter(c => claimedCoupons.includes(c.id)).map(c => {
        const apply = couponApplies(c, items);
        const disc = couponDiscount(c, subtotal);
        const usable = apply && disc > 0 && subtotal > 0;
        return `<div class="cp-item" data-act="pickcoupon:${c.id}" style="${usable ? '' : 'opacity:.5;pointer-events:none'}">
          <div class="cp-amt">${couponShort(c)}</div>
          <div class="cp-info"><div class="cp-title">${c.title}</div><div class="cp-desc">${usable ? '可减 ' + money(disc) : (apply ? '差 ' + money(c.threshold - subtotal) + ' 可用' : '不适用本单')}</div></div>
          <div>${usable ? '✓' : ''}</div>
        </div>`;
      }).join('') + `<div class="cp-item ${checkoutCouponId ? '' : 'on'}" data-act="pickcoupon:none"><div class="cp-amt">不使用</div><div class="cp-info"><div class="cp-title">暂不使用优惠券</div></div></div>`
    : `<div class="cp-none">暂无已领取优惠券，去 <span class="cp-link" data-act="coupons">领券中心</span> 领取 →</div>`;

  app.innerHTML = `<div class="wrap">
    <div class="section-title"><h2>📝 填写订单</h2></div>
    ${checkoutAddrBlock()}
    <div class="form-card">
      <h3>🛒 商品清单</h3>
      ${lines}
      <div style="text-align:right;margin-top:10px">商品合计：<b style="color:var(--tb-red);font-size:18px">${money(subtotal)}</b>　运费：<b style="color:var(--green)">免运费</b></div>
    </div>
    <div class="form-card">
      <h3>🎟️ 优惠券</h3>
      <div class="coupon-pick">${couponBlock}</div>
    </div>
    <div class="form-card">
      <h3>💳 支付方式</h3>
      <div class="pay-method" id="payMethod">
        <button class="on" data-pm="支付宝"><span class="pm-ic">🅰️</span>支付宝</button>
        <button data-pm="微信支付"><span class="pm-ic">💚</span>微信支付</button>
        <button data-pm="银行卡"><span class="pm-ic">💳</span>银行卡</button>
      </div>
    </div>
    <div class="cart-foot">
      <div>应付：<span class="total" id="orderTotal">${money(subtotal)}</span><span id="orderDiscount" style="color:var(--green);font-size:13px;margin-left:8px"></span></div>
      <button class="btn btn-buy" data-act="submitOrder">提交订单</button>
    </div>
  </div>`;
  /* 地址模式切换会重渲染本页：恢复此前已选优惠券的高亮与金额 */
  if (checkoutCouponId) {
    const el = qs(`.coupon-pick .cp-item[data-act="pickcoupon:${checkoutCouponId}"]`);
    if (el) el.classList.add('on');
    updateCheckoutTotal();
  }
}

function updateCheckoutTotal() {
  const items = buyNow ? [buyNow] : cart;
  const subtotal = items.reduce((s, i) => s + itemPrice(i) * i.qty, 0);
  const selected = checkoutCouponId ? COUPONS.find(c => c.id === checkoutCouponId) : null;
  const discount = selected ? couponDiscount(selected, subtotal) : 0;
  const final = Math.max(0, subtotal - discount);
  const tEl = qs('#orderTotal'); if (tEl) tEl.textContent = money(final);
  const dEl = qs('#orderDiscount'); if (dEl) dEl.textContent = discount ? '已优惠 ' + money(discount) : '';
}

/* 结算页 · 收货信息模块（常用地址选择 + 新增地址表单） */
function checkoutAddrBlock() {
  const hasAddr = addrs.length > 0;
  /* 选择已有地址模式 */
  if (hasAddr && !checkoutNewAddr) {
    const cards = addrs.slice()
      .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
      .map(a => `<div class="co-addr ${a.id === checkoutAddrId ? 'on' : ''}" data-act="pickaddr:${a.id}">
        <div class="co-radio"></div>
        <div class="co-body">
          <div class="co-line1"><span class="co-name">${esc(a.name)}</span><span class="co-phone">${esc(maskPhone(a.phone))}</span>${a.isDefault ? '<span class="ac-badge">默认</span>' : ''}${a.tag ? `<span class="ac-tag">${esc(a.tag)}</span>` : ''}</div>
          <div class="co-line2">${esc(addrOneLine(a))}</div>
        </div>
        <span class="co-edit" data-act="addredit:${a.id}">编辑</span>
      </div>`).join('');
    return `<div class="form-card">
      <h3>📍 收货信息 <span class="co-manage" data-act="address">地址管理 ›</span></h3>
      <div class="co-addr-list">${cards}</div>
      <button class="co-newbtn" data-act="checkoutnew">＋ 使用新地址</button>
    </div>`;
  }
  /* 新增地址内联表单 */
  return `<div class="form-card">
    <h3>📍 收货信息${hasAddr ? ' · 新地址' : ''}${hasAddr ? '<span class="co-manage" data-act="checkoutpick">‹ 选择已有地址</span>' : ''}</h3>
    <div class="field"><label>收货人姓名</label><input id="f_name" placeholder="请输入姓名" /></div>
    <div class="field"><label>手机号码</label><input id="f_phone" placeholder="11位手机号" maxlength="11" /></div>
    <div class="field"><label>省份</label>
      <select id="f_prov">${PROVINCES.map(p => `<option ${p === '广东省' ? 'selected' : ''}>${p}</option>`).join('')}</select>
    </div>
    <div class="field"><label>城市</label><input id="f_city" placeholder="如：深圳市" /></div>
    <div class="field"><label>详细地址</label><textarea id="f_detail" rows="2" placeholder="街道、小区、门牌号"></textarea></div>
    <label class="addr-default-toggle"><input type="checkbox" id="f_save" checked /> 保存为常用地址（下次自动填好）</label>
  </div>`;
}

/* =========================================================
   视图：支付（模拟）
   ========================================================= */
function viewPay() {
  const o = orders.find(x => x.orderId === currentParam);
  if (!o) { navigate('#/orders'); return; }
  app.innerHTML = `<div class="wrap">
    <div class="section-title"><h2>💰 收银台</h2></div>
    <div class="form-card pay-card">
      <div style="color:var(--sub);margin-bottom:8px">订单号 ${o.orderId}</div>
      <div style="font-size:40px;font-weight:900;color:var(--tb-red)">${money(o.total)}</div>
      ${o.discount ? `<div style="margin-top:8px;color:var(--green);font-size:13px">已优惠 ${money(o.discount)}（含优惠券）</div>` : ''}
      <div style="margin:18px 0;color:#555">支付方式：<b>${o.payMethod}</b></div>
      <button class="btn btn-buy" id="doPay" style="padding:14px 50px">确认支付</button>
      <div style="margin-top:14px;color:var(--sub);font-size:12px">🔒 虚拟演示：点击不会扣除任何真实费用</div>
    </div>
  </div>`;
  qs('#doPay').onclick = () => {
    qs('#doPay').textContent = '支付处理中…';
    qs('#doPay').disabled = true;
    setTimeout(() => {
      o.status = 'paid';
      o.paidAt = Date.now();
      o.logistics = buildLogistics(o.address);
      o._rev = 1;
      saveOrders();
      showToast('🎉 支付成功！商家开始备货');
      navigate('#/track/' + o.orderId);
    }, 1300);
  };
}

/* =========================================================
   视图：我的订单
   ========================================================= */
function viewOrders() {
  /* 按当前账号隔离订单：登录后只看自己的；未登录看“游客(anon)”的 */
  const me = getWxUser();
  const myOrders = me ? orders.filter(o => o.openid === me.openid) : orders.filter(o => (o.openid || 'anon') === 'anon');
  if (!myOrders.length) {
    app.innerHTML = `<div class="wrap"><div class="empty"><div class="big">📦</div>${me ? `当前账号「${esc(me.nickname)}」还没有订单` : '还没有订单'}，先去下一单过过瘾吧～<div style="margin-top:18px"><button class="btn btn-buy" data-act="home">去逛街</button></div></div></div>`;
    return;
  }
  const ordered = [...myOrders].reverse();
  const accLine = me
    ? `<div class="acc-bar">当前账号：<b>${esc(me.nickname)}</b>　·　<a data-act="wxlogout">退出登录</a></div>`
    : `<div class="acc-bar">游客模式（订单仅本机）　·　<a data-act="wxlogin">微信登录后订单各看各的</a></div>`;
  app.innerHTML = `<div class="wrap">
    ${accLine}
    <div class="section-title"><h2>📦 我的订单（${myOrders.length}）</h2></div>
    ${ordered.map(orderCardHTML).join('')}
  </div>`;
}

function orderCardHTML(o) {
  const p = PRODUCT_MAP[o.items[0].id];
  const act = o.status === 'waitpay'
    ? `<button class="btn btn-buy" data-act="pay:${o.orderId}">去支付</button>`
    : (o.status === 'delivered'
      ? (o.review ? `<span style="color:var(--sub)">已评价 ⭐</span>` : `<button class="btn btn-cart" data-act="review:${o.orderId}">去评价</button>`)
      : (o.arrived
        ? `<button class="btn btn-buy" data-act="receive:${o.orderId}">确认收货</button>`
        : `<button class="btn btn-ghost" data-act="track:${o.orderId}">查看物流</button>`));
  return `<div class="order-card">
    <div class="order-top"><span>订单号 ${o.orderId} · ${new Date(o.createdAt).toLocaleString('zh-CN')}</span>${statusBadge(o)}</div>
    <div class="order-prod">
      <div class="op-thumb"><img src="${p.img}" alt="${esc(p.title)}" /></div>
      <div style="flex:1"><div style="font-weight:600">${esc(p.title)}</div><div style="color:var(--sub);font-size:12px">${esc(o.items[0].sku)} × ${o.items[0].qty}　等${o.items.length}件</div></div>
      <div class="amt">${money(o.total)}</div>
    </div>
    <div class="order-foot"><span style="color:var(--sub);font-size:12px">${esc(o.address.name)} ${esc(o.address.phone)}</span>${act}</div>
  </div>`;
}

function statusBadge(o) {
  const cls = { waitpay: 'st-waitpay', paid: 'st-paid', shipping: 'st-ship', delivered: 'st-done' }[o.status];
  const txt = { waitpay: '待付款', paid: '待发货', shipping: o.arrived ? '待确认收货' : getShipText(o), delivered: '已签收' }[o.status];
  return `<span class="order-status ${cls}">${txt}</span>`;
}
function getShipText(o) {
  const rev = o.logistics.filter(n => n.t <= Date.now());
  const cur = rev[rev.length - 1];
  return cur && cur.status === 'delivering' ? '派送中' : '运输中';
}

/* =========================================================
   视图：物流跟踪（实时）
   ========================================================= */
function viewTrack() {
  const o = orders.find(x => x.orderId === currentParam);
  if (!o) { navigate('#/orders'); return; }
  renderTrack(o.orderId);
}

function renderTrack(oid) {
  const o = orders.find(x => x.orderId === oid);
  if (!o) return;
  const now = vnow();
  const revealed = o.logistics.filter(n => n.t <= now);
  const cur = revealed[revealed.length - 1] || o.logistics[0];
  const doneCount = revealed.length;
  const isConfirmed = o.status === 'delivered';
  const isArrived = !!o.arrived && !isConfirmed;      // 包裹到手，待确认收货
  const isDelivering = cur.status === 'delivering';

  const eta = new Date(o.logistics[o.logistics.length - 1].t).toLocaleString('zh-CN');
  const cityNow = cur.city === '系统' ? '仓库' : cur.city;

  const tl = revealed.slice().reverse().map((n, idx) => {
    const isCur = idx === 0 && n.status !== 'delivered';
    const live = isCur ? `<span class="tl-live">实时</span>` : '';
    return `<div class="tl-item done ${isCur ? 'cur' : ''}">
      <div class="dot"></div>
      <div><div class="tl-time">${new Date(n.t).toLocaleString('zh-CN')}</div><div class="tl-desc">${esc(n.desc)}${n.window ? `　<b style="color:var(--tb-red)">${esc(n.window)}</b>` : ''} ${live}</div></div>
    </div>`;
  }).join('');

  let actionBtn = '';
  if (isConfirmed) {
    actionBtn = o.review
      ? `<span style="color:var(--sub)">✅ 已签收并完成评价</span>`
      : `<button class="btn btn-buy" data-act="review:${o.orderId}">去评价 + 晒单</button>`;
  } else if (isArrived) {
    actionBtn = `<button class="btn btn-buy" data-act="receive:${o.orderId}">📦 确认收货</button>`;
  } else if (isDelivering) {
    actionBtn = `<button class="btn btn-ghost" data-act="orders">派送中，请稍候</button>`;
  } else {
    actionBtn = `<button class="btn btn-ghost" data-act="orders">返回订单</button>`;
  }

  app.innerHTML = `<div class="wrap">
    <div class="section-title"><h2>🚚 物流跟踪</h2><span class="more" data-act="orders">我的订单 ›</span></div>
    <div class="track-hero">
      <div class="th-status">${isConfirmed ? '📦 已签收' : (isArrived ? '📦 已送达' : (isDelivering ? '🛵 派送中' : '✈️ ' + getShipText(o)))}</div>
      <div class="th-sub">${esc(o.address.name)}，您的快件正奔向您～</div>
      <div class="th-eta">📅 预计送达：${eta}</div>
      ${isDelivering && cur.window ? `<div class="th-eta" style="color:var(--tb-red);font-weight:600">🛵 配送时段：${esc(cur.window)}</div>` : ''}
    </div>
    <div class="map-box">🗺️ 快件当前位置：<b>${esc(cityNow)}</b>　🚚 → ${esc(o.address.city || '目的地')}</div>
    <div class="timeline">${tl}</div>
    ${!isConfirmed ? '<div class="tl-more">⌛ 后续物流节点将随真实时间逐步更新，预计 1~2 天送达</div>' : ''}
    <div class="cart-foot">
      <div style="color:var(--sub);font-size:12px">物流按真实时效推进，预计 1~2 天送达</div>
      ${actionBtn}
    </div>
  </div>`;
}

/* =========================================================
   视图：追评
   ========================================================= */
function viewReview() {
  const o = orders.find(x => x.orderId === currentParam);
  if (!o) { navigate('#/orders'); return; }
  const p = PRODUCT_MAP[o.items[0].id];
  app.innerHTML = `<div class="wrap">
    <div class="section-title"><h2>⭐ 发表评价</h2></div>
    <div class="review-box">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div class="op-thumb" style="width:56px;height:56px;border-radius:10px;overflow:hidden;background:#f1f1f3"><img src="${p.img}" alt="${esc(p.title)}" style="width:100%;height:100%;object-fit:cover" /></div>
        <div><div style="font-weight:600">${esc(p.title)}</div><div style="color:var(--sub);font-size:12px">${esc(o.items[0].sku)}</div></div>
      </div>
      <div class="field"><label>评分</label>
        <div class="stars-pick" id="starPick">
          ${[1, 2, 3, 4, 5].map(i => `<span class="s on" data-star="${i}">★</span>`).join('')}
        </div>
      </div>
      <div class="field"><label>评价内容</label>
        <textarea id="revText" rows="4" placeholder="说说这次虚拟购物的体验吧～（例如：包装精美，物流飞快，体验感拉满！）"></textarea>
      </div>
      <button class="btn btn-buy" data-act="submitReview:${o.orderId}">提交评价</button>
    </div>
  </div>`;
}

/* =========================================================
   视图：收货确认（物流送达后）
   ========================================================= */
function viewReceive() {
  const o = orders.find(x => x.orderId === currentParam);
  if (!o) { navigate('#/orders'); return; }
  const p = PRODUCT_MAP[o.items[0].id];
  const arrivedText = (o.logistics.filter(n => n.t <= Date.now()).pop() || {}).desc || '您的快件已送达';
  app.innerHTML = `<div class="wrap">
    <div class="section-title"><h2>📦 确认收货</h2><span class="more" data-act="track:${o.orderId}">查看物流 ›</span></div>
    <div class="receive-hero">
      <div class="recv-emoji">📦</div>
      <div class="recv-title">包裹已送达！</div>
      <div class="recv-sub">${esc(arrivedText)}</div>
    </div>
    <div class="receive-card">
      <div class="recv-prod">
        <div class="op-thumb"><img src="${p.img}" alt="${esc(p.title)}" /></div>
        <div style="flex:1"><div style="font-weight:600">${esc(p.title)}</div><div style="color:var(--sub);font-size:12px">${esc(o.items[0].sku)} × ${o.items[0].qty}</div></div>
        <div class="amt">${money(o.total)}</div>
      </div>
      <div class="recv-addr">
        <span class="lab">收货信息</span>
        <div>${esc(o.address.name)} ${esc(o.address.phone)}</div>
        <div style="color:var(--sub)">${esc(o.address.prov || '')}${esc(o.address.city || '')} ${esc(o.address.detail || '')}</div>
      </div>
    </div>
    <div class="receive-tip">⚠️ 确认收货后订单完成，可对该商品发表评价。虚拟演示，点击即确认。</div>
    <button class="btn btn-buy btn-block" data-act="confirmReceive:${o.orderId}">✅ 确认收货</button>
  </div>`;
}

function confirmReceive(oid) {
  const o = orders.find(x => x.orderId === oid);
  if (!o) return;
  o.status = 'delivered';
  o.signedAt = Date.now();
  o.arrived = true;
  saveOrders();
  showToast('✅ 已确认收货，快去评价吧～');
  navigate('#/review/' + oid);
}

/* =========================================================
   物流生成
   ---------------------------------------------------------
   设计原则（写实）：
   1) 发货地固定为「深圳」仓；目的地取收货地址城市。
   2) 中转枢纽按目的地所在大区选取，保证：不绕回发货地、
      不与目的地重复、路线从南到北/由近及远单向推进。
   3) 时间按真实时效铺开（约 1~1.5 天送达），而非几分钟。
   ========================================================= */

/* 物流时间基准：使用真实系统时间，物流按真实时效（1~2 天）推进 */
function vnow() { return Date.now(); }
function fmtHM(t) { const d = new Date(t); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }

/* 按目的地（城市/省份）所在大区挑选 0~2 个合理中转枢纽：
   1) 同城（目的地=深圳）返回空，直配；
   2) 绝不回到发货地深圳，也不与目的地同名；
   3) 路径由南向北 / 由近及远单向推进，不存在“绕回” */
function pickHubs(addr, origin) {
  const dest = (addr.city || '').replace(/市$/, '').trim();
  if (!dest || dest === origin) return [];
  const regionKeys = (addr.prov || '') + ' ' + dest;   // 同时匹配省份与城市
  const REGION = [
    { keys: ['北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','山东','郑州','济南','青岛','石家庄'], hubs: ['武汉','郑州'] },
    { keys: ['上海','江苏','浙江','安徽','江西','福建','杭州','南京','苏州','宁波','合肥','福州'], hubs: ['南昌','杭州'] },
    { keys: ['河南','湖北','湖南','武汉','长沙','郑州'], hubs: ['长沙','武汉'] },
    { keys: ['重庆','四川','贵州','云南','西藏','成都','昆明','贵阳','重庆'], hubs: ['广州','成都'] },
    { keys: ['陕西','甘肃','青海','宁夏','新疆','西安','兰州','银川','西宁','乌鲁木齐'], hubs: ['武汉','西安'] },
    { keys: ['广东','广西','海南','香港','澳门','广州','深圳','东莞','佛山','三亚','海口'], hubs: ['广州'] },
  ];
  for (const r of REGION) {
    if (r.keys.some(k => regionKeys.includes(k))) {
      return r.hubs.filter(h => h !== dest && h !== origin);
    }
  }
  return ['武汉', '郑州']; // 兜底
}

/* 快递员池：按收货地址确定性选取，不同地址 → 不同快递员姓名/电话，同城/同地址保持稳定 */
const COURIERS = [
  { name: '王师傅', phone: '13800138888' },
  { name: '李师傅', phone: '13912345678' },
  { name: '张师傅', phone: '13700137000' },
  { name: '赵师傅', phone: '13600136000' },
  { name: '刘师傅', phone: '13511112222' },
  { name: '陈师傅', phone: '15012348888' },
  { name: '杨师傅', phone: '18800188000' },
  { name: '黄师傅', phone: '18666668888' },
  { name: '周师傅', phone: '13333330000' },
  { name: '吴师傅', phone: '18999990000' },
];
function pickCourier(addr) {
  const seed = (addr.name || '') + (addr.phone || '') + (addr.city || '') + (addr.detail || '') + (addr.prov || '');
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const c = COURIERS[h % COURIERS.length];
  const masked = c.phone.slice(0, 3) + '****' + c.phone.slice(7);
  return { name: c.name, masked };
}

function buildLogistics(addr) {
  const base = vnow();
  const H = 3600000;                 // 1 小时
  const origin = '深圳';
  const dest = (addr.city || '').replace(/市$/, '').trim() || '北京';
  const isLocal = (dest === origin);
  const hubs = isLocal ? [] : pickHubs(addr, origin);
  const route = isLocal ? [origin] : [origin, ...hubs, dest];   // 同城 → [深圳]，不会重复
  const courier = pickCourier(addr);

  const nodes = [];
  nodes.push({ t: base, city: '系统', desc: '订单已支付成功，商家正在配货', status: 'paid' });
  nodes.push({ t: base + 3 * H, city: origin, desc: `${origin}仓已出库，商家已发货`, status: 'shipping' });

  let cursor = 3;
  for (let i = 1; i < route.length - 1; i++) {
    const from = route[i], to = route[i + 1];
    nodes.push({ t: base + cursor * H, city: from, desc: `快件已到达${from}转运中心`, status: 'shipping' });
    nodes.push({ t: base + (cursor + 3.5) * H, city: from, desc: `快件已发往${to}转运中心`, status: 'shipping' });
    cursor += 7;
  }
  nodes.push({ t: base + (cursor + 3.5) * H, city: dest, desc: `快件已到达${dest}派送网点`, status: 'shipping' });
  const deliverStart = base + (cursor + 6.5) * H;
  const deliverEnd = base + (cursor + 10) * H;
  const windowText = `预计 ${fmtHM(deliverStart)}–${fmtHM(deliverEnd)} 送达`;
  nodes.push({ t: deliverStart, city: dest, desc: `快递员【${courier.name} ${courier.masked}】正在为您派送，请保持电话畅通`, status: 'delivering', window: windowText });
  nodes.push({ t: deliverEnd, city: dest, desc: `快件已签收，感谢您的使用，期待您的评价～`, status: 'delivered' });
  return nodes;
}

/* =========================================================
   订单状态推进（定时器，2秒）
   ========================================================= */
function tick() {
  let changed = false;
  orders.forEach(o => {
    if (o.status === 'waitpay' || o.status === 'delivered') return;
    const rev = o.logistics.filter(n => n.t <= vnow()).length;
    if (rev > (o._rev || 0)) {
      o._rev = rev;
      const cur = o.logistics[rev - 1];
      if (cur.status === 'delivered') {
        o.arrived = true;                 // 包裹已送达，待用户「确认收货」
        changed = true;
        showToast(`📦 订单 ${o.orderId} 已送达，请确认收货！`);
      } else {
        o.status = 'shipping';
        changed = true;
        showToast(`🚚 订单 ${o.orderId}：${cur.desc}`);
      }
    }
  });
  if (changed) saveOrders();
  if (currentRoute === 'track' && currentParam) renderTrack(currentParam);
}
setInterval(tick, 2000);

/* =========================================================
   业务动作
   ========================================================= */
function saveOrders() { set(LS.orders, orders); }

function addToCart(id, qty = 1, sku, price, seckill) {
  const ex = cart.find(i => i.id === id && i.sku === sku && i.price === price && !!i.seckill === !!seckill);
  if (ex) ex.qty += qty; else cart.push({ id, qty, sku, price, seckill: !!seckill });
  set(LS.cart, cart); updateCartCount();
  showToast('✅ 已加入购物车');
}

function submitOrder() {
  let address;
  const usingExisting = addrs.length > 0 && !checkoutNewAddr;
  if (usingExisting) {
    const a = getAddr(checkoutAddrId) || getDefaultAddr();
    if (!a) { showToast('请选择或新增一个收货地址'); return; }
    address = { name: a.name, phone: a.phone, prov: a.prov, city: a.city, detail: a.prov + a.city + a.detail };
  } else {
    const name = qs('#f_name').value.trim();
    const phone = qs('#f_phone').value.trim();
    const prov = qs('#f_prov').value;
    const city = qs('#f_city').value.trim();
    const detail = qs('#f_detail').value.trim();
    if (!name || !/^1\d{10}$/.test(phone) || !city || !detail) {
      showToast('请完整填写收货人、手机号、城市与详细地址');
      return;
    }
    address = { name, phone, prov, city, detail: prov + city + detail };
    set(LS.addr, { name, phone, prov, city, detail });
    /* 勾选“保存为常用地址”则写入地址簿 */
    const saveChk = qs('#f_save');
    if (!saveChk || saveChk.checked) {
      const saved = addAddr({ name, phone, prov, city, detail, tag: '', isDefault: addrs.length === 0 });
      checkoutAddrId = saved.id;
    }
    checkoutNewAddr = false;
  }
  const src = buyNow ? [buyNow] : cart;
  const items = src.map(i => ({ id: i.id, qty: i.qty, sku: i.sku, price: i.price, seckill: !!i.seckill }));
  const subtotal = items.reduce((s, i) => s + itemPrice(i) * i.qty, 0);
  // 秒杀库存扣减
  items.forEach(i => {
    const p = PRODUCT_MAP[i.id];
    if (p.seckill != null && i.seckill) {
      p.seckillStock = Math.max(0, (p.seckillStock ?? 0) - i.qty);
    }
  });
  const selected = checkoutCouponId ? COUPONS.find(c => c.id === checkoutCouponId) : null;
  const discount = selected ? couponDiscount(selected, subtotal) : 0;
  const total = Math.max(0, subtotal - discount);
  const pm = qs('#payMethod .on') ? qs('#payMethod .on').dataset.pm : '支付宝';
  const o = {
    orderId: genOrderId(), items, subtotal, discount, couponId: checkoutCouponId || null,
    total, address, payMethod: pm, status: 'waitpay', createdAt: Date.now(), logistics: [], review: null,
    openid: currentOpenid()
  };
  orders.push(o); saveOrders();
  if (buyNow) { buyNow = null; set(LS.buynow, null); }
  else { cart = []; set(LS.cart, cart); updateCartCount(); }
  checkoutCouponId = null;
  showToast('📝 订单已提交，去支付吧');
  navigate('#/pay/' + o.orderId);
}

function submitReview(oid) {
  const o = orders.find(x => x.orderId === oid);
  if (!o) return;
  const starsOn = qsa('#starPick .s.on');
  const rating = starsOn.length || 5;
  const text = qs('#revText').value.trim() || '体验非常棒，虚拟购物也能这么真实！';
  const pid = o.items[0].id;
  const date = new Date().toLocaleDateString('zh-CN');
  o.review = { rating, text, date };
  /* 回流到商品页：更新内存 + 持久化，刷新后仍可见 */
  const rec = { user: o.address.name || '潮购用户', rating, text, date, sku: o.items[0].sku, mine: true };
  const p = PRODUCT_MAP[pid];
  if (p) p.reviews.unshift(rec);
  userReviews.unshift({ productId: pid, ...rec });
  set(LS.userrev, userReviews);
  saveOrders();
  showToast('⭐ 感谢您的评价！');
  navigate('#/orders');
}

/* 启动：把历史用户评价合并进商品页（PRODUCT_MAP 每次重载都是全新，仅从 userReviews 注入） */
function initUserReviews() {
  userReviews.forEach(r => {
    const p = PRODUCT_MAP[r.productId];
    if (!p) return;
    const dup = p.reviews.some(x => x.mine && x.date === r.date && x.text === r.text);
    if (!dup) p.reviews.unshift(r);
  });
}

/* =========================================================
   横幅轮播
   ========================================================= */
let bannerTimer = null;
function startBanner() {
  clearInterval(bannerTimer);
  const slides = qsa('#banner .slide');
  const dots = qsa('#banner .dots i');
  if (!slides.length) return;
  let i = 0;
  bannerTimer = setInterval(() => {
    slides[i].classList.remove('on'); dots[i].classList.remove('on');
    i = (i + 1) % slides.length;
    slides[i].classList.add('on'); dots[i].classList.add('on');
  }, 4000);
}

/* =========================================================
   渲染分发
   ========================================================= */
function render() {
  clearInterval(skTimer);
  parseHash();
  switch (currentRoute) {
    case 'home': viewHome(); break;
    case 'seckill': viewSeckill(); break;
    case 'coupons': viewCoupons(); break;
    case 'cat': case 'search': listPage = 1; viewList(); break;
    case 'product': viewProduct(); break;
    case 'cart': viewCart(); break;
    case 'address': viewAddress(); break;
    case 'addredit': viewAddrEdit(); break;
    case 'checkout':
      /* 每次经由路由进入结算页 = 全新一单：重置优惠券与地址模式（模式切换不走路由，故不受影响） */
      checkoutCouponId = null; checkoutNewAddr = false;
      viewCheckout();
      break;
    case 'pay': viewPay(); break;
    case 'orders': viewOrders(); break;
    case 'track': viewTrack(); break;
    case 'review': viewReview(); break;
    case 'receive': viewReceive(); break;
    default: viewHome();
  }
  window.scrollTo(0, 0);
  syncCatbar();
  if (csPanelEl && !csPanelEl.hidden && csTab === 'pre') renderCsQuick();
}

function syncCatbar() {
  qsa('#catbar .cat-chip').forEach(chip => {
    const act = chip.dataset.act;
    let active = false;
    if (act === 'home') active = currentRoute === 'home';
    else if (act === 'seckill') active = currentRoute === 'seckill';
    else if (act === 'coupons') active = currentRoute === 'coupons';
    else if (act.startsWith('cat:')) active = currentRoute === 'cat' && currentParam === act.slice(4);
    chip.classList.toggle('active', active);
  });
}

/* =========================================================
   事件委托
   ========================================================= */
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) { navigate(go.dataset.go); return; }
  const act = e.target.closest('[data-act]');
  if (!act) return;
  const a = act.dataset.act;
  if (a === 'home') return navigate('#/home');
  if (a === 'coupons') return navigate('#/coupons');
  if (a === 'seckill') return navigate('#/seckill');
  if (a.startsWith('cat:')) return navigate('#/cat/' + a.slice(4));
  if (a.startsWith('page:')) {
    listPage = Math.max(1, parseInt(a.slice(5), 10) || 1);
    renderListGrid(currentList);
    const g = qs('#listGrid'); if (g) { try { g.scrollIntoView({ block: 'start' }); } catch (_) {} }
    return;
  }
  if (a.startsWith('product:')) return navigate('#/product/' + a.slice(8));
  if (a.startsWith('track:')) return navigate('#/track/' + a.slice(6));
  if (a.startsWith('review:')) return navigate('#/review/' + a.slice(7));
  if (a.startsWith('pay:')) return navigate('#/pay/' + a.slice(4));
  if (a.startsWith('addcart:')) {
    const p = PRODUCT_MAP[a.slice(8)];
    const v = selectedVariant(p);
    const color = selectedColor(p);
    addToCart(p.id, 1, color ? `${v.name} / ${color}` : v.name, productEff(p, v, 'price'), !!p.seckill);
    return;
  }
  if (a.startsWith('buynow:')) {
    const p = PRODUCT_MAP[a.slice(7)];
    const qty = qs('#qtyVal') ? Number(qs('#qtyVal').value) : 1;
    const v = selectedVariant(p);
    const color = selectedColor(p);
    buyNow = { id: p.id, qty, sku: color ? `${v.name} / ${color}` : v.name, price: productEff(p, v, 'price'), seckill: !!p.seckill }; set(LS.buynow, buyNow);
    return navigate('#/checkout');
  }
  if (a.startsWith('seckill:')) {
    const p = PRODUCT_MAP[a.slice(8)];
    if (!p.seckill || (p.seckillStock ?? 0) <= 0) { showToast('手慢了，已抢光 🥲'); return; }
    const qty = qs('#qtyVal') ? Number(qs('#qtyVal').value) : 1;
    const v = selectedVariant(p);
    const color = selectedColor(p);
    buyNow = { id: p.id, qty, sku: color ? `${v.name} / ${color}` : v.name, price: productEff(p, v, 'price'), seckill: true }; set(LS.buynow, buyNow);
    showToast('⚡ 进入秒杀结算');
    return navigate('#/checkout');
  }
  if (a.startsWith('claim:')) {
    const id = a.slice(6);
    if (claimedCoupons.includes(id)) { showToast('该券已领取'); return; }
    claimedCoupons.push(id); set(LS.coupons, claimedCoupons);
    showToast('🎉 领取成功，结算可用');
    viewCoupons();
    return;
  }
  if (a.startsWith('pickcoupon:')) {
    const id = a.slice(11);
    const next = (id === 'none') ? null : id;
    /* 再点同一张 = 取消（toggle）；点“不使用” = 置空不用券 */
    checkoutCouponId = (checkoutCouponId === next) ? null : next;
    qsa('.coupon-pick .cp-item').forEach(el => {
      const elId = (el.dataset.act || '').slice(11);
      el.classList.toggle('on', elId === (checkoutCouponId || 'none'));
    });
    updateCheckoutTotal();
    return;
  }
  if (a === 'cart') return navigate('#/cart');
  if (a === 'wxlogin') { wxLogin(); return; }
  if (a === 'wxlogout') { wxLogout(); return; }
  if (a === 'orders') return navigate('#/orders');
  if (a === 'address') return navigate('#/address');
  if (a === 'checkout') return navigate('#/checkout');
  /* ---- 地址簿相关 ---- */
  if (a === 'addrnew') return navigate('#/addredit');
  if (a.startsWith('addredit:')) return navigate('#/addredit/' + a.slice(9));
  if (a.startsWith('setdefault:')) { setDefaultAddr(a.slice(11)); showToast('✅ 已设为默认地址'); viewAddress(); return; }
  if (a.startsWith('addrdel:')) {
    const id = a.slice(8);
    if (addrs.length <= 1) { showToast('至少保留一个收货地址哦～'); return; }
    deleteAddr(id);
    if (checkoutAddrId === id) checkoutAddrId = null;
    showToast('🗑 地址已删除'); viewAddress(); return;
  }
  if (a.startsWith('saveaddr:')) return saveAddrFromForm(a.slice(9));
  /* ---- 结算页地址选择 ---- */
  if (a.startsWith('pickaddr:')) {
    checkoutAddrId = a.slice(9);
    qsa('.co-addr').forEach(el => el.classList.toggle('on', el.dataset.act === a));
    return;
  }
  if (a === 'checkoutnew') { checkoutNewAddr = true; viewCheckout(); return; }
  if (a === 'checkoutpick') { checkoutNewAddr = false; viewCheckout(); return; }
  if (a === 'incQty') { const v = qs('#qtyVal'); v.value = Math.min(99, Number(v.value) + 1); return; }
  if (a === 'decQty') { const v = qs('#qtyVal'); v.value = Math.max(1, Number(v.value) - 1); return; }
  if (a.startsWith('inc:')) { const it = cart.find(i => i.id === a.slice(4)); it.qty = Math.min(99, it.qty + 1); set(LS.cart, cart); viewCart(); updateCartCount(); return; }
  if (a.startsWith('dec:')) { const it = cart.find(i => i.id === a.slice(4)); it.qty = Math.max(1, it.qty - 1); set(LS.cart, cart); viewCart(); updateCartCount(); return; }
  if (a.startsWith('del:')) { cart = cart.filter(i => i.id !== a.slice(4)); set(LS.cart, cart); viewCart(); updateCartCount(); return; }
  if (a === 'submitOrder') return submitOrder();
  if (a.startsWith('receive:')) return navigate('#/receive/' + a.slice(8));
  if (a.startsWith('confirmReceive:')) return confirmReceive(a.slice(15));
  if (a.startsWith('sign:')) return navigate('#/receive/' + a.slice(5));
  if (a.startsWith('submitReview:')) return submitReview(a.slice(13));
});

/* 规格选择 / 支付方式 / 评分 的局部切换 */
document.addEventListener('click', e => {
  const spec = e.target.closest('#specPick button');
  if (spec) { qsa('#specPick button').forEach(b => b.classList.remove('on')); spec.classList.add('on'); updateProductPrice(); return; }
  const spec2 = e.target.closest('#specPick2 button');
  if (spec2) { qsa('#specPick2 button').forEach(b => b.classList.remove('on')); spec2.classList.add('on'); return; }
  const gthumb = e.target.closest('.gthumb');
  if (gthumb) {
    const main = qs('#galleryMain');
    if (main) main.src = gthumb.dataset.gimg;
    qsa('.gallery-thumbs .gthumb').forEach(t => t.classList.remove('on'));
    gthumb.classList.add('on');
    return;
  }
  const pdTab = e.target.closest('[data-pdtab]');
  if (pdTab) {
    const tab = pdTab.dataset.pdtab;
    qsa('.pd-nav [data-pdtab]').forEach(b => b.classList.toggle('on', b === pdTab));
    qsa('.pd-panel').forEach(panel => { panel.hidden = panel.dataset.pdpanel !== tab; });
    window.scrollTo({ top: qs('.prod-detail').getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' });
    return;
  }
  const pm = e.target.closest('#payMethod button');
  if (pm) { qsa('#payMethod button').forEach(b => b.classList.remove('on')); pm.classList.add('on'); return; }
  const tag = e.target.closest('#a_tagpick button');
  if (tag) { qsa('#a_tagpick button').forEach(b => b.classList.remove('on')); tag.classList.add('on'); return; }
  const st = e.target.closest('#starPick .s');
  if (st) {
    const v = Number(st.dataset.star);
    qsa('#starPick .s').forEach(s => s.classList.toggle('on', Number(s.dataset.star) <= v));
    return;
  }
  const dot = e.target.closest('[data-banner]');
  if (dot) {
    const idx = Number(dot.dataset.banner);
    qsa('#banner .slide').forEach(s => s.classList.remove('on'));
    qsa('#banner .dots i').forEach(d => d.classList.remove('on'));
    qsa('#banner .slide')[idx].classList.add('on');
    dot.classList.add('on');
    return;
  }
});

/* 搜索 */
function doSearch() {
  const q = qs('#searchInput').value.trim();
  if (!q) return;
  lastSearch = q;
  navigate('#/search');
}
qs('#searchBtn').addEventListener('click', doSearch);
qs('#searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });

/* 分类条 */
qs('#catbar').innerHTML = `<div class="cat-chip ${location.hash === '#/home' || !location.hash ? 'active' : ''}" data-act="home">🏠 首页</div>` +
  `<div class="cat-chip special" data-act="seckill">⚡ 秒杀</div>` +
  `<div class="cat-chip special" data-act="coupons">🎟️ 领券</div>` +
  CATEGORIES.map(c => `<div class="cat-chip" data-act="cat:${c.id}"><span class="ic">${c.icon}</span>${c.name}</div>`).join('');

/* 回到顶部按钮 */
function initToTop() {
  const btn = qs('#toTop');
  if (!btn) return;
  const onScroll = () => {
    if (window.scrollY > 400) btn.classList.add('show');
    else btn.classList.remove('show');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  onScroll();
}

/* =========================================================
   在线客服（售前咨询 / 售后帮助）
   人格化小助手「小潮」：无厘头但有料，回答锚定真实商品/订单数据
   ========================================================= */
const PRE_GREET = '👋 嗨～我是潮购小助手「小潮」！买前随便问：参数、价格、库存、发货、真假，我都能接～ 你正在看的这款我也能帮你细说 😎';
const AFTER_GREET = '🛠️ 售后小潮上线！查物流、退换货、开发票、改地址，尽管招呼～ 你最近的订单进度我都能调出来看 👀';

/* 用户口语 → 规格表字段 的同义词映射 */
const SPEC_SYN = [
  { keys: ['像素', '摄像', '镜头', '拍照', '影像'], words: ['像素', '摄像头', '镜头', '拍照', '摄像', '影像'] },
  { keys: ['内存', '存储', '容量', '运存'], words: ['内存', '存储', '容量', '运存', '硬盘'] },
  { keys: ['电池', '续航', '电量'], words: ['电池', '续航', '电量', '毫安', '充电'] },
  { keys: ['屏幕', '分辨率', '显示', '刷新'], words: ['屏幕', '分辨率', '显示屏', '刷新率', '曲面'] },
  { keys: ['处理器', '芯片', 'cpu', '平台'], words: ['处理器', '芯片', 'cpu', '骁龙', '天玑', '麒麟', 'a18', 'a17', 'a16'] },
  { keys: ['重量', '克数'], words: ['重量', '多重', '克'] },
  { keys: ['尺寸', '大小', '英寸'], words: ['尺寸', '大小', '英寸', '长宽', '几寸'] },
  { keys: ['颜色', '配色'], words: ['颜色', '配色', '色号'] },
  { keys: ['系统', '操作系统'], words: ['系统', '操作系统', '安卓', 'ios'] },
  { keys: ['防水', '防护'], words: ['防水', '防护', '防摔'] },
  { keys: ['网络', '制式', '5g'], words: ['网络', '5g', '双卡', '信号', '全网通'] },
];

function matchSpecKey(p, t) {
  if (!p) return null;
  for (const s of SPEC_SYN) {
    if (s.words.some(w => t.includes(w))) {
      const ent = Object.entries(p.specs).find(([k]) => s.keys.some(kk => k.includes(kk)));
      if (ent) return { key: ent[0], value: ent[1] };
    }
  }
  return null;
}
function specVal(p, keys) {
  if (!p) return null;
  const ent = Object.entries(p.specs).find(([k]) => keys.some(kk => k.includes(kk)));
  return ent ? ent[1] : null;
}
/* 手机普遍没有独立的「像素」规格键，影像卖点藏在标题/SKU 里，这里提取出来 */
function camFromText(p) {
  if (!p) return null;
  const s = (p.title || '') + ' ' + (p.sku || '');
  let m = s.match(/(\d+(?:\.\d+)?)\s*万?\s*像素/);
  if (m) return m[0].replace(/\s/g, '');
  m = s.match(/(徕卡|哈苏|蔡司|鹰眼|超聚光|三摄|四摄|双摄|主摄|影像|拍照)\s*[^，,，]{0,6}/);
  if (m) return m[0].trim();
  if (/摄像|镜头|像素|拍照/.test(s)) return '专业影像系统';
  return null;
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function csSpecReply(p, t) {
  if (!p) return '🤖 你现在没点开具体商品耶～ 先点进一款商品，我再帮你细说参数，包准！';
  const m = matchSpecKey(p, t);
  if (m) {
    return `📐 问到点上了！【${p.name}】的「${m.key}」是 **${m.value}**。\n这参数在同档里相当能打，买回去你就是整条街最懂行的人～（参数以虚拟展示为准哈）`;
  }
  const top = Object.entries(p.specs).slice(0, 6);
  const lines = top.map(([k, v]) => `· ${k}：${v}`).join('\n');
  return `📋 【${p.name}】核心参数一览：\n${lines}\n\n还想深挖哪个？直接甩我「电池 / 像素 / 内存」这种关键词就行～`;
}
function csPriceReply(p) {
  if (!p) {
    const c = COUPONS.find(x => x.type === '满减') || COUPONS[0];
    return `💰 具体商品价格得点进商品看哦～ 不过全场常有活动：顶部「领券中心」能领满减/折扣券，结算自动抵。比如「${c.title}」就能省一笔！`;
  }
  const now = p.seckill != null ? p.seckill : p.price;
  const save = p.old - now;
  let s = `💰 【${p.name}】现在价 **${money(now)}**，划线价 ${money(p.old)}，立省 ${money(save)}。`;
  if (p.seckill != null) s += `\n⚡ 重点：它正在⚡限时秒杀！库存剩 ${p.seckillStock ?? '若干'} 件，手慢就抢光啦～`;
  s += `\n${pick(['钱包可能会哭，但你会笑。', '该出手时就出手，犹豫就会败北～', '买它买它，快乐是无价的（除了这件商品有价哈哈）。'])}`;
  return s;
}
function csStockReply(p) {
  if (!p) return '📦 先点开一款商品，我才能告诉你有没有货～ 咱家基本现货充足，虚拟演示不担心断货！';
  if (p.seckill != null) {
    const n = p.seckillStock ?? 0;
    return n > 0 ? `⚡ 秒杀库存还有 **${n}** 件！拍下当天发货，但虚拟秒杀抢完即止，冲鸭！` : `😵 这款秒杀刚被抢光了… 刷新看看有没有补货，或者换款同系的？`;
  }
  return `📦 【${p.name}】现货充足，拍下当天从深圳仓发出～ 咱是虚拟演示，库存不会真变少，放心囤（不是`;
}
function csShipReply() {
  return '🚚 付款后从深圳仓发出，按真实物流时效推进：深圳仓出库 → 经中转枢纽转运 → 派送到您手上，预计 1~2 天送达（写实演示，不秒到）。\n顺丰包邮，慢工出细活，等个一天半天的快递小哥就到啦～';
}
function csWarrantyReply() {
  return '🛡️ 全场假一赔十、全国联保、7 天无理由退换！\n收到货不满意？退！但你得保证没把虚拟商品假装吞下肚哈～ 售后无忧，放心冲。';
}
function csAuthReply() {
  return '✅ 咱家标榜「假一赔十」是演示梗——所有商品图与数据都是本地虚构的虚拟仿真，没有真实专柜同源。\n但快乐是真的！买前问清楚、买后笑哈哈，图的就是个体验感～';
}
function csSeckillReply() {
  const n = SECKILL.length;
  return `⚡ 限时秒杀每天 0 点上新、抢完即止，今日倒计时到 23:59:59！\n现在共有 ${n} 款在秒，手慢无。想抢哪款，我帮你看看还剩多少～`;
}
function csRecommendReply() {
  const hot = [...PRODUCTS].sort((a, b) => b.sales - a.sales).slice(0, 3);
  const lines = hot.map((p, i) => `${i + 1}. ${p.name}（${money(p.seckill != null ? p.seckill : p.price)}）`).join('\n');
  return `🔥 按销量给你挑了仨爆款：\n${lines}\n\n小潮碎碎念：买之前想清楚是犒劳自己还是送人，送人就挑包装好看的，犒劳自己就挑参数香的～`;
}
function csFallback(p) {
  const hint = p ? `你现在看的是【${p.name}】` : '你正在逛潮购';
  return pick([
    `🤖 小潮虽然是个没感情的客服代码，但对你是有感情的！${hint}，你是想问价格、参数、还是发货呀？发个关键词我秒回～`,
    `🌀 这个问题把我问成了旋转木马～ 不过${hint}，具体想问啥？参数 / 价格 / 库存 / 物流 / 售后，挑一个我给你整明白！`,
    `🍜 小潮刚偷偷煮了碗虚拟泡面，回神了！${hint}，你说具体点，比如「电池多少」「现在啥价」，我立马给你掰扯～`,
  ]);
}
function courierNameOf(o) {
  const d = o.logistics.find(n => n.status === 'delivering');
  if (d) { const m = d.desc.match(/【(.+?) /); if (m) return m[1]; }
  return '';
}
function courierWindowOf(o) {
  const d = o.logistics.find(n => n.status === 'delivering');
  return d && d.window ? d.window : '';
}

function csOrderStatusText() {
  if (!orders.length) return '📭 你还没有订单哦～ 先去挑件心头好，下单后我就能帮你盯物流啦！';
  const o = ([...orders].reverse().find(x => x.status !== 'waitpay')) || orders[orders.length - 1];
  const p = PRODUCT_MAP[o.items[0].id];
  if (o.status === 'waitpay') return `💳 订单 ${o.orderId} 还在待付款，付完款我就开始帮你盯物流～ 去「我的订单」点「去支付」就行！`;
  const now = vnow();
  const rev = o.logistics.filter(n => n.t <= now);
  const cur = rev[rev.length - 1] || o.logistics[0];
  const statusText = o.status === 'delivered' ? '已签收 📦' : (o.arrived ? '已送达，待确认收货 📦' : (cur.status === 'delivering' ? '派送中 🛵' : getShipText(o)));
  const cName = courierNameOf(o);
  const cWin = courierWindowOf(o);
  const tail = o.status === 'delivered' ? '已送达，记得去评价晒单呀～' : (o.arrived ? '包裹已到你手上，去「我的订单」点「确认收货」就能评价啦～' : (cur.status === 'delivering' ? (cName ? `快递员${cName}正在飞奔向你！${cWin ? '（' + cWin + '）' : ''}` : '快递员正在飞奔向你！') : '物流正在路上，请稍候～'));
  return `📦 订单 ${o.orderId}（${p.name}）：${statusText}。\n最新动态：${cur.desc}\n${tail}`;
}
function csAfterReply(text, t) {
  if (/订单|到哪|物流|快递|发货|进度|查/.test(t)) return csOrderStatusText();
  if (/退货|退款|退换|无理由|七天|退/.test(t)) return '↩️ 申请退换：订单页点「查看物流」，签收后点「去评价」旁就能发起退货；7 天无理由，运费咱虚拟承担～ 不过虚拟商品退了可就没啦，想清楚哦！';
  if (/发票|开票|报销/.test(t)) return '🧾 虚拟演示不支持真开发票哈～ 但你要的话，小潮给你开一张「快乐体验专用电子发票」，金额填你今天的开心值💯';
  if (/地址|改地址|填错|收货/.test(t)) return '📍 地址填错了？未发货前在「我的订单」里能看到，付款前在结算页直接改就行～ 已发货就改不了啦（虚拟快递员认死理）。';
  if (/投诉|差评|维权|骗|垃圾|烂|生气|坑/.test(t)) return '😤 别急别急！虽然咱是虚拟商城没有真投诉通道，但你骂两句小潮能接住～ 具体哪不满意？商品、物流还是价格？我记小本本上（虚拟版）！';
  if (/催|快点|加速|加急|等不及|慢/.test(t)) return '🚀 已经用虚拟对讲机催快递员啦！他正按真实路线稳稳派送，预计 1~2 天送达，您稍安勿躁～';
  return pick([
    '🛠️ 售后小潮在线～ 查物流、退换货、开发票、改地址都能问我。具体说哪个？',
    '🤖 售后问题尽管抛过来！你是想查订单到哪了，还是想退货 / 开发票？发关键词我秒懂～',
  ]);
}
function csReply(text) {
  const t = text.toLowerCase();
  const p = (currentRoute === 'product') ? PRODUCT_MAP[currentParam] : null;
  if (/^(你好|您好|hi|hello|在吗|在么|有人吗|哈喽|嗨)/.test(t)) {
    return pick(['👋 在的在的！小潮 24 小时待机（毕竟不用睡觉）。有啥想问的？', '🤖 你一喊，小潮就蹦出来了～ 问价格、问参数、问发货，我都能接！']);
  }
  if (/谢谢|感谢|多谢|蟹蟹|辛苦/.test(t)) {
    return pick(['🥰 嘿嘿不客气～ 能帮上你就好，买得开心最重要！', '😎 小事一桩，记得常来找小潮唠嗑～']);
  }
  if (csTab !== 'pre') return csAfterReply(text, t);

  /* 相机/像素类：手机无独立像素规格键，从标题/SKU 卖点里提取 */
  if (/像素|摄像头|镜头|拍照|摄像|影像/.test(t)) {
    const cam = camFromText(p);
    const specCam = matchSpecKey(p, t);
    const val = cam || (specCam && specCam.value);
    if (val) return `📷 【${p.name}】影像是卖点之一：**${val}**！出片质感在线，发朋友圈稳赢～（具体以虚拟展示为准哈）`;
  }

  if (/参数|规格|配置|怎么样|介绍|详情|数据/.test(t) || matchSpecKey(p, t)) return csSpecReply(p, t);
  if (/价格|多少钱|报价|贵|便宜|优惠|活动|折扣|打折|券|满减|立减|折|省/.test(t)) return csPriceReply(p);
  if (/有货|库存|现货|还有|能买|抢光|没货|断货|补货|几件/.test(t)) return csStockReply(p);
  if (/发货|物流|快递|多久|几天|到手|配送|包邮|顺丰|派送/.test(t)) return csShipReply();
  if (/保修|售后|质保|退换|退货|退款|七天|无理由|假一赔|维修|坏了|质量/.test(t)) return csWarrantyReply();
  if (/正品|真假|假货|官方|专柜|授权|防伪|同源|靠谱/.test(t)) return csAuthReply();
  if (/颜色|配色|色号|色/.test(t)) {
    const c = specVal(p, ['颜色', '配色']);
    if (c) return `🎨 这款有这些配色：${c}。小潮私心觉得每个都好看，闭眼入不踩雷～`;
  }
  if (/秒杀|抢购|限时|疯抢|抢/.test(t)) return csSeckillReply();
  if (/领券|优惠券|怎么领|券中心/.test(t)) return '🎟️ 点顶部「领券中心」就能领～ 结算时自动抵扣。满300减50、奢侈品满5万减3000都有，领了不亏！';
  if (/推荐|买哪个|选哪个|值得买|买啥|送人|礼物|种草/.test(t)) return csRecommendReply();
  if (/区别|对比|哪个好|比一比|vs|哪个强|性价比|咋样/.test(t)) return pick([
    '🆚 比配置？比价格？还是比谁更让你心动？具体说俩型号，小潮给你掰扯掰扯～',
    '⚖️ 同价位里咱家商品都很能打，但具体哪款香，得看你是看中影像、续航还是钱包厚度哈哈～',
  ]);
  return csFallback(p);
}
function csAppend(who, text) {
  const div = document.createElement('div');
  div.className = 'cs-msg ' + who;
  div.textContent = text;
  csBodyEl.appendChild(div);
  csBodyEl.scrollTop = csBodyEl.scrollHeight;
}
function csSend(text) {
  text = (text || '').trim();
  if (!text) return;
  csAppend('me', text);
  csInputEl.value = '';
  const typing = document.createElement('div');
  typing.className = 'cs-msg bot typing';
  typing.innerHTML = '<span></span><span></span><span></span>';
  csBodyEl.appendChild(typing);
  csBodyEl.scrollTop = csBodyEl.scrollHeight;
  setTimeout(() => {
    typing.remove();
    csAppend('bot', csReply(text));
  }, 420 + Math.random() * 380);
}
function renderCsQuick() {
  let list;
  if (csTab === 'after') {
    list = ['我的快递到哪了？', '怎么申请退货？', '我要开发票', '地址填错了咋办'];
  } else if (currentRoute === 'product' && PRODUCT_MAP[currentParam]) {
    const p = PRODUCT_MAP[currentParam];
    list = [`「${p.name}」参数是啥？`, '现在什么价？能优惠不？', '有现货吗？', '支持7天无理由吗？'];
  } else {
    list = ['怎么领优惠券？', '有什么值得买的？', '秒杀几点结束？', '都是正品吗？'];
  }
  csQuickEl.innerHTML = list.map(q => `<button data-q="${esc(q)}">${esc(q)}</button>`).join('');
}
function initCS() {
  csPanelEl = qs('#csPanel');
  csBodyEl = qs('#csBody');
  csQuickEl = qs('#csQuick');
  csInputEl = qs('#csInput');
  const fab = qs('#csFab');
  const close = qs('#csClose');
  fab.addEventListener('click', () => {
    csPanelEl.hidden = false;
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => csPanelEl.classList.add('open'));
    else csPanelEl.classList.add('open');
    if (!csGreeted) { csGreeted = true; csAppend('bot', csTab === 'pre' ? PRE_GREET : AFTER_GREET); }
    renderCsQuick();
    csInputEl.focus();
  });
  close.addEventListener('click', () => {
    csPanelEl.classList.remove('open');
    setTimeout(() => { csPanelEl.hidden = true; }, 280);
  });
  qs('#csSend').addEventListener('click', () => csSend(csInputEl.value));
  csInputEl.addEventListener('keydown', e => { if (e.key === 'Enter') csSend(csInputEl.value); });
  qsa('.cs-tabs button').forEach(b => b.addEventListener('click', () => {
    qsa('.cs-tabs button').forEach(x => x.classList.remove('on'));
    b.classList.add('on');
    csTab = b.dataset.cstab === 'after' ? 'after' : 'pre';
    csBodyEl.innerHTML = '';
    csAppend('bot', csTab === 'pre' ? PRE_GREET : AFTER_GREET);
    renderCsQuick();
  }));
  csQuickEl.addEventListener('click', e => {
    const chip = e.target.closest('[data-q]');
    if (chip) csSend(chip.dataset.q);
  });
}

/* 启动 */
initAddrBook();
initUserReviews();
window.addEventListener('hashchange', render);
updateCartCount();
initToTop();
initCS();
renderWxUser();
render();
