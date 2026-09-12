import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Store,
  MaterialItem,
  StockBatch,
  StoreStockRecord,
  StockBalance,
  InventoryGRN,
  MaterialIssue,
  MaterialReturn,
  StockTransfer,
  StockAdjustment,
  StockCount,
  LowStockAlert,
  FastMovingMaterial,
  SlowMovingMaterial,
  ProjectConsumptionSummary,
  InventoryDashboardData
} from '../types/inventoryTypes';
import {
  INITIAL_STORES,
  INITIAL_MATERIALS,
  INITIAL_BATCHES,
  INITIAL_STOCK_BALANCES,
  INITIAL_GRNS,
  INITIAL_MATERIAL_ISSUES,
  INITIAL_MATERIAL_RETURNS,
  INITIAL_STOCK_TRANSFERS,
  INITIAL_STOCK_ADJUSTMENTS,
  INITIAL_STOCK_COUNTS
} from '../data/inventorySeedData';

interface InventoryContextType {
  // Master Entities
  stores: Store[];
  materials: MaterialItem[];
  batches: StockBatch[];
  stockBalances: StoreStockRecord[];

  // Transactions
  grns: InventoryGRN[];
  materialIssues: MaterialIssue[];
  materialReturns: MaterialReturn[];
  stockTransfers: StockTransfer[];
  stockAdjustments: StockAdjustment[];
  stockCounts: StockCount[];

  // Material Actions
  addMaterial: (material: Omit<MaterialItem, 'id' | 'createdAt' | 'updatedAt'>) => MaterialItem;
  updateMaterial: (id: string, updates: Partial<MaterialItem>) => void;
  deleteMaterial: (id: string) => void;

  // Store Actions
  addStore: (store: Omit<Store, 'id' | 'createdAt'>) => Store;
  updateStore: (id: string, updates: Partial<Store>) => void;
  deleteStore: (id: string) => void;

  // Batch Actions
  addBatch: (batch: Omit<StockBatch, 'id'>) => StockBatch;
  updateBatch: (id: string, updates: Partial<StockBatch>) => void;
  deleteBatch: (id: string) => void;

  // Stock Balance Actions
  updateStockBalance: (storeId: string, materialId: string, updates: Partial<StockBalance>) => void;
  deleteStockBalance: (storeId: string, materialId: string) => void;

  // Transaction Actions
  createGRN: (grn: Omit<InventoryGRN, 'id' | 'createdAt'>) => InventoryGRN;
  updateGRN: (id: string, updates: Partial<InventoryGRN>) => void;
  deleteGRN: (id: string) => void;

  createMaterialIssue: (issue: Omit<MaterialIssue, 'id' | 'createdAt'>) => MaterialIssue;
  updateMaterialIssue: (id: string, updates: Partial<MaterialIssue>) => void;
  deleteMaterialIssue: (id: string) => void;

  createMaterialReturn: (ret: Omit<MaterialReturn, 'id' | 'createdAt'>) => MaterialReturn;
  updateMaterialReturn: (id: string, updates: Partial<MaterialReturn>) => void;
  deleteMaterialReturn: (id: string) => void;

  createStockTransfer: (transfer: Omit<StockTransfer, 'id' | 'createdAt'>) => StockTransfer;
  updateStockTransfer: (id: string, updates: Partial<StockTransfer>) => void;
  deleteStockTransfer: (id: string) => void;
  markTransferReceived: (id: string, receiverName: string) => void;

  createStockAdjustment: (adj: Omit<StockAdjustment, 'id' | 'createdAt'>) => StockAdjustment;
  updateStockAdjustment: (id: string, updates: Partial<StockAdjustment>) => void;
  deleteStockAdjustment: (id: string) => void;

  createStockCount: (count: Omit<StockCount, 'id' | 'createdAt'>) => StockCount;
  updateStockCount: (id: string, updates: Partial<StockCount>) => void;
  deleteStockCount: (id: string) => void;
  reconcileStockCount: (id: string) => void;

  // Helper Stock Queries
  getMaterialStockTotal: (materialId: string) => number;
  getStoreStock: (materialId: string, storeId: string) => number;
  getMaterialBatches: (materialId: string) => StockBatch[];

  // Analytics & Dashboard
  dashboardData: InventoryDashboardData;
  dashboardMetrics: InventoryDashboardData;
  lowStockAlerts: LowStockAlert[];
  fastMovingMaterials: FastMovingMaterial[];
  slowMovingMaterials: SlowMovingMaterial[];
  projectConsumptions: ProjectConsumptionSummary[];
  lowStockCount: number;

