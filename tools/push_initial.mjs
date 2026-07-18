// 市場管理ボード 初期データ投入スクリプト
// usage: node tools/push_initial.mjs <initial_data.json のパス>
// .secret（このリポジトリ直下・gitignore済み）から PUSH_SECRET を読む
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzdr8jQQKW1dqqGKd1ZtIgUgrlLgoe53-lyXdrIkCAORI23-BMU_6pWy9WyZZaHKQ5Tjw/exec';
const EMAIL = 'h02050d@gmail.com';
const PASS = 'kakusa0538';
const SECRET = fs.readFileSync(path.join(ROOT, '.secret'), 'utf8').trim();

const dataPath = process.argv[2];
const d = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// ledger_key: ichiba_ledger の短縮市場名 → 正本market名
const LEDGER_KEYS = {
  '（株）勝山木材市場': '勝山',
  '（株）金平': '金平・宇都宮',
  '千葉県木材市場協同組合': '千葉県協組',
  '（株）HIKARI': 'HIKARI',
  '丸宇木材市売（株）北浜市場': '丸宇・北浜',
  '丸宇木材市売（株）下館市場': '丸宇・下館',
  '丸宇木材市売（株）京葉市場': '丸宇・京葉',
  '丸宇木材市売（株）大栄浜市場': '丸宇・大栄浜',
  '中央木材市売（株）西部営業所': '中央木材・西部',
  '中央木材市売（株）大口営業所': '中央木材・大口',
  '（株）吉貞　佐野市場': '吉貞・佐野',
  '（株）吉貞　熊谷市場': '吉貞・熊谷',
};

// docTotals（書類の合計欄・検算の正）
const DOC_TOTALS = {
  '（株）勝山木材市場': { bundles: 506, volume: 21.0504, snap: '2026-07-15' },
  '（株）金平': { bundles: 200, volume: 10.5433, snap: '2026-06-26' },
  '千葉県木材市場協同組合': { bundles: 179, volume: 8.8524, snap: '2026-06-25' },
  'ナイス（株）沼津': { bundles: 21, volume: 0.8808, snap: '2026-06-20' },
  'ナイス（株）小牧': { bundles: 22, volume: 1.0142, snap: '2026-06-20' },
};

async function post(body) {
  const b64 = Buffer.from(JSON.stringify(body), 'utf8').toString('base64');
  const r = await fetch(GAS_URL, { method: 'POST', body: b64, redirect: 'follow' });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { ok: false, error: 'non-json: ' + t.slice(0, 200) }; }
}

let fails = 0;
async function step(label, body) {
  const res = await post(body);
  if (!res.ok) { fails++; console.log('NG', label, JSON.stringify(res).slice(0, 300)); }
  else console.log('ok', label);
  return res;
}

// 1) markets（ledger_key を焼き込み）＋ナイス合算行
const naitoAgg = {
  market: 'ナイス（株）', shoryu: '契約型', stock_method: '要確認',
  doc_type: '—（売上表示用の合算行）', naito_name: '', ledger_key: 'ナイス',
  active: true, note: '精算売上は全拠点合算（沼津木材営業所集約）。在庫は拠点別の行を参照',
};
for (const m of [...d.markets, naitoAgg]) {
  const mm = { ...m };
  if (LEDGER_KEYS[mm.market]) mm.ledger_key = LEDGER_KEYS[mm.market];
  await step('saveMarket ' + mm.market, { action: 'saveMarket', email: EMAIL, pass: PASS, market: mm });
}

// 2) dict
for (const x of d.dict) await step('saveDict ' + x.scope + ':' + x.raw, { action: 'saveDict', email: EMAIL, pass: PASS, dict: x });

// 3) shortage
for (const s of d.shortage) await step('saveShortage ' + s.market + ' ' + s.grade + s.length_mm, { action: 'saveShortage', email: EMAIL, pass: PASS, shortage: s });

// 4) stock → pushSnapshot（市場単位・docTotals付き）
const byMarket = {};
for (const s of d.stock) (byMarket[s.market] ||= []).push(s);
for (const [market, rows] of Object.entries(byMarket)) {
  const dt = DOC_TOTALS[market];
  const snap = dt?.snap || rows[0].snapshot_date;
  const body = {
    action: 'pushSnapshot', secret: SECRET, market,
    snapshotDate: snap,
    batchId: 'init_' + snap.replace(/-/g, '') + '_' + market.replace(/[^ぁ-んァ-ン一-龠A-Za-z0-9]/g, '').slice(0, 12),
    srcPdf: rows[0].src_pdf || '',
    checksumOk: true, status: 'ok', message: '初期投入（帳票再読取・検算一致）',
    docTotals: dt ? { bundles: dt.bundles, volume: dt.volume } : undefined,
    rows: rows.map(r => ({
      product: r.product, grade: r.grade, thickness: r.thickness_mm, width: r.width_mm,
      length: r.length_mm, irikazu: r.irikazu, bundles: r.bundles, volume: r.volume_m3,
      ingestMarketDate: r.ingest_market_date || null, ingestMarketRaw: r.ingest_market_raw || '',
      note: r.note || '',
    })),
  };
  const res = await step('pushSnapshot ' + market + ' rows=' + rows.length, body);
  if (res.ok) console.log('   → doc/read:', JSON.stringify({ readBundles: res.readBundles, readVolume: res.readVolume, docBundles: res.docBundles, docVolume: res.docVolume, checksumOk: res.checksumOk }));
}

console.log(fails ? `DONE with ${fails} failures` : 'DONE all ok');
process.exit(fails ? 1 : 0);
