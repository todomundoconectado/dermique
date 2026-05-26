// Google Apps Script — Dermique
// Cole no Apps Script da planilha (dentro do Google Sheets, não standalone):
// → Extensões → Apps Script → cole tudo → Salvar → Implantar como Web App

const SHEET_NAME      = 'leads'
const LEAD_SYSTEM_URL = 'https://dermique.netlify.app'
const SPREADSHEET_ID  = '1PThVD74AGEna2hNbNMXEO5IlNleuqHCZQHqp7CIMsLQ'
const PIXEL_ID        = '1077563593088467'

const COL_DATA_HORA      = 1   // A
const COL_NOME           = 2   // B
const COL_TELEFONE       = 3   // C
const COL_QUALIFICADO    = 4   // D ✅
const COL_COMPROU        = 5   // E 💰
const COL_DESQUALIFICADO = 6   // F ❌
const COL_STATUS         = 7   // G (oculto)
const COL_VALOR          = 8   // H
const COL_ORIGEM         = 9   // I
const COL_PAGINA         = 10  // J
const COL_UTM_SOURCE     = 11  // K
const COL_UTM_MEDIUM     = 12  // L
const COL_UTM_CAMP       = 13  // M
const COL_UTM_CONTENT    = 14  // N
const COL_LEAD_ID        = 15  // O

const COR_QUALIFICADO    = '#c9daf8'
const COR_COMPROU        = '#d9ead3'
const COR_DESQUALIFICADO = '#f4cccc'
const COR_NEUTRO         = '#ffffff'

function getOrCreateSheet() {
  const ss  = SpreadsheetApp.openById(SPREADSHEET_ID)
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME)
    _configurarCabecalho(sheet)
  }
  return sheet
}

function _configurarCabecalho(sheet) {
  sheet.getRange(1, 1, 1, 15).setValues([[
    'Data/Hora', 'Nome', 'Telefone',
    '✅ Qualificado', '💰 Comprou', '❌ Desqualificado', 'Status',
    '💵 Valor R$', 'Origem', 'Página',
    'UTM Source', 'UTM Medium', 'UTM Campaign', 'UTM Content', 'ID'
  ]])
  sheet.getRange(1, 1, 1, 3).setBackground('#000000').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center')
  sheet.getRange(1, COL_QUALIFICADO).setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center')
  sheet.getRange(1, COL_COMPROU).setBackground('#34a853').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center')
  sheet.getRange(1, COL_DESQUALIFICADO).setBackground('#ea4335').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center')
  sheet.getRange(1, COL_STATUS).setBackground('#666666').setFontColor('#ffffff').setFontWeight('bold').setFontSize(8).setHorizontalAlignment('center')
  sheet.getRange(1, COL_VALOR).setBackground('#f9cb9c').setFontColor('#000000').setFontWeight('bold').setHorizontalAlignment('center')
  sheet.getRange(1, COL_ORIGEM, 1, 7).setBackground('#000000').setFontColor('#ffffff').setFontWeight('bold').setHorizontalAlignment('center')
  sheet.setColumnWidth(COL_QUALIFICADO, 120)
  sheet.setColumnWidth(COL_COMPROU, 100)
  sheet.setColumnWidth(COL_DESQUALIFICADO, 130)
  sheet.setColumnWidth(COL_VALOR, 100)
  sheet.setFrozenRows(1)
  sheet.hideColumns(COL_STATUS)
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎯 Qualificador')
    .addItem('⚡ Ativar prompt de valor (fazer uma vez)', 'ativarPromptDeValor')
    .addSeparator()
    .addItem('🧪 Testar envio CAPI (Purchase teste)', 'testarCapiPurchase')
    .addSeparator()
    .addItem('Configurar token da Meta', 'menuConfigurarToken')
    .addItem('Adicionar checkboxes a linhas existentes', 'adicionarCheckboxesExistentes')
    .addToUi()
}

function ativarPromptDeValor() {
  const ui = SpreadsheetApp.getUi()
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'onEditInstalavel')
    .forEach(t => ScriptApp.deleteTrigger(t))
  ScriptApp.newTrigger('onEditInstalavel')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create()
  PropertiesService.getScriptProperties().setProperty('PROMPT_VALOR_ATIVO', 'true')
  ui.alert('✅ Prompt de valor ativado!\n\nAo marcar "💰 Comprou" vai aparecer uma caixa pedindo o valor da venda.')
}

