import { data_array, destination } from "../scripts/database.js";

let button_search = document.getElementById("button_search");
let button_count = document.getElementById("button-count");
let button_reset = document.getElementById("button-reset");
let sort_input = document.getElementById("sort");
let create_button = document.getElementById("create-button-menu");
let modal_background = document.querySelector("#background-modal");
let create_submit_button = document.getElementById("submit-create-button");

modal_background.addEventListener("click", close_modal);
window.addEventListener("load", fetchData);
button_count.addEventListener("click", countPrice);
button_search.addEventListener("click", search, this);
button_reset.addEventListener("click", cleanSearch);
sort_input.addEventListener("change", sortBy, this);
create_button.addEventListener("click", create_modal);
create_submit_button.addEventListener("click", create_element);

async function fetchData() {
    try {
        const response = await fetch('/api/destinations');
        const destinations = await response.json();
        data_array.length = 0;
        destinations.forEach(dest => data_array.push(dest));
        showElements(data_array);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function cleanSearch() {
    clearScreen();
    showElements(data_array);
}

function showElements(data_array) {
    for (let i in data_array) {
        const temp_container = document.getElementById("item-storage");
        const template = document.getElementById("item");
        const clone = template.content.cloneNode(true);
        const id = clone.querySelector("#id");
        id.innerText = data_array[i].id;
        const img = clone.querySelector("#item-image");
        img.src = data_array[i].image;
        const name = clone.querySelector("div.item-info > h1");
        name.innerText = data_array[i].name;
        const description = clone.querySelector("#description-item");
        description.innerText = data_array[i].description;
        const price = clone.querySelector("#price");
        price.innerText = data_array[i].price;
        const last_updated = clone.querySelector("#item-updated-at");
        last_updated.innerText = data_array[i].last_updated;
        clone.querySelector("#button-remove").addEventListener("click", deleteElement, this);
        clone.querySelector("#button-edit").addEventListener("click", edit_modal, this);
        temp_container.appendChild(clone);
    }
}

async function deleteElement(elem) {
    elem = elem.srcElement;
    let element = elem.parentNode.parentNode.parentNode.parentNode;
    let id = element.querySelector("#id").innerText;

    try {
        const response = await fetch(`/api/destinations/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            const obj_to_delete = data_array.find(destination => destination.id === id);
            data_array.splice(data_array.indexOf(obj_to_delete), 1);
            element.remove();
        } else {
            console.error('Failed to delete the destination');
        }
    } catch (error) {
        console.error('Error deleting destination:', error);
    }
}

function search(input) {
    input = input.srcElement;
    let textInput = input.parentNode.parentNode.querySelector("#input_search").value.trim().toLowerCase();
    const destinations = data_array.filter(destination => destination.name.toLowerCase().includes(textInput));
    clearScreen();
    showElements(destinations);
}

function countPrice() {
    const items = document.querySelectorAll(".item");
    let sum = 0;
    for (const item of items) {
        let price = item.querySelector("#price").innerText;
        sum += price / 1;
    }
    sum += "$";
    document.querySelector("#total_price").innerText = sum;
}

function sortBy(sort_value) {
    sort_value = sort_value.srcElement.value;
    const data = backToObject();
    if (sort_value === "name (A-Z)") {
        data.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    }
    else if (sort_value === "name (Z-A)") {
        data.sort((a, b) => (b.name > a.name) ? 1 : ((a.name > b.name) ? -1 : 0));
    }
    else if (sort_value === "price (0-99+)") {
        data.sort((a, b) => a.price - b.price);
    }
    else if (sort_value === "price (99+-0)") {
        data.sort((a, b) => b.price - a.price);
    }
    clearScreen();
    showElements(data);
}

function clearScreen() {
    let elements = document.querySelectorAll(".item");
    for (let i of elements) {
        i.remove();
    }
}

function backToObject() {
    const items = document.querySelectorAll(".item");
    const item_list = [];
    for (let item of items) {
        let id = item.querySelector("#id").innerText / 1;
        let name = item.querySelector("#name-item").innerText;
        let image = item.querySelector("#item-image").src;
        const description = item.querySelector("#description-item").innerText;
        const price = item.querySelector("#price").innerText / 1;
        const last_updated = item.querySelector("#item-updated-at").innerText;
        const object = new destination(id, image, name, description, price, last_updated);
        item_list.push(object);
    }
    return item_list;
}

function create_modal() {
    let create_modal_div = document.querySelector("#create-modal");
    let modal_background = document.querySelector("#background-modal");
    let body = document.querySelector("#body");
    create_modal_div.style.display = "flex";
    modal_background.style.display = "block";
    body.style.overflow = "hidden";
}

async function create_element() {
    let title = document.querySelector("#title-modal").value.trim();
    let description = document.querySelector("#description-modal").value.trim();
    let price = document.querySelector("#price-modal").value / 1;
    let img = document.querySelector("#image-modal").files[0];
    let titleError = document.querySelector("#title-error");

    titleError.innerText = '';

    if (!title || !description || !price || !img) {
        modal_error("Усі поля повинні бути заповнені, і зображення повинно бути завантажено.");
        return;
    }

    if (data_array.some(destination => destination.name.toLowerCase() === title.toLowerCase())) {
        titleError.innerText = "Назва вже існує, будь ласка, виберіть іншу.";
        return;
    }

    let img_src = URL.createObjectURL(img);
    let last_updated = new Date().toDateString().split(" ").slice(1, 4).join(' ');
    let newDestination = {
        name: title,
        image: img_src,
        description: description,
        price: price,
        last_updated: last_updated
    };

    try {
        const response = await fetch('/api/destinations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newDestination)
        });

        if (response.ok) {
            const createdDestination = await response.json();
            data_array.push(createdDestination);
            clearScreen();
            showElements(data_array);
            close_modal();
            location.reload();
        } else {
            console.error('Не вдалося створити пункт призначення');
        }
    } catch (error) {
        console.error('Помилка при створенні пункту призначення:', error);
    }

    clearModalFields();
}


function clearModalFields() {
    document.querySelector("#title-modal").value = '';
    document.querySelector("#description-modal").value = '';
    document.querySelector("#price-modal").value = '';
    document.querySelector("#image-modal").value = '';
}


function modal_error(error_type) {
    let error_modal = document.querySelector("#error-modal");
    error_modal.style.display = "flex";
    error_modal.querySelector("#error-value").innerText = error_type;
    setTimeout(() => { close_error_modal() }, 3000);
}

function close_error_modal() {
    let error_modal = document.querySelector("#error-modal");
    error_modal.style.display = "none";
}

function edit_modal(event) {
    let element = event.target;
    let parentElement = element.closest(".item");
    let id = parentElement.querySelector("#id").innerText / 1;

    const destination = data_array.find(dest => dest.id === id);

    let edit_modal_div = document.querySelector("#edit-modal");
    edit_modal_div.querySelector("#title-edit-modal").value = destination.name;
    edit_modal_div.querySelector("#description-edit-modal").value = destination.description;
    edit_modal_div.querySelector("#price-edit-modal").value = destination.price;

    edit_modal_div.style.display = "flex";
    modal_background.style.display = "block";
    document.body.style.overflow = "hidden";

    let submit_button = edit_modal_div.querySelector("#submit-edit-button");
    submit_button.onclick = () => edit_item(id);
}

async function edit_item(id) {
    let title = document.querySelector("#title-edit-modal").value.trim();
    let description = document.querySelector("#description-edit-modal").value.trim();
    let price = document.querySelector("#price-edit-modal").value / 1;
    let img = document.querySelector("#image-edit-modal").files[0];

    if (!title || !description || !price) {
        modal_error("All fields must be filled!");
        return;
    }

    const destination = data_array.find(dest => dest.id === id);

    destination.name = title;
    destination.description = description;
    destination.price = price;
    destination.last_updated = new Date().toDateString().split(" ").slice(1, 4).join(' ');

    if (img) {
        let img_src = URL.createObjectURL(img);
        destination.image = img_src;
    }

    try {
        const response = await fetch(`/api/destinations/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(destination)
        });

        if (response.ok) {
            clearScreen();
            showElements(data_array);
            close_modal();
            
            location.reload();
        } else {
            console.error('Failed to update destination');
        }
    } catch (error) {
        console.error('Error updating destination:', error);
    }
}


function close_modal() {
    console.log("Закриваємо модальне вікно");

    document.querySelectorAll(".modal").forEach(modal => {
        console.log("Закриваємо:", modal);
        modal.style.display = "none";
        modal.classList.remove("show");
    });

    const backgroundModal = document.querySelector("#background-modal");
    if (backgroundModal) {
        console.log("Закриваємо фон модального вікна");
        backgroundModal.style.display = "none";
        backgroundModal.classList.remove("show");
    }
    
    document.body.style.overflow = "auto";

    clearModalFields();

    console.log("Модальне вікно закрите і очищене");
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("submit-create-button").addEventListener("click", function() {
        const title = document.getElementById("title-modal").value.trim();

        const duplicate = destinations.some(destination => destination.title === title);
        
        console.log("Значення назви:", title);
        console.log("Дублікати:", duplicate);

        if (title === "") {
            alert("Будь ласка, введіть назву.");
            return;
        }

        if (duplicate) {
            alert("Оголошення з такою назвою вже існує. Будь ласка, введіть іншу назву.");
            return;
        } else {
            const newDestination = {
                title: title,
                description: document.getElementById("description-modal").value,
                price: parseFloat(document.getElementById("price-modal").value),
                image: document.getElementById("image-modal").files[0]
            };

            destinations.push(newDestination);
            console.log("Оголошення створено:", newDestination);
            
            document.getElementById("create-modal").style.display = "none";
            
            displayDestinations(); 
        }
    });
});





