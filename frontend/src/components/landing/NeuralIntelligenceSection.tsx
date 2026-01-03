'use client';

import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';

// Neural network configuration
const LAYERS = {
  input: 3,
  hidden: 4,
  output: 2,
};

// Beautiful color palette for neural network
const NEURAL_COLORS = {
  // Layer-specific neuron colors
  layers: {
    input: '#3B82F6',    // Electric Blue
    hidden: '#8B5CF6',   // Royal Purple
    output: '#EC4899',   // Vibrant Pink
  },
  // Signal colors for different phases
  signals: {
    forward: {
      primary: '#3B82F6',    // Electric Blue
      secondary: '#60A5FA',  // Light Blue
      accent: '#93C5FD',     // Sky Blue
    },
    backward: {
      primary: '#EC4899',    // Vibrant Pink
      secondary: '#F472B6',  // Light Pink
      accent: '#F9A8D4',     // Soft Pink
    },
  },
  // Connection line colors
  connections: {
    active: '#CBD5E1',       // Light Gray
    inactive: '#E2E8F0',     // Very Light Gray
  },
  // Background gradients
  gradients: {
    forward: 'radial-gradient(ellipse at center, rgba(59,130,246,0.12) 0%, rgba(96,165,250,0.08) 35%, rgba(147,197,253,0.04) 70%, rgba(249,250,251,0) 100%)',
    backward: 'radial-gradient(ellipse at center, rgba(236,72,153,0.12) 0%, rgba(244,114,182,0.08) 35%, rgba(249,168,212,0.04) 70%, rgba(249,250,251,0) 100%)',
    neutral: 'radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, rgba(167,139,250,0.06) 35%, rgba(196,181,253,0.03) 70%, rgba(249,250,251,0) 100%)',
  }
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
  path?: Connection[]; // Full path for multi-hop signals
  pathIndex?: number; // Current connection in the path
  size?: number; // Signal size for visual variety
  trail?: boolean; // Whether to show trail effect
  direction?: 'forward' | 'backward'; // Add direction to know how to render
}

