import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

export function BeachUmbrellaIcon({ size = 30, color = '#000' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3v18" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 21h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M3.5 11a9 9 0 0 1 17 0c-2-1.2-3.5-1.2-4.25 0-.75-1.2-2.25-1.2-4.25 0-2-1.2-3.5-1.2-4.25 0C7 9.8 5.5 9.8 3.5 11Z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
