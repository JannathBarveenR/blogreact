import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { PetAvatar } from '../common/PetAvatar';
import './petcard.css';
import logoImg from '../../assets/logo.webp';

export default function PetCard({ petData: propPetData }) {
  const [fullProfile, setFullProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerInfo, setOwnerInfo] = useState(null);

  useEffect(() => {
    const fetchFullProfile = async (petolifeId) => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
        const res = await fetch(`${API_BASE}/api/pet-profile/public/${encodeURIComponent(petolifeId)}`);
        if (res.ok) {
          const data = await res.json();
          setFullProfile(data);
        }
      } catch (err) {
        console.error("Failed to fetch full pet profile", err);
      } finally {
        setLoading(false);
      }
    };

    if (propPetData?.petolife_id) {
      fetchFullProfile(propPetData.petolife_id);
    } else {
      try {
        const localUser = localStorage.getItem('user');
        const userId = localUser ? JSON.parse(localUser).id : 'guest';
        const storedPets = JSON.parse(localStorage.getItem(`pets_${userId}`)) || [];
        const activeId = localStorage.getItem(`active_pet_id_${userId}`);
        const active = storedPets.find((p) => p.id === activeId) || storedPets[0];

        if (active?.petolife_id) {
          fetchFullProfile(active.petolife_id);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error('PetCard: failed to read pets from storage', e);
        setLoading(false);
      }
    }

    // Grab owner info from localStorage (fallback)
    try {
      const localUser = localStorage.getItem('user');
      if (localUser) {
        const parsed = JSON.parse(localUser);
        setOwnerInfo({
          name: parsed.user_metadata?.full_name || '',
          email: parsed.email || '',
          phone: parsed.phone || parsed.user_metadata?.phone || '',
        });
      }
    } catch (e) {
      console.error('PetCard: failed to read owner info', e);
    }
  }, [propPetData]);

  if (loading) return <div className="petcard-id-wrapper loading">Loading pet ID...</div>;
  if (!fullProfile) return <div className="petcard-id-wrapper empty">No pet profile available.</div>;

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
  const qrUrl = fullProfile.petolife_id
    ? `${API_BASE}/api/pet-profile/by-petolife-id/${encodeURIComponent(fullProfile.petolife_id)}`
    : '';

  // Compute age from birth_date
  const getAge = (birthDate) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months >= 12) {
      const years = Math.floor(months / 12);
      return `${years} Year${years > 1 ? 's' : ''}`;
    }
    return `${months} Month${months !== 1 ? 's' : ''}`;
  };

  const age = getAge(fullProfile.birth_date);

  // Find microchip ID from pet_ids
  const microchipId = fullProfile.pet_ids?.find(
    (id) => id.id_name?.toLowerCase().includes('microchip')
  )?.id_number;

  // Format registration date
  const regDate = fullProfile.created_at
    ? new Date(fullProfile.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  // Owner info formatting (prioritize backend owner_info, fallback to local)
  const backendOwner = fullProfile.owner_info;
  const ownerPhone = backendOwner?.phone || ownerInfo?.phone || fullProfile.care_team?.owner_phone || '';
  const ownerEmail = backendOwner?.email || ownerInfo?.email || '';

  return (
    <div className="petcard-id-outer">
      <div className="petcard-id-card">
        {/* ── Header ── */}
        <header className="pc-header">
          <img src={logoImg} alt="PetoLife" className="pc-header-logo" />
          <div className="pc-header-center">
            <div className="pc-header-title-row">
              <span className="pc-header-line" />
              <span className="pc-shield-badge">
                <PawShieldIcon />
              </span>
              <h2 className="pc-header-title">PET ID CARD</h2>
              <span className="pc-header-line" />
            </div>
            <p className="pc-header-tagline">A lifetime of love, care &amp; responsibility.</p>
          </div>
        </header>

        {/* ── Body ── */}
        <div className="pc-body">
          {/* Top Row: Photo and QR Code */}
          <div className="pc-top-row">
            <div className="pc-photo-section">
              <div className="pc-photo-frame">
                <PetAvatar
                  src={fullProfile.pet_photo_url}
                  petType={fullProfile.pet_type}
                  className={fullProfile.pet_photo_url ? "pc-photo" : "pc-photo-placeholder"}
                  size="100%"
                  iconColor="#0c6b3a"
                />
              </div>
            </div>

            {qrUrl && (
              <div className="pc-qr-section">
                <div className="pc-qr-frame">
                  <QRCodeSVG
                    value={qrUrl}
                    style={{ width: '100%', height: '100%' }}
                    bgColor="transparent"
                    fgColor="#1a3a2a"
                    level="M"
                    imageSettings={{
                      src: '',
                      height: 0,
                      width: 0,
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Center: Pet Details */}
          <div className="pc-details-section">
            <div className="pc-name-row">
              <h1 className="pc-pet-name">{fullProfile.pet_name}</h1>
              <PawIcon size={20} />
            </div>
            {fullProfile.breed && (
              <div className="pc-breed-badge">{fullProfile.breed}</div>
            )}

            <div className="pc-info-list">
              {age && (
                <InfoRow icon={<CalendarIcon />} label="Age" value={age} />
              )}
              {fullProfile.gender && (
                <InfoRow icon={<GenderIcon />} label="Gender" value={fullProfile.gender} />
              )}
              <InfoRow
                icon={<IdIcon />}
                label="Pet ID"
                value={fullProfile.petolife_id || 'Pending'}
                bold
              />
              {microchipId && (
                <InfoRow icon={<ChipIcon />} label="Microchip ID" value={microchipId} />
              )}
              {regDate && (
                <InfoRow icon={<RegIcon />} label="Registered on" value={regDate} />
              )}
            </div>
          </div>

          {/* Right: Parent Details + QR */}
          <div className="pc-parent-section">
            {(ownerPhone || ownerEmail) && (
              <div className="pc-parent-card">
                <div className="pc-parent-header">
                  <ParentIcon />
                  <span>PET PARENT DETAILS</span>
                </div>
                <div className="pc-parent-info-list">
                  {ownerPhone && (
                    <ParentRow icon={<PhoneIcon />} label="Phone" value={ownerPhone} />
                  )}
                  {ownerEmail && (
                    <ParentRow icon={<MailIcon />} label="Email" value={ownerEmail} />
                  )}
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function InfoRow({ icon, label, value, bold }) {
  return (
    <div className="pc-info-row">
      <span className="pc-info-icon">{icon}</span>
      <span className="pc-info-label">{label}</span>
      <span className="pc-info-colon">:</span>
      <span className={`pc-info-value ${bold ? 'bold' : ''}`}>{value}</span>
    </div>
  );
}

function ParentRow({ icon, label, value }) {
  return (
    <div className="pc-parent-row">
      {icon}
      <span className="pc-parent-label">{label}</span>
      <span className="pc-parent-colon">:</span>
      <span className="pc-parent-value">{value}</span>
    </div>
  );
}

/* ── SVG Icons ── */

function PawIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#0c6b3a">
      <path d="M12 22c-1.5 0-2.8-.5-3.8-1.3-.5-.4-.8-1-1-1.6-.6-1.7.2-3.5 1.4-4.7.8-.8 1.5-1.7 2-2.7.2-.5.8-.7 1.4-.7s1.1.2 1.4.7c.5 1 1.2 1.9 2 2.7 1.2 1.2 2 3 1.4 4.7-.2.6-.5 1.2-1 1.6-1 .8-2.3 1.3-3.8 1.3zM4.5 12C3.1 12 2 10.9 2 9.5S3.1 7 4.5 7 7 8.1 7 9.5 5.9 12 4.5 12zM9 7.5C7.6 7.5 6.5 6.4 6.5 5S7.6 2.5 9 2.5s2.5 1.1 2.5 2.5S10.4 7.5 9 7.5zM15 7.5c-1.4 0-2.5-1.1-2.5-2.5S13.6 2.5 15 2.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zM19.5 12c-1.4 0-2.5-1.1-2.5-2.5S18.1 7 19.5 7 22 8.1 22 9.5 20.9 12 19.5 12z" />
    </svg>
  );
}

function PawShieldIcon({ small }) {
  const s = small ? 18 : 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6v5c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4z" fill="#0c6b3a"/>
      <path d="M12 17c-.9 0-1.6-.3-2.2-.8-.3-.2-.5-.6-.6-1-.4-1 .1-2 .8-2.7.5-.5.9-1 1.2-1.6.1-.3.5-.4.8-.4s.6.1.8.4c.3.6.7 1.1 1.2 1.6.7.7 1.2 1.7.8 2.7-.1.4-.3.7-.6 1-.6.5-1.3.8-2.2.8zM9.2 12.5c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4zM11.2 10.2c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4zM14.8 12.5c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4zM12.8 10.2c-.8 0-1.4-.6-1.4-1.4s.6-1.4 1.4-1.4 1.4.6 1.4 1.4-.6 1.4-1.4 1.4z" fill="#fff"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c6b3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function GenderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c6b3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="10" r="6"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/>
    </svg>
  );
}

function IdIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#0c6b3a">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9V7h2v10zm4 0h-2V7h2v10z"/>
    </svg>
  );
}

function ChipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c6b3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="2" x2="9" y2="4"/><line x1="15" y1="2" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="22"/><line x1="15" y1="20" x2="15" y2="22"/><line x1="20" y1="9" x2="22" y2="9"/><line x1="20" y1="15" x2="22" y2="15"/><line x1="2" y1="9" x2="4" y2="9"/><line x1="2" y1="15" x2="4" y2="15"/>
    </svg>
  );
}

function RegIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0c6b3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function ParentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0c6b3a">
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#0c6b3a">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0c6b3a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
    </svg>
  );
}

function CurvedArrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="pc-curved-arrow">
      <path d="M7 17c3-4 6-3 10-1"/>
      <polyline points="14 13 17 16 14 19"/>
    </svg>
  );
}
