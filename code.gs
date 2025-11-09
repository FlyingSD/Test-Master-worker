// ============================================
// СВЕТЛИНКИ CRM - BACKEND (Code.gs)
// ВЕРСИЯ 5 - ОПТИМИЗИРАНА
// ============================================

// ================== КОНФИГУРАЦИЯ ==================
const SHEETS = {
  STUDENTS: 'Ученици',
  PARENTS: 'Родители',
  PAYMENTS: 'Плащания',
  EXPENSES: 'Разходи',
  DISCOUNTS: 'Отстъпки',
  SCHEDULE: 'Разписание',
  ATTENDANCE: 'Посещаемост',
  PROGRESS: 'Напредък',
  TEACHERS: 'Учители',
  EVENTS: 'Събития',
  EXPENSE_CATEGORIES: 'КатегорииРазходи',
  NOTES: 'Бележки'
};

const EUR_RATE_CELL = 'Разходи!G1';
const BACKUP_FOLDER_NAME = 'Backups';
const REPORTS_FOLDER_NAME = 'Справки';

// ============================================
// WEB APP ENTRY POINT
// ============================================

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Светлинки CRM')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// =======================================================
// === ФУНКЦИИ ЗА ПЪРВОНАЧАЛНА НАСТРОЙКА ===
// =======================================================

function setupSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const rootFolder = DriveApp.getFileById(ss.getId()).getParents().next();
  if (!rootFolder.getFoldersByName(BACKUP_FOLDER_NAME).hasNext()) {
    rootFolder.createFolder(BACKUP_FOLDER_NAME);
  }
  if (!rootFolder.getFoldersByName(REPORTS_FOLDER_NAME).hasNext()) {
    rootFolder.createFolder(REPORTS_FOLDER_NAME);
  }

  const sheetsToCreate = [
    { name: SHEETS.STUDENTS, headers: ['ID', 'Име', 'Група', 'Такса', 'Такса (EUR)', 'Падеж', 'Статус', 'Родител (ID)', 'ТипОбучение', 'ДатаНаРегистрация'] },
    { name: SHEETS.PARENTS, headers: ['ID', 'Име', 'Телефон', 'Имейл'] },
    { name: SHEETS.PAYMENTS, headers: ['ID', 'УченикID', 'Дата', 'Сума', 'Сума (EUR)', 'Метод', 'Описание', 'Артикул'] },
    { name: SHEETS.EXPENSES, headers: ['ID', 'Дата', 'Описание', 'Метод', 'Сума', 'Категория'] },
    { name: SHEETS.DISCOUNTS, headers: ['ID', 'УченикID', 'Причина', 'Тип', 'Стойност'] },
    { name: SHEETS.SCHEDULE, headers: ['ID', 'Група', 'Ден', 'НачалоЧас', 'КрайЧас', 'Преподавател'] },
    { name: SHEETS.ATTENDANCE, headers: ['ID', 'УченикID', 'Дата', 'Статус'] },
    { name: SHEETS.PROGRESS, headers: ['ID', 'УченикID', 'Дата', 'Бележка'] },
    { name: SHEETS.TEACHERS, headers: ['Име', 'Имейл'] },
    { name: SHEETS.EVENTS, headers: ['ID', 'Дата', 'Начален час', 'Краен час', 'Описание', 'ОписаниеСъбитие', 'УченикID', 'ПреподавателИме', 'EmailStatus', 'TriggerID'] },
    { name: SHEETS.EXPENSE_CATEGORIES, headers: ['Категория'] },
    { name: SHEETS.NOTES, headers: ['ID', 'Дата', 'Тема', 'Съдържание'] }
  ];

  const existingSheetNames = ss.getSheets().map(s => s.getName());

  sheetsToCreate.forEach(sheetInfo => {
    let sheet;
    if (existingSheetNames.indexOf(sheetInfo.name) === -1) {
      sheet = ss.insertSheet(sheetInfo.name);
    } else {
      sheet = ss.getSheetByName(sheetInfo.name);
      sheet.clear();
    }
    sheet.appendRow(sheetInfo.headers).setFrozenRows(1);
    sheet.getRange(1, 1, 1, sheetInfo.headers.length).setFontWeight('bold');
  });

  ss.getSheetByName(SHEETS.EXPENSE_CATEGORIES).appendRow(['Наем']);
  ss.getSheetByName(SHEETS.EXPENSE_CATEGORIES).appendRow(['Консумативи']);
  ss.getSheetByName(SHEETS.EXPENSE_CATEGORIES).appendRow(['Заплати']);
  ss.getSheetByName(SHEETS.EXPENSE_CATEGORIES).appendRow(['Маркетинг']);
  ss.getRange(EUR_RATE_CELL).setValue(0.51129);

  if (existingSheetNames.indexOf('Sheet1') > -1 && ss.getSheets().length > 1) {
    ss.deleteSheet(ss.getSheetByName('Sheet1'));
  }

  SpreadsheetApp.flush();
  Logger.log('Настройката на Google Sheet-а е завършена.');
}

