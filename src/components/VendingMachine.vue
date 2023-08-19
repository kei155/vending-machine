<script setup lang="ts">
import { computed, ref } from 'vue'
import VendingMachineItem from './VendingMachineItem.vue'
import VendingMachineVirtualMoney from './VendingMachineVirtualMoney.vue'
import { useVendingMachineSafe } from '@/composables/useVendingMachineSafe'
import { useVendingMachineStorage } from '@/composables/useVendingMachineStorage'

const props = defineProps<{
  items: VendingMachineItemForSale[]
  changeMoneyUnits: ChangeMoneyUnit[]
}>()

/** 자판기 단위 에러 처리자 */
const errorHandler = (error: unknown) => {
  if (error instanceof Error) {
    message.value = error.message
  } else {
    message.value = '시스템 오류가 발생했습니다. 관리소에 연락해주세요.'
  }
}

/** 인터페이스 메세지 */
const message = ref('어서오세요 *^^*')

/** 상품 저장공간 사용 */
const { saleItems, release } = useVendingMachineStorage(props.items)

/** 금고 사용 */
const {
  units,
  checkChangeable,
  doChange,
  getChangeCount,
  setChangeCount,
  amount: changeableAmount,
  checkInsertable
} = useVendingMachineSafe(props.changeMoneyUnits)

/**
 * 현금투입구/반환레버/카드단말 섹션
 */
/** 사용자 세션 잔액 */
const balance = ref(0)

/** 사용자 세션 잔액 조회 */
const getBalance = () => balance.value

/** 사용자 세션 잔액 증가 처리 */
const increaseBalance = (amount: number) => {
  balance.value += amount
}

/** 사용자 세션 잔액 차감 처리 */
const decreaseBalance = (amount: number) => {
  balance.value -= amount
}

/** 현금 투입 핸들링 */
const handleCashInserted = (value: number) => {
  /** 카드 프로세스 종료 */
  inCardPayment.value = false

  /** 화폐 유효성 체크 */
  if (!checkInsertable(value)) {
    message.value = `넣을 수 없는 화폐입니다. (${value})`
    return
  }

  /** 사용자 세션 잔액 추가 */
  increaseBalance(value)

  /** 잔돈함 추가 */
  setChangeCount(value, getChangeCount(value) + 1)

  message.value = `🥳 ${value}원을 넣었어요.`
}

/** 사용자 세션 잔액 반환 */
const returnBalance = () => {
  const currentBalance = getBalance()
  if (currentBalance < 1) {
    message.value = `반환할 잔액이 없습니다.`
    return
  }

  /** 잔돈 갱신 */
  doChange(currentBalance)

  /** 사용자 세션 잔액 차감 */
  decreaseBalance(currentBalance)
  message.value = `${currentBalance}원이 반환되었어요.`
}

/** 카드 결제 세션 */
const inCardPayment = ref(false)
const handleCardTouched = () => {
  inCardPayment.value = true
  message.value = `카드로 구매할 상품을 선택해주세요.`
}

/** 현금 결제 프로세스 처리 */
const payByCash = (item: VendingMachineItemForSale) => {
  const currentBalance = getBalance()
  /** 현금결제 잔액부족 */
  if (item.price > currentBalance) {
    throw new Error(`잔액이 부족합니다. 현금을 더 투입하거나 카드로 결제해주세요.`)
  }

  /** 현금결제 거스름돈 불가 */
  const balanceAfterPayment = currentBalance - item.sellPrice
  if (balanceAfterPayment !== 0 && !checkChangeable(balanceAfterPayment)) {
    throw new Error(
      `구매 후 잔액(${balanceAfterPayment})에 대해 잔돈이 부족해 판매가 불가능합니다. 관리소에 연락해주세요.`
    )
  }

  /** 사용자 세션 잔액 차감 */
  decreaseBalance(item.sellPrice)
}

/** 카드 결제 프로세스 처리 */
const payByCard = (item: VendingMachineItemForSale) => {
  /** 카드 승인 */
  try {
    console.log(`[CARD 결제 승인] : ${item.name} - ${item.sellPrice}`)
    // doCardApprove(item)
  } catch (err) {
    console.error(err)
    throw err
  } finally {
    inCardPayment.value = false
  }
}

