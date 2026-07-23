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

// 9:16 Aspect Ratio for Instagram / WhatsApp Stories (540 x 960)
const NATIVE_WIDTH = 540;
const NATIVE_HEIGHT = 960;

// SVG Path definitions for crisp vector icons
const SVG_PATHS = {
  paw: "M12 22c-1.5 0-2.8-.5-3.8-1.3-.5-.4-.8-1-1-1.6-.6-1.7.2-3.5 1.4-4.7.8-.8 1.5-1.7 2-2.7.2-.5.8-.7 1.4-.7s1.1.2 1.4.7c.5 1 1.2 1.9 2 2.7 1.2 1.2 2 3 1.4 4.7-.2.6-.5 1.2-1 1.6-1 .8-2.3 1.3-3.8 1.3zM4.5 12C3.1 12 2 10.9 2 9.5S3.1 7 4.5 7 7 8.1 7 9.5 5.9 12 4.5 12zM9 7.5C7.6 7.5 6.5 6.4 6.5 5S7.6 2.5 9 2.5s2.5 1.1 2.5 2.5S10.4 7.5 9 7.5zM15 7.5c-1.4 0-2.5-1.1-2.5-2.5S13.6 2.5 15 2.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zM19.5 12c-1.4 0-2.5-1.1-2.5-2.5S18.1 7 19.5 7 22 8.1 22 9.5 20.9 12 19.5 12z",
  calendar: "M19 4H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z",
  user: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
  heart: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
};

