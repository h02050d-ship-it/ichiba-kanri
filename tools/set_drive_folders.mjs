// 市場マスタの精算書フォルダリンクを「精算書ライブラリ」（市場別コピー集約）に設定
// ライブラリ: 02_経理\01.会計帳簿\市場売上明細\精算書ライブラリ\（2026-07-21新設・毎朝の定期取込が追記）
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzdr8jQQKW1dqqGKd1ZtIgUgrlLgoe53-lyXdrIkCAORI23-BMU_6pWy9WyZZaHKQ5Tjw/exec';
const EMAIL = 'h02050d@gmail.com';
const PASS = 'kakusa0538';
const F = id => `https://drive.google.com/drive/folders/${id}`; // 市場売上明細をh02050dへ共有済み＝権限継承・authuser不要

const LIB_ROOT = '1fJrwa2ee0R1coX6sVeabj_bRCy3lHxAo';
const FOLDER = {
  '（株）勝山木材市場': F('1yv4GhV7JpIBp9RBWMZ-E_UBSStOjkuwZ'),
  '（株）金平': F('1hJ8vHanz_YRYWQpP2AkT6-JmJw0RQyY1'),
  '千葉県木材市場協同組合': F('1cBat8tXMzLcdUHPxxdsMVYmrcO_VHC2f'),
  '（株）HIKARI': F('1E-lf8ASopRI2DTPOnt-vJJmYIgGRh8DW'),
  '中央木材市売（株）西部営業所': F('1S2E0vooDbnzU3bw0KgOdbrWAsJ6MmlCz'),
  '中央木材市売（株）大口営業所': F('1S2E0vooDbnzU3bw0KgOdbrWAsJ6MmlCz'),
  '（株）吉貞　佐野市場': F('1dNMtkYvBAm1bYcHgiSns_9myqJZnrFHG'),
  '（株）吉貞　熊谷市場': F('1n8YJeT1WgaXNgYhgKYP8KZCe_Zn8FpdO'),
  '丸宇木材市売（株）北浜市場': F('1TsQUo-ztt1pLBs95xFMefqsnd8uaBNqR'),
  '丸宇木材市売（株）下館市場': F('1TsQUo-ztt1pLBs95xFMefqsnd8uaBNqR'),
  '丸宇木材市売（株）京葉市場': F('1TsQUo-ztt1pLBs95xFMefqsnd8uaBNqR'),
  '丸宇木材市売（株）大栄浜市場': F('1TsQUo-ztt1pLBs95xFMefqsnd8uaBNqR'),
  '(株)アイザワ': F('1aoV2j0kzd5EQUG2a0VBI_QT2j2Knt0FJ'),
  'ナイス（株）沼津': F('1ltpLgX6hjmUs_QHbmms9Du6BYqaeZDw5'),
  'ナイス（株）小牧': F('1qJZm5WkNP90r9MepJZtFXnbsOGk0u2gp'),
  'ナイス（株）相模原': F('1bcrDalvJ7na23xoAENj00c33bKH9Di4w'),
  'ナイス（株）新潟': F('1VMa6QVGWp-9iIIUMI9-0lk-TcCxKLhwZ'),
  'ナイス（株）浜松': F('1M4eF80UtgS6iFtdGR8sQlC0SuWoy-IvX'),
  'ナイス（株）横浜': F('1An7Y4fqfw7TpWvFb1EKibFU0IQ2oNmss'),
  'ナイス（株）前橋': F('1-m2mOVV2OfXtpnftAc6VQYsaOSOb5Mgk'),
  'ナイス（株）長野': F('1BiUPMYv2LYC4LMs5ZwvXA70pwnpx0KOe'),
  'ナイス（株）': F(LIB_ROOT),
  'ナイス（株）宇都宮': F(LIB_ROOT),
  'ナイス（株）埼玉': F(LIB_ROOT),
  'ナイス（株）滋賀': F(LIB_ROOT),
  'ナイス（株）岡山': F(LIB_ROOT),
  '㈱ミトモク日立': F(LIB_ROOT),
  '北隅木材（株）': F(LIB_ROOT),
};

async function post(body) {
  const b64 = Buffer.from(JSON.stringify(body), 'utf8').toString('base64');
  const r = await fetch(GAS_URL, { method: 'POST', body: b64, redirect: 'follow' });
  return JSON.parse(await r.text());
}
let ng = 0;
for (const [market, url] of Object.entries(FOLDER)) {
  const res = await post({ action: 'saveMarket', email: EMAIL, pass: PASS, market: { market, drive_folder: url } });
  if (!res.ok) { ng++; console.log('NG', market, JSON.stringify(res)); } else console.log('ok', market);
}
console.log(ng ? `DONE with ${ng} NG` : 'DONE all ok');
