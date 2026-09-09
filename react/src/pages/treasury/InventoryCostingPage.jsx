import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Default Domino's Pizza Commissary & Store Inventory Stock
const DEFAULT_PIZZA_STOCK = [
  {
    id: 'SKU-DGH-01',
    sku: 'SKU-DGH-01',
    name: 'Fresh Pizza Dough Batches (Self-Rising)',
    category: 'Dough & Crust',
    unit: 'kg',
    unitCost: 2.20,
    hubQty: 1450,
    frnQty: 320,
    ownQty: 180,
    reorderPoint: 500,
    shelfLifeDays: 4,
    storageType: 'Chilled Walk-In'
  },
  {
    id: 'SKU-CHS-02',
    sku: 'SKU-CHS-02',
    name: 'Whole Milk Mozzarella Cheese Blend',
    category: 'Cheese & Dairy',
    unit: 'kg',
    unitCost: 5.80,
    hubQty: 2800,
    frnQty: 450,
    ownQty: 260,
    reorderPoint: 800,
    shelfLifeDays: 21,
    storageType: 'Refrigerated Cold Room'
  },
  {
    id: 'SKU-PEP-03',
    sku: 'SKU-PEP-03',
    name: 'Premium Pepperoni Slices (Grade A)',
    category: 'Meats & Toppings',
    unit: 'kg',
    unitCost: 8.50,
    hubQty: 950,
    frnQty: 180,
    ownQty: 90,
    reorderPoint: 300,
    shelfLifeDays: 45,
    storageType: 'Frozen / Cryo-Sealed'
  },
  {
    id: 'SKU-SAU-04',
    sku: 'SKU-SAU-04',
    name: 'Signature Herbed Tomato Pizza Sauce',
    category: 'Sauces & Spices',
    unit: 'liters',
    unitCost: 3.10,
    hubQty: 1600,
    frnQty: 310,
    ownQty: 140,
    reorderPoint: 400,
    shelfLifeDays: 60,
    storageType: 'Dry Ambient Store'
  },
  {
    id: 'SKU-BOX-05',
    sku: 'SKU-BOX-05',
    name: 'Corrugated Domino\'s 12" Pizza Boxes',
    category: 'Packaging',
    unit: 'packs',
    unitCost: 0.45,
    hubQty: 12000,
    frnQty: 2400,
    ownQty: 1100,
    reorderPoint: 3000,
    shelfLifeDays: 365,
    storageType: 'Dry Commissary Racks'
  },
  {
    id: 'SKU-WNG-06',
    sku: 'SKU-WNG-06',
    name: 'Marinated Tender Chicken Wings',
    category: 'Sides & Appetizers',
    unit: 'kg',
    unitCost: 6.20,
    hubQty: 820,
    frnQty: 140,
    ownQty: 75,
    reorderPoint: 250,
    shelfLifeDays: 30,
    storageType: 'Deep Freezer (-18°C)'
  },
  {
    id: 'SKU-VEG-07',
    sku: 'SKU-VEG-07',
    name: 'Diced Bell Peppers & Onion Mix',
    category: 'Fresh Produce',
    unit: 'kg',
    unitCost: 2.40,
    hubQty: 450,
    frnQty: 95,
    ownQty: 40,
    reorderPoint: 150,
    shelfLifeDays: 5,
    storageType: 'Chilled Crisper'
  },
  {
    id: 'SKU-BEV-08',
    sku: 'SKU-BEV-08',
    name: 'Fountain Soda Syrup Concentrates',
    category: 'Beverages',
    unit: 'liters',
    unitCost: 4.50,
    hubQty: 600,
    frnQty: 120,
    ownQty: 60,
    reorderPoint: 200,
    shelfLifeDays: 90,
    storageType: 'Dry Ambient Store'
  }
];

