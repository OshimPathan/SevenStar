import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Users, BookOpen, GraduationCap, Baby, Book, Calculator, MonitorPlay } from 'lucide-react';
import { getClasses } from '../../api';

const LEVEL_META = {
    montessori: { icon: Baby,        accent: 'bg-pink-500',    lightBg: 'bg-pink-50',  text: 'text-pink-600',  border: 'border-pink-200', badge: 'Ages 3-5' },
    primary:    { icon: Book,        accent: 'bg-blue-500',    lightBg: 'bg-blue-50',  text: 'text-blue-600',  border: 'border-blue-200', badge: 'Class 1-5' },
    lower:      { icon: Calculator,  accent: 'bg-emerald-500', lightBg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'Class 6-8' },
    secondary:  { icon: MonitorPlay, accent: 'bg-purple-500',  lightBg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', badge: 'SEE' },
};

const ClassesSections = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        getClasses().then(res => {
            setClasses(res.classes || []);
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.15 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    const grouped = useMemo(() => {
        const buckets = {
            montessori: [],
            primary: [],
            lower: [],
            secondary: [],
            plusTwo: {}
        };
        (classes || []).forEach(c => {
            const lvl = parseInt(c.level, 10);
            if (Number.isFinite(lvl)) {
                if (lvl <= 0) buckets.montessori.push(c);
                else if (lvl >= 1 && lvl <= 5) buckets.primary.push(c);
                else if (lvl >= 6 && lvl <= 8) buckets.lower.push(c);
                else if (lvl >= 9 && lvl <= 10) buckets.secondary.push(c);
                else {
                    const key = c.stream_name || 'General';
                    if (!buckets.plusTwo[key]) buckets.plusTwo[key] = [];
                    buckets.plusTwo[key].push(c);
                }
            } else {
                if ((c.name || '').toLowerCase().includes('nursery') || (c.name || '').toLowerCase().includes('kg')) {
                    buckets.montessori.push(c);
                } else {
                    buckets.primary.push(c);
                }
            }
        });
        return buckets;
    }, [classes]);

    const totalStudents = useMemo(() => {
        return (classes || []).reduce((sum, c) => sum + (c.students || 0), 0);
    }, [classes]);

    const Card = ({ title, items, levelKey, delay = 0 }) => {
        const meta = LEVEL_META[levelKey];
        const Icon = meta?.icon || BookOpen;
        const studentCount = items.reduce((s, c) => s + (c.students || 0), 0);

        return (
            <div
                className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ${
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
            >
                {/* Color accent bar */}
                <div className={`h-1 ${meta?.accent || 'bg-primary'}`} />

                <div className="p-5 sm:p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${meta?.lightBg || 'bg-primary/10'} ${meta?.text || 'text-primary'} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{title}</h3>
                                {meta?.badge && (
                                    <span className={`text-[10px] font-semibold ${meta.text} uppercase tracking-wider`}>{meta.badge}</span>
                                )}
                            </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg ${meta?.lightBg || 'bg-primary/10'} ${meta?.text || 'text-primary'} text-xs font-bold`}>
                            {studentCount} <Users className="w-3 h-3 inline -mt-0.5 ml-0.5" />
                        </div>
                    </div>

                    {/* Class rows */}
                    {items.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No classes available</p>
                    ) : (
                        <div className="space-y-1.5">
                            {items.map((c, i) => (
                                <div
                                    key={c.id}
                                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                                        meta ? `${meta.border} hover:${meta.lightBg}` : 'border-gray-100 hover:bg-gray-50'
                                    } bg-white group/row cursor-default`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <span className={`w-6 h-6 rounded-md ${meta?.lightBg || 'bg-primary/10'} ${meta?.text || 'text-primary'} flex items-center justify-center text-[10px] font-bold`}>
                                            {i + 1}
                                        </span>
                                        <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                                        {c.sectionsList?.length > 0 && (
                                            <div className="flex gap-1">
                                                {c.sectionsList.map(s => (
                                                    <span key={s.id || s.name} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                        <Users className="w-3 h-3" />
                                        <span>{c.students || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const PlusTwoCard = ({ title, items, delay = 0 }) => {
        const studentCount = items.reduce((s, c) => s + (c.students || 0), 0);

        return (
            <div
                className={`group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 ${
                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
            >
                <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight">{title}</h3>
                                <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">+2 Stream</span>
                            </div>
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                            {studentCount} <Users className="w-3 h-3 inline -mt-0.5 ml-0.5" />
                        </div>
                    </div>
                    {items.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">No classes</p>
                    ) : (
                        <div className="space-y-1.5">
                            {items.map((c, i) => (
                                <div key={c.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-primary/10 hover:bg-primary/5 bg-white transition-all duration-200">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                                        <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                                        {c.sectionsList?.length > 0 && (
                                            <div className="flex gap-1">
                                                {c.sectionsList.map(s => (
                                                    <span key={s.id || s.name} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">{s.name}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                                        <Users className="w-3 h-3" />
                                        <span>{c.students || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return null;

    const plusTwoStreams = Object.keys(grouped.plusTwo);

    return (
        <section ref={sectionRef} id="classes" className="py-14 sm:py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/3 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-10 sm:mb-14">
                    <span className="section-label">Our Structure</span>
                    <h2 className="section-title">Classes & Sections</h2>
                    <div className="section-divider" />
                    <p className="section-subtitle">From Montessori to +2 streams — {totalStudents > 0 ? `${totalStudents.toLocaleString()} students` : 'all classes'} across all levels and sections.</p>
                </div>

                {/* School Division */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <h3 className="font-serif text-lg font-bold text-gray-900">School Division</h3>
                    </div>
                    <div className="flex-1 h-px bg-gray-200" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <Card title="Montessori (Nursery / LKG / UKG)" items={grouped.montessori} levelKey="montessori" delay={0} />
                    <Card title="Primary (Class 1–5)" items={grouped.primary} levelKey="primary" delay={100} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                    <Card title="Lower Secondary (Class 6–8)" items={grouped.lower} levelKey="lower" delay={200} />
                    <Card title="Secondary (Class 9–10)" items={grouped.secondary} levelKey="secondary" delay={300} />
                </div>

                {plusTwoStreams.length > 0 && (
                    <>
                        <div className="flex items-center gap-4 mb-6 mt-10">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-primary" />
                                <h3 className="font-serif text-lg font-bold text-gray-900">Higher Secondary (+2)</h3>
                            </div>
                            <div className="flex-1 h-px bg-gray-200" />
                            <span className="text-xs text-gray-400 font-medium">NEB Affiliated</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {plusTwoStreams.map((stream, i) => (
                                <PlusTwoCard key={stream} title={stream} items={grouped.plusTwo[stream]} delay={400 + i * 100} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default ClassesSections;

