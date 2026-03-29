document.addEventListener('DOMContentLoaded', () => {

    // 1. ОБЩИЕ ФУНКЦИИ И УТИЛИТЫ
    // (Работа с корзиной, уведомления, форматирование)

    /**
     * @description Получает данные корзины из Local Storage.
     * @returns {Array} - Массив объектов товаров в корзине.
     */
    const getCart = () => JSON.parse(localStorage.getItem('cart')) || [];
    
    /**
     * @description Сохраняет данные корзины в Local Storage.
     * @param {Array} cart - Массив объектов товаров для сохранения.
     */
    const saveCart = (cart) => localStorage.setItem('cart', JSON.stringify(cart));

    /**
     * @description Обновляет иконку корзины в шапке, показывая общее количество товаров.
     */
    const updateCartIcon = () => {
        const cart = getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        const cartCounter = document.querySelector('.header__cart-count');

        if (cartCounter) {
            cartCounter.textContent = totalItems > 0 ? totalItems : '';
        }
    };

    /**
     * @description Показывает всплывающее уведомление (toast).
     * @param {string} message - Сообщение для отображения.
     */
    const showNotification = (message) => {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    /**
     * @description Добавляет товар в корзину. Если товар с таким ID и размером уже есть, увеличивает его количество.
     * @param {object} productData - Объект с данными товара.
     */
    const addToCart = (productData) => {
        const cart = getCart();
        const existingItem = cart.find(item => item.id === productData.id && item.size === productData.size);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...productData, quantity: 1 });
        }

        saveCart(cart);
        updateCartIcon();
        showNotification(`Товар добавлен в корзину`);
    };

    /**
     * @description Форматирует число в строку цены (например, 10000 -> "10 000 р.").
     * @param {number} price - Цена для форматирования.
     * @returns {string} - Отформатированная строка.
     */
    const formatPrice = (price) => {
        return price.toLocaleString('ru-RU') + ' р.';
    };


    // 2. ЛОГИКА МОДАЛЬНОГО ОКНА НА СТРАНИЦЕ КАТАЛОГА
    // (Открытие, закрытие, добавление в корзину из модального окна)

    const catalogPageIdentifier = document.querySelector('.catalog__container'); // Уникальный элемент для страницы каталога
    const modal = document.getElementById('product-modal');

    // Этот блок выполняется только на странице каталога, где есть и контейнер, и модальное окно.
    if (catalogPageIdentifier && modal) {
        const productGridForModal = catalogPageIdentifier.querySelector('.product-grid');
        const modalCloseBtn = document.getElementById('modal-close-btn');
        const modalImg = document.getElementById('modal-img');
        const modalTitle = document.getElementById('modal-title');
        const modalPrice = document.getElementById('modal-price');
        const modalDescription = document.querySelector('.modal-description');
        const modalSizeSelector = document.getElementById('modal-size-selector');
        const modalAddToCartBtn = document.getElementById('modal-add-to-cart');

        /**
         * @description Открывает модальное окно и заполняет его данными о товаре.
         * @param {object} productData - Данные товара для отображения.
         */
        const openModal = (productData) => {
            modalImg.src = productData.image;
            modalTitle.textContent = productData.name;
            modalPrice.textContent = formatPrice(productData.price);
            modalDescription.textContent = productData.description;
            
            // Сбрасываем активный выбор размера
            const currentActive = modalSizeSelector.querySelector('.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }

            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('active'), 10);
        };

        /**
         * @description Закрывает модальное окно.
         */
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        };

        // Делегирование кликов по сетке товаров для открытия модального окна
        productGridForModal.addEventListener('click', (e) => {
            const card = e.target.closest('.product-card');
            if (card) {
                e.preventDefault(); // Предотвращаем переход по ссылке, если он есть
                
                // Собираем данные из карточки
                const product = {
                    id: card.querySelector('.product-card__title').textContent.trim(),
                    name: card.querySelector('.product-card__title').textContent.trim(),
                    price: parseFloat(card.querySelector('.product-card__price').textContent.replace(/[^0-9]/g, '')),
                    image: card.querySelector('.product-card__image').src,
                    description: card.dataset.description || 'Описание для этого товара отсутствует.'
                };
                
                openModal(product);
            }
        });

        // Выбор размера в модальном окне
        modalSizeSelector.addEventListener('click', (e) => {
            if (e.target.matches('.product-page__size-btn')) {
                const buttons = modalSizeSelector.querySelectorAll('.product-page__size-btn');
                buttons.forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
        
        // Добавление в корзину из модального окна
        modalAddToCartBtn.addEventListener('click', () => {
            const activeSizeBtn = modalSizeSelector.querySelector('.active');
            
            if (!activeSizeBtn) {
                showNotification('Пожалуйста, выберите размер!');
                return;
            }

            const product = {
                id: modalTitle.textContent,
                name: modalTitle.textContent,
                price: parseFloat(modalPrice.textContent.replace(/[^0-9]/g, '')),
                image: modalImg.src,
                size: activeSizeBtn.textContent.trim()
            };

            addToCart(product);
            closeModal();
        });

        // Обработчики закрытия модального окна
        modalCloseBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(); // Закрываем по клику на оверлей
            }
        });
    }

    // 3. ЛОГИКА СТРАНИЦЫ КОРЗИНЫ (cart.html)
    // (Рендер товаров, изменение количества, удаление, очистка)

    const cartContainer = document.getElementById('cart-items-container');
    let currentDiscount = 1; // 1 = 100% (нет скидки)
    let appliedPromoCode = ''; // Храним название примененного промокода
    
    /**
     * @description Отображает товары из корзины на странице cart.html.
     */
    const renderCartPage = () => {
        if (!cartContainer) return; // Выполняется только на странице корзины

        const cart = getCart();
        const totalPriceEl = document.getElementById('cart-total-price');
        let total = 0;

        cartContainer.innerHTML = '';

        if (cart.length === 0) {
            cartContainer.innerHTML = '<div style="padding:40px; text-align:center; color:#999;">Корзина пуста</div>';
            if (totalPriceEl) totalPriceEl.textContent = '0 р.';
            return;
        }

        cart.forEach((item, index) => {
            total += item.price * item.quantity;
            
            const html = `
                <div class="order-item" data-index="${index}">
                    <img src="${item.image}" class="order-item__img" alt="${item.name}">
                    <div class="order-item__details">
                        <div class="order-item__title">${item.name}</div>
                        <div class="order-item__meta">Размер: ${item.size}</div>
                    </div>
                    <div class="order-item__controls">
                        <button class="qty-btn js-decrease">-</button>
                        <span class="order-item__quantity">${item.quantity}</span>
                        <button class="qty-btn js-increase">+</button>
                    </div>
                    <div class="order-item__price">${formatPrice(item.price * item.quantity)}</div>
                    <button class="order-item__remove js-remove">×</button>
                </div>
            `;
            cartContainer.insertAdjacentHTML('beforeend', html);
        });

        if (totalPriceEl) {
            const finalTotal = Math.round(total * currentDiscount);
            if (currentDiscount < 1) {
                totalPriceEl.innerHTML = `<s style="font-size: 14px; color: #999; margin-right: 10px;">${formatPrice(total)}</s> ${formatPrice(finalTotal)}`;
            } else {
                totalPriceEl.textContent = formatPrice(total);
            }
        }
    };

    // Управление корзиной (используем делегирование событий)
    if (cartContainer) {
        renderCartPage(); // Первый рендер при загрузке страницы

        cartContainer.addEventListener('click', (e) => {
            const target = e.target;
            const itemElement = target.closest('.order-item');
            if (!itemElement) return;

            const index = itemElement.dataset.index;
            const cart = getCart();

            if (target.matches('.js-increase')) {
                cart[index].quantity++;
            } else if (target.matches('.js-decrease')) {
                cart[index].quantity--;
                if (cart[index].quantity < 1) cart.splice(index, 1);
            } else if (target.matches('.js-remove')) {
                cart.splice(index, 1);
            }

            saveCart(cart);
            renderCartPage();
            updateCartIcon();
        });

        // Очистка корзины
        const clearBtn = document.getElementById('clear-cart-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('Вы уверены, что хотите очистить корзину?')) {
                    saveCart([]);
                    currentDiscount = 1;
                    appliedPromoCode = '';
                    renderCartPage();
                    updateCartIcon();
                    showNotification('Корзина очищена');
                }
            });
        }

        // Логика промокода
        const applyPromoBtn = document.getElementById('apply-promo-btn');
        const promoInput = document.getElementById('promocode');
        
        if (applyPromoBtn && promoInput) {
            applyPromoBtn.addEventListener('click', () => {
                const code = promoInput.value.trim().toUpperCase();
                if (code === 'LEGIT20') {
                    currentDiscount = 0.8;
                    appliedPromoCode = code;
                    showNotification('Промокод LEGIT20 применен: Скидка 20%');
                } else if (code === 'SKIDKA10') {
                    currentDiscount = 0.9;
                    appliedPromoCode = code;
                    showNotification('Промокод SKIDKA10 применен: Скидка 10%');
                } else {
                    currentDiscount = 1;
                    appliedPromoCode = '';
                    showNotification('Неверный или просроченный промокод');
                }
                renderCartPage();
            });
        }
    }


    // 4. ЛОГИКА ОФОРМЛЕНИЯ ЗАКАЗА И ОТПРАВКИ В TELEGRAM
    // (Валидация формы, сбор данных, отправка fetch-запроса)

    const checkoutForm = document.querySelector('.checkout-form-section');

    if (checkoutForm) {
        // Функции валидации
        const validateEmail = (email) => /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(String(email).toLowerCase());
        const validatePhone = (phone) => /^\+?[78][-\s(]*\d{3}[-\s)]*\d{3}[-\s]*\d{2}[-\s]*\d{2}$/.test(String(phone));

        // Функция для показа/скрытия ошибки
        const updateError = (input, isValid, message) => {
            const errorMessageElement = input.nextElementSibling; // Ищем следующий элемент
            input.classList.toggle('invalid', !isValid);
            if (errorMessageElement && errorMessageElement.classList.contains('error-message')) {
                errorMessageElement.textContent = isValid ? '' : message;
            }
        };
    
        // Константы для Telegram API
        const TOKEN = '8496067433:AAHZEyhjCgmvnwbN49dx0CM9PGvlCvabiN8';
        const CHAT_ID = '869669248';
        const API_URL = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

        // Обработчик отправки формы
        document.addEventListener('click', async (e) => {
            if (!e.target.matches('.checkout-btn')) return;

            e.preventDefault();

            const cart = getCart();
            if (cart.length === 0) {
                showNotification('Ваша корзина пуста!');
                return;
            }

            // Сбор данных из формы
            const fioInput = document.getElementById('fio');
            const phoneInput = document.getElementById('phone');
            const emailInput = document.getElementById('email');
            const addressInput = document.getElementById('address');

            // Валидация
            const isFioValid = !!fioInput.value.trim();
            const isPhoneValid = validatePhone(phoneInput.value);
            const isEmailValid = validateEmail(emailInput.value);
            const isAddressValid = !!addressInput.value.trim();

            updateError(fioInput, isFioValid, 'Пожалуйста, введите ваше ФИО');
            updateError(phoneInput, isPhoneValid, 'Неверный формат телефона');
            updateError(emailInput, isEmailValid, 'Неверный формат email');
            updateError(addressInput, isAddressValid, 'Пожалуйста, введите ваш адрес');
            
            if (!isFioValid || !isPhoneValid || !isEmailValid || !isAddressValid) {
                return;
            }

            // Формирование сообщения для Telegram
            let message = `<b>Новый заказ!</b>\n\n`;
            message += `<b>ФИО:</b> ${fioInput.value.trim()}\n`;
            message += `<b>Телефон:</b> ${phoneInput.value.trim()}\n`;
            message += `<b>Email:</b> ${emailInput.value.trim()}\n`;
            message += `<b>Адрес:</b> ${addressInput.value.trim()}\n\n`;
            message += `<b>Товары в заказе:</b>\n`;

            let originalTotalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            let discountMultiplier = typeof currentDiscount !== 'undefined' ? currentDiscount : 1;
            let finalTotalPrice = Math.round(originalTotalPrice * discountMultiplier);

            cart.forEach(item => {
                message += `- ${item.name} (Размер: ${item.size}) - ${item.quantity} шт. x ${formatPrice(item.price)}\n`;
            });
            if (discountMultiplier < 1) {
                const discountPercent = Math.round((1 - discountMultiplier) * 100);
                const codeName = typeof appliedPromoCode !== 'undefined' && appliedPromoCode ? appliedPromoCode : 'Да';
                message += `\n🎁 <b>Промокод применен:</b> ${codeName} (-${discountPercent}%)\n`;
            }
            message += `\n<b>Итоговая сумма:</b> ${formatPrice(finalTotalPrice)}`;

            // Отправка в Telegram
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CHAT_ID,
                        text: message,
                        parse_mode: 'html'
                    })
                });

                if (response.ok) {
                    showNotification('Ваш заказ успешно оформлен!');
                    saveCart([]);
                    if (typeof renderCartPage === 'function') renderCartPage();
                    updateCartIcon();
                    setTimeout(() => window.location.href = 'index.html', 2000);
                } else {
                    throw new Error(`Telegram API error: ${response.statusText}`);
                }
            } catch (error) {
                console.error('Fetch error:', error);
                alert('Ошибка сети. Не удалось отправить заказ. Попробуйте позже.');
            }
        });

        // Валидация в реальном времени
        fioInput.addEventListener('input', () => updateError(fioInput, !!fioInput.value.trim(), 'Пожалуйста, введите ваше ФИО'));
        phoneInput.addEventListener('input', () => updateError(phoneInput, validatePhone(phoneInput.value), 'Неверный формат телефона'));
        emailInput.addEventListener('input', () => updateError(emailInput, validateEmail(emailInput.value), 'Неверный формат email'));
        addressInput.addEventListener('input', () => updateError(addressInput, !!addressInput.value.trim(), 'Пожалуйста, введите ваш адрес'));
    }


    // 5. ЛОГИКА ПОИСКА В ШАПКЕ
    const searchBtn = document.querySelector('.js-search-btn');
    const searchInput = document.querySelector('.search-input');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            searchInput.classList.toggle('search-active');
            if (searchInput.classList.contains('search-active')) {
                searchInput.focus();
            }
        });

        // Фильтрация товаров в реальном времени на странице каталога
        searchInput.addEventListener('input', (e) => {
            if (window.location.pathname.includes('catalog.html')) {
                const searchTerm = e.target.value.toLowerCase().trim();
                const productCards = document.querySelectorAll('.catalog__content .product-card');

                productCards.forEach(card => {
                    const title = card.querySelector('.product-card__title').textContent.toLowerCase();
                    const isVisible = title.includes(searchTerm);
                    card.closest('.product-card__link-wrapper').style.display = isVisible ? '' : 'none';
                });
            }
        });

        // Скрытие поля поиска по клику вне его
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.js-search-btn') && !e.target.closest('.search-input')) {
                searchInput.classList.remove('search-active');
            }
        });
    }

    // 6. ФИЛЬТРАЦИЯ И АККОРДЕОН В КАТАЛОГЕ
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        const filterButtonsContainer = sidebar.querySelector('.sidebar__filter-buttons');
        const productCardsOnCatalog = document.querySelectorAll('.catalog__content .product-card');
        const applyBtn = sidebar.querySelector('.sidebar__button');
        const priceFromInput = sidebar.querySelectorAll('.sidebar__price-input')[0];
        const priceToInput = sidebar.querySelectorAll('.sidebar__price-input')[1];
        const sizeCheckboxes = sidebar.querySelectorAll('input[name="size"]');

        // Подготовим фейковые размеры для товаров, если их нет, чтобы мы могли видеть как работает фильтр
        productCardsOnCatalog.forEach((card, index) => {
            if (!card.dataset.sizes) {
                const testSizes = ['s,m', 'm,l,xl', 's,l', 'xs,s,m', 'l,xl'];
                card.dataset.sizes = testSizes[index % testSizes.length];
            }
        });

        const applyFilters = () => {
            const activeCategoryBtn = filterButtonsContainer ? filterButtonsContainer.querySelector('.active') : null;
            const activeCategory = activeCategoryBtn ? activeCategoryBtn.dataset.filter : 'all';
            
            const priceFrom = parseFloat(priceFromInput.value) || 0;
            const priceTo = parseFloat(priceToInput.value) || Infinity;
            const selectedSizes = Array.from(sizeCheckboxes).filter(cb => cb.checked).map(cb => cb.value);

            productCardsOnCatalog.forEach(card => {
                // 1. Проверка категории
                let isVisible = (activeCategory === 'all' || card.dataset.category === activeCategory);

                // 2. Проверка цены
                const priceText = card.querySelector('.product-card__price').textContent;
                const priceValue = parseFloat(priceText.replace(/[^0-9]/g, ''));
                if (priceValue < priceFrom || priceValue > priceTo) {
                    isVisible = false;
                }

                // 3. Проверка размера (если выбраны какие-то размеры)
                if (isVisible && selectedSizes.length > 0) {
                    const cardSizes = card.dataset.sizes ? card.dataset.sizes.split(',') : []; 
                    const hasSize = selectedSizes.some(size => cardSizes.includes(size));
                    if (!hasSize) {
                        isVisible = false;
                    }
                }

                card.closest('.product-card__link-wrapper').style.display = isVisible ? '' : 'none';
            });
        };

        if (filterButtonsContainer && productCardsOnCatalog.length > 0) {
            filterButtonsContainer.addEventListener('click', (e) => {
                if (!e.target.matches('.filter-btn')) return;
                filterButtonsContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                applyFilters(); // Фильтруем сразу при смене категории
            });
        }
        
        if (applyBtn) {
            // Фильтруем по клику на "Применить" (для цены и размеров)
            applyBtn.addEventListener('click', applyFilters);
        }

        // Логика аккордеона
        const accordionHeaders = sidebar.querySelectorAll('.accordion-header');
        accordionHeaders.forEach(header => {
            const panel = header.nextElementSibling;
            // Если панель открыта по умолчанию, устанавливаем высоту
            if (header.classList.contains('active')) {
                panel.style.maxHeight = panel.scrollHeight + 'px';
            }

            header.addEventListener('click', () => {
                header.classList.toggle('active');
                if (panel.style.maxHeight) {
                    panel.style.maxHeight = null;
                } else {
                    panel.style.maxHeight = panel.scrollHeight + 'px';
                }
            });
        });
    }


    // 7. ЛОГИКА СЛАЙДЕРА НА ГЛАВНОЙ СТРАНИЦЕ
    const sliderContainer = document.querySelector('.slider__wrapper');
    if (sliderContainer) {
        const leftArrow = document.querySelector('.slider__arrow--left');
        const rightArrow = document.querySelector('.slider__arrow--right');

        const scrollSlider = (direction) => {
            const firstItem = sliderContainer.querySelector('.product-card__link-wrapper');
            if (!firstItem) return;

            const itemWidth = firstItem.offsetWidth;
            const gap = parseFloat(window.getComputedStyle(firstItem.parentElement).gap);
            const scrollAmount = (itemWidth + gap) * direction;
            
            sliderContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        };

        leftArrow.addEventListener('click', () => scrollSlider(-1));
        rightArrow.addEventListener('click', () => scrollSlider(1));
    }


    // 8. ИНИЦИАЛИЗАЦИЯ
    // (Функции, которые должны выполниться при загрузке страницы)
    updateCartIcon();

    // 9. АКТИВНОЕ СОСТОЯНИЕ НАВИГАЦИИ
    const navLinks = document.querySelectorAll('.nav__link');
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // Обрабатываем случаи, когда ссылка пустая (#) или ведет на главную
        if (linkHref === currentPath || (currentPath === 'index.html' && linkHref === '#')) {
            link.classList.add('active');
        }
    });

});
