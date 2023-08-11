let fromAmountInput = document.getElementById('from-amount');
let toAmountInput = document.getElementById('to-amount');
let fromCurrency = document.getElementById('from-currency');
let toCurrency = document.getElementById('to-currency');

let fromTitle = document.getElementById('from-title');
let toTitle = document.getElementById('to-title');

let fromCurrencyLabel = document.getElementById('currency-difference-from');
let toCurrencyLabel = document.getElementById('currency-difference-to');

let currencyDate = document.getElementById('currency-date');
let errorMessages = document.getElementById('error-messages');


// default currency set to EUR and USD
let currentCurrency = {
    date: "",
    fromCurrency: {
        name: "Euro",
        code: "EUR",
        rate: 0
    },
    toCurrency: {
        name: "United States Dollar",
        code: "USD",
        rate: 0
    }
}

/**
 * Loads the country lookups and sends request to Fixer.io  when the window loads.
 *
 * @param {type} - No parameters
 * @return {type} - No return value
 */

window.onload = async function () {

    addAvailableCurrencies('from-currency', currenciesLookup, currentCurrency.fromCurrency.code);
    addAvailableCurrencies('to-currency', currenciesLookup, currentCurrency.toCurrency.code);

    requestFixerAPI();
};

// from amount input on text change listner
fromAmountInput.addEventListener('input', async function (event) {
    const amount = event.target.value
    convertCurrency(amount, 'from');
});

// to amount input on text change listner
toAmountInput.addEventListener('input', async function (event) {
    const amount = event.target.value
    convertCurrency(amount, 'to');
});


/**
 * add currencies in dropdown given id of the dropdown.
 *
 * @param {string} selectId - The id of the dropdown element.
 * @param {Array} options - An array of objects representing the options.
 * @param {string} defaultValue - The default value for the dropdown element.
 */
function addAvailableCurrencies(elementId, options, defaultValue) {
    const dropdown = document.getElementById(elementId);

    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.textContent = option.name;
        optionElement.value = option.code;
        dropdown.appendChild(optionElement);
    });

    dropdown.value = defaultValue;

    dropdown.onchange = async function() {
        const selectedOption = dropdown.options[dropdown.selectedIndex];

        if (elementId === "from-currency") {
            // change To Country if user picks same country in from section
            if(currentCurrency.toCurrency.name == selectedOption.textContent){
                currentCurrency.toCurrency.name = currentCurrency.fromCurrency.name;
                currentCurrency.toCurrency.code = currentCurrency.fromCurrency.code;
            }
            // change current From country to one user picks
            currentCurrency.fromCurrency.name = selectedOption.textContent;
            currentCurrency.fromCurrency.code = selectedOption.value;
        } else {
            // change current from country if user picks same country in to section
            if(currentCurrency.fromCurrency.name == selectedOption.textContent){
                currentCurrency.fromCurrency.name = currentCurrency.toCurrency.name;
                currentCurrency.fromCurrency.code = currentCurrency.toCurrency.code;
            }
            // change current To country to one user picks
            currentCurrency.toCurrency.name = selectedOption.textContent;
            currentCurrency.toCurrency.code = selectedOption.value;

        }
        requestFixerAPI(fromAmountInput.value);
    };
}

/**
 * Convert number to decimal places.
 * 2 descimal in case number is greater than 0
 * upto calculated decimal value if value is less than 1
 *
 * @param {float} value - The number to format.
 * @return {float} This function returns formatted value.
 */
function formatNumber(value) {
    if (value === 0) {
      return 0.00;
    }
    let decimals = 2;
    if(value < 1){
        decimals = Math.ceil(-Math.log10(value))+1;
    }
    return value.toFixed(decimals);
}

/**
 * Set the date from fixer api.
 *
 * @param {Date} date - Date.
 * @return {void} This function returns nothing.
 */
function setFormattedDate(date=null){
    if(!date){
        date = new Date()
    }

    const options = {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
        timeZone: 'UTC'
    };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(date);
    const formattedDate = `${parts[2].value.trim()} ${parts[0].value}, ${parts[4].value}:${parts[6].value} ${parts[8].value.toLowerCase()} UTC`;

    currencyDate.innerText = `${formattedDate} - Disclaimer`;
}

/**
 * Sets labels for currency conversion.
 *
 * @param  This function does not takes any parameters.
 * @return {void} This function does not return a value.
 */
function currencyDifference() {

    fromTitle.innerText = currentCurrency.fromCurrency.name;
    toTitle.innerText = currentCurrency.toCurrency.name;

    fromCurrencyLabel.innerText = `1 ${currentCurrency.fromCurrency.name} equals`;
    const convertedAmount = formatNumber((1 / currentCurrency.fromCurrency.rate) * currentCurrency.toCurrency.rate);
    toCurrencyLabel.innerText = `${convertedAmount} ${currentCurrency.toCurrency.name}`;
}

/**
 * Fetches data from the Fixer API and updates the current currency rates.
 *
 * @param {float} amount - The defalt amount or the current amount for user.
 * @return {void} - returns nothing.
 */
function requestFixerAPI(amount = 1) {
    const apiURL = `http://data.fixer.io/api/latest?access_key=a50ec07dee55da67833df781eb7b740d&symbols=${currentCurrency.fromCurrency.code},${currentCurrency.toCurrency.code}`;

    try {
        var r = new XMLHttpRequest();
        r.responseType = 'json';
        r.open("GET", apiURL, true);
        r.onreadystatechange  = function(e) {
            if (r.readyState === 4) {
                if(r.status === 200){
                    const data = this.response;
                    if(!data.success) {
                        setErrors(data?.error?.info)
                    }
                    else {
                        setErrors('')
                        currentCurrency.date = data.date;
                        currentCurrency.fromCurrency.rate = data.rates[currentCurrency.fromCurrency.code];
                        currentCurrency.toCurrency.rate = data.rates[currentCurrency.toCurrency.code];
                        fromAmountInput.value = amount;
                        currencyDifference();
                        convertCurrency(amount, 'from')
                        setFormattedDate(new Date(data.timestamp*1000))
                    }
                }
                else {
                    setErrors('Network failed to process the request')
                }
            }
        };
        r.send();
    } catch (error) {
        setErrors('Network failed to process the request')
    }
}

/**
 * set error message.
 *
 * @param {string} error - Error message.
 * @return {void} No return value.
 */
function setErrors(error){
    if(error){
        errorMessages.innerHTML = `
        <div class="error-message" id="error-message-from">
            <span class="error-message-text">${error}</span>
        </div>`;
    }
    else {
        errorMessages.innerHTML = '';
    }

}

/**
 * calculates the currency value.
 *
 * @param {float} amount - number to convert price.
 * @param {string} variant - target input as from or to.
 * @return {void} No return value.
 */
function convertCurrency(amount, variant) {

    if(variant == 'from'){
        if (isNaN(amount)) {
            toAmountInput.value = '0';
            return;
        }
        const convertedAmount = (amount / currentCurrency.fromCurrency.rate) * currentCurrency.toCurrency.rate;
        toAmountInput.value = formatNumber(convertedAmount);
    }
    else {
        if (isNaN(amount)) {
            fromAmountInput.value = '0';
            return;
        }
        const convertedAmount = (amount / currentCurrency.toCurrency.rate) * currentCurrency.fromCurrency.rate;
        fromAmountInput.value = formatNumber(convertedAmount);
    }

}
