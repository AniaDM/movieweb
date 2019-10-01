// Constraints for validation
let constraints = {
    title: {
        presence: {
            message: '^Podaj tytuł',
        },
        length: {
            minimum: 5,
            message: '^Tytuł jest za krótki',
        }
    },
    director: {
        presence: {
            message: '^Podaj reżysera',
        },
    },
    year: {
        presence: {
            message: '^Podaj rok',
        },
        numericality: {
            greaterThan: 1895,
            lessThan: new Date().getFullYear(),
            message: '^Niewłaściwy rok'
        }
    },
    grade: {
        presence: true,
        numericality: {
            message: '^Wybierz ocenę',
        },
    }
};

// Shows text when there is no film list
document.getElementById('noneFilm').style.display = 'none';

// Table with film list (tbody)
const table = document.querySelector('#filmTableList');

// Shows the errors for a specific input
function showErrorsForInput(input, errors) {
    var formGroup = closestParent(input.parentNode, 'subform');
    // Finds where the error messages will be insert into
    var messages = formGroup.querySelector('.messages');

    // First we remove any old messages and resets the classes
    resetFormGroup(formGroup);
    // If we have errors
    if (errors) {
        formGroup.classList.add('has-error');
        errors.forEach(function(error) {
            addError(messages, error);
        });
    } else {
        formGroup.classList.add('has-success');
    }
};

// Finds the closest parent that has the specified class
function closestParent(child, className) {
    if (!child || child == document) {
        return null;
    }
    if (child.classList.contains(className)) {
        return child;
    } else {
        return closestParent(child.parentNode, className);
    }
};

// Resets form (remove old messages)
function resetFormGroup(formGroup) {
    formGroup.classList.remove('has-error');
    formGroup.classList.remove('has-success');
    formGroup.querySelectorAll('.help-block.error').forEach(function(el) {
        el.parentNode.removeChild(el);
    });
};

// Adds the specified error with the following class 'help-block error'
function addError(messages, error) {
    var block = document.createElement('p');
    block.classList.add('help-block');
    block.classList.add('error');
    block.innerText = error;
    messages.appendChild(block);
};

// Updates the inputs with the validation errors
function showErrors(form, errors) {
    form.querySelectorAll('input[name], select[name]').forEach(function(input) {
        showErrorsForInput(input, errors && errors[input.name]);
    });
};

// Validate
function handleFormSubmit(form) {
    // Validates the form against the constraints
    var errors = validate(form, constraints);
    showErrors(form, errors || {});
    if (!errors) {
        return true;
    }
    return false;
};

// Submit event
document.addEventListener('DOMContentLoaded', function() {
    form = document.getElementById('addFilmForm');
    form.addEventListener('submit', function(event) {

        event.preventDefault();

        let success = handleFormSubmit(form);
        // Form values
        let filmTitle = document.getElementById('title').value;
        let filmDirector = document.getElementById('director').value;
        let filmYear = document.getElementById('year').value;
        let filmGrade = document.getElementById('grade').value;

        if (success) {
            // Form data
            const formData = new FormData();
            formData.append('title', filmTitle);
            formData.append('director', filmDirector);
            formData.append('year', filmYear);

            fetch('https://filmdb.grygiel.eu/api/movies/add', {
                    method: 'post',
                    body: formData
                })
                .then(res => res.json())
                .then(res => {
                    console.log('Film was added');
                    console.log(res);
                    // Current date
                    const today = new Date();
                    // Adds row
                    table.insertAdjacentHTML('afterbegin', `
                        <tr class='list' data-id='${res.item.id}'>
                            <td>${filmTitle}</td>
                            <td>${filmDirector}</td>
                            <td>${filmYear}</td>
                            <td>${filmGrade}</td>
                            <td>${displayDate(today)}</td>
                            <td><button type='button' class='deleteBtn'>X</button></td>
                        </tr>`);

                    // All rows from tbody
                    rows = table.querySelectorAll('tr');
                    // Sorts after
                    sortTable(colIdx, sortDirection);
                    removeBtn();
                })
        };
    });
});


