/* ==================================
   BAKECOST PROFIT CHARTS
================================== */

async function loadCharts() {

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data: products } = await supabaseClient
        .from("products")
        .select("*")
        .eq("user_id", user.id);

    const prod = products || [];

    /* ==========================
       1. PROFIT BY PRODUCT (BAR)
    ========================== */

    const profitChart = document.getElementById("profitChart");

    if (profitChart) {
        profitChart.innerHTML = "";

        const chartData = {
            chartType: "bar",
            meta: {
                title: "Profit per Product",
                description: "Shows which baked goods generate the most profit"
            },
            xKey: "name",
            series: [
                {
                    dataKey: "profit",
                    label: "Profit",
                    valueFormat: "compact",
                    valuePrefix: "₱"
                }
            ],
            data: prod.map(p => ({
                name: p.name,
                profit: Number(p.profit || 0)
            }))
        };

        profitChart.innerHTML = `
            <div style="margin-top:20px;">
                ${window.renderChart?.(chartData) || ""}
            </div>
        `;
    }

    /* ==========================
       2. COST BREAKDOWN (PIE)
    ========================== */

    const costChart = document.getElementById("costChart");

    if (costChart && prod.length) {

        const totalIngredient = prod.reduce((a, b) => a + Number(b.ingredient_cost || 0), 0);
        const totalPackaging = prod.reduce((a, b) => a + Number(b.packaging_cost || 0), 0);
        const totalExtra = prod.reduce((a, b) => a + Number(b.extra_cost || 0), 0);

        const chartData = {
            chartType: "pie",
            meta: {
                title: "Cost Breakdown",
                description: "Where your production money goes"
            },
            nameKey: "type",
            valueKey: "value",
            series: [
                {
                    dataKey: "value",
                    label: "Cost",
                    valuePrefix: "₱"
                }
            ],
            data: [
                { type: "Ingredients", value: totalIngredient },
                { type: "Packaging", value: totalPackaging },
                { type: "Extras", value: totalExtra }
            ]
        };

        costChart.innerHTML = `
            <div style="margin-top:20px;">
                ${window.renderChart?.(chartData) || ""}
            </div>
        `;
    }

    /* ==========================
       3. REVENUE VS PROFIT (LINE)
    ========================== */

    const revenueChart = document.getElementById("revenueChart");

    if (revenueChart) {

        const chartData = {
            chartType: "line",
            meta: {
                title: "Revenue vs Profit",
                description: "Performance of your bakery products"
            },
            xKey: "name",
            series: [
                {
                    dataKey: "revenue",
                    label: "Revenue",
                    valuePrefix: "₱",
                    valueFormat: "compact"
                },
                {
                    dataKey: "profit",
                    label: "Profit",
                    valuePrefix: "₱",
                    valueFormat: "compact"
                }
            ],
            data: prod.map(p => ({
                name: p.name,
                revenue: Number(p.revenue || 0),
                profit: Number(p.profit || 0)
            }))
        };

        revenueChart.innerHTML = `
            <div style="margin-top:20px;">
                ${window.renderChart?.(chartData) || ""}
            </div>
        `;
    }
}

loadCharts();