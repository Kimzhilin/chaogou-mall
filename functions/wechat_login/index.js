/**
 * 潮购 · 微信登录后端（云函数骨架）
 * -------------------------------------------------------------
 * 作用：完成公众号 OAuth2 网页授权，拿到用户的 openid / 昵称 / 头像，
 *       再带着一个登录态 token 跳回前端，实现「不同微信账号看各自订单」。
 *
 * 部署目标（任选其一，均免费额度可用）：
 *   1) 微信云开发 CloudBase 云函数（国内访问快，且与微信同生态，推荐）
 *      - 在云开发控制台新建 Node 云函数，把本文件作为入口；
 *      - 在「登录鉴权 → 微信」中开启，或直接用本函数的 code 换 openid 逻辑。
 *   2) Vercel / Cloudflare Pages Functions / 任意 Node Serverless
 *      - 把本文件改成对应平台的入口签名即可（见文件底部多平台适配示例）。
 *
 * 环境变量（务必在平台后台配置，不要写死在前端）：
 *   WECHAT_APPID     公众号 / 微信开放平台 的 AppID
 *   WECHAT_APPSECRET 对应的 AppSecret
 *   FRONTEND_ORIGIN  前端站点域名，用于回调跳转白名单拼接
 *
 * 前端配合：把 app.js 顶部的 WECHAT_BACKEND 填成「本云函数的对外访问地址」，
 *           把 WECHAT_APPID 填成同一个 AppID 即可切到真实登录。
 * -------------------------------------------------------------
 */
const APPID = process.env.WECHAT_APPID || '';
const SECRET = process.env.WECHAT_APPSECRET || '';
const FRONTEND = process.env.FRONTEND_ORIGIN || '';

/** 微信 OAuth 换取 openid + 用户信息 */
async function exchangeCode(code) {
  const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${APPID}&secret=${SECRET}&code=${code}&grant_type=authorization_code`;
  const tk = await (await fetch(tokenUrl)).json();
  if (tk.errcode) throw new Error('换取 access_token 失败: ' + tk.errmsg);
  let user = { openid: tk.openid };
  // snsapi_userinfo 可拿到昵称/头像
  if (tk.access_token) {
    const infoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${tk.access_token}&openid=${tk.openid}&lang=zh_CN`;
    const info = await (await fetch(infoUrl)).json();
    if (!info.errcode) user = { openid: tk.openid, nickname: info.nickname, avatar: info.headimgurl };
  }
  return user;
}

/** 前端入口处理：按 path 分流 */
async function handle(reqUrl) {
  const u = new URL(reqUrl);
  const p = u.pathname.replace(/\/$/, '');

  // 1) 发起授权：跳微信
  if (p.endsWith('/wechat/login') || p.endsWith('/login')) {
    const redirect = u.searchParams.get('redirect') || (FRONTEND + '/');
    const cb = (FRONTEND ? '' : '') + (process.env.BACKEND_ORIGIN || '') + '/wechat/callback';
    const auth = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}`
      + `&redirect_uri=${encodeURIComponent(cb)}`
      + `&response_type=code&scope=snsapi_userinfo&state=${encodeURIComponent(redirect)}#wechat_redirect`;
    return { status: 302, headers: { Location: auth }, body: '' };
  }

  // 2) 微信回调：用 code 换用户，再跳回前端并带上 wx_token
  if (p.endsWith('/wechat/callback') || p.endsWith('/callback')) {
    const code = u.searchParams.get('code');
    const state = u.searchParams.get('state') || (FRONTEND + '/');
    if (!code) return { status: 400, body: '缺少 code' };
    try {
      const user = await exchangeCode(code);
      const token = encodeURIComponent(JSON.stringify(user));
      const sep = state.includes('?') ? '&' : '?';
      return { status: 302, headers: { Location: state + sep + 'wx_token=' + token }, body: '' };
    } catch (e) {
      return { status: 500, body: e.message };
    }
  }

  return { status: 200, body: '潮购微信登录后端就绪。' };
}

/* ---------------- 多平台入口适配 ---------------- */
// CloudBase 云函数
if (typeof module !== 'undefined') {
  module.exports = { main: async (event) => {
    const r = await handle(event.httpMethod ? (event.headers?.['x-forwarded-proto'] || 'https') + '://x' + (event.path || '/') + (event.queryString || '') : (event.url || '/'));
    return r;
  }};
}
// 通用 Node（Vercel/Cloudflare/Express）导出
if (typeof module !== 'undefined' && (process.env.VERCEL || process.env.CF_PAGES || process.env.NODE_HANDLER)) {
  module.exports = async (req, res) => {
    const r = await handle(req.url);
    res.status(r.status);
    Object.entries(r.headers || {}).forEach(([k, v]) => res.setHeader(k, v));
    res.end(r.body);
  };
}
