import React, { useEffect, useState } from 'react';
import { Facebook, MessageCircle, Mail, MapPin, Phone, ChevronRight, ArrowUp, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSiteSettings } from '../../api';

const Footer = () => {
    const [settings, setSettings] = useState({});
    const [showModal, setShowModal] = useState(null); // 'privacy' | 'terms' | null
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
            <footer className="bg-gray-900 text-gray-300">
                {/* Main Footer */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">

                        {/* Brand */}
                        <div className="col-span-2 sm:col-span-2 lg:col-span-1">
                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                                <img src="/logo.png" alt="Sevenstar Logo" className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover" />
                                <div>
                                    <span className="font-serif font-bold text-lg text-white leading-tight block">{settings.school_name || 'Seven Star'}</span>
                                    <span className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">{settings.tagline || 'English Boarding School'}</span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed mb-5">
                                {settings.established_year ? `Established in ${settings.established_year} B.S.` : 'Established in 2063 B.S.'} — {settings.address || 'Devdaha-2, Rupandehi'}
                            </p>
                            <div className="flex gap-3">
                                <a href="https://www.facebook.com/profile.php?id=100037085914325" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors text-gray-400 hover:text-white">
                                    <Facebook className="w-4 h-4" />
                                </a>
                                <a href="https://wa.me/9779857078448?text=Namaste%21" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded bg-gray-800 flex items-center justify-center hover:bg-green-600 transition-colors text-gray-400 hover:text-white">
                                    <MessageCircle className="w-4 h-4" />
                                </a>
                                <a href={`mailto:${settings.email || 'sevenstar.school2063@gmail.com'}`} className="w-9 h-9 rounded bg-gray-800 flex items-center justify-center hover:bg-primary transition-colors text-gray-400 hover:text-white">
                                    <Mail className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5 font-serif">Quick Links</h4>
                            <ul className="space-y-2.5">
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
                                        <a href={link.href} className="text-gray-400 hover:text-accent transition-colors flex items-center text-sm group">
                                            <ChevronRight className="w-3.5 h-3.5 mr-1.5 text-primary group-hover:text-accent transition-colors" /> {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Important Links */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5 font-serif">Important</h4>
                            <ul className="space-y-2.5">
                                {[
                                    { name: 'Exam Schedule', href: '/exam-schedule', isRoute: true },
                                    { name: 'Check Results', href: '/results', isRoute: true },
                                    { name: 'Apply Online', href: '/admission', isRoute: true },
                                    { name: 'ERP Login', href: '/login', isRoute: true },
                                ].map((link, idx) => (
                                    <li key={idx}>
                                        <Link to={link.href} className="text-gray-400 hover:text-accent transition-colors flex items-center text-sm group">
                                            <ChevronRight className="w-3.5 h-3.5 mr-1.5 text-primary group-hover:text-accent transition-colors" /> {link.name}
                                        </Link>
                                    </li>
                                ))}
                                {['Montessori / Nursery', 'Primary Education', 'Lower Secondary', 'Secondary (SEE)', '+2 Management', '+2 Computer Science', '+2 Education'].map((link, idx) => (
                                    <li key={`p-${idx}`}>
                                        <a href="#programs" className="text-gray-400 hover:text-accent transition-colors flex items-center text-sm group">
                                            <ChevronRight className="w-3.5 h-3.5 mr-1.5 text-primary group-hover:text-accent transition-colors" /> {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-5 font-serif">Contact Us</h4>
                            <div className="space-y-4 text-sm">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span className="text-gray-400">{settings.address || 'Devdaha-2, Rupandehi, Nepal'}</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <span className="text-gray-400">
                                        <a href="tel:9857078448" className="hover:text-white transition-colors">9857078448</a>
                                        {' / '}
                                        <a href="tel:9851206206" className="hover:text-white transition-colors">9851206206</a>
                                    </span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                    <a href={`mailto:${settings.email || 'sevenstar.school2063@gmail.com'}`} className="text-gray-400 hover:text-white transition-colors">{settings.email || 'sevenstar.school2063@gmail.com'}</a>
                                </div>
                            </div>

                            <div className="mt-5 pt-5 border-t border-gray-800">
                                <p className="text-xs text-gray-500 mb-1">Office Hours</p>
                                <p className="text-sm text-gray-400">Sun - Fri: 9:00 AM - 5:00 PM</p>
                                {settings.principal_name && <p className="text-xs text-gray-500 mt-1">Principal: <span className="text-white">{settings.principal_name}</span></p>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
                        <p>&copy; {new Date().getFullYear()} {settings.school_name || 'Seven Star English Boarding School'}. All rights reserved.</p>
                        <div className="flex items-center gap-4 mt-3 md:mt-0">
                            <button onClick={() => setShowModal('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
                            <span className="text-gray-700">|</span>
                            <button onClick={() => setShowModal('terms')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button>
                            <button onClick={scrollToTop} className="ml-4 w-8 h-8 rounded bg-primary hover:bg-primary-dark text-white flex items-center justify-center transition-colors">
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
