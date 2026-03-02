import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, GraduationCap, FileText, ClipboardCheck, Phone, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const slides = [
    {
        image: '/banner.jpg',
        title: 'Welcome to Seven Star',
        subtitle: 'English Boarding School',
        desc: 'Quality English-medium education from Nursery to +2 in Devdaha, Rupandehi',
        badge: 'Est. 2063 B.S.',
    },
    {
        image: '/gallery1.jpg',
        title: 'Shaping Future Leaders',
        subtitle: 'Since 2063 B.S.',
        desc: 'Nearly two decades of academic excellence and holistic development',
        badge: '19+ Years',
    },
    {
        image: '/gallery3.jpg',
        title: 'NEB Affiliated +2 Programs',
        subtitle: 'Management · Computer Science · Education',
        desc: 'Specialized career paths for bright futures under National Examinations Board',
        badge: '5 Streams',
    },
    {
        image: '/gallery5.jpg',
        title: 'Where Excellence Meets Values',
        subtitle: 'Empowering Minds, Building Character',
        desc: 'Blending tradition with innovation in the heart of Lumbini Province',
        badge: '100% SEE Pass',
    },
];

const Hero = () => {
    const [current, setCurrent] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const touchStart = useRef(null);

    const goTo = useCallback((idx) => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrent(idx);
        setTimeout(() => setIsAnimating(false), 800);
    }, [isAnimating]);

    const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo]);
    const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo]);

    useEffect(() => {
        const timer = setInterval(next, 5500);
        return () => clearInterval(timer);
    }, [next]);

    // Swipe support for mobile
    const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        if (!touchStart.current) return;
        const diff = touchStart.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
        touchStart.current = null;
    };

    return (
        <section
            id="hero"
            className="relative w-full h-[65vh] sm:h-[75vh] md:h-[85vh] lg:h-[92vh] overflow-hidden bg-gray-900"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Slides */}
            {slides.map((slide, idx) => (
                <div
                    key={idx}
                    className={`absolute inset-0 transition-all duration-[1200ms] ${
                        idx === current ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
                    }`}
                >
                    <img
                        src={slide.image}
                        alt={slide.title}
                        className={`w-full h-full object-cover ${
                            idx === current ? 'animate-zoom-in' : ''
                        }`}
                        style={{ transformOrigin: 'center center' }}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                    {/* Rich multi-layer gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent" />
                </div>
            ))}

            {/* Decorative geometric shapes */}
            <div className="absolute top-20 left-10 w-32 h-32 border border-accent/10 rotate-45 z-20 hidden lg:block animate-float" />
            <div className="absolute bottom-40 right-20 w-20 h-20 border border-white/10 rotate-12 z-20 hidden lg:block" style={{ animation: 'float 8s ease-in-out infinite 2s' }} />

            {/* Content */}
            <div className="relative z-20 h-full flex items-center justify-center text-center px-4 sm:px-6">
                <div className={`max-w-5xl w-full transition-all duration-700 ${isAnimating ? 'opacity-0 translate-y-6 scale-[0.98]' : 'opacity-100 translate-y-0 scale-100'}`}>
                    
                    {/* Badge */}
                    <div className="flex items-center justify-center gap-3 sm:gap-4 mb-5 sm:mb-7">
                        <span className="w-10 sm:w-16 h-px bg-gradient-to-r from-transparent to-accent"></span>
                        <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-accent" />
                            <span className="text-accent text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">{slides[current].badge}</span>
                        </span>
                        <span className="w-10 sm:w-16 h-px bg-gradient-to-l from-transparent to-accent"></span>
                    </div>

                    <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-5 leading-[1.1] drop-shadow-2xl">
                        {slides[current].title}
                    </h1>
                    <h2 className="font-serif text-lg sm:text-2xl md:text-3xl lg:text-4xl text-accent font-semibold mb-4 sm:mb-7 drop-shadow-lg">
                        {slides[current].subtitle}
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-8 sm:mb-12 px-2 leading-relaxed">
                        {slides[current].desc}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
                        <Link to="/admission" className="group relative inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-dark text-white font-bold px-8 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base rounded-xl shadow-lg hover:shadow-accent/40 transition-all transform hover:-translate-y-1 overflow-hidden">
                            <span className="relative z-10 flex items-center gap-2">
                                Apply Now
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-accent-light to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <a href="#programs" className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white px-8 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base hover:bg-white/10 hover:border-white/60 transition-all transform hover:-translate-y-1 rounded-xl backdrop-blur-sm font-semibold">
                            Explore Programs
                        </a>
                        <a href="#fees" className="hidden sm:inline-flex items-center justify-center gap-2 border-2 border-accent/40 text-accent px-8 sm:px-10 py-3.5 sm:py-4 text-sm sm:text-base hover:bg-accent hover:text-white hover:border-accent transition-all transform hover:-translate-y-1 rounded-xl font-semibold">
                            Fee Structure
                        </a>
                    </div>
                </div>
            </div>

            {/* Side Quick Access (Desktop) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-30 hidden xl:flex flex-col gap-3">
                {[
                    { icon: <GraduationCap className="w-4 h-4" />, label: 'Admissions', href: '#admissions' },
                    { icon: <FileText className="w-4 h-4" />, label: 'Exam Schedule', href: '/exam-schedule', isRoute: true },
                    { icon: <ClipboardCheck className="w-4 h-4" />, label: 'Results', href: '/results', isRoute: true },
                    { icon: <Phone className="w-4 h-4" />, label: 'Contact', href: '#contact' },
                ].map((item, i) => item.isRoute ? (
                    <Link key={i} to={item.href} className="group flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-white/0 group-hover:text-white/90 transition-all text-right whitespace-nowrap">{item.label}</span>
                        <span className="w-11 h-11 rounded-xl bg-white/10 hover:bg-primary/90 backdrop-blur-md border border-white/10 hover:border-primary flex items-center justify-center text-white transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30">
                            {item.icon}
                        </span>
                    </Link>
                ) : (
                    <a key={i} href={item.href} className="group flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-white/0 group-hover:text-white/90 transition-all text-right whitespace-nowrap">{item.label}</span>
                        <span className="w-11 h-11 rounded-xl bg-white/10 hover:bg-primary/90 backdrop-blur-md border border-white/10 hover:border-primary flex items-center justify-center text-white transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30">
                            {item.icon}
                        </span>
                    </a>
                ))}
            </div>

            {/* Navigation Arrows */}
            <button
                onClick={prev}
                className="absolute left-3 sm:left-5 md:left-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-primary backdrop-blur-md border border-white/10 hover:border-primary rounded-xl flex items-center justify-center text-white transition-all active:scale-95 hover:shadow-lg hover:shadow-primary/30"
                aria-label="Previous slide"
            >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
                onClick={next}
                className="absolute right-3 sm:right-5 md:right-8 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-primary backdrop-blur-md border border-white/10 hover:border-primary rounded-xl flex items-center justify-center text-white transition-all active:scale-95 hover:shadow-lg hover:shadow-primary/30"
                aria-label="Next slide"
            >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Progress Dots */}
            <div className="absolute bottom-8 sm:bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => goTo(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`rounded-full transition-all duration-500 ${
                            idx === current ? 'w-8 sm:w-10 h-2.5 sm:h-3 bg-accent shadow-lg shadow-accent/40' : 'w-2.5 sm:w-3 h-2.5 sm:h-3 bg-white/40 hover:bg-white/70'
                        }`}
                    />
                ))}
            </div>

            {/* Bottom decorative gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-28 bg-gradient-to-t from-[#fafbfc] via-[#fafbfc]/50 to-transparent z-20" />
        </section>
    );
};

export default Hero;
