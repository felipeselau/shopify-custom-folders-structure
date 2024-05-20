$(".card-wrapper").contextmenu(function (e) {
  if (window.innerWidth < 990) {
    e.preventDefault();
  }
});

(function () {
  const history = JSON.parse(sessionStorage.getItem("history") || "[]");
  if (history[history.length - 1] === window.location.href) return;
  history.push(window.location.href);
  sessionStorage.setItem("history", JSON.stringify(history));

  if (window.location.href.includes("/products/")) {
    sessionStorage.setItem(
      "clicks_infinity_scroll_variable",
      sessionStorage.getItem("clicks_infinity_scroll") || "0"
    );
  }
})();

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}

const trapFocusHandlers = {};

function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if (
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function () {
    document.removeEventListener("keydown", trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function (event) {
    if (event.code.toUpperCase() !== "TAB") return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if (event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if (
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener("focusout", trapFocusHandlers.focusout);
  document.addEventListener("focusin", trapFocusHandlers.focusin);

  elementToFocus?.focus();
}

// Here run the querySelector to figure out if the browser supports :focus-visible or not and run code based on it.
try {
  document.querySelector(":focus-visible");
} catch {
  focusVisiblePolyfill();
}

function focusVisiblePolyfill() {
  const navKeys = [
    "ARROWUP",
    "ARROWDOWN",
    "ARROWLEFT",
    "ARROWRIGHT",
    "TAB",
    "ENTER",
    "SPACE",
    "ESCAPE",
    "HOME",
    "END",
    "PAGEUP",
    "PAGEDOWN",
  ];
  let currentFocusedElement = null;
  let mouseClick = null;

  window.addEventListener("keydown", (event) => {
    if (navKeys.includes(event.code.toUpperCase())) {
      mouseClick = false;
    }
  });

  window.addEventListener("mousedown", (event) => {
    mouseClick = true;
  });

  window.addEventListener(
    "focus",
    () => {
      if (currentFocusedElement)
        currentFocusedElement.classList.remove("focused");

      if (mouseClick) return;

      currentFocusedElement = document.activeElement;
      currentFocusedElement.classList.add("focused");
    },
    true
  );
}

function pauseAllMedia() {
  document.querySelectorAll(".js-youtube").forEach((video) => {
    video.contentWindow.postMessage(
      '{"event":"command","func":"' + "pauseVideo" + '","args":""}',
      "*"
    );
  });
  document.querySelectorAll(".js-vimeo").forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', "*");
  });
  document.querySelectorAll("video").forEach((video) => video.pause());
  document.querySelectorAll("product-model").forEach((model) => {
    if (model.modelViewerUI) modelViewerUI.pause();
  });
}

function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener("focusin", trapFocusHandlers.focusin);
  document.removeEventListener("focusout", trapFocusHandlers.focusout);
  document.removeEventListener("keydown", trapFocusHandlers.keydown);

  if (elementToFocus) elementToFocus.focus();
}

function onKeyUpEscape(event) {
  if (event.code.toUpperCase() !== "ESCAPE") return;

  const openDetailsElement = event.target.closest("details[open]");
  if (!openDetailsElement) return;

  const summaryElement = openDetailsElement.querySelector("summary");
  openDetailsElement.removeAttribute("open");
  summaryElement.focus();
}

class QuantityInput extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", {bubbles: true});

    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onButtonClick.bind(this))
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;

    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value)
      this.input.dispatchEvent(this.changeEvent);
  }
}

customElements.define("quantity-input", QuantityInput);

function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

const serializeForm = (form) => {
  const obj = {};
  const formData = new FormData(form);

  for (const key of formData.keys()) {
    const regex = /(?:^(properties\[))(.*?)(?:\]$)/;

    if (regex.test(key)) {
      obj.properties = obj.properties || {};
      obj.properties[regex.exec(key)[2]] = formData.get(key);
    } else {
      obj[key] = formData.get(key);
    }
  }

  return JSON.stringify(obj);
};

function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: `application/${type}`,
    },
  };
}

/*
 * Shopify Common JS
 *
 */
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}

Shopify.bind = function (fn, scope) {
  return function () {
    return fn.apply(scope, arguments);
  };
};

Shopify.setSelectorByValue = function (selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};

Shopify.addListener = function (target, eventName, callback) {
  target.addEventListener
    ? target.addEventListener(eventName, callback, false)
    : target.attachEvent("on" + eventName, callback);
};

Shopify.postLink = function (path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

Shopify.CountryProvinceSelector = function (
  country_domid,
  province_domid,
  options
) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(
    options["hideElement"] || province_domid
  );

  Shopify.addListener(
    this.countryEl,
    "change",
    Shopify.bind(this.countryHandler, this)
  );

  this.initCountry();
  this.initProvince();
};

