// ============================================================
// Flow Sales CRM — Google Apps Script (atualizado 2026-06)
// Cole este código em: Extensions > Apps Script > Code.gs
// Deploy como: Web App > Anyone > Execute as: Me
// ============================================================

var HEADERS = [
  'Data', 'Escritório', 'Tel. Escritório', 'E-mail Escritório',
  'Rua Esc.', 'Número Esc.', 'Bairro Esc.', 'Cidade Esc.', 'UF Esc.', 'CEP Esc.', 'Comp. Esc.',
  'Responsável', 'E-mail Resp.', 'WhatsApp Resp.', 'OAB', 'Áreas de Atuação',
  'Rua Resp.', 'Número Resp.', 'Bairro Resp.', 'Cidade Resp.', 'UF Resp.', 'CEP Resp.', 'Comp. Resp.',
  'Site', 'Instagram', 'Como chegou', 'Expectativas',
  'Mensalidade', 'Início', 'ID Firma', 'Senha', 'Sócios'
];

function doPost(e) {
  try {
    var p = e.parameter;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Clientes') || ss.getActiveSheet();

    // Sempre sobrescreve a linha 1 com o cabeçalho correto
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);

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

// Utilitário: força cabeçalho agora (rode manualmente se precisar corrigir planilha existente)
function fixHeader() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Clientes') || ss.getActiveSheet();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  SpreadsheetApp.getUi().alert('Cabeçalho corrigido ✅');
}

// ============================================================
// RELATÓRIO SEMANAL — executa toda segunda-feira às 8h
// Para ativar: Gatilhos > Adicionar gatilho > sendWeeklyReport
//              Tipo: Baseado em tempo > Semana > Segunda > 8h-9h
// ============================================================

var FB_API_KEY    = 'AIzaSyBTqzj-9-AOI181sPCKvRsVGDujkWogIGI';
var FB_PROJECT    = 'flowbody-30162';
var ALWAYS_CC     = ['tcaetano1706@gmail.com', 'carlosnunes_jr@hotmail.com'];
var FROM_NAME     = 'Flow Sales';
var WEBHOOK_BOT_EMAIL = 'webhook-bot@flowsales.internal';

// As regras do Firestore agora exigem login — sem isso, sendWeeklyReport() não lê nada.
// Configure uma vez em: Extensions > Apps Script > ⚙️ Project Settings > Script Properties
// > Add script property > WEBHOOK_BOT_PASSWORD = (senha da conta de serviço).
function _getBotToken() {
  var pass = PropertiesService.getScriptProperties().getProperty('WEBHOOK_BOT_PASSWORD');
  if (!pass) throw new Error('Configure WEBHOOK_BOT_PASSWORD em Project Settings > Script Properties');
  var token = _fbSignIn(WEBHOOK_BOT_EMAIL, pass);
  if (!token) throw new Error('Login da conta de serviço falhou (senha errada ou conta não existe)');
  return token;
}

function _fbGet(path, token) {
  var url = 'https://firestore.googleapis.com/v1/projects/' + FB_PROJECT +
            '/databases/(default)/documents/' + path + '?key=' + FB_API_KEY;
  var opts = { method: 'get', muteHttpExceptions: true };
  if (token) opts.headers = { Authorization: 'Bearer ' + token };
  var r = UrlFetchApp.fetch(url, opts);
  if (r.getResponseCode() !== 200) return null;
  return JSON.parse(r.getContentText());
}

function _fbSignIn(email, pass) {
  var url = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FB_API_KEY;
  var r = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ email: email, password: pass, returnSecureToken: true }),
    muteHttpExceptions: true
  });
  if (r.getResponseCode() !== 200) return null;
  return JSON.parse(r.getContentText()).idToken;
}

function _fv(field) {
  if (!field) return '';
  if (field.stringValue  !== undefined) return field.stringValue;
  if (field.integerValue  !== undefined) return parseInt(field.integerValue);
  if (field.doubleValue   !== undefined) return parseFloat(field.doubleValue);
  if (field.booleanValue  !== undefined) return field.booleanValue;
  if (field.arrayValue    !== undefined) {
    var vals = (field.arrayValue.values || []).map(function(v) { return _fv(v); });
    return vals;
  }
  if (field.mapValue !== undefined) {
    var obj = {};
    var f = field.mapValue.fields || {};
    Object.keys(f).forEach(function(k) { obj[k] = _fv(f[k]); });
    return obj;
  }
  return '';
}

function _parseDoc(doc) {
  var out = { id: (doc.name || '').split('/').pop() };
  var fields = doc.fields || {};
  Object.keys(fields).forEach(function(k) { out[k] = _fv(fields[k]); });
  return out;
}

