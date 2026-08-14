import Logo from "@/utilities/Logo";
import Link from "next/link";
import { FaTwitter, FaYoutube } from "react-icons/fa";
import { FaFacebook } from "react-icons/fa6";
import { IoIosArrowForward } from "react-icons/io";
import { IoLogoLinkedin } from "react-icons/io5";
import { LuInstagram } from "react-icons/lu";

const solutionsFeatures = [
  {
    id: 35681,
    title: "DHL Courier",
    link: "/about/our-services/",
  },

  {
    id: 35682,
    title: "FEDEX Courier",
    link: "/about/our-services/",
  },

  {
    id: 35683,
    title: "UPS Courier",
    link: "/about/our-services/",
  },

  {
    id: 35684,
    title: "ARAMEX Courier",
    link: "/about/our-services/",
  },
  {
    id: 35685,
    title: "DPD Courier",
    link: "/about/our-services/",
  },
  {
    id: 1213,
    title: "Air Freight",
    link: "/about/our-services/",
  },
  {
    id: 35686,
    title: "Sea Freight",
    link: "/about/our-services/",
  },
  {
    id: 4668,
    title: "Custom Clearnces",
    link: "/about/our-services/",
  },
  {
    id: 565465,
    title: "Shipment Tracking",
    link: "/ship-and-track/track-shipment",
  },
  {
    id: 5654658,
    title: "Courier Price Check",
    link: "/ship-and-track/claculate-shipping-charge",
  },
];

const ourCompany = [
  {
    id: 123451345,
    title: "About CrossCart Global Int Express",
    link: "/about/",
  },
  {
    id: 1234513677,
    title: "Our Story",
    link: "/about/our-story",
  },

  {
    id: 12342451,
    title: "Coverage Area",
    link: "/about/coverage-area",
  },

  {
    id: 1234513886,
    title: "Our Team",
    link: "/about/our-team",
  },
  {
    id: 12342457,
    title: "Our Services",
    link: "/about/our-services",
  },
  {
    id: 12342457,
    title: "Our Work Process",
    link: "/about/our-work-process",
  },
  {
    id: 12342466,
    title: "API Integration",
    link: "/api-integration",
  },
  
  {
    id: 12342457,
    title: "Our Blog",
    link: "/about/our-blog",
  },
  {
    id: 565343465,
    title: "Help & Support",
    link: "/about/help-and-support/",
  },
  {
    id: 565343466,
    title: "FAQ",
    link: "/faq",
  },
  {
    id: 565343467,
    title: "Cancellation & COD Policy",
    link: "/policy/cancellation-and-cod",
  },
  {
    id: 565434654,
    title: "Trust & Safety",
    link: "/about/trust-and-safety/",
  },
  {
    id: 5623542653,
    title: "Privacy Policy",
    link: "/about/privacy-policy/",
  },
  {
    id: 5623542652,
    title: "Refund Policy",
    link: "/about/refund-policy/",
  },
];

const FooterBar = () => {
  return (
    <footer className="w-full h-auto bg-[#12352A] text-white">
      <div className="container h-auto m-auto p-5">
        <div className="w-full h-auto p-2 py-6">
          <div className="w-full h-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="lg:border-r border-white/10 border-dashed">
              <div className={"flex gap-2 pb-2"}>
                <Logo isFooter={true} width={220} height={80} />
              </div>

              <div className="text-sm font-medium pr-2 text-[#B7C9C0] py-1">CrossCart Global Int Express connects Bangladesh to the world through trusted global courier partners — DHL, FedEx, UPS, Aramex, and leading local carriers.
We make international delivery smarter, faster, and more affordable by offering exclusive agency rates and hassle-free service. <br />
💼 Direct costs more. CrossCart Global Int Express saves you.
              </div>

              <div className="flex justify-start align-middle items-center gap-3 py-2">
                <Link
                  href={"https://www.facebook.com/crosscart"}
                  target="_blank"
                  className="w-10 h-10 p-1 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex justify-center align-middle items-center transition-colors"
                >
                  <FaFacebook className="w-5 h-5 text-white" />
                </Link>
                <Link
                  href={"https://www.instagram.com/crosscart.global/"}
                  target="_blank"
                  className="w-10 h-10 p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex justify-center align-middle items-center transition-colors"
                >
                  <LuInstagram className="w-5 h-5 text-white" />
                </Link>
                <Link
                  href={"https://x.com/CrossCartGlobal"}
                  target="_blank"
                  className="w-10 h-10 p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex justify-center align-middle items-center transition-colors"
                >
                  <FaTwitter className="w-5 h-5 text-white" />
                </Link>
                <Link
                  href={"https://www.linkedin.com/company/cross-cart-global/"}
                  target="_blank"
                  className="w-10 h-10 p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex justify-center align-middle items-center transition-colors"
                >
                  <IoLogoLinkedin className="w-5 h-5 text-white" />
                </Link>
                <Link
                  href={"https://www.youtube.com/@crosscart.global"}
                  target="_blank"
                  className="w-10 h-10 p-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 flex justify-center align-middle items-center transition-colors"
                >
                  <FaYoutube className="w-5 h-5 text-white" />
                </Link>
              </div>
            </div>
            <div className="group lg:border-r border-white/10 border-dashed relative">
              <h3 className=" text-lg text-white font-semibold ">
                Solutions
              </h3>

              <span className="group-hover:w-[200px] w-[120px] transition-all duration-600 h-[2px] bg-[#F5C400] block"></span>

              <ul className="w-full h-auto text-[#B7C9C0] py-2 pt-4 ">
                {solutionsFeatures.map((item, index) => (
                  <li
                    key={index}
                    className="py-1 flex justify-start items-center align-middle gap-2"
                  >
                    <IoIosArrowForward className="w-5 h-5 text-[#F5C400] duration-300 transition-all" />

                    <Link
                      href={item.link}
                      className=" text-base hover:text-[#F5C400] duration-300 transition-all hover:underline"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="group ">
              <h3 className=" text-lg text-white ">Our Company</h3>

              <span className="group-hover:w-[200px] w-[120px] transition-all duration-600 h-[2px] bg-[#F5C400] block"></span>

              <ul className="w-full h-auto text-[#B7C9C0] py-2 pt-4">
                {ourCompany.map((item, index) => (
                  <li
                    key={index}
                    className="py-1 flex justify-start items-center align-middle gap-2"
                  >
                    <IoIosArrowForward className="w-5 h-5 text-[#F5C400] duration-300 transition-all" />
                    <Link
                      href={item.link}
                      className=" text-base hover:text-[#F5C400] duration-300 transition-all hover:underline"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between align-middle py-4 pb-0 flex-row border-t border-white/10 border-dashed">
          <div className={"text-sm w-full text-center text-[#B7C9C0] "}>
            ©<Link href="/" className="hover:text-[#F5C400]">CrossCart Global Int Express</Link> All Rights
            Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterBar;