function setupInitialTriggers() {
  const allTriggers = ScriptApp.getProjectTriggers();
  for (const trigger of allTriggers) {
    if (trigger.getHandlerFunction() === "createNightlyBackup") {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  ScriptApp.newTrigger("createNightlyBackup")
    .timeBased()
    .atHour(3)
    .everyDays(1)
    .create();
  Logger.log("Нощният тригер за архивиране е настроен.");
}

// ============================================
// === ГЛАВНА ФУНКЦИЯ ЗА ЗАРЕЖДАНЕ ===
// ============================================

function getAllDataWithConfig() {
  try {
    const data = {
      students: getStudents(),
      parents: getParents(),
      payments: getPayments(),
      expenses: getExpenses(),
      discounts: getDiscounts(),
      schedule: getSchedule(),
      attendance: getAttendance(),
      progress: getProgress(),
      events: getEvents(),
      notes: getNotes(),
      teachers: sheetToArray(SHEETS.TEACHERS),
      expenseCategories: sheetToArray(SHEETS.EXPENSE_CATEGORIES).map(c => c.Категория),
      eurRate: SpreadsheetApp.getActiveSpreadsheet().getRange(EUR_RATE_CELL).getValue() || 0.51129,
      dashboard: getDashboardData()
    };
    return data;
  } catch (e) {
    Logger.log(`Грешка в getAllDataWithConfig: ${e}`);
    return { error: e.message };
  }
}

// ============================================
// === GET ФУНКЦИИ (ЧЕТЕНЕ) ===
// ============================================
function getStudents() { return sheetToArray(SHEETS.STUDENTS); }
function getParents() { return sheetToArray(SHEETS.PARENTS); }
function getPayments() { return sheetToArray(SHEETS.PAYMENTS); }
function getExpenses() { return sheetToArray(SHEETS.EXPENSES); }
function getDiscounts() { return sheetToArray(SHEETS.DISCOUNTS); }
function getSchedule() { return sheetToArray(SHEETS.SCHEDULE); }
function getAttendance() { return sheetToArray(SHEETS.ATTENDANCE); }
function getProgress() { return sheetToArray(SHEETS.PROGRESS); }
function getEvents() { return sheetToArray(SHEETS.EVENTS); }
function getNotes() { return sheetToArray(SHEETS.NOTES); }

// ============================================
// === CREATE ФУНКЦИИ - ПОПРАВЕНИ ===
// ============================================

function addStudent(data) {
  const sheet = getSheet(SHEETS.STUDENTS);
  const id = getNextId(SHEETS.STUDENTS);
  const eurRate = SpreadsheetApp.getActiveSpreadsheet().getRange(EUR_RATE_CELL).getValue() || 0.51129;
  const feeEur = (data.fee || 0) * eurRate;

  const row = [
    id,
    data.name || '',
    data.group || '',
    data.fee || 0,
    feeEur,
    data.dueDate || new Date(),
    data.status || 'active',
    data.parentId || '',
    data.studyType || 'Групово',
    data.registrationDate || new Date()
  ];
  sheet.appendRow(row);
  const newRecord = findRowById(sheet, id).record;

  if (data.fee && data.fee > 0 && data.initialPayment) {
    addPayment({
      studentId: id,
      date: data.registrationDate || new Date(),
      amount: data.fee,
      method: data.paymentMethod || 'Кеш',
      description: 'Първоначално плащане при регистрация',
      article: ''
    });
  }

  return {success: true, newData: newRecord};
}

function addParent(data) {
  const sheet = getSheet(SHEETS.PARENTS);
  const id = getNextId(SHEETS.PARENTS);
  const row = [
    id,
    data.name || '',
    data.phone || '',
    data.email || ''
  ];
  sheet.appendRow(row);
  const newRecord = findRowById(sheet, id).record;
  return {success: true, newData: newRecord};
}

function addPayment(data) {
  const sheet = getSheet(SHEETS.PAYMENTS);
  const id = getNextId(SHEETS.PAYMENTS);
  const eurRate = SpreadsheetApp.getActiveSpreadsheet().getRange(EUR_RATE_CELL).getValue() || 0.51129;
  const amountEur = (data.amount || 0) * eurRate;

  const row = [
    id,
    data.studentId || '',
    data.date || new Date(),
    data.amount || 0,
    amountEur,
    data.method || 'Кеш',
    data.description || '',
    data.article || ''
  ];
  sheet.appendRow(row);
  const newRecord = findRowById(sheet, id).record;
  return {success: true, newData: newRecord};
}

function addExpense(data) {
  const sheet = getSheet(SHEETS.EXPENSES);
  const id = getNextId(SHEETS.EXPENSES);
  const row = [
    id,
    data.date || new Date(),
    data.description || '',
    data.method || 'Кеш',
    data.amount || 0,
    data.category || ''
  ];
  sheet.appendRow(row);
  const newRecord = findRowById(sheet, id).record;
  return {success: true, newData: newRecord};
}

function addDiscount(data) {
  const sheet = getSheet(SHEETS.DISCOUNTS);
  const id = getNextId(SHEETS.DISCOUNTS);
  const row = [
    id,
    data.studentId || '',
    data.reason || '',
    data.type || 'fixed',
    data.value || 0
  ];
  sheet.appendRow(row);
  const newRecord = findRowById(sheet, id).record;
  return {success: true, newData: newRecord};
}

function addSchedule(data) {
  const sheet = getSheet(SHEETS.SCHEDULE);
  const id = getNextId(SHEETS.SCHEDULE);
  const row = [
    id,
    data.group || '',
    data.day || '',
    data.startTime || '',
    data.endTime || '',
    data.teacher || ''
  ];
  sheet.appendRow(row);
  const newRecord = findRowById(sheet, id).record;
  return {success: true, newData: newRecord};
}

function addAttendance(data) {
  const sheet = getSheet(SHEETS.ATTENDANCE);
  const id = getNextId(SHEETS.ATTENDANCE);
  const row = [
    id,
    data.studentId || '',
    data.date || new Date(),
    data.status || 'present'
  ];
  sheet.appendRow(row);
  const newRecord = findRowById(sheet, id).record;
  return {success: true, newData: newRecord};
}

function addProgress(data) {
  const sheet = getSheet(SHEETS.PROGRESS);
  const id = getNextId(SHEETS.PROGRESS);
  const row = [
    id,
    data.studentId || '',
    data.date || new Date(),
    data.note || ''
  ];
  sheet.appendRow(row);
  const newRecord = findRowById(sheet, id).record;
  return {success: true, newData: newRecord};
}

function addTeacher(data) {
  const sheet = getSheet(SHEETS.TEACHERS);
  const row = [
    data.name || '',
    data.email || ''
  ];
  sheet.appendRow(row);
  return {success: true, newData: { Име: data.name, Имейл: data.email }};
}

function addNote(data) {
  const sheet = getSheet(SHEETS.NOTES);
  const id = getNextId(SHEETS.NOTES);
  const row = [
    id,
    data.date || new Date(),
    data.subject || 'N/A',
    data.content || ''
  ];
  sheet.appendRow(row);
  const newRecord = findRowById(sheet, id).record;
  return {success: true, newData: newRecord};
}

// ============================================
// === UPDATE & DELETE ФУНКЦИИ ===
// ============================================

function updateRecord(data) {
  const { sheetName, id, rowData, uniqueKey } = data;
  if (!sheetName || (!id && !uniqueKey) || !rowData) {
    return { success: false, error: "Липсват данни за обновяване." };
  }

  try {
    const sheet = getSheet(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const { rowNum, record } = uniqueKey ?
      findRowByUniqueKey(sheet, uniqueKey, headers, 'Име') :
      findRowById(sheet, id, headers);

    if (rowNum === -1) {
      return { success: false, error: "Записът не е намерен." };
    }

    const newRow = headers.map(header => {
      if (rowData.hasOwnProperty(header)) {
        return rowData[header];
      }
      return record[header];
    });

    sheet.getRange(rowNum, 1, 1, newRow.length).setValues([newRow]);

    const updatedRecord = {};
    headers.forEach((header, index) => updatedRecord[header] = newRow[index]);

    return { success: true, updatedData: updatedRecord };
  } catch (e) {
    Logger.log(`Грешка при updateRecord: ${e}`);
    return { success: false, error: e.message };
  }
}

function deleteRecord(data) {
  const { sheetName, id, uniqueKey } = data;
  if (!sheetName || (!id && !uniqueKey)) {
    return { success: false, error: "Липсват данни за изтриване." };
  }

  try {
    const sheet = getSheet(sheetName);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const { rowNum, record } = uniqueKey ?
      findRowByUniqueKey(sheet, uniqueKey, headers, 'Име') :
      findRowById(sheet, id, headers);

    if (rowNum === -1) {
      return { success: false, error: "Записът не е намерен." };
    }

    if (sheetName === SHEETS.EVENTS && record.TriggerID) {
      deleteTriggerByUid(record.TriggerID);
    }

    sheet.deleteRow(rowNum);

    return { success: true, deletedId: id, deletedKey: uniqueKey };
  } catch (e) {
    Logger.log(`Грешка при deleteRecord: ${e}`);
    return { success: false, error: e.message };
  }
}

// ==========================================================
// === СЪБИТИЯ И НОТИФИКАЦИИ - ПОПРАВЕНО ===
// ==========================================================

function addEvent(data) {
  const sheet = getSheet(SHEETS.EVENTS);
  const id = getNextId(SHEETS.EVENTS);
  let triggerId = null;
  let emailStatus = "N/A";

  if (data.reminder !== 'none') {
    try {
      const eventDate = new Date(data.date + 'T' + data.startTime);
      let triggerDate = new Date(eventDate.getTime());

      if (data.reminder === '1h') triggerDate.setHours(triggerDate.getHours() - 1);
      else if (data.reminder === '1d') triggerDate.setDate(triggerDate.getDate() - 1);
      else if (data.reminder === '1w') triggerDate.setDate(triggerDate.getDate() - 7);

      const eventDataForEmail = { ...data, id: id };

      if (data.reminder === 'now' || triggerDate.getTime() < new Date().getTime()) {
        sendEventEmail(eventDataForEmail, id);
        emailStatus = "SENT";
      } else {
        const trigger = ScriptApp.newTrigger('handleScheduledEmail')
          .timeBased()
          .at(triggerDate)
          .create();
        triggerId = trigger.getUniqueId();
        emailStatus = "PENDING";

        PropertiesService.getScriptProperties().setProperty(triggerId, JSON.stringify(eventDataForEmail));
      }
    } catch (e) {
      Logger.log(`Грешка при създаване на тригер: ${e}`);
      emailStatus = "FAILED";
    }
  }

  const row = [
    id,
    data.date || new Date(),
    data.startTime || '',
    data.endTime || '',
    data.description || '',
    data.eventDescription || '',
    data.studentId || '',
    data.teacherName || '',
    emailStatus,
    triggerId
  ];
  sheet.appendRow(row);

  const newRecord = findRowById(sheet, id).record;
  return { success: true, newData: newRecord };
}

function handleScheduledEmail(e) {
  const triggerId = e.triggerUid;
  if (!triggerId) return;

  const eventDataString = PropertiesService.getScriptProperties().getProperty(triggerId);
  if (!eventDataString) {
    Logger.log(`Не са намерени данни за тригер ${triggerId}`);
    deleteTriggerByUid(triggerId);
    return;
  }

  const eventData = JSON.parse(eventDataString);

  sendEventEmail(eventData, eventData.id);

  const sheet = getSheet(SHEETS.EVENTS);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const { rowNum } = findRowById(sheet, eventData.id, headers);

  if (rowNum > -1) {
    sheet.getRange(rowNum, headers.indexOf('EmailStatus') + 1).setValue('SENT');
    sheet.getRange(rowNum, headers.indexOf('TriggerID') + 1).setValue('');
  }

  PropertiesService.getScriptProperties().deleteProperty(triggerId);
  deleteTriggerByUid(triggerId);
}

function sendEventEmail(eventData, eventId) {
  try {
    const teachers = sheetToArray(SHEETS.TEACHERS);
    const teacher = teachers.find(t => t.Име === eventData.teacherName);
    if (!teacher || !teacher.Имейл) {
      Logger.log(`Не е намерен имейл за учител: ${eventData.teacherName}`);
      return;
    }

    let studentName = "Няма";
    if (eventData.studentId) {
      const student = findRowById(getSheet(SHEETS.STUDENTS), eventData.studentId).record;
      if (student) studentName = student.Име;
    }

    const subject = `[Светлинки CRM] Напомняне: ${eventData.description}`;
    const body = `
  Здравейте, ${teacher.Име},

  Това е напомняне за Вашето насрочено събитие:

  Дата: ${new Date(eventData.date).toLocaleDateString('bg-BG')}
  Час: ${eventData.startTime}
  Ученик: ${studentName}
  Описание: ${eventData.description}
  Детайли: ${eventData.eventDescription || 'Няма'}

  (ID на събитието: ${eventId})
`;

    MailApp.sendEmail(teacher.Имейл, subject, body);
    Logger.log(`Имейлът е изпратен до ${teacher.Имейл}`);
  } catch (e) {
    Logger.log(`Грешка при изпращане на имейл: ${e}`);
  }
}

// ============================================
// === DASHBOARD ЛОГИКА ===
// ============================================

function getDashboardData() {
  const today = new Date();
  const todayDayName = today.toLocaleDateString('bg-BG', { weekday: 'long' });
  today.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const allStudents = getStudents().filter(s => s.Статус === 'active');
  const allPayments = getPayments();
  const allSchedule = getSchedule();

  const paymentsThisMonth = allPayments.filter(p => {
    const paymentDate = new Date(p.Дата);
    return paymentDate >= startOfMonth;
  });

  const paymentMap = new Set(paymentsThisMonth.map(p => p.УченикID));

  const dashboard = {
    overdue: [],
    upcoming: [],
    todayClasses: []
  };

  allStudents.forEach(student => {
    if (paymentMap.has(student.ID)) {
      return;
    }

    const dueDate = new Date(student.Падеж);

    if (dueDate < today) {
      dashboard.overdue.push(student);
    } else if (dueDate >= today && dueDate <= next7Days) {
      dashboard.upcoming.push(student);
    }
  });

  dashboard.todayClasses = allSchedule.filter(s => s.Ден.toLowerCase() === todayDayName.toLowerCase());

  return dashboard;
}

// ============================================
// === ТЪРСЕНЕ "ДОСИЕ" ===
// ============================================

function searchAll(query) {
  if (!query || query.length < 2) {
    return { error: 'Търсенето изисква поне 2 символа' };
  }

  const lowerQuery = String(query).toLowerCase();
  const results = { studentProfiles: [] };
  const matchedStudentIDs = new Set();

  try {
    const allStudents = getStudents();
    const allParents = getParents();
    const allPayments = getPayments();
    const allAttendance = getAttendance();
    const allProgress = getProgress();
    const allDiscounts = getDiscounts();
    const allSchedule = getSchedule();

    allStudents.forEach(s => {
      if ((s.Име && String(s.Име).toLowerCase().includes(lowerQuery)) ||
          (s.Група && String(s.Група).toLowerCase().includes(lowerQuery))) {
        matchedStudentIDs.add(s.ID);
      }
    });

    const matchedParentIDs = new Set();
    allParents.forEach(p => {
      if ((p.Име && String(p.Име).toLowerCase().includes(lowerQuery)) ||
          (p.Телефон && String(p.Телефон).includes(lowerQuery)) ||
          (p.Имейл && String(p.Имейл).toLowerCase().includes(lowerQuery))) {
        matchedParentIDs.add(p.ID);
      }
    });

    if (matchedParentIDs.size > 0) {
      allStudents.forEach(s => {
        if (matchedParentIDs.has(s['Родител (ID)'])) {
          matchedStudentIDs.add(s.ID);
        }
      });
    }

    allPayments.forEach(p => {
      if (p.Описание && String(p.Описание).toLowerCase().includes(lowerQuery)) {
        matchedStudentIDs.add(p.УченикID);
      }
    });

    matchedStudentIDs.forEach(id => {
      const student = allStudents.find(s => s.ID == id);
      if (!student) return;

      const studentSchedule = allSchedule.filter(s => s.Група === student.Група);

      results.studentProfiles.push({
        student: student,
        parent: allParents.find(p => p.ID == student['Родител (ID)']) || {},
        payments: allPayments.filter(p => p.УченикID == id),
        attendance: allAttendance.filter(a => a.УченикID == id),
        progress: allProgress.filter(p => p.УченикID == id),
        discounts: allDiscounts.filter(d => d.УченикID == id),
        schedule: studentSchedule
      });
    });

    return results;
  } catch (e) {
    Logger.log(`Грешка при търсене: ${e}`);
    return { error: `Грешка на сървъра: ${e.message}`};
  }
}

// ============================================
// === АРХИВИРАНЕ ===
// ============================================

function createNightlyBackup() {
  Logger.log("Започва нощен архив...");
  const result = createBackup();
  Logger.log(result.message);
}

function createBackup() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const file = DriveApp.getFileById(ss.getId());

    const folder = getFolder(BACKUP_FOLDER_NAME);

    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd_HH-mm-ss");
    const backupName = `[BACKUP ${timestamp}] ${ss.getName()}`;

    file.makeCopy(backupName, folder);

    cleanupOldBackups(folder, 30);

    return { success: true, message: `Архивът '${backupName}' е създаден успешно.` };
  } catch (e) {
    Logger.log(`Грешка при архивиране: ${e}`);
    return { success: false, error: e.message };
  }
}

function cleanupOldBackups(folder, daysToKeep) {
  const thirtyDaysAgo = new Date(new Date().getTime() - (daysToKeep * 24 * 60 * 60 * 1000));
  const files = folder.getFiles();

  while (files.hasNext()) {
    const file = files.next();
    if (file.getDateCreated() < thirtyDaysAgo) {
      file.setTrashed(true);
      Logger.log(`Изтрит стар архив: ${file.getName()}`);
    }
  }
}

// ============================================
// === СПРАВКИ - НАПЪЛНО ПОПРАВЕНИ ===
// ============================================

function generateReport(options) {
  try {
    switch(options.reportType) {
      case 'financial':
        return generateFinancialReport(options);
      case 'expenseCategory':
        return generateExpenseCategoryReport(options);
      case 'roster':
        return generateRosterReport(options);
      case 'groupRevenue':
        return generateGroupRevenueReport(options);
      default:
        return { success: false, error: 'Неизвестен тип справка' };
    }
  } catch (e) {
    Logger.log(`Грешка при генериране на справка: ${e.message} \n ${e.stack}`);
    return { success: false, error: e.message };
  }
}

function generateFinancialReport(options) {
  const { startDate, endDate, format } = options;
  const folder = getFolder(REPORTS_FOLDER_NAME);
  const title = `Финансова справка ${startDate} - ${endDate}`;

  const payments = getPayments().filter(p => {
    const d = new Date(p.Дата);
    return d >= new Date(startDate) && d <= new Date(endDate);
  });
  const expenses = getExpenses().filter(e => {
    const d = new Date(e.Дата);
    return d >= new Date(startDate) && d <= new Date(endDate);
  });

  let totalRevenue = payments.reduce((sum, p) => sum + Number(p.Сума || 0), 0);
  let totalExpenses = expenses.reduce((sum, e) => sum + Number(e.Сума || 0), 0);

  const doc = DocumentApp.create(title);
  const body = doc.getBody();

  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`Период: ${startDate} - ${endDate}`);
  body.appendParagraph("");
  body.appendParagraph(`ОБЩО ПРИХОДИ: ${totalRevenue.toFixed(2)} лв.`).setBold(true);
  body.appendParagraph(`ОБЩО РАЗХОДИ: ${totalExpenses.toFixed(2)} лв.`).setBold(true);
  body.appendParagraph(`ПЕЧАЛБА: ${(totalRevenue - totalExpenses).toFixed(2)} лв.`).setBold(true);

  body.appendParagraph("\n--- ДЕТАЙЛНИ ПРИХОДИ ---").setBold(true);
  if (payments.length > 0) {
    const paymentsTable = [['Дата', 'Описание', 'Метод', 'Сума']];
    payments.forEach(p => paymentsTable.push([formatDate(p.Дата), p.Описание || '', p.Метод || '', String(Number(p.Сума || 0).toFixed(2))]));
    body.appendTable(paymentsTable);
  } else {
    body.appendParagraph("Няма приходи за периода.");
  }

  body.appendParagraph("\n--- ДЕТАЙЛНИ РАЗХОДИ ---").setBold(true);
  if (expenses.length > 0) {
    const expensesTable = [['Дата', 'Описание', 'Категория', 'Метод', 'Сума']];
    expenses.forEach(e => expensesTable.push([formatDate(e.Дата), e.Описание || '', e.Категория || '', e.Метод || '', String(Number(e.Сума || 0).toFixed(2))]));
    body.appendTable(expensesTable);
  } else {
    body.appendParagraph("Няма разходи за периода.");
  }

  doc.saveAndClose();
  Utilities.sleep(2000);

  return convertAndMove(doc.getId(), title, format, folder);
}