// Date of film added
const displayDate = function(inputDate) {
    return inputDate.getDate() + '-' + (inputDate.getMonth() + 1) + '-' + inputDate.getFullYear();
};

// Filter
function filter() {
    let input, filter, tr, td;
    input = document.getElementById('filter');
    filter = input.value.toUpperCase();
    tr = table.getElementsByTagName('tr');
    for (let i = 0; i < tr.length; i++) {
        td = tr[i].getElementsByTagName('td');
        let flag = 0;
        for (let j = 0; j < td.length; j++) {
            let tdn = td[j];
            if (tdn.innerHTML.toUpperCase().indexOf(filter) > -1) {
                flag = true;
            }
        }
        if (flag) {
            tr[i].style.display = '';
        } else {
            tr[i].style.display = 'none';
        }
    }
};

// Delete button
document.querySelectorAll('.deleteBtn').forEach(function(row) {
    row.addEventListener('click', function() {
        // Selected tr
        row.parentNode.parentNode.remove();
    });
});

// Cell value in the selected column (sorting)
const cellValue = function(head, idx) {
    return head.children[idx].innerText;
};

// Comapers cells in column
const comparer = function(idx, asc) {
    return function(a, b) {
        let isStrNum = function(v1, v2) {
            // Compers if number
            if (v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2)) {
                return v1 - v2
            }
            return v1.toString().localeCompare(v2)
        }
        return isStrNum(cellValue(asc ? a : b, idx), cellValue(asc ? b : a, idx));
    };
};

// Sort variables
let colIdx = 2;
let sortDirection = 0;
let rows;

// Compares cells in column on click
document.querySelectorAll('th').forEach(function(head) {
    head.addEventListener('click', function() {
        // ths of tr (thead)
        const firstLineRow = Array.from(head.parentNode.children);
        colIdx = firstLineRow.indexOf(head);
        sortDirection = !sortDirection;
        sortTable(colIdx, sortDirection);
    });
});

// Sorts table
function sortTable(column, direction) {
    rows = table.querySelectorAll('tr');
    const sorting = Array.from(rows).sort(comparer(column, direction));
    sorting.forEach(function(head) {
        table.appendChild(head);
    });
};

// Loads films from API
const getFilms = () => {
    fetch('https://filmdb.grygiel.eu/api/movies/load')
        .then(res => {
            return res.json()
        })
        .then(json => showFilms(json))
        .catch(err => console.log(err))
};

const showFilms = (films) => {
    films.forEach(film => {
        let createdDate = new Date(Date.parse(film.created_at));
        table.insertAdjacentHTML('afterbegin',
            `<tr class='list' data-id='${film.id}'>
                        <td>${film.title}</td>
                        <td>${film.director}</td>
                        <td>${film.year}</td>
                        <td></td>
                        <td>${displayDate(createdDate)}</td>
                        <td><button type='button' class='deleteBtn'>X</button></td>
                    </tr>`);
    });
    removeBtn();
    sortTable(colIdx, sortDirection);
};

// Removes films from API
let removeBtn = () => {
    document.querySelectorAll('.deleteBtn').forEach(function(row) {
        row.addEventListener('click', function() {

            let idFilm = row.parentNode.parentNode.getAttribute('data-id');

            fetch(`https://filmdb.grygiel.eu/api/movies/delete/${idFilm}`, {
                    method: 'delete'
                })
                .then(res => res.json())
                .then(res => {
                    console.log('Film was removed');
                    console.log(res);
                    row.parentNode.parentNode.remove();
                });

            let anyTr = document.querySelectorAll('tbody tr');
            if (anyTr.length <= 0) {
                return document.getElementById('noneFilm').style.display = 'block';
            }
        })
    })
};

getFilms();