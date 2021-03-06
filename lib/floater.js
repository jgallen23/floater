(function($) {
  $.declare('floater', {
    defaults: {
      topPadding: 0,
      stopPoint: -1,
      stopElement: null,
      startPoint: -1,
      relative: false,
      offsetX: 0,
      offsetY: 0,
      stopOffset: 0,
      debug: false,
      autoRecalc: false,
      floatClass: 'floating'
    },

    init: function() {
      this.enabled = true;
      this.floating = false;
      this.recalcTimeout = null;

      this.recalc();

      $(window).on('scroll', this.proxy(this.onScroll));
      this.onScroll();
    },

    recalc: function() {
      if (this.floating) {
        return;
      }
      this.resetStyles = {
        position: this.el.css('position'),
        top: this.el.css('top'),
        left: this.el.css('left'),
        width: this.el.css('width')
      };

      var offset = this.el.offset();
      this.topPadding = parseInt(this.topPadding, 10);
      this.startPoint = offset.top - this.topPadding;
      this.height = this.el.outerHeight(true);

      if (this.stopElement) {
        this.stopPoint = this.stopElement.offset().top;
      }
      if (this.debug) {
        this.showDebug();
      }
    },

    setStartPoint: function(point) {
      this.startPoint = point;
      if (this.debug) {
        this.showDebug();
      }
    },

    setStopPoint: function(point) {
      this.stopPoint = point;
      if (this.debug) {
        this.showDebug();
      }
    },

    showDebug: function() {
      $('.floater-debug').remove();
      var showLine = function(top) {
        $('<div/>').css({
          position: 'absolute',
          height: '1px',
          width: '100%',
          background: 'red',
          top: top
        })
        .addClass('floater-debug')
        .appendTo('body');
      };
      showLine(this.startPoint);
      showLine(this.stopPoint);
    },

    createPlaceholder: function() {
      var classes = this.el[0].className || '';
      return $('<div/>')
        .addClass('floater-placeholder ' + classes)
        .css({ 
          width: this.el.css('width'),
          height: this.el.css('height'),
          visibility: 'hidden'
        });
    },

    startFloat: function() {
      if (this.floating) {
        return;
      }
      this.floating = true;
      var offset = this.el.offset();
      if (!this.el.prev().hasClass('floater-placeholder')) {
        this.el.before(this.createPlaceholder());
      }
      this.el.css({
        position: 'fixed',
        top: this.topPadding + 'px',
        left: offset.left + this.offsetX,
        width: this.el.css('width')
      });
      if (this.floatClass) {
        this.el.addClass(this.floatClass);
      }
      this.emit('floatStart');
    },

    stopFloat: function(y) {
      if (!this.floating) {
        return;
      }
      this.floating = false;
      this.el.prev().remove();
      this.el.css({
        position: '',
        top: '',
        left: '',
        width: '' 
      });
      if (this.floatClass) {
        this.el.removeClass(this.floatClass);
      }
      this.emit('floatStop');
    },

    freezeFloat: function(y) {
      if (!this.floating) {
        return;
      }
      this.floating = false;
      this.el.css({
        position: 'absolute',
        top: y,
        left: '',
        width: this.el.css('width')
      });
      this.emit('floatStop');

    },

    onScroll: function(e) {
      if (!this.enabled) {
        return;
      }
      if (this.autoRecalc) {
        clearTimeout(this.recalcTimeout);
        this.recalcTimeout = setTimeout(this.proxy(this.recalc), 500);
      }
      var scrollY = $(window).scrollTop();
      if (scrollY > this.startPoint) {
        if (this.stopPoint != -1 && (scrollY + this.height + this.topPadding) > this.stopPoint) {
          if (this.floating) {
            this.freezeFloat(this.stopPoint - this.height - this.stopOffset);
          }
        } else if (!this.floating) {
          this.startFloat();
        }
      } else if (this.floating && scrollY < this.startPoint) { //top of screen
        this.stopFloat();
      }
    },

    on: function() {
      this.enabled = true;
      this.onScroll();
    },

    off: function() {
      this.stopFloat();
      this.enabled = false;
    }
  });

})(window.jQuery || window.Zepto);
