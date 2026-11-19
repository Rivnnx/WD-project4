document.addEventListener("DOMContentLoaded", function () {
  initNavigation();
  initSearchAndFilters();
  initBookingSlots();
  initDashboardReviewModal();
  initCheckoutForm();
});

/* =============
1. навігація
   =============*/
function initNavigation() {
  const navLinks = document.querySelectorAll(".nav a");
  if (navLinks.length === 0) {
    return;
  }

  const pathParts = window.location.pathname.split("/");
  let currentPage = pathParts[pathParts.length - 1];

  if (currentPage === "") {
    currentPage = "index.html";
  }

  for (let i = 0; i < navLinks.length; i++) {
    const link = navLinks[i];
    const linkHref = link.getAttribute("href");

    if (currentPage === "dashboard-admin.html" && linkHref === "dashboard.html") {
      link.classList.add("active");
    } else if (linkHref === currentPage) {
      link.classList.add("active");
    }

    link.addEventListener("click", function () {
      for (let j = 0; j < navLinks.length; j++) {
        navLinks[j].classList.remove("active");
      }
      link.classList.add("active");
    });
  }
}

/* =============
2. динамічна фільтрація просторів
   =============*/
function initSearchAndFilters() {
  const cardsGrid = document.querySelector(".cards-grid");
  if (cardsGrid === null) {
    return;
  }

  const searchForm = document.querySelector(".search-form");
  const citySelect = document.getElementById("q-city");
  const availableCheckbox = document.querySelector(".filters .switch input[type='checkbox']");
  const typeRadios = document.querySelectorAll(".filters .segmented input[type='radio']");
  const resultsTitle = document.querySelector(".results-head h2");
  const countText = document.querySelector(".results-head .text-muted");
  const cardItems = cardsGrid.querySelectorAll("li");

  let appliedCity = "";

  // Блок для порожнього результату
  const emptyBox = document.createElement("div");
  emptyBox.className = "card empty mt-24";
  emptyBox.style.display = "none";
  emptyBox.innerHTML =
    "<p><strong>Нічого не знайдено</strong></p>" +
    "<p class='text-small text-muted mt-8'>Спробуйте змінити місто, тип простору або вимкнути «Доступно зараз».</p>" +
    "<button type='button' class='btn btn-outline mt-16' id='reset-filters-btn'>Скинути фільтри</button>";
  cardsGrid.parentNode.appendChild(emptyBox);

  const resetBtn = document.getElementById("reset-filters-btn");

  function filterSpaces() {
    const onlyAvailable = availableCheckbox ? availableCheckbox.checked : false;

    let selectedType = "Усі";
    for (let i = 0; i < typeRadios.length; i++) {
      if (typeRadios[i].checked) {
        const labelSpan = typeRadios[i].parentNode.querySelector("span");
        if (labelSpan) {
          selectedType = labelSpan.textContent.trim();
        }
      }
    }

    let visibleCount = 0;

    for (let i = 0; i < cardItems.length; i++) {
      const item = cardItems[i];
      const badges = item.querySelectorAll(".badge");
      const spaceType = badges[0] ? badges[0].textContent.trim() : "";
      const spaceStatus = badges[1] ? badges[1].textContent.trim() : "";
      const addressElement = item.querySelector(".card-body > p.text-small.text-muted");
      const addressText = addressElement ? addressElement.textContent : "";

      let isMatch = true;

      if (appliedCity !== "" && addressText.indexOf(appliedCity) === -1) {
        isMatch = false;
      }

      if (onlyAvailable && spaceStatus !== "Доступно зараз") {
        isMatch = false;
      }

      if (selectedType !== "Усі" && spaceType !== selectedType) {
        isMatch = false;
      }

      if (isMatch) {
        item.style.display = "";
        visibleCount = visibleCount + 1;
      } else {
        item.style.display = "none";
      }
    }

    if (resultsTitle) {
      if (appliedCity === "") {
        resultsTitle.textContent = "Усі простори";
      } else {
        resultsTitle.textContent = "Простори у місті " + appliedCity;
      }
    }

    if (countText) {
      countText.textContent = "Знайдено: " + visibleCount;
    }

    if (visibleCount === 0) {
      emptyBox.style.display = "block";
    } else {
      emptyBox.style.display = "none";
    }
  }

  if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (citySelect) {
        appliedCity = citySelect.value;
      }
      filterSpaces();
    });
  }

  // фільтри карток
  if (availableCheckbox) {
    availableCheckbox.addEventListener("change", filterSpaces);
  }
  for (let i = 0; i < typeRadios.length; i++) {
    typeRadios[i].addEventListener("change", filterSpaces);
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      appliedCity = "";
      if (citySelect) {
        citySelect.value = "";
      }
      if (availableCheckbox) {
        availableCheckbox.checked = false;
      }
      if (typeRadios.length > 0) {
        typeRadios[0].checked = true;
      }
      filterSpaces();
    });
  }
}

