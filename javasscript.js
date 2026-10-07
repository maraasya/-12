

let expression = "";

let currentResult = "0";

let memory = parseFloat(
    localStorage.getItem(
        "inkCalculatorMemory"
    ) || "0"
);

let history = JSON.parse(
    localStorage.getItem(
        "inkCalculatorHistory"
    ) || "[]"
);

let angleMode =
    localStorage.getItem(
        "inkCalculatorAngleMode"
    ) || "DEG";

let lastWasResult = false;

let scientificOpen = false;




const expressionElement =
    document.getElementById(
        "expression"
    );

const resultElement =
    document.getElementById(
        "result"
    );

const memoryElement =
    document.getElementById(
        "memoryValue"
    );

const historyPanel =
    document.getElementById(
        "historyPanel"
    );

const historyList =
    document.getElementById(
        "historyList"
    );

const scientificPanel =
    document.getElementById(
        "scientificPanel"
    );

const scientificToggle =
    document.getElementById(
        "scientificToggle"
    );




updateMemory();

renderHistory();

setAngleMode(angleMode);

updateDisplay();




function updateDisplay() {

    expressionElement.textContent =
        expression || "0";

    resultElement.textContent =
        currentResult || "0";

    scrollDisplay();

}




function inputNumber(number) {

    if (lastWasResult) {

        expression = "";

        currentResult = "0";

        lastWasResult = false;

    }

    expression += number;

    updateDisplay();

    playClick();

}




function inputDecimal() {

    if (lastWasResult) {

        expression = "";

        currentResult = "0";

        lastWasResult = false;

    }

   

    const parts =
        expression.split(
            /[+\-*/^()]/
        );

    const currentNumber =
        parts[parts.length - 1];



    if (
        currentNumber.includes(".")
    ) {

        showToast(
            "В этом числе уже есть точка",
            "error"
        );

        return;

    }


 

    if (
        currentNumber === "" ||
        currentNumber === "-"
    ) {

        expression += "0.";

    } else {

        expression += ".";

    }


    updateDisplay();

    playClick();

}




function insertOperator(operator) {

    if (lastWasResult) {

        expression =
            currentResult;

        lastWasResult = false;

    }


    if (!expression) {

        

        if (operator === "-") {

            expression = "-";

        } else {

            showToast(
                "Сначала введите число",
                "error"
            );

        }

        updateDisplay();

        return;
    }


    const last =
        expression.slice(-1);



    if (
        [
            "+",
            "-",
            "*",
            "/",
            "^"
        ].includes(last)
    ) {

        expression =
            expression.slice(0, -1)
            + operator;

    } else {

        expression += operator;

    }


    updateDisplay();

    playClick();

}



function insertValue(value) {

    if (lastWasResult) {

        expression = "";

        lastWasResult = false;

    }


    expression += value;

    updateDisplay();

    playClick();

}




function backspace() {

    if (lastWasResult) {

        expression =
            currentResult;

        lastWasResult = false;

    }


    expression =
        expression.slice(0, -1);


    currentResult =
        expression || "0";


    resultElement.classList.remove(
        "error"
    );


    updateDisplay();

    playClick();

}




function clearAll() {

    expression = "";

    currentResult = "0";

    lastWasResult = false;

    resultElement.classList.remove(
        "error"
    );

    updateDisplay();

    playClick();

}



function toggleSign() {

    if (!expression) {

        expression = "-";

        updateDisplay();

        return;

    }


    
    if (
        /^-?\d+(\.\d+)?$/.test(
            expression
        )
    ) {

        if (
            expression.startsWith("-")
        ) {

            expression =
                expression.substring(1);

        } else {

            expression =
                "-" + expression;

        }

    } else {

        

        try {

            const value =
                evaluateExpression(
                    expression
                );

            expression =
                String(-value);

        } catch {

            showToast(
                "Нельзя изменить знак",
                "error"
            );

            return;

        }

    }


    updateDisplay();

}



function percent() {

    if (!expression) {

        return;

    }


    try {

        const value =
            evaluateExpression(
                expression
            );

        expression =
            String(value / 100);

        currentResult =
            formatNumber(
                value / 100
            );

        updateDisplay();

    } catch {

        showError(
            "Ошибка вычисления"
        );

    }

}




