/* ==================================
   BAKECOST PACKAGING (SUPABASE VERSION)
================================== */

let packaging = [];
let isEditing = false;
let editingIndex = null;

/* ==========================
   ELEMENTS
========================== */

const modal =
document.getElementById("packagingModal");

const openModalBtn =
document.getElementById("openPackagingModal");

const closeModalBtn =
document.getElementById("closePackagingModal");

const packagingForm =
document.getElementById("packagingForm");

const tableBody =
document.getElementById("packagingTableBody");

const cardsContainer =
document.getElementById("packagingCards");

const searchInput =
document.getElementById("packagingSearch");

/* ==========================
   MODAL
========================== */

if (openModalBtn) {
    openModalBtn.addEventListener("click", () => {

        packagingForm.reset();

        editingIndex = null;

        isEditing = false;

        modal.classList.add("show");
    });
}

if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {

        isEditing = false;

        packagingForm.onsubmit = null;

        modal.classList.remove("show");
    });
}

window.addEventListener("click", (e) => {

    if (e.target === modal) {

        isEditing = false;

        packagingForm.onsubmit = null;

        modal.classList.remove("show");
    }
});

/* ==========================
   SUPABASE: ADD
========================== */

async function addPackagingToDB(item) {

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;

    if (!user) {
        alert("Not logged in");
        return;
    }

    const { error } = await supabaseClient
        .from("packaging")
        .insert([
            {
                user_id: user.id,
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                cost: item.cost
            }
        ]);

    if (error) {
        console.error(error);
        alert("Failed to save packaging");
        return;
    }

    loadPackaging();
}

/* ==========================
   LOAD FROM SUPABASE
========================== */

async function loadPackaging() {

    const { data: userData } = await supabaseClient.auth.getUser();
    const user = userData.user;

    if (!user) return;

    const { data, error } = await supabaseClient
        .from("packaging")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    packaging = data;
    renderPackaging();
}

/* ==========================
   COST PER PIECE
========================== */

function costPerPiece(cost, quantity) {

    if (!quantity || quantity <= 0) {
        return 0;
    }

    return cost / quantity;
}

/* ==========================
   RENDER
========================== */

function renderPackaging(filter = "") {

    if (!tableBody || !cardsContainer) return;

    tableBody.innerHTML = "";
    cardsContainer.innerHTML = "";

    const filtered = packaging.filter(item =>
    (item.name || "").toLowerCase().includes(filter.toLowerCase())
);

    if (filtered.length === 0) {

        tableBody.innerHTML = `
        <tr>
            <td colspan="6">
                <div class="empty-state">
                    📦
                    <p>No packaging items found.</p>
                </div>
            </td>
        </tr>
        `;
        return;
    }

    filtered.forEach((item) => {

        const perPiece =
        costPerPiece(item.cost, item.quantity);

        /* TABLE */

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
            <td>₱${Number(item.cost).toFixed(2)}</td>
            <td>₱${perPiece.toFixed(2)}</td>
            <td>
                <button class="edit-btn" onclick="editPackaging('${item.id}')">✏</button>
                <button class="delete-btn" onclick="deletePackaging('${item.id}')">🗑</button>
            </td>
        `;

        tableBody.appendChild(row);

        /* CARD */

        const card = document.createElement("div");
        card.className = "item-card";

        card.innerHTML = `
            <div class="compact-card-title">
                📦 ${item.name}
            </div>

            <div class="compact-card-info">
                <span><strong>QTY:</strong> ${item.quantity}${item.unit}</span>
                <span><strong>COST:</strong> ₱${Number(item.cost).toFixed(2)}</span>
                <span><strong>COST/PCS:</strong> ₱${perPiece.toFixed(2)}</span>
            </div>

            <div class="card-actions">
                <button class="edit-btn" onclick="editPackaging('${item.id}')">✏ Edit</button>
                <button class="delete-btn" onclick="deletePackaging('${item.id}')">🗑 Delete</button>
            </div>
        `;

        cardsContainer.appendChild(card);
    });
}

/* ==========================
   FORM SUBMIT (ADD / UPDATE)
========================== */

if (packagingForm) {

    packagingForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        if (isEditing) return;

        const item = {
            name: document.getElementById("packagingName").value,
            quantity: Number(document.getElementById("packagingQuantity").value),
            unit: document.getElementById("packagingUnit").value,
            cost: Number(document.getElementById("packagingCost").value)
        };

        await addPackagingToDB(item);

        packagingForm.reset();

        modal.classList.remove("show");
    });
}

/* ==========================
   EDIT (SUPABASE)
========================== */

window.editPackaging = function(id) {

    const item = packaging.find(p => p.id === id);
    if (!item) return;

    document.getElementById("packagingName").value = item.name;
    document.getElementById("packagingQuantity").value = item.quantity;
    document.getElementById("packagingUnit").value = item.unit;
    document.getElementById("packagingCost").value = item.cost;
    isEditing = true;
    modal.classList.add("show");

    packagingForm.onsubmit = async (e) => {
        e.preventDefault();

        const updated = {
            name: document.getElementById("packagingName").value,
            quantity: Number(document.getElementById("packagingQuantity").value),
            unit: document.getElementById("packagingUnit").value,
            cost: Number(document.getElementById("packagingCost").value)
        };

        const { error } = await supabaseClient
            .from("packaging")
            .update(updated)
            .eq("id", id);

        if (error) {
            alert("Update failed");
            return;
        }

        packagingForm.reset();

        isEditing = false;

        modal.classList.remove("show");

        packagingForm.onsubmit = null;

        loadPackaging();

        
    };
};

/* ==========================
   DELETE
========================== */

window.deletePackaging = async function(id) {

    const confirmed = confirm("Delete this packaging item?");
    if (!confirmed) return;

    const { error } = await supabaseClient
        .from("packaging")
        .delete()
        .eq("id", id);

    if (error) {
        alert("Delete failed");
        return;
    }

    loadPackaging();
};

/* ==========================
   SEARCH
========================== */

if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        renderPackaging(e.target.value);
    });
}

/* ==========================
   INITIAL LOAD
========================== */

loadPackaging();