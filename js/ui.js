// Функции для отображения интерфейса

let currentEditingAccountId = null;
let currentEditingTransactionId = null;
let analyticsChart = null;

// Отображение списка счетов
function renderAccounts() {
    const container = document.getElementById('accounts-list');
    if (!container) return;

    const accounts = getAllAccounts();
    container.innerHTML = '';

    if (!accounts || accounts.length === 0) {
        container.innerHTML = '<p>Нет счетов для отображения</p>';
        return;
    }

    accounts.forEach(account => {
        const accountElement = document.createElement('div');
        accountElement.className = 'account-item';

        const balance = calculateAccountBalance(account.id);
        const icon = getAccountIcon(account.type);

        accountElement.innerHTML = `
            <div class="account-icon-container">${icon}</div>
            <div class="account-info">
                <div class="account-name">${account.name}</div>
                <div class="account-type">${getAccountTypeName(account.type)}</div>
                <div class="account-balance" style="font-weight: bold;">${balance.toFixed(2)} ₽</div>
            </div>
            <div class="account-actions">
                <button class="btn-small btn-edit" onclick="editAccountUI('${account.id}')">Ред.</button>
                <button class="btn-small btn-delete" onclick="deleteAccountUI('${account.id}')">Уд.</button>
            </div>
        `;

        container.appendChild(accountElement);
    });

    // Также обновляем общий баланс
    updateTotalBalanceDisplay();
}

