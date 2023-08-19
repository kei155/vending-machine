import { computed, onMounted, ref } from 'vue'

/** 자판기 금고 composable */
export const useVendingMachineSafe = (init: ChangeMoneyUnit[]) => {
  /** 거스름 화폐 단위값 나열 */
  const unitValues = [100, 500, 1000, 5000, 10000]

  const units = ref<ChangeMoneyUnit[]>([])
  const changeableFlatUnits = computed(() =>
    units.value
      .sort((a, b) => b.value - a.value)
      .flatMap((unit) => Array.from(new Array(unit.count)).map((_) => unit.value))
  )

  /** 잔돈 총액 */
  const amount = computed(() => units.value.reduce((sum, unit) => sum + unit.value * unit.count, 0))

  onMounted(() => {
    units.value = unitValues.map((unitValue) => {
      return {
        value: unitValue,
        count: init.find((initUnit) => initUnit.value === unitValue)?.count ?? 0
      }
    })
  })

  /** 단위에 해당하는 잔돈 정보 조회 */
  const getChangeCount = (value: number): number => {
    const targetUnit = units.value.find((unit) => unit.value === value)
    if (!targetUnit) {
      throw new Error('Err: Invalid Unit')
    }

    return targetUnit.count
  }

  /** 단위에 해당하는 잔돈 처리 */
  const setChangeCount = (value: number, count: number) => {
    if (!units.value.some((unit) => unit.value === value)) {
      throw new Error('Err: Invalid Unit')
    }

    units.value = units.value.map((unit) => {
      if (unit.value === value) {
        unit.count = count
      }

      return unit
    })
  }

  /** 주어진 금액에 대한 잔돈처리가 가능한지 체크 */
  const checkChangeable = (value: number) => {
    let tempValue = value

    for (let index = 0; index < changeableFlatUnits.value.length; index++) {
      const unitValue = changeableFlatUnits.value[index]
      if (unitValue > tempValue) {
        continue
      }

      tempValue -= unitValue
      if (tempValue < 0) {
        /** 음수로 감 -> 잔돈처리 불가 */
        return false
      }

      if (tempValue === 0) {
        /** 딱 떨어지는 경우 -> 잔돈처리 가능 */
        return true
      }
    }

    /** 보유 잔돈 순회 후 당도 -> 잔돈처리 모자람 */
    return false
  }

  /** 잔돈금고 갱신, 반환되는 화폐 목록 반환 */
  const doChange = (value: number) => {
    if (!checkChangeable(value)) {
      throw new Error('Err: Impossible Change')
    }

    const changeableUnits = [...changeableFlatUnits.value]
    const changeUnitValues: number[] = []
    let tempValue = value
    for (let index = 0; index < changeableUnits.length; index++) {
      const unitValue = changeableUnits[index]
      if (unitValue > tempValue) {
        continue
      }
      tempValue -= unitValue
      units.value = units.value.map((unit) => {
        if (unit.value === unitValue) {
          unit.count -= 1
          changeUnitValues.push(unitValue)
        }

        return unit
      })

      if (tempValue === 0) {
        break
      }
    }

    /** 잔돈 배출처리 */
    console.groupCollapsed(`잔액 [${value}원] 배출------------------------------`)
    changeUnitValues.forEach((value, i) => console.log(`[${value}원] 반환. ${i + 1}번째 화폐`))
    console.groupEnd()

    return changeUnitValues
  }

  const checkInsertable = (value: number) => unitValues.indexOf(value) !== -1

  return {
    units,
    amount,
    checkChangeable,
    doChange,
    getChangeCount,
    setChangeCount,
    checkInsertable
  }
}
