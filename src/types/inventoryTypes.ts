export type MaterialCategory =
  | 'CEMENT_BINDERS'
  | 'STEEL_REINFORCEMENT'
  | 'AGGREGATES_SAND'
  | 'PIPING_PLUMBING'
  | 'ELECTRICAL'
  | 'TIMBER_FORMWORK'
  | 'CHEMICALS_PAINTS'
  | 'FUEL_LUBRICANTS'
  | 'TOOLS_PPE'
  | 'HARDWARE_FASTENERS'
  | 'OTHER';

export type StoreType =
  | 'CENTRAL_WAREHOUSE'
  | 'SITE_STORE'
  | 'TRANSIT_YARD'
  | 'WORKSHOP_STORE';

export type TransactionType =
  | 'GRN'
  | 'MATERIAL_ISSUE'
  | 'MATERIAL_RETURN'
  | 'STOCK_TRANSFER'
  | 'STOCK_ADJUSTMENT'
  | 'STOCK_COUNT';

export interface Store {
  id: string;
  code: string; // e.g. "WH-01", "ST-PIDM26"
  name: string; // e.g. "Colombo Central Depot & Main Stores"
  type: StoreType;
  projectCode?: string; // e.g. "PIDM 26" or "CENTRAL"
  location: string; // e.g. "Peliyagoda Logistics Park, Zone B"
  storekeeper: string; // e.g. "Sunil Perera"
  contactNumber?: string;
  capacitySqFt?: number;
  zones?: string[]; // e.g. ["Aisle A", "Bay 1", "Shed 2"]
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface MaterialItem {
  id: string;
  code: string; // e.g. "MAT-CEM-001"
  name: string; // e.g. "Ordinary Portland Cement 50kg"
  category: MaterialCategory;
  unit: string; // Bags, MT, Cubes, Kg, Liters, Nos, etc.
  minStockLevel: number; // Low stock threshold / Reorder level
  maxStockLevel: number; // Maximum inventory ceiling
  reorderQuantity: number;
  standardCost: number; // LKR
  averageCost: number; // LKR weighted moving avg
  primarySupplierId?: string;
  primarySupplierName?: string;
  defaultWarehouseId: string; // Store ID
  defaultWarehouseName?: string;
  defaultLocationBin: string; // e.g. "Aisle C, Rack 04"
  brandOrGrade?: string; // e.g. "Tokyo Super 42.5N"
  specifications?: string; // e.g. "SLS 107 Grade 42.5N"
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockBatch {
  id: string;
  batchNumber: string; // e.g. "BATCH-2026-08-C01", "MILL-TMT-8842"
  materialId: string;
  materialCode: string;
  materialName: string;
  storeId: string;
  storeName: string;
  initialQuantity: number;
  remainingQuantity: number;
  unit: string;
  unitCost: number;
  manufacturingDate?: string;
  expiryDate?: string;
  supplierId?: string;
  supplierName?: string;
  grnNumber?: string;
  locationBin?: string;
  millCertNumber?: string;
  status: 'ACTIVE' | 'EXHAUSTED' | 'EXPIRED' | 'QUARANTINE';
}

export interface StoreStockRecord {
  materialId: string;
  storeId: string;
  onHandQuantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
  totalValue: number;
  locationBin: string;
  lastUpdated: string;
}

export type StockBalance = StoreStockRecord;

export interface TransactionLineItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  batchNumber?: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalValue: number;
  locationBin?: string;
  remarks?: string;
}

// 1. Goods Received Note (GRN)
export interface InventoryGRN {
  id: string;
  grnNumber: string; // e.g. "GRN-2026-0041"
  date: string;
  storeId: string;
  storeName: string;
  supplierId?: string;
  supplierName: string;
  poNumber?: string;
  deliveryNoteNumber?: string;
  vehicleNumber?: string;
  driverName?: string;
  receivedBy: string;
  inspectionStatus: 'ACCEPTED' | 'PARTIALLY_ACCEPTED' | 'REJECTED';
  items: Array<TransactionLineItem & {
    orderedQty?: number;
    receivedQty: number;
    acceptedQty: number;
    rejectedQty?: number;
    rejectionReason?: string;
    expiryDate?: string;
  }>;
  totalAmount: number;
  documentName?: string;
  documentUrl?: string;
  notes?: string;
  status: 'POSTED' | 'DRAFT' | 'CANCELLED';
  createdAt: string;
}

// 2. Material Issue (Store Outward / Requisition)
export interface MaterialIssue {
  id: string;
  issueNumber: string; // e.g. "MIN-2026-0089"
  date: string;
  storeId: string;
  storeName: string;
  projectCode: string; // e.g. "PIDM 26", "JAFFNA 02"
  workElement?: string; // e.g. "Culvert Base Concreting KM 14+200"
  issuedTo: string; // Engineer / Foreman / Site Supervisor
  issuedBy: string; // Storekeeper
  authorizedBy?: string; // Project Manager
  vehicleOrPlantNo?: string; // e.g. "CAT-320D", "WP-CAB-8412"
  items: Array<TransactionLineItem & {
    requestedQty: number;
    issuedQty: number;
  }>;
  totalValue: number;
  notes?: string;
  status: 'POSTED' | 'DRAFT' | 'CANCELLED';
  createdAt: string;
}

// 3. Material Return (Site to Store)
export interface MaterialReturn {
  id: string;
  returnNumber: string; // e.g. "MRN-2026-0015"
  date: string;
  projectCode: string;
  storeId: string;
  storeName: string;
  returnedBy: string;
  receivedBy: string;
  reason:
    | 'SURPLUS_AFTER_POUR'
    | 'OVER_REQUISITION'
    | 'PROJECT_COMPLETION'
    | 'DAMAGED_AT_SITE'
    | 'WRONG_SPECIFICATION'
    | 'OTHER';
  items: Array<TransactionLineItem & {
    condition: 'GOOD_USABLE' | 'DAMAGED_SCRAP' | 'NEEDS_REPAIR';
  }>;
  totalValue: number;
  notes?: string;
  status: 'POSTED' | 'DRAFT';
  createdAt: string;
}

// 4. Stock Transfer (Store to Store)
export interface StockTransfer {
  id: string;
  transferNumber: string; // e.g. "STR-2026-0023"
  date: string;
  sourceStoreId: string;
  sourceStoreName: string;
  destinationStoreId: string;
  destinationStoreName: string;
  dispatchDate: string;
  receivedDate?: string;
  transporterVehicle: string;
  driverName: string;
  dispatchedBy: string;
  receivedBy?: string;
  status: 'DISPATCHED' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  items: TransactionLineItem[];
  totalValue: number;
  notes?: string;
  createdAt: string;
}

// 5. Stock Adjustment (Gain / Loss / Wastage / Breakage)
export type StockAdjustmentType = 'INCREASE' | 'DECREASE';

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string; // e.g. "ADJ-2026-0008"
  date: string;
  storeId: string;
  storeName: string;
  adjustmentType: StockAdjustmentType;
  type?: StockAdjustmentType;
  reason:
    | 'DAMAGE_RAIN_WEATHER'
    | 'BREAKAGE_HANDLING'
    | 'SPOILAGE_EXPIRED'
    | 'THEFT_SHORTAGE'
    | 'PHYSICAL_COUNT_SURPLUS'
    | 'SCRAP_WRITEOFF'
    | 'CALIBRATION_GAIN'
    | 'OTHER'
    | string;
  authorizedBy: string;
  adjustedBy: string;
  items: Array<TransactionLineItem & {
    bookQty?: number;
    physicalQty?: number;
    differenceQty?: number;
    reasonNotes?: string;
  }>;
  totalValueImpact: number; // positive or negative
  totalAdjustmentValue?: number;
  notes?: string;
  status: 'POSTED' | 'DRAFT';
  createdAt: string;
}

