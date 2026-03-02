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
        <section id="team" className="py-14 sm:py-20 md:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-80 h-80 bg-primary/3 rounded-full blur-3xl -translate-x-1/2" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12 sm:mb-16">
                    <span className="inline-block text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">Our Team</span>
                    <h2 className="section-title">Our Leadership</h2>
                    <div className="section-divider" />
                    <p className="section-subtitle max-w-2xl mx-auto">
                        Meet the dedicated Board of Directors guiding Seven Star English Boarding School toward excellence.
                    </p>
                </div>

                {/* Featured: Chairman & Principal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-14 max-w-4xl mx-auto">
                    {featured.map((member, idx) => (
                        <div key={idx} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                            <div className="p-6 sm:p-8 text-center">
                                <div className="relative inline-block mb-4 sm:mb-5">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl mx-auto object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                                    />
                                    <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 -z-10 blur-sm" />
                                </div>
                                <h3 className="text-base sm:text-lg font-bold text-gray-900 font-serif mb-1.5">{member.name}</h3>
                                <span className="inline-block px-4 py-1.5 bg-gradient-to-r from-accent/15 to-accent/5 text-accent-dark text-xs font-bold rounded-full uppercase tracking-wide mb-4">
                                    {member.role}
                                </span>
                                <div className="space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                                            <Phone className="w-3.5 h-3.5 text-primary" />
                                        </span>
                                        <a href={`tel:+977${member.phone}`} className="hover:text-primary transition-colors">{member.phone}</a>
                                    </div>
                                    {member.email && (
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                                                <Mail className="w-3.5 h-3.5 text-primary" />
                                            </span>
                                            <a href={`mailto:${member.email}`} className="hover:text-primary transition-colors text-xs truncate max-w-[180px]">{member.email}</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Other Members */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
                    {others.map((member, idx) => (
                        <div key={idx} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center p-4 sm:p-5 border border-gray-100 relative">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-accent to-accent-light" />
                            <img
                                src={member.image}
                                alt={member.name}
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl mx-auto mb-3 object-cover border-2 border-gray-100 group-hover:border-primary/20 transition-all group-hover:shadow-md"
                            />
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 mb-0.5 truncate">{member.name}</h4>
                            <span className="text-[10px] sm:text-[11px] text-gray-500 font-medium">{member.role}</span>
                            <div className="mt-2 text-[10px] sm:text-xs text-gray-400">
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
