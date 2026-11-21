/* ═══════════════════════════════════════════════════════════════════════
   🎭  LOCKET AI FILTER MODIFIER — UNBLUR & COMMUNITY GOLD 👑
   ─────────────────────────────────────────────────────────────────────
   👤  Tác giả      :  ThaiDev09
   📡  Kênh cập nhật:  github.com/ThaiDev09/locketgold_tool
   🧩  Hỗ trợ       :  Shadowrocket • Loon • Surge • Quantumult X
   💎  Phiên bản    :  Fixed & Full Unlock
   ─────────────────────────────────────────────────────────────────────
   ⬇️  REQUEST  : Giả lập US • Xóa cache 304 • Tùy biến Prompt AI
   ⬆️  RESPONSE : Cấp Gold • Mở khóa Sticker/Filter • Unblur ảnh
   ═══════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────────  ⚙️  CẤU HÌNH  ───────────────────────────── */

// Khóa lưu trữ trong bộ nhớ thiết bị
const VIP_STORE_KEY = "LOCKET_VIP_COMMUNITY";
const SELF_UID_KEY = "LOCKET_SELF_UID";
const SELF_USERNAME_KEY = "LOCKET_SELF_USERNAME";

// Danh sách VIP mặc định (username Locket — không phân biệt hoa/thường)
const BASE_VIP_USERS = ["thaidev09"];


/* ───────────────────────────  🛠️  HÀM TIỆN ÍCH  ─────────────────────────── */

/**
 * 🏅 Gán toàn bộ cờ Gold + huy hiệu vào một đối tượng
 * → Dùng để "biến" user thành Gold VIP trong mắt ứng dụng
 */
function applyGoldBadge(target) {
    if (!target || typeof target !== "object") return;
    target.badge = "locket_gold";
    target.is_gold = true;
    target.has_gold = true;
    target.gold = true;
    target.gold_subscription = true;
    target.has_gold_subscription = true;
    target.tier = "gold";
    target.subscription_status = "active";
}

/**
 * 🔍 Kiểm tra đa chiều xem một node có thuộc danh sách VIP hay không
 * → Quét mọi trường có thể chứa UID / username (kể cả object lồng nhau)
 * → Trả về true nếu khớp bất kỳ giá trị nào trong vSet
 */
function isNodeVip(target, vSet) {
    if (!target || typeof target !== "object") return false;

    const candidates = [
        // Cấp gốc
        target.uid, target.user_id, target.id,
        target.friend_uid, target.friend_id, target.friendId, target.userId,
        target.username, target.friend_username,
        target.display_name, target.first_name, target.name,
        // Object con: user.*
        target.user?.uid, target.user?.id, target.user?.user_id,
        target.user?.username, target.user?.friend_username,
        target.user?.display_name, target.user?.first_name, target.user?.name,
        // Object con: friend.*
        target.friend?.uid, target.friend?.id,
        target.friend?.username, target.friend?.first_name
    ];

    for (const c of candidates) {
        if (c && typeof c === "string") {
            const clean = c.toLowerCase().trim();
            if (clean && vSet.has(clean)) return true;
        }
    }
    return false;
}


/* ═══════════════════════════════════════════════════════════════════════
   ⬇️  CHIỀU REQUEST  —  Chạy khi app gửi yêu cầu lên server
   ─────────────────────────────────────────────────────────────────────
   • Xóa header cache (If-None-Match, If-Modified-Since, ETag)
     → Ép server trả về dữ liệu mới thay vì 304 Not Modified
   • Giả lập vị trí US để mở khóa tính năng AI / Filter theo khu vực
   ═══════════════════════════════════════════════════════════════════════ */
if (typeof $response === "undefined") {
    const headers = Object.assign({}, $request.headers || {});

    // 🧹 Xóa các header cache gây 304
    for (const k of Object.keys(headers)) {
        const low = k.toLowerCase();
        if (low === "if-none-match" ||
            low === "if-modified-since" ||
            low === "x-revenuecat-etag") {
            delete headers[k];
        }
    }

    // 🌎 Giả lập vị trí US
    headers["X-App-Region"] = "US";
    headers["X-Country-Code"] = "US";
    headers["X-Device-Country"] = "US";
    headers["X-Timezone"] = "America/Los_Angeles";

    $done({ headers, body: $request.body });
}


