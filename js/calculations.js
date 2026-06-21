/* ==================================
   BAKECOST PRICING CALCULATOR (SUPABASE FIXED)
================================== */

let recipes = [];
let selectedRecipe = null;

/* ELEMENTS */
const recipeSelect = document.getElementById("recipeSelect");
const customMarkup = document.getElementById("customMarkup");
const suggestedPrice = document.getElementById("suggestedPrice");
const sellingPriceInput = document.getElementById("sellingPrice");
const expectedOrdersInput = document.getElementById("expectedOrders");
const savePricingBtn = document.getElementById("savePricingBtn");

/* HELPERS */
function peso(v) {
    return `₱${Number(v || 0).toFixed(2)}`;
}

/* TOTAL COST (SAFE) */
function getTotalCost(recipe) {
    return (
        Number(recipe.ingredient_cost || 0) +
        Number(recipe.packaging_cost || 0) +
        Number(recipe.extra_cost || 0)
    );
}

/* LOAD RECIPES FROM SUPABASE */
async function loadRecipes() {

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const { data, error } = await supabaseClient
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    recipes = data || [];

    recipeSelect.innerHTML = `<option value="">Choose a saved recipe</option>`;

    recipes.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.textContent = r.name;
        recipeSelect.appendChild(opt);
    });
}

/* DISPLAY RECIPE */
function displayRecipe(recipe) {

    selectedRecipe = recipe;

    const totalCost = getTotalCost(recipe);
    const yieldQty = Number(recipe.yield_qty || 1);

    const costPerUnit = totalCost / yieldQty;

    document.getElementById("recipeCost").textContent = peso(totalCost);
    document.getElementById("recipeYield").textContent =
        `${yieldQty} ${recipe.yield_unit || ""}`;
    document.getElementById("costPerUnit").textContent = peso(costPerUnit);

    document.getElementById("markup30").textContent = peso(totalCost * 1.3);
    document.getElementById("markup50").textContent = peso(totalCost * 1.5);
    document.getElementById("markup100").textContent = peso(totalCost * 2);

    updateCalculations();
}

/* SELECT EVENT */
recipeSelect?.addEventListener("change", () => {
    const r = recipes.find(x => String(x.id) === recipeSelect.value);
    if (r) displayRecipe(r);
});

/* CALCULATIONS */
function updateCalculations() {

    if (!selectedRecipe) return;

    const totalCost = getTotalCost(selectedRecipe);
    const yieldQty = Number(selectedRecipe.yield_qty || 1);

    const sellingPricePerUnit = Number(sellingPriceInput.value || 0);
    const orders = Number(expectedOrdersInput.value || 1);

    const revenue = sellingPricePerUnit * yieldQty;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    document.getElementById("profitAmount").textContent = peso(profit);
    document.getElementById("profitMargin").textContent = `${margin.toFixed(2)}%`;
    document.getElementById("revenueAmount").textContent = peso(revenue);
    document.getElementById("projectedProfit").textContent = peso(profit * orders);
}

/* EVENTS */
sellingPriceInput?.addEventListener("input", updateCalculations);
expectedOrdersInput?.addEventListener("input", updateCalculations);

customMarkup?.addEventListener("input", () => {

    if (!selectedRecipe) return;

    const totalCost = getTotalCost(selectedRecipe);
    const markup = Number(customMarkup.value || 0);

    suggestedPrice.value = (totalCost * (1 + markup / 100)).toFixed(2);
});

savePricingBtn?.addEventListener("click", async () => {

    if (!selectedRecipe) return alert("Select recipe");

    const sellingPricePerUnit = Number(sellingPriceInput.value);
    if (!sellingPricePerUnit) return alert("Invalid price");

    const totalCost = getTotalCost(selectedRecipe);
    const yieldQty = Number(selectedRecipe.yield_qty || 1);

    const revenue = sellingPricePerUnit * yieldQty;
    const profit = revenue - totalCost;

    const user = await supabaseClient.auth.getUser();

    if (!user.data.user) {
        return alert("Not logged in");
    }

    const product = {
        user_id: user.data.user.id,   // 🔥 FIXED (IMPORTANT)
        recipe_id: selectedRecipe.id,

        name: selectedRecipe.name,
        category: selectedRecipe.category,

        yield_qty: yieldQty,
        yield_unit: selectedRecipe.yield_unit,

        ingredients: selectedRecipe.ingredients || [],
        packaging: selectedRecipe.packaging || [],

        ingredient_cost: selectedRecipe.ingredient_cost || 0,
        packaging_cost: selectedRecipe.packaging_cost || 0,
        extra_cost: selectedRecipe.extra_cost || 0,

        labor_cost: selectedRecipe.labor_cost || 0,
        electricity_cost: selectedRecipe.electricity_cost || 0,
        gas_cost: selectedRecipe.gas_cost || 0,
        misc_cost: selectedRecipe.misc_cost || 0,

        total_cost: totalCost,

        selling_price_per_unit: sellingPricePerUnit,
        revenue,
        profit,
        margin: revenue ? (profit / revenue) * 100 : 0,

        created_at: new Date().toISOString()
    };

    const { error } = await supabaseClient
        .from("products")
        .insert([product]);

    if (error) {
        console.error(error);
        return alert("Failed to save product");
    }

    alert("Saved successfully!");
});

/* INIT */
loadRecipes();