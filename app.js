/* ===========================================
   Diet Tracker PWA - Main Application Logic
   =========================================== */

/**
 * ==================================
 * FOOD ITEMS DATA STRUCTURE
 * ==================================
 *
 * Each food item now includes:
 * - name: Display name
 * - portion: Serving size description
 * - calories: kcal per serving
 * - protein: grams per serving
 * - icon: Emoji for visual identification
 *
 * localStorage structure:
 * {
 *   lastResetDate: "YYYY-MM-DD",
 *   completedItems: ["milk", "paneer", ...],
 *   partialProgress: { "banana": 2, "roti": 5, "water": 1.5, "rice": 200 },
 *   customFoods: [{ id, name, portion, calories, protein, completed }],
 *   streak: 5,
 *   lastCompletedDate: "YYYY-MM-DD",
 *   history: {
 *     "2024-01-15": {
 *       completedItems: [...],
 *       partialProgress: {...},
 *       customFoods: [...],
 *       totalCalories: 1850,
 *       totalProtein: 95
 *     }
 *   }
 * }
 */

// Food items configuration with nutrition data
const FOOD_ITEMS = {
    // Binary items (checkbox) - id: { name, portion, calories, protein }
    binary: {
        milk: { name: 'Milk', portion: '200 ml', calories: 130, protein: 6.5, icon: '🥛' },
        dahi: { name: 'Dahi', portion: '100 g', calories: 60, protein: 3, icon: '🥣' },
        peanuts: { name: 'Peanuts', portion: '100 g', calories: 560, protein: 25, icon: '🥜' },
        paneer: { name: 'Paneer', portion: '50 g', calories: 130, protein: 9, icon: '🧀' },
        roasted_chana: { name: 'Roasted Chana', portion: '50 g', calories: 180, protein: 9, icon: '🫘' },
        onion: { name: 'Onion', portion: '1 medium', calories: 40, protein: 1, icon: '🧅' },
        chai_biscuits: { name: 'Chai + Biscuits', portion: '1 serving', calories: 350, protein: 5, icon: '🍪' }
    },

    // Quantity items (+ / - buttons) with per-unit nutrition
    quantity: {
        banana: {
            name: 'Banana',
            target: 4,
            unit: '',
            step: 1,
            icon: '🍌',
            caloriesPerUnit: 100,  // per banana (400/4)
            proteinPerUnit: 1      // per banana (4/4)
        },
        roti: {
            name: 'Roti',
            target: 8,
            unit: '',
            step: 1,
            icon: '🫓',
            caloriesPerUnit: 100,  // per roti (800/8)
            proteinPerUnit: 3      // per roti (24/8)
        },
        rice: {
            name: 'Rice',
            target: 400,
            unit: 'g',
            step: 50,
            icon: '🍚',
            caloriesPerUnit: 65,   // per 50g cooked rice (520/8)
            proteinPerUnit: 1.25   // per 50g (10/8)
        },
        dal: {
            name: 'Dal',
            target: 2,
            unit: ' bowl',
            step: 1,
            icon: '🍲',
            caloriesPerUnit: 150,  // per bowl (300/2)
            proteinPerUnit: 8      // per bowl (16/2)
        },
        ghee: {
            name: 'Ghee',
            target: 2,
            unit: ' tbsp',
            step: 1,
            icon: '🧈',
            caloriesPerUnit: 120,  // per tbsp (240/2)
            proteinPerUnit: 0
        },
        lemon: {
            name: 'Lemon',
            target: 2,
            unit: '',
            step: 1,
            icon: '🍋',
            caloriesPerUnit: 10,   // per lemon (20/2)
            proteinPerUnit: 0.5    // per lemon (1/2)
        }
    }
};

// Water configuration (no calories/protein) - 250ml increments
const WATER_CONFIG = {
    target: 3.5,
    step: 0.25,  // 250ml = 0.25L
    unit: 'L'
};

