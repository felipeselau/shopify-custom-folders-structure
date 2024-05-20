$(document).ready(function () {
  loadQuickview();

  $('#ProductGridContainer').bind('DOMSubtreeModified', function(){
    loadQuickview();
  });

  $('.product-recommendations').bind('DOMSubtreeModified', function(){
    loadQuickview();
  });
  
  document.addEventListener('viselyWidgetRendered', function (e) { 
    loadQuickview();
  });

  function loadQuickview() {
    const loadSpinner = $('.load__spinner');

    $('.product-popup-quickview').click(function (e) {
      e.stopPropagation();
      loadSpinner.show();
      ga('send', 'event', 'Click Quickview', 'click', 'Click Quickview', 1);
      
      var product_handle = $(this).data('handle');
  
      fetch(`/products/${product_handle}?view=quickview`)
        .then((response) => response.text())
        .then((responseText) => {
          $('#PopupModal-quickview .product-popup-modal__content-info').html(responseText);
          $('#PopupModal-quickview .product__media-thumb').flickity();
          loadVariantGroup();
          zIndexOfHeader();
          loadGAEvent();
          loadSpinner.hide();
        });
    });
    
    $('#ModalClose-quickview, #PopupModal-quickview').click(function () {
      var attr = $('#PopupModal-quickview').attr('open');
      if (attr) return
      $('#PopupModal-quickview .product-popup-modal__content-info').empty();
      $('#shopify-section-header').css('z-index', 3)
    });
  }

  function loadVariantGroup() {
    $('.select-grouped-item-quickview').click(function (e) {
      e.preventDefault();
      var product_handle = $(this).data('handle');

      fetch(`/products/${product_handle}?view=quickview`)
        .then((response) => response.text())
        .then((responseText) => {
          $('#PopupModal-quickview .product-popup-modal__content-info').empty();
          $('#PopupModal-quickview .product-popup-modal__content-info').html(responseText);
          $('#PopupModal-quickview .product__media-thumb').flickity();
          loadVariantGroup();
          zIndexOfHeader();
        });
    })
    window.DataLayer.selectColor();
  }

  function zIndexOfHeader() {
    $('#product-form-quickview .product-form__submit').click(function () {
      $('#shopify-section-header').css('z-index', 4)
    });

    $('.cart-notification__close').click(function () {
      $('#shopify-section-header').css('z-index', 3)
    });
  }
  
  function loadGAEvent() {
    $('#ProductPopup-size-chart').click(function () {
      ga('send', 'event', 'Click Size Guide', 'click', 'Click Size Guide', 1);
    })
  }
});