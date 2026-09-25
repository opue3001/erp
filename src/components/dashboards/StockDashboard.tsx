import React, { useMemo } from 'react';
import { 
  Package, 
  DollarSign, 
  AlertTriangle, 
  ArrowLeftRight, 
  Plus, 
  ArrowUpRight, 
  Layers, 
  Warehouse, 
  CheckCircle2, 
  AlertCircle,
  Truck
} from 'lucide-react';
import { frappeDB } from '../../framework/db';

interface StockDashboardProps {
  onSelectDocType: (doctype: string) => void;
  onOpenDoc: (doctype: string, docName: string) => void;
  onNewDoc: (doctype: string) => void;
  onOpenRPC?: () => void;
}

export const StockDashboard: React.FC<StockDashboardProps> = ({
  onSelectDocType,
  onOpenDoc,
  onNewDoc,
  onOpenRPC,
}) => {
  const items = frappeDB.get_list('Item');
  const stockEntries = frappeDB.get_list('Stock Entry');

  // Aggregates
  let totalValuation = 0;
  let totalUnits = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  items.forEach((item) => {
    const qty = Number(item.total_qty) || 0;
    const rate = Number(item.valuation_rate) || 0;
    totalValuation += qty * rate;
    totalUnits += qty;
    if (qty <= 0) {
      outOfStockCount++;
    } else if (qty <= (item.reorder_level || 20)) {
      lowStockCount++;
    }
  });

  // Group items by item_group
  const groupStats = useMemo(() => {
    const map: Record<string, { count: number; totalVal: number; totalQty: number }> = {};
    items.forEach((item) => {
      const g = item.item_group || 'Unclassified';
      if (!map[g]) map[g] = { count: 0, totalVal: 0, totalQty: 0 };
      const qty = Number(item.total_qty) || 0;
      const rate = Number(item.valuation_rate) || 0;
      map[g].count += 1;
      map[g].totalQty += qty;
      map[g].totalVal += qty * rate;
    });
    return Object.entries(map).map(([group, data]) => ({
      group,
      ...data,
    }));
  }, [items]);

  const maxGroupVal = Math.max(...groupStats.map((g) => g.totalVal), 1);

  // Critical items needing attention
  const criticalItems = items.filter(
    (i) => (Number(i.total_qty) || 0) <= (i.reorder_level || 20)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>ERP Modules</span>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-slate-700">Stock & Inventory</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Warehouse & Inventory Operations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-warehouse balance, inventory valuation, stock movements, and replenishment alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNewDoc('Item')}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add SKU Item</span>
          </button>
          <button
            onClick={() => onNewDoc('Stock Entry')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>New Stock Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Warehouse Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            ${totalValuation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>{items.length} Active SKUs</span>
            <span aria-hidden="true">·</span>
            <span>FIFO / Valuation Rate</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total Units on Hand</span>
            <Package className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalUnits.toLocaleString()} Units
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>Across 4 warehouse facilities</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Reorder & Stock Alerts</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockCount + outOfStockCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {lowStockCount + outOfStockCount} SKUs
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span className="text-amber-600 font-semibold">{lowStockCount} Low Stock</span>
            <span aria-hidden="true">·</span>
            <span className="text-rose-600 font-semibold">{outOfStockCount} Zero Stock</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Material Movements</span>
            <Truck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {stockEntries.length} Records
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <span>Transfers, Receipts & Issues</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Item Group Valuation & Warehouse Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Item Group Valuation */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Inventory Valuation by Category</h3>
              <p className="text-xs text-slate-500">Asset distribution across components and materials</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-4 pt-1">
            {groupStats.map((g) => {
              const pct = Math.round((g.totalVal / maxGroupVal) * 100);
              return (
                <div key={g.group} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{g.group}</span>
                    <div className="flex items-center gap-2 font-mono text-slate-600">
                      <span>{g.totalQty} units</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-slate-900">${g.totalVal.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-Warehouse Status */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Warehouse Storage Facilities</h3>
              <p className="text-xs text-slate-500">Inventory stages from incoming dock to finished stock</p>
            </div>
            <Warehouse className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">Stores (Main Depot)</div>
              <div className="text-lg font-bold text-slate-900 font-mono mt-1">
                Primary Raw Buffer
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Direct supplier intake & inspection</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">Finished Goods</div>
              <div className="text-lg font-bold text-emerald-700 font-mono mt-1">
                Customer Ready
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Packaged, allocated for Sales Orders</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">WIP (Assembly Line)</div>
              <div className="text-lg font-bold text-indigo-700 font-mono mt-1">
                Active Processing
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Items staged on robotic assembly bays</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="text-xs font-semibold text-slate-500 uppercase">Transit Freight</div>
              <div className="text-lg font-bold text-slate-700 font-mono mt-1">
                Inter-site Transfer
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Material transfer in transit between depots</p>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alerts & Recent Material Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Low Stock Watchlist (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-slate-900">Reorder & Low Stock Watchlist</h3>
            </div>
            <button
              onClick={() => onSelectDocType('Item')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
            >
              <span>View All SKUs</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {criticalItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                All inventory items are currently above their reorder safety thresholds.
              </div>
            ) : (
              criticalItems.map((item) => (
                <div
                  key={item.name}
                  onClick={() => onOpenDoc('Item', item.name)}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{item.item_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {item.item_code} · {item.item_group}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono font-bold text-rose-600 tabular-nums">
                      {item.total_qty} / {item.reorder_level || 20} {item.stock_uom}
                    </div>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Material Movements (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent Stock Entries</h3>
            <button
              onClick={() => onSelectDocType('Stock Entry')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
            >
              <span>View All Entries</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Entry ID</th>
                  <th className="py-2.5 px-4">Purpose</th>
                  <th className="py-2.5 px-4">Item</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Value ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockEntries.map((ste) => (
                  <tr
                    key={ste.name}
                    onClick={() => onOpenDoc('Stock Entry', ste.name)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                      {ste.name}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {ste.purpose}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {ste.item_code}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {ste.qty}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 tabular-nums">
                      ${Number(ste.total_value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
