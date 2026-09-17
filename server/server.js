const express = require("express");
const cors = require("cors");
const multer = require("multer");
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
    upload.single("image"),
    async (req, res) => {

        try {

            const { id } = req.params;


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


                return res.status(404).json({
                    message: "Không tìm thấy sản phẩm!"
                });

            


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


            res.json({

                message:
                    "Cập nhật sản phẩm thành công!",

                product:
                    result.rows[0]

            });


        } catch (error) {

            console.error(error)


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
        `HelmetShop Server đang chạy tại https://helmetshop-986y.onrender.com/api/products`
    );
});