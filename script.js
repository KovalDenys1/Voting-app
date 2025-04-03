let token = null;

// Функция для регистрации пользователя
async function register() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    });

    const result = await response.json();

    if (response.ok) {
        alert('Registration successful');
        showLoginForm();
    } else {
        alert(result.message || 'Registration failed');
    }
}

// Функция для входа в систему
async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();

        if (response.ok) {
            token = result.token;
            alert('Login successful');
            showVoteForm();
        } else {
            alert(result.message || 'Login failed');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Функция для восстановления пароля
async function forgotPassword() {
    const email = document.getElementById('forgot-password-email').value;

    const response = await fetch('http://localhost:5000/forgot-password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (response.ok) {
        alert('Password reset email sent.');
        showLoginForm();
    } else {
        alert(result.message || 'Failed to send reset email');
    }
}

// Функция для голосования
async function vote(party) {
    if (!token) {
        alert('Please login first');
        return;
    }

    const response = await fetch('http://localhost:5000/vote', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ party }),
    });

    const result = await response.json();

    if (response.ok) {
        alert(result.message || 'Vote successfully recorded');
    } else {
        alert(result.message || 'Failed to vote');
    }
}

// Функция для загрузки списка партий
async function loadParties() {
    const response = await fetch('http://localhost:5000/parties');
    const parties = await response.json();

    const partyButtonsDiv = document.getElementById('party-buttons');
    partyButtonsDiv.innerHTML = '';

    parties.forEach(party => {
        const button = document.createElement('button');
        button.textContent = party.name;
        button.onclick = () => vote(party.name);
        partyButtonsDiv.appendChild(button);
    });
}

// Функция для отображения формы голосования
function showVoteForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('results-form').style.display = 'none';
    document.getElementById('vote-form').style.display = 'block';

    loadParties();
}

// Функция для отображения результатов голосования
async function showResults() {
    const response = await fetch('http://localhost:5000/results');
    const results = await response.json();

    if (response.ok) {
        const resultsTable = document.getElementById('results-table').getElementsByTagName('tbody')[0];
        resultsTable.innerHTML = '';  // Очистка таблицы перед добавлением новых данных

        results.forEach(result => {
            const row = resultsTable.insertRow();
            row.insertCell(0).textContent = result.party;
            row.insertCell(1).textContent = result.votes || 0;  // Показываем 0, если голосов нет
        });

        document.getElementById('vote-form').style.display = 'none';
        document.getElementById('results-form').style.display = 'block';
    } else {
        alert('Failed to fetch results');
    }
}

// Функции для переключения между формами
function showLoginForm() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showForgotPasswordForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('forgot-password-form').style.display = 'block';
}
