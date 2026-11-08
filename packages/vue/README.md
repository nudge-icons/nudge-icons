# @nudge-icons/vue

Animated line icons for Vue. Each icon has its own small motion, made with CSS only, and stops under `prefers-reduced-motion`. Same props as lucide-vue-next. Works with server rendering and Nuxt.

```sh
pnpm add @nudge-icons/vue
```

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Bell, Menu } from "@nudge-icons/vue";
const open = ref(false);
</script>

<template>
  <button><Bell :size="16" /> Notifications</button>
  <button :aria-expanded="open" aria-label="Menu" @click="open = !open">
    <Menu :active="open" />
  </button>
</template>
```

- `animate`: `"hover"` (default; also when the parent button or link is hovered or focused), `"loop"`, `"once"`, a number of runs, or `false`.
- `active`: the second drawing, on icons that have one (`Menu` folds into a cross).
- `size`, `color`, `stroke-width`, `absolute-stroke-width`, `title`, `class`.
- Still icons without the motion CSS: `@nudge-icons/vue/static`.

Requires Vue 3.3 or later. Tree-shakeable: only the icons you import end up in your bundle.

[Docs](https://dimon85.github.io/nudge-icons/docs/getting-started) · [All icons](https://dimon85.github.io/nudge-icons/) · [GitHub](https://github.com/dimon85/nudge-icons) · MIT License
