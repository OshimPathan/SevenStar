import React from 'react';
import { Target, Flag, GraduationCap, Award, BookOpen, Users } from 'lucide-react';

const About = () => {
    return (
        <section id="about" className="py-14 sm:py-20 md:py-24 bg-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12 sm:mb-16">
                    <span className="inline-block text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">About Our Institution</span>
                    <h2 className="section-title">A Legacy of Excellence</h2>
                    <div className="section-divider" />
                    <p className="section-subtitle max-w-2xl mx-auto">Shaping the future, one student at a time since 2063 B.S.</p>
                </div>

                <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-16 sm:mb-20">
                    {/* Image Side */}
                    <div className="relative group">
                        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                            <img src="/banner.jpg" alt="Seven Star Campus" className="w-full h-60 sm:h-72 md:h-80 lg:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
                        </div>
                        {/* Decorative frame */}
                        <div className="absolute -top-3 -left-3 w-24 h-24 border-t-4 border-l-4 border-accent rounded-tl-2xl hidden lg:block" />
                        <div className="absolute -bottom-3 -right-3 w-24 h-24 border-b-4 border-r-4 border-primary rounded-br-2xl hidden lg:block" />
                        {/* Accent badge */}
                        <div className="absolute -bottom-5 right-3 sm:-bottom-6 sm:right-6 bg-gradient-to-br from-primary to-primary-dark text-white px-5 py-3.5 sm:px-7 sm:py-4 rounded-xl shadow-xl shadow-primary/30">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
                                <div>
                                    <div className="text-2xl sm:text-3xl font-bold font-serif leading-none">19+</div>
                                    <div className="text-[10px] sm:text-xs uppercase tracking-wider text-white/80 mt-0.5">Years of Excellence</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Side */}
                    <div>
                        <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                            Nurturing Minds Since <span className="text-primary">2063 B.S.</span>
                        </h3>
                        <div className="w-20 h-1.5 bg-gradient-to-r from-accent to-accent-light rounded-full mb-6"></div>
                        <p className="text-gray-600 leading-relaxed mb-5 text-sm sm:text-base">
                            Sevenstar English Boarding School, located in Devdaha Municipality-2, Rupandehi District,
                            Lumbini Province, Nepal, is a distinguished private educational institution established in 2063 B.S.
                            Strategically situated near the Rohini River Bridge in Dhekawar, we provide an accessible and serene
                            environment blending modern education with cultural values.
                        </p>
                        <p className="text-gray-600 leading-relaxed mb-8 text-sm sm:text-base">
                            Offering classes from early childhood through +2 with NEB-affiliated programs in Management,
                            Computer Science, Hotel Management, Finance, and Education — we empower students with knowledge,
                            critical thinking, and ethical values.
                        </p>
                        {/* Mini stats */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            {[
                                { icon: <Users className="w-5 h-5" />, num: '80+', label: 'Expert Faculty' },
                                { icon: <BookOpen className="w-5 h-5" />, num: '5+', label: 'NEB Streams' },
                                { icon: <Award className="w-5 h-5" />, num: '100%', label: 'SEE Pass' },
                            ].map((s, i) => (
                                <div key={i} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                                    <div className="text-primary mb-1 flex justify-center">{s.icon}</div>
                                    <div className="font-bold text-gray-900 text-lg font-serif">{s.num}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        <a href="#programs" className="btn-primary inline-flex items-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                            View Programs
                        </a>
                    </div>
                </div>

                {/* Mission & Vision Cards */}
                <div className="grid sm:grid-cols-2 gap-5 sm:gap-8">
                    <div className="group bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-light" />
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Target className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-serif">Our Mission</h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            To offer quality education that prepares students for both national and global challenges.
                            We empower students with knowledge, critical thinking skills, and ethical values,
                            preparing them to contribute meaningfully to society as responsible global citizens.
                        </p>
                    </div>

                    <div className="group bg-gradient-to-br from-gray-50 to-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent-light" />
                        <div className="flex items-center gap-3 sm:gap-4 mb-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-accent/10 rounded-xl flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                                <Flag className="w-6 h-6 text-accent-dark" />
                            </div>
                            <h3 className="text-lg sm:text-xl font-bold text-gray-900 font-serif">Our Vision</h3>
                        </div>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            To shine brightly in the educational landscape of Lumbini Province, guiding students
                            toward success. We aspire to be recognized as a premier institution that sets the standard
                            for English-medium education, blending tradition with innovation in Rupandehi.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default About;
