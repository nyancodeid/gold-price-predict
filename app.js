import Alpine from "./vendors/alpinejs.js";

window.Alpine = Alpine;

function forecast(series, alpha = 0.9) {
  const result = [{ ...series[0], forecast: parseInt(series[0].price), mape: 0 }];
  let finalForecast = 0;
  
  for (let i = 1; i <= series.length; i++) {
    const forecast = result[i - 1].forecast + alpha * (result[i - 1].price - result[i - 1].forecast);
    const mape = i < series.length ? (Math.abs(series[i].price - forecast) / series[i].price) * 100 : 0;
    
    if (!series[i]) {
      finalForecast = forecast;
      break;
    }
    
    result.push({ ...series[i], forecast, mape });
  }
  
  const finalMape = result.reduce((acc, curr) => acc + curr.mape, 0) / result.length;

  return { forecast: finalForecast, mape: finalMape, result };
}

Alpine.data("formForecastController", () => ({
  type: "days",
  types: [
    { id: "days", label: "Hari ke-", title: "Harian" },
    { id: "weeks", label: "Minggu ke-", title: "Mingguan" },
    { id: "months", label: "Bulan ke-", title: "Bulanan" },
  ],
  alpha: 0.9,
  alphaResults: [],
  alphaBest: 0.9,
  data: [0, 0],
  dataBatch: "",
  results: { forecast: 0, result: [] },
  onReset() {
    this.data = [];
    this.dataBatch = "";
    this.type = "days";
    this.alphaResults = [];
    this.alphaBest = 0.9;
    this.results = { forecast: 0, result: [] };
  },
  newItem() {
    this.data.push(0);
  },
  useDemo(type) {
    switch (type) {
      case "test":
        // harga emas tahun 2022
        this.data = [
          927000, 978000, 987000, 975000, 987000, 988000, 982000, 957000,
          945000, 939000, 981000, 1026000,
        ];
        break;
      case "large-test":
        // harga emas dari tahun 2018 - 2022
        this.data = [
          650000, 653000, 662000, 668000, 668000, 663000, 654000, 652000,
          663000, 678000, 659000, 676000, 680000, 674000, 669000, 670500,
          675000, 714000, 720000, 772000, 770000, 764000, 756000, 771000,
          783000, 815000, 933000, 937000, 914000, 918000, 1016000, 1030000,
          1016000, 996000, 942000, 965000, 954000, 917000, 903000, 922000,
          965000, 927000, 948000, 944000, 913000, 925000, 930000, 938000,
          927000, 978000, 987000, 975000, 987000, 988000, 982000, 957000,
          945000, 939000, 981000, 1026000,
        ];
        break;
      default:
        break;
    }

    this.dataBatch = this.data.join(",");
    this.type = "months";
  },
  calculate() {
    if (this.dataBatch == '') {
      return alert('Maaf, silahkan isi data harga emas terlebih dahulu');
    }

    this.data = this.dataBatch.split(",");

    const type = this.types.find((t) => t.id === this.type);
    const series = this.data.map((item, index) => ({
      label: type.label + (index + 1),
      price: item,
    }));

    this.results = forecast(series, this.alpha);
    this.$nextTick(() => {
      this.renderChart();
      this.bestAlpha(series);
    });
  },
  bestAlpha(series) {
    this.alphaResults = [];
    this.alphaBest = 0.9;
    const alphas = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    let bestAlpha = 0;
    let bestMape = 0;

    for (const alpha of alphas) {
      const { mape } = forecast(series, alpha);

      if (mape < bestMape || alpha == 0.1) {
        bestAlpha = alpha;
        bestMape = mape;
      }

      this.alphaResults.push({ alpha, mape });
    }

    this.alphaBest = bestAlpha;
  },
  renderChart() {
    const chart = document.querySelector("#chart");
    if (chart && chart.hasChildNodes()) {
      chart.innerHTML = "";
    }

    const { result, forecast } = this.results;
    const categories = [...result.map((_, index) => index + 1), ""];

    const options = {
      series: [
        {
          name: "Harga Emas",
          data: [
            ...result.map((item) => item.price * 1), 
            null
          ],
        },
        {
          name: "Forecast",
          data: [
            ...result.map((item) => item.forecast.toFixed(0) * 1),
            forecast.toFixed(0) * 1,
          ],
        },
      ],
      chart: {
        height: 180,
        type: "line",
        zoom: {
          enabled: false,
        },
        animations: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: [3, 3],
        curve: "straight",
        dashArray: [0, 8],
      },
      title: {
        text: undefined,
      },
      legend: {
        show: false,
      },
      grid: {
        row: {
          colors: ["#f3f3f3", "transparent"], // takes an array which will be repeated on columns
          opacity: 0.5,
        },
      },
      xaxis: {
        categories: categories,
      },
    };

    const chartRender = new ApexCharts(
      document.querySelector("#chart"),
      options
    );
    chartRender.render();
  },
  toRupiah(angka, prefix) {
    if (angka < 1000) return toFixed(angka, 2); 

    let number_string = String(toFixed(angka, 0))
      .replace(/[^,\d]/g, "")
      .toString();
    let split = number_string.split(",");
    let sisa = split[0].length % 3;
    let rupiah = split[0].substr(0, sisa);
    let ribuan = split[0].substr(sisa).match(/\d{3}/gi);

    // tambahkan titik jika yang di input sudah menjadi angka ribuan
    if (ribuan) {
      let separator = sisa ? "." : "";
      rupiah += separator + ribuan.join(".");
    }

    rupiah = split[1] != undefined ? rupiah + "," + split[1] : rupiah;
    return prefix == undefined ? rupiah : rupiah ? "Rp. " + rupiah : "";
  },
}));

Alpine.start();