function generateExpenseCategoryReport(options) {
  const { startDate, endDate, format } = options;
  const folder = getFolder(REPORTS_FOLDER_NAME);
  const title = `Разходи по категории ${startDate} - ${endDate}`;

  const expenses = getExpenses().filter(e => {
    const d = new Date(e.Дата);
    return d >= new Date(startDate) && d <= new Date(endDate);
  });

  const categoryTotals = {};
  expenses.forEach(e => {
    const cat = e.Категория || 'Без категория';
    if (!categoryTotals[cat]) categoryTotals[cat] = 0;
    categoryTotals[cat] += Number(e.Сума || 0);
  });

  const doc = DocumentApp.create(title);
  const body = doc.getBody();

  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`Период: ${startDate} - ${endDate}`);
  body.appendParagraph("");

  const tableData = [['Категория', 'Обща сума (лв.)']];
  Object.keys(categoryTotals).forEach(cat => {
    tableData.push([cat, String(categoryTotals[cat].toFixed(2))]);
  });

  body.appendTable(tableData);

  const totalExpenses = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
  body.appendParagraph("");
  body.appendParagraph(`ОБЩО РАЗХОДИ: ${totalExpenses.toFixed(2)} лв.`).setBold(true);

  doc.saveAndClose();
  Utilities.sleep(2000);

  return convertAndMove(doc.getId(), title, format, folder);
}

