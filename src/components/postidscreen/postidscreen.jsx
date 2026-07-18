import React, { useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const ownerName = getOwnerName();

    // Use high DPI scale for crisp output
    const SCALE = 3;
    const W = 400 * SCALE;
    const H = 640 * SCALE;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.scale(SCALE, SCALE);

    const drawCard = (qrImg, logoImg, petImg) => {
      const cw = 400;
      const ch = 640;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cw, ch);

      // Card rounded border (draw manually)
      ctx.strokeStyle = "#cfe9d6";
      ctx.lineWidth = 3;
      roundRect(ctx, 4, 4, cw - 8, ch - 8, 20, false, true);

      // ─── Header banner ───
      ctx.fillStyle = "#004b49";
      roundRectTop(ctx, 4, 4, cw - 8, 82, 20);

      // Logo in header (logo with tagline webp image)
      if (logoImg) {
        // Centre the logo image inside the dark header banner
        const lH = 44;
        const lW = logoImg.naturalWidth * (lH / logoImg.naturalHeight);
        const lX = (cw - lW) / 2;
        ctx.drawImage(logoImg, lX, 4 + (82 - lH) / 2, lW, lH);
      } else {
        // Fallback text
        ctx.textAlign = "center";
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${20}px sans-serif`;
        ctx.fillText("PetoLife", cw / 2, 4 + 82 / 2 + 7);
      }

      // ─── Pet photo circle ───
      const photoSize = 72;
      const photoX = (cw - photoSize) / 2;
      const photoY = 98;
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#eef5ea";
      ctx.fill();
      if (petImg) {
        ctx.drawImage(petImg, photoX, photoY, photoSize, photoSize);
      } else {
        // simple paw placeholder
        ctx.fillStyle = "#aacba0";
        ctx.font = `${36}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("🐾", photoX + photoSize / 2, photoY + photoSize / 2 + 12);
      }
      ctx.restore();

      // Circle border ring
      ctx.beginPath();
      ctx.arc(photoX + photoSize / 2, photoY + photoSize / 2, photoSize / 2 + 2, 0, Math.PI * 2);
      ctx.strokeStyle = "#84b662";
      ctx.lineWidth = 3;
      ctx.stroke();

      // ─── Pet name (display name) ───
      ctx.textAlign = "center";
      ctx.fillStyle = "#004b49";
      ctx.font = `bold ${22}px Inter, sans-serif`;
      ctx.fillText(petName, cw / 2, photoY + photoSize + 26);

      ctx.fillStyle = "#84b662";
      ctx.font = `${11}px sans-serif`;
      ctx.fillText("✓  Verified by PetoLife", cw / 2, photoY + photoSize + 44);

      // ─── Divider ───
      ctx.strokeStyle = "#e5ede1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, photoY + photoSize + 58);
      ctx.lineTo(cw - 30, photoY + photoSize + 58);
      ctx.stroke();

      // ─── QR Code ───
      const qrSize = 160;
      const qrX = (cw - qrSize) / 2;
      const qrY = photoY + photoSize + 70;

      // QR background rounded box
      ctx.fillStyle = "#f4f8f1";
      roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 14, true, false);
      ctx.strokeStyle = "#84b662";
      ctx.lineWidth = 2;
      roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 14, false, true);

      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // ─── Pet ID ───
      const idY = qrY + qrSize + 36;
      ctx.fillStyle = "#84b662";
      ctx.font = `bold ${10}px sans-serif`;
      ctx.letterSpacing = "2px";
      ctx.fillText("PET HEALTH ID", cw / 2, idY);

      ctx.fillStyle = "#004b49";
      ctx.font = `bold ${16}px 'Courier New', monospace`;
      ctx.letterSpacing = "0px";
      ctx.fillText(petolifeId, cw / 2, idY + 22);

      // ─── Divider ───
      ctx.strokeStyle = "#e5ede1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, idY + 36);
      ctx.lineTo(cw - 30, idY + 36);
      ctx.stroke();

      // ─── Pet Owner ───
      const ownerY = idY + 56;
      ctx.fillStyle = "#6d756d";
      ctx.font = `bold ${10}px sans-serif`;
      ctx.fillText("PET OWNER", cw / 2, ownerY);

      ctx.fillStyle = "#16211f";
      ctx.font = `bold ${16}px Inter, sans-serif`;
      ctx.fillText(ownerName, cw / 2, ownerY + 22);

      // ─── Tagline footer ───
      ctx.fillStyle = "#84b662";
      ctx.font = `italic ${11}px serif`;
      ctx.fillText("Be the best pet parent", cw / 2, ch - 18);

      // Export
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${petName}_PetoLife_ID.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    // Helper: rounded rect
    function roundRect(ctx, x, y, w, h, r, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      if (fill) ctx.fill();
      if (stroke) ctx.stroke();
    }

    function roundRectTop(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    }

    // ── Load resources in parallel ──
    const qrSvg = document.getElementById("qr-code-svg");
    const svgData = new XMLSerializer().serializeToString(qrSvg);
    const qrImg = new Image();
    const logoImg = new Image();
    const petImg = petPhotoUrl ? new Image() : null;
    let loaded = 0;
    const total = petPhotoUrl ? 3 : 2;

    const onLoad = () => {
      loaded++;
      if (loaded === total) drawCard(qrImg, logoImg, petImg);
    };

    qrImg.onload = onLoad;
    qrImg.src = "data:image/svg+xml;base64," + btoa(svgData);

    logoImg.onload = onLoad;
    logoImg.onerror = onLoad; // fallback to text if logo fails
    logoImg.crossOrigin = "anonymous";
    logoImg.src = polLogo;

    if (petImg) {
      petImg.onload = onLoad;
      petImg.onerror = onLoad;
      petImg.crossOrigin = "anonymous";
      petImg.src = petPhotoUrl;
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
