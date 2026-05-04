'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Briefcase, Users, BarChart3, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

const slides = [
  {
    title: 'Manage Projects with Ease',
    description: 'Track progress, manage teams, and stay on schedule with our intuitive project workspace.',
    icon: Briefcase,
    color: 'bg-blue-500',
  },
  {
    title: 'Collaborate in Real-time',
    description: 'Connect with your site team, subcontractors, and clients instantly with live updates.',
    icon: Users,
    color: 'bg-purple-500',
  },
  {
    title: 'Data-Driven Insights',
    description: 'Monitor budgets, material flow, and risks with powerful analytics and reporting tools.',
    icon: BarChart3,
    color: 'bg-emerald-500',
  },
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#0F172A]">
      <div className="w-full max-w-2xl">
        <GlassCard className="p-12 shadow-2xl border-white/10" gradient>
          <div className="relative h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center h-full"
              >
                <div className={`p-6 rounded-3xl ${slides[currentSlide].color} bg-opacity-20 mb-8 border border-white/10`}>
                  <slides[currentSlide].icon className={`w-16 h-16 ${slides[currentSlide].color.replace('bg-', 'text-')}`} />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">{slides[currentSlide].title}</h2>
                <p className="text-lg text-slate-400 max-w-md leading-relaxed">
                  {slides[currentSlide].description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-12">
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'w-8 bg-blue-500' : 'w-2 bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {currentSlide < slides.length - 1 ? (
              <button
                onClick={nextSlide}
                className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl border border-white/10 transition-all active:scale-[0.98]"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
