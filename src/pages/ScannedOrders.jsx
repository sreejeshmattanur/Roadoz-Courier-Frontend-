import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    RotateCcw, Loader2, Maximize, StopCircle, MapPin, PackageSearch, Scan, 
    Usb, Box, Trash2, Eye, X, CheckCircle2, IndianRupee, Scale
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
                toast.error("Failed to load details");
                onClose();
            } finally {
                setLoading(false);
            }
        };
        getDetails();
    }, [orderNumber, onClose]);

    if (loading) return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2 className="animate-spin text-primary" size={48} />
        </div>
    );

    if (!details) return null;
    const { order, pickup_address, consignee, items } = details;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
            <div className="bg-[#121212] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl my-8">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white uppercase">Order: {order.order_number}</h2>
                        <p className="text-[10px] text-gray-500 font-mono">{order.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-4">
                        <div className="bg-white p-4 rounded-xl flex flex-col items-center justify-center">
                            <p className="text-[10px] font-bold text-black mb-2 uppercase">Official Barcode</p>
                            <img src={`data:image/png;base64,${order.barcode}`} alt="Barcode" className="w-full h-auto" />
                        </div>
                        <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                            <label className="text-[10px] font-bold text-primary uppercase">Status</label>
                            <div className="text-lg font-bold text-white flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-primary" />
                                {order.status}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Destination</h4>
                                <p className="text-sm font-bold text-white">{consignee.name}</p>
                                <p className="text-xs text-gray-400">{consignee.city}, {consignee.state}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-1">Origin (Pickup)</h4>
                                <p className="text-sm font-bold text-white">{pickup_address?.nickname || 'N/A'}</p>
                            </div>
                        </div>
                        
                        <div className="border border-white/10 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/5 text-[10px] font-bold text-gray-400 uppercase">
                                    <tr><th className="p-3">Item</th><th className="p-3 text-center">Qty</th><th className="p-3 text-right">Total</th></tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="p-3 text-white">{item.product_name}</td>
                                            <td className="p-3 text-center text-gray-400">{item.qty}</td>
                                            <td className="p-3 text-right text-primary font-bold">₹{item.total}</td>
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
    // --- STATE ---
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
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

    // --- REFS ---
    const scannerRef = useRef(null);
    const hiddenInputRef = useRef(null);
    const processingRef = useRef(false); // Prevents overlapping API calls
    const lastScanned = useRef({ code: "", time: 0 }); // Prevents rapid double scans

    // --- API CALLS ---
    const loadScannedOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchTodayScannedOrdersApi(filters);
            setOrders(res?.orders || []);
            setPagination(res?.pagination || { page: 1, total_pages: 1 });
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

    // --- HARDWARE SCANNER LOGIC (ALWAYS ACTIVE) ---
    useEffect(() => {
        const keepFocus = setInterval(() => {
            // Keep hidden input focused for USB scanners unless typing in another field
            if (hiddenInputRef.current && 
                document.activeElement.tagName !== "INPUT" && 
                document.activeElement.tagName !== "SELECT" && 
                document.activeElement.tagName !== "TEXTAREA") {
                hiddenInputRef.current.focus();
            }
        }, 1000);
        return () => clearInterval(keepFocus);
    }, []);

    // --- GPS TRACKER ---
    useEffect(() => {
        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => setLocation({ lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) }),
                (err) => console.error("GPS Error", err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // --- MAIN SCAN HANDLER ---
    const handleScanSuccess = async (decodedText) => {
        if (!decodedText || processingRef.current) return;

        const cleanCode = decodedText.trim().replace(/["\n\r\t\s+]/g, "").split("/").pop();
        const now = Date.now();

        // Prevent double scan of same code within 2 seconds
        if (lastScanned.current.code === cleanCode && (now - lastScanned.current.time) < 2000) {
            return;
        }

        if (!location.lat) {
            toast.error("Waiting for GPS signal...");
            return;
        }

        processingRef.current = true;
        lastScanned.current = { code: cleanCode, time: now };
        
        const toastId = toast.loading(`Logging ${cleanCode}...`);
        
        try {
            await getOrderPincodeApi(cleanCode, location.lat, location.lng);
            toast.success(`Order ${cleanCode} Logged Successfully`, { id: toastId });
            loadScannedOrders();
            loadAddresses();
        } catch (error) {
            const msg = error?.response?.data?.message || "Logging failed";
            toast.error(msg, { id: toastId });
        } finally {
            processingRef.current = false;
            if (hiddenInputRef.current) {
                hiddenInputRef.current.value = "";
                hiddenInputRef.current.focus();
            }
        }
    };

    // --- FILTERS LOGIC ---
    const handleStatusChange = (e) => {
        const newStatus = e.target.value;
        setFilters(prev => ({
            ...prev,
            status: newStatus,
            location_id: "", // Reset target location on status change
            page: 1
        }));
    };

    const toggleCameraScanner = async () => {
        if (isScanning) {
            if (scannerRef.current) await scannerRef.current.stop();
            setIsScanning(false);
            return;
        }
        setIsScanning(true);
        setTimeout(async () => {
            const html5QrCode = new Html5Qrcode("reader");
            scannerRef.current = html5QrCode;
            await html5QrCode.start(
                { facingMode: "environment" }, 
                { fps: 15, qrbox: { width: 250, height: 250 } }, 
                handleScanSuccess
            );
        }, 300);
    };

    return (
        <div className="space-y-6 p-4 lg:p-6 bg-[#09090b] min-h-screen text-white">
            {/* HIDDEN INPUT FOR HARDWARE SCANNERS */}
            <input
                ref={hiddenInputRef}
                type="text"
                className="fixed -top-10 opacity-0 pointer-events-none"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleScanSuccess(e.target.value);
                        e.target.value = "";
                    }
                }}
                autoFocus
            />

            {selectedOrderNum && (
                <OrderDetailModal orderNumber={selectedOrderNum} onClose={() => setSelectedOrderNum(null)} />
            )}

            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Scan className="text-primary" /> Multi-Point Scan Log
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 border border-green-500/20 bg-green-500/5 px-2 py-0.5 rounded uppercase">
                            <Usb size={12} /> Scanner Active
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                            <MapPin size={12} className="text-primary" /> 
                            GPS: {location.lat ? `${location.lat}, ${location.lng}` : "Locating..."}
                        </div>
                    </div>
                </div>

                <Button 
                    onClick={toggleCameraScanner} 
                    className={cn("h-11 px-8 rounded-xl font-bold transition-all", 
                    isScanning ? "bg-red-600 hover:bg-red-700 text-white" : "bg-primary hover:bg-primary/90 text-black")}
                >
                    {isScanning ? <StopCircle size={18} className="mr-2" /> : <Maximize size={18} className="mr-2" />}
                    {isScanning ? "Stop Camera" : "Mobile Camera Scan"}
                </Button>
            </div>

            {isScanning && (
                <div id="reader" className="w-full max-w-md mx-auto rounded-2xl overflow-hidden border-2 border-primary shadow-2xl mb-6 bg-black" />
            )}

            <Card className="bg-[#121212] border-white/10 shadow-2xl overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    {/* FILTERS */}
                    <div className="p-5 bg-white/5 border-b border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Scan Date</label>
                            <input
                                type="date"
                                className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
                                value={filters.date}
                                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value, page: 1 }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Global Status</label>
                            <select
                                className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary cursor-pointer"
                                value={filters.status}
                                onChange={handleStatusChange}
                            >
                                <option value="Picked">Picked</option>
                                <option value="Warehouse">Warehouse</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Target Location</label>
                            <select
                                className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-primary"
                                value={filters.location_id}
                                onChange={(e) => setFilters(prev => ({ ...prev, location_id: e.target.value, page: 1 }))}
                            >
                                <option value="">All {filters.status} Points</option>
                                {addresses.map((addr) => (
                                    <option key={addr.id} value={addr.id}>
                                        {addr.franchise_name || addr.nickname || addr.name} ({addr.city})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button 
                            onClick={loadScannedOrders} 
                            className="bg-white/5 hover:bg-white/10 text-white text-xs h-10 border border-white/10 rounded-xl"
                        >
                            <RotateCcw size={14} className="mr-2" /> Refresh
                        </Button>
                    </div>

                    {/* TABLE */}
                    <div className="overflow-x-auto relative min-h-[400px]">
                        {loading && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                <Loader2 className="animate-spin text-primary" size={40} />
                            </div>
                        )}
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-gray-500 text-[10px] font-bold uppercase border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4">Order Details</th>
                                    <th className="px-6 py-4">Package Info</th>
                                    <th className="px-6 py-4">Scan Point</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-white/[0.02] transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                                                    {order.order_number}
                                                </div>
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">
                                                    {order.consignee?.name} • {order.consignee?.city}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-300">
                                                        <span className="flex items-center gap-1"><Scale size={12} className="text-primary"/> {order.total_weight_kg}kg</span>
                                                        <span className="flex items-center gap-1"><Box size={12} className="text-primary"/> {order.total_boxes} Pkts</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 flex items-center gap-1 font-bold">
                                                        <IndianRupee size={10} /> {order.order_value} ({order.payment_method})
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] font-bold text-primary uppercase mb-1">
                                                    {/* Handled Dispatched JSON Specifically */}
                                                    {order.status} @ {order.status === "Dispatched" ? (order.franchise_name || "Franchise Hub") : (order.pickup?.nickname || "Station")}
                                                </div>
                                                <div className="text-xs font-mono font-bold text-gray-400">
                                                    {new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => setSelectedOrderNum(order.order_number)}
                                                        className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={async () => {
                                                            if (window.confirm("Revert this scan record?")) {
                                                                await deleteScannedOrderApi(order.id);
                                                                toast.success("Scan record reverted");
                                                                loadScannedOrders();
                                                            }
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
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
                                            <PackageSearch size={48} className="mx-auto opacity-10 mb-4" />
                                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest">No scans recorded for this selection</p>
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