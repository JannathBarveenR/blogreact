import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PetKonvaCard from '../PetKonvaCard/PetKonvaCard';
import './postidscreen.css';
import {
  Check,
  PawPrint,
  Heart,
  Home,
  FilePlus2,
  ChevronRight,
  Download,
} from 'lucide-react';

export default function PostIdScreen({ inlineData }) {
  const location = useLocation();
  const navigate = useNavigate();
  const konvaCardRef = useRef(null);

  const dataToUse = inlineData || location.state || {};

  const {
    petName = dataToUse.pet_name || dataToUse.name || 'Pet',
    petolifeId = dataToUse.petolife_id || dataToUse.pet_id || 'ID',
    petPhotoUrl = dataToUse.pet_photo_url || dataToUse.image || '',
    petType = dataToUse.pet_type || '',
    breed = dataToUse.breed || '',
    birthDate = dataToUse.birth_date || dataToUse.dob || '',
    approxAge = dataToUse.approx_age || dataToUse.age || '',
  } = dataToUse;

  // Parse owner name & phone from dataToUse or user metadata
  const getOwnerInfo = () => {
    let name = dataToUse.owner_name || dataToUse.pet_parent || dataToUse.owner_info?.full_name || '';
    let phone = dataToUse.owner_phone || dataToUse.owner_info?.phone || '';
    if (!name || name === 'Pet Parent') {
      const storedUserData = localStorage.getItem("user");
      if (storedUserData) {
        try {
          const userObj = JSON.parse(storedUserData);
          const fullName = userObj.user_metadata?.full_name || userObj.user_metadata?.first_name || userObj.full_name;
          if (fullName) {
            name = fullName;
            if (userObj.user_metadata?.last_name && !name.includes(userObj.user_metadata.last_name)) {
              name += ` ${userObj.user_metadata.last_name}`;
            }
          }
          phone = phone || userObj.phone || userObj.user_metadata?.phone || '';
        } catch {}
      }
    }
    return { name: name || 'Pet Parent', phone };
  };

  const ownerInfo = getOwnerInfo();

  const petDataForKonva = {
    ...dataToUse,
    pet_name: petName,
    petolife_id: petolifeId,
    pet_photo_url: petPhotoUrl,
    pet_type: petType,
    breed,
    birth_date: birthDate,
    approx_age: approxAge,
    owner_name: ownerInfo.name,
    pet_parent: ownerInfo.name,
    owner_phone: ownerInfo.phone,
  };

  const handleDownloadCard = () => {
    if (konvaCardRef.current) {
      konvaCardRef.current.downloadCard();
    }
  };

  const PawWatermarks = () => {
    const positions = [
      { top: '8%', left: '6%', size: 34, rotate: -18 },
      { top: '20%', right: '8%', size: 46, rotate: 14 },
      { top: '46%', left: '3%', size: 28, rotate: 8 },
      { bottom: '14%', right: '4%', size: 38, rotate: -10 },
      { bottom: '4%', left: '10%', size: 30, rotate: 20 },
    ];
    return (
      <div className="paw-watermarks" aria-hidden="true">
        {positions.map((pos, i) => (
          <PawPrint key={i} className="paw-watermark" style={{ ...pos, width: pos.size, height: pos.size }} />
        ))}
      </div>
    );
  };

  const ActionButton = ({ tone, icon, label, onClick }) => (
    <button type="button" className={`action action-${tone}`} onClick={onClick}>
      <span className="action-icon">{icon}</span>
      <span className="action-label">{label}</span>
      <span className="action-chevron">
        <ChevronRight size={16} strokeWidth={2.5} />
      </span>
    </button>
  );

  // If no data at all, redirect to home
  if (!inlineData && !location.state) {
    return (
      <div className="page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#fff', fontSize: '1rem' }}>No pet data found.</p>
        <button
          type="button"
          className="action action-primary"
          style={{ maxWidth: 260, marginTop: 16 }}
          onClick={() => navigate('/home')}
        >
          <span className="action-label">Go to Home</span>
        </button>
      </div>
    );
  }

  return (
    <div className="postid-screen-container">
      <div className="page">
        <PawWatermarks />

        {/* ── Celebration header ── */}
        <header className="postid-hero">
          <div className="hero-check-badge">
            <Check size={18} strokeWidth={3} color="#ffffff" />
          </div>
          <h1 className="title">Pet Health ID Created</h1>
          <p className="ribbon">
            <PawPrint size={14} />
            <span><strong>{petName}</strong> is now part of PetoLife</span>
            <Heart size={14} />
          </p>
        </header>

        {/* ── ID Card body (Rendered via Konva at 9:16 Story Aspect Ratio) ── */}
        <main className="postid-konva-card-container" style={{ display: 'flex', justifyContent: 'center', margin: '12px 0 20px' }}>
          <PetKonvaCard ref={konvaCardRef} petData={petDataForKonva} containerWidth={Math.min(350, window.innerWidth - 32)} />
        </main>

        {/* ── Action buttons ── */}
        <nav className="actions" aria-label="Next steps">
          <ActionButton
            tone="primary"
            icon={<Download size={18} strokeWidth={2.2} />}
            label="Download ID Card"
            onClick={handleDownloadCard}
          />
          <div className="action-row-2">
            <ActionButton
              tone="secondary"
              icon={<Home size={18} strokeWidth={2.2} />}
              label="Home"
              onClick={() => navigate('/home')}
            />
            <ActionButton
              tone="secondary"
              icon={<FilePlus2 size={18} strokeWidth={2.2} />}
              label="Records"
              onClick={() => navigate('/home', { state: { tab: 'medicalrecords' } })}
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

