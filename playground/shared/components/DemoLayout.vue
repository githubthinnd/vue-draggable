<!-- Demo area on the left, live data on the right (stacked on narrow screens). -->
<template>
  <div class="demo-layout">
    <div class="demo-layout__main"><slot /></div>
    <div class="demo-layout__side"><slot name="side" /></div>
  </div>
</template>

<style>
.demo-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 20px;
  align-items: start;
}
.demo-layout__side {
  position: sticky;
  top: 80px;
}
.demo-layout__side .state-panel {
  max-height: 520px;
}
@media (max-width: 1100px) {
  .demo-layout {
    grid-template-columns: 1fr;
  }
  .demo-layout__side {
    position: static;
  }
}
</style>
