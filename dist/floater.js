/*!
 * floater - a plugin to make element float on the screen
 * v0.4.0
 * https://github.com/firstandthird/floater
 * copyright First+Third 2014
 * MIT License
*/
/*!
 * fidel - a ui view controller
 * v2.2.5
 * https://github.com/jgallen23/fidel
 * copyright Greg Allen 2014
 * MIT License
*/
(function(w, $) {
  var _id = 0;
  var Fidel = function(obj) {
    this.obj = obj;
  };

  Fidel.prototype.__init = function(options) {
    $.extend(this, this.obj);
    this.id = _id++;
    this.namespace = '.fidel' + this.id;
    this.obj.defaults = this.obj.defaults || {};
    $.extend(this, this.obj.defaults, options);
    $('body').trigger('FidelPreInit', this);
    this.setElement(this.el || $('<div/>'));
    if (this.init) {
      this.init();
    }
    $('body').trigger('FidelPostInit', this);
  };
  Fidel.prototype.eventSplitter = /^(\w+)\s*(.*)$/;

  Fidel.prototype.setElement = function(el) {
    this.el = el;
    this.getElements();
    this.dataElements();
    this.delegateEvents();
    this.delegateActions();
  };

  Fidel.prototype.find = function(selector) {
    return this.el.find(selector);
  };

  Fidel.prototype.proxy = function(func) {
    return $.proxy(func, this);
  };

  Fidel.prototype.getElements = function() {
    if (!this.elements)
      return;

    for (var selector in this.elements) {
      var elemName = this.elements[selector];
      this[elemName] = this.find(selector);
    }
  };

  Fidel.prototype.dataElements = function() {
    var self = this;
    this.find('[data-element]').each(function(index, item) {
      var el = $(item);
      var name = el.data('element');
      self[name] = el;
    });
  };

  Fidel.prototype.delegateEvents = function() {
    if (!this.events)
      return;
    for (var key in this.events) {
      var methodName = this.events[key];
      var match = key.match(this.eventSplitter);
      var eventName = match[1], selector = match[2];

      var method = this.proxy(this[methodName]);

      if (selector === '') {
        this.el.on(eventName + this.namespace, method);
      } else {
        if (this[selector] && typeof this[selector] != 'function') {
          this[selector].on(eventName + this.namespace, method);
        } else {
          this.el.on(eventName + this.namespace, selector, method);
        }
      }
    }
  };

  Fidel.prototype.delegateActions = function() {
    var self = this;
    self.el.on('click'+this.namespace, '[data-action]', function(e) {
      var el = $(this);
      var action = el.attr('data-action');
      if (self[action]) {
        self[action](e, el);
      }
    });
  };

  Fidel.prototype.on = function(eventName, cb) {
    this.el.on(eventName+this.namespace, cb);
  };

  Fidel.prototype.one = function(eventName, cb) {
    this.el.one(eventName+this.namespace, cb);
  };

  Fidel.prototype.emit = function(eventName, data, namespaced) {
    var ns = (namespaced) ? this.namespace : '';
    this.el.trigger(eventName+ns, data);
  };

  Fidel.prototype.hide = function() {
    if (this.views) {
      for (var key in this.views) {
        this.views[key].hide();
      }
    }
    this.el.hide();
  };
  Fidel.prototype.show = function() {
    if (this.views) {
      for (var key in this.views) {
        this.views[key].show();
      }
    }
    this.el.show();
  };

  Fidel.prototype.destroy = function() {
    this.el.empty();
    this.emit('destroy');
    this.el.unbind(this.namespace);
  };

  Fidel.declare = function(obj) {
    var FidelModule = function(el, options) {
      this.__init(el, options);
    };
    FidelModule.prototype = new Fidel(obj);
    return FidelModule;
  };

  //for plugins
  Fidel.onPreInit = function(fn) {
    $('body').on('FidelPreInit', function(e, obj) {
      fn.call(obj);
    });
  };
  Fidel.onPostInit = function(fn) {
    $('body').on('FidelPostInit', function(e, obj) {
      fn.call(obj);
    });
  };
  w.Fidel = Fidel;
})(window, window.jQuery || window.Zepto);

(function($) {
  $.declare = function(name, obj) {

    $.fn[name] = function() {
      var args = Array.prototype.slice.call(arguments);
      var options = args.shift();
      var methodValue;
      var els;

      els = this.each(function() {
        var $this = $(this);

        var data = $this.data(name);

        if (!data) {
          var View = Fidel.declare(obj);
          var opts = $.extend({}, options, { el: $this });
          data = new View(opts);
          $this.data(name, data); 
        }
        if (typeof options === 'string') {
          methodValue = data[options].apply(data, args);
        }
      });

      return (typeof methodValue !== 'undefined') ? methodValue : els;
    };

    $.fn[name].defaults = obj.defaults || {};

  };

  $.Fidel = window.Fidel;

})(jQuery);

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