Shopify.CountryProvinceSelector.prototype = {
  initCountry: function () {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function () {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function (e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function (selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function (selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  },
};

class MenuDrawer extends HTMLElement {
  constructor() {
    super();

    this.mainDetailsToggle = this.querySelector("details");
    const summaryElements = this.querySelectorAll("summary");
    this.addAccessibilityAttributes(summaryElements);

    if (navigator.platform === "iPhone")
      document.documentElement.style.setProperty(
        "--viewport-height",
        `${window.innerHeight}px`
      );

    this.addEventListener("keyup", this.onKeyUp.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.bindEvents();
  }

  bindEvents() {
    this.querySelectorAll("summary").forEach((summary) =>
      summary.addEventListener("click", this.onSummaryClick.bind(this))
    );
    this.querySelectorAll("button").forEach((button) =>
      button.addEventListener("click", this.onCloseButtonClick.bind(this))
    );

    const menuDrawer = document.querySelector("[data-menu-mobile]");
    const bodyEl = document.querySelector("[data-body]");

    document.addEventListener("click", function (event) {
      if (!menuDrawer.contains(event.target)) {
        menuDrawer.removeAttribute("open");
        menuDrawer.classList.remove("menu-opening");
        bodyEl.classList.remove("overflow-hidden-tablet");
      }
    });

    this.setFilterMenu();
    this.setSortFilter();
  }

  setFilterMenu() {
    const filterList = document.querySelectorAll('#FacetFiltersFormSidebar li details')

    if(filterList) {
      filterList.forEach(function(menu) {
        menu.addEventListener('click', function() {
          filterList.forEach(function(item) { 
            if (item !== menu) {
              item.removeAttribute('open');
            } 
          });
        });
      });
    }
  }

  setSortFilter() {
    const filterList = document.querySelectorAll('#FacetFiltersFormSidebar li details')
    const filterSort = document.getElementById('SortBy-mobile')

    if(filterSort) {
      filterSort.addEventListener('click', function() {
        filterList.forEach(function(item) { item.removeAttribute('open') });
      });
    }
  }

  addAccessibilityAttributes(summaryElements) {
    summaryElements.forEach((element) => {
      element.setAttribute("role", "button");
      element.setAttribute("aria-expanded", false);
      element.setAttribute("aria-controls", element.nextElementSibling.id);
    });
  }

  onKeyUp(event) {
    if (event.code.toUpperCase() !== "ESCAPE") return;

    const openDetailsElement = event.target.closest("details[open]");
    if (!openDetailsElement) return;

    openDetailsElement === this.mainDetailsToggle
      ? this.closeMenuDrawer(this.mainDetailsToggle.querySelector("summary"))
      : this.closeSubmenu(openDetailsElement);
  }

  onSummaryClick(event) {
    const summaryElement = event.currentTarget;
    const detailsElement = summaryElement.parentNode;
    const isOpen = detailsElement.hasAttribute("open");

    if (detailsElement === this.mainDetailsToggle) {
      if (isOpen) event.preventDefault();
      isOpen
        ? this.closeMenuDrawer(summaryElement)
        : this.openMenuDrawer(summaryElement);
    } else {
      trapFocus(
        summaryElement.nextElementSibling,
        detailsElement.querySelector("button")
      );

      setTimeout(() => {
        detailsElement.classList.add("menu-opening");
      });
    }
  }

  openMenuDrawer(summaryElement) {
    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });
    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }

  closeMenuDrawer(event, elementToFocus = false) {
    if (event !== undefined) {
      this.mainDetailsToggle.classList.remove("menu-opening");
      this.mainDetailsToggle.querySelectorAll("details").forEach((details) => {
        details.removeAttribute("open");
        details.classList.remove("menu-opening");
      });
      this.mainDetailsToggle
        .querySelector("summary")
        .setAttribute("aria-expanded", false);
      document.body.classList.remove(
        `overflow-hidden-${this.dataset.breakpoint}`
      );
      removeTrapFocus(elementToFocus);
      this.closeAnimation(this.mainDetailsToggle);
    }
  }

  onFocusOut(event) {
    setTimeout(() => {
      if (
        this.mainDetailsToggle.hasAttribute("open") &&
        !this.mainDetailsToggle.contains(document.activeElement)
      )
        this.closeMenuDrawer();
    });
  }

  onCloseButtonClick(event) {
    const detailsElement = event.currentTarget.closest("details");
    this.closeSubmenu(detailsElement);
  }

  closeSubmenu(detailsElement) {
    detailsElement.classList.remove("menu-opening");
    removeTrapFocus();
    this.closeAnimation(detailsElement);
  }

  closeAnimation(detailsElement) {
    let animationStart;

    const handleAnimation = (time) => {
      if (animationStart === undefined) {
        animationStart = time;
      }

      const elapsedTime = time - animationStart;

      if (elapsedTime < 400) {
        window.requestAnimationFrame(handleAnimation);
      } else {
        detailsElement.removeAttribute("open");
        if (detailsElement.closest("details[open]")) {
          trapFocus(
            detailsElement.closest("details[open]"),
            detailsElement.querySelector("summary")
          );
        }
      }
    };

    window.requestAnimationFrame(handleAnimation);
  }
}

customElements.define("menu-drawer", MenuDrawer);

class HeaderDrawer extends MenuDrawer {
  constructor() {
    super();
  }

  openMenuDrawer(summaryElement) {
    this.header =
      this.header || document.getElementById("shopify-section-header");
    this.borderOffset =
      this.borderOffset ||
      this.closest(".header-wrapper").classList.contains(
        "header-wrapper--border-bottom"
      )
        ? 1
        : 0;
    document.documentElement.style.setProperty(
      "--header-bottom-position",
      `${parseInt(
        this.header.getBoundingClientRect().bottom - this.borderOffset
      )}px`
    );

    setTimeout(() => {
      this.mainDetailsToggle.classList.add("menu-opening");
    });

    summaryElement.setAttribute("aria-expanded", true);
    trapFocus(this.mainDetailsToggle, summaryElement);
    document.body.classList.add(`overflow-hidden-${this.dataset.breakpoint}`);
  }
}

customElements.define("header-drawer", HeaderDrawer);

class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.querySelector('[id^="ModalClose-"]').addEventListener(
      "click",
      this.hide.bind(this)
    );
    this.addEventListener("keyup", (event) => {
      event.stopPropagation();
      if (event.code.toUpperCase() === "ESCAPE") this.hide();
    });
    if (this.classList.contains("media-modal")) {
      this.addEventListener("pointerup", (event) => {
        if (
          event.pointerType === "mouse" &&
          !event.target.closest("deferred-media, product-model")
        )
          this.hide();
      });
    } else {
      this.addEventListener("click", (event) => {
        event.stopPropagation();
        if (event.target.nodeName === "MODAL-DIALOG") this.hide();
      });
    }
  }

  show(opener) {
    this.openedBy = opener;
    const popup = this.querySelector(".template-popup");
    document.body.classList.add("overflow-hidden");
    this.setAttribute("open", "");
    if (popup) popup.loadContent();
    trapFocus(this, this.querySelector('[role="dialog"]'));
  }

  hide() {
    document.body.classList.remove("overflow-hidden");
    this.removeAttribute("open");
    removeTrapFocus(this.openedBy);
    window.pauseAllMedia();
  }
}
customElements.define("modal-dialog", ModalDialog);

class ModalOpener extends HTMLElement {
  constructor() {
    super();

    const button = this.querySelector("button");

    if (!button) return;
    button.addEventListener("click", () => {
      const modal = document.querySelector(this.getAttribute("data-modal"));
      if (modal) modal.show(button);
    });
  }
}
customElements.define("modal-opener", ModalOpener);

class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener("click", this.loadContent.bind(this));
  }

  loadContent() {
    window.pauseAllMedia();
    if (!this.getAttribute("loaded")) {
      const content = document.createElement("div");
      content.appendChild(
        this.querySelector("template").content.firstElementChild.cloneNode(true)
      );

      this.setAttribute("loaded", true);
      this.appendChild(
        content.querySelector("video, model-viewer, iframe")
      ).focus();
    }
  }
}

