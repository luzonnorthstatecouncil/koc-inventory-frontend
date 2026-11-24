import { priceParser } from "./parser";

const esc = (v) =>
   String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const when = (v) => (v ? new Date(v).toLocaleString() : "—");

/** Print an X or Z reading on an 80mm receipt printer (opens a small window and prints it). */
export function printShiftReport(report) {
   const { reading, shift, summary, cash } = report;
   const row = (label, value, strong = false) =>
      `<tr${strong ? ' class="strong"' : ""}><td>${esc(label)}</td><td class="r">${esc(value)}</td></tr>`;

   const methods = summary.by_payment_method
      .map((m) => row(`${m.method.toUpperCase()} (${m.sales_count})`, priceParser(m.net_sales)))
      .join("");

   const html = `<!doctype html><html><head><title>${reading} reading #${shift.id}</title><style>
      @page { size: 80mm auto; margin: 0; }
      body { font: 12px/1.4 ui-monospace, monospace; width: 72mm; margin: 4mm auto; color: #000; }
      h1 { font-size: 16px; text-align: center; margin: 0 0 2mm; }
      p { margin: 0; text-align: center; }
      table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
      td { padding: 0.5mm 0; } .r { text-align: right; } .strong td { font-weight: bold; }
      hr { border: 0; border-top: 1px dashed #000; margin: 2mm 0; }
   </style></head><body>
      <h1>${reading === "Z" ? "Z READING (END OF SHIFT)" : "X READING (MID-SHIFT)"}</h1>
      <p>Shift #${esc(shift.id)} · ${esc(shift.user?.full_name ?? "")}</p>
      <p>Opened ${esc(when(shift.opened_at))}</p>
      ${shift.closed_at ? `<p>Closed ${esc(when(shift.closed_at))}${shift.closedBy ? ` by ${esc(shift.closedBy.full_name)}` : ""}</p>` : ""}
      <p>Printed ${esc(when(new Date()))}</p>
      <hr><table>
         ${row(`Sales (${summary.sales_count})`, priceParser(summary.gross_sales))}
         ${row(`Refunds (${summary.refunds_count})`, `-${priceParser(summary.refunds)}`)}
         ${row("Net sales", priceParser(summary.net_sales), true)}
         ${row(`Voided sales (${summary.voids_count})`, priceParser(summary.voids))}
         ${row("Items sold", summary.units_sold)}
      </table><hr><table>${methods || row("No payments", "")}</table><hr><table>
         ${row("Opening cash", priceParser(cash.opening_float))}
         ${row("+ Cash sales", priceParser(cash.cash_sales))}
         ${row("- Cash refunds", priceParser(cash.cash_refunds))}
         ${row("Expected in drawer", priceParser(cash.expected), true)}
         ${cash.counted !== null ? row("Counted", priceParser(cash.counted), true) : ""}
         ${cash.variance !== null ? row(cash.variance === 0 ? "Balanced" : cash.variance > 0 ? "Over" : "Short", priceParser(Math.abs(cash.variance)), true) : ""}
      </table>
      ${shift.closing_notes ? `<hr><p>${esc(shift.closing_notes)}</p>` : ""}
      <script>window.onload = () => { window.print(); };</script>
   </body></html>`;

   const win = window.open("", "_blank", "width=400,height=700");
   if (!win) return false;
   win.document.write(html);
   win.document.close();
   return true;
}