/* =============
3. вибір слотів часу
   =============*/
function initBookingSlots() {
  const slotsContainer = document.querySelector(".detail .slots");
  if (slotsContainer === null) {
    return;
  }

  const slotButtons = slotsContainer.querySelectorAll(".slot");
  const durationSelect = document.getElementById("w-dur");
  const summaryValues = document.querySelectorAll(".widget-summary dd");
  const bookButton = document.querySelector(".detail aside a.btn-accent");
  const pricePerHour = 450;

  const conflictAlert = document.createElement("div");
  conflictAlert.className = "alert-error mt-16";
  conflictAlert.style.display = "none";
  slotsContainer.parentNode.appendChild(conflictAlert);

  function updateBookingSummary() {
    let selectedIndex = -1;
    for (let i = 0; i < slotButtons.length; i++) {
      slotButtons[i].classList.remove("conflict");
      if (slotButtons[i].classList.contains("selected")) {
        selectedIndex = i;
      }
    }

    if (selectedIndex === -1) {
      return;
    }

    const duration = parseInt(durationSelect.value, 10);
    const startTimeText = slotButtons[selectedIndex].textContent.trim();
    const startHour = parseInt(startTimeText.split(":")[0], 10);
    const endHour = startHour + duration;

    let endHourText = endHour + ":00";
    if (endHour < 10) {
      endHourText = "0" + endHour + ":00";
    }

    // перевірка на конфлікт із зайнятими годинами
    let hasConflict = false;
    for (let j = 0; j < duration; j++) {
      const checkIndex = selectedIndex + j;
      if (checkIndex >= slotButtons.length || slotButtons[checkIndex].disabled) {
        hasConflict = true;
        if (checkIndex < slotButtons.length) {
          slotButtons[checkIndex].classList.add("conflict");
        }
      }
    }

    if (summaryValues.length >= 2) {
      summaryValues[0].textContent = startTimeText + "–" + endHourText;
      summaryValues[1].textContent = (pricePerHour * duration) + " ₴";
    }

    if (hasConflict) {
      conflictAlert.style.display = "block";
      conflictAlert.innerHTML =
        "<p><strong>⚠ Слот " + startTimeText + " недоступний на " + duration + " год.</strong></p>" +
        "<p class='mt-8'>Оберіть меншу тривалість або інший вільний час.</p>";
      if (bookButton) {
        bookButton.style.pointerEvents = "none";
        bookButton.style.opacity = "0.5";
      }
    } else {
      conflictAlert.style.display = "none";
      if (bookButton) {
        bookButton.style.pointerEvents = "auto";
        bookButton.style.opacity = "1";
      }
    }
  }

  for (let i = 0; i < slotButtons.length; i++) {
    slotButtons[i].addEventListener("click", function () {
      if (this.disabled) {
        return;
      }
      for (let j = 0; j < slotButtons.length; j++) {
        slotButtons[j].classList.remove("selected");
      }
      this.classList.add("selected");
      updateBookingSummary();
    });
  }

  if (durationSelect) {
    durationSelect.addEventListener("change", updateBookingSummary);
  }
}

/* =============
4. вікно відгуку
   =============*/
