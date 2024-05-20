class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.filterData = [];
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);

    this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));
    window.addEventListener('popstate', this.onHistoryChange.bind(this));

    const facetWrapper = this.querySelector('#FacetsWrapperDesktop');
    if (facetWrapper) facetWrapper.addEventListener('keyup', onKeyUpEscape);

    if (this.querySelector('#FacetFiltersFormSidebar')) {
      this.loadShowMoreFilter();
      this.loadInfiniteScroll();
      this.loadPriceRangeSidebar();
    }

    if (this.querySelector('#FacetFiltersFormMobile')) {
      this.loadPriceRangeMobile();
    }

    this.setCheckedFilters();
    this.reloadKiboScripts();
    this.initOpenFilters();
    this.setFilterMenu()
    this.setSortFilter()
  }

  initOpenFilters() {
    const facets = document.querySelectorAll(".mobile-facets__details.js-filter");
    if (facets.length > 0) {
      facets.forEach((button) => {
        button.addEventListener("click", function(event) {
          facets.forEach((facet) => {
            if (facet !== this) facet.removeAttribute("open");
          });
        });
      });
    }
  }

  setFilterMenu() {
    const filterList = document.querySelectorAll('#FacetFiltersFormSidebar li details')

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

  setSortFilter() {
    const filterList = document.querySelectorAll('#FacetFiltersFormSidebar li details')
    const filterSort = document.getElementById('SortBy-mobile')

    filterSort.addEventListener('click', function() {
      filterList.forEach(function(item) { item.removeAttribute('open') });
    });
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const formData = new FormData(event.target.closest('form'));
    const searchParams = new URLSearchParams(formData).toString();
    this.renderPage(searchParams, event);
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    this.toggleActiveFacets();
    this.renderPage(new URL(event.currentTarget.href).searchParams.toString());
  }

  onHistoryChange(event) {
    const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
    if (searchParams === FacetFiltersForm.searchParamsPrev) return;
    this.renderPage(searchParams, null, false);
  }

  toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = this.getSections();
    const countContainerDesktop = document.getElementById('FacetProductCountDesktop');
    document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');
    document.getElementById('FacetProductCount')?.classList.add('loading');
    if (countContainerDesktop){
      countContainerDesktop.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = element => element.url === url;

      this.filterData.some(filterDataUrl) ?
        this.renderSectionFromCache(filterDataUrl, event) :
        this.renderSectionFromFetch(url, event);
    });

    if (updateURLHash) this.updateURLHash(searchParams);
  }

  renderSectionFromFetch(url, event) {
    if (!url.includes('&filter.v.availability=1')) {
      url += '&filter.v.availability=1'
    }

    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        this.filterData = [...this.filterData, { html, url }];
        this.renderFilters(html, event);
        this.renderProductGrid(html);
        this.renderProductCount(html);
      });
  }

  renderSectionFromCache(filterDataUrl, event) {
    const html = this.filterData.find(filterDataUrl).html;
    this.renderFilters(html, event);
    this.renderProductGrid(html);
    this.renderProductCount(html);
  }

  renderProductGrid(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductGridContainer').innerHTML;
    this.loadInfiniteScroll();
    
    this.reloadKiboScripts();
  }

  renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, 'text/html')?.getElementById('FacetProductCount')?.innerHTML;
    if (!count) return;
    const container = document.getElementById('FacetProductCount');
    const containerDesktop = document.getElementById('FacetProductCountDesktop');
    container.innerHTML = count;
    container.classList.remove('loading');
    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove('loading');
    }
  }

  renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

    const facetDetailsElements =
      parsedHTML.querySelectorAll('#FacetFiltersFormMobile .js-filter, #FacetFiltersFormSidebar .js-filter, #FacetFiltersFormSize .js-filter');
    const matchesIndex = (element) => { 
      const jsFilter = event ? event.target.closest('.js-filter') : undefined;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false; 
    }
    const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);

    facetsToRender.forEach((element) => {
      document.querySelector(`.js-filter[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
    });

    this.renderActiveFacets(parsedHTML);
    this.renderAdditionalElements(parsedHTML);

    if (countsToRender) this.renderCounts(countsToRender, event.target.closest('.js-filter'));
    
    this.setCheckedFilters();
    this.loadShowMoreFilter();
    this.loadPriceRangeSidebar();
    this.loadPriceRangeMobile();
  }

  renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets-mobile', '.active-facets-desktop'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    })

    this.toggleActiveFacets(false);
  }

  renderAdditionalElements(html) {
    const mobileElementSelectors = ['.mobile-facets__open', '.mobile-facets__count', '.sorting'];

    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });

    document.getElementById('FacetFiltersFormMobile')?.closest('menu-drawer').bindEvents();
  }

  renderCounts(source, target) {
    const countElementSelectors = ['.count-bubble','.facets__selected'];
    countElementSelectors.forEach((selector) => {
      const targetElement = target.querySelector(selector);
      const sourceElement = source.querySelector(selector);

      if (sourceElement && targetElement) {
        target.querySelector(selector).outerHTML = source.querySelector(selector).outerHTML;
      }
    });
  }

  updateURLHash(searchParams) {
    if (!searchParams.includes('&filter.v.availability=1') && !searchParams.includes('q=')) {
      searchParams += '&filter.v.availability=1'
    }
    history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  getSections() {
    return [
      {
        id: 'product-grid',
        section: document.getElementById('product-grid').dataset.id,
      }
    ]
  }

  setCheckedFilters() {
    const filters = Array.from(document.querySelectorAll('.mobile-facets__item'));

    filters.forEach(function (filter) {
      if (!(filter.querySelector('input') || filter.querySelector('label'))) return;

      if (filter.querySelector('input').checked) {
        filter.querySelector('label').classList.add('active');
        filter.querySelector('input').setAttribute('aria-checked', 'true');

      } else {
        filter.querySelector('label').classList.remove('active');
        filter.querySelector('input').setAttribute('aria-checked', 'false');
      }
    });

    const filtersWithoutAvailability = filters.filter(function (filter) {
      return filter.parentNode.dataset.type === 'size'
    })

    const hasInputChecked = filtersWithoutAvailability.some(filter => (filter.querySelector('input') || {}).checked);
    const clearAll = document.querySelector('#FacetFiltersFormSize .clear-all');

    if (!clearAll) return;

    if (hasInputChecked) {
      clearAll.classList.remove('active');
    } else {
      clearAll.classList.add('active');
    }
  }

  loadShowMoreFilter() {
    const buttonShowMore = $('.show-more-filters')

    if (buttonShowMore.length === 0) return

    buttonShowMore.each(function () {
      const $this = $(this)
      const filterLimit = $this.data('limit')
      const listItems = $this.closest('ul').find('li')
  
      if (listItems.length <= filterLimit) return $this.hide()
      
      listItems.each(function (index) {
        const $this = $(this)
        if (index >= filterLimit) {
          $this.hide()
        }
      })
  
      $this.on('click', function (e) {
        e.preventDefault()
        e.stopImmediatePropagation()

        const $this = $(this)
        
        if ($this.hasClass('show-more')) {
          listItems.each(function () {
            $(this).show()
          })
  
          $this.removeClass('show-more')
          $this.addClass('show-less')
        } else {
          listItems.each(function (index) {
            if (index >= filterLimit) {
              $(this).hide()
            }
          })
  
          $this.addClass('show-more')
          $this.removeClass('show-less')
        }
      })
    })
  }

  loadInfiniteScroll() {
    const context = this;
    const loadMoreBtn = $('.load-more__btn');
    const productGrid = $('.product-grid');
    const loadMoreSpinner = $('.load-more__spinner');
    const noMoreProducts = $('.no-more-products');
    var nextUrl = productGrid.data('next-url');

    let infinityScrollClicked = sessionStorage.getItem('infinity_scroll_clicked') || 'false';
    let history = JSON.parse(sessionStorage.getItem('history'));

    const cameFromProduct = history.length > 1 ? history[history.length -2].includes('/products/') : false;
    const penultimatePageIsCurrent = history.length > 2 ? history[history.length -3] === window.location.href : false;

    if (!(cameFromProduct && penultimatePageIsCurrent) && infinityScrollClicked === 'false') {
      sessionStorage.setItem('clicks_infinity_scroll', '0');
      sessionStorage.setItem('clicks_infinity_scroll_variable', '0');
    }

    sessionStorage.setItem('infinity_scroll_clicked', 'false');
    sessionStorage.setItem('virtual_click_infinity_scroll', 'false');

    if (!nextUrl) {
      loadMoreBtn.hide();
      noMoreProducts.show();
    } else {
      loadMoreBtn.show();
      noMoreProducts.hide();
    }

    loadMoreBtn.on('click', function (e) {
      e.stopImmediatePropagation();

      if (sessionStorage.getItem('virtual_click_infinity_scroll') === 'false') {
        let clicksInfinityScroll = parseInt(sessionStorage.getItem('clicks_infinity_scroll')) + 1;
        clicksInfinityScroll += '';
        sessionStorage.setItem('clicks_infinity_scroll', clicksInfinityScroll);
        sessionStorage.setItem('infinity_scroll_clicked', 'true');
      }
      sessionStorage.setItem('virtual_click_infinity_scroll', 'false');

      const productGrid = $('.product-grid');
      nextUrl = productGrid.data('next-url');

      $.ajax(
        {
          url: nextUrl,
          type: 'GET',
          dataType: 'html',
          beforeSend: function () {
            loadMoreBtn.hide();
            loadMoreSpinner.show();
          }
        }
      )
        .done(function (products) {
          const newProducts = $(products).find('.product-grid');
          const nextPage = newProducts.data('next-url');
          const productGrid = $('.product-grid');

          productGrid.data('next-url', nextPage);
          productGrid.append(newProducts.html());

          if (nextPage) {
            loadMoreBtn.show();
            loadMoreSpinner.hide();
          } else {
            loadMoreBtn.hide();
            loadMoreSpinner.hide();
            noMoreProducts.show();
          }
          
          context.reloadKiboScripts();

          let clicksInfinityScrollVariable = parseInt(sessionStorage.getItem('clicks_infinity_scroll_variable')) || 0;
          if (clicksInfinityScrollVariable > 0 && cameFromProduct && penultimatePageIsCurrent) {
            sessionStorage.setItem('virtual_click_infinity_scroll', 'true');
            loadMoreBtn.click();

            clicksInfinityScrollVariable = parseInt(sessionStorage.getItem('clicks_infinity_scroll_variable')) - 1;
            clicksInfinityScrollVariable += '';
            sessionStorage.setItem('clicks_infinity_scroll_variable', clicksInfinityScrollVariable);
          }
        })
    })
    
    let clicksInfinityScrollVariable = parseInt(sessionStorage.getItem('clicks_infinity_scroll_variable')) || 0;
    let clicksInfinityScroll = parseInt(sessionStorage.getItem('clicks_infinity_scroll')) || 0;
    if (clicksInfinityScroll === clicksInfinityScrollVariable && clicksInfinityScrollVariable > 0 && cameFromProduct && penultimatePageIsCurrent) {
      sessionStorage.setItem('virtual_click_infinity_scroll', 'true');
      loadMoreBtn.click();

      clicksInfinityScrollVariable = parseInt(sessionStorage.getItem('clicks_infinity_scroll_variable')) - 1;
      clicksInfinityScrollVariable += '';
      sessionStorage.setItem('clicks_infinity_scroll_variable', clicksInfinityScrollVariable);
    }
  }
  
  loadPriceRangeSidebar() {
    const inputValueMin = document.querySelector(".sidebar-filter .input__price-min");
    const inputValueMax = document.querySelector(".sidebar-filter .input__price-max");
    const slideValueMin = document.querySelector(".sidebar-filter .range__price-min");
    const slideValueMax = document.querySelector(".sidebar-filter .range__price-max");
    const thumbLeft = document.querySelector(".sidebar-filter .slider > .thumb.left");
    const thumbRight = document.querySelector(".sidebar-filter .slider > .thumb.right");
    const range = document.querySelector(".sidebar-filter .slider > .range");

    this.updatePriceRangeFilter(inputValueMin, inputValueMax, slideValueMin, slideValueMax, thumbLeft, thumbRight, range);
  }

  loadPriceRangeMobile() {
    const inputValueMin = document.querySelector("#FacetFiltersFormMobile .input__price-min");
    const inputValueMax = document.querySelector("#FacetFiltersFormMobile .input__price-max");
    const slideValueMin = document.querySelector("#FacetFiltersFormMobile .range__price-min");
    const slideValueMax = document.querySelector("#FacetFiltersFormMobile .range__price-max");
    const thumbLeft = document.querySelector("#FacetFiltersFormMobile .slider > .thumb.left");
    const thumbRight = document.querySelector("#FacetFiltersFormMobile .slider > .thumb.right");
    const range = document.querySelector("#FacetFiltersFormMobile .slider > .range");

    this.updatePriceRangeFilter(inputValueMin, inputValueMax, slideValueMin, slideValueMax, thumbLeft, thumbRight, range);
  }

  updatePriceRangeFilter(inputValueMin, inputValueMax, slideValueMin, slideValueMax, thumbLeft, thumbRight, range) {
    this.setLeftValuePriceRange(slideValueMin, slideValueMax, inputValueMin, thumbLeft, range, false);
    this.setRightValuePriceRange(slideValueMax, slideValueMin, inputValueMax, thumbRight, range, false);

    const context = this;
    
    if (!slideValueMin) return;

    slideValueMin.addEventListener("input", (e) => {
      e.preventDefault();
      context.setLeftValuePriceRange(slideValueMin, slideValueMax, inputValueMin, thumbLeft, range, true);
    });
    slideValueMax.addEventListener("input", (e) => {
      e.preventDefault();
      context.setRightValuePriceRange(slideValueMax, slideValueMin, inputValueMax, thumbRight, range, true);
    });

    inputValueMin.addEventListener("focusout", function (e) {
      slideValueMin.value = e.target.value || 0;
      context.setLeftValuePriceRange(slideValueMin, slideValueMax, inputValueMin, thumbLeft, range, true);
    });

    inputValueMax.addEventListener("focusout", function (e) {
      slideValueMax.value = e.target.value || 0;
      context.setRightValuePriceRange(slideValueMax, slideValueMin, inputValueMax, thumbRight, range, true);
    });

    slideValueMin.addEventListener("mouseover", function() {
      thumbLeft.classList.add("hover");
    });
    slideValueMin.addEventListener("mouseout", function() {
      thumbLeft.classList.remove("hover");
    });
    slideValueMin.addEventListener("mousedown", function() {
      thumbLeft.classList.add("active");
    });
    slideValueMin.addEventListener("mouseup", function() {
      thumbLeft.classList.remove("active");
    });

    slideValueMax.addEventListener("mouseover", function() {
      thumbRight.classList.add("hover");
    });
    slideValueMax.addEventListener("mouseout", function() {
      thumbRight.classList.remove("hover");
    });
    slideValueMax.addEventListener("mousedown", function() {
      thumbRight.classList.add("active");
    });
    slideValueMax.addEventListener("mouseup", function() {
      thumbRight.classList.remove("active");
    });
  }

  setLeftValuePriceRange(slideValueMin, slideValueMax, inputValueMin, thumbLeft, range, inputChanged) {
    if (!slideValueMin) return;
    const _this = slideValueMin;
    const min = parseInt(_this.min);
    const max = parseInt(_this.max);
    const value = Math.min(parseInt(_this.value || 0), parseInt(slideValueMax.value) - 1);

    _this.value = value;
    if (inputChanged) {
      inputValueMin.value = value;
    }

    const percent = ((_this.value - min) / (max - min)) * 100;

    thumbLeft.style.left = percent + "%";
    range.style.left = percent + "%";
  }

  setRightValuePriceRange(slideValueMax, slideValueMin, inputValueMax, thumbRight, range, inputChanged) {
    if (!slideValueMin) return;
    const _this = slideValueMax;
    const min = parseInt(_this.min);
    const max = parseInt(_this.max);

    _this.value = Math.max(parseInt(_this.value), parseInt(slideValueMin.value || 0) + 1);
    if (inputChanged) {
      inputValueMax.value = Math.max(parseInt(_this.value), parseInt(slideValueMin.value || 0) + 1);
    }

    const percent = ((_this.value - min) / (max - min)) * 100;

    thumbRight.style.right = (100 - percent) + "%";
    range.style.right = (100 - percent) + "%";
  }

  reloadKiboScripts() {
    const elementsProducts = Array.from(document.querySelectorAll('.product-information-collection'));
    var productIds = [];
    var products = [];

    elementsProducts.forEach(function(productHtml) {
      const product = JSON.parse(productHtml.innerHTML);
      var productId = product.id;
      productIds.push(productId);

      var productPrice = product.price + '';
      var productCompareAtPrice = product.compare_at_price_max + '';
      products.push({
        'id'              : product.id,
        'sku'             : product.variants[0].sku,
        'variantId'       : product.variants[0].id,
        'productType'     : product.type,
        'name'            : product.title,
        'price'           : productPrice.replace(/^(\d{1,})(\d{2})$/, '$1.$2'),
        'imageURL'        : product.featured_image, 
        'productURL'      : window.location.origin + '/products/' + product.handle,
        'brand'           : "Alexandre Birman",
        'comparePrice'    : productCompareAtPrice.replace(/^(\d{1,})(\d{2})$/, '$1.$2'),
        'productOptions'  : product.options
      });
    })

    // Datalayer
    const dataProducts = dataLayer.find(function (data) {
      return !!data.ecommerce?.impressions;
    })

    if (dataProducts) {
      dataProducts.ecommerce.impressions = products;
    }

    // Monetate
    window.monetateQ = window.monetateQ || [];
    window.monetateQ.push([
      "setPageType",
      "index"
    ]);
    window.monetateQ.push([
      "addProducts", productIds
    ]);
    window.monetateQ.push([
      "trackData"
    ]);
  }
}

FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);

class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('input')
      .forEach(element => element.addEventListener('change', this.onRangeChange.bind(this)));

    this.setMinAndMaxValues();
  }

  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }

  setMinAndMaxValues() {
    const inputs = this.querySelectorAll('input');
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute('max', maxInput.value);
    if (minInput.value) maxInput.setAttribute('min', minInput.value);
    if (minInput.value === '') maxInput.setAttribute('min', 0);
    if (maxInput.value === '') minInput.setAttribute('max', maxInput.getAttribute('max'));
  }

  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute('min'));
    const max = Number(input.getAttribute('max'));

    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}

customElements.define('price-range', PriceRange);

class FacetRemove extends HTMLElement {
  constructor() {
    super();
    this.querySelector('a').addEventListener('click', (event) => {
      event.preventDefault();
      const form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');
      form.onActiveFilterClick(event);
    });
  }
}

customElements.define('facet-remove', FacetRemove);