// Known foods for auto-fill (includes all predefined + common extras)
const KNOWN_FOODS = {
    'milk': { calories: 130, protein: 6.5 },
    'dahi': { calories: 60, protein: 3 },
    'curd': { calories: 60, protein: 3 },
    'yogurt': { calories: 60, protein: 3 },
    'peanuts': { calories: 560, protein: 25 },
    'paneer': { calories: 130, protein: 9 },
    'roasted chana': { calories: 180, protein: 9 },
    'chana': { calories: 180, protein: 9 },
    'onion': { calories: 40, protein: 1 },
    'chai': { calories: 350, protein: 5 },
    'chai biscuits': { calories: 350, protein: 5 },
    'banana': { calories: 100, protein: 1 },
    'roti': { calories: 100, protein: 3 },
    'chapati': { calories: 100, protein: 3 },
    'rice': { calories: 130, protein: 2.5 },
    'dal': { calories: 150, protein: 8 },
    'ghee': { calories: 120, protein: 0 },
    'lemon': { calories: 10, protein: 0.5 },
    'egg': { calories: 78, protein: 6 },
    'boiled egg': { calories: 78, protein: 6 },
    'chicken': { calories: 165, protein: 31 },
    'fish': { calories: 120, protein: 22 },
    'apple': { calories: 95, protein: 0.5 },
    'orange': { calories: 62, protein: 1.2 },
    'bread': { calories: 79, protein: 2.7 },
    'oats': { calories: 150, protein: 5 },
    'almonds': { calories: 164, protein: 6 },
    'cashew': { calories: 157, protein: 5 }
};

// Application state
let state = {
    lastResetDate: null,
    completedItems: [],
    partialProgress: {},
    customFoods: [],
    streak: 0,
    lastCompletedDate: null,
    history: {}
};

// Current history view date
let historyViewDate = null;

/**
 * ==================================
 * INITIALIZATION
 * ==================================
 */

document.addEventListener('DOMContentLoaded', () => {
    loadState();
    checkDailyReset();
    render();
    setupEventListeners();
    registerServiceWorker();
    setupNotifications();

    // Initialize history view date
    historyViewDate = new Date();
    historyViewDate.setDate(historyViewDate.getDate() - 1);

    // Check for reset every minute
    setInterval(checkDailyReset, 60000);
});

/**
 * ==================================
 * DAILY RESET LOGIC
 * ==================================
 *
 * Reset occurs at 4:00 AM local time each day.
 * Before resetting, save current day's data to history.
 */

function checkDailyReset() {
    const now = new Date();
    const resetHour = 4; // 4:00 AM

    // Get today's reset date
    let resetDate = new Date(now);
    if (now.getHours() < resetHour) {
        resetDate.setDate(resetDate.getDate() - 1);
    }
    const resetDateStr = formatDate(resetDate);

    // Check if we need to reset
    if (state.lastResetDate !== resetDateStr) {
        // Save current day to history before resetting
        if (state.lastResetDate) {
            saveToHistory(state.lastResetDate);

            // Update streak
            const wasAllCompleted = checkAllCompleted();
            if (wasAllCompleted && state.lastCompletedDate === state.lastResetDate) {
                const lastReset = new Date(state.lastResetDate);
                const daysDiff = Math.floor((resetDate - lastReset) / (1000 * 60 * 60 * 24));
                if (daysDiff === 1) {
                    state.streak++;
                } else {
                    state.streak = wasAllCompleted ? 1 : 0;
                }
            } else {
                state.streak = 0;
            }
        }

        // Reset daily progress
        state.lastResetDate = resetDateStr;
        state.completedItems = [];
        state.partialProgress = {};
        state.customFoods = [];

        saveState();
        render();
    }
}

/**
 * Save current day's data to history
 */
