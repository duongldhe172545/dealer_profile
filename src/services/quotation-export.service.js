// Xuất danh sách báo giá ra file .xlsx — dùng cho nút "Xuất Excel"
// trên trang quotations.html. Tận dụng filter giống endpoint list (search,
// logical_status, customer_id, from, to).
const ExcelJS = require('exceljs');
const quotationService = require('./quotation.service');

const LOGICAL_LABEL = {
  nhap: 'Nháp', chua_gui: 'Chưa gửi', da_gui: 'Đã gửi',
  da_chot: 'Đã chốt', da_truot: 'Đã trượt',
};
const ORDER_LABEL = {
  cho_san_xuat: 'Chờ sản xuất', san_xuat: 'Sản xuất',
  lap_dat: 'Lắp đặt', hoan_thien: 'Hoàn thiện',
};

async function exportXlsx(dealerId, filter) {
  const rows = quotationService.list(dealerId, filter);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Đại Lý Số';
  wb.created = new Date();
  const ws = wb.addWorksheet('Báo giá', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  ws.columns = [
    { header: 'Mã KH',               key: 'ma_kh',          width: 14 },
    { header: 'Số BG',               key: 'so_bao_gia',     width: 18 },
    { header: 'Ngày',                key: 'ngay',           width: 13 },
    { header: 'Khách hàng',          key: 'kh',             width: 24 },
    { header: 'Công trình',          key: 'ct',             width: 32 },
    { header: 'Tình trạng BG',       key: 'tt_bg',          width: 14 },
    { header: 'Tình trạng đơn hàng', key: 'tt_dh',          width: 16 },
    { header: 'Giá trị BG (đ)',      key: 'gia_tri',        width: 18, style: { numFmt: '#,##0' } },
    { header: 'Thanh toán (đ)',      key: 'thanh_toan',     width: 16, style: { numFmt: '#,##0' } },
    { header: 'Công nợ (đ)',         key: 'cong_no',        width: 16, style: { numFmt: '#,##0' } },
    { header: 'Giá vốn (đ)',         key: 'gia_von',        width: 16, style: { numFmt: '#,##0' } },
    { header: 'Lợi nhuận (đ)',       key: 'loi_nhuan',      width: 16, style: { numFmt: '#,##0' } },
  ];

  // Header style
  const hdr = ws.getRow(1);
  hdr.font = { bold: true, color: { argb: 'FF1E40AF' } };
  hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  hdr.alignment = { vertical: 'middle', horizontal: 'center' };
  hdr.height = 22;

  for (const q of rows) {
    const tt = Number(q.thanh_toan_thuc) || 0;
    const gv = q.gia_von != null ? Number(q.gia_von) : null;
    ws.addRow({
      ma_kh:      q.customer_code || '',
      so_bao_gia: q.so_bao_gia || '',
      ngay:       q.ngay_bao_gia || '',
      kh:         q.customer_name || '',
      ct:         q.dia_chi_cong_trinh || '',
      tt_bg:      LOGICAL_LABEL[q.logical_status] || q.logical_status || '',
      tt_dh:      ORDER_LABEL[q.order_status] || (q.order_status || ''),
      gia_tri:    Number(q.tong_cong) || 0,
      thanh_toan: tt,
      cong_no:    (Number(q.tong_cong) || 0) - tt,
      gia_von:    gv,
      loi_nhuan:  gv != null ? (Number(q.tong_cong) || 0) - gv : null,
    });
  }

  // Tổng cuối bảng
  if (rows.length > 0) {
    const sumRow = ws.addRow({
      kh: 'TỔNG CỘNG',
      gia_tri:    rows.reduce((s, q) => s + (Number(q.tong_cong) || 0), 0),
      thanh_toan: rows.reduce((s, q) => s + (Number(q.thanh_toan_thuc) || 0), 0),
      cong_no:    rows.reduce((s, q) => s + ((Number(q.tong_cong) || 0) - (Number(q.thanh_toan_thuc) || 0)), 0),
      gia_von:    rows.reduce((s, q) => s + (Number(q.gia_von) || 0), 0),
      loi_nhuan:  rows.reduce((s, q) => s + (q.gia_von != null ? (Number(q.tong_cong) || 0) - Number(q.gia_von) : 0), 0),
    });
    sumRow.font = { bold: true };
    sumRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
  }

  // Border tất cả cell có data
  const lastRow = ws.rowCount;
  for (let r = 1; r <= lastRow; r++) {
    for (let c = 1; c <= 12; c++) {
      ws.getCell(r, c).border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    }
  }

  return wb.xlsx.writeBuffer();
}

module.exports = { exportXlsx };
