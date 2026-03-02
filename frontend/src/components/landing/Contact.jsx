import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send, MessageCircle, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Contact = () => {
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', subject: 'Admission Inquiry', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.firstName.trim() || !form.message.trim()) {
            setError('Please fill in your name and message.');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            const { error: dbError } = await supabase.from('contact_inquiries').insert({
                first_name: form.firstName.trim(),
                last_name: form.lastName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                inquiry_type: form.subject,
                message: form.message.trim(),
            });
            if (dbError) throw new Error(dbError.message);
            setSubmitted(true);
            setForm({ firstName: '', lastName: '', email: '', phone: '', subject: 'Admission Inquiry', message: '' });
        } catch (err) {
            setError('Failed to send message. Please try again or contact us directly.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section id="contact" className="py-14 sm:py-20 md:py-24 bg-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-12 sm:mb-16">
                    <span className="inline-block text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">Contact</span>
                    <h2 className="section-title">Get In Touch</h2>
                    <div className="section-divider" />
                    <p className="section-subtitle max-w-2xl mx-auto">Have questions about admissions or programs? We're here to help.</p>
                </div>

                <div className="grid lg:grid-cols-5 gap-6 sm:gap-8">
                    {/* Contact Info Cards */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-gradient-to-br from-primary to-primary-dark text-white p-6 rounded-2xl shadow-lg shadow-primary/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                                    <MapPin className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-base mb-1.5 font-serif">Address</h4>
                                    <p className="text-white/80 text-sm leading-relaxed">Rohini River Bridge, Dhekawar<br />Devdaha Municipality-2, Rupandehi<br />Lumbini Province, Nepal</p>
                                </div>
                            </div>
                        </div>

                        {[
                            { icon: <Phone className="w-5 h-5" />, title: 'Phone', content: (
                                <p className="text-gray-600 text-sm">
                                    <a href="tel:9857078448" className="hover:text-primary transition-colors">985-7078448</a> / <a href="tel:9851206206" className="hover:text-primary transition-colors">985-1206206</a><br />
                                    <a href="tel:9866390245" className="hover:text-primary transition-colors">986-6390245</a> / <a href="tel:9807400046" className="hover:text-primary transition-colors">980-7400046</a><br />
                                    <a href="tel:071680529" className="hover:text-primary transition-colors">071-680529</a>
                                </p>
                            )},
                            { icon: <Mail className="w-5 h-5" />, title: 'Email', content: (
                                <a href="mailto:sevenstar.school2063@gmail.com" className="text-gray-600 text-sm hover:text-primary transition-colors">sevenstar.school2063@gmail.com</a>
                            )},
                            { icon: <Clock className="w-5 h-5" />, title: 'Office Hours', content: (
                                <p className="text-gray-600 text-sm">Sun – Fri: 9:00 AM – 5:00 PM<br />Saturday: Closed</p>
                            )},
                        ].map((item, idx) => (
                            <div key={idx} className="group bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-base mb-1 font-serif text-gray-900">{item.title}</h4>
                                        {item.content}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Map */}
                        <div className="rounded-2xl overflow-hidden h-48 shadow-sm border border-gray-100">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d28287.541867332868!2d83.56218300000002!3d27.595305000000003!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39969d3290c84dc9%3A0x58256433dc50c82d!2sSeven%20Star%20English%20Boarding%20School!5e0!3m2!1sen!2sus!4v1742107873246!5m2!1sen!2sus"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Google Maps"
                            ></iframe>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-3 bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-5 sm:mb-7 font-serif">Send us a Message</h3>

                        {submitted ? (
                            <div className="text-center py-16 animate-fade-in">
                                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h4>
                                <p className="text-gray-500 text-sm mb-6">Thank you for reaching out. We'll get back to you within 24 hours.</p>
                                <button onClick={() => setSubmitted(false)} className="text-primary text-sm font-semibold hover:underline">
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div className="grid md:grid-cols-2 gap-5">
                                    <div>
                                        <label htmlFor="firstName" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">First Name *</label>
                                        <input type="text" id="firstName" name="firstName" value={form.firstName} onChange={handleChange} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm bg-white" placeholder="John" />
                                    </div>
                                    <div>
                                        <label htmlFor="lastName" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Last Name</label>
                                        <input type="text" id="lastName" name="lastName" value={form.lastName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm bg-white" placeholder="Doe" />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Email</label>
                                    <input type="email" id="email" name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm bg-white" placeholder="john@example.com" />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Phone</label>
                                    <input type="tel" id="phone" name="phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm bg-white" placeholder="+977 98XXXXXXXX" />
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Inquiry Type</label>
                                    <select id="subject" name="subject" value={form.subject} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm bg-white">
                                        <option>Admission Inquiry</option>
                                        <option>Fee Structure</option>
                                        <option>General Question</option>
                                        <option>Transport Inquiry</option>
                                        <option>Hostel Inquiry</option>
                                        <option>Careers</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">Message *</label>
                                    <textarea id="message" name="message" value={form.message} onChange={handleChange} required rows="4" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm resize-none bg-white" placeholder="How can we help you?"></textarea>
                                </div>

                                {error && (
                                    <p className="text-red-600 text-sm font-medium bg-red-50 rounded-lg p-3">{error}</p>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button type="submit" disabled={submitting} className="flex-1 btn-primary py-3.5 text-base flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
                                    </button>
                                    <a href="https://wa.me/9779857078448?text=Namaste%21" target="_blank" rel="noopener noreferrer" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3.5 text-base flex justify-center items-center gap-2 rounded-lg font-semibold transition-all uppercase tracking-wide text-sm hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-600/20">
                                        <MessageCircle className="w-4 h-4" /> WhatsApp
                                    </a>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