function onEdit(e) {
  const promptAtivo = PropertiesService.getScriptProperties().getProperty('PROMPT_VALOR_ATIVO') === 'true'
  if (promptAtivo) return
  _processarEdicao(e, false)
}

function onEditInstalavel(e) {
  _processarEdicao(e, true)
}

function _processarEdicao(e, comUI) {
  const sheet = e.source.getActiveSheet()
  if (sheet.getName() !== SHEET_NAME) return
  const row = e.range.getRow()
  const col = e.range.getColumn()
  if (row < 2 || col < COL_QUALIFICADO || col > COL_DESQUALIFICADO) return

  if (e.value === 'FALSE') {
    const outrosMarcados = [COL_QUALIFICADO, COL_COMPROU, COL_DESQUALIFICADO]
      .filter(c => c !== col)
      .some(c => sheet.getRange(row, c).getValue() === true)
    if (!outrosMarcados) {
      _colorirLinha(sheet, row, COR_NEUTRO)
      sheet.getRange(row, COL_STATUS).setValue('')
    }
    return
  }

  ;[COL_QUALIFICADO, COL_COMPROU, COL_DESQUALIFICADO].forEach(c => {
    if (c !== col) sheet.getRange(row, c).setValue(false)
  })

  const phone  = String(sheet.getRange(row, COL_TELEFONE).getValue())
  const leadId = String(sheet.getRange(row, COL_LEAD_ID).getValue())
  const nome   = String(sheet.getRange(row, COL_NOME).getValue())

  if (col === COL_QUALIFICADO) {
    _colorirLinha(sheet, row, COR_QUALIFICADO)
    sheet.getRange(row, COL_STATUS).setValue('Qualificado')
    _enviarCapiEvent(phone, leadId, 'QualifiedLead', 'qualificado', null, nome)
    _enviarGA4Event(leadId, 'QualifiedLead', null)
  } else if (col === COL_COMPROU) {
    _colorirLinha(sheet, row, COR_COMPROU)
    sheet.getRange(row, COL_STATUS).setValue('Comprou')
    let valor = null
    if (comUI) {
      const ui   = SpreadsheetApp.getUi()
      const resp = ui.prompt('💰 Valor da venda', 'Qual o valor? (ex: 1500)\nDeixe em branco se não souber agora.', ui.ButtonSet.OK_CANCEL)
      if (resp.getSelectedButton() === ui.Button.OK) {
        const txt = resp.getResponseText().trim()
        if (txt) {
          valor = parseFloat(txt.replace(/[^0-9,.]/g, '').replace(',', '.'))
          sheet.getRange(row, COL_VALOR).setValue(valor)
        }
      }
    }
    _enviarCapiEvent(phone, leadId, 'Purchase', 'comprou', valor, nome)
    _enviarGA4Event(leadId, 'Purchase', valor)
  } else if (col === COL_DESQUALIFICADO) {
    _colorirLinha(sheet, row, COR_DESQUALIFICADO)
    sheet.getRange(row, COL_STATUS).setValue('Desqualificado')
    sheet.getRange(row, COL_VALOR).setValue('')
    _enviarCapiEvent(phone, leadId, 'DisqualifiedLead', 'desqualificado', null, nome)
    _enviarGA4Event(leadId, 'DisqualifiedLead', null)
  }
}

function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents)
    const sheet = getOrCreateSheet()
    if (data.action === 'create') {
      const lastRow = sheet.getLastRow() + 1
      sheet.appendRow([
        data.data_hora    || '',
        data.nome         || '',
        data.telefone     || '',
        false, false, false, '', '',
        data.origem       || '',
        data.pagina       || '',
        data.utm_source   || '',
        data.utm_medium   || '',
        data.utm_campaign || '',
        data.utm_content  || '',
        data.lead_id      || '',
      ])
      sheet.getRange(lastRow, COL_QUALIFICADO, 1, 3).insertCheckboxes()
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON)
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message })).setMimeType(ContentService.MimeType.JSON)
  }
}

