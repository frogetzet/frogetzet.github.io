/* ==========================================================================
   ЛОГИКА ВЕБ-САЙТА ЭКОФЕРМЫ «АРТАМОШКИ» (SCRIPT.JS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initCatalogFiltering();
    initSmoothNavigation();
    initStarRatingPicker();
    initReviewsSystem();
});

/* ==========================================================================
   1. МГНОВЕННАЯ ФИЛЬТРАЦИЯ КАТАЛОГА (9 ПОЗИЦИЙ)
   ========================================================================== */
function initCatalogFiltering() {
    const filterButtons = document.querySelectorAll('#catalogFilterNav .filter-tab-btn');
    const productCards = document.querySelectorAll('#catalogCardsContainer .product-item-card');

    if (!filterButtons.length || !productCards.length) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedCategory = button.getAttribute('data-filter');

            productCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (selectedCategory === 'all' || cardCategory === selectedCategory) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/* ==========================================================================
   2. ПЛАВНАЯ НАВИГАЦИЯ С УЧЕТОМ ДВОЙНОЙ ЛИПКОЙ ШАПКИ
   ========================================================================== */
function initSmoothNavigation() {
    const internalLinks = document.querySelectorAll('a[href^="#"]');

    internalLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || targetId === '') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                e.preventDefault();

                const header = document.getElementById('headerTop');
                const headerHeight = header ? header.offsetHeight + 10 : 85;

                const elementTop = targetElement.getBoundingClientRect().top;
                const finalPosition = elementTop + window.pageYOffset - headerHeight;

                window.scrollTo({
                    top: finalPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ==========================================================================
   3. ИНТЕРАКТИВНЫЙ ВЫБОР ЗВЁЗД В ФОРМЕ ОТЗЫВА
   ========================================================================== */
let activeReviewRating = 5;

function initStarRatingPicker() {
    const starContainer = document.getElementById('formStarContainer');
    const gradeHint = document.getElementById('ratingGradeHint');
    if (!starContainer || !gradeHint) return;

    const starNodes = starContainer.querySelectorAll('.star-node');
    const gradeDescriptions = {
        1: '1 из 5 (Плохо)',
        2: '2 из 5 (Удовлетворительно)',
        3: '3 из 5 (Нормально)',
        4: '4 из 5 (Хорошо)',
        5: '5 из 5 (Отлично!)'
    };

    starNodes.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const hoverScore = parseInt(star.getAttribute('data-score'), 10);
            renderStarFill(starNodes, hoverScore);
            gradeHint.textContent = gradeDescriptions[hoverScore] || '';
        });

        star.addEventListener('click', () => {
            activeReviewRating = parseInt(star.getAttribute('data-score'), 10);
            renderStarFill(starNodes, activeReviewRating);
            gradeHint.textContent = gradeDescriptions[activeReviewRating] || '';
        });
    });

    starContainer.addEventListener('mouseleave', () => {
        renderStarFill(starNodes, activeReviewRating);
        gradeHint.textContent = gradeDescriptions[activeReviewRating] || '';
    });
}

function renderStarFill(starsList, score) {
    starsList.forEach(star => {
        const starScore = parseInt(star.getAttribute('data-score'), 10);
        if (starScore <= score) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

/* ==========================================================================
   4. ДВИЖОК ОТЗЫВОВ И СОХРАНЕНИЕ В LOCALSTORAGE
   ========================================================================== */
const STORAGE_KEY = 'artamoshki_farm_fresh_reviews';

function initReviewsSystem() {
    const reviewsContainer = document.getElementById('reviewsCardsContainer');
    const reviewForm = document.getElementById('farmFeedbackForm');

    // Загрузка отзывов, ранее сохраненных пользователем в браузере
    loadCustomReviews(reviewsContainer);
    calculateOverallScore();

    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('authorNameInput');
            const productInput = document.getElementById('productOrderedInput');
            const messageInput = document.getElementById('reviewMessageInput');

            const authorName = nameInput.value.trim();
            const productTitle = productInput.value.trim() || 'Парная продукция хозяйства';
            const messageText = messageInput.value.trim();

            if (!authorName || !messageText) {
                showToastNotification('Пожалуйста, заполните имя и напишите отзыв');
                return;
            }

            const newReview = {
                id: Date.now(),
                name: authorName,
                product: productTitle,
                score: activeReviewRating,
                message: messageText,
                date: getHumanDateString()
            };

            // Сохранение в память браузера
            storeReview(newReview);

            // Мгновенная вставка карточки в начало ленты
            renderSingleReview(reviewsContainer, newReview, true);

            // Пересчет среднего балла
            calculateOverallScore();

            // Сброс полей формы
            reviewForm.reset();
            activeReviewRating = 5;
            const starNodes = document.querySelectorAll('#formStarContainer .star-node');
            const gradeHint = document.getElementById('ratingGradeHint');
            if (starNodes.length) renderStarFill(starNodes, 5);
            if (gradeHint) gradeHint.textContent = '5 из 5 (Отлично!)';

            showToastNotification('Спасибо! Ваш отзыв опубликован на сайте.');
        });
    }
}