customElements.define("deferred-media", DeferredMedia);

class SliderComponent extends HTMLElement {
  constructor() {
    super();
    this.slider = this.querySelector('[id^="Slider-"]');
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.enableSliderLooping = false;
    this.currentPageElement = this.querySelector(".slider-counter--current");
    this.pageTotalElement = this.querySelector(".slider-counter--total");
    this.prevButton = this.querySelector('button[name="previous"]');
    this.nextButton = this.querySelector('button[name="next"]');

    if (!this.slider || !this.nextButton) return;

    this.initPages();
    const resizeObserver = new ResizeObserver((entries) => this.initPages());
    resizeObserver.observe(this.slider);

    this.slider.addEventListener("scroll", this.update.bind(this));
    this.prevButton.addEventListener("click", this.onButtonClick.bind(this));
    this.nextButton.addEventListener("click", this.onButtonClick.bind(this));

    if (this.slider.getAttribute("data-autoplay") === "true")
      this.setAutoPlay();

    this.sliderControlWrapper = this.querySelector(".slider-buttons");
    if (!this.sliderControlWrapper) return;
    this.sliderControlLinksArray = Array.from(
      this.sliderControlWrapper.querySelectorAll(".slider-counter__link")
    );
    this.sliderControlLinksArray.forEach((link) =>
      link.addEventListener("click", this.linkToSlide.bind(this))
    );
    this.slider.addEventListener("scroll", this.setSlideVisibility.bind(this));
    this.setSlideVisibility();
  }

  setAutoPlay() {
    this.sliderAutoplay = this.querySelector("slider-component");
    this.autoplaySpeed = this.slider.dataset.speed * 1000;

    this.addEventListener("mouseover", this.focusInHandling.bind(this));
    this.addEventListener("mouseleave", this.focusOutHandling.bind(this));
    this.addEventListener("focusin", this.focusInHandling.bind(this));
    this.addEventListener("focusout", this.focusOutHandling.bind(this));

    this.play();
    this.autoplayButtonIsSetToPlay = true;
  }