function saveToHistory(dateStr) {
    const { totalCalories, totalProtein } = calculateNutrition();

    state.history[dateStr] = {
        completedItems: [...state.completedItems],
        partialProgress: { ...state.partialProgress },
        customFoods: [...state.customFoods],
        totalCalories,
        totalProtein
    };

    // Keep only last 30 days of history
    const dates = Object.keys(state.history).sort();
    while (dates.length > 30) {
        delete state.history[dates.shift()];
    }
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function checkAllCompleted() {
    const totalBinary = Object.keys(FOOD_ITEMS.binary).length;
    const totalQuantity = Object.keys(FOOD_ITEMS.quantity).length + 1; // +1 for water

    let completedBinary = state.completedItems.filter(id =>
        FOOD_ITEMS.binary.hasOwnProperty(id)
    ).length;

    // Add completed custom foods
    completedBinary += state.customFoods.filter(f => f.completed).length;

    let completedQuantity = 0;
    for (const [id, config] of Object.entries(FOOD_ITEMS.quantity)) {
        if ((state.partialProgress[id] || 0) >= config.target) {
            completedQuantity++;
        }
    }

    if ((state.partialProgress.water || 0) >= WATER_CONFIG.target) {
        completedQuantity++;
    }

    const totalItems = totalBinary + totalQuantity + state.customFoods.length;
    const completedItems = completedBinary + completedQuantity;

    return completedItems === totalItems;
}

/**
 * ==================================
 * NUTRITION CALCULATION
 * ==================================
 */

function calculateNutrition() {
    let totalCalories = 0;
    let totalProtein = 0;

    // Binary items
    for (const id of state.completedItems) {
        if (FOOD_ITEMS.binary[id]) {
            totalCalories += FOOD_ITEMS.binary[id].calories;
            totalProtein += FOOD_ITEMS.binary[id].protein;
        }
    }

    // Quantity items (calculate based on progress)
    for (const [id, config] of Object.entries(FOOD_ITEMS.quantity)) {
        const progress = state.partialProgress[id] || 0;
        if (progress > 0) {
            if (config.unit === 'g') {
                // For rice (per 50g)
                const units = progress / 50;
                totalCalories += units * config.caloriesPerUnit;
                totalProtein += units * config.proteinPerUnit;
            } else {
                // For banana, roti, dal, ghee, lemon (per unit)
                totalCalories += progress * config.caloriesPerUnit;
                totalProtein += progress * config.proteinPerUnit;
            }
        }
    }

    // Custom foods
    for (const food of state.customFoods) {
        if (food.completed) {
            totalCalories += food.calories;
            totalProtein += food.protein;
        }
    }

    return {
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein * 10) / 10
    };
}

/**
 * ==================================
 * EXPORT DATA FUNCTIONALITY
 * ==================================
 */

