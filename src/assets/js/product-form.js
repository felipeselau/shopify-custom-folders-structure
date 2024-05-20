if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();

      this.form = this.querySelector('form');
      this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      this.cartNotification = document.querySelector('cart-notification');
      
      this.popupConfirmationSize = this.closest('.product__info-container').querySelector('#PopupModal-Confirmation-Size');
      if (this.popupConfirmationSize) {
        sessionStorage.setItem('confirmation_size_popup', 'closed');
        sessionStorage.setItem('confirmation_size', '');
        const inputsSize = this.closest('.product__info-container').querySelectorAll('.product-form__input[data-type="size"] input');
        inputsSize.forEach(input => input.addEventListener('click', this.onChangeSizePopup.bind(this)));
        this.loadPopupConfirmation();
      }
    }

    onSubmitHandler(evt) {
      evt.preventDefault();
      const inputSize = this.closest(".product__info-container").querySelector('.product-form__input[data-type="size"]')

      if (inputSize) {
        const inputs = Array.from(inputSize.querySelectorAll('input[type="radio"]'))

        const errorMesage = inputSize.querySelector('.form-error');
        if (!inputs.some(e => e.checked)) {
          if (!errorMesage) {
            const error = document.createElement('span');
            error.classList.add('form-error');
            error.innerText = 'Select a size';
            inputSize.prepend(error);
          }
          return;
        }
        if (errorMesage) errorMesage.style.display = 'none'
      }

      if (giftPromotionStrings.enableGiftPromotion && giftPromotionStrings.giftPromotionRule === 'collection') {
        const productId = evt.target.dataset.id;
        const productsPromotion = giftPromotionStrings.productsPromotion;

        if (productsPromotion.some((product) => product.id === parseInt(productId))) {
          document.querySelector('#PopupModal-gift').show();
        }
      }

      this.cartNotification.setActiveElement(document.activeElement);

      const submitButton = this.querySelector('[type="submit"]');

      submitButton.setAttribute('disabled', true);
      submitButton.classList.add('loading');

      const body = JSON.stringify({
        ...JSON.parse(serializeForm(this.form)),
        sections: this.cartNotification.getSectionsToRender().map((section) => section.id),
        sections_url: window.location.pathname
      });

      fetch(`${routes.cart_add_url}`, { ...fetchConfig('javascript'), body })
        .then((response) => response.json())
        .then((parsedState) => {
          this.cartNotification.renderContents(parsedState);
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          submitButton.classList.remove('loading');
          submitButton.removeAttribute('disabled');
        });
    }
    
    onChangeSizePopup(evt) {
      const valueSelected = evt.target.value;
      const confirmationSize = sessionStorage.getItem('confirmation_size_popup');
      const inputReselected = this.querySelector('.reselect_property');

      if (confirmationSize === 'closed') {
        this.popupConfirmationSize.show();

        sessionStorage.setItem('confirmation_size_popup', 'opened');
        sessionStorage.setItem('confirmation_size', valueSelected);

        this.popupConfirmationIsInsideQuickview();
      }

      if (sessionStorage.getItem('confirmation_size') === valueSelected) {
        if (inputReselected) {
          inputReselected.value = false;
        }
      } else {
        if (inputReselected) {
          inputReselected.value = true;
        }
      }
    }

    loadPopupConfirmation() {
      const reselect = this.popupConfirmationSize.querySelector('.reselect');
      const proceed = this.popupConfirmationSize.querySelector('.proceed');
      const inputReselected = document.createElement('input');
      inputReselected.setAttribute('type', 'hidden');
      inputReselected.setAttribute('name', 'properties[reselected]');
      inputReselected.classList.add('reselect_property');
      inputReselected.value = false;
      this.form.prepend(inputReselected);
      
      reselect.addEventListener('click', () => {
        this.closest('.product__info-container').querySelector('fieldset[data-type="size"] input:checked').checked = false;
        this.popupConfirmationSize.hide();
        inputReselected.value = true;
      })

      proceed.addEventListener('click', () => {
        this.popupConfirmationSize.hide();
      })
    }

    popupConfirmationIsInsideQuickview() {
      const quickviewPopup = this.popupConfirmationSize.closest('#PopupModal-quickview');
      if (!quickviewPopup) return;
      const quickviewPopupContent = quickviewPopup.querySelector('.product-popup-modal__content');
      quickviewPopupContent.classList.add('overflow-hidden');
      const reselect = this.popupConfirmationSize.querySelector('.reselect');
      const proceed = this.popupConfirmationSize.querySelector('.proceed');

      this.popupConfirmationSize.addEventListener('click', (event) => {
        event.stopPropagation();
        if (event.target.nodeName === 'MODAL-DIALOG') quickviewPopupContent.classList.remove('overflow-hidden');
      });
      this.popupConfirmationSize.addEventListener('keyup', (event) => {
        event.stopPropagation();
        if (event.code.toUpperCase() === 'ESCAPE') quickviewPopupContent.classList.remove('overflow-hidden');
      });
      this.popupConfirmationSize.querySelector('[id^="ModalClose-"]').addEventListener('click', () => {
        quickviewPopupContent.classList.remove('overflow-hidden')
      });
      reselect.addEventListener('click', () => {
        quickviewPopupContent.classList.remove('overflow-hidden');
      })
      proceed.addEventListener('click', () => {
        quickviewPopupContent.classList.remove('overflow-hidden');
      })
    }
  });
}
