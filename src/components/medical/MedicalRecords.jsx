import React, { useState, useRef, useCallback, useEffect } from "react";
import "./MedicalRecords.css";
import fetchWithAuth from "../../utils/fetchWithAuth";
import { appCache, CACHE_KEYS, TTL } from "../../utils/appCache";

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
} from "lucide-react";
import heroImage from "../../assets/medical-banner.png";
import emptyDog from "../../assets/empty-dog.png";

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

export default function MedicalRecords({ pets = [], activePetId, onPetSelect, onAddPet }) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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

  // Real Database Records State
  const [allRecords, setAllRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [formData, setFormData] = useState({
    recordName: "",
    category: "Prescription",
    date: "",
    notes: "",
  });

  const [showMetaForm, setShowMetaForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch medical records from the API for the active pet
  const fetchRecords = useCallback(async (forceRefresh = false) => {
    if (!activePetId) {
      setAllRecords([]);
      return;
    }
    
    if (!forceRefresh) {
      const cached = appCache.get(CACHE_KEYS.medicalRecords(activePetId), TTL.medicalRecords);
      if (cached) {
        setAllRecords(cached);
        return;
      }
    }

    setLoadingRecords(true);
    try {
      const res = await fetchWithAuth(`/api/medical-records/${activePetId}`);
      if (res.ok) {
        const data = await res.json();
        setAllRecords(data || []);
        appCache.set(CACHE_KEYS.medicalRecords(activePetId), data || []);
      }
    } catch (err) {
      console.error("Error fetching medical records:", err);
    } finally {
      setLoadingRecords(false);
    }
  }, [activePetId]);

  useEffect(() => {
    fetchRecords(false);
  }, [fetchRecords]);

  // Handle direct Quick Access upload
  const startUpload = async (file) => {
    if (!activePetId) {
      alert("Please select a pet first.");
      return;
    }
    setSelectedFile(file);
    setShowUploadSheet(false);
    setShowUploadProgress(true);
    setProgress(10);

    // Fake visual progress up to 85%
    let value = 10;
    const progressTimer = setInterval(() => {
      value += 15;
      if (value >= 85) {
        clearInterval(progressTimer);
        setProgress(85);
      } else {
        setProgress(value);
      }
    }, 150);

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("pet_profile_id", activePetId);
      formDataPayload.append("title", file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
      formDataPayload.append("category", "Quick Access");
      formDataPayload.append("file", file);

      const res = await fetchWithAuth("/api/medical-records/upload", {
        method: "POST",
        body: formDataPayload,
      });

      clearInterval(progressTimer);

      if (res.ok) {
        appCache.invalidate(CACHE_KEYS.medicalRecords(activePetId));
        await fetchRecords(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Upload failed");
      }
    } catch (err) {
      clearInterval(progressTimer);
      console.error("Upload error:", err);
      alert(`Upload failed: ${err.message || "Something went wrong"}`);
      setShowUploadProgress(false);
      setSelectedFile(null);
    }
  };

  // Handle detailed category upload
  const saveCategoryRecord = async () => {
    if (!selectedFile) return;
    if (!activePetId) {
      alert("Please select a pet first.");
      return;
    }

    const category = formData.category || "Other";
    const title = formData.recordName || selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;

    setShowMetaForm(false);
    setShowUploadProgress(true);
    setProgress(20);

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("pet_profile_id", activePetId);
      formDataPayload.append("title", title);
      formDataPayload.append("category", category);
      formDataPayload.append("file", selectedFile);

      setProgress(60);

      const res = await fetchWithAuth("/api/medical-records/upload", {
        method: "POST",
        body: formDataPayload,
      });

      if (res.ok) {
        setProgress(100);
        // Clear forms
        setFormData({
          recordName: "",
          category: "Prescription",
          date: "",
          notes: "",
        });
        appCache.invalidate(CACHE_KEYS.medicalRecords(activePetId));
        await fetchRecords(true);
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Upload failed");
      }
    } catch (err) {
      console.error("Category upload error:", err);
      alert(`Upload failed: ${err.message || "Something went wrong"}`);
      setShowUploadProgress(false);
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
        appCache.invalidate(CACHE_KEYS.medicalRecords(activePetId));
        await fetchRecords(true);
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
      const res = await fetchWithAuth(`/api/medical-records/${recordId}/favorite`, {
        method: "PATCH",
      });
      if (res.ok) {
        appCache.invalidate(CACHE_KEYS.medicalRecords(activePetId));
        await fetchRecords(true);
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

  return (
    <div className="medical-records">
      {/* HEADER */}
      <header className="mr-header">
        <h1>Medical Records</h1>
      </header>

      {/* PET SELECTOR */}
      {pets.length > 0 && (
        <section className="pet-selector-section" style={{ marginBottom: '18px', padding: '0 4px' }}>
          <div className="category-scroll">
            {pets.map((pet) => (
              <button
                key={pet.id}
                className={`chip ${activePetId === pet.id ? "active" : ""}`}
                onClick={() => onPetSelect?.(pet)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}
              >
                <img
                  src={pet.pet_photo_url || pet.image || emptyDog}
                  alt={pet.pet_name || pet.name || "Pet"}
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span>{pet.pet_name || pet.name}</span>
              </button>
            ))}
            <button
              className="chip"
              onClick={onAddPet}
              style={{ fontWeight: 'bold', fontSize: '15px' }}
            >
              + Add Pet
            </button>
          </div>
        </section>
      )}

      {/* HERO IMAGE */}
      <section className="hero-banner">
        <img src={heroImage} alt="Medical Banner" />
      </section>

      {/* ACTION BUTTONS */}
      <section className="action-grid">
        <button
          className="action-card"
          onClick={() => {
            setUploadType("quick-access");
            setShowUploadSheet(true);
          }}
        >
          <div className="card-icon">
            <FolderOpen size={28} strokeWidth={2} />
          </div>
          <h3>Favorites</h3>

          <p>View your important records instantly.</p>
        </button>

        <button
          className="action-card"
          onClick={() => {
            setUploadType("category");
            setShowUploadSheet(true);
          }}
        >
          <div className="card-icon">
            <Upload size={28} strokeWidth={2} />
          </div>

          <h3>Upload via Category</h3>

          <p>Organize and upload records by type.</p>
        </button>
      </section>

      {/* RECORDS */}
      <section className="records-section">
        <div className="section-header">
          <h2>View Records</h2>
        </div>

        <div className="category-scroll">
          {displayedCategories.map((item) => (
            <button
              key={item}
              className={`chip ${activeCategory === item ? "active" : ""}`}
              onClick={() => setActiveCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="empty-state">
          {/* RECORDS LIST */}
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
                    <span>{record.created_at ? new Date(record.created_at).toLocaleDateString() : ""}</span>
                  </div>

                  <button
                    className={`favorite-btn ${record.is_favorite ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(record.id);
                    }}
                  >
                    <Heart size={20} fill={record.is_favorite ? "currentColor" : "none"} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-card">
              <img src={emptyDog} alt="empty" className="empty-dog" />
              <h3>No Record Found</h3>
              <p>{activeCategory === "Favorites" ? "No favorite records yet" : `No records in ${activeCategory}`}</p>
            </div>
          )}
        </div>
      </section>

      {/* UPLOAD PROGRESS OVERLAY */}
      {showUploadProgress && (
        <div className="upload-progress-overlay">
          <div className="uploading-placeholder">
            {progress < 100 ? (
              <>
                <div className="upload-spinner"></div>
                <h3>Uploading...</h3>
              </>
            ) : (
              <>
                <div className="upload-success-icon">
                  <CheckCircle2 size={52} strokeWidth={2.4} />
                </div>
                <h3 className="upload-success-text">Uploaded Successfully</h3>
              </>
            )}

            <p>{selectedFile?.name}</p>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            <span>{progress}%</span>

            {progress === 100 && (
              <div className="upload-actions">
                <button
                  className="preview-btn"
                  onClick={() => setShowPreview(true)}
                >
                  Preview
                </button>

                <button
                  className="save-btn"
                  onClick={() => {
                    setShowUploadProgress(false);
                    setShowPreview(false);
                    setSelectedFile(null);
                    setProgress(0);
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/*file choosing for upload-pop-up*/}
      {showUploadSheet && (
        <div
          className="sheet-overlay"
          onClick={() => setShowUploadSheet(false)}
        >
          <div className="upload-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>

            <div className="upload-icon">
              <Upload size={36} strokeWidth={2.2} />
            </div>

            <h3>Upload Medical File</h3>

            <button className="upload-option" onClick={handleTakePhoto}>
              <Camera size={20} />
              <span>Take Photo</span>
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

                if (uploadType === "quick-access") {
                  startUpload(file);
                } else if (uploadType === "category") {
                  setSelectedFile(file);
                  setShowUploadSheet(false);
                  setShowMetaForm(true);
                }
              }}
            />

            <button className="upload-option" onClick={handleChooseImage}>
              <Image size={20} />
              <span>Choose Image</span>
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

                if (uploadType === "quick-access") {
                  startUpload(file);
                } else if (uploadType === "category") {
                  setSelectedFile(file);
                  setShowUploadSheet(false);
                  setShowMetaForm(true);
                }
              }}
            />

            <button className="upload-option" onClick={handleChoosePDF}>
              <FileText size={20} />
              <span>Select PDF</span>
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

                if (uploadType === "quick-access") {
                  startUpload(file);
                } else if (uploadType === "category") {
                  setSelectedFile(file);
                  setShowUploadSheet(false);
                  setShowMetaForm(true);
                }
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

      {/* CATEGORY META FORM */}
      {showMetaForm && selectedFile && (
        <div className="meta-overlay">
          <div className="meta-modal">
            <h3>Record Details</h3>

            {/* Record Name */}
            <input
              name="recordName"
              placeholder="Enter record name"
              value={formData.recordName}
              onChange={handleFormChange}
              className="input"
            />

            {/* Category */}
            <div className="category-row">
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
              >
                {DYNAMIC_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleFormChange}
              className="input"
            />

            {/* Notes */}
            <textarea
              name="notes"
              placeholder="Notes (optional)"
              value={formData.notes}
              onChange={handleFormChange}
              className="textarea"
            />

            {/* ACTION BUTTONS */}
            <div className="form-actions">
              <button 
                onClick={() => {
                  setShowMetaForm(false);
                  setSelectedFile(null);
                }}
                style={{ background: '#f3f4f6', color: '#333' }}
              >
                Cancel
              </button>
              <button 
                onClick={saveCategoryRecord}
                style={{ background: '#059669', color: 'white' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
