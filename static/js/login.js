document.getElementById('checkbox').addEventListener('change', function () {
    const passField = document.getElementById('password');
    passField.type = this.checked ? 'text' : 'password';
});