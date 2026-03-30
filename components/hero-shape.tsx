"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function ShieldNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const pointsRef = useRef<THREE.Points>(null);

  // Shield Shape
  const shieldShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 1.5);
    shape.quadraticCurveTo(1.5, 1.5, 1.5, 0.5);
    shape.quadraticCurveTo(1.5, -1.0, 0, -2.0);
    shape.quadraticCurveTo(-1.5, -1.0, -1.5, 0.5);
    shape.quadraticCurveTo(-1.5, 1.5, 0, 1.5);
    return shape;
  }, []);

  const extrudeSettings = { depth: 0.2, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.05, bevelThickness: 0.05 };

  const particlesCount = 40;
  const positions = useMemo(() => {
    const pos = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.001;
      pointsRef.current.rotation.x += 0.0005;
    }
  });

  return (
    <group>
      {/* Shield */}
      <group ref={groupRef}>
        <mesh>
          <extrudeGeometry args={[shieldShape, extrudeSettings]} />
          <meshBasicMaterial color="#39d353" wireframe transparent opacity={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.1]}>
          <extrudeGeometry args={[shieldShape, { ...extrudeSettings, depth: 0.01 }]} />
          <meshBasicMaterial color="#39d353" transparent opacity={0.05} />
        </mesh>
      </group>
      {/* Network Points */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particlesCount} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} color="#bc8cff" transparent opacity={0.6} sizeAttenuation />
      </points>
      {/* Network Lines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.OctahedronGeometry(3.5, 1)]} />
        <lineBasicMaterial color="#bc8cff" transparent opacity={0.1} />
      </lineSegments>
    </group>
  );
}

export default function HeroShape() {
  return (
    <div className="absolute right-0 top-0 w-1/2 h-full pointer-events-none hidden md:block">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ShieldNetwork />
      </Canvas>
    </div>
  );
}
