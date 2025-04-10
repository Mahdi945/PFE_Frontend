export interface ChartArea {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface TRBL {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TRBLCorners {
  topLeft: number;
  topRight: number;
  bottomLeft: number;
  bottomRight: number;
}

export type CornerRadius = number | Partial<TRBLCorners>;

export interface RoundedRect {
  x: number;
  y: number;
  w: number;
  h: number;
  radius?: CornerRadius
}

export type Padding = Partial<TRBL> | number | Point;

export interface SplinePoint {
  x: number;
  y: number;
  skip?: boolean;

  // Both Bezier and monotone interpolations have these fields
  // but they are added in different spots
  cp1x?: number;
  cp1y?: number;
  cp2x?: number;
  cp2y?: number;
}
