const taxingStandardRanges = [12000000, 46000000, 88000000, 150000000, 300000000, 500000000, 1000000000]

const incomeDeductionRanges = [5000000, 15000000, 45000000, 100000000]

const f = v => v < 0 ? 0 : v

/**
 * @param {Number} y: 과세표준
 * @returns {Number}: 소득세
 */
const tax = y => {
  // y는 세전연봉이 아닌 '과세표준'임 (deducible로 계산된 공제항목들 및 4대보험이 공제된 금액)
  // 참고: https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2312&cntntsId=7711
  if (y <= taxingStandardRanges[0]) return y * 0.06
  if (y <= taxingStandardRanges[1]) return y * 0.15 - 1080000
  if (y <= taxingStandardRanges[2]) return y * 0.24 - 5220000
  if (y <= taxingStandardRanges[3]) return y * 0.35 - 14900000
  if (y <= taxingStandardRanges[4]) return y * 0.38 - 19400000
  if (y <= taxingStandardRanges[5]) return y * 0.4 - 25400000
  if (y <= taxingStandardRanges[6]) return y * 0.42 - 35400000
  return y * 0.45 - 65400000
}

/**
 * @param {Number} y: 세전연봉
 * @param {Number} numFamily: 부양가족수 (본인포함)
 * @param {Number} nonTax: 비과세
 */
const calculateDeducible = (y, numFamily, nonTax) => {
  return {
    // 소득공제
    income: () => {
      if (y <= incomeDeductionRanges[0]) return y * 0.7
      else if (y <= incomeDeductionRanges[1]) return 3500000 + (y - incomeDeductionRanges[0]) * 0.4
      else if (y <= incomeDeductionRanges[2]) return 7500000 + (y - incomeDeductionRanges[1]) * 0.15
      else if (y <= incomeDeductionRanges[3]) return 12000000 + (y - incomeDeductionRanges[2]) * 0.05
      else return 14750000 + (y - incomeDeductionRanges[3]) * 0.02
    },
    // 소득세액공제
    tax: () => {
      const arr2 = [33000000, 70000000]
      if (y < 740000) return y
      else if (y <= arr2[0]) return 740000
      else if (y <= arr2[1]) return Math.max(660000, 740000 - (y - arr2[0]) * 0.008)
      else return Math.max(500000, 660000 - (y - arr2[1]) * 0.5)
    },
    // 인적공제
    family: () => {
      return y < 1500000 ? y : 1500000 * numFamily
    },
    // 비과세
    nonTax: () => {
      return y < nonTax ? y : nonTax
    },
  }
}

/**
 * 세전연봉, 과세금액, 과세표준은 다 다른 개념이기 때문에 이 부분을 주의깊이 읽어주세요.
 * 
 * 세전연봉: 말그대로 연봉계약서에 기재되는 금액입니다.
 * 과세금액: 세전연봉 - 비과세
 * 과세표준: 과세금액에서 공제항목들을 다 공제하고 난, 소득세 산정의 대상이 되는 금액.
 * 
 * @param {Number} preTax: 세전연봉
 * @param {Number} numFamily: 인적공제
 * @param {Number} nonTax: 비과세
 * @returns {SalaryReport} 이 항목들을 토대로 프론트엔드 구현
 */
const salaryReport = (
  preTax = 22000000,
  numFamily = 1,
  nonTax = 1200000,
) => {
  let pension = f((preTax - nonTax) * 0.045) // 국민연금 (과세금액의 4.5%)

  if (pension > 235800 * 12) pension = 235800 * 12 // 국민연금 상한: 월 235,800원

  const health = f((preTax - nonTax) * 0.03495) // 건강보험 (과세금액의 3.495%)

  const care = f(health * 0.1227) // 장기요양 (건강보험료의 12.27%)

  const hire = f((preTax - nonTax) * 0.008) // 고용보험 (과세금액의 0.8%)

  const deducibleCalculator = calculateDeducible(preTax, numFamily, nonTax)

  const taxDeduction = deducibleCalculator.tax()

  const incomeDeduction = deducibleCalculator.income()

  const familyDeduction = deducibleCalculator.family()

  const nonTaxDeduction = deducibleCalculator.nonTax()

  const taxOn = f(preTax - pension - health - care - hire - incomeDeduction - taxDeduction - familyDeduction - nonTaxDeduction) // 과세표준

  const incomeTax = tax(taxOn) // 소득세

  const incomeTaxLocal = incomeTax * 0.1 // 지방소득세

  const totalTax = pension + health + care + hire + incomeTax + incomeTaxLocal // 총 공제 (공제액 & 세액 합산)

  const afterTax = preTax - totalTax // 세후

  return {
    pension,
    health,
    care,
    hire,
    taxDeduction,
    incomeDeduction,
    familyDeduction,
    nonTaxDeduction,
    taxOn,
    incomeTax,
    incomeTaxLocal,
    totalTax,
    preTax,
    afterTax,
  }
}

export default salaryReport