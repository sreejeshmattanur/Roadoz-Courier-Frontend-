import React, { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

import {
    Download,
    RotateCcw,
    Loader2,
    Maximize,
    StopCircle,
    CheckCircle2,
    MapPin,
    PackageSearch,
    Scan,
    RefreshCw
} from "lucide-react";

import { toast } from "react-hot-toast";
import { Html5Qrcode } from "html5-qrcode";

import {
    fetchTodayScannedOrdersApi,
    getOrderPincodeApi
} from "../services/apiCalls";

import Pagination from "../components/ui/Pagination";

export default function ScannedOrders() {

    /* =====================================================
       STATES
    ===================================================== */
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanLoading, setScanLoading] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    const [location, setLocation] = useState({
        lat: null,
        lng: null,
        loading: false
    });

    const [pagination, setPagination] = useState({
        page: 1,
        total: 0,
        total_pages: 1
    });

    const [filters, setFilters] = useState({
        date: new Date().toISOString().split("T")[0],
        status: "Picked",
        page: 1,
        limit: 10
    });

    /* =====================================================
       REFS
    ===================================================== */
    const scannerRef = useRef(null);
    const inputRef = useRef(null);
    const scanCooldownRef = useRef({});

    /* =====================================================
       ENHANCED GPS LOCATION (Mobile Optimized)
    ===================================================== */
    const getGeoLocation = useCallback((isManual = false) => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setLocation(prev => ({ ...prev, loading: true }));
        if(isManual) toast.loading("Fetching GPS...", { id: "gps-fetch" });

        const options = {
            enableHighAccuracy: true, // Try to get exact GPS
            timeout: 8000,            // Wait 8 seconds
            maximumAge: 0             // Do not use cached location
        };

        const success = (position) => {
            const coords = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                loading: false
            };
            console.log("GPS CAPTURED:", coords);
            setLocation(coords);
            if(isManual) toast.success("Location Fixed", { id: "gps-fetch" });
        };

        const error = (err) => {
            console.error("GPS Error Code:", err.code, err.message);
            
            // FALLBACK: If High Accuracy fails (common indoors), try low accuracy
            if (err.code === 3 || err.code === 2) { 
                console.log("Retrying with lower accuracy...");
                navigator.geolocation.getCurrentPosition(success, (err2) => {
                    setLocation(prev => ({ ...prev, loading: false }));
                    toast.error("GPS Signal Weak. Move near a window.", { id: "gps-fetch" });
                }, { enableHighAccuracy: false, timeout: 5000 });
            } else {
                setLocation(prev => ({ ...prev, loading: false }));
                toast.error("Please enable Location in your Phone Settings", { id: "gps-fetch" });
            }
        };

        navigator.geolocation.getCurrentPosition(success, error, options);
    }, []);

    useEffect(() => {
        getGeoLocation();
    }, [getGeoLocation]);

    /* =====================================================
       USB SCANNER AUTO-FOCUS
    ===================================================== */
    useEffect(() => {
        const focusInput = () => { inputRef.current?.focus(); };
        focusInput();
        window.addEventListener("click", focusInput);
        return () => window.removeEventListener("click", focusInput);
    }, []);

    /* =====================================================
       LOAD DATA
    ===================================================== */
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
            toast.error("Failed to load scanned orders");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadScannedOrders();
    }, [loadScannedOrders]);

    /* =====================================================
       SCAN LOGIC
    ===================================================== */
    const processScannedValue = (decodedText) => {
        let orderNumber = decodedText.trim();
        if (orderNumber.includes("/")) {
            const parts = orderNumber.split("/");
            orderNumber = parts[parts.length - 1];
        }
        try {
            const parsed = JSON.parse(orderNumber);
            if (parsed.order_number) orderNumber = parsed.order_number;
        } catch (e) {}
        return orderNumber.replace(/\n/g, "").replace(/\r/g, "").trim();
    };

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

    if (orderNumber.includes("/")) {

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

        console.log("CALLING API WITH:", {
            orderNumber,
            lat: Number(location.lat),
            lng: Number(location.lng)
        });

        const res = await getOrderPincodeApi(
            encodeURIComponent(orderNumber), // important
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
            `Order ${orderNumber} scanned`,
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

        console.log(
            "BACKEND RESPONSE:",
            error?.response?.data
        );

        toast.error(
            error?.response?.data?.message ||
            error?.response?.data?.detail ||
            error?.message ||
            "Invalid Barcode",
            {
                id: toastId
            }
        );

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

    /* =====================================================
       CAMERA CONTROLS
    ===================================================== */
    const stopCamera = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                await scannerRef.current.clear();
                scannerRef.current = null;
            } catch (e) { console.log(e); }
        }
        setIsScanning(false);
    };

    const toggleScanner = async () => {
        if (isScanning) {
            await stopCamera();
            return;
        }

        // IMPORTANT for Mobile: Request GPS right before starting camera 
        // ensures permission is fresh
        getGeoLocation();

        setIsScanning(true);
        setTimeout(async () => {
            try {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 25, qrbox: { width: 280, height: 180 }, aspectRatio: 1.777 },
                    (text) => handleScanSuccess(text),
                    () => {}
                );
            } catch (err) {
                toast.error("Camera access denied");
                setIsScanning(false);
            }
        }, 300);
    };

    return (
        <div className="space-y-6 p-4 lg:p-6 bg-dashboard-bg min-h-screen">
            <input
                ref={inputRef}
                type="text"
                autoFocus
                className="opacity-0 absolute pointer-events-none"
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleScanSuccess(e.target.value);
                        e.target.value = "";
                    }
                }}
            />

            {/* HEADER */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <Scan className="text-primary" /> Speed Scanner
                    </h1>
                    
                    {/* MOBILE GPS INDICATOR / REFRESH BUTTON */}
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => getGeoLocation(true)}
                        className={`flex items-center gap-2 border px-3 py-1 rounded-full text-[10px] ${location.lat ? "text-green-500 border-green-500/30" : "text-red-500 border-red-500/30"}`}
                    >
                        <MapPin size={12} />
                        {location.loading ? "Locating..." : location.lat ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}` : "GPS OFF"}
                        <RefreshCw size={10} className={location.loading ? "animate-spin" : ""} />
                    </Button>
                </div>

                <Button
                    onClick={toggleScanner}
                    className={`w-full py-6 text-lg font-bold shadow-xl ${isScanning ? "bg-red-500 hover:bg-red-600" : "bg-primary hover:bg-primary/90 text-black"}`}
                >
                    {isScanning ? <><StopCircle className="mr-2" /> Stop Camera</> : <><Maximize className="mr-2" /> Start Camera</>}
                </Button>
            </div>

            {/* CAMERA VIEW */}
            {isScanning && (
                <Card className="border-2 border-primary border-dashed bg-black overflow-hidden ring-4 ring-primary/10">
                    <CardContent className="p-0">
                        <div id="reader" className="w-full min-h-[300px]" />
                    </CardContent>
                </Card>
            )}

            {/* TABLE SECTION */}
            <Card className="overflow-hidden border-none shadow-lg">
                <CardContent className="p-0">
                    {/* MOBILE FILTERS */}
                    <div className="p-4 border-b grid grid-cols-2 gap-2 bg-card-bg">
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => setFilters({ ...filters, date: e.target.value, page: 1 })}
                            className="border rounded-lg px-2 py-2 text-xs bg-dashboard-bg"
                        />
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                            className="border rounded-lg px-2 py-2 text-xs bg-dashboard-bg"
                        >
                            <option value="Picked">Picked</option>
                            <option value="Dispatched">Dispatched</option>
                            <option value="Delivered">Delivered</option>
                        </select>
                    </div>

                    <div className="overflow-x-auto relative min-h-[300px]">
                        {(loading || scanLoading) && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-20 text-white">
                                <Loader2 className="animate-spin text-primary mb-2" size={40} />
                                <p className="text-xs font-bold uppercase tracking-widest">Processing Scan...</p>
                            </div>
                        )}
                        
                        <table className="w-full border-collapse">
                            <thead className="bg-dashboard-bg/50">
                                <tr className="text-[10px] uppercase text-text-muted border-b">
                                    <th className="px-4 py-3 text-left">Order & Customer</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="border-b active:bg-primary/10">
                                            <td className="px-4 py-4">
                                                <div className="font-bold text-sm">{order.order_number}</div>
                                                <div className="text-[10px] text-text-muted truncate max-w-[150px]">
                                                    {order.consignee?.name || "No Customer"}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className={`px-2 py-1 rounded text-[9px] font-black w-fit uppercase ${order.status === 'Picked' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    {order.status}
                                                </div>
                                                <div className="text-[9px] text-text-muted mt-1 italic">
                                                    {new Date(order.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="text-center py-20 opacity-40">
                                            <PackageSearch size={48} className="mx-auto mb-2" />
                                            <p className="text-xs font-bold">No items found</p>
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

            <style>
                {`
                    #reader video {
                        width: 100% !important;
                        height: auto !important;
                        object-fit: cover;
                    }
                    #reader__scan_region {
                        background: black !important;
                    }
                `}
            </style>
        </div>
    );
}