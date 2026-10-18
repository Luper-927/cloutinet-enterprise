import Link from 'next/link'
import { getAccess } from '@/lib/access'

const LIVE_ORDER = ['sent', 'confirmed', 'partially_received']

export default async function ReportsPage() {
  const access = await getAccess()
  const { supabase } = access
  const today = new Date().toISOString().slice(0, 10)
  const head = (table: string) => supabase.from(table).select('id', { count: 'exact', head: true })

  const canApproveReq = access.can('purchase_requests.approve')
  const canApprovePo = access.can('purchase_orders.approve')
  const canOrders = access.can('purchase_orders.read')
  const canShip = access.can('shipments.read')
  const canStock = access.can('inventory.read') && access.can('products.read')

  const [pendingReq, myReq, pendingPo, awaiting, overdue, delayed] = await Promise.all([
    canApproveReq
      ? head('purchase_requests').eq('status', 'submitted').neq('requester_user_id', access.userId)
      : Promise.resolve({ count: null }),
    access.can('purchase_requests.read')
      ? head('purchase_requests').eq('status', 'submitted').eq('requester_user_id', access.userId)
      : Promise.resolve({ count: null }),
    canApprovePo ? head('purchase_orders').eq('status', 'pending_approval') : Promise.resolve({ count: null }),
    canOrders ? head('purchase_orders').in('status', LIVE_ORDER) : Promise.resolve({ count: null }),
    canOrders
      ? head('purchase_orders').in('status', LIVE_ORDER).lt('expected_delivery_date', today)
      : Promise.resolve({ count: null }),
    canShip
      ? head('shipments').lt('expected_arrival_date', today).not('status', 'in', '(arrived,delivered,cancelled)')
      : Promise.resolve({ count: null }),
  ])

  let lowStock: number | null = null
  if (canStock) {
    const [prodRes, balRes] = await Promise.all([
      supabase.from('products').select('id, reorder_threshold').gt('reorder_threshold', 0),
      supabase.from('inventory_balances').select('product_id, quantity'),
    ])
    const totals = new Map<string, number>()
    for (const b of balRes.data ?? []) {
      totals.set(b.product_id as string, (totals.get(b.product_id as string) ?? 0) + Number(b.quantity))
    }
    lowStock = (prodRes.data ?? []).filter(
      (p) => (totals.get(p.id as string) ?? 0) <= Number(p.reorder_threshold)
    ).length
  }

  const cards: { label: string; value: number | null; href: string; warn?: boolean }[] = [
    { label: 'Requests waiting for your approval', value: pendingReq.count, href: '/dashboard/purchasing' },
    { label: 'Your requests still open', value: myReq.count, href: '/dashboard/purchasing' },
    { label: 'Orders waiting for approval', value: pendingPo.count, href: '/dashboard/purchasing' },
    { label: 'Orders waiting for delivery', value: awaiting.count, href: '/dashboard/purchasing' },
    { label: 'Overdue deliveries', value: overdue.count, href: '/dashboard/purchasing', warn: true },
    { label: 'Delayed shipments', value: delayed.count, href: '/dashboard/shipments', warn: true },
    { label: 'Low-stock products', value: lowStock, href: '/dashboard/inventory', warn: true },
  ].filter((c) => c.value !== null)

  const reports = [
    { key: 'purchase-orders', label: 'Purchase orders', show: access.can('purchase_orders.read') },
    { key: 'stock', label: 'Current stock', show: canStock },
    { key: 'stock-movements', label: 'Stock movements (latest 5,000)', show: canStock },
    { key: 'shipments', label: 'Shipments', show: canShip },
    { key: 'suppliers', label: 'Suppliers (no contact details)', show: access.can('suppliers.read') },
  ].filter((r) => r.show)

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold">Overview and reports</h1>

      <section className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`rounded-xl bg-white p-5 shadow-sm hover:bg-slate-50 ${
              c.warn && Number(c.value) > 0 ? 'ring-1 ring-amber-400' : ''
            }`}
          >
            <p className="text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-sm text-slate-500">{c.label}</p>
          </Link>
        ))}
        {cards.length === 0 && (
          <p className="rounded-xl bg-white p-5 text-sm text-slate-500 shadow-sm">
            No figures are available for your role yet.
          </p>
        )}
      </section>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold">Download reports (CSV)</h2>
        {access.can('reports.export') ? (
          <>
            <p className="mt-1 text-xs text-slate-500">
              Every download is recorded in the activity log. Files open correctly in Excel, including Chinese text.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {reports.map((r) => (
                <li key={r.key}>
                  <a href={`/api/export/${r.key}`} className="text-blue-600 hover:underline">
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Your role cannot download reports.</p>
        )}
      </section>
    </div>
  )
}
