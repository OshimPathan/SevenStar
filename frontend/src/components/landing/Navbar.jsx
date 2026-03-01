import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Phone, Mail, Clock, MapPin, ChevronDown, ChevronRight, Facebook } from 'lucide-react';
import { getSiteSettings } from '../../api';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [mobileDropdown, setMobileDropdown] = useState(null);
    const [activeSection, setActiveSection] = useState('hero');
    const [settings, setSettings] = useState({});
    const [now, setNow] = useState(new Date());
    const menuRef = useRef(null);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 80);
            const sections = ['hero', 'notices', 'about', 'programs', 'facilities', 'gallery', 'admissions', 'team', 'testimonials', 'contact'];
            let current = 'hero';
            for (const id of sections) {
                const el = document.getElementById(id);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    if (rect.top <= 150) current = id;
                }
            }
            setActiveSection(current);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => { getSiteSettings().then(s => setSettings(s || {})).catch(() => { }); }, []);
    useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

    // Close mobile menu on outside click
    useEffect(() => {
        const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false); };
        if (isOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const formatNow = (d) => d.toLocaleString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    const navLinks = [
        { name: 'Home', href: '#hero' },
        {
            name: 'About', href: '#about',
            children: [
                { name: 'About Us', href: '#about' },
                { name: 'Our Leadership', href: '#team' },
                { name: 'Testimonials', href: '#testimonials' },
            ]
        },
        {
            name: 'Academics', href: '#programs',
            children: [
                { name: 'School Programs (Nursery–10)', href: '#programs' },
                { name: 'Higher Secondary (+2)', href: '#programs' },
                { name: 'Facilities & Campus', href: '#facilities' },
                { name: 'Gallery', href: '#gallery' },
            ]
        },
        {
            name: 'Admissions', href: '#admissions',
            children: [
                { name: 'Admission Process', href: '#admissions' },
                { name: 'Apply Online', href: '/admission', isRoute: true },
                { name: 'Scholarships', href: '#admissions' },
            ]
        },
        {
            name: 'Exam', href: '/exam-schedule', isRoute: true,
            children: [
                { name: 'Exam Schedule', href: '/exam-schedule', isRoute: true },
                { name: 'Check Results', href: '/results', isRoute: true },
            ]
        },
        { name: 'Notices', href: '#notices' },
        { name: 'Contact', href: '#contact' },
    ];

    const toggleMobileDropdown = (name) => {
        setMobileDropdown(mobileDropdown === name ? null : name);
    };

    return (
        <>
            {/* Top Bar - Desktop */}
            <div className="bg-primary text-white text-xs hidden lg:block">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-10">
                    <div className="flex items-center gap-6">
                        <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3" /> {settings.phone || '9857078448'} {settings.phone_secondary ? `/ ${settings.phone_secondary}` : ''}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" /> {settings.email || 'info@school.edu.np'}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> {settings.address || 'Devdaha-2, Rupandehi'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" /> Sun - Fri: 9:00 AM - 5:00 PM
                        </span>
                        <span className="hidden xl:flex items-center gap-1.5 border-l border-white/20 pl-4">
                            <Clock className="w-3 h-3" />
                            <span>{formatNow(now)}</span>
                        </span>
                        <div className="flex items-center gap-2 ml-4 border-l border-white/20 pl-4">
                            <a href="https://www.facebook.com/profile.php?id=100037085914325" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                                <Facebook className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Top Strip - compact contact info */}
            <div className="bg-primary text-white text-[10px] flex lg:hidden items-center justify-between px-3 py-1.5">
                <a href="tel:9857078448" className="flex items-center gap-1">
                    <Phone className="w-2.5 h-2.5" /> {settings.phone || '9857078448'}
                </a>
                <a href="mailto:info@school.edu.np" className="flex items-center gap-1 hidden xs:flex">
                    <Mail className="w-2.5 h-2.5" /> <span className="truncate max-w-[120px]">{settings.email || 'info@school.edu.np'}</span>
                </a>
                <a href="https://www.facebook.com/profile.php?id=100037085914325" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                    <Facebook className="w-3 h-3" />
                </a>
            </div>

            {/* Main Navbar */}
            <nav ref={menuRef} className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-sm'}`}>
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <img src="/logo.png" alt="Sevenstar Logo" className="h-10 w-10 sm:h-14 sm:w-14 rounded-full object-cover" />
                            <div className="flex flex-col">
                                <span className="font-serif font-bold text-base sm:text-xl text-primary leading-tight">{settings.school_name || 'Seven Star'}</span>
                                <span className="text-[9px] sm:text-[11px] text-gray-500 font-medium tracking-wider uppercase">{settings.tagline || 'English Boarding School'}</span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <div
                                    key={link.name}
                                    className="relative group"
                                    onMouseEnter={() => setActiveDropdown(link.name)}
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    {link.isRoute ? (
                                        <Link
                                            to={link.href}
                                            className={`flex items-center gap-1 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors ${activeDropdown === link.name ? 'text-primary' : 'text-gray-700 hover:text-primary'}`}
                                        >
                                            {link.name}
                                            {link.children && <ChevronDown className="w-3.5 h-3.5" />}
                                        </Link>
                                    ) : (
                                        <a
                                            href={link.href}
                                            className={`flex items-center gap-1 px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors relative ${activeSection === link.href.replace('#', '') ? 'text-primary' : activeDropdown === link.name ? 'text-primary' : 'text-gray-700 hover:text-primary'}`}
                                        >
                                            {link.name}
                                            {link.children && <ChevronDown className="w-3.5 h-3.5" />}
                                            {activeSection === link.href.replace('#', '') && (
                                                <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />
                                            )}
                                        </a>
                                    )}

                                    {link.children && activeDropdown === link.name && (
                                        <div className="absolute top-full left-0 w-56 bg-white shadow-xl rounded-b-lg border-t-2 border-primary py-2 animate-fade-in">
                                            {link.children.map((child) => (
                                                child.isRoute ? (
                                                    <Link key={child.name} to={child.href} className="block px-5 py-2.5 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors">{child.name}</Link>
                                                ) : (
                                                    <a key={child.name} href={child.href} className="block px-5 py-2.5 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 transition-colors">{child.name}</a>
                                                )
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <Link to="/admission" className="ml-3 bg-accent hover:bg-yellow-500 text-gray-900 font-bold px-5 py-2.5 rounded-lg text-sm transition-all transform hover:-translate-y-0.5 shadow-md hover:shadow-lg">Apply Now</Link>
                            <Link to="/login" className="ml-2 btn-primary">ERP Login</Link>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center gap-2 lg:hidden">
                            <Link to="/login" className="text-[10px] font-bold bg-primary text-white px-3 py-1.5 rounded-md">ERP</Link>
                            <button
                                onClick={() => { setIsOpen(!isOpen); setMobileDropdown(null); }}
                                className="text-gray-700 hover:text-primary focus:outline-none p-2 -mr-2"
                                aria-label="Toggle menu"
                            >
                                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu with slide animation */}
                <div
                    className={`lg:hidden fixed inset-x-0 top-[calc(4rem+26px)] sm:top-[calc(5rem+26px)] bottom-0 bg-black/30 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        className={`bg-white shadow-2xl w-full max-h-[85vh] overflow-y-auto transition-all duration-300 ease-out ${isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-2 py-3 space-y-0.5">
                            {navLinks.map((link) => (
                                <div key={link.name} className="border-b border-gray-100 last:border-0">
                                    <div className="flex items-center">
                                        {link.isRoute ? (
                                            <Link
                                                to={link.href}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex-1 px-4 py-3.5 text-sm font-semibold uppercase tracking-wide transition-colors ${activeSection === (link.href || '').replace('#', '') ? 'text-primary bg-primary/5' : 'text-gray-700'}`}
                                            >
                                                {link.name}
                                            </Link>
                                        ) : (
                                            <a
                                                href={link.href}
                                                onClick={() => setIsOpen(false)}
                                                className={`flex-1 px-4 py-3.5 text-sm font-semibold uppercase tracking-wide transition-colors ${activeSection === link.href.replace('#', '') ? 'text-primary bg-primary/5' : 'text-gray-700'}`}
                                            >
                                                {link.name}
                                            </a>
                                        )}
                                        {link.children && (
                                            <button
                                                onClick={() => toggleMobileDropdown(link.name)}
                                                className="p-3.5 text-gray-400 hover:text-primary transition-colors"
                                                aria-label={`Expand ${link.name}`}
                                            >
                                                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileDropdown === link.name ? 'rotate-180' : ''}`} />
                                            </button>
                                        )}
                                    </div>
                                    {/* Animated sub-menu */}
                                    {link.children && (
                                        <div className={`overflow-hidden transition-all duration-200 ease-in-out ${mobileDropdown === link.name ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="pl-4 pb-2 space-y-0.5 bg-gray-50/50">
                                                {link.children.map((child) => (
                                                    child.isRoute ? (
                                                        <Link
                                                            key={child.name}
                                                            to={child.href}
                                                            onClick={() => setIsOpen(false)}
                                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:text-primary transition-colors"
                                                        >
                                                            <ChevronRight className="w-3 h-3 text-gray-400" />
                                                            {child.name}
                                                        </Link>
                                                    ) : (
                                                        <a
                                                            key={child.name}
                                                            href={child.href}
                                                            onClick={() => setIsOpen(false)}
                                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-500 hover:text-primary transition-colors"
                                                        >
                                                            <ChevronRight className="w-3 h-3 text-gray-400" />
                                                            {child.name}
                                                        </a>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="px-4 pb-4 pt-2 space-y-2 border-t border-gray-100">
                            <Link to="/admission" onClick={() => setIsOpen(false)} className="block text-center w-full bg-accent hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl text-sm transition-colors shadow-md">
                                Apply Now
                            </Link>
                            <Link to="/login" onClick={() => setIsOpen(false)} className="btn-primary block text-center w-full rounded-xl">
                                ERP Login
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
};

export default Navbar;
