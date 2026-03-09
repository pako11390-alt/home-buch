// Основной файл приложения "Домашняя бухгалтерия"

// Глобальная переменная для хранения диаграммы
let expensesChart = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', async function () {
    console.log('Домашняя бухгалтерия: Инициализация загрузки...');

    try {
        // Ожидаем загрузки данных с сервера Supabase
        await loadDataFromSupabase();
    } catch (e) {
        console.error("Ошибка при загрузке данных:", e);
    }

    try {
        // Инициализация формы добавления транзакций
        initTransactionForm();

        // Инициализация формы добавления счетов
        initAccountForm();

        // Инициализация кнопки добавления счета
        initAddAccountButton();

        // Инициализация фильтров
        initFilters();

        // Инициализация вкладок
        initTabs();

        // Инициализация фильтров аналитики
        initAnalyticsFilters();

        // Обновление интерфейса
        updateUI();

        // Инициализация диаграммы расходов
        initExpenseChart();
        
        console.log("Интерфейс успешно инициализирован");
    } catch (e) {
        console.error("Фатальная ошибка инициализации UI:", e);
        // Резервная инициализация вкладок, чтобы хоть что-то работало
        initTabs();
    }
});

// Функция инициализации диаграммы расходов
function initExpenseChart() {
    const ctx = document.getElementById('expenses-chart');
    if (!ctx) return;

    // Получение расходов по категориям
    const expensesByCategory = getExpensesByCategory();
    console.log('Данные для диаграммы:', expensesByCategory);
    
    // Проверка наличия данных
    const labels = Object.keys(expensesByCategory).map(key => getCategoryName(key));
    const data = Object.values(expensesByCategory);

    if (data.length === 0) {
        console.log('Нет данных для отображения диаграммы');
        // Не возвращаемся, создаем пустую диаграмму, которая обновится позже
    }

    // Цвета для сегментов диаграммы
    const backgroundColors = [
        '#FF6384',
        '#36A2EB',
        '#FFCE56',
        '#4BC0C0',
        '#9966FF',
        '#FF9F40',
        '#FF6384'
    ];

    // Создание диаграммы
    expensesChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: 'white',
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            return `${label}: ${value.toFixed(2)} ₽`;
                        }
                    }
                }
            }
        }
    });
}

// Функция обновления диаграммы расходов
function updateExpenseChart() {
    if (!expensesChart) {
        initExpenseChart();
        return;
    }

    // Получение расходов по категориям
    const expensesByCategory = getExpensesByCategory();

    // Подготовка данных для диаграммы
    const labels = Object.keys(expensesByCategory).map(key => getCategoryName(key));
    const data = Object.values(expensesByCategory);

    // Обновление диаграммы
    expensesChart.data.labels = labels;
    expensesChart.data.datasets[0].data = data;
    expensesChart.update();
}

// Обработка события изменения даты в фильтрах
document.addEventListener('change', function (e) {
    if (e.target.id === 'date-from' || e.target.id === 'date-to') {
        // При изменении фильтров по дате, обновляем только список транзакций
        const dateFrom = document.getElementById('date-from').value;
        const dateTo = document.getElementById('date-to').value;

        // Получение транзакций с учетом фильтров
        const filteredTransactions = getTransactionsByDate(dateFrom, dateTo);

        // Отображение отфильтрованных транзакций
        renderTransactions(filteredTransactions);
    }
});
