import React, { useEffect, useState } from 'react';
import { Facebook, MessageCircle, Mail, MapPin, Phone, ChevronRight, ArrowUp, X, Heart, GraduationCap, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSiteSettings } from '../../api';

const Footer = () => {
    const [settings, setSettings] = useState({});
    const [showModal, setShowModal] = useState(null);
    useEffect(() => { getSiteSettings().then(s => setSettings(s || {})).catch(() => { }); }, []);
    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const privacyContent = [
        "Seven Star English Boarding School is committed to protecting the privacy of students, parents, and visitors.",
        "Personal information collected through our website (contact forms, admission applications) is used solely for communication and enrollment purposes.",
        "We do not sell, rent, or share personal data with third parties.",
        "Student records, academic data, and photographs are kept confidential and shared only with authorized school personnel and parents/guardians.",
        "Our website may use cookies to improve your browsing experience.",
        "For any privacy-related concerns, please contact sevenstar.school2063@gmail.com.",
    ];

    const termsContent = [
        "By using this website and our services, you agree to these terms and conditions.",
        "Admission to the school is subject to availability and entrance assessment results.",
        "Fees once paid are non-refundable. Fee structure may be revised at the start of each academic session.",
        "Students must follow the school code of conduct. Violation may lead to disciplinary action.",
        "The school is not responsible for loss of personal belongings on campus.",
        "All content on this website (text, images, logos) is property of Seven Star English Boarding School and may not be reproduced without permission.",
        "The school reserves the right to update these terms at any time.",
    ];

    return (
        <>
            {/* CTA Banner above Footer */}
            <section className="relative bg-gradient-to-r from-primary via-primary-dark to-primary overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-60 h-60 bg-accent rounded-full translate-x-1/3 translate-y-1/3" />
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white mb-2">
                                Ready to Join Our Family?
                            </h3>
                            <p className="text-white/80 text-sm sm:text-base max-w-lg">
                                Give your child the gift of quality education. Apply now for admission to Seven Star English Boarding School.
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link to="/admission" className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-bold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-accent/40 transition-all transform hover:-translate-y-1 text-sm sm:text-base">
                                <GraduationCap className="w-4 h-4" />
                                Apply Now
                            </Link>
                            <a href="tel:9857078448" className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 py-3.5 rounded-xl hover:bg-white/10 hover:border-white/60 transition-all transform hover:-translate-y-1 font-semibold text-sm sm:text-base">
                                <Phone className="w-4 h-4" />
                                Call Us
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-gray-300 relative overflow-hidden">
                {/* Decorative top border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
                
                {/* Subtle decorative elements */}
                <div className="absolute top-20 right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 left-10 w-48 h-48 bg-accent/5 rounded-full blur-3xl" />

                {/* Main Footer */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative z-10">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12">

                        {/* Brand */}
                        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="relative">
                                    <img src="/logo.png" alt="Sevenstar Logo" className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl object-cover shadow-lg" />
                                    <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 -z-10 blur-sm" />
                                </div>
                                <div>
                                    <span className="font-serif font-bold text-lg sm:text-xl text-white leading-tight block">{settings.school_name || 'Seven Star'}</span>
                                    <span className="text-[10px] text-accent/80 font-semibold tracking-wider uppercase">{settings.tagline || 'English Boarding School'}</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed mb-6">
                                {settings.established_year ? `Established in ${settings.established_year} B.S.` : 'Established in 2063 B.S.'} — Providing quality education in {settings.address || 'Devdaha-2, Rupandehi'}.
                            </p>
                            <div className="flex gap-2.5">
                                <a href="https://www.facebook.com/profile.php?id=100037085914325" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-800/80 border border-gray-700/50 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-600/20 transition-all text-gray-400 hover:text-white hover:-translate-y-0.5">
                                    <Facebook className="w-4 h-4" />
                                </a>
                                <a href="https://wa.me/9779857078448?text=Namaste%21" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-800/80 border border-gray-700/50 flex items-center justify-center hover:bg-green-600 hover:border-green-500 hover:shadow-lg hover:shadow-green-600/20 transition-all text-gray-400 hover:text-white hover:-translate-y-0.5">
                                    <MessageCircle className="w-4 h-4" />
                                </a>
                                <a href={`mailto:${settings.email || 'sevenstar.school2063@gmail.com'}`} className="w-10 h-10 rounded-xl bg-gray-800/80 border border-gray-700/50 flex items-center justify-center hover:bg-primary hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all text-gray-400 hover:text-white hover:-translate-y-0.5">
                                    <Mail className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6 font-serif flex items-center gap-2">
                                <span className="w-6 h-0.5 bg-accent rounded-full"></span>
                                Quick Links
                            </h4>
                            <ul className="space-y-3">
                                {[
                                    { name: 'Home', href: '#hero' },
                                    { name: 'About Us', href: '#about' },
                                    { name: 'Academic Programs', href: '#programs' },
                                    { name: 'Admissions', href: '#admissions' },
                                    { name: 'Fee Structure', href: '#fees' },
                                    { name: 'Facilities', href: '#facilities' },
                                    { name: 'Gallery', href: '#gallery' },
                                    { name: 'Notice Board', href: '#notices' },
                                    { name: 'Contact Us', href: '#contact' },
                                ].map((link, idx) => (
                                    <li key={idx}>
                                        <a href={link.href} className="text-gray-400 hover:text-white transition-all flex items-center text-sm group hover:translate-x-1">
                                            <ChevronRight className="w-3.5 h-3.5 mr-2 text-accent/60 group-hover:text-accent transition-colors" /> {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Important Links */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6 font-serif flex items-center gap-2">
                                <span className="w-6 h-0.5 bg-accent rounded-full"></span>
                                Important
                            </h4>
                            <ul className="space-y-3">
                                {[
                                    { name: 'Exam Schedule', href: '/exam-schedule', isRoute: true },
                                    { name: 'Check Results', href: '/results', isRoute: true },
                                    { name: 'Apply Online', href: '/admission', isRoute: true },
                                    { name: 'ERP Login', href: '/login', isRoute: true },
                                ].map((link, idx) => (
                                    <li key={idx}>
                                        <Link to={link.href} className="text-gray-400 hover:text-white transition-all flex items-center text-sm group hover:translate-x-1">
                                            <ChevronRight className="w-3.5 h-3.5 mr-2 text-accent/60 group-hover:text-accent transition-colors" /> {link.name}
                                        </Link>
                                    </li>
                                ))}
                                {['Montessori / Nursery', 'Primary Education', 'Lower Secondary', 'Secondary (SEE)', '+2 Management', '+2 Computer Science', '+2 Education'].map((link, idx) => (
                                    <li key={`p-${idx}`}>
                                        <a href="#programs" className="text-gray-400 hover:text-white transition-all flex items-center text-sm group hover:translate-x-1">
                                            <ChevronRight className="w-3.5 h-3.5 mr-2 text-accent/60 group-hover:text-accent transition-colors" /> {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-6 font-serif flex items-center gap-2">
                                <span className="w-6 h-0.5 bg-accent rounded-full"></span>
                                Contact Us
                            </h4>
                            <div className="space-y-4 text-sm">
                                <div className="flex items-start gap-3 group">
                                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                    </span>
                                    <span className="text-gray-400">{settings.address || 'Devdaha-2, Rupandehi, Nepal'}</span>
                                </div>
                                <div className="flex items-start gap-3 group">
                                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                                        <Phone className="w-3.5 h-3.5 text-primary" />
                                    </span>
                                    <span className="text-gray-400">
                                        <a href="tel:9857078448" className="hover:text-white transition-colors block">985-7078448</a>
                                        <a href="tel:9851206206" className="hover:text-white transition-colors block mt-0.5">985-1206206</a>
                                    </span>
                                </div>
                                <div className="flex items-start gap-3 group">
                                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary/20 transition-colors">
                                        <Mail className="w-3.5 h-3.5 text-primary" />
                                    </span>
                                    <a href={`mailto:${settings.email || 'sevenstar.school2063@gmail.com'}`} className="text-gray-400 hover:text-white transition-colors break-all">{settings.email || 'sevenstar.school2063@gmail.com'}</a>
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-gray-800/80 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-3.5 h-3.5 text-accent" />
                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Office Hours</p>
                                </div>
                                <p className="text-sm text-gray-400">Sun - Fri: 9:00 AM - 5:00 PM</p>
                                {settings.principal_name && <p className="text-xs text-gray-500 mt-2">Principal: <span className="text-white font-medium">{settings.principal_name}</span></p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800/60 relative z-10">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-gray-500">
                        <p className="text-center md:text-left">
                            &copy; {new Date().getFullYear()} {settings.school_name || 'Seven Star English Boarding School'}. All rights reserved. 
                            <span className="hidden sm:inline"> — Made with <Heart className="w-3 h-3 inline text-primary mx-0.5" /> in Nepal</span>
                        </p>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setShowModal('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
                            <span className="text-gray-700">|</span>
                            <button onClick={() => setShowModal('terms')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button>
                            <button onClick={scrollToTop} className="ml-3 w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-dark hover:from-accent hover:to-accent-dark text-white flex items-center justify-center transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/30" aria-label="Scroll to top">
                                <ArrowUp className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Privacy / Terms Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="bg-primary px-6 py-4 flex items-center justify-between">
                            <h3 className="text-white font-bold font-serif text-lg">
                                {showModal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
                            </h3>
                            <button onClick={() => setShowModal(null)} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 4rem)' }}>
                            <p className="text-sm font-bold text-gray-700 mb-4">Seven Star English Boarding School — Devdaha, Rupandehi</p>
                            <div className="space-y-3">
                                {(showModal === 'privacy' ? privacyContent : termsContent).map((item, i) => (
                                    <p key={i} className="text-sm text-gray-600 leading-relaxed flex items-start gap-2">
                                        <span className="text-primary font-bold mt-0.5">•</span> {item}
                                    </p>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-6 border-t border-gray-100 pt-4">
                                Last updated: Magh 2082 B.S. — For questions, contact sevenstar.school2063@gmail.com
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Footer;