function exportData(type) {
    let exportObj;
    let filename;

    if (type === 'today') {
        const { totalCalories, totalProtein } = calculateNutrition();
        exportObj = {
            date: state.lastResetDate,
            completedItems: state.completedItems,
            partialProgress: state.partialProgress,
            customFoods: state.customFoods,
            totalCalories,
            totalProtein
        };
        filename = `diet-tracker-${state.lastResetDate}.json`;
    } else {
        // Export all history
        exportObj = {
            exportDate: formatDate(new Date()),
            currentStreak: state.streak,
            history: state.history
        };
        filename = `diet-tracker-all-${formatDate(new Date())}.json`;
    }

    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

window.exportData = exportData;

/**
 * ==================================
 * STATE MANAGEMENT (localStorage)
 * ==================================
 */

function loadState() {
    try {
        const saved = localStorage.getItem('dietTrackerState');
        if (saved) {
            state = { ...state, ...JSON.parse(saved) };
        }
    } catch (e) {
        console.error('Error loading state:', e);
    }
}

function saveState() {
    try {
        // Save current day to history on every state change
        if (state.lastResetDate) {
            const { totalCalories, totalProtein } = calculateNutrition();
            state.history[state.lastResetDate] = {
                completedItems: [...state.completedItems],
                partialProgress: { ...state.partialProgress },
                customFoods: [...state.customFoods],
                totalCalories,
                totalProtein
            };
        }
        localStorage.setItem('dietTrackerState', JSON.stringify(state));
    } catch (e) {
        console.error('Error saving state:', e);
    }
}

/**
 * ==================================
 * RENDERING
 * ==================================
 */

function render() {
    renderWater();
    renderFoodList();
    renderCompletedList();
    updateOverallProgress();
    updateNutritionSummary();
    updateStreak();
}

function renderWater() {
    const container = document.getElementById('waterTracker');
    const section = document.getElementById('waterSection');
    const current = state.partialProgress.water || 0;
    const target = WATER_CONFIG.target;
    const isComplete = current >= target;

    if (isComplete && !document.getElementById('showCompleted').checked) {
        section.style.display = 'none';
    } else {
        section.style.display = 'block';
    }

    container.className = `water-tracker ${isComplete ? 'completed' : ''}`;
    container.innerHTML = `
        <div class="water-display">
            <div class="water-amount">${current.toFixed(1)}${WATER_CONFIG.unit}</div>
            <div class="water-target">/ ${target}${WATER_CONFIG.unit} target</div>
        </div>
        <div class="water-progress-container">
            <div class="water-progress" style="width: ${Math.min((current / target) * 100, 100)}%"></div>
        </div>
        <div class="water-buttons">
            <button class="water-btn minus" onclick="updateWater(-${WATER_CONFIG.step})" ${current <= 0 ? 'disabled' : ''}>−</button>
            <button class="water-btn plus" onclick="updateWater(${WATER_CONFIG.step})" ${isComplete ? 'disabled' : ''}>+</button>
        </div>
    `;
}

function renderFoodList() {
    const container = document.getElementById('foodList');
    let html = '';

    // Render quantity items first
    for (const [id, config] of Object.entries(FOOD_ITEMS.quantity)) {
        const current = state.partialProgress[id] || 0;
        const isComplete = current >= config.target;

        if (!isComplete) {
            html += createQuantityCard(id, config, current);
        }
    }

    // Render binary items
    for (const [id, config] of Object.entries(FOOD_ITEMS.binary)) {
        const isComplete = state.completedItems.includes(id);

        if (!isComplete) {
            html += createBinaryCard(id, config);
        }
    }

    // Render custom foods (incomplete)
    for (const food of state.customFoods) {
        if (!food.completed) {
            html += createCustomFoodCard(food);
        }
    }

    if (!html) {
        html = `
            <div class="empty-state">
                <div class="emoji">🎉</div>
                <p>All items completed for today!</p>
            </div>
        `;
    }

    container.innerHTML = html;
}

function createBinaryCard(id, config) {
    return `
        <div class="food-card" id="card-${id}">
            <div class="binary-item">
                <label class="checkbox-container">
                    <input type="checkbox" onchange="toggleBinaryItem('${id}')" />
                    <span class="checkmark"></span>
                </label>
                <div class="item-info">
                    <span class="item-name">${config.icon} ${config.name}</span>
                    <span class="item-portion">${config.portion}</span>
                    <div class="item-nutrition">
                        <span class="item-calories">${config.calories} kcal</span>
                        <span class="item-protein">${config.protein}g protein</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function createQuantityCard(id, config, current) {
    const percentage = Math.min((current / config.target) * 100, 100);
    const displayCurrent = config.unit ? `${current}${config.unit}` : current;
    const displayTarget = config.unit ? `${config.target}${config.unit}` : config.target;

    // Calculate current nutrition
    let currentCal, currentProt;
    if (config.unit === 'g') {
        const units = current / 50;
        currentCal = Math.round(units * config.caloriesPerUnit);
        currentProt = Math.round(units * config.proteinPerUnit * 10) / 10;
    } else {
        currentCal = Math.round(current * config.caloriesPerUnit);
        currentProt = Math.round(current * config.proteinPerUnit * 10) / 10;
    }

    return `
        <div class="food-card" id="card-${id}">
            <div class="quantity-item">
                <div class="quantity-header">
                    <div class="quantity-info">
                        <span class="item-name">${config.icon} ${config.name}</span>
                        <span class="quantity-progress">${displayCurrent} / ${displayTarget}</span>
                        <div class="quantity-nutrition">
                            <span class="item-calories">${currentCal} kcal</span>
                            <span class="item-protein">${currentProt}g protein</span>
                        </div>
                    </div>
                </div>
                <div class="quantity-bar-container">
                    <div class="quantity-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="quantity-buttons">
                    <button class="qty-btn minus" onclick="updateQuantity('${id}', -${config.step})" ${current <= 0 ? 'disabled' : ''}>−</button>
                    <button class="qty-btn plus" onclick="updateQuantity('${id}', ${config.step})">+</button>
                </div>
            </div>
        </div>
    `;
}

function createCustomFoodCard(food) {
    return `
        <div class="food-card custom" id="card-custom-${food.id}">
            <div class="binary-item">
                <label class="checkbox-container">
                    <input type="checkbox" onchange="toggleCustomFood('${food.id}')" />
                    <span class="checkmark"></span>
                </label>
                <div class="item-info">
                    <span class="item-name">🍴 ${food.name}</span>
                    <span class="item-portion">${food.portion || 'Custom'}</span>
                    <div class="item-nutrition">
                        <span class="item-calories">${food.calories} kcal</span>
                        <span class="item-protein">${food.protein}g protein</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderCompletedList() {
    const container = document.getElementById('completedList');
    const section = document.getElementById('completedSection');
    const showCompleted = document.getElementById('showCompleted').checked;

    if (!showCompleted) {
        section.style.display = 'none';
        return;
    }

    let html = '';

    // Completed water
    const waterCurrent = state.partialProgress.water || 0;
    if (waterCurrent >= WATER_CONFIG.target) {
        html += `
            <div class="completed-item">
                <span class="check-icon">✓</span>
                <div class="item-details">
                    <span>💧 Water - ${waterCurrent.toFixed(1)}${WATER_CONFIG.unit}</span>
                </div>
            </div>
        `;
    }

    // Completed quantity items
    for (const [id, config] of Object.entries(FOOD_ITEMS.quantity)) {
        const current = state.partialProgress[id] || 0;
        if (current >= config.target) {
            const display = config.unit ? `${current}${config.unit}` : current;
            let cal, prot;
            if (config.unit === 'g') {
                cal = Math.round((current / 50) * config.caloriesPerUnit);
                prot = Math.round((current / 50) * config.proteinPerUnit * 10) / 10;
            } else {
                cal = Math.round(current * config.caloriesPerUnit);
                prot = Math.round(current * config.proteinPerUnit * 10) / 10;
            }
            html += `
                <div class="completed-item">
                    <span class="check-icon">✓</span>
                    <div class="item-details">
                        <span>${config.icon} ${config.name} - ${display}</span>
                        <span class="nutrition-badge">${cal} kcal | ${prot}g protein</span>
                    </div>
                </div>
            `;
        }
    }

    // Completed binary items
    for (const id of state.completedItems) {
        if (FOOD_ITEMS.binary[id]) {
            const config = FOOD_ITEMS.binary[id];
            html += `
                <div class="completed-item">
                    <span class="check-icon">✓</span>
                    <div class="item-details">
                        <span>${config.icon} ${config.name} - ${config.portion}</span>
                        <span class="nutrition-badge">${config.calories} kcal | ${config.protein}g protein</span>
                    </div>
                </div>
            `;
        }
    }

    // Completed custom foods
    for (const food of state.customFoods) {
        if (food.completed) {
            html += `
                <div class="completed-item">
                    <span class="check-icon">✓</span>
                    <div class="item-details">
                        <span>🍴 ${food.name} - ${food.portion || 'Custom'}</span>
                        <span class="nutrition-badge">${food.calories} kcal | ${food.protein}g protein</span>
                    </div>
                </div>
            `;
        }
    }

    if (html) {
        section.style.display = 'block';
        container.innerHTML = html;
    } else {
        section.style.display = 'none';
    }
}

function updateOverallProgress() {
    const totalBinary = Object.keys(FOOD_ITEMS.binary).length;
    const totalQuantity = Object.keys(FOOD_ITEMS.quantity).length + 1;
    const totalCustom = state.customFoods.length;
    const totalItems = totalBinary + totalQuantity + totalCustom;

    let completedCount = state.completedItems.filter(id =>
        FOOD_ITEMS.binary.hasOwnProperty(id)
    ).length;

    // Count completed quantity items
    for (const [id, config] of Object.entries(FOOD_ITEMS.quantity)) {
        if ((state.partialProgress[id] || 0) >= config.target) {
            completedCount++;
        }
    }

    // Count water
    if ((state.partialProgress.water || 0) >= WATER_CONFIG.target) {
        completedCount++;
    }

    // Count completed custom foods
    completedCount += state.customFoods.filter(f => f.completed).length;

    document.getElementById('completedCount').textContent = completedCount;
    document.getElementById('totalCount').textContent = totalItems;
    document.getElementById('overallProgress').style.width =
        `${(completedCount / totalItems) * 100}%`;

    // Check if all completed
    if (completedCount === totalItems && state.lastCompletedDate !== state.lastResetDate) {
        state.lastCompletedDate = state.lastResetDate;
        saveState();
    }
}

function updateNutritionSummary() {
    const { totalCalories, totalProtein } = calculateNutrition();
    document.getElementById('totalCalories').textContent = totalCalories;
    document.getElementById('totalProtein').textContent = totalProtein;
}

function updateStreak() {
    document.getElementById('streakCount').textContent = state.streak;
}

/**
 * ==================================
 * HISTORY RENDERING
 * ==================================
 */

function renderHistory() {
    const container = document.getElementById('historyContent');
    const dateDisplay = document.getElementById('historyDate');

    if (!historyViewDate) {
        historyViewDate = new Date();
        historyViewDate.setDate(historyViewDate.getDate() - 1);
    }

    const dateStr = formatDate(historyViewDate);
    dateDisplay.textContent = formatDisplayDate(dateStr);

    // Disable next button if at yesterday or today
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    document.getElementById('nextDay').disabled =
        formatDate(historyViewDate) >= formatDate(yesterday);

    const historyData = state.history[dateStr];

    if (!historyData) {
        container.innerHTML = `
            <div class="no-history">
                <div class="emoji">📅</div>
                <p>No data for this date</p>
            </div>
        `;
        return;
    }

    let html = `
        <div class="history-summary">
            <div class="history-stat">
                <div class="history-stat-value">${historyData.totalCalories || 0}</div>
                <div class="history-stat-label">Calories</div>
            </div>
            <div class="history-stat">
                <div class="history-stat-value">${historyData.totalProtein || 0}g</div>
                <div class="history-stat-label">Protein</div>
            </div>
            <div class="history-stat">
                <div class="history-stat-value">${countCompletedInHistory(historyData)}</div>
                <div class="history-stat-label">Items</div>
            </div>
        </div>
        <div class="history-items">
    `;

    // Water
    const waterAmount = historyData.partialProgress?.water || 0;
    const waterComplete = waterAmount >= WATER_CONFIG.target;
    html += `
        <div class="history-item ${waterComplete ? '' : 'incomplete'}">
            <span class="status-icon">${waterComplete ? '✅' : '⬜'}</span>
            <div class="item-details">
                <div class="item-name">💧 Water</div>
                <div class="item-meta">${waterAmount.toFixed(1)}L / ${WATER_CONFIG.target}L</div>
            </div>
        </div>
    `;

    // Quantity items
    for (const [id, config] of Object.entries(FOOD_ITEMS.quantity)) {
        const progress = historyData.partialProgress?.[id] || 0;
        const isComplete = progress >= config.target;
        const display = config.unit ? `${progress}${config.unit}` : progress;
        const targetDisplay = config.unit ? `${config.target}${config.unit}` : config.target;

        html += `
            <div class="history-item ${isComplete ? '' : 'incomplete'}">
                <span class="status-icon">${isComplete ? '✅' : '⬜'}</span>
                <div class="item-details">
                    <div class="item-name">${config.icon} ${config.name}</div>
                    <div class="item-meta">${display} / ${targetDisplay}</div>
                </div>
            </div>
        `;
    }

    // Binary items
    for (const [id, config] of Object.entries(FOOD_ITEMS.binary)) {
        const isComplete = historyData.completedItems?.includes(id);
        html += `
            <div class="history-item ${isComplete ? '' : 'incomplete'}">
                <span class="status-icon">${isComplete ? '✅' : '⬜'}</span>
                <div class="item-details">
                    <div class="item-name">${config.icon} ${config.name}</div>
                    <div class="item-meta">${config.portion} | ${config.calories} kcal</div>
                </div>
            </div>
        `;
    }

    // Custom foods
    if (historyData.customFoods?.length > 0) {
        for (const food of historyData.customFoods) {
            html += `
                <div class="history-item ${food.completed ? '' : 'incomplete'}">
                    <span class="status-icon">${food.completed ? '✅' : '⬜'}</span>
                    <div class="item-details">
                        <div class="item-name">🍴 ${food.name}</div>
                        <div class="item-meta">${food.portion || 'Custom'} | ${food.calories} kcal | ${food.protein}g protein</div>
                    </div>
                </div>
            `;
        }
    }

    html += '</div>';
    container.innerHTML = html;
}

function countCompletedInHistory(historyData) {
    let count = 0;

    // Water
    if ((historyData.partialProgress?.water || 0) >= WATER_CONFIG.target) count++;

    // Quantity items
    for (const [id, config] of Object.entries(FOOD_ITEMS.quantity)) {
        if ((historyData.partialProgress?.[id] || 0) >= config.target) count++;
    }

    // Binary items
    count += historyData.completedItems?.filter(id =>
        FOOD_ITEMS.binary.hasOwnProperty(id)
    ).length || 0;

    // Custom foods
    count += historyData.customFoods?.filter(f => f.completed).length || 0;

    return count;
}

/**
 * ==================================
 * EVENT HANDLERS
 * ==================================
 */

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });

    // Show completed toggle
    document.getElementById('showCompleted').addEventListener('change', () => {
        renderWater();
        renderCompletedList();
    });

    // Custom food modal
    document.getElementById('addCustomBtn').addEventListener('click', () => {
        document.getElementById('customFoodModal').classList.add('active');
    });

    document.getElementById('closeModal').addEventListener('click', () => {
        document.getElementById('customFoodModal').classList.remove('active');
    });

    document.getElementById('customFoodModal').addEventListener('click', (e) => {
        if (e.target.id === 'customFoodModal') {
            document.getElementById('customFoodModal').classList.remove('active');
        }
    });

    // Custom food form
    document.getElementById('customFoodForm').addEventListener('submit', (e) => {
        e.preventDefault();
        addCustomFood();
    });

    // Auto-fill calories/protein when food name matches known foods
    document.getElementById('foodName').addEventListener('input', (e) => {
        const name = e.target.value.trim().toLowerCase();
        autoFillNutrition(name);
    });

    // History navigation
    document.getElementById('prevDay').addEventListener('click', () => {
        historyViewDate.setDate(historyViewDate.getDate() - 1);
        renderHistory();
    });

    document.getElementById('nextDay').addEventListener('click', () => {
        historyViewDate.setDate(historyViewDate.getDate() + 1);
        renderHistory();
    });

    // Install prompt
    document.getElementById('dismissBtn')?.addEventListener('click', () => {
        document.getElementById('installPrompt').style.display = 'none';
    });
}