const PetKonvaCard = forwardRef(({ petData = {}, containerWidth = 360 }, ref) => {
  const stageRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const petName = petData.pet_name || petData.petName || petData.name || "Pet";
  const petolifeId = petData.petolife_id || petData.petolifeId || petData.pet_id || petData.id || "PET-ID-000000";

  // DOB / Age formatting
  const rawDob = petData.birth_date || petData.birthDate || petData.dob;
  const dobFormatted = rawDob
    ? new Date(rawDob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : petData.approx_age || petData.approxAge || petData.age || "Not specified";

  // Owner details
  const ownerName = petData.owner_name || petData.ownerName || petData.owner_info?.full_name || "Pet Parent";
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
    QRCode.toDataURL(qrUrl, { margin: 1, width: 280, color: { dark: "#004b23", light: "#ffffff" } }, (err, url) => {
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
      // pixelRatio = 2 exports 1080x1920 HD PNG for Stories!
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${petName.replace(/\s+/g, "_")}_PetoLife_ID_Story.png`;
      link.href = dataUrl;
      link.click();
    },
    getStage: () => stageRef.current,
  }));

  const targetWidth = containerWidth || 360;
  const scale = targetWidth / NATIVE_WIDTH;
  const displayHeight = NATIVE_HEIGHT * scale;

  // Calculate logo image height based on natural aspect ratio
  const logoTargetWidth = 280;
  const logoAspectRatio = loadedLogo ? loadedLogo.width / loadedLogo.height : 4;
  const logoTargetHeight = logoTargetWidth / logoAspectRatio;

  return (
    <div className="pet-konva-card-wrapper" style={{ width: targetWidth, height: displayHeight, margin: "0 auto", borderRadius: 28, overflow: "hidden", boxShadow: "0 16px 40px rgba(0, 75, 73, 0.2)" }}>
      <Stage ref={stageRef} width={targetWidth} height={displayHeight} scaleX={scale} scaleY={scale}>
        <Layer>
          {/* 9:16 Outer Background Card */}
          <Rect x={0} y={0} width={NATIVE_WIDTH} height={NATIVE_HEIGHT} cornerRadius={32} fill="#ffffff" stroke="#cfe3c9" strokeWidth={2} />

          {/* ── Top Header Official Brand Logo (Distortion-Free) ── */}
          {loadedLogo && (
            <KonvaImage
              image={loadedLogo}
              x={(NATIVE_WIDTH - logoTargetWidth) / 2}
              y={-2}
              width={logoTargetWidth}
              height={logoTargetHeight}
            />
          )}

          {/* Header Lines & Tagline */}
          <Line points={[36, 116, 110, 116]} stroke="#84b662" strokeWidth={2} />
          <Text
            x={60}
            y={107}
            width={420}
            text="Every Pet. One Identity. Better Care."
            fontSize={14}
            fontStyle="bold"
            fontFamily="system-ui, -apple-system, sans-serif"
            fill="#004b23"
            align="center"
          />
          <Line points={[430, 116, 504, 116]} stroke="#84b662" strokeWidth={2} />

          {/* ── Pet Avatar Photo (Large Centered Circle) ── */}
          <Circle x={270} y={265} radius={115} stroke="#84b662" strokeWidth={6} fill="#ffffff" />
          {loadedPetPhoto ? (
            <Group clipFunc={(ctx) => ctx.arc(270, 265, 109, 0, Math.PI * 2, false)}>
              <KonvaImage image={loadedPetPhoto} x={161} y={156} width={218} height={218} />
            </Group>
          ) : (
            <Group clipFunc={(ctx) => ctx.arc(270, 265, 109, 0, Math.PI * 2, false)}>
              <Rect x={161} y={156} width={218} height={218} fill="#eaf5e5" />
              <Path x={248} y={243} scaleX={1.8} scaleY={1.8} data={SVG_PATHS.paw} fill="#004b23" />
            </Group>
          )}

          {/* ── Details Rows (Spacious & Bold with Vector Icons) ── */}

          {/* Row 1: Name */}
          <Circle x={145} y={420} radius={22} fill="#eaf5e5" />
          <Path x={133} y={408} scaleX={0.95} scaleY={0.95} data={SVG_PATHS.paw} fill="#004b23" />
          <Text x={185} y={405} text="Name" fontSize={13} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#53755b" />
          <Text x={185} y={422} text={petName} fontSize={28} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" />
          <Line points={[110, 462, 430, 462]} stroke="#e2ece0" strokeWidth={2} dash={[6, 6]} />

          {/* Row 2: DOB / Age */}
          <Circle x={145} y={492} radius={22} fill="#eaf5e5" />
          <Path x={134} y={480} scaleX={0.95} scaleY={0.95} data={SVG_PATHS.calendar} fill="#004b23" />
          <Text x={185} y={477} text="DOB" fontSize={13} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#53755b" />
          <Text x={185} y={494} text={dobFormatted} fontSize={20} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" />
          <Line points={[110, 534, 430, 534]} stroke="#e2ece0" strokeWidth={2} dash={[6, 6]} />

          {/* Row 3: Pet Parent */}
          <Circle x={145} y={564} radius={22} fill="#eaf5e5" />
          <Path x={133} y={552} scaleX={0.95} scaleY={0.95} data={SVG_PATHS.user} fill="#004b23" />
          <Text x={185} y={549} text="Pet Parent" fontSize={13} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#53755b" />
          <Text x={185} y={566} text={ownerName} fontSize={20} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" />
          <Line points={[110, 606, 430, 606]} stroke="#e2ece0" strokeWidth={2} dash={[6, 6]} />

          {/* Row 4: Phone Number */}
          <Circle x={145} y={636} radius={22} fill="#eaf5e5" />
          <Path x={133} y={624} scaleX={0.95} scaleY={0.95} data={SVG_PATHS.phone} fill="#004b23" />
          <Text x={185} y={621} text="Phone Number" fontSize={13} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#53755b" />
          <Text x={185} y={638} text={phoneMasked} fontSize={19} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" />

          {/* ── Lower Section (Green Card Box + QR Code) ── */}
          <Rect x={24} y={680} width={492} height={180} cornerRadius={24} fill="#f0f8ed" stroke="#cfe3c9" strokeWidth={2} />

          {/* Left ID Box */}
          <Rect x={48} y={700} width={46} height={46} cornerRadius={14} fill="#eaf5e5" stroke="#84b662" strokeWidth={2} />
          <Path x={59} y={711} scaleX={0.95} scaleY={0.95} data={SVG_PATHS.shield} fill="#004b23" />
          <Text x={106} y={708} text="Petolife ID" fontSize={26} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" />
          <Text x={48} y={762} text={petolifeId} fontSize={22} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#004b23" />

          <Line points={[48, 802, 320, 802]} stroke="#cfe3c9" strokeWidth={2} />
          <Text x={48} y={816} text={`Scan to view ${petName}'s Health Profile`} fontSize={13} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#3b6346" />

          {/* Right QR Box (Perfect 1:1 Square Alignment) ── */}
          <Rect x={340} y={692} width={156} height={156} cornerRadius={20} fill="#ffffff" stroke="#cfe3c9" strokeWidth={2} />
          {loadedQr && <KonvaImage image={loadedQr} x={353} y={705} width={130} height={130} />}

          {/* ── Bottom Footer Bar ── */}
          <Rect x={0} y={880} width={NATIVE_WIDTH} height={80} fill="#004b23" cornerRadius={[0, 0, 32, 32]} />
          <Path x={24} y={908} scaleX={0.85} scaleY={0.85} data={SVG_PATHS.heart} fill="#ffffff" />
          <Text x={52} y={912} text="Because every pet deserves lifelong care." fontSize={15} fontStyle="bold" fontFamily="system-ui, -apple-system, sans-serif" fill="#ffffff" />
          
          <Group x={460} y={906}>
            <Path data={SVG_PATHS.paw} fill="#ffffff" scaleX={0.9} scaleY={0.9} />
          </Group>
        </Layer>
      </Stage>
    </div>
  );
});

export default PetKonvaCard;
