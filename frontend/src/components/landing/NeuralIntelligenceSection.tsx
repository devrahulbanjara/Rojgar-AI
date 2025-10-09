'use client';

import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

// Neural network configuration
const LAYERS = {
  input: 3,
  hidden: 4,
  output: 2,
};

interface Neuron {
  x: number;
  y: number;
  layer: 'input' | 'hidden' | 'output';
  index: number;
  pulseOffset: number;
}

interface Connection {
  from: Neuron;
  to: Neuron;
}

interface Signal {
  connection: Connection;
  progress: number;
  id: string;
  color: string;
}

export function NeuralIntelligenceSection() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: '-100px' });
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [neurons, setNeurons] = useState<Neuron[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [animationPhase, setAnimationPhase] = useState<'forward' | 'backward' | 'pause'>('forward');
  const [time, setTime] = useState(0);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize neurons and connections
  useEffect(() => {
    const updateDimensions = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    const padding = 80;
    const layerSpacing = (dimensions.width - padding * 2) / 2;
    const newNeurons: Neuron[] = [];

    // Create input layer neurons
    const inputSpacing = dimensions.height / (LAYERS.input + 1);
    for (let i = 0; i < LAYERS.input; i++) {
      newNeurons.push({
        x: padding,
        y: inputSpacing * (i + 1),
        layer: 'input',
        index: i,
        pulseOffset: Math.random() * 2,
      });
    }

    // Create hidden layer neurons
    const hiddenSpacing = dimensions.height / (LAYERS.hidden + 1);
    for (let i = 0; i < LAYERS.hidden; i++) {
      newNeurons.push({
        x: padding + layerSpacing,
        y: hiddenSpacing * (i + 1),
        layer: 'hidden',
        index: i,
        pulseOffset: Math.random() * 2,
      });
    }

    // Create output layer neurons
    const outputSpacing = dimensions.height / (LAYERS.output + 1);
    for (let i = 0; i < LAYERS.output; i++) {
      newNeurons.push({
        x: padding + layerSpacing * 2,
        y: outputSpacing * (i + 1),
        layer: 'output',
        index: i,
        pulseOffset: Math.random() * 2,
      });
    }

    setNeurons(newNeurons);

    // Create connections
    const newConnections: Connection[] = [];
    const inputNeurons = newNeurons.filter((n) => n.layer === 'input');
    const hiddenNeurons = newNeurons.filter((n) => n.layer === 'hidden');
    const outputNeurons = newNeurons.filter((n) => n.layer === 'output');

    // Connect input to hidden
    inputNeurons.forEach((input) => {
      hiddenNeurons.forEach((hidden) => {
        newConnections.push({ from: input, to: hidden });
      });
    });

    // Connect hidden to output
    hiddenNeurons.forEach((hidden) => {
      outputNeurons.forEach((output) => {
        newConnections.push({ from: hidden, to: output });
      });
    });

    setConnections(newConnections);
  }, [dimensions]);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion || !isInView || neurons.length === 0) return;

    let animationFrameId: number;
    let lastTime = Date.now();
    let phaseTime = 0;

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setTime((t) => t + deltaTime);
      phaseTime += deltaTime;

      // Phase management (11 second cycle: 5s forward + 5s backward + 1s pause)
      if (animationPhase === 'forward' && phaseTime >= 5) {
        setAnimationPhase('backward');
        phaseTime = 0;
        setSignals([]);
      } else if (animationPhase === 'backward' && phaseTime >= 5) {
        setAnimationPhase('pause');
        phaseTime = 0;
        setSignals([]);
      } else if (animationPhase === 'pause' && phaseTime >= 1) {
        setAnimationPhase('forward');
        phaseTime = 0;
      }

      // Spawn signals during propagation phases
      if (animationPhase === 'forward' && Math.random() < 0.05) {
        const inputConnections = connections.filter(
          (c) => c.from.layer === 'input'
        );
        if (inputConnections.length > 0) {
          const randomConnection =
            inputConnections[Math.floor(Math.random() * inputConnections.length)];
          setSignals((prev) => [
            ...prev,
            {
              connection: randomConnection,
              progress: 0,
              id: `forward-${Date.now()}-${Math.random()}`,
              color: '#3056F5',
            },
          ]);
        }
      } else if (animationPhase === 'backward' && Math.random() < 0.05) {
        const outputConnections = connections.filter(
          (c) => c.to.layer === 'output'
        );
        if (outputConnections.length > 0) {
          const randomConnection =
            outputConnections[Math.floor(Math.random() * outputConnections.length)];
          setSignals((prev) => [
            ...prev,
            {
              connection: { from: randomConnection.to, to: randomConnection.from },
              progress: 0,
              id: `backward-${Date.now()}-${Math.random()}`,
              color: '#EC4899',
            },
          ]);
        }
      }

      // Update signals
      setSignals((prev) =>
        prev
          .map((signal) => ({
            ...signal,
            progress: signal.progress + deltaTime / 1.5,
          }))
          .filter((signal) => signal.progress < 1)
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [
    isInView,
    prefersReducedMotion,
    neurons,
    connections,
    animationPhase,
  ]);

  // Calculate neuron size based on screen size
  const neuronSize = dimensions.width < 768 ? 12 : dimensions.width < 1024 ? 14 : 16;
  const signalSize = dimensions.width < 768 ? 4 : 6;

  return (
    <section
      ref={sectionRef}
      className="py-32 px-6 bg-[#F9FAFB] max-lg:py-20"
      aria-label="Neural network visualization showing AI decision-making"
    >
      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-5 gap-16 items-center max-lg:gap-10">
          {/* Left Column - Text (40%) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2"
          >
            <h2 className="text-5xl font-semibold text-[#0F172A] mb-4 tracking-tight max-lg:text-4xl">
              Intelligence You Can See
            </h2>
            <p className="text-lg text-[#475569] leading-relaxed">
              Watch our AI reason through every hiring decision—live.
            </p>
          </motion.div>

          {/* Right Column - Neural Network (60%) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-3xl shadow-lg p-12 border border-[#E5E7EB] transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] max-lg:p-8">
              <div
                ref={canvasRef}
                className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(48,86,245,0.08) 0%, rgba(236,72,153,0.06) 50%, rgba(249,250,251,0) 100%)',
                }}
              >
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                  className="absolute inset-0"
                >
                  {/* Connection Lines */}
                  <g opacity="0.4">
                    {connections.map((conn, i) => (
                      <line
                        key={`conn-${i}`}
                        x1={conn.from.x}
                        y1={conn.from.y}
                        x2={conn.to.x}
                        y2={conn.to.y}
                        stroke="#E5E7EB"
                        strokeWidth={dimensions.width < 768 ? 1 : 1.5}
                      />
                    ))}
                  </g>

                  {/* Signal Dots */}
                  {!prefersReducedMotion &&
                    signals.map((signal) => {
                      const { from, to } = signal.connection;
                      const x = from.x + (to.x - from.x) * signal.progress;
                      const y = from.y + (to.y - from.y) * signal.progress;
                      
                      return (
                        <circle
                          key={signal.id}
                          cx={x}
                          cy={y}
                          r={signalSize}
                          fill={signal.color}
                          style={{
                            filter: `drop-shadow(0 0 ${signalSize * 2}px ${signal.color})`,
                          }}
                        />
                      );
                    })}

                  {/* Neurons */}
                  {neurons.map((neuron, i) => {
                    const pulsePhase = prefersReducedMotion
                      ? 0
                      : Math.sin(time + neuron.pulseOffset) * 0.5 + 0.5;
                    const opacity = 0.1 + pulsePhase * 0.2;
                    const glowIntensity = pulsePhase;

                    return (
                      <g key={`neuron-${i}`}>
                        {!prefersReducedMotion && glowIntensity > 0.6 && (
                          <circle
                            cx={neuron.x}
                            cy={neuron.y}
                            r={neuronSize + 4}
                            fill="none"
                            stroke="#3056F5"
                            strokeWidth="0.5"
                            opacity={glowIntensity * 0.3}
                            style={{
                              filter: `blur(${glowIntensity * 8}px)`,
                            }}
                          />
                        )}
                        <circle
                          cx={neuron.x}
                          cy={neuron.y}
                          r={neuronSize}
                          fill={`rgba(48, 86, 245, ${opacity})`}
                          stroke="#3056F5"
                          strokeWidth="2"
                          style={{
                            filter: !prefersReducedMotion && glowIntensity > 0.6
                              ? `drop-shadow(0 0 ${glowIntensity * 20}px rgba(48, 86, 245, ${glowIntensity * 0.6}))`
                              : 'none',
                          }}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

