let patterns = {
    // eslint-disable-next-line max-len
    email: /^([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x22([^\x0d\x22\x5c\x80-\xff]|\x5c[\x00-\x7f])*\x22))*\x40([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d)(\x2e([^\x00-\x20\x22\x28\x29\x2c\x2e\x3a-\x3c\x3e\x40\x5b-\x5d\x7f-\xff]+|\x5b([^\x0d\x5b-\x5d\x80-\xff]|\x5c[\x00-\x7f])*\x5d))*(\.\w{2,})+$/,
    text: /^[a-zA-Z]+$/,
};

let messages = {
    missingValue: {
        'radio': 'Please select a value.',
        // on fields conditionally required based on other field values,
        // set the input id of the required field to 'conditional'
        // and the value of the conditonal input check to 'conditional'
        'conditional': 'Because you\'ve selected Yes, please fill out this field.',
        'default': 'Please fill out this field.',
    },
    patternMismatch: {
        email: 'Please enter a valid email address.',
        text: 'Please enter letters only.',
        default: 'Please match the requested format.',
    },
    wrongLength: {
    // eslint-disable-next-line max-len
        over: 'Please shorten this text to no more than {max} characters. You are currently using {length} characters.',
        // eslint-disable-next-line max-len
        under: 'Please lengthen this text to {min} characters or more. You are currently using {length} characters.',
    },
    fallback: 'There was an error with this field.',
};

/**
 * A wrapper for Array.prototype.forEach() for non-arrays
 * @param  {Array-like} arr      The array-like object
 * @param  {Function}   callback The callback to run
 */
function forEach(arr, callback) {
    Array.prototype.forEach.call(arr, callback);
}

/**
 * Add the `novalidate` attribute to all forms
 * @param {Boolean} selector  If true, remove the `novalidate` attribute
 */
function addNoValidate(selector) {
    forEach(document.querySelectorAll(selector), function(form) {
        form.setAttribute('novalidate', true);
    });
}

/**
 * Get the value of a checked radio element
 * @param {Node} field The field to check
 * @return {String} The value of the checked radio input
 */
function getCheckedValue(field) {
    if (!field.type === 'radio') return;

    if (field.checked) {
        return field.value;
    }
}

/**
 * Set a field with id 'conditional' to true if asssociated input is valid
 * @param {Node} field The field to check
 */
function setRequired(field) {
    // if no conditional id set on the field, bail
    if (field.id !== 'conditional') return;

    // check if the associated input has been checked
    let radio = document.querySelector('[value=conditional]');
    let value = getCheckedValue(radio);

    // if required condition is true, add the required attribute to the field
    if (value === 'conditional') {
        field.setAttribute('required', '');
    }
}

/**
 * Check if a required field is missing its value
 * @param  {Node} field The field to check
 * @return {Boolean}       If true, field is missing it's value
 */
function missingValue(field) {
    // set conditional field required to true if conditions are met
    setRequired(field);

    // If not required field or a radio, bail
    if (!field.hasAttribute('required')) return false;

    // Get the field value length
    let length = field.value.length;

    // Check for value
    return length < 1;
}

/**
 * Check if the field value is too long or too short
 * @param  {Node}   field    The field to check
 * @return {String}           Returns 'over', 'under', or false
 */
function wrongLength(field) {
    // Make sure field has value
    if (!field.value || field.value.length < 1) return false;

    // Check for min/max length
    let max = field.getAttribute('max');
    let min = field.getAttribute('min');

    // Check validity
    let length = field.value.length;
    if (max && length > max) return 'over';
    if (min && length < min) return 'under';

    return false;
}

/**
 * Check if field value doesn't match a pattern.
 * @param  {Node}   field    The field to check
 * @return {Boolean}         If true, there's a pattern mismatch
 */
function patternMismatch(field) {
    // Check if there's a pattern to match
    if (!field.getAttribute('pattern')) return;
    let pattern = field.getAttribute('pattern');
    pattern = patterns[field.type];
    if (!pattern || !field.value || field.value.length < 1) return false;

    // Validate the pattern
    return field.value.match(pattern) ? false : true;
}

/**
 * Test for field validations
 * @param  {Node}   field    The field to test
 * @return {Object}          The tests and their results
 */
let runValidations = function(field) {
    return {
        missingValue: missingValue(field),
        patternMismatch: patternMismatch(field),
        wrongLength: wrongLength(field),
    };
};

/**
 * Run validation checks and return field validation status and errors
 * @param  {Node} field      The field to test
 * @return {Object}          The field validity and errors
 */
function getErrors(field) {
    // Get standard validation errors
    let errors = runValidations(field);

    return {
        valid: !hasErrors(errors),
        errors: errors,
    };
}


/**
 * Check if a field has any errors
 * @param  {Object}  errors The validation test results
 * @return {Boolean}        Returns true if there are errors
 */
function hasErrors(errors) {
    for (let type in errors) {
        if (errors[type]) return true;
    }
    return false;
}

/**
 * Get the error message
 * @param  {Node}            field    The field to get an error message for
 * @param  {Object}          errors   The errors on the field
 * @return {String}          The error message
 */
function getErrorMessage(field, errors) {
    // Required missing value error
    if (errors.missingValue) {
        return messages.missingValue[field.type] || messages.missingValue[field.id] || messages.missingValue.default;
    }

    // Wrong length error
    if (errors.wrongLength) {
        return messages.wrongLength[errors.wrongLength].replace('{max}', field.getAttribute('max')).replace('{min}', field.getAttribute('min')).replace('{length}', field.value.length);
    }

    // Pattern mismatch error
    if (errors.patternMismatch) {
        return messages.patternMismatch[field.type] || messages.patternMismatch.default;
    }

    // Fallback error message
    return messages.fallback;
}


/**
 * Get or create an ID for a field
 * @param  {Node}    field    The field
 * @return {String}           The field ID
 */
function setFieldID(field) {
    let id = field.name ? field.name : field.id;
    if (!id) {
        id = Math.floor(Math.random() * 999);
        field.id = id;
    }

    return id;
}

/**
 * Remove an error message from the DOM
 * @param  {Node} field      The field with the error message
 * @param {Integer} id      The ID of the field to be removed
 */
function removeErrors(field, id) {
    // Remove error class on field
    field.classList.remove('error');

    // Get field id or name
    let id = field.id;
    if (!id) return;

    let target = field.form.querySelector('.error-message-' + id);

    // Check if an error message is in the DOM
    if (!target) return;
    target.classList.remove('error-message');

    // If so, hide it
    target.innerHTML = '';
}

/**
 * Show an error message in the DOM
 * @param  {Node} field      The field to show an error message for
 * @param  {Object}          errors   The errors on the field
 */
function showErrors(field, errors) {
    // Add error class to field
    field.classList.add('error');

    // Create an ID for the error
    let id = setFieldID(field);

    // get the error message to display
    let msg = getErrorMessage(field, errors);

    // check if a target div for the error message is already in the DOM
    let target = document.querySelector('.error-message-' + id);

    if (!target) {
        target = document.createElement('div');

        field.parentNode.insertBefore(target, field.nextSibling);
    }
    target.classList.add('error-message', 'error-message-' + id);
    target.innerHTML = msg;
}

/**
 * Validate all fields in a form or section
 * @param  {Node} target The form or section to validate fields in
 * @return {Array}       An array of fields with errors
 */
function validateAll(target) {
    return Array.prototype.filter.call(target.querySelectorAll('input'), function(field) {
        let test = validate(field);
        return test && !test.valid;
    });
}

/**
 * Validate a field
 * @param  {Node} field     The field to validate
 * @return {Object}         The validity state and errors
 */
function validate(field) {
    // Don't validate submits, buttons
    if (field.type === 'submit' || field.type === 'button') return;

    // // Validate conditional fields for radio btns
    // if (field.type === 'radio' && field.value === 1) {
    //     console.log('here');
    // }

    // Check for errors
    let isValid = getErrors(field);

    // If valid, remove any error messages
    if (isValid.valid) {
        removeErrors(field);
        return;
    }
    // check if the error message is already displayed
    showErrors(field, isValid.errors);

    return isValid;
}

/**
 * Handle blur events
 * @param {Event} event
 */
function blurHandler(event) {
    // Validate the field
    validate(event.target);
}


/**
 * Handle form submission
 * @param {Event} event
 */
function submitHandler(event) {
    event.preventDefault();

    // Validate all form fields
    let errors = validateAll(event.target);

    if (errors.length >= 1) {
        forEach(errors, function(error) {
            validate(error);
        });
    }

    if (errors.length === 0) {
        event.target.submit();
    }
}


/**
 * Initialize form validation
 */
function init() {
    // add novalidate attribute to all forms
    addNoValidate('form');

    // add submit and blur listeners and handlers
    document.addEventListener('submit', submitHandler, false);
    document.addEventListener('blur', blurHandler, true);
}

init();
