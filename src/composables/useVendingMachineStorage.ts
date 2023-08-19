import { onMounted, ref } from 'vue'

/** 자판기 상품저장소 composable */
export const useVendingMachineStorage = (init: VendingMachineItemForSale[]) => {
  const saleItems = ref<VendingMachineItemForSale[]>([])

  onMounted(() => {
    saleItems.value = [...init.map((item) => ({ ...item }))]
  })

  /** 상품 배출 */
  const release = (targetItem: VendingMachineItemForSale) => {
    saleItems.value = saleItems.value.map((item) => {
      if (item.name === targetItem.name) {
        item.stock -= 1
      }

      return { ...item }
    })
  }

  return {
    saleItems,
    release
  }
}
