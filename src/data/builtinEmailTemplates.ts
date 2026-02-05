// Built-in email templates. Add more items here.
// For larger HTML, consider moving to public/email-templates/*.html and fetch at runtime.

export type BuiltinEmailTemplate = {
    id: string; // unique, stable id like "builtin_welcome"
    name: string;
    subject: string;
    thumbnail?: string | null; // path under public/ if any
    html: string; // inline small HTML for now
};

export const BUILTIN_EMAIL_TEMPLATES: BuiltinEmailTemplate[] = [
    {
        id: "builtin_quote",
        name: "Báo giá",
        subject: "Báo giá",
        thumbnail: null,
        html: "<table id=&quot;iz3b&quot;><tbody><tr><td id=&quot;iuif&quot;><div id=&quot;iyth&quot;><p data-start=&quot;253&quot; data-end=&quot;291&quot;>Kính gửi [Tên khách hàng/Quý khách],</p><p data-start=&quot;293&quot; data-end=&quot;428&quot;>Cảm ơn Quý khách đã quan tâm đến sản phẩm/dịch vụ của [Tên công ty].<br data-start=&quot;361&quot; data-end=&quot;364&quot;/>Chúng tôi xin gửi tới Quý khách bảng báo giá chi tiết như sau:</p><p data-start=&quot;430&quot; data-end=&quot;462&quot;><strong data-start=&quot;430&quot; data-end=&quot;460&quot;>Thông tin sản phẩm/dịch vụ</strong></p><ul data-start=&quot;463&quot; data-end=&quot;619&quot;><li data-start=&quot;463&quot; data-end=&quot;495&quot;><p data-start=&quot;465&quot; data-end=&quot;495&quot;>Tên sản phẩm: [Tên sản phẩm]</p></li><li data-start=&quot;496&quot; data-end=&quot;543&quot;><p data-start=&quot;498&quot; data-end=&quot;543&quot;>Mô tả: [Mô tả ngắn gọn tính năng/chức năng]</p></li><li data-start=&quot;544&quot; data-end=&quot;568&quot;><p data-start=&quot;546&quot; data-end=&quot;568&quot;>Số lượng: [Số lượng]</p></li><li data-start=&quot;569&quot; data-end=&quot;591&quot;><p data-start=&quot;571&quot; data-end=&quot;591&quot;>Đơn giá: [Đơn giá]</p></li><li data-start=&quot;592&quot; data-end=&quot;619&quot;><p data-start=&quot;594&quot; data-end=&quot;619&quot;>Thành tiền: [Tổng tiền]</p></li></ul><p data-start=&quot;621&quot; data-end=&quot;650&quot;><strong data-start=&quot;621&quot; data-end=&quot;648&quot;>Chính sách &amp; điều khoản</strong></p><ul data-start=&quot;651&quot; data-end=&quot;808&quot;><li data-start=&quot;651&quot; data-end=&quot;702&quot;><p data-start=&quot;653&quot; data-end=&quot;702&quot;>Thời gian giao hàng: [Ví dụ: 3–5 ngày làm việc]</p></li><li data-start=&quot;703&quot; data-end=&quot;734&quot;><p data-start=&quot;705&quot; data-end=&quot;734&quot;>Bảo hành: [Ví dụ: 12 tháng]</p></li><li data-start=&quot;735&quot; data-end=&quot;808&quot;><p data-start=&quot;737&quot; data-end=&quot;808&quot;>Thanh toán: [Ví dụ: Chuyển khoản 50% khi đặt hàng, 50% khi giao hàng]</p></li></ul><p data-start=&quot;810&quot; data-end=&quot;885&quot;>Nếu Quý khách có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua:</p><ul data-start=&quot;886&quot; data-end=&quot;941&quot;><li data-start=&quot;886&quot; data-end=&quot;914&quot;><p data-start=&quot;888&quot; data-end=&quot;914&quot;>Hotline: [Số điện thoại]</p></li><li data-start=&quot;915&quot; data-end=&quot;941&quot;><p data-start=&quot;917&quot; data-end=&quot;941&quot;>Email: [Email công ty]</p></li></ul><p data-start=&quot;943&quot; data-end=&quot;982&quot;>Rất mong được hợp tác cùng Quý khách.</p><p data-start=&quot;984&quot; data-end=&quot;1049&quot;>Trân trọng,<br data-start=&quot;995&quot; data-end=&quot;998&quot;/>[Tên người phụ trách]<br data-start=&quot;1019&quot; data-end=&quot;1022&quot;/>[Chức vụ]<br data-start=&quot;1031&quot; data-end=&quot;1034&quot;/>[Tên công ty]</p></div></td></tr></tbody></table>",
    },
];
