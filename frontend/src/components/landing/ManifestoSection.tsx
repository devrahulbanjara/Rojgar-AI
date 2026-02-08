'use client'

import { motion } from 'framer-motion'

export function ManifestoSection() {
    return (
        <section className="py-24 lg:py-32 px-6 lg:px-8 bg-background relative overflow-hidden">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="relative pl-8 lg:pl-12 border-l-4 border-primary"
                >
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium text-text-primary leading-tight mb-8">
                        We're tired of good people getting rejected by bad algorithms.
                    </h2>
                    <div className="space-y-6 text-lg sm:text-xl text-text-secondary font-sans leading-relaxed max-w-2xl">
                        <p>
                            Hiring shouldn't be a keyword matching game. It shouldn't be about who can cheat the system with hidden white text or perfectly formatted PDFs.
                        </p>
                        <p>
                            It should be about reading between the lines. Understanding potential. Seeing the person behind the paper.
                        </p>
                        <p className="font-medium text-text-primary pt-4">
                            That's why we built this. To make hiring human again.
                        </p>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
