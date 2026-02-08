'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import Image from 'next/image'

const testimonials = [
    {
        content: "Filtering through 500+ applications for a single Trainee role used to take my whole team a week. Now, the AI shortlist is ready before I even finish my morning chiya.",
        author: "Anjali Sharma",
        role: "Head of Talent, CloudFactory",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&q=80",
        rating: 5,
        delay: 0
    },
    {
        content: "In Nepal, everyone lists 'React' on their CV regardless of skill. This tool actually flagged a candidate who understood deep architecture while filtering out the keyword-stuffers.",
        author: "Binod Tamang",
        role: "Senior Engineering Manager, Fusemachines",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&q=80",
        rating: 5,
        delay: 0.1
    },
    {
        content: "We were tired of tracking candidates across Viber groups and messy Excel sheets. Finally, a hiring tool that feels like it belongs in 2026, not a government office from the 90s.",
        author: "Prerana Mukhiya",
        role: "Director of Operations, Leapfrog Technology",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&q=80",
        rating: 5,
        delay: 0.2
    }
]

export function TestimonialsSection() {
    return (
        <section className="py-24 lg:py-32 px-6 lg:px-8 bg-background-subtle relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-left mb-16 lg:mb-20 max-w-2xl"
                >
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-medium text-text-primary leading-tight mb-6">
                        People seem to like us.
                        <br />
                        <span className="text-text-secondary">Mostly because we gave them their weekends back.</span>
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: testimonial.delay }}
                            className="bg-background-surface p-8 rounded-2xl border border-border-default hover:border-primary/20 transition-all duration-300 shadow-sm hover:shadow-md"
                        >
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                                ))}
                            </div>
                            <p className="text-lg text-text-primary font-medium mb-8 leading-relaxed">
                                "{testimonial.content}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-background-subtle">
                                    <Image
                                        src={testimonial.image}
                                        alt={testimonial.author}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <div className="font-semibold text-text-primary text-sm">{testimonial.author}</div>
                                    <div className="text-text-tertiary text-xs">{testimonial.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
