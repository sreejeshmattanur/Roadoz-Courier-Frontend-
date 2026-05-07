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
    scanOrderApi,
    fetchTodayScannedOrdersApi,
    getOrderPincodeApi
} from "../services/apiCalls";
import Pagination from "../components/ui/Pagination";

export default function ScannedOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [location, setLocation] = useState({ lat: null, lng: null });
    const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1 });

    const scannerRef = useRef(null);
    const inputRef = useRef(null);
    const lastScannedRef = useRef("");

    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        status: "Picked",
        page: 1,
        limit: 10
    });

    // 1. Geolocation Fetch with Logging
    const getGeoLocation = useCallback(() => {
        console.log("[DEBUG] Requesting Geolocation...");
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
                    console.log("[DEBUG] Geolocation Success:", coords);
                    setLocation(coords);
                },
                (error) => {
                    console.error("[DEBUG] Geolocation Error:", error.message);
                    toast.error("Please enable GPS for accurate tracking");
                },
                { enableHighAccuracy: true }
            );
        } else {
            console.error("[DEBUG] Geolocation is not supported by this browser.");
        }
    }, []);

    useEffect(() => {
        getGeoLocation();
    }, [getGeoLocation]);

    // 2. Auto-focus for USB Handheld Scanners
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // 3. Load Table Data with Logging
    const loadScannedOrders = useCallback(async () => {
        setLoading(true);
        console.log("[DEBUG] Fetching Orders with Filters:", filters);
        try {
            // According to your description, this is a POST with a body and query params
            const res = await fetchTodayScannedOrdersApi({
                date: filters.date,
                status: filters.status,
                page: filters.page,
                limit: filters.limit
            });
            console.log("[DEBUG] Fetch Orders Response:", res);
            setOrders(res.orders || []);
            setPagination(res.pagination || { page: 1, total_pages: 1 });
        } catch (error) {
            console.error("[DEBUG] Fetch Orders Error:", error);
            toast.error("Failed to load records");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadScannedOrders();
    }, [loadScannedOrders]);

    // 4. Unified Scan Process Logic (Camera & USB)
  const handleScanSuccess = async (decodedText) => {

    /*
    =========================================
    BASIC VALIDATION
    =========================================
    */

    if (!decodedText) return;

    if (scanLoading) return;

    /*
    =========================================
    CLEAN QR VALUE
    =========================================
    */

    let orderNumber = decodedText;

    console.log("RAW SCAN:", orderNumber);

    /*
    =========================================
    REMOVE URL PART
    =========================================
    */

    if (typeof orderNumber === "string" && orderNumber.includes("/")) {

        const parts = orderNumber.split("/");

        orderNumber = parts[parts.length - 1];
    }

    /*
    =========================================
    HANDLE JSON QR
    =========================================
    */

    try {

        const parsed = JSON.parse(orderNumber);

        if (parsed?.order_number) {
            orderNumber = parsed.order_number;
        }

    } catch (e) {
        // normal barcode
    }

    /*
    =========================================
    REMOVE EXTRA CHARACTERS
    =========================================
    */

    orderNumber = String(orderNumber)
        .replace(/\n/g, "")
        .replace(/\r/g, "")
        .replace(/\t/g, "")
        .replace(/"/g, "")
        .replace(/\s+/g, "")
        .trim();

    console.log("FINAL ORDER:", orderNumber);

    /*
    =========================================
    EMPTY CHECK
    =========================================
    */

    if (!orderNumber) {

        toast.error("Invalid QR Code");

        return;
    }

    /*
    =========================================
    DUPLICATE BLOCK
    =========================================
    */

    const now = Date.now();

    if (
        scanCooldownRef.current[orderNumber] &&
        now - scanCooldownRef.current[orderNumber] < 3000
    ) {
        console.log("Duplicate blocked");
        return;
    }

    scanCooldownRef.current[orderNumber] = now;

    /*
    =========================================
    GPS VALIDATION
    =========================================
    */

    if (
        location?.lat === null ||
        location?.lng === null ||
        location?.lat === undefined ||
        location?.lng === undefined
    ) {

        toast.error("Waiting for GPS location");

        getGeoLocation();

        return;
    }

    console.log("GPS:", {
        lat: location.lat,
        lng: location.lng
    });

    /*
    =========================================
    START LOADING
    =========================================
    */

    setScanLoading(true);

    const toastId = toast.loading(
        `Processing ${orderNumber}...`
    );

    try {

        /*
        =========================================
        API CALL
        =========================================
        */

        const cleanOrderNumber = orderNumber.trim();

        console.log("CALLING API WITH:", {
            orderNumber: cleanOrderNumber,
            lat: Number(location.lat),
            lng: Number(location.lng)
        });

        // IMPORTANT:
        // DON'T USE encodeURIComponent HERE
        // axios handles params correctly
        // encoding manually can cause network/API route issues

        const res = await getOrderPincodeApi(
            cleanOrderNumber,
            Number(location.lat),
            Number(location.lng)
        );

        console.log("API RESPONSE:", res);

        /*
        =========================================
        SUCCESS FEEDBACK
        =========================================
        */

        try {

            const audio = new Audio(
                "https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg"
            );

            await audio.play();

        } catch (e) {

            console.log("Audio Error:", e);
        }

        if (navigator.vibrate) {
            navigator.vibrate(200);
        }

        toast.success(
            res?.message ||
            `Order ${cleanOrderNumber} scanned`,
            {
                id: toastId
            }
        );

        /*
        =========================================
        REFRESH TABLE
        =========================================
        */

        await loadScannedOrders();

        /*
        =========================================
        STOP CAMERA AFTER SUCCESS
        =========================================
        */

        if (isScanning) {

            await stopCamera();
        }

    } catch (error) {

        console.log("SCAN ERROR:", error);

        console.log("FULL ERROR:", {
            message: error?.message,
            response: error?.response,
            data: error?.response?.data,
            status: error?.response?.status
        });

        /*
        =========================================
        NETWORK ERROR
        =========================================
        */

        if (error?.message === "Network Error") {

            toast.error(
                "Unable to connect to server. Check internet/API.",
                {
                    id: toastId
                }
            );

        } else {

            toast.error(
                error?.response?.data?.message ||
                error?.response?.data?.detail ||
                error?.message ||
                "Invalid Barcode",
                {
                    id: toastId
                }
            );
        }

    } finally {

        setScanLoading(false);

        /*
        =========================================
        REFOCUS USB SCANNER
        =========================================
        */

        if (inputRef.current) {

            inputRef.current.value = "";

            inputRef.current.focus();
        }
    }
};

    // 5. Camera Toggle Logic with heavy logging
    const toggleScanner = async () => {
        console.log("[DEBUG] Toggle Scanner Clicked. Current state:", isScanning);

        if (isScanning) {
            if (scannerRef.current) {
                console.log("[DEBUG] Stopping Camera Scanner...");
                await scannerRef.current.stop().catch((e) => console.error("[DEBUG] Stop Error:", e));
                scannerRef.current.clear();
                scannerRef.current = null;
            }
            setIsScanning(false);
            return;
        }

        setIsScanning(true);

        // Use timeout to ensure the DOM element "reader" is rendered before Html5Qrcode looks for it
        setTimeout(async () => {
            try {
                console.log("[DEBUG] Initializing Html5Qrcode...");
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                const devices = await Html5Qrcode.getCameras();
                console.log("[DEBUG] Available Cameras:", devices);

                if (!devices || devices.length === 0) {
                    throw new Error("No camera found on this device.");
                }

                // Prefer back camera
                let cameraId = devices[0].id;
                const backCam = devices.find(d => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"));
                if (backCam) {
                    cameraId = backCam.id;
                    console.log("[DEBUG] Selected Back Camera:", backCam.label);
                }

                await html5QrCode.start(
                    cameraId,
                    {
                        fps: 15,
                        qrbox: { width: 250, height: 150 },
                        aspectRatio: 1.777,
                    },
                    (decodedText) => {
                        console.log("[DEBUG] Camera Decode Success:", decodedText);
                        handleScanSuccess(decodedText);
                    },
                    (errorMessage) => {
                        // This fires for every frame that doesn't have a QR code. 
                        // Keep it empty to avoid log flooding.
                    }
                );
                console.log("[DEBUG] Camera Started Successfully");

            } catch (err) {
                console.error("[DEBUG] Camera Start Error:", err);
                toast.error("Camera failed: " + err.message);
                setIsScanning(false);
            }
        }, 500);
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                console.log("[DEBUG] Component Unmounting: Cleaning up scanner...");
                scannerRef.current.stop().catch(() => { });
            }
        };
    }, []);

    const handleExport = () => {
        if (orders.length === 0) return toast.error("No data to export");
        console.log("[DEBUG] Exporting CSV for", orders.length, "orders");
        const headers = ["Order Number", "Status", "Customer", "Date"];
        const csv = [headers, ...orders.map(o => [o.order_number, o.status, o.consignee?.name, o.updated_at])].map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Scanned_Report_${filters.date}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6 p-4 lg:p-6 bg-dashboard-bg min-h-screen">
            {/* HIDDEN INPUT FOR USB HANDHELD SCANNERS */}
            <input
                ref={inputRef}
                type="text"
                className="opacity-0 absolute pointer-events-none top-0 left-0"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        console.log("[DEBUG] USB Scanner Input:", e.target.value);
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
                        Capture Barcodes via Camera or USB Handheld
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-card-bg border border-border-subtle rounded-lg text-[10px] font-bold">
                        <MapPin size={14} className={location.lat ? "text-green-500" : "text-red-500"} />
                        <span className="text-text-main">
                            {location.lat ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "GPS WAITING..."}
                        </span>
                    </div>
                    <Button
                        onClick={toggleScanner}
                        className={`${isScanning ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90"} text-black font-bold h-11 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2`}
                    >
                        {isScanning ? <><StopCircle size={20} /> Stop Camera</> : <><Maximize size={20} /> Start Camera</>}
                    </Button>
                </div>
            </div>

            {/* Active Camera UI */}
            {isScanning && (
                <Card className="border-2 border-primary border-dashed bg-black overflow-hidden relative">
                    <CardContent className="p-0 flex flex-col items-center">
                        {/* THE ID "reader" IS CRITICAL FOR HTML5-QRCODE */}
                        <div id="reader" className="w-full min-h-[350px] bg-black"></div>
                        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
                            <span className="bg-primary/90 text-black px-4 py-1 rounded-full text-xs font-bold animate-pulse">
                                CAMERA SCANNER ACTIVE
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Listing and Filters */}
            <Card className="bg-card-bg border-border-subtle shadow-md overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-4 bg-dashboard-bg/50 border-b border-border-subtle grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Filter Date</label>
                            <input
                                type="date"
                                className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2.5 text-xs text-text-main focus:ring-2 focus:ring-primary outline-none"
                                value={filters.date}
                                onChange={(e) => setFilters({ ...filters, date: e.target.value, page: 1 })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Target Status</label>
                            <select
                                className="w-full bg-card-bg border border-border-subtle rounded-lg px-3 py-2.5 text-xs text-text-main focus:ring-2 focus:ring-primary outline-none appearance-none"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            >
                                <option value="Picked">Picked (In-Scan)</option>
                                <option value="Dispatched">Dispatched (Out-Scan)</option>
                                <option value="Delivered">Delivered</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={loadScannedOrders} className="flex-1 bg-white/5 hover:bg-white/10 text-text-main text-xs font-bold h-10 border border-border-subtle">
                                <RotateCcw size={14} className="mr-2" /> Refresh
                            </Button>
                            <Button onClick={handleExport} className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold h-10 border border-primary/20">
                                <Download size={14} className="mr-2" /> Export
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto relative min-h-[400px]">
                        {loading && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-20">
                                <Loader2 className="animate-spin text-primary" size={40} />
                            </div>
                        )}
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-dashboard-bg/80 text-text-muted text-[10px] font-black uppercase tracking-tighter border-b border-border-subtle">
                                    <th className="px-6 py-4">Order Details</th>
                                    <th className="px-6 py-4">Consignee</th>
                                    <th className="px-6 py-4">Box Info</th>
                                    <th className="px-6 py-4">Weight</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-primary/5 transition-all group">
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-black text-text-main group-hover:text-primary transition-colors">{order.order_number}</div>
                                                <div className="text-[10px] text-text-muted font-bold uppercase">{order.order_type} • {order.payment_method}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-text-main">{order.consignee?.name || "N/A"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1 max-w-[150px]">
                                                    {order.packages?.map((pkg, i) => (
                                                        <span key={i} className="text-[9px] bg-dashboard-bg border border-border-subtle px-1.5 py-0.5 rounded text-text-muted">
                                                            {pkg.length_cm}x{pkg.breadth_cm}x{pkg.height_cm}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-black text-text-main">{order.total_weight_kg} <span className="text-[10px] font-normal text-text-muted">KG</span></div>
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
                                        <td colSpan={6} className="px-6 py-32 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <PackageSearch size={64} className="text-text-muted" />
                                                <div className="space-y-1">
                                                    <p className="text-xl font-bold text-text-main">No Scanned Items</p>
                                                    <p className="text-xs uppercase tracking-widest">USB Scanner ready or use Start Camera</p>
                                                </div>
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