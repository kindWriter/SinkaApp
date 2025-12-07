function showTab(tabName, event) {
    event.preventDefault();
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName + '-tab').style.display = 'block';
    event.currentTarget.classList.add('active');
}
