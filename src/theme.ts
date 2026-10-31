import { Platform } from "react-native";

/**
 * Central design tokens for the whole app — CrashCare design language.
 * Palette & shapes ported from the web prototype (navy + red, soft cards,
 * tinted pastels, hairline borders).
 *
 * Fonts: the reference uses "Manrope" for headings and "DM Sans" for body.
 * Without loading custom fonts we approximate them with the system font
 * plus tight negative letter-spacing on headings.
 */

export const colors = {
  // Base
  background: "#F2F5F7",
  backgroundSoft: "#F7F9FA",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFBFB",

  // Brand / actions
  primary: "#D8343F", // red — emergency actions & brand accent
  primaryDark: "#C62D37",
  primarySoft: "#FFF0F1",
  primaryBorder: "#F5D1D4",

  navy: "#162C45", // dark hero cards, headings
  navySoft: "#EDF2F4",
  navyBorder: "#E1E7EA",

  info: "#247DA8", // blue — informational accents
  infoDark: "#1C6587",
  infoSoft: "#E7F2F6",

  success: "#2A9A72",
  successDark: "#278268",
  successSoft: "#E9F5EF",

  warning: "#C28636",
  warningDark: "#A56628",
  warningSoft: "#FCF0DF",

  // Pastels for quick actions / detail rows
  rose: "#9C3138",
  roseSoft: "#F8E9EA",
  brown: "#855B48",
  brownSoft: "#F2ECE9",
  blueAccent: "#276E8D",
  blueAccentSoft: "#E8F2F6",
  greenAccent: "#28765F",
  greenAccentSoft: "#E9F4F0",

  // Text
  text: "#17283D",
  textMuted: "#718096",
  textFaint: "#8896A5",
  textOnColor: "#FFFFFF",

  // Lines
  border: "#E3E9ED",
  borderSoft: "#EAEEF1",
  divider: "#EDF0F2",

  // Dark backgrounds (overlays)
  overlay: "rgba(8, 20, 34, 0.85)",
};

export const spacing = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  xs: 8,
  s: 11,
  m: 16,
  l: 20,
  xl: 26,
  full: 999,
} as const;

export const font = {
  titleXl: 28,
  titleLg: 25,
  titleMd: 20,
  title: 17,
  body: 15,
  small: 13,
  micro: 11,
} as const;

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

/** Consistent soft card shadow across iOS + Android. */
export function shadow(level: 0 | 1 | 2 | 3 = 2) {
  const presets = {
    0: { shadowOpacity: 0, elevation: 0 },
    1: { shadowColor: "#17314C", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 1 },
    2: { shadowColor: "#17314C", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
    3: { shadowColor: "#17314C", shadowOffset: { width: 0, height: 9 }, shadowOpacity: 0.14, shadowRadius: 20, elevation: 7 },
  } as const;
  return presets[level];
}

export const card = {
  backgroundColor: colors.surface,
  borderRadius: radius.l,
  padding: spacing.l,
  ...shadow(2),
} as const;

/** React Navigation theme so headers/tabs match our palette. */
export const navTheme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
  fonts: {
    heavy: { fontFamily: undefined as unknown as string, fontWeight: "700" as const },
    regular: { fontFamily: undefined as unknown as string, fontWeight: "400" as const },
    medium: { fontFamily: undefined as unknown as string, fontWeight: "500" as const },
    bold: { fontFamily: undefined as unknown as string, fontWeight: "700" as const },
  },
};

export { Platform };
