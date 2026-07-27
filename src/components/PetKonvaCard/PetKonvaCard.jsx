import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { Stage, Layer, Rect, Circle, Text, Image as KonvaImage, Group, Line, Path } from "react-konva";
import QRCode from "qrcode";
import logoImg from "../../assets/logo.webp";

function useLoadedImage(src) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    img.onload = () => setImage(img);
    img.onerror = (e) => {
      console.warn("Failed to load Konva image:", src, e);
      setImage(null);
    };
  }, [src]);
  return image;
}

// 4:5 Aspect Ratio (1000 x 1250) matching official PetOLife Health ID specifications
const NATIVE_WIDTH = 1000;
const NATIVE_HEIGHT = 1250;

// SVG Path definitions for crisp vector icons
const SVG_PATHS = {
  paw: "M12 22c-1.5 0-2.8-.5-3.8-1.3-.5-.4-.8-1-1-1.6-.6-1.7.2-3.5 1.4-4.7.8-.8 1.5-1.7 2-2.7.2-.5.8-.7 1.4-.7s1.1.2 1.4.7c.5 1 1.2 1.9 2 2.7 1.2 1.2 2 3 1.4 4.7-.2.6-.5 1.2-1 1.6-1 .8-2.3 1.3-3.8 1.3zM4.5 12C3.1 12 2 10.9 2 9.5S3.1 7 4.5 7 7 8.1 7 9.5 5.9 12 4.5 12zM9 7.5C7.6 7.5 6.5 6.4 6.5 5S7.6 2.5 9 2.5s2.5 1.1 2.5 2.5S10.4 7.5 9 7.5zM15 7.5c-1.4 0-2.5-1.1-2.5-2.5S13.6 2.5 15 2.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zM19.5 12c-1.4 0-2.5-1.1-2.5-2.5S18.1 7 19.5 7 22 8.1 22 9.5 20.9 12 19.5 12z",
  calendar: "M19 4H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z",
  user: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  eye: "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z",
  petsOutline: "M4.5 12C3.1 12 2 10.9 2 9.5S3.1 7 4.5 7 7 8.1 7 9.5 5.9 12 4.5 12zM9 7.5C7.6 7.5 6.5 6.4 6.5 5S7.6 2.5 9 2.5s2.5 1.1 2.5 2.5S10.4 7.5 9 7.5zM15 7.5c-1.4 0-2.5-1.1-2.5-2.5S13.6 2.5 15 2.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zM19.5 12c-1.4 0-2.5-1.1-2.5-2.5S18.1 7 19.5 7 22 8.1 22 9.5 20.9 12 19.5 12z",
};

