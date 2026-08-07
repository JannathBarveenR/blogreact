  import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiChevronDown,
  FiMessageSquare,
  FiX,
  FiCheckCircle,
  FiEdit3
} from "react-icons/fi";
import {
  fetchFeedbacks,
  createFeedback,
  updateFeedback,
  getCachedFeedbacks
} from "../../api/feedbackApi";
import "./FeedbackPage.css";

export function parseFeedbackDate(dateString) {
  if (!dateString) return new Date();
  let cleanStr = String(dateString).trim().replace(" ", "T");

  // Handle case where local wall-clock IST time (e.g. 20:11 / 20:09) was saved with +00 UTC offset
  if (cleanStr.includes("T")) {
    const timePart = cleanStr.split("T")[1] || "";
    const hour = parseInt(timePart.split(":")[0], 10);

    if (hour >= 18 && (cleanStr.endsWith("+00") || cleanStr.endsWith("+00:00") || cleanStr.endsWith("Z"))) {
      cleanStr = cleanStr.replace(/(\+00:?00|Z)$/, "");
      return new Date(cleanStr);
    }
  }

  const d = new Date(cleanStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

export function sortFeedbacksDesc(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const timeA = parseFeedbackDate(a.created_at).getTime();
    const timeB = parseFeedbackDate(b.created_at).getTime();
    return timeB - timeA; // Newest / last entered data first
  });
}

