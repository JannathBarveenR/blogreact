import React from "react";
import defaultHeroImage from "../../../assets/hero.png";

export default function HeroSection({ heroImage = defaultHeroImage }) {
  return (
    <section
      className="relative w-full aspect-[4/3] sm:aspect-[16/9] overflow-hidden rounded-[28px] shadow-[0_2px_10px_rgba(0,75,73,0.06)] bg-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="absolute left-7 top-15 h-full flex items-start pt-6 sm:pt-8">
        <div className="w-[52%] pl-6 sm:pl-8 md:pl-10">
          <p className="text-[#84B662] text-base sm:text-lg font-semibold">
            Welcome to
          </p>

          <h1 className="mt-1 font-black leading-none">
            <span className="text-[#004B49] text-[34px] sm:text-[44px] md:text-[50px]">
              Peto
            </span>
            <span className="text-[#84B662] text-[34px] sm:text-[44px] md:text-[50px]">
              life
            </span>
          </h1>

          <p className="mt-3 text-[#294744] text-base sm:text-lg leading-7 max-w-[200px] sm:max-w-[260px]">
            Your pet's health journey starts here.
            <span className="ml-1">💚</span>
          </p>

        </div>
      </div>

      <svg
        viewBox="0 0 64 64"
        fill="none"
        className="absolute bottom-3 left-4 sm:bottom-5 sm:left-6 w-5 h-5 sm:w-7 sm:h-7 fill-[#d7e4cc] opacity-80"
      >
        <ellipse cx="32" cy="42" rx="16" ry="13" />
        <ellipse cx="12" cy="24" rx="7" ry="9" />
        <ellipse cx="52" cy="24" rx="7" ry="9" />
        <ellipse cx="22" cy="12" rx="6" ry="8" />
        <ellipse cx="42" cy="12" rx="6" ry="8" />
      </svg>
    </section>
  );
}