function getHumanDateString() {
    const now = new Date();
    const months = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

function getInitialsFromName(nameStr) {
    const parts = nameStr.split(/[\s,]+/).filter(Boolean);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    } else if (parts.length === 1 && parts[0].length >= 2) {
        return parts[0].slice(0, 2).toUpperCase();
    }
    return 'АК';
}

function renderSingleReview(container, reviewData, isPrepend = false) {
    if (!container) return;

    const card = document.createElement('article');
    card.className = 'review-single-card';

    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= reviewData.score) {
            starsHtml += '<i class="fa-solid fa-star"></i> ';
        } else {
            starsHtml += '<i class="fa-regular fa-star" style="color: #d1d5db;"></i> ';
        }
    }

    const initials = getInitialsFromName(reviewData.name);

    card.innerHTML = `
        <div class="review-header-flex">
            <div class="author-avatar-box">${initials}</div>
            <div class="author-text-info">
                <strong class="author-title">${escapeSecurityText(reviewData.name)}</strong>
                <span class="author-geo-date">${reviewData.date}</span>
            </div>
            <div class="stars-rating-inline">
                ${starsHtml}
            </div>
        </div>
        <div class="bought-item-pill">
            <i class="fa-solid fa-basket-shopping"></i> Заказ: ${escapeSecurityText(reviewData.product)}
        </div>
        <p class="review-message-text">${escapeSecurityText(reviewData.message)}</p>
    `;

    if (isPrepend && container.firstChild) {
        container.insertBefore(card, container.firstChild);
    } else {
        container.appendChild(card);
    }
}

function storeReview(reviewObj) {
    try {
        let reviewsList = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        reviewsList.unshift(reviewObj);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reviewsList));
    } catch (e) {
        console.error('Ошибка записи отзыва в LocalStorage:', e);
    }
}

function loadCustomReviews(container) {
    try {
        const storedReviews = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        storedReviews.forEach(item => {
            renderSingleReview(container, item, true);
        });
    } catch (e) {
        console.error('Ошибка чтения отзывов из LocalStorage:', e);
    }
}

function calculateOverallScore() {
    const scoreElement = document.getElementById('averageScoreDisplay');
    if (!scoreElement) return;

    try {
        const storedReviews = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        // Базовые стартовые оценки трех отзывов в разметке (5, 5, 5)
        let sum = 5 + 5 + 5;
        let count = 3;

        storedReviews.forEach(rev => {
            sum += rev.score;
            count += 1;
        });

        const finalScore = (sum / count).toFixed(1);
        scoreElement.textContent = finalScore;
    } catch (e) {
        // Оставляем дефолтное значение
    }
}

function escapeSecurityText(rawStr) {
    const wrapper = document.createElement('div');
    wrapper.textContent = rawStr;
    return wrapper.innerHTML;
}

/* ==========================================================================
   5. ВСПЛЫВАЮЩЕЕ УВЕДОМЛЕНИЕ (TOAST)
   ========================================================================== */
function showToastNotification(msg) {
    const existingToast = document.querySelector('.farm-toast-notice');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'farm-toast-notice';
    toast.textContent = msg;

    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '88px',
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#1b4332',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '30px',
        fontSize: '14px',
        fontWeight: '700',
        zIndex: '999999',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.28)',
        border: '1px solid #52b788',
        transition: 'opacity 0.3s ease, transform 0.3s ease'
    });

    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}