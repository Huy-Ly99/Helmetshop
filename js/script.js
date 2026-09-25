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
