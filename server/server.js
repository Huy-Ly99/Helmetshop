const express = require("express");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const pool = require("./db");

const app = express();

const PORT = process.env.PORT || 3000;


// =========================
// MULTER - UPLOAD IMAGE
// =========================

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "uploads"));
    },

    filename: function (req, file, cb) {
        const uniqueName =
            Date.now() + "-" + file.originalname;

        cb(null, uniqueName);
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

app.use(
    "/uploads",
    express.static(path.join(__dirname, "uploads"))
);


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
                image = "/uploads/" + req.file.filename;
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
    upload.single("image"),
    async (req, res) => {

        try {

            const { id } = req.params;


            // Lấy sản phẩm cũ
            const oldProduct = await pool.query(
                ""SELECT * FROM public.products WHERE id = $1"",
                [id]
            );


            // Không tìm thấy sản phẩm
            if (oldProduct.rows.length === 0) {

                // Nếu người dùng đã upload ảnh nhưng sản phẩm không tồn tại
                // thì xóa ảnh vừa upload để tránh file rác
                if (req.file) {

                    const uploadedImagePath =
                        path.join(
                            __dirname,
                            "uploads",
                            req.file.filename
                        );

                    if (fs.existsSync(uploadedImagePath)) {
                        fs.unlinkSync(uploadedImagePath);
                    }

                }


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


            // Nếu có ảnh mới
            if (req.file) {

                image =
                    "/uploads/" +
                    req.file.filename;

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
            );


            // Nếu có ảnh mới thì xóa ảnh cũ
            if (req.file && oldImage) {

                const oldImagePath =
                    path.join(
                        __dirname,
                        oldImage.replace("/uploads/", "uploads/")
                    );


                if (fs.existsSync(oldImagePath)) {

                    fs.unlinkSync(oldImagePath);

                }

            }


            res.json({

                message:
                    "Cập nhật sản phẩm thành công!",

                product:
                    result.rows[0]

            });


        } catch (error) {

            console.error(error);


            // Nếu database update lỗi nhưng ảnh mới
            // đã được upload thì xóa ảnh mới
            if (req.file) {

                const uploadedImagePath =
                    path.join(
                        __dirname,
                        "uploads",
                        req.file.filename
                    );


                if (fs.existsSync(uploadedImagePath)) {

                    fs.unlinkSync(uploadedImagePath);

                }

            }


            res.status(500).json({

                message:
                    "Không thể cập nhật sản phẩm",

                error:
                    error.message

            });

        }

    }
);

app.delete("/api/products/:id", async (req, res) => {

    try {

        const { id } = req.params;

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
        `HelmetShop Server đang chạy tại http://localhost:${PORT}`
    );
});