/**
 * Auto-fill calories and protein based on food name
 */
function autoFillNutrition(name) {
    // Check exact match first
    if (KNOWN_FOODS[name]) {
        document.getElementById('foodCalories').value = KNOWN_FOODS[name].calories;
        document.getElementById('foodProtein').value = KNOWN_FOODS[name].protein;
        return;
    }

    // Check partial match
    for (const [foodName, nutrition] of Object.entries(KNOWN_FOODS)) {
        if (name.includes(foodName) || foodName.includes(name)) {
            document.getElementById('foodCalories').value = nutrition.calories;
            document.getElementById('foodProtein').value = nutrition.protein;
            return;
        }
    }

    // Check previously added custom foods
    for (const food of state.customFoods) {
        if (food.name.toLowerCase() === name ||
            food.name.toLowerCase().includes(name) ||
            name.includes(food.name.toLowerCase())) {
            document.getElementById('foodCalories').value = food.calories;
            document.getElementById('foodProtein').value = food.protein;
            return;
        }
    }

    // Check history for custom foods
    for (const dayData of Object.values(state.history)) {
        if (dayData.customFoods) {
            for (const food of dayData.customFoods) {
                if (food.name.toLowerCase() === name ||
                    food.name.toLowerCase().includes(name) ||
                    name.includes(food.name.toLowerCase())) {
                    document.getElementById('foodCalories').value = food.calories;
                    document.getElementById('foodProtein').value = food.protein;
                    return;
                }
            }
        }
    }
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update content
    document.getElementById('todayTab').classList.toggle('active', tabName === 'today');
    document.getElementById('historyTab').classList.toggle('active', tabName === 'history');
    document.getElementById('todayProgress').style.display = tabName === 'today' ? 'block' : 'none';

    if (tabName === 'history') {
        renderHistory();
    }
}