  autoPlayToggle() {
    this.togglePlayButtonState(this.autoplayButtonIsSetToPlay);
    this.autoplayButtonIsSetToPlay ? this.pause() : this.play();
    this.autoplayButtonIsSetToPlay = !this.autoplayButtonIsSetToPlay;
  }

  focusOutHandling(event) {
    const focusedOnAutoplayButton = event.target === this.sliderAutoplay;
    if (!this.autoplayButtonIsSetToPlay || focusedOnAutoplayButton) return;
    this.play();
  }

  focusInHandling(event) {
    const focusedOnAutoplayButton = event.target === this.sliderAutoplay;
    if (focusedOnAutoplayButton && this.autoplayButtonIsSetToPlay) {
      this.play();
    } else if (this.autoplayButtonIsSetToPlay) {
      this.pause();
    }
  }

  play() {
    this.slider.setAttribute("aria-live", "off");
    clearInterval(this.autoplay);
    this.autoplay = setInterval(
      this.autoRotateSlides.bind(this),
      this.autoplaySpeed
    );
  }

  pause() {
    this.slider.setAttribute("aria-live", "polite");
    clearInterval(this.autoplay);
  }

  autoRotateSlides() {
    const slideScrollPosition =
      this.currentPage === this.sliderItems.length
        ? 0
        : this.slider.scrollLeft +
          this.slider.querySelector(".slider__slide").clientWidth;
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }

  initPages() {
    this.sliderItemsToShow = Array.from(this.sliderItems).filter(
      (element) => element.clientWidth > 0
    );
    if (this.sliderItemsToShow.length < 2) return;
    this.sliderItemOffset =
      this.sliderItemsToShow[1].offsetLeft -
      this.sliderItemsToShow[0].offsetLeft;
    this.slidesPerPage = Math.floor(
      (this.slider.clientWidth - this.sliderItemsToShow[0].offsetLeft) /
        this.sliderItemOffset
    );
    this.totalPages = this.sliderItemsToShow.length - this.slidesPerPage + 1;
    this.update();
  }

  resetPages() {
    this.sliderItems = this.querySelectorAll('[id^="Slide-"]');
    this.initPages();
  }

  update() {
    const previousPage = this.currentPage;
    this.currentPage =
      Math.round(this.slider.scrollLeft / this.sliderItemOffset) + 1;

    if (this.currentPageElement && this.pageTotalElement) {
      this.currentPageElement.textContent = this.currentPage;
      this.pageTotalElement.textContent = this.totalPages;
    }

    if (this.currentPage != previousPage) {
      this.dispatchEvent(
        new CustomEvent("slideChanged", {
          detail: {
            currentPage: this.currentPage,
            currentElement: this.sliderItemsToShow[this.currentPage - 1],
          },
        })
      );
    }

    if (this.enableSliderLooping) return;

    if (
      this.isSlideVisible(this.sliderItemsToShow[0]) &&
      this.slider.scrollLeft === 0
    ) {
      this.prevButton.setAttribute("disabled", "disabled");
      this.dataset.prev = "disabled";
    } else {
      this.prevButton.removeAttribute("disabled");
      this.dataset.prev = "";
    }

    if (
      this.isSlideVisible(
        this.sliderItemsToShow[this.sliderItemsToShow.length - 1]
      )
    ) {
      this.nextButton.setAttribute("disabled", "disabled");
      this.dataset.next = "disabled";
    } else {
      this.nextButton.removeAttribute("disabled");
      this.dataset.next = "";
    }

    this.sliderControlButtons = this.querySelectorAll(".slider-counter__link");
    if (this.sliderControlButtons.length === 0) return;

    this.prevButton.removeAttribute("disabled");

    if (!this.sliderControlButtons.length) return;

    this.sliderControlButtons.forEach((link) => {
      link.classList.remove("slider-counter__link--active");
      link.removeAttribute("aria-current");
    });
    this.sliderControlButtons[this.currentPage - 1].classList.add(
      "slider-counter__link--active"
    );
    this.sliderControlButtons[this.currentPage - 1].setAttribute(
      "aria-current",
      true
    );
  }

  isSlideVisible(element, offset = 0) {
    const lastVisibleSlide =
      this.slider.clientWidth + this.slider.scrollLeft - offset;
    return (
      element.offsetLeft + element.clientWidth <= lastVisibleSlide &&
      element.offsetLeft >= this.slider.scrollLeft
    );
  }

  onButtonClick(event) {
    event.preventDefault();
    const step = event.currentTarget.dataset.step || 1;
    this.slideScrollPosition =
      event.currentTarget.name === "next"
        ? this.slider.scrollLeft + step * this.sliderItemOffset
        : this.slider.scrollLeft - step * this.sliderItemOffset;
    this.slider.scrollTo({
      left: this.slideScrollPosition,
    });
  }

  setSlideVisibility() {
    this.sliderItemsToShow.forEach((item, index) => {
      const button = item.querySelector("a");
      if (index === this.currentPage - 1) {
        if (button) button.removeAttribute("tabindex");
        item.setAttribute("aria-hidden", "false");
        item.removeAttribute("tabindex");
      } else {
        if (button) button.setAttribute("tabindex", "-1");
        item.setAttribute("aria-hidden", "true");
        item.setAttribute("tabindex", "-1");
      }
    });
  }

