import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Download, RotateCcw, Loader2, Maximize,
    StopCircle, CheckCircle2, MapPin, PackageSearch, Scan
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import {
    fetchTodayScannedOrdersApi,
    getOrderPincodeApi
} from "../services/apiCalls";
import Pagination from "../components/ui/Pagination";

export default function ScannedOrders() {
    // Data States
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    
    // UI States
    const [isScanning, setIsScanning] = useState(false);
    const [location, setLocation] = useState({ lat: null, lng: null });
    const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1 });

    // Refs
    const scannerRef = useRef(null);
    const inputRef = useRef(null);
    const scanCooldownRef = useRef({}); // Prevents duplicate scans of same code in short window

    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        status: "Picked",
        page: 1,
        limit: 10
    });

    // 1. Geolocation Logic
    const getGeoLocation = useCallback(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = { 
                        lat: Number(position.coords.latitude), 
                        lng: Number(position.coords.longitude) 
                    };
                    setLocation(coords);
                },
                (error) => {
                    console.error("GPS Error:", error.message);
                    toast.error("Please enable GPS for accurate tracking");
                },
                { enableHighAccuracy: true }
            );
        }
    }, []);

    useEffect(() => {
        getGeoLocation();
    }, [getGeoLocation]);

    // 2. Load Table Data
    const loadScannedOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchTodayScannedOrdersApi({
                date: filters.date,
                status: filters.status,
                page: filters.page,
                limit: filters.limit
            });
            setOrders(res.orders || []);
            setPagination(res.pagination || { page: 1, total_pages: 1 });
        } catch (error) {
            toast.error("Failed to load records");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadScannedOrders();
    }, [loadScannedOrders]);

    // 3. Auto-focus for Handheld USB Scanners
    useEffect(() => {
        const focusInput = () => {
            if (!isScanning && inputRef.current) {
                inputRef.current.focus();
            }
        };
        focusInput();
        window.addEventListener("click", focusInput);
        return () => window.removeEventListener("click", focusInput);
    }, [isScanning]);

    // 4. Unified Scan Process Logic
    const handleScanSuccess = async (decodedText) => {
        if (!decodedText || scanLoading) return;

        // Clean Barcode Logic
        let orderNumber = decodedText;

        // Extract ID if URL is provided
        if (typeof orderNumber === "string" && orderNumber.includes("/")) {
            const parts = orderNumber.split("/");
            orderNumber = parts[parts.length - 1];
        }

        // Handle JSON cases
        try {
            const parsed = JSON.parse(orderNumber);
            if (parsed?.order_number) orderNumber = parsed.order_number;
        } catch (e) {}

        // Remove whitespace and quotes
        orderNumber = String(orderNumber).replace(/["\n\r\t\s+]/g, "").trim();

        if (!orderNumber) {
            toast.error("Invalid QR Code");
            return;
        }

        // Duplicate Check (3 second cooldown)
        const now = Date.now();
        if (scanCooldownRef.current[orderNumber] && now - scanCooldownRef.current[orderNumber] < 3000) {
            return;
        }
        scanCooldownRef.current[orderNumber] = now;

        // GPS Check
        if (!location.lat || !location.lng) {
            toast.error("Waiting for GPS location...");
            getGeoLocation();
            return;
        }

        setScanLoading(true);
        const toastId = toast.loading(`Processing ${orderNumber}...`);

        try {
            // API CALL: POST /orders/get-pincode/${orderNumber} with {lat, lng} body
            const res = await getOrderPincodeApi(
                orderNumber,
                location.lat,
                location.lng
            );

            // Audio Feedback
            try {
                new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg").play();
            } catch (e) {}
            if (navigator.vibrate) navigator.vibrate(200);

            toast.success(res?.message || `Order ${orderNumber} scanned`, { id: toastId });

            // Refresh List
            await loadScannedOrders();

        } catch (error) {
            const errorMsg = error?.response?.data?.message || error?.response?.data?.detail || "Scan failed";
            toast.error(errorMsg, { id: toastId });
        } finally {
            setScanLoading(false);
            if (inputRef.current) {
                inputRef.current.value = "";
                inputRef.current.focus();
            }
        }
    };

    // 5. Camera Toggle Logic
    const toggleScanner = async () => {
        if (isScanning) {
            if (scannerRef.current) {
                await scannerRef.current.stop().catch(() => {});
                scannerRef.current = null;
            }
            setIsScanning(false);
            return;
        }

        setIsScanning(true);
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;
                const devices = await Html5Qrcode.getCameras();
                
                if (devices && devices.length > 0) {
                    const backCam = devices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"));
                    await html5QrCode.start(
                        backCam ? backCam.id : devices[0].id,
                        { fps: 15, qrbox: { width: 250, height: 150 }, aspectRatio: 1.777 },
                        (text) => handleScanSuccess(text)
                    );
                }
            } catch (err) {
                toast.error("Camera failed: " + err.message);
                setIsScanning(false);
            }
        }, 300);
    };

    const handleExport = () => {
        if (orders.length === 0) return toast.error("No data to export");
        const headers = ["Order Number", "Status", "Consignee", "Date"];
        const csv = [headers, ...orders.map(o => [o.order_number, o.status, o.consignee?.name, o.updated_at])].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${filters.date}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6 p-4 lg:p-6 bg-dashboard-bg min-h-screen">
            {/* HIDDEN INPUT FOR USB SCANNERS */}
            <input
                ref={inputRef}
                type="text"
                className="opacity-0 absolute pointer-events-none"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleScanSuccess(e.target.value);
                        e.target.value = ""; 
                    }
                }}
                autoFocus
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
                        <Scan className="text-primary" /> Speed Scanner
                    </h1>
                    <p className="text-xs text-text-muted mt-1 uppercase tracking-wider">
                        Camera or USB Handheld Mode
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-card-bg border border-border-subtle rounded-lg text-[10px] font-bold">
                        <MapPin size={14} className={location.lat ? "text-green-500" : "text-red-500"} />
                        <span className="text-text-main font-mono">
                            {location.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "WAITING GPS..."}
                        </span>
                    </div>
                    <Button
                        onClick={toggleScanner}
                        className={`${isScanning ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"} text-black font-bold h-11 px-6 rounded-xl shadow-lg flex items-center gap-2`}
                    >
                        {isScanning ? <><StopCircle size={20} /> Stop</> : <><Maximize size={20} /> Start Camera</>}
                    </Button>
                </div>
            </div>

            {isScanning && (
                <Card className="border-2 border-primary border-dashed bg-black overflow-hidden relative max-w-2xl mx-auto">
                    <CardContent className="p-0">
                        <div id="reader" className="w-full min-h-[300px]"></div>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-card-bg border-border-subtle shadow-md overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-4 bg-dashboard-bg/50 border-b border-border-subtle grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase">Filter Date</label>
                            <input
                                type="date"
                                className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value, page: 1 })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase">Target Status</label>
                            <select
                                className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2 text-xs text-text-main"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            >
                                <option value="Picked">Picked (In-Scan)</option>
                                <option value="Dispatched">Dispatched (Out-Scan)</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={loadScannedOrders} className="flex-1 bg-white/5 text-text-main text-xs font-bold h-9 border border-border-subtle">
                                <RotateCcw size={14} className="mr-2" /> Refresh
                            </Button>
                            <Button onClick={handleExport} className="flex-1 bg-primary/10 text-primary text-xs font-bold h-9 border border-primary/20">
                                <Download size={14} className="mr-2" /> Export
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative min-h-[300px]">
                        {loading && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        )}
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-dashboard-bg/80 text-text-muted text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">
                                    <th className="px-6 py-4">Order Details</th>
                                    <th className="px-6 py-4">Consignee</th>
                                    <th className="px-6 py-4">Weight/Boxes</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-black text-text-main group-hover:text-primary">{order.order_number}</div>
                                                <div className="text-[10px] text-text-muted font-bold uppercase">{order.order_type}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-text-main">{order.consignee?.name || "N/A"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-black text-text-main">{order.total_weight_kg} KG</div>
                                                <div className="text-[10px] text-primary font-bold">{order.total_boxes} Box(es)</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center w-fit gap-1.5 ${order.status === 'Picked' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    <CheckCircle2 size={12} /> {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] text-text-muted font-mono">
                                                {new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-40">
                                                <PackageSearch size={48} className="text-text-muted" />
                                                <p className="text-sm font-bold text-text-main">No Scanned Items Today</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.total_pages}
                        onPageChange={(p) => setFilters({ ...filters, page: p })}
                    />
                </CardContent>
            </Card>
        </div>
    );
}