/** 아이템 선택 핸들링 */
const handleItemClicked = (clickedItem: VendingMachineItemForSale) => {
  /** 재고부족 */
  if (clickedItem.stock < 1) {
    message.value = `${clickedItem.name} 재고가 부족합니다.`
    return
  }

  const isCardPayment = inCardPayment.value === true
  const paymentMethod: PaymentMethod = isCardPayment ? 'card' : 'cash'
  try {
    if (paymentMethod === 'card') {
      payByCard(clickedItem)
    } else if (paymentMethod === 'cash') {
      payByCash(clickedItem)
    } else {
      throw new Error(`Err: Invalid Payment Method`)
    }
  } catch (error) {
    errorHandler(error)
    throw error
  }

  /** 구매이력 기록 */
  logPurchase(clickedItem, paymentMethod)

  /** 상품 배출 */
  release(clickedItem)

  /** 메세지 안내 */
  message.value = `${clickedItem.name} 상품을 구매했어요.`
}

/** 구매이력 */
const purchaseList = ref<VendingMachineItemPurchaseRecord[]>([])

/** 상품 구매 이력 기록 */
const logPurchase = (item: VendingMachineItemForSale, paymentMethod: PaymentMethod) => {
  purchaseList.value = [
    {
      item: { ...item },
      paymentMethod,
      purchaseId: `구매번호-${Math.random()}`
    }
  ].concat(purchaseList.value)
}

/**
 * 관리 영역
 */
/** 총 매출액 */
const salesAmount = computed(() =>
  purchaseList.value.reduce((sum, purchase) => sum + purchase.item.sellPrice, 0)
)

/** 물건 채우기 */
const restock = () => {
  saleItems.value = saleItems.value.map((item) => ({ ...item, stock: 10 }))
  alert('상품을 채워 넣었어요.')
}

/** 잔돈 채우기 */
const fillChangeMoney = () => {
  units.value.forEach((unit) => {
    setChangeCount(unit.value, 10)
  })
  alert('잔돈을 채워 넣었어요.')
}

/** 잔돈 현황 시스템 알럿처리 */
const alertChangeableState = () => {
  alert(`잔돈 현황 \n${units.value.map((unit) => `${unit.value}원: ${unit.count}`).join(`\n`)}`)
}
</script>