// Default Domino's Production / Kitchen Orders
const DEFAULT_PIZZA_ORDERS = [
  {
    id: 'PO-8841',
    orderNo: 'PO-8841',
    sku: 'Large Pepperoni & Cheese Farmhouse Pizza',
    location: 'Domino\'s Franchise Store #12',
    entityId: 'ENT-FRN-01',
    quantity: 400,
    status: 'In Progress',
    standardCost: 1200,
    actualCost: 1235,
    variancePct: 2.9,
    varianceFav: false,
    startedAt: '2026-09-09 11:30'
  },
  {
    id: 'PO-8836',
    orderNo: 'PO-8836',
    sku: 'ExtravaganZZa Supreme Pizza (Loaded)',
    location: 'Domino\'s Franchise Store #12',
    entityId: 'ENT-FRN-01',
    quantity: 620,
    status: 'Complete',
    standardCost: 2170,
    actualCost: 2120,
    variancePct: -2.3,
    varianceFav: true,
    startedAt: '2026-09-09 09:15'
  },
  {
    id: 'PO-8829',
    orderNo: 'PO-8829',
    sku: 'Commissary Daily Dough Mixing Batch',
    location: 'Domino\'s Main Commissary Hub',
    entityId: 'ENT-HUB-01',
    quantity: 1500,
    status: 'Complete',
    standardCost: 3300,
    actualCost: 3310,
    variancePct: 0.3,
    varianceFav: false,
    startedAt: '2026-09-09 06:00'
  },
  {
    id: 'PO-8850',
    orderNo: 'PO-8850',
    sku: 'Farmhouse Veggie Feast Pizza',
    location: 'Domino\'s Own Store #1',
    entityId: 'ENT-OWN-01',
    quantity: 350,
    status: 'Planned',
    standardCost: 980,
    actualCost: null,
    variancePct: null,
    varianceFav: null,
    startedAt: '2026-09-09 14:00'
  },
  {
    id: 'PO-8842',
    orderNo: 'PO-8842',
    sku: 'Crispy Buffalo Wings & Dips Batch',
    location: 'Domino\'s Franchise Store #12',
    entityId: 'ENT-FRN-01',
    quantity: 500,
    status: 'In Progress',
    standardCost: 1500,
    actualCost: 1465,
    variancePct: -2.3,
    varianceFav: true,
    startedAt: '2026-09-09 12:00'
  }
];

