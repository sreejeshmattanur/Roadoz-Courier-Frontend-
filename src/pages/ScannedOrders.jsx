import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    RotateCcw, Loader2, Maximize, StopCircle, MapPin, PackageSearch, Scan, 
    Usb, Box, Trash2, Eye, X, CheckCircle2, IndianRupee, Scale, LocateFixed, MapPinned
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import {
    fetchTodayScannedOrdersApi,
    getOrderPincodeApi,
    deleteScannedOrderApi,
    fetchDateWiseAddressesApi,
    fetchOrderDetailsApi,
    getLocationStatusApi,
    captureLocationApi,
    resetLocationApi
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
    const [orders, setOrders] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedOrderNum, setSelectedOrderNum] = useState(null);
    const [location, setLocation] = useState({ lat: null, lng: null });
    const [locationStatus, setLocationStatus] = useState(null);
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
    const processingRef = useRef(false); 
    const captureInProgress = useRef(false); 

    // API: Load Status
    const checkLocationStatus = useCallback(async () => {
        try {
            const res = await getLocationStatusApi();
            console.log("Location Status Received:", res);
            setLocationStatus(res);
        } catch (error) {
            console.error("Status Check Error", error);
        }
    }, []);

    // API: Load Orders
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

    // INITIAL LOAD
    useEffect(() => {
        loadScannedOrders();
        checkLocationStatus();
    }, [loadScannedOrders, checkLocationStatus]);

    // GEOLOCATION WATCHER
    useEffect(() => {
        if ("geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const newLat = pos.coords.latitude.toFixed(6);
                    const newLng = pos.coords.longitude.toFixed(6);
                    setLocation({ lat: newLat, lng: newLng });
                },
                (err) => toast.error("GPS Access Denied. Enable location to scan."),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // AUTO-CAPTURE LOGIC (This fix ensures the API is called correctly)
    useEffect(() => {
        const triggerCapture = async () => {
            // Check if coordinates exist and status specifically says location is needed
            if (locationStatus?.needs_location === true && location.lat && location.lng) {
                if (captureInProgress.current) return; // Prevent double calling
                
                captureInProgress.current = true;
                console.log("Triggering Capture API with:", { lat: location.lat, lng: location.lng });
                
                try {
                    const payload = {
                        latitude: parseFloat(location.lat),
                        longitude: parseFloat(location.lng)
                    };
                    
                    await captureLocationApi(payload);
                    toast.success("Branch location linked successfully!");
                    
                    // Refresh status to hide the "Linking" UI
                    await checkLocationStatus();
                } catch (err) {
                    console.error("Capture API Failure:", err);
                    toast.error("Failed to link location automatically");
                } finally {
                    captureInProgress.current = false;
                }
            }
        };

        triggerCapture();
    }, [location.lat, location.lng, locationStatus, checkLocationStatus]);

    // RESET LOCATION HANDLER
    const handleResetLocation = async () => {
        if (!locationStatus?.entity_type || !locationStatus?.entity_id) return;
        
        if (window.confirm("Do you want to clear stored location and re-capture current GPS?")) {
            try {
                await resetLocationApi(locationStatus.entity_type, locationStatus.entity_id);
                toast.success("Location cleared. Re-capturing...");
                checkLocationStatus(); 
            } catch (err) {
                toast.error("Reset failed");
            }
        }
    };

    // SCAN HANDLER
    const handleScanSuccess = async (decodedText) => {
        if (!decodedText || processingRef.current) return;
        const cleanCode = decodedText.trim().replace(/["\n\r\t\s+]/g, "").split("/").pop();
        
        if (!location.lat) {
            toast.error("Wait for GPS lock before scanning");
            return;
        }

        processingRef.current = true;
        const toastId = toast.loading(`Logging ${cleanCode}...`);
        
        try {
            await getOrderPincodeApi(cleanCode, location.lat, location.lng);
            toast.success(`Logged ${cleanCode}`, { id: toastId });
            loadScannedOrders();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Scan failed", { id: toastId });
        } finally {
            processingRef.current = false;
            if (hiddenInputRef.current) {
                hiddenInputRef.current.value = "";
                hiddenInputRef.current.focus();
            }
        }
    };

    // USB SCANNER FOCUS
    useEffect(() => {
        const interval = setInterval(() => {
            if (hiddenInputRef.current && document.activeElement.tagName === "BODY") {
                hiddenInputRef.current.focus();
            }
        }, 1000);
        return () => clearInterval(interval);
    }, []);

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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Scan className="text-primary" /> Scan Log
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 border border-green-500/20 bg-green-500/5 px-2 py-0.5 rounded uppercase">
                            <Usb size={12} /> USB Scanner Active
                        </div>
                        
                        {locationStatus?.needs_location ? (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-500 border border-yellow-500/20 bg-yellow-500/5 px-2 py-0.5 rounded uppercase">
                                <LocateFixed size={12} className="animate-pulse" /> Auto-Linking GPS...
                            </div>
                        ) : (
                            <button 
                                onClick={handleResetLocation}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 border border-blue-400/20 bg-blue-400/5 px-2 py-0.5 rounded uppercase hover:bg-blue-400/10"
                            >
                                <MapPinned size={12} /> Point Set (Reset)
                            </button>
                        )}

                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
                            <MapPin size={12} className="text-primary" /> 
                            GPS: {location.lat ? `${location.lat}, ${location.lng}` : "Locating..."}
                        </div>
                    </div>
                </div>

                <Button 
                    onClick={toggleCameraScanner} 
                    className={cn("h-11 px-8 rounded-xl font-bold", 
                    isScanning ? "bg-red-600 text-white" : "bg-primary text-black")}
                >
                    {isScanning ? <StopCircle size={18} className="mr-2" /> : <Maximize size={18} className="mr-2" />}
                    {isScanning ? "Stop Camera" : "Mobile Scan"}
                </Button>
            </div>

            {isScanning && (
                <div id="reader" className="w-full max-w-md mx-auto rounded-2xl overflow-hidden border-2 border-primary shadow-2xl mb-6 bg-black" />
            )}

            <Card className="bg-[#121212] border-white/10 shadow-2xl rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-5 bg-white/5 border-b border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Scan Date</label>
                            <input
                                type="date"
                                className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                value={filters.date}
                                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value, page: 1 }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Global Status</label>
                            <select
                                className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                value={filters.status}
                                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
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
                                className="w-full bg-[#18181b] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                                value={filters.location_id}
                                onChange={(e) => setFilters(prev => ({ ...prev, location_id: e.target.value, page: 1 }))}
                            >
                                <option value="">All Points</option>
                                {addresses.map((addr) => (
                                    <option key={addr.id} value={addr.id}>
                                        {addr.nickname || addr.name} ({addr.city})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button 
                            onClick={loadScannedOrders} 
                            className="bg-white/5 text-white text-xs h-10 border border-white/10"
                        >
                            <RotateCcw size={14} className="mr-2" /> Refresh
                        </Button>
                    </div>

                    <div className="overflow-x-auto relative min-h-[300px]">
                        {loading && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                                <Loader2 className="animate-spin text-primary" size={40} />
                            </div>
                        )}
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-gray-500 text-[10px] font-bold uppercase border-b border-white/10">
                                <tr>
                                    <th className="px-6 py-4">Order</th>
                                    <th className="px-6 py-4">Info</th>
                                    <th className="px-6 py-4">Scan Point</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-white/[0.02]">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-white">{order.order_number}</div>
                                                <div className="text-[10px] text-gray-500 uppercase">{order.consignee?.city}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[11px] text-gray-300 font-bold">{order.total_weight_kg}kg • {order.total_boxes} Pkts</div>
                                                <div className="text-[10px] text-gray-500">₹{order.order_value}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] font-bold text-primary uppercase">{order.status}</div>
                                                <div className="text-xs text-gray-400">
                                                    {new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => setSelectedOrderNum(order.order_number)} className="p-2 text-gray-400 hover:text-primary"><Eye size={18} /></button>
                                                    <button onClick={async () => {
                                                        if (window.confirm("Revert?")) {
                                                            await deleteScannedOrderApi(order.id);
                                                            loadScannedOrders();
                                                        }
                                                    }} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-gray-600 uppercase text-xs font-bold">No scans found</td>
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