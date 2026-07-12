/* =========================================================
   虚拟商城 · 数据层（V3：真实商品图 + 秒杀 + 优惠券 + 营销图 + 商品介绍/参数）
   所有商品、评价、物流、价格均为虚拟数据，不涉及任何真实交易
   ========================================================= */

const SITE_NAME = '潮购';

const CATEGORIES = [
  { id: 'phone',   name: '手机数码', icon: '📱' },
  { id: 'laptop',  name: '电脑办公', icon: '💻' },
  { id: 'drone',   name: '无人机',   icon: '🚁' },
  { id: 'luxury',  name: '奢侈品',   icon: '👜' },
  { id: 'watch',   name: '智能穿戴', icon: '⌚' },
  { id: 'game',    name: '影音游戏', icon: '🎮' },
  { id: 'camera',  name: '相机摄影', icon: '📷' },
  { id: 'home',    name: '家用电器', icon: '🧹' },
  { id: 'beauty',  name: '美妆个护', icon: '💄' },
  { id: 'sport',   name: '运动户外', icon: '🏃' },
  { id: 'auto',    name: '汽车用品', icon: '🚗' },
  { id: 'smart',   name: '智能家居', icon: '💡' },
  { id: 'fashion', name: '服饰鞋包', icon: '👕' },
  { id: 'baby',    name: '母婴亲子', icon: '🍼' },
  { id: 'food',    name: '食品酒水', icon: '🍷' },
  { id: 'jewelry', name: '珠宝配饰', icon: '💎' },
  { id: 'toy',       name: '潮玩玩具', icon: '🧸' },
  { id: 'pet',       name: '宠物智能', icon: '🐾' },
  { id: 'furniture', name: '家具家装', icon: '🛋️' },
  { id: 'music',     name: '乐器',     icon: '🎸' },
];

const CAT_NAME = Object.fromEntries(CATEGORIES.map(c => [c.id, c.name]));

/* 评价文案池（按品类给点差异化口吻） */
const REVIEW_TEXTS = {
  phone:  ['手感非常棒，屏幕细腻，拍照直接封神！', '物流神速，第二天就到，续航也很顶。', '外观高级，系统丝滑，这钱花得值。', '比预想还好，客服也耐心。'],
  laptop: ['做工精致，性能炸裂，剪片无压力。', '屏幕色彩准，键盘手感舒服。', '散热比上代好太多，爱了。', '包装严实，开机即用，满意。'],
  drone:  ['航拍画质惊艳，图传稳得一批。', '避障很聪明，新手也能飞。', '折叠便携，出门随手拍大片。', '穿越机太爽了，性价比高。'],
  luxury: ['皮质细腻，做工无可挑剔，专柜同款。', '背出去很有面儿，朋友都问链接。', '经典不过时，值得收藏。', '包装高级，送人自用都体面。'],
  watch:  ['表盘好看，健康监测很准。', '续航惊喜，一周一充。', '运动记录详细，买值了。', '颜值在线，日常百搭。'],
  game:   ['降噪绝了，沉浸式听歌。', '主机画质拉满，玩到停不下来。', 'VR 体验超出预期，真香。', '音箱低音浑厚，氛围感拉满。'],
  camera: ['画质惊艳，对焦飞快，出片率高。', '微单轻巧，带出门毫无压力。', '视频防抖强，vlog 神器。', '色彩科学讨喜，直出好看。'],
  home:   ['吸力强劲，地板一尘不染。', '吹风机护发，头发顺滑。', '空调静音又省电，夏天救星。', '扫拖机器人解放双手，真香。'],
  beauty: ['吸收快，用一周皮肤透亮了。', '味道高级，回购无数次。', '面霜滋润不油腻，敏感肌友好。', '神仙水真的神，闭眼入。'],
  sport:  ['脚感舒服，配速都快了。', '瑜伽裤显瘦，暴汗也透气。', '公路车骑行顺滑，通勤神器。', '冲锋衣防风防水，爬山必备。'],
  auto:   ['充电桩安装方便，回家就满电。', '记录仪清晰，夜视也强。', '净化器安静，车内空气好了。', '性价比高，车里必备。'],
  smart:  ['门锁灵敏，再也不怕忘带钥匙。', '音箱音质好，全屋智能真方便。', '台灯护眼，孩子写作业用着好。', '联动顺畅，科技感拉满。'],
  fashion:['羽绒服轻便保暖，冬天靠它。', '鞋子复古好看，搭配神器。', '质量超出预期，版型正。', '面料舒服，日常百搭。'],
  baby:   ['推车轻便，单手收车超方便。', '材质安全，宝宝用着放心。', '设计贴心，宝妈福音。', '颜值高，出门回头率高。'],
  food:   ['正品无疑，口感醇厚，回购了。', '礼盒体面，送人有面子。', '性价比高，囤货必备。', '日期新鲜，物流给力。'],
  jewelry:['做工精致，闪到心动。', '款式经典，百搭耐看。', '包装高级，送礼物合适。', '质感超出预期，满意。'],
  toy:   ['做工细腻，细节满分，摆桌上超治愈。', '盲盒开出了隐藏款，运气爆棚！', '手感好，送朋友他超喜欢。', '质量比想象中好，回购了。'],
  pet:   ['再也不用惦记主子饿肚子，太省心。', '静音设计，夜里完全不影响睡觉。', 'APP 一看就知道它状态，安心。', '毛孩子用着舒服，我也轻松。'],
  furniture:['坐一天腰也不酸了，人体工学果然有用。', '灯光柔和不刺眼，看书很舒服。', '做工扎实，放家里很有质感。', '升降顺滑，站着办公真香。'],
  music: ['音色通透，弹起来心情都好了。', '做工扎实，新手也很容易上手。', '颜值在线，摆客厅很有氛围。', '性价比高，练琴动力拉满。'],
};

