import React from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

// Fundo do hero da tela de login: gradiente radial teal (mar) com um brilho
// laranja de "sol" no canto superior direito, igual ao mockup de design.
// Usa gradiente em objectBoundingBox (padrão do react-native-svg), então
// escala junto com a altura responsiva do hero sem recalcular nada em JS.
export function LoginHeroBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="sea" cx="80%" cy="0%" r="95%">
          <Stop offset="0%" stopColor="#2a9a89" />
          <Stop offset="42%" stopColor="#17756a" />
          <Stop offset="100%" stopColor="#0b4a42" />
        </RadialGradient>
        <RadialGradient id="sun" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#ec9a3f" stopOpacity={0.55} />
          <Stop offset="68%" stopColor="#ec9a3f" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height="100%" fill="url(#sea)" />
      <Circle cx="92%" cy="0%" r="34%" fill="url(#sun)" />
    </Svg>
  );
}