  // Reset & Clear History
  clearTransactionsHistory: (transactionType?: string) => void;
  clearTransactionHistory: (transactionType?: string) => void;
  resetToDefaultInventory: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from localStorage or defaults
  const [stores, setStores] = useState<Store[]>(() => {
    try {
      const saved = localStorage.getItem('ema_inventory_stores');
      return saved ? JSON.parse(saved) : INITIAL_STORES;
    } catch {
      return INITIAL_STORES;
    }
  });

  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    try {
      const saved = localStorage.getItem('ema_inventory_materials');
      return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
    } catch {
      return INITIAL_MATERIALS;
    }
  });

  const [batches, setBatches] = useState<StockBatch[]>(() => {
    try {
      const saved = localStorage.getItem('ema_inventory_batches');
      return saved ? JSON.parse(saved) : INITIAL_BATCHES;
    } catch {
      return INITIAL_BATCHES;
    }
  });

  const [stockBalances, setStockBalances] = useState<StoreStockRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ema_inventory_balances');
      return saved ? JSON.parse(saved) : INITIAL_STOCK_BALANCES;
    } catch {
      return INITIAL_STOCK_BALANCES;
    }
  });

  const [grns, setGrns] = useState<InventoryGRN[]>(() => {
    try {
      const saved = localStorage.getItem('ema_inventory_grns');
      return saved ? JSON.parse(saved) : INITIAL_GRNS;
    } catch {
      return INITIAL_GRNS;
    }
  });

  const [materialIssues, setMaterialIssues] = useState<MaterialIssue[]>(() => {
    try {
      const saved = localStorage.getItem('ema_inventory_issues');
      return saved ? JSON.parse(saved) : INITIAL_MATERIAL_ISSUES;
    } catch {
      return INITIAL_MATERIAL_ISSUES;
    }
  });

  const [materialReturns, setMaterialReturns] = useState<MaterialReturn[]>(() => {
    try {
      const saved = localStorage.getItem('ema_inventory_returns');
      return saved ? JSON.parse(saved) : INITIAL_MATERIAL_RETURNS;
    } catch {
      return INITIAL_MATERIAL_RETURNS;
    }
  });

  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(() => {
    try {
      const saved = localStorage.getItem('ema_inventory_transfers');
      return saved ? JSON.parse(saved) : INITIAL_STOCK_TRANSFERS;
    } catch {
      return INITIAL_STOCK_TRANSFERS;
    }
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => {
    try {
      const saved = localStorage.getItem('ema_inventory_adjustments');
      return saved ? JSON.parse(saved) : INITIAL_STOCK_ADJUSTMENTS;
    } catch {
      return INITIAL_STOCK_ADJUSTMENTS;
    }
  });

  const [stockCounts, setStockCounts] = useState<StockCount[]>(() => {
    try {
      const saved = localStorage.getItem('ema_inventory_counts');
      return saved ? JSON.parse(saved) : INITIAL_STOCK_COUNTS;
    } catch {
      return INITIAL_STOCK_COUNTS;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ema_inventory_stores', JSON.stringify(stores));
      localStorage.setItem('ema_inventory_materials', JSON.stringify(materials));
      localStorage.setItem('ema_inventory_batches', JSON.stringify(batches));
      localStorage.setItem('ema_inventory_balances', JSON.stringify(stockBalances));
      localStorage.setItem('ema_inventory_grns', JSON.stringify(grns));
      localStorage.setItem('ema_inventory_issues', JSON.stringify(materialIssues));
      localStorage.setItem('ema_inventory_returns', JSON.stringify(materialReturns));
      localStorage.setItem('ema_inventory_transfers', JSON.stringify(stockTransfers));
      localStorage.setItem('ema_inventory_adjustments', JSON.stringify(stockAdjustments));
      localStorage.setItem('ema_inventory_counts', JSON.stringify(stockCounts));
    } catch (e) {
      console.warn('Failed saving inventory to localStorage', e);
    }
  }, [stores, materials, batches, stockBalances, grns, materialIssues, materialReturns, stockTransfers, stockAdjustments, stockCounts]);

  // Helper Stock Queries
  const getMaterialStockTotal = useCallback((materialId: string): number => {
    return stockBalances
      .filter(b => b.materialId === materialId)
      .reduce((sum, b) => sum + (b.onHandQuantity || 0), 0);
  }, [stockBalances]);

  const getStoreStock = useCallback((materialId: string, storeId: string): number => {
    const record = stockBalances.find(b => b.materialId === materialId && b.storeId === storeId);
    return record ? record.onHandQuantity : 0;
  }, [stockBalances]);

  const getMaterialBatches = useCallback((materialId: string): StockBatch[] => {
    return batches.filter(b => b.materialId === materialId && b.remainingQuantity > 0);
  }, [batches]);

  // Material Actions
  const addMaterial = (matData: Omit<MaterialItem, 'id' | 'createdAt' | 'updatedAt'>): MaterialItem => {
    const newId = `mat-${Date.now()}`;
    const defaultStore = stores.find(s => s.id === matData.defaultWarehouseId);
    const newMaterial: MaterialItem = {
      ...matData,
      id: newId,
      defaultWarehouseName: defaultStore?.name || '',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    setMaterials(prev => [newMaterial, ...prev]);

    // Initialize balance in default warehouse if not exists
    setStockBalances(prev => {
      const exists = prev.some(b => b.materialId === newId && b.storeId === matData.defaultWarehouseId);
      if (!exists) {
        return [
          ...prev,
          {
            materialId: newId,
            storeId: matData.defaultWarehouseId,
            onHandQuantity: 0,
            allocatedQuantity: 0,
            availableQuantity: 0,
            totalValue: 0,
            locationBin: matData.defaultLocationBin || 'General Bay',
            lastUpdated: new Date().toISOString().split('T')[0]
          }
        ];
      }
      return prev;
    });

    return newMaterial;
  };

  const updateMaterial = (id: string, updates: Partial<MaterialItem>) => {
    setMaterials(prev => prev.map(m => {
      if (m.id !== id) return m;
      return {
        ...m,
        ...updates,
        updatedAt: new Date().toISOString().split('T')[0]
      };
    }));
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
    setStockBalances(prev => prev.filter(b => b.materialId !== id));
    setBatches(prev => prev.filter(b => b.materialId !== id));
  };

  // Store Actions
  const addStore = (storeData: Omit<Store, 'id' | 'createdAt'>): Store => {
    const newId = `store-${Date.now()}`;
    const newStore: Store = {
      ...storeData,
      id: newId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setStores(prev => [...prev, newStore]);
    return newStore;
  };

  const updateStore = (id: string, updates: Partial<Store>) => {
    setStores(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStore = (id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
  };

  // Batch Actions
  const addBatch = (batchData: Omit<StockBatch, 'id'>): StockBatch => {
    const newBatch: StockBatch = {
      ...batchData,
      id: `batch-${Date.now()}`
    };
    setBatches(prev => [newBatch, ...prev]);
    return newBatch;
  };

  const updateBatch = (id: string, updates: Partial<StockBatch>) => {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBatch = (id: string) => {
    setBatches(prev => prev.filter(b => b.id !== id));
  };

  // Stock Balance Actions
  const updateStockBalance = (storeId: string, materialId: string, updates: Partial<StockBalance>) => {
    setStockBalances(prev => prev.map(b => {
      if (b.storeId === storeId && b.materialId === materialId) {
        return { ...b, ...updates };
      }
      return b;
    }));
  };

  const deleteStockBalance = (storeId: string, materialId: string) => {
    setStockBalances(prev => prev.filter(b => !(b.storeId === storeId && b.materialId === materialId)));
  };

  // 1. GRN Action
  const createGRN = (grnData: Omit<InventoryGRN, 'id' | 'createdAt'>): InventoryGRN => {
    const newGRN: InventoryGRN = {
      ...grnData,
      id: `grn-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Update stock balances and batches
    setStockBalances(prev => {
      let updated = [...prev];
      newGRN.items.forEach(item => {
        const accepted = item.acceptedQty !== undefined ? item.acceptedQty : item.quantity;
        const index = updated.findIndex(b => b.materialId === item.materialId && b.storeId === newGRN.storeId);
        if (index >= 0) {
          const current = updated[index];
          const newQty = current.onHandQuantity + accepted;
          const newTotalVal = current.totalValue + (accepted * item.unitCost);
          updated[index] = {
            ...current,
            onHandQuantity: newQty,
            availableQuantity: Math.max(0, newQty - current.allocatedQuantity),
            totalValue: newTotalVal,
            lastUpdated: newGRN.date
          };
        } else {
          updated.push({
            materialId: item.materialId,
            storeId: newGRN.storeId,
            onHandQuantity: accepted,
            allocatedQuantity: 0,
            availableQuantity: accepted,
            totalValue: accepted * item.unitCost,
            locationBin: item.locationBin || 'Inward Bay',
            lastUpdated: newGRN.date
          });
        }
      });
      return updated;
    });

    // Create batches if batchNumber specified
    newGRN.items.forEach(item => {
      const accepted = item.acceptedQty !== undefined ? item.acceptedQty : item.quantity;
      if (item.batchNumber && accepted > 0) {
        const newBatch: StockBatch = {
          id: `batch-${Date.now()}-${item.materialId}`,
          batchNumber: item.batchNumber,
          materialId: item.materialId,
          materialCode: item.materialCode,
          materialName: item.materialName,
          storeId: newGRN.storeId,
          storeName: newGRN.storeName,
          initialQuantity: accepted,
          remainingQuantity: accepted,
          unit: item.unit,
          unitCost: item.unitCost,
          supplierId: newGRN.supplierId,
          supplierName: newGRN.supplierName,
          grnNumber: newGRN.grnNumber,
          manufacturingDate: newGRN.date,
          expiryDate: item.expiryDate,
          locationBin: item.locationBin,
          status: 'ACTIVE'
        };
        setBatches(prev => [newBatch, ...prev]);
      }
    });

    setGrns(prev => [newGRN, ...prev]);
    return newGRN;
  };

  const updateGRN = (id: string, updates: Partial<InventoryGRN>) => {
    setGrns(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGRN = (id: string) => {
    setGrns(prev => prev.filter(g => g.id !== id));
  };

  // 2. Material Issue Action
  const createMaterialIssue = (issueData: Omit<MaterialIssue, 'id' | 'createdAt'>): MaterialIssue => {
    const newIssue: MaterialIssue = {
      ...issueData,
      id: `issue-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Deduct stock balances
    setStockBalances(prev => {
      let updated = [...prev];
      newIssue.items.forEach(item => {
        const qty = item.issuedQty !== undefined ? item.issuedQty : item.quantity;
        const index = updated.findIndex(b => b.materialId === item.materialId && b.storeId === newIssue.storeId);
        if (index >= 0) {
          const current = updated[index];
          const newQty = Math.max(0, current.onHandQuantity - qty);
          const newTotalVal = Math.max(0, current.totalValue - (qty * item.unitCost));
          updated[index] = {
            ...current,
            onHandQuantity: newQty,
            availableQuantity: Math.max(0, newQty - current.allocatedQuantity),
            totalValue: newTotalVal,
            lastUpdated: newIssue.date
          };
        }
      });
      return updated;
    });

    // Deduct batches if specified
    newIssue.items.forEach(item => {
      const qty = item.issuedQty !== undefined ? item.issuedQty : item.quantity;
      if (item.batchNumber) {
        setBatches(prev => prev.map(b => {
          if (b.batchNumber === item.batchNumber && b.materialId === item.materialId && b.storeId === newIssue.storeId) {
            const rem = Math.max(0, b.remainingQuantity - qty);
            return {
              ...b,
              remainingQuantity: rem,
              status: rem <= 0 ? 'EXHAUSTED' : 'ACTIVE'
            };
          }
          return b;
        }));
      }
    });

    setMaterialIssues(prev => [newIssue, ...prev]);
    return newIssue;
  };

  const updateMaterialIssue = (id: string, updates: Partial<MaterialIssue>) => {
    setMaterialIssues(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteMaterialIssue = (id: string) => {
    setMaterialIssues(prev => prev.filter(i => i.id !== id));
  };

  // 3. Material Return Action
  const createMaterialReturn = (returnData: Omit<MaterialReturn, 'id' | 'createdAt'>): MaterialReturn => {
    const newReturn: MaterialReturn = {
      ...returnData,
      id: `return-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Increase stock balance for usable materials
    setStockBalances(prev => {
      let updated = [...prev];
      newReturn.items.forEach(item => {
        if (item.condition === 'GOOD_USABLE') {
          const index = updated.findIndex(b => b.materialId === item.materialId && b.storeId === newReturn.storeId);
          if (index >= 0) {
            const current = updated[index];
            const newQty = current.onHandQuantity + item.quantity;
            updated[index] = {
              ...current,
              onHandQuantity: newQty,
              availableQuantity: Math.max(0, newQty - current.allocatedQuantity),
              totalValue: current.totalValue + (item.quantity * item.unitCost),
              lastUpdated: newReturn.date
            };
          }
        }
      });
      return updated;
    });

    setMaterialReturns(prev => [newReturn, ...prev]);
    return newReturn;
  };

  const updateMaterialReturn = (id: string, updates: Partial<MaterialReturn>) => {
    setMaterialReturns(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteMaterialReturn = (id: string) => {
    setMaterialReturns(prev => prev.filter(r => r.id !== id));
  };

  // 4. Stock Transfer Action
  const createStockTransfer = (transferData: Omit<StockTransfer, 'id' | 'createdAt'>): StockTransfer => {
    const newTransfer: StockTransfer = {
      ...transferData,
      id: `transfer-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Deduct from source store immediately
    setStockBalances(prev => {
      let updated = [...prev];
      newTransfer.items.forEach(item => {
        const srcIndex = updated.findIndex(b => b.materialId === item.materialId && b.storeId === newTransfer.sourceStoreId);
        if (srcIndex >= 0) {
          const current = updated[srcIndex];
          const newQty = Math.max(0, current.onHandQuantity - item.quantity);
          updated[srcIndex] = {
            ...current,
            onHandQuantity: newQty,
            availableQuantity: Math.max(0, newQty - current.allocatedQuantity),
            totalValue: Math.max(0, current.totalValue - (item.quantity * item.unitCost)),
            lastUpdated: newTransfer.date
          };
        }
      });
      return updated;
    });

    // If marked received immediately
    if (newTransfer.status === 'RECEIVED') {
      setStockBalances(prev => {
        let updated = [...prev];
        newTransfer.items.forEach(item => {
          const destIndex = updated.findIndex(b => b.materialId === item.materialId && b.storeId === newTransfer.destinationStoreId);
          if (destIndex >= 0) {
            const current = updated[destIndex];
            const newQty = current.onHandQuantity + item.quantity;
            updated[destIndex] = {
              ...current,
              onHandQuantity: newQty,
              availableQuantity: Math.max(0, newQty - current.allocatedQuantity),
              totalValue: current.totalValue + (item.quantity * item.unitCost),
              lastUpdated: newTransfer.date
            };
          } else {
            updated.push({
              materialId: item.materialId,
              storeId: newTransfer.destinationStoreId,
              onHandQuantity: item.quantity,
              allocatedQuantity: 0,
              availableQuantity: item.quantity,
              totalValue: item.quantity * item.unitCost,
              locationBin: 'Transfer Inward Bay',
              lastUpdated: newTransfer.date
            });
          }
        });
        return updated;
      });
    }

    setStockTransfers(prev => [newTransfer, ...prev]);
    return newTransfer;
  };

  const markTransferReceived = (id: string, receiverName: string) => {
    setStockTransfers(prev => prev.map(t => {
      if (t.id !== id) return t;
      // Add items into destination store
      setStockBalances(balances => {
        let updated = [...balances];
        t.items.forEach(item => {
          const destIndex = updated.findIndex(b => b.materialId === item.materialId && b.storeId === t.destinationStoreId);
          if (destIndex >= 0) {
            const current = updated[destIndex];
            const newQty = current.onHandQuantity + item.quantity;
            updated[destIndex] = {
              ...current,
              onHandQuantity: newQty,
              availableQuantity: Math.max(0, newQty - current.allocatedQuantity),
              totalValue: current.totalValue + (item.quantity * item.unitCost),
              lastUpdated: new Date().toISOString().split('T')[0]
            };
          } else {
            updated.push({
              materialId: item.materialId,
              storeId: t.destinationStoreId,
              onHandQuantity: item.quantity,
              allocatedQuantity: 0,
              availableQuantity: item.quantity,
              totalValue: item.quantity * item.unitCost,
              locationBin: 'Transfer Inward Bay',
              lastUpdated: new Date().toISOString().split('T')[0]
            });
          }
        });
        return updated;
      });

      return {
        ...t,
        status: 'RECEIVED',
        receivedBy: receiverName,
        receivedDate: new Date().toISOString().split('T')[0]
      };
    }));
  };

  const updateStockTransfer = (id: string, updates: Partial<StockTransfer>) => {
    setStockTransfers(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteStockTransfer = (id: string) => {
    setStockTransfers(prev => prev.filter(t => t.id !== id));
  };

  // 5. Stock Adjustment Action
  const createStockAdjustment = (adjData: Omit<StockAdjustment, 'id' | 'createdAt'>): StockAdjustment => {
    const newAdj: StockAdjustment = {
      ...adjData,
      id: `adj-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Apply adjustments directly to store stock records
    setStockBalances(prev => {
      let updated = [...prev];
      newAdj.items.forEach(item => {
        const index = updated.findIndex(b => b.materialId === item.materialId && b.storeId === newAdj.storeId);
        if (index >= 0) {
          const current = updated[index];
          const newQty = Math.max(0, current.onHandQuantity + item.differenceQty);
          updated[index] = {
            ...current,
            onHandQuantity: newQty,
            availableQuantity: Math.max(0, newQty - current.allocatedQuantity),
            totalValue: Math.max(0, current.totalValue + (item.differenceQty * item.unitCost)),
            lastUpdated: newAdj.date
          };
        }
      });
      return updated;
    });

    setStockAdjustments(prev => [newAdj, ...prev]);
    return newAdj;
  };

  const updateStockAdjustment = (id: string, updates: Partial<StockAdjustment>) => {
    setStockAdjustments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteStockAdjustment = (id: string) => {
    setStockAdjustments(prev => prev.filter(a => a.id !== id));
  };

  // 6. Stock Count Action
  const createStockCount = (countData: Omit<StockCount, 'id' | 'createdAt'>): StockCount => {
    const newCount: StockCount = {
      ...countData,
      id: `count-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setStockCounts(prev => [newCount, ...prev]);
    return newCount;
  };

  const reconcileStockCount = (id: string) => {
    setStockCounts(prev => prev.map(sc => {
      if (sc.id !== id) return sc;
      const today = new Date().toISOString().split('T')[0];

      // Update store balances to reflect the physical count
      setStockBalances(balances => {
        let updated = [...balances];
        sc.items.forEach(item => {
          const index = updated.findIndex(b => b.materialId === item.materialId && b.storeId === sc.storeId);
          if (index >= 0) {
            const current = updated[index];
            updated[index] = {
              ...current,
              onHandQuantity: item.physicalQty,
              availableQuantity: Math.max(0, item.physicalQty - current.allocatedQuantity),
              totalValue: item.physicalQty * item.unitCost,
              lastUpdated: today
            };
          } else {
            updated.push({
              materialId: item.materialId,
              storeId: sc.storeId,
              onHandQuantity: item.physicalQty,
              allocatedQuantity: 0,
              availableQuantity: item.physicalQty,
              totalValue: item.physicalQty * item.unitCost,
              locationBin: 'Verified In-Store',
              lastUpdated: today
            });
          }
        });
        return updated;
      });

      return {
        ...sc,
        status: 'RECONCILED',
        reconciliationDate: today,
        items: sc.items.map(i => ({ ...i, reconciled: true }))
      };
    }));
  };

  const updateStockCount = (id: string, updates: Partial<StockCount>) => {
    setStockCounts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteStockCount = (id: string) => {
    setStockCounts(prev => prev.filter(c => c.id !== id));
  };

  // -------------------------------------------------------------
  // DASHBOARD & ANALYTICS COMPUTATION
  // -------------------------------------------------------------
  const dashboardData = useMemo<InventoryDashboardData>(() => {
    // 1. Total Stock Valuation
    const totalStockValue = stockBalances.reduce((sum, b) => sum + (b.totalValue || (b.onHandQuantity * 0)), 0);
    const totalSkusCount = materials.length;
    const activeWarehousesCount = stores.filter(s => s.status === 'ACTIVE').length;

    // 2. Low Stock & Critical Stock Radar
    const lowStockItems: LowStockAlert[] = [];
    materials.forEach(mat => {
      const currentStock = stockBalances
        .filter(b => b.materialId === mat.id)
        .reduce((sum, b) => sum + b.onHandQuantity, 0);

      if (currentStock <= mat.minStockLevel) {
        const deficit = Math.max(0, mat.minStockLevel - currentStock);
        lowStockItems.push({
          materialId: mat.id,
          materialCode: mat.code,
          materialName: mat.name,
          category: mat.category,
          unit: mat.unit,
          currentStock,
          minStockLevel: mat.minStockLevel,
          maxStockLevel: mat.maxStockLevel,
          deficit,
          reorderQuantity: mat.reorderQuantity,
          suggestedReorderQty: mat.reorderQuantity,
          standardCost: mat.standardCost,
          estimatedCost: mat.reorderQuantity * mat.standardCost,
          primarySupplierName: mat.primarySupplierName,
          status: currentStock === 0 ? 'CRITICAL_OUT_OF_STOCK' : 'LOW_STOCK',
          severity: currentStock === 0 ? 'CRITICAL' : 'WARNING'
        });
      }
    });

    const lowStockCount = lowStockItems.length;
    const criticalStockCount = lowStockItems.filter(i => i.status === 'CRITICAL_OUT_OF_STOCK').length;

    // 3. Fast-Moving Materials (Ranked by issue volume / value)
    const materialIssueAgg: Record<string, { qty: number; value: number; count: number }> = {};
    materialIssues.forEach(issue => {
      issue.items.forEach(item => {
        if (!materialIssueAgg[item.materialId]) {
          materialIssueAgg[item.materialId] = { qty: 0, value: 0, count: 0 };
        }
        materialIssueAgg[item.materialId].qty += (item.issuedQty !== undefined ? item.issuedQty : item.quantity);
        materialIssueAgg[item.materialId].value += item.totalValue;
        materialIssueAgg[item.materialId].count += 1;
      });
    });

    const fastMovingMaterials: FastMovingMaterial[] = Object.keys(materialIssueAgg).map(matId => {
      const mat = materials.find(m => m.id === matId);
      const agg = materialIssueAgg[matId];
      const currentStock = stockBalances
        .filter(b => b.materialId === matId)
        .reduce((sum, b) => sum + b.onHandQuantity, 0);
      const velocityScore = Math.round((agg.qty / (currentStock + 1)) * 100);

      return {
        materialId: matId,
        materialCode: mat?.code || 'MAT-?',
        materialName: mat?.name || 'Unknown Material',
        category: mat?.category || 'OTHER',
        unit: mat?.unit || 'Units',
        totalQuantityIssued: agg.qty,
        totalIssuedQuantity: agg.qty,
        totalValueIssued: agg.value,
        totalIssuedValue: agg.value,
        issueTransactionCount: agg.count,
        issuesCount: agg.count,
        currentStock,
        velocityScore
      };
    }).sort((a, b) => b.totalValueIssued - a.totalValueIssued).map((item, idx) => ({
      ...item,
      velocityRank: idx + 1
    }));

    // 4. Slow-Moving / Dormant Materials (Low issue or 0 issues)
    const now = new Date();
    const slowMovingMaterials: SlowMovingMaterial[] = materials
      .filter(mat => {
        const issues = materialIssues.filter(iss => iss.items.some(i => i.materialId === mat.id));
        return issues.length <= 1; // Few or no issues
      })
      .map(mat => {
        const currentStock = stockBalances
          .filter(b => b.materialId === mat.id)
          .reduce((sum, b) => sum + b.onHandQuantity, 0);
        const tiedUpValue = currentStock * (mat.averageCost || mat.standardCost);

        // Find last issued date
        let lastDate: string | undefined;
        materialIssues.forEach(iss => {
          if (iss.items.some(i => i.materialId === mat.id)) {
            if (!lastDate || new Date(iss.date) > new Date(lastDate)) {
              lastDate = iss.date;
            }
          }
        });

        const daysSinceLastIssue = lastDate
          ? Math.floor((now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
          : 90;

        return {
          materialId: mat.id,
          materialCode: mat.code,
          materialName: mat.name,
          category: mat.category,
          unit: mat.unit,
          currentStock,
          unitCost: mat.averageCost || mat.standardCost,
          tiedUpValue,
          daysSinceLastIssue,
          lastIssuedDate: lastDate,
          status: (daysSinceLastIssue > 90 ? 'OBSOLETE' : daysSinceLastIssue > 45 ? 'DORMANT' : 'SLOW_MOVING') as 'OBSOLETE' | 'DORMANT' | 'SLOW_MOVING'
        };
      })
      .filter(m => m.currentStock > 0)
      .sort((a, b) => b.tiedUpValue - a.tiedUpValue);

    // 5. Project-Wise Consumption
    const projectMap: Record<string, {
      totalValue: number;
      issuesCount: number;
      materials: Record<string, { qty: number; unit: string; value: number }>;
    }> = {};

    materialIssues.forEach(issue => {
      const prj = issue.projectCode || 'UNASSIGNED';
      if (!projectMap[prj]) {
        projectMap[prj] = { totalValue: 0, issuesCount: 0, materials: {} };
      }
      projectMap[prj].totalValue += issue.totalValue;
      projectMap[prj].issuesCount += 1;

      issue.items.forEach(item => {
        if (!projectMap[prj].materials[item.materialName]) {
          projectMap[prj].materials[item.materialName] = { qty: 0, unit: item.unit, value: 0 };
        }
        projectMap[prj].materials[item.materialName].qty += (item.issuedQty !== undefined ? item.issuedQty : item.quantity);
        projectMap[prj].materials[item.materialName].value += item.totalValue;
      });
    });

    const projectConsumptions: ProjectConsumptionSummary[] = Object.keys(projectMap).map(prj => {
      const data = projectMap[prj];
      const matEntries = Object.entries(data.materials);
      let topMat = 'None';
      let topMatVal = 0;
      matEntries.forEach(([name, d]) => {
        if (d.value > topMatVal) {
          topMatVal = d.value;
          topMat = name;
        }
      });

      return {
        projectCode: prj,
        totalValueConsumed: data.totalValue,
        materialsCount: matEntries.length,
        issuesCount: data.issuesCount,
        topConsumedMaterial: topMat,
        materialBreakdown: matEntries.map(([name, d]) => ({
          materialName: name,
          quantity: d.qty,
          unit: d.unit,
          totalValue: d.value
        }))
      };
    }).sort((a, b) => b.totalValueConsumed - a.totalValueConsumed);

    // 6. Category Valuations
    const catMap: Record<string, { value: number; count: number }> = {};
    materials.forEach(m => {
      const bals = stockBalances.filter(b => b.materialId === m.id);
      const val = bals.reduce((sum, b) => sum + b.totalValue, 0);
      const catLabel = m.category.replace(/_/g, ' ');
      if (!catMap[catLabel]) catMap[catLabel] = { value: 0, count: 0 };
      catMap[catLabel].value += val;
      catMap[catLabel].count += 1;
    });

    const categoryValuations = Object.entries(catMap).map(([category, d]) => ({
      category,
      value: d.value,
      count: d.count
    })).sort((a, b) => b.value - a.value);

    // 7. Warehouse Valuations
    const whMap: Record<string, { value: number; count: number }> = {};
    stores.forEach(s => {
      const bals = stockBalances.filter(b => b.storeId === s.id);
      const val = bals.reduce((sum, b) => sum + b.totalValue, 0);
      whMap[s.name] = { value: val, count: bals.length };
    });

    const warehouseValuations = Object.entries(whMap).map(([warehouseName, d]) => ({
      warehouseName,
      value: d.value,
      count: d.count
    })).sort((a, b) => b.value - a.value);

    // Monthly issues / receipts
    const monthlyIssuesValue = materialIssues.reduce((sum, i) => sum + i.totalValue, 0);
    const monthlyReceiptsValue = grns.reduce((sum, g) => sum + g.totalAmount, 0);

    const outOfStockCount = materials.filter(m => {
      const totalStock = stockBalances.filter(b => b.materialId === m.id).reduce((sum, b) => sum + b.onHandQuantity, 0);
      return totalStock <= 0;
    }).length;

    const slowMovingValue = slowMovingMaterials.reduce((sum, s) => sum + s.tiedUpValue, 0);
    const categoryValuation = categoryValuations.map(c => ({ categoryName: c.category, valuation: c.value }));
    const storeStockValuation = warehouseValuations.map(w => ({ storeName: w.warehouseName, stockValue: w.value, itemCount: w.count }));
    const projectWiseConsumption = projectConsumptions.map(p => ({
      projectCode: p.projectCode,
      totalConsumptionValue: p.totalValueConsumed,
      issueCount: p.issuesCount,
      materialsCount: p.materialsCount
    }));

    return {
      totalStockValue,
      totalSkusCount,
      totalMaterialsCount: materials.length,
      lowStockCount,
      criticalStockCount,
      outOfStockCount,
      activeWarehousesCount,
      activeStoresCount: stores.length,
      monthlyIssuesValue,
      monthlyReceiptsValue,
      monthlyConsumptionTotal: monthlyIssuesValue,
      fastMovingCount: fastMovingMaterials.length,
      slowMovingCount: slowMovingMaterials.length,
      slowMovingValue,
      categoryValuations,
      categoryValuation,
      warehouseValuations,
      storeStockValuation,
      lowStockItems,
      fastMovingMaterials,
      slowMovingMaterials,
      projectConsumptions,
      projectWiseConsumption
    };
  }, [stockBalances, materials, stores, materialIssues, grns]);

  // Clear History
  const clearTransactionsHistory = (transactionType?: string) => {
    if (!transactionType || transactionType === 'ALL') {
      setGrns([]);
      setMaterialIssues([]);
      setMaterialReturns([]);
      setStockTransfers([]);
      setStockAdjustments([]);
      setStockCounts([]);
    } else if (transactionType === 'GRN') {
      setGrns([]);
    } else if (transactionType === 'MATERIAL_ISSUE') {
      setMaterialIssues([]);
    } else if (transactionType === 'MATERIAL_RETURN') {
      setMaterialReturns([]);
    } else if (transactionType === 'STOCK_TRANSFER') {
      setStockTransfers([]);
    } else if (transactionType === 'STOCK_ADJUSTMENT') {
      setStockAdjustments([]);
    } else if (transactionType === 'STOCK_COUNT') {
      setStockCounts([]);
    }
  };

  const resetToDefaultInventory = () => {
    setStores(INITIAL_STORES);
    setMaterials(INITIAL_MATERIALS);
    setBatches(INITIAL_BATCHES);
    setStockBalances(INITIAL_STOCK_BALANCES);
    setGrns(INITIAL_GRNS);
    setMaterialIssues(INITIAL_MATERIAL_ISSUES);
    setMaterialReturns(INITIAL_MATERIAL_RETURNS);
    setStockTransfers(INITIAL_STOCK_TRANSFERS);
    setStockAdjustments(INITIAL_STOCK_ADJUSTMENTS);
    setStockCounts(INITIAL_STOCK_COUNTS);
  };

  return (
    <InventoryContext.Provider
      value={{
        stores,
        materials,
        batches,
        stockBalances,
        grns,
        materialIssues,
        materialReturns,
        stockTransfers,
        stockAdjustments,
        stockCounts,

        addMaterial,
        updateMaterial,
        deleteMaterial,

        addStore,
        updateStore,
        deleteStore,

        addBatch,
        updateBatch,
        deleteBatch,

        updateStockBalance,
        deleteStockBalance,

        createGRN,
        updateGRN,
        deleteGRN,

        createMaterialIssue,
        updateMaterialIssue,
        deleteMaterialIssue,

        createMaterialReturn,
        updateMaterialReturn,
        deleteMaterialReturn,

        createStockTransfer,
        updateStockTransfer,
        deleteStockTransfer,
        markTransferReceived,

        createStockAdjustment,
        updateStockAdjustment,
        deleteStockAdjustment,

        createStockCount,
        updateStockCount,
        deleteStockCount,
        reconcileStockCount,

        getMaterialStockTotal,
        getStoreStock,
        getMaterialBatches,

        dashboardData,
        dashboardMetrics: dashboardData,
        lowStockAlerts: dashboardData.lowStockItems,
        fastMovingMaterials: dashboardData.fastMovingMaterials,
        slowMovingMaterials: dashboardData.slowMovingMaterials,
        projectConsumptions: dashboardData.projectConsumptions,
        lowStockCount: dashboardData.lowStockCount,

        clearTransactionsHistory,
        clearTransactionHistory: clearTransactionsHistory,
        resetToDefaultInventory
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