  linkToSlide(event) {
    event.preventDefault();
    const slideScrollPosition =
      this.slider.scrollLeft +
      this.slider.clientWidth *
        (this.sliderControlLinksArray.indexOf(event.currentTarget) +
          1 -
          this.currentPage);
    this.slider.scrollTo({
      left: slideScrollPosition,
    });
  }
}

customElements.define("slider-component", SliderComponent);

class VariantSelects extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("change", this.onVariantChange);
    this.addEventListener("DOMContentLoaded", this.verifyVariant());
    this.onProductLoad();
  }

  onVariantChange() {
    this.updateOptions();
    this.updateMasterId();
    this.toggleAddButton(true, "", false);
    this.updatePickupAvailability();

    if (!this.currentVariant) {
      this.toggleAddButton(true, "", true);
      this.setUnavailable();
    } else {
      this.updateMedia();
      this.updateURL();
      this.updateVariantInput();
      this.renderProductInfo();
      this.stockMessage();
      this.loadImageAsColorLabel();
    }
  }

  onProductLoad() {
    this.loadImageAsColorLabel();
    const context = this;

    setTimeout(function () {
      $(context)
        .find('.product-form__input:not([data-type="material"])')
        .each((optionIndex) => {
          const dataPosition = optionIndex + 1;
          const inputValue = $(context)
            .find(
              `.product-form__input input[type="radio"][data-position="${dataPosition}"][checked]`
            )
            .val();
          context.setUnavailableVariants(dataPosition, inputValue, context);
        });

      $(context)
        .find('.product-form__input input[type="radio"]')
        .on("click", function (e) {
          const dataPosition = e.target.dataset.position;
          const inputValue = e.target.value;
          context.setUnavailableVariants(dataPosition, inputValue, context);
        });
    }, 500);
  }

  setUnavailableVariants(dataPosition, inputValue, context) {
    const currentyOptionKey = `option${dataPosition}`;
    const optionKeys = ["option1", "option2", "option3"].filter(
      (key) => key !== currentyOptionKey
    );
    const currentOptionValue = inputValue;
    const availableOptions = {};
    const unavailableOptions = {};
    optionKeys.forEach((key) => {
      availableOptions[key] = [];
      unavailableOptions[key] = [];
    });
    const variants = context.getVariantData();

    variants
      .filter((variant) => {
        return variant[currentyOptionKey] === currentOptionValue;
      })
      .forEach((variant) => {
        if (variant.available) {
          optionKeys.forEach((key) => {
            availableOptions[key].push(variant[key]);
          });
        } else {
          optionKeys.forEach((key) => {
            unavailableOptions[key].push(variant[key]);
          });
        }
      });

    Object.entries(unavailableOptions).forEach(([optionKey, optionValues]) => {
      const dataPosition = optionKey.replace("option", "");
      optionValues.forEach((optionValue) => {
        $(context)
          .find(
            `.product-form__input input[value="${optionValue}"][data-position="${dataPosition}"]`
          )
          .addClass("disabled");
      });
    });

    Object.entries(availableOptions).forEach(([optionKey, optionValues]) => {
      const dataPosition = optionKey.replace("option", "");
      optionValues.forEach((optionValue) => {
        $(context)
          .find(
            `.product-form__input input[value="${optionValue}"][data-position="${dataPosition}"]`
          )
          .removeClass("disabled");
      });
    });
  }

  loadImageAsColorLabel() {
    if (!document.querySelector(".product.variant-image-as-color")) return;

    const variants = this.getVariantData();
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    const fieldsetColor = fieldsets.find((fieldset) => {
      return (
        fieldset.dataset.type === "color" || fieldset.dataset.type === "cor"
      );
    });

    Array.from(
      fieldsetColor.querySelectorAll('input[name="Color"], input[name="Cor"]')
    ).forEach((inputColor) => {
      const color = inputColor.value;
      const variant = variants.find((e) =>
        e.options.some((option) => option === color)
      );

      if (!(variant && variant.featured_image)) return;

      const inputParent = inputColor.parentNode;
      const variantLabel = inputParent.querySelector("label");
      variantLabel.style.backgroundImage = `url(${variant.featured_image.src})`;
      variantLabel.innerText = "";
    });
  }

  stockMessage() {
    const lowStockElm = $(".low_stock_msg");
    const lowStockElm2 = $(".low_stock_msg_2");
    const variantSize = $(
      '.product-form__input[data-type="size"] input:checked'
    );

    lowStockElm.addClass("hidden");
    lowStockElm2.addClass("hidden");

    if (variantSize === 0 || !lowStockElm || !lowStockElm2) return;

    const variantQty = parseFloat(this.currentVariant.inventory_quantity);
    const lowStockQty = parseFloat(lowStockElm.data("quantity") + "");
    const lowStockQty2 = parseFloat(lowStockElm2.data("quantity") + "");
    const isAvailable = this.currentVariant.available;

    if (variantQty > 0 && isAvailable) {
      var elm = lowStockElm;
      if (variantQty <= lowStockQty) {
        lowStockElm.removeClass("hidden");
        lowStockElm2.addClass("hidden");
      } else if (variantQty <= lowStockQty2) {
        lowStockElm.addClass("hidden");
        lowStockElm2.removeClass("hidden");
        elm = lowStockElm2;
      }
      if (elm.html().includes("[unit]")) {
        var text = elm
          .html()
          .replace(
            "[unit]",
            '<strong class="variant_qty_stock">' + variantQty + "</strong>"
          );
        elm.html(text);
      } else {
        elm.find(".variant_qty_stock").html(variantQty);
      }
    }
  }

  updateOptions() {
    this.options = Array.from(
      this.querySelectorAll("select"),
      (select) => select.value
    );
  }

  updateMasterId() {
    this.currentVariant = this.getVariantData().find((variant) => {
      return !variant.options
        .map((option, index) => {
          return this.options[index] === option;
        })
        .includes(false);
    });
  }

  updateMedia() {
    const isSlider = document.querySelector(".product-with-thumb");
    const featuredMedia = this.currentVariant.featured_media;
    const feturedMediaId = featuredMedia ? featuredMedia.id : "";

    if (isSlider) {
      var flkty = $(".product__media-thumb");
      flkty.flickity(
        "selectCell",
        `li.product__media-item[data-media-id="${this.dataset.section}-${feturedMediaId}"]`
      );
    } else {
      if (!this.currentVariant) return;
      if (!featuredMedia) return;

      const newMedia = document.querySelector(
        `[data-media-id="${this.dataset.section}-${feturedMediaId}"]`
      );
      if (!newMedia) return;
      const modalContent = document.querySelector(
        `#ProductModal-${this.dataset.section} .product-media-modal__content`
      );
      const newMediaModal = modalContent.querySelector(
        `[data-media-id="${feturedMediaId}"]`
      );
      const parent = newMedia.parentElement;
      if (parent.firstChild == newMedia) return;
      modalContent.prepend(newMediaModal);
      parent.prepend(newMedia);

      this.stickyHeader =
        this.stickyHeader || document.querySelector("sticky-header");
      if (this.stickyHeader) {
        this.stickyHeader.dispatchEvent(new Event("preventHeaderReveal"));
      }

      parent
        .querySelector("li.product__media-item")
        .scrollIntoView({behavior: "smooth"});
    }
  }

  updateURL() {
    if (
      !this.currentVariant ||
      this.dataset.updateUrl === "false" ||
      document.querySelector(".product-quickview")
    )
      return;
    window.history.replaceState(
      {},
      "",
      `${this.dataset.url}?variant=${this.currentVariant.id}`
    );
  }

  updateVariantInput() {
    const productForms = document.querySelectorAll(
      `#product-form-${this.dataset.section}, #product-form-installment`
    );
    productForms.forEach((productForm) => {
      const input = productForm.querySelector('input[name="id"]');
      input.value = this.currentVariant.id;
      input.dispatchEvent(new Event("change", {bubbles: true}));

      const inputPropertieBarcode = productForm.querySelector(
        'input[name="properties[barcode]"]'
      );
      if (!inputPropertieBarcode) return;
      inputPropertieBarcode.value = this.currentVariant.barcode;
    });
  }

  updatePickupAvailability() {
    const pickUpAvailability = document.querySelector("pickup-availability");
    if (!pickUpAvailability) return;

    if (this.currentVariant && this.currentVariant.available) {
      pickUpAvailability.fetchAvailability(this.currentVariant.id);
    } else {
      pickUpAvailability.removeAttribute("available");
      pickUpAvailability.innerHTML = "";
    }
  }

  extractAmount(source) {
    if (!source) {
      return "";
    }

    const numericString = source.replace(/[^\d.,]/g, "");

    const decimalIndex = numericString.lastIndexOf(".");
    const commaIndex = numericString.lastIndexOf(",");
    let integerPart, fractionalPart;
    if (decimalIndex > commaIndex) {
      integerPart = numericString.substring(0, decimalIndex);
      fractionalPart = numericString.substring(decimalIndex + 1);
    } else if (commaIndex > decimalIndex) {
      integerPart = numericString.substring(0, commaIndex);
      fractionalPart = numericString.substring(commaIndex + 1);
    } else {
      integerPart = numericString;
      fractionalPart = "";
    }

    if (fractionalPart) {
      fractionalPart =
        decimalIndex > commaIndex
          ? `.${fractionalPart.slice(0, 2)}`
          : `,${fractionalPart.slice(0, 2)}`;
      fractionalPart = fractionalPart.replace(".00", "").replace(",00", "");
    }

    return `${integerPart}${fractionalPart}`;
  }

  renderProductInfo() {
    const gepSwitcherExists = !!document.querySelector(".gep-switcher");
    if (gepSwitcherExists) {
      const variant = this.getVariantData().find(
        (variant) => variant.id === this.currentVariant.id
      );
      const priceElement = document.querySelector(
        ".product__info-wrapper .price"
      );
      if (priceElement) {
        const showComparePrice =
          variant.compare_at_price > variant.price &&
          variant.compare_at_price != "";
        const showPriceVaries =
          variant?.price_varies == false && variant?.compare_at_price_varies;
        const locale = priceElement.querySelector("#locale-iso").innerHTML;
        const currency = priceElement.querySelector("#currency-iso").innerHTML;
        const price = new Intl.NumberFormat(`${locale}`, {
          style: "currency",
          currency: `${currency}`,
        })
          .format(variant.price / 100)
          .replace(".00", "");
        const compare_at_price = new Intl.NumberFormat(`${locale}`, {
          style: "currency",
          currency: `${currency}`,
        })
          .format(variant.compare_at_price / 100)
          .replace(".00", "");
        const percentage =
          Math.round(
            (((variant.compare_at_price - variant.price) * 100) /
              variant.compare_at_price) *
              100
          ) / 100;
        priceElement
          .querySelectorAll(".regular-price")
          ?.forEach((element) => (element.innerText = price));
        if (variant.available) {
          priceElement.classList.add("price--sold-out");
        } else {
          priceElement.classList.remove("price--sold-out");
        }
        if (showComparePrice) {
          priceElement.classList.add("price--on-sale");
          priceElement.querySelector(
            ".compare-price"
          ).innerHTML = compare_at_price;
          priceElement.querySelector(
            ".compare-percentage"
          ).innerHTML = percentage;
        } else {
          priceElement.classList.remove("price--on-sale");
          priceElement.querySelector(".compare-price").innerHTML = "";
          priceElement.querySelector(".compare-percentage").innerHTML = "";
        }
        if (showPriceVaries) {
          priceElement.classList.add("price--no-compare");
        } else {
          priceElement.classList.remove("price--no-compare");
        }
      }
      this.toggleAddButton(
        !this.currentVariant.available,
        window.variantStrings.soldOut
      );
    } else {
      const variantId = this.currentVariant.id;
      fetch(`${this.dataset.url}.js`)
        .then((response) => response.json())
        .then((responseJson) => {
          const variant = responseJson.variants.find(
            (variant) => variant.id == variantId
          );
          const id = `price-${this.dataset.section}`;
          const elementDestination = document.getElementById(id);
          const destinations = elementDestination.querySelectorAll(
            ".regular-price"
          );
          const source = new Intl.NumberFormat(window.Shopify.locale, {
            style: "currency",
            currency: window.Shopify.currency.active,
            minimumFractionDigits: 0,
          }).format(variant.price * 10);
          const priceConverted = this.extractAmount(source);

          if (source && destinations.length > 0) {
            destinations.forEach((element) => {
              const regexRemoveDigits = /[0-9,.]+/g;
              element.innerHTML = element.innerHTML.replace(
                regexRemoveDigits,
                priceConverted
              );
            });
          }

          const price = document.getElementById(
            `price-${this.dataset.section}`
          );

          if (price) price.classList.remove("visibility-hidden");
          this.toggleAddButton(
            !this.currentVariant.available,
            window.variantStrings.soldOut
          );
        });
    }
  }

  verifyVariant(){
    const queryString = window.location.search;
    if(!queryString) return;

    const variantList = document.querySelectorAll('.product-form__input .item input');
    const selectSizeButton = document.querySelector(".button--select-size");

    variantList.forEach(variant =>{
      if(variant.classList.contains('checked')){
        selectSizeButton.style.display = 'none';
      }
    })
  }

  toggleAddButton(disable = true, text, modifyClass = true) {
    const productForm = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    if (!productForm) return;
    const addButton = productForm.querySelector('[name="add"]');
    const soldOutButton = document.querySelector("#PopupPopup-back-in-stock");

    if (!addButton) return;

    const selectSizeButton = document.querySelector(".button--select-size");

    if (selectSizeButton) {
      addButton.classList.add("hidden");

      if (soldOutButton) soldOutButton.classList.add("hidden");
    }

    if (productForm.getAttribute("id") === "product-form-quickview") {
      modifyClass = false;
    }

    if (disable) {
      addButton.setAttribute("disabled", true);
      if (text) addButton.textContent = text;
      if (modifyClass && soldOutButton) {
        addButton.classList.add("hidden");
        soldOutButton.classList.remove("hidden");
        if (selectSizeButton) selectSizeButton.remove();
      } else {
        if (selectSizeButton && selectSizeButton.hasAttribute("disabled")) {
          addButton.classList.remove("hidden");
          selectSizeButton.remove();
        }
      }
    } else {
      addButton.removeAttribute("disabled");
      if (addButton.textContent.toLocaleLowerCase() !== "pre-order") {
        addButton.textContent = window.variantStrings.addToCart;
      }
      if (modifyClass && soldOutButton) {
        addButton.classList.remove("hidden");
        soldOutButton.classList.add("hidden");
        if (selectSizeButton) selectSizeButton.remove();
      } else {
        if (selectSizeButton) {
          addButton.classList.remove("hidden");
          selectSizeButton.remove();
        }
      }
    }

    if (selectSizeButton) {
      selectSizeButton.style.position = "relative";
      selectSizeButton.setAttribute("disabled", "");
    }

    this.setButtonProduct();

    if (!modifyClass) return;
  }

  setButtonProduct() {
    const paymentButton = document.querySelector(
      ".shopify-payment-button__button"
    );
    const notifyButton = document.getElementById("PopupPopup-back-in-stock");

    if (notifyButton) {
      setTimeout(() => {
        if (paymentButton) paymentButton.classList.add("-visible");
      });
    }
  }

  setUnavailable() {
    const button = document.getElementById(
      `product-form-${this.dataset.section}`
    );
    const addButton = button.querySelector('[name="add"]');
    const price = document.getElementById(`price-${this.dataset.section}`);
    if (!addButton) return;
    addButton.textContent = window.variantStrings.unavailable;
    if (price) price.classList.add("visibility-hidden");
  }

  getVariantData() {
    this.variantData =
      this.variantData ||
      JSON.parse(this.querySelector('[type="application/json"]').textContent);
    return this.variantData;
  }
}

