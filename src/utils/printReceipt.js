import { formatCurrency, formatDateTime } from './formatters'
import { BRAND } from '../brand/brand'

/**
 * Opens a thermal-printer-friendly receipt (≈80mm) in a print window.
 */
export function printThermalReceipt(order, options = {}) {
  if (!order) return
  const storeName = options.storeName || BRAND.product
  const storeAddress = options.storeAddress || ''
  const storePhone = options.storePhone || ''
  const widthMm = options.widthMm || 80
  const cashier = options.cashierName || order.createdByName || ''

  const discountTotal =
    (Number(order.discount) || 0) +
    (Number(order.couponDiscount) || 0) +
    (Number(order.loyaltyDiscount) || 0)

  const lines = (order.items || [])
    .map((item) => `
      <tr>
        <td class="left">
          <div class="item">${escapeHtml(item.name)}</div>
          <div class="muted">${item.quantity} × ${formatCurrency(item.price)}</div>
        </td>
        <td class="right">${formatCurrency(item.total)}</td>
      </tr>
    `)
    .join('')

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(order.id)}</title>
  <style>
    @page { size: ${widthMm}mm auto; margin: 3mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Courier New", Courier, monospace;
      font-size: 11px;
      line-height: 1.35;
      color: #000;
      background: #fff;
    }
    .ticket { width: ${widthMm - 6}mm; max-width: 100%; margin: 0 auto; }
    .center { text-align: center; }
    .muted { color: #444; font-size: 10px; }
    .brand {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px; height: 28px;
      border-radius: 6px;
      background: #0f766e;
      color: #fff;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 6px;
    }
    h1 { font-size: 15px; margin: 0 0 2px; letter-spacing: 0.02em; }
    .rule { border-top: 1px dashed #000; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 3px 0; vertical-align: top; }
    .left { text-align: left; }
    .right { text-align: right; white-space: nowrap; padding-left: 8px; }
    .item { font-weight: bold; }
    .total td { font-size: 13px; font-weight: bold; padding-top: 4px; }
    .foot { margin-top: 10px; font-size: 10px; }
    .meta { margin: 2px 0; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="center">
      <div class="brand">S</div>
      <h1>${escapeHtml(storeName)}</h1>
      <div class="muted">${escapeHtml(BRAND.product)}</div>
      ${storeAddress ? `<div class="muted">${escapeHtml(storeAddress)}</div>` : ''}
      ${storePhone ? `<div class="muted">${escapeHtml(storePhone)}</div>` : ''}
    </div>
    <div class="rule"></div>
    <div class="meta">Order: ${escapeHtml(order.id)}</div>
    <div class="meta">Date: ${escapeHtml(formatDateTime(order.date))}</div>
    <div class="meta">Customer: ${escapeHtml(order.customerName || 'Walk-in')}</div>
    <div class="meta">Payment: ${escapeHtml(order.paymentMethod || '')}</div>
    ${cashier ? `<div class="meta">Cashier: ${escapeHtml(cashier)}</div>` : ''}
    ${order.couponCode ? `<div class="meta">Coupon: ${escapeHtml(order.couponCode)}</div>` : ''}
    <div class="rule"></div>
    <table>${lines}</table>
    <div class="rule"></div>
    <table>
      <tr><td class="left">Subtotal</td><td class="right">${formatCurrency(order.subtotal)}</td></tr>
      ${discountTotal > 0 ? `<tr><td class="left">Discount</td><td class="right">-${formatCurrency(discountTotal)}</td></tr>` : ''}
      <tr><td class="left">Tax</td><td class="right">${formatCurrency(order.tax)}</td></tr>
      <tr class="total"><td class="left">TOTAL</td><td class="right">${formatCurrency(order.total)}</td></tr>
    </table>
    <div class="rule"></div>
    <div class="center foot">
      Thank you for shopping!<br/>
      ${escapeHtml(BRAND.name)} · Keep this receipt
    </div>
  </div>
  <script>
    window.onload = function () {
      window.focus();
      setTimeout(function () { window.print(); }, 150);
    };
  </script>
</body>
</html>`

  const win = window.open('', '_blank', 'noopener,noreferrer,width=420,height=720')
  if (!win) {
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    setTimeout(() => iframe.remove(), 1000)
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
