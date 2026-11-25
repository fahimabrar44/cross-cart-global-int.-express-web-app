"use client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/hooks/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import Logo from "@/utilities/Logo";
import Image from "next/image";
import {
  BadgeCheck,
  Building2,
  Calculator,
  ChevronsUpDown,
  Factory,
  LogOut,
  Menu,
  PackagePlus,
  PackageSearch,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

interface MenuItem {
  title: string;
  href: string;
  description?: string;
  icon?: React.ReactNode;
  items?: MenuItem[];
  setMobileMenuOpen?: (open: boolean) => void;
}

const NavData = [
  {
    title: "Home",
    href: "/",
    items: [],
  },
  {
    title: "Ship & Track",
    href: "/ship-and-track",
    items: [
      {
        title: "Track Shipment",
        href: "/ship-and-track/track-shipment",
        description:
          "Track your parcel in real-time and stay updated throughout its journey.",
        icon: <PackageSearch className="size-5 shrink-0" />,
      },
      {
        title: "Create Shipment",
        href: "/ship-and-track/create-shipment",
        description:
          "Easily create a new shipment and schedule pickups with just a few clicks.",
        icon: <PackagePlus className="size-5 shrink-0" />,
      },
      {
        title: "Calculate Shipping Charge",
        href: "/ship-and-track/claculate-shipping-charge",
        description:
          "Quickly estimate your shipping charges based on weight and destination.",
        icon: <Calculator className="size-5 shrink-0" />,
      },
    ],
  },
  {
    title: "Logistics Solutions",
    href: "/logistics-solutions",
    items: [
      {
        title: "E-commerce Solutions",
        href: "/logistics-solutions/e-commerce-solutions",
        description:
          "Smart and scalable logistics services designed for online businesses and marketplaces.",
        icon: <ShoppingCart className="size-5 shrink-0" />,
      },
      {
        title: "Business Solutions",
        href: "/logistics-solutions/bussiness-solution",
        description:
          "Reliable logistics support to streamline and optimize your business operations.",
        icon: <Building2 className="size-5 shrink-0" />,
      },
      {
        title: "Industry Solutions",
        href: "/logistics-solutions/industry-solutions",
        description:
          "Customized logistics services for various industries to meet specific supply chain needs.",
        icon: <Factory className="size-5 shrink-0" />,
      },
    ],
  },
  // {
  //   title: "About Us",
  //   href: "/about",
  //   items: [
  //     {
  //       title: "Our Story",
  //       href: "/about/our-story",
  //       description:
  //         "Discover how CrossCart Global Int Express Courier started and our mission to revolutionize delivery services.",
  //       icon: <Users className="size-5 shrink-0" />,
  //     },
  //     {
  //       title: "Our Services",
  //       href: "/about/our-services",
  //       description:
  //         "Explore the wide range of courier and logistics services we provide across the globe.",
  //       icon: <Cog className="size-5 shrink-0" />,
  //     },
  //     {
  //       title: "Our Work Process",
  //       href: "/about/our-work-process",
  //       description:
  //         "Meet the dedicated professionals driving CrossCart Global Int Express Courier’s success and innovation.",
  //       icon: <BriefcaseBusiness className="size-5 shrink-0" />,
  //     },
  //     {
  //       title: "Our Team",
  //       href: "/about/our-team",
  //       description:
  //         "A passionate team committed to delivering excellence in logistics and customer care.",
  //       icon: <ShieldHalf className="size-5 shrink-0" />,
  //     },
  //   ],
  // },
  {
    title: "API Integration",
    href: "/api-integration",
    items: [],
  },
  {
    title: "Contact",
    href: "/contact",
    items: [],
  },

  {
    title: "Career",
    href: "/career",
    items: [],
  },
  {
    title: "Cross Cart Corporate",
    href: "/crosscart-corporate",
    items: [],
  },
];

const NavBar = () => {
  const [navBarScrolled, setNavBarScrolled] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { user, isAuthenticated, logout } = useAuth();
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    let frame = 0;

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setNavBarScrolled(window.scrollY > 8);
        frame = 0;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 w-full border-b border-soft-green bg-white/95 backdrop-blur-md transition-shadow duration-200 supports-[backdrop-filter]:bg-white/90 ${
        navBarScrolled ? "shadow-card" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-2 px-3 sm:h-[72px] sm:px-4 lg:px-6">
        {/* Logo */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
          <Logo
            className="h-9 w-auto sm:h-11 lg:h-12"
            priority
          />

          {/* NavigationMenu */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList className="space-x-1">
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link
                    href="/"
                    className="font-semibold text-foreground hover:text-primary"
                  >
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* <NavigationMenuItem className="font-semibold text-black hover:text-black">
                <NavigationMenuTrigger className="font-semibold text-black hover:text-black">
                  About Us
                </NavigationMenuTrigger>
                <NavigationMenuContent className="bg-[#12352A] border-[#12352A] border">
                  <ul className="grid gap-2 md:w-[400px] lg:w-[500px] lg:grid-cols-[.85fr_1fr] p-2">
                    <li className="row-span-4">
                      <NavigationMenuLink asChild>
                        <Link
                          href="/about"
                          className="flex h-full w-full flex-col justify-end rounded-md p-4 bg-black no-underline outline-none select-none focus:shadow-md"
                          style={{
                            backgroundImage: `url('/icon.png')`,
                            backgroundSize: "80%",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            height: "100%",
                            width: "100%",
                          }}
                        >
                          <div className="mb-2 text-lg font-semibold text-white">
                            CrossCart Global Int Express Courier
                          </div>
                          <p className="text-sm   leading-tight text-white/80">
                            Beautifully designed components built with Tailwind
                            CSS.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>

                    {NavData?.[3]?.items.map((component) => (
                      <ListItem
                        key={component.title}
                        href={component.href}
                        title={component.title}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem> */}

              <NavigationMenuItem className="font-semibold text-foreground hover:text-primary">
                <NavigationMenuTrigger className="font-semibold text-foreground hover:text-primary">
                  {NavData?.[1]?.title}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="rounded-xl border border-border bg-white shadow-hover">
                  <ul className="flex w-[min(640px,calc(100vw-2rem))] gap-2 p-2 xl:w-[800px]">
                    {NavData?.[1]?.items.map((component) => (
                      <ListItem
                        key={component.title}
                        href={component.href}
                        title={component.title}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                    <li className="hidden shrink-0 overflow-hidden rounded-lg xl:block">
                      <Image
                        src={"/logistic.png"}
                        width={380}
                        height={160}
                        className="h-[160px] w-[380px] object-cover"
                        alt="logistic-image"
                      />
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem className="font-semibold text-foreground hover:text-primary">
                <NavigationMenuTrigger className="font-semibold text-foreground hover:text-primary">
                  Logistics Solutions
                </NavigationMenuTrigger>
                <NavigationMenuContent className="rounded-xl border border-border bg-white shadow-hover">
                  <ul className="flex w-[min(640px,calc(100vw-2rem))] gap-2 p-2 xl:w-[800px]">
                    {NavData?.[2]?.items.map((component) => (
                      <ListItem
                        key={component.title}
                        href={component.href}
                        title={component.title}
                      >
                        {component.description}
                      </ListItem>
                    ))}

                    <li className="hidden shrink-0 overflow-hidden rounded-lg xl:block">
                      <Image
                        src={"/solutions.webp"}
                        width={380}
                        height={160}
                        className="h-[160px] w-[380px] rounded-xl object-cover"
                        alt="Cross Cart Global logistics solutions"
                      />
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link
                    href="/api-integration"
                    className="hover:text-primary font-semibold text-foreground "
                  >
                    API Integration
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Link
                    href="/contact"
                    className="hover:text-primary font-semibold text-foreground "
                  >
                    Contact
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right side buttons */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
          <ul className="hidden items-center gap-3 text-[13px] font-medium text-gray-700 lg:flex xl:gap-4 xl:text-sm">
            <li>
              <Link
                href="/career"
                className="whitespace-nowrap font-semibold text-foreground transition-colors hover:text-primary"
              >
                Career
              </Link>
            </li>
            <li>
              <Link
                href="/crosscart-corporate"
                className="whitespace-nowrap font-semibold text-foreground transition-colors hover:text-primary"
              >
                <span className="xl:hidden">Corporate</span>
                <span className="hidden xl:inline">Cross Cart Corporate</span>
              </Link>
            </li>
          </ul>
          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer rounded-full sm:h-10 sm:w-10">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback className="rounded-full bg-primary text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "bottom"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user?.name}</span>
                      <span className="truncate text-xs">{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="cursor-pointer"
                    onClick={() => {
                      router.push("/dashboard");
                    }}
                  >
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    logout();

                    router.push("/");
                  }}
                >
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {!isAuthenticated && (
            <Link
              href={"/auth/signin"}
              className="whitespace-nowrap rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#087F4F] sm:px-5 sm:py-3"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu */}
          <div className="flex items-center lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Open navigation menu"
                  className="h-10 w-10 shrink-0 cursor-pointer border-border text-foreground hover:bg-primary hover:text-white sm:h-11 sm:w-11"
                >
                  <Menu className="size-5 sm:size-6" />
                </Button>
              </SheetTrigger>
                <SheetContent
                  side="right"
                  className="flex h-[100dvh] w-[min(22rem,92vw)] flex-col gap-0 overflow-hidden p-0 sm:max-w-sm"
                >
                  <SheetHeader className="shrink-0 border-b px-4 py-3 pr-16">
                    <SheetTitle>
                      <div
                        className="flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Logo className="h-10 w-auto" />
                      </div>
                    </SheetTitle>
                  </SheetHeader>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                    <Accordion
                      type="single"
                      collapsible
                      className="flex w-full flex-col gap-1"
                    >
                      {NavData.map((item) =>
                        renderMobileMenuItem({ ...item, setMobileMenuOpen })
                      )}
                    </Accordion>
                  </div>

                  <div className="shrink-0 border-t bg-white p-4">
                    {isAuthenticated && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-auto w-full justify-start gap-3 px-3 py-2"
                          >
                            <Avatar className="h-9 w-9 rounded-lg">
                              <AvatarImage src={user?.avatar} alt={user?.name} />
                              <AvatarFallback className="rounded-lg">
                                {user?.name?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                              <span className="truncate font-medium">
                                {user?.name}
                              </span>
                              <span className="truncate text-xs">
                                {user?.email}
                              </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4 shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                          side={isMobile ? "bottom" : "top"}
                          align="end"
                          sideOffset={4}
                        >
                          <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                              <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage src={user?.avatar} alt={user?.name} />
                                <AvatarFallback className="rounded-lg">
                                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                  {user?.name}
                                </span>
                                <span className="truncate text-xs">
                                  {user?.email}
                                </span>
                              </div>
                            </div>
                          </DropdownMenuLabel>

                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                router.push("/dashboard");
                              }}
                            >
                              <BadgeCheck />
                              Account
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => {
                              setMobileMenuOpen(false);
                              logout();
                              router.push("/");
                            }}
                          >
                            <LogOut />
                            Sign out
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {!isAuthenticated && (
                      <div className="flex w-full items-center gap-3">
                        <Link
                          href={"/auth/signin"}
                          className="flex w-1/2 items-center justify-center rounded-lg bg-primary px-3 py-3 font-bold text-white transition-colors hover:bg-[#087F4F]"
                        >
                          Sign In
                        </Link>
                        <Link
                          href={"/auth/signup"}
                          className="flex w-1/2 items-center justify-center rounded-lg bg-primary px-3 py-3 font-bold text-white transition-colors hover:bg-[#087F4F]"
                        >
                          Sign Up
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="block rounded-lg px-3 py-2 transition text-sm font-medium leading-tight hover:bg-soft-green"
        >
          <div className="text-foreground font-semibold">{title}</div>
          <p className="text-muted-foreground text-xs">{children}</p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

const SubMenuLink = ({ item }: { item: MenuItem }) => {
  return (
    <Link
      className=" hover:text-primary flex select-none flex-row gap-4 rounded-lg p-3 leading-none no-underline outline-none hover:bg-soft-green group transition-all duration-250"
      href={item.href}
      onClick={() => item.setMobileMenuOpen?.(false)}
    >
      <div className="text-primary group-hover:text-primary transition-all duration-250">
        {item.icon}
      </div>
      <div>
        <div className="text-sm font-semibold ">{item.title}</div>
        {item.description && (
          <p className="text-muted-foreground text-sm leading-snug ">
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
};

const renderMobileMenuItem = (item: MenuItem) => {
  if (item.items?.length) {
    return (
      <AccordionItem
        key={item.title}
        value={item.title}
        className="border-b-0 "
      >
        <AccordionTrigger className="min-h-11 py-2 text-base font-semibold text-foreground hover:no-underline cursor-pointer">
          {item.title}
        </AccordionTrigger>
        <AccordionContent
          className="mt-2"
          onClick={() => item.setMobileMenuOpen?.(false)}
        >
          {item.items.map((subItem) => (
            <SubMenuLink key={subItem.title} item={subItem} />
          ))}
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <Link
      key={item.title}
      href={item.href}
      className="flex min-h-11 cursor-pointer items-center py-2 text-base font-semibold text-foreground"
      onClick={() => item.setMobileMenuOpen?.(false)}
    >
      {item.title}
    </Link>
  );
};

export default NavBar;