export function formatFeedbackDateTime(dateString) {
  if (!dateString) return "";
  try {
    const d = parseFeedbackDate(dateString);

    const optionsDate = { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" };
    const optionsTime = { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true };

    const dayStr = d.toLocaleDateString("en-IN", optionsDate);
    const timeStr = d.toLocaleTimeString("en-IN", optionsTime).toLowerCase();

    return `${dayStr} • ${timeStr}`;
  } catch {
    return dateString;
  }
}

export default function FeedbackPage() {
  const navigate = useNavigate();

  // Instant retrieval from LocalStorage sorted descending — zero load flicker
  const [feedbacks, setFeedbacks] = useState(() => sortFeedbacksDesc(getCachedFeedbacks()));
  const [loading, setLoading] = useState(() => getCachedFeedbacks().length === 0);

  // Full Screen Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [modalText, setModalText] = useState("");
  const [initialModalText, setInitialModalText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Toast Notification (Top Right Corner)
  const [toastMessage, setToastMessage] = useState("");

  // Accordion Expand State
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Background sync with API
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const data = await fetchFeedbacks();
        if (isMounted && Array.isArray(data)) {
          setFeedbacks(sortFeedbacksDesc(data));
        }
      } catch (err) {
        console.error("[FeedbackPage] Fetch error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3200);
  };

  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingId(null);
    setModalText("");
    setInitialModalText("");
    setShowModal(true);
  };

  const handleOpenEditModal = (e, item) => {
    e?.stopPropagation();
    setModalMode("edit");
    setEditingId(item.id);
    setModalText(item.content || "");
    setInitialModalText(item.content || "");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setShowModal(false);
    setModalText("");
    setInitialModalText("");
    setEditingId(null);
  };

  const isSubmitDisabled =
    submitting ||
    !modalText.trim() ||
    (modalMode === "edit" && modalText.trim() === initialModalText.trim());

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const text = modalText.trim();
    if (!text) return;

    try {
      setSubmitting(true);
      if (modalMode === "edit" && editingId) {
        const updated = await updateFeedback(editingId, text);
        setFeedbacks((prev) =>
          sortFeedbacksDesc(prev.map((item) => (item.id === editingId ? updated : item)))
        );
        showToast("Feedback updated successfully!");
      } else {
        const created = await createFeedback(text);
        setFeedbacks((prev) => sortFeedbacksDesc([created, ...prev]));
        showToast("Feedback submitted successfully!");
      }
      setShowModal(false);
      setModalText("");
      setEditingId(null);
    } catch (err) {
      alert(err.message || "Failed to save feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="feedback-page">
      {/* Top Right Corner Toast Notification */}
      {toastMessage && (
        <div className="feedback-toast-top-right">
          <FiCheckCircle size={18} className="feedback-toast-icon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="feedback-header">
        <button
          type="button"
          className="feedback-back-btn"
          onClick={() => navigate("/profile")}
          aria-label="Go back"
        >
          <FiArrowLeft size={20} />
        </button>
        <h1 className="feedback-title">User Feedback</h1>
        <div style={{ width: 20 }} />
      </header>

      {/* Main Container */}
      <main className="feedback-container">
        {/* Green Gradient Action Button (shown only when feedbacks exist) */}
        {feedbacks.length > 0 && (
          <div className="feedback-action-bar">
            <button
              type="button"
              className="green-gradient-btn"
              onClick={handleOpenCreateModal}
            >
              <FiPlus size={18} />
              <span>Give us new feedback</span>
            </button>
          </div>
        )}

        {/* List or Empty State */}
        {loading && feedbacks.length === 0 ? (
          <div className="feedback-loading">
            <p>Loading feedbacks...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="feedback-empty-card">
            <div className="feedback-empty-icon">
              <FiMessageSquare size={36} />
            </div>
            <h3 className="feedback-empty-title">
              Add your first feedback if there is no feedback.
            </h3>
            <p className="feedback-empty-sub">
              We value your experience and continuous suggestions!
            </p>
            <button
              type="button"
              className="green-gradient-btn green-gradient-btn--centered"
              onClick={handleOpenCreateModal}
            >
              <FiPlus size={18} />
              <span>Give us new feedback</span>
            </button>
          </div>
        ) : (
          <div className="feedback-list">
            {feedbacks.map((item) => {
              const isExpanded = expandedCardId === item.id;

              return (
                <div
                  key={item.id}
                  className={`feedback-card ${isExpanded ? "feedback-card--expanded" : ""}`}
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="feedback-card__header">
                    <span className="feedback-card__date">
                      {formatFeedbackDateTime(item.created_at)}
                    </span>
                    <button
                      type="button"
                      className="feedback-card__chevron-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(item.id);
                      }}
                      aria-label="Toggle details"
                    >
                      <FiChevronDown
                        size={18}
                        className={`feedback-card__chevron ${isExpanded ? "feedback-card__chevron--rotated" : ""}`}
                      />
                    </button>
                  </div>

                  {/* Card Content (Snippet vs Full Expanded) */}
                  <div className="feedback-card__content-block">
                    <p
                      className={`feedback-card__text ${isExpanded ? "feedback-card__text--full" : "feedback-card__text--snippet"}`}
                    >
                      {item.content}
                    </p>

                    {isExpanded && (
                      <div className="feedback-card__expanded-actions">
                        <button
                          type="button"
                          className="feedback-edit-inline-btn"
                          onClick={(e) => handleOpenEditModal(e, item)}
                        >
                          <FiEdit3 size={15} />
                          <span>Edit Feedback</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Full Screen Popup Modal (Used for both Create and Edit) */}
      {showModal && (
        <div className="feedback-modal-overlay" onClick={handleCloseModal}>
          <div
            className="feedback-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="feedback-modal-header">
              <h3>{modalMode === "edit" ? "Edit Feedback" : "Give us new feedback"}</h3>
              <button
                type="button"
                className="feedback-modal-close"
                onClick={handleCloseModal}
                disabled={submitting}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="feedback-modal-form">
              <div className="feedback-modal-body">
                <label htmlFor="feedback-text" className="feedback-label">
                  {modalMode === "edit" ? "Your Feedback Content" : "Your Thoughts & Suggestions"}
                </label>
                <textarea
                  id="feedback-text"
                  className="feedback-textarea"
                  placeholder="Type your feedback here..."
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="feedback-modal-actions">
                <button
                  type="button"
                  className="feedback-cancel-btn"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="green-gradient-btn green-gradient-btn--modal"
                  disabled={isSubmitDisabled}
                >
                  {submitting
                    ? modalMode === "edit"
                      ? "Saving..."
                      : "Submitting..."
                    : modalMode === "edit"
                    ? "Save Changes"
                    : "Submit Feedback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
