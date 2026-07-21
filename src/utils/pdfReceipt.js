import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency, formatDateTime } from './formatters'
import { BRAND } from '../brand/brand'

export function downloadOrderReceipt(order, options = {}) {
  if (!order) return

  const storeName = options.storeName || order.storeName || BRAND.product
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 48

  // Brand bar
  doc.setFillColor(...BRAND.primaryRgb)
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 72, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text(BRAND.name, margin, 36)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Official Sales Receipt', margin, 54)

  doc.setTextColor(30, 41, 59)
  doc.setFontSize(11)
  let y = 100
  const meta = [
    ['Store', storeName],
    ['Order', order.id],
    ['Date', formatDateTime(order.date)],
    ['Customer', order.customerName || 'Walk-in'],
    ['Payment', order.paymentMethod || '—'],
    ['Status', order.status || '—'],
  ]
  if (order.couponCode) meta.push(['Coupon', order.couponCode])
  if (order.createdByName) meta.push(['Cashier', order.createdByName])

  meta.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value), margin + 80, y)
    y += 16
  })

  const discountTotal =
    (Number(order.discount) || 0) +
    (Number(order.couponDiscount) || 0) +
    (Number(order.loyaltyDiscount) || 0)

  autoTable(doc, {
    startY: y + 12,
    head: [['Item', 'Qty', 'Price', 'Total']],
    body: (order.items || []).map((item) => [
      item.name,
      String(item.quantity),
      formatCurrency(item.price),
      formatCurrency(item.total),
    ]),
    styles: { fontSize: 10, cellPadding: 7 },
    headStyles: { fillColor: BRAND.primaryRgb, textColor: 255 },
    margin: { left: margin, right: margin },
  })

  const endY = (doc.lastAutoTable?.finalY || y + 40) + 18
  doc.setFontSize(11)
  doc.text(`Subtotal: ${formatCurrency(order.subtotal)}`, margin, endY)
  if (discountTotal > 0) {
    doc.text(`Discount: -${formatCurrency(discountTotal)}`, margin, endY + 16)
  }
  doc.text(`Tax: ${formatCurrency(order.tax)}`, margin, endY + (discountTotal > 0 ? 32 : 16))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...BRAND.primaryRgb)
  doc.text(
    `Total: ${formatCurrency(order.total)}`,
    margin,
    endY + (discountTotal > 0 ? 54 : 38),
  )

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Thank you for shopping with ${BRAND.product}.`, margin, endY + (discountTotal > 0 ? 84 : 68))

  doc.save(`${order.id}-receipt.pdf`)
}