function menuConfigurarToken() {
  const ui    = SpreadsheetApp.getUi()
  const atual = PropertiesService.getScriptProperties().getProperty('META_CAPI_TOKEN')
  const resp  = ui.prompt('Token Meta CAPI', 'Cole o token de acesso da Meta (já salvo: ' + (atual ? 'SIM ✅' : 'NÃO ❌') + '):', ui.ButtonSet.OK_CANCEL)
  if (resp.getSelectedButton() === ui.Button.OK) {
    PropertiesService.getScriptProperties().setProperty('META_CAPI_TOKEN', resp.getResponseText().trim())
    ui.alert('Token salvo! ✅')
  }
}

function adicionarCheckboxesExistentes() {
  const sheet   = getOrCreateSheet()
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return
  for (let row = 2; row <= lastRow; row++) {
    const range = sheet.getRange(row, COL_QUALIFICADO, 1, 3)
    const vals  = range.getValues()[0]
    if (vals[0] === '' && vals[1] === '' && vals[2] === '') range.insertCheckboxes()
  }
  SpreadsheetApp.getUi().alert('Checkboxes adicionados! ✅')
}

function testarCapiPurchase() {
  const ui = SpreadsheetApp.getUi()
  _enviarCapiEvent('5511999999999', 'teste_' + Date.now(), 'Purchase', 'comprou', 500, 'Teste Usuario')
  ui.alert('Resultado do teste CAPI:\n\n' + Logger.getLog())
}

function _enviarGA4Event(leadId, eventName, valor) {
  try {
    const payload = { event_name: eventName, lead_id: leadId, valor: valor }
    UrlFetchApp.fetch(LEAD_SYSTEM_URL + '/api/ga4', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify(payload), muteHttpExceptions: true,
    })
  } catch (err) {
    Logger.log('GA4 erro: ' + err.message)
  }
}

function _colorirLinha(sheet, row, cor) {
  sheet.getRange(row, 1, 1, COL_VALOR).setBackground(cor)
}

function _hashValue(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value).trim().toLowerCase().replace(/\D/g, ''),
    Utilities.Charset.UTF_8
  )
  return bytes.map(b => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join('')
}

function _hashName(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value).trim().toLowerCase(),
    Utilities.Charset.UTF_8
  )
  return bytes.map(b => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join('')
}

function _enviarCapiEvent(phone, leadId, eventName, status, valor, nome) {
  const TOKEN_FALLBACK = 'EAAWZAdkTjz2QBRsZBhgXAPKF6SHZATdlCP0EK48iJ5JrTitHUyNZBUpEdML5Te3xGR82yvW5ZCYZC4TLoPt7wLpbsaxMQ0hQCjcYXKLSPi8IXPyxDzwmBaWi0O8N2IWunIxVya8p2l0ZA26Nmnc77I3qS7C9IbaI2FhGPzQ2ZC8nULcZBSWIpdfKa827iRgQtMwZDZD'
  const token = PropertiesService.getScriptProperties().getProperty('META_CAPI_TOKEN') || TOKEN_FALLBACK

  const customData = { lead_id: leadId, qualification_status: status }
  if (valor !== null && !isNaN(valor)) {
    customData.value    = valor
    customData.currency = 'BRL'
  }

  const userData = { ph: [_hashValue(phone)] }
  if (leadId) userData.external_id = [_hashValue(leadId)]
  if (nome) {
    const parts = String(nome).trim().split(/\s+/)
    userData.fn = [_hashName(parts[0])]
    if (parts.length > 1) userData.ln = [_hashName(parts.slice(1).join(' '))]
  }

  const payload = {
    data: [{
      event_name:    eventName,
      event_time:    Math.floor(Date.now() / 1000),
      event_id:      leadId + '_' + status + '_' + Date.now(),
      action_source: 'other',
      user_data:     userData,
      custom_data:   customData,
    }]
  }

  try {
    const resp = UrlFetchApp.fetch(
      'https://graph.facebook.com/v21.0/' + PIXEL_ID + '/events?access_token=' + token,
      { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true }
    )
    Logger.log('CAPI [' + eventName + '] valor=' + valor + ' → ' + resp.getResponseCode() + ': ' + resp.getContentText())
  } catch (err) {
    Logger.log('CAPI erro: ' + err.message)
  }
}