<template>
  <div class="root-container">
    <div class="top-container">
      <!-- 자판기 기계 실체화 -->
      <div class="machine">
        <!-- 상품 쇼케이스 -->
        <div class="showcase-container">
          <VendingMachineItem
            v-for="item in saleItems"
            :key="item.name"
            :item="item"
            @click="handleItemClicked(item)"
            class="showcase-item"
          />
        </div>

        <!-- 메세지 인터페이스 -->
        <div class="message-box">{{ message }}</div>

        <!-- 결제모듈 -->
        <div class="payment-container">
          <!-- 결제모듈 - 잔액 -->
          <div class="payment-balance">
            <div>잔액</div>
            <div class="payment-balance-amount">{{ balance }}</div>
          </div>

          <!-- 결제모듈 - 카드단말 -->
          <div class="payment-card" @click="handleCardTouched">
            <div class="payment-card-icon">💳</div>
            <div>CARD</div>
          </div>

          <!-- 결제모듈 - 반환 -->
          <div class="payment-return-balance">
            <button @click="returnBalance">반환</button>
          </div>
        </div>

        <!-- 구매상품 배출구 -->
        <div class="purchased-container">
          <div class="purchased">
            <div v-for="purchase in purchaseList" :key="purchase.purchaseId" class="purchased-item">
              <img :src="purchase.item.image" />
            </div>
          </div>
        </div>
      </div>

      <!-- 관리구간 -->
      <div class="manage">
        <!-- 관리구간 - 현황 -->
        <div class="manage-section manage-state">
          <div class="manage-section-title">관리현황</div>
          <div class="manage-state-item-container">
            <dl class="manage-state-item">
              <dt>매출</dt>
              <dd>{{ salesAmount }}</dd>
            </dl>
            <dl class="manage-state-item">
              <dt>잔돈</dt>
              <dd>
                <div>{{ changeableAmount }}</div>
                <button @click="alertChangeableState">자세히</button>
              </dd>
            </dl>
            <dl class="manage-state-item">
              <dt>설정</dt>
              <dd>
                <button @click="restock">상품 채우기</button>
                <button @click="fillChangeMoney">잔돈 채우기</button>
              </dd>
            </dl>
          </div>
        </div>

        <!-- 관리구간 - 이력 -->
        <div class="manage-section manage-history">
          <div class="manage-section-title">판매이력</div>
          <div>
            <template v-if="purchaseList.length > 0">
              <div
                v-for="purchase in purchaseList"
                :key="purchase.purchaseId"
                class="manage-history-item"
              >
                <small>{{ purchase.purchaseId }}</small>
                <div>
                  {{ purchase.item.name }} - {{ purchase.paymentMethod === 'card' ? '💳' : '💵' }}
                </div>
              </div>
            </template>
            <template v-else>
              <div>판매 이력이 없습니다</div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 가상영역 - 현금투입 -->
    <div class="cash-inserter">
      <div class="title">현금투입</div>
      <VendingMachineVirtualMoney @inserted="handleCashInserted" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.root-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.top-container {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.machine,
.manage {
  border-radius: 6px;
  width: 320px;
  padding: 18px;
  background-color: var(--color-white);
  box-shadow: 0px 0px 5px #999;
}

.showcase-container {
  display: flex;
  gap: 12px;
  .showcase-item {
    padding: 12px;
    flex: 1 1;
  }
}

.message-box {
  margin: 12px 0;
  padding: 12px;
  background-color: var(--color-black);
  color: var(--color-white);
}

.payment-container {
  display: flex;
  text-align: center;
  gap: 12px;

  .payment-balance {
    flex: 1 1;
    border-radius: 6px;
    background-color: var(--color-black);
    color: var(--color-white);
    padding: 8px;

    .payment-balance-amount {
      padding-top: 3px;
      font-size: 1.2em;
    }
  }

  .payment-card {
    border-radius: 6px;
    background-color: var(--color-black);
    color: var(--color-white);
    padding: 8px;
    font-size: 0.8em;

    .payment-card-icon {
      font-size: 2em;
    }
  }

  .payment-return-balance {
    button {
      height: 100%;
      border: none;
      padding: 8px;
      background-color: var(--color-primary);
      color: var(--color-white);
    }
  }
}

.purchased-container {
  margin-top: 12px;
  padding: 12px;
  overflow: scroll;
  border: 1px solid var(--color-gray);
  border-radius: 4px;
  height: 49px;

  .purchased {
    white-space: nowrap;
    .purchased-item {
      display: inline-block;
      margin-right: 6px;
      padding: 6px;
      background-color: var(--color-white);

      img {
        width: 32px;
        aspect-ratio: 1;
        object-fit: contain;
      }
    }
  }
}

.manage {
  max-height: 600px;
  overflow: auto;

  .manage-section {
    .manage-section-title {
      font-size: 1.2em;
      border-bottom: 1px solid var(--color-gray);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    &:not(:first-child) {
      margin-top: 24px;
    }
  }

  .manage-history {
    .manage-history-item {
      padding: 6px 0;
      border-bottom: 1px solid var(--color-gray);
      small {
        opacity: 0.5;
      }
    }
  }

  .manage-state {
    .manage-state-item-container {
      display: flex;
      align-items: start;
      gap: 12px;

      .manage-state-item {
        padding: 8px;
        text-align: center;
        flex: 1;
        &:not(:last-of-type) {
          border-right: 1px solid var(--color-gray);
        }

        dt {
          font-size: 0.9em;
          opacity: 0.5;
        }

        dd {
          padding: 0;
          margin: 0;

          button {
            width: 100%;
            background-color: var(--color-white);
            border: 1px solid var(--color-gray);
          }
        }
      }
    }
  }
}

.cash-inserter {
  padding: 24px;
  border-radius: 6px;
  background-color: var(--color-white);
  margin: 0 auto;
  width: 100vw;
  max-width: 678px;
  box-shadow: 0px 0px 5px #999;

  .title {
    font-size: 1.2em;
    margin-bottom: 12px;
  }
}
</style>
