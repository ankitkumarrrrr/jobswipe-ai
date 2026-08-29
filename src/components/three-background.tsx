"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleNetwork() {
  const meshRef = useRef<THREE.Points>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const particleCount = 120;
  const connectionDistance = 2.5;

  const { positions, velocities, linePositions, lineColors } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const linePos = new Float32Array(particleCount * particleCount * 6);
    const lineCol = new Float32Array(particleCount * particleCount * 6);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;

      vel[i * 3] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
    }

    return {
      positions: pos,
      velocities: vel,
      linePositions: linePos,
      lineColors: lineCol,
    };
  }, []);

  useFrame(() => {
    if (!meshRef.current || !lineRef.current) return;

    const posAttr = meshRef.current.geometry.attributes.position;
    const posArray = posAttr.array as Float32Array;
    const linePosArray = lineRef.current.geometry.attributes.position
      .array as Float32Array;
    const lineColArray = lineRef.current.geometry.attributes.color
      .array as Float32Array;

    // Update particle positions
    for (let i = 0; i < particleCount; i++) {
      posArray[i * 3] += velocities[i * 3];
      posArray[i * 3 + 1] += velocities[i * 3 + 1];
      posArray[i * 3 + 2] += velocities[i * 3 + 2];

      // Bounce off boundaries
      for (let j = 0; j < 3; j++) {
        const limit = j === 0 ? 6 : j === 1 ? 4 : 3;
        if (Math.abs(posArray[i * 3 + j]) > limit) {
          velocities[i * 3 + j] *= -1;
        }
      }
    }

    posAttr.needsUpdate = true;

    // Update connections
    let lineIndex = 0;
    let connectionCount = 0;

    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = posArray[i * 3] - posArray[j * 3];
        const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
        const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < connectionDistance) {
          const alpha = 1 - dist / connectionDistance;

          linePosArray[lineIndex] = posArray[i * 3];
          linePosArray[lineIndex + 1] = posArray[i * 3 + 1];
          linePosArray[lineIndex + 2] = posArray[i * 3 + 2];
          linePosArray[lineIndex + 3] = posArray[j * 3];
          linePosArray[lineIndex + 4] = posArray[j * 3 + 1];
          linePosArray[lineIndex + 5] = posArray[j * 3 + 2];

          // Purple/indigo color for lines
          lineColArray[lineIndex] = 0.39 * alpha;
          lineColArray[lineIndex + 1] = 0.25 * alpha;
          lineColArray[lineIndex + 2] = 0.92 * alpha;
          lineColArray[lineIndex + 3] = 0.39 * alpha;
          lineColArray[lineIndex + 4] = 0.25 * alpha;
          lineColArray[lineIndex + 5] = 0.92 * alpha;

          lineIndex += 6;
          connectionCount++;
        }
      }
    }

    // Zero out remaining
    for (let i = lineIndex; i < linePosArray.length; i++) {
      linePosArray[i] = 0;
      lineColArray[i] = 0;
    }

    lineRef.current.geometry.attributes.position.needsUpdate = true;
    lineRef.current.geometry.attributes.color.needsUpdate = true;
    lineRef.current.geometry.setDrawRange(0, connectionCount * 2);
  });

  return (
    <>
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#8b5cf6"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
      <lineSegments ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineColors, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.4}
          linewidth={1}
        />
      </lineSegments>
    </>
  );
}

function FloatingOrbs() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.children.forEach((child, i) => {
      child.position.y = Math.sin(t * 0.3 + i * 1.5) * 0.5;
      child.position.x = Math.cos(t * 0.2 + i * 2) * 0.3;
    });
  });

  const orbPositions = useMemo(
    () => [
      [-3, 1, -3],
      [4, -1, -4],
      [-2, -2, -2],
      [3, 2, -5],
      [0, 0, -3],
    ],
    []
  );

  return (
    <group ref={groupRef}>
      {orbPositions.map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.15 + i * 0.05, 16, 16]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#7c3aed" : "#6366f1"}
            transparent
            opacity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

export default function ThreeBackground() {
  const handleCreated = useCallback((state: { gl: THREE.WebGLRenderer }) => {
    state.gl.setClearColor("#0a0118", 1);
  }, []);

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        onCreated={handleCreated}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.5} />
        <ParticleNetwork />
        <FloatingOrbs />
      </Canvas>
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0118]/80 via-transparent to-[#0a0118]/40 pointer-events-none" />
    </div>
  );
}