function calculate() {

    if (!expression) {

        return;

    }


    try {

        const originalExpression =
            expression;


        const value =
            evaluateExpression(
                expression
            );


        if (
            !Number.isFinite(value)
        ) {

            throw new Error(
                "Результат не является числом"
            );

        }


        currentResult =
            formatNumber(value);


        addHistory(
            originalExpression,
            currentResult
        );


        lastWasResult = true;


        resultElement.classList.remove(
            "error"
        );


        updateDisplay();

        playSuccess();

    } catch (error) {

        showError(
            error.message ||
            "Ошибка вычисления"
        );

    }

}




function evaluateExpression(input) {

    let exp = input;


    

    exp =
        exp
            .replaceAll(
                "π",
                "Math.PI"
            )
            .replaceAll(
                "e",
                "Math.E"
            )
            .replaceAll(
                "×",
                "*"
            )
            .replaceAll(
                "÷",
                "/"
            );


 

    if (
        /[^0-9+\-*/().^,\sA-Za-z]/.test(
            exp
        )
    ) {

        throw new Error(
            "Недопустимый символ"
        );

    }


    

    exp =
        replacePowers(exp);


  

    if (
        /constructor|prototype|window|document|alert|eval|Function|globalThis/i.test(
            exp
        )
    ) {

        throw new Error(
            "Недопустимое выражение"
        );

    }


    let result;


    try {

        result =
            Function(
                '"use strict"; return (' +
                exp +
                ')'
            )();

    } catch {

        throw new Error(
            "Неверное выражение"
        );

    }




    if (
        !Number.isFinite(result)
    ) {

        if (
            input.includes("/")
        ) {

            throw new Error(
                "Деление на ноль невозможно"
            );

        }


        throw new Error(
            "Результат не определён"
        );

    }


    return result;

}



function replacePowers(exp) {

    while (
        /\d+(?:\.\d+)?\s*\^\s*-?\d+(?:\.\d+)?/
            .test(exp)
    ) {

        exp =
            exp.replace(
                /(-?\d+(?:\.\d+)?)\s*\^\s*(-?\d+(?:\.\d+)?)/,
                "Math.pow($1,$2)"
            );

    }


    return exp;

}

function scientific(type) {

    try {

        if (!expression) {

            showToast(
                "Введите число",
                "error"
            );

            return;

        }


        const value =
            evaluateExpression(
                expression
            );


        let result;


        switch (type) {


           

            case "sin":

                result =
                    Math.sin(
                        toRadians(value)
                    );

                break;


            case "cos":

                result =
                    Math.cos(
                        toRadians(value)
                    );

                break;


            case "tan":

                result =
                    Math.tan(
                        toRadians(value)
                    );

                break;


            case "asin":

                if (
                    value < -1 ||
                    value > 1
                ) {

                    throw new Error(
                        "asin(x): x должен быть от -1 до 1"
                    );

                }

                result =
                    fromRadians(
                        Math.asin(value)
                    );

                break;


            case "acos":

                if (
                    value < -1 ||
                    value > 1
                ) {

                    throw new Error(
                        "acos(x): x должен быть от -1 до 1"
                    );

                }

                result =
                    fromRadians(
                        Math.acos(value)
                    );

                break;


            case "atan":

                result =
                    fromRadians(
                        Math.atan(value)
                    );

                break;


            

            case "log":

                if (value <= 0) {

                    throw new Error(
                        "log(x) определён только для x > 0"
                    );

                }

                result =
                    Math.log10(value);

                break;


            case "ln":

                if (value <= 0) {

                    throw new Error(
                        "ln(x) определён только для x > 0"
                    );

                }

                result =
                    Math.log(value);

                break;


           

            case "sqrt":

                if (value < 0) {

                    throw new Error(
                        "Корень из отрицательного числа невозможен"
                    );

                }

                result =
                    Math.sqrt(value);

                break;


            

            case "square":

                result =
                    value * value;

                break;


            case "cube":

                result =
                    value * value * value;

                break;


           

            case "inverse":

                if (value === 0) {

                    throw new Error(
                        "Деление на ноль невозможно"
                    );

                }

                result =
                    1 / value;

                break;


       

            case "factorial":

                result =
                    factorial(value);

                break;


   

            case "abs":

                result =
                    Math.abs(value);

                break;



            case "floor":

                result =
                    Math.floor(value);

                break;


      

            case "ceil":

                result =
                    Math.ceil(value);

                break;


            default:

                throw new Error(
                    "Неизвестная функция"
                );

        }


        currentResult =
            formatNumber(result);


        expression =
            String(currentResult);


        lastWasResult = true;


        updateDisplay();


        addHistory(
            type +
            "(" +
            formatNumber(value) +
            ")",
            currentResult
        );


        playSuccess();

    } catch (error) {

        showError(
            error.message
        );

    }

}




