let cartCount = 0;


// =========================
// THÊM VÀO GIỎ HÀNG
// =========================

function addToCart() {

    cartCount++;

    document.getElementById("cartCount").textContent = cartCount;

    alert("Đã thêm sản phẩm vào giỏ hàng!");
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