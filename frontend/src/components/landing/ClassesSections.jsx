import React, { useEffect, useMemo, useState } from 'react';
import { Users, BookOpen } from 'lucide-react';
import { getClasses } from '../../api';

const ClassesSections = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getClasses().then(res => {
            setClasses(res.classes || []);
        }).finally(() => setLoading(false));
    }, []);

    const grouped = useMemo(() => {
        const buckets = {
            montessori: [],
            primary: [],
            lower: [],
            secondary: [],
            plusTwo: {} // group by stream
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
                // fallback: decide by name
                if ((c.name || '').toLowerCase().includes('nursery') || (c.name || '').toLowerCase().includes('kg')) {
                    buckets.montessori.push(c);
                } else {
                    buckets.primary.push(c);
                }
            }
        });
        return buckets;
    }, [classes]);

    const Card = ({ title, items, subtitle }) => (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-gray-900">{title}</h3>
                {subtitle && <span className="text-xs text-gray-400 ml-2">{subtitle}</span>}
            </div>
            {items.length === 0 ? (
                <p className="text-sm text-gray-400">No classes</p>
            ) : (
                <div className="space-y-2">
                    {items.map(c => (
                        <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-gray-100 hover:bg-gray-50">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-800">{c.name}</span>
                                {c.sectionsList?.length > 0 && (
                                    <span className="text-[11px] text-gray-500">({c.sectionsList.map(s => s.name).join(', ')})</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Users className="w-3.5 h-3.5" />
                                <span>{c.students || 0}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (loading) return null;

    const plusTwoStreams = Object.keys(grouped.plusTwo);

    return (
        <section id="classes" className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="section-title">Classes & Sections</h2>
                    <div className="section-divider" />
                    <p className="section-subtitle">From Montessori to +2 streams, view all classes and sections with student counts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <Card title="Montessori (Nursery/LKG/UKG)" items={grouped.montessori} />
                    <Card title="Primary (Class 1–5)" items={grouped.primary} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <Card title="Lower Secondary (Class 6–8)" items={grouped.lower} />
                    <Card title="Secondary (Class 9–10)" items={grouped.secondary} />
                </div>

                {plusTwoStreams.length > 0 && (
                    <>
                        <div className="text-center mt-10 mb-6">
                            <h3 className="text-xl font-bold text-gray-900 font-serif">Higher Secondary (+2)</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {plusTwoStreams.map(stream => (
                                <Card key={stream} title={stream} items={grouped.plusTwo[stream]} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

export default ClassesSections;

