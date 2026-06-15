import React, { useMemo, useState, useEffect } from "react";
import { X, Plus, Trash2, Save, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";

export default function EditWeightModal({ isOpen, onClose, order, onSave }) {
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    if (order?.packages) {
      setPackages(
        order.packages.map((pkg, index) => ({
          id: index + 1,
          count: pkg.count || 1,
          length_cm: pkg.length_cm || "",
          breadth_cm: pkg.breadth_cm || "",
          height_cm: pkg.height_cm || "",
          physical_weight_kg: pkg.physical_weight_kg || "",
          vol_weight_kg: pkg.vol_weight_kg || 0,
        })),
      );
    }
  }, [order]);

  const handleChange = (id, field, value) => {
    setPackages((prev) =>
      prev.map((pkg) => {
        if (pkg.id === id) {
          const updated = {
            ...pkg,
            [field]: value,
          };

          const vol =
            (Number(updated.length_cm || 0) *
              Number(updated.breadth_cm || 0) *
              Number(updated.height_cm || 0)) /
            5000;

          updated.vol_weight_kg = vol.toFixed(2);

          return updated;
        }

        return pkg;
      }),
    );
  };

  const totals = useMemo(() => {
    let totalBoxes = 0;
    let totalWeight = 0;
    let totalVol = 0;

    packages.forEach((pkg) => {
      totalBoxes += Number(pkg.count || 0);

      totalWeight +=
        Number(pkg.physical_weight_kg || 0) * Number(pkg.count || 0);

      totalVol += Number(pkg.vol_weight_kg || 0) * Number(pkg.count || 0);
    });

    return {
      totalBoxes,
      totalWeight: totalWeight.toFixed(2),
      totalVol: totalVol.toFixed(2),
      applicable: Math.max(totalWeight, totalVol).toFixed(2),
    };
  }, [packages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-[95%] max-w-5xl bg-card-bg border border-border-subtle rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border-subtle">
          <div>
            <h2 className="text-2xl font-bold text-text-main">
              Edit Weight & Dimensions
            </h2>

            <p className="text-sm text-text-muted mt-1">Update package boxes</p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-muted hover:bg-dashboard-bg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* TOP ACTIONS */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-72">
              <select className="w-full appearance-none bg-card-bg border border-border-subtle rounded-xl px-4 pr-12 py-3 text-sm font-medium text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer">
                <option className="bg-card-bg text-text-main">cm</option>
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-text-muted">
                <ChevronDown size={18} />
              </div>
            </div>

            <Button
              onClick={() =>
                setPackages([
                  ...packages,
                  {
                    id: Date.now(),
                    count: 1,
                    length_cm: "",
                    breadth_cm: "",
                    height_cm: "",
                    physical_weight_kg: "",
                    vol_weight_kg: 0,
                  },
                ])
              }
              className="bg-primary hover:bg-primary/90 text-black font-bold rounded-xl h-12 px-6"
            >
              <Plus size={18} className="mr-2" />
              Add Box
            </Button>
          </div>

          {/* PACKAGE LIST */}
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="grid grid-cols-2 md:grid-cols-7 gap-4 items-end bg-dashboard-bg/30 border border-border-subtle rounded-2xl p-4"
              >
                {/* COUNT */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted">
                    Count
                  </label>

                  <input
                    type="number"
                    value={pkg.count}
                    onChange={(e) =>
                      handleChange(pkg.id, "count", e.target.value)
                    }
                    className="w-full bg-card-bg border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                {/* LENGTH */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted">
                    Length
                  </label>

                  <input
                    type="number"
                    value={pkg.length_cm}
                    onChange={(e) =>
                      handleChange(pkg.id, "length_cm", e.target.value)
                    }
                    className="w-full bg-card-bg border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                {/* BREADTH */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted">
                    Breadth
                  </label>

                  <input
                    type="number"
                    value={pkg.breadth_cm}
                    onChange={(e) =>
                      handleChange(pkg.id, "breadth_cm", e.target.value)
                    }
                    className="w-full bg-card-bg border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                {/* HEIGHT */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted">
                    Height
                  </label>

                  <input
                    type="number"
                    value={pkg.height_cm}
                    onChange={(e) =>
                      handleChange(pkg.id, "height_cm", e.target.value)
                    }
                    className="w-full bg-card-bg border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                {/* PHYSICAL */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted">
                    Physical Wt
                  </label>

                  <input
                    type="number"
                    value={pkg.physical_weight_kg}
                    onChange={(e) =>
                      handleChange(pkg.id, "physical_weight_kg", e.target.value)
                    }
                    className="w-full bg-card-bg border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary"
                  />
                </div>

                {/* VOL */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-text-muted">
                    Vol Wt
                  </label>

                  <input
                    type="text"
                    disabled
                    value={pkg.vol_weight_kg}
                    className="w-full bg-dashboard-bg border border-border-subtle rounded-xl px-3 py-2.5 text-sm text-text-main"
                  />
                </div>

                {/* DELETE */}
                <button
                  onClick={() =>
                    setPackages(packages.filter((p) => p.id !== pkg.id))
                  }
                  className="h-[44px] border border-red-500 text-red-500 rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-center"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* SUMMARY */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-green-500/10 border border-green-500/20 rounded-2xl p-5">
            <div>
              <p className="text-[11px] uppercase font-bold text-text-muted">
                No Of Boxes
              </p>

              <p className="text-xl font-bold text-text-main mt-1">
                {totals.totalBoxes}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase font-bold text-text-muted">
                Total Weight
              </p>

              <p className="text-xl font-bold text-text-main mt-1">
                {totals.totalWeight} kg
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase font-bold text-text-muted">
                Volumetric Weight
              </p>

              <p className="text-xl font-bold text-text-main mt-1">
                {totals.totalVol} kg
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase font-bold text-text-muted">
                Applicable Weight
              </p>

              <p className="text-xl font-bold text-primary mt-1">
                {totals.applicable} kg
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-3 px-6 py-5 border-t border-border-subtle bg-dashboard-bg/20">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Close
          </Button>

          <Button
            onClick={() => onSave(packages)}
            className="bg-primary hover:bg-primary/90 text-black font-bold rounded-xl"
          >
            <Save size={16} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