// Binary item toggle (checkbox)
function toggleBinaryItem(id) {
    const card = document.getElementById(`card-${id}`);
    card.classList.add('completing');

    setTimeout(() => {
        if (!state.completedItems.includes(id)) {
            state.completedItems.push(id);
        }
        saveState();
        render();
    }, 400);
}

// Custom food toggle
function toggleCustomFood(id) {
    const card = document.getElementById(`card-custom-${id}`);
    card.classList.add('completing');

    setTimeout(() => {
        const food = state.customFoods.find(f => f.id === id);
        if (food) {
            food.completed = true;
        }
        saveState();
        render();
    }, 400);
}

// Add custom food
function addCustomFood() {
    const name = document.getElementById('foodName').value.trim();
    const calories = parseInt(document.getElementById('foodCalories').value);
    const protein = parseFloat(document.getElementById('foodProtein').value);
    const portion = document.getElementById('foodPortion').value.trim();

    if (!name || isNaN(calories) || isNaN(protein)) {
        alert('Please fill in all required fields');
        return;
    }

    const newFood = {
        id: Date.now().toString(),
        name,
        calories,
        protein,
        portion,
        completed: false
    };

    state.customFoods.push(newFood);
    saveState();
    render();

    // Reset form and close modal
    document.getElementById('customFoodForm').reset();
    document.getElementById('customFoodModal').classList.remove('active');
}

