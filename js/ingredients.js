/* ==================================
   BAKECOST INGREDIENTS (SUPABASE FIXED)
================================== */

let ingredients = [];
let editingIndex = null;
let isEditing = false;

/* ==========================
   ELEMENTS
========================== */

const modal = document.getElementById("ingredientModal");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const ingredientForm = document.getElementById("ingredientForm");
const tableBody = document.getElementById("ingredientTableBody");
const cardsContainer = document.getElementById("ingredientCards");
const searchInput = document.getElementById("ingredientSearch");

/* ==========================
   MODAL
========================== */

if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {
        modal.classList.add("show");
        editingIndex = null;
        isEditing = false;

        ingredientForm.reset();
        ingredientForm.onsubmit = null;
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        modal.classList.remove("show");
    });
}

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.remove("show");
    }
});

/* ==========================
   ADD TO SUPABASE
========================== */

async function addIngredientToDB(ingredient) {

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;

    if (!user) {
        alert("Not logged in");
        return;
    }

    const { error } = await supabaseClient
        .from("ingredients")
        .insert([
            {
                user_id: user.id,
                name: ingredient.name,
                unit: ingredient.unit,
                cost: ingredient.cost,
                stock: ingredient.quantity
            }
        ]);

    if (error) {
        console.error(error);
        alert("Failed to save ingredient");
        return;
    }

    loadIngredients();
}

/* ==========================
   LOAD FROM SUPABASE
========================== */

async function loadIngredients() {

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const { data, error } = await supabaseClient
        .from("ingredients")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    ingredients = data;
    renderIngredients();
}

/* ==========================
   COST PER UNIT
========================== */

function calculateCostPerUnit(cost, stock) {

    if (!stock || stock <= 0) return 0;

    return cost / stock;
}

/* ==========================
   RENDER
========================== */

function renderIngredients(filter = "") {

    if (!tableBody || !cardsContainer) return;

    tableBody.innerHTML = "";
    cardsContainer.innerHTML = "";

    const filtered = ingredients.filter(item =>
        item.name.toLowerCase().includes(filter.toLowerCase())
    );

    if (filtered.length === 0) {
        tableBody.innerHTML = `
        <tr>
            <td colspan="6">
                <div class="empty-state">
                    🥣
                    <p>No ingredients found.</p>
                </div>
            </td>
        </tr>
        `;
        return;
    }

    filtered.forEach((item) => {

        const costPerUnit = calculateCostPerUnit(item.cost, item.stock);

        /* TABLE */
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.stock}</td>
            <td>${item.unit}</td>
            <td>₱${Number(item.cost).toFixed(2)}</td>
            <td>₱${costPerUnit.toFixed(4)}</td>
            <td>
                <button class="edit-btn" onclick="editIngredient('${item.id}')">✏</button>
                <button class="delete-btn" onclick="deleteIngredient('${item.id}')">🗑</button>
            </td>
        `;

        tableBody.appendChild(row);

        /* CARD */
        const card = document.createElement("div");
        card.className = "item-card";

        card.innerHTML = `
            <div class="compact-card-title">
                🥣 ${item.name}
            </div>

            <div class="compact-card-info">
                <span><strong>QTY:</strong> ${item.stock}${item.unit}</span>
                <span><strong>COST:</strong> ₱${Number(item.cost).toFixed(2)}</span>
                <span><strong>COST/${item.unit.toUpperCase()}:</strong> ₱${costPerUnit.toFixed(4)}</span>
            </div>

            <div class="card-actions">
                <button class="edit-btn" onclick="editIngredient('${item.id}')">✏ Edit</button>
                <button class="delete-btn" onclick="deleteIngredient('${item.id}')">🗑 Delete</button>
            </div>
        `;

        cardsContainer.appendChild(card);
    });
}

/* ==========================
   FORM SUBMIT
========================== */

if (ingredientForm) {

    ingredientForm.addEventListener("submit", async (e) => {

        if (isEditing) return;

        e.preventDefault();

        const ingredient = {
            name: document.getElementById("ingredientName").value,
            unit: document.getElementById("ingredientUnit").value,
            cost: Number(document.getElementById("ingredientCost").value),
            quantity: Number(document.getElementById("ingredientQuantity").value)
        };

        await addIngredientToDB(ingredient);

        ingredientForm.reset();
        modal.classList.remove("show");
    });
}

/* ==========================
   EDIT
========================== */

window.editIngredient = async function(id) {

    const item = ingredients.find(i => i.id === id);
    if (!item) return;

    document.getElementById("ingredientName").value = item.name;
    document.getElementById("ingredientUnit").value = item.unit;
    document.getElementById("ingredientQuantity").value = item.stock;
    document.getElementById("ingredientCost").value = item.cost;
    isEditing = true;
    modal.classList.add("show");

    ingredientForm.onsubmit = async (e) => {
        e.preventDefault();

        const updated = {
            name: document.getElementById("ingredientName").value,
            unit: document.getElementById("ingredientUnit").value,
            stock: Number(document.getElementById("ingredientQuantity").value),
            cost: Number(document.getElementById("ingredientCost").value)
        };

        const { error } = await supabaseClient
            .from("ingredients")
            .update(updated)
            .eq("id", id);

        if (error) {
            alert("Update failed");
            return;
        }

        ingredientForm.reset();

        isEditing = false;

        modal.classList.remove("show");

        ingredientForm.onsubmit = null;

        loadIngredients();
    };
};

/* ==========================
   DELETE
========================== */

window.deleteIngredient = async function(id) {

    const confirmed = confirm("Delete this ingredient?");
    if (!confirmed) return;

    const { error } = await supabaseClient
        .from("ingredients")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Delete failed");
        return;
    }

    loadIngredients();
};

/* ==========================
   SEARCH
========================== */

if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        renderIngredients(e.target.value);
    });
}

/* ==========================
   INIT
========================== */

loadIngredients();