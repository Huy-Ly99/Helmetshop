// ========================================
// HELMET HOP - CART
// ========================================

const API_URL = "https://helmetshop-api.onrender.com";


// ========================================
// FORMAT TIỀN VIỆT NAM
// ========================================

function formatPrice(price) {

    return Number(price).toLocaleString("vi-VN") + " ₫";

}


// ========================================
// HIỂN THỊ GIỎ HÀNG
// ========================================

async function renderCart() {

    const cartContent =
        document.getElementById("cartContent");

    const cartCount =
        document.getElementById("cartCount");


    if (!cartContent) {
        return;
    }


    // ========================================
    // LẤY CART TOKEN
    // ========================================

    const cartToken =
        localStorage.getItem("helmetHopCartToken");


    // Chưa có giỏ hàng
    if (!cartToken) {

        if (cartCount) {
            cartCount.textContent = "0";
        }

        showEmptyCart();

        return;
    }


    try {

        // ========================================
        // GỌI API LẤY GIỎ HÀNG
        // ========================================

        const response =
            await fetch(
                `${API_URL}/api/cart/${cartToken}`
            );


        const data =
            await response.json();


        console.log(
            "Cart API response:",
            data
        );


        // ========================================
        // API ERROR
        // ========================================

        if (!response.ok) {

            if (cartCount) {
                cartCount.textContent = "0";
            }

            showEmptyCart();

            return;
        }


        // ========================================
        // LẤY ITEMS
        // ========================================

        const items =
            Array.isArray(data.cart?.items)
                ? data.cart.items
                : [];


        // ========================================
        // TỔNG SỐ LƯỢNG
        // ========================================

        const totalQuantity =
            items.reduce(
                (total, item) => {

                    return total +
                        Number(item.quantity || 0);

                },
                0
            );


        if (cartCount) {

            cartCount.textContent =
                totalQuantity;

        }


        // ========================================
        // GIỎ HÀNG TRỐNG
        // ========================================

        if (items.length === 0) {

            showEmptyCart();

            return;
        }


        // ========================================
        // TỔNG TIỀN
        // ========================================

        const total =
            Number(data.cart.total || 0);


        // ========================================
        // HIỂN THỊ SẢN PHẨM
        // ========================================

        let productsHTML = "";


        items.forEach(function (item) {

            const itemTotal =
                Number(item.price) *
                Number(item.quantity);


            let imageHTML;


            // Có ảnh
            if (item.image) {

                imageHTML = `

                    <img
                        src="${item.image}"
                        alt="${item.name}"
                        class="cart-item-image"
                        onerror="this.style.display='none'"
                    >

                `;

            }

            // Không có ảnh
            else {

                imageHTML = `

                    <div class="cart-item-image">
                        🪖
                    </div>

                `;

            }


            productsHTML += `

                <div class="cart-item"
     data-item-id="${item.id}"
     data-price="${item.price}">


                    ${imageHTML}


                    <div>

                        <div class="cart-item-name">
                            ${item.name}
                        </div>


                        <div class="cart-item-price">
                            ${formatPrice(item.price)}
                        </div>


                        <div class="quantity-box">

                            <button
                                class="quantity-btn"
                                onclick="changeQuantity(
                                    ${item.id},
                                    -1
                                )"
                            >
                                −
                            </button>


                            <div class="quantity-value">
                                ${item.quantity}
                            </div>


                            <button
                                class="quantity-btn"
                                onclick="changeQuantity(
                                    ${item.id},
                                    1
                                )"
                            >
                                +
                            </button>

                        </div>

                    </div>


                    <div class="cart-item-right">


                        <div class="item-total">
                            ${formatPrice(itemTotal)}
                        </div>


                        <button
                            class="remove-btn"
                            onclick="removeFromCart(${item.id})"
                        >
                            🗑 Xóa
                        </button>


                    </div>


                </div>

            `;

        });


        // ========================================
        // HTML GIỎ HÀNG
        // ========================================

        cartContent.innerHTML = `

            <div class="cart-layout">


                <div class="cart-products">

                    ${productsHTML}

                </div>


                <div class="cart-summary">


                    <h2>
                        Tóm tắt đơn hàng
                    </h2>


                    <div class="summary-row">

                        <span>
                            Tạm tính
                        </span>

                        <span>
                            ${formatPrice(total)}
                        </span>

                    </div>


                    <div class="summary-row">

                        <span>
                            Phí vận chuyển
                        </span>

                        <span>
                            Miễn phí
                        </span>

                    </div>


                    <div class="summary-row summary-total">

                        <span>
                            Tổng cộng
                        </span>

                        <span>
                            ${formatPrice(total)}
                        </span>

                    </div>


                    <button
                        class="checkout-btn"
                        onclick="goToCheckout()"
                    >
                        Tiến hành thanh toán
                    </button>


                    <a
                        href="index.html"
                        class="continue-btn"
                    >
                        ← Tiếp tục mua sắm
                    </a>


                </div>


            </div>

        `;


    } catch (error) {

        console.error(
            "Load cart error:",
            error
        );


        cartContent.innerHTML = `

            <div class="empty-cart">

                <h2>
                    Không thể tải giỏ hàng
                </h2>

                <p>
                    Vui lòng thử lại sau.
                </p>

                <a
                    href="index.html"
                    class="shopping-btn"
                >
                    Tiếp tục mua sắm
                </a>

            </div>

        `;

    }

}


