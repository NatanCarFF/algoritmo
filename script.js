document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const historyFileInput = document.getElementById('historyFile');
    const exportHistoryButton = document.getElementById('exportHistory');
    const newSetInput = document.getElementById('newSet');
    const addSetButton = document.getElementById('addSet');
    const generateNumbersButton = document.getElementById('generateNumbers');
    const generatedSetsDiv = document.getElementById('generatedSets');
    const historyDisplayDiv = document.getElementById('historyDisplay');
    const probableNumbersListDiv = document.getElementById('probableNumbersList'); // Elemento para números prováveis

    // Feedback Messages
    const fileMessage = document.getElementById('fileMessage');
    const addSetMessage = document.getElementById('addSetMessage');
    const generateNumbersMessage = document.getElementById('generateNumbersMessage');
    const noHistoryMessage = document.getElementById('noHistoryMessage'); // Mensagem de estado vazio para histórico
    const noProbableNumbersMessage = document.getElementById('noProbableNumbers'); // Mensagem de estado vazio para prováveis

    // Constants
    const MAX_HISTORY_SIZE = 60;
    const NUMBERS_PER_SET = 6;
    const MAX_NUMBER_VALUE = 60;
    const MIN_HISTORY_FOR_GENERATION = 10;
    const TOP_NUMBERS_POOL_SIZE = 30;
    const SETS_TO_GENERATE = 5;

    let history = []; // Stores the sets of numbers

    // --- Utility Functions ---

    /**
     * Displays a feedback message.
     * @param {HTMLElement} element - The DOM element to display the message in.
     * @param {string} message - The message text.
     * @param {string} type - 'success' or 'error'.
     */
    function showFeedback(element, message, type) {
        element.textContent = message;
        element.className = `feedback-message ${type}`;
        // Optionally clear message after a delay, or it can be cleared by subsequent actions
        setTimeout(() => {
            element.textContent = '';
            element.className = 'feedback-message';
        }, 3000);
    }

    /**
     * Formats a number with a leading zero if it's a single digit.
     * @param {number} num - The number to format.
     * @returns {string} The formatted number.
     */
    function formatNumber(num) {
        return num < 10 ? `0${num}` : `${num}`;
    }

    /**
     * Enables or disables a button and optionally changes its text.
     * @param {HTMLElement} button - The button element.
     * @param {boolean} enable - True to enable, false to disable.
     * @param {string} [text] - Optional text to set on the button.
     */
    function toggleButtonState(button, enable, text = '') {
        button.disabled = !enable;
        if (text) {
            button.textContent = text;
        }
    }

    // --- History Management ---

    // Function to save history to Local Storage
    function saveHistoryToLocalStorage() {
        localStorage.setItem('numberHistory', JSON.stringify(history));
        displayHistory();
        displayProbableNumbers(); // Update probable numbers whenever history changes
    }

    // Function to load history from Local Storage
    function loadHistoryFromLocalStorage() {
        const storedHistory = localStorage.getItem('numberHistory');
        if (storedHistory) {
            try {
                const parsedHistory = JSON.parse(storedHistory);
                // Basic validation for loaded history
                if (Array.isArray(parsedHistory) && parsedHistory.every(set => Array.isArray(set) && set.length === NUMBERS_PER_SET && set.every(num => typeof num === 'number' && num >= 1 && num <= MAX_NUMBER_VALUE))) {
                    history = parsedHistory.slice(0, MAX_HISTORY_SIZE);
                } else {
                    console.warn("Stored history format is invalid. Resetting history.");
                    history = [];
                }
            } catch (error) {
                console.error("Error parsing stored history:", error);
                history = []; // Reset history on parse error
            }
        }
        displayHistory();
        displayProbableNumbers(); // Display probable numbers on initial load
    }

    // Function to display history in the interface
    function displayHistory() {
        historyDisplayDiv.innerHTML = '';
        if (history.length === 0) {
            noHistoryMessage.style.display = 'block'; // Mostra a mensagem de estado vazio
            historyDisplayDiv.style.display = 'none'; // Esconde a div de resultados
            return;
        }
        noHistoryMessage.style.display = 'none'; // Esconde a mensagem de estado vazio
        historyDisplayDiv.style.display = 'block'; // Mostra a div de resultados

        // Displays sets from newest to oldest
        history.slice().reverse().forEach(set => {
            const div = document.createElement('div');
            div.textContent = set.map(formatNumber).join(', ');
            historyDisplayDiv.appendChild(div);
        });
    }

    // Function to display the top 30 most probable numbers and their percentages
    function displayProbableNumbers() {
        probableNumbersListDiv.innerHTML = '';
        if (history.length === 0) {
            noProbableNumbersMessage.style.display = 'block'; // Mostra a mensagem de estado vazio
            probableNumbersListDiv.style.display = 'none'; // Esconde a div de resultados
            return;
        }

        const allNumbersFrequency = {};
        let totalOccurrences = 0;
        history.forEach(set => {
            set.forEach(num => {
                allNumbersFrequency[num] = (allNumbersFrequency[num] || 0) + 1;
                totalOccurrences++;
            });
        });

        const sortedNumbersByFrequency = Object.entries(allNumbersFrequency).sort((a, b) => b[1] - a[1]);
        const topProbableNumbers = sortedNumbersByFrequency.slice(0, TOP_NUMBERS_POOL_SIZE);

        if (topProbableNumbers.length === 0) {
            noProbableNumbersMessage.style.display = 'block';
            probableNumbersListDiv.style.display = 'none';
            return;
        }

        noProbableNumbersMessage.style.display = 'none';
        probableNumbersListDiv.style.display = 'block';

        topProbableNumbers.forEach(([number, frequency]) => {
            const percentage = ((frequency / totalOccurrences) * 100).toFixed(2); // Calculate percentage
            const div = document.createElement('div');
            div.textContent = `${formatNumber(parseInt(number, 10))} (${percentage}%)`;
            probableNumbersListDiv.appendChild(div);
        });
    }

    // --- Event Listeners ---

    // Event Listener for importing history
    historyFileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            toggleButtonState(historyFileInput, false); // Disable input during processing
            toggleButtonState(exportHistoryButton, false);
            showFeedback(fileMessage, 'Importando...', '');

            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importedData = JSON.parse(e.target.result);
                        if (Array.isArray(importedData) && importedData.every(set => Array.isArray(set) && set.length === NUMBERS_PER_SET && set.every(num => typeof num === 'number' && num >= 1 && num <= MAX_NUMBER_VALUE))) {
                            history = importedData.slice(0, MAX_HISTORY_SIZE); // Limit to max size
                            saveHistoryToLocalStorage();
                            showFeedback(fileMessage, 'Histórico importado com sucesso!', 'success');
                        } else {
                            showFeedback(fileMessage, 'Formato de arquivo JSON inválido. O arquivo deve conter um array de arrays de números (conjuntos de 6 números entre 1 e 60).', 'error');
                        }
                    } catch (error) {
                        showFeedback(fileMessage, 'Erro ao ler o arquivo JSON: ' + error.message, 'error');
                    } finally {
                        toggleButtonState(historyFileInput, true);
                        toggleButtonState(exportHistoryButton, true);
                        historyFileInput.value = ''; // Clear the file input
                    }
                };
                reader.readAsText(file);
            } catch (error) {
                showFeedback(fileMessage, 'Erro ao acessar o arquivo: ' + error.message, 'error');
                toggleButtonState(historyFileInput, true);
                toggleButtonState(exportHistoryButton, true);
                historyFileInput.value = '';
            }
        }
    });

    // Event Listener for exporting history
    exportHistoryButton.addEventListener('click', () => {
        if (history.length === 0) {
            showFeedback(fileMessage, 'Não há histórico para exportar.', 'error');
            return;
        }

        toggleButtonState(exportHistoryButton, false, 'Exportando...');

        const dataStr = JSON.stringify(history, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'historico_numeros.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showFeedback(fileMessage, 'Histórico exportado com sucesso!', 'success');
        toggleButtonState(exportHistoryButton, true, 'Exportar Histórico');
    });

    // Event Listener for adding a new set
    addSetButton.addEventListener('click', () => {
        const input = newSetInput.value.trim();
        const numbers = input.split(',').map(num => parseInt(num.trim(), 10));

        // Clear previous error styles
        newSetInput.classList.remove('error-border');
        addSetMessage.textContent = '';
        addSetMessage.className = 'feedback-message';

        const isValid = numbers.length === NUMBERS_PER_SET &&
                        numbers.every(num => !isNaN(num) && num >= 1 && num <= MAX_NUMBER_VALUE);

        if (!isValid) {
            newSetInput.classList.add('error-border');
            showFeedback(addSetMessage, `Por favor, insira ${NUMBERS_PER_SET} números válidos (de 1 a ${MAX_NUMBER_VALUE}), separados por vírgula. Ex: 01,05,12,23,45,50`, 'error');
            return;
        }

        // Check for duplicate numbers within the set
        const uniqueNumbers = new Set(numbers);
        if (uniqueNumbers.size !== NUMBERS_PER_SET) {
            newSetInput.classList.add('error-border');
            showFeedback(addSetMessage, 'O conjunto não pode conter números repetidos.', 'error');
            return;
        }

        history.push(numbers.sort((a, b) => a - b)); // Sort and add
        if (history.length > MAX_HISTORY_SIZE) {
            history.shift(); // Remove the oldest set
        }
        saveHistoryToLocalStorage();
        newSetInput.value = '';
        showFeedback(addSetMessage, 'Conjunto adicionado com sucesso!', 'success');
    });

    // Event Listener for generating numbers
    generateNumbersButton.addEventListener('click', () => {
        // Reset generated sets display
        generatedSetsDiv.innerHTML = '<p class="empty-state">Clique em \'Gerar 5 Conjuntos\' para ver os resultados aqui.</p>';
        generateNumbersMessage.textContent = '';
        generateNumbersMessage.className = 'feedback-message';

        if (history.length < MIN_HISTORY_FOR_GENERATION) {
            showFeedback(generateNumbersMessage, `É necessário ter pelo menos ${MIN_HISTORY_FOR_GENERATION} conjuntos no histórico para gerar números significativos.`, 'error');
            toggleButtonState(generateNumbersButton, true, 'Gerar 5 Conjuntos');
            return;
        }

        toggleButtonState(generateNumbersButton, false, 'Gerando...');

        const allNumbersFrequency = {};
        history.forEach(set => {
            set.forEach(num => {
                allNumbersFrequency[num] = (allNumbersFrequency[num] || 0) + 1;
            });
        });

        // Convert the object to an array of [number, frequency] and sort by frequency descending
        const sortedNumbersByFrequency = Object.entries(allNumbersFrequency).sort((a, b) => b[1] - a[1]);

        // Get the TOP_NUMBERS_POOL_SIZE numbers with the highest probability
        const topProbableNumbers = sortedNumbersByFrequency.slice(0, TOP_NUMBERS_POOL_SIZE).map(item => parseInt(item[0], 10));

        if (topProbableNumbers.length < TOP_NUMBERS_POOL_SIZE) {
            showFeedback(generateNumbersMessage, `Não há números suficientes no histórico para selecionar os ${TOP_NUMBERS_POOL_SIZE} números mais prováveis. Tente adicionar mais conjuntos.`, 'error');
            toggleButtonState(generateNumbersButton, true, 'Gerar 5 Conjuntos');
            return;
        }

        // Clear the "empty state" message if sets are about to be generated
        if (generatedSetsDiv.querySelector('.empty-state')) {
            generatedSetsDiv.innerHTML = '';
        }

        let generatedCount = 0;
        let usedNumbersAcrossSets = new Set(); // To ensure no number repeats across the 5 sets

        // Function to generate a single unique set from a pool
        const generateUniqueSet = (pool, count) => {
            let currentSet = new Set();
            let availableInPool = [...pool].filter(num => !usedNumbersAcrossSets.has(num));

            if (availableInPool.length < count) {
                return null; // Not enough numbers to form a unique set
            }

            while (currentSet.size < count) {
                const randomIndex = Math.floor(Math.random() * availableInPool.length);
                const chosenNumber = availableInPool[randomIndex];

                if (!currentSet.has(chosenNumber)) {
                    currentSet.add(chosenNumber);
                    usedNumbersAcrossSets.add(chosenNumber); // Mark as used across all generated sets
                    availableInPool.splice(randomIndex, 1); // Remove from temporary pool
                }
            }
            return Array.from(currentSet).sort((a, b) => a - b);
        };

        for (let i = 0; i < SETS_TO_GENERATE; i++) {
            const newSet = generateUniqueSet(topProbableNumbers, NUMBERS_PER_SET);
            if (newSet) {
                const div = document.createElement('div');
                div.textContent = newSet.map(formatNumber).join(', ');
                generatedSetsDiv.appendChild(div);
                generatedCount++;
            } else {
                // This means we ran out of unique numbers from the top 30 pool
                showFeedback(generateNumbersMessage, `Não foi possível gerar ${SETS_TO_GENERATE} conjuntos únicos com os ${TOP_NUMBERS_POOL_SIZE} mais prováveis sem repetição, devido ao esgotamento de números disponíveis. Considere adicionar mais histórico ou ajustar o limite de números mais prováveis.`, 'error');
                break;
            }
        }

        if (generatedCount === SETS_TO_GENERATE) {
            showFeedback(generateNumbersMessage, 'Números gerados com sucesso!', 'success');
        }

        toggleButtonState(generateNumbersButton, true, 'Gerar 5 Conjuntos');
    });

    // Initial load of history
    loadHistoryFromLocalStorage();
});