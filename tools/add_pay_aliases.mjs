/**
 * マネフォの入金仕訳 remark に出てくる市場の呼び名を、dict(scope=市場名) へ登録する。
 * 冪等ではないので**一度だけ**実行する（既に入っているものは重複行になる）。
 * 呼び名の出所＝FY2026の入金仕訳71件の実データ（tools/push_payments.mjs で投入したもの）。
 */
import fs from 'node:fs';
import path from 'node:path';

const EXEC = 'https://script.google.com/macros/s/AKfycbzdr8jQQKW1dqqGKd1ZtIgUgrlLgoe53-lyXdrIkCAORI23-BMU_6pWy9WyZZaHKQ5Tjw/exec';
const EMAIL = 'h02050d@gmail.com';
const PASS = 'kakusa0538';

// raw（マネフォのremarkでの呼び名） → normalized（markets正本名）
const ALIASES = [
  ['アイシンヒカリ', '（株）HIKARI'],
  ['千葉木', '千葉県木材市場協同組合'],
  ['千葉県木材市場共同組合', '千葉県木材市場協同組合'],   // 共/協 の揺れ
  ['中央木材西部', '中央木材市売（株）西部営業所'],
  ['中央木材大口', '中央木材市売（株）大口営業所'],
  ['ナイス相模原', 'ナイス（株）相模原'],
  ['ナイス沼津', 'ナイス（株）沼津'],
  ['ナイス小牧', 'ナイス（株）小牧'],
  ['金平', '（株）金平'],
  ['吉貞佐野', '（株）吉貞　佐野市場'],
  ['吉貞熊谷', '（株）吉貞　熊谷市場'],
  ['勝山木材', '（株）勝山木材市場'],
  ['アイザワ', '(株)アイザワ'],
  ['ミトモク', '㈱ミトモク日立'],
  ['ナイス（株）資材事業本部', 'ナイス（株）'],
  ['ナイス（株）木材事業', 'ナイス（株）'],
  ['ナイス資材', 'ナイス（株）'],
];

const existing = await (await fetch(`${EXEC}?api=all&email=${encodeURIComponent(EMAIL)}&pass=${PASS}`)).json();
const have = new Set((existing.dict || []).filter(d => d.scope === '市場名').map(d => d.raw));

let added = 0, skipped = 0;
for (const [raw, normalized] of ALIASES) {
  if (have.has(raw)) { skipped++; continue; }
  const res = await fetch(EXEC, {
    method: 'POST', redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'saveDict', email: EMAIL, pass: PASS,
      dict: { scope: '市場名', raw, normalized, note: 'マネフォ入金仕訳のremark表記' },
    }),
  });
  const j = JSON.parse(await res.text());
  if (!j.ok) { console.error('失敗', raw, j.error); process.exit(1); }
  added++;
  console.log(`  + ${raw} → ${normalized}`);
}
console.log(`登録${added} / 既存スキップ${skipped}`);
