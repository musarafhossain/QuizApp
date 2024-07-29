const modal = document.querySelector(".loader-modal");
const overlay = document.querySelector(".overlay-modal");

const openModal = function () {
    modal.classList.remove("hidden");
    overlay.classList.remove("hidden");
};
  
const closeModal = function () {
    modal.classList.add("hidden");
    overlay.classList.add("hidden");
};