// ========================================
// GIỎ HÀNG TRỐNG
// ========================================

function showEmptyCart() {

    const cartContent =
        document.getElementById("cartContent");


    if (!cartContent) {
        return;
    }


    cartContent.innerHTML = `

        <div class="empty-cart">

            <div class="empty-cart-icon">
                🛒
            </div>

            <h2>
                Giỏ hàng đang trống
            </h2>

            <p>
                Bạn chưa có sản phẩm nào trong giỏ hàng.
            </p>

            <a
                href="index.html"
                class="shopping-btn"
            >
                Tiếp tục mua sắm
            </a>

        </div>

    `;

}


async function changeQuantity(itemId, amount) {

    const cartToken =
        localStorage.getItem("helmetHopCartToken");

    if (!cartToken) return;

    // Tìm item đang hiển thị trên giao diện
    const itemElement =
        document.querySelector(
            `.cart-item[data-item-id="${itemId}"]`
        );

    if (!itemElement) return;

    const quantityElement =
        itemElement.querySelector(".quantity-value");

    const currentQuantity =
        Number(quantityElement.textContent);

    const newQuantity =
        currentQuantity + amount;

    // Không cho nhỏ hơn 1
    if (newQuantity < 1) {
        return;
    }

    // Cập nhật giao diện ngay lập tức
    quantityElement.textContent = newQuantity;

    try {

        const response = await fetch(
            `${API_URL}/api/cart/items/${itemId}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    cartToken: cartToken,
                    quantity: newQuantity
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            // Nếu API báo lỗi thì quay lại số cũ
            quantityElement.textContent =
                currentQuantity;

            throw new Error(
                data.message ||
                "Không thể cập nhật số lượng."
            );
        }

        // Tính lại tiền của item
        const price =
            Number(itemElement.dataset.price);

        const itemTotal =
            price * newQuantity;

        const itemTotalElement =
            itemElement.querySelector(".item-total");

        if (itemTotalElement) {
            itemTotalElement.textContent =
                formatPrice(itemTotal);
        }

        // Cập nhật tổng tiền trên trang
        function updateCartSummary() {

    const items =
        document.querySelectorAll(".cart-item");

    let total = 0;

    items.forEach(function(item) {

        const price =
            Number(item.dataset.price);

        const quantity =
            Number(
                item.querySelector(
                    ".quantity-value"
                ).textContent
            );

        total += price * quantity;
    });

    const summaryRows =
        document.querySelectorAll(
            ".summary-row span:last-child"
        );

    // Tạm tính
    if (summaryRows[0]) {
        summaryRows[0].textContent =
            formatPrice(total);
    }

    // Tổng cộng
    if (summaryRows[2]) {
        summaryRows[2].textContent =
            formatPrice(total);
    }
}

        // Cập nhật số lượng icon giỏ hàng
        function updateCartCountFast(amount) {

    const cartCount =
        document.getElementById("cartCount");

    if (!cartCount) return;

    const current =
        Number(cartCount.textContent || 0);

    cartCount.textContent =
        current + amount;
}

    } catch (error) {

        console.error(
            "Change quantity error:",
            error
        );

        alert(
            error.message ||
            "Có lỗi xảy ra."
        );
    }
}

// ========================================
// THANH TOÁN
// ========================================

function goToCheckout() {

    const cartToken =
        localStorage.getItem(
            "helmetHopCartToken"
        );


    if (!cartToken) {

        alert(
            "Giỏ hàng đang trống!"
        );

        return;
    }


    window.location.href =
        "checkout.html";

}


// ========================================
// LOAD TRANG
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderCart();

    }
);