function factorial(n) {

    if (
        !Number.isInteger(n) ||
        n < 0
    ) {

        throw new Error(
            "Факториал требует целое число ≥ 0"
        );

    }


    if (n > 170) {

        throw new Error(
            "Слишком большое число"
        );

    }


    let result = 1;


    for (
        let i = 2;
        i <= n;
        i++
    ) {

        result *= i;

    }


    return result;

}




function toRadians(value) {

    if (
        angleMode === "RAD"
    ) {

        return value;

    }


    return value *
        Math.PI /
        180;

}


function fromRadians(value) {

    if (
        angleMode === "RAD"
    ) {

        return value;

    }


    return value *
        180 /
        Math.PI;

}


function setAngleMode(mode) {

    angleMode = mode;


    localStorage.setItem(
        "inkCalculatorAngleMode",
        mode
    );


    document
        .getElementById(
            "degreeMode"
        )
        .classList.toggle(
            "active",
            mode === "DEG"
        );


    document
        .getElementById(
            "radianMode"
        )
        .classList.toggle(
            "active",
            mode === "RAD"
        );

}




function formatNumber(number) {

    if (
        !Number.isFinite(number)
    ) {

        return "Error";

    }


    if (
        Math.abs(number) < 1e-12
    ) {

        number = 0;

    }


    const rounded =
        Number(
            number.toPrecision(12)
        );


    return String(rounded);

}




function updateMemory() {

    memoryElement.textContent =
        formatNumber(memory);


    localStorage.setItem(
        "inkCalculatorMemory",
        String(memory)
    );

}


function getCurrentNumber() {

    try {

        return evaluateExpression(
            expression ||
            currentResult ||
            "0"
        );

    } catch {

        return 0;

    }

}


function memoryClear() {

    memory = 0;

    updateMemory();

    showToast(
        "Память очищена",
        "success"
    );

}


function memoryRecall() {

    expression =
        formatNumber(memory);

    currentResult =
        expression;

    lastWasResult = false;

    updateDisplay();

}


function memoryAdd() {

    memory +=
        getCurrentNumber();

    updateMemory();

    showToast(
        "Добавлено в память",
        "success"
    );

}


function memorySubtract() {

    memory -=
        getCurrentNumber();

    updateMemory();

    showToast(
        "Вычтено из памяти",
        "success"
    );

}



function addHistory(
    expressionValue,
    resultValue
) {

    history.unshift({

        expression:
            expressionValue,

        result:
            resultValue,

        time:
            new Date()
                .toLocaleTimeString(
                    "ru-RU",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                )

    });


    

    history =
        history.slice(
            0,
            50
        );


    localStorage.setItem(
        "inkCalculatorHistory",
        JSON.stringify(history)
    );


    renderHistory();

}



function renderHistory() {

    if (
        !history.length
    ) {

        historyList.innerHTML = `
            <div class="empty-history">
                История пуста<br>
                Здесь появятся ваши вычисления
            </div>
        `;

        return;

    }


    historyList.innerHTML =
        history
            .map(
                (
                    item,
                    index
                ) => `

                    <div
                        class="history-item"
                        onclick="useHistory(${index})"
                    >

                        <div
                            class="history-expression"
                        >
                            ${escapeHTML(
                                item.expression
                            )}
                        </div>

                        <div
                            class="history-result"
                        >
                            =
                            ${escapeHTML(
                                item.result
                            )}
                        </div>

                        <div
                            class="history-time"
                        >
                            ${item.time}
                        </div>

                    </div>

                `
            )
            .join("");

}



function useHistory(index) {

    const item =
        history[index];


    if (!item) {

        return;

    }


    expression =
        item.result;


    currentResult =
        item.result;


    lastWasResult = true;


    updateDisplay();


    historyPanel.classList.remove(
        "open"
    );

}