customElements.define("variant-selects", VariantSelects);

class VariantRadios extends VariantSelects {
  constructor() {
    super();
  }

  updateOptions() {
    const fieldsets = Array.from(this.querySelectorAll("fieldset"));
    this.options = fieldsets.map((fieldset) => {
      const variantInputs = Array.from(fieldset.querySelectorAll("input"));
      let variantInputChecked = variantInputs.find((radio) => radio.checked);
      variantInputChecked =
        variantInputChecked ||
        variantInputs.find((radio) => radio.classList.contains("checked"));

      return variantInputChecked.value;
    });
  }
}

customElements.define("variant-radios", VariantRadios);

class GiftPromotion extends HTMLElement {
  constructor() {
    super();

    this.loadGiftPopup();

    this.querySelector("#ModalClose-gift").addEventListener(
      "click",
      this.closeModal
    );
    this.querySelector("#PopupModal-gift").addEventListener(
      "click",
      (event) => {
        if (event.target.nodeName === "MODAL-DIALOG") this.closeModal();
      }
    );
  }

  closeModal() {
    document.cookie = "giftRemoved=true; Path=/;";
    if (!document.querySelector(".gift-popup-modal__opener")) return;
    document
      .querySelector(".gift-popup-modal__opener")
      .classList.remove("hidden");
  }

