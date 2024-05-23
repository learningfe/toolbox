const { createApp, defineModel, ref, watchEffect } = Vue

createApp({
  setup() {
    const strings = localStorage.getItem('bert_values')
    const initialValues = strings ? JSON.parse(strings) : {
      startMonth: '2020-02',
      durationMonth: 360,
      principal: 910_000,
      ratePoints: [
        {
          rate: 5.88,
          month: '2020-02',
        },
        {
          rate: 5.73,
          month: '2021-01',
        },
        {
          rate: 5.38,
          month: '2023-01',
        },
        {
          rate: 4.2,
          month: '2023-09',
        },
      ],
      returnPoints: [
        {
          money: 300000,
          month: '2024-05',
          rate: 4.2,
        },
      ],
    }

    // data
    const startMonth = ref(initialValues.startMonth)
    const durationMonth = ref(initialValues.durationMonth)
    const principal = ref(initialValues.principal)
    const ratePoints = ref(initialValues.ratePoints)
    const returnPoints = ref(initialValues.returnPoints)

    // save
    watchEffect(() => {
      localStorage.setItem('bert_values', JSON.stringify({
        startMonth: startMonth.value,
        durationMonth: durationMonth.value,
        principal: principal.value,
        ratePoints: ratePoints.value,
        returnPoints: returnPoints.value,
      }))
    })

    // methods
    function addRatePoint() {
      ratePoints.value.push({
        rate: 4.2,
        month: dayjs().format('YYYY-MM'),
      })
    }

    function removeRatePoint(index) {
      ratePoints.value.splice(index, 1)
    }

    function moveRatePointUp(index) {
      const previousRate = ratePoints.value[index - 1].rate;
      const currentRate = ratePoints.value[index].rate;

      ratePoints.value[index - 1].rate = currentRate;
      ratePoints.value[index].rate = previousRate;
    }

    function moveRatePointDown(index) {
      const nextRate = ratePoints.value[index + 1].rate;
      const currentRate = ratePoints.value[index].rate;

      ratePoints.value[index + 1].rate = currentRate;
      ratePoints.value[index].rate = nextRate;
    }

    function addReturnPoint() {
      returnPoints.value.push({
        money: 0,
        month: dayjs().format('YYYY-MM'),
      })
    }

    function removeReturnPoint(index) {
      returnPoints.value.splice(index, 1)
    }

    function moveReturnPointUp(index) {
      const previousMoney = returnPoints.value[index - 1].money;
      const currentMoney = returnPoints.value[index].money;

      returnPoints.value[index - 1].money = currentMoney;
      returnPoints.value[index].money = previousMoney;
    }

    function moveReturnPointDown(index) {
      const nextMoney = returnPoints.value[index + 1].money;
      const currentMoney = returnPoints.value[index].money;

      returnPoints.value[index + 1].money = currentMoney;
      returnPoints.value[index].money = nextMoney;
    }

    // chart
    const totalContainer = ref(null)
    const unitContainer = ref(null)

    // table
    const tableColumns = ref([])

    // calculate
    watchEffect(() => {
      if (!totalContainer.value) return
      if (!unitContainer.value) return

      const totalChart = echarts.init(totalContainer.value)
      const unitChart = echarts.init(unitContainer.value)

      const data = {
        month: [],
        // 当月利率
        rate: [],
        // 剩余本金
        restPrincipal: [],
        // 总还款金额
        returnMoney: [],
        // 还款利息
        returnRate: [],
        // 表格数据
        table: [],
      }

      let restPrincipal = principal.value

      for (let i = 0; i < durationMonth.value; i++) {
        const principalPerMonth = principal.value / durationMonth.value

        const currentMonth = dayjs(startMonth.value).add(i, 'month')
        const rate = ratePoints.value.toReversed().find(p => !currentMonth.isBefore(dayjs(p.month))).rate
        const currentInterest = restPrincipal * rate / 100 / 12

        const month = currentMonth.format('YYYY-MM')

        // 提前还款
        const returnPoint = returnPoints.value.find(p => p.month === month)

        const returnMoney = currentInterest + principalPerMonth
        restPrincipal = Math.max(restPrincipal - principalPerMonth - (returnPoint ? returnPoint.money : 0), 0)

        data.month.push(month);
        data.rate.push(rate);
        data.restPrincipal.push(restPrincipal);
        data.returnMoney.push(returnMoney);
        data.returnRate.push(currentInterest);

        data.table.push([
          i + 1,
          month,
          Math.round(returnMoney),
          Math.round(principalPerMonth),
          Math.round(currentInterest),
          rate.toFixed(2) + '%',
          Math.round(restPrincipal),
        ]);

        // console.log('第%s期: %s, 还款%d元, 本金%d元, 利息%d元(%s), 剩余本金:%d', i + 1, month, returnMoney, principalPerMonth, currentInterest, rate.toFixed(2) + '%', restPrincipal)

        if (restPrincipal <= 0) break
      }

      unitChart.setOption({
        grid: {
        },
        tooltip: {
          show: true,
          trigger: 'axis',
          axisPointer: {
            axis: 'x'
          },
        },
        xAxis: {
          type: 'category',
          data: data.month,
        },
        yAxis: [
          {
            type: 'value'
          },
          {
            type: 'value',
          },
        ],
        series: [
          {
            type: 'line',
            endLabel: { show: true, formatter: '{a}', color: 'inherit', align: 'center', offset: [0, -20] },
            name: '当月利率',
            yAxisIndex: 1,
            data: data.rate,
          },
          {
            type: 'line',
            endLabel: { show: true, formatter: '{a}', color: 'inherit', align: 'center', offset: [0, -20] },
            name: '当月还款',
            yAxisIndex: 0,
            data: data.returnMoney
              .map(value => Math.round(value)),
          },
          {
            type: 'line',
            endLabel: { show: true, formatter: '{a}', color: 'inherit', align: 'center', offset: [0, -20] },
            name: '当月利息',
            yAxisIndex: 0,
            data: data.returnRate
              .map(value => Math.round(value)),
          },
          {
            type: 'line',
            endLabel: { show: true, formatter: '{a}', color: 'inherit', align: 'center', offset: [0, -20] },
            markLine: {
              data: returnPoints.value.map(p => ({
                name: `提前还款${p.money}元`,
                xAxis: p.month,
              })),
            },
          },
        ],
      });

      totalChart.setOption({
        grid: {
        },
        tooltip: {
          show: true,
          trigger: 'axis',
          axisPointer: {
            axis: 'x'
          },
        },
        xAxis: {
          type: 'category',
          data: data.month,
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            type: 'line',
            endLabel: { show: true, formatter: '{a}', color: 'inherit', align: 'center', offset: [0, -20] },
            name: '剩余本金',
            data: data.restPrincipal
              .map(value => Math.round(value)),
          },
          {
            type: 'line',
            endLabel: { show: true, formatter: '{a}', color: 'inherit', align: 'center', offset: [0, -20] },
            name: '累计还款金额',
            data: data.returnMoney
              .map((_, index, array) => array.slice(0, index + 1).reduce((a, b) => a + b, 0))
              .map(value => Math.round(value)),
          },
          {
            type: 'line',
            endLabel: { show: true, formatter: '{a}', color: 'inherit', align: 'center', offset: [0, -20] },
            name: '累计利息',
            data: data.returnRate
              .map((_, index, array) => array.slice(0, index + 1).reduce((a, b) => a + b, 0))
              .map(value => Math.round(value)),
          },
          {
            type: 'line',
            endLabel: { show: true, formatter: '{a}', color: 'inherit', align: 'center', offset: [0, -20] },
            markLine: {
              data: returnPoints.value.map(p => ({
                name: `提前还款${p.money}元`,
                xAxis: p.month,
              })),
            },
          },
        ],
      });

      tableColumns.value = data.table
    })

    return {
      startMonth,
      durationMonth,
      principal,
      ratePoints,
      addRatePoint,
      removeRatePoint,
      moveRatePointUp,
      moveRatePointDown,
      returnPoints,
      addReturnPoint,
      removeReturnPoint,
      moveReturnPointUp,
      moveReturnPointDown,
      // chart
      totalContainer,
      unitContainer,
      tableColumns,
    }
  }
}).mount('#app')