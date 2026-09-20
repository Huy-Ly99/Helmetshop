// ========================================
// HELMET HOP - CART
// ========================================
// Lấy giỏ hàng từ localStorage
function getCart() {

    const cart = localStorage.getItem("helmetHopCart");

    if (!cart) {
        return [];
    }

    try {
        return JSON.parse(cart);
    } catch (error) {
        console.error("Cart data bị lỗi:", error);
        return [];
    }
}


// Lưu giỏ hàng
function saveCart(cart) {

    localStorage.setItem(
        "helmetHopCart",
        JSON.stringify(cart)
    );
}


// Format tiền Việt Nam
function formatPrice(price) {

    return Number(price).toLocaleString("vi-VN") + " ₫";
}


// ========================================
// HIỂN THỊ GIỎ HÀNG
// ========================================

function renderCart() {

    const cart = getCart();

    const cartContent =
        document.getElementById("cartContent");

    const cartCount =
        document.getElementById("cartCount");


    // Tổng số sản phẩm
    const totalQuantity = cart.reduce(
        (total, item) => total + Number(item.quantity),
        0
    );


    if (cartCount) {
        cartCount.textContent = totalQuantity;
    }


    // ========================================
    // GIỎ HÀNG TRỐNG
    // ========================================

    if (cart.length === 0) {

        cartContent.innerHTML = `

            <div class="empty-cart">

                <div class="empty-cart-icon">
                    🛒
                </div>

                <h2>Giỏ hàng đang trống</h2>

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

        return;
    }


    // ========================================
    // TÍNH TỔNG TIỀN
    // ========================================

    let subtotal = 0;

    cart.forEach(item => {

        subtotal +=
            Number(item.price) *
            Number(item.quantity);

    });


    // ========================================
    // DANH SÁCH SẢN PHẨM
    // ========================================

    let productsHTML = "";


    cart.forEach((item, index) => {

        const itemTotal =
            Number(item.price) *
            Number(item.quantity);


        productsHTML += `

            <div class="cart-item">

                <img
                    src="${item.image}"
                    alt="${item.name}"
                    class="cart-item-image"
                    onerror="this.style.display='none'"
                >


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
                            onclick="changeQuantity(${index}, -1)"
                        >
                            −
                        </button>


                        <div class="quantity-value">
                            ${item.quantity}
                        </div>


                        <button
                            class="quantity-btn"
                            onclick="changeQuantity(${index}, 1)"
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
                        onclick="removeFromCart(${index})"
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
                        ${formatPrice(subtotal)}
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
                        ${formatPrice(subtotal)}
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
}


// ========================================
// TĂNG / GIẢM SỐ LƯỢNG
// ========================================

function changeQuantity(index, amount) {

    const cart = getCart();

    if (!cart[index]) {
        return;
    }


    cart[index].quantity =
        Number(cart[index].quantity) + amount;


    // Không cho số lượng < 1
    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }


    saveCart(cart);

    renderCart();
}


// ========================================
// XÓA SẢN PHẨM
// ========================================

function removeFromCart(index) {

    const cart = getCart();

    if (!cart[index]) {
        return;
    }


    cart.splice(index, 1);

    saveCart(cart);

    renderCart();

}


// ========================================
// THANH TOÁN
// ========================================

function goToCheckout() {

    const cart = getCart();


    if (cart.length === 0) {

        alert("Giỏ hàng đang trống!");

        return;
    }


    window.location.href = "checkout.html";

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