// 6. Stock Count (Physical Stocktake & Reconciliation)
export interface StockCountItem {
  id: string;
  materialId: string;
  materialCode: string;
  materialName: string;
  unit: string;
  bookQty: number;
  physicalQty: number;
  varianceQty: number;
  unitCost: number;
  varianceValue: number;
  reconciled: boolean;
  notes?: string;
  systemQuantity?: number;
  physicalQuantity?: number;
  variance?: number;
  remarks?: string;
}

export interface StockCount {
  id: string;
  countNumber: string; // e.g. "STC-2026-Q3-01"
  date: string;
  storeId: string;
  storeName: string;
  categoryFilter?: string;
  countedBy: string;
  verifiedBy: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'RECONCILED';
  items: StockCountItem[];
  totalBookValue: number;
  totalPhysicalValue: number;
  netVarianceValue: number;
  totalVarianceValue?: number;
  reconciledDate?: string;
  reconciliationDate?: string;
  notes?: string;
  createdAt: string;
}

export interface LowStockAlert {
  materialId: string;
  materialCode: string;
  materialName: string;
  category: MaterialCategory;
  unit: string;
  currentStock: number;
  minStockLevel: number;
  maxStockLevel: number;
  deficit: number;
  reorderQuantity: number;
  suggestedReorderQty?: number;
  standardCost: number;
  estimatedCost: number;
  primarySupplierName?: string;
  status: 'CRITICAL_OUT_OF_STOCK' | 'LOW_STOCK';
  severity?: 'CRITICAL' | 'WARNING';
}

