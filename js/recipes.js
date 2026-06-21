/* ==================================
   BAKECOST RECIPE BUILDER (SUPABASE FINAL)
================================== */

console.log("RECIPES JS RUNNING");

/* ==========================
   STATE (NO LOCALSTORAGE)
========================== */

let ingredients = [];
let packaging = [];
let recipes = [];

/* ==========================
   SUPABASE LOADERS
========================== */

async function loadIngredients() {

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const { data } = await supabaseClient
        .from("ingredients")
        .select("*")
        .eq("user_id", user.id);

    ingredients = data || [];
}

async function loadPackaging() {

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const { data } = await supabaseClient
        .from("packaging")
        .select("*")
        .eq("user_id", user.id);

    packaging = data || [];
}

async function loadRecipes() {

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const { data } = await supabaseClient
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    recipes = data || [];
}

/* ==========================
   ELEMENTS
========================== */

const ingredientsContainer =
document.getElementById("ingredientsContainer");

const packagingContainer =
document.getElementById("packagingContainer");

const addIngredientRowBtn =
document.getElementById("addIngredientRow");

const addPackagingRowBtn =
document.getElementById("addPackagingRow");

const saveRecipeBtn =
document.getElementById("saveRecipeBtn");

/* ==========================
   FORMAT
========================== */

function peso(value) {
    return `₱${Number(value || 0).toFixed(2)}`;
}

/* ==========================
   OPTIONS
========================== */

function ingredientOptionsHTML() {

    if (!ingredients.length) {
        return `<option disabled>No ingredients yet</option>`;
    }

    return ingredients.map(i =>
        `<option value="${i.name}">${i.name}</option>`
    ).join("");
}

function packagingOptionsHTML() {

    if (!packaging.length) {
        return `<option disabled>No packaging yet</option>`;
    }

    return packaging.map(p =>
        `<option value="${p.name}">${p.name}</option>`
    ).join("");
}

/* ==========================
   ROW CREATION
========================== */

function createIngredientRow() {

    const row = document.createElement("div");
    row.className = "ingredient-row";

    row.innerHTML = `
        <select class="ingredient-select">
            <option value="">Select Ingredient</option>
            ${ingredientOptionsHTML()}
        </select>

        <input type="number" class="ingredient-amount" placeholder="Amount Used">

        <button class="remove-btn">×</button>
    `;

    row.querySelector(".remove-btn").onclick = () => {
        row.remove();
        calculateRecipe();
    };

    row.oninput = calculateRecipe;

    ingredientsContainer.appendChild(row);
}

function createPackagingRow() {

    const row = document.createElement("div");
    row.className = "packaging-row";

    row.innerHTML = `
        <select class="packaging-select">
            <option value="">Select Packaging</option>
            ${packagingOptionsHTML()}
        </select>

        <input type="number" class="packaging-qty" value="1">

        <button class="remove-btn">×</button>
    `;

    row.querySelector(".remove-btn").onclick = () => {
        row.remove();
        calculateRecipe();
    };

    row.oninput = calculateRecipe;

    packagingContainer.appendChild(row);
}

/* ==========================
   CALCULATE
========================== */

function calculateRecipe() {

    let ingredientCost = 0;
    let packagingCost = 0;

    document.querySelectorAll(".ingredient-row").forEach(row => {

        const name = row.querySelector(".ingredient-select").value;
        const amount = Number(row.querySelector(".ingredient-amount").value);

        const ing = ingredients.find(i => i.name === name);

        if (ing && amount > 0) {
            const stock = Number(ing.stock || 0);
                if (stock > 0) {
                    const unitCost = Number(ing.cost) / stock;
                    ingredientCost += unitCost * amount;
                }
            
        }
    });

    document.querySelectorAll(".packaging-row").forEach(row => {

        const name = row.querySelector(".packaging-select").value;
        const qty = Number(row.querySelector(".packaging-qty").value);

        const pack = packaging.find(p => p.name === name);

        if (pack && qty > 0) {

            const packQty =
                Number(pack.quantity || 0);

            if (packQty > 0) {

                const unitCost =
                    Number(pack.cost) / packQty;

                packagingCost +=
                    unitCost * qty;
            }
        }
    });

    const labor = Number(document.getElementById("laborCost")?.value || 0);
    const electricity = Number(document.getElementById("electricityCost")?.value || 0);
    const gas = Number(document.getElementById("gasCost")?.value || 0);
    const misc = Number(document.getElementById("miscCost")?.value || 0);

    const extraCost = labor + electricity + gas + misc;

    const totalCost = ingredientCost + packagingCost + extraCost;

    document.getElementById("ingredientCostPreview").textContent = peso(ingredientCost);
    document.getElementById("packagingCostPreview").textContent = peso(packagingCost);
    document.getElementById("extraCostPreview").textContent = peso(extraCost);
    document.getElementById("totalCostPreview").textContent = peso(totalCost);

    return { ingredientCost, packagingCost, extraCost, totalCost };
}

/* ==========================
   EVENTS
========================== */

addIngredientRowBtn?.addEventListener("click", createIngredientRow);
addPackagingRowBtn?.addEventListener("click", createPackagingRow);

