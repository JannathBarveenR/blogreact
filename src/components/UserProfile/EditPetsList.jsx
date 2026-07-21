import React, { useState, useRef } from "react";
import { FiEdit2, FiArrowLeft, FiPlus, FiCheck, FiX } from "react-icons/fi";
import { Dog, Cat, Rabbit, Bird, PawPrint } from "lucide-react";
import fetchWithAuth from "../../utils/fetchWithAuth";
import queryClient from "../../utils/queryClient";
import "./EditPetsList.css";
const EMPTY_FORM = {
  pet_name: "",
  species: "",
  breed: "",
  age: "",
  pet_photo_url: "",
};

const getPetId = (pet) => pet?.id ?? pet?._id ?? pet?.pet_id;

const EditPetsList = ({
  pets = [],
  onAddPet,
  onBack,
  onUpdatePet,
  onDeletePet,
}) => {
  const [editingPetId, setEditingPetId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletePetId, setDeletePetId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const fileInputRef = useRef(null);

  const startEdit = (pet) => {
    setEditingPetId(getPetId(pet));
    setPhotoFile(null);
    setForm({
      pet_name: pet.pet_name || pet.name || "",
      species: pet.species || pet.pet_type || "",
      breed: pet.breed || "",
      age: pet.age || pet.approx_age || "",
      pet_photo_url: pet.pet_photo_url || pet.image || "",
    });
  };

  const cancelEdit = () => {
    setEditingPetId(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setForm((prev) => ({ ...prev, pet_photo_url: URL.createObjectURL(file) }));
  };

  const handleSave = async (pet) => {
    setSaving(true);
    const petId = getPetId(pet);
    try {
      const updatePayload = {
        pet_name: form.pet_name,
        breed: form.breed,
        birth_date: form.age, // Backend supports birth_date string which resolves to age
      };

      const res = await fetchWithAuth(`/api/pet-profile/${petId}`, {
        method: "PATCH",
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        throw new Error("Failed to update pet profile");
      }

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        await fetchWithAuth(`/api/pet-profile/${petId}/photo`, {
          method: "POST",
          body: formData,
        });
      }

      // Force UI refresh instantly
      queryClient.invalidateQueries({ queryKey: ["pets"] });

      // Call parent if it needs to do anything (like close modal)
      if (onUpdatePet) {
        await onUpdatePet(pet, photoFile);
      }
      cancelEdit();
    } catch (err) {
      console.error("Failed to save pet:", err);
      alert("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };
  const getPetPhoto = (pet) => pet.pet_photo_url || pet.image || null;

const getPetIcon = (pet) => {
  const type = (pet.species || pet.pet_type || pet.type || "")
    .toLowerCase()
    .trim();

  switch (type) {
    case "dog":
      return Dog;

    case "cat":
      return Cat;

    case "rabbit":
    case "bunny":
      return Rabbit;

    case "bird":
    case "parrot":
      return Bird;

    default:
      return PawPrint;
  }
};
const handleDelete = async () => {
  if (!deletePetId) return;

  setDeleting(true);

  try {
    const res = await fetchWithAuth(`/api/pet-profile/${deletePetId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete pet");
    }

    // Instantly remove from the cache so it vanishes from the UI
    queryClient.invalidateQueries({ queryKey: ["pets"] });

    if (onDeletePet) {
      await onDeletePet(deletePetId);
    }

    if (editingPetId === deletePetId) {
      cancelEdit();
    }

    setDeletePetId(null);
  } catch (err) {
    console.error("Failed to delete pet:", err);
    alert("Could not delete pet.");
  } finally {
    setDeleting(false);
  }
};

  return (
    <div className="edit-pets-page">
      <button
        className="edit-pets-back-btn"
        onClick={onBack}
        type="button"
        aria-label="Go back"
      >
        <FiArrowLeft size={18} />
      </button>

      <div>
        <h2 className="edit-pets-title">
          Manage Pets
        </h2>
      </div>


      <p className="edit-pets-subtitle">
        Choose a pet to update their details, photo, or care info.
      </p>

      {pets.length === 0 ? (
        <div className="edit-pets-empty">
          <div className="edit-pets-empty-icon">
  <PawPrint size={72} strokeWidth={1.8} />
</div>
          <h4>No pets to edit yet</h4>
          <p>Add a pet first, then come back here to update their details.</p>
          <button className="edit-pets-add-btn" onClick={onAddPet}>
            <FiPlus size={16} /> Add New Pet
          </button>
        </div>
      ) : (
        <div className="edit-pets-list">
          {pets.map((pet) => {
            const name = pet.pet_name || pet.name || "Unnamed";
            const photo = getPetPhoto(pet);
const PetIcon = getPetIcon(pet);
            const species = pet.species || pet.pet_type || "";
            const petId = getPetId(pet);
            const isEditing = editingPetId === petId;

            return (
              <div
                className={`edit-pet-card${isEditing ? " is-editing" : ""}`}
                key={petId}
              >
                <div className="edit-pet-card-row">
                  <div className="edit-pet-left">
                    <div
                      className="edit-pet-avatar-wrapper"
                      onClick={() => isEditing && fileInputRef.current?.click()}
                      style={isEditing ? { cursor: "pointer" } : undefined}
                    >
                      {(isEditing ? form.pet_photo_url : photo) ? (
                        <img
                          src={isEditing ? form.pet_photo_url : photo}
                          alt={name}
                          className="edit-pet-avatar"
                        />
                      ) : (
                        <div className="edit-pet-avatar edit-pet-avatar-placeholder">
                          <PetIcon size={34} strokeWidth={2} />
                        </div>
                      )}

                      {!isEditing && (
                        <button
                          className="edit-pet-pencil"
                          aria-label={`Edit ${name}`}
                          onClick={() => startEdit(pet)}
                        >
                          <FiEdit2 size={13} />
                        </button>
                      )}

                      {isEditing && (
                        <>
                          <div className="edit-pet-pencil">
                            <FiEdit2 size={13} />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            style={{ display: "none" }}
                          />
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="edit-pet-info">
                        <span className="edit-pet-name">{name}</span>
                        {species && (
                          <span className="edit-pet-species">
                            {species}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <button
                      className="edit-pet-delete-btn"
                      
                      onClick={() => {
                        console.log("clicked", petId);
                        setDeletePetId(petId)}}
                      type="button"
                    >
                      Remove
                    </button>
                  )}
                </div>


                {isEditing && (
                  <div className="edit-pet-form">
                    
                    <label className="edit-pet-field">
                      <span>Name</span>
                      <input
                        type="text"
                        value={form.pet_name}
                        onChange={handleChange("pet_name")}
                        placeholder="Pet name"
                      />
                    </label>

                    <div className="edit-pet-field-grid">
                      <label className="edit-pet-field">
                        <span>Species</span>
                        <input
                          type="text"
                          value={form.species}
                          onChange={handleChange("species")}
                          placeholder="Dog, Cat..."
                        />
                      </label>
                      <label className="edit-pet-field">
                        <span>Breed</span>
                        <input
                          type="text"
                          value={form.breed}
                          onChange={handleChange("breed")}
                          placeholder="Breed"
                        />
                      </label>
                    </div>

                    <label className="edit-pet-field">
                      <span>Age</span>
                      <input
                        type="text"
                        value={form.age}
                        onChange={handleChange("age")}
                        placeholder="e.g. 2 years"
                      />
                    </label>

                    <div className="edit-pet-form-actions">
                      <button
                        className="edit-pet-cancel-btn"
                        onClick={cancelEdit}
                        disabled={saving}
                        type="button"
                      >
                        <FiX size={14} /> Cancel
                      </button>
                      <button
                        className="edit-pet-save-btn"
                        onClick={() => handleSave(pet)}
                        disabled={saving}
                        type="button"
                      >
                        <FiCheck size={14} /> {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="edit-pet-add-card" onClick={onAddPet}>
            <div className="edit-pet-add-circle">
              <FiPlus size={24} />
            </div>
            <span className="edit-pet-name">Add New Pet</span>
          </div>
        </div>
      )}
    {deletePetId && (
      <div className="delete-modal-overlay">
        <div className="delete-modal">
          <div className="delete-modal-icon">
            🐾
          </div>

          <h3>Remove Pet?</h3>

          <p>
            Are you sure you want to remove this pet?
            This action cannot be undone.
          </p>

          <div className="delete-modal-actions">
            <button
              className="delete-cancel-btn"
              onClick={() => setDeletePetId(null)}
              disabled={deleting}
            >
              Cancel
            </button>

            <button
              className="delete-confirm-btn"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Removing..." : "Remove"}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

  
};

export default EditPetsList;