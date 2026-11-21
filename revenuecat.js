/* ═══════════════════════════════════════════════════════════════════════
   🎭  LOCKET — GOLD + FILTER PACK UNLOCKER 👑
   ─────────────────────────────────────────────────────────────────────
   👤  Tác giả     :  ThaiDev09
   📡  Định danh   :  RevenueCat Subscriber (subscriber.subscriptions)
   🧩  Hỗ trợ      :  Loon • Quantumult X • Surge • Shadowrocket
   ─────────────────────────────────────────────────────────────────────
   ✦ Giả lập subscription Gold đã mua (ownership_type = PURCHASED)
   ✦ Cấp entitlement Gold với hạn dùng ~9999 (vĩnh viễn)
   ✦ (Tuỳ chọn) Mở khóa Filter Pack nếu bật block §2
   ═══════════════════════════════════════════════════════════════════════ */


/* ─────────────────────────  🔧 KHỞI TẠO  ───────────────────────── */
const obj = JSON.parse($response.body);

obj.Attention = "Chúc mừng bạn! Vui lòng không sử dụng cho mục đích thương mại!";

// 📅 Mốc thời gian: hạn "vĩnh viễn" (9999) & ngày mua trong quá khứ
const FAR_FUTURE = "9999-01-09T10:10:14Z";
const PAST = "2026-10-25T10:10:14Z";


/* ───────────────────────  🛠️  HÀM TIỆN ÍCH  ─────────────────────── */

/**
 * 💳 Tạo một object subscription giả (đã mua, không bao giờ hết hạn)
 * → Dùng cho `obj.subscriber.subscriptions[productId]`
 */
function makeSub(productId, priceAmount, priceCurrency) {
    return {
        auto_resume_date: null,
        display_name: productId,
        is_sandbox: true,
        ownership_type: "PURCHASED",         // ← điểm mấu chốt
        billing_issues_detected_at: null,
        management_url: "https://apps.apple.com/account/subscriptions",
        period_type: "normal",
        price: { amount: priceAmount, currency: priceCurrency },
        expires_date: FAR_FUTURE,
        grace_period_expires_date: null,
        refunded_at: null,
        unsubscribe_detected_at: null,
        original_purchase_date: PAST,
        purchase_date: PAST,
        store: "app_store",
        store_transaction_id: "2000001108724193"
    };
}

/**
 * 🏅 Tạo object entitlement tương ứng
 * → Dùng cho `obj.subscriber.entitlements[entitlementId]`
 */
function makeEnt(productId) {
    return {
        grace_period_expires_date: null,
        purchase_date: PAST,
        product_identifier: productId,
        expires_date: FAR_FUTURE
    };
}


/* ─────────────────────  📦 CHUẨN BỊ CONTAINER  ───────────────────── */
obj.subscriber = obj.subscriber || {};
obj.subscriber.subscriptions = obj.subscriber.subscriptions || {};
obj.subscriber.entitlements = obj.subscriber.entitlements || {};


/* ═══════════════════════════════════════════════════════════════════════
   §1  👑  MỞ KHÓA LOCKET GOLD
   ─────────────────────────────────────────────────────────────────────
   • Gói: locket_1600_1y (1 năm — thực tế giả lập vĩnh viễn)
   • Giá: 399,000 VND
   • Entitlement: "Gold"
   ═══════════════════════════════════════════════════════════════════════ */
const goldProduct = "locket_1600_1y";
obj.subscriber.subscriptions[goldProduct] = makeSub(goldProduct, 399000.0, "VND");
obj.subscriber.entitlements["Gold"] = makeEnt(goldProduct);


/* ═══════════════════════════════════════════════════════════════════════
   §2  🎨  (TUỲ CHỌN) MỞ KHÓA FILTER PACK
   ─────────────────────────────────────────────────────────────────────
   ⚠️ Muốn bật pack nào → bỏ comment (//) ở pack đó.
   → Filter pack 10 ảnh và 20 ảnh, giá giả lập 0 USD.
   ═══════════════════════════════════════════════════════════════════════ */
// const pack10Product = "com.locket.Locket.FilterPack_10Photos_400";
// obj.subscriber.subscriptions[pack10Product] = makeSub(pack10Product, 0.0, "USD");
// obj.subscriber.entitlements["effect_pack_10"] = makeEnt(pack10Product);

// const pack20Product = "com.locket.Locket.FilterPack_20Photos_500";
// obj.subscriber.subscriptions[pack20Product] = makeSub(pack20Product, 0.0, "USD");
// obj.subscriber.entitlements["effect_pack_20"] = makeEnt(pack20Product);


/* ─────────────────────────  📤 TRẢ KẾT QUẢ  ───────────────────────── */
$done({ body: JSON.stringify(obj) });
