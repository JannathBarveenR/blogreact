import React, { useState, useEffect } from "react";
import { FiEdit2, FiCheck, FiX, FiTrash2 } from "react-icons/fi";
import fetchWithAuth from "../../utils/fetchWithAuth";
import { PetAvatar } from "../common/PetAvatar";
import { petTypes, breedData } from "../ProfileCreation/constants";
import "./EditablePetCard.css";

import calendarIcon from "../Home/ProfileCard/calendar-icon.png";
import maleIcon from "../Home/ProfileCard/male-icon.png";
import femaleIcon from "../Home/ProfileCard/female-icon.png";
import pawIcon from "../Home/ProfileCard/paw-icon.png";

const EditablePetCard = ({ pet, onUpdate, onClose }) => {
  const [profile, setProfile] = useState({
    pet_name: "",
    breed: "",
    gender: "",
    birth_date: "",
    approx_age: "",
    weight: "",
    color: "",
    blood_group: "",
    pet_photo_url: ""
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (pet) {
      setProfile({
        pet_name: pet.pet_name || pet.name || "",
        breed: pet.breed || "",
        gender: pet.gender || "",
        birth_date: pet.birth_date || "",
        approx_age: pet.approx_age || pet.age || "",
        weight: pet.weight || "",
        color: pet.color || "",
        blood_group: pet.blood_group || "",
        pet_photo_url: pet.pet_photo_url || pet.image || ""
      });
    }
  }, [pet]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !pet?.id) return;
    
    // Optimistic UI
    const objectUrl = URL.createObjectURL(file);
    setProfile(prev => ({ ...prev, pet_photo_url: objectUrl }));
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetchWithAuth(`/api/pet-profile/${pet.id}/photo`, {
        method: "POST",
        body: formData,
        headers: {} 
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(prev => ({ ...prev, pet_photo_url: data.pet_photo_url }));
        // Removed onUpdate() call so the modal doesn't close/reload immediately
      } else {
        alert("Failed to upload pet photo.");
      }
    } catch (err) {
      console.error("Error uploading pet photo:", err);
    }
  };

  const handleSave = async () => {
    if (!pet?.id) return;
    
    // Validation
    if (!profile.birth_date && !profile.approx_age) {
      setError("Please enter either Date of Birth or Approx Age");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updatePayload = {
        pet_name: profile.pet_name,
        breed: profile.breed,
        gender: profile.gender,
        birth_date: profile.birth_date,
        approx_age: profile.approx_age,
        weight: profile.weight ? parseFloat(profile.weight) : null,
        color: profile.color,
        blood_group: profile.blood_group
      };
      
      const res = await fetchWithAuth(`/api/pet-profile/${pet.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (res.ok) {
        if (onUpdate) onUpdate(); // Refresh parent data
      } else {
        setError("Failed to update pet profile.");
      }
    } catch (err) {
      console.error("Error updating pet profile:", err);
      setError("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (onClose) onClose();
  };

  const handleDelete = async () => {
    if (!pet?.id) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/api/pet-profile/${pet.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        if (onUpdate) onUpdate(); // Refresh parent data (this should remove the pet from the list)
      } else {
        setError("Failed to delete pet profile.");
      }
    } catch (err) {
      console.error("Error deleting pet profile:", err);
      setError("An error occurred while deleting.");
    } finally {
      setSaving(false);
    }
  };

  if (!pet) return null;

  const genderIcon = profile.gender?.toLowerCase() === "female" ? femaleIcon : maleIcon;

  return (
    <div className="editable-modal-content">
      <div className="modal-header" style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a' }}>Edit Pet Details</h3>
        <button className="close-icon-btn" onClick={cancelEdit}>
          <FiX size={20} />
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="modal-body">
        <div className="avatar-section" style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div className="avatar-wrapper pet-avatar" style={{ position: 'relative', width: '84px', height: '84px' }}>
            <PetAvatar
              src={profile.pet_photo_url}
              petType={pet.pet_type}
              className="avatar-image"
              size={84}
            />
            <label htmlFor="pet-avatar-upload" className="pet-edit-icon" style={{ cursor: 'pointer', background: '#138a36', color: 'white', padding: '6px', borderRadius: '50%', position: 'absolute', bottom: '-4px', right: '-4px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <FiEdit2 size={14} />
            </label>
            <input
              id="pet-avatar-upload"
              type="file"
              accept="image/*"
              className="hidden-input"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="details-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="form-group">
            <label style={{ fontSize: '11px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Name</label>
            <input type="text" name="pet_name" value={profile.pet_name} onChange={handleChange} className="modal-input" placeholder="Pet Name" />
          </div>
          
          <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '11px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Breed</label>
              {breedData[pet.pet_type] ? (
                <select name="breed" value={profile.breed} onChange={handleChange} className="modal-input">
                  <option value="">Select Breed</option>
                  {breedData[pet.pet_type].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              ) : (
                <input type="text" name="breed" value={profile.breed} onChange={handleChange} className="modal-input" placeholder="Breed" />
              )}
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Gender</label>
              <select name="gender" value={profile.gender} onChange={handleChange} className="modal-input">
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Date of Birth</label>
              <input type="date" name="birth_date" value={profile.birth_date} max={new Date().toISOString().split("T")[0]} onChange={handleChange} className="modal-input" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Approx Age</label>
              <input type="text" name="approx_age" value={profile.approx_age} onChange={handleChange} className="modal-input" placeholder="e.g. 2y 5m" />
            </div>
          </div>

          <div className="form-row" style={{ display: 'flex', gap: '12px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Weight (kg)</label>
              <input type="number" step="0.1" name="weight" value={profile.weight} onChange={handleChange} className="modal-input" placeholder="0.0" />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Blood Group</label>
              <input type="text" name="blood_group" value={profile.blood_group} onChange={handleChange} className="modal-input" placeholder="Unknown" />
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', color: '#666', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Color / Markings</label>
            <input type="text" name="color" value={profile.color} onChange={handleChange} className="modal-input" placeholder="e.g. Brown with white spots" />
          </div>
        </div>
      </div>

      {!showConfirmDelete ? (
        <div className="modal-footer" style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'space-between', borderTop: '1px solid #eaeaea', paddingTop: '12px', alignItems: 'center' }}>
          <button className="btn-remove-pet" onClick={() => setShowConfirmDelete(true)} disabled={saving} style={{ color: '#d32f2f', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '10px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <FiTrash2 size={16} /> Remove Pet
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-cancel-modal" onClick={cancelEdit} disabled={saving}>
              Cancel
            </button>
            <button className="btn-save-modal" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      ) : (
        <div className="modal-footer" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #eaeaea', paddingTop: '12px' }}>
          <p style={{ margin: 0, color: '#d32f2f', fontWeight: 600, fontSize: '13px', textAlign: 'center' }}>Are you sure you want to permanently delete this pet?</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn-cancel-modal" onClick={() => setShowConfirmDelete(false)} disabled={saving}>
              No, Keep
            </button>
            <button className="btn-save-modal" onClick={handleDelete} disabled={saving} style={{ background: '#d32f2f', color: '#fff', boxShadow: 'none' }}>
              {saving ? "Removing..." : "Yes, Remove"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditablePetCard;