function generateRosterReport(options) {
  const { format } = options;
  const folder = getFolder(REPORTS_FOLDER_NAME);
  const title = `Списък с контакти ${new Date().toLocaleDateString('bg-BG')}`;

  const students = getStudents().filter(s => s.Статус === 'active');
  const parents = getParents();
  const parentMap = new Map(parents.map(p => [p.ID, p]));

  const doc = DocumentApp.create(title);
  const body = doc.getBody();
  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph("");

  const tableData = [['Ученик', 'Група', 'Родител', 'Телефон', 'Имейл']];
  students.forEach(s => {
    const parent = parentMap.get(s['Родител (ID)']);
    tableData.push([
      s.Име || '',
      s.Група || '',
      parent ? (parent.Име || '') : 'Няма',
      parent ? (parent.Телефон || '') : 'Няма',
      parent ? (parent.Имейл || '') : 'Няма'
    ]);
  });
  body.appendTable(tableData);
  doc.saveAndClose();
  Utilities.sleep(2000);

  return convertAndMove(doc.getId(), title, format, folder);
}

function generateGroupRevenueReport(options) {
  const { startDate, endDate, format } = options;
  const folder = getFolder(REPORTS_FOLDER_NAME);
  const title = `Приходи по групи ${startDate} - ${endDate}`;

  const students = getStudents();
  const payments = getPayments().filter(p => {
    const d = new Date(p.Дата);
    return d >= new Date(startDate) && d <= new Date(endDate);
  });

  const groupTotals = {};
  payments.forEach(p => {
    const student = students.find(s => s.ID == p.УченикID);
    if (student) {
      const group = student.Група || 'Без група';
      if (!groupTotals[group]) groupTotals[group] = 0;
      groupTotals[group] += Number(p.Сума || 0);
    }
  });

  const doc = DocumentApp.create(title);
  const body = doc.getBody();

  body.appendParagraph(title).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(`Период: ${startDate} - ${endDate}`);
  body.appendParagraph("");

  const tableData = [['Група', 'Обща сума (лв.)']];
  Object.keys(groupTotals).forEach(group => {
    tableData.push([group, String(groupTotals[group].toFixed(2))]);
  });

  body.appendTable(tableData);

  const totalRevenue = Object.values(groupTotals).reduce((sum, val) => sum + val, 0);
  body.appendParagraph("");
  body.appendParagraph(`ОБЩО ПРИХОДИ: ${totalRevenue.toFixed(2)} лв.`).setBold(true);

  doc.saveAndClose();
  Utilities.sleep(2000);

  return convertAndMove(doc.getId(), title, format, folder);
}

