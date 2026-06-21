/* ==================================
   BAKECOST DASHBOARD + PROFIT CHART + ANALYTICS FIX
================================== */

console.log("DASHBOARD JS RUNNING");

/* ==========================
   SAFE TEXT
========================== */

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

/* ==========================
   USER
========================== */

async function getUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

/* ==========================
   CHART
========================== */

let profitChart = null;

/* ==========================
   LOAD DASHBOARD
========================== */

async function loadDashboard() {

    const user = await getUser();
    if (!user) return;

    const [
        { data: ingredients },
        { data: packaging },
        { data: recipes },
        { data: products }
    ] = await Promise.all([
        supabaseClient.from("ingredients").select("*").eq("user_id", user.id),
        supabaseClient.from("packaging").select("*").eq("user_id", user.id),
        supabaseClient.from("recipes").select("*").eq("user_id", user.id),
        supabaseClient.from("products").select("*").eq("user_id", user.id),
    ]);

    const ing = ingredients || [];
    const pack = packaging || [];
    const rec = recipes || [];
    const prod = products || [];

    /* ==========================
       COUNTS (RESTORED)
    ========================== */

    setText("ingredientCount", ing.length);
    setText("packagingCount", pack.length);
    setText("recipeCount", rec.length);

    /* ==========================
       ANALYTICS (RESTORED)
    ========================== */

    let totalProfit = 0;
    let totalCost = 0;
    let totalRevenue = 0;

    prod.forEach(p => {
        totalProfit += Number(p.profit || 0);
        totalCost += Number(p.total_cost || 0);
        totalRevenue += Number(p.revenue || 0);
    });

    const avgProfit = prod.length ? totalProfit / prod.length : 0;

    setText("averageProfit", `₱${avgProfit.toFixed(2)}`);
    setText("totalRecipeCost", `₱${totalCost.toFixed(2)}`);
    setText("totalSellingValue", `₱${totalRevenue.toFixed(2)}`);
    setText("totalPotentialProfit", `₱${totalProfit.toFixed(2)}`);

    /* ==========================
       LOW STOCK (UNCHANGED)
    ========================== */

    const lowStockList = document.getElementById("lowStockList");

    if (lowStockList) {
        lowStockList.innerHTML = "";

        const low = ing.filter(i => Number(i.stock || 0) <= 100);

        if (!low.length) {
            lowStockList.innerHTML = "<li>✨ No low-stock ingredients.</li>";
        } else {
            low.forEach(i => {
                const li = document.createElement("li");
                li.textContent = `⚠ ${i.name} (${i.stock})`;
                lowStockList.appendChild(li);
            });
        }
    }

    /* ==========================
       RECENT RECIPES (UNCHANGED)
    ========================== */

    const recent = document.getElementById("recentRecipes");

    if (recent) {
        recent.innerHTML = "";

        const latest = [...rec]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        if (!latest.length) {
            recent.innerHTML = "<div class='empty-state'>🍪 <p>No recipes yet.</p></div>";
        } else {
            latest.forEach(r => {
                const div = document.createElement("div");
                div.className = "recipe-item";
                div.innerHTML = `<strong>${r.name}</strong><br>${r.category || ""}`;
                recent.appendChild(div);
            });
        }
    }

    /* ==========================
       CHART (UPDATED DATA)
    ========================== */

    renderProfitChart(prod);
}

/* ==========================
   PROFIT CHART
========================== */

function renderProfitChart(products) {

    const ctx = document.getElementById("profitChart");
    if (!ctx) return;

    const labels = products.map(p => p.name);
    const profits = products.map(p => Number(p.profit || 0));

    if (profitChart) {
        profitChart.destroy();
    }

    profitChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Profit (₱)",
                data: profits,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

/* ==========================
   REALTIME (OPTIONAL)
========================== */

async function enableRealtime() {

    const user = await getUser();
    if (!user) return;

    supabaseClient
        .channel("products-channel")
        .on("postgres_changes", {
            event: "*",
            schema: "public",
            table: "products",
            filter: `user_id=eq.${user.id}`
        }, () => {
            loadDashboard();
        })
        .subscribe();
}

/* ==========================
   INIT
========================== */

(async function init() {
    await loadDashboard();
    await enableRealtime();
})();