// Quantity item update
function updateQuantity(id, delta) {
    const config = FOOD_ITEMS.quantity[id];
    const current = state.partialProgress[id] || 0;
    const newValue = Math.max(0, Math.min(current + delta, config.target * 2));

    state.partialProgress[id] = newValue;
    saveState();

    if (newValue >= config.target && current < config.target) {
        const card = document.getElementById(`card-${id}`);
        card.classList.add('completing');
        setTimeout(render, 400);
    } else {
        render();
    }
}

// Water update
function updateWater(delta) {
    const current = state.partialProgress.water || 0;
    const newValue = Math.max(0, Math.min(current + delta, WATER_CONFIG.target * 2));

    state.partialProgress.water = newValue;
    saveState();

    if (newValue >= WATER_CONFIG.target && current < WATER_CONFIG.target) {
        const tracker = document.getElementById('waterTracker');
        tracker.classList.add('completing');
        setTimeout(render, 400);
    } else {
        render();
    }
}

// Make functions globally accessible
window.toggleBinaryItem = toggleBinaryItem;
window.toggleCustomFood = toggleCustomFood;
window.updateQuantity = updateQuantity;
window.updateWater = updateWater;

/**
 * ==================================
 * SERVICE WORKER REGISTRATION
 * ==================================
 */

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('SW registered:', registration.scope);
            })
            .catch(error => {
                console.error('SW registration failed:', error);
            });
    }
}

