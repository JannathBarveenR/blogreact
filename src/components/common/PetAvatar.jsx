import React from "react";
import { PawPrint, Dog, Cat, Bird, Rabbit } from "lucide-react";

export function PetAvatar({ src, petType, className, size = 48, iconColor = "#9ca3af", alt = "pet" }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
        }}
      />
    );
  }

  const getIcon = () => {
    switch (petType?.toLowerCase()) {
      case "dog":
        return <Dog size="100%" color={iconColor} strokeWidth={1.5} />;
      case "cat":
        return <Cat size="100%" color={iconColor} strokeWidth={1.5} />;
      case "bird":
        return <Bird size="100%" color={iconColor} strokeWidth={1.5} />;
      case "rabbit":
        return <Rabbit size="100%" color={iconColor} strokeWidth={1.5} />;
      default:
        return <PawPrint size="100%" color={iconColor} strokeWidth={1.5} />;
    }
  };

  return (
    <div
      className={`default-pet-avatar ${className || ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f3f4f6",
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "50%",
      }}
    >
      {getIcon()}
    </div>
  );
}
