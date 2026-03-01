import React from 'react';
import { Phone, Mail } from 'lucide-react';

const Team = () => {
    const boardMembers = [
        { name: "Mr. Prajapati Sapkota", role: "Chairman", phone: "9857024293", email: "sevenstar.school2063@gmail.com", image: "/team-prajapati.jpg" },
        { name: "Mohan Giri", role: "Managing Director", phone: "9847048815", email: null, image: "/team-mohan.jpg" },
        { name: "Tirtha Raj Panthee", role: "Vice-Principal", phone: "9851206206", email: "panthitirtha1@gmail.com", image: "/team-tirtha.jpg" },
        { name: "Tikaram Chapagain", role: "Principal / Secretary", phone: "9857078448", email: "tikaramchapain238@gmail.com", image: "/team-tikaram1.jpg" },
        { name: "Muktiram Chapagain", role: "Account Incharge", phone: "9847120012", email: null, image: "/team-muktiram1.jpg" },
        { name: "Ramesh Lal Khanal", role: "Accountant", phone: "9847049025", email: null, image: "/team-ramesh1.jpg" },
        { name: "Baburam Giri", role: "Primary Incharge / Share Holder", phone: "9847216321", email: null, image: "/team-baburum1.jpg" },
    ];

    const featured = boardMembers.filter(m => m.role === "Chairman" || m.role === "Principal / Secretary");
    const others = boardMembers.filter(m => m.role !== "Chairman" && m.role !== "Principal / Secretary");

    return (
        <section id="team" className="py-12 sm:py-16 md:py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10 sm:mb-14">
                    <h2 className="section-title">Our Leadership</h2>
                    <div className="section-divider" />
                    <p className="section-subtitle">
                        Meet the dedicated Board of Directors guiding Seven Star English Boarding School toward excellence.
                    </p>
                </div>

                {/* Featured: Chairman & Principal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 mb-8 sm:mb-10 max-w-4xl mx-auto">
                    {featured.map((member, idx) => (
                        <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border-t-4 border-t-primary">
                            <div className="p-5 sm:p-8 text-center">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-20 h-20 sm:w-28 sm:h-28 rounded-full mx-auto mb-3 sm:mb-5 object-cover border-4 border-primary/10 shadow-lg"
                                />
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 font-serif mb-1">{member.name}</h3>
                                <span className="inline-block px-3 py-1 bg-accent/15 text-accent-dark text-xs font-bold rounded uppercase tracking-wide mb-3 sm:mb-4">
                                    {member.role}
                                </span>
                                <div className="space-y-1.5 sm:space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <Phone className="w-4 h-4 text-primary" />
                                        <a href={`tel:+977${member.phone}`} className="hover:text-primary transition-colors">{member.phone}</a>
                                    </div>
                                    {member.email && (
                                        <div className="flex items-center justify-center gap-2">
                                            <Mail className="w-4 h-4 text-primary" />
                                            <a href={`mailto:${member.email}`} className="hover:text-primary transition-colors text-xs truncate max-w-[180px]">{member.email}</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Other Members */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
                    {others.map((member, idx) => (
                        <div key={idx} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow text-center p-3 sm:p-5 border-t-2 border-t-accent group">
                            <img
                                src={member.image}
                                alt={member.name}
                                className="w-14 h-14 sm:w-20 sm:h-20 rounded-full mx-auto mb-2 sm:mb-3 object-cover border-2 border-gray-100 group-hover:border-primary/20 transition-colors"
                            />
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5 truncate">{member.name}</h4>
                            <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">{member.role}</span>
                            <div className="mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-400">
                                <a href={`tel:+977${member.phone}`} className="hover:text-primary transition-colors">{member.phone}</a>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Team;
