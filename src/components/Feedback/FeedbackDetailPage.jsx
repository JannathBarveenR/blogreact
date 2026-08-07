import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiEdit3, FiTrash2, FiSave, FiX, FiCheckCircle } from "react-icons/fi";
import { fetchFeedbackById, updateFeedback, deleteFeedback } from "../../api/feedbackApi";
import { formatFeedbackDate } from "./FeedbackPage";
import "./FeedbackDetailPage.css";

export default function FeedbackDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadItem() {
      try {
        const item = await fetchFeedbackById(id);
        if (isMounted) {
          if (item) {
            setFeedback(item);
            setEditText(item.content);
          }
        }
      } catch (err) {
        console.error("Error loading feedback item:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadItem();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSave = async () => {
    const text = editText.trim();
    if (!text) return;

    try {
      setSaving(true);
      const updated = await updateFeedback(id, text);
      setFeedback(updated);
      setIsEditing(false);
      showToast("Feedback updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update feedback.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteFeedback(id);
      navigate("/feedback", { replace: true });
    } catch (err) {
      alert(err.message || "Failed to delete feedback.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  if (loading) {
    return (
      <div className="feedback-detail-page">
        <header className="feedback-header">
          <button type="button" className="feedback-back-btn" onClick={() => navigate("/feedback")}>
            <FiArrowLeft size={20} />
          </button>
          <h1 className="feedback-title">Feedback Detail</h1>
          <div style={{ width: 20 }} />
        </header>
        <div className="feedback-detail-loading">Loading details...</div>
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="feedback-detail-page">
        <header className="feedback-header">
          <button type="button" className="feedback-back-btn" onClick={() => navigate("/feedback")}>
            <FiArrowLeft size={20} />
          </button>
          <h1 className="feedback-title">Feedback Detail</h1>
          <div style={{ width: 20 }} />
        </header>
        <div className="feedback-detail-error">
          <p>Feedback entry not found or has been deleted.</p>
          <button type="button" className="green-gradient-btn" onClick={() => navigate("/feedback")}>
            Back to Feedbacks
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-detail-page">
      {/* Header */}
      <header className="feedback-header">
        <button type="button" className="feedback-back-btn" onClick={() => navigate("/feedback")}>
          <FiArrowLeft size={20} />
        </button>
        <h1 className="feedback-title">Feedback Detail</h1>
        <div style={{ width: 20 }} />
      </header>

      <main className="feedback-detail-container">
        {toastMessage && (
          <div className="feedback-toast">
            <FiCheckCircle size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="feedback-detail-card">
          <div className="feedback-detail-meta">
            <span className="feedback-detail-date">
              Submitted on: {formatFeedbackDate(feedback.created_at)}
            </span>
            {feedback.updated_at !== feedback.created_at && (
              <span className="feedback-detail-edited">(Edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="feedback-edit-container">
              <label htmlFor="edit-feedback-text" className="feedback-label">
                Edit Feedback Content
              </label>
              <textarea
                id="edit-feedback-text"
                className="feedback-textarea"
                rows={8}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
              />

              <div className="feedback-edit-actions">
                <button
                  type="button"
                  className="feedback-cancel-btn"
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(feedback.content);
                  }}
                  disabled={saving}
                >
                  <FiX size={16} /> Cancel
                </button>
                <button
                  type="button"
                  className="green-gradient-btn green-gradient-btn--modal"
                  onClick={handleSave}
                  disabled={saving || !editText.trim()}
                >
                  <FiSave size={16} />
                  <span>{saving ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="feedback-read-container">
              <div className="feedback-body-text">{feedback.content}</div>

              <div className="feedback-read-actions">
                <button
                  type="button"
                  className="feedback-secondary-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <FiEdit3 size={16} /> Edit Feedback
                </button>
                <button
                  type="button"
                  className="feedback-danger-btn"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <FiTrash2 size={16} /> Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="feedback-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="feedback-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-modal-header">
              <h3 style={{ color: "#d64545" }}>Delete Feedback</h3>
            </div>
            <p className="feedback-delete-prompt">
              Are you sure you want to delete this feedback? This action cannot be undone.
            </p>
            <div className="feedback-modal-actions">
              <button
                type="button"
                className="feedback-cancel-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="feedback-danger-confirm-btn"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