/* ═══════════════════════════════════════════════════════════════════════
   ⬆️  CHIỀU RESPONSE  —  Chạy khi server trả dữ liệu về app
   ─────────────────────────────────────────────────────────────────────
   1. Bắt lỗi 402 / 403 / 400 → đổi thành 200 kèm dữ liệu giả mở khóa
   2. Duyệt toàn bộ JSON, phân loại từng node:
        • Tài khoản chính (Self)      → Cấp Gold + mở khóa mọi tính năng
        • Bạn bè VIP trong danh sách  → Cấp viền vàng + tim vàng 💛
        • Các node khác               → Gỡ cờ khóa, unblur ảnh
   3. Lưu UID/username của Self vào bộ nhớ để lần sau nhận diện nhanh
   ═══════════════════════════════════════════════════════════════════════ */
else {
    let body = $response.body;
    let status = $response.status || $response.statusCode || 200;

    // ⚙️ Đọc tham số người dùng (nếu có) để bật chế độ "tất cả bạn bè đều Gold"
    const customArg = (typeof $argument === "string" && $argument.trim())
        ? $argument.trim().toLowerCase() : "";
    const unlockAllFriends = customArg.includes("all_friends=true")
        || customArg.includes("gold_all=true");

    // 📦 Nạp danh sách VIP từ bộ nhớ + UID/username của bản thân
    const vipSet = new Set(BASE_VIP_USERS.map(u => String(u).toLowerCase().trim()));

    if (typeof $persistentStore !== "undefined") {
        try {
            const rawVip = $persistentStore.read(VIP_STORE_KEY);
            if (rawVip) {
                const list = JSON.parse(rawVip);
                if (Array.isArray(list)) {
                    for (const id of list) {
                        if (id) vipSet.add(String(id).toLowerCase().trim());
                    }
                }
            }
            const myUid = $persistentStore.read(SELF_UID_KEY);
            if (myUid) vipSet.add(String(myUid).toLowerCase().trim());

            const myUname = $persistentStore.read(SELF_USERNAME_KEY);
            if (myUname) vipSet.add(String(myUname).toLowerCase().trim());
        } catch (e) { /* bỏ qua lỗi đọc */ }
    }

    /* ───────────────────────  🔧 XỬ LÝ JSON  ─────────────────────── */
    if (body && typeof body === "string") {
        try {
            let obj = JSON.parse(body);

            // 🚫 Gỡ mã lỗi 402/403/400 — trả về 200 với dữ liệu mở khóa
            if (status === 402 || status === 403 || status === 400 || (obj && obj.error)) {
                status = 200;
                if (obj && obj.error) {
                    obj = {
                        result: {
                            status: 200,
                            is_gold: true,
                            is_locked: false,
                            requires_gold: false,
                            unlocked: true,
                            data: obj.error.details || {}
                        }
                    };
                }
            }

            /**
             * 🔁 Hàm đệ quy duyệt toàn bộ cây JSON
             * → Tự động nhận diện Self / VIP / item và áp dụng thay đổi
             */
            function transformNode(node) {
                if (!node || typeof node !== "object") return;

                // Mảng → duyệt từng phần tử
                if (Array.isArray(node)) {
                    for (let i = 0; i < node.length; i++) transformNode(node[i]);
                    return;
                }

                // 🧐 Nhận diện tài khoản chính (Self) qua các trường đặc trưng
                const isSelf = ("email" in node) ||
                    ("phone_number" in node) ||
                    ("push_token" in node) ||
                    ("fcm_token" in node) ||
                    ("can_use_filters" in node) ||
                    ("can_use_gold_features" in node);

                if (isSelf) {
                    /* 👑 SELF — Cấp Gold + mở khóa toàn diện */
                    applyGoldBadge(node);

                    node.can_use_filters = true;
                    node.can_use_gold_features = true;
                    node.can_generate_filtered_image = true;
                    node.can_create_filtered_image = true;
                    node.has_ai_access = true;
                    node.filter_access = true;
                    node.can_use_stickers = true;
                    node.sticker_access = true;
                    node.unlimited_stickers = true;

                    // 💾 Lưu UID & username để lần sau nhận diện nhanh
                    const uid = String(node.uid || node.user_id || node.id || "").toLowerCase().trim();
                    const username = String(node.username || "").toLowerCase().trim();

                    if (typeof $persistentStore !== "undefined") {
                        if (uid) $persistentStore.write(uid, SELF_UID_KEY);
                        if (username) $persistentStore.write(username, SELF_USERNAME_KEY);
                    }
                    if (uid) vipSet.add(uid);
                    if (username) vipSet.add(username);

                } else {
                    /* 💛 BẠN BÈ — Cấp viền vàng nếu thuộc danh sách VIP */
                    const isVipFriend = unlockAllFriends || isNodeVip(node, vipSet);

                    if (isVipFriend) {
                        applyGoldBadge(node);
                        if (node.user && typeof node.user === "object") applyGoldBadge(node.user);
                        if (node.friend && typeof node.friend === "object") applyGoldBadge(node.friend);
                    }
                }

                /* 🔓 Gỡ cờ khóa / paywall / che mờ trên mọi node */
                const FALSE_FLAGS = [
                    "is_locked", "locked", "requires_gold", "require_gold",
                    "gold_only", "is_gold_only", "paywall", "show_paywall",
                    "show_upsell", "upsell", "blurred", "is_blurred", "needs_gold"
                ];
                for (const f of FALSE_FLAGS) {
                    if (f in node) node[f] = false;
                }

                /* ✅ Bật các cờ mở khóa / cho phép sử dụng */
                const TRUE_FLAGS = [
                    "can_view", "unlocked", "is_unlocked", "is_free", "free",
                    "can_use_filter", "allowed", "can_use_filters", "can_use_stickers",
                    "sticker_access", "is_available", "enabled"
                ];
                for (const t of TRUE_FLAGS) {
                    if (t in node) node[t] = true;
                }

                /* 🎁 Item sticker / filter cụ thể → ép mở khóa */
                if ("item_type" in node ||
                    "sticker_id" in node ||
                    "filter_id" in node) {
                    node.is_locked = false;
                    node.requires_gold = false;
                    node.unlocked = true;
                    node.is_free = true;
                }

                /* 🖼️ UNBLUR — thay URL mờ bằng URL ảnh gốc (nếu có) */
                const clearUrl = node.unblurred_url ||
                    node.unlocked_url ||
                    node.result_url ||
                    node.image_url ||
                    node.transformed_image_url ||
                    node.url;

                if (clearUrl && typeof clearUrl === "string" && clearUrl.startsWith("http")) {
                    if ("blurred_url" in node) node.blurred_url = clearUrl;
                    if ("blurred_image_url" in node) node.blurred_image_url = clearUrl;
                    if ("preview_url" in node && node.is_blurred) {
                        node.preview_url = clearUrl;
                    }
                }

                /* 🔁 Đệ quy các object con (bỏ qua cờ hiệu để tránh ghi đè) */
                for (const k of Object.keys(node)) {
                    if (k === "badge" || k === "is_gold" || k === "has_gold" ||
                        k === "tier" || k === "gold") continue;

                    if (vipSet.has(k.toLowerCase().trim()) &&
                        node[k] && typeof node[k] === "object") {
                        applyGoldBadge(node[k]);
                    }
                    transformNode(node[k]);
                }
            }

            transformNode(obj);
            body = JSON.stringify(obj);

        } catch (e) { /* body không phải JSON hợp lệ → giữ nguyên */ }
    }

    /* ───────────────────────  📤 TRẢ KẾT QUẢ  ─────────────────────── */
    $done({
        status,
        headers: Object.assign({}, ($response && $response.headers) || {}, {
            "content-type": "application/json"
        }),
        body
    });
}
