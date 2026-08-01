import React, { useState, useRef } from "react";
import { FiEdit2, FiArrowLeft, FiPlus, FiCheck, FiX, FiChevronDown, FiSearch } from "react-icons/fi";
import { Dog, Cat, Rabbit, Bird, PawPrint } from "lucide-react";
import Cropper from "react-easy-crop";
import fetchWithAuth from "../../utils/fetchWithAuth";
import queryClient from "../../utils/queryClient";
import getCroppedImg from "../../utils/cropImage";
import { breedData } from "../ProfileCreation/constants";
import "./EditPetsList.css";

const EMPTY_FORM = {
  pet_name: "",
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
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [breedSearch, setBreedSearch] = useState("");
  const fileInputRef = useRef(null);

  // Cropper states
  const [isCropping, setIsCropping] = useState(false);
  const [tempImage, setTempImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = (croppedArea, pixels) => {
    setCroppedAreaPixels(pixels);
  };

  const startEdit = (pet) => {
    setEditingPetId(getPetId(pet));
    setPhotoFile(null);
    const existingBreed = pet.breed || "";
    setForm({
      pet_name: pet.pet_name || pet.name || "",
      breed: existingBreed,
      age: pet.approx_age || pet.age || "",
      pet_photo_url: pet.pet_photo_url || pet.image || "",
    });
  };

  const cancelEdit = () => {
    setEditingPetId(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setShowBreedModal(false);
    setBreedSearch("");
    setIsCropping(false);
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Max size to photo upload is 5MB");
      return;
    }
    const preview = URL.createObjectURL(file);
    setTempImage(preview);
    setIsCropping(true);
    e.target.value = "";
  };

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg(tempImage, croppedAreaPixels);
      if (!croppedBlob) {
        alert("Failed to crop image.");
        setIsCropping(false);
        return;
      }
      const croppedFile = new File([croppedBlob], "profile.jpg", { type: "image/jpeg" });
      const preview = URL.createObjectURL(croppedBlob);
      setPhotoFile(croppedFile);
      setForm((prev) => ({ ...prev, pet_photo_url: preview }));
      setIsCropping(false);
    } catch (err) {
      console.error("Crop save error:", err);
      setIsCropping(false);
    }
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setTempImage(null);
  };

  const handleSave = async (pet) => {
    setSaving(true);
    const petId = getPetId(pet);
    try {
      const updatePayload = {
        pet_name: form.pet_name,
        breed: form.breed,
        approx_age: form.age,
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

      queryClient.invalidateQueries({ queryKey: ["pets"] });

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

  const currentPetType = form.pet_type || "Dog";
  const fullBreedsList = breedData[currentPetType] || breedData["Dog"] || [];
  const filteredBreeds = fullBreedsList.filter((b) =>
    b.toLowerCase().includes(breedSearch.toLowerCase())
  );

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
        <h2 className="edit-pets-title">Manage Pets</h2>
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
                        {pet.breed && (
                          <span className="edit-pet-species">
                            {pet.breed}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {!isEditing && (
                    <button
                      className="edit-pet-delete-btn"
                      onClick={() => setDeletePetId(petId)}
                      type="button"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="edit-pet-form">

                    {/* NAME FIELD */}
                    <label className="edit-pet-field">
                      <span>Pet Name</span>
                      <input
                        type="text"
                        value={form.pet_name}
                        onChange={handleChange("pet_name")}
                        placeholder="Pet name"
                      />
                    </label>



                    {/* BREED FIELD - Custom In-App Picker */}
                    <label className="edit-pet-field">
                      <span>Breed</span>
                      <div
                        className="edit-pet-breed-trigger"
                        onClick={() => setShowBreedModal(true)}
                      >
                        <span className={form.breed ? "breed-val" : "breed-placeholder"}>
                          {form.breed || "Select Breed"}
                        </span>
                        <FiChevronDown size={18} color="#6b7280" />
                      </div>
                    </label>





                    {/* APPROX AGE FIELD */}
                    <label className="edit-pet-field">
                      <span>Approx Age</span>
                      <input
                        type="text"
                        value={form.age}
                        onChange={handleChange("age")}
                        placeholder="e.g. 2 Years 3 Months"
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

      {/* Root Level In-App Breed Picker Modal (matching onboarding Step2) */}
      {showBreedModal && (
        <div className="breed-modal-overlay" onClick={() => setShowBreedModal(false)}>
          <div className="breed-modal" onClick={(e) => e.stopPropagation()}>
            <div className="breed-modal-header">
              <h3>Select Breed</h3>
              <button
                type="button"
                className="breed-modal-close"
                onClick={() => setShowBreedModal(false)}
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="breed-modal-search">
              <FiSearch size={16} color="#9ca3af" />
              <input
                type="text"
                placeholder="Search breed..."
                value={breedSearch}
                onChange={(e) => setBreedSearch(e.target.value)}
                autoFocus
              />
            </div>

            <div className="breed-modal-list">
              {filteredBreeds.length > 0 ? (
                filteredBreeds.map((b) => (
                  <div
                    key={b}
                    className={`breed-modal-item ${form.breed === b ? "active" : ""}`}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, breed: b }));
                      setShowBreedModal(false);
                      setBreedSearch("");
                    }}
                  >
                    <span>{b}</span>
                    {form.breed === b && <FiCheck size={16} color="#1f7a3d" />}
                  </div>
                ))
              ) : (
                <div className="breed-modal-empty">No breeds found</div>
              )}

              <div
                className="breed-modal-item breed-modal-item--custom"
                onClick={() => {
                  const custom = prompt("Enter custom breed name:");
                  if (custom && custom.trim()) {
                    setForm((prev) => ({ ...prev, breed: custom.trim() }));
                  }
                  setShowBreedModal(false);
                  setBreedSearch("");
                }}
              >
                <span>+ Type custom breed...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Pet Modal */}
      {deletePetId && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <div className="delete-modal-icon">🐾</div>

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

      {/* Photo Crop Modal */}
      {isCropping && (
        <div className="crop-modal-overlay">
          <div className="crop-modal-content">
            <div className="crop-modal-header">
              <h3>Crop Photo</h3>
              <button type="button" className="crop-close-btn" onClick={handleCropCancel}>
                <FiX size={24} />
              </button>
            </div>
            
            <div className="crop-container">
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="crop-controls">
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="zoom-slider"
              />
            </div>
            
            <div className="crop-actions">
              <button type="button" className="crop-cancel-btn" onClick={handleCropCancel}>
                Cancel
              </button>
              <button type="button" className="crop-save-btn" onClick={handleCropSave}>
                <FiCheck size={18} /> Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPetsList;