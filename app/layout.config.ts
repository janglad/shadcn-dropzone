import { type BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configuration
 *
 * you cna configure layouts individually from:
 * Home Layout:
 */
export const baseOptions: BaseLayoutProps = {
  nav: {
    title: "SafeFn",
  },
  links: [
    {
      url: "/docs",
      text: "Docs",
    },
  ],
  githubUrl: "https://github.com/janglad/safe-fn",
};
