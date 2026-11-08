// Where `shadcn add` puts the copied files, relative to the user's aliases, and where the Vue
// registry lives under the registry URL. Shared by the registry build and the site, so the
// import path the site shows matches what the CLI writes. No Node APIs: the site bundles it.

/** Name of the registry item with the shared core. */
export const CORE_ITEM = "nudge-icon";
/** Folder of the shared core inside the lib alias: `@/lib/nudge-icons/`. */
export const CORE_DIR = "lib/nudge-icons";
/** Folder of the icons inside the components alias: `@/components/icons/`. */
export const ICONS_DIR = "components/icons";
/** Subfolder of the registry URL with the shadcn-vue items. */
export const VUE_DIR = "vue";
