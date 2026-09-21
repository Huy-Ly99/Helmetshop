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

// ===============================
// CART API
// ===============================

// Tạo giỏ hàng mới
app.post("/api/cart", async (req, res) => {
    try {
        const crypto = require("crypto");

        const cartToken = crypto.randomBytes(32).toString("hex");

        const result = await pool.query(
            `INSERT INTO public.carts (cart_token)
             VALUES ($1)
             RETURNING *`,
            [cartToken]
        );

        res.status(201).json({
            message: "Tạo giỏ hàng thành công!",
            cart: result.rows[0]
        });

    } catch (error) {
        console.error("Create cart error:", error);

        res.status(500).json({
            message: "Không thể tạo giỏ hàng",
            error: error.message
        });
    }
});

app.post("/api/cart/items", async (req, res) => {
    try {
        const { cartToken, productId, quantity } = req.body;

        if (!cartToken || !productId || !quantity) {
            return res.status(400).json({
                message: "Thiếu cartToken, productId hoặc quantity."
            });
        }

        // 1. Tìm giỏ hàng
        const cartResult = await pool.query(
            `SELECT id
             FROM public.carts
             WHERE cart_token = $1`,
            [cartToken]
        );

        if (cartResult.rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy giỏ hàng."
            });
        }

        const cartId = cartResult.rows[0].id;

        // 2. Tìm sản phẩm
        const productResult = await pool.query(
            `SELECT id, name, price, stock, image
             FROM public.products
             WHERE id = $1`,
            [productId]
        );

        if (productResult.rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm."
            });
        }

        const product = productResult.rows[0];

        // 3. Kiểm tra số lượng
        if (quantity <= 0) {
            return res.status(400).json({
                message: "Số lượng phải lớn hơn 0."
            });
        }

        if (quantity > product.stock) {
            return res.status(400).json({
                message: `Sản phẩm chỉ còn ${product.stock} cái.`
            });
        }

        // 4. Thêm vào giỏ
        const result = await pool.query(
            `INSERT INTO public.cart_items
                (cart_id, product_id, quantity)
             VALUES ($1, $2, $3)
             ON CONFLICT (cart_id, product_id)
             DO UPDATE SET
                quantity = public.cart_items.quantity + EXCLUDED.quantity,
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [cartId, productId, quantity]
        );

        // 5. Kiểm tra tổng số lượng sau khi thêm
        const finalQuantity = result.rows[0].quantity;

        if (finalQuantity > product.stock) {
            // Nếu vượt tồn kho thì rollback bằng cách xóa lại phần vừa cộng
            await pool.query(
                `UPDATE public.cart_items
                 SET quantity = quantity - $1,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE cart_id = $2
                   AND product_id = $3`,
                [quantity, cartId, productId]
            );

            return res.status(400).json({
                message: `Không thể thêm. Trong kho chỉ còn ${product.stock} cái.`
            });
        }

        res.status(201).json({
            message: "Đã thêm sản phẩm vào giỏ hàng!",
            cartItem: result.rows[0]
        });

    } catch (error) {
        console.error("Add cart item error:", error);

        res.status(500).json({
            message: "Không thể thêm sản phẩm vào giỏ hàng.",
            error: error.message
        });
    }
});

// ========================================
// CẬP NHẬT SỐ LƯỢNG CART ITEM
// ========================================

app.put("/api/cart/items/:id", async (req, res) => {

    try {

        const itemId = Number(req.params.id);

        const { cartToken, quantity } = req.body;


        if (!itemId || !cartToken || quantity === undefined) {

            return res.status(400).json({
                message: "Thiếu itemId, cartToken hoặc quantity."
            });

        }


        const newQuantity = Number(quantity);


        if (!Number.isInteger(newQuantity) || newQuantity < 1) {

            return res.status(400).json({
                message: "Số lượng phải là số nguyên lớn hơn 0."
            });

        }


        // ========================================
        // KIỂM TRA CART
        // ========================================

        const cartResult = await pool.query(
            `
            SELECT id
            FROM public.carts
            WHERE cart_token = $1
            `,
            [cartToken]
        );


        if (cartResult.rows.length === 0) {

            return res.status(404).json({
                message: "Không tìm thấy giỏ hàng."
            });

        }


        const cartId = cartResult.rows[0].id;


        // ========================================
        // KIỂM TRA CART ITEM + STOCK
        // ========================================

        const itemResult = await pool.query(
            `
            SELECT
                ci.id,
                ci.product_id,
                p.name,
                p.stock
            FROM public.cart_items ci

            JOIN public.products p
                ON p.id = ci.product_id

            WHERE ci.id = $1
              AND ci.cart_id = $2
            `,
            [itemId, cartId]
        );


        if (itemResult.rows.length === 0) {

            return res.status(404).json({
                message: "Không tìm thấy sản phẩm trong giỏ hàng."
            });

        }


        const item = itemResult.rows[0];


        // ========================================
        // KIỂM TRA TỒN KHO
        // ========================================

        if (newQuantity > item.stock) {

            return res.status(400).json({
                message:
                    `Sản phẩm "${item.name}" chỉ còn ${item.stock} cái.`
            });

        }


        // ========================================
        // UPDATE
        // ========================================

        const result = await pool.query(
            `
            UPDATE public.cart_items

            SET
                quantity = $1,
                updated_at = CURRENT_TIMESTAMP

            WHERE id = $2
              AND cart_id = $3

            RETURNING *
            `,
            [
                newQuantity,
                itemId,
                cartId
            ]
        );


        res.json({

            message: "Cập nhật số lượng thành công!",

            cartItem: result.rows[0]

        });


    } catch (error) {

        console.error(
            "Update cart item error:",
            error
        );


        res.status(500).json({

            message:
                "Không thể cập nhật số lượng.",

            error:
                error.message

        });

    }

});

// ========================================
// XÓA CART ITEM
// ========================================

app.delete("/api/cart/items/:id", async (req, res) => {

    try {

        const itemId = Number(req.params.id);

        const { cartToken } = req.body;


        if (!itemId || !cartToken) {

            return res.status(400).json({
                message: "Thiếu itemId hoặc cartToken."
            });

        }


        // ========================================
        // TÌM CART
        // ========================================

        const cartResult = await pool.query(
            `
            SELECT id
            FROM public.carts
            WHERE cart_token = $1
            `,
            [cartToken]
        );


        if (cartResult.rows.length === 0) {

            return res.status(404).json({
                message: "Không tìm thấy giỏ hàng."
            });

        }


        const cartId = cartResult.rows[0].id;


        // ========================================
        // XÓA ITEM
        // ========================================

        const result = await pool.query(
            `
            DELETE FROM public.cart_items

            WHERE id = $1
              AND cart_id = $2

            RETURNING *
            `,
            [
                itemId,
                cartId
            ]
        );


        if (result.rows.length === 0) {

            return res.status(404).json({
                message:
                    "Không tìm thấy sản phẩm trong giỏ hàng."
            });

        }


        res.json({

            message:
                "Đã xóa sản phẩm khỏi giỏ hàng!",

            cartItem:
                result.rows[0]

        });


    } catch (error) {

        console.error(
            "Delete cart item error:",
            error
        );


        res.status(500).json({

            message:
                "Không thể xóa sản phẩm.",

            error:
                error.message

        });

    }

});

app.get("/api/cart/:cartToken", async (req, res) => {
    try {
        const { cartToken } = req.params;

        // 1. Tìm cart
        const cartResult = await pool.query(
            `SELECT id, cart_token
             FROM public.carts
             WHERE cart_token = $1`,
            [cartToken]
        );

        if (cartResult.rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy giỏ hàng."
            });
        }

        const cart = cartResult.rows[0];

        // 2. Lấy sản phẩm trong cart
        const itemsResult = await pool.query(
            `SELECT
                ci.id,
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.image,
                p.stock,
                (p.price * ci.quantity) AS subtotal
             FROM public.cart_items ci
             JOIN public.products p
                ON ci.product_id = p.id
             WHERE ci.cart_id = $1
             ORDER BY ci.id`,
            [cart.id]
        );

        // 3. Tính tổng tiền
        const total = itemsResult.rows.reduce(
            (sum, item) => {
                return sum + Number(item.subtotal);
            },
            0
        );

        res.json({
            message: "Lấy giỏ hàng thành công!",
            cart: {
                id: cart.id,
                cartToken: cart.cart_token,
                items: itemsResult.rows,
                total: total
            }
        });

    } catch (error) {
        console.error("Get cart error:", error);

        res.status(500).json({
            message: "Không thể lấy giỏ hàng.",
            error: error.message
        });
    }
});

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
// CREATE ORDER
// ========================================

app.post("/api/orders", async (req, res) => {

    const client = await pool.connect();

    try {

        const {
            customerName,
            phone,
            address,
            cartToken
        } = req.body;


        // ========================================
        // VALIDATE CUSTOMER
        // ========================================

        if (!customerName || !phone || !address) {

            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin khách hàng."
            });

        }


        // ========================================
        // CHECK CART TOKEN
        // ========================================

        if (!cartToken) {

            return res.status(400).json({
                message: "Không tìm thấy giỏ hàng."
            });

        }


        await client.query("BEGIN");


        // ========================================
        // LẤY GIỎ HÀNG
        // ========================================

        const cartResult = await client.query(
            `
            SELECT id
            FROM public.carts
            WHERE cart_token = $1
            `,
            [cartToken]
        );


        if (cartResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Không tìm thấy giỏ hàng."
            });

        }


        const cartId = cartResult.rows[0].id;


        // ========================================
        // LẤY SẢN PHẨM TRONG GIỎ
        // ========================================

        const cartItemsResult = await client.query(
            `
            SELECT
                ci.product_id,
                ci.quantity,
                p.name,
                p.price,
                p.stock

            FROM public.cart_items ci

            JOIN public.products p
                ON p.id = ci.product_id

            WHERE ci.cart_id = $1
            `,
            [cartId]
        );


        if (cartItemsResult.rows.length === 0) {

            await client.query("ROLLBACK");

            return res.status(400).json({
                message: "Giỏ hàng đang trống."
            });

        }


        // ========================================
        // TÍNH TỔNG TIỀN
        // ========================================

        let totalAmount = 0;


        for (const item of cartItemsResult.rows) {

            if (item.quantity > item.stock) {

                await client.query("ROLLBACK");

                return res.status(400).json({
                    message:
                        `Sản phẩm "${item.name}" không đủ số lượng trong kho.`
                });

            }


            const subtotal =
                Number(item.price) *
                Number(item.quantity);


            totalAmount += subtotal;

        }


        // ========================================
        // TẠO ORDER
        // ========================================

        const orderResult = await client.query(
            `
            INSERT INTO public.orders
            (
                customer_name,
                phone,
                address,
                total_amount,
                contact_status
            )

            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                'PENDING'
            )

            RETURNING *
            `,
            [
                customerName.trim(),
                phone.trim(),
                address.trim(),
                totalAmount
            ]
        );


        const order = orderResult.rows[0];


        // ========================================
        // TẠO ORDER ITEMS
        // ========================================

        for (const item of cartItemsResult.rows) {

            const subtotal =
                Number(item.price) *
                Number(item.quantity);


            await client.query(
                `
                INSERT INTO public.order_items
                (
                    order_id,
                    product_id,
                    product_name,
                    price,
                    quantity,
                    subtotal
                )

                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6
                )
                `,
                [
                    order.id,
                    item.product_id,
                    item.name,
                    item.price,
                    item.quantity,
                    subtotal
                ]
            );

        }


        // ========================================
        // XÓA GIỎ HÀNG
        // ========================================

        await client.query(
            `
            DELETE FROM public.cart_items
            WHERE cart_id = $1
            `,
            [cartId]
        );


        await client.query("COMMIT");


        // ========================================
        // RESPONSE
        // ========================================

        res.status(201).json({

            message: "Đặt hàng thành công!",

            order: {
                id: order.id,
                customer_name: order.customer_name,
                phone: order.phone,
                address: order.address,
                total_amount: order.total_amount,
                contact_status: order.contact_status,
                created_at: order.created_at
            }

        });


    } catch (error) {

        await client.query("ROLLBACK");

        console.error("Create order error:", error);

        res.status(500).json({

            message: "Không thể tạo đơn hàng.",

            error: error.message

        });

    } finally {

        client.release();

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

// ========================================
// ADMIN - GET ALL ORDERS
// ========================================

app.get("/api/admin/orders", requireAdmin, async (req, res) => {

    try {

        // Lấy danh sách đơn hàng
        const ordersResult = await pool.query(`
            SELECT
                id,
                customer_name,
                phone,
                address,
                total_amount,
                contact_status,
                created_at
            FROM public.orders
            ORDER BY
    CASE
        WHEN contact_status = 'PENDING' THEN 0
        WHEN contact_status = 'CONTACTED' THEN 1
        WHEN contact_status = 'PAID' THEN 2
        WHEN contact_status = 'EXCHANGE' THEN 3
        WHEN contact_status = 'RETURN' THEN 4
        WHEN contact_status = 'CANCELLED' THEN 5
        ELSE 6
    END,
    created_at DESC

        `);


        // Lấy sản phẩm của từng đơn
        const orders = [];

        for (const order of ordersResult.rows) {

            const itemsResult = await pool.query(`
                SELECT
                    id,
                    product_id,
                    product_name,
                    price,
                    quantity,
                    subtotal
                FROM public.order_items
                WHERE order_id = $1
                ORDER BY id
            `, [order.id]);


            orders.push({
                ...order,
                items: itemsResult.rows
            });
        }


        res.json({
            message: "Lấy danh sách đơn hàng thành công.",
            orders: orders
        });


    } catch (error) {

        console.error(
            "Get admin orders error:",
            error
        );

        res.status(500).json({
            message: "Không thể lấy danh sách đơn hàng.",
            error: error.message
        });
    }

});

// ========================================
// ADMIN - UPDATE ORDER CONTACT STATUS
// ========================================

app.patch(
    "/api/admin/orders/:id/status",
    requireAdmin,
    async (req, res) => {
        try {
            const orderId = Number(req.params.id);
            const { contactStatus } = req.body;

            if (!orderId) {
                return res.status(400).json({
                    message: "Order ID không hợp lệ."
                });
            }

            const allowedStatuses = [
                "PENDING",
                "CONTACTED",
                "PAID",
                "CANCELLED",
                "EXCHANGE",
                "RETURN"
            ];

            if (!allowedStatuses.includes(contactStatus)) {
                return res.status(400).json({
                    message: "Trạng thái không hợp lệ."
                });
            }

            const result = await pool.query(`
                UPDATE public.orders
                SET contact_status = $1
                WHERE id = $2
                RETURNING *
            `, [
                contactStatus,
                orderId
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message: "Không tìm thấy đơn hàng."
                });
            }

            res.json({
                message: "Cập nhật trạng thái đơn hàng thành công.",
                order: result.rows[0]
            });

        } catch (error) {

            console.error(
                "Update order status error:",
                error
            );

            res.status(500).json({
                message: "Không thể cập nhật trạng thái đơn hàng.",
                error: error.message
            });
        }
    }
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

app.delete(
    "/api/admin/orders/:id",
    requireAdmin,
    async (req, res) => {

        try {

            const orderId = Number(req.params.id);

            if (!orderId) {
                return res.status(400).json({
                    message: "Order ID không hợp lệ."
                });
            }

            const result = await pool.query(`
                DELETE FROM public.orders
                WHERE id = $1
                AND contact_status = 'REFUNDED'
                RETURNING id
            `, [orderId]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    message:
                        "Chỉ được xóa đơn hàng sau khi đã hoàn tiền."
                });
            }

            res.json({
                message: "Đã xóa đơn hàng.",
                orderId: result.rows[0].id
            });

        } catch (error) {

            console.error(
                "Delete order error:",
                error
            );

            res.status(500).json({
                message: "Không thể xóa đơn hàng.",
                error: error.message
            });
        }
    }
);


// =========================
// START SERVER
// =========================

app.listen(PORT, () => {
    console.log(
        `HelmetShop Server đang chạy tại https://helmetshop-986y.onrender.com/api/products`
    );
});

app.get("/api/products/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT *
             FROM public.products
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Không tìm thấy sản phẩm."
            });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error("Get product detail error:", error);

        res.status(500).json({
            message: "Không thể lấy thông tin sản phẩm.",
            error: error.message
        });
    }
});



