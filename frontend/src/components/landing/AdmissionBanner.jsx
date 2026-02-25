import React, { useEffect, useState } from 'react';
import { Megaphone, CalendarDays, ArrowRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSiteSettings, getNotices } from '../../api';

const AdmissionBanner = () => {
    const [settings, setSettings] = useState({});
    const [latest, setLatest] = useState(null);

    useEffect(() => {
        getSiteSettings().then(s => setSettings(s || {})).catch(() => {});
        getNotices().then(res => {
            const notices = res?.notices || [];
            setLatest(notices[0] || null);
        }).catch(() => {});
    }, []);

    const isOpen = String(settings.admission_open) === 'true';
    const deadline = settings.admission_deadline || '';
    const bannerText = settings.admission_notice || 'Admissions open for Montessori to +2 (Science, Management, HM).';

    return (
        <section className="bg-gradient-to-r from-primary to-primary-dark text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {/* Headline Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
                            <Megaphone className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xl font-extrabold font-serif">Admissions {isOpen ? 'Open' : 'Information'}</h3>
                            <p className="text-sm text-white/90">{bannerText}</p>
                            {deadline && (
                                <div className="flex items-center gap-2 text-xs mt-1">
                                    <CalendarDays className="w-3.5 h-3.5" />
                                    <span className="font-semibold">Deadline:</span> <span>{deadline}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Link to="/admission"
                              className="px-5 py-2.5 bg-white text-primary rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors flex items-center gap-2">
                            Apply Online <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a href="#programs"
                           className="px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors">
                            Explore Programs
                        </a>
                        <a href="#fees"
                           className="px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors">
                            Fee Structure
                        </a>
                    </div>
                </div>

                {/* Latest Notice */}
                {latest && (
                    <div className="mt-4 p-3 bg-white/10 border border-white/20 rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wider font-bold text-white/80">Latest Notice</p>
                            <p className="text-sm font-medium truncate">{latest.title}</p>
                            <a href="#notices" className="text-xs underline text-white/80 hover:text-white">View all notices</a>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default AdmissionBanner;

