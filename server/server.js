const express = require("express");
const cors = require("cors");
const multer = require("multer");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");
const pool = require("./db");

const app = express();

const PORT = process.env.PORT || 3000;


// =========================
// MULTER - UPLOAD IMAGE
// =========================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "helmetshop",
        allowed_formats: ["jpg", "jpeg", "png", "webp"]
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});


// =========================
// MIDDLEWARE
// =========================

app.use(cors());
app.use(express.json());
app.post("/api/admin/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Vui lòng nhập email và mật khẩu."
            });
        }

        // Kiểm tra email
        if (email !== process.env.ADMIN_EMAIL) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không chính xác."
            });
        }

        // Kiểm tra password bằng bcrypt
        const passwordValid = await bcrypt.compare(
            password,
            process.env.ADMIN_PASSWORD_HASH
        );

        if (!passwordValid) {
            return res.status(401).json({
                message: "Email hoặc mật khẩu không chính xác."
            });
        }

        // Tạo JWT
        const token = jwt.sign(
            {
                email: email,
                role: "admin"
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "2h"
            }
        );

        res.json({
            message: "Đăng nhập Admin thành công!",
            token: token,
            admin: {
                email: email,
                role: "admin"
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Lỗi server."
        });
    }
});

// ========================================
// MIDDLEWARE KIỂM TRA ADMIN JWT
// ========================================

function requireAdmin(req, res, next) {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: "Bạn chưa đăng nhập."
        });
    }

    const token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

    if (!token) {
        return res.status(401).json({
            message: "Token không hợp lệ."
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (decoded.role !== "admin") {
            return res.status(403).json({
                message: "Bạn không có quyền Admin."
            });
        }

        req.admin = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Token hết hạn hoặc không hợp lệ."
        });
    }
}   

// =========================
// TEST SERVER
// =========================

app.get("/api/test", (req, res) => {
    res.json({
        message: "HelmetShop Server đang hoạt động!"
    });
});


// =========================
// TEST DATABASE
// =========================

app.get("/api/db-test", async (req, res) => {
    try {

        const result = await pool.query(
            "SELECT NOW()"
        );

        res.json({
            message: "Kết nối PostgreSQL thành công!",
            time: result.rows[0].now
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Kết nối PostgreSQL thất bại!",
            error: error.message
        });
    }
});


// =========================
// GET ALL PRODUCTS
// =========================

app.get("/api/products", async (req, res) => {
    try {

        const result = await pool.query(
            "SELECT * FROM public.products ORDER BY id"
        );

        res.json(result.rows);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Không thể lấy danh sách sản phẩm",
            error: error.message
        });
    }
});


// =========================
// ADD PRODUCT + IMAGE
// =========================

app.post(
    "/api/products",
    requireAdmin,
    upload.single("image"),
    async (req, res) => {

        try {

            const {
                name,
                category,
                price,
                stock,
                description
            } = req.body;

            let image = null;

            if (req.file) {
                image = req.file.path;
            }

            const result = await pool.query(
                `INSERT INTO public.products
                (name, category, price, stock, description, image)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *`,
                [
                    name,
                    category,
                    price,
                    stock,
                    description,
                    image
                ]
            );

            res.status(201).json({
                message: "Thêm sản phẩm thành công!",
                product: result.rows[0]
            });

        } catch (error) {

            console.error(error);

            res.status(500).json({
                message: "Không thể thêm sản phẩm",
                error: error.message
            });
        }
    }
);

// =========================
// UPDATE PRODUCT + IMAGE
// =========================

app.put(
    "/api/products/:id",
    requireAdmin,
    upload.single("image"),
    async (req, res) => {

        try {

            const { id } = req.params;
            console.log("PUT ID:", id);

            // Lấy sản phẩm cũ
            const oldProduct = await pool.query(
                "SELECT * FROM public.products WHERE id = $1",
                [id]
            );


            // Không tìm thấy sản phẩm
            if (oldProduct.rows.length === 0) {

                return res.status(404).json({
                message: "Không tìm thấy sản phẩm!"
                });

            }       
            
            // Lưu đường dẫn ảnh cũ
            const oldImage =
                oldProduct.rows[0].image;


            const {
                name,
                category,
                price,
                stock,
                description
            } = req.body;


            // Mặc định giữ ảnh cũ
            let image = oldImage;


            // Nếu có ảnh mới từ Cloudinary
            if (req.file) {
                image = req.file.path;

                console.log(
                    "Ảnh mới:",
                    image
                );
            }


            // Cập nhật database
            const result = await pool.query(
                `UPDATE public.products
                 SET
                    name = $1,
                    category = $2,
                    price = $3,
                    stock = $4,
                    description = $5,
                    image = $6,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = $7
                 RETURNING *`,
                [
                    name,
                    category,
                    price,
                    stock,
                    description,
                    image,
                    id
                ]
            )
            
            

            // =========================
            // 7. NẾU UPDATE DB THÀNH CÔNG
            //    THÌ XÓA ẢNH CŨ
            // =========================

            if (req.file && oldImage) {

                try {

                    // Lấy public_id từ URL Cloudinary
                    const parts =
                        oldImage.split("/");

                    const uploadIndex =
                        parts.indexOf("upload");


                    if (uploadIndex !== -1) {

                        let publicIdParts =
                            parts.slice(
                                uploadIndex + 1
                            );


                        // Bỏ version v123456 nếu có
                        if (
                            publicIdParts[0] &&
                            /^v\d+$/.test(
                                publicIdParts[0]
                            )
                        ) {

                            publicIdParts.shift();

                        }


                        // Ghép folder + tên file
                        let publicId =
                            publicIdParts.join("/");


                        // Bỏ extension .jpg/.png/.webp...
                        publicId =
                            publicId.replace(
                                /\.[^/.]+$/,
                                ""
                            );


                        console.log(
                            "Public ID ảnh cũ:",
                            publicId
                        );


                        // Xóa ảnh cũ trên Cloudinary
                        const deleteResult =
                            await cloudinary.uploader.destroy(
                                publicId
                            );


                        console.log(
                            "Kết quả xóa ảnh cũ:",
                            deleteResult
                        );

                    }

                } catch (deleteError) {

                    // Không làm hỏng việc update sản phẩm
                    // nếu xóa ảnh cũ gặp lỗi

                    console.error(
                        "Không thể xóa ảnh cũ trên Cloudinary:",
                        deleteError
                    );

                }

            }


            // =========================
            // 8. TRẢ KẾT QUẢ
            // =========================

            res.json({

                message:
                    "Cập nhật sản phẩm thành công!",

                product:
                    result.rows[0]

            });


        } catch (error) {

            console.error(error);


            res.status(500).json({

                message:
                    "Không thể cập nhật sản phẩm",

                error:
                    error.message

            });

        }

    }
);

app.delete("/api/products/:id", requireAdmin, async (req, res) => {

    try {

        const { id } = req.params;
        console.log("PUT ID:", id);
        const result = await pool.query(
            "DELETE FROM public.products WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                message: "Không tìm thấy sản phẩm!"
            });

        }

        res.json({
            message: "Xóa sản phẩm thành công!",
            product: result.rows[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Không thể xóa sản phẩm",
            error: error.message
        });

    }

});

// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
    console.log(
        `HelmetShop Server đang chạy tại https://helmetshop-986y.onrender.com/api/products`
    );
});