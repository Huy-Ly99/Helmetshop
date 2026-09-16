// ========================================
// ADMIN LOGIN
// ========================================

function adminLogin() {

    // Lấy dữ liệu từ form
    const email = document
        .getElementById("email")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    const errorMessage =
        document.getElementById("errorMessage");


    // Xóa thông báo cũ
    errorMessage.textContent = "";


    // ========================================
    // KIỂM TRA BỎ TRỐNG
    // ========================================

    if (email === "") {

        errorMessage.textContent =
            "Vui lòng nhập email.";

        return;
    }


    if (password === "") {

        errorMessage.textContent =
            "Vui lòng nhập mật khẩu.";

        return;
    }


    // ========================================
    // TÀI KHOẢN DEMO
    // ========================================

    const adminEmail =
        "admin@helmetshop.com";

    const adminPassword =
        "Admin@123";


    // ========================================
    // KIỂM TRA LOGIN
    // ========================================

    if (
        email === adminEmail &&
        password === adminPassword
    ) {

        // Lưu trạng thái đăng nhập
        localStorage.setItem(
            "adminLoggedIn",
            "true"
        );

        localStorage.setItem(
            "adminEmail",
            email
        );


        // Chuyển sang Dashboard
        window.location.href =
            "dashboard.html";

    } else {

        errorMessage.textContent =
            "Email hoặc mật khẩu không chính xác.";

    }

}


// ========================================
// HIỆN / ẨN PASSWORD
// ========================================

document
    .getElementById("showPassword")
    .addEventListener(
        "click",
        function () {

            const password =
                document.getElementById("password");

            if (password.type === "password") {

                password.type = "text";

                this.textContent = "🙈";

            } else {

                password.type = "password";

                this.textContent = "👁";

            }

        }
    );


// ========================================
// ENTER ĐỂ LOGIN
// ========================================

document
    .getElementById("password")
    .addEventListener(
        "keypress",
        function (event) {

            if (event.key === "Enter") {

                adminLogin();

            }

        }
    );