export interface FastMovingMaterial {
  materialId: string;
  materialCode: string;
  materialName: string;
  category: MaterialCategory;
  unit: string;
  totalQuantityIssued: number;
  totalIssuedQuantity?: number;
  totalValueIssued: number;
  totalIssuedValue?: number;
  issueTransactionCount: number;
  issuesCount?: number;
  currentStock: number;
  velocityScore: number;
  velocityRank?: number | string;
}

export interface SlowMovingMaterial {
  materialId: string;
  materialCode: string;
  materialName: string;
  category: MaterialCategory;
  unit: string;
  currentStock: number;
  unitCost: number;
  tiedUpValue: number;
  daysSinceLastIssue: number;
  lastIssuedDate?: string;
  status: 'SLOW_MOVING' | 'DORMANT' | 'OBSOLETE';
}

export interface ProjectConsumptionSummary {
  projectCode: string;
  totalValueConsumed: number;
  materialsCount: number;
  issuesCount: number;
  topConsumedMaterial: string;
  materialBreakdown: Array<{
    materialName: string;
    quantity: number;
    unit: string;
    totalValue: number;
  }>;
}

export interface InventoryDashboardData {
  totalStockValue: number;
  totalSkusCount: number;
  totalMaterialsCount: number;
  lowStockCount: number;
  criticalStockCount: number;
  outOfStockCount: number;
  activeWarehousesCount: number;
  activeStoresCount: number;
  monthlyIssuesValue: number;
  monthlyReceiptsValue: number;
  monthlyConsumptionTotal: number;
  fastMovingCount: number;
  slowMovingCount: number;
  slowMovingValue: number;
  categoryValuations: Array<{ category: string; value: number; count: number }>;
  categoryValuation: Array<{ categoryName: string; valuation: number }>;
  warehouseValuations: Array<{ warehouseName: string; value: number; count: number }>;
  storeStockValuation: Array<{ storeName: string; stockValue: number; itemCount: number }>;
  lowStockItems: LowStockAlert[];
  fastMovingMaterials: FastMovingMaterial[];
  slowMovingMaterials: SlowMovingMaterial[];
  projectConsumptions: ProjectConsumptionSummary[];
  projectWiseConsumption: Array<{
    projectCode: string;
    totalConsumptionValue: number;
    issueCount: number;
    materialsCount?: number;
  }>;
}
