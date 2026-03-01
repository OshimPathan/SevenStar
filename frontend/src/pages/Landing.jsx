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
import ErrorBoundary from '../components/ErrorBoundary';

// Wrap each section so one failing component doesn't take down the whole page
const Safe = ({ children }) => <ErrorBoundary>{children}</ErrorBoundary>;

const Landing = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
                <Safe><Hero /></Safe>
                <Safe><AchievementsStrip /></Safe>
                <Safe><AdmissionBanner /></Safe>
                <Safe><NoticeTicker /></Safe>
                <ScrollReveal><Safe><About /></Safe></ScrollReveal>
                <Safe><Stats /></Safe>
                <ScrollReveal><Safe><Highlights /></Safe></ScrollReveal>
                <ScrollReveal><Safe><Programs /></Safe></ScrollReveal>
                <ScrollReveal><Safe><ClassesSections /></Safe></ScrollReveal>
                <ScrollReveal><Safe><FeeStructure /></Safe></ScrollReveal>
                <ScrollReveal><Safe><Facilities /></Safe></ScrollReveal>
                <ScrollReveal><Safe><Gallery /></Safe></ScrollReveal>
                <ScrollReveal><Safe><WhyChooseUs /></Safe></ScrollReveal>
                <ScrollReveal><Safe><NoticeBoard /></Safe></ScrollReveal>
                <ScrollReveal><Safe><UpcomingExams /></Safe></ScrollReveal>
                <ScrollReveal><Safe><Team /></Safe></ScrollReveal>
                <ScrollReveal><Safe><Testimonials /></Safe></ScrollReveal>
                <ScrollReveal><Safe><Admissions /></Safe></ScrollReveal>
                <ScrollReveal><Safe><Contact /></Safe></ScrollReveal>
            </main>
            <Footer />
            <FloatingActions />
        </div>
    );
};

export default Landing;
