let cartCount = 0;


// =========================
// API
// =========================

const API_URL = "https://helmetshop-api.onrender.com";


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

    // Kiểm tra token đã có chưa
    let cartToken =
        localStorage.getItem("helmetHopCartToken");


    // Nếu đã có → dùng lại
    if (cartToken) {

        return cartToken;

    }


    // Nếu chưa có → tạo cart mới
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


    // Lấy token server tạo
    cartToken =
        data.cart.cart_token;


    // Lưu token
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

    // Lấy product card
    const productCard =
        button.closest(".product-card");


    if (!productCard) {

        console.error(
            "Không tìm thấy product-card"
        );

        return;

    }


    // Lấy thông tin sản phẩm
    const productId =
        Number(productCard.dataset.id);


    const productName =
        productCard.dataset.name;


    if (!productId) {

        console.error(
            "Không tìm thấy productId"
        );

        return;

    }


    try {

        // ========================================
        // LẤY CART TOKEN
        // ========================================

        const cartToken =
            await getOrCreateCartToken();


        // ========================================
        // THÊM SẢN PHẨM VÀO DATABASE
        // ========================================

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


        // ========================================
        // KIỂM TRA RESPONSE
        // ========================================

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Không thể thêm sản phẩm vào giỏ hàng."
            );

        }


        // ========================================
        // CẬP NHẬT SỐ LƯỢNG CART
        // ========================================

        await updateCartCount();


        // ========================================
        // THÔNG BÁO
        // ========================================

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


    // Lấy cart token
    const cartToken =
        localStorage.getItem(
            "helmetHopCartToken"
        );


    // Chưa có cart
    if (!cartToken) {

        cartCountElement.textContent = "0";

        return;

    }


    try {

        // Lấy cart từ Neon
        const response =
            await fetch(
                `${API_URL}/api/cart/${cartToken}`
            );


        if (!response.ok) {

            cartCountElement.textContent = "0";

            return;

        }


        const data =
            await response.json();


        // Tính tổng số lượng
        const totalQuantity =
            data.items.reduce(
                (total, item) => {

                    return total +
                        Number(item.quantity);

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

    }

}


// =========================
// TÌM KIẾM
// =========================

function searchProduct() {

    const keyword =
        document
            .getElementById("searchInput")
            .value
            .trim();


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
// ENTER ĐỂ TÌM KIẾM
// =========================

document
    .getElementById("searchInput")
    .addEventListener(
        "keypress",
        function(event) {

            if (event.key === "Enter") {

                searchProduct();

            }

        }
    );


// =========================
// HEART
// =========================

const hearts =
    document.querySelectorAll(".heart");


hearts.forEach(function(heart) {

    heart.addEventListener(
        "click",
        function() {

            if (heart.textContent === "♡") {

                heart.textContent = "♥";

            } else {

                heart.textContent = "♡";

            }

        }
    );

});


// =========================
// LOAD TRANG
// =========================

document.addEventListener(
    "DOMContentLoaded",
    function() {

        updateCartCount();

    }
);