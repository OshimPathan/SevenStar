import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import AdmissionBanner from '../components/landing/AdmissionBanner';
import NoticeTicker from '../components/landing/NoticeTicker';
import About from '../components/landing/About';
import AchievementsStrip from '../components/landing/AchievementsStrip';
import Programs from '../components/landing/Programs';
import Stats from '../components/landing/Stats';
import Highlights from '../components/landing/Highlights';
import Facilities from '../components/landing/Facilities';
import Gallery from '../components/landing/Gallery';
import NoticeBoard from '../components/landing/NoticeBoard';
import Team from '../components/landing/Team';
import Testimonials from '../components/landing/Testimonials';
import Admissions from '../components/landing/Admissions';
import Contact from '../components/landing/Contact';
import Footer from '../components/landing/Footer';
import FloatingActions from '../components/landing/FloatingActions';
import ScrollReveal from '../components/landing/ScrollReveal';
import UpcomingExams from '../components/landing/UpcomingExams';
import ClassesSections from '../components/landing/ClassesSections';
import FeeStructure from '../components/landing/FeeStructure';
import WhyChooseUs from '../components/landing/WhyChooseUs';

const Landing = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
                <Hero />
                <AchievementsStrip />
                <AdmissionBanner />
                <NoticeTicker />
                <ScrollReveal><About /></ScrollReveal>
                <Stats />
                <ScrollReveal><Highlights /></ScrollReveal>
                <ScrollReveal><Programs /></ScrollReveal>
                <ScrollReveal><ClassesSections /></ScrollReveal>
                <ScrollReveal><FeeStructure /></ScrollReveal>
                <ScrollReveal><Facilities /></ScrollReveal>
                <ScrollReveal><Gallery /></ScrollReveal>
                <ScrollReveal><WhyChooseUs /></ScrollReveal>
                <ScrollReveal><NoticeBoard /></ScrollReveal>
                <ScrollReveal><UpcomingExams /></ScrollReveal>
                <ScrollReveal><Team /></ScrollReveal>
                <ScrollReveal><Testimonials /></ScrollReveal>
                <ScrollReveal><Admissions /></ScrollReveal>
                <ScrollReveal><Contact /></ScrollReveal>
            </main>
            <Footer />
            <FloatingActions />
        </div>
    );
};

export default Landing;