// Отображение списка транзакций
function renderTransactions(transactions) {
    const container = document.getElementById('transactions-list');
    container.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p>Нет операций для отображения</p>';
        return;
    }

    // Сортировка транзакций по дате (новые первыми)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    transactions.forEach(transaction => {
        const transactionElement = document.createElement('div');
        transactionElement.className = `transaction-item ${transaction.type}`;

        // Получаем информацию о счете
        const account = getAllAccounts().find(acc => acc.id === transaction.accountId);
        const accountName = account ? account.name : 'Неизвестный счет';

        // Преобразование даты в формат DD.MM.YYYY
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('ru-RU');

        transactionElement.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-description" style="font-weight: bold;">${transaction.description || getCategoryName(transaction.category)}</div>
                <div class="transaction-category">${getCategoryName(transaction.category)}</div>
                <div class="transaction-account">${accountName} | ${formattedDate}</div>
            </div>
            <div class="transaction-right" style="text-align: right;">
                <div class="transaction-amount">${transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)} ₽</div>
                <div class="transaction-actions" style="margin-top: 5px;">
                    <button class="btn-small btn-edit" onclick="editTransactionUI('${transaction.id}')">Ред.</button>
                    <button class="btn-small btn-delete" onclick="deleteTransactionUI('${transaction.id}')">Уд.</button>
                </div>
            </div>
        `;

        container.appendChild(transactionElement);
    });
}

// Получение названия категории на русском языке
function getCategoryName(category) {
    const categories = {
        'food': 'Продукты',
        'transport': 'Транспорт',
        'utilities': 'Коммунальные услуги',
        'entertainment': 'Развлечения',
        'health': 'Здоровье',
        'education': 'Образование',
        'family': 'Семейный бюджет',
        'other': 'Другое'
    };

    return categories[category] || category;
}

// Получение типа счета на русском языке
function getAccountTypeName(type) {
    const types = {
        'cash': 'Наличные',
        'card': 'Банковская карта',
        'bank_account': 'Банковский счет',
        'electronic': 'Электронный кошелек',
        'deposit': 'Депозит',
        'credit': 'Кредит'
    };

    return types[type] || type;
}

// Получение иконки для типа счета
function getAccountIcon(type) {
    const icons = {
        'cash': '💵',
        'card': '💳',
        'bank_account': '🏦',
        'electronic': '📱',
        'deposit': '💰',
        'credit': '📉'
    };
    return icons[type] || '🔍';
}

// Обновление отображения общего баланса
function updateTotalBalanceDisplay() {
    const balance = calculateTotalBalance();
    const balanceElement = document.getElementById('total-balance');
    const sideBalanceElement = document.getElementById('balance');
    
    const updateElement = (el) => {
        if (!el) return;
        el.textContent = `${balance.toFixed(2)} ₽`;
        if (balance > 0) {
            el.style.color = 'white';
        } else if (balance < 0) {
            el.style.color = '#f44336';
        } else {
            el.style.color = 'white';
        }
    };

    updateElement(balanceElement);
    updateElement(sideBalanceElement);
}

// Обновление отображения баланса (для совместимости)
function updateBalanceDisplay() {
    updateTotalBalanceDisplay();
}

// Инициализация формы добавления транзакции
function initTransactionForm() {
    const form = document.getElementById('transaction-form');
    if (!form) return;

    // Обновляем форму, чтобы включить выбор счета
    updateAccountSelectOptions();

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Получение значений из формы
        const type = document.getElementById('operation-type').value;
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const accountId = document.getElementById('account-select').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;

        // Валидация
        if (!amount || parseFloat(amount) <= 0) {
            alert('Введите корректную сумму');
            return;
        }

        if (!accountId) {
            alert('Выберите счет');
            return;
        }

        if (!date) {
            alert('Выберите дату');
            return;
        }

        // Создание объекта транзакции
        const transaction = {
            type: type,
            amount: parseFloat(amount),
            category: category,
            account_id: accountId,
            description: description,
            date: date
        };

        // Добавление транзакции
        if (currentEditingTransactionId) {
            updateTransaction(currentEditingTransactionId, transaction);
            currentEditingTransactionId = null;
            document.querySelector('.form-section h3').textContent = 'Добавить новую операцию';
            document.querySelector('#transaction-form button[type="submit"]').textContent = 'Добавить операцию';
        } else {
            addTransaction(transaction);
        }

        // Обновление интерфейса
        updateUI();

        // Сброс формы
        form.reset();

        // Установка текущей даты по умолчанию
        document.getElementById('date').valueAsDate = new Date();
        // Обновляем опции выбора счета
        updateAccountSelectOptions();
    });

    // Установка текущей даты по умолчанию
    document.getElementById('date').valueAsDate = new Date();
}

// Обновление опций выбора счета в форме транзакции
function updateAccountSelectOptions() {
    const accountSelect = document.getElementById('account-select');
    if (!accountSelect) return;

    const accounts = getAllAccounts();
    accountSelect.innerHTML = '';

    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = `${account.name} (${getAccountTypeName(account.type)})`;
        accountSelect.appendChild(option);
    });

    // Если нет счетов, показываем сообщение
    if (accounts.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Нет доступных счетов';
        accountSelect.appendChild(option);
    }
}

// Инициализация формы добавления счета
function initAccountForm() {
    const form = document.getElementById('account-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Получение значений из формы
        const name = document.getElementById('account-name').value;
        const type = document.getElementById('account-type').value;
        const initialBalance = parseFloat(document.getElementById('initial-balance').value) || 0;

        // Валидация
        if (!name) {
            alert('Введите название счета');
            return;
        }

        // Создание объекта счета
        const account = {
            name: name,
            type: type,
            initial_balance: initialBalance
        };

        if (currentEditingAccountId) {
            updateAccount(currentEditingAccountId, account);
            currentEditingAccountId = null;
            document.querySelector('#account-form-container h4').textContent = 'Создать новый счет';
            document.querySelector('#account-form button[type="submit"]').textContent = 'Создать счет';
        } else {
            addAccount(account);
        }

        // Обновление интерфейса
        updateUI();

        // Сброс формы
        form.reset();

        // Скрываем форму после добавления
        const accountFormContainer = document.getElementById('account-form-container');
        if (accountFormContainer) {
            accountFormContainer.style.display = 'none';
        }
    });
}

// Инициализация кнопки добавления счета
function initAddAccountButton() {
    const addAccountBtn = document.getElementById('add-account-btn');
    if (!addAccountBtn) return;

    addAccountBtn.addEventListener('click', function () {
        const accountFormContainer = document.getElementById('account-form-container');
        if (accountFormContainer) {
            // Переключаем видимость формы
            if (accountFormContainer.style.display === 'none' || !accountFormContainer.style.display) {
                accountFormContainer.style.display = 'block';
            } else {
                accountFormContainer.style.display = 'none';
            }
        }
    });
}

// Инициализация фильтров
function initFilters() {
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (!applyFiltersBtn) return;

    applyFiltersBtn.addEventListener('click', function () {
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;

        // Получение транзакций с учетом фильтров
        const filteredTransactions = getTransactionsByDate(dateFrom, dateTo);

        // Отображение отфильтрованных транзакций
        renderTransactions(filteredTransactions);
    });
}

// Обновление всего интерфейса
function updateUI() {
    // Обновление списка счетов
    renderAccounts();

    // Обновление баланса
    updateBalanceDisplay();

    // Получение всех транзакций и их отображение
    const allTransactions = getAllTransactions();
    renderTransactions(allTransactions);

    // Обновление диаграммы расходов
    updateExpenseChart();
    
    // Перерисовываем аналитику если мы во вкладке аналитики
    if (document.getElementById('analytics-tab').classList.contains('active')) {
        renderAnalytics();
    }
}

// Инициализация вкладок
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;

            // Update buttons
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update contents
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${targetTab}-tab`) {
                    content.classList.add('active');
                }
            });

            if (targetTab === 'analytics') {
                renderAnalytics();
            }
        });
    });
}