["laborCost","electricityCost","gasCost","miscCost"].forEach(id => {
    document.getElementById(id)?.addEventListener("input", calculateRecipe);
});

/* ==========================
   SAVE TO SUPABASE
========================== */

saveRecipeBtn?.addEventListener("click", async () => {

    const name = document.getElementById("recipeName").value.trim();
    if (!name) return alert("Enter recipe name");

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;

    if (!user) return alert("Not logged in");

    const costs = calculateRecipe();

            const ingredientsUsed = [];

        document.querySelectorAll(".ingredient-row").forEach(row => {

            const ingredientName =
                row.querySelector(".ingredient-select")?.value;

            const amount =
                Number(
                    row.querySelector(".ingredient-amount")?.value
                );

            if (ingredientName && amount > 0) {

                ingredientsUsed.push({
                    name: ingredientName,
                    amount
                });

            }

        });

        const packagingUsed = [];

        document.querySelectorAll(".packaging-row").forEach(row => {

            const packagingName =
                row.querySelector(".packaging-select")?.value;

            const qty =
                Number(
                    row.querySelector(".packaging-qty")?.value
                );

            if (packagingName && qty > 0) {

                packagingUsed.push({
                    name: packagingName,
                    qty
                });

            }

        });

        const labor =
            Number(document.getElementById("laborCost")?.value || 0);

        const electricity =
            Number(document.getElementById("electricityCost")?.value || 0);

        const gas =
            Number(document.getElementById("gasCost")?.value || 0);

        const misc =
            Number(document.getElementById("miscCost")?.value || 0);
            
    const recipe = {

    user_id: user.id,

    name,

    category:
        document.getElementById("recipeCategory").value,

    yield_qty:
        Number(
            document.getElementById("yieldQuantity").value
        ),

    yield_unit:
        document.getElementById("yieldUnit").value,

    ingredients:
        ingredientsUsed,

    packaging:
        packagingUsed,

    ingredient_cost:
        costs.ingredientCost,

    packaging_cost:
        costs.packagingCost,

    extra_cost:
        costs.extraCost,

    total_cost:
        costs.totalCost,

    labor_cost:
        labor,

    electricity_cost:
        electricity,

    gas_cost:
        gas,

    misc_cost:
        misc

};

    const editId =
    document.getElementById("editingRecipeId").value;

        let error;

        if (editId) {

            ({ error } =
                await supabaseClient
                    .from("recipes")
                    .update(recipe)
                    .eq("id", editId));

        } else {

            ({ error } =
                await supabaseClient
                    .from("recipes")
                    .insert([recipe]));

        }

        if (error) {

            console.error(error);

            return alert(
                editId
                    ? "Failed to update recipe"
                    : "Failed to save recipe"
            );
        }

        alert(
            editId
                ? "Recipe updated!"
                : "Recipe saved!"
        );

        window.location.href =
            "recipe-list.html";
});

/* ==========================
   INIT (CRITICAL FIX)
========================== */
async function loadRecipeForEditing() {

    const params =
        new URLSearchParams(window.location.search);

    const recipeId = params.get("edit");

    if (!recipeId) return;

    const { data: recipe, error } =
        await supabaseClient
            .from("recipes")
            .select("*")
            .eq("id", recipeId)
            .single();

    if (error || !recipe) {
        console.error(error);
        return;
    }

    document.getElementById("editingRecipeId").value =
        recipe.id;

    document.getElementById("recipeName").value =
        recipe.name || "";

    document.getElementById("recipeCategory").value =
        recipe.category || "";

    document.getElementById("yieldQuantity").value =
        recipe.yield_qty || "";

    document.getElementById("yieldUnit").value =
        recipe.yield_unit || "";

    document.getElementById("laborCost").value =
        recipe.labor_cost || 0;

    document.getElementById("electricityCost").value =
        recipe.electricity_cost || 0;

    document.getElementById("gasCost").value =
        recipe.gas_cost || 0;

    document.getElementById("miscCost").value =
        recipe.misc_cost || 0;

    ingredientsContainer.innerHTML = "";
    packagingContainer.innerHTML = "";

    (recipe.ingredients || []).forEach(item => {

        createIngredientRow();

        const rows =
            document.querySelectorAll(".ingredient-row");

        const row = rows[rows.length - 1];

        row.querySelector(".ingredient-select").value =
            item.name;

        row.querySelector(".ingredient-amount").value =
            item.amount;

    });

    (recipe.packaging || []).forEach(item => {

        createPackagingRow();

        const rows =
            document.querySelectorAll(".packaging-row");

        const row = rows[rows.length - 1];

        row.querySelector(".packaging-select").value =
            item.name;

        row.querySelector(".packaging-qty").value =
            item.qty;

    });

    calculateRecipe();

    saveRecipeBtn.textContent =
        "💾 Update Recipe";
    }

async function init() {

    await loadIngredients();
    await loadPackaging();
    await loadRecipes();

    await loadRecipeForEditing();

    if (!document.querySelector(".ingredient-row")) {
        createIngredientRow();
    }

    if (!document.querySelector(".packaging-row")) {
        createPackagingRow();
    }

    calculateRecipe();
}

init();