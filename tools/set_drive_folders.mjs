// 市場マスタに精算書Driveフォルダリンクを設定（saveMarketのupsert・drive_folderのみ更新）
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzdr8jQQKW1dqqGKd1ZtIgUgrlLgoe53-lyXdrIkCAORI23-BMU_6pWy9WyZZaHKQ5Tjw/exec';
const EMAIL = 'h02050d@gmail.com';
const PASS = 'kakusa0538';
const AU = ''; // 2026-07-19 h02050dへ閲覧者共有済みのためauthuser指定を廃止（スマホ=h02050dのみのブラウザでも開けるように）
const F = id => `https://drive.google.com/drive/folders/${id}${AU}`;

const FOLDER = {
  // 専用フォルダあり（02_経理\01.会計帳簿\市場売上明細\）
  '（株）勝山木材市場': F('1czxbOdXvikhFXgSTE_vqnycJ2dicQkmO'),
  '(株)アイザワ': F('1bbN_mXmjK4b-W0psPAZqQI_pHAgtDp4F'),
  '丸宇木材市売（株）北浜市場': F('1A5KQUaZXWZrvbDctgRfM0TOGDMrbh6aP'),
  '丸宇木材市売（株）下館市場': F('1A5KQUaZXWZrvbDctgRfM0TOGDMrbh6aP'),
  '丸宇木材市売（株）京葉市場': F('1A5KQUaZXWZrvbDctgRfM0TOGDMrbh6aP'),
  '丸宇木材市売（株）大栄浜市場': F('1A5KQUaZXWZrvbDctgRfM0TOGDMrbh6aP'),
  'ナイス（株）沼津': F('1NdBZKZfXNCdusdNWtDV4tuZKyejEcxy1'),
  'ナイス（株）小牧': F('1NSEQNtjJYyW1AB9PNXzmIkoQelnwGuWT'),
  'ナイス（株）相模原': F('1N_e5QkAH_UL3QU3PIpjpATKHt60HhkYl'),
  'ナイス（株）浜松': F('1NV5wE7hssAbtUknRy6hoZ3sMmqyQthl7'),
  'ナイス（株）新潟': F('1PGtwdp9dqFpIKY_PGK0MA-3ZhCHfA3HW'),
  'ナイス（株）横浜': F('1DjE6ixoIrHFDNabt2wJgMpuiv97h8HnV'),
  'ナイス（株）長野': F('1e9D9X6E7fbR2zKvM_QaDzzEImkDnTVo8'),
  'ナイス（株）前橋': F('1bSj9yfa3GXdRbJTfjZdUjFyQyzCz4dBD'),
  'ナイス（株）': F('1MxO_BwRXZwK_nLxi3rkoO2dZvdjITaSV'),
  'ナイス（株）宇都宮': F('1MxO_BwRXZwK_nLxi3rkoO2dZvdjITaSV'),
  'ナイス（株）埼玉': F('1MxO_BwRXZwK_nLxi3rkoO2dZvdjITaSV'),
  'ナイス（株）滋賀': F('1MxO_BwRXZwK_nLxi3rkoO2dZvdjITaSV'),
  'ナイス（株）岡山': F('1MxO_BwRXZwK_nLxi3rkoO2dZvdjITaSV'),
  // 専用フォルダなし（紙スキャン）→ スキャンアーカイブ（月別・処理済みが貯まる）
  '（株）HIKARI': F('1ckksPL5eth1TYaUNlWhf1YdOMNXek3Xa'),
  '（株）金平': F('1ckksPL5eth1TYaUNlWhf1YdOMNXek3Xa'),
  '千葉県木材市場協同組合': F('1ckksPL5eth1TYaUNlWhf1YdOMNXek3Xa'),
  '中央木材市売（株）西部営業所': F('1ckksPL5eth1TYaUNlWhf1YdOMNXek3Xa'),
  '中央木材市売（株）大口営業所': F('1ckksPL5eth1TYaUNlWhf1YdOMNXek3Xa'),
  '（株）吉貞　佐野市場': F('1ckksPL5eth1TYaUNlWhf1YdOMNXek3Xa'),
  '（株）吉貞　熊谷市場': F('1ckksPL5eth1TYaUNlWhf1YdOMNXek3Xa'),
  '㈱ミトモク日立': F('1ckksPL5eth1TYaUNlWhf1YdOMNXek3Xa'),
  '北隅木材（株）': F('1ckksPL5eth1TYaUNlWhf1YdOMNXek3Xa'),
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