export function InventoryCostingPage() {
  const { accountingLevel } = useAuth();
  const isPizza = accountingLevel === 'pizza' || true; // Domino's Pizza mode active

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Dynamic Stock State with LocalStorage Persistence
  const [stockItems, setStockItems] = useState(() => {
    try {
      if (localStorage.getItem('v_data_reset') === '1') return DEFAULT_PIZZA_STOCK;
      const saved = localStorage.getItem('v_inventory_stock_pizza');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_PIZZA_STOCK;
  });

  // 2. Dynamic Production Orders State with LocalStorage Persistence
  const [productionOrders, setProductionOrders] = useState(() => {
    try {
      if (localStorage.getItem('v_data_reset') === '1') return DEFAULT_PIZZA_ORDERS;
      const saved = localStorage.getItem('v_inventory_orders_pizza');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_PIZZA_ORDERS;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('v_inventory_stock_pizza', JSON.stringify(stockItems));
    } catch {
      // ignore
    }
  }, [stockItems]);

  useEffect(() => {
    try {
      localStorage.setItem('v_inventory_orders_pizza', JSON.stringify(productionOrders));
    } catch {
      // ignore
    }
  }, [productionOrders]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState('ALL');
  const [stockHealthFilter, setStockHealthFilter] = useState('ALL');

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockTargetItem, setRestockTargetItem] = useState(null);

  // New Order Form State
  const [newOrderForm, setNewOrderForm] = useState({
    sku: 'Large Pepperoni & Cheese Farmhouse Pizza',
    location: 'Domino\'s Franchise Store #12',
    entityId: 'ENT-FRN-01',
    quantity: 300,
    status: 'In Progress',
    unitCost: 3.00
  });

  // Restock Form State
  const [restockForm, setRestockForm] = useState({
    locationKey: 'hubQty',
    addQty: 100,
    notes: 'Commissary Replenishment'
  });

  // Dynamic Calculated Metrics
  const calculatedMetrics = useMemo(() => {
    let totalVal = 0;
    let rawMaterialVal = 0;
    let wipVal = 0;
    let finishedVal = 0;
    let alertsCount = 0;

    stockItems.forEach(item => {
      const totalQty = (item.hubQty || 0) + (item.frnQty || 0) + (item.ownQty || 0);
      const itemVal = totalQty * (item.unitCost || 0);
      totalVal += itemVal;

      if (['Dough & Crust', 'Cheese & Dairy', 'Fresh Produce'].includes(item.category)) {
        rawMaterialVal += itemVal;
      } else if (['Meats & Toppings', 'Sauces & Spices'].includes(item.category)) {
        wipVal += itemVal;
      } else {
        finishedVal += itemVal;
      }

      if (totalQty <= item.reorderPoint) {
        alertsCount++;
      }
    });

    const unitsInProd = productionOrders
      .filter(o => o.status === 'In Progress')
      .reduce((sum, o) => sum + (parseInt(o.quantity, 10) || 0), 0);

    const rmPct = totalVal > 0 ? Math.round((rawMaterialVal / totalVal) * 100) : 34;
    const wipPct = totalVal > 0 ? Math.round((wipVal / totalVal) * 100) : 22;
    const fgPct = 100 - rmPct - wipPct;

    return {
      totalValue: Math.round(totalVal),
      rawMaterialVal: Math.round(rawMaterialVal),
      wipVal: Math.round(wipVal),
      finishedVal: Math.round(finishedVal),
      rmPct,
      wipPct,
      fgPct,
      unitsInProduction: unitsInProd,
      reorderAlerts: alertsCount,
      turnoverRatio: '8.2x'
    };
  }, [stockItems, productionOrders]);

  // Categories list for filter
  const categories = useMemo(() => {
    const set = new Set(stockItems.map(i => i.category));
    return ['ALL', ...Array.from(set)];
  }, [stockItems]);

  // Filtered Stock Items
  const filteredStock = useMemo(() => {
    return stockItems.filter(item => {
      const totalQty = (item.hubQty || 0) + (item.frnQty || 0) + (item.ownQty || 0);
      const isLow = totalQty <= item.reorderPoint;

      if (stockHealthFilter === 'LOW' && !isLow) return false;
      if (stockHealthFilter === 'HEALTHY' && isLow) return false;

      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchCat) return false;
      }

      return true;
    });
  }, [stockItems, stockHealthFilter, selectedCategory, searchQuery]);

  // Handle Add New Production Order
  const handleCreateOrder = (e) => {
    e.preventDefault();
    const qty = parseInt(newOrderForm.quantity, 10) || 100;
    const stdCost = Math.round(qty * (parseFloat(newOrderForm.unitCost) || 3.00));
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrderNo = `PO-${randomSuffix}`;

    const newEntry = {
      id: newOrderNo,
      orderNo: newOrderNo,
      sku: newOrderForm.sku,
      location: newOrderForm.location,
      entityId: newOrderForm.entityId,
      quantity: qty,
      status: newOrderForm.status,
      standardCost: stdCost,
      actualCost: newOrderForm.status === 'Planned' ? null : stdCost,
      variancePct: newOrderForm.status === 'Planned' ? null : 0.0,
      varianceFav: true,
      startedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setProductionOrders([newEntry, ...productionOrders]);
    setIsNewOrderModalOpen(false);
    showToast(`Kitchen Production Order [${newOrderNo}] successfully logged!`, 'success');
  };

  // Open Restock Modal
  const openRestockModal = (item) => {
    setRestockTargetItem(item);
    setRestockForm({
      locationKey: 'hubQty',
      addQty: 100,
      notes: `Restock replenishment for ${item.name}`
    });
    setIsRestockModalOpen(true);
  };

  // Handle Apply Restock
  const handleApplyRestock = (e) => {
    e.preventDefault();
    if (!restockTargetItem) return;

    const qtyToAdd = parseInt(restockForm.addQty, 10) || 0;
    if (qtyToAdd === 0) {
      showToast('Please enter a valid adjustment quantity.', 'warning');
      return;
    }

    setStockItems(prev => prev.map(item => {
      if (item.id === restockTargetItem.id) {
        const currentQty = item[restockForm.locationKey] || 0;
        const newQty = Math.max(0, currentQty + qtyToAdd);
        return {
          ...item,
          [restockForm.locationKey]: newQty
        };
      }
      return item;
    }));

    setIsRestockModalOpen(false);
    showToast(`Adjusted ${restockTargetItem.name} stock by ${qtyToAdd > 0 ? '+' : ''}${qtyToAdd} ${restockTargetItem.unit}!`, 'success');
  };

  // Export CSV Action
  const handleExportCsv = () => {
    let csv = 'SKU,Item Name,Category,Unit,Unit Cost ($),Domino\'s Main Hub,Franchise Store #12,Own Store #1,Total Stock,Total Valuation ($),Status\n';
    stockItems.forEach(item => {
      const total = (item.hubQty || 0) + (item.frnQty || 0) + (item.ownQty || 0);
      const val = (total * item.unitCost).toFixed(2);
      const st = total <= item.reorderPoint ? 'REORDER ALERT' : 'HEALTHY';
      csv += `"${item.sku}","${item.name}","${item.category}","${item.unit}",${item.unitCost},${item.hubQty},${item.frnQty},${item.ownQty},${total},${val},"${st}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `dominos_inventory_costing_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Inventory valuation CSV downloaded successfully!', 'success');
  };

  // Reset to default
  const handleResetData = () => {
    setStockItems(DEFAULT_PIZZA_STOCK);
    setProductionOrders(DEFAULT_PIZZA_ORDERS);
    localStorage.removeItem('v_inventory_stock_pizza');
    localStorage.removeItem('v_inventory_orders_pizza');
    showToast('Inventory reset to Domino\'s default commissary stock.', 'info');
  };

  return (
    <div className="inventory-page" style={{ paddingBottom: '32px' }}>
      {toast && (
        <div className={`veridex-toast veridex-toast-${toast.type}`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠️' : '✓'}</span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ═══ PAGE HEADER ═══ */}
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <div>
          <div className="page-title">Inventory &amp; Manufacturing Costing</div>
          <div className="page-subtitle">
            Domino's Pizza supply chain hub — tracking fresh dough, cheeses, meats, sauces, and store replenishment
          </div>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-outline" onClick={handleResetData}>
            Reset
          </button>
          <button type="button" className="btn btn-outline" onClick={handleExportCsv}>
            Export CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setIsNewOrderModalOpen(true)}>
            + New Production Order
          </button>
        </div>
      </div>

      {/* ═══ STATS ROW ═══ */}
      <div className="stats-row" style={{ marginBottom: '22px' }}>
        <div className="stat-card">
          <div className="stat-icon si-navy">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="6" width="14" height="9" rx="1" stroke="#102a2e" strokeWidth="1.5"/>
              <path d="M6 6V4a4 4 0 0 1 8 0v2" stroke="#102a2e" strokeWidth="1.4"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">${calculatedMetrics.totalValue.toLocaleString()}</div>
            <div className="stat-label">Total Inventory Value</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-orange">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 6l7-3 7 3-7 3-7-3z" stroke="#e65100" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M3 6v7l7 3 7-3V6" stroke="#e65100" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{calculatedMetrics.unitsInProduction.toLocaleString()}</div>
            <div className="stat-label">Pizzas &amp; Batches in Kitchen</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-green">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 5v6M10 14v1" stroke="#2e7d32" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="7.5" stroke="#2e7d32" strokeWidth="1.4"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{calculatedMetrics.reorderAlerts}</div>
            <div className="stat-label">Commissary Reorder Alerts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon si-coral">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12M13 6l3 4-3 4" stroke="#c9791f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{calculatedMetrics.turnoverRatio}</div>
            <div className="stat-label">Freshness Turnover Ratio</div>
          </div>
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="filter-bar" style={{ marginBottom: '22px' }}>
        <span className="filter-bar-label">Filters:</span>
        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'ALL' ? 'All Categories' : c}</option>
          ))}
        </select>
        <select
          className="filter-select"
          value={stockHealthFilter}
          onChange={(e) => setStockHealthFilter(e.target.value)}
        >
          <option value="ALL">All Stock Levels</option>
          <option value="LOW">Low Stock Alerts</option>
          <option value="HEALTHY">Healthy Stock</option>
        </select>
        <div className="filter-spacer"></div>
        <input
          type="text"
          className="filter-input"
          placeholder="Search ingredient, SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '240px' }}
        />
      </div>

      {/* ═══ MULTI-LOCATION DOMINO'S STOCK TABLE ═══ */}
      <div className="table-wrap" style={{ marginBottom: '24px' }}>
        <div className="table-head-row">
          <div className="table-head-title">Multi-Location Commissary &amp; Store Stock</div>
          <div className="table-head-actions">
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              {filteredStock.length} items on-hand
            </span>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>SKU &amp; Ingredient</th>
              <th>Category</th>
              <th style={{ textAlign: 'right' }}>Unit Cost</th>
              <th style={{ textAlign: 'right' }}>Domino's Hub (Plant)</th>
              <th style={{ textAlign: 'right' }}>Franchise Store #12</th>
              <th style={{ textAlign: 'right' }}>Own Store #1</th>
              <th style={{ textAlign: 'right' }}>Total Stock</th>
              <th style={{ textAlign: 'right' }}>Total Value</th>
              <th>Health Status</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  No inventory items match the current filters.
                </td>
              </tr>
            ) : (
              filteredStock.map(item => {
                const totalQty = (item.hubQty || 0) + (item.frnQty || 0) + (item.ownQty || 0);
                const totalVal = totalQty * item.unitCost;
                const isLow = totalQty <= item.reorderPoint;

                return (
                  <tr key={item.id}>
                    <td>
                      <div className="font-semibold" style={{ color: 'var(--color-ink)' }}>{item.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontFamily: 'monospace' }}>{item.sku}</span>
                        <span>•</span>
                        <span>{item.storageType}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-gray">{item.category}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      ${item.unitCost.toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.hubQty.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{item.unit}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.frnQty.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{item.unit}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.ownQty.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>{item.unit}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {totalQty.toLocaleString()} <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 400 }}>{item.unit}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-link)' }}>
                      ${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      {isLow ? (
                        <span className="badge badge-orange" style={{ background: '#fef2f2', color: '#dc2626' }}>
                          Low Stock
                        </span>
                      ) : (
                        <span className="badge badge-green">
                          Healthy
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => openRestockModal(item)}
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ═══ PRODUCTION ORDERS TABLE ═══ */}
      <div className="table-wrap" style={{ marginBottom: '24px' }}>
        <div className="table-head-row">
          <div className="table-head-title">Kitchen &amp; Commissary Production Orders</div>
          <div className="table-head-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setIsNewOrderModalOpen(true)}
            >
              + New Order
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Recipe / Menu Item</th>
              <th>Assigned Facility</th>
              <th style={{ textAlign: 'right' }}>Batch Quantity</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Standard Cost</th>
              <th style={{ textAlign: 'right' }}>Actual Cost</th>
              <th>Cost Variance</th>
            </tr>
          </thead>
          <tbody>
            {productionOrders.map(order => (
              <tr key={order.id}>
                <td className="font-semibold">{order.orderNo}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{order.sku}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' }}>Started: {order.startedAt}</div>
                </td>
                <td>{order.location}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{order.quantity.toLocaleString()}</td>
                <td>
                  {order.status === 'Complete' && <span className="badge badge-green">Complete</span>}
                  {order.status === 'In Progress' && <span className="badge badge-blue">In Progress</span>}
                  {order.status === 'Planned' && <span className="badge badge-gray">Planned</span>}
                </td>
                <td style={{ textAlign: 'right' }}>${order.standardCost.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>{order.actualCost ? `$${order.actualCost.toLocaleString()}` : '—'}</td>
                <td>
                  {order.variancePct !== null ? (
                    <span className={`badge ${order.varianceFav ? 'badge-green' : 'badge-orange'}`} style={order.varianceFav ? {} : { background: '#fef2f2', color: '#dc2626' }}>
                      {order.variancePct > 0 ? `+${order.variancePct}% Unfav` : `${order.variancePct}% Fav`}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-muted)' }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ MODAL: NEW PRODUCTION ORDER ═══ */}
      {isNewOrderModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: 'var(--navy, #0d1b4b)' }}>
                Create Kitchen / Commissary Order
              </h3>
              <button
                type="button"
                onClick={() => setIsNewOrderModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Menu Item / Batch Recipe
                </label>
                <select
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={newOrderForm.sku}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, sku: e.target.value })}
                >
                  <option value="Large Pepperoni & Cheese Farmhouse Pizza">Large Pepperoni &amp; Cheese Farmhouse Pizza</option>
                  <option value="ExtravaganZZa Supreme Pizza (Loaded)">ExtravaganZZa Supreme Pizza (Loaded)</option>
                  <option value="Farmhouse Veggie Feast Pizza">Farmhouse Veggie Feast Pizza</option>
                  <option value="Commissary Daily Dough Mixing Batch">Commissary Daily Dough Mixing Batch (1,500 kg)</option>
                  <option value="Crispy Buffalo Wings & Dips Batch">Crispy Buffalo Wings &amp; Dips Batch</option>
                  <option value="Stuffed Garlic Cheesy Breadsticks">Stuffed Garlic Cheesy Breadsticks</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                    Batch Quantity
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    value={newOrderForm.quantity}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, quantity: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                    Std Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    min="0.10"
                    step="0.10"
                    required
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    value={newOrderForm.unitCost}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, unitCost: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Target Domino's Location / Entity
                </label>
                <select
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={newOrderForm.location}
                  onChange={(e) => {
                    const loc = e.target.value;
                    let entityId = 'ENT-FRN-01';
                    if (loc.includes('Hub')) entityId = 'ENT-HUB-01';
                    if (loc.includes('Own')) entityId = 'ENT-OWN-01';
                    setNewOrderForm({ ...newOrderForm, location: loc, entityId });
                  }}
                >
                  <option value="Domino's Franchise Store #12">Domino's Franchise Store #12 (ENT-FRN-01)</option>
                  <option value="Domino's Main Commissary Hub">Domino's Main Commissary Hub (ENT-HUB-01)</option>
                  <option value="Domino's Own Store #1">Domino's Own Store #1 (ENT-OWN-01)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Initial Production Status
                </label>
                <select
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={newOrderForm.status}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, status: e.target.value })}
                >
                  <option value="In Progress">In Progress (Kitchen Active)</option>
                  <option value="Planned">Planned (Scheduled)</option>
                  <option value="Complete">Complete (Finished)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#ea580c', color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
                >
                  Start Production Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: ADJUST / RESTOCK ═══ */}
      {isRestockModalOpen && restockTargetItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--navy, #0d1b4b)' }}>
                  Stock Adjustment &amp; Restock
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  {restockTargetItem.name} ({restockTargetItem.sku})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyRestock}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Target Location
                </label>
                <select
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={restockForm.locationKey}
                  onChange={(e) => setRestockForm({ ...restockForm, locationKey: e.target.value })}
                >
                  <option value="hubQty">Domino's Main Commissary Hub (Current: {restockTargetItem.hubQty} {restockTargetItem.unit})</option>
                  <option value="frnQty">Franchise Store #12 (Current: {restockTargetItem.frnQty} {restockTargetItem.unit})</option>
                  <option value="ownQty">Own Store #1 (Current: {restockTargetItem.ownQty} {restockTargetItem.unit})</option>
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Quantity to Add ({restockTargetItem.unit})
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={restockForm.addQty}
                  onChange={(e) => setRestockForm({ ...restockForm, addQty: e.target.value })}
                />
                <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                  * Use negative values to log inventory shrinkage, wastage, or dispatch.
                </span>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#334155' }}>
                  Reason / Memo
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  value={restockForm.notes}
                  onChange={(e) => setRestockForm({ ...restockForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: 700 }}
                >
                  Apply Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryCostingPage;
