// Облачное хранилище Supabase
const supabaseUrl = 'https://ekmuybvrgwpoxmpkdmsp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrbXV5YnZyZ3dwb3htcGtkbXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNTAyODksImV4cCI6MjA4ODYyNjI4OX0.XeDxTb0Yl2mMnHUY8PIGSKfv-gCGc8-biGumiR1nmDk';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Определяем user_id из Telegram Web App (или используем тестовый, если открыто в браузере)
let tgUserId = 'local_test_user';
if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
    tgUserId = window.Telegram.WebApp.initDataUnsafe.user.id.toString();
    // Сообщаем телеграму, что приложение готово
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
}

// Глобальный кэш данных для синхронной работы UI
window.appData = {
    accounts: [],
    transactions: [],
    loaded: false
};

// Функция генерации уникального идентификатора (почти как UUID v4)
function generateUUID() {
    if (crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Первоначальная асинхронная загрузка данных с сервера
async function loadDataFromSupabase() {
    try {
        const [accRes, transRes] = await Promise.all([
            supabase.from('accounts').select('*').eq('user_id', tgUserId),
            supabase.from('transactions').select('*').eq('user_id', tgUserId)
        ]);

        if (accRes.error) throw accRes.error;
        if (transRes.error) throw transRes.error;

        window.appData.accounts = accRes.data || [];
        window.appData.transactions = transRes.data || [];
        window.appData.loaded = true;
        
        console.log("Данные успешно загружены из Supabase");
    } catch (error) {
        console.error("Ошибка при загрузке из Supabase:", error);
    }
}

// Загрузка счетов (синхронно из кэша)
function loadAccounts() {
    return window.appData.accounts;
}

// Загрузка транзакций (синхронно из кэша)
function loadTransactions() {
    return window.appData.transactions;
}

// Добавление нового счета
function addAccount(account) {
    account.id = generateUUID();
    account.user_id = tgUserId; // Привязываем к Telegram ID
    
    // Оптимистичное обновление UI (добавляем локально до получения ответа от сервера)
    window.appData.accounts.push({ ...account });
    
    // Асинхронное сохранение в Supabase
    supabase.from('accounts').insert([account]).then(({error}) => {
        if (error) console.error("Ошибка сохранения счета в Supabase:", error);
    });
    
    return account;
}

// Удаление счета
function removeAccount(id) {
    window.appData.accounts = window.appData.accounts.filter(account => account.id !== id);
    
    supabase.from('accounts').delete().eq('id', id).then(({error}) => {
        if (error) console.error("Ошибка удаления счета в Supabase:", error);
    });
}

// Получение всех счетов
function getAllAccounts() {
    return loadAccounts();
}

// Обновление счета
function updateAccount(id, updatedAccount) {
    const index = window.appData.accounts.findIndex(account => account.id === id);
    if (index !== -1) {
        window.appData.accounts[index] = { ...window.appData.accounts[index], ...updatedAccount };
        
        const payload = { ...updatedAccount };
        delete payload.id;
        delete payload.user_id;

        supabase.from('accounts').update(payload).eq('id', id).then(({error}) => {
            if (error) console.error("Ошибка обновления счета в Supabase:", error);
        });
    }
}

// Добавление новой транзакции
function addTransaction(transaction) {
    transaction.id = generateUUID();
    transaction.user_id = tgUserId;
    
    window.appData.transactions.push({ ...transaction });

    supabase.from('transactions').insert([transaction]).then(({error}) => {
        if (error) console.error("Ошибка сохранения транзакции в Supabase:", error);
    });
    
    return transaction;
}

// Удаление транзакции
function removeTransaction(id) {
    window.appData.transactions = window.appData.transactions.filter(transaction => transaction.id !== id);
    
    supabase.from('transactions').delete().eq('id', id).then(({error}) => {
        if (error) console.error("Ошибка удаления транзакции в Supabase:", error);
    });
}

// Обновление транзакции
function updateTransaction(id, updatedTransaction) {
    const index = window.appData.transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        window.appData.transactions[index] = { ...window.appData.transactions[index], ...updatedTransaction };
        
        const payload = { ...updatedTransaction };
        delete payload.id;
        delete payload.user_id;

        supabase.from('transactions').update(payload).eq('id', id).then(({error}) => {
            if (error) console.error("Ошибка обновления транзакции в Supabase:", error);
        });
    }
}

// Получение всех транзакций
function getAllTransactions() {
    return loadTransactions();
}

// Фильтрация транзакций по дате
function getTransactionsByDate(fromDate, toDate) {
    const transactions = loadTransactions();
    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const startDate = fromDate ? new Date(fromDate) : new Date(0);
        const endDate = toDate ? new Date(toDate) : new Date();

        // Устанавливаем время на конец дня для toDate
        if (toDate) {
            endDate.setHours(23, 59, 59, 999);
        }

        return transactionDate >= startDate && transactionDate <= endDate;
    });
}

// Получение транзакций по типу (доход/расход)
function getTransactionsByType(type) {
    const transactions = loadTransactions();
    return transactions.filter(transaction => transaction.type === type);
}

// Получение транзакций по счету
function getTransactionsByAccount(accountId) {
    const transactions = loadTransactions();
    return transactions.filter(transaction => transaction.accountId === accountId);
}

// Расчет баланса по всем счетам
function calculateTotalBalance() {
    const accounts = loadAccounts();
    let totalBalance = 0;

    accounts.forEach(account => {
        totalBalance += parseFloat(account.initial_balance || account.initialBalance || 0);
    });

    const transactions = loadTransactions();
    transactions.forEach(transaction => {
        const account = accounts.find(acc => acc.id === transaction.accountId || acc.id === transaction.account_id);
        if (account) {
            if (transaction.type === 'income') {
                totalBalance += parseFloat(transaction.amount) || 0;
            } else if (transaction.type === 'expense') {
                totalBalance -= parseFloat(transaction.amount) || 0;
            }
        }
    });

    return totalBalance;
}

// Расчет баланса по конкретному счету
function calculateAccountBalance(accountId) {
    const account = getAllAccounts().find(acc => acc.id === accountId);
    if (!account) return 0;

    let balance = parseFloat(account.initial_balance || account.initialBalance || 0);

    const transactions = loadTransactions();
    transactions.forEach(transaction => {
        if (transaction.accountId === accountId || transaction.account_id === accountId) {
            if (transaction.type === 'income') {
                balance += parseFloat(transaction.amount) || 0;
            } else if (transaction.type === 'expense') {
                balance -= parseFloat(transaction.amount) || 0;
            }
        }
    });

    return balance;
}

// Расчет баланса для отображения (доходы и расходы)
function calculateBalance() {
    const transactions = loadTransactions();
    let income = 0;
    let expense = 0;

    transactions.forEach(transaction => {
        if (transaction.type === 'income') {
            income += parseFloat(transaction.amount) || 0;
        } else if (transaction.type === 'expense') {
            expense += parseFloat(transaction.amount) || 0;
        }
    });

    return {
        total: calculateTotalBalance(),
        income: income,
        expense: expense
    };
}

// Группировка расходов по категориям
function getExpensesByCategory() {
    const transactions = loadTransactions();
    const expenses = transactions.filter(t => t.type === 'expense');

    const categories = {};
    expenses.forEach(transaction => {
        const category = transaction.category;
        const amount = parseFloat(transaction.amount) || 0;

        if (categories[category]) {
            categories[category] += amount;
        } else {
            categories[category] = amount;
        }
    });

    return categories;
}
