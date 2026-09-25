// =========================
// XEM CHI TIẾT SẢN PHẨM
// =========================

function viewProduct(productId) {
    window.location.href =
        `product-detail.html?id=${productId}`;
}


// =========================
// LẤY HOẶC TẠO CART TOKEN
// =========================

async function getOrCreateCartToken() {

    let cartToken =
        localStorage.getItem("helmetHopCartToken");

    if (cartToken) {
        return cartToken;
    }

    const response =
        await fetch(
            `${API_URL}/api/cart`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );

    const data =
        await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Không thể tạo giỏ hàng."
        );
    }

    cartToken =
        data.cart.cart_token;

    localStorage.setItem(
        "helmetHopCartToken",
        cartToken
    );

    return cartToken;
}


// =========================
// CẬP NHẬT SỐ LƯỢNG GIỎ HÀNG
// =========================

async function updateCartCount() {

    const cartCountElement =
        document.getElementById("cartCount");

    if (!cartCountElement) {
        return;
    }

    const cartToken =
        localStorage.getItem(
            "helmetHopCartToken"
        );

    if (!cartToken) {
        cartCountElement.textContent = "0";
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/api/cart/${cartToken}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            cartCountElement.textContent = "0";

            return;
        }

        const items =
            Array.isArray(data.cart?.items)
                ? data.cart.items
                : [];

        const totalQuantity =
            items.reduce(
                (total, item) => {

                    return total +
                        Number(item.quantity || 0);

                },
                0
            );

        cartCountElement.textContent =
            totalQuantity;

    } catch (error) {

        console.error(
            "Update cart count error:",
            error
        );

        cartCountElement.textContent = "0";
    }
}



// =========================
// TÌM KIẾM
// =========================

function searchProduct() {

    const searchInput =
        document.getElementById("searchInput");

    if (!searchInput) {
        return;
    }

    const keyword =
        searchInput.value.trim();

    if (keyword === "") {

        alert(
            "Vui lòng nhập tên sản phẩm cần tìm!"
        );

        return;
    }

    // Chuyển sang trang Nón bảo hiểm
    // và truyền từ khóa tìm kiếm
    window.location.href =
        "non-bao-hiem.html?search=" +
        encodeURIComponent(keyword);
}

// =========================
// GỢI Ý TÌM KIẾM
// =========================

let allProducts = [];


// Lấy danh sách sản phẩm từ API
async function loadSearchSuggestions() {

    try {

        const response =
            await fetch(`${API_URL}/api/products`);

        if (!response.ok) {
            throw new Error("Không thể lấy sản phẩm");
        }

        const data =
            await response.json();

        allProducts =
            Array.isArray(data)
                ? data
                : data.products || [];

    }

    catch (error) {

        console.error(
            "Search suggestion error:",
            error
        );

    }
}


// Hiển thị gợi ý
function showSearchSuggestions(keyword) {

    const suggestionBox =
        document.getElementById(
            "searchSuggestions"
        );

    if (!suggestionBox) {
        return;
    }


    keyword =
        keyword.trim().toLowerCase();


    // Không nhập gì
    if (!keyword) {

        suggestionBox.innerHTML = "";

        suggestionBox.style.display =
            "none";

        return;
    }


    // Lọc sản phẩm
    const suggestions =
        allProducts
            .filter(product => {

                const name =
                    String(product.name || "")
                        .toLowerCase();

                const category =
                    String(product.category || "")
                        .toLowerCase();


                return (
                    name.includes(keyword) ||
                    category.includes(keyword)
                );

            })
            .slice(0, 6);


    // Không có kết quả
    if (suggestions.length === 0) {

        suggestionBox.innerHTML = `
            <div class="search-no-result">
                Không tìm thấy sản phẩm
            </div>
        `;

        suggestionBox.style.display =
            "block";

        return;
    }


    // Hiển thị gợi ý
    suggestionBox.innerHTML =
        suggestions.map(product => `

            <div
                class="search-suggestion-item"
                onclick="selectSearchSuggestion(${product.id})"
            >

                <div class="search-suggestion-name">
                    ${product.name}
                </div>

                <div class="search-suggestion-category">
                    ${product.category || ""}
                </div>

            </div>

        `).join("");


    suggestionBox.style.display =
        "block";
}


// Click vào sản phẩm gợi ý
function selectSearchSuggestion(productId) {

    window.location.href =
        `product-detail.html?id=${productId}`;

}


// Bắt sự kiện nhập chữ
document.addEventListener(
    "DOMContentLoaded",
    function () {

        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (!searchInput) {
            return;
        }


        // Khi gõ từng chữ
        searchInput.addEventListener(
            "input",
            function () {

                showSearchSuggestions(
                    this.value
                );

            }
        );


        // Khi click ra ngoài
        document.addEventListener(
            "click",
            function (event) {

                const searchBox =
                    document.querySelector(
                        ".search-box"
                    );


                if (
                    searchBox &&
                    !searchBox.contains(event.target)
                ) {

                    const suggestionBox =
                        document.getElementById(
                            "searchSuggestions"
                        );


                    if (suggestionBox) {

                        suggestionBox.style.display =
                            "none";

                    }

                }

            }
        );


        // Load sản phẩm
        loadSearchSuggestions();

    }
);


// =========================
// LOAD TRANG
// =========================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const searchInput =
            document.getElementById("searchInput");

        if (searchInput) {

            searchInput.addEventListener(
                "keypress",
                function (event) {

                    if (event.key === "Enter") {
                        searchProduct();
                    }

                }
            );
        }


        updateCartCount();


        const hearts =
            document.querySelectorAll(".heart");

        hearts.forEach(function (heart) {

            heart.addEventListener(
                "click",
                function () {

                    if (
                        heart.textContent === "♡"
                    ) {

                        heart.textContent = "♥";

                    } else {

                        heart.textContent = "♡";

                    }

                }
            );

        });

    }
);


function toggleFooter(title) {

    const column = title.parentElement;

    column.classList.toggle("open");

}