function initDashboardReviewModal() {
  const reviewModal = document.getElementById("review");
  if (reviewModal === null) {
    return;
  }

  const reviewButtons = document.querySelectorAll(".booking-actions a[href='#review']");
  const modalSubtitle = reviewModal.querySelector(".modal-window p.text-small.text-muted");
  const reviewForm = reviewModal.querySelector("form");
  const reviewTextarea = document.getElementById("review-text");
  const closeLinks = reviewModal.querySelectorAll("a[href='#']");

  let activeBookingCard = null;

  function openModal(bookingCard) {
    activeBookingCard = bookingCard;

    const spaceName = bookingCard.querySelector("strong").textContent;
    const spaceDate = bookingCard.querySelector("p.text-small.text-muted").textContent;
    if (modalSubtitle) {
      modalSubtitle.textContent = spaceName + ", " + spaceDate;
    }

    reviewForm.reset();
    reviewModal.classList.add("open");
  }

  function closeModal() {
    reviewModal.classList.remove("open");
  }

  for (let i = 0; i < reviewButtons.length; i++) {
    reviewButtons[i].addEventListener("click", function (event) {
      event.preventDefault();
      const card = this.closest(".booking-row");
      openModal(card);
    });
  }

  for (let i = 0; i < closeLinks.length; i++) {
    closeLinks[i].addEventListener("click", function (event) {
      event.preventDefault();
      closeModal();
    });
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && reviewModal.classList.contains("open")) {
      closeModal();
    }
  });

  reviewForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const selectedStar = reviewForm.querySelector("input[name='rating']:checked");
    if (selectedStar === null) {
      alert("Будь ласка, оберіть оцінку від 1 до 5 зірок.");
      return;
    }

    const ratingValue = parseInt(selectedStar.value, 10);

    if (activeBookingCard) {
      const infoBlock = activeBookingCard.children[0];
      const actionsBlock = activeBookingCard.querySelector(".booking-actions");

      let starsHtml = "";
      for (let s = 1; s <= 5; s++) {
        if (s <= ratingValue) {
          starsHtml = starsHtml + "<span class='on'>★</span>";
        } else {
          starsHtml = starsHtml + "<span>★</span>";
        }
      }

      const ratingNote = document.createElement("p");
      ratingNote.className = "row text-small mt-8";
      ratingNote.innerHTML =
        "<span class='stars'>" + starsHtml + "</span> Ваш відгук надіслано";
      infoBlock.appendChild(ratingNote);

      const reviewBtn = actionsBlock.querySelector("a.btn-outline");
      if (reviewBtn) {
        const doneBadge = document.createElement("span");
        doneBadge.className = "badge badge-green";
        doneBadge.textContent = "Відгук залишено";
        actionsBlock.replaceChild(doneBadge, reviewBtn);
      }
    }

    if (reviewTextarea) {
      reviewTextarea.value = "";
    }
    closeModal();
  });
}

/* =============
5. валідація форми оплати
   =============*/
