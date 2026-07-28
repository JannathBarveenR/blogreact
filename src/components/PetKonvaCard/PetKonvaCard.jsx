import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { Stage, Layer, Rect, Circle, Text, Image as KonvaImage, Group, Line, Path } from "react-konva";
import QRCode from "qrcode";
import logoImg from "../../assets/logo_clean.webp";
import vBadgeImg from "../../assets/VBadge.png";

function useLoadedImage(src) {
  const [image, setImage] = useState(null);
  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }
    let isCancelled = false;

    // 1. Try with crossOrigin="Anonymous" (enables high-res canvas exports when CORS is permitted)
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.src = src;
    img.onload = () => {
      if (!isCancelled) setImage(img);
    };
    img.onerror = () => {
      // 2. Fallback without crossOrigin (ensures S3 photos display even if bucket CORS headers are restricted)
      const fallbackImg = new window.Image();
      fallbackImg.src = src;
      fallbackImg.onload = () => {
        if (!isCancelled) setImage(fallbackImg);
      };
      fallbackImg.onerror = (err) => {
        console.warn("Failed to load Konva image:", src, err);
        if (!isCancelled) setImage(null);
      };
    };

    return () => {
      isCancelled = true;
    };
  }, [src]);
  return image;
}

const NATIVE_WIDTH = 1080;
const NATIVE_HEIGHT = 1420;

const SVG_PATHS = {
  paw: "M12 22c-1.5 0-2.8-.5-3.8-1.3-.5-.4-.8-1-1-1.6-.6-1.7.2-3.5 1.4-4.7.8-.8 1.5-1.7 2-2.7.2-.5.8-.7 1.4-.7s1.1.2 1.4.7c.5 1 1.2 1.9 2 2.7 1.2 1.2 2 3 1.4 4.7-.2.6-.5 1.2-1 1.6-1 .8-2.3 1.3-3.8 1.3zM4.5 12C3.1 12 2 10.9 2 9.5S3.1 7 4.5 7 7 8.1 7 9.5 5.9 12 4.5 12zM9 7.5C7.6 7.5 6.5 6.4 6.5 5S7.6 2.5 9 2.5s2.5 1.1 2.5 2.5S10.4 7.5 9 7.5zM15 7.5c-1.4 0-2.5-1.1-2.5-2.5S13.6 2.5 15 2.5s2.5 1.1 2.5 2.5-1.1 2.5-2.5 2.5zM19.5 12c-1.4 0-2.5-1.1-2.5-2.5S18.1 7 19.5 7 22 8.1 22 9.5 20.9 12 19.5 12z",
  calendar: "M19 4H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5z",
  user: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  shield: "M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z",
  heartSolid: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  male: "M15 3v2h2.59l-4.7 4.7c-1.32-.98-3.03-1.3-4.79-.81C5.35 9.87 3.32 12.56 3.04 15.48 2.66 19.38 5.62 22.34 9.52 21.96 12.44 21.68 15.13 19.65 16.11 16.89c.49-1.76.17-3.47-.81-4.79l4.7-4.7V10h2V3h-7zm-6 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z",
  female: "M12 2C8.69 2 6 4.69 6 8c0 2.97 2.16 5.44 5 5.92V16H8v2h3v3h2v-3h3v-2h-3v-2.08c2.84-.48 5-2.95 5-5.92 0-3.31-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z",
  copy: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  check: "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
};

