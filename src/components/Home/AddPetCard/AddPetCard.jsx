import React from "react";

const AddPetCard = ({ onAddPet }) => {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-[32px]
        border
        border-[#E7EFEA]
        bg-white/90
        px-8
        py-10
        shadow-[0_20px_50px_rgba(0,75,73,0.08)]
        backdrop-blur-xl
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_25px_60px_rgba(0,75,73,0.12)]
      "
      style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Background Glow */}
      <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-[#84B662]/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[#004B49]/5 blur-3xl" />

      {/* Decorative Paw */}
      <div className="absolute top-5 left-5 text-3xl opacity-5">
        🐾
      </div>

      <div className="relative flex flex-col items-center">
        {/* Premium Icon */}
        <div className="relative mb-7">
          <div className="absolute inset-0 scale-110 rounded-[28px] bg-[#84B662]/20 blur-xl" />

          <div
            className="
              relative
              flex
              h-24
              w-24
              items-center
              justify-center
              rounded-[28px]
              border
              border-[#EEF4EE]
              bg-white
              shadow-[0_10px_30px_rgba(0,75,73,0.08)]
            "
          >
            <svg
              viewBox="0 0 64 64"
              className="h-11 w-11"
              fill="#84B662"
            >
              <ellipse cx="32" cy="42" rx="14" ry="11" />
              <ellipse cx="14" cy="26" rx="6" ry="8" />
              <ellipse cx="50" cy="26" rx="6" ry="8" />
              <ellipse cx="23" cy="14" rx="5.5" ry="7" />
              <ellipse cx="41" cy="14" rx="5.5" ry="7" />
            </svg>
          </div>

          {/* Floating Add */}
          <div
            className="
              absolute
              -bottom-1
              -right-1
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-[#84B662]
              text-xl
              font-bold
              text-white
              ring-4
              ring-white
              shadow-lg
            "
          >
            +
          </div>
        </div>

        {/* Heading */}
        <h2
          className="
            text-center
            text-[28px]
            font-extrabold
            tracking-[-0.04em]
            leading-[0.1]
          "
        >
          <span className="text-[#004B49]">
            Add your
          </span>

          <br />

          <span className="text-[#84B662]">
            first pet
          </span>
        </h2>

        {/* Subtitle */}
        <p
          className="
            mt-5
            max-w-[310px]
            text-center
            text-[15px]
            font-medium
            leading-7
            text-[#667774]
          "
        >
          Start managing your pet's
          health records, vaccinations,
          appointments and daily care
          in one beautiful place.
        </p>

        {/* Premium Button */}
        <button
          onClick={onAddPet}
          className="
            group
            mt-8
            flex
            h-14
            w-full
            max-w-[230px]
            items-center
            justify-center
            gap-3
            rounded-2xl
            border
            border-[#0F5B57]
            bg-[#004B49]
            px-6
            text-[15px]
            font-semibold
            text-white
            shadow-[0_8px_20px_rgba(0,75,73,0.15)]
            transition-all
            duration-300
            hover:-translate-y-1
            hover:bg-[#005754]
            hover:shadow-[0_12px_30px_rgba(0,75,73,0.20)]
          "
        >
          <div
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              bg-[#84B662]
              transition-transform
              duration-300
              group-hover:rotate-90
            "
          >
            +
          </div>

          Add Your Pet
        </button>

</div>
    </div>
  );
};

export default AddPetCard;