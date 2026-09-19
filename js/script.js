let cartCount = 0;


// =========================
// THÊM VÀO GIỎ HÀNG
// =========================

function addToCart(button) {

    // Lấy thẻ sản phẩm
    const productCard = button.closest(".product-card");

    if (!productCard) {
        console.error("Không tìm thấy product-card");
        return;
    }


    // Lấy thông tin sản phẩm
    const product = {
        id: productCard.dataset.id,
        name: productCard.dataset.name,
        price: Number(productCard.dataset.price),
        image: productCard.dataset.image,
        quantity: 1
    };


    // Lấy giỏ hàng hiện tại
    let cart =
        JSON.parse(
            localStorage.getItem("helmetHopCart")
        ) || [];


    // Kiểm tra sản phẩm đã tồn tại chưa
    const existingProduct = cart.find(
        item => item.id === product.id
    );


    if (existingProduct) {

        existingProduct.quantity++;

    } else {

        cart.push(product);

    }


    // Lưu vào localStorage
    localStorage.setItem(
        "helmetHopCart",
        JSON.stringify(cart)
    );


    // Cập nhật số lượng icon giỏ hàng
    updateCartCount();


    alert("Đã thêm sản phẩm vào giỏ hàng!");
}

function updateCartCount() {

    const cart =
        JSON.parse(
            localStorage.getItem("helmetHopCart")
        ) || [];


    const totalQuantity = cart.reduce(
        (total, item) =>
            total + Number(item.quantity),
        0
    );


    const cartCount =
        document.getElementById("cartCount");


    if (cartCount) {
        cartCount.textContent = totalQuantity;
    }
}

// =========================
// TÌM KIẾM
// =========================

function searchProduct() {

    const keyword = document
        .getElementById("searchInput")
        .value
        .trim();

    if (keyword === "") {

        alert("Vui lòng nhập tên sản phẩm cần tìm!");

        return;
    }

    alert("Bạn đang tìm kiếm: " + keyword);
}


// =========================
// ENTER ĐỂ TÌM KIẾM
// =========================

document
    .getElementById("searchInput")
    .addEventListener("keypress", function(event) {

        if (event.key === "Enter") {

            searchProduct();

        }

    });


// =========================
// HEART
// =========================

const hearts = document.querySelectorAll(".heart");

hearts.forEach(function(heart) {

    heart.addEventListener("click", function() {

        if (heart.textContent === "♡") {

            heart.textContent = "♥";

        } else {

            heart.textContent = "♡";

        }

    });

});

document.addEventListener(
    "DOMContentLoaded",
    function () {

        updateCartCount();

    }
);