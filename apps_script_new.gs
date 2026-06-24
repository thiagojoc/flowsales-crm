// ============================================================
// Flow Sales CRM — Google Apps Script (atualizado 2026-06)
// Cole este código em: Extensions > Apps Script > Code.gs
// Deploy como: Web App > Anyone > Execute as: Me
// ============================================================

function doPost(e) {
  try {
    var p = e.parameter;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Clientes') || ss.getActiveSheet();

    // ── cabeçalho (cria se não existir) ──
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Data', 'Escritório', 'Tel. Escritório', 'E-mail Escritório',
        'Rua Esc.', 'Número Esc.', 'Bairro Esc.', 'Cidade Esc.', 'UF Esc.', 'CEP Esc.', 'Comp. Esc.',
        'Responsável', 'E-mail Resp.', 'WhatsApp Resp.', 'OAB', 'Áreas de Atuação',
        'Rua Resp.', 'Número Resp.', 'Bairro Resp.', 'Cidade Resp.', 'UF Resp.', 'CEP Resp.', 'Comp. Resp.',
        'Site', 'Instagram', 'Como chegou', 'Expectativas',
        'Mensalidade', 'Início', 'ID Firma', 'Senha', 'Sócios'
      ]);
    }

    var row = [
      new Date().toLocaleString('pt-BR'),
      p.escritorio || '',
      p.tel_esc || '',
      p.email_esc || '',
      p.esc_rua || '',
      p.esc_num || '',
      p.esc_bairro || '',
      p.esc_cidade || '',
      p.esc_uf || '',
      p.esc_cep || '',
      p.esc_comp || '',
      p.responsavel || '',
      p.resp_email || '',
      p.resp_whatsapp || '',
      p.resp_oab || '',
      p.resp_areas || '',
      p.resp_rua || '',
      p.resp_num || '',
      p.resp_bairro || '',
      p.resp_cidade || '',
      p.resp_uf || '',
      p.resp_cep || '',
      p.resp_comp || '',
      p.site || '',
      p.instagram || '',
      p.origem || '',
      p.expectativas || '',
      p.mensalidade || 'R$ 3.500',
      p.inicio || '',
      p.firmId || '',
      p.senha || '',
      p.socios || ''
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', msg: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Flow Sales CRM — Apps Script ativo ✅');
}