  onBodyClick(event) {
    if (
      !this.contains(event.target) ||
      event.target.classList.contains("modal-overlay")
    )
      this.closeModal;
  }

  loadGiftPopup() {
    this.insertProductsInPopup().then(() => {
      const buttons = Array.from(this.querySelectorAll(".button"));
      buttons.forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();

          this.checkVariantSelected(event);

          const variants = this.getVariantData(event);

          this.currentGiftVariant = variants.find((variant) => {
            return !variant.options
              .map((option, index) => {
                return this.giftOptions[index] === option;
              })
              .includes(false);
          });

          if (this.currentGiftVariant || variants.length === 1) {
            var variantId = this.currentGiftVariant
              ? this.currentGiftVariant.id
              : variants[0].id;

            var params = {
              type: "POST",
              url: "/cart/add.js",
              data: {
                id: variantId,
                quantity: 1,
                properties: {
                  Gift: true,
                },
              },
              dataType: "json",
              success: function () {
                document.cookie = "giftRemoved=; Max-Age=0";
                window.location.href = "/cart";
              },
              error: function (error) {
                console.log("Gift Error: ", error.responseJSON.description);
              },
            };

            this.querySelector(".form-error").classList.add("hidden");

            $.ajax(params);
          } else {
            event.target
              .closest(".product__info-container")
              .querySelector(".form-error")
              .classList.remove("hidden");
          }
        });
      });
    });
  }

  async insertProductsInPopup() {
    const productsGifts = giftPromotionStrings.productsGifts;
    console.log(giftPromotionStrings);

    for (let i = 0; i < productsGifts.length; i++) {
      await fetch(`/products/${productsGifts[i].handle}?view=giftview`)
        .then((response) => {
          if (response.status !== 404) {
            console.log(response);
            return response.text();
          }
        })
        .then((responseText) => {
          if (responseText) {
            console.log(responseText);
            this.querySelector(
              ".gift-popup-modal__content-info"
            ).insertAdjacentHTML("beforeend", responseText);
          }
        });
    }
  }

  checkVariantSelected(event) {
    const fieldsets = Array.from(
      event.target
        .closest(".product__info-container")
        .querySelectorAll("fieldset")
    );
    this.giftOptions = fieldsets.map((fieldset) => {
      const variantInputs = Array.from(fieldset.querySelectorAll("input"));
      const variantInputChecked = variantInputs.find((radio) => radio.checked);

      return variantInputChecked.value;
    });
  }

  getVariantData(event) {
    return JSON.parse(
      event.target
        .closest(".product__info-container")
        .querySelector('[type="application/json"]').textContent
    );
  }
}

customElements.define("gift-promotion", GiftPromotion);
