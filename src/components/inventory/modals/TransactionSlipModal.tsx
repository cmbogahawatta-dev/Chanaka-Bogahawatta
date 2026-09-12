import React from 'react';
import { X, Printer, Download, Building2, CheckCircle2, ShieldCheck, FileText } from 'lucide-react';
import { InventoryGRN, MaterialIssue, MaterialReturn, StockTransfer, StockAdjustment, StockCount } from '../../../types/inventoryTypes';

type SlipTransaction = 
  | { type: 'GRN'; data: InventoryGRN }
  | { type: 'ISSUE'; data: MaterialIssue }
  | { type: 'RETURN'; data: MaterialReturn }
  | { type: 'TRANSFER'; data: StockTransfer }
  | { type: 'ADJUSTMENT'; data: StockAdjustment }
  | { type: 'COUNT'; data: StockCount };

interface TransactionSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  slip: SlipTransaction | null;
}

export const TransactionSlipModal: React.FC<TransactionSlipModalProps> = ({
  isOpen,
  onClose,
  slip
}) => {
  if (!isOpen || !slip) return null;

  const handlePrint = () => {
    window.print();
  };

  const getTitleAndNumber = () => {
    switch (slip.type) {
      case 'GRN':
        return {
          title: 'GOODS RECEIVED NOTE (GRN)',
          number: slip.data.grnNumber,
          accentColor: 'emerald',
          badgeText: 'STORE INWARD / RECEIPT'
        };
      case 'ISSUE':
        return {
          title: 'MATERIAL ISSUE NOTE (MIN)',
          number: slip.data.issueNumber,
          accentColor: 'purple',
          badgeText: 'SITE REQUISITION / OUTWARD'
        };
      case 'RETURN':
        return {
          title: 'MATERIAL RETURN NOTE (MRN)',
          number: slip.data.returnNumber,
          accentColor: 'teal',
          badgeText: 'SITE SURPLUS / RETURN'
        };
      case 'TRANSFER':
        return {
          title: 'INTER-STORE TRANSFER NOTE (STR)',
          number: slip.data.transferNumber,
          accentColor: 'cyan',
          badgeText: 'WAREHOUSE TO WAREHOUSE'
        };
      case 'ADJUSTMENT':
        return {
          title: 'STOCK ADJUSTMENT VOUCHER (ADJ)',
          number: slip.data.adjustmentNumber,
          accentColor: 'rose',
          badgeText: `${slip.data.type} ADJUSTMENT`
        };
      case 'COUNT':
        return {
          title: 'PHYSICAL STOCKTAKE RECONCILIATION (STC)',
          number: slip.data.countNumber,
          accentColor: 'indigo',
          badgeText: slip.data.status
        };
    }
  };

  const headerInfo = getTitleAndNumber();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:bg-white text-slate-200 print:text-black">
        {/* Actions bar (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 print:hidden sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Document Voucher Slip
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {headerInfo.number} • {headerInfo.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Voucher
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Content */}
        <div className="overflow-y-auto p-8 space-y-6 flex-1 bg-slate-900 print:bg-white print:p-6 print:overflow-visible">
          {/* Company Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-slate-700 print:border-black pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-amber-400 print:text-black" />
                <h1 className="text-xl font-black tracking-wider text-white print:text-black uppercase">
                  MAGA-WALPOLA JOINT VENTURE (PVT) LTD
                </h1>
              </div>
              <p className="text-xs text-slate-400 print:text-gray-600 mt-0.5">
                Central Engineering & Construction • Stores, Materials & Inventory Management System
              </p>
              <p className="text-[11px] text-slate-500 print:text-gray-500">
                Registered Office: No. 200, Nawala Road, Narahenpita, Sri Lanka • Tel: +94 11 280 8800
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-slate-800 text-amber-400 border border-slate-700 print:border-black print:text-black print:bg-transparent">
                {headerInfo.badgeText}
              </span>
              <div className="text-lg font-black font-mono mt-1 text-white print:text-black">
                {headerInfo.number}
              </div>
              <div className="text-xs text-slate-400 print:text-gray-600">
                Date: <span className="font-semibold text-white print:text-black">{slip.data.date}</span>
              </div>
            </div>
          </div>

          {/* Slip Specific Metadata Grid */}
          {slip.type === 'GRN' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/50 print:bg-gray-100 border border-slate-700/60 print:border-gray-300 text-xs">
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Store / Warehouse</span>
                <span className="font-bold text-white print:text-black">{slip.data.storeName}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Supplier</span>
                <span className="font-bold text-white print:text-black">{slip.data.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">PO Reference #</span>
                <span className="font-mono text-white print:text-black">{slip.data.poNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Delivery Note #</span>
                <span className="font-mono text-white print:text-black">{slip.data.deliveryNoteNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Vehicle / Truck No</span>
                <span className="font-mono text-white print:text-black">{slip.data.vehicleNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Driver Name</span>
                <span className="text-white print:text-black">{slip.data.driverName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Received By</span>
                <span className="text-white print:text-black">{slip.data.receivedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">QA Inspection</span>
                <span className="font-bold text-emerald-400 print:text-green-700">{slip.data.inspectionStatus}</span>
              </div>
            </div>
          )}

          {slip.type === 'ISSUE' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/50 print:bg-gray-100 border border-slate-700/60 print:border-gray-300 text-xs">
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Source Store</span>
                <span className="font-bold text-white print:text-black">{slip.data.storeName}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Destination Project</span>
                <span className="font-bold text-amber-400 print:text-black font-mono">{slip.data.projectCode}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Work Element / Location</span>
                <span className="text-white print:text-black">{slip.data.workElement || 'General Construction'}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Issued To</span>
                <span className="font-semibold text-white print:text-black">{slip.data.issuedTo}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Issued By</span>
                <span className="text-white print:text-black">{slip.data.issuedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Authorized By</span>
                <span className="text-white print:text-black">{slip.data.authorizedBy || 'Project Manager'}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Vehicle / Plant</span>
                <span className="font-mono text-white print:text-black">{slip.data.vehicleOrPlantNo || 'N/A'}</span>
              </div>
            </div>
          )}

          {slip.type === 'RETURN' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/50 print:bg-gray-100 border border-slate-700/60 print:border-gray-300 text-xs">
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Returning Project</span>
                <span className="font-bold text-amber-400 print:text-black font-mono">{slip.data.projectCode}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Receiving Store</span>
                <span className="font-bold text-white print:text-black">{slip.data.storeName}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Returned By</span>
                <span className="text-white print:text-black">{slip.data.returnedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Received By</span>
                <span className="text-white print:text-black">{slip.data.receivedBy}</span>
              </div>
              <div className="sm:col-span-4">
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Return Reason</span>
                <span className="font-semibold text-white print:text-black">{slip.data.reason}</span>
              </div>
            </div>
          )}

          {slip.type === 'TRANSFER' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/50 print:bg-gray-100 border border-slate-700/60 print:border-gray-300 text-xs">
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Dispatching Store</span>
                <span className="font-bold text-white print:text-black">{slip.data.sourceStoreName}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Receiving Store</span>
                <span className="font-bold text-cyan-400 print:text-black">{slip.data.destinationStoreName}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Transport Vehicle</span>
                <span className="font-mono text-white print:text-black">{slip.data.transporterVehicle}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Driver</span>
                <span className="text-white print:text-black">{slip.data.driverName}</span>
              </div>
            </div>
          )}

          {slip.type === 'ADJUSTMENT' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/50 print:bg-gray-100 border border-slate-700/60 print:border-gray-300 text-xs">
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Store / Warehouse</span>
                <span className="font-bold text-white print:text-black">{slip.data.storeName}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Adjustment Type</span>
                <span className={`font-bold ${slip.data.type === 'INCREASE' ? 'text-emerald-400' : 'text-rose-400'} print:text-black`}>
                  {slip.data.type}
                </span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Authorized By</span>
                <span className="text-white print:text-black">{slip.data.authorizedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Adjusted By</span>
                <span className="text-white print:text-black">{slip.data.adjustedBy}</span>
              </div>
            </div>
          )}

          {slip.type === 'COUNT' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-800/50 print:bg-gray-100 border border-slate-700/60 print:border-gray-300 text-xs">
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Audit Store</span>
                <span className="font-bold text-white print:text-black">{slip.data.storeName}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Audit Status</span>
                <span className="font-bold text-indigo-400 print:text-black">{slip.data.status}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Counted By</span>
                <span className="text-white print:text-black">{slip.data.countedBy}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600 block text-[10px] uppercase font-semibold">Verified By</span>
                <span className="text-white print:text-black">{slip.data.verifiedBy || 'Audit Lead'}</span>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="border border-slate-700 print:border-black rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-800 print:bg-gray-200 text-slate-300 print:text-black font-bold border-b border-slate-700 print:border-black">
                <tr>
                  <th className="p-2.5 w-10">#</th>
                  <th className="p-2.5">Material Description</th>
                  <th className="p-2.5">Code</th>
                  {slip.type === 'GRN' && <th className="p-2.5">Batch #</th>}
                  {slip.type === 'COUNT' ? (
                    <>
                      <th className="p-2.5 text-right">Book Qty</th>
                      <th className="p-2.5 text-right">Physical Qty</th>
                      <th className="p-2.5 text-right">Variance</th>
                    </>
                  ) : (
                    <th className="p-2.5 text-right">Quantity</th>
                  )}
                  <th className="p-2.5">UOM</th>
                  <th className="p-2.5 text-right">Unit Rate (LKR)</th>
                  <th className="p-2.5 text-right">Total (LKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-300">
                {slip.data.items.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-800/20 print:hover:bg-transparent">
                    <td className="p-2.5 text-slate-500 print:text-gray-500 font-mono">{idx + 1}</td>
                    <td className="p-2.5 font-medium text-white print:text-black">{item.materialName}</td>
                    <td className="p-2.5 text-slate-400 print:text-gray-600 font-mono">{item.materialCode}</td>
                    {slip.type === 'GRN' && (
                      <td className="p-2.5 text-slate-300 print:text-black font-mono">{item.batchNumber || '-'}</td>
                    )}
                    {slip.type === 'COUNT' ? (
                      <>
                        <td className="p-2.5 text-right font-mono">{item.systemQuantity}</td>
                        <td className="p-2.5 text-right font-mono font-bold">{item.physicalQuantity}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-400 print:text-black">{item.variance}</td>
                      </>
                    ) : (
                      <td className="p-2.5 text-right font-mono font-bold text-white print:text-black">
                        {item.quantity?.toLocaleString()}
                      </td>
                    )}
                    <td className="p-2.5 text-slate-400 print:text-gray-600">{item.unit}</td>
                    <td className="p-2.5 text-right font-mono text-slate-300 print:text-black">
                      Rs. {item.unitCost?.toLocaleString()}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-white print:text-black">
                      Rs. {(slip.type === 'COUNT' ? item.varianceValue : item.totalValue)?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-800/90 print:bg-gray-100 border-t-2 border-slate-700 print:border-black font-bold">
                <tr>
                  <td colSpan={slip.type === 'COUNT' ? 7 : (slip.type === 'GRN' ? 6 : 5)} className="p-3 text-right text-xs uppercase tracking-wider text-slate-300 print:text-black">
                    {slip.type === 'COUNT' ? 'Net Variance Value:' : 'Grand Total Valuation:'}
                  </td>
                  <td className="p-3 text-right text-sm font-mono text-amber-400 print:text-black">
                    LKR {(
                      slip.type === 'GRN' ? slip.data.totalAmount :
                      slip.type === 'ISSUE' ? slip.data.totalValue :
                      slip.type === 'RETURN' ? slip.data.totalValue :
                      slip.type === 'TRANSFER' ? slip.data.totalValue :
                      slip.type === 'ADJUSTMENT' ? slip.data.totalAdjustmentValue :
                      slip.data.totalVarianceValue
                    )?.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {slip.data.notes && (
            <div className="p-3 rounded-xl bg-slate-800/40 print:bg-gray-50 border border-slate-700/60 print:border-gray-200 text-xs">
              <span className="font-semibold text-slate-300 print:text-black block mb-0.5">Voucher Notes & Remarks:</span>
              <p className="text-slate-400 print:text-gray-700 italic">{slip.data.notes}</p>
            </div>
          )}

          {/* Signature Authorization Block */}
          <div className="pt-8 border-t border-slate-800 print:border-black grid grid-cols-4 gap-6 text-center text-xs">
            <div className="border-t border-dashed border-slate-600 print:border-black pt-2">
              <p className="font-bold text-white print:text-black">Prepared / Issued By</p>
              <p className="text-[10px] text-slate-400 print:text-gray-500 mt-1">Storekeeper / Clerk</p>
            </div>
            <div className="border-t border-dashed border-slate-600 print:border-black pt-2">
              <p className="font-bold text-white print:text-black">Transport / Carrier</p>
              <p className="text-[10px] text-slate-400 print:text-gray-500 mt-1">Driver / Gate Security</p>
            </div>
            <div className="border-t border-dashed border-slate-600 print:border-black pt-2">
              <p className="font-bold text-white print:text-black">Received / Verified By</p>
              <p className="text-[10px] text-slate-400 print:text-gray-500 mt-1">Site Engineer / Inspector</p>
            </div>
            <div className="border-t border-dashed border-slate-600 print:border-black pt-2">
              <p className="font-bold text-white print:text-black">Authorized Approval</p>
              <p className="text-[10px] text-slate-400 print:text-gray-500 mt-1">Project Manager / Director</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
