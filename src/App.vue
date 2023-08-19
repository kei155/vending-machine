<script setup lang="ts">
import VendingMachine from '@/components/VendingMachine.vue'
import imageCoffee from '@/assets/images/coffee.png'
import imageCola from '@/assets/images/cola.png'
import imageWater from '@/assets/images/water.png'

const items: VendingMachineItemForSale[] = [
  { name: '콜라', image: imageCola, price: 1100, sellPrice: 1100, stock: 10 },
  { name: '물', image: imageWater, price: 600, sellPrice: 600, stock: 10 },
  { name: '커피', image: imageCoffee, price: 700, sellPrice: 700, stock: 10 }
]

const changeMoneyUnits: ChangeMoneyUnit[] = [
  {
    value: 100,
    count: 10
  },
  {
    value: 500,
    count: 10
  },
  {
    value: 1000,
    count: 10
  },
  {
    value: 5000,
    count: 10
  },
  {
    value: 10000,
    count: 10
  }
]
</script>

<template>
  <main>
    <VendingMachine :items="items" :changeMoneyUnits="changeMoneyUnits" />
  </main>

  <footer></footer>
</template>
