let token = null;
let selectedParty = null;

async function register() {
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    const result = await response.json();

    if (response.ok) {
        alert('Registration successful');
    } else {
        alert(result.message || 'Registration failed');
    }
}

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

function showVoteForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('results-form').style.display = 'none';
    document.getElementById('vote-form').style.display = 'block';
}

async function showResults() {
    const response = await fetch('http://localhost:5000/results');
    const results = await response.json();

    if (response.ok) {
        const resultsTable = document.getElementById('results-table').getElementsByTagName('tbody')[0];
        resultsTable.innerHTML = '';  // Clear existing table rows

        results.forEach(result => {
            const row = resultsTable.insertRow();
            row.insertCell(0).textContent = result.party;
            row.insertCell(1).textContent = result.votes;
        });

        document.getElementById('vote-form').style.display = 'none';
        document.getElementById('results-form').style.display = 'block';
    } else {
        alert('Failed to fetch results');
    }
}

function showLoginForm() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

function showRegisterForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}