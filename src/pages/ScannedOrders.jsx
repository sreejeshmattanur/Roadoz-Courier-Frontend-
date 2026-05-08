import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
    Download, RotateCcw, Loader2, Maximize,
    StopCircle, CheckCircle2, MapPin, PackageSearch, Scan, CreditCard, Layers
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";
import {
    fetchTodayScannedOrdersApi,
    getOrderPincodeApi
} from "../services/apiCalls";
import Pagination from "../components/ui/Pagination";
import { cn } from "../lib/utils";

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
    const scanCooldownRef = useRef({}); 

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
                    setLocation({ 
                        lat: Number(position.coords.latitude), 
                        lng: Number(position.coords.longitude) 
                    });
                },
                (error) => {
                    console.error("GPS Error:", error.message);
                    toast.error("GPS required for scanning accuracy");
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
            toast.error("Failed to load today's scans");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadScannedOrders();
    }, [loadScannedOrders]);

    // 3. USB Scanner Auto-focus Logic
    useEffect(() => {
        const focusInput = () => {
            if (!isScanning && inputRef.current) inputRef.current.focus();
        };
        focusInput();
        window.addEventListener("click", focusInput);
        return () => window.removeEventListener("click", focusInput);
    }, [isScanning]);

    // 4. Scan Success Logic
    const handleScanSuccess = async (decodedText) => {
        if (!decodedText || scanLoading) return;

        let orderNumber = String(decodedText).replace(/["\n\r\t\s+]/g, "").trim();

        const now = Date.now();
        if (scanCooldownRef.current[orderNumber] && now - scanCooldownRef.current[orderNumber] < 3000) return;
        scanCooldownRef.current[orderNumber] = now;

        if (!location.lat || !location.lng) {
            toast.error("GPS Position Not Found. Retrying...");
            getGeoLocation();
            return;
        }

        setScanLoading(true);
        const toastId = toast.loading(`Scanning ${orderNumber}...`);

        try {
            const res = await getOrderPincodeApi(orderNumber, location.lat, location.lng);
            try { new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg").play(); } catch (e) {}
            if (navigator.vibrate) navigator.vibrate(200);

            toast.success(res?.message || `Order ${orderNumber} Processed`, { id: toastId });
            loadScannedOrders();
        } catch (error) {
            const errorMsg = error?.response?.data?.message || "Scan failed";
            toast.error(errorMsg, { id: toastId });
        } finally {
            setScanLoading(false);
            if (inputRef.current) {
                inputRef.current.value = "";
                inputRef.current.focus();
            }
        }
    };

    // 5. Camera Management
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
                if (devices?.length > 0) {
                    const backCam = devices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"));
                    await html5QrCode.start(
                        backCam ? backCam.id : devices[0].id,
                        { fps: 20, qrbox: { width: 250, height: 150 } },
                        (text) => handleScanSuccess(text)
                    );
                }
            } catch (err) {
                toast.error("Camera Error");
                setIsScanning(false);
            }
        }, 300);
    };

    const handleExport = () => {
        if (orders.length === 0) return toast.error("No data");
        const headers = ["Order ID", "Order Number", "Total Boxes", "Consignee", "Status", "Payment", "Weight", "Scan Time"];
        const csv = [headers, ...orders.map(o => [
            o.id,
            o.order_number, 
            o.total_boxes,
            o.consignee?.name, 
            o.status, 
            o.payment_method, 
            o.total_weight_kg,
            new Date(o.updated_at).toLocaleTimeString()
        ])].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Logistics_Scan_Report_${filters.date}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6 p-4 lg:p-6 bg-dashboard-bg min-h-screen">
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
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-main flex items-center gap-2 uppercase tracking-tight">
                        <Scan className="text-primary" /> Speed Scan Log
                    </h1>
                    <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em]">
                        Handheld Scanner / Camera Mode
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-card-bg border border-border-subtle rounded-xl shadow-sm">
                        <MapPin size={14} className={location.lat ? "text-green-500 animate-pulse" : "text-red-500"} />
                        <span className="text-[11px] font-mono font-bold text-text-main">
                            {location.lat ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "GPS FIXING..."}
                        </span>
                    </div>
                    <Button
                        onClick={toggleScanner}
                        className={cn(
                            "font-bold h-11 px-6 rounded-xl shadow-lg transition-all",
                            isScanning ? "bg-red-500 hover:bg-red-600 text-white" : "bg-primary hover:bg-primary/90 text-black"
                        )}
                    >
                        {isScanning ? <><StopCircle size={18} className="mr-2" /> Stop</> : <><Maximize size={18} className="mr-2" /> Camera</>}
                    </Button>
                </div>
            </div>

            {isScanning && (
                <Card className="border-2 border-primary/50 border-dashed bg-black overflow-hidden relative max-w-xl mx-auto shadow-2xl">
                    <CardContent className="p-0">
                        <div id="reader" className="w-full min-h-[300px]"></div>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-card-bg border-border-subtle shadow-xl overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <div className="p-5 bg-dashboard-bg/30 border-b border-border-subtle grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-text-muted uppercase ml-1">Scan Date</label>
                            <input
                                type="date"
                                className="w-full bg-card-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-main focus:border-primary transition-all"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value, page: 1 })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-text-muted uppercase ml-1">Status Filter</label>
                            <select
                                className="w-full bg-card-bg border border-border-subtle rounded-xl px-3 py-2 text-xs text-text-main focus:border-primary transition-all"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            >
                                <option value="Picked">Picked (In-Scan)</option>
                                <option value="Dispatched">Dispatched (Out-Scan)</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                        <div className="flex gap-2 lg:col-span-2">
                            <Button onClick={loadScannedOrders} className="flex-1 bg-white/5 text-text-main text-xs font-bold h-10 border border-border-subtle rounded-xl">
                                <RotateCcw size={14} className="mr-2" /> Refresh
                            </Button>
                            <Button onClick={handleExport} className="flex-1 bg-primary/10 text-primary text-xs font-bold h-10 border border-primary/20 rounded-xl">
                                <Download size={14} className="mr-2" /> Export CSV
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative min-h-[400px]">
                        {loading && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-20">
                                <Loader2 className="animate-spin text-primary" size={40} />
                            </div>
                        )}
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-dashboard-bg/50 text-text-muted text-[10px] font-black uppercase tracking-widest border-b border-border-subtle">
                                    <th className="px-6 py-5">Order ID & Ref</th>
                                    <th className="px-6 py-5">Consignee</th>
                                    <th className="px-6 py-5 text-center">Total Boxes</th>
                                    <th className="px-6 py-5">Payment</th>
                                    <th className="px-6 py-5">Logistics</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5">Scan Time</th>
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
                                                <div className="text-[9px] text-text-muted font-mono mt-1 truncate max-w-[120px]" title={order.id}>
                                                    ID: {order.id.split('-')[0]}...
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-text-main uppercase">
                                                    {order.consignee?.name || "N/A"}
                                                </div>
                                                <div className="text-[9px] bg-primary/10 text-primary w-fit px-1 py-0.5 rounded mt-1 font-bold">
                                                    {order.order_type}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-dashboard-bg border border-border-subtle rounded-lg">
                                                    <Layers size={14} className="text-primary" />
                                                    <span className="text-sm font-black text-text-main">{order.total_boxes}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-text-main">
                                                    <CreditCard size={12} className="text-text-muted" />
                                                    {order.payment_method}
                                                </div>
                                                {order.payment_method === "COD" && (
                                                    <div className="text-[11px] text-green-500 font-black mt-0.5">
                                                        ₹{order.cod_amount?.toLocaleString()}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-black text-text-main">{order.total_weight_kg} KG</div>
                                                <div className="text-[9px] text-text-muted uppercase font-bold tracking-tighter">Gross Weight</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center w-fit gap-2",
                                                    order.status === 'Picked' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", order.status === 'Picked' ? 'bg-blue-500' : 'bg-green-500')} />
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-mono font-bold text-text-main">
                                                    {new Date(order.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                                <div className="text-[9px] text-text-muted uppercase font-bold">Updated At</div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-28 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <div className="p-6 bg-dashboard-bg rounded-full">
                                                    <PackageSearch size={64} className="text-text-muted" />
                                                </div>
                                                <p className="text-sm font-black text-text-main uppercase tracking-widest">No Scanned Orders Found</p>
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