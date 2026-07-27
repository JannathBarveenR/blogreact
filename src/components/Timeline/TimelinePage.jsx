import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./TimelinePage.css";

import ProfileCard from "../Home/ProfileCard/ProfileCard";
import FilterChips from "./FilterChips";
import TimelineCard from "./TimelineCard";
import EmptyTimeline from "./EmptyTimeline";
import AddPawNote from "./AddPawNote/AddPawNote";
import DocumentModal from "./DocumentModal";
import { useTimeline } from "../../hooks/useTimelineQueries";
import { useQueryClient } from "@tanstack/react-query";

/* ── date-group helper ──────────────────────────────────────────── */
function groupByDate(events) {
  const groups = {};
  for (const ev of events) {
    const d = ev.date_logged || "Unknown";
    if (!groups[d]) groups[d] = [];
    groups[d].push(ev);
  }
  return Object.entries(groups).sort(([a], [b]) => (b > a ? 1 : -1));
}

function formatDateHeader(dateStr) {
  if (!dateStr || dateStr === "Unknown") return "Unknown Date";
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today - target) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-IN", { weekday: "long" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

/* ── component ──────────────────────────────────────────────────── */
export default function TimelinePage({
  pets = [],
  activePetId,
  onPetSelect,
  onAddPet,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [filter, setFilter] = useState("all");
  const [showAddNote, setShowAddNote] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    if (location.state?.openAddNote) {
      setShowAddNote(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const selectedPet = pets.find((p) => p.id === activePetId) || pets[0] || null;
  const petName = selectedPet?.pet_name || selectedPet?.name || "";

  /* ── TanStack Query feed ────────────────────────────────────────── */
  const { data: timelineData, isLoading: loading, isError } = useTimeline(selectedPet?.id, "chronological");
  const rawEvents = timelineData?.events || [];
  const rawEventsCount = rawEvents.length;

  const events = filter === "all"
    ? rawEvents
    : rawEvents.filter((e) => e.category === filter);

  const error = isError ? "Unable to load timeline. Please try again." : null;

  /* ── handlers ──────────────────────────────────────────────────── */
  const queryClient = useQueryClient();
  const handleAddNote = () => setShowAddNote(true);
  const handleCloseAddNote = () => {
    setShowAddNote(false);
    queryClient.invalidateQueries({ queryKey: ["timeline"] });
  };

  const handleCardClick = (entry) => {
    const targetId = entry.event_id || entry.medical_event_id || entry.id || entry.visit_group_id;
    const petId = entry.pet_id || selectedPet?.id;
    if (targetId) {
      navigate(`/timeline/event/${targetId}`, { state: { petId } });
    }
  };

  /* ── Add Paw Note overlay ──────────────────────────────────────── */
  if (showAddNote) {
    return (
      <AddPawNote
        petId={selectedPet?.id}
        petName={petName}
        onClose={handleCloseAddNote}
        onSaved={handleCloseAddNote}
      />
    );
  }

  /* ── no pets ───────────────────────────────────────────────────── */
  if (!selectedPet) {
    return (
      <div className="tl-page">
        <div className="tl-page__empty-pets">
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#cbd5e1" }}>
            pets
          </span>
          <p>Add a pet to start tracking their health timeline.</p>
          <button className="tl-page__add-pet-btn" onClick={onAddPet}>
            Add Your First Pet
          </button>
        </div>
      </div>
    );
  }

  /* ── grouped events ────────────────────────────────────────────── */
  const dateGroups = groupByDate(events);

  return (
    <div className="tl-page">
      {/* Pet Switcher Header Card */}
      <div className="tl-page__pets">
        <ProfileCard
          pets={pets}
          selectedPet={selectedPet}
          handlePetSelect={onPetSelect}
          onAddPet={onAddPet}
          onAddPetNote={handleAddNote}
          onUploadRecords={() => navigate("/records", { state: { openUpload: true } })}
        />
      </div>

      {/* Section Title */}
      <div className="tl-page__title-row">
        <h2 className="tl-page__title">
          <span className="tl-page__title-name">{petName}'s</span> Timeline
        </h2>
        <div className="tl-page__title-dot" />
      </div>

      {/* Filter Chips */}
      <FilterChips activeFilter={filter} onFilterChange={setFilter} />

      {/* Content */}
      <div className="tl-page__content">
        {loading ? (
          <div className="tl-page__loading">
            <div className="tl-page__spinner" />
            <span>Loading timeline…</span>
          </div>
        ) : error ? (
          <div className="tl-page__error">
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#f59e0b" }}>
              warning
            </span>
            <p>{error}</p>
            <button className="tl-page__retry" onClick={fetchFeed}>Retry</button>
          </div>
        ) : events.length === 0 ? (
          <EmptyTimeline
            petName={petName}
            totalEventsCount={rawEventsCount}
            activeFilter={filter}
            onAddNote={handleAddNote}
            onClearFilter={() => setFilter("all")}
          />
        ) : (
          <div className="tl-page__feed">
            {dateGroups.map(([date, entries]) => (
              <div key={date} className="tl-page__date-group">
                <div className="tl-page__date-header">
                  <div className="tl-page__date-line" />
                  <span className="tl-page__date-label">{formatDateHeader(date)}</span>
                  <div className="tl-page__date-line" />
                </div>
                <div className="tl-page__cards">
                  {entries.map((entry) => (
                    <TimelineCard
                      key={entry.entry_id || entry.event_id}
                      entry={entry}
                      onClick={handleCardClick}
                      onPreviewDoc={(doc) => setPreviewDoc(doc)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      {events.length > 0 && (
        <button className="tl-page__fab" onClick={handleAddNote}>
          <span className="material-symbols-outlined tl-page__fab-icon">add</span>
          <span className="tl-page__fab-text">Add Pet Note</span>
        </button>
      )}

      {/* Document Preview Lightbox Modal */}
      {previewDoc && (
        <DocumentModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}