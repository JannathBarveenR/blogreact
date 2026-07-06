import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './postidscreen.css';
import { QRCodeSVG } from 'qrcode.react';
import { PetAvatar } from '../common/PetAvatar';
import {
  Check,
  PawPrint,
  Heart,
  ShieldCheck,
  UserPlus,
  Home,
  FilePlus2,
  ChevronRight,
  Share2,
  Copy,
  MessageCircle,
  X,
  CheckCircle2,
  Download,
} from 'lucide-react';

export default function PostIdScreen({ inlineData }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const dataToUse = inlineData || location.state || {};

  const {
    petName = 'Pet',
    petolifeId = 'ID',
    petPhotoUrl = '',
    petType = '',
    petProfileId = '',
  } = dataToUse;

  const qrValue = `${window.location.origin}/api/pet-profile/by-petolife-id/${encodeURIComponent(petolifeId)}`;
  const shareUrl = `${window.location.origin}/pet/${encodeURIComponent(petolifeId)}`;
  const shareText = `Try petolife and see my pet card: ${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(petolifeId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${petName}_QR.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank');
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${petName}'s Pet Card`,
        text: `Try petolife and see my pet card`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  // Deterministic pseudo-random paw layout
  const usePaws = (count = 16) => {
    return useMemo(() => {
      const colors = ['var(--gold)', 'var(--gold-soft)', 'var(--green-500)', '#cfe9d6', 'var(--cream)'];
      let seed = 42;
      const rand = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };
      return Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${rand() * 100}%`,
        delay: `${(rand() * 4).toFixed(2)}s`,
        duration: `${(6 + rand() * 5).toFixed(2)}s`,
        size: Math.round(14 + rand() * 16),
        color: colors[i % colors.length],
        rotate: `${Math.round(rand() * 360)}deg`,
      }));
    }, [count]);
  };

  const PawLayer = () => {
    const pieces = usePaws();
    return (
      <div className="paw-layer" aria-hidden="true">
        {pieces.map((p) => (
          <span
            key={p.id}
            className="paw-piece"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              color: p.color,
              '--rot': p.rotate,
            }}
          >
            <PawPrint size={p.size} fill="currentColor" strokeWidth={0} />
          </span>
        ))}
      </div>
    );
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
      <PawLayer />
      <PawWatermarks />
<header className="postid-hero">
  <div className="avatar-badge-wrap">
    <div className="avatar-ring">
      <PetAvatar src={petPhotoUrl} petType={petType} className="avatar-photo" size={48} />
    </div>
    <span className="check-badge">
      <Check size={16} strokeWidth={3} color="var(--brand-teal)" />
    </span>
  </div>
</header>
      <main className="id-card" role="status" aria-live="polite">
        <h1 className="title">Pet Health ID Created</h1>
        <p className="ribbon">
          <PawPrint size={15} />
          <span>
            <strong>{petName}</strong> is now part of PetoLife
          </span>
          <Heart size={15} />
        </p>
        <div className="id-panel">
          <div className="id-qr">
            <div className="qr-frame">
              <QRCodeSVG id="qr-code-svg" value={qrValue} size={150} bgColor="transparent" fgColor="var(--ink)" level="M" />
            </div>
            <span className="qr-tag">Scan to view ID</span>
          </div>
<div className="id-info">
  <div className="id-label">
    <PawPrint size={12} />
    <span>PET ID</span>
    <PawPrint size={12} />
  </div>
  <div className="id-number-row">
    <span className="id-number">{petolifeId}</span>
    <button type="button" className="id-copy-btn" onClick={handleCopyId} aria-label="Copy pet ID">
      {copiedId ? <CheckCircle2 size={16} strokeWidth={2.4} color="var(--brand-green-dark)" /> : <Copy size={16} strokeWidth={2.4} />}
    </button>
  </div>
</div>
        </div>
      </main>
<nav className="actions" aria-label="Next steps">
  <ActionButton
    tone="primary"
    icon={<UserPlus size={18} strokeWidth={2.2} />}
    label="Invite Family Member"
    onClick={() => setShowShareModal(true)}
  />
  <ActionButton
    tone="secondary"
    icon={<Download size={18} strokeWidth={2.2} />}
    label="Download QR"
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

      {/* SHARE / INVITE FAMILY MODAL */}
      {showShareModal && (
        <div className="share-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="share-header">
              <h3>Invite & Share Pet Card</h3>
              <button type="button" className="share-close" onClick={() => setShowShareModal(false)}>
                <X size={20} />
              </button>
            </div>

            <p className="share-sub">Share {petName}'s pet card with family or friends!</p>

            <div className="share-text-box">
              <span>{shareText}</span>
            </div>

            <div className="share-options">
              <button type="button" className="share-opt-btn whatsapp" onClick={handleWhatsApp}>
                <MessageCircle size={20} />
                <span>Send to WhatsApp</span>
              </button>

              <button type="button" className="share-opt-btn copy" onClick={handleCopy}>
                {copied ? <CheckCircle2 size={20} color="#0c6b3a" /> : <Copy size={20} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Text & Link'}</span>
              </button>

              {navigator.share && (
                <button type="button" className="share-opt-btn native" onClick={handleNativeShare}>
                  <Share2 size={20} />
                  <span>Share via Apps</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
