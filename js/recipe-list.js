const recipeList =
document.getElementById("recipeList");

async function loadRecipes() {

    const { data: userData } =
    await supabaseClient.auth.getUser();

    const user = userData.user;

    if (!user) return;

    const { data, error } =
    await supabaseClient
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending:false });

    if (error) {
        console.error(error);
        return;
    }

    renderRecipes(data);
}

function peso(v) {
    return `₱${Number(v).toFixed(2)}`;
}

function renderRecipes(recipes) {

    recipeList.innerHTML = "";

    if (!recipes.length) {

        recipeList.innerHTML = `
            <div class="empty-state">
                🍰
                <p>No saved recipes yet.</p>
            </div>
        `;

        return;
    }

    recipes.forEach(recipe => {

        const card =
        document.createElement("div");

        card.className = "recipe-card";

        card.innerHTML = `

        <div class="recipe-header">

            <div>

                <div class="recipe-title">
                    🎂 ${recipe.name}
                </div>

                <small>
                    Yield:
                    ${recipe.yield_qty}
                    ${recipe.yield_unit}
                </small>

            </div>

            <div class="recipe-category">
                ${recipe.category}
            </div>

        </div>

        <div class="recipe-cost">
            ${peso(recipe.total_cost)}
        </div>

        <p>
            Total Production Cost
        </p>

        <div
        id="details-${recipe.id}"
        class="recipe-details">

            <p>
                <strong>Ingredient Cost:</strong>
                ${peso(recipe.ingredient_cost)}
            </p>

            <p>
                <strong>Packaging Cost:</strong>
                ${peso(recipe.packaging_cost)}
            </p>

            <p>
                <strong>Additional Cost:</strong>
                ${peso(recipe.extra_cost)}
            </p>

            <div class="recipe-list-section">

                <h4>🥣 Ingredients</h4>

                <ul>

                ${
                    (recipe.ingredients || [])
                    .map(i => `
                    <li>
                        ${i.name}
                        (${i.amount})
                    </li>
                    `)
                    .join("")
                }

                </ul>

            </div>

            <div class="recipe-list-section">

                <h4>📦 Packaging</h4>

                <ul>

                ${
                    (recipe.packaging || [])
                    .map(p => `
                    <li>
                        ${p.name}
                        (${p.qty})
                    </li>
                    `)
                    .join("")
                }

                </ul>

            </div>

            <div class="recipe-list-section">

                <h4>⚡ Additional Costs</h4>

                <ul>
                    <li>Labor: ${peso(recipe.labor_cost)}</li>
                    <li>Electricity: ${peso(recipe.electricity_cost)}</li>
                    <li>Gas: ${peso(recipe.gas_cost)}</li>
                    <li>Misc: ${peso(recipe.misc_cost)}</li>
                </ul>

            </div>

        </div>

        <div class="recipe-actions">

            <button
            class="view-btn"
            onclick="toggleDetails(${recipe.id})">

            👁 View

            </button>

            <button
            class="edit-btn"
            onclick="editRecipe(${recipe.id})">

            ✏ Edit

            </button>

            <button
            class="delete-btn"
            onclick="deleteRecipe(${recipe.id})">

            🗑 Delete

            </button>

        </div>

        `;

        recipeList.appendChild(card);

    });


}

window.toggleDetails = function(id) {

    const details =
    document.getElementById(
        `details-${id}`
    );

    details.classList.toggle("show");

};
window.editRecipe = function(id){

    window.location.href =
    `recipes.html?edit=${id}`;

};
window.deleteRecipe =
async function(id) {

    const confirmed =
    confirm("Delete recipe?");

    if (!confirmed) return;

    const { error } =
    await supabaseClient
        .from("recipes")
        .delete()
        .eq("id", id);

    if (error) {
        console.error(error);
        alert("Delete failed");
        return;
    }

    loadRecipes();
};

loadRecipes();