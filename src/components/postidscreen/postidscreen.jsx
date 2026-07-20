import React, { useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import PetCard from '../petcard/petcard';
import './postidscreen.css';
import { QRCodeSVG } from 'qrcode.react';
import { PetAvatar } from '../common/PetAvatar';
import polLogo from '../../assets/logo-with-tagline.webp';
import {
  Check,
  PawPrint,
  Heart,
  Home,
  FilePlus2,
  ChevronRight,
  Copy,
  CheckCircle2,
  Download,
} from 'lucide-react';

export default function PostIdScreen({ inlineData }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [copiedId, setCopiedId] = useState(false);

  const dataToUse = inlineData || location.state || {};

  const {
    petName = 'Pet',
    petolifeId = 'ID',
    petPhotoUrl = '',
    petType = '',
  } = dataToUse;

  const qrValue = `${window.location.origin}/api/pet-profile/by-petolife-id/${encodeURIComponent(petolifeId)}`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(petolifeId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Parse owner name from user metadata
  const getOwnerName = () => {
    const storedUserData = localStorage.getItem("user");
    let ownerName = 'Pet Parent';
    if (storedUserData) {
      try {
        const userObj = JSON.parse(storedUserData);
        ownerName = userObj.user_metadata?.first_name || userObj.user_metadata?.name || 'Pet Parent';
        if (userObj.user_metadata?.last_name) {
          ownerName += ` ${userObj.user_metadata.last_name}`;
        }
      } catch {}
    }
    return ownerName;
  };

  const hiddenCardRef = useRef(null);

  const dataToUseForCard = {
    ...dataToUse,
    petolife_id: dataToUse.petolifeId || dataToUse.petolife_id,
  };

  const handleDownloadQR = async () => {
    if (hiddenCardRef.current) {
      try {
        // Find the actual card inside the wrapper to avoid capturing empty space
        const cardElement = hiddenCardRef.current.querySelector('.petcard-id-outer') || hiddenCardRef.current;
        const canvas = await html2canvas(cardElement, {
          scale: 3, // high dpi
          useCORS: true,
          backgroundColor: null,
          logging: false
        });
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${petName}_PetoLife_ID.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      } catch (err) {
        console.error("Failed to download card:", err);
      }
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
    <div className="page">
      <PawWatermarks />

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '400px' }}>
        <div ref={hiddenCardRef}>
          <PetCard petData={dataToUseForCard} />
        </div>
      </div>

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

      {/* ── ID Card body ── */}
      <main className="id-card" role="status" aria-live="polite">

        {/* Pet photo inside the card, centred above QR */}
        <div className="id-pet-avatar-wrap">
          <div className="id-pet-avatar-ring">
            <PetAvatar
              src={petPhotoUrl}
              petType={petType}
              className="id-pet-avatar-img"
              size={68}
            />
          </div>
          <span className="id-verified-badge">
            <Check size={14} strokeWidth={3} color="var(--brand-teal)" />
          </span>
        </div>

        <p className="id-pet-name-label">{petName}</p>

        <div className="id-panel">
          <div className="id-qr">
            <div className="qr-frame">
              <QRCodeSVG
                id="qr-code-svg"
                value={qrValue}
                size={150}
                bgColor="transparent"
                fgColor="var(--ink)"
                level="M"
              />
            </div>
          </div>

          <div className="id-info">
            <div className="id-label">
              <PawPrint size={11} />
              <span>PET ID</span>
              <PawPrint size={11} />
            </div>
            <div className="id-number-row">
              <span className="id-number">{petolifeId}</span>
              <button type="button" className="id-copy-btn" onClick={handleCopyId} aria-label="Copy pet ID">
                {copiedId
                  ? <CheckCircle2 size={16} strokeWidth={2.4} color="var(--brand-green-dark)" />
                  : <Copy size={16} strokeWidth={2.4} />}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── Action buttons ── */}
      <nav className="actions" aria-label="Next steps">
        <ActionButton
          tone="primary"
          icon={<Download size={18} strokeWidth={2.2} />}
          label="Download ID Card"
          onClick={handleDownloadQR}
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
  );
}
