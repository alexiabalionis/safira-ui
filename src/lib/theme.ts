import { createTheme, type MantineColorsTuple } from "@mantine/core";

const safiraGreen: MantineColorsTuple = [
  "#e6faf3",
  "#c7f0e2",
  "#9ee4cc",
  "#73d8b5",
  "#46cb9d",
  "#23bf89",
  "#01b075",
  "#019867",
  "#017f57",
  "#016947",
];

export const safiraTheme = createTheme({
  primaryColor: "safira",
  primaryShade: 6,
  colors: {
    safira: safiraGreen,
  },
  defaultRadius: 12,
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  headings: {
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },
  components: {
    Paper: {
      defaultProps: {
        radius: 12,
        shadow: "xs",
      },
      styles: {
        root: {
          backgroundColor: "#FFFFFF",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
        },
      },
    },
    Button: {
      styles: {
        root: {
          fontWeight: 600,
        },
      },
      defaultProps: {
        color: "safira",
      },
    },
  },
});
