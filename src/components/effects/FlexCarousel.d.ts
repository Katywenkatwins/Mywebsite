import type { CSSProperties } from "react";

export type FlexCarouselItem = { src: string; alt?: string; title?: string; subtitle?: string };

export type FlexCarouselProps = {
  items?: FlexCarouselItem[];
  preset?: "liquid" | "ribbon" | string;
  intro?: "rise" | "bloom" | "spin" | "deal" | "fade" | "none";
  cardHeight?: number;
  gap?: number;
  radius?: number;
  fit?: "natural" | "portrait" | "square" | "landscape";
  lensWidth?: number;
  lensHeight?: number;
  tilt?: number;
  roundness?: number;
  bend?: number;
  reach?: number;
  curl?: string;
  dispersion?: number;
  liquid?: number;
  followCursor?: boolean;
  squeeze?: number;
  focusOnClick?: boolean;
  autoplay?: boolean;
  interval?: number;
  captions?: boolean;
  captureWheel?: boolean;
  onChange?: (index: number) => void;
  onSelect?: (index: number) => void;
  className?: string;
  style?: CSSProperties;
};

declare const FlexCarousel: (props: FlexCarouselProps) => React.JSX.Element;
export default FlexCarousel;
