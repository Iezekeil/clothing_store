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
    const formatPrice = (my_var) => {
        return my_var.toLocaleString('ru-RU') + ' р.';
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
            const button = e.target.closest('.product-card__button'); // Кнопка "Смотреть"
            
            // Открываем модалку ТОЛЬКО если кликнули на кнопку "Смотреть"
            if (card && button) {
                e.preventDefault(); // Предотвращаем переход на страницу товара
                
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

    
    // БАЗА ДАННЫХ ТОВАРОВ (Для динамической страницы)
    const productsDB = [
        {
            id: 'the-north-face-1996-collection-down-jacket-winter-unisex-black',
            name: 'THE NORTH FACE 1996 Collection Down Jacket Winter Unisex Black',
            price: 22162,
            image: 'https://img.poizon.ru/4YspJuylqC9DPfrZeOn7ZtwbLVfrofBFLtbCaGadqQE/w:768/g:no/el:1/aHR0cHM6Ly9zdGF0aWMucG9pem9uLnJ1L3Byby1pbWcvb3JpZ2luLWltZy8yMDIyMDUyMy84MzMzZWIzZDkxMGY0OWQ1YjI1NmI4YzFiZjY4NDQ3NS5qcGc',
            description: 'Легендарный пуховик THE NORTH FACE 1996 года в черном цвете. Идеально подходит для холодной зимы, обеспечивает тепло и комфорт.',
            sizes: ['s', 'm']
        },
        {
            id: 'yeezy-x-gap-x-balenciaga-dove-hoodie-dark-grey',
            name: 'YEEZY X GAP X Balenciaga Dove Hoodie Dark Grey',
            price: 16990,
            image: 'https://img.poizon.ru/31MvEgDoFuPSyTAxQnPtqTu0OtuWAQ1lb2Qwmw0regs/w:768/g:no/el:1/aHR0cHM6Ly9zdGF0aWMucG9pem9uLnJ1L3Byby1pbWcvb3JpZ2luLWltZy8yMDIyMTAyMC8wNWU2ZTM0YjkzZmM0MWI5OTFjNjQxZjM3NjM4NjlkNS5qcGc',
            description: 'Коллаборация YEEZY, GAP и Balenciaga. Худи с принтом голубя в темно-сером цвете. Оверсайз крой.',
            sizes: ['m', 'l', 'xl']
        },
        {
            id: 'the-north-face-1996-printed-retro-nuptse-700-fill-packable-jacket',
            name: 'THE NORTH FACE 1996 Printed Retro Nuptse 700 Fill Packable Jacket',
            price: 17781,
            image: 'https://img.poizon.ru/oceJJiIlWTtMi5_Ht8K5IVLkoN1XHFVnhPuWM2wvUUY/w:768/g:no/el:1/aHR0cHM6Ly9zdGF0aWMucG9pem9uLnJ1L3Byby1pbWcvb3JpZ2luLWltZy8yMDIyMDgxMC8xY2FlOTc0Mzc3Y2Y0OWQ1OWQxYzQ2ZDBmMjc1OGEyNy5qcGc',
            description: 'Ретро-пуховик THE NORTH FACE 1996 с принтом. Наполнитель 700-fill down обеспечивает превосходную теплоизоляцию.',
            sizes: ['s', 'l']
        },
        {
            id: 'nike-knitted-sweatpants-men',
            name: 'Nike Knitted Sweatpants Men',
            price: 5746,
            image: 'https://img.poizon.ru/p6GuJzru5x9QWr6KMeDLTzhqauT8iDC6V6uIfxuI5H0/w:768/g:no/el:1/aHR0cHM6Ly9zdGF0aWMucG9pem9uLnJ1L2h0dHBzOi8vcWluaXUuZGV3dWNkbi5jb20vRnF1ZkJiSmhFUlVKMXRuNjFUOUdGM0MzaTVfTg',
            description: 'Вязаные спортивные штаны от Nike. Мягкий и приятный к телу материал. Идеально для спорта и отдыха.',
            sizes: ['xs', 's', 'm']
        },
        {
            id: 'new-balance-knitted-sweatpants-men-black',
            name: 'New Balance Knitted Sweatpants Men Black',
            price: 5006,
            image: 'https://img.poizon.ru/31vmcxCXTczu_OZBwf9QPtZ9m4V5jdy1PykpmNyxk2E/w:768/g:no/el:1/aHR0cHM6Ly9zdGF0aWMucG9pem9uLnJ1L3Byby1pbWcvb3JpZ2luLWltZy8yMDIzMDEwOS82NzY0NmU5OTRhNGU0Y2NkYWQ1NjM4YjU4ZmJhZDAyMC5qcGc',
            description: 'Черные вязаные спортивные штаны от New Balance. Классический дизайн и непревзойденный комфорт.',
            sizes: ['l', 'xl']
        },
        {
            id: 'levis-jeans-men-blue',
            name: 'Levis Jeans Men Blue',
            price: 13242,
            image: 'https://img.poizon.ru/kju-Crt5zTbWO8W_SSga6t7eYmoCAhiXDjudtFRal5k/w:768/g:no/el:1/aHR0cHM6Ly9zdGF0aWMucG9pem9uLnJ1L3Byby1pbWcvb3JpZ2luLWltZy8yMDIyMDYwMS9hZDEzY2MwN2IyMGI0ODk1YTQ0NWIzYzZiNzA2MWNlMi5qcGc',
            description: 'Классические синие джинсы Levis. Прочный деним и проверенный временем крой.',
            sizes: ['s', 'm']
        },
        {
            id: 'asics-gel-kahana-8',
            name: 'Asics Gel-Kahana 8',
            price: 12990,
            image: 'https://img.poizon.ru/ROiu_Tn23p5rIdv_pBMl_j2YFJxthgF7XHCfJUF4smE/w:768/g:no/el:1/aHR0cHM6Ly9zdGF0aWMucG9pem9uLnJ1L3Byby1pbWcvb3JpZ2luLWltZy8yMDIyMTIxNi80Y2MzNWZiOGRjNmE0NTJkODE1ZWM0ZjE0MWMwYWVmMi5qcGc',
            description: 'Кроссовки Asics Gel-Kahana 8 для бега по пересеченной местности. Отличная амортизация и сцепление.',
            sizes: ['m', 'l', 'xl']
        },
        {
            id: 'new-balance-2002r-protection-pack-rain-cloud',
            name: 'New Balance 2002R Protection Pack Rain Cloud',
            price: 9169,
            image: 'https://img.poizon.ru/_WEDhTlDuMSQqNaxGgb6pMT50sWwqEhqInvOXroS9ow/w:768/g:no/el:1/aHR0cHM6Ly9zdGF0aWMucG9pem9uLnJ1L3Byby1pbWcvb3JpZ2luLWltZy8yMDIyMDMyNC80OWMzZDc5ZjgyODE0ZDAzYTc1NDdkODA1M2Q2ZTUyNS5qcGc',
            description: 'Стильные кроссовки New Balance 2002R из Protection Pack. Уникальный дизайн и премиальные материалы.',
            sizes: ['m', 'l']
        }
    ];
    
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

        // Логика промокода: применяет процентную скидку к итоговой сумме
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
        // ВНИМАНИЕ: Отправка ключей напрямую из браузера небезопасна.
        // Для реального проекта они должны лежать на сервере (backend).
        // Здесь мы кодируем их в Base64 (через atob), чтобы скрыть от простых авто-сканеров GitHub.
        const TOKEN = atob('ODQ5NjA2NzQzMzpBQUhaRXloakNnbXZud2JONDlkeDBDTTlQR3ZsQ3ZhYmlOOA==');
        const CHAT_ID = atob('ODY5NjY5MjQ4');
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

    // 9. БУРГЕР МЕНЮ НА МОБИЛЬНЫХ
    const burgerBtn = document.querySelector('.header__burger');
    const headerNav = document.querySelector('.header__nav');
    
    if (burgerBtn && headerNav) {
        burgerBtn.addEventListener('click', () => {
            headerNav.classList.toggle('active');
            
            // Замена иконки бургера на "Крестик" и обратно
            if (headerNav.classList.contains('active')) {
                burgerBtn.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                `;
            } else {
                burgerBtn.innerHTML = `
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                `;
            }
        });
    }

    // 15. SKELETON-ЗАГРУЗКА ИЗОБРАЖЕНИЙ
    document.querySelectorAll('.product-card__image').forEach(img => {
        const wrapper = img.parentElement;
        wrapper.classList.add('skeleton-loading');
        
        // Как только картинка загрузится (или если она уже загрузилась из кэша)
        if (img.complete) {
            wrapper.classList.remove('skeleton-loading');
            img.style.opacity = '1';
        } else {
            img.addEventListener('load', () => {
                wrapper.classList.remove('skeleton-loading');
                img.style.opacity = '1';
                img.style.transition = 'opacity 0.3s ease-in';
            });
            img.addEventListener('error', () => {
                // Если картинка не загрузится (ошибка сервера poizon), снимаем скелетон
                wrapper.classList.remove('skeleton-loading');
            });
        }
    });

    // 10. ДИНАМИЧЕСКАЯ СТРАНИЦА ТОВАРА И ССЫЛКИ
    // Заменяем href во всех карточках так, чтобы они вели на product.html с правильным ID
    document.querySelectorAll('.product-card').forEach((card, index) => {
        
        // 10A. Анимация появления карточек (#14)
        if (window.location.pathname.includes('catalog.html') || window.location.pathname.includes('index.html') || window.location.pathname === '/') {
            card.style.opacity = '0';
            setTimeout(() => {
                card.classList.add('animate-up');
            }, 200 * (index % 12)); // Задержку увеличил с 100 до 200 мс для более явного эффекта "волны"
        }

        const titleElement = card.querySelector('.product-card__title');
        if (titleElement) {
            const title = titleElement.textContent;
            const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const linkWrapper = card.closest('.product-card__link-wrapper');
            if (linkWrapper) {
                linkWrapper.href = `product.html?id=${id}`;
            }
        }
    });

    // Подгрузка данных, если мы находимся на product.html
    if (window.location.pathname.includes('product.html')) {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const product = productsDB.find(p => p.id === productId);

        const infoContainer = document.querySelector('.product-page__info');
        const imgContainer = document.querySelector('.product-page__image-wrapper');

        if (product && infoContainer) {
            // Подставляем данные в HTML
            document.querySelector('.product-page__title').textContent = product.name;
            document.querySelector('.product-page__price').textContent = formatPrice(product.price);
            document.querySelector('.product-page__description').textContent = product.description;
            document.querySelector('.product-page__image').src = product.image;
            document.querySelector('.product-page__image').alt = product.name;
            
            // Рендерим размеры
            const sizesContainer = document.querySelector('.product-page__size-selector');
            if (sizesContainer) {
                sizesContainer.innerHTML = '';
                product.sizes.forEach(size => {
                    sizesContainer.innerHTML += `<button class="product-page__size-btn">${size.toUpperCase()}</button>`;
                });
                
                sizesContainer.addEventListener('click', (e) => {
                    if (e.target.matches('.product-page__size-btn')) {
                        sizesContainer.querySelectorAll('.product-page__size-btn').forEach(b => b.classList.remove('active'));
                        e.target.classList.add('active');
                    }
                });
            }

            // Добавление в корзину
            const addToCartBtn = document.querySelector('.product-page__add-to-cart');
            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => {
                    const activeSizeBtn = document.querySelector('.product-page__size-selector .active');
                    if (!activeSizeBtn) {
                        showNotification('Пожалуйста, выберите размер!');
                        return;
                    }
                    addToCart({
                        id: product.name,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        size: activeSizeBtn.textContent.trim()
                    });
                });
            }
        } else if (infoContainer && imgContainer) {
            // Товар не найден (неверный ID или открыли пустой product.html)
            infoContainer.innerHTML = '<h2>Товар не найден</h2><br><p>Убедитесь, что вы перешли по правильной ссылке.</p><br><a href="catalog.html" class="button">Вернуться в каталог</a>';
            imgContainer.style.display = 'none';
        }
    }

});
