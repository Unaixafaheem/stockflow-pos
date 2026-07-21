import prisma from './prisma.js'

export const LOYALTY_TIERS = {
  Bronze: { min: 0, rate: 1 },
  Silver: { min: 500, rate: 1.25 },
  Gold: { min: 1500, rate: 1.5 },
  Platinum: { min: 3000, rate: 2 },
}

export const POINTS_PER_DOLLAR = 1
export const POINT_VALUE = 0.01 // 100 points = $1

export function tierFromPoints(points) {
  if (points >= LOYALTY_TIERS.Platinum.min) return 'Platinum'
  if (points >= LOYALTY_TIERS.Gold.min) return 'Gold'
  if (points >= LOYALTY_TIERS.Silver.min) return 'Silver'
  return 'Bronze'
}

export function earnRateForTier(tier) {
  return LOYALTY_TIERS[tier]?.rate || 1
}

export async function getStoreStock(storeId, productId) {
  if (!storeId) {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    return product?.stockQuantity ?? 0
  }
  const row = await prisma.storeInventory.findUnique({
    where: { storeId_productId: { storeId, productId } },
  })
  return row?.stockQuantity ?? 0
}

export async function adjustStoreStock(tx, { storeId, productId, delta, threshold }) {
  if (storeId) {
    const existing = await tx.storeInventory.findUnique({
      where: { storeId_productId: { storeId, productId } },
    })
    if (existing) {
      return tx.storeInventory.update({
        where: { id: existing.id },
        data: { stockQuantity: Math.max(0, existing.stockQuantity + delta) },
      })
    }
    return tx.storeInventory.create({
      data: {
        storeId,
        productId,
        stockQuantity: Math.max(0, delta),
        lowStockThreshold: threshold ?? 10,
      },
    })
  }

  const product = await tx.product.findUnique({ where: { id: productId } })
  return tx.product.update({
    where: { id: productId },
    data: { stockQuantity: Math.max(0, (product?.stockQuantity || 0) + delta) },
  })
}

export async function checkAndCreateStockAlerts(tx, { storeId, productId, channel = 'email' }) {
  const product = await (tx || prisma).product.findUnique({ where: { id: productId } })
  if (!product) return null

  let qty = product.stockQuantity
  let threshold = product.lowStockThreshold
  if (storeId) {
    const inv = await (tx || prisma).storeInventory.findUnique({
      where: { storeId_productId: { storeId, productId } },
    })
    if (inv) {
      qty = inv.stockQuantity
      threshold = inv.lowStockThreshold
    }
  }

  if (qty > threshold) return null

  const message = qty <= 0
    ? `${product.name} is OUT OF STOCK at the selected store.`
    : `${product.name} is low on stock (${qty} left, threshold ${threshold}).`

  // Demo alert channel — ready to wire EmailJS / WhatsApp later
  return (tx || prisma).stockAlert.create({
    data: {
      productId,
      storeId: storeId || null,
      channel,
      message,
      status: 'Queued',
    },
  })
}
