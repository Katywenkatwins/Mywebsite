import type { CSSProperties } from "react";

export type LanyardProps = {
  frontImage?: string;
  backImage?: string;
  imageFit?: "cover" | "contain";
  cardColor?: string;
  orientation?: "portrait" | "landscape";
  finish?: "glossy" | "matte" | "holographic" | "metallic";
  cornerRadius?: number;
  size?: number;
  anchor?: "left" | "center" | "right";
  strapLength?: number;
  strapImage?: string;
  strapColor?: string;
  strapWidth?: number;
  metal?: "silver" | "gold" | "graphite";
  gravity?: number;
  damping?: number;
  elasticity?: number;
  breeze?: number;
  interactive?: boolean;
  intro?: boolean;
  className?: string;
  style?: CSSProperties;
};

declare const Lanyard: (props: LanyardProps) => React.JSX.Element;
export default Lanyard;
