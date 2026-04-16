/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Cal.com, Calendly, Google Appointments, etc. — opens in a new tab from service pages. */
  readonly VITE_MEETING_SCHEDULE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.jsx" {
  import type { ComponentType } from "react";
  const component: ComponentType;
  export default component;
}
