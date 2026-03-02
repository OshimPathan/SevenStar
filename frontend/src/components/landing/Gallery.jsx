import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, ZoomIn, ChevronLeft, ChevronRight, Loader2, ImageOff, Camera, Grid3X3, ArrowRight, Facebook } from 'lucide-react';
import { getGalleryPhotos } from '../../api';

/* ─── category meta (icon color, gradient) ─── */
const CATEGORY_META = {
    All:       { gradient: 'from-primary to-primary-dark',  icon: Grid3X3 },
    Campus:    { gradient: 'from-emerald-500 to-emerald-700', icon: null },
    Academics: { gradient: 'from-blue-500 to-blue-700',     icon: null },
    Sports:    { gradient: 'from-orange-500 to-red-600',    icon: null },
    Events:    { gradient: 'from-purple-500 to-indigo-600', icon: null },
    Cultural:  { gradient: 'from-pink-500 to-rose-600',     icon: null },
};

/* ─── horizontal scroll carousel ─── */
const CategoryRow = ({ category, photos, gradient, onPhotoClick, flatIndex }) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };

    useEffect(() => { checkScroll(); }, [photos]);

    const scroll = (dir) => {
        const el = scrollRef.current;
        if (!el) return;
        const amount = el.clientWidth * 0.75;
        el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
    };

    return (
        <div className="mb-10 last:mb-0">
            {/* row header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    <div className={`w-1.5 h-8 rounded-full bg-gradient-to-b ${gradient}`} />
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">{category}</h3>
                    <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2.5 py-0.5 rounded-full">{photos.length} photos</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-default flex items-center justify-center transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-default flex items-center justify-center transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* scrollable strip */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
            >
                {photos.map((img, idx) => (
                    <div
                        key={img.id || idx}
                        onClick={() => onPhotoClick(flatIndex(category, idx))}
                        className="group relative flex-shrink-0 snap-start overflow-hidden rounded-2xl bg-gray-200 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        style={{ width: idx === 0 ? '320px' : '240px', height: idx === 0 ? '260px' : '200px' }}
                    >
                        <img
                            src={img.image_url}
                            alt={img.title || 'Gallery'}
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => { e.target.src = '/banner.jpg'; }}
                        />
                        {/* gradient overlay on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4`}>
                            <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 w-full">
                                <div className="flex items-center gap-2 mb-1">
                                    <ZoomIn className="w-4 h-4 text-white/80" />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r ${gradient} text-white`}>{category}</span>
                                </div>
                                <p className="text-white font-semibold text-sm leading-tight">{img.title || 'View'}</p>
                            </div>
                        </div>
                        {/* always-visible category dot */}
                        <div className={`absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br ${gradient} ring-2 ring-white shadow-lg`} />
                    </div>
                ))}
                {/* View more card */}
                <a
                    href="https://www.facebook.com/sevenstar.boarding/photos_by"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex-shrink-0 snap-start flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary/40 bg-gray-50 hover:bg-primary/5 transition-all duration-300 cursor-pointer"
                    style={{ width: '180px', height: '200px' }}
                >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors">View More</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">on Facebook</p>
                    </div>
                </a>
            </div>
        </div>
    );
};


