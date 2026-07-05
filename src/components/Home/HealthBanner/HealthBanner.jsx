import React from "react";
import petsImage from "../../../assets/banner.png";

export default function MomentsBanner({ onLearnMore }) {
  return (
    <section className="relative w-full overflow-hidden rounded-[24px] bg-[#F4F5F0] shadow-[0_8px_25px_rgba(0,75,73,0.08)]">
      <div className="flex items-center">
        {/* Text */}
        <div className="
  w-[58%]
  sm:w-[52%]
  md:w-[45%]
  px-6
  sm:px-8
  md:px-10
  py-7
  sm:py-8
">
          
<h2
  className="
    text-[#004B49]
    font-extrabold
    absolute left-2 top-2
    text-[15px]
    sm:text-[24px]
    md:text-[28px]
    leading-[1.15]
    tracking-[-0.03em]
  "
>
  Every moment matters
</h2>
<p
  className="
    mt-3
    max-w-[230px]
    absolute left-2 top-8
    text-[#5E706D]
    text-[14px]
    sm:text-[15px]
    md:text-[17px]
    leading-6
    font-medium
  "
>
  Track, care and keep your
  <br/>
  pet happy &amp; healthy.
</p>
        </div>

        {/* Image */}
        <div className="w-[45%] sm:w-[50%] md:w-[58%]">
          <img
            src={petsImage}
            alt="Golden retriever puppy and kitten"
            className="h-full w-full object-cover object-left"
          />
        </div>
      </div>
    </section>
  );
}