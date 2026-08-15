import Image from "next/image";
import {
  Award,
  Briefcase,
  Heart,
  MapPin,
  Phone,
  Target,
  Users,
} from "lucide-react";

export interface TeamMemberItem {
  name: string;
  position: string;
  image?: string;
  bio?: string;
  experience?: string;
  location?: string;
  keyAchievement?: string;
  social?: { email?: string; phone?: string };
}

const OurTeamMemberSection = ({
  members = [],
}: {
  members?: TeamMemberItem[];
}) => {
  const leadership = members;

  const departments = [
    {
      name: "Operations",
      icon: <Briefcase className="w-8 h-8 text-[#F5C400]" strokeWidth={1.5} />,
      count: 8,
      description:
        "Managing daily logistics operations and ensuring smooth delivery processes",
    },
    {
      name: "Customer Support",
      icon: <Users className="w-8 h-8 text-[#F5C400]" strokeWidth={1.5} />,
      count: 8,
      description: "Providing exceptional customer service and support 24/7",
    },
    {
      name: "Technology",
      icon: <Target className="w-8 h-8 text-[#F5C400]" strokeWidth={1.5} />,
      count: 2,
      description:
        "Developing and maintaining our digital platforms and tracking systems",
    },
    {
      name: "Business Development",
      icon: <Award className="w-8 h-8 text-[#F5C400]" strokeWidth={1.5} />,
      count: 2,
      description: "Expanding partnerships and growing our service network",
    },
  ];

  const values = [
    {
      icon: <Heart className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Customer First",
      description:
        "Every decision we make is focused on providing the best experience for our customers",
    },
    {
      icon: <Users className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Teamwork",
      description:
        "We achieve more together and support each other's growth and success",
    },
    {
      icon: <Target className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Excellence",
      description:
        "We strive for excellence in everything we do, from service to innovation",
    },
    {
      icon: <Award className="w-6 h-6 text-[#F5C400]" strokeWidth={1.5} />,
      title: "Integrity",
      description:
        "We conduct business with honesty, transparency, and ethical practices",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <div className="w-full bg-white overflow-x-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#12352A] mb-6">
              Meet Our Amazing Team
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Behind every successful delivery is a dedicated team of
              professionals who are passionate about connecting Bangladesh with
              the world. Get to know the people who make Cross Cart Global International Express possible.
            </p>
          </div>

          {/* Team Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#12352A] mb-2">20+</div>
              <div className="text-gray-600">Team Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#12352A] mb-2">4+</div>
              <div className="text-gray-600">Departments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#12352A] mb-2">2+</div>
              <div className="text-gray-600">Years Experience</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#12352A] mb-2">98%</div>
              <div className="text-gray-600">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Marque Associates - Simplified Version */}
      <div className="w-full bg-section overflow-x-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#12352A] mb-4">
              Our Marque Associates
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Meet the dedicated associates who represent Cross Cart Global International Express on the ground
              and ensure smooth operations every day.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {leadership.map((leader, idx) => (
              <div
                key={leader.name + idx}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="aspect-square">
                  {leader.image ? (
                    <Image
                      src={leader.image}
                      alt={leader.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-section text-gray-400">
                      <Users className="w-16 h-16" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#12352A] mb-1">
                    {leader.name}
                  </h3>
                  <p className="text-primary font-semibold mb-3">
                    {leader.position}
                  </p>
                  <p className="text-gray-700 text-sm mb-4">{leader.bio}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      {leader.experience}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {leader.location}
                    </div>
                  </div>

                  <div className="bg-section rounded p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Award className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {leader.keyAchievement}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <a
                      href={`tel:${leader.social?.phone}`}
                      className="flex items-center gap-1 text-[#12352A] hover:text-primary transition-colors text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      Call
                    </a>
                    {leader.social?.email && (
                      <a
                        href={`mailto:${leader.social.email}`}
                        className="text-[#12352A] hover:text-primary transition-colors text-sm"
                      >
                        Email
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Overview */}
      <div className="w-full bg-[#12352A] overflow-x-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Our Departments
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Each department plays a crucial role in delivering exceptional
              courier services
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="bg-[#12352A] rounded-lg p-6 text-center hover:bg-[#1c4a36] transition-colors"
              >
                <div className="bg-[#12352A] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  {dept.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {dept.name}
                </h3>
                <div className="text-2xl font-bold text-[#F5C400] mb-3">
                  {dept.count}
                </div>
                <p className="text-gray-300 text-sm">{dept.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="w-full bg-section overflow-x-hidden">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#12352A] mb-4">
              Our Core Values
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide our team and shape our company culture
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="bg-[#12352A] rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#12352A] mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="w-full bg-[#12352A] overflow-x-hidden">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Want to Join Our Team?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            We{"'"}re always looking for talented individuals who share our
            passion for connecting Bangladesh with the world. Explore career
            opportunities with us.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center align-middle items-center">
            <a
              href="/career"
              className="inline-block bg-primary text-white py-3 px-8 rounded-lg hover:bg-[#087F4F] transition-colors font-semibold"
            >
              View Career Opportunities
            </a>
            <a
              href="/contact"
              className="inline-block border-2 border-white text-white py-3 px-8 rounded-lg hover:bg-white hover:text-[#12352A] transition-colors font-semibold"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default OurTeamMemberSection;
