import React, { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import "./MedicalRecords.css";
import fetchWithAuth from "../../utils/fetchWithAuth";
import ProfileCard from "../Home/ProfileCard/ProfileCard";

import {
  FolderOpen,
  Upload,
  Camera,
  Image,
  FileText,
  ArrowLeft,
  FileImage,
  File,
  ChevronRight,
  Heart,
  X,
  Trash2,
  CheckCircle2,
  PawPrint,
  ShieldCheck,
  ShieldAlert,
  Pill,
  FlaskConical,
  Syringe,
  Bug,
  Stethoscope,
  HelpCircle,
  FileQuestion,
  Sparkles,
} from "lucide-react";
import heroImage from "../../assets/medical-banner.webp";
import emptyDog from "../../assets/empty-dog.webp";

const FIXED_CATEGORIES = ["All", "Favorites"];
const DYNAMIC_CATEGORIES = [
  "Prescription",
  "Lab Reports",
  "Vaccination",
  "Deworming",
  "Deticking",
  "Anti-rabies",
  "Treatment",
  "Other",
];

export default function MedicalRecords({
  pets = [],
  activePetId,
  onPetSelect,
  onAddPet,
}) {
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState("All");
  const [showUploadSheet, setShowUploadSheet] = useState(false);

  useEffect(() => {
    if (location.state?.openUpload) {
      setShowUploadSheet(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // The pet object matching the currently active pet, so ProfileCard
  // shows real data instead of its placeholder fallback, and so its
  // dropdown actually lists your pets.
  const selectedPet =
    pets.find((p) => p.id === activePetId) || (pets.length > 0 ? pets[0] : null);

  const handleChooseImage = () => {
    imageInputRef.current?.click();
  };
  const handleChoosePDF = () => {
    pdfInputRef.current?.click();
  };
  const handleTakePhoto = () => {
    cameraInputRef.current?.click();
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadType, setUploadType] = useState("");
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [viewFile, setViewFile] = useState(null);
  const [formData, setFormData] = useState({
    recordName: "",
    category: "Prescription",
    date: "",
    notes: "",
  });

  const [showMetaForm, setShowMetaForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const queryClient = useQueryClient();
  const { data: allRecords = [], isLoading: loadingRecords, refetch: fetchRecords } = useQuery({
    queryKey: ["medicalRecords", activePetId],
    queryFn: async () => {
      if (!activePetId) return [];
      const res = await fetchWithAuth(`/api/medical-records/${activePetId}`);
      if (!res.ok) throw new Error("Failed to fetch medical records");
      return res.json();
    },
    enabled: !!activePetId,
  });

  useEffect(() => {
    if (!showUploadProgress) return;

    if (progress >= 100) {
      const t = setTimeout(() => {
        setShowUploadProgress(false);
        setShowMetaForm(true);
      }, 500);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setProgress((p) => Math.min(p + Math.random() * 20 + 10, 100));
    }, 300);
    return () => clearTimeout(t);
  }, [showUploadProgress, progress]);

  // Handle detailed category upload
  const saveCategoryRecord = async () => {
    if (!selectedFile) return;
    if (!activePetId) {
      alert("Please select a pet first.");
      return;
    }

    const category = formData.category || "Other";
    const title =
      formData.recordName ||
      selectedFile.name.substring(0, selectedFile.name.lastIndexOf(".")) ||
      selectedFile.name;

    setIsSaving(true);

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("pet_profile_id", activePetId);
      formDataPayload.append("title", title);
      formDataPayload.append("category", category);

      if (formData.notes) formDataPayload.append("notes", formData.notes);
      formDataPayload.append("file", selectedFile);

      const res = await fetchWithAuth("/api/medical-records/upload", {
        method: "POST",
        body: formDataPayload,
      });

      if (res.ok) {
        setShowMetaForm(false);
        setFormData({
          recordName: "",
          category: "Prescription",
          date: "",
          notes: "",
        });
        setSelectedFile(null);
        setProgress(0);
        await fetchRecords();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Upload failed");
      }
    } catch (err) {
      console.error("Category upload error:", err);
      alert(`Upload failed: ${err.message || "Something went wrong"}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle delete API call
  const deleteRecord = async () => {
    if (!viewFile) return;
    try {
      const res = await fetchWithAuth(`/api/medical-records/${viewFile.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchRecords();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to delete record: ${errData.detail || "Database error"}`);
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      alert("An error occurred while deleting this record.");
    } finally {
      setViewFile(null);
    }
  };

  const toggleFavorite = async (recordId) => {
    try {
      const res = await fetchWithAuth(
        `/api/medical-records/${recordId}/favorite`,
        {
          method: "PATCH",
        },
      );
      if (res.ok) {
        await fetchRecords();
      } else {
        console.error("Failed to toggle favorite");
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  // Dynamically sort categories
  const categoryCounts = {};
  allRecords.forEach((r) => {
    if (DYNAMIC_CATEGORIES.includes(r.category)) {
      categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
    }
  });

  const sortedDynamicCategories = [...DYNAMIC_CATEGORIES].sort((a, b) => {
    const countA = categoryCounts[a] || 0;
    const countB = categoryCounts[b] || 0;
    return countB - countA;
  });

  const displayedCategories = [...FIXED_CATEGORIES, ...sortedDynamicCategories];

  // Filter records based on selected category
  const currentRecords =
    activeCategory === "All"
      ? allRecords
      : activeCategory === "Favorites"
        ? allRecords.filter((r) => r.is_favorite)
        : allRecords.filter((r) => r.category === activeCategory);

  const [isSaving, setIsSaving] = useState(false);
  const CATEGORY_ICONS = {
    Prescription: Pill,
    "Lab Reports": FlaskConical,
    Vaccination: Syringe,
    Deworming: Bug,
    Deticking: ShieldCheck,
    "Anti-rabies": Syringe,
    Treatment: Stethoscope,
    Other: FileQuestion,
  };

  return (
    <div className="medical-records">
      <ProfileCard
        pets={pets}
        selectedPet={selectedPet}
        handlePetSelect={onPetSelect}
        onAddPet={onAddPet}
      />

      {/* HEADER */}
      <header className="mr-header" style={{ marginTop: '12px', marginBottom: '8px' }}>
        <h1>Medical Records</h1>
      </header>

      {/* HERO IMAGE */}
      <section className="hero-banner">
        <img src={heroImage} alt="Medical Banner" />
      </section>

      {/* RECORDS SECTION */}
      <section className="records-section">
        {!loadingRecords && currentRecords.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 4px 12px' }}>
            <button
              className="upload-records-btn"
              onClick={() => setShowUploadSheet(true)}
              style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '10px' }}
            >
              <Upload size={16} />
              Add Record
            </button>
          </div>
        )}
        <div className="empty-state">
          {loadingRecords ? (
            <div className="upload-spinner"></div>
          ) : currentRecords.length > 0 ? (
            <div className="records-list">
              {currentRecords.map((record, index) => (
                <div
                  key={record.id || index}
                  className="record-card"
                  onClick={() => setViewFile(record)}
                >
                  <div className="record-icon">
                    {record.file_type?.includes("pdf") ? (
                      <File size={30} />
                    ) : (
                      <FileImage size={30} />
                    )}
                  </div>

                  <div className="record-details">
                    <h4>{record.title || record.file_name}</h4>
                    <p>{record.category}</p>
                    <span>
                      {record.created_at
                        ? new Date(record.created_at).toLocaleDateString()
                        : ""}
                    </span>
                  </div>

                  <button
                    className={`favorite-btn ${record.is_favorite ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(record.id);
                    }}
                  >
                    <Heart
                      size={20}
                      fill={record.is_favorite ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-row">
              <div className="empty-card">
                <h3>
                  {activeCategory === "All"
                    ? "No medical records yet"
                    : `No ${activeCategory} records yet`}
                </h3>
                <p>
                  Upload vaccination, prescriptions, X-rays and more to keep
                  your pet healthy.
                </p>

                <button
                  className="upload-records-btn"
                  onClick={() => setShowUploadSheet(true)}
                >
                  <Upload size={20} />
                  Upload Records
                </button>

                <span className="supports-text">
                  Supports: PDF, JPG, PNG up to 20MB
                </span>
              </div>
              <center>
                <div className="why-upload-card">
                  <h4>Why upload records?</h4>
                  <ul>
                    <li>
                      <CheckCircle2 size={16} className="why-icon" />
                      Easy access anytime
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="why-icon" />
                      Be ready for emergencies
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="why-icon" />
                      Share easily with your vet
                    </li>
                  </ul>
                </div>
              </center>
            </div>
          )}
        </div>
      </section>

      {/* AI ANALYSIS COMING SOON CARD */}
      <div className="ai-analysis-card">
        <div className="ai-analysis-header">
          <div className="ai-analysis-icon-bg">
            <Sparkles size={20} className="ai-sparkle-icon" />
          </div>
          <span className="ai-coming-soon-badge">
            <Sparkles size={11} /> Coming Soon
          </span>
        </div>
        <div className="ai-analysis-body">
          <h4 className="ai-analysis-title">AI Medical Record Analysis</h4>
          <p className="ai-analysis-desc">
            Our intelligent AI engine will automatically scan lab reports, extract key vitals, detect prescription anomalies, and generate instant summaries for your vet.
          </p>
        </div>
      </div>

      {/* UPLOADING RECORD SCREEN */}
      {showUploadProgress && (
        <div className="upload-flow-overlay">
          <div className="upload-flow-card">
            <div className="flow-header">
              <button
                className="flow-back-btn"
                onClick={() => {
                  setShowUploadProgress(false);
                  setSelectedFile(null);
                  setProgress(0);
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <h3>Uploading Record</h3>
            </div>

            <div className="upload-illustration">
              <div className="upload-cloud-circle">
                <Upload size={30} />
              </div>
            </div>

            <div className="upload-file-card">
              <div className="upload-file-name">{selectedFile?.name}</div>
              <div className="upload-file-size">
                {selectedFile
                  ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
                  : ""}
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="progress-percent">{Math.round(progress)}%</span>
            </div>

            <div className="secure-row">
              <ShieldCheck size={20} />
              <div>
                <strong>Uploading securely...</strong>
                <p>Your data is encrypted and safe</p>
              </div>
            </div>

            <div className="warning-row">
              <ShieldAlert size={20} />
              <span>Please don't close the app or go back.</span>
            </div>
          </div>
        </div>
      )}

      {/* file choosing for upload-pop-up */}
      {showUploadSheet && (
        <div
          className="sheet-overlay"
          onClick={() => setShowUploadSheet(false)}
        >
          <div className="upload-sheet-v2" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>

            <div className="sheet-header-v2">
              <button
                className="sheet-back-btn"
                onClick={() => setShowUploadSheet(false)}
              >
                <ArrowLeft size={20} />
              </button>
              <h3>Upload Medical Record</h3>
            </div>

            <button className="upload-option-v2" onClick={handleTakePhoto}>
              <span className="option-icon-box icon-green">
                <Camera size={22} />
              </span>
              <span className="option-text">
                <span className="option-title">Scan Document</span>
                <span className="option-subtitle">
                  Take a photo of your medical document
                </span>
              </span>
              <ChevronRight size={20} className="option-chevron" />
            </button>
            {/* Camera */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSelectedFile(file);
                setShowUploadSheet(false);
                setProgress(0);
                setShowUploadProgress(true);
              }}
            />

            <button className="upload-option-v2" onClick={handleChooseImage}>
              <span className="option-icon-box icon-blue">
                <Image size={22} />
              </span>
              <span className="option-text">
                <span className="option-title">Choose from Gallery</span>
                <span className="option-subtitle">
                  Select image from your gallery
                </span>
              </span>
              <ChevronRight size={20} className="option-chevron" />
            </button>
            {/* Gallery */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSelectedFile(file);
                setShowUploadSheet(false);
                setProgress(0);
                setShowUploadProgress(true);
              }}
            />

            <button className="upload-option-v2" onClick={handleChoosePDF}>
              <span className="option-icon-box icon-red">
                <FileText size={22} />
              </span>
              <span className="option-text">
                <span className="option-title">Select PDF</span>
                <span className="option-subtitle">
                  Choose PDF or other documents
                </span>
              </span>
              <ChevronRight size={20} className="option-chevron" />
            </button>
            {/* PDF */}
            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setSelectedFile(file);
                setShowUploadSheet(false);
                setProgress(0);
                setShowUploadProgress(true);
              }}
            />
          </div>
        </div>
      )}

      {/*preview image*/}
      {showPreview && selectedFile && (
        <div className="preview-overlay">
          <div className="preview-card">
            <button
              className="back-btn"
              onClick={() => {
                setShowPreview(false);
              }}
            >
              <ArrowLeft size={22} />
            </button>

            {selectedFile.type.startsWith("image") ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt=""
                className="preview-image"
              />
            ) : (
              <iframe
                title="pdf"
                src={`${URL.createObjectURL(selectedFile)}#toolbar=0&navpanes=0&scrollbar=0`}
                className="preview-pdf"
              />
            )}
          </div>
        </div>
      )}

      {/*preview after upload*/}
      {viewFile && (
        <div className="file-view-overlay" onClick={() => setViewFile(null)}>
          <div className="file-view-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setViewFile(null)}>
              <X size={22} />
            </button>

            <div className="file-view-content">
              {viewFile.file_type?.startsWith("image") ? (
                <img src={viewFile.file_url} alt="Preview" />
              ) : (
                <iframe
                  src={`${viewFile.file_url}#toolbar=0&navpanes=0`}
                  title="PDF"
                />
              )}
            </div>
            <button
              className="delete-btn"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 size={20} />
              Delete Record
            </button>

            {showDeleteConfirm && (
              <div className="confirm-dialog">
                <p>Delete this record?</p>
                <div className="confirm-actions">
                  <button
                    className="confirm-yes"
                    onClick={() => {
                      deleteRecord();
                      setShowDeleteConfirm(false);
                      setViewFile(null);
                    }}
                  >
                    Yes, Delete
                  </button>
                  <button
                    className="confirm-no"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* UPLOAD SUCCESSFUL / ASSIGN CATEGORY SCREEN */}
      {showMetaForm && selectedFile && (
        <div className="upload-flow-overlay">
          <div className="upload-flow-card">
            <div className="flow-header">
              <button
                className="flow-back-btn"
                onClick={() => {
                  setShowMetaForm(false);
                  setSelectedFile(null);
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <h3>Upload Successful</h3>
            </div>

            <div className="success-icon-wrap">
              <div className="success-icon-circle">
                <CheckCircle2 size={44} strokeWidth={2.4} />
              </div>
            </div>

            <h2 className="success-title">Record uploaded successfully!</h2>
            <p className="success-subtitle">
              Now organize it by adding the right category.
            </p>

            <div className="saved-file-card">
              <div className="saved-file-icon">
                {selectedFile.type?.includes("pdf") ? (
                  <File size={22} />
                ) : (
                  <FileImage size={22} />
                )}
              </div>
              <div className="saved-file-info">
                <h4>
                  {formData.recordName ||
                    selectedFile.name.substring(
                      0,
                      selectedFile.name.lastIndexOf("."),
                    ) ||
                    selectedFile.name}
                </h4>
                <span>
                  {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB ·{" "}
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>

            <p className="assign-category-label">Assign Category</p>

            <div className="category-grid">
              {DYNAMIC_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat] || HelpCircle;
                const isActive = formData.category === cat;
                return (
                  <button
                    key={cat}
                    className={`category-tile ${isActive ? "active" : ""}`}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, category: cat }))
                    }
                  >
                    <Icon size={22} />
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>

            <p className="field-label">Record Name</p>
            <input
              type="text"
              name="recordName"
              placeholder={
                selectedFile.name.substring(
                  0,
                  selectedFile.name.lastIndexOf("."),
                ) || selectedFile.name
              }
              value={formData.recordName}
              onChange={handleFormChange}
              className="record-name-input"
            />

            <textarea
              name="notes"
              placeholder=" Add notes (Optional) Ex. 1st Vaccination"
              value={formData.notes}
              onChange={handleFormChange}
              className="notes-textarea"
            />

            <button
              className="save-record-btn"
              onClick={saveCategoryRecord}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Record"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}