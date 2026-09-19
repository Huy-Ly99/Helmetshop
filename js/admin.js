
// ========================================
// ADMIN LOGIN
// ========================================

async function adminLogin() {

    const email = document
        .getElementById("email")
        .value
        .trim();

    const password = document
        .getElementById("password")
        .value;

    const errorMessage =
        document.getElementById("errorMessage");

    // ========================================
    // XÓA THÔNG BÁO CŨ
    // ========================================

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
    // GỌI API LOGIN
    // ========================================

    try {

        const response = await fetch(
            "https://helmetshop-api.onrender.com/api/admin/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        // ========================================
        // LOGIN THẤT BẠI
        // ========================================

        if (!response.ok) {

            errorMessage.textContent =
                data.message ||
                "Đăng nhập thất bại.";

            return;
        }


        // ========================================
        // LOGIN THÀNH CÔNG
        // ========================================

        localStorage.setItem(
            "adminToken",
            data.token
        );

        localStorage.setItem(
            "adminEmail",
            data.admin.email
        );

        localStorage.setItem(
            "adminLoggedIn",
            "true"
        );


        // Chuyển sang Dashboard
        window.location.href =
            "dashboard.html";

    } catch (error) {

        console.error(error);

        errorMessage.textContent =
            "Không thể kết nối tới server.";
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