function clearHistory() {

    history = [];


    localStorage.removeItem(
        "inkCalculatorHistory"
    );


    renderHistory();


    showToast(
        "История очищена",
        "success"
    );

}



function toggleHistory() {

    historyPanel.classList.toggle(
        "open"
    );

}



function toggleScientific() {

    scientificOpen =
        !scientificOpen;


    scientificPanel.classList.toggle(
        "open",
        scientificOpen
    );


    scientificToggle.classList.toggle(
        "active",
        scientificOpen
    );

}



async function copyResult() {

    const text =
        currentResult || "0";


    try {

        await navigator
            .clipboard
            .writeText(text);


        showToast(
            "Результат скопирован",
            "success"
        );

    } catch {

        showToast(
            "Не удалось скопировать",
            "error"
        );

    }

}




function showError(message) {

    currentResult =
        message;


    resultElement.classList.add(
        "error"
    );


    updateDisplay();


    playError();


    setTimeout(
        () => {

            resultElement.classList.remove(
                "error"
            );


            currentResult =
                "0";


            updateDisplay();

        },
        2500
    );

}




function showToast(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "toast " + type;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateY(10px)";


            setTimeout(
                () => {

                    toast.remove();

                },
                250
            );

        },
        2200
    );

}




function showAbout() {

    showToast(
        "INK Calculator — научный калькулятор в стиле японской тушевой графики",
        "success"
    );

}




function escapeHTML(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}



document.addEventListener(
    "keydown",
    function(event) {

        const key =
            event.key;


        

        if (
            /^[0-9]$/.test(key)
        ) {

            inputNumber(key);

            return;

        }


        

        if (
            key === "." ||
            key === ","
        ) {

            inputDecimal();

            return;

        }


        

        if (
            [
                "+",
                "-",
                "*",
                "/",
                "^"
            ].includes(key)
        ) {

            insertOperator(key);

            return;

        }


       

        if (
            key === "Enter" ||
            key === "="
        ) {

            event.preventDefault();

            calculate();

            return;

        }


    

        if (
            key === "Backspace"
        ) {

            backspace();

            return;

        }


        

        if (
            key === "Escape"
        ) {

            clearAll();

            return;

        }


        
        if (
            key === "Delete"
        ) {

            clearAll();

            return;

        }


        

        if (
            key === "%"
        ) {

            percent();

            return;

        }


       
        if (
            key === "(" ||
            key === ")"
        ) {

            insertValue(key);

            return;

        }


        
        if (
            key.toLowerCase() === "h"
        ) {

            toggleHistory();

            return;

        }


       

        if (
            key.toLowerCase() === "s"
        ) {

            toggleScientific();

            return;

        }

    }
);




let audioContext = null;


function getAudioContext() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }


    return audioContext;

}


function beep(
    frequency,
    duration,
    volume
) {

    try {

        const ctx =
            getAudioContext();


        const oscillator =
            ctx.createOscillator();


        const gain =
            ctx.createGain();


        oscillator.frequency.value =
            frequency;


        oscillator.type =
            "sine";


        gain.gain.value =
            volume;


        oscillator.connect(gain);


        gain.connect(
            ctx.destination
        );


        oscillator.start();


        gain.gain.exponentialRampToValueAtTime(
            0.0001,
            ctx.currentTime +
            duration
        );


        oscillator.stop(
            ctx.currentTime +
            duration
        );

    } catch {

      

    }

}


function playClick() {

    beep(
        150,
        0.035,
        0.015
    );

}


function playSuccess() {

    beep(
        360,
        0.07,
        0.025
    );


    setTimeout(
        () => {

            beep(
                520,
                0.08,
                0.02
            );

        },
        60
    );

}


function playError() {

    beep(
        90,
        0.12,
        0.03
    );

}




let touchStartX = 0;


document.addEventListener(
    "touchstart",
    function(event) {

        touchStartX =
            event
                .changedTouches[0]
                .screenX;

    },
    {
        passive: true
    }
);


document.addEventListener(
    "touchend",
    function(event) {

        const touchEndX =
            event
                .changedTouches[0]
                .screenX;


        const difference =
            touchEndX -
            touchStartX;


      
        if (
            difference < -100
        ) {

            historyPanel.classList.add(
                "open"
            );

        }


        
        if (
            difference > 100
        ) {

            historyPanel.classList.remove(
                "open"
            );

        }

    },
    {
        passive: true
    }
);




