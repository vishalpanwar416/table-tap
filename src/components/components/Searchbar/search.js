const searchInput = document.getElementById('searchInput');
const searchIcon = document.querySelector('.fa-search');
const closeIcon = document.querySelector('.fa-close');

searchIcon.addEventListener('click', () => {
    searchInput.classList.toggle('active');
    searchIcon.classList.toggle('fa-search');
    searchIcon.classList.toggle('fa-close');
});



