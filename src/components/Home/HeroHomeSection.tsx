import Globe from "../ui/globe";
import HeroHomeSectionBox from "./HeroHomeSectionBox";

const HeroHomeSection = () => {
  return (
    <div className="w-full h-auto bg-soft-green">
      <div className="container m-auto p-4 relative overflow-hidden">
        <Globe
          theta={0.2}
          dark={0}
          scale={1.2}
          diffuse={1.5}
          baseColor="#087F4F"
          markerColor="#F5C400"
          glowColor="#087F4F"
          className={` container left-0 absolute -bottom-[20%] sm:-bottom-[60%] md:-bottom-[80%] lg:-bottom-[120%] xl:-bottom-[130%] m-auto  opacity-50`}
        />

        <div className="w-full h-auto pt-6 sm:pt-15 pb-6 z-[10] relative flex justify-center text-center align-middle items-center flex-col">
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold text-foreground overflow-hidden z-[10]">
            CROSS CART GLOBAL INTERNATIONAL EXPRESS
          </h1>
          <h3 className="text-base sm:text-2xl md:text-3xl font-semibold text-primary z-[10]">
            CROSS BORDER, CARRYING TRUST
          </h3>
        </div>
        <HeroHomeSectionBox />
      </div>
    </div>
  );
};

export default HeroHomeSection;
