<script setup lang="ts">
const { item } = defineProps<{
  item: VendingMachineItemForSale
}>()

const priceText = `${item.sellPrice.toLocaleString()}원`
</script>

<template>
  <div class="item" :class="{ 'out-of-stock': item.stock < 1 }">
    <template v-if="item.stock < 1"><div class="alert-out-of-stock">매진</div></template>
    <div class="item-image">
      <img :src="item.image" :alt="item.name" />
    </div>
    <div class="item-name">{{ item.name }}<br />{{ priceText }}</div>
  </div>
</template>

<style lang="scss" scoped>
.item {
  font-size: 0.8em;
  background-color: var(--color-white);
  text-align: center;
  position: relative;

  &.out-of-stock {
    cursor: not-allowed;
    opacity: 0.3;
  }

  .alert-out-of-stock {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: red;
    font-weight: bold;
    border: 2px solid red;
    padding: 3px 6px;
  }

  .item-image {
    img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: contain;
    }
  }

  .item-name {
    padding: 4px;
  }
}
</style>