function convertAndMove(docId, title, format, folder) {
  try {
    const file = DriveApp.getFileById(docId);

    const parents = file.getParents();
    while (parents.hasNext()) {
      const parent = parents.next();
      parent.removeFile(file);
    }
    folder.addFile(file);

    if (format === 'pdf') {
      const pdfBlob = file.getAs(MimeType.PDF).setName(`${title}.pdf`);
      const pdfFile = folder.createFile(pdfBlob);
      file.setTrashed(true);
      return { success: true, url: pdfFile.getUrl(), name: pdfFile.getName() };
    } else if (format === 'sheet') {
      return { success: true, url: file.getUrl(), name: file.getName() };
    }

    return { success: true, url: file.getUrl(), name: file.getName() };
  } catch (e) {
    Logger.log(`Грешка в convertAndMove: ${e}`);
    return { success: false, error: e.message };
  }
}

// ============================================
// === ПОМОЩНИ ФУНКЦИИ ===
// ============================================

function getFolder(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rootFolder = DriveApp.getFileById(ss.getId()).getParents().next();
  const folders = rootFolder.getFoldersByName(name);

  if (folders.hasNext()) {
    return folders.next();
  } else {
    return rootFolder.createFolder(name);
  }
}

function deleteTriggerByUid(triggerUid) {
  const allTriggers = ScriptApp.getProjectTriggers();
  for (const trigger of allTriggers) {
    if (trigger.getUniqueId() === triggerUid) {
      ScriptApp.deleteTrigger(trigger);
      Logger.log(`Тригер ${triggerUid} е изтрит.`);
      break;
    }
  }
}

