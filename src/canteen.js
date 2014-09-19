(function() {
  // ================================ Constants ================================
  var CONTEXT_2D_PROPERTIES = [
    'fillStyle'
  ];

  // ================================ Utils ================================
  /**
   * each iterator
   * @function
   */ 
  function each(arr, func) {
    var len = arr.length,
        n;

    for (n=0; n<len; n++) {
      func(n, arr[n]);
    }
  }

  function isFunction(functionToCheck) {
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
  }

  // ================================ Canteen Class ================================

  /**
   * Canteen Constructor
   * @constructor
   */
  Canteen = function(obj) {
    this.stack = [];
    this.obj = obj;
    this._observeProperties();
  };

  // Canteen methods 
  Canteen.prototype = { 
    /**
     * push instruction onto the stack
     * @method _pushMethod
     * @param {String} method
     * @param {arguments} arguments
     * @private
     */
    _pushMethod: function(method, arguments) {
      this.stack.push({
        method: method,
        arguments: Array.prototype.slice.call(arguments, 0)
      }); 

      this._validate();
    },
    /**
     * validate the stack.  For now, this means making sure that it doesn't exceed
     *  the STACK_SIZE.  if it does, then shorten the stack starting from the beginning
     * @method _validate
     * @private
     */
    _validate: function() {
      var stack = this.stack,
          len = stack.length,
          exceded = len - Canteen.globals.STACK_SIZE;
      if (exceded > 0) {
        this.stack = stack.slice(exceded);
      }
    },
    /**
     * get a stack of operations
     * @method getStack
     * @param {String} [type='strict'] - "strict" or "loose"
     */  
    getStack: function(type) {
      var ret = [];

      if (!type || type === 'strict') {
        ret = this.stack;
      }
      else {
        each(this.stack, function(n, el) {
          ret.push(el.method);
        });
      } 

      return ret;
    },
    /**
     * serialize a stack into a string
     * @method serialize
     * @param {String} [type='strict'] - "strict" or "loose"
     */  
    serialize: function(type) {
      return JSON.stringify(this.getStack(type));
    },
    /**
     * convert a stack into a small hash string for easy comparisons
     * @method hash
     * @param {String} [type='strict'] - "strict" or "loose"
     */  
    hash: function(type) {
      return Canteen.md5(this.serialize(type));
    },
    _observeProperties: function() {
      // var obj = this.obj;

      // this.obj.fillStyle = 'blue';
      // var origSetter = obj.__lookupSetter__('fillStyle');

      // console.log(origSetter)

      // this.obj.__defineSetter__('fillStyle', function(val) {
   
      //   console.log('fillStyle')

  
      // });
    }
  }; 

  // ================================ Global Config ================================
  /**
   * global config
   * these globals can be changed at anytime - they are not cached
   * @method hash
   * @static
   * @example 
   *  // change stack size to 3000
   *  Canteen.globals.STACK_SIZE = 3000;
   */ 
  Canteen.globals = {
    STACK_SIZE: 100
  };

  // ================================ Initialization Scripts ================================

  function observeCanvasMethods() {
    var origCanvasMethods = {
      getContext: HTMLCanvasElement.prototype.getContext
    };

    HTMLCanvasElement.prototype.getContext = function() {
      var context = origCanvasMethods.getContext.apply(this, arguments);
      // attach Canteen observer to canvas element
      this.canteen = new Canteen(this);
      // attach Conteen observer to context object
      context.canteen = new Canteen(context);

      return context;
    }
  }

  function observeMethod(key, method) {
    CanvasRenderingContext2D.prototype[key] = function() {
      var ret = method.apply(this, arguments);
      this.canteen._pushMethod(key, arguments);
      return ret;
    }
  }

  function observe2dContextMethods() {
    var proto = CanvasRenderingContext2D.prototype,
        orig2dContextMethods = {}, 
        key, method;
   
    // observe method changes
    for (key in proto) {
      // NOTE: Firefox fails when then key is "canvas" and we try accessing
      // proto[key].  Adding a try catch here for now until we can find a more elegant way around this.
      // not sure why Firefox adds a canvas key to the proto anyways.
      try {
        method = proto[key];
        if (proto.hasOwnProperty(key) && isFunction(method)) {
          orig2dContextMethods[key] = method;
        }
      }
      catch (e) {}
    }
    // override methods
    for (key in orig2dContextMethods) {
      observeMethod(key, orig2dContextMethods[key]);
    }
  }

  observeCanvasMethods();
  observe2dContextMethods();
})();