document.addEventListener(
    "gesturestart",
    function(event) {

        event.preventDefault();

    }
);




function scrollDisplay() {

    expressionElement.scrollLeft =
        expressionElement.scrollWidth;


    resultElement.scrollLeft =
        resultElement.scrollWidth;

}




const displayObserver =
    new MutationObserver(
        () => {

            scrollDisplay();

        }
    );


displayObserver.observe(
    expressionElement,
    {
        childList: true,
        characterData: true,
        subtree: true
    }
);




console.log(`

╔══════════════════════════════════╗
║                                  ║
║          影  INK CALCULATOR      ║
║                                  ║
║       Precision / 2026           ║
║                                  ║
╚══════════════════════════════════╝

`);


const defaultSolutions = [

    {
        id: "default-1",
        category: "basic",
        question: "25 + 17",
        steps: "25 + 17 = 42",
        answer: "42"
    },

    {
        id: "default-2",
        category: "basic",
        question: "100 − 37",
        steps: "100 − 37 = 63",
        answer: "63"
    },

    {
        id: "default-3",
        category: "basic",
        question: "12 × 8",
        steps: "12 × 8 = 96",
        answer: "96"
    },

    {
        id: "default-4",
        category: "basic",
        question: "144 ÷ 12",
        steps: "144 ÷ 12 = 12",
        answer: "12"
    },

    {
        id: "default-5",
        category: "basic",
        question: "15% от 200",
        steps: "200 × 15 ÷ 100 = 30",
        answer: "30"
    },

    {
        id: "default-6",
        category: "basic",
        question: "(25 + 15) × 2",
        steps:
            "1. Сначала вычисляем скобки:\n" +
            "25 + 15 = 40\n\n" +
            "2. Умножаем результат:\n" +
            "40 × 2 = 80",
        answer: "80"
    },

    {
        id: "default-7",
        category: "science",
        question: "2³",
        steps: "2 × 2 × 2 = 8",
        answer: "8"
    },

    {
        id: "default-8",
        category: "science",
        question: "√144",
        steps: "√144 = 12",
        answer: "12"
    },

    {
        id: "default-9",
        category: "science",
        question: "sin(30°)",
        steps: "В режиме DEG:\nsin(30°) = 0.5",
        answer: "0.5"
    },

    {
        id: "default-10",
        category: "science",
        question: "cos(60°)",
        steps: "В режиме DEG:\ncos(60°) = 0.5",
        answer: "0.5"
    },

    {
        id: "default-11",
        category: "science",
        question: "5!",
        steps:
            "5! = 5 × 4 × 3 × 2 × 1\n" +
            "5! = 120",
        answer: "120"
    },

    {
        id: "default-12",
        category: "science",
        question: "log(100)",
        steps:
            "log₁₀(100) = 2\n" +
            "потому что 10² = 100",
        answer: "2"
    },

    {
        id: "default-13",
        category: "science",
        question: "7²",
        steps: "7 × 7 = 49",
        answer: "49"
    },

    {
        id: "default-14",
        category: "science",
        question: "1 ÷ 8",
        steps: "1 ÷ 8 = 0.125",
        answer: "0.125"
    }

];




let savedSolutions = [];

try {

    savedSolutions = JSON.parse(
        localStorage.getItem("inkCalculatorSolutions") || "[]"
    );

    if (!Array.isArray(savedSolutions)) {
        savedSolutions = [];
    }

} catch (error) {

    savedSolutions = [];

}


let currentSolutionFilter = "all";




function getAllSolutions() {

    return [
        ...defaultSolutions,
        ...savedSolutions
    ];

}




function renderSolutions() {

    const list = document.getElementById("solutionsList");

    if (!list) {
        return;
    }


    let solutions = getAllSolutions();


    if (currentSolutionFilter !== "all") {

        solutions = solutions.filter(
            item => item.category === currentSolutionFilter
        );

    }


    if (solutions.length === 0) {

        list.innerHTML = `
            <div class="solutions-empty">
                Здесь пока нет сохранённых примеров.
            </div>
        `;

        return;

    }


    list.innerHTML = solutions
        .map(item => createSolutionCard(item))
        .join("");

}