const PetKonvaCard = forwardRef(({ petData = {}, containerWidth = 380 }, ref) => {
  const stageRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const petName = petData.pet_name || petData.name || "Pet";
  const petolifeId = petData.petolife_id || petData.petolifeId || petData.pet_id || petData.id || "PET-ID-000000";
  const breed = petData.breed || petData.pet_breed || "Breed";
  const gender = petData.gender || "Male";

  const rawDob = petData.birth_date || petData.birthDate || petData.dob;
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

  const getAgeDisplay = (dob, approx) => {
    if (approx) return approx;
    if (dob) {
      const birth = new Date(dob);
      const now = new Date();
      const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      if (months >= 12) {
        const years = Math.floor(months / 12);
        return `${years} Year${years > 1 ? "s" : ""}`;
      }
      return `${months} Month${months !== 1 ? "s" : ""}`;
    }
    return "Not specified";
  };

  const ageDisplay = getAgeDisplay(rawDob, petData.approx_age || petData.approxAge || petData.age);

  const getOwnerName = () => {
    if (petData.owner_name && petData.owner_name !== "Pet Parent") return petData.owner_name;
    if (petData.pet_parent && petData.pet_parent !== "Pet Parent") return petData.pet_parent;
    if (petData.ownerName && petData.ownerName !== "Pet Parent") return petData.ownerName;
    if (petData.owner_info?.owner_name && petData.owner_info.owner_name !== "Pet Parent") return petData.owner_info.owner_name;
    if (petData.owner_info?.full_name && petData.owner_info.full_name !== "Pet Parent") return petData.owner_info.full_name;

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

  const ownerName = getOwnerName();
  
  const frontendBase = import.meta.env.VITE_FRONTEND_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const qrUrl = `${frontendBase}/pet/${encodeURIComponent(petolifeId.toLowerCase())}`;

  useEffect(() => {
    QRCode.toDataURL(qrUrl, { margin: 1, width: 300, color: { dark: "#000000", light: "#ffffff" } }, (err, url) => {
      if (!err && url) {
        setQrDataUrl(url);
      }
    });
  }, [qrUrl]);

  const loadedLogo = useLoadedImage(logoImg);
  const loadedBadge = useLoadedImage(vBadgeImg);
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

  const handleCopy = () => {
    console.log("handleCopy triggered!");
    // Show copy tick status immediately (2s as requested)
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Try standard clipboard action
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(petolifeId).catch((err) => {
          console.warn("Non-blocking clipboard failure:", err);
        });
      }
    } catch (e) {
      console.warn("Clipboard access not permitted in this context:", e);
    }
  };

  const targetWidth = containerWidth || 360;
  const scale = targetWidth / NATIVE_WIDTH;
  const displayHeight = NATIVE_HEIGHT * scale;

  return (
    <div 
      className="pet-konva-card-wrapper" 
      style={{ 
        width: targetWidth, 
        height: displayHeight, 
        margin: "0 auto", 
        borderRadius: 28, 
        overflow: "hidden", 
        border: "1px solid rgba(76, 175, 80, 0.25)",
        boxShadow: "0 25px 65px rgba(12, 61, 47, 0.15), 0 0 35px rgba(76, 175, 80, 0.2)"
      }}
    >
      <Stage ref={stageRef} width={targetWidth} height={displayHeight} scaleX={scale} scaleY={scale}>
        <Layer>
          {/* Background Gradient */}
          <Rect 
            x={0} 
            y={0} 
            width={NATIVE_WIDTH} 
            height={NATIVE_HEIGHT} 
            cornerRadius={40} 
            fillLinearGradientStartPoint={{ x: 0, y: 0 }} 
            fillLinearGradientEndPoint={{ x: NATIVE_WIDTH, y: NATIVE_HEIGHT }} 
            fillLinearGradientColorStops={[0, "#fcfdfe", 0.5, "#f7faf5", 1, "#f1f6ed"]} 
            stroke="#83a990" 
            strokeWidth={6} 
          />

          {/* Green Abstract Design (Watercolor/Organic Blobs) */}
          <Circle x={-50} y={150} radius={380} fill="#a3c9a8" opacity={0.1} listening={false} />
          <Circle x={1130} y={700} radius={480} fill="#bcdbb0" opacity={0.12} listening={false} />
          <Circle x={50} y={1450} radius={350} fill="#c7e6c9" opacity={0.1} listening={false} />

          {/* Faint Paw Prints Background */}
          <Path x={100} y={150} data={SVG_PATHS.paw} fill="#000" opacity={0.015} scaleX={3} scaleY={3} rotation={-20} />
          <Path x={850} y={400} data={SVG_PATHS.paw} fill="#000" opacity={0.015} scaleX={2.5} scaleY={2.5} rotation={30} />
          <Path x={150} y={800} data={SVG_PATHS.paw} fill="#000" opacity={0.015} scaleX={3} scaleY={3} rotation={-10} />
          
          {/* Top Logo - centered untruncated word mark */}
          {loadedLogo && (
            <KonvaImage
              image={loadedLogo}
              x={(NATIVE_WIDTH - 460) / 2}
              y={20}
              width={460}
              height={460 * (loadedLogo.height / loadedLogo.width)}
            />
          )}

          {/* Tagline "HEALTH ID" drawn cleanly below logo */}
          <Text
            x={0}
            y={150}
            width={NATIVE_WIDTH}
            align="center"
            text="HEALTH ID"
            fontSize={26}
            fontStyle="bold"
            letterSpacing={6}
            fontFamily="system-ui, sans-serif"
            fill="#406950"
          />
          {/* Accent Lines for Tagline */}
          <Line points={[240, 163, 410, 163]} stroke="#c3d2bb" strokeWidth={1.5} />
          <Line points={[670, 163, 840, 163]} stroke="#c3d2bb" strokeWidth={1.5} />

          {/* Verified Badge */}
          {loadedBadge && (
            <KonvaImage
              image={loadedBadge}
              x={800}
              y={35}
              width={200}
              height={200 * (loadedBadge.height / loadedBadge.width)}
            />
          )}

          {/* Rounded Square Pet Profile Photo with Curved Edges */}
          {/* Outer white border rounded square */}
          <Rect
            x={35}
            y={230}
            width={460}
            height={460}
            cornerRadius={48}
            fill="#ffffff"
            shadowBlur={35}
            shadowColor="rgba(0,0,0,0.14)"
            shadowOffsetY={12}
          />
          {loadedPetPhoto ? (
            <Group
              clipFunc={(ctx) => {
                ctx.beginPath();
                const x = 50, y = 245, w = 430, h = 430, r = 36;
                if (ctx.roundRect) {
                  ctx.roundRect(x, y, w, h, r);
                } else {
                  ctx.moveTo(x + r, y);
                  ctx.arcTo(x + w, y, x + w, y + h, r);
                  ctx.arcTo(x + w, y + h, x, y + h, r);
                  ctx.arcTo(x, y + h, x, y, r);
                  ctx.arcTo(x, y, x + w, y, r);
                }
                ctx.closePath();
              }}
            >
              <KonvaImage image={loadedPetPhoto} x={50} y={245} width={430} height={430} />
            </Group>
          ) : (
            <Group
              clipFunc={(ctx) => {
                ctx.beginPath();
                const x = 50, y = 245, w = 430, h = 430, r = 36;
                if (ctx.roundRect) {
                  ctx.roundRect(x, y, w, h, r);
                } else {
                  ctx.moveTo(x + r, y);
                  ctx.arcTo(x + w, y, x + w, y + h, r);
                  ctx.arcTo(x + w, y + h, x, y + h, r);
                  ctx.arcTo(x, y + h, x, y, r);
                  ctx.arcTo(x, y, x + w, y, r);
                }
                ctx.closePath();
              }}
            >
              <Rect x={50} y={245} width={430} height={430} fill="#eaf5e5" />
              <Path x={170} y={380} scaleX={4} scaleY={4} data={SVG_PATHS.paw} fill="#274a38" />
            </Group>
          )}

          {/* Heart Badge at bottom of rounded square */}
          <Circle x={265} y={690} radius={42} fill="#133c2a" shadowBlur={10} shadowColor="rgba(0,0,0,0.25)" />
          <Path
            x={252}
            y={677}
            data={SVG_PATHS.heartSolid}
            stroke="#ffffff"
            strokeWidth={2}
            fill="transparent"
            scaleX={1.2}
            scaleY={1.2}
          />

          {/* Right Side Info */}
          {/* Name */}
          <Text x={560} y={320} text={petName} fontSize={80} width={450} wrap="none" ellipsis={true} fontStyle="bold" fontFamily="system-ui, sans-serif" fill="#123d2f" />
          {/* Tilted outline Heart beside Name - matching styling and position */}
          <Path 
            x={560 + Math.min(petName.length * 48, 430) + 20} 
            y={335} 
            data={SVG_PATHS.heartSolid} 
            stroke="#719d3f" 
            strokeWidth={2} 
            fill="transparent" 
            scaleX={1.4} 
            scaleY={1.4}
            rotation={12}
          />

          {/* Separator Line with Paw */}
          <Line points={[560, 490, 750, 490]} stroke="#b8c6a5" strokeWidth={2} />
          <Path x={755} y={476} data={SVG_PATHS.paw} fill="#406950" scaleX={1.1} scaleY={1.1} />
          <Line points={[800, 490, 980, 490]} stroke="#b8c6a5" strokeWidth={2} />

          {/* Breed Pill */}
          <Group x={580} y={550}>
            <Rect x={0} y={0} width={360} height={76} cornerRadius={38} stroke="#c3d2bb" strokeWidth={2} />
            {/* Cute floppy ears dog face built using Konva shapes */}
            <Group x={25} y={15}>
              <Circle x={20} y={20} radius={11} stroke="#406950" strokeWidth={2} fill="transparent" />
              <Path data="M 10 13 C 6 13 6 22 9 24 C 11 25 12 22 12 20" stroke="#406950" strokeWidth={2} fill="transparent" />
              <Path data="M 30 13 C 34 13 34 22 31 24 C 29 25 28 22 28 20" stroke="#406950" strokeWidth={2} fill="transparent" />
              <Circle x={16} y={18} radius={1.5} fill="#406950" />
              <Circle x={24} y={18} radius={1.5} fill="#406950" />
              <Path data="M 18 21 L 22 21 L 20 23 Z" fill="#406950" />
              <Path data="M 18 24 Q 20 25.5 22 24" stroke="#406950" strokeWidth={1.5} fill="transparent" />
            </Group>
            <Text x={78} y={22} text={breed} fontSize={30} fontFamily="system-ui, sans-serif" fill="#406950" />
          </Group>

          {/* Gender and Age */}
          <Group x={590} y={670}>
            <Path x={0} y={0} data={gender.toLowerCase() === "female" ? SVG_PATHS.female : SVG_PATHS.male} fill="#406950" scaleX={1.2} scaleY={1.2} />
            <Text x={35} y={0} text={gender} fontSize={32} fontFamily="system-ui, sans-serif" fill="#123d2f" />
            
            <Line points={[140, -10, 140, 36]} stroke="#b8c6a5" strokeWidth={2} />
            
            <Path x={180} y={0} data={SVG_PATHS.calendar} fill="#406950" scaleX={1.2} scaleY={1.2} />
            <Text x={220} y={0} text={ageDisplay} fontSize={32} fontFamily="system-ui, sans-serif" fill="#123d2f" />
          </Group>

          {/* Banner: PETOLIFE HEALTH ID with Lighter Gold Glow */}
          <Group x={70} y={800}>
            <Rect 
              x={0} 
              y={0} 
              width={940} 
              height={200} 
              cornerRadius={24} 
              fillLinearGradientStartPoint={{ x: 0, y: 0 }} 
              fillLinearGradientEndPoint={{ x: 940, y: 200 }} 
              fillLinearGradientColorStops={[0, "#ffffff", 1, "#fdfbf4"]} 
              shadowBlur={25} 
              shadowColor="rgba(218, 165, 32, 0.12)" 
              shadowOffsetY={10} 
              stroke="#ebd595" 
              strokeWidth={2} 
            />
            
            <Text x={0} y={30} width={940} align="center" text="PETOLIFE HEALTH ID" fontSize={24} fontStyle="bold" letterSpacing={3} fontFamily="system-ui, sans-serif" fill="#aa851c" />
            <Text x={0} y={80} width={940} align="center" text={petolifeId} fontSize={58} fontStyle="bold" fontFamily="system-ui, sans-serif" fill="#123d2f" />
            
            {/* Copy Button Group with large transparent click hitbox */}
            <Group 
              x={840} 
              y={100} 
              width={80} 
              height={80}
              onClick={handleCopy}
              onTouchStart={handleCopy}
              onMouseEnter={(e) => {
                const container = e.target.getStage().container();
                container.style.cursor = "pointer";
              }}
              onMouseLeave={(e) => {
                const container = e.target.getStage().container();
                container.style.cursor = "default";
              }}
            >
              <Rect x={0} y={0} width={80} height={80} fill="white" opacity={0.01} />
              
              {/* Copy Icon transforms into checkmark when copied */}
              {copied ? (
                <Path 
                  x={23} 
                  y={22} 
                  data={SVG_PATHS.check} 
                  fill="#2e7d32" 
                  scaleX={1.5} 
                  scaleY={1.5} 
                />
              ) : (
                <Path 
                  x={25} 
                  y={20} 
                  data={SVG_PATHS.copy} 
                  fill="#406950" 
                  scaleX={1.5} 
                  scaleY={1.5} 
                />
              )}
            </Group>
            
            {/* Small diamond/star at bottom center */}
            <Rect x={460} y={170} width={16} height={16} fill="#aa851c" rotation={45} />
          </Group>

          {/* Bottom Area */}
          
          {/* Left: Pet Parent — teal avatar icon matching standard user avatar */}
          <Group x={120} y={1080}>
            {/* Teal circle background */}
            <Circle x={80} y={60} radius={62} fill="#57be9b" />
            {/* White user silhouette clipped inside the circle */}
            <Group clipFunc={(ctx) => ctx.arc(80, 60, 62, 0, Math.PI * 2, false)}>
              {/* White head */}
              <Circle x={80} y={42} radius={21} fill="#ffffff" />
              {/* White shoulder / V-neck body shape */}
              <Path
                data="M 30 106 C 30 76 52 68 80 68 C 108 68 130 76 130 106 C 114 122 98 126 80 126 C 62 126 46 122 30 106 Z"
                fill="#ffffff"
              />
            </Group>
            <Text x={0} y={140} width={160} align="center" text="PET PARENT" fontSize={22} fontStyle="bold" fontFamily="system-ui, sans-serif" fill="#406950" />
            <Text x={-40} y={170} width={240} align="center" text={ownerName} fontSize={38} fontStyle="bold" fontFamily="system-ui, sans-serif" fill="#123d2f" />
          </Group>

          {/* Center: QR Code */}
          <Group x={390} y={1050}>
            <Rect x={0} y={0} width={260} height={260} cornerRadius={24} fill="#ffffff" stroke="#406950" strokeWidth={2} />
            {loadedQr && <KonvaImage image={loadedQr} x={15} y={15} width={230} height={230} />}
          </Group>

          {/* Right: Scan Info */}
          <Group x={680} y={1080}>
            {/* Curved Arrow */}
            <Path data="M 120 10 Q 50 10 20 60" stroke="#87af92" strokeWidth={4} fill="transparent" />
            <Path data="M 15 50 L 20 60 L 30 55" stroke="#87af92" strokeWidth={4} fill="transparent" />
            
            <Text x={40} y={60} text="Scan to" fontSize={34} fontStyle="bold" fontFamily="system-ui, sans-serif" fill="#123d2f" />
            
            <Text x={40} y={105} text="know" fontSize={34} fontStyle="bold" fontFamily="system-ui, sans-serif" fill="#123d2f" />
            <Text x={140} y={105} text={petName} fontSize={34} fontStyle="bold" fontFamily="system-ui, sans-serif" fill="#406950" />
            <Path x={140 + Math.min(petName.length * 20, 180)} y={110} data={SVG_PATHS.heartSolid} fill="#406950" scaleX={1.2} scaleY={1.2} />

            {/* Mini Icons - horizontal spacing adjusted to prevent awkward Emergency Contact wrapping */}
            <Group x={10} y={185}>
              {/* Item 1: Profile */}
              <Group x={0}>
                <Path x={28} y={0} data={SVG_PATHS.user} fill="#406950" scaleX={1.1} scaleY={1.1} />
                <Text x={0} y={35} text="Profile" fontSize={15} align="center" width={80} fontFamily="system-ui, sans-serif" fill="#123d2f" />
              </Group>

              {/* Divider 1 */}
              <Line points={[90, 5, 90, 55]} stroke="#c3d2bb" strokeWidth={1.5} />

              {/* Item 2: Lost & Found */}
              <Group x={100}>
                <Path x={38} y={0} data={SVG_PATHS.shield} fill="#406950" scaleX={1.1} scaleY={1.1} />
                <Text x={0} y={35} text="Lost & Found" fontSize={15} align="center" width={100} fontFamily="system-ui, sans-serif" fill="#123d2f" />
              </Group>

              {/* Divider 2 */}
              <Line points={[215, 5, 215, 55]} stroke="#c3d2bb" strokeWidth={1.5} />

              {/* Item 3: Emergency Contact - Expanded container width from 80 to 100 to fix wrapping */}
              <Group x={225}>
                <Path x={38} y={0} data={SVG_PATHS.phone} fill="#406950" scaleX={1.1} scaleY={1.1} />
                <Text x={0} y={35} text={"Emergency\nContact"} fontSize={13} align="center" width={100} fontFamily="system-ui, sans-serif" fill="#123d2f" lineHeight={1.1} />
              </Group>
            </Group>
          </Group>

          {/* Footer Bar */}
          <Group x={0} y={1340}>
            <Rect x={0} y={0} width={NATIVE_WIDTH} height={80} fill="#e9f2df" cornerRadius={[0, 0, 40, 40]} />
            
            <Circle x={540} y={0} radius={28} fill="#e9f2df" />
            <Path x={526} y={-14} data={SVG_PATHS.paw} fill="#123d2f" scaleX={1.2} scaleY={1.2} />
            
            <Text x={0} y={30} width={NATIVE_WIDTH} align="center" text="Every Pet. One Identity. Better Care." fontSize={26} fontStyle="500" fontFamily="system-ui, sans-serif" fill="#123d2f" />
          </Group>

        </Layer>
      </Stage>
    </div>
  );
});

export default PetKonvaCard;
