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
// THÊM VÀO GIỎ HÀNG
// =========================

async function addToCart(button) {

    const productCard =
        button.closest(".product-card");

    if (!productCard) {
        console.error("Không tìm thấy product-card");
        return;
    }

    const productId =
        Number(productCard.dataset.id);

    const productName =
        productCard.dataset.name;

    if (!productId) {
        console.error("Không tìm thấy productId");
        return;
    }

    try {

        const cartToken =
            await getOrCreateCartToken();

        const response =
            await fetch(
                `${API_URL}/api/cart/items`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        cartToken: cartToken,
                        productId: productId,
                        quantity: 1
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {
            throw new Error(
                data.message ||
                "Không thể thêm sản phẩm vào giỏ hàng."
            );
        }

        await updateCartCount();

        alert(
            `Đã thêm "${productName}" vào giỏ hàng!`
        );

    } catch (error) {

        console.error(
            "Add to cart error:",
            error
        );

        alert(
            error.message ||
            "Có lỗi xảy ra khi thêm sản phẩm."
        );
    }
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

    alert(
        "Bạn đang tìm kiếm: " +
        keyword
    );
}


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