import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    RotateCcw, Loader2, Maximize,
    StopCircle, MapPin, PackageSearch, Scan, 
    Usb, Box, ShoppingCart, Trash2, MapPinned, Eye, X, CheckCircle2,
    IndianRupee, Scale
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import {
    fetchTodayScannedOrdersApi,
    getOrderPincodeApi,
    deleteScannedOrderApi,
    fetchDateWiseAddressesApi,
    fetchOrderDetailsApi
} from "../services/apiCalls";
import Pagination from "../components/ui/Pagination";
import { cn } from "../lib/utils";

// --- Detail Modal Component ---
const OrderDetailModal = ({ orderNumber, onClose }) => {
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getDetails = async () => {
            try {
                const res = await fetchOrderDetailsApi(orderNumber);
                if (res) setDetails(res);
            } catch (err) {
                toast.error("Failed to load order details");
                onClose();
            } finally {
                setLoading(false);
            }
        };
        getDetails();
    }, [orderNumber, onClose]);

    if (loading) return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    if (!details) return null;
    const { order, pickup_address, consignee, items } = details;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-card-bg border border-border-subtle w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl my-8">
                <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-dashboard-bg/50">
                    <div>
                        <h2 className="text-xl font-black text-text-main uppercase tracking-tight">Order: {order.order_number}</h2>
                        <p className="text-[10px] text-text-muted font-mono">{order.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} className="text-text-muted" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center border-4 border-primary/20">
                            <p className="text-[10px] font-black text-black mb-2 uppercase">Official Barcode</p>
                            <img src={`data:image/png;base64,${order.barcode}`} alt="Barcode" className="w-full h-auto" />
                        </div>
                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                            <label className="text-[10px] font-black text-primary uppercase">Current Status</label>
                            <div className="text-lg font-black text-text-main flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-primary" />
                                {order.status}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-dashboard-bg/50 rounded-2xl border border-border-subtle">
                                <h4 className="text-[10px] font-black text-text-muted uppercase mb-1">Destination</h4>
                                <p className="text-sm font-bold text-text-main">{consignee.name}</p>
                                <p className="text-xs text-text-muted">{consignee.city}, {consignee.state} - {consignee.pincode}</p>
                            </div>
                            <div className="p-4 bg-dashboard-bg/50 rounded-2xl border border-border-subtle">
                                <h4 className="text-[10px] font-black text-text-muted uppercase mb-1">Origin</h4>
                                <p className="text-sm font-bold text-text-main">{pickup_address.nickname}</p>
                                <p className="text-xs text-text-muted">{pickup_address.city}, {pickup_address.state}</p>
                            </div>
                        </div>
                        
                        <div className="border border-border-subtle rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-dashboard-bg text-[10px] font-black text-text-muted uppercase">
                                    <tr><th className="p-3">Item Name</th><th className="p-3 text-center">Qty</th><th className="p-3 text-right">Total</th></tr>
                                </thead>
                                <tbody className="divide-y divide-border-subtle">
                                    {items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="p-3 text-text-main font-bold">{item.product_name}</td>
                                            <td className="p-3 text-center text-text-muted">{item.qty}</td>
                                            <td className="p-3 text-right text-primary font-black">₹{item.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function ScannedOrders() {
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedOrderNum, setSelectedOrderNum] = useState(null);
    const [location, setLocation] = useState({ lat: null, lng: null });
    const [pagination, setPagination] = useState({ page: 1, total_pages: 1 });

    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        status: "Warehouse",
        location_id: "",
        page: 1,
        limit: 10
    });

    const scannerRef = useRef(null);
    const hiddenInputRef = useRef(null);

    // --- API LOGIC ---
    const loadScannedOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchTodayScannedOrdersApi(filters);
            if (res?.orders) {
                setOrders(res.orders);
                setPagination({
                    page: res.pagination?.page || 1,
                    total_pages: res.pagination?.total_pages || 1
                });
            } else {
                setOrders([]);
            }
        } catch (error) {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    const loadAddresses = useCallback(async () => {
        try {
            const res = await fetchDateWiseAddressesApi({
                date: filters.date,
                status: filters.status
            });
            if (res?.success) setAddresses(res.addresses || []);
        } catch (error) {
            setAddresses([]);
        }
    }, [filters.date, filters.status]);

    useEffect(() => { loadScannedOrders(); }, [loadScannedOrders]);
    useEffect(() => { loadAddresses(); }, [loadAddresses]);

    // --- GPS TRACKER ---
    useEffect(() => {
        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => setLocation({ 
                    lat: pos.coords.latitude.toFixed(6), 
                    lng: pos.coords.longitude.toFixed(6) 
                }),
                (err) => console.error("GPS Error:", err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // --- SCAN LOGIC ---
    const handleScanSuccess = async (decodedText) => {
        if (!decodedText || scanLoading) return;
        let orderNumber = decodedText.trim().replace(/["\n\r\t\s+]/g, "");
        if (orderNumber.includes("/")) orderNumber = orderNumber.split("/").pop();
        
        if (!location.lat) {
            toast.error("Waiting for GPS signal...");
            return;
        }
        
        setScanLoading(true);
        const toastId = toast.loading(`Logging ${orderNumber}...`);
        try {
            await getOrderPincodeApi(orderNumber, location.lat, location.lng);
            toast.success(`Order ${orderNumber} Logged`, { id: toastId });
            loadScannedOrders();
            loadAddresses();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Log failed", { id: toastId });
        } finally {
            setScanLoading(false);
            if (hiddenInputRef.current) {
                hiddenInputRef.current.value = "";
                hiddenInputRef.current.focus();
            }
        }
    };

    const handleDeleteScan = async (orderUuid) => {
        if (!window.confirm("Revert this scan record?")) return;
        const tid = toast.loading("Processing...");
        try {
            await deleteScannedOrderApi(orderUuid);
            toast.success("Record deleted", { id: tid });
            loadScannedOrders();
            loadAddresses();
        } catch (error) {
            toast.error("Delete failed", { id: tid });
        }
    };

    const toggleScanner = async () => {
        if (isScanning) {
            if (scannerRef.current) await scannerRef.current.stop();
            setIsScanning(false);
            return;
        }
        setIsScanning(true);
        setTimeout(async () => {
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;
            await html5QrCode.start({ facingMode: "environment" }, { fps: 20, qrbox: 250 }, handleScanSuccess);
        }, 300);
    };

    return (
        <div className="space-y-6 p-4 lg:p-6 bg-dashboard-bg min-h-screen">
            {/* HIDDEN INPUT FOR USB SCANNERS */}
            <input
                ref={hiddenInputRef}
                type="text"
                className="opacity-0 absolute pointer-events-none"
                onKeyDown={(e) => { if (e.key === "Enter") { handleScanSuccess(e.target.value); e.target.value = ""; } }}
                autoFocus
            />

            {selectedOrderNum && (
                <OrderDetailModal orderNumber={selectedOrderNum} onClose={() => setSelectedOrderNum(null)} />
            )}

            {/* HEADER SECTION */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <Scan className="text-primary" /> Multi-Point Scan Log
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border border-green-500/30 text-green-500 bg-green-500/5">
                            <Usb size={12} /> USB READY
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted">
                            <MapPin size={12} className="text-primary" /> 
                            GPS: {location.lat ? `${location.lat}, ${location.lng}` : "Locating..."}
                        </div>
                    </div>
                </div>

                <Button 
                    onClick={toggleScanner} 
                    className={cn("h-11 px-8 rounded-xl font-bold transition-all active:scale-95", 
                    isScanning ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary-dark text-black")}
                >
                    {isScanning ? <StopCircle size={18} className="mr-2" /> : <Maximize size={18} className="mr-2" />}
                    {isScanning ? "Close Camera" : "Mobile Camera Scan"}
                </Button>
            </div>

            {isScanning && (
                <div id="reader" className="w-full max-w-md mx-auto rounded-2xl overflow-hidden border-4 border-primary shadow-2xl mb-6" />
            )}

            <Card className="bg-card-bg border-border-subtle shadow-xl overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    {/* FILTERS */}
                    <div className="p-5 bg-dashboard-bg/30 border-b border-border-subtle grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-text-muted uppercase">Date</label>
                            <input
                                type="date"
                                className="w-full bg-card-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-main outline-none focus:border-primary"
                                value={filters.date}
                                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value, page: 1 }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-text-muted uppercase">Global Status</label>
                            <select
                                className="w-full bg-card-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-main outline-none focus:border-primary"
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1, location_id: "" }))}
                            >
                                <option value="Picked">Picked</option>
                                <option value="Warehouse">Warehouse</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-text-muted uppercase">Target Location</label>
                            <select
                                className="w-full bg-card-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-main outline-none focus:border-primary"
                                value={filters.location_id}
                                onChange={(e) => setFilters(prev => ({ ...prev, location_id: e.target.value, page: 1 }))}
                            >
                                <option value="">All {filters.status} Points ({addresses.length})</option>
                                {addresses.map((addr) => (
                                    <option key={addr.id} value={addr.id}>
                                        {addr.nickname} ({addr.city})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button 
                            onClick={() => { loadScannedOrders(); loadAddresses(); }} 
                            className="bg-white/5 hover:bg-white/10 text-text-main text-xs h-10 border border-border-subtle rounded-xl"
                        >
                            <RotateCcw size={14} className="mr-2" /> Refresh
                        </Button>
                    </div>

                    {/* ENHANCED TABLE */}
                    <div className="overflow-x-auto relative min-h-[400px]">
                        {loading && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                                <Loader2 className="animate-spin text-primary" size={40} />
                            </div>
                        )}
                        <table className="w-full text-left">
                            <thead className="bg-dashboard-bg/50 text-text-muted text-[10px] font-black uppercase border-b border-border-subtle">
                                <tr>
                                    <th className="px-6 py-4">Order & Consignee</th>
                                    <th className="px-6 py-4">Package Details</th>
                                    <th className="px-6 py-4">Scan Info</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-primary/5 transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-black text-text-main group-hover:text-primary transition-colors">
                                                    {order.order_number}
                                                </div>
                                                <div className="text-[10px] text-text-muted uppercase font-bold">
                                                    {order.consignee?.name} • {order.consignee?.city}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-text-main">
                                                        <span className="flex items-center gap-1"><Scale size={12} className="text-primary"/> {order.total_weight_kg}kg</span>
                                                        <span className="flex items-center gap-1"><Box size={12} className="text-primary"/> {order.total_boxes} Pkts</span>
                                                    </div>
                                                    <div className="text-[10px] text-text-muted flex items-center gap-1 font-bold">
                                                        <IndianRupee size={10} /> {order.order_value} ({order.payment_method})
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] font-black text-primary uppercase mb-1">
                                                    {order.status} @ {order.pickup?.nickname || "Station"}
                                                </div>
                                                <div className="text-xs font-mono font-bold text-text-main">
                                                    {new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => setSelectedOrderNum(order.order_number)}
                                                        className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                        title="View Full Details"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteScan(order.id)}
                                                        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Revert Scan"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center">
                                            <PackageSearch size={48} className="mx-auto opacity-20 mb-4" />
                                            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">No scanned records found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.total_pages}
                        onPageChange={(p) => setFilters(prev => ({ ...prev, page: p }))}
                    />
                </CardContent>
            </Card>
        </div>
    );
}