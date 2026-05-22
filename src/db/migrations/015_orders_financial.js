// Mở rộng quotations để track 2 trục state + tài chính:
//   - order_status: trạng thái sản xuất (chưa sx/sx/lắp đặt/hoàn thiện)
//   - ready_to_send: cờ phân biệt "Nháp" (chưa xong) vs "Chưa gửi" (đã xong, chờ gửi)
//     → tránh phải recreate quotations table để mở rộng status enum
//   - thanh_toan_thuc, gia_von: tài chính per BG, dealer nhập tay
//
// Logic display 5 logical status (FE):
//   status='draft' + ready_to_send=0 → "Nháp"
//   status='draft' + ready_to_send=1 → "Chưa gửi"
//   status='sent'                    → "Đã gửi"
//   status='confirmed'               → "Đã chốt"
//   status='cancelled'               → "Đã trượt"  (label đổi từ "Đã huỷ", giữ enum DB)
module.exports = {
  description: 'quotations: order_status + ready_to_send + thanh_toan_thuc + gia_von',
  up: (db) => {
    const cols = new Set(db.prepare(`PRAGMA table_info(quotations)`).all().map(c => c.name));
    const addIfMissing = (name, type) => {
      if (!cols.has(name)) db.exec(`ALTER TABLE quotations ADD COLUMN ${name} ${type}`);
    };
    addIfMissing('order_status',    'TEXT');
    addIfMissing('ready_to_send',   "INTEGER NOT NULL DEFAULT 0");
    addIfMissing('thanh_toan_thuc', 'INTEGER');
    addIfMissing('gia_von',         'INTEGER');

    // Backfill order_status cho BG cũ: BG huỷ → null, BG còn lại → 'cho_san_xuat'
    db.exec(`
      UPDATE quotations
      SET order_status = CASE WHEN status = 'cancelled' THEN NULL ELSE 'cho_san_xuat' END
      WHERE order_status IS NULL
    `);
  },
};
