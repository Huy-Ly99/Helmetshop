// ========================================
// AUTH ADMIN - DÙNG CHUNG CHO CÁC TRANG
// ========================================

document.addEventListener("DOMContentLoaded", function () {

    const adminToken = localStorage.getItem("adminToken");
    const adminEmail = localStorage.getItem("adminEmail");

    // ========================================
    // ADMIN ĐANG ĐĂNG NHẬP
    // ========================================

    if (adminToken && adminEmail) {

        // Đổi "Tài khoản" thành "Admin"
        const accountLink =
            document.getElementById("accountLink");

        if (accountLink) {
            accountLink.href = "admin/dashboard.html";

const text = accountLink.querySelector("span");

if (text) {
    text.textContent = "Admin";
}
        }

        // Hiện avatar Admin
    const adminAvatar = document.getElementById("adminAvatar");

    if (adminAvatar) {
        adminAvatar.style.display = "block";
    }

        // Ẩn giỏ hàng nếu muốn Admin không sử dụng giỏ hàng
        const cartLink =
            document.getElementById("cartLink");

        if (cartLink) {
            cartLink.style.display = "none";
        }

        // Hiện nút đăng xuất nếu có
        const logoutLink =
            document.getElementById("logoutLink");

        if (logoutLink) {

            logoutLink.style.display = "block";

            logoutLink.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    localStorage.removeItem("adminToken");
                    localStorage.removeItem("adminEmail");
                    localStorage.removeItem("adminLoggedIn");

                    window.location.href =
                        "index.html";
                }
            );
        }
    }
});