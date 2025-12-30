'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';

const data = [
  { month: 'Jan', hires: 12, applications: 45 },
  { month: 'Feb', hires: 19, applications: 58 },
  { month: 'Mar', hires: 25, applications: 72 },
  { month: 'Apr', hires: 32, applications: 89 },
  { month: 'May', hires: 41, applications: 105 },
  { month: 'Jun', hires: 48, applications: 118 },
];

export function InsightsSection() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const section = document.getElementById('insights');
      if (section) {
        const rect = section.getBoundingClientRect();
        const isInViewport = rect.width > 0 && rect.height > 0;
        setIsVisible(isInViewport);
      }
    };

    // Check on mount and resize
    checkVisibility();
    window.addEventListener('resize', checkVisibility);

    return () => window.removeEventListener('resize', checkVisibility);
  }, []);

  return (
    <section id="insights" className="hidden xl:block py-20 sm:py-24 lg:py-32 px-6 lg:px-8 bg-white">
      <div className="w-full max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20 px-4"
        >
          <div className="inline-flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-brand-blue" />
            <span className="text-xs sm:text-sm font-medium text-brand-blue uppercase tracking-wider">
              Analytics
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-[#0F172A] mb-4 sm:mb-6 tracking-tight">
            Data-Driven Insights
          </h2>
          <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-[#475569] max-w-3xl mx-auto leading-relaxed">
            Track hiring metrics, understand trends, and make informed decisions
            with real-time analytics
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 border border-[#E5E7EB] mx-4"
        >
          <div className="h-64 sm:h-72 lg:h-80 min-w-0 min-h-64">
            {isVisible && (
              <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={256}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="month"
                    stroke="#475569"
                    style={{ fontSize: '14px' }}
                  />
                  <YAxis stroke="#475569" style={{ fontSize: '14px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      padding: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="hires"
                    stroke="#3056F5"
                    strokeWidth={3}
                    dot={{ fill: '#3056F5', r: 6 }}
                    activeDot={{ r: 8 }}
                    animationDuration={2000}
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ fill: '#8B5CF6', r: 6 }}
                    activeDot={{ r: 8 }}
                    animationDuration={2000}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[#E5E7EB]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 sm:w-8 h-0.5 sm:h-1 bg-brand-blue rounded-full"></div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#475569]">Successful Hires</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-6 sm:w-8 h-0.5 sm:h-1 bg-[#8B5CF6] rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8B5CF6 0, #8B5CF6 4px, transparent 4px, transparent 8px)' }}></div>
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#475569]">Total Applications</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
