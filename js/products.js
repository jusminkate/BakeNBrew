/* ==================================
   BAKECOST MADE GOODS (SUPABASE FINAL)
================================== */

let products = [];

const productsGrid = document.getElementById("productsGrid");
const searchInput = document.getElementById("productSearch");
const productModal = document.getElementById("productModal");

/* ==========================
   HELPERS
========================== */

function peso(v) {
    return `₱${Number(v || 0).toFixed(2)}`;
}

function setText(id, v) {
    const el = document.getElementById(id);
    if (el) el.textContent = v;
}

/* ==========================
   LOAD PRODUCTS FROM SUPABASE
========================== */

async function loadProducts() {

    const { data: userData } =
        await supabaseClient.auth.getUser();

    const user = userData.user;

    if (!user) return;

    const { data, error } =
        await supabaseClient
            .from("products")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    products = data || [];

    renderProducts(searchInput?.value || "");
}

/* ==========================
   RENDER PRODUCTS
========================== */

function renderProducts(filter = "") {

    productsGrid.innerHTML = "";

    products
        .filter(p =>
            (p.name || "")
            .toLowerCase()
            .includes(filter.toLowerCase())
        )
        .forEach(p => {

            const card = document.createElement("div");
            card.className = "product-card";

            card.innerHTML = `
                <h3>🍰 ${p.name}</h3>
                <p>Cost: ${peso(p.total_cost)}</p>
                <p>Price: ${peso(p.selling_price_per_unit)}</p>
                <p>Profit: ${peso(p.profit)}</p>

                <div class="card-actions">
                    <button onclick="viewProduct(${p.id})">View</button>
                    <button class="delete-btn" onclick="deleteProduct(${p.id})">Delete</button>
                </div>
            `;

            productsGrid.appendChild(card);
        });
}

/* ==========================
   VIEW PRODUCT
========================== */

window.viewProduct = function (id) {

    const p = products.find(x => x.id === id);
    if (!p) return;

    setText("modalProductName", p.name);
    setText("detailCategory", p.category);
    setText("detailYield", `${p.yield_qty} ${p.yield_unit}`);
    setText("detailDate", new Date(p.created_at).toLocaleDateString());

    setText("detailIngredientCost", peso(p.ingredient_cost));
    setText("detailPackagingCost", peso(p.packaging_cost));
    setText("detailExtraCost", peso(p.extra_cost));

    const total =
        Number(p.ingredient_cost || 0) +
        Number(p.packaging_cost || 0) +
        Number(p.extra_cost || 0);

    setText("detailTotalCost", peso(total));

    setText("detailSellingPrice", peso(p.selling_price_per_unit));
    setText("detailProfit", peso(p.profit));
    setText("detailMargin", `${Number(p.margin || 0).toFixed(2)}%`);

    const ingList = document.getElementById("detailIngredients");
    ingList.innerHTML = "";

    (p.ingredients || []).forEach(i => {
        const li = document.createElement("li");
        li.textContent = `${i.name} - ${i.amount}`;
        ingList.appendChild(li);
    });

    const packList = document.getElementById("detailPackaging");
    packList.innerHTML = "";

    (p.packaging || []).forEach(i => {
        const li = document.createElement("li");
        li.textContent = `${i.name} × ${i.qty}`;
        packList.appendChild(li);
    });

    productModal.classList.add("show");
};

/* ==========================
   CLOSE MODAL
========================== */

document.getElementById("closeProductModal")
?.addEventListener("click", () => {
    productModal.classList.remove("show");
});

window.addEventListener("click", e => {
    if (e.target === productModal) {
        productModal.classList.remove("show");
    }
});

/* ==========================
   DELETE PRODUCT (SUPABASE)
========================== */

window.deleteProduct = async function (id) {

    const confirmed = confirm("Delete this product?");
    if (!confirmed) return;

    const { error } =
        await supabaseClient
            .from("products")
            .delete()
            .eq("id", id);

    if (error) {
        console.error(error);
        alert("Delete failed");
        return;
    }

    await loadProducts();
};

/* ==========================
   SEARCH
========================== */

searchInput?.addEventListener("input", e => {
    renderProducts(e.target.value);
});

/* ==========================
   INIT
========================== */

async function init() {
    await loadProducts();
}

init();