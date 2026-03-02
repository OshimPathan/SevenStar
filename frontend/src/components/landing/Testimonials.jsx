import React, { useState, useEffect } from 'react';
import { Quote, Star, Send, CheckCircle, Loader2, User, ChevronLeft, ChevronRight, MessageSquarePlus } from 'lucide-react';
import { getApprovedReviews, submitReview } from '../../api';

const Testimonials = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [form, setForm] = useState({ name: '', role: 'Parent', rating: 5, content: '' });

    const defaultTestimonials = [
        { id: 'd1', name: "Ram Bahadur Thapa", role: "Parent", rating: 5, content: "The transformation I've seen in my child's academic performance and discipline since joining Seven Star is remarkable. The teachers truly care about each student's development.", image: "https://randomuser.me/api/portraits/men/32.jpg" },
        { id: 'd2', name: "Sita Sharma", role: "Alumni (+2 Science)", rating: 5, content: "The foundational knowledge and guidance I received at Seven Star helped me secure a full scholarship for my engineering degree. Eternally grateful to the faculty.", image: "https://randomuser.me/api/portraits/women/44.jpg" },
        { id: 'd3', name: "Bikash Gurung", role: "Parent", rating: 5, content: "Not just academics, the school's focus on extracurriculars like sports and arts ensures students develop holistically. Best school in Devdaha area, hands down.", image: "https://randomuser.me/api/portraits/men/67.jpg" },
    ];

    useEffect(() => {
        getApprovedReviews()
            .then(data => setReviews(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const allTestimonials = [...defaultTestimonials, ...reviews.map(r => ({
        ...r,
        image: null,
    }))];

    const perPage = 3;
    const totalPages = Math.ceil(allTestimonials.length / perPage);
    const visibleTestimonials = allTestimonials.slice(currentPage * perPage, currentPage * perPage + perPage);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.content.trim()) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            await submitReview(form);
            setSubmitted(true);
            setForm({ name: '', role: 'Parent', rating: 5, content: '' });
            setTimeout(() => { setSubmitted(false); setShowForm(false); }, 3000);
        } catch (err) {
            console.error('Review submit error:', err);
            setSubmitError(err.message || 'Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const StarRating = ({ rating, onChange, interactive = false }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <button key={s} type={interactive ? "button" : undefined}
                    onClick={interactive ? () => onChange(s) : undefined}
                    className={interactive ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}>
                    <Star className={`w-4 h-4 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                </button>
            ))}
        </div>
    );

    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <section id="testimonials" className="py-14 sm:py-20 md:py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/3 rounded-full blur-3xl" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12 sm:mb-16">
                    <span className="inline-block text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">Testimonials</span>
                    <h2 className="section-title">What People Say</h2>
                    <div className="section-divider" />
                    <p className="section-subtitle max-w-2xl mx-auto">Hear from our community of parents, students and alumni.</p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6 mb-8 sm:mb-10">
                    {visibleTestimonials.map((item, idx) => (
                        <div key={item.id || idx} className="bg-white rounded-2xl p-6 sm:p-7 relative shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 group overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-primary/8 absolute top-5 right-5 sm:top-6 sm:right-6" />

                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
                                {item.image ? (
                                    <img src={item.image} alt={item.name}
                                        className="w-11 h-11 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-primary/20 shadow-sm" />
                                ) : (
                                    <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm sm:text-lg border-2 border-primary/20">
                                        {getInitials(item.name)}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h4 className="font-bold text-gray-900 font-serif text-sm sm:text-base truncate">{item.name}</h4>
                                    <p className="text-[10px] sm:text-xs text-accent-dark font-semibold">{item.role}</p>
                                    <StarRating rating={item.rating || 5} />
                                </div>
                            </div>

                            <p className="text-gray-600 text-xs sm:text-sm italic leading-relaxed line-clamp-4 sm:line-clamp-none">
                                "{item.content}"
                            </p>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mb-12">
                        <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}
                            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button key={i} onClick={() => setCurrentPage(i)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentPage === i ? 'bg-primary w-7 rounded-full' : 'bg-gray-300 hover:bg-gray-400'}`} />
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1}
                            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:border-primary hover:text-primary hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}

                {/* Write a Review CTA / Form */}
                <div className="max-w-2xl mx-auto">
                    {!showForm ? (
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 sm:p-10 text-center border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <MessageSquarePlus className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 font-serif mb-2">Share Your Experience</h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">Are you a parent, student, or alumni? We'd love to hear about your experience at Seven Star.</p>
                            <button onClick={() => setShowForm(true)}
                                className="btn-primary inline-flex items-center gap-2 px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5">
                                <Star className="w-4 h-4" /> Write a Review
                            </button>
                        </div>
                    ) : submitted ? (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center animate-fade-in">
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                            <h3 className="text-lg font-bold text-green-800 mb-2">Thank You!</h3>
                            <p className="text-sm text-green-600">Your review has been submitted and will appear after approval by the admin.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm animate-fade-in-up">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 font-serif">Write a Review</h3>
                                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm font-medium">Cancel</button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Your Name *</label>
                                        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required
                                            placeholder="e.g. Ram Bahadur Thapa"
                                            className="w-full px-4 py-2.5 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Your Role</label>
                                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm">
                                            <option>Parent</option>
                                            <option>Student</option>
                                            <option>Alumni</option>
                                            <option>Teacher</option>
                                            <option>Visitor</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Rating</label>
                                    <StarRating rating={form.rating} onChange={(r) => setForm(f => ({ ...f, rating: r }))} interactive />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Your Review *</label>
                                    <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required rows="4"
                                        placeholder="Share your experience at Seven Star..."
                                        className="w-full px-4 py-2.5 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none" />
                                </div>
                                <button type="submit" disabled={submitting || !form.name.trim() || !form.content.trim()}
                                    className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Review</>}
                                </button>
                                {submitError && (
                                    <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-2">{submitError}</p>
                                )}
                                <p className="text-[11px] text-gray-400 text-center">Your review will be published after admin approval.</p>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
