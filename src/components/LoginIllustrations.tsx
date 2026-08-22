import React from 'react';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';

interface Props {
  size?: number;
}

// Ilustrações decorativas da cena da tela de login (bebidas/petiscos do
// quiosque). Traçados adaptados do mockup de design — cores simplificadas
// para tons chapados (sem gradientes internos), já que são pequenas e o
// gradiente não faz diferença perceptível nesse tamanho.
export function CaipirinhaIllustration({ size = 70 }: Props) {
  return (
    <Svg width={size} height={(size * 120) / 100} viewBox="0 0 100 120" fill="none">
      <Path d="M24 40h52l-7 62a6 6 0 0 1-6 5H37a6 6 0 0 1-6-5z" fill="#eafbff" opacity={0.55} />
      <Path d="M27 52h46l-6 50a5 5 0 0 1-5 4H38a5 5 0 0 1-5-4z" fill="#9bd34e" />
      <Rect x={34} y={58} width={12} height={12} rx={3} fill="#fff" opacity={0.7} />
      <Path d="M40 60l8 5-8 5z" fill="#5fae2a" />
      <Rect x={55} y={20} width={4} height={40} rx={2} fill="#ec9a3f" transform="rotate(12 57 40)" />
      <Path d="M24 40h52" stroke="#eafbff" strokeWidth={5} strokeLinecap="round" opacity={0.8} />
    </Svg>
  );
}

export function ChoppIllustration({ size = 64 }: Props) {
  return (
    <Svg width={size} height={(size * 130) / 100} viewBox="0 0 100 130" fill="none">
      <Path d="M33 54h34l-4 62a5 5 0 0 1-5 4H42a5 5 0 0 1-5-4z" fill="#e8901b" />
      <Path d="M70 60q16 6 10 24q-2 10-12 8l4-32z" fill="#fff6df" opacity={0.55} />
      <Ellipse cx={50} cy={46} rx={22} ry={12} fill="#fffdf7" />
      <Ellipse cx={38} cy={42} rx={7} ry={7} fill="#fff" />
      <Ellipse cx={52} cy={38} rx={9} ry={9} fill="#fff" />
      <Ellipse cx={63} cy={43} rx={6} ry={6} fill="#fff" />
      <Ellipse cx={41} cy={66} rx={3} ry={9} fill="#fff" opacity={0.45} />
    </Svg>
  );
}

export function FritasIllustration({ size = 78 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 110 110" fill="none">
      <Rect x={30} y={24} width={8} height={46} rx={4} fill="#ffce4d" transform="rotate(-12 34 47)" />
      <Rect x={42} y={18} width={8} height={52} rx={4} fill="#ffd968" />
      <Rect x={54} y={20} width={8} height={50} rx={4} fill="#ffce4d" transform="rotate(7 58 45)" />
      <Rect x={66} y={26} width={8} height={44} rx={4} fill="#ffd968" transform="rotate(15 70 48)" />
      <Path d="M26 56h58l-7 40a7 7 0 0 1-7 6H40a7 7 0 0 1-7-6z" fill="#ec7a2f" />
      <Path d="M26 56h58l-1.6 9H27.6z" fill="#ff9a4d" />
      <Rect x={40} y={66} width={30} height={18} rx={2} fill="#fff" opacity={0.92} />
      <Path d="M44 71h22M44 76h22M44 81h16" stroke="#ec7a2f" strokeWidth={2} strokeLinecap="round" opacity={0.6} />
    </Svg>
  );
}

export function CocoIllustration({ size = 58 }: Props) {
  return (
    <Svg width={size} height={(size * 110) / 90} viewBox="0 0 90 110" fill="none">
      <Path
        d="M45 30C22 30 16 52 20 74 23 94 34 102 45 102s22-8 25-28C74 52 68 30 45 30z"
        fill="#3f7d68"
      />
      <Path d="M45 30C30 30 22 45 22 62c12-4 34-4 46 0 0-17-8-32-23-32z" fill="#5aa285" />
      <Ellipse cx={45} cy={34} rx={14} ry={7} fill="#bfe0cf" />
      <Rect x={52} y={6} width={4} height={34} rx={2} fill="#ec9a3f" transform="rotate(14 54 22)" />
      <Path
        d="M40 20q-14-10-26-6 10 2 16 10q-12-2-20 4 12-1 20 6q6-8 10-14z"
        fill="#3fa34d"
      />
    </Svg>
  );
}
