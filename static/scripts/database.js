export class destination {
    constructor(id, image, name, description, price, last_updated) {
        this.id = id;
        this.image = image;
        this.name = name;
        this.description = description;
        this.price = price;
        this.last_updated = last_updated;
    }
}
;
const destination1 = new destination(
    1,
    "../assets/paris.jpeg",
    "Paris",
    "Париж, столиця Франції, відомий своєю багатою історією та культурною спадщиною. Місто славиться Лувром, Ейфелевою вежею і собором Нотр-Дам, а також чарівними парками і бульварами, що запрошують на прогулянки.",
    1000,
    0);

const destination2 = new destination(
    2,
    "../assets/new_york.jpeg",
    "New York",
    "Нью-Йорк — одне з найбільших міст США, відоме своєю динамічною атмосферою, культурним різноманіттям і архітектурними пам'ятками. Місто є домом для Статуї Свободи, Центрального парку і Бродвею.", 
    1100, 
    0);
const destination3 = new destination(
    3, 
    "../assets/rome.jpeg", 
    "Rome", 
    "Рим є столицею Італії і важливим центром античної історії. Тут можна побачити численні архітектурні шедеври, такі як Колізей, Пантеон та Ватикан, а також насолодитися смачною італійською кухнею, що приваблює туристів.", 
    800, 
    0);

export const data_array = [destination1, destination2, destination3];
localStorage.setItem("array", JSON.stringify(data_array));  