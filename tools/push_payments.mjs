/**
 * マネフォの入金仕訳 → 市場管理ボードGAS の payments シートへ投入する。
 *
 * 使い方:
 *   node tools/push_payments.mjs <journalsJson> [<journalsJson> ...]
 *   引数は マネフォMCP `mfc_ca_getJournals` の戻り（{journals:[...]} 形式）をそのまま保存したファイル。
 *   MCPの結果が大きい場合はツール側が自動でファイルに落とすので、そのパスを渡せばよい。
 *   （ファイル先頭にツールの注記が付いていても最初の '{' から読むので気にしなくてよい）
 *
 * ★このスクリプトは「素通しのパイプ」。remarkの解釈・市場名の名寄せ・市日の年推定は
 *   すべてGAS側（入金突合.js）でやる。ここで解釈すると、あとから読み直せなくなる。
 *
 * 抽出条件: 借方に「◯◯預金」があり、貸方に「売上高」がある仕訳＝売上の入金。
 *   借入・振替・経費支払は対象外。ECの入金（楽天・ヤフー）も形は同じなので拾うが、
 *   GAS側が remark を見て kind='対象外' に分類する。
 */
import fs from 'node:fs';
import path from 'node:path';

const EXEC = 'https://script.google.com/macros/s/AKfycbzdr8jQQKW1dqqGKd1ZtIgUgrlLgoe53-lyXdrIkCAORI23-BMU_6pWy9WyZZaHKQ5Tjw/exec';
const SECRET = fs.readFileSync(path.join(process.cwd(), '.secret'), 'utf8').trim();

const files = process.argv.slice(2);
if (!files.length) {
  console.error('usage: node tools/push_payments.mjs <journalsJson> [...]');
  process.exit(1);
}

const seen = new Set();
const rows = [];
for (const f of files) {
  const t = fs.readFileSync(f, 'utf8');
  const j = JSON.parse(t.slice(t.indexOf('{')));
  for (const x of (j.journals || [])) {
    if (seen.has(x.id)) continue;
    const hasDeposit = x.branches.some(b => b.debitor && /預金/.test(b.debitor.account_name));
    const hasSales = x.branches.some(b => b.creditor && /売上高/.test(b.creditor.account_name));
    if (!hasDeposit || !hasSales) continue;
    seen.add(x.id);

    let deposit = 0, sales = 0, tax = 0, deduct = 0, remark = '';
    for (const b of x.branches) {
      const d = b.debitor, c = b.creditor;
      if (d && /預金/.test(d.account_name)) deposit += d.value;
      else if (d) deduct += d.value;                       // 支払手数料・精算利息・振込料など
      if (c && /売上高/.test(c.account_name)) {
        sales += c.value;
        tax += c.tax_value || 0;
        if (!remark && b.remark) remark = b.remark;        // 市場名＋市日が入っているのは売上高側の行
      }
    }
    if (!remark) remark = (x.branches[0] && x.branches[0].remark) || '';
    rows.push({
      journalId: x.id,
      payDate: x.transaction_date,
      remark: String(remark).replace(/\n/g, ' ').trim(),
      deposit, sales, tax, deduct,
    });
  }
}

console.log(`抽出: ${rows.length}件（入力ファイル ${files.length}本）`);
if (!rows.length) process.exit(0);

// GASのURLFetchは一度に大量だと重いので分割
const CHUNK = 200;
let added = 0, updated = 0;
for (let i = 0; i < rows.length; i += CHUNK) {
  const body = { action: 'pushPayments', secret: SECRET, rows: rows.slice(i, i + CHUNK) };
  const res = await fetch(EXEC, {
    method: 'POST', redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body),
  });
  const txt = await res.text();
  let j;
  try { j = JSON.parse(txt); } catch { console.error('応答がJSONでない:', txt.slice(0, 200)); process.exit(1); }
  if (!j.ok) { console.error('push失敗:', j.error); process.exit(1); }
  added += j.added; updated += j.updated;
}
console.log(`push完了: 追加${added} / 更新${updated}`);
