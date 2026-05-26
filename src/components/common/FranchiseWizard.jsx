import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  RotateCcw,
  User,
  Briefcase,
  HardHat,
  IndianRupee,
  Map,
  FileText,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { swalSuccess, swalError } from "../../lib/swal";
import { cn } from "../../lib/utils";
import {
  createFranchise,
  updateFranchise,
  getFranchiseById,
  clearSelectedFranchise,
} from "../../redux/franchiseSlice";

const STEPS = [
  { id: 1, label: "Applicant", icon: User },
  { id: 2, label: "Business", icon: Briefcase },
  { id: 3, label: "Infrastructure", icon: HardHat },
  { id: 4, label: "Financial", icon: IndianRupee },
  { id: 5, label: "Area", icon: Map },
  { id: 6, label: "Documents", icon: FileText },
  { id: 7, label: "Declaration", icon: ShieldCheck },
];

export default function FranchiseWizard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();
  const { loading, selectedFranchise } = useSelector(
    (state) => state.franchise,
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    mobile_number: "",
    email_id: "",
    password: "",
    current_address: "",
    permanent_address: "",
    franchise_code: "",
    proposed_location: "",
    detailed_business_address: "",
    ownership_type: "",
    prior_experience: "",
    years_active: 0,
    office_space_sqft: 0,
    office_ownership: "Owned",
    staff_count: 0,
    internet_availability: false,
    computer_laptop: false,
    investment_capacity: "",
    source_of_funds: "",
    bank_name: "",
    account_number: "",
    existing_loans: false,
    existing_loan_details: "",
    preferred_service_area: "",
    nearby_landmark: "",
    pincode: "",
    doc_id_proof: false,
    doc_address_proof: false,
    doc_photographs: false,
    doc_business_registration: false,
    doc_bank_statement: false,
    submission_place: "",
    submission_date: new Date().toISOString().split("T")[0],
    agree_to_terms: false,
  });

  useEffect(() => {
    if (id) {
      dispatch(getFranchiseById(id));
    } else {
      dispatch(clearSelectedFranchise());
      setFormData((prev) => ({
        ...prev,
        franchise_code: `FR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      }));
    }
  }, [id, dispatch]);

  useEffect(() => {
    if (id && selectedFranchise) {
      setFormData({
        ...selectedFranchise,
        date_of_birth: selectedFranchise.date_of_birth
          ? selectedFranchise.date_of_birth.split("T")[0]
          : "",
        password: "",
      });
    }
  }, [selectedFranchise, id]);

  const inputClass =
    "w-full bg-dashboard-bg/50 border border-border-subtle rounded-lg px-4 py-2.5 text-sm text-text-main focus:outline-none focus:border-primary transition-all dark:bg-card-bg placeholder:text-text-muted/40";
  const labelClass =
    "text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1.5 block ml-1";

  const nextStep = () => {
    if (currentStep < STEPS.length) setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const isStepComplete = () => {
    switch (currentStep) {
      case 1:
        return (
          formData.full_name &&
          formData.date_of_birth &&
          formData.mobile_number &&
          formData.email_id &&
          (id ? true : formData.password)
        );
      case 2:
        return (
          formData.proposed_location &&
          formData.detailed_business_address &&
          formData.ownership_type
        );
      case 3:
        return formData.office_space_sqft > 0 && formData.staff_count > 0;
      case 4:
        return (
          formData.investment_capacity &&
          formData.bank_name &&
          formData.account_number
        );
      case 5:
        return formData.preferred_service_area && formData.pincode;
      case 6:
        return (
          formData.doc_id_proof &&
          formData.doc_address_proof &&
          formData.doc_photographs
        );
      case 7:
        return formData.submission_place && formData.agree_to_terms;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        years_active: Number(formData.years_active),
        office_space_sqft: Number(formData.office_space_sqft),
        staff_count: Number(formData.staff_count),
      };
      if (id && !payload.password) delete payload.password;
      if (id) {
        await dispatch(updateFranchise({ id, data: payload })).unwrap();
        swalSuccess("Updated", "Franchise updated successfully.");
      } else {
        await dispatch(createFranchise(payload)).unwrap();
        swalSuccess("Success", `Franchise ${formData.franchise_code} created.`);
      }
      navigate("/dashboard/franchise");
    } catch (err) {
      swalError(
        "Error",
        typeof err === "string" ? err : err?.message || "Submission failed.",
      );
    }
  };

  if (id && loading && !selectedFranchise) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-text-muted font-bold animate-pulse uppercase tracking-widest text-center px-4">
          Fetching Franchise Records...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 pt-4 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main uppercase tracking-tight">
            {id
              ? `Edit: ${formData.franchise_code}`
              : "New Franchise Application"}
          </h1>
          <p className="text-xs text-primary mt-1 font-medium uppercase tracking-widest">
            Step {currentStep} of 7 • {STEPS[currentStep - 1].label}
          </p>
        </div>
        <Button
          onClick={() => navigate("/dashboard/franchise")}
          variant="outline"
          className="h-10 rounded-xl border-slate-300 dark:border-border-subtle text-text-main"
        >
          <RotateCcw size={16} className="mr-2" /> Discard
        </Button>
      </div>

      {/* Stepper Tabs */}
      <div className="flex overflow-x-auto gap-2 p-2 bg-card-bg border border-border-subtle rounded-2xl no-scrollbar shadow-sm">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id;
          const isDone = currentStep > step.id;
          return (
            <div
              key={step.id}
              onClick={() =>
                (isDone || step.id < currentStep) && setCurrentStep(step.id)
              }
              className={cn(
                "flex-1 min-w-[130px] flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
                isActive
                  ? "bg-primary/10 border border-primary/20 shadow-inner"
                  : isDone
                    ? "opacity-100"
                    : "opacity-50",
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                  isActive
                    ? "bg-primary text-black border-primary scale-110 shadow-lg shadow-primary/30"
                    : isDone
                      ? "text-green-500 border-green-500"
                      : "text-text-muted border-border-subtle",
                )}
              >
                {isDone ? <CheckCircle2 size={18} /> : <step.icon size={18} />}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  isActive ? "text-primary" : "text-text-muted",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      <Card className="bg-card-bg border-border-subtle shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="p-6 md:p-10">
          <form className="space-y-8">
            {/* Step 1: Applicant */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="md:col-span-2 lg:col-span-4 border-b border-border-subtle pb-2 flex items-center gap-2">
                  <User className="text-primary" size={20} />
                  <h3 className="text-lg font-bold text-text-main">
                    1. Personal Information
                  </h3>
                </div>
                <div className="lg:col-span-2">
                  <label className={labelClass}>Full Name*</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Adarsh Nair"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth*</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date_of_birth: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Gender*</label>
                  <select
                    className={inputClass}
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Mobile Number*</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. 9876543210"
                    value={formData.mobile_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mobile_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Email ID*</label>
                  <input
                    type="email"
                    className={inputClass}
                    placeholder="e.g. adarsh@example.com"
                    value={formData.email_id}
                    onChange={(e) =>
                      setFormData({ ...formData, email_id: e.target.value })
                    }
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className={labelClass}>
                    Account Password {id && "(Optional)"}
                  </label>
                  <input
                    type="password"
                    className={inputClass}
                    placeholder="Set a secure password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className={labelClass}>Current Address*</label>
                  <textarea
                    className={inputClass}
                    placeholder="Building Name, Street, Area, City..."
                    rows="2"
                    value={formData.current_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_address: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className={labelClass}>Permanent Address</label>
                  <textarea
                    className={inputClass}
                    placeholder="Same as above or as per government ID..."
                    rows="2"
                    value={formData.permanent_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        permanent_address: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Step 2: Business */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="md:col-span-2 border-b border-border-subtle pb-2 flex items-center gap-2">
                  <Briefcase className="text-primary" size={20} />
                  <h3 className="text-lg font-bold text-text-main">
                    2. Business Setup
                  </h3>
                </div>
                <div>
                  <label className={labelClass}>Proposed Location*</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Kakkanad, Kochi"
                    value={formData.proposed_location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proposed_location: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Ownership Type*</label>
                  <select
                    className={inputClass}
                    value={formData.ownership_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ownership_type: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Type</option>
                    <option value="Sole Proprietorship">
                      Sole Proprietorship
                    </option>
                    <option value="Partnership">Partnership</option>
                    <option value="Private Limited">Private Limited</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Detailed Business Address*
                  </label>
                  <textarea
                    className={inputClass}
                    placeholder="Shop Number, Building Name, Landmark..."
                    rows="2"
                    value={formData.detailed_business_address}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        detailed_business_address: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Prior Experience</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Retail, Courier, or None"
                    value={formData.prior_experience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        prior_experience: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Years Active</label>
                  <input
                    type="number"
                    className={inputClass}
                    placeholder="0"
                    value={formData.years_active}
                    onChange={(e) =>
                      setFormData({ ...formData, years_active: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {/* Step 3: Infrastructure */}
            {currentStep === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="lg:col-span-3 border-b border-border-subtle pb-2 flex items-center gap-2">
                  <HardHat className="text-primary" size={20} />
                  <h3 className="text-lg font-bold text-text-main">
                    3. Infrastructure Readiness
                  </h3>
                </div>
                <div>
                  <label className={labelClass}>Office Space (sq.ft)*</label>
                  <input
                    type="number"
                    className={inputClass}
                    placeholder="e.g. 400"
                    value={formData.office_space_sqft}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        office_space_sqft: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Office Ownership*</label>
                  <select
                    className={inputClass}
                    value={formData.office_ownership}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        office_ownership: e.target.value,
                      })
                    }
                  >
                    <option value="Owned">Owned</option>
                    <option value="Rented">Rented</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Staff Count*</label>
                  <input
                    type="number"
                    className={inputClass}
                    placeholder="0"
                    value={formData.staff_count}
                    onChange={(e) =>
                      setFormData({ ...formData, staff_count: e.target.value })
                    }
                  />
                </div>
                <div className="lg:col-span-3 flex gap-8 bg-dashboard-bg/50 p-6 rounded-2xl border border-border-subtle border-dashed">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-primary"
                      checked={formData.internet_availability}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          internet_availability: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors uppercase">
                      Broadband Ready
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-primary"
                      checked={formData.computer_laptop}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          computer_laptop: e.target.checked,
                        })
                      }
                    />
                    <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors uppercase">
                      PCs / Laptops
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Financial */}
            {currentStep === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="md:col-span-2 border-b border-border-subtle pb-2 flex items-center gap-2">
                  <IndianRupee className="text-primary" size={20} />
                  <h3 className="text-lg font-bold text-text-main">
                    4. Financial Capacity
                  </h3>
                </div>
                <div>
                  <label className={labelClass}>Investment Capacity*</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. 5-10 Lakhs"
                    value={formData.investment_capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        investment_capacity: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Source of Funds</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Savings / Loan"
                    value={formData.source_of_funds}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        source_of_funds: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Bank Name*</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. HDFC Bank"
                    value={formData.bank_name}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Account Number*</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="12-16 digit account number"
                    value={formData.account_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        account_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2 bg-dashboard-bg/30 p-5 rounded-2xl border border-border-subtle">
                  <label className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-bold text-text-main uppercase tracking-widest">
                      Active Loans?
                    </span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-primary"
                      checked={formData.existing_loans}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          existing_loans: e.target.checked,
                          existing_loan_details: e.target.checked
                            ? formData.existing_loan_details
                            : "",
                        })
                      }
                    />
                  </label>
                  {formData.existing_loans && (
                    <textarea
                      className={inputClass}
                      placeholder="Details of loan amounts and banking partners..."
                      value={formData.existing_loan_details}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          existing_loan_details: e.target.value,
                        })
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Area */}
            {currentStep === 5 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="md:col-span-2 border-b border-border-subtle pb-2 flex items-center gap-2">
                  <Map className="text-primary" size={20} />
                  <h3 className="text-lg font-bold text-text-main">
                    5. Territory Management
                  </h3>
                </div>
                <div>
                  <label className={labelClass}>Preferred Service Area*</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Kochi City Limits"
                    value={formData.preferred_service_area}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferred_service_area: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelClass}>Nearby Landmark</label>
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="e.g. Near Metro Station"
                    value={formData.nearby_landmark}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nearby_landmark: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Pin Codes Covered (Comma separated)*
                  </label>
                  <textarea
                    className={inputClass}
                    rows="2"
                    placeholder="e.g. 682030, 682021, 682024"
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pincode: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Step 6: Documents */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="border-b border-border-subtle pb-2 flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  <h3 className="text-lg font-bold text-text-main">
                    6. Document Checklist
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "doc_id_proof", label: "ID Proof (Aadhar/PAN)" },
                    { id: "doc_address_proof", label: "Address Proof" },
                    { id: "doc_photographs", label: "Recent Photographs" },
                    {
                      id: "doc_business_registration",
                      label: "Trade License / Reg.",
                    },
                    {
                      id: "doc_bank_statement",
                      label: "Last 6 Months Statement",
                    },
                  ].map((doc) => (
                    <label
                      key={doc.id}
                      className={cn(
                        "flex items-center justify-between p-5 border rounded-2xl cursor-pointer transition-all",
                        formData[doc.id]
                          ? "bg-primary/10 border-primary shadow-sm"
                          : "bg-dashboard-bg/50 border-border-subtle hover:border-primary/50",
                      )}
                    >
                      <span className="text-sm font-bold text-text-main uppercase tracking-widest">
                        {doc.label}
                      </span>
                      <input
                        type="checkbox"
                        className="w-6 h-6 accent-primary"
                        checked={formData[doc.id]}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            [doc.id]: e.target.checked,
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Step 7: Declaration */}
            {currentStep === 7 && (
              <div className="space-y-8 max-w-3xl mx-auto text-center animate-in zoom-in-95 duration-500">
                <div className="p-6 md:p-10 bg-card-bg border border-border-subtle rounded-[2.5rem] shadow-xl relative overflow-hidden">
                  <div
                    className={cn(
                      "mb-6 transition-all duration-500",
                      formData.agree_to_terms ? "scale-110" : "scale-100",
                    )}
                  >
                    <ShieldCheck
                      className={cn(
                        "mx-auto transition-colors duration-300",
                        formData.agree_to_terms
                          ? "text-primary animate-bounce"
                          : "text-text-muted",
                      )}
                      size={70}
                    />
                  </div>

                  <h3 className="text-2xl font-black text-text-main mb-6 uppercase tracking-tighter">
                    Legal Declaration
                  </h3>

                  {/* Declaration Content Box - Updated for visibility */}
                  <div className="text-sm md:text-base text-text-main text-left space-y-4 mb-10 bg-dashboard-bg/50 dark:bg-black/40 p-6 md:p-8 rounded-2xl border border-border-subtle leading-relaxed shadow-inner">
                    <div className="flex gap-3">
                      <span className="text-primary font-bold">•</span>
                      <p className="font-medium">
                        I/We hereby declare that the information provided in
                        this application is true and correct.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-primary font-bold">•</span>
                      <p className="font-medium">
                        I understand that any false statement may result in the
                        rejection of my application or termination of agreement.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-primary font-bold">•</span>
                      <p className="font-medium">
                        I agree to abide by the rules and standard procedures
                        established by the company.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <label className="flex items-center gap-4 cursor-pointer group select-none">
                      <div
                        className={cn(
                          "w-9 h-9 border-2 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg",
                          formData.agree_to_terms
                            ? "bg-primary border-primary scale-110"
                            : "border-border-subtle bg-dashboard-bg group-hover:border-primary",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={formData.agree_to_terms}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              agree_to_terms: e.target.checked,
                            })
                          }
                        />
                        {formData.agree_to_terms && (
                          <CheckCircle2 size={22} className="text-black" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-base font-black transition-colors uppercase tracking-widest",
                          formData.agree_to_terms
                            ? "text-primary"
                            : "text-text-main group-hover:text-primary",
                        )}
                      >
                        I Accept Terms & Conditions
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left border-t border-border-subtle pt-10">
                  <div className="space-y-2">
                    <label className={labelClass}>Place of Submission*</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Kochi"
                      value={formData.submission_place}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          submission_place: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Submission Date</label>
                    <input
                      type="text"
                      className={cn(
                        inputClass,
                        "opacity-70 cursor-not-allowed",
                      )}
                      value={formData.submission_date}
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Controls */}
            <div className="pt-10 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-border-subtle">
              <Button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1 || loading}
                variant="outline"
                className="w-full sm:w-auto px-10 h-12 rounded-xl font-bold uppercase tracking-widest border-slate-300 dark:border-border-subtle text-slate-700 dark:text-text-main hover:bg-slate-50 dark:hover:bg-dashboard-bg shadow-sm"
              >
                <ChevronLeft className="mr-2" size={20} /> Previous
              </Button>

              {currentStep < 7 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepComplete()}
                  className={cn(
                    "w-full sm:w-auto px-12 h-12 rounded-xl font-black shadow-lg transition-all uppercase tracking-widest",
                    isStepComplete()
                      ? "bg-primary text-black hover:bg-primary/90"
                      : "bg-border-subtle text-text-muted cursor-not-allowed",
                  )}
                >
                  Next Step <ChevronRight className="ml-2" size={20} />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!isStepComplete() || loading}
                  className="w-full sm:w-auto px-16 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black shadow-xl uppercase tracking-widest transition-transform active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" />
                  ) : id ? (
                    "Apply Updates"
                  ) : (
                    "Submit Registration"
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
