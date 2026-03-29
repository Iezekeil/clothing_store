// БАЗА ДАННЫХ ТОВАРОВ (Вынесено в отдельный файл для разгрузки script.js)
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