// Инициализация фильтров аналитики
function initAnalyticsFilters() {
    const typeBtns = document.querySelectorAll('.toggle-btn');

    // Populate categories
    populateAnalyticsCategories();

    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Мы НЕ вызываем renderAnalytics сразу, ждем нажатия кнопки или меняем только тип
        });
    });

    const applyBtn = document.getElementById('apply-analytics');
    if (applyBtn) {
        applyBtn.addEventListener('click', renderAnalytics);
    }
}

// Отрисовка аналитики
function renderAnalytics() {
    const typeBtn = document.querySelector('.toggle-btn.active');
    const type = typeBtn ? typeBtn.dataset.type : 'expense';
    const category = document.getElementById('analytics-category').value;
    const fromDate = document.getElementById('analytics-from').value;
    const toDate = document.getElementById('analytics-to').value;

    const transactions = getAllTransactions();
    const filtered = transactions.filter(t => {
        const matchesType = t.type === type;
        const matchesCategory = category === 'all' || t.category === category;
        
        const tDate = new Date(t.date);
        const start = fromDate ? new Date(fromDate) : new Date(0);
        const end = toDate ? new Date(toDate) : new Date();
        if (toDate) end.setHours(23, 59, 59, 999);
        
        const matchesDate = tDate >= start && tDate <= end;

        return matchesType && matchesCategory && matchesDate;
    });

    // Update total
    const total = filtered.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    document.getElementById('analytics-total').textContent = `${total.toFixed(2)} ₽`;

    updateAnalyticsChart(filtered, type);
    renderAnalyticsTransactions(filtered);
}