function createSolutionCard(item) {

    const isSaved = savedSolutions.some(
        solution => solution.id === item.id
    );


    let categoryName = "BASIC";


    if (item.category === "science") {
        categoryName = "SCIENCE";
    }


    if (item.category === "saved") {
        categoryName = "MY";
    }


    return `

        <article class="solution-card">

            <div class="solution-type">

                <span class="solution-category">
                    ${categoryName}
                </span>

                ${
                    isSaved
                        ? `<span class="solution-saved">
                            СОХРАНЕНО
                           </span>`
                        : ""
                }

            </div>


            <div class="solution-question">
                ${escapeSolutionHTML(item.question)}
            </div>


            <div class="solution-steps">
                ${escapeSolutionHTML(item.steps)}
            </div>


            <div class="solution-answer">

                <span>ОТВЕТ:</span>

                ${escapeSolutionHTML(item.answer)}

            </div>


            ${
                isSaved
                    ? `
                        <button
                            class="solution-delete"
                            onclick="deleteSolution('${item.id}')"
                        >
                            × УДАЛИТЬ
                        </button>
                    `
                    : ""
            }

        </article>

    `;

}




function escapeSolutionHTML(text) {

    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}




function toggleSolutions() {

    const panel = document.getElementById("solutionsPanel");

    if (!panel) {
        return;
    }


    panel.classList.toggle("open");

}




function filterSolutions(filter) {

    currentSolutionFilter = filter;


    document
        .querySelectorAll(".solution-filter")
        .forEach(button => {

            button.classList.remove("active");

        });


    const buttons = document.querySelectorAll(".solution-filter");


    if (filter === "all" && buttons[0]) {
        buttons[0].classList.add("active");
    }

    if (filter === "basic" && buttons[1]) {
        buttons[1].classList.add("active");
    }

    if (filter === "science" && buttons[2]) {
        buttons[2].classList.add("active");
    }

    if (filter === "saved" && buttons[3]) {
        buttons[3].classList.add("active");
    }


    renderSolutions();

}




function saveSolution() {

    const question =
        document
            .getElementById("solutionQuestion")
            ?.value
            .trim();


    const steps =
        document
            .getElementById("solutionSteps")
            ?.value
            .trim();


    const answer =
        document
            .getElementById("solutionAnswer")
            ?.value
            .trim();


    if (!question || !steps || !answer) {

        if (typeof showToast === "function") {
            showToast("Заполните все поля");
        } else {
            alert("Заполните все поля");
        }

        return;

    }


    const newSolution = {

        id:
            "saved-" +
            Date.now() +
            "-" +
            Math.random()
                .toString(36)
                .slice(2),

        category: "saved",

        question: question,

        steps: steps,

        answer: answer

    };


    savedSolutions.push(newSolution);


    localStorage.setItem(
        "inkCalculatorSolutions",
        JSON.stringify(savedSolutions)
    );


    document.getElementById("solutionQuestion").value = "";

    document.getElementById("solutionSteps").value = "";

    document.getElementById("solutionAnswer").value = "";


    currentSolutionFilter = "all";

    filterSolutions("all");


    if (typeof showToast === "function") {
        showToast("Пример сохранён");
    }

}




function deleteSolution(id) {

    savedSolutions = savedSolutions.filter(
        item => item.id !== id
    );


    localStorage.setItem(
        "inkCalculatorSolutions",
        JSON.stringify(savedSolutions)
    );


    renderSolutions();


    if (typeof showToast === "function") {
        showToast("Пример удалён");
    }

}




function clearSolutions() {

    if (savedSolutions.length === 0) {

        if (typeof showToast === "function") {
            showToast("Сохранённых примеров нет");
        }

        return;

    }


    const confirmed = confirm(
        "Удалить все сохранённые тобой примеры?"
    );


    if (!confirmed) {
        return;
    }


    savedSolutions = [];


    localStorage.removeItem(
        "inkCalculatorSolutions"
    );


    currentSolutionFilter = "all";

    filterSolutions("all");


    if (typeof showToast === "function") {
        showToast("Мои примеры очищены");
    }

}




document.addEventListener("keydown", function(event) {

    if (
        event.key.toLowerCase() === "r" &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        !["INPUT", "TEXTAREA"].includes(
            document.activeElement.tagName
        )
    ) {

        toggleSolutions();

    }

});




document.addEventListener("DOMContentLoaded", function() {

    renderSolutions();

});