type VendingMachineItem = {
  name: string
  image: string
  price: number
}

type VendingMachineItemForSale = VendingMachineItem & {
  sellPrice: number
  stock: number
}

type VendingMachineItemPurchaseRecord = {
  item: VendingMachineItemForSale
  purchaseId: string
  paymentMethod: PaymentMethod
}

type PaymentMethod = 'cash' | 'card'

type ChangeMoneyUnit = {
  value: number
  count: number
}

type VendingMachineInitialize = {
  id: string
  changeBox: ChangeBox
  items: VendingMachineItem[]
}

type ChangeBox = {
  units: ChangeMoneyUnit[]
}

type VendingMachineModel = {
  id: string
  items: VendingMachineItem[]
  purchases: VendingMachineItemPurchaseRecord[]
}