// Отображение списка транзакций в аналитике
function renderAnalyticsTransactions(transactions) {
    const container = document.getElementById('analytics-transactions-list');
    if (!container) return;
    
    container.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p>Нет операций для отображения</p>';
        return;
    }

    // Сортировка по дате
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    transactions.forEach(transaction => {
        const item = document.createElement('div');
        item.className = `transaction-item ${transaction.type}`;
        
        const account = getAllAccounts().find(acc => acc.id === transaction.accountId);
        const accountName = account ? account.name : 'Неизвестный счет';
        const date = new Date(transaction.date).toLocaleDateString('ru-RU');

        item.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-description" style="font-weight: bold;">${transaction.description || getCategoryName(transaction.category)}</div>
                <div class="transaction-category">${getCategoryName(transaction.category)}</div>
                <div class="transaction-account">${accountName} | ${date}</div>
            </div>
            <div class="transaction-amount">${transaction.type === 'income' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)} ₽</div>
        `;
        container.appendChild(item);
    });
}

function updateAnalyticsChart(transactions, type) {
    const ctx = document.getElementById('analytics-chart');
    if (!ctx) return;

    // Group by category
    const grouped = {};
    transactions.forEach(t => {
        const cat = t.category;
        grouped[cat] = (grouped[cat] || 0) + parseFloat(t.amount);
    });

    const labels = Object.keys(grouped).map(k => getCategoryName(k));
    const data = Object.values(grouped);

    if (analyticsChart) {
        analyticsChart.destroy();
    }

    analyticsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                    '#9966FF', '#FF9F40', '#4287f5', '#f542e6',
                    '#42f563', '#f5a442'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: 'white' } }
            }
        }
    });
}

function populateAnalyticsCategories() {
    const select = document.getElementById('analytics-category');
    if (!select) return;

    // Standard categories from select in HTML
    const cats = [
        {id: 'food', name: 'Продукты'},
        {id: 'transport', name: 'Транспорт'},
        {id: 'utilities', name: 'Коммунальные услуги'},
        {id: 'entertainment', name: 'Развлечения'},
        {id: 'health', name: 'Здоровье'},
        {id: 'education', name: 'Образование'},
        {id: 'family', name: 'Семейный бюджет'},
        {id: 'other', name: 'Другое'}
    ];

    cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

// Функция для входа в режим редактирования транзакции
function editTransactionUI(id) {
    const transactions = getAllTransactions();
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    currentEditingTransactionId = id;

    // Заполняем форму
    document.getElementById('operation-type').value = transaction.type;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('category').value = transaction.category;
    document.getElementById('account-select').value = transaction.accountId;
    document.getElementById('description').value = transaction.description || '';
    document.getElementById('date').value = transaction.date;

    // Меняем заголовки
    document.querySelector('.form-section h3').textContent = 'Редактировать операцию';
    document.querySelector('#transaction-form button[type="submit"]').textContent = 'Сохранить изменения';

    // Скролл к форме
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Функция для удаления транзакции
function deleteTransactionUI(id) {
    if (confirm('Вы уверены, что хотите удалить эту операцию?')) {
        removeTransaction(id);
        updateUI();
    }
}

// Функция для входа в режим редактирования счета
function editAccountUI(id) {
    const account = getAllAccounts().find(acc => acc.id === id);
    if (!account) return;

    currentEditingAccountId = id;

    // Показываем контейнер формы
    const accountFormContainer = document.getElementById('account-form-container');
    if (accountFormContainer) {
        accountFormContainer.style.display = 'block';
    }

    // Заполняем форму
    document.getElementById('account-name').value = account.name;
    document.getElementById('account-type').value = account.type;
    document.getElementById('initial-balance').value = account.initialBalance || 0;

    // Меняем заголовки
    document.querySelector('#account-form-container h4').textContent = 'Редактировать счет';
    document.querySelector('#account-form button[type="submit"]').textContent = 'Сохранить изменения';

    // Скролл к форме
    accountFormContainer.scrollIntoView({ behavior: 'smooth' });
}

// Функция для удаления счета
function deleteAccountUI(id) {
    if (confirm('Вы уверены, что хотите удалить этот счет? Все связанные операции останутся, но счет будет помечен как неизвестный.')) {
        removeAccount(id);
        updateUI();
    }
}

// Функция для получения текущего месяца в формате YYYY-MM
function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// Функция для проверки, принадлежит ли дата к текущему месяцу
function isCurrentMonth(dateStr) {
    const date = new Date(dateStr);
    const currentMonth = getCurrentMonth();
    const transactionMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return transactionMonth === currentMonth;
}
