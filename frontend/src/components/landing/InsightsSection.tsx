'use client';

import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', hires: 12, applications: 45 },
  { month: 'Feb', hires: 19, applications: 58 },
  { month: 'Mar', hires: 25, applications: 72 },
  { month: 'Apr', hires: 32, applications: 89 },
  { month: 'May', hires: 41, applications: 105 },
  { month: 'Jun', hires: 48, applications: 118 },
];

export function InsightsSection() {
  return (
    <section id="insights" className="py-32 px-6 bg-white">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-brand-blue" />
            <span className="text-sm font-medium text-brand-blue uppercase tracking-wider">
              Analytics
            </span>
          </div>
          <h2 className="text-5xl font-semibold text-[#0F172A] mb-6 tracking-tight max-lg:text-4xl">
            Data-Driven Insights
          </h2>
          <p className="text-xl text-[#475569] max-w-2xl mx-auto">
            Track hiring metrics, understand trends, and make informed decisions
            with real-time analytics
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-8 border border-[#E5E7EB]"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
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
          </div>

          <div className="grid grid-cols-2 gap-6 mt-8 pt-8 border-t border-[#E5E7EB]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-1 bg-brand-blue rounded-full"></div>
              </div>
              <p className="text-sm font-medium text-[#475569]">Successful Hires</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-1 bg-[#8B5CF6] rounded-full" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #8B5CF6 0, #8B5CF6 4px, transparent 4px, transparent 8px)' }}></div>
              </div>
              <p className="text-sm font-medium text-[#475569]">Total Applications</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

