import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { Plus, Trash2, Loader2, RotateCcw, Calculator, Weight, IndianRupee } from "lucide-react";
import { calculateRates, clearRateResult } from "../redux/rateSlice";

export function RateCalculator() {
    const dispatch = useDispatch();
    const { result, loading, error } = useSelector((state) => state.rate || {});

    // --- Initial States for Reset ---
    const initialHeader = {
        pickup_pincode: "",
        delivery_pincode: "",
        declared_value: "",
        shipment_type: "FORWARD",
        risk_type: "OWNER_RISK"
    };
    const initialB2C = { length: "", breadth: "", height: "", physicalWeight: "" };
    const initialB2B = [{ id: Date.now(), count: 1, length: "", breadth: "", height: "", physicalWeight: "" }];

    // --- Form States ---
    const [activeTab, setActiveTab] = useState("B2C");
    const [selectedMode, setSelectedMode] = useState("Cash On Delivery");
    const [headerData, setHeaderData] = useState(initialHeader);
    const [b2cPackage, setB2cPackage] = useState(initialB2C);
    const [boxes, setBoxes] = useState(initialB2B);

    // --- Actions ---
    const handleDiscard = () => {
        setHeaderData(initialHeader);
        setB2cPackage(initialB2C);
        setBoxes([{ id: Date.now(), count: 1, length: "", breadth: "", height: "", physicalWeight: "" }]);
        setSelectedMode("Cash On Delivery");
        dispatch(clearRateResult());
    };

    const addBox = () => {
        setBoxes([...boxes, { id: Date.now(), count: 1, length: "", breadth: "", height: "", physicalWeight: "" }]);
    };

    const removeBox = (id) => {
        if (boxes.length > 1) setBoxes(boxes.filter(box => box.id !== id));
    };

    const updateBox = (id, field, value) => {
        setBoxes(boxes.map(box => box.id === id ? { ...box, [field]: value } : box));
    };

    const handleCalculate = () => {
        const modeMap = { "Cash On Delivery": "COD", "Prepaid": "PREPAID", "To Pay": "TOPAY" };

        const payload = {
            calculator_type: activeTab,
            pickup_pincode: headerData.pickup_pincode,
            delivery_pincode: headerData.delivery_pincode,
            shipment_type: headerData.shipment_type,
            payment_mode: modeMap[selectedMode],
            risk_type: headerData.risk_type,
            declared_value: Number(headerData.declared_value),
            packages: activeTab === "B2C" 
                ? [{
                    count: 1,
                    length: Number(b2cPackage.length),
                    breadth: Number(b2cPackage.breadth),
                    height: Number(b2cPackage.height),
                    physical_weight: Number(b2cPackage.physicalWeight)
                }]
                : boxes.map(box => ({
                    count: Number(box.count),
                    length: Number(box.length),
                    breadth: Number(box.breadth),
                    height: Number(box.height),
                    physical_weight: Number(box.physicalWeight)
                }))
        };
        dispatch(calculateRates(payload));
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-text-main">Rate Calculator</h1>
                    <p className="text-sm text-primary mt-1">
                        <Link to="/" className="hover:underline cursor-pointer">Dashboard</Link>
                        <span className="text-text-muted mx-1">&gt;&gt;</span> Rate Calculator
                    </p>
                </div>
                <Button 
                    onClick={handleDiscard}
                    variant="outline" 
                    className="border-red-500/50 text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                >
                    <RotateCcw size={16} /> Discard & Reset
                </Button>
            </div>

            <Card className="bg-card-bg border-border-subtle shadow-sm overflow-hidden">
                <CardContent className="p-6">
                    {/* Tab Selection */}
                    <div className="flex bg-dashboard-bg/50 rounded-md p-1 mb-6 border border-border-subtle">
                        {["B2C", "B2B"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setActiveTab(tab); dispatch(clearRateResult()); }}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                    activeTab === tab ? "bg-card-bg text-primary shadow-sm" : "text-text-muted hover:text-text-main"
                                )}
                            >
                                {tab} Rate Calculator
                            </button>
                        ))}
                    </div>

                    {/* Common Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-main">Pickup Pincode:</label>
                            <input 
                                type="text" placeholder="Pickup Pincode" 
                                className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                value={headerData.pickup_pincode}
                                onChange={(e) => setHeaderData({...headerData, pickup_pincode: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-main">Delivery Pincode:</label>
                            <input 
                                type="text" placeholder="Delivery Pincode" 
                                className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-1 focus:ring-primary"
                                value={headerData.delivery_pincode}
                                onChange={(e) => setHeaderData({...headerData, delivery_pincode: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-main">Declared Value (INR):</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">₹</span>
                                <input 
                                    type="number" placeholder="Amount" 
                                    className="w-full bg-dashboard-bg border border-border-subtle rounded-md py-2 pl-7 pr-3 text-sm text-text-main"
                                    value={headerData.declared_value}
                                    onChange={(e) => setHeaderData({...headerData, declared_value: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-text-main">Shipment Type:</label>
                            <select 
                                className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main appearance-none"
                                value={headerData.shipment_type}
                                onChange={(e) => setHeaderData({...headerData, shipment_type: e.target.value})}
                            >
                                <option value="FORWARD">Forward</option>
                                <option value="REVERSE">Reverse</option>
                            </select>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="mt-8">
                        <h3 className="text-lg font-semibold text-text-main mb-4">Mode:</h3>
                        <div className="flex flex-wrap items-center gap-8">
                            {["Cash On Delivery", "Prepaid", "To Pay"].map((mode) => (
                                <label key={mode} className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative flex items-center justify-center">
                                        <input
                                            type="radio" name="mode" value={mode}
                                            checked={selectedMode === mode}
                                            onChange={(e) => setSelectedMode(e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className={cn(
                                            "w-5 h-5 rounded-full border-2 transition-all duration-200",
                                            selectedMode === mode ? "border-primary bg-primary/10" : "border-border-subtle bg-dashboard-bg group-hover:border-primary/50"
                                        )} />
                                        {selectedMode === mode && <div className="absolute w-2.5 h-2.5 rounded-full bg-primary animate-in fade-in zoom-in duration-200" />}
                                    </div>
                                    <span className={cn("text-sm transition-colors", selectedMode === mode ? "text-text-main font-semibold" : "text-text-muted group-hover:text-text-main")}>
                                        {mode}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Conditional Package Forms */}
                    {activeTab === "B2C" ? (
                        <div className="mt-8 space-y-6">
                             <div className="flex items-center gap-3 w-fit">
                                <div className="w-5 h-5 border-2 border-primary rounded bg-primary flex items-center justify-center">
                                     <div className="w-2.5 h-2.5 bg-black rounded-sm" />
                                </div>
                                <label className="text-sm font-medium text-text-main">Dimension:</label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
                                <input type="number" placeholder="Length" className="bg-dashboard-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main" value={b2cPackage.length} onChange={(e) => setB2cPackage({...b2cPackage, length: e.target.value})} />
                                <input type="number" placeholder="Breadth" className="bg-dashboard-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main" value={b2cPackage.breadth} onChange={(e) => setB2cPackage({...b2cPackage, breadth: e.target.value})} />
                                <input type="number" placeholder="Height" className="bg-dashboard-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main" value={b2cPackage.height} onChange={(e) => setB2cPackage({...b2cPackage, height: e.target.value})} />
                                <div className="bg-dashboard-bg/50 border border-border-subtle rounded-md px-3 py-2 text-sm text-text-muted flex items-center justify-center h-[38px]">Cm</div>
                                <div className="flex">
                                    <input type="number" placeholder="Weight" className="w-full bg-dashboard-bg border border-border-subtle rounded-l-md px-3 py-2 text-sm text-text-main" value={b2cPackage.physicalWeight} onChange={(e) => setB2cPackage({...b2cPackage, physicalWeight: e.target.value})} />
                                    <span className="bg-dashboard-bg/50 border border-l-0 border-border-subtle rounded-r-md px-3 py-2 text-sm text-text-muted">Kg</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-text-main">No Of Boxes *</label>
                                    <input type="number" readOnly value={boxes.length} className="w-full bg-dashboard-bg/50 border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-text-main">ROV</label>
                                    <select 
                                        className="w-full bg-dashboard-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main"
                                        value={headerData.risk_type}
                                        onChange={(e) => setHeaderData({...headerData, risk_type: e.target.value})}
                                    >
                                        <option value="OWNER_RISK">Owner Risk</option>
                                        <option value="CARRIER_RISK">Carrier Risk</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {boxes.map((box) => (
                                    <div key={box.id} className="flex flex-wrap items-end gap-4 p-4 border border-border-subtle rounded-lg bg-dashboard-bg/20">
                                        <div className="space-y-1.5">
                                            <label className="text-xs text-text-muted">Count</label>
                                            <input type="number" value={box.count} onChange={(e) => updateBox(box.id, 'count', e.target.value)} className="w-20 bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main" />
                                        </div>
                                        <div className="space-y-1.5 flex-1 min-w-[120px]">
                                            <label className="text-xs text-text-muted">Length (cm)*</label>
                                            <input type="number" value={box.length} onChange={(e) => updateBox(box.id, 'length', e.target.value)} className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main" />
                                        </div>
                                        <div className="space-y-1.5 flex-1 min-w-[120px]">
                                            <label className="text-xs text-text-muted">Breadth (cm)*</label>
                                            <input type="number" value={box.breadth} onChange={(e) => updateBox(box.id, 'breadth', e.target.value)} className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main" />
                                        </div>
                                        <div className="space-y-1.5 flex-1 min-w-[120px]">
                                            <label className="text-xs text-text-muted">Height (cm)*</label>
                                            <input type="number" value={box.height} onChange={(e) => updateBox(box.id, 'height', e.target.value)} className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main" />
                                        </div>
                                        <div className="space-y-1.5 flex-1 min-w-[120px]">
                                            <label className="text-xs text-text-muted">Physical Weight(Kg)*</label>
                                            <input type="number" value={box.physicalWeight} onChange={(e) => updateBox(box.id, 'physicalWeight', e.target.value)} className="w-full bg-card-bg border border-border-subtle rounded-md px-3 py-2 text-sm text-text-main" />
                                        </div>
                                        <Button onClick={() => removeBox(box.id)} className="bg-red-500 hover:bg-red-600 text-white h-10 px-4 rounded-md shadow-sm">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                ))}
                                <Button onClick={addBox} className="bg-primary hover:bg-primary/90 text-black h-10 px-6 font-bold flex items-center gap-2 shadow-sm">
                                    <Plus size={16} /> Add New Box
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Result Section - Showing ALL Data */}
                    {result && (
                        <div className="mt-10 animate-in fade-in slide-in-from-top-4 duration-500 space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                
                                {/* Weight Info */}
                                <Card className="bg-dashboard-bg/30 border-primary/20">
                                    <CardContent className="p-4 space-y-4">
                                        <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
                                            <Weight className="text-primary" size={18} />
                                            <h4 className="font-bold text-sm">Weight Details</h4>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm text-text-muted"><span>Physical Weight:</span><span className="font-semibold text-text-main">{result.physical_weight} Kg</span></div>
                                            <div className="flex justify-between text-sm text-text-muted"><span>Volumetric Weight:</span><span className="font-semibold text-text-main">{result.volumetric_weight} Kg</span></div>
                                            <div className="flex justify-between text-sm text-primary font-bold pt-2 border-t border-border-subtle">
                                                <span>Chargeable Weight:</span><span>{result.chargeable_weight} Kg</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Detailed Pricing */}
                                <Card className="lg:col-span-2 bg-dashboard-bg/30 border-primary/20">
                                    <CardContent className="p-4 space-y-4">
                                        <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
                                            <Calculator className="text-primary" size={18} />
                                            <h4 className="font-bold text-sm">Cost Breakdown</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                            <div className="flex justify-between text-sm text-text-muted"><span>Base Freight:</span><span className="font-semibold text-text-main">₹{result.pricing.base_freight}</span></div>
                                            <div className="flex justify-between text-sm text-text-muted"><span>Fuel Surcharge:</span><span className="font-semibold text-text-main">₹{result.pricing.fuel_surcharge}</span></div>
                                            <div className="flex justify-between text-sm text-text-muted"><span>COD Charges:</span><span className="font-semibold text-text-main">₹{result.pricing.cod_charge}</span></div>
                                            <div className="flex justify-between text-sm text-text-muted"><span>GST (18%):</span><span className="font-semibold text-text-main">₹{result.pricing.gst}</span></div>
                                            <div className="flex justify-between text-sm text-text-muted"><span>Reverse Charge:</span><span className="font-semibold text-text-main">₹{result.pricing.reverse_charge}</span></div>
                                            <div className="flex justify-between text-sm text-text-muted"><span>Insurance:</span><span className="font-semibold text-text-main">₹{result.pricing.insurance_charge}</span></div>
                                        </div>
                                        <div className="mt-4 p-4 bg-primary rounded-lg flex justify-between items-center text-black">
                                            <span className="font-bold uppercase tracking-wider text-xs">Total Payable Amount</span>
                                            <span className="text-2xl font-black flex items-center"><IndianRupee size={24}/> {result.pricing.final_amount}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {error && <p className="mt-4 text-red-500 text-sm font-medium bg-red-500/10 p-3 rounded-md">{error}</p>}

                    <div className="mt-8 border-t border-border-subtle pt-8">
                        <Button 
                            onClick={handleCalculate} 
                            disabled={loading}
                            className="bg-primary hover:bg-primary/90 text-black h-11 px-12 font-bold text-base shadow-md disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : "Calculate Rates"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}