const PetKonvaCard = forwardRef(({ petData = {}, containerWidth = 380 }, ref) => {
  const stageRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const petName = petData.pet_name || petData.petName || petData.name || "Pet";
  const petolifeId = petData.petolife_id || petData.petolifeId || petData.pet_id || petData.id || "PET-ID-000000";

  // Timezone-safe DOB formatting (e.g. '2024-07-25' -> '25 Jul 2024')
  const formatDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return null;
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (monthIdx >= 0 && monthIdx < 12 && !isNaN(day)) {
        return `${day} ${months[monthIdx]} ${year}`;
      }
    }
    return dateStr;
  };

  const rawDob = petData.birth_date || petData.birthDate || petData.dob;
  const dobFormatted = formatDate(rawDob) || petData.approx_age || petData.approxAge || petData.age || "Not specified";

  // Owner details
  const ownerName = petData.owner_name || petData.pet_parent || petData.ownerName || petData.owner_info?.full_name || "Pet Parent";
  const rawPhone = petData.owner_phone || petData.ownerPhone || petData.owner_info?.phone || "+91 9XXXX XXXXX";

  const formatPhoneMask = (phone) => {
    if (!phone) return "+91 8XXX XX XX 73";
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 10) {
      const last2 = digits.slice(-2);
      const first1 = digits.length === 12 ? digits.slice(2, 3) : digits.slice(0, 1);
      return `+91 ${first1}XXX XX XX ${last2}`;
    }
    return phone;
  };

  const phoneMasked = formatPhoneMask(rawPhone);
  const frontendBase = import.meta.env.VITE_FRONTEND_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const qrUrl = `${frontendBase}/pet/${encodeURIComponent(petolifeId.toLowerCase())}`;

  useEffect(() => {
    QRCode.toDataURL(qrUrl, { margin: 1, width: 320, color: { dark: "#004b23", light: "#ffffff" } }, (err, url) => {
      if (!err && url) {
        setQrDataUrl(url);
      }
    });
  }, [qrUrl]);

  // Load images
  const loadedLogo = useLoadedImage(logoImg);
  const loadedPetPhoto = useLoadedImage(petData.pet_photo_url || petData.petPhotoUrl || petData.image || "");
  const loadedQr = useLoadedImage(qrDataUrl);

  useImperativeHandle(ref, () => ({
    downloadCard: () => {
      if (!stageRef.current) return;
      // High-definition 4:5 PNG export (2000 x 2500)
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${petName.replace(/\s+/g, "_")}_PetoLife_ID_Card.png`;
      link.href = dataUrl;
      link.click();
    },
    getStage: () => stageRef.current,
  }));

  const targetWidth = containerWidth || 380;
  const scale = targetWidth / NATIVE_WIDTH;
  const displayHeight = NATIVE_HEIGHT * scale;

  // Calculate logo image height based on natural aspect ratio
  const logoTargetWidth = 440;
  const logoAspectRatio = loadedLogo ? loadedLogo.width / loadedLogo.height : 4;
  const logoTargetHeight = logoTargetWidth / logoAspectRatio;

  return (
    <div className="pet-konva-card-wrapper" style={{ width: targetWidth, height: displayHeight, margin: "0 auto", borderRadius: 32, overflow: "hidden", boxShadow: "0 20px 50px rgba(0, 75, 73, 0.2)" }}>
      <Stage ref={stageRef} width={targetWidth} height={displayHeight} scaleX={scale} scaleY={scale}>
        <Layer>
          {/* 4:5 Outer Background Card */}
          <Rect x={0} y={0} width={NATIVE_WIDTH} height={NATIVE_HEIGHT} cornerRadius={36} fill="#ffffff" stroke="#cfe3c9" strokeWidth={2.5} />

          {/* ── Top Header Official Brand Logo (Distortion-Free) ── */}
          {loadedLogo && (
            <KonvaImage
              image={loadedLogo}
              x={(NATIVE_WIDTH - logoTargetWidth) / 2}
              y={-20}
              width={logoTargetWidth}
              height={logoTargetHeight}
            />
          )}

          {/* Header Accent Lines & Tagline */}
          <Line points={[70, 160, 230, 160]} stroke="#84b662" strokeWidth={2.5} />
          <Text
            x={200}
            y={148}
            width={600}
            text="Every Pet. One Identity. Better Care."
            fontSize={20}
            fontStyle="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
            fill="#004b23"
            align="center"
          />
          <Line points={[770, 160, 930, 160]} stroke="#84b662" strokeWidth={2.5} />

          {/* ── Middle Section Layout: Square Pet Photo (Left) + Details Column (Right) ── */}

          {/* Left: Square Aspect Ratio Pet Photo with Rounded Corners */}
          <Rect x={70} y={225} width={410} height={410} cornerRadius={36} stroke="#84b662" strokeWidth={7} fill="#ffffff" />
          {loadedPetPhoto ? (
            <Group
              clipFunc={(ctx) => {
                ctx.beginPath();
                if (typeof ctx.roundRect === "function") {
                  ctx.roundRect(77, 232, 396, 396, 30);
                } else {
                  ctx.rect(77, 232, 396, 396);
                }
              }}
            >
              <KonvaImage image={loadedPetPhoto} x={77} y={232} width={396} height={396} />
            </Group>
          ) : (
            <Group
              clipFunc={(ctx) => {
                ctx.beginPath();
                if (typeof ctx.roundRect === "function") {
                  ctx.roundRect(77, 232, 396, 396, 30);
                } else {
                  ctx.rect(77, 232, 396, 396);
                }
              }}
            >
              <Rect x={77} y={232} width={396} height={396} fill="#eaf5e5" />
              <Path x={235} y={390} scaleX={3} scaleY={3} data={SVG_PATHS.paw} fill="#004b23" />
            </Group>
          )}

          {/* Right Column Details */}

          {/* Row 1: Name (LARGER font size) */}
          <Circle x={555} y={258} radius={26} fill="#eaf5e5" />
          <Path x={542} y={245} scaleX={1.1} scaleY={1.1} data={SVG_PATHS.paw} fill="#004b23" />
          <Text x={598} y={234} text="Name" fontSize={14} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#5c7472" />
          <Text x={598} y={254} text={petName} fontSize={44} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" />
          <Line points={[520, 318, 930, 318]} stroke="#e2ece0" strokeWidth={2} dash={[6, 6]} />

          {/* Row 2: DOB (Compact) */}
          <Circle x={555} y={365} radius={25} fill="#eaf5e5" />
          <Path x={543} y={352} scaleX={1.05} scaleY={1.05} data={SVG_PATHS.calendar} fill="#004b23" />
          <Text x={598} y={346} text="DOB" fontSize={13} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#5c7472" />
          <Text x={598} y={364} text={dobFormatted} fontSize={20} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" />
          <Line points={[520, 420, 930, 420]} stroke="#e2ece0" strokeWidth={2} dash={[6, 6]} />

          {/* Row 3: Pet Parent (Compact) */}
          <Circle x={555} y={467} radius={25} fill="#eaf5e5" />
          <Path x={542} y={454} scaleX={1.05} scaleY={1.05} data={SVG_PATHS.user} fill="#004b23" />
          <Text x={598} y={448} text="Pet Parent" fontSize={13} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#5c7472" />
          <Text x={598} y={466} text={ownerName} fontSize={20} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" />
          <Line points={[520, 522, 930, 522]} stroke="#e2ece0" strokeWidth={2} dash={[6, 6]} />

          {/* Row 4: Phone Number (Compact) */}
          <Circle x={555} y={569} radius={25} fill="#eaf5e5" />
          <Path x={542} y={556} scaleX={1.05} scaleY={1.05} data={SVG_PATHS.phone} fill="#004b23" />
          <Text x={598} y={550} text="Phone Number" fontSize={13} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#5c7472" />
          <Text x={598} y={568} text={phoneMasked} fontSize={19} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" />
          <Path x={875} y={570} scaleX={0.9} scaleY={0.9} data={SVG_PATHS.eye} fill="#004b23" />

          {/* ── Lower Section Box (Petolife ID + QR Code) ── */}
          <Rect x={50} y={670} width={900} height={420} cornerRadius={32} fill="#f2f9ef" stroke="#cce5c4" strokeWidth={2.5} />

          {/* Shield Icon Box */}
          <Rect x={90} y={710} width={84} height={84} cornerRadius={24} fill="#eaf5e5" stroke="#84b662" strokeWidth={2.5} />
          <Path x={112} y={730} scaleX={1.5} scaleY={1.5} data={SVG_PATHS.shield} fill="#004b23" />
          <Path x={126} y={745} scaleX={0.9} scaleY={0.9} data={SVG_PATHS.paw} fill="#004b23" />

          <Text x={200} y={730} text="Petolife ID" fontSize={38} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" />
          <Text x={90} y={820} text={petolifeId} fontSize={35} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" letterSpacing={0.5} />

          <Line points={[90, 890, 600, 890]} stroke="#cce5c4" strokeWidth={2.5} />
          <Text x={90} y={915} text={`Scan to view ${petName}'s Health Profile`} fontSize={18} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#3b6346" />

          {/* Right QR Box */}
          <Rect x={630} y={710} width={280} height={280} cornerRadius={28} fill="#ffffff" stroke="#cce5c4" strokeWidth={2.5} />
          {loadedQr && <KonvaImage image={loadedQr} x={655} y={735} width={230} height={230} />}

          {/* ── Bottom Dark Green Footer Bar ── */}
          <Rect x={0} y={1130} width={NATIVE_WIDTH} height={120} fill="#004b23" cornerRadius={[0, 0, 36, 36]} />
          <Path x={50} y={1170} scaleX={1.3} scaleY={1.3} data={SVG_PATHS.heart} fill="#ffffff" />
          <Text x={95} y={1176} text="Because every pet deserves lifelong care." fontSize={20} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#ffffff" />

          {/* Dog & Cat Graphic Icon at Footer Right */}
          <Group x={860} y={1165}>
            <Path data={SVG_PATHS.petsOutline} fill="#ffffff" scaleX={1.4} scaleY={1.4} />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
});

export default PetKonvaCard;
