const adminStatsModel = require('../models/admin-stats.model');
const { notFound } = require('../utils/http');

function overview() {
  return {
    kpi: adminStatsModel.overview(),
    monthly: adminStatsModel.monthlyRevenue(),
    top_dealers: adminStatsModel.topDealers({ limit: 5 }),
    top_products: adminStatsModel.topProducts({ limit: 10 }),
    price_groups: adminStatsModel.priceRangeByGroup(),
  };
}

function quotationsAll(filter) {
  return adminStatsModel.quotationsAll(filter);
}

function customersAll(filter) {
  return adminStatsModel.customersAll(filter);
}

function productsAll(filter) {
  return adminStatsModel.productsAll(filter);
}

function dealerFull(dealerId) {
  const data = adminStatsModel.dealerFull(dealerId);
  if (!data) throw notFound('Không tìm thấy đại lý');
  return data;
}

// Export: trả về CSV string
function exportCSV(type) {
  let rows = [];
  let headers = [];
  switch (type) {
    case 'quotations':
      rows = adminStatsModel.quotationsForExport();
      headers = ['so_bao_gia', 'ngay_bao_gia', 'status', 'sent_at', 'sent_method',
        'tam_tinh', 'chi_phi_van_chuyen', 'chi_phi_lap_dat', 'vat_amount', 'tong_cong',
        'dia_chi_cong_trinh', 'ghi_chu_thuong_mai',
        'dealer_code', 'ten_dai_ly', 'dealer_province',
        'ma_kh', 'customer_name', 'customer_phone', 'customer_email'];
      break;
    case 'customers':
      rows = adminStatsModel.customersForExport();
      headers = ['ma_kh', 'ten_kh', 'nguoi_lien_he', 'phone', 'email', 'dia_chi', 'ghi_chu',
        'dealer_code', 'ten_dai_ly', 'quotations_count'];
      break;
    case 'products':
      rows = adminStatsModel.productsForExport();
      headers = ['ma_sp', 'nhom_sp', 'mo_ta', 'dvt_mac_dinh', 'cach_tinh_gia',
        'don_gia_mac_dinh', 'active', 'dealer_code', 'ten_dai_ly'];
      break;
    case 'dealers':
      rows = adminStatsModel.dealersForExport();
      headers = ['dealer_code', 'ten_dai_ly', 'chu_dai_ly', 'phone', 'email',
        'address', 'district', 'province', 'coverage',
        'years_experience', 'team_size', 'projects_monthly',
        'status', 'created_at',
        'quotations_count', 'revenue', 'username', 'last_login_at'];
      break;
    default:
      throw new Error('Loại export không hợp lệ');
  }
  return toCSV(headers, rows);
}

function toCSV(headers, rows) {
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(headers.map(h => escape(r[h])).join(','));
  }
  // Prepend BOM để Excel mở UTF-8 đúng tiếng Việt
  return '﻿' + lines.join('\n');
}

module.exports = { overview, quotationsAll, customersAll, productsAll, dealerFull, exportCSV };