/**
 * ==================================
 * NOTIFICATIONS
 * ==================================
 */

function setupNotifications() {
    if ('Notification' in window && Notification.permission === 'default') {
        document.body.addEventListener('click', () => {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }, { once: true });
    }

    scheduleReminderCheck();
}

function scheduleReminderCheck() {
    const now = new Date();
    const reminderHour = 20;

    let nextReminder = new Date(now);
    nextReminder.setHours(reminderHour, 0, 0, 0);

    if (now.getHours() >= reminderHour) {
        nextReminder.setDate(nextReminder.getDate() + 1);
    }

    const msUntilReminder = nextReminder - now;

    setTimeout(() => {
        checkAndNotify();
        setTimeout(scheduleReminderCheck, 1000);
    }, msUntilReminder);
}

function checkAndNotify() {
    if (Notification.permission !== 'granted') return;

    if (!checkAllCompleted()) {
        new Notification('Diet Tracker Reminder', {
            body: 'You have incomplete items for today. Keep going!',
            icon: '🥗',
            tag: 'diet-reminder'
        });
    }
}

/**
 * ==================================
 * PWA INSTALL PROMPT
 * ==================================
 */

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installPrompt').style.display = 'flex';
});

document.getElementById('installBtn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install outcome:', outcome);
    deferredPrompt = null;
    document.getElementById('installPrompt').style.display = 'none';
});