const USER_NAMES = ['淘宝用户****8821', '数码控****1199', '买家****3366', '甜筒****520', '阿白****0731', '风铃****8848', '小鹿****2026', '海风****6611', '可乐****009', '星河****315', '柚子****2048', '北辰****777'];
const REVIEW_DATES = ['2026-06-28', '2026-06-30', '2026-07-01', '2026-07-03', '2026-07-05', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10'];

function buildReviews(cat, ratingBase, n = 4) {
  const pool = REVIEW_TEXTS[cat] || REVIEW_TEXTS.phone;
  const out = [];
  for (let i = 0; i < n; i++) {
    const r = Math.max(4, Math.min(5, ratingBase + (Math.random() < 0.5 ? 0 : (Math.random() < 0.4 ? -1 : 0))));
    out.push({
      user: USER_NAMES[(i * 3 + Math.floor(Math.random() * USER_NAMES.length)) % USER_NAMES.length],
      rating: r,
      text: pool[(i + Math.floor(Math.random() * pool.length)) % pool.length],
      date: REVIEW_DATES[Math.floor(Math.random() * REVIEW_DATES.length)],
      sku: ['红色', '黑色', '蓝色', '标准版', '礼盒装'][Math.floor(Math.random() * 5)],
    });
  }
  return out;
}

/* 商品列表（虚拟数据）—— 每件带真实商品图 img/pNNN.jpg */
const PRODUCTS_RAW = [
  // 手机数码
  { cat: 'phone', name: 'Apple iPhone 16 Pro Max', brand: 'Apple', sku: '1TB 暗紫色 · A18 Pro', price: 11999, old: 12999, rating: 4.9, sales: 23000, img: 'img/p001.jpg' },
  { cat: 'phone', name: '华为 Mate 70 Pro+', brand: '华为', sku: '16GB+1TB 鸿蒙旗舰', price: 8999, old: 9999, rating: 4.9, sales: 18000, img: 'img/p002.jpg' },
  { cat: 'phone', name: '小米 15 Ultra', brand: '小米', sku: '徕卡四摄 影像旗舰', price: 6499, old: 6999, rating: 4.8, sales: 31000, img: 'img/p003.jpg' },
  { cat: 'phone', name: '三星 Galaxy S25 Ultra', brand: 'Samsung', sku: '2亿像素 AI 旗舰', price: 9699, old: 10499, rating: 4.7, sales: 9000, img: 'img/p004.jpg' },
  { cat: 'phone', name: '荣耀 Magic7 Pro', brand: '荣耀', sku: '鹰眼相机 长续航', price: 5499, old: 5999, rating: 4.8, sales: 12000, img: 'img/p005.jpg' },
  { cat: 'phone', name: 'OnePlus 13', brand: 'OnePlus', sku: '24GB+1TB 哈苏影像', price: 4999, old: 5499, rating: 4.8, sales: 14000, img: 'img/p065.jpg' },
  { cat: 'phone', name: 'OPPO Find X8 Pro', brand: 'OPPO', sku: '16GB+512GB 天玑9400', price: 5999, old: 6499, rating: 4.8, sales: 12000, img: 'img/p066.jpg' },
  { cat: 'phone', name: 'vivo X200 Pro', brand: 'vivo', sku: '16GB+512GB 蔡司2亿', price: 5999, old: 6499, rating: 4.8, sales: 13000, img: 'img/p067.jpg' },
  { cat: 'phone', name: '荣耀 Magic7 RSR', brand: '荣耀', sku: '24GB+1TB 保时捷设计', price: 7999, old: 8999, rating: 4.9, sales: 4000, img: 'img/p068.jpg' },
  { cat: 'phone', name: '三星 Galaxy Z Fold7', brand: 'Samsung', sku: '12GB+512GB 折叠屏', price: 13999, old: 14999, rating: 4.8, sales: 5000, img: 'img/p069.jpg' },
  { cat: 'phone', name: 'Google Pixel 9 Pro', brand: 'Google', sku: '16GB+256GB Tensor G4', price: 6999, old: 7499, rating: 4.7, sales: 3000, img: 'img/p070.jpg' },
  // 电脑办公
  { cat: 'laptop', name: 'MacBook Pro 16 M4 Max', brand: 'Apple', sku: '32核 顶配工作站', price: 23999, old: 25999, rating: 4.9, sales: 6000, img: 'img/p006.jpg' },
  { cat: 'laptop', name: '华为 MateBook X Pro', brand: '华为', sku: '超轻薄 触控屏', price: 11999, old: 12999, rating: 4.8, sales: 4000, img: 'img/p007.jpg' },
  { cat: 'laptop', name: 'ThinkPad X1 Carbon', brand: '联想', sku: '商务旗舰 碳纤维', price: 14999, old: 16999, rating: 4.8, sales: 3000, img: 'img/p008.jpg' },
  { cat: 'laptop', name: 'Redmi Book Pro 16', brand: '小米', sku: '3.1K 高刷屏', price: 5499, old: 5999, rating: 4.7, sales: 15000, img: 'img/p009.jpg' },
  { cat: 'laptop', name: 'ROG 枪神8 游戏本', brand: '华硕', sku: 'RTX5090 电竞', price: 17999, old: 19999, rating: 4.8, sales: 5000, img: 'img/p010.jpg' },
  { cat: 'laptop', name: 'MacBook Air 15 M4', brand: 'Apple', sku: '15英寸 M4 星光色', price: 9999, old: 10999, rating: 4.9, sales: 9000, img: 'img/p071.jpg' },
  { cat: 'laptop', name: 'MacBook Pro 14 M4 Pro', brand: 'Apple', sku: '14英寸 M4 Pro 深空黑', price: 14999, old: 16999, rating: 4.9, sales: 5000, img: 'img/p072.jpg' },
  { cat: 'laptop', name: 'Dell XPS 15', brand: 'Dell', sku: '15.6英寸 OLED', price: 12999, old: 13999, rating: 4.7, sales: 3000, img: 'img/p073.jpg' },
  { cat: 'laptop', name: '华为 MateBook 14', brand: '华为', sku: '14英寸 2.8K触控', price: 5999, old: 6499, rating: 4.8, sales: 6000, img: 'img/p074.jpg' },
  { cat: 'laptop', name: 'ROG 幻16 Air', brand: '华硕', sku: '16英寸 轻薄电竞', price: 13999, old: 14999, rating: 4.8, sales: 4000, img: 'img/p075.jpg' },
  { cat: 'laptop', name: 'MSI 泰坦 18', brand: 'MSI', sku: '18英寸 RTX5090', price: 25999, old: 27999, rating: 4.8, sales: 1500, img: 'img/p076.jpg' },
  // 无人机
  { cat: 'drone', name: 'DJI Mavic 4 Pro', brand: '大疆', sku: '哈苏主摄 旗舰', price: 13888, old: 14888, rating: 4.9, sales: 4000, img: 'img/p011.jpg' },
  { cat: 'drone', name: 'DJI Air 3S', brand: '大疆', sku: '双摄轻旗舰', price: 6988, old: 7588, rating: 4.8, sales: 7000, img: 'img/p012.jpg' },
  { cat: 'drone', name: 'DJI Mini 4 Pro', brand: '大疆', sku: '249g 迷你机', price: 4788, old: 5188, rating: 4.8, sales: 11000, img: 'img/p013.jpg' },
  { cat: 'drone', name: 'DJI Avata 2', brand: '大疆', sku: '第一人称穿越机', price: 6999, old: 7699, rating: 4.7, sales: 3000, img: 'img/p014.jpg' },
  { cat: 'drone', name: 'DJI FPV', brand: '大疆', sku: '沉浸式 穿越套装', price: 6999, old: 7699, rating: 4.7, sales: 3000, img: 'img/p079.jpg' },
  { cat: 'drone', name: 'DJI Inspire 3', brand: '大疆', sku: '8K 电影机', price: 79888, old: 85888, rating: 4.9, sales: 400, img: 'img/p080.jpg' },
  { cat: 'drone', name: 'Autel EVO Lite+', brand: 'Autel', sku: '8K 旗舰', price: 5488, old: 5988, rating: 4.7, sales: 3500, img: 'img/p081.jpg' },
  { cat: 'drone', name: '道通 EVO Max 4T', brand: '道通', sku: '行业级 双光', price: 32888, old: 35888, rating: 4.8, sales: 300, img: 'img/p082.jpg' },
  { cat: 'drone', name: '司马 X30', brand: '司马', sku: '入门 4K', price: 999, old: 1299, rating: 4.5, sales: 12000, img: 'img/p083.jpg' },
  // 奢侈品
  { cat: 'luxury', name: 'LV Neverfull 中号', brand: 'Louis Vuitton', sku: '经典 Monogram 托特', price: 16800, old: 17800, rating: 4.9, sales: 2000, img: 'img/p015.jpg' },
  { cat: 'luxury', name: 'Rolex 潜航者型', brand: '劳力士', sku: '黑水鬼 自动机械', price: 86800, old: 92800, rating: 5.0, sales: 500, img: 'img/p016.jpg' },
  { cat: 'luxury', name: 'Gucci GG Marmont', brand: '古驰', sku: '相机包 复古', price: 18900, old: 20500, rating: 4.8, sales: 1500, img: 'img/p017.jpg' },
  { cat: 'luxury', name: 'Chanel Classic Flap', brand: '香奈儿', sku: '中号 菱格链条', price: 79800, old: 85800, rating: 5.0, sales: 300, img: 'img/p018.jpg' },
  { cat: 'luxury', name: 'Hermès 真丝丝巾', brand: '爱马仕', sku: '90cm 印花', price: 4200, old: 4600, rating: 4.9, sales: 4000, img: 'img/p019.jpg' },
  { cat: 'luxury', name: 'Cartier Love 手镯', brand: '卡地亚', sku: '18K 玫瑰金', price: 68500, old: 72800, rating: 4.9, sales: 600, img: 'img/p020.jpg' },
  { cat: 'luxury', name: 'Patek Philippe 百达翡丽 Nautilus', brand: 'Patek Philippe', sku: '鹦鹉螺 钢壳', price: 268000, old: 288000, rating: 5.0, sales: 80, img: 'img/p092.jpg' },
  { cat: 'luxury', name: 'Audemars Piguet 皇家橡树', brand: 'Audemars Piguet', sku: '八角 精钢', price: 228000, old: 248000, rating: 5.0, sales: 60, img: 'img/p093.jpg' },
  { cat: 'luxury', name: 'Cartier 蓝气球', brand: 'Cartier', sku: '男士 蓝盘', price: 58000, old: 62800, rating: 4.9, sales: 400, img: 'img/p094.jpg' },
  { cat: 'luxury', name: 'Omega 欧米茄 星座', brand: 'Omega', sku: '同轴 机械', price: 42800, old: 46800, rating: 4.9, sales: 500, img: 'img/p095.jpg' },
  { cat: 'luxury', name: 'Hermès Birkin 25', brand: 'Hermès', sku: '牛皮 手提', price: 128000, old: 138000, rating: 5.0, sales: 120, img: 'img/p096.jpg' },
  { cat: 'luxury', name: 'Hermès Kelly 28', brand: 'Hermès', sku: '经典 手提', price: 118000, old: 128000, rating: 5.0, sales: 100, img: 'img/p097.jpg' },
  { cat: 'luxury', name: 'Dior Lady Dior', brand: 'Dior', sku: '中号 菱格', price: 36800, old: 39800, rating: 4.9, sales: 350, img: 'img/p098.jpg' },
  { cat: 'luxury', name: 'Celine Luggage', brand: 'Celine', sku: '笑脸包', price: 19800, old: 21800, rating: 4.8, sales: 600, img: 'img/p099.jpg' },
  { cat: 'luxury', name: 'Fendi Peekaboo', brand: 'Fendi', sku: '小怪兽', price: 22800, old: 24800, rating: 4.8, sales: 500, img: 'img/p100.jpg' },
  { cat: 'luxury', name: 'LV Capucines', brand: 'Louis Vuitton', sku: '中号 手提', price: 35800, old: 38800, rating: 4.9, sales: 300, img: 'img/p101.jpg' },
  { cat: 'luxury', name: '茅台 15年年份酒', brand: '茅台', sku: '15年 陈酿 礼盒', price: 5999, old: 6599, rating: 4.9, sales: 3000, img: 'img/p102.jpg' },
  { cat: 'luxury', name: 'Macallan 麦卡伦 18年', brand: 'Macallan', sku: '18年 单一麦芽', price: 2680, old: 2980, rating: 4.8, sales: 4000, img: 'img/p103.jpg' },
  // 智能穿戴
  { cat: 'watch', name: 'Apple Watch Ultra 2', brand: 'Apple', sku: '钛金属 户外款', price: 6499, old: 6999, rating: 4.8, sales: 9000, img: 'img/p021.jpg' },
  { cat: 'watch', name: '华为 Watch GT 5 Pro', brand: '华为', sku: '蓝宝石 运动健康', price: 2488, old: 2688, rating: 4.8, sales: 16000, img: 'img/p022.jpg' },
  { cat: 'watch', name: 'Garmin Fenix 8', brand: '佳明', sku: '多功能户外旗舰', price: 7980, old: 8580, rating: 4.9, sales: 3000, img: 'img/p023.jpg' },
  { cat: 'watch', name: '小米手环 9 Pro', brand: '小米', sku: '血氧心率 大屏', price: 399, old: 449, rating: 4.7, sales: 52000, img: 'img/p024.jpg' },
  { cat: 'watch', name: '浪琴 名匠', brand: '浪琴', sku: '自动机械 皮带', price: 12800, old: 13800, rating: 4.8, sales: 2500, img: 'img/p077.jpg' },
  { cat: 'watch', name: '天梭 力洛克', brand: '天梭', sku: '机械 白盘', price: 4200, old: 4600, rating: 4.7, sales: 6000, img: 'img/p078.jpg' },
  // 影音游戏
  { cat: 'game', name: 'Sony WH-1000XM5', brand: '索尼', sku: '头戴降噪耳机', price: 2499, old: 2899, rating: 4.8, sales: 24000, img: 'img/p025.jpg' },
  { cat: 'game', name: 'PlayStation 5 Pro', brand: '索尼', sku: '4K 游戏主机', price: 5999, old: 6499, rating: 4.9, sales: 11000, img: 'img/p026.jpg' },
  { cat: 'game', name: 'Nintendo Switch 2', brand: '任天堂', sku: '掌机新作', price: 3499, old: 3799, rating: 4.9, sales: 20000, img: 'img/p027.jpg' },
  { cat: 'game', name: 'Bose SoundLink', brand: 'Bose', sku: '便携蓝牙音箱', price: 1899, old: 2199, rating: 4.7, sales: 8000, img: 'img/p028.jpg' },
  { cat: 'game', name: 'Meta Quest 3S', brand: 'Meta', sku: 'VR 一体机', price: 2999, old: 3299, rating: 4.7, sales: 6000, img: 'img/p029.jpg' },
  // 相机摄影
  { cat: 'camera', name: 'Sony A7M5', brand: '索尼', sku: '全画幅微单', price: 18999, old: 20999, rating: 4.9, sales: 3500, img: 'img/p030.jpg' },
  { cat: 'camera', name: '佳能 EOS R6 II', brand: '佳能', sku: '微单 适配', price: 15999, old: 17999, rating: 4.8, sales: 2800, img: 'img/p031.jpg' },
  { cat: 'camera', name: '大疆 Osmo Pocket 3', brand: '大疆', sku: '口袋云台相机', price: 3499, old: 3999, rating: 4.8, sales: 14000, img: 'img/p032.jpg' },
  { cat: 'camera', name: 'GoPro Hero 13', brand: 'GoPro', sku: '运动相机', price: 2999, old: 3299, rating: 4.7, sales: 9000, img: 'img/p033.jpg' },
  { cat: 'camera', name: 'DJI Osmo Action 5 Pro', brand: '大疆', sku: '防水 运动相机', price: 2599, old: 2999, rating: 4.8, sales: 8000, img: 'img/p084.jpg' },
  { cat: 'camera', name: 'Insta360 ONE X4', brand: '影石', sku: '8K 360 全景', price: 3799, old: 4199, rating: 4.8, sales: 7000, img: 'img/p085.jpg' },
  { cat: 'camera', name: 'Insta360 GO 3S', brand: '影石', sku: '拇指 全景', price: 2499, old: 2799, rating: 4.7, sales: 5000, img: 'img/p086.jpg' },
  { cat: 'camera', name: 'Insta360 X3', brand: '影石', sku: '360 全景', price: 2999, old: 3299, rating: 4.7, sales: 6000, img: 'img/p087.jpg' },
  { cat: 'camera', name: 'Ricoh 理光 Theta X', brand: 'Ricoh', sku: '360 球面', price: 4299, old: 4699, rating: 4.6, sales: 2000, img: 'img/p088.jpg' },
  { cat: 'camera', name: 'Sony ZV-1 II', brand: '索尼', sku: 'Vlog 便携', price: 4999, old: 5499, rating: 4.8, sales: 4000, img: 'img/p089.jpg' },
  { cat: 'camera', name: 'Fujifilm X100VI', brand: 'Fujifilm', sku: '复古 旁轴', price: 9990, old: 10990, rating: 4.9, sales: 3500, img: 'img/p090.jpg' },
  { cat: 'camera', name: '影石 Ace Pro', brand: '影石', sku: '运动相机', price: 2999, old: 3299, rating: 4.7, sales: 5500, img: 'img/p091.jpg' },
  // 家用电器
  { cat: 'home', name: '戴森 V16 吸尘器', brand: 'Dyson', sku: '无线 激光探测', price: 4990, old: 5490, rating: 4.8, sales: 13000, img: 'img/p034.jpg' },
  { cat: 'home', name: '戴森 HD16 吹风机', brand: 'Dyson', sku: '智能温控 护发', price: 3299, old: 3699, rating: 4.8, sales: 21000, img: 'img/p035.jpg' },
  { cat: 'home', name: '美的 变频空调', brand: '美的', sku: '1.5匹 一级能效', price: 2799, old: 3199, rating: 4.7, sales: 35000, img: 'img/p036.jpg' },
  { cat: 'home', name: '海尔 对开门冰箱', brand: '海尔', sku: '540L 风冷无霜', price: 4299, old: 4799, rating: 4.7, sales: 12000, img: 'img/p037.jpg' },
  { cat: 'home', name: '石头 G20S 扫拖机', brand: '石头', sku: '自清洁 避障', price: 4499, old: 4999, rating: 4.8, sales: 9000, img: 'img/p038.jpg' },
  // 美妆个护
  { cat: 'beauty', name: '雅诗兰黛 小棕瓶', brand: 'Estée Lauder', sku: '精华 50ml', price: 1080, old: 1280, rating: 4.8, sales: 48000, img: 'img/p039.jpg' },
  { cat: 'beauty', name: '兰蔻 菁纯面霜', brand: 'Lancôme', sku: '紧致 抗老', price: 2580, old: 2880, rating: 4.8, sales: 15000, img: 'img/p040.jpg' },
  { cat: 'beauty', name: 'SK-II 神仙水', brand: 'SK-II', sku: '230ml 护肤', price: 1540, old: 1780, rating: 4.9, sales: 32000, img: 'img/p041.jpg' },
  { cat: 'beauty', name: '海蓝之谜 面霜', brand: 'La Mer', sku: '修护 经典', price: 3450, old: 3850, rating: 4.9, sales: 9000, img: 'img/p042.jpg' },
  // 运动户外
  { cat: 'sport', name: 'Air Jordan 1', brand: 'Nike', sku: '联名 高帮', price: 1399, old: 1599, rating: 4.8, sales: 26000, img: 'img/p043.jpg' },
  { cat: 'sport', name: 'lululemon 瑜伽裤', brand: 'lululemon', sku: 'Align 裸感', price: 850, old: 950, rating: 4.8, sales: 30000, img: 'img/p044.jpg' },
  { cat: 'sport', name: '迪卡侬 公路车', brand: 'Decathlon', sku: '入门 变速', price: 3999, old: 4599, rating: 4.7, sales: 7000, img: 'img/p045.jpg' },
  { cat: 'sport', name: '始祖鸟 冲锋衣', brand: "Arc'teryx", sku: 'GORE-TEX 防水', price: 6800, old: 7500, rating: 4.9, sales: 5000, img: 'img/p046.jpg' },
  // 汽车用品
  { cat: 'auto', name: '特斯拉 充电桩', brand: 'Tesla', sku: '7kW 家充', price: 5200, old: 5800, rating: 4.8, sales: 2000, img: 'img/p047.jpg' },
  { cat: 'auto', name: '70迈 记录仪', brand: '70mai', sku: '4K 夜视', price: 599, old: 699, rating: 4.7, sales: 41000, img: 'img/p048.jpg' },
  { cat: 'auto', name: '小米 车载净化器', brand: '小米', sku: '除醛 静音', price: 299, old: 349, rating: 4.6, sales: 22000, img: 'img/p049.jpg' },
  // 智能家居
  { cat: 'smart', name: '小米 智能门锁 Pro', brand: '小米', sku: '3D 人脸 猫眼', price: 1599, old: 1799, rating: 4.7, sales: 18000, img: 'img/p050.jpg' },
  { cat: 'smart', name: '小爱音箱 Pro', brand: '小米', sku: '红外 语音', price: 299, old: 349, rating: 4.7, sales: 60000, img: 'img/p051.jpg' },
  { cat: 'smart', name: '飞利浦 智能台灯', brand: 'Philips', sku: '护眼 调光', price: 399, old: 459, rating: 4.6, sales: 11000, img: 'img/p052.jpg' },
  // 服饰鞋包
  { cat: 'fashion', name: 'Uniqlo 羽绒服', brand: '优衣库', sku: '轻薄 保暖', price: 599, old: 699, rating: 4.7, sales: 55000, img: 'img/p053.jpg' },
  { cat: 'fashion', name: 'New Balance 990v6', brand: 'NB', sku: '元祖灰 复古', price: 1699, old: 1899, rating: 4.8, sales: 14000, img: 'img/p054.jpg' },
  { cat: 'fashion', name: 'COS 羊毛大衣', brand: 'COS', sku: '极简 驼色', price: 2990, old: 3290, rating: 4.7, sales: 6000, img: 'img/p055.jpg' },
  // 母婴亲子
  { cat: 'baby', name: 'Bugaboo 婴儿推车', brand: 'Bugaboo', sku: '轻便折叠', price: 4599, old: 5299, rating: 4.8, sales: 3000, img: 'img/p056.jpg' },
  { cat: 'baby', name: '小米 米兔儿童手表', brand: '小米', sku: '定位 通话', price: 599, old: 699, rating: 4.7, sales: 18000, img: 'img/p057.jpg' },
  { cat: 'baby', name: '启初 婴儿护肤套装', brand: '启初', sku: '水润 温和', price: 199, old: 259, rating: 4.7, sales: 26000, img: 'img/p058.jpg' },
  // 食品酒水
  { cat: 'food', name: '飞天茅台 500ml', brand: '茅台', sku: '53度 酱香', price: 2699, old: 2999, rating: 4.9, sales: 9000, img: 'img/p059.jpg' },
  { cat: 'food', name: '星巴克 蓝山咖啡豆', brand: '星巴克', sku: '1kg 中度烘焙', price: 399, old: 499, rating: 4.8, sales: 22000, img: 'img/p060.jpg' },
  { cat: 'food', name: '三只松鼠 坚果礼盒', brand: '三只松鼠', sku: '大礼包 30袋', price: 159, old: 199, rating: 4.7, sales: 88000, img: 'img/p061.jpg' },
  // 珠宝配饰
  { cat: 'jewelry', name: '周大福 1克拉钻戒', brand: '周大福', sku: '经典款 18K', price: 19999, old: 22999, rating: 4.9, sales: 1200, img: 'img/p062.jpg' },
  { cat: 'jewelry', name: 'Pandora 串饰手链', brand: 'Pandora', sku: '925银 礼物', price: 1299, old: 1499, rating: 4.8, sales: 9000, img: 'img/p063.jpg' },
  { cat: 'jewelry', name: 'Swarovski 天鹅项链', brand: 'Swarovski', sku: '水晶 礼物', price: 1099, old: 1299, rating: 4.8, sales: 11000, img: 'img/p064.jpg' },
  { cat: 'jewelry', name: 'Tiffany 钻戒', brand: 'Tiffany', sku: 'Soleste 钻戒', price: 32800, old: 35800, rating: 4.9, sales: 400, img: 'img/p104.jpg' },
  { cat: 'jewelry', name: 'Bvlgari 项链', brand: 'Bvlgari', sku: 'Serpenti 项链', price: 26800, old: 29800, rating: 4.8, sales: 500, img: 'img/p105.jpg' },
  // 潮玩玩具
  { cat: 'toy', name: '泡泡玛特 LABUBU', brand: '泡泡玛特', sku: '森林精灵 隐藏款', price: 599, old: 699, rating: 4.8, sales: 42000, img: 'img/p106.jpg' },
  { cat: 'toy', name: '乐高 兰博基尼 Sián', brand: 'LEGO', sku: '1:8 旗舰跑车', price: 3299, old: 3699, rating: 4.9, sales: 9000, img: 'img/p107.jpg' },
  { cat: 'toy', name: '52TOYS 猛兽匣', brand: '52TOYS', sku: '系列盲盒 12抽', price: 69, old: 89, rating: 4.7, sales: 88000, img: 'img/p108.jpg' },
  { cat: 'toy', name: 'Jellycat 邦尼兔', brand: 'Jellycat', sku: '云朵软绒 中号', price: 359, old: 399, rating: 4.8, sales: 31000, img: 'img/p109.jpg' },
  { cat: 'toy', name: '万代 RG 牛高达', brand: 'BANDAI', sku: '1/144 拼装', price: 299, old: 349, rating: 4.8, sales: 26000, img: 'img/p110.jpg' },
  { cat: 'toy', name: '索尼 机器狗 aibo', brand: 'Sony', sku: '智能陪伴 仿生', price: 13999, old: 14999, rating: 4.9, sales: 1500, img: 'img/p111.jpg' },
  // 宠物智能
  { cat: 'pet', name: 'CATLINK 全自动猫砂盆', brand: 'CATLINK', sku: '智能除臭 滚筒式', price: 1999, old: 2299, rating: 4.7, sales: 18000, img: 'img/p112.jpg' },
  { cat: 'pet', name: '霍曼 智能喂食器', brand: '霍曼', sku: 'APP 定量 防潮', price: 499, old: 599, rating: 4.7, sales: 32000, img: 'img/p113.jpg' },
  { cat: 'pet', name: '小米 智能宠物摄像头', brand: '小米', sku: '2K 全景 逗宠', price: 199, old: 249, rating: 4.6, sales: 54000, img: 'img/p114.jpg' },
  { cat: 'pet', name: 'PETKIT 净味猫砂', brand: 'PETKIT', sku: '沸石矿砂 6L', price: 129, old: 159, rating: 4.7, sales: 47000, img: 'img/p115.jpg' },
  { cat: 'pet', name: 'Unipal 宠物饮水机', brand: 'Unipal', sku: '无线 循环过滤', price: 299, old: 359, rating: 4.7, sales: 29000, img: 'img/p116.jpg' },
  { cat: 'pet', name: 'FURRYTAIL 猫窝', brand: 'FURRYTAIL', sku: '半包围 保暖', price: 259, old: 299, rating: 4.8, sales: 33000, img: 'img/p117.jpg' },
  // 家具家装
  { cat: 'furniture', name: '西昊 人体工学椅', brand: '西昊', sku: 'V1 网布 腰托', price: 899, old: 1099, rating: 4.8, sales: 36000, img: 'img/p118.jpg' },
  { cat: 'furniture', name: '明基 智能台灯', brand: '明基', sku: 'WiT 护眼 自动调光', price: 1299, old: 1499, rating: 4.8, sales: 21000, img: 'img/p119.jpg' },
  { cat: 'furniture', name: '小米 米家智能台灯', brand: '小米', sku: 'Pro 全光谱', price: 399, old: 449, rating: 4.7, sales: 61000, img: 'img/p120.jpg' },
  { cat: 'furniture', name: '香度 香薰机', brand: '香度', sku: '超声波 木纹', price: 199, old: 259, rating: 4.7, sales: 38000, img: 'img/p121.jpg' },
  { cat: 'furniture', name: '乐歌 电动升降桌', brand: '乐歌', sku: '双电机 记忆高度', price: 1799, old: 2099, rating: 4.8, sales: 14000, img: 'img/p122.jpg' },
  { cat: 'furniture', name: '睡眠博士 乳胶枕', brand: '睡眠博士', sku: '人体工学 慢回弹', price: 299, old: 399, rating: 4.7, sales: 45000, img: 'img/p123.jpg' },
  // 乐器
  { cat: 'music', name: 'Fender 电吉他', brand: 'Fender', sku: 'Player 单线圈', price: 4299, old: 4999, rating: 4.8, sales: 8000, img: 'img/p124.jpg' },
  { cat: 'music', name: '雅马哈 电子琴', brand: 'Yamaha', sku: 'PSR 61键 便携', price: 1299, old: 1599, rating: 4.7, sales: 17000, img: 'img/p125.jpg' },
  { cat: 'music', name: 'KEPMA 尤克里里', brand: 'KEPMA', sku: '23寸 炭纤维', price: 399, old: 499, rating: 4.7, sales: 26000, img: 'img/p126.jpg' },
  { cat: 'music', name: '罗兰 电鼓', brand: 'Roland', sku: 'TD 网状鼓面', price: 5999, old: 6999, rating: 4.8, sales: 4000, img: 'img/p127.jpg' },
  { cat: 'music', name: '卡瓦依 智能钢琴', brand: 'Kawai', sku: 'ES 便携 重锤', price: 4299, old: 4999, rating: 4.8, sales: 6000, img: 'img/p128.jpg' },
  { cat: 'music', name: 'Martin 民谣吉他', brand: 'Martin', sku: 'DX 桃花心木', price: 2899, old: 3299, rating: 4.8, sales: 9000, img: 'img/p129.jpg' },
  { cat: 'phone', name: '小米 15 Pro', brand: 'Xiaomi', sku: '12+256GB', price: 4999, old: 5499, rating: 4.8, sales: 3200, img: 'img/p130.jpg' },
  { cat: 'phone', name: '一加 13', brand: 'OnePlus', sku: '16+512GB', price: 4299, old: 4799, rating: 4.7, sales: 1500, img: 'img/p131.jpg' },
  { cat: 'laptop', name: '华硕 天选5', brand: 'ASUS', sku: 'R7/16G', price: 6499, old: 6999, rating: 4.7, sales: 1200, img: 'img/p132.jpg' },
  { cat: 'laptop', name: '宏碁 暗影骑士', brand: 'Acer', sku: 'i5/16G', price: 5299, old: 5799, rating: 4.6, sales: 900, img: 'img/p133.jpg' },
  { cat: 'drone', name: '大疆 Avata 2', brand: 'DJI', sku: '畅飞套装', price: 6988, old: 7988, rating: 4.8, sales: 600, img: 'img/p134.jpg' },
  { cat: 'drone', name: '司马 X30', brand: 'SiMaaa', sku: '标准套装', price: 1299, old: 1599, rating: 4.5, sales: 2200, img: 'img/p135.jpg' },
  { cat: 'luxury', name: '路易威登 钱包', brand: 'Louis Vuitton', sku: 'Zippy 钱包', price: 6800, old: 7200, rating: 4.7, sales: 400, img: 'img/p136.jpg' },
  { cat: 'luxury', name: '爱马仕 丝巾', brand: 'Hermès', sku: '90cm 丝巾', price: 3200, old: 3500, rating: 4.8, sales: 700, img: 'img/p137.jpg' },
  { cat: 'watch', name: '华为 Watch GT5', brand: 'HUAWEI', sku: '46mm', price: 1488, old: 1688, rating: 4.7, sales: 5000, img: 'img/p138.jpg' },
  { cat: 'watch', name: '佳明 Fenix 7', brand: 'Garmin', sku: '45mm', price: 4980, old: 5280, rating: 4.8, sales: 800, img: 'img/p139.jpg' },
  { cat: 'game', name: '索尼 PS5 Pro', brand: 'Sony', sku: '光驱版', price: 5699, old: 5999, rating: 4.8, sales: 1500, img: 'img/p140.jpg' },
  { cat: 'game', name: '任天堂 Switch2', brand: 'Nintendo', sku: '港版', price: 3299, old: 3599, rating: 4.7, sales: 2600, img: 'img/p141.jpg' },
  { cat: 'camera', name: '索尼 ZV-E10 II', brand: 'Sony', sku: '标准套机', price: 5499, old: 5999, rating: 4.7, sales: 1100, img: 'img/p142.jpg' },
  { cat: 'camera', name: '富士 X100VI', brand: 'FUJIFILM', sku: '银色', price: 9999, old: 10999, rating: 4.9, sales: 900, img: 'img/p143.jpg' },
  { cat: 'home', name: '戴森 V12 吸尘器', brand: 'Dyson', sku: '标准', price: 3990, old: 4290, rating: 4.7, sales: 1800, img: 'img/p144.jpg' },
  { cat: 'home', name: '美的 变频空调', brand: 'Midea', sku: '1.5匹', price: 2299, old: 2599, rating: 4.6, sales: 3000, img: 'img/p145.jpg' },
  { cat: 'beauty', name: '雅诗兰黛 小棕瓶', brand: 'Estée Lauder', sku: '50ml', price: 780, old: 880, rating: 4.7, sales: 4000, img: 'img/p146.jpg' },
  { cat: 'beauty', name: '兰蔻 菁纯面霜', brand: 'Lancôme', sku: '正装', price: 1280, old: 1380, rating: 4.8, sales: 1500, img: 'img/p147.jpg' },
  { cat: 'sport', name: '耐克 Air Zoom', brand: 'Nike', sku: 'M', price: 899, old: 999, rating: 4.7, sales: 3500, img: 'img/p148.jpg' },
  { cat: 'sport', name: '迪卡侬 瑜伽垫', brand: 'DECATHLON', sku: 'L', price: 99, old: 129, rating: 4.6, sales: 6000, img: 'img/p149.jpg' },
  { cat: 'auto', name: '70迈 行车记录仪', brand: '70mai', sku: '专车专用', price: 499, old: 599, rating: 4.6, sales: 2500, img: 'img/p150.jpg' },
  { cat: 'auto', name: '小米 车载吸尘器', brand: 'Xiaomi', sku: '通用款', price: 199, old: 249, rating: 4.5, sales: 4000, img: 'img/p151.jpg' },
  { cat: 'smart', name: '小米 智能门锁', brand: 'Xiaomi', sku: 'Pro版', price: 1299, old: 1499, rating: 4.7, sales: 2000, img: 'img/p152.jpg' },
  { cat: 'smart', name: '绿米 温控面板', brand: 'Aqara', sku: '标准版', price: 399, old: 459, rating: 4.6, sales: 1200, img: 'img/p153.jpg' },
  { cat: 'fashion', name: '优衣库 摇粒绒', brand: 'UNIQLO', sku: 'M', price: 199, old: 249, rating: 4.7, sales: 8000, img: 'img/p154.jpg' },
  { cat: 'fashion', name: '李宁 运动卫衣', brand: 'LI-NING', sku: 'L', price: 359, old: 399, rating: 4.6, sales: 3000, img: 'img/p155.jpg' },
  { cat: 'baby', name: '帮宝适 一级帮', brand: 'Pampers', sku: 'M', price: 159, old: 189, rating: 4.7, sales: 9000, img: 'img/p156.jpg' },
  { cat: 'baby', name: '小白熊 调奶器', brand: 'SnowBear', sku: '标准', price: 299, old: 349, rating: 4.6, sales: 2200, img: 'img/p157.jpg' },
  { cat: 'food', name: '习酒 窖藏', brand: 'Xijiu', sku: '500ml', price: 899, old: 999, rating: 4.7, sales: 1500, img: 'img/p158.jpg' },
  { cat: 'food', name: '三只松鼠 坚果礼盒', brand: 'Three Squirrels', sku: '礼盒装', price: 129, old: 159, rating: 4.6, sales: 7000, img: 'img/p159.jpg' },
  { cat: 'jewelry', name: '周大福 黄金转运珠', brand: 'CHOW TAI FOOK', sku: '标准', price: 1280, old: 1380, rating: 4.7, sales: 2000, img: 'img/p160.jpg' },
  { cat: 'jewelry', name: '施华洛世奇 项链', brand: 'Swarovski', sku: '可调', price: 890, old: 990, rating: 4.6, sales: 1600, img: 'img/p161.jpg' },
  { cat: 'toy', name: '泡泡玛特 LABUBU', brand: 'POP MART', sku: '热门口径', price: 99, old: 119, rating: 4.8, sales: 12000, img: 'img/p162.jpg' },
  { cat: 'toy', name: '乐高 兰博基尼', brand: 'LEGO', sku: '标准套装', price: 3499, old: 3799, rating: 4.8, sales: 800, img: 'img/p163.jpg' },
  { cat: 'pet', name: '麦富迪 狗粮', brand: 'Myfoodie', sku: '中型', price: 259, old: 299, rating: 4.6, sales: 5000, img: 'img/p164.jpg' },
  { cat: 'pet', name: '小佩 自动猫砂盆', brand: 'PETKIT', sku: '标准', price: 1599, old: 1799, rating: 4.7, sales: 1100, img: 'img/p165.jpg' },
  { cat: 'furniture', name: '源氏木语 实木床', brand: 'Mousse', sku: '1.8m 标准', price: 1999, old: 2299, rating: 4.7, sales: 900, img: 'img/p166.jpg' },
  { cat: 'furniture', name: '林氏 布艺沙发', brand: 'LINSY', sku: '三人位', price: 2999, old: 3399, rating: 4.6, sales: 700, img: 'img/p167.jpg' },
  { cat: 'music', name: '雅马哈 电钢琴', brand: 'YAMAHA', sku: '标准款', price: 2999, old: 3299, rating: 4.7, sales: 600, img: 'img/p168.jpg' },
  { cat: 'music', name: '卡马 民谣吉他', brand: 'KEPMA', sku: '入门款', price: 599, old: 699, rating: 4.6, sales: 1800, img: 'img/p169.jpg' },
  { cat: 'phone', name: '真我 GT7 Pro', brand: 'Realme', sku: '12+256GB', price: 2999, old: 3299, rating: 4.7, sales: 12000, img: 'img/p170.jpg' },
  { cat: 'phone', name: '荣耀 Magic7 Pro', brand: 'Honor', sku: '12+512GB', price: 5499, old: 5999, rating: 4.8, sales: 9000, img: 'img/p171.jpg' },
  { cat: 'laptop', name: '联想 ThinkBook 14', brand: 'Lenovo', sku: 'i5/16/512', price: 4199, old: 4599, rating: 4.7, sales: 8000, img: 'img/p172.jpg' },
  { cat: 'laptop', name: '荣耀 MagicBook Pro 16', brand: 'Honor', sku: 'Ultra5/16/1T', price: 5299, old: 5699, rating: 4.6, sales: 6000, img: 'img/p173.jpg' },
  { cat: 'drone', name: '大疆 Neo', brand: 'DJI', sku: '标准版', price: 1299, old: 1499, rating: 4.6, sales: 15000, img: 'img/p174.jpg' },
  { cat: 'drone', name: '哈博森 Zino Mini Pro', brand: 'Hubsan', sku: 'Pro版', price: 2599, old: 2999, rating: 4.5, sales: 4000, img: 'img/p175.jpg' },
  { cat: 'luxury', name: '古驰 腰带', brand: 'Gucci', sku: 'GG 徽章', price: 2390, old: 2690, rating: 4.7, sales: 2000, img: 'img/p176.jpg' },
  { cat: 'luxury', name: '普拉达 双肩包', brand: 'Prada', sku: 'Re-Nylon', price: 9800, old: 10800, rating: 4.6, sales: 800, img: 'img/p177.jpg' },
  { cat: 'watch', name: '华米 Balance', brand: 'Amazfit', sku: '46mm', price: 999, old: 1199, rating: 4.6, sales: 11000, img: 'img/p178.jpg' },
  { cat: 'watch', name: '三星 Galaxy Watch7', brand: 'Samsung', sku: '44mm', price: 1899, old: 2099, rating: 4.7, sales: 7000, img: 'img/p179.jpg' },
  { cat: 'game', name: 'Steam Deck OLED', brand: 'Valve', sku: '512G', price: 4599, old: 4999, rating: 4.8, sales: 5000, img: 'img/p180.jpg' },
  { cat: 'game', name: 'Xbox Series X', brand: 'Microsoft', sku: '1TB', price: 3899, old: 4299, rating: 4.7, sales: 6000, img: 'img/p181.jpg' },
  { cat: 'camera', name: 'GoPro HERO13', brand: 'GoPro', sku: '标准套装', price: 2998, old: 3298, rating: 4.6, sales: 9000, img: 'img/p182.jpg' },
  { cat: 'camera', name: '影石 Insta360 X4', brand: 'Insta360', sku: '8K 全景', price: 3499, old: 3799, rating: 4.7, sales: 5500, img: 'img/p183.jpg' },
  { cat: 'home', name: '石头 Qrevo', brand: 'Roborock', sku: '扫拖机器人', price: 3299, old: 3699, rating: 4.7, sales: 8000, img: 'img/p184.jpg' },
  { cat: 'home', name: '飞利浦 空气炸锅', brand: 'Philips', sku: '5.5L', price: 699, old: 899, rating: 4.6, sales: 20000, img: 'img/p185.jpg' },
  { cat: 'beauty', name: 'SK-II 神仙水', brand: 'SK-II', sku: '230ml', price: 1540, old: 1690, rating: 4.8, sales: 12000, img: 'img/p186.jpg' },
  { cat: 'beauty', name: '阿玛尼 红管唇釉', brand: 'Armani', sku: '405 红', price: 320, old: 380, rating: 4.7, sales: 18000, img: 'img/p187.jpg' },
  { cat: 'sport', name: '阿迪达斯 Ultraboost', brand: 'Adidas', sku: '跑步鞋', price: 1099, old: 1299, rating: 4.7, sales: 14000, img: 'img/p188.jpg' },
  { cat: 'sport', name: '迪卡侬 帐篷', brand: 'Decathlon', sku: 'MT100', price: 299, old: 399, rating: 4.6, sales: 9000, img: 'img/p189.jpg' },
  { cat: 'auto', name: '小米 智能后视镜', brand: 'Xiaomi', sku: '行车记录', price: 599, old: 799, rating: 4.6, sales: 7000, img: 'img/p190.jpg' },
  { cat: 'auto', name: '倍思 车充', brand: 'Baseus', sku: '快充', price: 99, old: 129, rating: 4.7, sales: 25000, img: 'img/p191.jpg' },
  { cat: 'smart', name: '小米 智能音箱', brand: 'Xiaomi', sku: 'Pro 二代', price: 299, old: 349, rating: 4.6, sales: 16000, img: 'img/p192.jpg' },
  { cat: 'smart', name: '易来 智能灯泡', brand: 'Yeelight', sku: '彩光', price: 79, old: 99, rating: 4.6, sales: 30000, img: 'img/p193.jpg' },
  { cat: 'fashion', name: '优衣库 AIRism', brand: 'Uniqlo', sku: '速干T恤', price: 79, old: 99, rating: 4.7, sales: 40000, img: 'img/p194.jpg' },
  { cat: 'fashion', name: '斯凯奇 健步鞋', brand: 'Skechers', sku: 'Go Walk', price: 499, old: 599, rating: 4.7, sales: 13000, img: 'img/p195.jpg' },
  { cat: 'baby', name: '飞利浦 新安怡奶瓶', brand: 'Philips', sku: '自然顺畅', price: 129, old: 159, rating: 4.7, sales: 15000, img: 'img/p196.jpg' },
  { cat: 'baby', name: '帮宝适 拉拉裤', brand: 'Pampers', sku: 'L 码', price: 99, old: 129, rating: 4.7, sales: 22000, img: 'img/p197.jpg' },
  { cat: 'food', name: '茅台 1935', brand: 'Moutai', sku: '500ml', price: 1099, old: 1199, rating: 4.8, sales: 6000, img: 'img/p198.jpg' },
  { cat: 'food', name: '海底捞 自煮锅', brand: 'Haidilao', sku: '麻辣', price: 39, old: 49, rating: 4.6, sales: 35000, img: 'img/p199.jpg' },
  { cat: 'jewelry', name: '周大福 传承金镯', brand: 'Chow Tai Fook', sku: '足金', price: 5800, old: 6200, rating: 4.7, sales: 1500, img: 'img/p200.jpg' },
  { cat: 'jewelry', name: '潘多拉 串饰', brand: 'Pandora', sku: '925银', price: 398, old: 468, rating: 4.6, sales: 9000, img: 'img/p201.jpg' },
  { cat: 'toy', name: '乐高 地球仪', brand: 'Lego', sku: 'Ideas', price: 549, old: 599, rating: 4.8, sales: 4000, img: 'img/p202.jpg' },
  { cat: 'toy', name: '万代 RG 高达', brand: 'Bandai', sku: 'RG 1/144', price: 299, old: 349, rating: 4.7, sales: 7000, img: 'img/p203.jpg' },
  { cat: 'pet', name: '小米 宠物饮水机', brand: 'Xiaomi', sku: '无线', price: 199, old: 249, rating: 4.6, sales: 12000, img: 'img/p204.jpg' },
  { cat: 'pet', name: 'ROJECO 宠物剃毛器', brand: 'ROJECO', sku: '静音', price: 159, old: 199, rating: 4.5, sales: 8000, img: 'img/p205.jpg' },
  { cat: 'furniture', name: '宜家 办公椅', brand: 'IKEA', sku: 'MARKUS', price: 999, old: 1199, rating: 4.6, sales: 5000, img: 'img/p206.jpg' },
  { cat: 'furniture', name: '无印良品 收纳架', brand: 'MUJI', sku: '橡木', price: 399, old: 499, rating: 4.6, sales: 6000, img: 'img/p207.jpg' },
  { cat: 'music', name: '罗兰 便携电子琴', brand: 'Roland', sku: 'GO:KEYS', price: 1299, old: 1499, rating: 4.6, sales: 3000, img: 'img/p208.jpg' },
  { cat: 'music', name: '芬达  Squier 电吉他', brand: 'Fender', sku: 'Affinity', price: 1599, old: 1799, rating: 4.7, sales: 4000, img: 'img/p209.jpg' },

  { cat: "phone", name: "真我 GT7 Pro", brand: "realme", sku: "天玑9400 旗舰", price: 3699, old: 3999, rating: 4.8, sales: 15000, img: "img/p210.jpg" },
  { cat: "phone", name: "一加 Ace 5", brand: "OnePlus", sku: "骁龙8Gen3 性能", price: 2799, old: 3099, rating: 4.7, sales: 18000, img: "img/p211.jpg" },
  { cat: "phone", name: "魅族 21 Pro", brand: "魅族", sku: "全等深 旗舰", price: 3399, old: 3699, rating: 4.6, sales: 6000, img: "img/p212.jpg" },
  { cat: "phone", name: "三星 Galaxy Z Flip7", brand: "Samsung", sku: "12GB+512GB 折叠", price: 7999, old: 8499, rating: 4.7, sales: 4000, img: "img/p213.jpg" },
  { cat: "phone", name: "iQOO 13", brand: "iQOO", sku: "电竞旗舰 2K屏", price: 3999, old: 4299, rating: 4.8, sales: 12000, img: "img/p214.jpg" },
  { cat: "laptop", name: "联想 小新 Pro 16", brand: "联想", sku: "锐龙AI 3.2K", price: 4999, old: 5499, rating: 4.7, sales: 16000, img: "img/p215.jpg" },
  { cat: "laptop", name: "华为 MateBook D16", brand: "华为", sku: "16英寸 标压", price: 4499, old: 4999, rating: 4.7, sales: 9000, img: "img/p216.jpg" },
  { cat: "laptop", name: "雷神 911", brand: "雷神", sku: "RTX5070Ti 电竞", price: 12999, old: 13999, rating: 4.6, sales: 3000, img: "img/p217.jpg" },
  { cat: "laptop", name: "宏碁 掠夺者 Helios", brand: "宏碁", sku: "16英寸 2.5K", price: 9999, old: 10999, rating: 4.7, sales: 4000, img: "img/p218.jpg" },
  { cat: "laptop", name: "荣耀 MagicBook Pro 16", brand: "荣耀", sku: "3K 护眼", price: 5499, old: 5999, rating: 4.7, sales: 7000, img: "img/p219.jpg" },
  { cat: "drone", name: "大疆 Neo", brand: "大疆", sku: "249g 掌上起飞", price: 3299, old: 3699, rating: 4.7, sales: 9000, img: "img/p220.jpg" },
  { cat: "drone", name: "大疆 Mavic 3 Classic", brand: "大疆", sku: "哈苏 经典款", price: 9588, old: 10288, rating: 4.8, sales: 3000, img: "img/p221.jpg" },
  { cat: "drone", name: "司马 X50", brand: "司马", sku: "入门 4K GPS", price: 1299, old: 1599, rating: 4.4, sales: 8000, img: "img/p222.jpg" },
  { cat: "drone", name: "飞米 X8SE", brand: "Feima", sku: "长续航 专业", price: 2999, old: 3399, rating: 4.5, sales: 3500, img: "img/p223.jpg" },
  { cat: "luxury", name: "Coach 托特包", brand: "Coach", sku: "经典 老花", price: 4200, old: 4800, rating: 4.7, sales: 2500, img: "img/p224.jpg" },
  { cat: "luxury", name: "浪琴 名匠", brand: "Longines", sku: "自动机械 皮带", price: 15800, old: 17800, rating: 4.8, sales: 800, img: "img/p225.jpg" },
  { cat: "luxury", name: "Jo Malone 香水", brand: "Jo Malone", sku: "英国梨 小苍兰", price: 850, old: 980, rating: 4.7, sales: 6000, img: "img/p226.jpg" },
  { cat: "luxury", name: "Burberry 围巾", brand: "Burberry", sku: "经典格纹 羊绒", price: 3600, old: 3900, rating: 4.8, sales: 1500, img: "img/p227.jpg" },
  { cat: "watch", name: "华为 Watch GT5", brand: "华为", sku: "46mm 运动", price: 1488, old: 1688, rating: 4.8, sales: 20000, img: "img/p228.jpg" },
  { cat: "watch", name: "Apple Watch S10", brand: "Apple", sku: "46mm GPS", price: 3199, old: 3499, rating: 4.8, sales: 15000, img: "img/p229.jpg" },
  { cat: "watch", name: "Garmin fenix8", brand: "Garmin", sku: "47mm 户外", price: 5680, old: 6280, rating: 4.9, sales: 3000, img: "img/p230.jpg" },
  { cat: "watch", name: "小天才 Z10", brand: "小天才", sku: "儿童电话手表", price: 1599, old: 1799, rating: 4.7, sales: 12000, img: "img/p231.jpg" },
  { cat: "watch", name: "佳明 Venu3", brand: "Garmin", sku: "AMOLED 健康", price: 3280, old: 3580, rating: 4.8, sales: 4000, img: "img/p232.jpg" },
  { cat: "game", name: "PlayStation 5 轻薄版", brand: "Sony", sku: "光驱版 主机", price: 3899, old: 4299, rating: 4.9, sales: 10000, img: "img/p233.jpg" },
  { cat: "game", name: "Xbox Series X", brand: "微软", sku: "1TB 主机", price: 3599, old: 3999, rating: 4.8, sales: 5000, img: "img/p234.jpg" },
  { cat: "game", name: "索尼 DualSense", brand: "Sony", sku: "无线手柄 星云粉", price: 499, old: 599, rating: 4.8, sales: 15000, img: "img/p235.jpg" },
  { cat: "game", name: "罗技 G733", brand: "罗技", sku: "无线游戏耳机", price: 699, old: 799, rating: 4.7, sales: 8000, img: "img/p236.jpg" },
  { cat: "camera", name: "索尼 A7C2", brand: "Sony", sku: "全画幅 微单", price: 13999, old: 14999, rating: 4.9, sales: 4000, img: "img/p237.jpg" },
  { cat: "camera", name: "GoPro Hero13", brand: "GoPro", sku: "防水 运动相机", price: 2998, old: 3298, rating: 4.7, sales: 6000, img: "img/p238.jpg" },
  { cat: "camera", name: "大疆 Pocket 3", brand: "大疆", sku: "口袋云台相机", price: 3499, old: 3799, rating: 4.8, sales: 12000, img: "img/p239.jpg" },
  { cat: "camera", name: "适马 24-70", brand: "Sigma", sku: "F2.8 标准变焦", price: 7280, old: 7880, rating: 4.8, sales: 1500, img: "img/p240.jpg" },
  { cat: "home", name: "石头 G20S", brand: "石头", sku: "扫拖机器人", price: 3999, old: 4499, rating: 4.8, sales: 9000, img: "img/p241.jpg" },
  { cat: "home", name: "九阳 空气炸锅", brand: "九阳", sku: "5L 大容量", price: 399, old: 499, rating: 4.7, sales: 30000, img: "img/p242.jpg" },
  { cat: "home", name: "德龙 咖啡机", brand: "德龙", sku: "全自动 意式", price: 4990, old: 5590, rating: 4.8, sales: 4000, img: "img/p243.jpg" },
  { cat: "home", name: "戴森 V12", brand: "戴森", sku: "无线吸尘器", price: 3990, old: 4390, rating: 4.8, sales: 7000, img: "img/p244.jpg" },
  { cat: "home", name: "小米 空气净化器", brand: "小米", sku: "除菌 除甲醛", price: 1299, old: 1499, rating: 4.7, sales: 18000, img: "img/p245.jpg" },
  { cat: "beauty", name: "兰蔻 小黑瓶", brand: "Lancome", sku: "精华 50ml", price: 1080, old: 1280, rating: 4.8, sales: 12000, img: "img/p246.jpg" },
  { cat: "beauty", name: "圣罗兰 圆管", brand: "YSL", sku: "口红 正红", price: 320, old: 380, rating: 4.7, sales: 20000, img: "img/p247.jpg" },
  { cat: "beauty", name: "香奈儿 五号", brand: "Chanel", sku: "女士香水", price: 980, old: 1180, rating: 4.8, sales: 8000, img: "img/p248.jpg" },
  { cat: "beauty", name: "3CE 眼影盘", brand: "3CE", sku: "大地色 多色", price: 199, old: 259, rating: 4.7, sales: 15000, img: "img/p249.jpg" },
  { cat: "beauty", name: "雅诗兰黛 套装", brand: "Estee Lauder", sku: "护肤礼盒", price: 1580, old: 1880, rating: 4.8, sales: 6000, img: "img/p250.jpg" },
  { cat: "sport", name: "耐克 Air Max", brand: "Nike", sku: "运动鞋 气垫", price: 899, old: 1099, rating: 4.7, sales: 15000, img: "img/p251.jpg" },
  { cat: "sport", name: "lululemon 瑜伽垫", brand: "lululemon", sku: "天然橡胶", price: 480, old: 580, rating: 4.8, sales: 9000, img: "img/p252.jpg" },
  { cat: "sport", name: "小米手环9", brand: "小米", sku: "智能运动手环", price: 239, old: 299, rating: 4.7, sales: 40000, img: "img/p253.jpg" },
  { cat: "sport", name: "斯伯丁 篮球", brand: "Spalding", sku: "7号 室内外", price: 299, old: 359, rating: 4.7, sales: 12000, img: "img/p254.jpg" },
  { cat: "sport", name: "骆驼 帐篷", brand: "骆驼", sku: "户外 便携", price: 599, old: 699, rating: 4.6, sales: 8000, img: "img/p255.jpg" },
  { cat: "auto", name: "70迈 行车记录仪", brand: "70mai", sku: "4K 夜视", price: 499, old: 599, rating: 4.7, sales: 20000, img: "img/p256.jpg" },
  { cat: "auto", name: "倍思 无线车充", brand: "Baseus", sku: "磁吸 快充", price: 199, old: 259, rating: 4.6, sales: 25000, img: "img/p257.jpg" },
  { cat: "auto", name: "米家 充气宝", brand: "米家", sku: "便携式 充气", price: 249, old: 299, rating: 4.7, sales: 18000, img: "img/p258.jpg" },
  { cat: "auto", name: "戴森 车载吸尘", brand: "戴森", sku: "无线 车家两用", price: 1890, old: 2190, rating: 4.7, sales: 6000, img: "img/p259.jpg" },
  { cat: "smart", name: "小爱音箱 Pro", brand: "小米", sku: "智能语音 音箱", price: 299, old: 349, rating: 4.7, sales: 30000, img: "img/p260.jpg" },
  { cat: "smart", name: "飞利浦 智能灯", brand: "Philips", sku: "全彩 灯泡", price: 99, old: 129, rating: 4.6, sales: 22000, img: "img/p261.jpg" },
  { cat: "smart", name: "优必选 机器人", brand: "UBTECH", sku: "陪伴 教育", price: 2999, old: 3499, rating: 4.5, sales: 3000, img: "img/p262.jpg" },
  { cat: "smart", name: "凯迪仕 智能锁", brand: "Kaadas", sku: "3D人脸 门锁", price: 1599, old: 1899, rating: 4.7, sales: 8000, img: "img/p263.jpg" },
  { cat: "smart", name: "Nest 温控器", brand: "Nest", sku: "智能 节能", price: 1299, old: 1499, rating: 4.6, sales: 4000, img: "img/p264.jpg" },
  { cat: "fashion", name: "Coach 双肩包", brand: "Coach", sku: "牛皮 背包", price: 3200, old: 3800, rating: 4.7, sales: 5000, img: "img/p265.jpg" },
  { cat: "fashion", name: "匡威 帆布鞋", brand: "Converse", sku: "经典 白色", price: 499, old: 599, rating: 4.8, sales: 25000, img: "img/p266.jpg" },
  { cat: "fashion", name: "李维斯 牛仔夹克", brand: "Levi's", sku: "经典 水洗", price: 799, old: 999, rating: 4.7, sales: 10000, img: "img/p267.jpg" },
  { cat: "fashion", name: "Zara 碎花裙", brand: "Zara", sku: "夏季 连衣裙", price: 399, old: 499, rating: 4.6, sales: 14000, img: "img/p268.jpg" },
  { cat: "fashion", name: "七匹狼 皮带", brand: "七匹狼", sku: "头层牛皮", price: 199, old: 299, rating: 4.5, sales: 16000, img: "img/p269.jpg" },
  { cat: "baby", name: "好孩子 婴儿车", brand: "Goodbaby", sku: "轻便 高景观", price: 1599, old: 1899, rating: 4.7, sales: 7000, img: "img/p270.jpg" },
  { cat: "baby", name: "小米 智能看护", brand: "小米", sku: "婴儿监护 摄像头", price: 299, old: 399, rating: 4.6, sales: 12000, img: "img/p271.jpg" },
  { cat: "baby", name: "贝亲 奶瓶", brand: "Pigeon", sku: "宽口 玻璃", price: 129, old: 159, rating: 4.8, sales: 30000, img: "img/p272.jpg" },
  { cat: "baby", name: "Jellycat 玩偶", brand: "Jellycat", sku: "安抚 毛绒", price: 299, old: 359, rating: 4.8, sales: 18000, img: "img/p273.jpg" },
  { cat: "food", name: "拉菲 红酒", brand: "Lafite", sku: "波尔多 干红", price: 399, old: 499, rating: 4.7, sales: 12000, img: "img/p274.jpg" },
  { cat: "food", name: "三顿半 咖啡", brand: "三顿半", sku: "精品 冻干", price: 99, old: 129, rating: 4.7, sales: 35000, img: "img/p275.jpg" },
  { cat: "food", name: "歌帝梵 巧克力", brand: "Godiva", sku: "礼盒 黑巧", price: 199, old: 259, rating: 4.7, sales: 16000, img: "img/p276.jpg" },
  { cat: "food", name: "尊美醇 威士忌", brand: "Jameson", sku: "爱尔兰 调和", price: 129, old: 169, rating: 4.6, sales: 20000, img: "img/p277.jpg" },
  { cat: "food", name: "三只松鼠 零食", brand: "三只松鼠", sku: "每日坚果", price: 59, old: 79, rating: 4.7, sales: 50000, img: "img/p278.jpg" },
  { cat: "jewelry", name: "佐卡伊 钻戒", brand: "佐卡伊", sku: "18K 求婚", price: 2999, old: 3599, rating: 4.7, sales: 4000, img: "img/p279.jpg" },
  { cat: "jewelry", name: "周大福 耳环", brand: "周大福", sku: "黄金 简约", price: 880, old: 1080, rating: 4.7, sales: 9000, img: "img/p280.jpg" },
  { cat: "jewelry", name: "施华洛世奇 项链", brand: "Swarovski", sku: "水晶 天鹅", price: 699, old: 899, rating: 4.6, sales: 8000, img: "img/p281.jpg" },
  { cat: "jewelry", name: "潘多拉 手链", brand: "Pandora", sku: "串饰 925银", price: 599, old: 799, rating: 4.6, sales: 7000, img: "img/p282.jpg" },
  { cat: "toy", name: "万代 手办", brand: "Bandai", sku: "比例 可动", price: 399, old: 499, rating: 4.7, sales: 12000, img: "img/p283.jpg" },
  { cat: "toy", name: "乐高 积木", brand: "LEGO", sku: "拼装 城市", price: 599, old: 699, rating: 4.8, sales: 20000, img: "img/p284.jpg" },
  { cat: "toy", name: "迪士尼 毛绒", brand: "Disney", sku: "草莓熊 公仔", price: 199, old: 259, rating: 4.8, sales: 15000, img: "img/p285.jpg" },
  { cat: "toy", name: "双鹰 遥控车", brand: "双鹰", sku: "高速 越野", price: 299, old: 399, rating: 4.6, sales: 9000, img: "img/p286.jpg" },
  { cat: "toy", name: "弥鹿 拼图", brand: "弥鹿", sku: "1000片 减压", price: 89, old: 119, rating: 4.7, sales: 18000, img: "img/p287.jpg" },
  { cat: "pet", name: "小佩 自动喂食", brand: "PETKIT", sku: "智能 猫狗", price: 599, old: 699, rating: 4.7, sales: 9000, img: "img/p288.jpg" },
  { cat: "pet", name: "霍曼 饮水机", brand: "霍曼", sku: "无线 循环", price: 399, old: 499, rating: 4.7, sales: 11000, img: "img/p289.jpg" },
  { cat: "pet", name: "小佩 智能项圈", brand: "PETKIT", sku: "定位 防丢", price: 299, old: 369, rating: 4.6, sales: 8000, img: "img/p290.jpg" },
  { cat: "pet", name: "来旺 宠物美容", brand: "来旺", sku: "家用 电推剪", price: 199, old: 259, rating: 4.5, sales: 10000, img: "img/p291.jpg" },
  { cat: "pet", name: "猫遇上狗 背包", brand: "猫遇上狗", sku: "透气 携行", price: 159, old: 199, rating: 4.6, sales: 12000, img: "img/p292.jpg" },
  { cat: "furniture", name: "林氏 沙发", brand: "林氏家居", sku: "科技布 三人", price: 2999, old: 3599, rating: 4.6, sales: 5000, img: "img/p293.jpg" },
  { cat: "furniture", name: "源氏 餐椅", brand: "源氏木语", sku: "实木 北欧", price: 399, old: 499, rating: 4.7, sales: 9000, img: "img/p294.jpg" },
  { cat: "furniture", name: "工来工往 书桌", brand: "工来工往", sku: "实木 学习", price: 899, old: 1099, rating: 4.5, sales: 7000, img: "img/p295.jpg" },
  { cat: "furniture", name: "家逸 书架", brand: "家逸", sku: "落地 简易", price: 299, old: 399, rating: 4.6, sales: 12000, img: "img/p296.jpg" },
  { cat: "music", name: "雅马哈 吉他", brand: "Yamaha", sku: "民谣 41寸", price: 899, old: 1099, rating: 4.7, sales: 8000, img: "img/p297.jpg" },
  { cat: "music", name: "罗兰 电钢琴", brand: "Roland", sku: "88键 重锤", price: 2999, old: 3499, rating: 4.7, sales: 3000, img: "img/p298.jpg" },
  { cat: "music", name: "舒尔 麦克风", brand: "Shure", sku: "无线 一拖二", price: 899, old: 1099, rating: 4.6, sales: 5000, img: "img/p299.jpg" },
  { cat: "music", name: "JBL 蓝牙音箱", brand: "JBL", sku: "便携 防水", price: 699, old: 899, rating: 4.7, sales: 20000, img: "img/p300.jpg" }
];

const GRADS = {
  phone: ['#4f8cff', '#8a5cff'], laptop: ['#1f9b8e', '#36c5b0'], drone: ['#ff7a59', '#ff3d6e'],
  luxury: ['#caa45a', '#8a6b2f'], watch: ['#5b6470', '#2c313a'], game: ['#7b5cff', '#b14cff'],
  camera: ['#3a7bd5', '#3a6073'], home: ['#2bb0ff', '#0a7bd6'], beauty: ['#ff6fae', '#ff3d8b'],
  sport: ['#34c759', '#1a9e4a'], auto: ['#52607a', '#2f3a52'], smart: ['#ffb347', '#ff8c1a'],
  fashion: ['#9b6bff', '#6b3dff'], baby: ['#ff9ec4', '#ff6fae'], food: ['#c98a3a', '#8a5a1f'],
  jewelry: ['#caa45a', '#e9d8a6'],
  toy: ['#ff8fb3', '#ff5d8f'], pet: ['#5ac8a8', '#2f9e7e'], furniture: ['#c79a5b', '#9c7233'], music: ['#8a6cf0', '#5b3fd6'],
};

/* 分类营销图池（真实营销/场景图，用于商品详情页画廊） */
const MARKETING = {
  phone:   ['img/m001.jpg', 'img/m002.jpg'],
  laptop:  ['img/m003.jpg', 'img/m004.jpg'],
  drone:   ['img/m005.jpg', 'img/m006.jpg'],
  luxury:  ['img/m007.jpg', 'img/m008.jpg'],
  watch:   ['img/m009.jpg', 'img/m010.jpg'],
  game:    ['img/m011.jpg', 'img/m012.jpg'],
  camera:  ['img/m013.jpg', 'img/m014.jpg'],
  home:    ['img/m015.jpg', 'img/m016.jpg'],
  beauty:  ['img/m017.jpg', 'img/m018.jpg'],
  sport:   ['img/m019.jpg', 'img/m020.jpg'],
  auto:    ['img/m021.jpg', 'img/m022.jpg'],
  smart:   ['img/m023.jpg', 'img/m024.jpg'],
  fashion: ['img/m025.jpg', 'img/m026.jpg'],
  baby:    ['img/m027.jpg', 'img/m028.jpg'],
  food:    ['img/m029.jpg', 'img/m030.jpg'],
  jewelry: ['img/m031.jpg', 'img/m032.jpg'],
  toy:       ['img/p106.jpg', 'img/p107.jpg'],
  pet:       ['img/p112.jpg', 'img/p113.jpg'],
  furniture: ['img/p118.jpg', 'img/p119.jpg'],
  music:     ['img/p124.jpg', 'img/p125.jpg'],
};

const CAT_ORIGIN = {
  phone: '中国大陆 / 美国', laptop: '美国 / 中国大陆', drone: '中国 · 深圳', luxury: '法国 / 瑞士',
  watch: '瑞士 / 中国', game: '日本 / 美国', camera: '日本', home: '中国大陆', beauty: '法国 / 日本',
  sport: '越南 / 中国', auto: '中国大陆', smart: '中国大陆', fashion: '中国 / 越南', baby: '中国大陆',
  food: '中国 / 苏格兰', jewelry: '法国 / 意大利',
  toy: '中国 / 越南', pet: '中国 / 美国', furniture: '中国 / 越南', music: '中国 / 日本',
};

/* 商品介绍（按品类生成营销文案） */
function buildIntro(p) {
  const t = {
    phone:  `${p.brand} ${p.name}（${p.sku}）搭载旗舰级影像与性能芯片，配备高刷护眼屏与超大容量电池，支持全网通 5G 与超级快充。轻薄机身融合精致工艺，无论日常通勤还是游戏影音都能从容应对，是兼顾颜值与实力的高端之选。`,
    laptop: `${p.brand} ${p.name} 采用轻薄金属机身，搭载标压处理器与高色域屏幕，多任务与创作剪辑游刃有余；长效续航配合疾速充电，移动办公无负担，是生产力与便携兼得的全能机型。`,
    drone:  `${p.brand} ${p.name} 拥有专业级影像系统与全方位智能避障，图传稳定清晰；折叠机身便携随行，一键成片，轻松记录高空视角的震撼大片，新手也能秒变航拍达人。`,
    luxury: `${p.brand} ${p.name} 延续经典设计与顶级用料，专柜同源工艺，皮质与金属质感细腻温润。无论自用彰显品味，还是送礼体面过人，都是值得收藏的传世之选。`,
    watch:  `${p.brand} ${p.name} 以精致表盘与精准机芯呈现，兼顾日常佩戴与运动健康监测；长续航与多场景表盘，让时尚与实用兼得，腕间尽显格调。`,
    game:   `${p.brand} ${p.name} 带来沉浸式音画体验，降噪、高刷与低延迟一应俱全，游戏影音两不误，是发烧友从入门到进阶的心头好。`,
    camera: `${p.brand} ${p.name} 配备高像素传感器与快速对焦、强效防抖，直出色彩讨喜；轻巧机身随手记录生活与旅行的每一个高光时刻，是出片率拉满的创作利器。`,
    home:   `${p.brand} ${p.name} 在强劲性能与静音节能间取得平衡，智能操控省心省力，让居家清洁与冷暖调控更轻松，提升每一天的幸福感。`,
    beauty: `${p.brand} ${p.name} 由核心成分加持，质地细腻易吸收，温和不刺激；坚持使用肌肤更显透亮水润，是口碑与回购率双高的安心之选。`,
    sport:  `${p.brand} ${p.name} 承载专业运动基因，舒适支撑与透气排汗兼备；无论跑步训练还是户外探险，都能稳稳陪你突破自我、挑战极限。`,
    auto:   `${p.brand} ${p.name} 原车适配、安装便捷，显著提升行车安全与便利；稳定可靠，是爱车出行必不可少的实用好物。`,
    smart:  `${p.brand} ${p.name} 支持全屋智能联动，语音与 App 随心控制，灵敏稳定；让科技悄然融入生活，省心又安心。`,
    fashion: `${p.brand} ${p.name} 甄选优质面料与考究版型，保暖透气且百搭；通勤与出街造型都能轻松驾驭，彰显不费力的高级感。`,
    baby:   `${p.brand} ${p.name} 采用食品级安全材质与贴心设计，温柔呵护宝宝；轻便好用，是新手爸妈带娃路上的省心搭档。`,
    food:   `${p.brand} ${p.name} 正品保障，口感醇厚酥香；礼盒体面，自饮囤货或佳节送礼都恰到好处。`,
    jewelry: `${p.brand} ${p.name} 精工镶嵌、火彩璀璨，经典款式百搭耐看；包装高级，无论是表达心意还是犒赏自己都相宜。`,
    toy: `${p.brand} ${p.name} 造型精致、手感细腻，从盲盒惊喜到收藏把玩都乐趣十足；无论装点桌面还是馈赠好友，都是让人会心一笑的治愈系好物。`,
    pet: `${p.brand} ${p.name} 以智能与贴心设计，帮你轻松照顾毛孩子；静音省心、APP 远程掌控，让养宠更从容，主子更舒心。`,
    furniture: `${p.brand} ${p.name} 兼顾人体工学与家居美学，坐感舒适、用材环保；无论是专注工作还是惬意小憩，都为日常注入松弛质感。`,
    music: `${p.brand} ${p.name} 音色温暖通透、做工扎实，从入门练习到舞台演出都能胜任；让每一个音符都成为生活里的美好注脚。`,
  };
  return t[p.cat] || `${p.brand} ${p.name}，官方正品保证，顺丰包邮，享全国联保与无忧售后。`;
}

/* 商品参数（按品类生成） */
function buildSpecs(p) {
  const o = { '品牌': p.brand, '型号': p.name, '产地': CAT_ORIGIN[p.cat] || '中国大陆', '保修': '全国联保 12 个月' };
  switch (p.cat) {
    case 'phone':
      Object.assign(o, { '屏幕': '6.7-6.9英寸 120Hz 护眼屏', '处理器': p.brand + ' 旗舰芯片', '存储': p.sku.split(' ')[0], '电池': '5000mAh+ 超级快充', '系统': '最新智能系统', '网络': '5G 双卡双待' }); break;
    case 'laptop':
      Object.assign(o, { '屏幕': '高色域高刷屏', '处理器': '标压多核', '显卡': '独显 / 核显', '内存': '16GB / 32GB', '存储': '512GB-1TB SSD', '系统': 'Windows / macOS' }); break;
    case 'drone':
      Object.assign(o, { '影像系统': '专业级云台相机', '图传距离': '10km+ O4 高清图传', '续航': '约 30-45 分钟', '避障': '全方位智能避障', '重量': '249g / 标准机身' }); break;
    case 'luxury':
      Object.assign(o, { '款式': p.sku, '材质': p.name.includes('丝巾') ? '真丝' : (p.name.includes('酒') ? '原装礼盒' : '头层真皮'), '五金': p.name.includes('钻') ? '18K金' : '精钢', '尺寸': p.sku, '配件': '防尘袋 + 保修卡' }); break;
    case 'watch':
      Object.assign(o, { '表盘': '高清视网膜屏', '机芯': '自动机械 / 智能芯片', '续航': '7-18 天', '健康监测': '心率 / 血氧 / 睡眠', '防水': '5ATM' }); break;
    case 'game':
      Object.assign(o, { '类型': p.name.includes('耳机') ? '头戴降噪耳机' : (p.name.includes('音箱') ? '蓝牙音箱' : (p.name.includes('VR') ? 'VR 一体机' : '游戏主机')), '连接': '蓝牙 5.3 / HDMI', '续航': '长续航', '特性': '主动降噪 / 高刷低延迟' }); break;
    case 'camera':
      Object.assign(o, { '传感器': '高像素 CMOS', '镜头': p.sku, '视频': p.sku.includes('360') || p.sku.includes('全景') ? '8K 360° 全景' : '4K/5.3K 高清', '防抖': '三轴增稳 / 超强防抖', '屏幕': '触控翻转屏' }); break;
    case 'home':
      Object.assign(o, { '功率': '大吸力 / 一级能效', '容量': p.name.includes('冰箱') ? '540L' : '适用大户型', '能效': '新一级能效', '噪音': '低噪运行' }); break;
    case 'beauty':
      Object.assign(o, { '容量': p.sku, '肤质': '所有肤质', '功效': '保湿 / 修护 / 抗老', '质地': '易吸收不黏腻' }); break;
    case 'sport':
      Object.assign(o, { '款式': p.sku, '材质': '透气网面 / GORE-TEX', '适用': '跑步 / 训练 / 户外', '特性': '缓震支撑 / 防风防水' }); break;
    case 'auto':
      Object.assign(o, { '适配': '主流车型', '功率': '原车规格', '安装': '专业上门 / 自助', '特性': '稳定可靠' }); break;
    case 'smart':
      Object.assign(o, { '联动': '全屋智能', '控制': '语音 + App', '续航': '长效电池 / 直插', '特性': '灵敏稳定' }); break;
    case 'fashion':
      Object.assign(o, { '款式': p.sku, '材质': '优质面料', '尺码': 'S / M / L / XL', '特性': '保暖透气百搭' }); break;
    case 'baby':
      Object.assign(o, { '款式': p.sku, '材质': '食品级安全材质', '适用年龄': '0岁+', '特性': '轻便好用' }); break;
    case 'food':
      Object.assign(o, { '规格': p.sku, '净含量': p.name.includes('酒') ? '500ml / 礼盒' : '大礼包', '保质期': '见包装', '特性': '正品保障' }); break;
    case 'jewelry':
      Object.assign(o, { '款式': p.sku, '材质': p.name.includes('钻') ? '18K金 / 钻石' : '925银 / 水晶', '主石': p.name.includes('钻') ? '天然钻石' : '人造水晶', '尺寸': '可调节 / 标准' }); break;
    case 'toy':
      Object.assign(o, { '款式': p.sku, '材质': '环保 PVC / 安全毛绒', '适用年龄': '3岁+', '特性': '收藏把玩 / 送礼优选' }); break;
    case 'pet':
      Object.assign(o, { '类型': p.sku, '适用': '猫 / 狗 通用', '容量': '适用多宠家庭', '特性': '智能 APP 控制 / 静音' }); break;
    case 'furniture':
      Object.assign(o, { '款式': p.sku, '材质': '环保板材 / 金属', '尺寸': '适用书房卧室', '特性': '人体工学 / 护眼 / 静音' }); break;
    case 'music':
      Object.assign(o, { '类型': p.sku, '材质': '实木 / 合金', '适用': '入门 / 进阶', '特性': '音色出色 / 便携' }); break;
  }
  return o;
}

/* 商品标题（仿淘宝长标题：品牌+型号+卖点+规格+店铺，风格多样不固定） */
const TITLE_PREFIX = ['【国家补贴】', '【限时直降】', '【网红爆款】', '【明星同款】', '【官方旗舰】', '【新品首发】', ''];
const TITLE_SUFFIX = ['官方旗舰店 顺丰包邮', '正品保障 七天无理由', '现货速发 送礼优选', '20W+好评 闭眼入', '国补到手更香', ''];
function tpool(arr, seed) { const n = arr.length; return arr[((Math.floor(seed) % n) + n) % n]; }
function parseMem(sku) {
  if (!sku) return '';
  const mm = sku.match(/(\d+\s*GB\s*\+?\s*\d*\s*(?:GB|TB)|\d+\s*TB)/i);
  return mm ? mm[0].toUpperCase().replace(/\s+/g, '') : '';
}
const PHONE_CHIP = { 'Apple':'A18 Pro', '华为':'麒麟旗舰芯', '小米':'骁龙8至尊版', 'Samsung':'骁龙8至尊版', '荣耀':'骁龙8至尊版', 'OnePlus':'骁龙8至尊版', 'OPPO':'天玑9400', 'vivo':'天玑9400', 'Google':'Tensor G4' };
const PHONE_CAM = { 'Apple':'4800万像素', '华为':'超聚光影像', '小米':'徕卡影像', 'Samsung':'2亿像素', '荣耀':'鹰眼相机', 'OnePlus':'哈苏影像', 'OPPO':'哈苏影像', 'vivo':'蔡司影像', 'Google':'Pixel 影像' };
function stripBrand(name, brand) {
  const n = (name || '').trim();
  if (brand && n.toLowerCase().startsWith(brand.toLowerCase() + ' ')) return n.slice(brand.length + 1).trim();
  return n;
}
function buildTitle(p, i) {
  const b = p.brand, m = stripBrand(p.name, p.brand), sku = p.sku || '';
  const pre = tpool(TITLE_PREFIX, i);
  const suf = tpool(TITLE_SUFFIX, i + 5);
  let mid; const c = p.cat;
  if (c === 'phone') {
    const cam = PHONE_CAM[b] || tpool(['超清影像', '高像素主摄', '专业影像系统'], i);
    const chip = PHONE_CHIP[b] || tpool(['骁龙8至尊版', '天玑9400'], i + 1);
    const mem = parseMem(sku) || tpool(['16+1TB', '12+512GB', '24+1TB'], i);
    const scr = tpool(['2K直屏', '1.5K微曲屏', '120Hz高刷护眼屏'], i + 2);
    mid = tpool([
      `${b} ${m} ${chip} ${cam} ${mem} ${scr} 5G拍照旗舰手机`,
      `${b} ${m} ${mem} ${cam} 影像旗舰 长续航5G手机`,
      `${b} ${m} 网红同款 ${cam} ${mem} 全网通5G手机`,
    ], i);
  } else if (c === 'laptop') {
    const cpu = tpool(['酷睿Ultra9', '锐龙AI 9', 'M4 Max', 'M4 Pro', '标压i9'], i);
    const gpu = tpool(['RTX5090', 'RTX4060', '满血独显', '核显'], i + 1);
    const scr = tpool(['3.1K高刷屏', '2.8K触控屏', 'OLED屏', '高色域屏'], i + 2);
    mid = tpool([
      `${b} ${m} ${cpu} ${gpu} ${scr} 轻薄办公笔记本`,
      `${b} ${m} ${cpu} ${scr} 游戏本 高性能电竞`,
      `${b} ${m} ${scr} 长续航 创作设计笔记本`,
    ], i);
  } else if (c === 'drone') {
    const cam = tpool(['8K电影机', '哈苏主摄', '4K双摄', '一英寸传感器'], i);
    mid = tpool([
      `${b} ${m} 专业航拍无人机 ${cam} 智能避障 长续航`,
      `${b} ${m} 折叠便携无人机 ${cam} 图传稳定 新手友好`,
      `${b} ${m} 航拍无人机 同款热销 ${cam} O4图传`,
    ], i);
  } else if (c === 'luxury') {
    mid = tpool([
      `${b} ${m} 专柜同款 ${sku} 经典款 送礼体面 正品保障`,
      `${b} ${m} ${sku} 顶级用料 传世收藏 专柜同源`,
      `${b} ${m} 同款热销 ${sku} 精致工艺 体面过人`,
    ], i);
  } else if (c === 'watch') {
    const typ = /Apple|Garmin|华为|小米|Watch/.test(m) ? '智能运动手表' : '自动机械腕表';
    mid = tpool([
      `${b} ${m} ${typ} 心率血氧监测 长续航`,
      `${b} ${m} ${typ} 蓝宝石镜面 多场景表盘`,
      `${b} ${m} 同款 ${typ} 健康监测 日常百搭`,
    ], i);
  } else if (c === 'game') {
    const typ = /耳机/.test(sku) ? '头戴降噪耳机' : /音箱/.test(sku) ? '便携蓝牙音箱' : /VR/.test(sku) ? 'VR一体机' : '游戏主机';
    mid = tpool([
      `${b} ${m} ${typ} 主动降噪 沉浸音质`,
      `${b} ${m} ${typ} 高刷低延迟 游戏影音`,
      `${b} ${m} 同款 ${typ} 发烧友首选`,
    ], i);
  } else if (c === 'camera') {
    const typ = /360|全景/.test(sku) ? '8K 360°全景相机' : /运动/.test(sku) ? '防水运动相机' : /Pocket|云台/.test(sku) ? '口袋云台相机' : '全画幅微单';
    mid = tpool([
      `${b} ${m} ${typ} 高像素 快速对焦 强防抖`,
      `${b} ${m} ${typ} vlog神器 直出色彩讨喜`,
      `${b} ${m} 同款 ${typ} 出片率拉满 旅行必备`,
    ], i);
  } else if (c === 'home') {
    const typ = /吸尘/.test(m) ? '无线大吸力' : /吹风/.test(m) ? '智能温控护发' : /空调/.test(m) ? '变频一级能效' : /冰箱/.test(m) ? '对开门风冷无霜' : '自清洁扫拖';
    mid = tpool([
      `${b} ${m} ${typ} 静音节能 居家好物`,
      `${b} ${m} ${typ} 智能操控 省心省力`,
      `${b} ${m} 同款 ${typ} 提升幸福感`,
    ], i);
  } else if (c === 'beauty') {
    const typ = /精华/.test(m) ? '修护精华' : /面霜/.test(m) ? '抗老面霜' : /神仙水/.test(m) ? '护肤精华水' : '修护面霜';
    mid = tpool([
      `${b} ${m} ${typ} 保湿修护 易吸收不黏腻`,
      `${b} ${m} ${typ} 口碑回购 肌肤透亮`,
      `${b} ${m} 同款 ${typ} 贵妇体验 安心之选`,
    ], i);
  } else if (c === 'sport') {
    const typ = /Jordan|纽|Bal/.test(m) ? '复古运动鞋' : /瑜伽/.test(m) ? '裸感瑜伽裤' : /公路/.test(m) ? '入门公路车' : 'GORE-TEX冲锋衣';
    mid = tpool([
      `${b} ${m} ${typ} 缓震支撑 透气排汗`,
      `${b} ${m} ${typ} 防风防水 户外探险`,
      `${b} ${m} 同款 ${typ} 运动达人首选`,
    ], i);
  } else if (c === 'auto') {
    mid = tpool([
      `${b} ${m} 原车适配 安装便捷 安全实用`,
      `${b} ${m} 稳定可靠 行车必备好物`,
      `${b} ${m} 同款 ${sku} 提升出行体验`,
    ], i);
  } else if (c === 'smart') {
    const typ = /门锁/.test(m) ? '3D人脸智能门锁' : /音箱/.test(m) ? '智能语音音箱' : '护眼智能台灯';
    mid = tpool([
      `${b} ${m} ${typ} 全屋联动 语音控制`,
      `${b} ${m} ${typ} 灵敏稳定 科技融入生活`,
      `${b} ${m} 同款 ${typ} 智能家居好搭档`,
    ], i);
  } else if (c === 'fashion') {
    const typ = /羽绒/.test(m) ? '轻薄羽绒服' : /New|Bal/.test(m) ? '复古运动鞋' : '极简羊毛大衣';
    mid = tpool([
      `${b} ${m} ${typ} 优质面料 保暖百搭`,
      `${b} ${m} ${typ} 考究版型 通勤出街`,
      `${b} ${m} 同款 ${typ} 不费力高级感`,
    ], i);
  } else if (c === 'baby') {
    const typ = /推车/.test(m) ? '轻便婴儿推车' : /手表/.test(m) ? '儿童电话手表' : '婴儿护肤套装';
    mid = tpool([
      `${b} ${m} ${typ} 食品级材质 安全贴心`,
      `${b} ${m} ${typ} 轻便好用 新手爸妈省心`,
      `${b} ${m} 同款 ${typ} 带娃好物`,
    ], i);
  } else if (c === 'food') {
    const typ = /茅台/.test(m) ? '53度酱香白酒' : /咖啡/.test(m) ? '中度烘焙咖啡豆' : '坚果大礼包';
    mid = tpool([
      `${b} ${m} ${typ} 正品保障 口感醇厚`,
      `${b} ${m} ${typ} 礼盒体面 自饮送礼`,
      `${b} ${m} 同款 ${typ} 囤货必备`,
    ], i);
  } else if (c === 'jewelry') {
    const typ = /钻/.test(m) ? '18K钻石戒指' : /手链/.test(m) ? '925银串饰手链' : /项链/.test(m) ? '水晶项链' : '精致珠宝';
    mid = tpool([
      `${b} ${m} ${typ} 精工镶嵌 火彩璀璨`,
      `${b} ${m} ${typ} 经典百搭 送礼体面`,
      `${b} ${m} 同款 ${typ} 心意好礼`,
    ], i);
  } else {
    mid = `${b} ${m} ${sku}`;
  }
  return (pre + ' ' + mid + ' ' + suf).replace(/\s+/g, ' ').trim();
}

/* 旗舰商品：官方主图 + 多角度/场景图（确保图片与本商品对应） */
PRODUCTS_RAW[0].gallery   = ['img/p001.jpg','img/p001b.png','img/p001c.png'];
PRODUCTS_RAW[11].gallery  = ['img/p006.jpg','img/p006b.png','img/p006c.png'];
PRODUCTS_RAW[22].gallery  = ['img/p011.jpg','img/p011b.png','img/p011c.png'];
PRODUCTS_RAW[31].gallery  = ['img/p015.jpg','img/p015b.png','img/p015c.png'];
PRODUCTS_RAW[49].gallery  = ['img/p021.jpg','img/p021b.png','img/p021c.png'];
PRODUCTS_RAW[55].gallery  = ['img/p025.jpg','img/p025b.png','img/p025c.png'];
PRODUCTS_RAW[60].gallery  = ['img/p030.jpg','img/p030b.png','img/p030c.png'];
PRODUCTS_RAW[72].gallery  = ['img/p034.jpg','img/p034b.png','img/p034c.png'];
PRODUCTS_RAW[77].gallery  = ['img/p039.jpg','img/p039b.png','img/p039c.png'];
PRODUCTS_RAW[81].gallery  = ['img/p043.jpg','img/p043b.png','img/p043c.png'];
PRODUCTS_RAW[85].gallery  = ['img/p047.jpg','img/p047b.png','img/p047c.png'];
PRODUCTS_RAW[88].gallery  = ['img/p050.jpg','img/p050b.png','img/p050c.png'];
PRODUCTS_RAW[91].gallery  = ['img/p053.jpg','img/p053b.png','img/p053c.png'];
PRODUCTS_RAW[94].gallery  = ['img/p056.jpg','img/p056b.png','img/p056c.png'];
PRODUCTS_RAW[97].gallery  = ['img/p059.jpg','img/p059b.png','img/p059c.png'];
PRODUCTS_RAW[100].gallery = ['img/p062.jpg','img/p062b.png','img/p062c.png'];

/* 各品类的真实规格维度：
   - 每个品类第 1 个 axis 是「价格影响维度」（如手机存储、服装尺码），用于生成可点击的规格按钮并联动价格
   - 第 2 个 axis（可选）是「外观维度」（如颜色/表带），不调价，仅作为下单规格的一部分，更贴近真实电商 */
const SPEC_AXES = {
  phone:   [{ label: '存储', opts: [['128GB', -0.10], ['256GB', 0], ['512GB', 0.16], ['1TB', 0.34]] }, { label: '颜色', opts: ['曜石黑', '远峰蓝', '钛原色', '星光白'] }],
  laptop:  [{ label: '配置', opts: [['i5/16G', -0.14], ['i5/32G', -0.05], ['i7/32G', 0], ['i9/64G', 0.30]] }, { label: '颜色', opts: ['深空灰', '银色', '午夜黑'] }],
  drone:   [{ label: '套装', opts: [['单机版', -0.18], ['标准套装', 0], ['畅飞套装', 0.15], ['全能套装', 0.32]] }, { label: '颜色', opts: ['曜石黑', '雪山白'] }],
  luxury:  [{ label: '尺寸', opts: [['小号', -0.06], ['中号', 0], ['大号', 0.12]] }, { label: '颜色', opts: ['经典黑', '焦糖棕', '雾霾蓝'] }],
  watch:   [{ label: '表盘', opts: [['41mm', -0.05], ['45mm', 0], ['49mm', 0.10]] }, { label: '表带', opts: ['运动型', '米兰尼斯', '皮革'] }],
  game:    [{ label: '版本', opts: [['数字版', -0.08], ['光驱版', 0], ['Pro版', 0.22]] }, { label: '手柄色', opts: ['曜石黑', '星云粉', '冰川白'] }],
  camera:  [{ label: '套装', opts: [['单机身', -0.20], ['标准套机', 0], ['变焦套机', 0.18]] }, { label: '颜色', opts: ['黑色', '银色'] }],
  home:    [{ label: '容量', opts: [['小容量', -0.10], ['标准', 0], ['大容量', 0.14]] }, { label: '颜色', opts: ['珍珠白', '星空灰', '钛金灰'] }],
  beauty:  [{ label: '规格', opts: [['正装', 0], ['旅行装', -0.12], ['豪华套装', 0.20]] }, { label: '色号', opts: ['自然色', '粉调', '裸色'] }],
  sport:   [{ label: '尺码', opts: [['S', -0.05], ['M', 0], ['L', 0.04], ['XL', 0.08]] }, { label: '颜色', opts: ['极夜黑', '荧光绿', '云朵白'] }],
  auto:    [{ label: '适配', opts: [['通用款', -0.06], ['专车专用', 0]] }, { label: '颜色', opts: ['黑色', '灰色'] }],
  smart:   [{ label: '版本', opts: [['标准版', -0.06], ['Pro版', 0]] }, { label: '颜色', opts: ['白色', '黑色'] }],
  fashion: [{ label: '尺码', opts: [['S', -0.04], ['M', 0], ['L', 0.03], ['XL', 0.06], ['XXL', 0.09]] }, { label: '颜色', opts: ['经典黑', '米白', '雾霾蓝', '酒红'] }],
  baby:    [{ label: '尺码', opts: [['NB', -0.06], ['S', 0], ['M', 0.03], ['L', 0.06]] }, { label: '颜色', opts: ['奶白', '浅蓝', '浅粉'] }],
  food:    [{ label: '规格', opts: [['小瓶', -0.14], ['标准装', 0], ['礼盒装', 0.18]] }, null],
  jewelry: [{ label: '尺寸', opts: [['可调', -0.03], ['标准', 0], ['加大', 0.06]] }, { label: '颜色', opts: ['金色', '银色', '玫瑰金'] }],
  toy:     [{ label: '款式', opts: [['基础款', -0.08], ['热门口径', 0], ['限定款', 0.20]] }, { label: '颜色', opts: ['随机', '指定色'] }],
  pet:     [{ label: '适用', opts: [['小型犬/猫', -0.06], ['中型', 0], ['大型', 0.10]] }, { label: '颜色', opts: ['白', '灰', '粉'] }],
  furniture: [{ label: '尺寸', opts: [['单人', -0.14], ['标准', 0], ['加大', 0.16]] }, { label: '颜色', opts: ['原木色', '胡桃色', '白色'] }],
  music:   [{ label: '型号', opts: [['入门款', -0.14], ['标准款', 0], ['专业款', 0.22]] }, { label: '颜色', opts: ['原木色', '黑色', '白色'] }],
};

/* 生成 SKU 变体：用该品类第 1 个规格维度生成可选项（存储/尺码/套餐…），不同选项对应不同价格 */
function buildVariants(p) {
  const ax = (SPEC_AXES[p.cat] || SPEC_AXES.smart)[0];
  const base = p.price, old = p.old, r = n => Math.round(n);
  const list = ax.opts.map(([name, delta]) => ({
    name,
    price: r(base * (1 + delta)),
    old: r(old * (1 + delta)),
    def: delta === 0,
  }));
  if (!list.some(v => v.def)) list[0].def = true;
  return list;
}

const PRODUCTS = PRODUCTS_RAW.map((p, i) => {
  const grad = GRADS[p.cat] || ['#888', '#555'];
  const title = buildTitle(p, i);
  return {
    ...p,
    id: 'P' + String(i + 1).padStart(3, '0'),
    catName: CAT_NAME[p.cat],
    grad,
    title,
    tags: ['包邮', '7天无理由', '假一赔十', '极速发货'],
    desc: `${title}，官方正品保证，顺丰包邮，享全国联保与无忧售后。`,
    intro: buildIntro(p),
    specs: buildSpecs(p),
    gallery: p.gallery || [p.img],
    variants: buildVariants(p),
    specAxes: SPEC_AXES[p.cat] || SPEC_AXES.smart,
    reviews: buildReviews(p.cat, p.rating, 4 + (i % 3)),
  };
});

/* 每日刷新：用“当天日期”做确定性随机种子，对销量/库存做日级扰动。
   同天内稳定、跨天自动变化，用户每天进店看到的“已售/库存”都在变，
   营造“店铺每天都在更新”的鲜活感，无需手动改文件。 */
function refreshCatalogDaily() {
  const d = new Date();
  let s = (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  PRODUCTS.forEach(p => {
    const base = p.sales || 0;
    p.sales = Math.max(1, Math.round(base * (0.9 + rnd() * 0.2))); // ±10% 日浮动
    const bs = p.stock != null ? p.stock : (60 + Math.floor(rnd() * 400));
    p.stock = Math.max(0, Math.round(bs * (0.82 + rnd() * 0.36))); // ±18% 日浮动
  });
}
refreshCatalogDaily();

const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

/* =========================================================
   秒杀（限时）：选若干商品做秒杀价，整点/固定时长倒计时
   ========================================================= */
const SECKILL = [
  { id: 'P003', price: 5799, stock: 200, total: 1000 },
  { id: 'P023', price: 12999, stock: 80, total: 500 },
  { id: 'P056', price: 2199, stock: 300, total: 2000 },
  { id: 'P073', price: 4490, stock: 150, total: 800 },
  { id: 'P082', price: 1099, stock: 500, total: 3000 },
  { id: 'P098', price: 2399, stock: 120, total: 600 },
  { id: 'P101', price: 17999, stock: 60, total: 300 },
  { id: 'P087', price: 499, stock: 800, total: 5000 },
  { id: 'P011', price: 6499, stock: 150, total: 800 },
  { id: 'P072', price: 2699, stock: 300, total: 2000 },
];
// 把秒杀价合并进商品
SECKILL.forEach(s => {
  const p = PRODUCT_MAP[s.id];
  if (p) { p.seckill = s.price; p.seckillStock = s.stock; }
});

/* =========================================================
   优惠券（领券中心）：满减 / 折扣，scope 限定品类('all' 或逗号分隔)
   ========================================================= */
const COUPONS = [
  { id: 'c1', title: '新人专享券', type: '满减', threshold: 100, amount: 20, scope: 'all', desc: '满100减20 · 全场通用' },
  { id: 'c2', title: '数码大额券', type: '满减', threshold: 5000, amount: 300, scope: 'all', desc: '满5000减300 · 全场通用' },
  { id: 'c3', title: '美妆护肤券', type: '满减', threshold: 500, amount: 60, scope: 'beauty,luxury', desc: '满500减60 · 美妆/奢侈品' },
  { id: 'c4', title: '家电智能券', type: '满减', threshold: 2000, amount: 200, scope: 'home,smart,auto', desc: '满2000减200 · 家电/智能/汽车' },
  { id: 'c5', title: '全场9折券', type: '折扣', threshold: 0, rate: 0.9, cap: 200, scope: 'all', desc: '无门槛9折 · 最高减200' },
  { id: 'c6', title: '食品母婴券', type: '满减', threshold: 300, amount: 30, scope: 'food,baby', desc: '满300减30 · 食品/母婴' },
  { id: 'c7', title: '奢侈品尊享券', type: '满减', threshold: 50000, amount: 3000, scope: 'luxury,jewelry', desc: '满5万减3000 · 奢侈品/珠宝' },
];