function sheetToArray(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) {
    Logger.log(`Грешка: Лист с име "${sheetName}" не е намерен.`);
    return [];
  }
  const dataRange = sheet.getDataRange();
  if (dataRange.getNumRows() <= 1) return [];

  const data = dataRange.getValues();
  const headers = data[0].map(h => String(h).trim());
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (header) {
        let value = row[index];
        if (value instanceof Date) {
          value = value.toISOString();
        }
        obj[header] = value;
      }
    });
    return obj;
  });
}

function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName);
}

function getNextId(sheetName) {
  const sheet = getSheet(sheetName);
  if (!sheet) return 1;
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 1;
  const lastId = sheet.getRange(lastRow, 1).getValue();
  return Number(lastId) + 1;
}

function findRowById(sheet, id, headers) {
  if (!headers) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  const idColumn = headers.indexOf("ID");
  if (idColumn === -1) return { rowNum: -1, record: null };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][idColumn] == id) {
      const record = {};
      headers.forEach((header, index) => {
        let value = data[i][index];
        if (value instanceof Date) value = value.toISOString();
        record[header] = value;
      });
      return { rowNum: i + 2, record: record };
    }
  }
  return { rowNum: -1, record: null };
}

function findRowByUniqueKey(sheet, key, headers, keyHeaderName) {
  if (!headers) {
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  const keyColumn = headers.indexOf(keyHeaderName);
  if (keyColumn === -1) return { rowNum: -1, record: null };

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();

  for (let i = 0; i < data.length; i++) {
    if (data[i][keyColumn] == key) {
      const record = {};
      headers.forEach((header, index) => {
        let value = data[i][index];
        if (value instanceof Date) value = value.toISOString();
        record[header] = value;
      });
      return { rowNum: i + 2, record: record };
    }
  }
  return { rowNum: -1, record: null };
}

function formatDate(dateValue) {
  if (!dateValue) return '';
  try {
    const date = new Date(dateValue);
    return date.toLocaleDateString('bg-BG');
  } catch (e) {
    return String(dateValue);
  }
}