export function NeuralIntelligenceSection() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: false, margin: '-100px' });

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [neurons, setNeurons] = useState<Neuron[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const signalsRef = useRef<Signal[]>([]);
  const [animationPhase, setAnimationPhase] = useState<'forward' | 'backward'>('forward');
  const [time, setTime] = useState(0);
  const [hoveredNeuronIndex, setHoveredNeuronIndex] = useState<number | null>(null);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateSignals = useCallback(
    (updater: Signal[] | ((prev: Signal[]) => Signal[])) => {
      setSignals((prev) => {
        const next =
          typeof updater === 'function' ? updater(prev) : updater;
        signalsRef.current = next;
        return next;
      });
    },
    []
  );

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

      // Phase management (8 second cycle: 4s forward + 4s backward)
      if (animationPhase === 'forward' && phaseTime >= 4) {
        setAnimationPhase('backward');
        phaseTime = 0;
        updateSignals([]);
      } else if (animationPhase === 'backward' && phaseTime >= 4) {
        setAnimationPhase('forward');
        phaseTime = 0;
        updateSignals([]);
      }

      // Spawn synchronized wave of signals at the start of each phase
      if (animationPhase === 'forward' && phaseTime < 0.1 && signalsRef.current.length === 0) {
        // Forward: Create wave from all input neurons to ALL hidden neurons to ALL output neurons
        const inputNeurons = neurons.filter((n) => n.layer === 'input');
        const hiddenNeurons = neurons.filter((n) => n.layer === 'hidden');
        const outputNeurons = neurons.filter((n) => n.layer === 'output');

        if (inputNeurons.length && hiddenNeurons.length && outputNeurons.length) {
          const newSignals: Signal[] = [];
          const forwardColors = [
            NEURAL_COLORS.signals.forward.primary,
            NEURAL_COLORS.signals.forward.secondary,
            NEURAL_COLORS.signals.forward.accent
          ];

          // Each input neuron sends to ALL hidden neurons, each hidden to ALL outputs
          inputNeurons.forEach((inputNeuron, inputIdx) => {
            hiddenNeurons.forEach((hiddenNeuron, hiddenIdx) => {
              // Pick a random output for this path
              const outputNeuron = outputNeurons[Math.floor(Math.random() * outputNeurons.length)];

              const path: Connection[] = [
                { from: inputNeuron, to: hiddenNeuron },
                { from: hiddenNeuron, to: outputNeuron },
              ];

              const colorIndex = (inputIdx + hiddenIdx) % forwardColors.length;
              const signalSize = 4 + Math.random() * 2; // Varied sizes

              newSignals.push({
                connection: path[0],
                progress: 0,
                id: `forward-${Date.now()}-${Math.random()}`,
                color: forwardColors[colorIndex],
                path,
                pathIndex: 0,
                size: signalSize,
                trail: Math.random() > 0.5, // Random trail effect
                direction: 'forward',
              });
            });
          });

          updateSignals(newSignals);
        }
      } else if (animationPhase === 'backward' && phaseTime < 0.1 && signalsRef.current.length === 0) {
        // Backward: Create wave that moves from RIGHT to LEFT (output→hidden→input)
        const inputNeurons = neurons.filter((n) => n.layer === 'input');
        const hiddenNeurons = neurons.filter((n) => n.layer === 'hidden');
        const outputNeurons = neurons.filter((n) => n.layer === 'output');

        if (inputNeurons.length && hiddenNeurons.length && outputNeurons.length) {
          const newSignals: Signal[] = [];
          const backwardColors = [
            NEURAL_COLORS.signals.backward.primary,
            NEURAL_COLORS.signals.backward.secondary,
            NEURAL_COLORS.signals.backward.accent
          ];

          // For backward propagation, signals start from output neurons and flow to input neurons
          // We create connections that go from right to left: output → hidden → input
          outputNeurons.forEach((outputNeuron, outputIdx) => {
            hiddenNeurons.forEach((hiddenNeuron, hiddenIdx) => {
              // Pick a random input for this path
              const inputNeuron = inputNeurons[Math.floor(Math.random() * inputNeurons.length)];

              // Create path for backward propagation: output → hidden → input
              const path: Connection[] = [
                { from: outputNeuron, to: hiddenNeuron },   // Output → Hidden
                { from: hiddenNeuron, to: inputNeuron },    // Hidden → Input
              ];

              const colorIndex = (outputIdx + hiddenIdx) % backwardColors.length;
              const signalSize = 4 + Math.random() * 2;

              newSignals.push({
                connection: path[0],
                progress: 0,
                id: `backward-${Date.now()}-${Math.random()}`,
                color: backwardColors[colorIndex],
                path,
                pathIndex: 0,
                size: signalSize,
                trail: Math.random() > 0.5,
                direction: 'backward',
              });
            });
          });

          updateSignals(newSignals);
        }
      }

      // Update signals and handle path transitions
      updateSignals((prev) => {
        const updated: Signal[] = [];

        for (const signal of prev) {
          const newProgress = signal.progress + deltaTime / 1.5;

          // If signal completed its current connection
          if (newProgress >= 1 && signal.path && signal.pathIndex !== undefined) {
            const nextIndex = signal.pathIndex + 1;

            // If there's a next connection in the path
            if (nextIndex < signal.path.length) {
              updated.push({
                ...signal,
                connection: signal.path[nextIndex],
                progress: 0,
                pathIndex: nextIndex,
              });
            }
            // Signal completed entire path, remove it
          } else if (newProgress < 1) {
            // Signal still in progress on current connection
            updated.push({
              ...signal,
              progress: newProgress,
            });
          }
        }

        return updated;
      });

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
    animationPhase,
    updateSignals,
  ]);

  // Calculate neuron size based on screen size
  const neuronSize = dimensions.width < 768 ? 12 : dimensions.width < 1024 ? 14 : 16;
  const signalSize = dimensions.width < 768 ? 4 : 6;

  return (
    <section
      ref={sectionRef}
      className="hidden xl:block py-20 sm:py-24 lg:py-32 px-6 lg:px-8 bg-[#F9FAFB]"
      aria-label="Neural network visualization showing AI decision-making"
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 xl:gap-20 items-center">
          {/* Left Column - Text (40%) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-2 px-4 lg:px-0"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-[#0F172A] mb-4 sm:mb-6 tracking-tight">
              Neural Intelligence in Action
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-[#475569] leading-relaxed">
              Watch our AI reason through every hiring decision.
            </p>
          </motion.div>

          {/* Right Column - Neural Network (60%) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-3 px-4 lg:px-0"
          >
            <div className="bg-white rounded-3xl shadow-lg p-12 border border-[#E5E7EB] transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] max-lg:p-8">

              <div
                ref={canvasRef}
                className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden transition-all duration-1000"
                style={{
                  background: animationPhase === 'forward'
                    ? NEURAL_COLORS.gradients.forward
                    : NEURAL_COLORS.gradients.backward,
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
                    {connections.map((conn, i) => {
                      // Determine connection color based on layer types
                      let strokeColor = NEURAL_COLORS.connections.inactive;
                      if (conn.from.layer === 'input' && conn.to.layer === 'hidden') {
                        strokeColor = NEURAL_COLORS.layers.input;
                      } else if (conn.from.layer === 'hidden' && conn.to.layer === 'output') {
                        strokeColor = NEURAL_COLORS.layers.hidden;
                      }

                      return (
                        <line
                          key={`conn-${i}`}
                          x1={conn.from.x}
                          y1={conn.from.y}
                          x2={conn.to.x}
                          y2={conn.to.y}
                          stroke={strokeColor}
                          strokeWidth={dimensions.width < 768 ? 1.5 : 2}
                          strokeLinecap="round"
                          opacity={0.3}
                        />
                      );
                    })}
                  </g>

                  {/* Signal Dots with Enhanced Visuals */}
                  {!prefersReducedMotion &&
                    signals.map((signal) => {
                      const { from, to } = signal.connection;

                      // Calculate signal position based on direction
                      let x, y;
                      if (signal.direction === 'backward') {
                        // For backward signals, they move from right to left
                        // So we interpolate from 'from' (right) to 'to' (left)
                        x = from.x + (to.x - from.x) * signal.progress;
                        y = from.y + (to.y - from.y) * signal.progress;
                      } else {
                        // For forward signals, normal left to right interpolation
                        x = from.x + (to.x - from.x) * signal.progress;
                        y = from.y + (to.y - from.y) * signal.progress;
                      }

                      const currentSize = signal.size || signalSize;

                      return (
                        <g key={signal.id}>
                          {/* Trail effect for some signals */}
                          {signal.trail && (
                            <>
                              {[0.2, 0.1, 0.05].map((offset, i) => {
                                const trailProgress = Math.max(0, signal.progress - offset);

                                // Trail follows the same direction as the main signal
                                const trailX = from.x + (to.x - from.x) * trailProgress;
                                const trailY = from.y + (to.y - from.y) * trailProgress;

                                const trailOpacity = (1 - i * 0.3) * 0.4;

                                return signal.progress > offset ? (
                                  <circle
                                    key={`trail-${i}`}
                                    cx={trailX}
                                    cy={trailY}
                                    r={currentSize * (1 - i * 0.2)}
                                    fill={signal.color}
                                    opacity={trailOpacity}
                                    style={{
                                      filter: `blur(${i + 1}px)`,
                                    }}
                                  />
                                ) : null;
                              })}
                            </>
                          )}

                          {/* Main signal with glow */}
                          <circle
                            cx={x}
                            cy={y}
                            r={currentSize}
                            fill={signal.color}
                            style={{
                              filter: `drop-shadow(0 0 ${currentSize * 3}px ${signal.color})`,
                            }}
                          />

                          {/* Bright core */}
                          <circle
                            cx={x}
                            cy={y}
                            r={currentSize * 0.6}
                            fill="white"
                            opacity="0.9"
                          />

                          {/* Inner sparkle */}
                          <circle
                            cx={x}
                            cy={y}
                            r={currentSize * 0.3}
                            fill={signal.color}
                            opacity="0.8"
                          />
                        </g>
                      );
                    })}

                  {/* Neurons with Layer-Specific Colors */}
                  {neurons.map((neuron, i) => {
                    const pulsePhase = prefersReducedMotion
                      ? 0
                      : Math.sin(time + neuron.pulseOffset) * 0.5 + 0.5;
                    const isHovered = hoveredNeuronIndex === i;
                    const opacity = isHovered ? 0.6 : 0.2 + pulsePhase * 0.3;
                    const glowIntensity = isHovered ? 1 : pulsePhase;

                    // Get layer-specific color
                    const layerColor = NEURAL_COLORS.layers[neuron.layer];

                    // Convert hex to rgba for opacity
                    const hexToRgb = (hex: string) => {
                      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                      return result ? {
                        r: parseInt(result[1], 16),
                        g: parseInt(result[2], 16),
                        b: parseInt(result[3], 16)
                      } : null;
                    };
                    const rgb = hexToRgb(layerColor);
                    const rgbaFill = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})` : layerColor;
                    const rgbaGlow = rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isHovered ? 0.8 : glowIntensity * 0.6})` : layerColor;

                    return (
                      <g key={`neuron-${i}`}>
                        {/* Outer glow ring */}
                        {!prefersReducedMotion && (glowIntensity > 0.6 || isHovered) && (
                          <circle
                            cx={neuron.x}
                            cy={neuron.y}
                            r={neuronSize + (isHovered ? 10 : 6)}
                            fill="none"
                            stroke={layerColor}
                            strokeWidth="1"
                            opacity={isHovered ? 0.6 : glowIntensity * 0.4}
                            style={{
                              filter: `blur(${isHovered ? 16 : glowIntensity * 12}px)`,
                              transition: 'all 0.3s ease',
                            }}
                          />
                        )}

                        {/* Main neuron circle with hover interaction */}
                        <circle
                          cx={neuron.x}
                          cy={neuron.y}
                          r={neuronSize}
                          fill={rgbaFill}
                          stroke={layerColor}
                          strokeWidth={isHovered ? "3" : "2.5"}
                          style={{
                            filter: !prefersReducedMotion && (glowIntensity > 0.6 || isHovered)
                              ? `drop-shadow(0 0 ${isHovered ? 35 : glowIntensity * 25}px ${rgbaGlow})`
                              : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                          }}
                          onMouseEnter={() => setHoveredNeuronIndex(i)}
                          onMouseLeave={() => setHoveredNeuronIndex(null)}
                        />

                        {/* Inner bright core */}
                        <circle
                          cx={neuron.x}
                          cy={neuron.y}
                          r={neuronSize * 0.4}
                          fill="white"
                          opacity={isHovered ? 0.9 : 0.7}
                        />

                        {/* Extra glow for hovered state */}
                        {isHovered && (
                          <>
                            <circle
                              cx={neuron.x}
                              cy={neuron.y}
                              r={neuronSize + 14}
                              fill="none"
                              stroke={layerColor}
                              strokeWidth="1.5"
                              opacity="0.4"
                              style={{
                                filter: 'blur(10px)',
                              }}
                            />
                            <circle
                              cx={neuron.x}
                              cy={neuron.y}
                              r={neuronSize + 20}
                              fill="none"
                              stroke={layerColor}
                              strokeWidth="1"
                              opacity="0.2"
                              style={{
                                filter: 'blur(14px)',
                              }}
                            />
                          </>
                        )}
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
