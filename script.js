let token = null;

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

    console.log('Login request:', { username, password });  // Логируем данные

    try {
        const response = await fetch('http://localhost:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.json();  // Пытаемся парсить ответ как JSON

        if (response.ok) {
            token = result.token;
            alert('Login successful');
            showVoteForm();  // Здесь вызываем функцию, которая покажет форму для голосования
        } else {
            alert(result.message || 'Login failed');
        }
    } catch (error) {
        alert('Error: ' + error.message);  // В случае ошибки на клиенте
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
        alert('Vote successfully recorded');
    } else {
        alert(result.message || 'Failed to vote');
    }
}

function showVoteForm() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('vote-form').style.display = 'block';
}
