class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener('click', (event) => {
      event.preventDefault();

      const cartItems = this.closest('cart-items');
      const activeElement = document.activeElement.getAttribute('name');

      if (!giftPromotionStrings.enableGiftPromotion) {
        cartItems.updateQuantity(this.dataset.index, 0, activeElement);
      } else {
        cartItems.updateQuantity(this.dataset.index, 0, activeElement, () => {
          if (event.target.closest('.gift-item')) {
            document.cookie = 'giftRemoved=true; Path=/;';
            document.querySelector('.gift-popup-modal__opener').classList.remove('hidden');
            cartItems.loadGiftPromotion();
            return;
          }
          
          if (giftPromotionStrings.giftPromotionRule !== 'collection') return;

          if (event.target.nodeName === 'CART-REMOVE-BUTTON') {
            var productId = event.target.dataset.id;
          } else {
            var productId = event.target.closest('cart-remove-button').dataset.id;
          }
          const productsPromotion = giftPromotionStrings.productsPromotion;

          if (productsPromotion.some((product) => product.id === parseInt(productId))) {
            const giftQuantity = cartItems.querySelector('.gift-item .quantity__input');

            if (!giftQuantity) return;

            document.cookie = 'giftRemoved=true; Max-Age=0; Path=/;';
            cartItems.updateQuantity(giftQuantity.dataset.index, 0, activeElement);
          }
        });
      }
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();

    this.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status');

    this.currentItemCount = Array.from(this.querySelectorAll('[name="updates[]"]'))
      .reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);

    this.debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, 300);

    this.addEventListener('change', this.debouncedOnChange.bind(this));

    if (giftPromotionStrings.enableGiftPromotion) {
      this.loadGiftPromotion();
    }
  }

  onChange(event) {
    if (!giftPromotionStrings.enableGiftPromotion) {
      this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'));
    } else {
      if (this.isGift(event)) return;

      this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'), () => {
        if (giftPromotionStrings.giftPromotionRule !== 'collection') return;

        const productId = evt.target.dataset.id;
        const productsPromotion = giftPromotionStrings.productsPromotion;

        if (productsPromotion.some((product) => product.id === parseInt(productId)) && parseInt(event.target.defaultValue) < parseInt(event.target.value)) {
          document.querySelector('#PopupModal-gift').show();
        } else if (productsPromotion.some((product) => product.id === parseInt(productId)) && parseInt(event.target.defaultValue) > parseInt(event.target.value)) {
          const giftQuantity = this.querySelector('.gift-item .quantity__input')
          if (!giftQuantity) return;

          document.cookie = 'giftRemoved=true; Max-Age=0; Path=/;';
          this.updateQuantity(giftQuantity.dataset.index, giftQuantity.value - 1, document.activeElement.getAttribute('name'));
        }
      });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section'
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section'
      },
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.js-contents',
      }
    ];
  }

  updateQuantity(line, quantity, name, callback) {
    this.enableLoading(line);

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname
    });

    fetch(`${routes.cart_change_url}`, {...fetchConfig(), ...{ body }})
      .then((response) => {
        return response.text();
      })
      .then((state) => {
        const parsedState = JSON.parse(state);
        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartFooter = document.getElementById('main-cart-footer');

        if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);

        this.getSectionsToRender().forEach((section => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);

          elementToReplace.innerHTML =
            this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
          // Update AfterPay widget
          $('afterpay-placement').remove();
          Afterpay.createPlacements({
            targetSelector: "#afterpay-messaging-widget",
            attributes: {
              amountSelector: ".totals__subtotal-value",
              size: "xs",
            }
          });
        }));

        if (giftPromotionStrings.enableGiftPromotion) this.loadGiftPromotion();

        if (callback) callback();
        
        this.updateLiveRegions(line, parsedState.item_count);
        const lineItem =  document.getElementById(`CartItem-${line}`);
        if (lineItem) lineItem.querySelector(`[name="${name}"]`).focus();
        this.disableLoading();
      }).catch(() => {
        this.querySelectorAll('.loading-overlay').forEach((overlay) => overlay.classList.add('hidden'));
        document.getElementById('cart-errors').textContent = window.cartStrings.error;
        this.disableLoading();
      });
  }

  updateLiveRegions(line, itemCount) {
    if (this.currentItemCount === itemCount) {
      document.getElementById(`Line-item-error-${line}`)
        .querySelector('.cart-item__error-text')
        .innerHTML = window.cartStrings.quantityError.replace(
          '[quantity]',
          document.getElementById(`Quantity-${line}`).value
        );
    }

    this.currentItemCount = itemCount;
    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus = document.getElementById('cart-live-region-text');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser()
      .parseFromString(html, 'text/html')
      .querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    document.getElementById('main-cart-items').classList.add('cart__items--disabled');
    this.querySelectorAll(`#CartItem-${line} .loading-overlay`).forEach((overlay) => overlay.classList.remove('hidden'));
    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute('aria-hidden', false);
  }

  disableLoading() {
    document.getElementById('main-cart-items').classList.remove('cart__items--disabled');
  }

  isGift(event) {
    const giftItem = event.target.closest('.gift-item');
    if (giftItem) {
      if (event.target.value == '0') {
        document.cookie = 'giftRemoved=true; Path=/;';
        return false;
      };

      event.target.value = event.target.defaultValue;
      giftItem.querySelector('.cart-item__error-text').innerHTML = giftPromotionStrings.cartQuantityError;

      return true;
    } else {
      return false;
    }
  }

  async loadGiftPromotion() {
    var cartItems = [];
    const giftItems = Array.from(this.querySelectorAll('.gift-item'));

    await fetch("cart.js")
      .then((response) => {
        return response.json();
      })
      .then((responseJson) => {
        cartItems = responseJson.items;
      })

    if (giftPromotionStrings.giftPromotionRule === 'collection') {
      this.collectionRule(cartItems, giftItems);
    } else {
      this.cartValueRule(cartItems, giftItems);
    }
    
    giftItems.forEach(element => {
      const links = element.querySelectorAll('a:not(.button--tertiary)');
      links.forEach(link => link.setAttribute('href', '#'))
    })
  }

  collectionRule(cartItems, giftItems) {
    if (document.cookie.includes('giftRemoved=true')) {
      this.querySelector('.gift-popup-modal__opener').classList.remove('hidden');
    } else {
      this.querySelector('.gift-popup-modal__opener').classList.add('hidden');
    }

    const productsPromotion = giftPromotionStrings.productsPromotion;
    const productsGifts = giftPromotionStrings.productsGifts;
    var qtyProdInTheCart = 0;
    var qtyGiftInTheCart = 0;
      
    for (var i = 0; i < cartItems.length; i++) {
      if (productsPromotion.some(product => product.id === cartItems[i].product_id)) {
        qtyProdInTheCart += cartItems[i].quantity;
      }
      if (productsGifts.some(product => product.id === cartItems[i].product_id )) {
        qtyGiftInTheCart += cartItems[i].quantity;
      }
    }

    if (qtyGiftInTheCart === qtyProdInTheCart ) {
      this.hideGift();
    } else if (qtyProdInTheCart === 0) {
      this.hideGift();

      if (!giftItems.length > 0) return;
      giftItems.forEach(item => {
        this.updateQuantity(item.querySelector('cart-remove-button').dataset.index, 0, document.activeElement.getAttribute('name'));
      });
    } else if (qtyProdInTheCart < qtyGiftInTheCart) {
      this.hideGift();

      if (!giftItems.length > 0) return;
      giftItems.forEach(item => {
        this.updateQuantity(item.querySelector('cart-remove-button').dataset.index, 0, document.activeElement.getAttribute('name'));
      });
    } else if (qtyProdInTheCart > qtyGiftInTheCart) {
      document.cookie = 'giftRemoved=true; Path=/;';
      this.querySelector('.gift-popup-modal__opener').classList.remove('hidden');
    }
  }

  async cartValueRule(cartItems, giftItems) {
    const cartValueRule = parseInt(giftPromotionStrings.cartValueRule);
    const productsPromotion = giftPromotionStrings.productsPromotion;
    const productsGifts = giftPromotionStrings.productsGifts;
    const useCartValueWithCollection = giftPromotionStrings.cartValueWithCollection;
    let cartValue = 0;
    let thereIsGiftInCart = false;

    for (let i = 0; i < cartItems.length; i++) {
      if (productsGifts.some(product => product.id === cartItems[i].product_id )) {
        thereIsGiftInCart = true;
      }

      const productResponse = await fetch(`/products/${cartItems[i].handle}.js`);
      const productJson = await productResponse.json();

      if (productJson.compare_at_price || cartItems[i].properties.Gift) continue;
      if (useCartValueWithCollection === 'true') {
        if (productsPromotion.some(product => product.id === cartItems[i].product_id)) {
          cartValue += cartItems[i].line_price;
        }
      } else {
        cartValue += cartItems[i].line_price;
      }
    }

    cartValue += '';
    const totalCartValue = parseInt(cartValue.replace(/^(\d{1,})(\d{2})$/, '$1.$2'));

    if (totalCartValue > cartValueRule && !thereIsGiftInCart) {
      document.cookie = 'giftRemoved=true; Path=/;';
      this.querySelector('.gift-popup-modal__opener').classList.remove('hidden');
      document.querySelector('#PopupModal-gift').show();
    } else if (totalCartValue < cartValueRule && thereIsGiftInCart) {
      this.hideGift();

      if (!giftItems.length > 0) return;
      giftItems.forEach(item => {
        this.updateQuantity(item.querySelector('cart-remove-button').dataset.index, 0, document.activeElement.getAttribute('name'));
      });
    } else {
      this.hideGift();
    }
  }

  hideGift() {
    this.querySelector('.gift-popup-modal__opener').classList.add('hidden');
    document.cookie = 'giftRemoved=true; Max-Age=0; Path=/;';
  }
}

customElements.define('cart-items', CartItems);