const Gallery = () => {
    const [selectedIdx, setSelectedIdx] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');

    const fallbackImages = [
        { image_url: "/gallery1.jpg", title: "School Campus", category: "Campus" },
        { image_url: "/gallery2.jpg", title: "Students & Activities", category: "Academics" },
        { image_url: "/gallery3.jpg", title: "School Events", category: "Events" },
        { image_url: "/gallery4.jpg", title: "Programs & Celebrations", category: "Cultural" },
        { image_url: "/gallery5.jpg", title: "Campus Life", category: "Campus" },
        { image_url: "/banner.jpg", title: "Our Building", category: "Campus" },
    ];

    useEffect(() => {
        getGalleryPhotos()
            .then(data => setPhotos(data.length > 0 ? data : fallbackImages))
            .catch(() => setPhotos(fallbackImages))
            .finally(() => setLoading(false));
    }, []);

    /* derive categories from data */
    const categories = useMemo(() => {
        const cats = [...new Set(photos.map(p => p.category).filter(Boolean))];
        return ['All', ...cats];
    }, [photos]);

    /* group photos by category */
    const grouped = useMemo(() => {
        const map = {};
        photos.forEach(p => {
            const cat = p.category || 'Other';
            if (!map[cat]) map[cat] = [];
            map[cat].push(p);
        });
        return map;
    }, [photos]);

    /* flat list for lightbox (filtered or all) */
    const flatPhotos = useMemo(() => {
        if (activeCategory === 'All') return photos;
        return photos.filter(p => p.category === activeCategory);
    }, [photos, activeCategory]);

    /* convert (category, localIdx) → flat index */
    const getFlatIndex = useCallback((category, localIdx) => {
        const photo = grouped[category]?.[localIdx];
        if (!photo) return 0;
        return flatPhotos.findIndex(p => p.id === photo.id || (p.image_url === photo.image_url && p.title === photo.title));
    }, [grouped, flatPhotos]);

    const openLightbox = (idx) => setSelectedIdx(idx);
    const closeLightbox = () => setSelectedIdx(null);

    const goNext = useCallback((e) => {
        e?.stopPropagation();
        setSelectedIdx(prev => (prev + 1) % flatPhotos.length);
    }, [flatPhotos.length]);

    const goPrev = useCallback((e) => {
        e?.stopPropagation();
        setSelectedIdx(prev => (prev - 1 + flatPhotos.length) % flatPhotos.length);
    }, [flatPhotos.length]);

    useEffect(() => {
        if (selectedIdx === null) return;
        const handleKey = (e) => {
            if (e.key === 'ArrowRight') goNext();
            else if (e.key === 'ArrowLeft') goPrev();
            else if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [selectedIdx, goNext, goPrev]);

    if (loading) {
        return (
            <section id="gallery" className="py-16 md:py-20 bg-white">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </section>
        );
    }

    return (
        <section id="gallery" className="py-14 sm:py-20 md:py-24 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
            {/* decorative bg */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-accent/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* ── section header ── */}
                <div className="text-center mb-10 sm:mb-14">
                    <span className="inline-flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
                        <Camera className="w-3.5 h-3.5" /> Gallery
                    </span>
                    <h2 className="section-title text-3xl sm:text-4xl lg:text-5xl">Life at Seven Star</h2>
                    <div className="section-divider" />
                    <p className="section-subtitle max-w-2xl mx-auto">Glimpses of academic excellence, vibrant events, and everyday moments that make our campus special.</p>
                </div>

                {/* ── category tabs ── */}
                <div className="flex items-center justify-center mb-10 sm:mb-12">
                    <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                        {categories.map(cat => {
                            const meta = CATEGORY_META[cat] || { gradient: 'from-gray-500 to-gray-700' };
                            const isActive = activeCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`relative px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                                        isActive
                                            ? 'bg-white text-gray-900 shadow-md shadow-black/5'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                                    }`}
                                >
                                    {isActive && <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-gradient-to-r ${meta.gradient}`} />}
                                    {cat}
                                    {cat !== 'All' && grouped[cat] && (
                                        <span className={`ml-1.5 text-[10px] px-1.5 py-px rounded-full ${isActive ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-400'}`}>
                                            {grouped[cat].length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── gallery body ── */}
                {activeCategory === 'All' ? (
                    /* ── category-row carousel view ── */
                    <div>
                        {Object.entries(grouped).map(([cat, catPhotos]) => {
                            const meta = CATEGORY_META[cat] || { gradient: 'from-gray-500 to-gray-700' };
                            return (
                                <CategoryRow
                                    key={cat}
                                    category={cat}
                                    photos={catPhotos}
                                    gradient={meta.gradient}
                                    onPhotoClick={openLightbox}
                                    flatIndex={getFlatIndex}
                                />
                            );
                        })}
                    </div>
                ) : (
                    /* ── grid view for single category ── */
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                        {flatPhotos.map((img, idx) => {
                            const meta = CATEGORY_META[img.category] || { gradient: 'from-gray-500 to-gray-700' };
                            return (
                                <div
                                    key={img.id || idx}
                                    onClick={() => openLightbox(idx)}
                                    className={`group relative overflow-hidden rounded-2xl bg-gray-200 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                                        idx === 0 ? 'sm:col-span-2 sm:row-span-2 aspect-[4/3]' : 'aspect-square'
                                    }`}
                                >
                                    <img
                                        src={img.image_url}
                                        alt={img.title || 'Gallery'}
                                        loading="lazy"
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        onError={(e) => { e.target.src = '/banner.jpg'; }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-4">
                                        <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 w-full">
                                            <div className="flex items-center gap-2 mb-1">
                                                <ZoomIn className="w-4 h-4 text-white/80" />
                                            </div>
                                            <p className="text-white font-semibold text-sm leading-tight">{img.title || 'View'}</p>
                                        </div>
                                    </div>
                                    <div className={`absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-gradient-to-br ${meta.gradient} ring-2 ring-white shadow-lg`} />
                                </div>
                            );
                        })}
                    </div>
                )}

                {flatPhotos.length === 0 && (
                    <div className="text-center py-16 text-gray-400">
                        <ImageOff className="w-14 h-14 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No photos available yet</p>
                        <p className="text-sm text-gray-400 mt-1">Check back soon for updates</p>
                    </div>
                )}

                {/* ── Facebook CTA ── */}
                <div className="mt-12 sm:mt-16 text-center">
                    <a
                        href="https://www.facebook.com/sevenstar.boarding/photos_by"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-[#1877F2] to-[#0d65d9] text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <Facebook className="w-5 h-5" />
                        View All Photos on Facebook
                        <ArrowRight className="w-4 h-4" />
                    </a>
                    <p className="text-xs text-gray-400 mt-3">Follow us for the latest campus updates & event photos</p>
                </div>
            </div>

            {/* ── Lightbox ── */}
            {selectedIdx !== null && selectedIdx < flatPhotos.length && (
                <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center" onClick={closeLightbox}>
                    <button className="absolute top-4 right-4 z-50 text-white/70 hover:text-white transition-colors w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center" onClick={closeLightbox}>
                        <X className="w-5 h-5" />
                    </button>
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r ${
                            (CATEGORY_META[flatPhotos[selectedIdx]?.category] || { gradient: 'from-gray-500 to-gray-700' }).gradient
                        } text-white`}>
                            {flatPhotos[selectedIdx]?.category}
                        </span>
                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-white/80 text-xs font-medium">
                            {selectedIdx + 1} / {flatPhotos.length}
                        </span>
                    </div>
                    <button onClick={goPrev} className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-50 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-xl flex items-center justify-center text-white transition-all active:scale-95 border border-white/10">
                        <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <div className="max-w-[95vw] sm:max-w-[90vw] max-h-[85vh] flex items-center justify-center px-10 sm:px-0" onClick={e => e.stopPropagation()}>
                        <img src={flatPhotos[selectedIdx]?.image_url} alt={flatPhotos[selectedIdx]?.title || 'Gallery'} className="max-w-full max-h-[75vh] sm:max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
                    </div>
                    <button onClick={goNext} className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-50 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 hover:bg-white/25 backdrop-blur-md rounded-xl flex items-center justify-center text-white transition-all active:scale-95 border border-white/10">
                        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 text-center z-50 px-4">
                        <p className="text-white font-semibold font-serif text-sm sm:text-lg">{flatPhotos[selectedIdx]?.title}</p>
                        {flatPhotos[selectedIdx]?.description && (
                            <p className="text-white/60 text-xs sm:text-sm mt-1">{flatPhotos[selectedIdx].description}</p>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default Gallery;