function _brl(n) { return 'R$ ' + Number(n||0).toLocaleString('pt-BR'); }
function _pct(v, g) { return g ? Math.min(Math.round((v||0)/g*100), 100) + '%' : '--'; }
function _bar(pct, col) {
  var p = parseInt(pct);
  var c = p >= 100 ? '#22c55e' : p >= 60 ? '#C9A843' : '#ef4444';
  return '<div style="background:#2a2a2a;border-radius:4px;height:6px;width:100%;margin-top:3px">' +
         '<div style="background:' + c + ';width:' + Math.min(p,100) + '%;height:6px;border-radius:4px"></div></div>';
}

function sendWeeklyReport() {
  var token;
  try { token = _getBotToken(); } catch (e) { Logger.log('Erro de autenticação: ' + e.message); return; }

  // Lê __config para pegar a lista de firms
  var cfg = _fbGet('flowsales_crm/__config', token);
  if (!cfg) { Logger.log('Erro ao ler config Firebase'); return; }
  var firms = _fv((cfg.fields || {}).firms) || [];
  if (!firms.length) { Logger.log('Nenhum escritório encontrado'); return; }

  var hoje = new Date();
  var semanaStr = Utilities.formatDate(hoje, 'America/Sao_Paulo', 'dd/MM/yyyy');
  var lunes = new Date(hoje); lunes.setDate(hoje.getDate() - 7);
  var lunesStr = Utilities.formatDate(lunes, 'America/Sao_Paulo', 'dd/MM/yyyy');

  firms.forEach(function(firmRaw) {
    var firm = typeof firmRaw === 'object' ? firmRaw : {};
    var firmId = firm.id;
    if (!firmId) return;

    var doc = _fbGet('flowsales_crm/' + firmId, token);
    if (!doc) return;
    var d = _parseDoc(doc);

    var k = d.kpis || {};
    var metas = d.metasDin || {};
    var tasks = d.tasks || [];
    var entregas = d.entregas || [];
    var partners = d.partners || [];

    // E-mails destinatários
    var toList = [];
    var firmExtra = d.firmExtra || {};
    if (firmExtra.email) toList.push(firmExtra.email);
    if (firmExtra.respEmail) toList.push(firmExtra.respEmail);
    partners.forEach(function(p) { if (p && p.email) toList.push(p.email); });
    // remover duplicados
    toList = toList.filter(function(e, i, a) { return e && a.indexOf(e) === i; });

    var firmName = firm.name || firmId;
    var tasksOk = tasks.filter(function(t) { return t.status === 'done'; }).length;
    var tasksPend = tasks.filter(function(t) { return t.status === 'pending' || t.status === 'late'; }).length;
    var entregasRecentes = entregas.slice().reverse().slice(0, 3);

    // Score de saúde
    var pts = 0, mx = 0;
    function addS(cur, goal, w) { if (!goal) return; mx += w; pts += Math.min((cur||0)/goal, 1) * w; }
    addS(k.leads, k.leadsG, 20); addS(k.reunAgd, k.reunAgdG, 20);
    addS(k.reunReal, k.reunRealG, 15); addS(k.vendas, k.vendasG, 25);
    if (k.invest) { mx += 20; var roi = (k.rev||0)/k.invest; pts += roi>=3?20:roi>=2?15:roi>=1?10:roi>0?5:0; }
    var score = mx ? Math.round((pts/mx)*100) : 0;
    var scoreCol = score >= 70 ? '#22c55e' : score >= 40 ? '#C9A843' : '#ef4444';
    var scoreLbl = score >= 70 ? 'Boa' : score >= 40 ? 'Regular' : 'Atenção';

    var html = '<div style="font-family:Arial,sans-serif;background:#0d0d0d;color:#e8e0cc;max-width:600px;margin:0 auto;border-radius:12px;overflow:hidden">' +
      '<div style="background:linear-gradient(135deg,#1a1600,#0d0d0d);padding:32px 28px;border-bottom:1px solid #2a2a2a">' +
        '<div style="font-size:11px;color:#C9A843;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Flow Sales · Relatório Semanal</div>' +
        '<div style="font-size:22px;font-weight:700;color:#e8e0cc">' + firmName + '</div>' +
        '<div style="font-size:12px;color:#888;margin-top:4px">' + lunesStr + ' → ' + semanaStr + '</div>' +
      '</div>' +
      '<div style="padding:24px 28px">' +
        // Score
        '<div style="background:#1a1600;border:1px solid #2a2a2a;border-radius:10px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:20px">' +
          '<div style="text-align:center">' +
            '<div style="font-size:42px;font-weight:700;color:' + scoreCol + ';line-height:1">' + score + '</div>' +
            '<div style="font-size:10px;color:#666;margin-top:2px">Score</div>' +
          '</div>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:600;color:' + scoreCol + '">' + scoreLbl + '</div>' +
            '<div style="font-size:12px;color:#888;margin-top:2px">Saúde da campanha esta semana</div>' +
          '</div>' +
        '</div>' +
        // KPIs
        '<div style="font-size:11px;color:#C9A843;text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px">Indicadores</div>' +
        '<table style="width:100%;border-collapse:collapse;margin-bottom:20px">' +
          '<tr style="font-size:11px;color:#666"><td style="padding:4px 8px">Métrica</td><td style="padding:4px 8px;text-align:right">Atual</td><td style="padding:4px 8px;text-align:right">Meta</td><td style="padding:4px 8px;text-align:right">%</td></tr>' +
          _kpiRow('Leads gerados', k.leads, k.leadsG) +
          _kpiRow('Reuniões agendadas', k.reunAgd, k.reunAgdG) +
          _kpiRow('Reuniões realizadas', k.reunReal, k.reunRealG) +
          _kpiRow('Vendas fechadas', k.vendas, k.vendasG) +
          _kpiRow('Faturamento', k.rev, k.revG, true) +
        '</table>' +
        // Tasks
        '<div style="font-size:11px;color:#C9A843;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Tasks</div>' +
        '<div style="background:#111;border-radius:8px;padding:12px 16px;margin-bottom:20px;display:flex;gap:24px">' +
          '<div><span style="font-size:20px;font-weight:700;color:#22c55e">' + tasksOk + '</span><div style="font-size:11px;color:#666">concluídas</div></div>' +
          '<div><span style="font-size:20px;font-weight:700;color:#C9A843">' + tasksPend + '</span><div style="font-size:11px;color:#666">pendentes</div></div>' +
        '</div>' +
        // Entregas recentes
        (entregasRecentes.length ? '<div style="font-size:11px;color:#C9A843;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">Últimas entregas</div>' +
        '<div style="margin-bottom:20px">' + entregasRecentes.map(function(e) {
          return '<div style="background:#111;border-radius:6px;padding:10px 14px;margin-bottom:6px">' +
            '<div style="font-size:13px;font-weight:600">' + (e.title||'') + '</div>' +
            '<div style="font-size:11px;color:#888">' + (e.category||'') + ' · ' + (e.date||'') + '</div>' +
          '</div>';
        }).join('') + '</div>' : '') +
        // Rodapé
        '<div style="border-top:1px solid #1a1a1a;padding-top:16px;font-size:11px;color:#444;text-align:center">' +
          'Flow Sales · Este relatório é gerado automaticamente toda segunda-feira.<br>' +
          '<a href="https://thiagojoc.github.io/flowsales-crm/" style="color:#C9A843;text-decoration:none">Acessar painel →</a>' +
        '</div>' +
      '</div>' +
    '</div>';

    var allTo = toList.concat(ALWAYS_CC).filter(function(e,i,a){ return e && a.indexOf(e)===i; });
    if (!allTo.length) return;

    try {
      GmailApp.sendEmail(allTo[0], '📊 Relatório semanal — ' + firmName, '', {
        htmlBody: html,
        cc: allTo.slice(1).join(','),
        name: FROM_NAME,
        noReply: true
      });
      Logger.log('Relatório enviado para ' + firmName + ': ' + allTo.join(', '));
    } catch(err) {
      Logger.log('Erro ao enviar para ' + firmName + ': ' + err);
    }
  });
}

function _kpiRow(label, val, meta, isMoney) {
  var v = isMoney ? _brl(val) : (val||0);
  var m = isMoney ? _brl(meta) : (meta||'--');
  var pct = meta ? Math.min(Math.round((val||0)/(meta)*100), 100) : 0;
  var col = pct >= 100 ? '#22c55e' : pct >= 60 ? '#C9A843' : '#ef4444';
  return '<tr style="border-top:1px solid #1a1a1a;font-size:12px">' +
    '<td style="padding:8px 8px;color:#aaa">' + label + '</td>' +
    '<td style="padding:8px 8px;text-align:right;font-weight:600;color:#e8e0cc">' + v + '</td>' +
    '<td style="padding:8px 8px;text-align:right;color:#666">' + m + '</td>' +
    '<td style="padding:8px 8px;text-align:right;color:' + col + ';font-weight:600">' + (meta ? pct + '%' : '--') + '</td>' +
  '</tr>';
}

// Para testar manualmente: rode sendWeeklyReport() no Apps Script Editor
