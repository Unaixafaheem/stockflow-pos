export function downloadCsv(filename, rows) {
  if (!rows?.length) return

  const headers = Object.keys(rows[0])
  const escape = (value) => {
    const str = value == null ? '' : String(value)
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`
    return str
  }

  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function productsToCsvRows(products) {
  return products.map((p) => ({
    Name: p.name,
    Category: p.category,
    SKU: p.sku,
    Barcode: p.barcode,
    'Cost Price': p.costPrice,
    'Selling Price': p.sellingPrice,
    Stock: p.stockQuantity,
    'Low Stock Threshold': p.lowStockThreshold,
    Supplier: p.supplier,
  }))
}

export function customersToCsvRows(customers) {
  return customers.map((c) => ({
    Name: c.name,
    Phone: c.phone || '',
    Email: c.email || '',
    'Total Purchases': c.totalPurchases,
    'Last Purchase': c.lastPurchaseDate || '',
  }))
}

export function ordersToCsvRows(orders) {
  return orders.map((o) => ({
    'Order ID': o.id,
    Date: o.date,
    Customer: o.customerName,
    Items: o.items?.length || 0,
    Subtotal: o.subtotal,
    Discount: o.discount,
    Tax: o.tax,
    Total: o.total,
    Payment: o.paymentMethod,
    Status: o.status,
  }))
}

export function employeesToCsvRows(employees) {
  return employees.map((e) => ({
    Name: e.name,
    Role: e.role,
    Email: e.email,
    Phone: e.phone || '',
    Status: e.status,
  }))
}
