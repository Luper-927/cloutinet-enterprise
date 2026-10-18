import { NextResponse } from 'next/server'
import { getAccess } from '@/lib/access'
import { toCsv } from '@/lib/csv'
import type { CsvColumn } from '@/lib/csv'

export const dynamic = 'force-dynamic'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any

const deny = () => NextResponse.json({ error: 'Not allowed' }, { status: 403 })

export async function GET(_req: Request, { params }: { params: { report: string } }) {
  const access = await getAccess()
  if (!access.can('reports.export')) return deny()
  const { supabase } = access

  let columns: CsvColumn<Row>[] = []
  let rows: Row[] = []

  if (params.report === 'purchase-orders') {
    if (!access.can('purchase_orders.read')) return deny()
    const { data } = await supabase
      .from('purchase_orders')
      .select('order_number, status, supplier_id, currency, total_amount, order_date, expected_delivery_date')
      .order('created_at', { ascending: false })
      .limit(5000)
    const names = new Map<string, string>()
    if (access.can('suppliers.read')) {
      const { data: sup } = await supabase.from('suppliers').select('id, legal_name')
      for (const s of sup ?? []) names.set(s.id as string, s.legal_name as string)
    }
    rows = data ?? []
    columns = [
      { header: 'Order number', value: (r) => r.order_number },
      { header: 'Status', value: (r) => r.status },
      { header: 'Supplier', value: (r) => names.get(r.supplier_id) ?? '' },
      { header: 'Currency', value: (r) => r.currency },
      { header: 'Total', value: (r) => r.total_amount },
      { header: 'Order date', value: (r) => r.order_date },
      { header: 'Expected delivery', value: (r) => r.expected_delivery_date },
    ]
  } else if (params.report === 'stock') {
    if (!access.can('inventory.read') || !access.can('products.read')) return deny()
    const [balRes, prodRes, whRes] = await Promise.all([
      supabase.from('inventory_balances').select('product_id, warehouse_id, quantity'),
      supabase.from('products').select('id, sku, name, unit_of_measure'),
      supabase.from('warehouses').select('id, code'),
    ])
    const prods = new Map<string, Row>()
    for (const p of prodRes.data ?? []) prods.set(p.id as string, p)
    const whs = new Map<string, string>()
    for (const w of whRes.data ?? []) whs.set(w.id as string, w.code as string)
    rows = balRes.data ?? []
    columns = [
      { header: 'SKU', value: (r) => prods.get(r.product_id)?.sku },
      { header: 'Product', value: (r) => prods.get(r.product_id)?.name },
      { header: 'Unit', value: (r) => prods.get(r.product_id)?.unit_of_measure },
      { header: 'Warehouse', value: (r) => whs.get(r.warehouse_id) ?? '' },
      { header: 'Quantity', value: (r) => r.quantity },
    ]
  } else if (params.report === 'stock-movements') {
    if (!access.can('inventory.read') || !access.can('products.read')) return deny()
    const [movRes, prodRes, whRes] = await Promise.all([
      supabase
        .from('inventory_movements')
        .select('created_at, product_id, warehouse_id, movement_type, quantity_delta, reason')
        .order('created_at', { ascending: false })
        .limit(5000),
      supabase.from('products').select('id, sku, name'),
      supabase.from('warehouses').select('id, code'),
    ])
    const prods = new Map<string, Row>()
    for (const p of prodRes.data ?? []) prods.set(p.id as string, p)
    const whs = new Map<string, string>()
    for (const w of whRes.data ?? []) whs.set(w.id as string, w.code as string)
    rows = movRes.data ?? []
    columns = [
      { header: 'Date', value: (r) => String(r.created_at).slice(0, 19).replace('T', ' ') },
      { header: 'SKU', value: (r) => prods.get(r.product_id)?.sku },
      { header: 'Product', value: (r) => prods.get(r.product_id)?.name },
      { header: 'Warehouse', value: (r) => whs.get(r.warehouse_id) ?? '' },
      { header: 'Type', value: (r) => r.movement_type },
      { header: 'Change', value: (r) => r.quantity_delta },
      { header: 'Reason', value: (r) => r.reason },
    ]
  } else if (params.report === 'shipments') {
    if (!access.can('shipments.read')) return deny()
    const { data } = await supabase
      .from('shipments')
      .select('tracking_reference, carrier, origin, destination, expected_arrival_date, actual_arrival_date, status')
      .order('created_at', { ascending: false })
      .limit(5000)
    rows = data ?? []
    columns = [
      { header: 'Tracking reference', value: (r) => r.tracking_reference },
      { header: 'Carrier', value: (r) => r.carrier },
      { header: 'Origin', value: (r) => r.origin },
      { header: 'Destination', value: (r) => r.destination },
      { header: 'Expected arrival', value: (r) => r.expected_arrival_date },
      { header: 'Actual arrival', value: (r) => r.actual_arrival_date },
      { header: 'Status', value: (r) => r.status },
    ]
  } else if (params.report === 'suppliers') {
    if (!access.can('suppliers.read')) return deny()
    const { data } = await supabase
      .from('suppliers')
      .select('supplier_code, legal_name, local_name, status, payment_terms_days, currency')
      .order('legal_name')
      .limit(5000)
    rows = data ?? []
    columns = [
      { header: 'Code', value: (r) => r.supplier_code },
      { header: 'Name', value: (r) => r.legal_name },
      { header: 'Local name', value: (r) => r.local_name },
      { header: 'Status', value: (r) => r.status },
      { header: 'Payment terms (days)', value: (r) => r.payment_terms_days },
      { header: 'Currency', value: (r) => r.currency },
    ]
  } else {
    return NextResponse.json({ error: 'Unknown report' }, { status: 404 })
  }

  // Every export is recorded. If recording fails, the export is not handed over.
  const { error: logError } = await supabase.rpc('write_audit_log', {
    p_org: access.orgId,
    p_action: 'reports.exported',
    p_resource_type: 'report',
    p_resource_id: params.report,
    p_summary: { rows: rows.length },
  })
  if (logError) {
    return NextResponse.json({ error: 'The export could not be recorded, so it was not provided.' }, { status: 500 })
  }

  const day = new Date().toISOString().slice(0, 10)
  return new NextResponse(toCsv(rows, columns), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${params.report}-${day}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
