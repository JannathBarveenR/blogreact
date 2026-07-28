import { useRef, useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import PetKonvaCard from "../PetKonvaCard/PetKonvaCard";
import "./PetIdCardModal.css";

const PetIdCardModal = ({
  pet,
  owner,
  onClose,
}) => {
  const konvaRef = useRef(null);
  const [modalWidth, setModalWidth] = useState(380);

  useEffect(() => {
    const updateWidth = () => {
      const w = Math.min(380, window.innerWidth - 32);
      setModalWidth(w > 260 ? w : 260);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  if (!pet) return null;

  const petolifeId =
    pet.petolife_id ||
    pet.petolifeId ||
    pet.pet_id ||
    pet.id ||
    "";

  const getOwnerName = () => {
    if (pet?.owner_name && pet.owner_name !== "Pet Parent") return pet.owner_name;
    if (pet?.pet_parent && pet.pet_parent !== "Pet Parent") return pet.pet_parent;
    if (pet?.owner_info?.owner_name && pet.owner_info.owner_name !== "Pet Parent") return pet.owner_info.owner_name;
    if (pet?.owner_info?.full_name && pet.owner_info.full_name !== "Pet Parent") return pet.owner_info.full_name;

    if (owner) {
      if (owner.full_name) return owner.full_name;
      if (owner.name) return owner.name;
      if (owner.user_metadata?.full_name) return owner.user_metadata.full_name;
      if (owner.user_metadata?.name) return owner.user_metadata.name;
      if (owner.user_metadata?.first_name) {
        return `${owner.user_metadata.first_name} ${owner.user_metadata.last_name || ""}`.trim();
      }
    }

    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u.full_name) return u.full_name;
        if (u.name) return u.name;
        if (u.user_metadata?.full_name) return u.user_metadata.full_name;
        if (u.user_metadata?.name) return u.user_metadata.name;
        if (u.user_metadata?.first_name) {
          return `${u.user_metadata.first_name} ${u.user_metadata.last_name || ""}`.trim();
        }
      }
    } catch {}

    return "Pet Parent";
  };

  const resolvedOwnerName = getOwnerName();

  const petDataForKonva = {
    ...pet,
    pet_name: pet.pet_name || pet.name || "Pet",
    petolife_id: petolifeId,
    pet_photo_url: pet.pet_photo_url || pet.image || "",
    pet_type: pet.pet_type || pet.type || "",
    breed: pet.breed || pet.pet_breed || "",
    birth_date: pet.birth_date || pet.birthDate || pet.dob || "",
    approx_age: pet.approx_age || pet.approxAge || pet.age || "",
    owner_name: resolvedOwnerName,
    pet_parent: resolvedOwnerName,
    owner_phone: owner?.phone || owner?.user_metadata?.phone || pet.owner_phone || "",
  };

  const handleDownload = () => {
    if (konvaRef.current) {
      konvaRef.current.downloadCard();
    }
  };

  return (
    <div className="pid-overlay" onClick={onClose}>
      <div className="pid-card-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="pid-modal-top-bar">
          <button className="pid-close" onClick={onClose} type="button" aria-label="Close">
            <FiX />
          </button>
        </div>

        <PetKonvaCard ref={konvaRef} petData={petDataForKonva} containerWidth={modalWidth} />

        <button
          type="button"
          onClick={handleDownload}
          className="pid-download-btn"
        >
          Download ID Card
        </button>
      </div>
    </div>
  );
};

export default PetIdCardModal;