function initCheckoutForm() {
  const cardNumInput = document.getElementById("card-num");
  if (cardNumInput === null) {
    return;
  }

  const checkoutForm = document.querySelector(".checkout form");
  const methodRadios = document.querySelectorAll("input[name='method']");
  const cardFieldsBlock = document.querySelector(".card-fields");
  const submitButton = checkoutForm.querySelector("button[type='submit']");
  const cardExpInput = document.getElementById("card-exp");
  const cardCvcInput = document.getElementById("card-cvc");
  const cardNameInput = document.getElementById("card-name");

  function showFieldError(inputElement, message) {
    clearFieldError(inputElement);
    inputElement.classList.add("input-error");

    const errorParagraph = document.createElement("p");
    errorParagraph.className = "field-error";
    errorParagraph.textContent = "⚠ " + message;
    inputElement.parentNode.appendChild(errorParagraph);
  }

  function clearFieldError(inputElement) {
    inputElement.classList.remove("input-error");
    const existingError = inputElement.parentNode.querySelector(".field-error");
    if (existingError) {
      existingError.remove();
    }
  }

  function updatePaymentMethodUI() {
    for (let i = 0; i < methodRadios.length; i++) {
      const label = methodRadios[i].parentNode;
      if (methodRadios[i].checked) {
        label.classList.add("active-method");

        if (methodRadios[i].value === "card") {
          cardFieldsBlock.style.display = "grid";
          submitButton.textContent = "Сплатити 473 ₴";
        } else if (methodRadios[i].value === "apple") {
          cardFieldsBlock.style.display = "none";
          submitButton.textContent = "Сплатити через Apple Pay (473 ₴)";
        } else {
          cardFieldsBlock.style.display = "none";
          submitButton.textContent = "Сплатити через Google Pay (473 ₴)";
        }
      } else {
        label.classList.remove("active-method");
      }
    }
  }

  updatePaymentMethodUI();

  for (let i = 0; i < methodRadios.length; i++) {
    methodRadios[i].addEventListener("change", updatePaymentMethodUI);
  }

  // Форматування номера картки
  cardNumInput.addEventListener("input", function () {
    let digitsOnly = "";
    for (let i = 0; i < this.value.length; i++) {
      const ch = this.value[i];
      if (ch >= "0" && ch <= "9") {
        digitsOnly = digitsOnly + ch;
      }
    }

    let formatted = "";
    for (let i = 0; i < digitsOnly.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted = formatted + " ";
      }
      formatted = formatted + digitsOnly[i];
    }
    this.value = formatted;
    clearFieldError(this);
  });

  // Форматування терміну дії (ММ/РР)
  cardExpInput.addEventListener("input", function () {
    let digitsOnly = "";
    for (let i = 0; i < this.value.length; i++) {
      const ch = this.value[i];
      if (ch >= "0" && ch <= "9") {
        digitsOnly = digitsOnly + ch;
      }
    }

    if (digitsOnly.length > 2) {
      this.value = digitsOnly.slice(0, 2) + "/" + digitsOnly.slice(2, 4);
    } else {
      this.value = digitsOnly;
    }
    clearFieldError(this);
  });

  // Лише цифри для CVC
  cardCvcInput.addEventListener("input", function () {
    let digitsOnly = "";
    for (let i = 0; i < this.value.length; i++) {
      const ch = this.value[i];
      if (ch >= "0" && ch <= "9") {
        digitsOnly = digitsOnly + ch;
      }
    }
    this.value = digitsOnly;
    clearFieldError(this);
  });

  cardNameInput.addEventListener("input", function () {
    clearFieldError(this);
  });

  // Перевірка полів перед відправкою
  checkoutForm.addEventListener("submit", function (event) {
    let isCardPayment = true;
    for (let i = 0; i < methodRadios.length; i++) {
      if (methodRadios[i].checked && methodRadios[i].value !== "card") {
        isCardPayment = false;
      }
    }

    if (!isCardPayment) {
      return;
    }

    let isValid = true;

    const cleanCardNumber = cardNumInput.value.replace(/\s+/g, "");
    if (cleanCardNumber.length !== 16) {
      showFieldError(cardNumInput, "Введіть 16 цифр номера картки");
      isValid = false;
    }

    const expParts = cardExpInput.value.split("/");
    const month = parseInt(expParts[0], 10);
    const year = parseInt(expParts[1], 10);
    if (
      cardExpInput.value.length !== 5 ||
      isNaN(month) ||
      month < 1 ||
      month > 12 ||
      isNaN(year) ||
      year < 26
    ) {
      showFieldError(cardExpInput, "Введіть коректний термін (напр. 08/28)");
      isValid = false;
    }

    if (cardCvcInput.value.length !== 3) {
      showFieldError(cardCvcInput, "Введіть 3 цифри CVC");
      isValid = false;
    }

    const ownerName = cardNameInput.value.trim();
    let hasDigitsInName = false;
    for (let i = 0; i < ownerName.length; i++) {
      if (ownerName[i] >= "0" && ownerName[i] <= "9") {
        hasDigitsInName = true;
      }
    }

    if (ownerName.length < 3 || hasDigitsInName) {
      showFieldError(cardNameInput, "Вкажіть коректне ім’я власника без цифр");
      isValid = false;
    }

    if (!isValid) {
      event.preventDefault();
    }
  });
}
