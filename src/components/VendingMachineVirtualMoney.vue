<script setup lang="ts">
const moneyUnitList = [
  {
    value: 50,
    isCoin: true
  },
  {
    value: 100,
    isCoin: true
  },
  {
    value: 500,
    isCoin: true
  },
  {
    value: 1000,
    isCoin: false
  },
  {
    value: 5000,
    isCoin: false
  },
  {
    value: 10000,
    isCoin: false
  },
  {
    value: 50000,
    isCoin: false
  }
]

defineEmits<{
  (e: 'inserted', value: number): void
}>()
</script>

<template>
  <div class="box">
    <div
      v-for="moneyUnit in moneyUnitList"
      :key="moneyUnit.value"
      :class="['item', moneyUnit.isCoin ? 'coin' : 'paper']"
      @click="$emit('inserted', moneyUnit.value)"
    >
      {{ moneyUnit.value }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.box {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;

  .item {
    background-color: var(--color-gray);
    padding: 8px;
    height: 24px;
    text-align: center;
    line-height: 24px;
    font-size: 0.9em;

    &.coin {
      border-radius: 9999px;
      width: 24px;
    }

    &.paper {
      min-width: 48px;
    }
  }
}
</style>
